"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Newspaper,
  Archive,
  Folder,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreateCollectionDialog,
  Collection,
} from "@/components/create-collection-dialog";
import { useCollections } from "@/context/collection-context";
import { useTags } from "@/hooks/use-tags";
import { ThemeToggle } from "@/components/theme-toggle";

// Color dots for collections — cycles through these
const COLLECTION_COLORS = [
  "bg-[#FF6B4A]",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
];

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Newspaper, label: "Newsletters", href: "/newsletters" },
  { icon: Archive, label: "Archive", href: "/archive" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collections } = useCollections();
  const { tags } = useTags();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const handleCollectionCreated = (_: Collection) => {
    // Context handles state update
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Collapsed sidebar — icons only
  if (collapsed) {
    return (
      <aside className="hidden lg:flex w-16 shrink-0 border-r bg-background h-screen sticky top-0 flex-col items-center py-4 gap-1">
        {/* Expand button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 mb-4 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        {/* Nav icons */}
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl",
                  active
                    ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A]"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings */}
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-xl",
              isActive("/settings")
                ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A]"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </Link>

        <div className="py-1">
          <ThemeToggle />
        </div>
      </aside>
    );
  }

  // Full sidebar
  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 border-r bg-background h-screen sticky top-0 flex-col">
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-5 h-14 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#FF6B4A] flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">
            PageChime
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(true)}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {/* Primary nav */}
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </div>

        {/* Collections */}
        <div className="mt-6">
          <button
            onClick={() => setCollectionsOpen(!collectionsOpen)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {collectionsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Collections
          </button>

          {collectionsOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              {collections.map((collection, index) => {
                const href = `/collection/${collection.id}`;
                const active = pathname === href;
                const colorClass =
                  COLLECTION_COLORS[index % COLLECTION_COLORS.length];
                return (
                  <Link key={collection.id} href={href}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors",
                        active
                          ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0",
                          colorClass
                        )}
                      />
                      <span className="truncate flex-1 text-left">
                        {collection.name}
                      </span>
                      {collection.articles?.[0]?.count ? (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {collection.articles[0].count}
                        </span>
                      ) : null}
                    </button>
                  </Link>
                );
              })}

              <button
                onClick={() => setCreateDialogOpen(true)}
                className="w-full flex items-center gap-3 px-3 h-9 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Create Collection</span>
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setTagsOpen(!tagsOpen)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              {tagsOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Tags
            </button>

            {tagsOpen && (
              <div className="mt-1 flex flex-wrap gap-1.5 px-3">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    #{tag.name.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t px-3 py-3 flex flex-col gap-1">
        <Link href="/settings">
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors",
              isActive("/settings")
                ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            Settings
          </button>
        </Link>

        <div className="flex items-center justify-between px-3 py-1">
          <ThemeToggle />
        </div>
      </div>

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCollectionCreated}
      />
    </aside>
  );
}
