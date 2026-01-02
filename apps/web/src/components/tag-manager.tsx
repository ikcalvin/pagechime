"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import api from "@/utils/api";

export type Tag = {
  id: string;
  name: string;
};

export function useArticleTags(
  articleId: string,
  initialTags: Tag[] = [],
  onTagsChange?: (tags: Tag[]) => void
) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const fetchAvailableTags = useCallback(async () => {
    try {
      const response = await api.get("/tags");
      setAvailableTags(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  }, []);

  const addTag = async (tag: Tag) => {
    // Optimistic update
    if (tags.some((t) => t.id === tag.id)) return;
    const newTags = [...tags, tag];
    setTags(newTags);
    if (onTagsChange) onTagsChange(newTags);

    try {
      await api.post(`/articles/${articleId}/tags`, { tagId: tag.id });
    } catch (error) {
      console.error("Failed to add tag", error);
      // Revert
      setTags(tags);
    }
  };

  const createTag = async (tagName: string) => {
    if (!tagName.trim()) return;
    try {
      // Create tag first
      const createRes = await api.post("/tags", { name: tagName.trim() });
      const createdTag = createRes.data;

      // Then add to article
      await addTag(createdTag);
      fetchAvailableTags(); // Refresh available list
    } catch (error) {
      console.error("Failed to create tag", error);
    }
  };

  const removeTag = async (tagId: string) => {
    const newTags = tags.filter((t) => t.id !== tagId);
    setTags(newTags);
    if (onTagsChange) onTagsChange(newTags);

    try {
      await api.delete(`/articles/${articleId}/tags/${tagId}`);
    } catch (error) {
      console.error("Failed to remove tag", error);
      setTags(tags);
    }
  };

  return {
    tags,
    availableTags,
    fetchAvailableTags,
    addTag,
    createTag,
    removeTag,
  };
}

type TagManagerProps = {
  articleId: string;
  initialTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  showAddButton?: boolean;
};

export function TagManager({
  articleId,
  initialTags = [],
  onTagsChange,
  showAddButton = true,
}: TagManagerProps) {
  const {
    tags,
    availableTags,
    fetchAvailableTags,
    addTag,
    createTag,
    removeTag,
  } = useArticleTags(articleId, initialTags, onTagsChange);

  const [newTag, setNewTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="outline" className="pl-2 pr-1 h-6">
          {tag.name}
          <div
            className="ml-1 hover:bg-muted rounded-full p-0.5 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // prevent card click
              removeTag(tag.id);
            }}
          >
            <X className="h-3 w-3" />
          </div>
        </Badge>
      ))}

      {showAddButton && (
        <Popover
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (open) fetchAvailableTags();
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="New tag..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createTag(newTag);
                      setNewTag("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    createTag(newTag);
                    setNewTag("");
                  }}
                  className="h-8"
                >
                  Add
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  Select existing:
                </div>
                {availableTags
                  .filter((at) => !tags.some((t) => t.id === at.id))
                  .map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-sm"
                      onClick={() => addTag(tag)}
                    >
                      <TagIcon className="h-3 w-3 text-muted-foreground" />
                      {tag.name}
                    </div>
                  ))}
                {availableTags.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    No existing tags
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
