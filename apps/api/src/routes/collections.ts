import express from "express";
import { supabase } from "../lib/supabase";

const router = express.Router();

// Get all collections
router.get("/", async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("collections")
            .select("*")
            .eq("user_id", userId)
            .order("name", { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error("Error fetching collections:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get single collection
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("collections")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error("Error fetching collection:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create collection
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        if (!name) return res.status(400).json({ error: "Collection name required" });

        const { data, error } = await supabase
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

// Rename collection
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        if (!name) return res.status(400).json({ error: "Name is required" });

        const { data, error } = await supabase
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

// Delete collection
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user.id;

        const { error } = await supabase
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
