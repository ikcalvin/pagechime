import { inngest } from "./client";
import { supabaseAdmin } from "../lib/supabase";
import { generateAndUploadTts } from "../lib/tts";

type BriefingGenerateEvent = {
  name: "app/briefing.generate";
  data: {
    userId: string;
    date: string; // ISO date string like "2026-05-15"
  };
};

export const generateDailyBriefing = inngest.createFunction(
  {
    id: "generate-daily-briefing",
    concurrency: 3,
    onFailure: async ({ event, error }) => {
      const { userId, date } = event.data.event.data as {
        userId: string;
        date: string;
      };

      await supabaseAdmin
        .from("daily_briefings")
        .update({ status: "failed" })
        .eq("user_id", userId)
        .eq("briefing_date", date);
    },
  },
  { event: "app/briefing.generate" as BriefingGenerateEvent["name"] },
  async ({ event, step }) => {
    const { userId, date } = event.data;

    // Step 1: Collect ready issues for the given date
    const { issues, count } = await step.run(
      "collect-ready-issues",
      async () => {
        const dayStart = new Date(`${date}T00:00:00.000Z`).toISOString();
        const dayEnd = new Date(`${date}T23:59:59.999Z`).toISOString();

        const { data, error } = await supabaseAdmin
          .from("newsletter_issues")
          .select("id, subject, summary_text, audio_url, source_id")
          .eq("user_id", userId)
          .eq("status", "ready")
          .not("audio_url", "is", null)
          .gte("received_at", dayStart)
          .lte("received_at", dayEnd)
          .order("received_at", { ascending: true });

        if (error) {
          throw new Error(`Failed to query newsletter_issues: ${error.message}`);
        }

        if (!data || data.length === 0) {
          return { issues: [], count: 0, earlyReturn: true };
        }

        return { issues: data, count: data.length, earlyReturn: false };
      }
    );

    if (count === 0) {
      return { message: `No ready issues found for user ${userId} on ${date}` };
    }

    // Step 2: Check if a briefing already exists
    const existingBriefing = await step.run(
      "check-existing-briefing",
      async () => {
        const { data, error } = await supabaseAdmin
          .from("daily_briefings")
          .select("id, status, audio_url")
          .eq("user_id", userId)
          .eq("briefing_date", date)
          .maybeSingle();

        if (error) {
          throw new Error(
            `Failed to query daily_briefings: ${error.message}`
          );
        }

        return data ?? null;
      }
    );

    if (existingBriefing && existingBriefing.status === "ready") {
      return {
        message: "Briefing already exists and is ready",
        briefingId: existingBriefing.id,
        audioUrl: existingBriefing.audio_url,
      };
    }

    // Step 3: Create or update the briefing row
    const briefingId = await step.run("create-briefing-row", async () => {
      const issueIds = issues.map((issue: { id: string }) => issue.id);

      const { data, error } = await supabaseAdmin
        .from("daily_briefings")
        .upsert(
          {
            user_id: userId,
            briefing_date: date,
            issue_ids: issueIds,
            newsletter_count: count,
            status: "generating",
          },
          { onConflict: "user_id,briefing_date" }
        )
        .select("id")
        .single();

      if (error) {
        throw new Error(`Failed to upsert daily_briefing: ${error.message}`);
      }

      return data.id as string;
    });

    // Step 4: Generate the briefing script
    const script = await step.run("generate-briefing-script", async () => {
      const sourceIds: string[] = [
        ...new Set(
          issues
            .map((issue: { source_id: string | null }) => issue.source_id)
            .filter((id: string | null): id is string => id !== null)
        ),
      ];

      const sourceMap: Record<string, string> = {};

      if (sourceIds.length > 0) {
        const { data: sources, error } = await supabaseAdmin
          .from("newsletter_sources")
          .select("id, sender_name, sender_email")
          .in("id", sourceIds);

        if (error) {
          throw new Error(
            `Failed to query newsletter_sources: ${error.message}`
          );
        }

        for (const source of sources ?? []) {
          sourceMap[source.id] = source.sender_name ?? source.sender_email;
        }
      }

      const formattedDate = new Date(`${date}T00:00:00.000Z`).toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        }
      );

      const parts: string[] = [];
      parts.push(`Good morning. Here are your ${count} newsletters for ${formattedDate}.`);

      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i] as {
          id: string;
          subject: string;
          summary_text: string | null;
          audio_url: string | null;
          source_id: string | null;
        };
        const sourceName =
          issue.source_id && sourceMap[issue.source_id]
            ? sourceMap[issue.source_id]
            : "an unknown source";
        const summaryText = issue.summary_text ?? "";

        const prefix = i === 0 ? "First" : "Next";
        parts.push(
          `${prefix}, from ${sourceName}: ${issue.subject}. ${summaryText}`
        );
      }

      parts.push("That's all for today's briefing. Have a great day.");

      let combined = parts.join("\n\n");

      return combined;
    });

    // Step 5: Generate audio and upload to R2
    const audioUrl = await step.run("generate-briefing-audio", async () => {
      const r2Key = `briefings/${userId}/${date}.mp3`;
      return generateAndUploadTts(script, r2Key);
    });

    // Step 6: Finalize the briefing row
    await step.run("finalize-briefing", async () => {
      const wordCount = script.split(/\s+/).filter(Boolean).length;
      const durationSeconds = Math.round((wordCount / 150) * 60);

      const { error } = await supabaseAdmin
        .from("daily_briefings")
        .update({
          audio_url: audioUrl,
          status: "ready",
          duration_seconds: durationSeconds,
        })
        .eq("id", briefingId);

      if (error) {
        throw new Error(
          `Failed to finalize daily_briefing: ${error.message}`
        );
      }

      return { durationSeconds };
    });

    return {
      briefingId,
      audioUrl,
      newsletterCount: count,
    };
  }
);
