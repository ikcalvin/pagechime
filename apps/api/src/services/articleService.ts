import { supabase } from "../lib/supabase";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as any);

const SCRAPE_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

async function fetchWithRetry(url: string, retries: number): Promise<Response> {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // If 4xx error, don't retry, it's likely a bad URL
                if (response.status >= 400 && response.status < 500) {
                    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            }
            return response;
        } catch (error) {
            lastError = error;
            if (i < retries - 1) {
                const delay = RETRY_DELAYS[i] || 4000;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

export const scrapeAndSaveArticle = async (articleId: string, url: string, userId: string) => {
    try {
        console.log(`Starting scrape for article ${articleId} from ${url}`);

        // Step 1: Scrape with Retry
        let response: Response;
        try {
            response = await fetchWithRetry(url, SCRAPE_RETRIES);
        } catch (fetchError: any) {
            console.error(`Failed to fetch article ${articleId} after retries:`, fetchError);
            throw fetchError; // Re-throw to handle in the outer catch
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        // Extract OG Image
        const ogImage = dom.window.document.querySelector('meta[property="og:image"]')?.getAttribute('content');

        if (!article || !article.textContent) {
            throw new Error("Failed to parse article content");
        }

        // Step 2: Sanitize
        const cleanHtml = DOMPurify.sanitize(article.content);

        // Step 3: Update Database
        const { error } = await supabase
            .from("articles")
            .update({
                title: article.title,
                clean_text: cleanHtml, // Save Sanitized HTML for Reader Mode
                image_url: ogImage,
                status: "completed", // Skip "processing" intermediate state for now or keep it? Plan said "processing" was old inngest flow.
                // Actually, since we fire-and-forget, the initial status might be 'queued'. 
                // Let's set it to completed here.
            })
            .eq("id", articleId);

        if (error) throw new Error(`Supabase update failed: ${error.message}`);

        console.log(`Successfully processed article ${articleId}`);

    } catch (error: any) {
        console.error(`Error processing article ${articleId}:`, error);

        // Update status to failed so UI knows
        const { error: updateError } = await supabase
            .from("articles")
            .update({ status: "failed" })
            .eq("id", articleId);

        if (updateError) {
            console.error(`Failed to update status to failed for article ${articleId}:`, updateError);
        }
    }
};
