"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Folder,
  FileText,
  Headphones,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import api from "@/utils/api";
import { useCollections } from "@/context/collection-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CollectionWithStats = {
  id: string;
  name: string;
  article_count: number;
  color?: string;
};

type OverviewStats = {
  total_articles: number;
  total_newsletters: number;
  total_listen_minutes: number;
};

// ---------------------------------------------------------------------------
// Color palette for collection cards
// ---------------------------------------------------------------------------

const collectionColors = [
  { name: "Coral", value: "#FF6B4A", gradient: "from-[#FF6B4A] to-[#FF8F73]" },
  { name: "Sky", value: "#38BDF8", gradient: "from-[#38BDF8] to-[#7DD3FC]" },
  { name: "Emerald", value: "#34D399", gradient: "from-[#34D399] to-[#6EE7B7]" },
  { name: "Violet", value: "#A78BFA", gradient: "from-[#A78BFA] to-[#C4B5FD]" },
  { name: "Amber", value: "#FBBF24", gradient: "from-[#FBBF24] to-[#FCD34D]" },
  { name: "Rose", value: "#FB7185", gradient: "from-[#FB7185] to-[#FDA4AF]" },
  { name: "Teal", value: "#2DD4BF", gradient: "from-[#2DD4BF] to-[#5EEAD4]" },
  { name: "Indigo", value: "#818CF8", gradient: "from-[#818CF8] to-[#A5B4FC]" },
];

function getColorForCollection(
  collection: CollectionWithStats,
  index: number
): (typeof collectionColors)[number] {
  if (collection.color) {
    const match = collectionColors.find((c) => c.value === collection.color);
    if (match) return match;
  }
  return collectionColors[index % collectionColors.length];
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6B4A]/10">
        <Icon className="h-5 w-5 text-[#FF6B4A]" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collection Card
// ---------------------------------------------------------------------------

function CollectionCard({
  collection,
  colorInfo,
  onNavigate,
  onRename,
  onDelete,
}: {
  collection: CollectionWithStats;
  colorInfo: (typeof collectionColors)[number];
  onNavigate: (id: string) => void;
  onRename: (collection: CollectionWithStats) => void;
  onDelete: (collection: CollectionWithStats) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(collection.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(collection.id);
        }
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Colored gradient top */}
      <div
        className={cn(
          "h-24 bg-gradient-to-br flex items-center justify-center relative",
          colorInfo.gradient
        )}
      >
        <Folder className="h-10 w-10 text-white/80" />

        {/* Overflow menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(collection);
                }}
              >
                <Edit className="h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(collection);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card bottom */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">
          {collection.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {collection.article_count}{" "}
          {collection.article_count === 1 ? "article" : "articles"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Collection Card (dashed border)
// ---------------------------------------------------------------------------

function NewCollectionCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-[#FF6B4A]/40 hover:bg-[#FF6B4A]/5 transition-colors cursor-pointer min-h-[160px] group"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-[#FF6B4A]/10 transition-colors">
        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-[#FF6B4A] transition-colors" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        New Collection
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Color Picker
// ---------------------------------------------------------------------------

function ColorPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {collectionColors.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onSelect(color.value)}
          className={cn(
            "h-8 w-8 rounded-full transition-all",
            selected === color.value
              ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
              : "hover:scale-110"
          )}
          style={{ backgroundColor: color.value }}
          aria-label={color.name}
          title={color.name}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CollectionsGrid() {
  const router = useRouter();
  const { addCollection, updateCollection, deleteCollection, collections: contextCollections, loading: contextLoading } =
    useCollections();

  // Data
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [stats, setStats] = useState<OverviewStats>({
    total_articles: 0,
    total_newsletters: 0,
    total_listen_minutes: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<CollectionWithStats | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(collectionColors[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch data
  // -------------------------------------------------------------------------

  // Sync collections from context into local state with article_count mapping
  useEffect(() => {
    if (!contextLoading) {
      setCollections(
        contextCollections.map((c) => ({
          id: c.id,
          name: c.name,
          article_count: c.articles?.[0]?.count ?? 0,
          color: undefined,
        }))
      );
      setLoading(false);
    }
  }, [contextCollections, contextLoading]);

  // Fetch stats separately (may not exist yet)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/articles/stats");
        const data = res.data;
        setStats({
          total_articles: data?.total_articles ?? 0,
          total_newsletters: data?.total_newsletters ?? 0,
          total_listen_minutes: data?.total_listen_minutes ?? 0,
        });
      } catch {
        // Endpoint may not exist yet
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleNavigate = useCallback(
    (id: string) => {
      router.push(`/collection/${id}`);
    },
    [router]
  );

  const handleOpenCreate = useCallback(() => {
    setFormName("");
    setFormColor(collectionColors[0].value);
    setCreateDialogOpen(true);
  }, []);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName.trim() || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const result = await addCollection(formName.trim());
        if (result) {
          // Optimistically add to the grid
          setCollections((prev) => [
            ...prev,
            {
              id: result.id,
              name: formName.trim(),
              article_count: 0,
              color: formColor,
            },
          ]);
          setCreateDialogOpen(false);
        }
      } catch {
        // Error handled by context
      } finally {
        setIsSubmitting(false);
      }
    },
    [formName, formColor, isSubmitting, addCollection]
  );

  const handleOpenRename = useCallback((collection: CollectionWithStats) => {
    setEditingCollection(collection);
    setFormName(collection.name);
    setRenameDialogOpen(true);
  }, []);

  const handleRename = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCollection || !formName.trim() || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const success = await updateCollection(
          editingCollection.id,
          formName.trim()
        );
        if (success) {
          setCollections((prev) =>
            prev.map((c) =>
              c.id === editingCollection.id
                ? { ...c, name: formName.trim() }
                : c
            )
          );
          setRenameDialogOpen(false);
        }
      } catch {
        // Error handled by context
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingCollection, formName, isSubmitting, updateCollection]
  );

  const handleDelete = useCallback(
    async (collection: CollectionWithStats) => {
      const confirmed = window.confirm(
        `Delete "${collection.name}"? Articles in this collection will not be deleted.`
      );
      if (!confirmed) return;
      const success = await deleteCollection(collection.id);
      if (success) {
        setCollections((prev) => prev.filter((c) => c.id !== collection.id));
      }
    },
    [deleteCollection]
  );

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[#FF6B4A]" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize your articles into collections
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={FileText}
          label="Total Articles"
          value={stats.total_articles}
        />
        <StatCard
          icon={Headphones}
          label="Newsletters"
          value={stats.total_newsletters}
        />
        <StatCard
          icon={Clock}
          label="Listen Time"
          value={
            stats.total_listen_minutes > 0
              ? `${stats.total_listen_minutes}m`
              : "—"
          }
        />
      </div>

      {/* Collection grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Your Collections ({collections.length})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((collection, index) => {
            const colorInfo = getColorForCollection(collection, index);
            return (
              <CollectionCard
                key={collection.id}
                collection={collection}
                colorInfo={colorInfo}
                onNavigate={handleNavigate}
                onRename={handleOpenRename}
                onDelete={handleDelete}
              />
            );
          })}
          <NewCollectionCard onClick={handleOpenCreate} />
        </div>
      </div>

      {/* Create Collection Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            <div className="space-y-2">
              <label
                htmlFor="collection-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <Input
                id="collection-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Design Inspiration"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Color
              </label>
              <ColorPicker selected={formColor} onSelect={setFormColor} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formName.trim() || isSubmitting}
                className="bg-[#FF6B4A] text-white hover:bg-[#FF6B4A]/90"
              >
                {isSubmitting ? "Creating..." : "Create Collection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Collection Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 pt-2">
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Collection Name"
              required
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formName.trim() || isSubmitting}
                className="bg-[#FF6B4A] text-white hover:bg-[#FF6B4A]/90"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
