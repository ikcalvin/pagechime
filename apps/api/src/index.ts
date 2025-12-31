import express from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import { processArticle } from "./inngest/functions";
import { supabase } from "./lib/supabase";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock Auth Middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Missing x-user-id header" });
    }
    // @ts-ignore
    req.user = { id: userId };
    next();
};

// Routes

app.post("/api/articles", requireAuth, async (req, res) => {
    try {
        const { url } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        // 1. Insert into DB
        const { data, error } = await supabase
            .from("articles")
            .insert({
                user_id: userId,
                original_url: url,
                status: "queued",
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Trigger Inngest
        await inngest.send({
            name: "app/article.created",
            data: {
                articleId: data.id,
                userId: userId,
                url: url,
            },
        });

        res.status(201).json(data);
    } catch (err: any) {
        console.error("Error creating article:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/articles", requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("articles")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err: any) {
        console.error("Error fetching articles:", err);
        res.status(500).json({ error: err.message });
    }
});

// Inngest Serve Handler
app.use(
    "/api/inngest",
    serve({
        client: inngest,
        functions: [processArticle],
    })
);

app.get("/", (req, res) => {
    res.send("PageChime API is running");
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
