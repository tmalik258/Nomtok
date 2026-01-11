"use client";

import { BlogPost } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlogHeroProps {
  blog: BlogPost;
}

export function BlogHero({ blog }: BlogHeroProps) {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg">
      {blog.cover_image_url ? (
        <div className="absolute inset-0">
          <Image
            src={blog.cover_image_url}
            alt={blog.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-cream" />
      )}
      
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {blog.categories?.map((category) => (
            <Badge key={category.id} variant="secondary" className="bg-white/90 text-foreground">
              <Tag className="h-3 w-3 mr-1" />
              {category.name}
            </Badge>
          ))}
          {blog.is_featured && (
            <Badge className="bg-orange-500 text-white">
              Featured
            </Badge>
          )}
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg">
          {blog.title}
        </h1>
        
        {blog.excerpt && (
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-md">
            {blog.excerpt}
          </p>
        )}
        
        {blog.published_at && (
          <div className="flex items-center justify-center gap-2 text-white/80">
            <Calendar className="h-5 w-5" />
            <span className="text-lg">
              {format(new Date(blog.published_at), "MMMM d, yyyy")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
