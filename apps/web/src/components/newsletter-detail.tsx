"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Play,
  Pause,
  Share2,
  Trash2,
  Clock,
  Headphones,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/utils/api";
import { useAudio, type PlayableItem } from "@/contexts/audio-context";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NewsletterIssueDetail = {
  id: string;
  subject: string;
  summary_text: string | null;
  summary_html: string | null;
  original_html: string | null;
  audio_url: string | null;
  status: string;
  received_at: string;
  summary_word_count: number | null;
  source: {
    id: string;
    sender_name: string;
    sender_email: string;
    logo_url?: string;
  } | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function issueToPlayable(issue: NewsletterIssueDetail): PlayableItem | null {
  if (!issue.audio_url) return null;
  return {
    id: issue.id,
    title: issue.subject,
    source: issue.source?.sender_name ?? "Newsletter",
    audioUrl: issue.audio_url,
    imageUrl: issue.source?.logo_url,
    type: "newsletter",
  };
}

function estimateListenTime(wordCount: number | null): string {
  if (!wordCount) return "—";
  const mins = Math.max(1, Math.round(wordCount / 150));
  return `${mins} min`;
}

function estimateReadTime(text: string | null): string {
  if (!text) return "< 1 min read";
  const wordCount = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(wordCount / 200));
  return `${mins} min read`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

const avatarColors = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-teal-500",
];

function colorForSource(sourceId: string): string {
  let hash = 0;
  for (let i = 0; i < sourceId.length; i++) {
    hash = sourceId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[#FF6B4A]"
        role="status"
        aria-label="Loading newsletter"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not found state
// ---------------------------------------------------------------------------

function NewsletterNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xl font-semibold text-foreground">
        Newsletter not found
      </p>
      <p className="text-sm text-muted-foreground">
        This newsletter may have been deleted or does not exist.
      </p>
      <Button onClick={onBack} variant="outline" className="mt-2">
        Go Back
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface NewsletterDetailProps {
  id: string;
}

export function NewsletterDetail({ id }: NewsletterDetailProps) {
  const router = useRouter();
  const { play, pause, isPlaying, currentItem } = useAudio();
  const isThisPlaying = isPlaying && currentItem?.id === id;

  // State
  const [issue, setIssue] = useState<NewsletterIssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Audio progress
  const [progress, setProgress] = useState(0);

  // -------------------------------------------------------------------------
  // Fetch newsletter issue
  // -------------------------------------------------------------------------

  const fetchIssue = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/newsletters/${id}`);
      setIssue(response.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  // -------------------------------------------------------------------------
  // Sync audio progress
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isThisPlaying) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const audioEl =
        document.querySelector<HTMLAudioElement>("audio[data-pagechime]");
      if (audioEl && audioEl.duration > 0) {
        setProgress(audioEl.currentTime / audioEl.duration);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isThisPlaying]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handlePlayPause = useCallback(() => {
    if (!issue) return;
    if (isThisPlaying) {
      pause();
    } else {
      const playable = issueToPlayable(issue);
      if (!playable) return;
      play(playable);
    }
  }, [issue, isThisPlaying, play, pause]);

  const handleDelete = useCallback(async () => {
    if (!issue) return;
    const confirmed = window.confirm(
      "Delete this newsletter? This action cannot be undone."
    );
    if (!confirmed) return;
    try {
      await api.delete(`/newsletters/${issue.id}`);
      router.push("/newsletters");
    } catch {
      // Surface error to user in production
    }
  }, [issue, router]);

  const handleShare = useCallback(async () => {
    if (!issue) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: issue.subject, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [issue]);

  // -------------------------------------------------------------------------
  // Render guards
  // -------------------------------------------------------------------------

  if (loading) return <LoadingSpinner />;
  if (notFound || !issue)
    return <NewsletterNotFound onBack={() => router.push("/newsletters")} />;

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const sourceName = issue.source?.sender_name ?? "Unknown";
  const sourceId = issue.source?.id ?? issue.id;
  const hasAudio = issue.audio_url && issue.status === "ready";
  const hasSummary = !!issue.summary_text || !!issue.summary_html;
  const hasOriginal = !!issue.original_html;
  const readTime = estimateReadTime(issue.summary_text);
  const listenTime = estimateListenTime(issue.summary_word_count);
  const dateReceived = formatDistanceToNow(new Date(issue.received_at), {
    addSuffix: true,
  });

  const displayContent = showOriginal
    ? issue.original_html
    : issue.summary_html ?? issue.summary_text;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky toolbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          {/* Left: Back */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/newsletters")}
            aria-label="Back to newsletters"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Center: Source name */}
          <div className="flex flex-1 items-center justify-center gap-2 min-w-0">
            <div
              className={cn(
                "h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-white text-[8px] font-bold",
                colorForSource(sourceId)
              )}
            >
              {issue.source?.logo_url ? (
                <img
                  src={issue.source.logo_url}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(sourceName)
              )}
            </div>
            <span className="text-sm font-medium truncate">{sourceName}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              aria-label="Share"
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete newsletter"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Listen pill */}
            {hasAudio && (
              <button
                onClick={handlePlayPause}
                aria-label={isThisPlaying ? "Pause audio" : "Listen"}
                className={cn(
                  "ml-2 flex items-center gap-1.5 rounded-full bg-[#FF6B4A] px-4 py-1.5 text-sm font-semibold text-white",
                  "transition-opacity hover:opacity-90 active:opacity-80",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B4A]"
                )}
              >
                {isThisPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Audio progress bar */}
        {isThisPlaying && (
          <div className="h-0.5 w-full bg-border">
            <div
              className="h-full bg-[#FF6B4A] transition-[width] duration-500 ease-linear"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Playback progress"
            />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-[720px]">
          {/* Subject */}
          <h1 className="mb-4 text-[28px] font-bold leading-tight tracking-tight text-foreground">
            {issue.subject}
          </h1>

          {/* Metadata row */}
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {sourceName}
            </span>
            {issue.source?.sender_email && (
              <>
                <span aria-hidden="true">·</span>
                <span>{issue.source.sender_email}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>Received {dateReceived}</span>
          </div>

          {/* Stats badges */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {hasSummary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B4A]/10 px-2.5 py-1 text-xs font-semibold text-[#FF6B4A]">
                <Clock className="h-3 w-3" />
                {readTime}
              </span>
            )}
            {hasAudio && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B4A]/10 px-2.5 py-1 text-xs font-semibold text-[#FF6B4A]">
                <Headphones className="h-3 w-3" />
                {listenTime} listen
              </span>
            )}
            {issue.status === "processing" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Processing...
              </span>
            )}
          </div>

          {/* Content toggle (Summary vs Original) */}
          {hasSummary && hasOriginal && (
            <div className="mb-6 flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
              <button
                onClick={() => setShowOriginal(false)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  !showOriginal
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Summary
              </button>
              <button
                onClick={() => setShowOriginal(true)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  showOriginal
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Original
              </button>
            </div>
          )}

          {/* Body content */}
          {displayContent ? (
            <div
              className={cn(
                "prose max-w-none dark:prose-invert",
                "prose-p:leading-relaxed",
                "prose-headings:font-bold prose-headings:tracking-tight",
                "prose-a:text-[#FF6B4A] prose-a:no-underline hover:prose-a:underline",
                "prose-img:rounded-lg",
                "prose-blockquote:border-l-[#FF6B4A] prose-blockquote:text-muted-foreground"
              )}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground italic mb-4">
                No summary available yet.
              </p>
              {issue.status !== "failed" && issue.status !== "ready" && (
                <p className="text-sm text-muted-foreground">
                  This newsletter is still being processed. Check back soon.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
