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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
        articles.map((article) => (
          <Card key={article.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle
                  className="text-lg line-clamp-1"
                  title={article.title || article.original_url}
                >
                  {article.title || "Untitled Article"}
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getStatusIcon(article.status)}
                  <span className="capitalize">{article.status}</span>
                </Badge>
              </div>
              <CardDescription className="line-clamp-1">
                {article.original_url}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  Added{" "}
                  {formatDistanceToNow(new Date(article.created_at), {
                    addSuffix: true,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={article.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Read
                    </a>
                  </Button>
                  {article.status === "completed" && article.audio_url && (
                    <Button size="sm" asChild>
                      <a
                        href={article.audio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Listen
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
