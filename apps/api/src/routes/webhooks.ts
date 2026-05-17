import express, { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { inngest } from "../inngest/client";
import { validateBody } from "../middleware/validate";
import { webhookNewsletterSchema } from "../schemas/newsletter";

const router = express.Router();

// Middleware: verify webhook shared secret
const verifyWebhookSecret = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error("WEBHOOK_SECRET not configured");
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    res.status(401).json({ error: "Invalid webhook secret" });
    return;
  }

  next();
};

interface NewsletterWebhookBody {
  forwardingHash: string;
  senderEmail: string;
  senderName?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
}

// POST /api/webhooks/newsletter-received
router.post(
  "/newsletter-received",
  verifyWebhookSecret,
  validateBody(webhookNewsletterSchema),
  async (req: Request<{}, {}, NewsletterWebhookBody>, res: Response): Promise<void> => {
    const { forwardingHash, senderEmail, senderName, subject, htmlBody } = req.body;

    // Validate required fields
    if (!forwardingHash || !senderEmail) {
      res.status(400).json({ error: "forwardingHash and senderEmail are required" });
      return;
    }

    // 1. Look up user by forwarding hash
    const { data: prefRow, error: prefError } = await supabaseAdmin
      .from("user_preferences")
      .select("user_id")
      .eq("forwarding_hash", forwardingHash)
      .maybeSingle();

    if (prefError) {
      console.error("Error looking up forwarding hash:", prefError);
      res.status(500).json({ error: "Internal error" });
      return;
    }

    if (!prefRow) {
      res.status(404).json({ error: "Unknown forwarding address" });
      return;
    }

    const userId: string = prefRow.user_id;

    // 2. Find or create newsletter source
    let sourceId: string;

    const { data: existingSource } = await supabaseAdmin
      .from("newsletter_sources")
      .select("id, issues_count, sender_name")
      .eq("user_id", userId)
      .eq("sender_email", senderEmail)
      .maybeSingle();

    if (existingSource) {
      sourceId = existingSource.id;

      // Build update payload — only backfill sender_name if it was previously unknown
      const updatePayload: Record<string, unknown> = {
        issues_count: (existingSource.issues_count ?? 0) + 1,
        last_received_at: new Date().toISOString(),
      };
      if (senderName && !existingSource.sender_name) {
        updatePayload.sender_name = senderName;
      }

      const { error: updateError } = await supabaseAdmin
        .from("newsletter_sources")
        .update(updatePayload)
        .eq("id", sourceId);

      if (updateError) {
        console.error("Error updating newsletter source:", updateError);
        res.status(500).json({ error: "Failed to update source" });
        return;
      }
    } else {
      // Create new source
      const { data: newSource, error: sourceError } = await supabaseAdmin
        .from("newsletter_sources")
        .insert({
          user_id: userId,
          sender_email: senderEmail,
          sender_name: senderName ?? null,
          issues_count: 1,
          last_received_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sourceError || !newSource) {
        console.error("Error creating newsletter source:", sourceError);
        res.status(500).json({ error: "Failed to create source" });
        return;
      }

      sourceId = newSource.id;
    }

    // 3. Create newsletter_issues row
    const { data: issue, error: issueError } = await supabaseAdmin
      .from("newsletter_issues")
      .insert({
        user_id: userId,
        source_id: sourceId,
        subject: subject ?? null,
        original_html: htmlBody ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (issueError || !issue) {
      console.error("Error creating newsletter issue:", issueError);
      res.status(500).json({ error: "Failed to create issue" });
      return;
    }

    // 4. Fire Inngest event to trigger async processing
    await inngest.send({
      name: "app/newsletter.received",
      data: {
        issueId: issue.id as string,
        userId,
        sourceId,
      },
    });

    res.status(201).json({ issueId: issue.id, sourceId });
  }
);

export default router;
