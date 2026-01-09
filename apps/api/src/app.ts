import express from "express";
import { supabase } from "./lib/supabase";
import cors from "cors";
import dotenv from "dotenv";
import collectionsRouter from "./routes/collections";
import audioRouter from "./routes/audio";
import articlesRouter from "./routes/articles";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Auth Middleware
export const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Routes

// Articles API
app.use("/api/articles", articlesRouter);

// Tags API

// Get all tags
app.get("/api/tags", requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("tags")
            .select("*")
            .eq("user_id", userId)
            .order("name", { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error("Error fetching tags:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create tag
app.post("/api/tags", requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        if (!name) return res.status(400).json({ error: "Tag name required" });

        const { data, error } = await supabase
            .from("tags")
            .insert({ name, user_id: userId })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err: any) {
        // handle duplicate key error gracefully
        if (err.code === '23505') {
            return res.status(409).json({ error: "Tag already exists" });
        }
        console.error("Error creating tag:", err);
        res.status(500).json({ error: err.message });
    }
});

// Add tag to article
app.post("/api/articles/:id/tags", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { tagId } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        // Verify article ownership first (optional but good practice)
        // For simplicity relying on RLS or Supabase Constraints, but here we do simple insert

        const { error } = await supabase
            .from("article_tags")
            .insert({ article_id: id, tag_id: tagId });

        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err: any) {
        console.error("Error adding tag to article:", err);
        res.status(500).json({ error: err.message });
    }
});

// Remove tag from article
app.delete("/api/articles/:id/tags/:tagId", requireAuth, async (req, res) => {
    try {
        const { id, tagId } = req.params;
        // @ts-ignore
        const userId = req.user.id;

        const { error } = await supabase
            .from("article_tags")
            .delete()
            .eq("article_id", id)
            .eq("tag_id", tagId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) {
        console.error("Error removing tag from article:", err);
        res.status(500).json({ error: err.message });
    }
});

// Collections API
app.use("/api/audio", audioRouter);
app.use("/api/collections", requireAuth, collectionsRouter);

app.get("/", (req, res) => {
    res.send("PageChime API is running");
});

export default app;

