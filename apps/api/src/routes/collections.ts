import express from "express";
import { validateBody } from "../middleware/validate";
import { createCollectionSchema, updateCollectionSchema } from "../schemas/collection";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await req.supabase
      .from("collections")
      .select("*, articles(count)")
      .eq("user_id", userId)
      .eq("articles.is_deleted", false)
      .order("name", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Error fetching collections:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { data, error } = await req.supabase
      .from("collections")
      .select("*, articles(count)")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("articles.is_deleted", false)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Error fetching collection:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", validateBody(createCollectionSchema), async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user!.id;
    if (!name) return res.status(400).json({ error: "Collection name required" });
    const { data, error } = await req.supabase
      .from("collections")
      .insert({ name, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    console.error("Error creating collection:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", validateBody(updateCollectionSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user!.id;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const { data, error } = await req.supabase
      .from("collections")
      .update({ name })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("Error updating collection:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { error } = await req.supabase
      .from("collections")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting collection:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
