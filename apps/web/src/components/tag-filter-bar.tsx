"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import api from "@/utils/api";

type Tag = {
  id: string;
  name: string;
};

export function TagFilterBar() {
  const [tags, setTags] = useState<Tag[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = searchParams.get("search") || "";
  const activeTag = tags.find((tag) => currentSearch === tag.name)?.name || "";

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get("/tags");
        setTags(response.data || []);
      } catch (error) {
        console.error("Failed to fetch tags", error);
      }
    };

    fetchTags();
  }, []);

  const handleTagClick = (tagName: string) => {
    const params = new URLSearchParams(searchParams);
    if (activeTag === tagName) {
      // Toggle off if already selected (simple check if search string matches tag name exactly roughly)
      params.delete("search");
    } else {
      params.set("search", tagName);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  if (tags.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.name)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
              activeTag === tag.name
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            )}
          >
            #{tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
