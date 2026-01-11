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
import { UseFormReturn } from "react-hook-form";

interface BlogFormSEOFieldsProps {
  form: UseFormReturn<any>;
}

export function BlogFormSEOFields({ form }: BlogFormSEOFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">SEO Settings</h3>

      <FormField
        control={form.control}
        name="meta_title"
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
        name="meta_description"
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
        name="meta_keywords"
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
