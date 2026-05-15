"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Share2,
  Play,
  Pause,
  Archive,
  Trash2,
  Tag as TagIcon,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { useAudio, articleToPlayable } from "@/contexts/audio-context";
import { formatDistanceToNow } from "date-fns";
import { ReaderSettingsMenu } from "@/components/reader-settings";
import { TagMenu } from "@/components/tag-menu";
import { useReaderSettings } from "@/context/use-reader-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Article = {
  id: string;
  title: string;
  original_url: string;
  status: string;
  created_at: string;
  audio_url?: string;
  clean_text?: string;
  image_url?: string;
  is_archived?: boolean;
  tags?: any[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function estimateReadingTime(text?: string): string {
  if (!text) return "< 1 min read";
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

// ---------------------------------------------------------------------------
// Font / theme maps
// ---------------------------------------------------------------------------

const fontFamilyMap: Record<string, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
};

const fontSizeStyle = (size: number) => ({ fontSize: `${size}px` });

const themeMap: Record<string, string> = {
  light: "bg-white text-neutral-900",
  dark: "bg-neutral-950 text-neutral-100",
  sepia: "bg-[#f4ecd8] text-[#3b2f1e]",
  black: "bg-black text-neutral-200",
};

const widthMap: Record<string, string> = {
  narrow: "max-w-[600px]",
  wide: "max-w-[860px]",
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[#FF6B4A]"
        role="status"
        aria-label="Loading article"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not found state
// ---------------------------------------------------------------------------

function ArticleNotFound({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xl font-semibold text-foreground">Article not found</p>
      <p className="text-sm text-muted-foreground">
        This article may have been deleted or does not exist.
      </p>
      <Button onClick={onHome} variant="outline" className="mt-2">
        Go Home
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ArticleReaderPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  // Audio
  const { play, pause, isPlaying, currentItem } = useAudio();
  const isThisArticlePlaying = isPlaying && currentItem?.id === id;

  // Reader settings
  const { settings, updateSettings } = useReaderSettings();

  // Article state
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Tags
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  const fetchTags = async () => {
    try {
      const res = await api.get("/tags");
      setAvailableTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  const handleTagsChange = (tags: any[]) => {
    if (!article) return;
    setArticle({ ...article, tags });
  };

  // Playback progress (0–1)
  const [progress, setProgress] = useState(0);

  // ---------------------------------------------------------------------------
  // Fetch article
  // ---------------------------------------------------------------------------

  const fetchArticle = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/articles/${id}`);
      const data: Article = response.data;
      setArticle(data);
      setIsArchived(data.is_archived ?? false);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  useEffect(() => {
    if (article) fetchTags();
  }, [article]);

  // ---------------------------------------------------------------------------
  // Sync audio progress from currentItem media element
  // (useAudio may expose a mediaRef or currentTime; we fall back to polling)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isThisArticlePlaying) {
      setProgress(0);
      return;
    }

    // Poll the active <audio> element if exposed globally, otherwise skip
    const interval = setInterval(() => {
      const audioEl = document.querySelector<HTMLAudioElement>("audio[data-pagechime]");
      if (audioEl && audioEl.duration > 0) {
        setProgress(audioEl.currentTime / audioEl.duration);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isThisArticlePlaying]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handlePlayPause = useCallback(() => {
    if (!article) return;
    if (isThisArticlePlaying) {
      pause();
    } else {
      play(articleToPlayable(article));
    }
  }, [article, isThisArticlePlaying, play, pause]);

  const handleArchive = useCallback(async () => {
    if (!article) return;
    try {
      await api.patch(`/articles/${article.id}`, {
        is_archived: !isArchived,
      });
      setIsArchived((prev) => !prev);
    } catch {
      // Surface error to user in a production app; silent for now
    }
  }, [article, isArchived]);

  const handleDelete = useCallback(async () => {
    if (!article) return;
    const confirmed = window.confirm(
      "Delete this article? This action cannot be undone."
    );
    if (!confirmed) return;
    try {
      await api.delete(`/articles/${article.id}`);
      setIsDeleted(true);
      router.push("/");
    } catch {
      // Surface error to user in a production app
    }
  }, [article, router]);

  const handleShare = useCallback(async () => {
    if (!article) return;
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        url: article.original_url,
      });
    } else {
      await navigator.clipboard.writeText(article.original_url);
    }
  }, [article]);

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------

  if (loading) return <LoadingSpinner />;
  if (notFound || !article) return <ArticleNotFound onHome={() => router.push("/")} />;
  if (isDeleted) return null;

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const domain = extractDomain(article.original_url);
  const readTime = estimateReadingTime(article.clean_text);
  const dateAdded = formatDistanceToNow(new Date(article.created_at), {
    addSuffix: true,
  });

  const fontClass = fontFamilyMap[settings.font] ?? "font-sans";
  const themeClass = themeMap[settings.theme] ?? "bg-background text-foreground";
  const contentWidthClass =
    settings.width === "wide" ? widthMap.wide : widthMap.narrow;

  // Default column is 720px; width setting overrides
  const columnClass =
    settings.width === "narrow"
      ? "max-w-[600px]"
      : settings.width === "wide"
      ? "max-w-[860px]"
      : "max-w-[720px]";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn("min-h-screen transition-colors duration-200", themeClass)}>

      {/* ------------------------------------------------------------------ */}
      {/* Sticky toolbar                                                        */}
      {/* ------------------------------------------------------------------ */}

      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between gap-2 px-4">

          {/* Left: Back */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Center: Reader settings */}
          <div className="flex flex-1 justify-center">
            <ReaderSettingsMenu
              settings={settings}
              onSettingsChange={updateSettings}
            />
          </div>

          {/* Right: action buttons + Listen pill */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Tag */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Manage tags"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <TagIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <TagMenu
                  articleId={article.id}
                  initialTags={(article as any).tags}
                  onTagsChange={handleTagsChange}
                  availableTags={availableTags}
                  onRefreshTags={fetchTags}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Archive / Unarchive */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleArchive}
              aria-label={isArchived ? "Unarchive article" : "Archive article"}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                isArchived && "text-[#FF6B4A] hover:text-[#FF6B4A]"
              )}
            >
              {isArchived ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete article"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              aria-label="Share article"
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            {/* Listen — only shown when audio is available */}
            {article.audio_url && (
              <button
                onClick={handlePlayPause}
                aria-label={isThisArticlePlaying ? "Pause audio" : "Listen to article"}
                className={cn(
                  "ml-2 flex items-center gap-1.5 rounded-full bg-[#FF6B4A] px-4 py-1.5 text-sm font-semibold text-white",
                  "transition-opacity hover:opacity-90 active:opacity-80",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B4A]"
                )}
              >
                {isThisArticlePlaying ? (
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

        {/* Inline audio progress bar */}
        {isThisArticlePlaying && (
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

      {/* ------------------------------------------------------------------ */}
      {/* Article content                                                       */}
      {/* ------------------------------------------------------------------ */}

      <main className="px-4 py-10 sm:px-6">
        <article
          className={cn("mx-auto", columnClass, fontClass)}
          style={fontSizeStyle(settings.fontSize)}
        >
          {/* Title */}
          <h1 className="mb-4 text-[32px] font-bold leading-tight tracking-tight text-foreground">
            {article.title}
          </h1>

          {/* Metadata row */}
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{domain}</span>
            <span aria-hidden="true">·</span>
            <span>{readTime}</span>
            <span aria-hidden="true">·</span>
            <span>Added {dateAdded}</span>
            <span aria-hidden="true">·</span>
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[#FF6B4A] underline-offset-2 hover:underline"
            >
              View Original
            </a>
          </div>

          {/* Feature image */}
          {article.image_url && (
            <div className="mb-8 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image_url}
                alt=""
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Body content */}
          {article.clean_text ? (
            <div
              className={cn(
                "prose max-w-none dark:prose-invert",
                // Inline font-size is set via style; override prose's default
                "prose-p:leading-relaxed prose-p:text-[length:inherit]",
                "prose-headings:font-bold prose-headings:tracking-tight",
                "prose-a:text-[#FF6B4A] prose-a:no-underline hover:prose-a:underline",
                "prose-img:rounded-lg",
                "prose-blockquote:border-l-[#FF6B4A] prose-blockquote:text-muted-foreground",
                fontClass
              )}
              dangerouslySetInnerHTML={{ __html: article.clean_text }}
            />
          ) : (
            <p className="text-muted-foreground italic">
              No content available for this article.{" "}
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF6B4A] underline-offset-2 hover:underline"
              >
                Read it on the original site.
              </a>
            </p>
          )}
        </article>
      </main>
    </div>
  );
}
