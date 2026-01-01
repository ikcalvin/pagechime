"use client";

import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/utils/api";
import { useRouter } from "next/navigation";

interface AddArticleDialogProps {
  children?: React.ReactNode;
}

export function AddArticleDialog({ children }: AddArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      setIsLoading(true);
      await api.post("/articles", { url });
      toast.success("Article added", {
        description: "Your article has been queued for processing.",
      });
      setUrl("");
      setOpen(false); // Close dialog on success
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: "Failed to add article. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Article</DialogTitle>
          <DialogDescription>
            Enter a URL to save and listen to later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full"
          />
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Article"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
