"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useBlogCategories } from "@/lib/hooks/useBlogCategories";
import { UseFormReturn } from "react-hook-form";

interface BlogFormCategoriesFieldProps {
  form: UseFormReturn<any>;
  prefix?: string;
}

export function BlogFormCategoriesField({
  form,
  prefix = "category",
}: BlogFormCategoriesFieldProps) {
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const watchedCategoryIds = form.watch("category_ids") || [];

  const handleCategoryToggle = (categoryId: string) => {
    const current = watchedCategoryIds;
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    form.setValue("category_ids", updated);
  };

  return (
    <FormField
      control={form.control}
      name="category_ids"
      render={() => (
        <FormItem>
          <FormLabel>Categories</FormLabel>
          {categoriesLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading categories...
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-2 border rounded-lg p-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${prefix}-${category.id}`}
                    checked={watchedCategoryIds.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <label
                    htmlFor={`${prefix}-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No categories available. Create categories first.
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
