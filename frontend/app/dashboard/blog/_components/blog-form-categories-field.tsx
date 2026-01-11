"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useBlogCategories } from "@/lib/hooks/useBlogCategories";
import { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";

interface BlogFormCategoriesFieldProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  prefix?: string;
}

export function BlogFormCategoriesField<T extends FieldValues = FieldValues>({
  form,
  prefix = "category",
}: BlogFormCategoriesFieldProps<T>) {
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const watchedCategoryIds = (form.watch("category_ids" as Path<T>) || []) as string[];

  const handleCategoryToggle = (categoryId: string) => {
    const current = watchedCategoryIds;
    const updated = current.includes(categoryId)
      ? current.filter((id: string) => id !== categoryId)
      : [...current, categoryId];
    form.setValue("category_ids" as Path<T>, updated as PathValue<T, Path<T>>);
  };

  return (
    <FormField
      control={form.control}
      name={"category_ids" as Path<T>}
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
