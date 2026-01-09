import express from "express";
import { supabase } from "../lib/supabase";
import { scrapeAndSaveArticle } from "../services/articleService";
import { escapeSearchTerm } from "../utils/postgrest";


const router = express.Router();

// Middleware to loosely require auth (can be improved) but for now using the one from app.ts if I export it?
// Actually app.ts has 'requireAuth' locally defined. I should probably move it to a middleware file?
// Or I can copy it here. Moving to middleware is cleaner.
// But to avoid touching too many files, I'll assume 'requireAuth' is passed or I'll duplicate/export it.
// The Plan didn't mention middleware refactor.
// Let's create a simple middleware file to avoid duplication.

// Actually, I'll duplicate the middleware logic or create a shared middleware file first. 
// A shared middleware file is better.

// Wait, I can't create `middleware/auth.ts` without updating the plan? 
// No, I can do minor refactors.

// Let's define the router.

// Mock Auth Middleware or import it?
// I'll see if I can export `requireAuth` from `app.ts`? No, circular dependency risk if `app.ts` uses routes.
// Best to move `requireAuth` to `lib/auth.ts` or `middleware/auth.ts`.
// I'll check `lib` folder content again.

// For now, I'll implement the routes assuming I have access to `req.user` via a local middleware clone to be safe and fast.
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Malformed Authorization header" });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error("Auth Error:", error);
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }

        // @ts-ignore
        req.user = user;
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Create article
router.post("/", requireAuth, async (req, res) => {
    try {
        const { url } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        try {
            new URL(url);
        } catch {
            return res.status(400).json({ error: "Invalid URL format" });
        }
        // 1. Insert into DB
        const { data, error } = await supabase
            .from("articles")
            .insert({
                user_id: userId,
                original_url: url,
                status: "queued",
                collection_id: req.body.collectionId || null,
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Trigger Scrape (Fire-and-forget)
        scrapeAndSaveArticle(data.id, url, userId)
            .then(() => {
                console.log(`Scrape initiated for article ${data.id}`);
            })
            .catch((err) => {
                console.error(`Scrape initiation failed for article ${data.id}`, err);
                // Status update to failed is handled inside scrapeAndSaveArticle catch block
            });

        res.status(201).json(data);
    } catch (err: any) {
        console.error("Error creating article:", err);
        res.status(500).json({ error: err.message });
    }
});

const updateArticleHandler = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const { is_archived, is_deleted, sort_order } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        const updates: any = {};
        if (typeof is_archived === 'boolean') updates.is_archived = is_archived;
        if (typeof is_deleted === 'boolean') updates.is_deleted = is_deleted;
        if (typeof sort_order === 'number') updates.sort_order = sort_order;
        if (req.body.collection_id !== undefined) updates.collection_id = req.body.collection_id;

        const { data, error } = await supabase
            .from("articles")
            .update(updates)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Article not found" });

        res.json(data);
    } catch (err: any) {
        console.error("Error updating article:", err);
        res.status(500).json({ error: err.message });
    }
};

router.put("/:id", requireAuth, updateArticleHandler);
router.patch("/:id", requireAuth, updateArticleHandler);

router.get("/", requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        let query = supabase
            .from("articles")
            .select("*, tags(*)")
            .eq("user_id", userId)
            .eq("is_deleted", false)
            .order("sort_order", { ascending: false })
            .order("created_at", { ascending: false });

        if (req.query.collectionId) {
            // @ts-ignore
            query = query.eq("collection_id", req.query.collectionId);
        }

        if (req.query.search) {
            const searchTerm = req.query.search as string;
            const escapedSearchTerm = escapeSearchTerm(searchTerm);
            query = query.or(`title.ilike.%${escapedSearchTerm}%,original_url.ilike.%${escapedSearchTerm}%,clean_text.ilike.%${escapedSearchTerm}%`);
        }

        const { data, error } = await query;

        res.json(data);
    } catch (err: any) {
        console.error("Error fetching articles:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("articles")
            .select("*, tags(*), audio_generations(timestamps, voice_id)")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Article not found" });

        // Filter for preferred voice or default
        // @ts-ignore
        const userMetadata = req.user.user_metadata || {};
        const preferredVoiceId = userMetadata.voice_id || "Sierra";

        // Find matching generation or just return what we have (frontend can pick)
        // Let's attach the timestamps of the preferred voice directly to the article object for easier frontend consumption
        const generations = (data as any).audio_generations || [];
        const matchingGen = generations.find((g: any) => g.voice_id === preferredVoiceId) || generations[0];

        const articleWithAudio = {
            ...data,
            audio_timestamps: matchingGen?.timestamps || null
        };

        res.json(articleWithAudio);
    } catch (err: any) {
        console.error("Error fetching article:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
