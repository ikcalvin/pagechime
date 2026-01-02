"use client";

import React, { useState } from "react";
import { Tag as TagIcon, Plus, Check } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useArticleTags, Tag } from "./tag-manager";

type TagMenuProps = {
  articleId: string;
  initialTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
};

export function TagMenu({
  articleId,
  initialTags = [],
  onTagsChange,
}: TagMenuProps) {
  const {
    tags,
    availableTags,
    fetchAvailableTags,
    addTag,
    createTag,
    removeTag,
  } = useArticleTags(articleId, initialTags, onTagsChange);

  const [newTag, setNewTag] = useState("");

  const handleToggleTag = (tag: Tag) => {
    const isSelected = tags.some((t) => t.id === tag.id);
    if (isSelected) {
      removeTag(tag.id);
    } else {
      addTag(tag);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        onMouseEnter={() => {
          fetchAvailableTags();
        }}
      >
        <TagIcon className="mr-2 h-4 w-4" />
        Tags
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-64 p-2">
          <div className="flex gap-2 mb-2 p-1">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="New tag..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  createTag(newTag);
                  setNewTag("");
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                createTag(newTag);
                setNewTag("");
              }}
              className="h-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <DropdownMenuSeparator />

          <div className="max-h-64 overflow-y-auto">
            <div className="text-xs text-muted-foreground font-medium px-2 py-1.5">
              Available tags
            </div>
            {availableTags.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-1.5">
                No tags found
              </div>
            )}

            {availableTags.map((tag) => {
              const isSelected = tags.some((t) => t.id === tag.id);
              return (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={(e) => {
                    e.preventDefault(); // Keep menu open
                    handleToggleTag(tag);
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{tag.name}</span>
                  {isSelected && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
