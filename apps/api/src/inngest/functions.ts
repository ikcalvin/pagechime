import { inngest } from "./client";
import { supabaseAdmin } from "../lib/supabase";
import { openai } from "../lib/openai";
import { r2, R2_BUCKET_NAME } from "../lib/r2";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { Upload } from "@aws-sdk/lib-storage";
import { validateUrl } from "../lib/url-validator";

export const processArticle = inngest.createFunction(
  {
    id: "process-article",
    concurrency: 5,
    onFailure: async ({ event, step }) => {
      const { articleId } = event.data.event.data;
      await supabaseAdmin
        .from("articles")
        .update({ status: "failed" })
        .eq("id", articleId);
    },
  },
  { event: "app/article.created" },
  async ({ event, step }) => {
    const { articleId, url, userId } = event.data;

    // Step 1: Scrape
    const scrapedData = await step.run("scrape-content", async () => {
      // Validate the URL against SSRF before fetching
      await validateUrl(url);

      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });

      // If the server responded with a redirect, validate the target before following
      if (response.status >= 300 && response.status < 400) {
        const redirectTarget = response.headers.get("location");
        if (!redirectTarget) {
          throw new Error("Redirect response missing Location header");
        }
        // Resolve relative redirect URLs against the original URL
        const resolvedRedirect = new URL(redirectTarget, url).toString();
        await validateUrl(resolvedRedirect);

        // Follow the validated redirect manually
        const redirectResponse = await fetch(resolvedRedirect, {
          redirect: "manual",
          signal: AbortSignal.timeout(15_000),
        });
        if (!redirectResponse.ok) {
          throw new Error(`Failed to fetch redirected URL: ${redirectResponse.statusText}`);
        }

        const html = await redirectResponse.text();
        const dom = new JSDOM(html, { url: resolvedRedirect });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        const ogImage = dom.window.document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content");

        if (!article || !article.textContent) {
          throw new Error("Failed to parse article content");
        }

        // Compute word count from plain text
        const wordCount = article.textContent.trim().split(/\s+/).length;

        const { error } = await supabaseAdmin
          .from("articles")
          .update({
            title: article.title,
            clean_text: article.content,
            image_url: ogImage,
            word_count: wordCount,
            status: "processing",
          })
          .eq("id", articleId);

        if (error) throw new Error(`Supabase update failed: ${error.message}`);

        return {
          title: article.title,
          text: article.textContent,
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      // Extract OG Image
      const ogImage = dom.window.document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content");

      if (!article || !article.textContent) {
        throw new Error("Failed to parse article content");
      }

      // Compute word count from plain text
      const wordCount = article.textContent.trim().split(/\s+/).length;

      const { error } = await supabaseAdmin
        .from("articles")
        .update({
          title: article.title,
          clean_text: article.content,
          image_url: ogImage,
          word_count: wordCount,
          status: "processing",
        })
        .eq("id", articleId);

      if (error) throw new Error(`Supabase update failed: ${error.message}`);

      return {
        title: article.title,
        text: article.textContent,
      };
    });

    // Step 2: Check for existing audio (deduplication by original_url)
    const existingAudioUrl = await step.run("check-audio-dedup", async () => {
      const { data } = await supabaseAdmin
        .from("articles")
        .select("audio_url")
        .eq("original_url", url)
        .eq("status", "completed")
        .neq("id", articleId)
        .not("audio_url", "is", null)
        .limit(1)
        .maybeSingle();

      return data?.audio_url ?? null;
    });

    // Step 3: Generate TTS & upload (or reuse existing audio)
    const audioUrl = await step.run("generate-and-upload-audio", async () => {
      // Reuse existing audio if a duplicate was found
      if (existingAudioUrl) {
        return existingAudioUrl;
      }

      const textToSpeak = scrapedData.text.slice(0, 4096);

      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: textToSpeak,
      });

      const key = `${userId}/${articleId}.mp3`;

      // Stream directly to R2 using multipart upload (no full buffer in memory)
      // Convert the response body to a buffer stream for S3 compatibility
      const audioBuffer = Buffer.from(await mp3.arrayBuffer());

      const upload = new Upload({
        client: r2,
        params: {
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: audioBuffer,
          ContentType: "audio/mpeg",
        },
      });

      await upload.done();

      const publicDomain = process.env.R2_PUBLIC_DOMAIN;
      return `${publicDomain}/${key}`;
    });

    // Step 4: Finalize
    await step.run("finalize-article", async () => {
      const { error } = await supabaseAdmin
        .from("articles")
        .update({
          audio_url: audioUrl,
          status: "completed",
        })
        .eq("id", articleId);

      if (error) throw new Error(`Final database update failed: ${error.message}`);
    });

    return { success: true, articleId };
  }
);
