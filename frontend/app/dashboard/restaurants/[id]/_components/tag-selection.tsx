"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { useTags } from "@/lib/hooks/useTags";

interface TagSelectionProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagSelection({
  selectedTagIds,
  onTagsChange,
}: TagSelectionProps) {
  const { tags: allTags, loading: isLoading, fetchAllTags } = useTags();

  useEffect(() => {
    if (allTags.length === 0) {
      fetchAllTags();
    }
  }, [allTags.length, fetchAllTags]);

  const isTagSelected = (tag: Tag) => {
    return selectedTagIds.includes(tag.id);
  };

  const handleTagToggle = (tag: Tag) => {
    if (isTagSelected(tag)) {
      // Remove tag
      const updatedTagIds = selectedTagIds.filter((tagId) => tagId !== tag.id);
      onTagsChange(updatedTagIds);
    } else {
      // Add tag
      const updatedTagIds = [...selectedTagIds, tag.id];
      onTagsChange(updatedTagIds);
    }
  };

  // const handleRemoveTag = (tagToRemove: Tag) => {
  //   const updatedTagIds = selectedTagIds.filter(
  //     (tagId) => tagId !== tagToRemove.id
  //   );
  //   onTagsChange(updatedTagIds);
  // };

  return (
    <div className="space-y-4">
      {/* Available Tags */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags?.map((tag) => {
              const isSelected = isTagSelected(tag);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? "secondary" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-orange-500 text-cream hover:bg-orange-600"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag.name || ""}
                  {isSelected ? (
                    <X className="ml-1 h-3 w-3" />
                  ) : (
                    <Plus className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
