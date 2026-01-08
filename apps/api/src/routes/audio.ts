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

        // 4. Chunking Logic (Unreal Speech /stream limit is ~1000 chars)
        const CHUNK_SIZE = 900;
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

        res.setHeader("Content-Type", "audio/mpeg");

        for (const chunk of chunks) {
            // Check if client disconnected
            if (res.writableEnded || res.closed) break;

            const response = await fetch("https://api.v8.unrealspeech.com/stream", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${UNREAL_SPEECH_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Text: chunk,
                    VoiceId: voiceId,
                    Bitrate: "192k",
                    Speed: "0.1",
                    Pitch: "1",
                }),
            });

            console.log("Unreal Speech API Response:", voiceId);
            console.log("Unreal Speech API Chunk:", chunk);

            if (!response.ok) {
                console.error(`Unreal Speech API Error for chunk: status ${response.status}`);
                break;
            }

            if (!response.body) continue;

            // @ts-ignore - Readable.fromWeb types
            const nodeStream = Readable.fromWeb(response.body);

            // Wait for this stream to finish piping before starting the next one.
            await new Promise<void>((resolve, reject) => {
                nodeStream.on("data", (chunk) => {
                    if (!res.write(chunk)) {
                        // Handle backpressure if needed
                    }
                });
                nodeStream.on("end", () => resolve());
                nodeStream.on("error", (err) => reject(err));
            });
        }

        res.end();

    } catch (err: any) {
        console.error("Audio Stream Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

export default router;
