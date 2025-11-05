"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import {
  CreateListingFormData,
  EditListingFormData,
} from "@/lib/validations/listing-create";
import { ReviewSections } from "@/lib/types";
import { ListEditor } from "@/components/list-editor";

interface ReviewSectionsFormProps {
  form: UseFormReturn<CreateListingFormData | EditListingFormData>;
}

export function ReviewSectionsForm({ form }: ReviewSectionsFormProps) {
  const reviewSections = form.watch("review_sections");

  const updateReviewSection = <K extends keyof ReviewSections>(
    field: K,
    value: ReviewSections[K]
  ) => {
    const currentSections = reviewSections || {};
    form.setValue("review_sections", {
      ...currentSections,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* History Context */}
        <FormField
          control={form.control}
          name="review_sections.history_context"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add background context about the restaurant or visit..."
                  className="min-h-[100px] max-h-[200px] bg-white shadow-lg border-none"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    updateReviewSection("history_context", e.target.value)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Overview */}
        <FormField
          control={form.control}
          name="review_sections.overview"
          render={({ field }) => (
            <FormItem>
              <FormLabel>The Visit</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide an overview of the restaurant experience..."
                  className="min-h-[100px] max-h-[200px] bg-white shadow-lg border-none"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    updateReviewSection("overview", e.target.value)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* What They Ate */}
      <div className="space-y-4">
        <FormLabel>What They Ate</FormLabel>
        <ListEditor
          items={reviewSections?.what_they_ate || []}
          onItemsChange={(items) => updateReviewSection("what_they_ate", items)}
          placeholder="Add dish or item..."
          emptyMessage="No items added yet"
          maxItems={10}
        />
      </div>

      {/* Verbatim Quotes */}
      <div className="space-y-4">
        <FormLabel>Verbatim Quotes</FormLabel>
        <ListEditor
          items={reviewSections?.verbatim_quotes || []}
          onItemsChange={(items) =>
            updateReviewSection("verbatim_quotes", items)
          }
          placeholder="Add a quote..."
          emptyMessage="No quotes added yet"
          maxItems={10}
        />
      </div>

      {/* Nomtok Reflection */}
      <FormField
        control={form.control}
        name="review_sections.nomtok_reflection"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Our Reflection</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add final thoughts or reflection about the restaurant..."
                className="min-h-[100px] max-h-[200px] bg-white shadow-lg border-none"
                {...field}
                value={field.value || ""}
                onChange={(e) =>
                  updateReviewSection("nomtok_reflection", e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
