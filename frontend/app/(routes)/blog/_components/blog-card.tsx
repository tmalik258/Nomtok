"use client";

import { BlogPost } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, ArrowRight } from "lucide-react";

interface BlogCardProps {
  blog: BlogPost;
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link href={`/blog/${blog.slug}`} className="group">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-orange-500/20 hover:border-orange-500/40">
        {blog.cover_image_url && (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={blog.cover_image_url}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <CardContent className="flex-1 p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {blog.categories?.map((category) => (
              <Badge key={category.id} variant="outline" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {blog.is_featured && (
              <Badge className="bg-orange-500 text-white text-xs">
                Featured
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
              {blog.excerpt}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-6 pt-0 flex items-center justify-between text-sm text-muted-foreground">
          {blog.published_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(blog.published_at), "MMM d, yyyy")}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-orange-500 group-hover:gap-3 transition-all">
            <span className="font-medium">Read more</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
