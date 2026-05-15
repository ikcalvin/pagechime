"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  MoreHorizontal,
  GripVertical,
  Image as ImageIcon,
  Archive,
  ArchiveRestore,
  Trash2,
  FolderInput,
  Tag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAudio, articleToPlayable } from "@/contexts/audio-context";
import { TagMenu } from "./tag-menu";
import api from "@/utils/api";
import { createClient } from "@/utils/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tag = { id: string; name: string };

type Article = {
  id: string;
  title: string;
  original_url: string;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  audio_url?: string;
  clean_text?: string;
  excerpt?: string;
  image_url?: string;
  is_archived?: boolean;
  is_deleted?: boolean;
  tags?: Tag[];
  collection_id?: string | null;
  sort_order?: number;
  word_count?: number;
};

type Collection = { id: string; name: string };

type FilterType = "all" | "unread" | "read" | "listening";
type SortType = "newest" | "oldest" | "title-az";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getReadingTime(wordCount?: number): string | null {
  if (!wordCount) return null;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min`;
}

function isArticleRead(article: Article): boolean {
  // Considered "read" if it has audio and status is completed
  return article.status === "completed" && !!article.audio_url;
}

function applyFilter(
  articles: Article[],
  filter: FilterType,
  currentItemId: string | null
): Article[] {
  switch (filter) {
    case "unread":
      return articles.filter((a) => !isArticleRead(a));
    case "read":
      return articles.filter((a) => isArticleRead(a));
    case "listening":
      return articles.filter((a) => a.id === currentItemId);
    default:
      return articles;
  }
}

function applySort(articles: Article[], sort: SortType): Article[] {
  const copy = [...articles];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case "title-az":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "newest":
    default:
      // Prefer sort_order when available (manual DnD order)
      return copy.sort((a, b) => {
        if (a.sort_order != null && b.sort_order != null) {
          return a.sort_order - b.sort_order;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }
}

function applySearch(articles: Article[], query: string): Article[] {
  if (!query.trim()) return articles;
  const q = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.original_url.toLowerCase().includes(q) ||
      a.excerpt?.toLowerCase().includes(q)
  );
}

// ---------------------------------------------------------------------------
// Filter pill component
// ---------------------------------------------------------------------------

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A]"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status badge for non-completed articles
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Article["status"] }) {
  if (status === "queued") {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Queued
      </Badge>
    );
  }
  if (status === "processing") {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Processing
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge
        variant="destructive"
        className="text-[10px] px-1.5 py-0.5 gap-1"
      >
        <AlertCircle className="h-2.5 w-2.5" />
        Failed
      </Badge>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Overflow menu
// ---------------------------------------------------------------------------

interface ArticleMenuProps {
  article: Article;
  collections: Collection[];
  availableTags: Tag[];
  onRefreshTags: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveToCollection: (articleId: string, collectionId: string | null) => void;
  onTagsUpdated: (articleId: string, tags: Tag[]) => void;
}

function ArticleMenu({
  article,
  collections,
  availableTags,
  onRefreshTags,
  onArchive,
  onUnarchive,
  onDelete,
  onMoveToCollection,
  onTagsUpdated,
}: ArticleMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Article options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Move to collection */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <FolderInput className="h-3.5 w-3.5" />
            Move to collection
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMoveToCollection(article.id, null);
              }}
            >
              No collection
            </DropdownMenuItem>
            {collections.length > 0 && <DropdownMenuSeparator />}
            {collections.map((col) => (
              <DropdownMenuItem
                key={col.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToCollection(article.id, col.id);
                }}
              >
                {col.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Tags */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <TagMenu
              articleId={article.id}
              initialTags={article.tags}
              onTagsChange={(tags: Tag[]) => onTagsUpdated(article.id, tags)}
              availableTags={availableTags}
              onRefreshTags={onRefreshTags}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Archive / Unarchive */}
        {article.is_archived ? (
          <DropdownMenuItem
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onUnarchive(article.id);
            }}
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
            Unarchive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(article.id);
            }}
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Delete */}
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(article.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// SortableArticle row
// ---------------------------------------------------------------------------

interface SortableArticleProps {
  article: Article;
  collections: Collection[];
  availableTags: Tag[];
  onRefreshTags: () => void;
  isActive: boolean;
  isCurrentlyPlaying: boolean;
  onPlay: (article: Article) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveToCollection: (articleId: string, collectionId: string | null) => void;
  onTagsUpdated: (articleId: string, tags: Tag[]) => void;
}

function SortableArticle({
  article,
  collections,
  availableTags,
  onRefreshTags,
  isActive,
  isCurrentlyPlaying,
  onPlay,
  onArchive,
  onUnarchive,
  onDelete,
  onMoveToCollection,
  onTagsUpdated,
}: SortableArticleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasAudio = !!article.audio_url;
  const isCompleted = article.status === "completed";
  const canPlay = hasAudio && isCompleted;

  const domain = getDomain(article.original_url);
  const readingTime = getReadingTime(article.word_count);
  const timeAgo = formatDistanceToNow(new Date(article.created_at), {
    addSuffix: true,
  });

  const metaParts = [domain, readingTime, timeAgo].filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3 border-b border-border/40 transition-colors",
        "min-h-[80px] max-h-[88px]",
        isDragging
          ? "opacity-50 bg-muted/50 z-50"
          : isActive
          ? "bg-[#FFF0EB]/30 dark:bg-[#FF6B4A]/5"
          : "hover:bg-muted/30"
      )}
    >
      {/* Drag handle — visible on row hover */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Thumbnail */}
      <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-snug truncate text-foreground">
          {article.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {metaParts.join(" · ")}
        </p>
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {canPlay ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-colors",
              isCurrentlyPlaying
                ? "text-[#FF6B4A] bg-[#FFF0EB] dark:bg-[#FF6B4A]/10 hover:bg-[#FFF0EB]/80"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(article);
            }}
            aria-label={isCurrentlyPlaying ? "Pause" : "Play"}
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
        ) : (
          <div className="h-8 w-8 flex items-center justify-center">
            <StatusBadge status={article.status} />
          </div>
        )}

        <ArticleMenu
          article={article}
          collections={collections}
          availableTags={availableTags}
          onRefreshTags={onRefreshTags}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
          onMoveToCollection={onMoveToCollection}
          onTagsUpdated={onTagsUpdated}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  view,
  hasSearch,
  filter,
}: {
  view: "inbox" | "archive";
  hasSearch: boolean;
  filter: FilterType;
}) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-muted-foreground text-sm">
          No articles found matching your search.
        </p>
      </div>
    );
  }
  if (filter !== "all") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-muted-foreground text-sm">
          No articles in this filter.
        </p>
      </div>
    );
  }
  if (view === "archive") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <Archive className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">No archived articles.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <p className="text-sm font-medium text-foreground mb-1">
        No articles yet.
      </p>
      <p className="text-muted-foreground text-sm">
        Add your first link to get started.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ArticleList component
// ---------------------------------------------------------------------------

export function ArticleList({
  view = "inbox",
  collectionId,
}: {
  view?: "inbox" | "archive";
  collectionId?: string;
}) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";

  const [articles, setArticles] = useState<Article[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");

  const { play, pause, isPlaying, currentItem } = useAudio();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchArticles = useCallback(async () => {
    try {
      const params: Record<string, string> = { view };
      if (collectionId) params.collectionId = collectionId;
      if (searchQuery) params.search = searchQuery;
      const response = await api.get("/articles", { params });
      // Handle both paginated { data, pagination } and legacy array responses
      const articlesData = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
      setArticles(articlesData);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setIsLoading(false);
    }
  }, [view, collectionId, searchQuery]);

  // Targeted polling fallback: re-fetch only when there are articles still
  // in "queued" or "processing" state.
  useEffect(() => {
    const hasPending = articles.some(
      (a) => a.status === "queued" || a.status === "processing"
    );
    if (!hasPending) return;
    const interval = setInterval(fetchArticles, 5_000);
    return () => clearInterval(interval);
  }, [articles, fetchArticles]);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await api.get("/collections");
      setCollections(res.data || []);
    } catch (err) {
      console.error("Failed to fetch collections:", err);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await api.get("/tags");
      setAvailableTags(response.data || []);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchCollections();
    fetchTags();
  }, [fetchArticles, fetchCollections, fetchTags]);

  // ---------------------------------------------------------------------------
  // Supabase Realtime subscription
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("articles-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "articles",
        },
        (payload) => {
          const newArticle = payload.new as Article;
          // Only add if it belongs to the current view
          const isArchived = newArticle.is_archived ?? false;
          if (view === "archive" && !isArchived) return;
          if (view === "inbox" && isArchived) return;
          if (collectionId && newArticle.collection_id !== collectionId) return;

          setArticles((prev) => {
            if (prev.some((a) => a.id === newArticle.id)) return prev;
            return [newArticle, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "articles",
        },
        (payload) => {
          const updated = payload.new as Article;
          setArticles((prev) => {
            // If article was archived/deleted and doesn't belong here, remove it
            const shouldRemove =
              updated.is_deleted ||
              (view === "inbox" && updated.is_archived) ||
              (view === "archive" && !updated.is_archived);

            if (shouldRemove) {
              return prev.filter((a) => a.id !== updated.id);
            }
            return prev.map((a) => (a.id === updated.id ? updated : a));
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "articles",
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setArticles((prev) => prev.filter((a) => a.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view, collectionId]);

  // ---------------------------------------------------------------------------
  // Article mutations
  // ---------------------------------------------------------------------------

  const handlePlay = useCallback(
    (article: Article) => {
      const playable = articleToPlayable(article);
      if (!playable) return;

      if (currentItem?.id === article.id && isPlaying) {
        pause();
      } else {
        play(playable);
      }
    },
    [play, pause, isPlaying, currentItem]
  );

  const handleArchive = useCallback(async (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.put(`/articles/${id}`, { is_archived: true });
    } catch (err) {
      console.error("Failed to archive article:", err);
      // Refetch to restore state on error
    }
  }, []);

  const handleUnarchive = useCallback(async (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.put(`/articles/${id}`, { is_archived: false });
    } catch (err) {
      console.error("Failed to unarchive article:", err);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.put(`/articles/${id}`, { is_deleted: true });
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  }, []);

  const handleMoveToCollection = useCallback(
    async (articleId: string, targetCollectionId: string | null) => {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId
            ? { ...a, collection_id: targetCollectionId }
            : a
        )
      );
      try {
        await api.put(`/articles/${articleId}`, {
          collection_id: targetCollectionId,
        });
      } catch (err) {
        console.error("Failed to move article:", err);
      }
    },
    []
  );

  const handleTagsUpdated = useCallback((articleId: string, tags: Tag[]) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, tags } : a))
    );
  }, []);

  // ---------------------------------------------------------------------------
  // DnD reorder
  // ---------------------------------------------------------------------------

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setArticles((prev) => {
        const oldIndex = prev.findIndex((a) => a.id === active.id);
        const newIndex = prev.findIndex((a) => a.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });

      try {
        // Calculate sort_order based on neighbors
        const newArticles = (() => {
          const prev = [...articles];
          const oldIdx = prev.findIndex((a) => a.id === active.id);
          const newIdx = prev.findIndex((a) => a.id === over.id);
          if (oldIdx === -1 || newIdx === -1) return prev;
          return arrayMove(prev, oldIdx, newIdx);
        })();
        const idx = newArticles.findIndex((a) => a.id === active.id);
        const prevItem = newArticles[idx - 1];
        const nextItem = newArticles[idx + 1];
        let newSortOrder = 0;
        if (!prevItem && !nextItem) {
          newSortOrder = Date.now() / 1000;
        } else if (!prevItem) {
          newSortOrder = (nextItem!.sort_order || 0) + 1000;
        } else if (!nextItem) {
          newSortOrder = (prevItem.sort_order || 0) - 1000;
        } else {
          newSortOrder = ((prevItem.sort_order || 0) + (nextItem.sort_order || 0)) / 2;
        }
        await api.put(`/articles/${active.id}`, { sort_order: newSortOrder });
      } catch (err) {
        console.error("Failed to save sort order:", err);
        fetchArticles();
      }
    },
    [fetchArticles]
  );

  // ---------------------------------------------------------------------------
  // Derived display list
  // ---------------------------------------------------------------------------

  const displayArticles = (() => {
    let result = applySearch(articles, searchQuery);
    result = applyFilter(result, filter, currentItem?.id ?? null);
    result = applySort(result, sort);
    return result;
  })();

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
    { value: "listening", label: "Listening" },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col">
      {/* Toolbar: filter pills + sort dropdown */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {filterOptions.map((opt) => (
            <FilterPill
              key={opt.value}
              label={opt.label}
              active={filter === opt.value}
              onClick={() => setFilter(opt.value)}
            />
          ))}
        </div>

        <div className="flex-shrink-0 ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="h-8 text-xs w-[110px] rounded-md bg-secondary text-foreground px-2 py-1 border-none outline-none cursor-pointer hover:bg-secondary/80 transition-colors appearance-none"
            aria-label="Sort articles"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title-az">Title A–Z</option>
          </select>
        </div>
      </div>

      {/* Article list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : displayArticles.length === 0 ? (
        <EmptyState
          view={view}
          hasSearch={!!searchQuery.trim()}
          filter={filter}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayArticles.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div role="list" aria-label="Articles">
              {displayArticles.map((article) => {
                const isActive = currentItem?.id === article.id;
                const isCurrentlyPlaying = isActive && isPlaying;
                return (
                  <SortableArticle
                    key={article.id}
                    article={article}
                    collections={collections}
                    availableTags={availableTags}
                    onRefreshTags={fetchTags}
                    isActive={isActive}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                    onPlay={handlePlay}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                    onDelete={handleDelete}
                    onMoveToCollection={handleMoveToCollection}
                    onTagsUpdated={handleTagsUpdated}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
