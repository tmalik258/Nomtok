"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { AsyncSearchableSelect } from "./async-searchable-select";
import { Switch } from "@/components/ui/switch";
import { ReviewSectionsForm } from "./review-sections-form";
import {
  fetchFunctions,
  EntityType,
} from "@/lib/utils/fetch-functions";
import { useListingForm } from "@/lib/hooks/useListingForm";
import { Listing } from "@/lib/types";
import { CreateListingFormData, EditListingFormData } from "@/lib/validations/listing-create";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { useState } from "react";
import { listingActions } from "@/lib/actions/listing-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ListingFormProps {
  mode: 'create' | 'edit';
  listingData?: Listing;
  onSuccess?: (data: CreateListingFormData | EditListingFormData) => void;
  onDeleted?: () => void;
  className?: string;
}

/**
 * Listing form component that supports both creation and editing of listings.
 * 
 * @param mode - Determines the operation mode ('create' or 'edit')
 * @param listingData - Existing listing data for edit mode (required when mode is 'edit')
 * @param onSuccess - Optional callback function called after successful form submission
 */
export function ListingForm({ mode, listingData, onSuccess, onDeleted, className = 'max-h-[80vh] overflow-y-auto pr-2' }: ListingFormProps) {
  const { form, isLoading, handleSubmit, handleReset } = useListingForm({
    mode,
    listingData,
    onSuccess,
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = () => setIsDeleteOpen(true);
  const closeDeleteDialog = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = async () => {
    if (!listingData || !listingData.id) return;
    try {
      setIsDeleting(true);
      await listingActions.deleteListing(listingData.id);
      toast.success("Listing deleted successfully");
      setIsDeleteOpen(false);
      if (onDeleted) onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  console.log("listing data: ", listingData)

  return (
    <div className={cn(className)}>
      <div className="mb-6">
        <p className="text-muted-foreground">
          {mode === 'create' 
            ? 'Fill in the details below to create a new listing.' 
            : 'Update the listing information below.'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="restaurant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant</FormLabel>
                  <FormControl>
                    <AsyncSearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      fetchOptions={fetchFunctions[EntityType.RESTAURANT]}
                      placeholder="Search restaurants..."
                      emptyMessage="No restaurants found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video</FormLabel>
                  <FormControl>
                    <AsyncSearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      fetchOptions={fetchFunctions[EntityType.VIDEO]}
                      placeholder="Search videos..."
                      emptyMessage="No videos found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="influencer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Influencer</FormLabel>
                  <FormControl>
                    <AsyncSearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      fetchOptions={fetchFunctions[EntityType.INFLUENCER]}
                      placeholder="Search influencers..."
                      emptyMessage="No influencers found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="visit_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Select published date"
                        className="w-full bg-cream shadow-lg border-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Review Sections</h3>
            <ReviewSectionsForm form={form} />
          </div>

          <FormField
            control={form.control}
            name="confidence_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confidence Score (0-1)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full bg-cream shadow-lg border-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timestamp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video Timestamp (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter timestamp in seconds (optional)"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-cream shadow-lg border-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="approved"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-4 bg-cream shadow-lg">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Approved</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mark this listing as approved
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-gray-300"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-between space-x-4">
            {mode === 'edit' && listingData?.id && (
              <Button
                type="button"
                variant="destructive"
                onClick={openDeleteDialog}
                disabled={isLoading || isDeleting}
                className="cursor-pointer"
              >
                Delete Listing
              </Button>
            )}

            <div className="ml-auto flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (mode === 'create' ? "Creating..." : "Updating...") 
                  : (mode === 'create' ? "Create Listing" : "Update Listing")
                }
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Listing"
        description="Are you sure you want to delete this listing? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}