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
  Edit,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";

type Article = {
  id: string;
  title: string;
  original_url: string;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  audio_url?: string;
  clean_text?: string;
  image_url?: string;
};

export function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      // Only show loading on initial fetch
      if (articles.length === 0) setLoading(true);

      const response = await api.get("/articles");
      setArticles(response.data || []);
      0; // Adjust based on API response structure
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // Poll every 5 seconds
    const interval = setInterval(fetchArticles, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="grid gap-4 md:grid-cols-1">
      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No articles yet. Add one above to get started!
          </CardContent>
        </Card>
      ) : (
        articles.map((article) => {
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
                  {/* Left Column: Image (Thumbnail) */}
                  {article.image_url && (
                    <div className="w-48 relative shrink-0">
                      {/* Use a real image component here in the future */}
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

                  {/* Right Column: Content */}
                  <div className="flex-1 p-5 flex flex-col gap-2">
                    {/* Title */}
                    <h3 className="font-bold text-xl leading-tight text-foreground">
                      {article.title || "Untitled Article"}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span className="font-medium text-foreground">
                        {domain}
                      </span>
                      <span>•</span>
                      <span>{readingTime} min read</span>
                      <span className="ml-auto">
                        {formatDistanceToNow(new Date(article.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Snippet */}
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.clean_text || article.original_url}
                    </p>

                    {/* Action Row */}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              asChild
                            >
                              <a
                                href={article.audio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Play className="h-4 w-4 mr-1.5" />
                                Listen
                              </a>
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
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
