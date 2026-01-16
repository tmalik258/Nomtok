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
    <div className="relative flex items-center justify-center overflow-hidden py-10 rounded-lg">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600/30 via-slate-500/20 to-cream" />
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
            <Badge className="bg-orange-500 text-gray-900">
              Featured
            </Badge>
          )}
        </div>
        
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg ${
          blog.cover_image_url ? 'text-white' : 'text-slate-900'
        }`}>
          {blog.title}
        </h1>
        
        {blog.excerpt && (
          <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md ${
            blog.cover_image_url ? 'text-white/90' : 'text-slate-700'
          }`}>
            {blog.excerpt}
          </p>
        )}
        
        {blog.published_at && (
          <div className={`flex items-center justify-center gap-2 ${
            blog.cover_image_url ? 'text-white/80' : 'text-slate-700'
          }`}>
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
