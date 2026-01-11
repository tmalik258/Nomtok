"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";

interface BlogFormSEOFieldsProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
}

export function BlogFormSEOFields<T extends FieldValues = FieldValues>({ form }: BlogFormSEOFieldsProps<T>) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">SEO Settings</h3>

      <FormField
        control={form.control}
        name={"meta_title" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Title</FormLabel>
            <FormControl>
              <Input placeholder="SEO meta title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"meta_description" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="SEO meta description"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"meta_keywords" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Keywords</FormLabel>
            <FormControl>
              <Input placeholder="keyword1, keyword2, keyword3" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
