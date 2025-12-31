import { inngest } from "./client";
import { supabase } from "../lib/supabase";
import { openai } from "../lib/openai";
import { r2, R2_BUCKET_NAME } from "../lib/r2";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const processArticle = inngest.createFunction(
    {
        id: "process-article",
        concurrency: 5,
        onFailure: async ({ event, step }) => {
            const { articleId } = event.data.event.data;
            await supabase
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
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }
            const html = await response.text();
            const dom = new JSDOM(html, { url });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();

            // Extract OG Image
            const ogImage = dom.window.document.querySelector('meta[property="og:image"]')?.getAttribute('content');
            //console.log("Extracted OG Image:", ogImage, "for URL:", url); // Debug log

            if (!article || !article.textContent) {
                throw new Error("Failed to parse article content");
            }

            const { error } = await supabase
                .from("articles")
                .update({
                    title: article.title,
                    clean_text: article.textContent,
                    image_url: ogImage, // Save image URL
                    status: "processing",
                })
                .eq("id", articleId);

            if (error) throw new Error(`Supabase update failed: ${error.message}`);

            return {
                title: article.title,
                text: article.textContent,
            };
        });

        // Step 2 & 3: TTS & Upload
        const audioUrl = await step.run("generate-and-upload-audio", async () => {
            const textToSpeak = scrapedData.text.slice(0, 4096);

            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: "alloy",
                input: textToSpeak,
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());

            const key = `${userId}/${articleId}.mp3`;

            await r2.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: "audio/mpeg",
            }));

            const publicDomain = process.env.R2_PUBLIC_DOMAIN;
            return `${publicDomain}/${key}`;
        });

        // Step 4: Finalize
        await step.run("finalize-article", async () => {
            const { error } = await supabase
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
