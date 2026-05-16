"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArticleList } from "@/components/article-list";

import { Button } from "@/components/ui/button";
import { Folder, MoreHorizontal, Trash2, Edit } from "lucide-react";
import api from "@/utils/api";
import { useCollections } from "@/context/collection-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
}

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (id) fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    try {
      const res = await api.get(`/collections/${id}`);
      setCollection(res.data);
      setNewName(res.data?.name || "");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  const { updateCollection, deleteCollection } = useCollections();

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this collection? Articles will not be deleted."
      )
    )
      return;
    const success = await deleteCollection(id);
    if (success) router.push("/");
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const success = await updateCollection(id, newName);
    if (success) {
      setCollection((prev) => (prev ? { ...prev, name: newName } : null));
      toast.success("Collection renamed");
      setRenameDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[#FF6B4A]" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-lg font-semibold text-foreground">
          Collection not found
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Collection header */}
      <div className="sticky top-0 z-20 flex h-14 items-center border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Folder className="h-5 w-5 text-muted-foreground" />
          {collection.name}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Article list */}
      <div className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <ArticleList collectionId={id} />
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="grid gap-4 py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection Name"
              required
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
