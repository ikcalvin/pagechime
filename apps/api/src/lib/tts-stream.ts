import { PassThrough, Readable } from "stream";
import { r2, R2_BUCKET_NAME } from "./r2";
import { Upload } from "@aws-sdk/lib-storage";

// ---------------------------------------------------------------------------
// Deepgram Aura TTS — streaming variant
// ---------------------------------------------------------------------------
// Streams audio directly to the caller while buffering for R2 upload.
// Used by the /api/articles/:id/audio/stream endpoint for instant playback.
//
// For text ≤ 2 000 chars: single Deepgram call, stream piped directly.
// For text > 2 000 chars: sequential Deepgram calls, chunks piped in order.
// ---------------------------------------------------------------------------

const DEEPGRAM_API_URL = "https://api.deepgram.com/v1/speak";
const DEEPGRAM_MODEL = "aura-2-asteria-en";
const MAX_CHARS_PER_REQUEST = 2000;
const TTS_TIMEOUT_MS = 60_000;

function getDeepgramApiKey(): string {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("Missing DEEPGRAM_API_KEY environment variable");
  return key;
}

// ---------------------------------------------------------------------------
// Sentence-boundary chunking (same logic as tts.ts)
// ---------------------------------------------------------------------------
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const matched = text.match(/[^.!?]+[.!?]+[\s]*/g) || [];
  const sentences: string[] = [...matched];

  const matchedLength = matched.join("").length;
  if (matchedLength < text.length) {
    const remainder = text.slice(matchedLength).trim();
    if (remainder.length > 0) sentences.push(remainder);
  }

  if (sentences.length === 0) sentences.push(text);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
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

  if (current.trim()) chunks.push(current.trim());

  return chunks.filter((c) => c.length > 0);
}

// ---------------------------------------------------------------------------
// Call Deepgram and return the raw Response (for streaming the body).
// ---------------------------------------------------------------------------
async function fetchDeepgramStream(text: string): Promise<Response> {
  const apiKey = getDeepgramApiKey();
  const url = `${DEEPGRAM_API_URL}?model=${DEEPGRAM_MODEL}&encoding=mp3`;

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
      // body wasn't JSON
    }
    throw new Error(`Deepgram TTS failed (${response.status}): ${errorDetail}`);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface StreamTtsResult {
  /** Node readable stream of MP3 data — pipe this to the HTTP response. */
  audioStream: Readable;
  /**
   * Promise that resolves with the R2 URL once the background upload completes.
   * The caller should NOT await this before sending the response — it runs
   * concurrently with the client stream.
   */
  uploadPromise: Promise<string>;
}

/**
 * Stream TTS audio from Deepgram while uploading to R2 in the background.
 *
 * Returns a Node Readable stream for immediate piping to the HTTP response,
 * and a Promise that resolves with the R2 URL once upload completes.
 *
 * @param text - Text to convert to speech
 * @param r2Key - R2 object key for the upload (e.g. "userId/articleId.mp3")
 */
export async function streamTtsWithUpload(
  text: string,
  r2Key: string
): Promise<StreamTtsResult> {
  const chunks = splitTextIntoChunks(text, MAX_CHARS_PER_REQUEST);

  // PassThrough streams: one for the client, one collects for R2
  const clientStream = new PassThrough();
  const r2Buffers: Buffer[] = [];

  // Process chunks sequentially, piping each to the client stream
  const processChunks = async () => {
    try {
      for (const chunk of chunks) {
        const response = await fetchDeepgramStream(chunk);

        if (!response.body) {
          throw new Error("Deepgram returned no response body");
        }

        // Convert web ReadableStream to Node Readable
        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const buffer = Buffer.from(value);
          clientStream.write(buffer);
          r2Buffers.push(buffer);
        }
      }

      clientStream.end();
    } catch (err) {
      clientStream.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Start processing (don't await — it runs while we return the stream)
  const processingDone = processChunks();

  // Upload to R2 after all chunks are processed
  const uploadPromise = processingDone.then(async () => {
    const fullBuffer = Buffer.concat(r2Buffers);

    const upload = new Upload({
      client: r2,
      params: {
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: fullBuffer,
        ContentType: "audio/mpeg",
      },
    });

    await upload.done();

    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    if (!publicDomain) {
      throw new Error("Missing R2_PUBLIC_DOMAIN environment variable");
    }

    return `${publicDomain}/${r2Key}`;
  });

  return { audioStream: clientStream, uploadPromise };
}
