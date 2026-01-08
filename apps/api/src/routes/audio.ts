import express from "express";
import { supabase } from "../lib/supabase";
import { JSDOM } from "jsdom";
import { Readable } from "stream";

const router = express.Router();

// Middleware to handle auth via Query Param (for <audio> tags) or Header
const requireAuthLoose = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let token = req.query.token as string;

    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }

        // @ts-ignore
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ error: "Internal Auth Error" });
    }
};

router.get("/:articleId", requireAuthLoose, async (req, res) => {
    try {
        const { articleId } = req.params;
        // @ts-ignore
        const userId = req.user.id;

        // 1. Fetch Article
        const { data: article, error } = await supabase
            .from("articles")
            .select("clean_text")
            .eq("id", articleId)
            .eq("user_id", userId)
            .single();

        if (error || !article || !article.clean_text) {
            return res.status(404).json({ error: "Article not found or no content" });
        }

        // 2. Convert HTML to Text
        const dom = new JSDOM(article.clean_text);
        let textToSpeak = dom.window.document.body.textContent || "";

        // Simple cleanup
        textToSpeak = textToSpeak.replace(/\s+/g, " ").trim();

        // Truncate to avoid limits if necessary (Unreal Speech V8 is generous but let's be safe/sane)
        // 500k chars is V8 Stream limit usually, but let's check docs or keep it raw. 
        // User requested "stream", V8 handles large text chunks.

        if (!textToSpeak) {
            return res.status(400).json({ error: "No speakable text found" });
        }

        // 3. Get User Voice Preference
        const { data: { user } } = await supabase.auth.getUser();
        // @ts-ignore
        const userMetadata = req.user.user_metadata || {};
        const voiceId = userMetadata.voice_id || "Sierra";

        // 4. Check Cache
        const checkCache = await supabase
            .from("audio_generations")
            .select("audio_url")
            .eq("article_id", articleId)
            .eq("voice_id", voiceId)
            .single();

        if (checkCache.data?.audio_url) {
            console.log("Audio cache hit:", checkCache.data.audio_url);
            return res.redirect(checkCache.data.audio_url);
        }

        console.log("Audio cache miss, generating...");

        // 5. Chunking Logic (Unreal Speech V8 handles larger chunks)
        const CHUNK_SIZE = 2900;
        const chunks: string[] = [];

        // Simple sentence-aware splitting
        const sentences = textToSpeak.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [textToSpeak];
        let currentChunk = "";

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length < CHUNK_SIZE) {
                currentChunk += sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk);

        const UNREAL_SPEECH_API_KEY = process.env.UNREAL_SPEECH_API_KEY;
        if (!UNREAL_SPEECH_API_KEY) {
            throw new Error("Missing UNREAL_SPEECH_API_KEY");
        }

        const audioBuffers: Buffer[] = [];

        for (const chunk of chunks) {
            // Check if client disconnected
            if (res.writableEnded || res.closed) break;

            const response = await fetch("https://api.v8.unrealspeech.com/speech", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${UNREAL_SPEECH_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Text: chunk,
                    VoiceId: voiceId,
                    Bitrate: "320k",
                    AudioFormat: "mp3",
                    OutputFormat: "uri",
                    TimestampType: "sentence",
                    sync: false
                }),
            });

            console.log("Unreal Speech API Response:", voiceId);
            console.log("Unreal Speech API Chunk Length:", chunk.length);

            if (!response.ok) {
                console.error(`Unreal Speech API Error for chunk: status ${response.status}`);
                break;
            }

            const data: any = await response.json();

            if (data.OutputUri) {
                const audioResponse = await fetch(data.OutputUri);

                if (!audioResponse.ok || !audioResponse.body) {
                    console.error("Failed to fetch audio from OutputUri");
                    continue;
                }

                const arrayBuffer = await audioResponse.arrayBuffer();
                audioBuffers.push(Buffer.from(arrayBuffer));
            } else {
                console.warn("Unreal Speech Response did not contain OutputUri. Response:", data);
            }
        }

        if (res.writableEnded || res.closed) {
            return;
        }

        if (audioBuffers.length === 0) {
            throw new Error("No audio generated");
        }

        const finalAudioBuffer = Buffer.concat(audioBuffers);
        const fileName = `${articleId}/${voiceId}.mp3`;

        const { r2, R2_BUCKET_NAME } = await import("../lib/r2");
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");

        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: finalAudioBuffer,
            ContentType: "audio/mpeg",
        }));

        const publicDomain = process.env.R2_PUBLIC_DOMAIN;
        if (!publicDomain) {
            throw new Error("Missing R2_PUBLIC_DOMAIN env var");
        }

        const protocol = publicDomain.startsWith("http") ? "" : "https://";
        const publicUrl = `${protocol}${publicDomain}/${fileName}`;

        // 7. Save to Cache
        const { error: insertError } = await supabase.from("audio_generations").insert({
            article_id: articleId,
            voice_id: voiceId,
            audio_url: publicUrl,
        });

        if (insertError) {
            console.error("Failed to cache audio generation:", insertError);
            // We don't block the response, but we should know about it.
        } else {
            console.log("Audio generated and cached:", publicUrl);
        }

        return res.redirect(publicUrl);

    } catch (err: any) {
        console.error("Audio Stream Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

export default router;
