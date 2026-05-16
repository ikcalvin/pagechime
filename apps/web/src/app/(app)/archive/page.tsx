"use client";

import { ArticleList } from "@/components/article-list";
import { Suspense } from "react";

export default function ArchivePage() {
  return (
    <div className="p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Archive</h1>
        <Suspense fallback={<div>Loading archive...</div>}>
          <ArticleList view="archive" />
        </Suspense>
      </div>
    </div>
  );
}