"use client";

import { ArticleList } from "@/components/article-list";
import { Sidebar } from "@/components/sidebar";

import { Suspense } from "react";

export default function ArchivePage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Archive</h1>
            <Suspense fallback={<div>Loading archive...</div>}>
              <ArticleList view="archive" />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
