"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";
import { listingActions } from "@/lib/actions/listing-actions";
import { toast } from "sonner";

interface UseListingCardProps {
  listing: Listing;
  onDeleted?: () => void;
  onUpdate?: () => void;
}

export function useListingCard({ listing, onDeleted, onUpdate }: UseListingCardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [approved, setApproved] = useState<boolean>(!!listing.approved);
  const [isApprovalLoading, setIsApprovalLoading] = useState(false);
  const router = useRouter();

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleListingIdClick = () => {
    router.push(`/dashboard/listings?id=${listing.id}`);
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    // The form will handle the refresh via router.refresh()
  };

  const formatTimestamp = (timestamp?: number) => {
    if (timestamp === 0) return "00:00";

    if (!timestamp) return null;
    
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = timestamp % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openDeleteDialog = () => setIsDeleteOpen(true);
  const closeDeleteDialog = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await listingActions.deleteListing(listing.id);
      toast.success("Listing deleted successfully");
      setIsDeleteOpen(false);
      setIsEditMode(false);
      if (onDeleted) onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  const approveListing = async () => {
    if (isApprovalLoading) return;
    setIsApprovalLoading(true);
    // Optimistic update
    setApproved(true);
    try {
      const data = await listingActions.approveListing(listing.id);
      setApproved(!!data.approved);
      toast.success("Listing approved", {
        description: data.message || "The listing has been approved.",
      });
      onUpdate?.();
      router.refresh();
    } catch (error: unknown) {
      // Revert optimistic update
      setApproved(false);
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to approve listing";
      toast.error(message);
    } finally {
      setIsApprovalLoading(false);
    }
  };

  const disapproveListing = async () => {
    if (isApprovalLoading) return;
    setIsApprovalLoading(true);
    // Optimistic update
    setApproved(false);
    try {
      const data = await listingActions.disapproveListing(listing.id);
      setApproved(!!data.approved);
      toast.success("Listing disapproved", {
        description: data.message || "The listing has been disapproved.",
      });
      onUpdate?.();
      router.refresh();
    } catch (error: unknown) {
      // Revert optimistic update
      setApproved(true);
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to disapprove listing";
      toast.error(message);
    } finally {
      setIsApprovalLoading(false);
    }
  };

  return {
    isEditMode,
    toggleEditMode,
    handleListingIdClick,
    handleEditSuccess,
    formatTimestamp,
    isDeleteOpen,
    isDeleting,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirm,
    approved,
    isApprovalLoading,
    approveListing,
    disapproveListing,
  };
}