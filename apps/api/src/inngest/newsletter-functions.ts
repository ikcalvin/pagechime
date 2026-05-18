import { inngest } from "./client";
import { supabaseAdmin } from "../lib/supabase";
import { openai } from "../lib/openai";
import { parseNewsletterHtml } from "../lib/email-parser";
import { generateAndUploadTts } from "../lib/tts";

const MAX_DAILY_NEWSLETTERS = 20;

export const processNewsletter = inngest.createFunction(
  {
    id: "process-newsletter",
    concurrency: 5,
    onFailure: async ({ event, step }) => {
      const { issueId } = event.data.event.data;
      await supabaseAdmin
        .from("newsletter_issues")
        .update({ status: "failed" })
        .eq("id", issueId);
    },
  },
  { event: "app/newsletter.received" },
  async ({ event, step }) => {
    const { issueId, userId, sourceId } = event.data;

    // Step 1: Parse email HTML into clean text
    const parseResult = await step.run("parse-email", async () => {
      const { data: issue, error } = await supabaseAdmin
        .from("newsletter_issues")
        .select("*")
        .eq("id", issueId)
        .single();

      if (error) throw new Error(`Failed to fetch newsletter issue: ${error.message}`);
      if (!issue) throw new Error(`Newsletter issue not found: ${issueId}`);

      await supabaseAdmin
        .from("newsletter_issues")
        .update({ status: "parsing" })
        .eq("id", issueId);

      const { cleanText, wordCount } = parseNewsletterHtml(issue.original_html);

      const { error: updateError } = await supabaseAdmin
        .from("newsletter_issues")
        .update({ clean_text: cleanText, word_count: wordCount })
        .eq("id", issueId);

      if (updateError) throw new Error(`Failed to update issue after parsing: ${updateError.message}`);

      return { cleanText, wordCount, subject: issue.subject };
    });

    const { cleanText, wordCount, subject } = parseResult;

    // Step 2: Check daily processing limit (Issue 26 cost guardrail)
    await step.run("check-daily-limit", async () => {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      const { count, error } = await supabaseAdmin
        .from("newsletter_issues")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("status", "in", '("pending","failed")')
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString());

      if (error) throw new Error(`Failed to check daily limit: ${error.message}`);

      if ((count ?? 0) >= MAX_DAILY_NEWSLETTERS) {
        throw new Error("Daily newsletter processing limit reached");
      }
    });

    // Step 3: Summarize with GPT-4o-mini
    const summarizeResult = await step.run("summarize", async () => {
      await supabaseAdmin
        .from("newsletter_issues")
        .update({ status: "summarizing" })
        .eq("id", issueId);

      // Cap input to 8000 characters (cost guardrail)
      const cappedText = cleanText.slice(0, 8000);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a concise news summarizer. Create a 150-250 word summary preserving key facts, names, numbers, and arguments. Write in third person.",
          },
          {
            role: "user",
            content: cappedText,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const summaryText = response.choices[0].message.content ?? "";
      const summaryWordCount = summaryText.trim().split(/\s+/).filter((t) => t.length > 0).length;

      const { error: updateError } = await supabaseAdmin
        .from("newsletter_issues")
        .update({ summary_text: summaryText, summary_word_count: summaryWordCount })
        .eq("id", issueId);

      if (updateError) throw new Error(`Failed to update issue with summary: ${updateError.message}`);

      return { summaryText, summaryWordCount };
    });

    const { summaryText, summaryWordCount } = summarizeResult;

    // Step 4: Generate TTS audio for the summary
    const summaryAudioUrl = await step.run("generate-summary-audio", async () => {
      await supabaseAdmin
        .from("newsletter_issues")
        .update({ status: "generating_audio" })
        .eq("id", issueId);

      const key = `newsletters/${userId}/${issueId}.mp3`;
      const audioUrl = await generateAndUploadTts(summaryText, key);

      const { error: updateError } = await supabaseAdmin
        .from("newsletter_issues")
        .update({ audio_url: audioUrl })
        .eq("id", issueId);

      if (updateError) throw new Error(`Failed to update issue with audio URL: ${updateError.message}`);

      return audioUrl;
    });

    // Step 5: Generate TTS audio for the full clean text
    const fullAudioUrl = await step.run("generate-full-audio", async () => {
      const key = `newsletters/${userId}/${issueId}-full.mp3`;
      const fullAudioUrlValue = await generateAndUploadTts(cleanText, key);

      const { error: updateError } = await supabaseAdmin
        .from("newsletter_issues")
        .update({ full_audio_url: fullAudioUrlValue })
        .eq("id", issueId);

      if (updateError) throw new Error(`Failed to update issue with full audio URL: ${updateError.message}`);

      return fullAudioUrlValue;
    });

    // Step 6: Finalize — tark ready and update source's last_received_at
    await step.run("finalize", async () => {
      const { error: issueError } = await supabaseAdmin
        .from("newsletter_issues")
        .update({ status: "ready" })
        .eq("id", issueId);

      if (issueError) throw new Error(`Failed to finalize issue status: ${issueError.message}`);

      const { error: sourceError } = await supabaseAdmin
        .from("newsletter_sources")
        .update({ last_received_at: new Date().toISOString() })
        .eq("id", sourceId);

      if (sourceError) throw new Error(`Failed to update source last_received_at: ${sourceError.message}`);
    });

    return { success: true, issueId, summaryAudioUrl, fullAudioUrl };
  }
);
