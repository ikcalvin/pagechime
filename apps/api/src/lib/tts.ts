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
// ---------------------------------------------------------------------------
async function ttsChunk(text: string): Promise<Buffer> {
  const apiKey = getDeepgramApiKey();

  const url = `${DEEPGRAM_API_URL}?model=${DEEPGRAM_MODEL}&encoding=mp3`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "text/plain",
    },
    body: text,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errBody = await response.json();
      errorDetail = JSON.stringify(errBody);
    } catch {
      // body wasn't JSON — use statusText
    }
    throw new Error(`Deepgram TTS failed (${response.status}): ${errorDetail}`);
  }

  return Buffer.from(await response.arrayBuffer());
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
