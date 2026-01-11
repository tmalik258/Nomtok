"use client";

import { BlogCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlogCategoryFilterProps {
  categories: BlogCategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function BlogCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: BlogCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Button
        variant={selectedCategory === "" ? "default" : "outline"}
        onClick={() => onCategoryChange("all")}
        className={cn(
          "cursor-pointer",
          selectedCategory === "" && "bg-orange-500 hover:bg-orange-600 text-white"
        )}
      >
        All Posts
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.slug ? "default" : "outline"}
          onClick={() => onCategoryChange(category.slug)}
          className={cn(
            "cursor-pointer",
            selectedCategory === category.slug && "bg-orange-500 hover:bg-orange-600 text-white"
          )}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}
