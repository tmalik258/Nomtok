"use client";

import React, { useState, useMemo } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PaginationInfo } from "@/components/ui/pagination-info";
import { useTagsPaginated } from "@/lib/hooks/useTagsPaginated";
import { TagHeader } from "./tag-header";
import TagCreateForm from "./tag-create-form";
import { Tag } from "@/lib/types";
import { tagActions } from "@/lib/actions/tag-actions";
import DashboardLoadingSkeleton from "../../_components/dashboard-loading-skeleton";
import Link from "next/link";

export function TagManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at">("name");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const {
    tags,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    goToPage,
    setSearchQuery,
    refetch,
  } = useTagsPaginated({
    name: searchTerm,
    limit: 20,
  });

  // Filter and sort tags on the client side for now
  // In the future, this could be moved to the backend
  const filteredAndSortedTags = useMemo(() => {
    let filtered = tags;

    if (searchTerm) {
      filtered = tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [tags, searchTerm, sortBy]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSearchQuery(term);
  };

  const handleSort = (sort: "name" | "created_at") => {
    setSortBy(sort);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
  };

  const handleDelete = (tag: Tag) => {
    setDeletingTag(tag);
  };

  const handleCreateSuccess = () => {
    setIsCreateFormOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setEditingTag(null);
    refetch();
  };

  const handleDeleteSuccess = async () => {
    if (!deletingTag) return;

    try {
      await tagActions.deleteTag(deletingTag.id);
      setDeletingTag(null);
      refetch();
    } catch (error) {
      console.error("Error deleting tag:", error);
      // You could add a toast notification here for better UX
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading tags: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <TagHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        sortBy={sortBy}
        onSortChange={handleSort}
        onCreateClick={() => setIsCreateFormOpen(true)}
      />

      {loading ? (
        <DashboardLoadingSkeleton variant="management" />
      ) : (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">
              Showing {filteredAndSortedTags.length} of {total || 0} tags
              {searchTerm && " (filtered)"} (Page {page} of {totalPages})
            </p>
          </div>
          {/* Tag Table */}
          {filteredAndSortedTags.length === 0 ? (
            <Card className="glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p className="text-lg font-medium">
                  {tags?.length === 0
                    ? "No tags found."
                    : "No tags match your current search."}
                </p>
                {searchTerm && (
                  <p className="text-sm mt-2 text-orange-500">
                    Try adjusting your search terms.
                  </p>
                )}
                {tags?.length === 0 && (
                  <Button
                    onClick={() => setIsCreateFormOpen(true)}
                    className="mt-4 cursor-pointer bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tag
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
                <CardContent className="p-0">
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
                            <TableHead className="font-semibold text-foreground">
                              Name
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                              Created
                            </TableHead>
                            <TableHead className="text-right font-semibold text-foreground">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedTags.map((tag) => (
                            <TableRow
                              key={tag.id}
                              className="border-orange-500/20 hover:bg-orange-500/5"
                            >
                              <TableCell className="py-3 px-4">
                                <Link
                                  href={`/dashboard/tags/${tag.id}`}
                                  className="font-medium text-orange-600 hover:text-orange-800 cursor-pointer"
                                >
                                  {tag.name}
                                </Link>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-muted-foreground">
                                {new Date(tag.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(tag)}
                                    className="cursor-pointer border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(tag)}
                                    className="cursor-pointer text-red-600 hover:text-red-800 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* <div className="flex items-center justify-end pt-4">
                <CustomPagination
                  currentPage={page}
                  itemsPerPage={limit}
                  totalItems={total}
                  onPageChange={goToPage}
                  onItemsPerPageChange={(newLimit) => {
                    setLimit(newLimit);
                    goToPage(1);
                  }}
                />
              </div> */}
              <div className="flex items-center justify-between pt-4">
                <PaginationInfo
                  currentPage={page}
                  itemsPerPage={limit}
                  totalItems={total}
                />
                <div className="flex items-center gap-4">
                  <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Create Tag Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent
          className="sm:max-w-[425px] backdrop-blur-sm bg-cream/95 dark:bg-gray-900/95 border border-white/20"
          aria-describedby="create-tag-description"
        >
          <DialogHeader>
            <DialogTitle
              id="create-tag-title"
              className="text-gray-900 dark:text-gray-100"
            >
              Create New Tag
            </DialogTitle>
            <DialogDescription
              id="create-tag-description"
              className="text-gray-600 dark:text-gray-400"
            >
              Fill in the details below to create a new tag.
            </DialogDescription>
          </DialogHeader>
          <TagCreateForm mode="create" onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      >
        <DialogContent
          className="sm:max-w-[425px] backdrop-blur-sm bg-cream/95 dark:bg-gray-900/95 border border-white/20"
          aria-describedby="edit-tag-description"
        >
          <DialogHeader>
            <DialogTitle
              id="edit-tag-title"
              className="text-gray-900 dark:text-gray-100"
            >
              Edit Tag
            </DialogTitle>
            <DialogDescription
              id="edit-tag-description"
              className="text-gray-600 dark:text-gray-400"
            >
              Update the tag details below.
            </DialogDescription>
          </DialogHeader>
          {editingTag && (
            <TagCreateForm
              mode="edit"
              tag={editingTag}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Tag Dialog */}
      <Dialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && setDeletingTag(null)}
      >
        <DialogContent
          className="sm:max-w-[425px] backdrop-blur-sm bg-cream/95 dark:bg-gray-900/95 border border-white/20"
          aria-describedby="delete-tag-description"
        >
          <DialogHeader>
            <DialogTitle
              id="delete-tag-title"
              className="text-gray-900 dark:text-gray-100"
            >
              Delete Tag
            </DialogTitle>
            <DialogDescription
              id="delete-tag-description"
              className="text-gray-600 dark:text-gray-400"
            >
              Are you sure you want to delete the tag &quot;{deletingTag?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingTag(null)}
              aria-label="Cancel tag deletion"
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSuccess}
              aria-label={`Delete tag ${deletingTag?.name}`}
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-cream"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
