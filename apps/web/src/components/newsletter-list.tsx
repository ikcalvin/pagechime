"use client";

import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NewsletterIssue = {
  id: string;
  subject: string;
  summary_text: string | null;
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

interface NewsletterListProps {
  issues: NewsletterIssue[];
  currentPlayingId: string | null;
  isPlaying: boolean;
  onPlay: (issue: NewsletterIssue) => void;
  onPause: () => void;
  onSelect: (issue: NewsletterIssue) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function estimateListenTime(wordCount: number | null): string {
  if (!wordCount) return "—";
  // TTS reads at ~150 wpm
  const mins = Math.max(1, Math.round(wordCount / 150));
  return `${mins} min`;
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
  // Simple hash to pick a consistent color per source
  let hash = 0;
  for (let i = 0; i < sourceId.length; i++) {
    hash = sourceId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewsletterList({
  issues,
  currentPlayingId,
  isPlaying,
  onPlay,
  onPause,
  onSelect,
}: NewsletterListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No newsletters yet. Forward your newsletters to your PageChime address
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {issues.map((issue) => {
        const isThisPlaying = isPlaying && currentPlayingId === issue.id;
        const hasAudio = issue.audio_url && issue.status === "ready";
        const sourceName = issue.source?.sender_name ?? "Unknown";
        const sourceId = issue.source?.id ?? issue.id;

        return (
          <div
            key={issue.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(issue)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(issue);
              }
            }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
              "hover:bg-muted/50",
              isThisPlaying && "bg-[#FFF0EB] dark:bg-[#FF6B4A]/10 border-l-2 border-l-[#FF6B4A]"
            )}
          >
            {/* Source avatar */}
            <div
              className={cn(
                "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold",
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

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {sourceName}
                </span>
                {issue.summary_text && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-[#FF6B4A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#FF6B4A]">
                    Summary
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {issue.subject}
              </p>
            </div>

            {/* Duration + time */}
            <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 text-xs text-muted-foreground">
              <span>{estimateListenTime(issue.summary_word_count)}</span>
              <span>
                {formatDistanceToNow(new Date(issue.received_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Play button */}
            {hasAudio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  isThisPlaying ? onPause() : onPlay(issue);
                }}
                className={cn(
                  "h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors",
                  isThisPlaying
                    ? "bg-[#FF6B4A] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
                aria-label={isThisPlaying ? "Pause" : "Play"}
              >
                {isThisPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
              </button>
            )}

            {/* Processing indicator */}
            {!hasAudio && issue.status !== "failed" && (
              <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
