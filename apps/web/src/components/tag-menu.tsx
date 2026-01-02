"use client";

import React, { useState } from "react";
import { Tag as TagIcon, Plus, Check } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(newTag.toLowerCase())
  );

  const exactMatch = availableTags.find(
    (tag) => tag.name.toLowerCase() === newTag.toLowerCase()
  );

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
        <DropdownMenuSubContent className="p-0" sideOffset={4}>
          <Command shouldFilter={false} className="w-64">
            <CommandInput
              placeholder="Filter or create tag..."
              value={newTag}
              onValueChange={setNewTag}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (
                    !exactMatch &&
                    newTag.trim() &&
                    filteredTags.length === 0
                  ) {
                    e.preventDefault();
                    createTag(newTag);
                    setNewTag("");
                  }
                }
              }}
            />
            <CommandList>
              {filteredTags.length === 0 && !newTag.trim() && (
                <CommandEmpty>No tags found.</CommandEmpty>
              )}

              <CommandGroup
                heading={filteredTags.length > 0 ? "Available tags" : undefined}
              >
                {filteredTags.map((tag) => {
                  const isSelected = tags.some((t) => t.id === tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleToggleTag(tag)}
                    >
                      {tag.name}
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {newTag.trim() && !exactMatch && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value={`create-${newTag}`}
                      onSelect={() => {
                        createTag(newTag);
                        setNewTag("");
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Create tag: "{newTag}"
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
