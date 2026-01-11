"use client";

import { BlogPost } from "@/lib/types";
import { BlogCard } from "./blog-card";

interface BlogGridProps {
  blogs: BlogPost[];
}

export function BlogGrid({ blogs }: BlogGridProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No blog posts found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}
