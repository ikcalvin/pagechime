import express from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import { processArticle } from "./inngest/functions";
import { supabaseAdmin, createUserClient } from "./lib/supabase";
import cors from "cors";
import dotenv from "dotenv";
import collectionsRouter from "./routes/collections";
import { sanitizeSearchTerm } from "./lib/sanitize";

dotenv.config();

const app = express();

// CORS origin whitelist
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Auth Middleware
const requireAuth = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Malformed Authorization header" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("Auth Error:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    req.user = user;
    req.supabase = createUserClient(token);
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Routes

app.post("/api/articles", requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.user!.id;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // 1. Insert into DB
    const { data, error } = await req.supabase
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

// Update article (Archive/Delete/Reorder)
const updateArticleHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { is_archived, is_deleted, sort_order } = req.body;
    const userId = req.user!.id;

    const updates: any = {};
    if (typeof is_archived === "boolean") updates.is_archived = is_archived;
    if (typeof is_deleted === "boolean") updates.is_deleted = is_deleted;
    if (typeof sort_order === "number") updates.sort_order = sort_order;
    if (req.body.collection_id !== undefined) updates.collection_id = req.body.collection_id;

    const { data, error } = await req.supabase
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

// Update article (Archive/Delete/Reorder)
app.put("/api/articles/:id", requireAuth, updateArticleHandler);
app.patch("/api/articles/:id", requireAuth, updateArticleHandler);

app.get("/api/articles", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    let query = req.supabase
      .from("articles")
      .select("*, tags(*)")
      .eq("user_id", userId)
      .eq("is_deleted", false) // Default to not showing deleted
      .order("sort_order", { ascending: false }) // Sort by user order (default newest/highest first)
      .order("created_at", { ascending: false }); // Fallback

    if (req.query.collectionId) {
      query = query.eq("collection_id", req.query.collectionId as string);
    }

    if (req.query.search) {
      const searchTerm = sanitizeSearchTerm(req.query.search as string);
      if (searchTerm.length > 0) {
        query = query.or(
          `title.ilike.%${searchTerm}%,original_url.ilike.%${searchTerm}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Error fetching articles:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get single article
app.get("/api/articles/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data, error } = await req.supabase
      .from("articles")
      .select("*, tags(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Article not found" });

    res.json(data);
  } catch (err: any) {
    console.error("Error fetching article:", err);
    res.status(500).json({ error: err.message });
  }
});

// Tags API

// Get all tags
app.get("/api/tags", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const { data, error } = await req.supabase
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
    const userId = req.user!.id;

    if (!name) return res.status(400).json({ error: "Tag name required" });

    const { data, error } = await req.supabase
      .from("tags")
      .insert({ name, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    // handle duplicate key error gracefully
    if (err.code === "23505") {
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
    const userId = req.user!.id;

    if (!tagId) {
      return res.status(400).json({ error: "tagId is required" });
    }

    // Verify the article belongs to the current user
    const { data: article, error: articleError } = await req.supabase
      .from("articles")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (articleError) throw articleError;
    if (!article) return res.status(404).json({ error: "Article not found" });

    // Verify the tag belongs to the current user
    const { data: tag, error: tagError } = await req.supabase
      .from("tags")
      .select("id")
      .eq("id", tagId)
      .eq("user_id", userId)
      .maybeSingle();

    if (tagError) throw tagError;
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    const { error } = await req.supabase
      .from("article_tags")
      .insert({ article_id: id, tag_id: tagId });

    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error("Error adding tag:", err);
    res.status(500).json({ error: err.message });
  }
});

// Remove tag from article
app.delete("/api/articles/:id/tags/:tagId", requireAuth, async (req, res) => {
  try {
    const { id, tagId } = req.params;
    const userId = req.user!.id;

    // Verify the article belongs to the current user
    const { data: article, error: articleError } = await req.supabase
      .from("articles")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (articleError) throw articleError;
    if (!article) return res.status(404).json({ error: "Article not found" });

    const { error } = await req.supabase
      .from("article_tags")
      .delete()
      .eq("article_id", id)
      .eq("tag_id", tagId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error removing tag:", err);
    res.status(500).json({ error: err.message });
  }
});

// Collections API
app.use("/api/collections", requireAuth, collectionsRouter);

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

export default app;
