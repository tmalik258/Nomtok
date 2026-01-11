"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";

interface BlogFormStatusFieldsProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
}

export function BlogFormStatusFields<T extends FieldValues = FieldValues>({ form }: BlogFormStatusFieldsProps<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name={"is_published" as Path<T>}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Published</FormLabel>
              <div className="text-sm text-muted-foreground">
                Make this post visible to the public
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"is_featured" as Path<T>}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Featured</FormLabel>
              <div className="text-sm text-muted-foreground">
                Highlight this post on the homepage
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
