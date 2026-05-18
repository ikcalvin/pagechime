import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { streamTtsWithUpload } from "../lib/tts-stream";

// ---------------------------------------------------------------------------
// Streaming audio endpoints
// ---------------------------------------------------------------------------
// GET /api/audio/articles/:id/stream
//   → Streams Deepgram TTS audio to the client while uploading to R2.
//   → If audio already exists, redirects to the cached R2 URL.
//
// GET /api/audio/newsletters/:id/stream
//   → Same pattern for newsletter summary audio.
// ---------------------------------------------------------------------------

const router = Router();

// ---- Articles ----

router.get("/articles/:id/stream", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Look up the article
    const { data: article, error } = await req.supabase
      .from("articles")
      .select("id, summary_text, audio_url, status")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // If audio already exists, redirect to the cached URL
    if (article.audio_url) {
      return res.redirect(article.audio_url);
    }

    // Need summary text to generate audio
    if (!article.summary_text) {
      return res.status(422).json({
        error: "Article summary not yet available",
        status: article.status,
      });
    }

    // Stream from Deepgram → client, upload to R2 in background
    const r2Key = `${userId}/${id}.mp3`;
    const { audioStream, uploadPromise } = await streamTtsWithUpload(
      article.summary_text,
      r2Key
    );

    // Set response headers for streaming MP3
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    // Pipe the audio stream to the client
    audioStream.pipe(res);

    // Handle client disconnect
    req.on("close", () => {
      audioStream.destroy();
    });

    // Update the DB with the audio URL once upload completes (fire-and-forget)
    uploadPromise
      .then(async (audioUrl) => {
        await supabaseAdmin
          .from("articles")
          .update({ audio_url: audioUrl })
          .eq("id", id);
      })
      .catch((err) => {
        console.error(`R2 upload failed for article ${id}:`, err);
      });
  } catch (err: any) {
    console.error("Streaming audio error:", err);
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---- Newsletters ----

router.get("/newsletters/:id/stream", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data: issue, error } = await req.supabase
      .from("newsletter_issues")
      .select("id, summary_text, audio_url, status")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !issue) {
      return res.status(404).json({ error: "Newsletter issue not found" });
    }

    if (issue.audio_url) {
      return res.redirect(issue.audio_url);
    }

    if (!issue.summary_text) {
      return res.status(422).json({
        error: "Newsletter summary not yet available",
        status: issue.status,
      });
    }

    const r2Key = `newsletters/${userId}/${id}.mp3`;
    const { audioStream, uploadPromise } = await streamTtsWithUpload(
      issue.summary_text,
      r2Key
    );

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    audioStream.pipe(res);

    req.on("close", () => {
      audioStream.destroy();
    });

    uploadPromise
      .then(async (audioUrl) => {
        await supabaseAdmin
          .from("newsletter_issues")
          .update({ audio_url: audioUrl })
          .eq("id", id);
      })
      .catch((err) => {
        console.error(`R2 upload failed for newsletter ${id}:`, err);
      });
  } catch (err: any) {
    console.error("Streaming audio error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
