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

interface BlogFormBasicFieldsProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
}

export function BlogFormBasicFields<T extends FieldValues = FieldValues>({ form }: BlogFormBasicFieldsProps<T>) {
  return (
    <>
      <FormField
        control={form.control}
        name={"title" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title *</FormLabel>
            <FormControl>
              <Input placeholder="Enter blog post title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"excerpt" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Excerpt</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Short preview/excerpt of the blog post"
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
        name={"content" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content (Markdown) *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Write your blog post content in Markdown format"
                rows={15}
                className="font-mono text-sm"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"cover_image_url" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cover Image URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/image.jpg" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
