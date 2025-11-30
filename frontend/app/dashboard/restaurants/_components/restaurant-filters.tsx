"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Tag, HandPlatter, ArrowDownUp, Loader2 } from "lucide-react";

interface RestaurantFiltersProps {
  searchTerm: string;
  selectedTag: string;
  selectedCuisine: string;
  sortBy: string;
  uniqueTags: string[];
  uniqueCuisines: string[];
  tagsLoading?: boolean;
  cuisinesLoading?: boolean;
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onAddNew: () => void;
}

export const RestaurantFilters = memo(function RestaurantFilters({
  searchTerm,
  selectedTag,
  selectedCuisine,
  sortBy,
  uniqueTags,
  uniqueCuisines,
  tagsLoading = false,
  cuisinesLoading = false,
  onSearchChange,
  onTagChange,
  onCuisineChange,
  onSortChange,
  onAddNew
}: RestaurantFiltersProps) {
  return (
    <Card role="search" aria-label="Restaurant filters" className="p-0 border-none shadow-none">
      <CardContent className="flex flex-col lg:flex-row gap-4 justify-between p-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap flex-1 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" aria-hidden="true" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border"
              aria-label="Search restaurants by name or address"
            />
          </div>
        
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <Select value={selectedTag} onValueChange={onTagChange} disabled={tagsLoading}>
              <SelectTrigger className="w-full glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Filter by tag">
                {tagsLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 text-orange-500 animate-spin" aria-hidden="true" />
                ) : (
                  <Tag className="h-4 w-4 mr-2 text-orange-500" aria-hidden="true" />
                )}
                <SelectValue placeholder={tagsLoading ? "Loading tags..." : "Filter by tag"} />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
                <SelectItem value="all" className="focus:bg-orange-500/10 focus:text-orange-600">All Tags</SelectItem>
                {!tagsLoading && uniqueTags.map(tag => (
                  <SelectItem key={tag} value={tag} className="focus:bg-orange-500/10 focus:text-orange-600">
                    {tag}
                  </SelectItem>
                ))}
                {tagsLoading && (
                  <SelectItem value="loading" disabled className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span className="ml-2 text-muted-foreground">Loading tags...</span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
        
            <Select value={selectedCuisine} onValueChange={onCuisineChange} disabled={cuisinesLoading}>
              <SelectTrigger className="w-full glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Filter by cuisine">
                {cuisinesLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 text-orange-500 animate-spin" aria-hidden="true" />
                ) : (
                  <HandPlatter className="h-4 w-4 mr-2 text-orange-500" aria-hidden="true" />
                )}
                <SelectValue placeholder={cuisinesLoading ? "Loading cuisines..." : "Filter by cuisine"} />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
                <SelectItem value="all" className="focus:bg-orange-500/10 focus:text-orange-600">All Cuisines</SelectItem>
                {!cuisinesLoading && uniqueCuisines.map(cuisine => (
                  <SelectItem key={cuisine} value={cuisine} className="focus:bg-orange-500/10 focus:text-orange-600">
                    {cuisine}
                  </SelectItem>
                ))}
                {cuisinesLoading && (
                  <SelectItem value="loading" disabled className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span className="ml-2 text-muted-foreground">Loading cuisines...</span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
        
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Sort restaurants">
                <ArrowDownUp className="h-4 w-4 mr-2 text-orange-500" aria-hidden="true" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
                <SelectItem value="name" className="focus:bg-orange-500/10 focus:text-orange-600">Name</SelectItem>
                <SelectItem value="rating" className="focus:bg-orange-500/10 focus:text-orange-600">Rating</SelectItem>
                <SelectItem value="city" className="focus:bg-orange-500/10 focus:text-orange-600">City</SelectItem>
                <SelectItem value="updated" className="focus:bg-orange-500/10 focus:text-orange-600">Last Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={onAddNew} className="w-full sm:w-auto cursor-pointer bg-orange-500 hover:bg-orange-600 text-cream border-orange-500 shadow-lg hover:shadow-xl transition-all duration-200" aria-label="Add new restaurant">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Restaurant
        </Button>
      </CardContent>
    </Card>
  );
});