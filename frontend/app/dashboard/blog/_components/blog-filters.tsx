"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ArrowDownUp } from "lucide-react";

interface BlogFiltersProps {
  searchTerm: string;
  isPublished: boolean | undefined;
  isFeatured: boolean | undefined;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSearchChange: (value: string) => void;
  onPublishedChange: (value: boolean | undefined) => void;
  onFeaturedChange: (value: boolean | undefined) => void;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  onAddNew: () => void;
}

export const BlogFilters = memo(function BlogFilters({
  searchTerm,
  isPublished,
  isFeatured,
  sortBy,
  sortOrder,
  onSearchChange,
  onPublishedChange,
  onFeaturedChange,
  onSortByChange,
  onSortOrderChange,
  onAddNew
}: BlogFiltersProps) {
  return (
    <Card role="search" aria-label="Blog filters" className="p-0 border-none shadow-none">
      <CardContent className="flex flex-col lg:flex-row gap-4 justify-between p-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap flex-1 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" aria-hidden="true" />
            <Input
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border"
              aria-label="Search blog posts by title"
            />
          </div>
        
          <Select 
            value={isPublished === undefined ? "all" : isPublished ? "published" : "draft"} 
            onValueChange={(value) => onPublishedChange(value === "all" ? undefined : value === "published")}
          >
            <SelectTrigger className="w-full sm:w-[180px] glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Filter by published status">
              <SelectValue placeholder="Published Status" />
            </SelectTrigger>
            <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
              <SelectItem value="all" className="focus:bg-orange-500/10 focus:text-orange-600">All Posts</SelectItem>
              <SelectItem value="published" className="focus:bg-orange-500/10 focus:text-orange-600">Published</SelectItem>
              <SelectItem value="draft" className="focus:bg-orange-500/10 focus:text-orange-600">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={isFeatured === undefined ? "all" : isFeatured ? "featured" : "not-featured"} 
            onValueChange={(value) => onFeaturedChange(value === "all" ? undefined : value === "featured")}
          >
            <SelectTrigger className="w-full sm:w-[180px] glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Filter by featured status">
              <SelectValue placeholder="Featured Status" />
            </SelectTrigger>
            <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
              <SelectItem value="all" className="focus:bg-orange-500/10 focus:text-orange-600">All Posts</SelectItem>
              <SelectItem value="featured" className="focus:bg-orange-500/10 focus:text-orange-600">Featured</SelectItem>
              <SelectItem value="not-featured" className="focus:bg-orange-500/10 focus:text-orange-600">Not Featured</SelectItem>
            </SelectContent>
          </Select>
        
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-full sm:w-[180px] glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Sort by">
                <ArrowDownUp className="h-4 w-4 mr-2 text-orange-500" aria-hidden="true" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
                <SelectItem value="created_at" className="focus:bg-orange-500/10 focus:text-orange-600">Created Date</SelectItem>
                <SelectItem value="updated_at" className="focus:bg-orange-500/10 focus:text-orange-600">Updated Date</SelectItem>
                <SelectItem value="published_at" className="focus:bg-orange-500/10 focus:text-orange-600">Published Date</SelectItem>
                <SelectItem value="title" className="focus:bg-orange-500/10 focus:text-orange-600">Title</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={(value) => onSortOrderChange(value as "asc" | "desc")}>
              <SelectTrigger className="w-full sm:w-[120px] glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Sort order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
                <SelectItem value="desc" className="focus:bg-orange-500/10 focus:text-orange-600">Desc</SelectItem>
                <SelectItem value="asc" className="focus:bg-orange-500/10 focus:text-orange-600">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          onClick={onAddNew}
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
          aria-label="Add new blog post"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add New Post
        </Button>
      </CardContent>
    </Card>
  );
});
