"use client";

import { useState, useCallback } from "react";
import { useAdminBlog } from "@/lib/hooks";
import { useBlogCategories } from "@/lib/hooks/useBlogCategories";
import { BlogCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ErrorCard from "@/components/error-card";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { BlogCategoriesHeader } from "./blog-categories-header";
import { BlogCategoriesTable } from "./blog-categories-table";
import { CreateCategoryModal } from "./create-category-modal";
import { EditCategoryModal } from "./edit-category-modal";
import { BlogCategoriesLoading } from "./blog-categories-loading";

export function BlogCategoriesManagement() {
  const { categories, loading, error, refetch } = useBlogCategories();
  const { deleteCategory, loading: mutationLoading } = useAdminBlog();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<BlogCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleEdit = useCallback((category: BlogCategory) => {
    setCategoryToEdit(category);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setCategoryToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete category:", error);
      // Error is already handled by the hook
    }
  }, [categoryToDelete, deleteCategory, refetch]);

  const handleCreateSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEditSuccess = useCallback(() => {
    setCategoryToEdit(null);
    refetch();
  }, [refetch]);

  if (loading) {
    return <BlogCategoriesLoading count={6} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <ErrorCard
            title="Failed to Load Categories"
            message="We're having trouble loading your categories. Please check your connection and try again."
            error={error}
            onRefresh={refetch}
            showRefreshButton={true}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BlogCategoriesHeader onAddNew={() => setCreateModalOpen(true)} />

      <BlogCategoriesTable
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateCategoryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCategoryModal
        category={categoryToEdit}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSuccess={handleEditSuccess}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        isLoading={mutationLoading}
      />
    </div>
  );
}
