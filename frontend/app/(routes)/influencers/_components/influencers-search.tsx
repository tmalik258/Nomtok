"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

interface InfluencersSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  loading: boolean;
}

export default function InfluencersSearch({ 
  searchQuery, 
  setSearchQuery, 
  clearSearch, 
  loading 
}: InfluencersSearchProps) {
  return (
    <div className="bg-cream rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Meet Our Food Experts</h2>
        <p className="text-gray-600">Search through our curated collection of culinary influencers</p>
      </div>
      
      {loading ? (
        <Skeleton className="h-14 w-full rounded-xl" />
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name, region, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 py-4 text-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl bg-gray-50 hover:bg-cream transition-all duration-200"
            />
            {searchQuery && (
              <Button
                onClick={clearSearch}
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}