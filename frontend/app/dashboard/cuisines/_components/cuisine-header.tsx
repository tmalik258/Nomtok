"use client";

import { Search, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CuisineHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'name' | 'created_at';
  onSortChange: (sortBy: 'name' | 'created_at') => void;
  onOpenCreateForm: () => void;
}

export function CuisineHeader({
  searchTerm, 
  onSearchChange, 
  sortBy, 
  onSortChange, 
  onOpenCreateForm
}: CuisineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex flex-1 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cuisines..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 glass-effect backdrop-blur-sm bg-cream/10 dark:bg-gray-900/10 border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500"
            aria-label="Search cuisines by name"
          />
        </div>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger 
            className="w-40 glass-effect backdrop-blur-sm bg-cream/10 dark:bg-gray-900/10 border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500"
            aria-label="Sort cuisines by"
          >
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="created_at">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={onOpenCreateForm} 
        className="ml-auto cursor-pointer bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 focus:border-orange-500"
        aria-label="Create new cuisine"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Cuisine
      </Button>
    </div>
  );
}