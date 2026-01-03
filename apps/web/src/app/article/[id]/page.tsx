"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Share2,
  Play,
  Archive,
  Trash2,
  Tag as TagIcon,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { usePlayer, Article } from "@/context/player-context";
import { formatDistanceToNow } from "date-fns";
import {
  ReaderSettingsMenu,
  ReaderSettings,
  ReaderFont,
  ReaderTheme,
  ReaderWidth,
} from "@/components/reader-settings";
import { TagMenu } from "@/components/tag-menu";
import { useArticleTags } from "@/components/tag-manager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.log(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  font: "serif",
  fontSize: 20, // 1.25rem = 20px base
  theme: "light",
  width: "standard",
};

export default function ArticleReaderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { playArticle } = usePlayer();
  const [settings, setSettings] = useLocalStorage<ReaderSettings>(
    "reader-settings",
    DEFAULT_SETTINGS
  );

  // For TagMenu - create a wrapper since TagMenu is built for DropdownMenuSub but we might want it in a main Dropdown
  // Actually TagMenu uses DropdownMenuSub, so it must be inside a DropdownMenu.
  // We can wrap it in a root DropdownMenu just for the trigger.
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  // Fetch tags for TagMenu
  const fetchTags = async () => {
    try {
      const res = await api.get("/tags");
      setAvailableTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  useEffect(() => {
    if (article) fetchTags();
  }, [article]);

  const handleTagsChange = (tags: any[]) => {
    if (!article) return;
    setArticle({ ...article, tags });
  };

  const handleArchive = async () => {
    if (!article) return;
    try {
      // Optimistic update
      const newStatus = !article.status; // wait, article doesn't have is_archived on type here?
      // The local Article type in player-context doesn't have is_archived.
      // We should update the type or just cast it.
      // Actually player-context Article is missing is_archived.
      // Let's assume the API returns it (it does) and just cast for now to avoid blocking.
      const isArchived = (article as any).is_archived;

      await api.patch(`/articles/${article.id}`, { is_archived: !isArchived });
      setArticle({ ...article, is_archived: !isArchived } as any);
      router.refresh();
    } catch (e) {
      console.error("Failed to archive", e);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await api.delete(`/articles/${article.id}`);
      router.push("/");
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get(`/articles/${id}`);
        setArticle(res.data);
      } catch (err) {
        console.error("Failed to fetch article", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-semibold">Article not found</h1>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  const domain = new URL(article.original_url).hostname.replace("www.", "");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container max-w-3xl mx-auto h-14 flex items-center justify-between px-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <ReaderSettingsMenu
              settings={settings}
              onSettingsChange={setSettings}
            />

            <div className="h-4 w-px bg-border/50 mx-1" />

            {/* Tag Menu */}
            {article && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Tags">
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
            )}

            <Button
              variant="ghost"
              size="icon"
              title="Archive"
              onClick={handleArchive}
            >
              {(article as any).is_archived ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-border/50 mx-1" />

            {article.audio_url && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => playArticle(article)}
              >
                <Play className="mr-2 h-3.5 w-3.5" /> Listen
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Article Content */}
      <main
        className={`transition-colors duration-300 min-h-screen
          ${settings.theme === "light" ? "bg-background text-foreground" : ""}
          ${settings.theme === "sepia" ? "bg-[#f4ecd8] text-[#5b4636]" : ""}
          ${settings.theme === "dark" ? "bg-slate-900 text-slate-100" : ""}
          ${settings.theme === "black" ? "bg-black text-zinc-300" : ""}
        `}
      >
        <div
          className={`container mx-auto px-6 py-12 md:py-16 transition-all duration-300 ${
            settings.width === "wide" ? "max-w-4xl" : "max-w-2xl"
          }`}
        >
          <article
            className={`prose dark:prose-invert mx-auto text-inherit
            ${settings.font === "sans" ? "font-sans" : ""}
            ${settings.font === "serif" ? "font-serif" : ""}
            ${settings.font === "mono" ? "font-mono" : ""}
             prose-headings:font-inherit
             [&_h1]:text-inherit
             [&_h2]:text-inherit
             [&_h3]:text-inherit
             [&_strong]:text-inherit
             [&_a]:text-blue-600 dark:[&_a]:text-blue-400
             ${settings.theme === "sepia" ? "[&_a]:text-[#b3404a]" : ""}
        `}
            style={{
              fontSize: `${settings.fontSize}px`,
            }}
          >
            {/* Header */}
            <header
              className={`mb-10 not-prose border-b pb-10 ${
                settings.theme === "sepia"
                  ? "border-[#e6dbbf]"
                  : settings.theme === "dark"
                  ? "border-slate-800"
                  : settings.theme === "black"
                  ? "border-zinc-800"
                  : "border-border"
              }`}
            >
              <h1
                className="leading-[1.1] tracking-tight font-black mb-6"
                style={{ fontSize: "2.5em" }}
              >
                {article.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-sans tracking-wide opacity-80">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase text-xs tracking-wider">
                    {domain}
                  </span>
                  <span>•</span>
                  <time>
                    {formatDistanceToNow(new Date(article.created_at), {
                      // It might be better to show actual date for a "Reader View" feel, but relative is fine too.
                      addSuffix: true,
                    })}
                  </time>
                </div>
                <a
                  href={article.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline opacity-80 hover:opacity-100 transition-colors font-medium text-inherit"
                >
                  View Original
                </a>
              </div>
            </header>

            {/* Feature Image */}
            {article.image_url && (
              <div className="mb-10">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* Body */}
            {article.clean_text ? (
              <div
                className={`leading-[1.8]
                [&_p]:mb-8
                [&_h2]:text-[1.5em] [&_h2]:font-bold [&_h2]:mt-[1.5em] [&_h2]:mb-[0.5em]
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-8
                [&_li]:mb-2
                [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:italic
                ${
                  settings.theme === "sepia"
                    ? "[&_blockquote]:border-[#d3cbb0]"
                    : "[&_blockquote]:border-primary/20"
                }
                [&_img]:rounded-md [&_img]:my-8
                [&_a]:underline [&_a]:underline-offset-4
              `}
                dangerouslySetInnerHTML={{ __html: article.clean_text }}
              />
            ) : (
              <div className="text-center py-20 text-muted-foreground italic">
                No readable text content available.
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}
