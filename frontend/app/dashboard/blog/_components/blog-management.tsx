"use client";

import { useState, useMemo, useCallback } from "react";
import { BlogPost } from "@/lib/types";
import { useBlogsPaginated, useAdminBlog } from "@/lib/hooks";
import { BlogFilters } from "./blog-filters";
import { BlogEmptyState } from "./blog-empty-state";
import { BlogTable } from "./blog-table";
import { BlogPagination } from "./blog-pagination";
import ErrorCard from "@/components/error-card";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { CreateBlogModal } from "./create-blog-modal";
import { EditBlogModal } from "./edit-blog-modal";
import { toast } from "sonner";
import { BlogLoading } from "./blog-loading";

export function BlogManagement() {
  const {
    blogs,
    total,
    page,
    totalPages,
    loading,
    error,
    goToPage,
    refetch,
    setSearchQuery,
    setPublishedFilter,
    setFeaturedFilter,
    setSortBy,
    setSortOrder,
    params,
  } = useBlogsPaginated({ limit: 10 });

  const { deleteBlog, loading: deleteLoading } = useAdminBlog();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [blogToEdit, setBlogToEdit] = useState<BlogPost | null>(null);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleEdit = useCallback((blog: BlogPost) => {
    setBlogToEdit(blog);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBlogToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!blogToDelete) return;

    try {
      await deleteBlog(blogToDelete);
      toast.success("Blog post deleted successfully");
      setDeleteModalOpen(false);
      setBlogToDelete(null);
      refetch();
    } catch (error) {
      console.log("Failed to delete blog post:", error);
      toast.error("Failed to delete blog post");
    }
  }, [blogToDelete, deleteBlog, refetch]);

  const handleAddNew = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setCreateModalOpen(false);
    // Use setTimeout to ensure refetch happens after modal closes
    setTimeout(() => {
      refetch();
    }, 100);
    toast.success("Blog post created successfully");
  }, [refetch]);

  const handleEditSuccess = useCallback(() => {
    setEditModalOpen(false);
    setBlogToEdit(null);
    refetch();
    toast.success("Blog post updated successfully");
  }, [refetch]);

  const handlePublishedChange = useCallback((value: boolean | undefined) => {
    setPublishedFilter(value);
  }, [setPublishedFilter]);

  const handleFeaturedChange = useCallback((value: boolean | undefined) => {
    setFeaturedFilter(value);
  }, [setFeaturedFilter]);

  const handleSortByChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, [setSortBy]);

  const handleSortOrderChange = useCallback((order: "asc" | "desc") => {
    setSortOrder(order);
  }, [setSortOrder]);

  // Memoized filter props to prevent unnecessary re-renders of BlogFilters
  const filterProps = useMemo(() => ({
    searchTerm: params.search || "",
    isPublished: params.is_published,
    isFeatured: params.is_featured,
    sortBy: params.sort_by || "created_at",
    sortOrder: params.sort_order || "desc",
    onSearchChange: handleSearch,
    onPublishedChange: handlePublishedChange,
    onFeaturedChange: handleFeaturedChange,
    onSortByChange: handleSortByChange,
    onSortOrderChange: handleSortOrderChange,
    onAddNew: handleAddNew,
  }), [
    params.search,
    params.is_published,
    params.is_featured,
    params.sort_by,
    params.sort_order,
    handleSearch,
    handlePublishedChange,
    handleFeaturedChange,
    handleSortByChange,
    handleSortOrderChange,
    handleAddNew,
  ]);

  // Show table loading only when blogs are loading
  if (loading && blogs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Show filters with their own loading states */}
        <BlogFilters {...filterProps} />
        
        {/* Show table loading */}
        <BlogLoading count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorCard
        title="Failed to Load Blog Posts"
        message="We're having trouble loading your blog data. Please check your connection and try again."
        error={error}
        onRefresh={() => refetch()}
        showRefreshButton={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions with separate loading states */}
      <BlogFilters {...filterProps} />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Showing {blogs.length} of {total} blog posts (Page {page} of {totalPages})
        </p>
      </div>

      <BlogEmptyState hasBlogs={blogs.length > 0} />

      {blogs.length > 0 && (
        <BlogTable
          blogs={blogs}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {totalPages > 1 && (
        <BlogPagination
          currentPage={page}
          totalPages={totalPages}
          totalBlogs={total}
          onPageChange={goToPage}
        />
      )}

      <CreateBlogModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Blog Post"
        description="Are you sure you want to delete this blog post? This action cannot be undone."
        isLoading={deleteLoading}
      />

      <EditBlogModal
        blog={blogToEdit}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setBlogToEdit(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
