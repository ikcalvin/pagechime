"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Share2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { usePlayer, Article } from "@/context/player-context";
import { formatDistanceToNow } from "date-fns";

export default function ArticleReaderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { playArticle } = usePlayer();

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
      <main className="container max-w-2xl mx-auto px-6 py-12 md:py-16">
        <article className="prose prose-lg dark:prose-invert mx-auto prose-headings:font-serif prose-p:font-serif prose-p:leading-8 prose-p:text-lg text-foreground/90">
          {/* Header */}
          <header className="mb-10 not-prose border-b pb-10">
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-black text-foreground mb-6 leading-[1.1] tracking-tight">
              {article.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-muted-foreground text-sm font-sans tracking-wide">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground uppercase text-xs tracking-wider">
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
                className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium"
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
              className="font-serif text-[1.125rem] md:text-[1.25rem] leading-[1.8] text-foreground/90 [&_p]:mb-8 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-8 [&_li]:mb-2 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/20 [&_blockquote]:italic [&_img]:rounded-md [&_img]:my-8 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-4"
              dangerouslySetInnerHTML={{ __html: article.clean_text }}
            />
          ) : (
            <div className="text-center py-20 text-muted-foreground italic">
              No readable text content available.
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
