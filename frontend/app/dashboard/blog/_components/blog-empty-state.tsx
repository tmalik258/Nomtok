"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileEdit } from "lucide-react";

interface BlogEmptyStateProps {
  hasBlogs: boolean;
}

export function BlogEmptyState({ hasBlogs }: BlogEmptyStateProps) {
  if (hasBlogs) {
    return null;
  }

  return (
    <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <FileEdit className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No blog posts found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Get started by creating your first blog post. Click the &quot;Add New Post&quot; button to begin.
        </p>
      </CardContent>
    </Card>
  );
}
