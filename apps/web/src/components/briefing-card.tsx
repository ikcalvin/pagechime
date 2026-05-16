"use client";

import { Play, Pause, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BriefingData = {
  id: string;
  briefing_date: string;
  audio_url: string | null;
  duration_seconds: number | null;
  newsletter_count: number;
  status: "pending" | "generating" | "ready" | "failed";
  sources?: { sender_name: string; logo_url?: string }[];
};

interface BriefingCardProps {
  briefing: BriefingData | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

// Source avatar colors (cycle through these for variety)
const avatarColors = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-teal-500",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BriefingCard({
  briefing,
  isPlaying,
  onPlay,
  onPause,
}: BriefingCardProps) {
  // Empty state — no briefing for today
  if (!briefing) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted mb-3">
          <Headphones className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No briefing yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Your daily audio briefing will appear here once newsletters arrive.
        </p>
      </div>
    );
  }

  const isReady = briefing.status === "ready" && briefing.audio_url;

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#FFFBF5] to-[#FFF0EB] dark:from-[#2C2420] dark:to-[#3D2B24] border border-[#FF6B4A]/10">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-[#FF6B4A] uppercase tracking-wider mb-1">
              Daily Briefing
            </p>
            <h3 className="text-lg font-bold text-foreground">
              {formatDate(briefing.briefing_date)}
            </h3>
          </div>
          {briefing.status === "generating" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Generating...
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
          <span>
            {briefing.newsletter_count}{" "}
            {briefing.newsletter_count === 1 ? "newsletter" : "newsletters"}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(briefing.duration_seconds)}</span>
        </div>

        {/* Source avatars */}
        {briefing.sources && briefing.sources.length > 0 && (
          <div className="flex items-center gap-1 mb-5">
            {briefing.sources.slice(0, 6).map((source, i) => (
              <div
                key={i}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold -ml-1 first:ml-0 ring-2 ring-background",
                  avatarColors[i % avatarColors.length]
                )}
                title={source.sender_name}
              >
                {source.logo_url ? (
                  <img
                    src={source.logo_url}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(source.sender_name)
                )}
              </div>
            ))}
            {briefing.sources.length > 6 && (
              <span className="ml-2 text-xs text-muted-foreground">
                +{briefing.sources.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Play button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!isReady}
          className={cn(
            "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
            isReady
              ? "bg-[#FF6B4A] text-white hover:bg-[#FF6B4A]/90 active:scale-[0.98] shadow-md shadow-[#FF6B4A]/20"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              Pause Briefing
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              Play Briefing
            </>
          )}
        </button>
      </div>
    </div>
  );
}
