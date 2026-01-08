import { inngest } from "./client";
import { supabase } from "../lib/supabase";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

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
                    clean_text: article.content, // Save HTML for Reader Mode
                    image_url: ogImage, // Save image URL
                    status: "processing",
                })
                .eq("id", articleId);

            if (error) throw new Error(`Supabase update failed: ${error.message}`);

            return {
                title: article.title,
                text: article.textContent, // Return Plain text for TTS
            };
        });


        // Step 2: Finalize
        await step.run("finalize-article", async () => {
            const { error } = await supabase
                .from("articles")
                .update({
                    status: "completed",
                    // audio_url is now generated on demand via API
                })
                .eq("id", articleId);

            if (error) throw new Error(`Final database update failed: ${error.message}`);
        });

        return { success: true, articleId };
    }
);
