"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAdminBlog } from "@/lib/hooks";
import { BlogCategory } from "@/lib/types";

interface EditCategoryModalProps {
  category: BlogCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCategoryModal({
  category,
  isOpen,
  onClose,
  onSuccess,
}: EditCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const { updateCategory, loading } = useAdminBlog();

  useEffect(() => {
    if (category && isOpen) {
      setCategoryName(category.name);
    } else {
      setCategoryName("");
    }
  }, [category, isOpen]);

  const handleUpdate = async () => {
    if (!category || !categoryName.trim()) return;

    try {
      await updateCategory(category.id, {
        name: categoryName.trim(),
      });
      setCategoryName("");
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Failed to update category:", error);
      // Error is already handled by the hook
    }
  };

  const handleClose = () => {
    setCategoryName("");
    onClose();
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category name.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUpdate();
              }
            }}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading || !categoryName.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
