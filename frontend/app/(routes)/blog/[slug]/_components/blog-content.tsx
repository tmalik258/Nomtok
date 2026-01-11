"use client";

import { BlogPost } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogContentProps {
  blog: BlogPost;
}

export function BlogContent({ blog }: BlogContentProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
        <CardContent className="p-8 md:p-12">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ ...props }) => (
                  <h1 className="text-4xl font-bold mb-6 mt-8" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-3xl font-bold mb-4 mt-6" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-2xl font-bold mb-3 mt-5" {...props} />
                ),
                p: ({ ...props }) => (
                  <p className="mb-4 leading-7" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />
                ),
                li: ({ ...props }) => (
                  <li className="mb-1" {...props} />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-4 border-orange-500 pl-4 italic my-4" {...props} />
                ),
                code: ({ ...props }) => (
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props} />
                ),
                pre: ({ ...props }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                ),
                a: ({ ...props }) => (
                  <a className="text-orange-500 hover:text-orange-600 underline" {...props} />
                ),
                img: ({ src, alt, ...props }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={alt || ""} className="rounded-lg my-4 w-full" {...props} />
                ),
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>

          {blog.categories && blog.categories.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">Categories:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {blog.categories.map((category) => (
                  <Badge key={category.id} variant="outline" className="text-sm">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {blog.published_at && (
            <div className="mt-6 pt-6 border-t border-border flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Published on {format(new Date(blog.published_at), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
