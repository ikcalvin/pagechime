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
};

type Collection = {
  id: string;
  name: string;
};

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
    const interval = setInterval(fetchArticles, 5000);
    return () => clearInterval(interval);
  }, [collectionId]); // Re-fetch if collectionId changes

  const updateArticleStatus = async (id: string, updates: Partial<Article>) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );

    try {
      await api.put(`/articles/${id}`, updates);
    } catch (error) {
      console.error("Failed to update article:", error);
      fetchArticles();
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
    updateArticleStatus(article.id, { collection_id: collectionId }); // @ts-ignore
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

  const getStatusIcon = (status: Article["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading && articles.length === 0) {
    return <div className="text-center py-10">Loading articles...</div>;
  }

  return (
    <div className="space-y-4">
      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {view === "inbox"
              ? "No articles in inbox. Add one above!"
              : "No archived articles."}
          </CardContent>
        </Card>
      ) : (
        filteredArticles.map((article) => {
          const domain = new URL(article.original_url).hostname.replace(
            "www.",
            ""
          );
          const readingTime = Math.max(
            1,
            Math.ceil((article.clean_text?.split(/\s+/).length || 0) / 200)
          );

          return (
            <Card
              key={article.id}
              className="overflow-hidden relative group py-0"
            >
              <CardContent className="p-0">
                <div className="flex flex-row">
                  {article.image_url && (
                    <div className="w-32 sm:w-48 relative shrink-0 hidden sm:block">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1 p-5 flex flex-col gap-2">
                    <h3 className="font-bold text-xl leading-tight text-foreground">
                      {article.title || "Untitled Article"}
                    </h3>

                    <div className="flex items-center text-xs text-muted-foreground gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {domain}
                      </span>
                      <span>•</span>
                      <span>{readingTime} min read</span>
                      <span className="ml-auto hidden sm:block">
                        {formatDistanceToNow(new Date(article.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.clean_text || article.original_url}
                    </p>

                    <TagManager
                      articleId={article.id}
                      initialTags={article.tags}
                      onTagsChange={(tags) =>
                        handleTagsChange(article.id, tags)
                      }
                    />

                    <div className="flex items-center gap-3 mt-3">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 font-normal"
                      >
                        {getStatusIcon(article.status)}
                        <span className="capitalize">{article.status}</span>
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          asChild
                        >
                          <a
                            href={article.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-4 w-4 mr-1.5" />
                            Read
                          </a>
                        </Button>

                        {article.status === "completed" &&
                          article.audio_url && (
                            <>
                              {currentArticle?.id === article.id &&
                              isPlaying ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-primary hover:text-primary font-medium"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    togglePlay();
                                  }}
                                >
                                  Playing
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    playArticle(article as any);
                                  }}
                                >
                                  <Play className="h-4 w-4 mr-1.5" />
                                  Listen
                                </Button>
                              )}
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground bg-background/80 backdrop-blur-sm"
                      >
                        <MoreHorizontal className="h-5 w-5" />
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
                              onClick={() =>
                                handleMoveToCollection(article, null)
                              }
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
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
