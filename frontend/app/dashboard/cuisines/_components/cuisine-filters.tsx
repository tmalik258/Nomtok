"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ArrowDownUp } from "lucide-react";

interface CuisineFiltersProps {
  searchTerm: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onAddNew: () => void;
}

export function CuisineFilters({
  searchTerm,
  sortBy,
  onSearchChange,
  onSortChange,
  onAddNew
}: CuisineFiltersProps) {
  return (
    <Card role="search" aria-label="Cuisine filters" className="glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
      <CardContent className="flex flex-col lg:flex-row gap-4 justify-between p-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap flex-1 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" aria-hidden="true" />
            <Input
              placeholder="Search cuisines..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border"
              aria-label="Search cuisines by name"
            />
          </div>
        
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full glass-effect focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 input-with-orange-border" aria-label="Sort cuisines">
                <ArrowDownUp className="h-4 w-4 mr-2 text-orange-500" aria-hidden="true" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl border-orange-500/20">
                <SelectItem value="name" className="focus:bg-orange-500/10 focus:text-orange-600">Name</SelectItem>
                <SelectItem value="updated" className="focus:bg-orange-500/10 focus:text-orange-600">Last Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={onAddNew} className="w-full sm:w-auto cursor-pointer bg-orange-500 hover:bg-orange-600 text-cream border-orange-500 shadow-lg hover:shadow-xl transition-all duration-200" aria-label="Add new cuisine">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Cuisine
        </Button>
      </CardContent>
    </Card>
  );
}