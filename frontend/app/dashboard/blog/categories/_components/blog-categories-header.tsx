"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BlogCategoriesHeaderProps {
  onAddNew: () => void;
}

export function BlogCategoriesHeader({ onAddNew }: BlogCategoriesHeaderProps) {
  return (
    <div className="flex justify-end">
      <Button
        onClick={onAddNew}
        className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Category
      </Button>
    </div>
  );
}
