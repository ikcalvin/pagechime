"use client";

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
import { TagManager } from "./tag-manager";
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
  getStatusIcon: (status: Article["status"]) => JSX.Element;
  handleTagsChange: (id: string, tags: Tag[]) => void;
  handleMoveToCollection: (
    article: Article,
    collectionId: string | null
  ) => void;
  handleArchive: (article: Article) => void;
  handleDelete: (article: Article) => void;
  collections: Collection[];
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${
        isDragging ? "opacity-50" : ""
      } border-b border-border/40 py-6 select-none`}
    >
      <div
        className={`group relative flex items-start gap-6 transition-all ${
          isDragging ? "pl-2" : ""
        }`}
      >
        {/* Drag Handle - Adjusted position */}
        <div
          {...attributes}
          {...listeners}
          className={`absolute -left-8 top-1 cursor-grab active:cursor-grabbing p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-muted/50 transition-colors ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Thumbnail */}
        {article.image_url && (
          <div className="shrink-0 hidden sm:block">
            <div className="h-24 w-24 rounded-sm overflow-hidden bg-muted border border-border/50">
              <img
                src={article.image_url}
                alt={article.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group/title"
            >
              <h3 className="font-serif text-xl font-medium leading-tight text-foreground group-hover/title:underline decoration-border/50 underline-offset-4">
                {article.title || "Untitled Article"}
              </h3>
            </a>

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
              {article.clean_text?.substring(0, 200)}...
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <TagManager
              articleId={article.id}
              initialTags={article.tags}
              onTagsChange={(tags) => handleTagsChange(article.id, tags)}
            />

            {/* Status / Play Controls */}
            <div className="flex items-center gap-2">
              {article.status === "completed" && article.audio_url ? (
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

        {/* Thumbnail - Right aligned now for standard blog feel, or left? User screenshot had it left but minimal. Let's stick to Right for a "clean" list look often seen, or re-evaluate. 
             Actually, checking the generated code above, I placed it *after* the content div if I put it here.
             The user's screenshot had a small square image on the RIGHT in the "other" screenshot usually found in these lists (like Medium).
             Let's try putting it on the right.
         */}
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
  const [loading, setLoading] = useState(true);
  const { playArticle, currentArticle, isPlaying, togglePlay } = usePlayer();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchArticles = async () => {
    try {
      if (articles.length === 0) setLoading(true);

      const params: any = {};
      if (collectionId) params.collectionId = collectionId;

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

  useEffect(() => {
    fetchArticles();
    fetchCollections();
    const interval = setInterval(fetchArticles, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [collectionId]);

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
                  ? "No articles in inbox. Add one above!"
                  : "No archived articles."}
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
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
