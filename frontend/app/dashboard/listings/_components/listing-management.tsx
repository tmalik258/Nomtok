"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useListings } from "@/lib/hooks/useListings";
import { ListingForm } from "./listing-form";
import type { Listing } from "@/lib/types";

import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListingFilters } from "./listing-filters";
import { ListingTable } from "./listing-table";
import { toast } from "sonner";
import { listingActions } from "@/lib/actions";

export function ListingManagement() {
  const {
    listings,
    totalCount,
    loading,
    error,
    params,
    setPage,
    setLimit,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    refetch,
  } = useListings({
    page: 1,
    limit: 10,
    status: "all",
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    // Prevent re-opening if already open
    if (!id || isEditFormOpen) return;

    const existing = listings.find((l) => l.id === id);
    if (existing) {
      setSelectedListing(existing);
      setIsEditFormOpen(true);
      return;
    }

    let cancelled = false;
    // Fallback: fetch listing by id when not present in current page
    listingActions
      .getListing(id)
      .then((fetched) => {
        if (!cancelled && fetched) {
          setSelectedListing(fetched);
          setIsEditFormOpen(true);
        }
      })
      .catch(() => {
        // Ignore fetch errors here; user can open manually
      });

    return () => {
      cancelled = true;
    };
  }, [listings, searchParams, isEditFormOpen]);

  const refreshListings = () => {
    refetch();
    setIsCreateFormOpen(false);
    setIsEditFormOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedListing(null);
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setLimit(newItemsPerPage);
  };

  // Handle filter changes
  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleStatusChange = (
    status: "approved" | "rejected" | "pending" | "all"
  ) => {
    setStatusFilter(status);
  };

  const handleSortByChange = (sortBy: string) => {
    setSortBy(sortBy);
  };

  // Handle approve listing
  const handleApprove = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      // Note: This would need to be implemented in listing-actions.ts
      // await listingActions.approveListing(listingId);
      console.log("Approve listing:", listingId);
      await refetch(); // Refresh the list
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve listing"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject listing
  const handleReject = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      // Note: This would need to be implemented in listing-actions.ts
      // await listingActions.rejectListing(listingId);
      console.log("Reject listing:", listingId);
      await refetch(); // Refresh the list
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject listing"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Handle edit listing
  const handleEdit = (listingId: string) => {
    // Open modal instead of navigation
    const foundListing = listings.find((listing) => listing.id === listingId);
    setSelectedListing(foundListing || null);
    setIsEditFormOpen(true);

    if (foundListing) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("id", foundListing.id);
      router.replace(
        `${window.location.pathname}?${newSearchParams.toString()}`
      );
    }
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
    setSelectedListing(null);

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete("id");
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  // Handle delete listing
  const handleDelete = (listingId: string) => {
    const foundListing = listings.find((listing) => listing.id === listingId);
    setSelectedListing(foundListing || null);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await listingActions.deleteListing(listingId);
      toast.success("Listing deleted successfully");
      await refetch(); // Refresh the list
      setIsDeleteDialogOpen(false);
      setSelectedListing(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete listing"
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none p-0">
        <CardContent className="p-0">
          {error && (
            <Alert className="mb-4 glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-orange-500/50">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-gray-900 dark:text-white">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <ListingFilters
            onCreateClick={() => setIsCreateFormOpen(true)}
            searchTerm={params.search || ""}
            setSearchTerm={handleSearchChange}
            statusFilter={params.status || "all"}
            setStatusFilter={handleStatusChange}
            sortBy={params.sort_by || "created_at"}
            setSortBy={handleSortByChange}
          />

          <ListingTable
            listings={listings}
            loading={loading}
            actionLoading={actionLoading}
            currentPage={params.page || 1}
            totalItems={totalCount}
            itemsPerPage={params.limit || 10}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Create New Listing
            </DialogTitle>
          </DialogHeader>
          <ListingForm mode="create" onSuccess={refreshListings} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseEditForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Edit Listing
            </DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <ListingForm
              mode="edit"
              listingData={selectedListing}
              onSuccess={async () => {
                // ListingForm already performs the update in edit mode.
                await refetch();
                handleCloseEditForm();
              }}
              onDeleted={() => {
                refetch();
                handleCloseEditForm();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {selectedListing && (
        <DeleteConfirmationModal
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => handleDeleteConfirm(selectedListing.id)}
          title="Delete Listing"
          description="Are you sure you want to delete this listing? This action cannot be undone."
          isLoading={actionLoading === selectedListing.id}
        />
      )}
    </div>
  );
}
