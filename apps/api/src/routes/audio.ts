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
        // @ts-ignore
        const userMetadata = req.user.user_metadata || {};
        const voiceId = userMetadata.voice_id || "Sierra";
        // 4. Check Cache
        const checkCache = await supabase
            .from("audio_generations")
            .select("url")
            .eq("article_id", articleId)
            .eq("voice_id", voiceId)
            .single();

        if (checkCache.data?.url) {
            console.log("Audio cache hit:", checkCache.data.url);
            return res.redirect(checkCache.data.url);
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
            } else if (sentence.length >= CHUNK_SIZE) {
                // Handle oversized sentences by splitting at word boundaries
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = "";
                let remaining = sentence;
                while (remaining.length >= CHUNK_SIZE) {
                    const splitAt = remaining.lastIndexOf(" ", CHUNK_SIZE - 1);
                    const cutPoint = splitAt > 0 ? splitAt : CHUNK_SIZE;
                    chunks.push(remaining.slice(0, cutPoint));
                    remaining = remaining.slice(cutPoint).trim();
                }
                currentChunk = remaining;
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
        const timestampChunks: any[] = [];
        let totalDuration = 0;
        let totalCharacters = 0;

        for (const chunk of chunks) {
            // Check if client disconnected
            if (res.writableEnded || res.closed) break;

            totalCharacters += chunk.length;

            let retryCount = 0;
            const MAX_RETRIES = 3;
            let response: Response | null = null;
            let lastError: any;

            while (retryCount < MAX_RETRIES) {
                try {
                    response = await fetch("https://api.v8.unrealspeech.com/speech", {
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

                    if (response.ok) break;

                    // If 4xx client error, don't retry, it's permanent
                    if (response.status >= 400 && response.status < 500) {
                        throw new Error(`Unreal Speech Client Error: ${response.status}`);
                    }

                    throw new Error(`Unreal Speech Server Error: ${response.status}`);
                } catch (err) {
                    lastError = err;
                    retryCount++;
                    if (retryCount >= MAX_RETRIES) break;
                    await new Promise(r => setTimeout(r, 500 * Math.pow(2, retryCount - 1)));
                }
            }

            console.log("Unreal Speech API Response:", voiceId);
            console.log("Unreal Speech API Chunk Length:", chunk.length);

            if (!response || !response.ok) {
                console.error(`Unreal Speech API Failed after retries`, lastError);
                throw new Error(`Failed to generate audio for chunk after ${MAX_RETRIES} retries. Aborting to prevent partial cache.`);
            }

            const data: any = await response.json();

            if (data.OutputUri) {
                retryCount = 0;
                let audioResponse: Response | null = null;

                while (retryCount < MAX_RETRIES) {
                    try {
                        audioResponse = await fetch(data.OutputUri);
                        if (audioResponse.ok && audioResponse.body) break;
                        throw new Error(`Download failed: ${audioResponse.status}`);
                    } catch (err) {
                        lastError = err;
                        retryCount++;
                        if (retryCount >= MAX_RETRIES) break;
                        await new Promise(r => setTimeout(r, 500 * Math.pow(2, retryCount - 1)));
                    }
                }

                if (!audioResponse || !audioResponse.ok || !audioResponse.body) {
                    console.error("Failed to fetch audio from OutputUri after retries");
                    throw new Error("Failed to download generated audio from OutputUri. Aborting.");
                }

                const arrayBuffer = await audioResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                audioBuffers.push(buffer);

                // Fetch Timestamps
                if (data.TimestampsUri) {
                    try {
                        const tsResponse = await fetch(data.TimestampsUri);
                        if (tsResponse.ok) {
                            const tsData = await tsResponse.json();
                            // Shift timestamps by current total duration
                            if (Array.isArray(tsData)) {
                                const shifted = tsData.map((t: any) => ({
                                    ...t,
                                    start: t.start + totalDuration,
                                    end: t.end + totalDuration
                                }));
                                timestampChunks.push(...shifted);
                            }
                        }
                    } catch (tsErr) {
                        console.error("Failed to fetch/parse timestamps:", tsErr);
                    }
                }

                // Calculate duration for this chunk: 
                // 320kbps = 320,000 bits/s = 40,000 bytes/s
                const durationSeconds = buffer.length / 40000;
                totalDuration += durationSeconds;

            } else {
                console.error("Unreal Speech Response did not contain OutputUri. Response:", data);
                throw new Error("Unreal Speech API returned response without OutputUri. Aborting to prevent incomplete audio.");
            }
        }

        if (res.writableEnded || res.closed) {
            return;
        }

        if (audioBuffers.length === 0) {
            throw new Error("No audio generated");
        }

        const finalAudioBuffer = Buffer.concat(audioBuffers);
        // Sanitize voiceId for use in file path
        const safeVoiceId = voiceId.replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = `${articleId}/${safeVoiceId}.mp3`;
        const jsonFileName = `${articleId}/${safeVoiceId}.json`;
        const { r2, R2_BUCKET_NAME } = await import("../lib/r2");
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");

        // Upload Audio
        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: finalAudioBuffer,
            ContentType: "audio/mpeg",
        }));

        // Upload Timestamps JSON if we have them
        if (timestampChunks.length > 0) {
            const jsonBuffer = Buffer.from(JSON.stringify(timestampChunks));
            await r2.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: jsonFileName,
                Body: jsonBuffer,
                ContentType: "application/json",
            }));
        }

        const publicDomain = process.env.R2_PUBLIC_DOMAIN;
        if (!publicDomain) {
            throw new Error("Missing R2_PUBLIC_DOMAIN env var");
        }

        const protocol = publicDomain.startsWith("http") ? "" : "https://";
        const publicUrl = `${protocol}${publicDomain}/${fileName}`;

        // 7. Save to Cache with Rich Metadata
        const { error: insertError } = await supabase.from("audio_generations").insert({
            article_id: articleId,
            voice_id: voiceId,
            provider: "unrealspeech",
            url: publicUrl,
            timestamps: timestampChunks.length > 0 ? timestampChunks : null,
            duration_seconds: totalDuration,
            character_count: totalCharacters,
            bitrate: "320k"
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
            res.status(500).json({ error: "Failed to generate audio" });
        }
    }
});

export default router;
