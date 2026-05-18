import { r2, R2_BUCKET_NAME } from "./r2";
import { Upload } from "@aws-sdk/lib-storage";

// ---------------------------------------------------------------------------
// Deepgram Aura TTS — shared utility
// ---------------------------------------------------------------------------
// Replaces OpenAI TTS. Provider-agnostic interface so swapping back (or to
// Fish Audio, ElevenLabs, etc.) is a single-file change.
//
// Deepgram Aura-2 limit: 2 000 characters per request.
// For longer text we split on sentence boundaries, call the API once per
// chunk, and concatenate the MP3 buffers.
// ---------------------------------------------------------------------------

const DEEPGRAM_API_URL = "https://api.deepgram.com/v1/speak";
const DEEPGRAM_MODEL = "aura-2-asteria-en"; // warm female voice, great for narration
const MAX_CHARS_PER_REQUEST = 2000;
const TTS_TIMEOUT_MS = 60_000; // 60s — Deepgram can be slow on cold starts or long chunks
const TTS_MAX_RETRIES = 2; // retry transient failures (timeouts, 5xx) up to 2 times

function getDeepgramApiKey(): string {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("Missing DEEPGRAM_API_KEY environment variable");
  return key;
}

// ---------------------------------------------------------------------------
// Text chunking — splits on sentence boundaries, respecting the char limit.
// ---------------------------------------------------------------------------
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const matched = text.match(/[^.!?]+[.!?]+[\s]*/g) || [];
  const sentences: string[] = [...matched];

  // Capture any trailing text after the last sentence-ending punctuation.
  // Without this, "...and that's the end" (no final period) gets silently dropped.
  const matchedLength = matched.join("").length;
  if (matchedLength < text.length) {
    const remainder = text.slice(matchedLength).trim();
    if (remainder.length > 0) {
      sentences.push(remainder);
    }
  }

  // If no sentences were found at all, treat entire text as one block
  if (sentences.length === 0) {
    sentences.push(text);
  }
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    // If a single sentence exceeds the limit, hard-split it
    if (sentence.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      for (let i = 0; i < sentence.length; i += maxChars) {
        chunks.push(sentence.slice(i, i + maxChars).trim());
      }
      continue;
    }

    if ((current + sentence).length > maxChars) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

// ---------------------------------------------------------------------------
// Call Deepgram Aura for a single chunk (≤ 2 000 chars). Returns MP3 buffer.
// Retries on transient errors (timeouts, 5xx) with exponential backoff.
// ---------------------------------------------------------------------------
async function ttsChunk(text: string): Promise<Buffer> {
  const apiKey = getDeepgramApiKey();
  const url = `${DEEPGRAM_API_URL}?model=${DEEPGRAM_MODEL}&encoding=mp3`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= TTS_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errBody = await response.json();
          errorDetail = JSON.stringify(errBody);
        } catch {
          // body wasn't JSON — use statusText
        }

        // Retry on 5xx server errors, throw immediately on 4xx
        if (response.status >= 500 && attempt < TTS_MAX_RETRIES) {
          lastError = new Error(`Deepgram TTS failed (${response.status}): ${errorDetail}`);
          await sleep(1000 * 2 ** attempt); // 1s, 2s backoff
          continue;
        }

        throw new Error(`Deepgram TTS failed (${response.status}): ${errorDetail}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Retry on timeout or network errors, throw on everything else
      const isTransient =
        lastError.name === "TimeoutError" ||
        lastError.name === "AbortError" ||
        lastError.message.includes("fetch failed");

      if (isTransient && attempt < TTS_MAX_RETRIES) {
        await sleep(1000 * 2 ** attempt); // 1s, 2s backoff
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error("Deepgram TTS failed after retries");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate TTS audio from text using Deepgram Aura-2.
 * Handles chunking for text longer than 2 000 characters.
 * Returns a single MP3 buffer.
 */
export async function generateTtsAudio(text: string): Promise<Buffer> {
  const chunks = splitTextIntoChunks(text, MAX_CHARS_PER_REQUEST);

  if (chunks.length === 1) {
    return ttsChunk(chunks[0]);
  }

  // Generate audio for each chunk sequentially to preserve ordering
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const buf = await ttsChunk(chunk);
    buffers.push(buf);
  }

  return Buffer.concat(buffers);
}

/**
 * Generate TTS audio and upload to R2. Returns the public URL.
 * This is the main function used by all Inngest pipelines.
 */
export async function generateAndUploadTts(
  text: string,
  r2Key: string
): Promise<string> {
  const audioBuffer = await generateTtsAudio(text);

  const upload = new Upload({
    client: r2,
    params: {
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: audioBuffer,
      ContentType: "audio/mpeg",
    },
  });

  await upload.done();

  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) {
    throw new Error("Missing R2_PUBLIC_DOMAIN environment variable");
  }
  return `${publicDomain}/${r2Key}`;
}
