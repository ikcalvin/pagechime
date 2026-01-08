"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Play,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Archive,
  RotateCcw,
  FolderPlus,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";
import { usePlayer } from "@/context/player-context";

import { TagMenu } from "./tag-menu";
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

type Tag = {
  id: string;
  name: string;
};

type Article = {
  id: string;
  title: string;
  original_url: string;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  audio_url?: string;
  clean_text?: string;
  image_url?: string;
  is_archived?: boolean;
  is_deleted?: boolean;
  tags?: Tag[];
  collection_id?: string | null;
  sort_order?: number;
};

type Collection = {
  id: string;
  name: string;
};

interface SortableArticleProps {
  article: Article;
  currentArticle: Article | null;
  isPlaying: boolean;
  togglePlay: () => void;
  playArticle: (article: Article) => void;
  getStatusIcon: (status: Article["status"]) => React.JSX.Element;
  handleTagsChange: (id: string, tags: Tag[]) => void;
  handleMoveToCollection: (
    article: Article,
    collectionId: string | null
  ) => void;
  handleArchive: (article: Article) => void;
  handleDelete: (article: Article) => void;
  collections: Collection[];
  availableTags: Tag[];
  onRefreshTags: () => void;
}

function SortableArticle({
  article,
  currentArticle,
  isPlaying,
  togglePlay,
  playArticle,
  getStatusIcon,
  handleTagsChange,
  handleMoveToCollection,
  handleArchive,
  handleDelete,
  collections,
  availableTags,
  onRefreshTags,
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
    zIndex: isDragging ? 50 : "auto",
    position: isDragging ? "relative" : ("relative" as "relative"),
  };

  const domain = new URL(article.original_url).hostname.replace("www.", "");
  const readingTime = Math.max(
    1,
    Math.ceil((article.clean_text?.split(/\s+/).length || 0) / 200)
  );

  // Strip HTML for snippet
  const stripHtml = (html: string) => {
    if (typeof window === "undefined") return html; // fallback for server-side (though this is client component)
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const [isImageVisible, setIsImageVisible] = useState(true);

  // Reset visibility when article changes (though component likely remounts due to key)
  useEffect(() => {
    setIsImageVisible(true);
  }, [article.image_url]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${
        isDragging ? "opacity-50" : ""
      } border-b border-border/40 py-6 select-none`}
    >
      <div
        className={`group relative flex items-start gap-4 sm:gap-6 transition-all pl-0 md:pl-6 lg:pl-8 ${
          isDragging ? "bg-muted/30" : ""
        }`}
      >
        {/* Drag Handle - Centered on thumbnail */}
        <div
          {...attributes}
          {...listeners}
          className={`absolute left-1 top-10 cursor-grab active:cursor-grabbing p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground transition-colors ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <Link href={`/article/${article.id}`} className="block group/title">
              <h3 className="font-serif text-xl font-medium leading-tight text-foreground group-hover/title:underline decoration-border/50 underline-offset-4 line-clamp-3 md:line-clamp-none">
                {article.title || "Untitled Article"}
              </h3>
            </Link>

            {/* Actions Menu - Simplified */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Move to Collection
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() => handleMoveToCollection(article, null)}
                      >
                        None (Remove)
                      </DropdownMenuItem>
                      {collections.map((grp) => (
                        <DropdownMenuItem
                          key={grp.id}
                          onClick={() =>
                            handleMoveToCollection(article, grp.id)
                          }
                        >
                          {grp.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <TagMenu
                  articleId={article.id}
                  initialTags={article.tags}
                  onTagsChange={(tags) => handleTagsChange(article.id, tags)}
                  availableTags={availableTags}
                  onRefreshTags={onRefreshTags}
                />
                <DropdownMenuItem onClick={() => handleArchive(article)}>
                  {article.is_archived ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDelete(article)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center text-sm text-muted-foreground gap-2 font-light">
            <span className="text-foreground/80 font-medium">{domain}</span>
            <span>·</span>
            <span>{readingTime} min read</span>
            <span className="hidden sm:inline">
              ·{" "}
              {formatDistanceToNow(new Date(article.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Excerpt if present (simulated for now since clean_text is full) */}
          {article.clean_text && (
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed max-w-3xl">
              {stripHtml(article.clean_text).substring(0, 200)}...
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {/* Status / Play Controls */}
            <div className="flex items-center gap-2">
              {article.status === "completed" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className={`h-7 rounded-sm px-3 text-[11px] font-medium transition-colors ${
                    currentArticle?.id === article.id && isPlaying
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentArticle?.id === article.id && isPlaying) {
                      togglePlay();
                    } else {
                      playArticle(article);
                    }
                  }}
                >
                  {currentArticle?.id === article.id && isPlaying ? (
                    <>
                      <span className="mr-2 relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      Playing
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1.5" /> Listen
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {getStatusIcon(article.status)}
                  <span className="capitalize">{article.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail - Right aligned */}
        {article.image_url && isImageVisible && (
          <div className="shrink-0 block ml-2 md:ml-0 md:order-first">
            <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-lg overflow-hidden bg-muted border border-border/50 shadow-sm">
              <img
                src={article.image_url}
                alt={article.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onLoad={() => setIsImageVisible(true)}
                onError={() => setIsImageVisible(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ArticleList({
  view = "inbox",
  collectionId,
}: {
  view?: "inbox" | "archive";
  collectionId?: string;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { playArticle, currentArticle, isPlaying, togglePlay } = usePlayer();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  const fetchArticles = async () => {
    try {
      if (articles.length === 0) setLoading(true);

      const params: any = {};
      if (collectionId) params.collectionId = collectionId;
      if (search) params.search = search;

      const response = await api.get("/articles", { params });
      setArticles(response.data || []);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await api.get("/collections");
      setCollections(res.data || []);
    } catch (error) {
      console.error("Failed to fetch collections", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/tags");
      setAvailableTags(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchCollections();
    fetchTags();
    const interval = setInterval(fetchArticles, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [collectionId, search]);

  const updateArticleStatus = async (id: string, updates: Partial<Article>) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );

    try {
      await api.put(`/articles/${id}`, updates);
    } catch (error) {
      console.error("Failed to update article:", error);
      fetchArticles(); // Revert on failure
    }
  };

  const handleArchive = (article: Article) => {
    updateArticleStatus(article.id, { is_archived: !article.is_archived });
  };

  const handleDelete = (article: Article) => {
    if (confirm("Are you sure you want to delete this article?")) {
      updateArticleStatus(article.id, { is_deleted: true });
    }
  };

  const handleMoveToCollection = (
    article: Article,
    collectionId: string | null
  ) => {
    updateArticleStatus(article.id, { collection_id: collectionId });
  };

  const handleTagsChange = (articleId: string, newTags: Tag[]) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, tags: newTags } : a))
    );
  };

  const filteredArticles = articles.filter((article) => {
    if (article.is_deleted) return false;
    if (view === "inbox") return !article.is_archived;
    if (view === "archive") return article.is_archived;
    return true;
  });

  const filteredCollections = search
    ? collections.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const filteredTags = search
    ? availableTags.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredArticles.findIndex((a) => a.id === active.id);
      const newIndex = filteredArticles.findIndex((a) => a.id === over?.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newFilteredItems = arrayMove(filteredArticles, oldIndex, newIndex);

      // Calculate new sort_order
      // Sorting is Descending by default (highest number is top).
      // So if I move item to newIndex, I need to pick a value between newIndex-1 and newIndex+1

      const prevItem = newFilteredItems[newIndex - 1];
      const nextItem = newFilteredItems[newIndex + 1];

      let newSortOrder = 0;

      if (!prevItem && !nextItem) {
        // Only one item, doesn't matter
        newSortOrder = Date.now() / 1000;
      } else if (!prevItem) {
        // Moved to top. sort_order should be higher than first item
        newSortOrder = (nextItem.sort_order || 0) + 1000;
      } else if (!nextItem) {
        // Moved to bottom. sort_order should be lower than last item
        newSortOrder = (prevItem.sort_order || 0) - 1000;
      } else {
        // Between two items
        const prevOrder = prevItem.sort_order || 0;
        const nextOrder = nextItem.sort_order || 0;
        newSortOrder = (prevOrder + nextOrder) / 2;
      }

      // Optimistic update
      // We need to update the source 'articles' array, not just filtered.
      // But filtered is just a view.
      // We update the specific article's sort_order and re-sort the 'articles' state?
      // Actually 'articles' might contain archived ones.
      // Dragging only happens within the current view (filtered).
      // So we update the active item's sort_order.

      const updatedArticle = {
        ...filteredArticles[oldIndex],
        sort_order: newSortOrder,
      };

      // Map the original articles array to update this one article
      setArticles(
        (prev) =>
          prev
            .map((a) => (a.id === active.id ? updatedArticle : a))
            .sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0)) // Re-sort to maintain view
      );

      // Call API
      api.put(`/articles/${active.id}`, { sort_order: newSortOrder });
    }
  };

  const getStatusIcon = (status: Article["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case "processing":
        return <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  if (loading && articles.length === 0) {
    return <div className="text-center py-10">Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      {search &&
        (filteredCollections.length > 0 || filteredTags.length > 0) && (
          <div className="space-y-4">
            {filteredCollections.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Collections
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {filteredCollections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collection/${collection.id}`}
                      className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="font-semibold">{collection.name}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {filteredTags.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      #{tag.name.replace(/^#/, "")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredArticles.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  {view === "inbox"
                    ? search
                      ? "No articles found matching your search."
                      : "No articles in inbox. Add one above!"
                    : "No matching archived articles."}
                </CardContent>
              </Card>
            ) : (
              filteredArticles.map((article) => (
                <SortableArticle
                  key={article.id}
                  article={article}
                  currentArticle={currentArticle}
                  isPlaying={isPlaying}
                  togglePlay={togglePlay}
                  playArticle={playArticle}
                  getStatusIcon={getStatusIcon}
                  handleTagsChange={handleTagsChange}
                  handleMoveToCollection={handleMoveToCollection}
                  handleArchive={handleArchive}
                  handleDelete={handleDelete}
                  collections={collections}
                  availableTags={availableTags}
                  onRefreshTags={fetchTags}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
