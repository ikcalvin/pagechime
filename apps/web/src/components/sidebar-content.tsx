"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Archive, Folder, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreateCollectionDialog,
  Collection,
} from "@/components/create-collection-dialog";
import { useCollections } from "@/context/collection-context";
import { useTags } from "@/hooks/use-tags";
import { ThemeToggle } from "@/components/theme-toggle";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Newspaper, label: "Newsletters", href: "/newsletters" },
  { icon: Archive, label: "Archive", href: "/archive" },
];

interface SidebarContentProps {
  className?: string;
  onNavigate?: () => void;
}

export function SidebarContent({ className, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const { collections } = useCollections();
  const { tags } = useTags();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCollectionCreated = (_: Collection) => {
    // Context handles state update
  };

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <nav className="flex flex-col gap-1">
        {sidebarItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              passHref
              onClick={handleLinkClick}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3 text-base font-medium rounded-xl h-10",
                  active
                    ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A] font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}

        <div className="pt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Collections
          </h3>
          <div className="flex flex-col gap-0.5">
            {collections.map((collection) => {
              const href = `/collection/${collection.id}`;
              const active = pathname === href;
              return (
                <Link
                  key={collection.id}
                  href={href}
                  passHref
                  onClick={handleLinkClick}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 px-3 text-base font-medium rounded-xl h-9",
                      active
                        ? "bg-[#FFF0EB] text-[#FF6B4A] dark:bg-[#FF6B4A]/10 dark:text-[#FF6B4A] font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Folder className="h-4 w-4" />
                    <span className="truncate flex-1 text-left">
                      {collection.name}
                    </span>
                    {collection.articles?.[0]?.count ? (
                      <span className="text-xs text-muted-foreground ml-2">
                        {collection.articles[0].count}
                      </span>
                    ) : null}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Collection
            </Button>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="pt-4">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5 px-3">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  #{tag.name.replace(/^#/, "")}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto px-2">
        <ThemeToggle />
      </div>

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCollectionCreated}
      />
    </div>
  );
}
