"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setTerm(value);

    // Simple debounce
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
        }
        router.push(`?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search articles, tags, or collections..."
        className="w-full bg-background pl-9"
        value={term}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
