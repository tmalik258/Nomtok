"use client";

import { useEffect, useState } from "react";
import { BlogPost } from "@/lib/types";
import { useBlogPost } from "@/lib/hooks/useBlog";
import { BlogContent } from "./blog-content";
import { BlogHero } from "./blog-hero";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogDetailClientProps {
  slug: string;
  initialBlog?: BlogPost;
  renderHero?: boolean;
}

export function BlogDetailClient({ slug, initialBlog, renderHero = false }: BlogDetailClientProps) {
  const { blog, loading, error } = useBlogPost(slug);
  const [displayBlog, setDisplayBlog] = useState<BlogPost | undefined>(initialBlog);

  useEffect(() => {
    if (blog) {
      setDisplayBlog(blog);
    }
  }, [blog]);

  if (loading && !displayBlog) {
    return (
      <div className="min-h-screen bg-cream p-2">
        <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg bg-gray-200">
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <Skeleton className="h-16 w-96 mx-auto mb-6" />
            <Skeleton className="h-8 w-[600px] mx-auto mb-8" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error && !displayBlog) {
    return (
      <div className="min-h-screen bg-cream p-2 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!displayBlog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      {renderHero && <BlogHero blog={displayBlog} />}
      <BlogContent blog={displayBlog} />
    </div>
  );
}
