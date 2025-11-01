"use client";

import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { CreateListingFormData, EditListingFormData } from "@/lib/validations/listing-create";

interface ReviewSectionsFormProps {
  form: UseFormReturn<CreateListingFormData | EditListingFormData>;
}

export function ReviewSectionsForm({ form }: ReviewSectionsFormProps) {
  const reviewSections = form.watch("review_sections");
  
  const updateReviewSection = (field: string, value: any) => {
    const currentSections = reviewSections || {};
    form.setValue("review_sections", {
      ...currentSections,
      [field]: value,
    });
  };

  const addWhatTheyAteItem = () => {
    const currentItems = reviewSections?.what_they_ate || [];
    updateReviewSection("what_they_ate", [...currentItems, ""]);
  };

  const updateWhatTheyAteItem = (index: number, value: string) => {
    const currentItems = reviewSections?.what_they_ate || [];
    const newItems = [...currentItems];
    newItems[index] = value;
    updateReviewSection("what_they_ate", newItems);
  };

  const removeWhatTheyAteItem = (index: number) => {
    const currentItems = reviewSections?.what_they_ate || [];
    const newItems = currentItems.filter((_, i) => i !== index);
    updateReviewSection("what_they_ate", newItems);
  };

  const addVerbatimQuote = () => {
    const currentQuotes = reviewSections?.verbatim_quotes || [];
    updateReviewSection("verbatim_quotes", [...currentQuotes, ""]);
  };

  const updateVerbatimQuote = (index: number, value: string) => {
    const currentQuotes = reviewSections?.verbatim_quotes || [];
    const newQuotes = [...currentQuotes];
    newQuotes[index] = value;
    updateReviewSection("verbatim_quotes", newQuotes);
  };

  const removeVerbatimQuote = (index: number) => {
    const currentQuotes = reviewSections?.verbatim_quotes || [];
    const newQuotes = currentQuotes.filter((_, i) => i !== index);
    updateReviewSection("verbatim_quotes", newQuotes);
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
                  className="min-h-[100px] bg-white shadow-lg border-none"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => updateReviewSection("history_context", e.target.value)}
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
                  className="min-h-[100px] bg-white shadow-lg border-none"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => updateReviewSection("overview", e.target.value)}
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
        <div className="space-y-2">
          {(reviewSections?.what_they_ate || []).map((item: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => updateWhatTheyAteItem(index, e.target.value)}
                placeholder="Add dish or item..."
                className="bg-white shadow-lg border-none"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeWhatTheyAteItem(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addWhatTheyAteItem}>
            <Plus className="h-4 w-4 mr-2" /> Add item
          </Button>
        </div>
      </div>

      {/* Verbatim Quotes */}
      <div className="space-y-4">
        <FormLabel>Verbatim Quotes</FormLabel>
        <div className="space-y-2">
          {(reviewSections?.verbatim_quotes || []).map((quote: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={quote}
                onChange={(e) => updateVerbatimQuote(index, e.target.value)}
                placeholder="Add a quote..."
                className="bg-white shadow-lg border-none"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeVerbatimQuote(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addVerbatimQuote}>
            <Plus className="h-4 w-4 mr-2" /> Add quote
          </Button>
        </div>
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
                className="min-h-[100px] bg-white shadow-lg border-none"
                {...field}
                value={field.value || ""}
                onChange={(e) => updateReviewSection("nomtok_reflection", e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}