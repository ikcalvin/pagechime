import express, { Request, Response } from "express";
import crypto from "crypto";

const router = express.Router();

// All routes in this file are mounted under /api/newsletters and already
// protected by the requireAuth middleware applied in app.ts.

// ---------------------------------------------------------------------------
// GET /api/newsletters
// List today's newsletter issues for the authenticated user, ordered by
// received_at DESC with cursor-based pagination via `page` + `limit` params.
// ---------------------------------------------------------------------------
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20", 10)));
  const offset = (page - 1) * limit;

  // Derive today's date range in ISO format (UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  try {
    const { data: issues, error, count } = await req.supabase
      .from("newsletter_issues")
      .select(
        `id, subject, status, received_at, source_id,
         newsletter_sources ( sender_name, sender_email )`,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .gte("received_at", todayStart.toISOString())
      .lte("received_at", todayEnd.toISOString())
      .order("received_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error listing newsletter issues:", error);
      res.status(500).json({ error: "Failed to fetch issues" });
      return;
    }

    res.json({
      issues: issues ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    console.error("Unexpected error listing newsletter issues:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/newsletters/sources
// List all newsletter sources belonging to the authenticated user.
// Must be declared before /:id to avoid "sources" being captured as an id.
// ---------------------------------------------------------------------------
router.get("/sources", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const { data: sources, error } = await req.supabase
      .from("newsletter_sources")
      .select("id, sender_email, sender_name, issues_count, last_received_at, is_active, created_at")
      .eq("user_id", userId)
      .order("last_received_at", { ascending: false });

    if (error) {
      console.error("Error listing newsletter sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
      return;
    }

    res.json({ sources: sources ?? [] });
  } catch (err) {
    console.error("Unexpected error listing newsletter sources:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/newsletters/forwarding-address
// Return the user's unique forwarding email address (derived from their hash).
// ---------------------------------------------------------------------------
router.get("/forwarding-address", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const { data: prefs, error } = await req.supabase
      .from("user_preferences")
      .select("forwarding_hash")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching forwarding address:", error);
      res.status(500).json({ error: "Failed to fetch forwarding address" });
      return;
    }

    if (!prefs?.forwarding_hash) {
      res.json({ forwardingAddress: null, forwardingHash: null });
      return;
    }

    const domain = process.env.FORWARDING_EMAIL_DOMAIN ?? "mail.pagechime.app";
    res.json({
      forwardingAddress: `${prefs.forwarding_hash}@${domain}`,
      forwardingHash: prefs.forwarding_hash,
    });
  } catch (err) {
    console.error("Unexpected error fetching forwarding address:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/newsletters/forwarding-address
// Generate and persist a forwarding hash if the user doesn't already have one.
// Idempotent: returns existing hash if already set.
// ---------------------------------------------------------------------------
router.post("/forwarding-address", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const domain = process.env.FORWARDING_EMAIL_DOMAIN ?? "mail.pagechime.app";

  try {
    // Check for existing hash first
    const { data: existing, error: fetchError } = await req.supabase
      .from("user_preferences")
      .select("forwarding_hash")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing forwarding hash:", fetchError);
      res.status(500).json({ error: "Failed to check forwarding address" });
      return;
    }

    if (existing?.forwarding_hash) {
      // Already exists — return it without generating a new one
      res.status(200).json({
        forwardingAddress: `${existing.forwarding_hash}@${domain}`,
        forwardingHash: existing.forwarding_hash,
        created: false,
      });
      return;
    }

    // Generate a new 12-character hex hash (6 random bytes -> 12 hex chars)
    const forwardingHash = crypto.randomBytes(6).toString("hex");

    // Upsert into user_preferences (row may already exist without a hash)
    const { error: upsertError } = await req.supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, forwarding_hash: forwardingHash },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Error saving forwarding hash:", upsertError);
      res.status(500).json({ error: "Failed to generate forwarding address" });
      return;
    }

    res.status(201).json({
      forwardingAddress: `${forwardingHash}@${domain}`,
      forwardingHash,
      created: true,
    });
  } catch (err) {
    console.error("Unexpected error generating forwarding address:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/newsletters/sources/:id
// Toggle a newsletter source active/inactive.
// ---------------------------------------------------------------------------
router.put("/sources/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const sourceId = req.params.id;
  const { is_active } = req.body as { is_active?: boolean };

  if (typeof is_active !== "boolean") {
    res.status(400).json({ error: "is_active (boolean) is required" });
    return;
  }

  try {
    const { data: source, error } = await req.supabase
      .from("newsletter_sources")
      .update({ is_active })
      .eq("id", sourceId)
      .eq("user_id", userId) // RLS guard; belt-and-suspenders
      .select("id, sender_email, sender_name, is_active")
      .single();

    if (error) {
      // PGRST116 = row not found after RLS filter
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Source not found" });
        return;
      }
      console.error("Error updating newsletter source:", error);
      res.status(500).json({ error: "Failed to update source" });
      return;
    }

    res.json({ source });
  } catch (err) {
    console.error("Unexpected error updating newsletter source:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/newsletters/briefing/:date
// Get daily briefing for a specific date (YYYY-MM-DD) with related issues.
// ---------------------------------------------------------------------------
router.get("/briefing/:date", async (req: Request<{ date: string }>, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { date } = req.params;

  try {
    const { data: briefing, error: briefingError } = await req.supabase
      .from("daily_briefings")
      .select("id, briefing_date, audio_url, issue_ids, duration_seconds, newsletter_count, status, created_at")
      .eq("user_id", userId)
      .eq("briefing_date", date)
      .maybeSingle();

    if (briefingError) {
      console.error("Error fetching daily briefing:", briefingError);
      res.status(500).json({ error: "Failed to fetch briefing" });
      return;
    }

    if (!briefing) {
      res.json({ briefing: null, issues: [] });
      return;
    }

    // Fetch the related newsletter issues by their IDs
    const issueIds: string[] = briefing.issue_ids ?? [];
    let issues: any[] = [];

    if (issueIds.length > 0) {
      const { data: issueData, error: issuesError } = await req.supabase
        .from("newsletter_issues")
        .select(
          `id, subject, status, received_at, summary_text, audio_url, source_id,
           newsletter_sources ( sender_name, sender_email )`
        )
        .in("id", issueIds);

      if (issuesError) {
        console.error("Error fetching briefing issues:", issuesError);
        res.status(500).json({ error: "Failed to fetch briefing issues" });
        return;
      }

      issues = issueData ?? [];
    }

    res.json({ briefing, issues });
  } catch (err) {
    console.error("Unexpected error fetching daily briefing:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/newsletters/briefing/generate
// Trigger daily briefing generation for a given date (defaults to today UTC).
// ---------------------------------------------------------------------------
router.post("/briefing/generate", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const date: string = req.body?.date ?? new Date().toISOString().split("T")[0];

  try {
    const { inngest } = await import("../inngest/client");

    await inngest.send({
      name: "app/briefing.generate",
      data: { userId, date },
    });

    res.status(202).json({ message: "Briefing generation started", date });
  } catch (err) {
    console.error("Unexpected error triggering briefing generation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/newsletters/stats
// Aggregated stats: total issues, sources, ready issues, listen time.
// ---------------------------------------------------------------------------
router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const [issuesResult, sourcesResult, readyResult, listenResult] = await Promise.all([
      req.supabase
        .from("newsletter_issues")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      req.supabase
        .from("newsletter_sources")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      req.supabase
        .from("newsletter_issues")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "ready"),
      req.supabase
        .from("newsletter_issues")
        .select("summary_word_count")
        .eq("user_id", userId)
        .eq("status", "ready"),
    ]);

    if (issuesResult.error) throw issuesResult.error;
    if (sourcesResult.error) throw sourcesResult.error;
    if (readyResult.error) throw readyResult.error;
    if (listenResult.error) throw listenResult.error;

    // Estimate listen time: ~150 words per minute for TTS audio
    const totalListenMinutes = Math.round(
      (listenResult.data ?? []).reduce(
        (sum: number, row: { summary_word_count: number | null }) =>
          sum + (row.summary_word_count ?? 0),
        0
      ) / 150
    );

    res.json({
      stats: {
        totalIssues: issuesResult.count ?? 0,
        totalSources: sourcesResult.count ?? 0,
        readyIssues: readyResult.count ?? 0,
        totalListenMinutes,
      },
    });
  } catch (err) {
    console.error("Unexpected error fetching newsletter stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/newsletters/:id
// Fetch a single newsletter issue with its summary and audio URL.
// ---------------------------------------------------------------------------
router.get("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const issueId = req.params.id;

  try {
    const { data: issue, error } = await req.supabase
      .from("newsletter_issues")
      .select(
        `id, subject, status, received_at, original_html, clean_text,
         summary_text, word_count, summary_word_count, audio_url, full_audio_url,
         source_id,
         newsletter_sources ( id, sender_name, sender_email, is_active )`
      )
      .eq("id", issueId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching newsletter issue:", error);
      res.status(500).json({ error: "Failed to fetch issue" });
      return;
    }

    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    res.json({ issue });
  } catch (err) {
    console.error("Unexpected error fetching newsletter issue:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
