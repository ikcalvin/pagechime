"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BriefingCard, type BriefingData } from "@/components/briefing-card";
import {
  NewsletterList,
  type NewsletterIssue,
} from "@/components/newsletter-list";
import { useAudio, type PlayableItem } from "@/contexts/audio-context";
import api from "@/utils/api";

// -------------------------------------------------------------------------
// Newsletter → PlayableItem adapter
// -------------------------------------------------------------------------

function issueToPlayable(issue: NewsletterIssue): PlayableItem | null {
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

function briefingToPlayable(briefing: BriefingData): PlayableItem | null {
  if (!briefing.audio_url) return null;
  return {
    id: briefing.id,
    title: `Daily Briefing — ${briefing.briefing_date}`,
    source: `${briefing.newsletter_count} newsletters`,
    audioUrl: briefing.audio_url,
    type: "briefing",
  };
}

// -------------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------------

export function NewsletterDashboard() {
  const router = useRouter();
  const { play, pause, isPlaying, currentItem } = useAudio();

  // Data
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------------------
  // Fetch data
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [briefingRes, issuesRes] = await Promise.allSettled([
        api.get("/newsletters/briefing/today"),
        api.get("/newsletters"),
      ]);

      if (briefingRes.status === "fulfilled") {
        setBriefing(briefingRes.value.data);
      }

      if (issuesRes.status === "fulfilled") {
        const data = issuesRes.value.data;
        // Handle { issues: [...] }, { data: [...] }, and plain array responses
        setIssues(
          Array.isArray(data)
            ? data
            : data.issues ?? data.data ?? []
        );
      }
    } catch {
      // Endpoints may not exist yet — gracefully show empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------------------
  // Playback handlers
  // -----------------------------------------------------------------------

  const isBriefingPlaying =
    isPlaying && briefing !== null && currentItem?.id === briefing.id;

  const handlePlayBriefing = useCallback(() => {
    if (!briefing) return;
    const playable = briefingToPlayable(briefing);
    if (playable) play(playable);
  }, [briefing, play]);

  const handlePlayIssue = useCallback(
    (issue: NewsletterIssue) => {
      const playable = issueToPlayable(issue);
      if (playable) play(playable);
    },
    [play]
  );

  const handleSelectIssue = useCallback(
    (issue: NewsletterIssue) => {
      router.push(`/newsletters/${issue.id}`);
    },
    [router]
  );

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[#FF6B4A]" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => router.push("/newsletters/sources")}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Manage Sources
        </Button>
      </div>

      {/* Daily Briefing Card */}
      <BriefingCard
        briefing={briefing}
        isPlaying={isBriefingPlaying}
        onPlay={handlePlayBriefing}
        onPause={pause}
      />

      {/* Newsletter Issues List */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Today's Newsletters
        </h3>
        <NewsletterList
          issues={issues}
          currentPlayingId={currentItem?.id ?? null}
          isPlaying={isPlaying}
          onPlay={handlePlayIssue}
          onPause={pause}
          onSelect={handleSelectIssue}
        />
      </div>
    </div>
  );
}
