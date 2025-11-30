"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import type { VideoFiltersProps } from "@/lib/types";
import { useInfluencers } from "@/lib/hooks/useInfluencers";
import {
  AsyncSearchableSelect,
  type SearchableOption,
} from "@/components/ui/async-searchable-select";

export function VideoFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  hasListings,
  setHasListings,
  selectedInfluencer,
  setSelectedInfluencer,
  processedFilter,
  setProcessedFilter,
}: VideoFiltersProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const {
    influencers,
    loading: influencersLoading,
    error: influencersError,
    setSearchQuery,
  } = useInfluencers({ limit: 100 });
  const lastQueryRef = useRef<string>("");

  // Debounce search term
  useEffect(() => {
    if (localSearchTerm !== searchTerm) {
      const timer = setTimeout(() => {
        setSearchTerm(localSearchTerm);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [localSearchTerm, searchTerm, setSearchTerm]);

  const influencerOptions = useMemo<SearchableOption[]>(() => {
    return (influencers || []).map((inf) => ({ id: inf.id, name: inf.name }));
  }, [influencers]);

  const fetchInfluencerOptions = useCallback(
    async (query: string): Promise<SearchableOption[]> => {
      const trimmed = query.trim();
      if (trimmed && trimmed !== lastQueryRef.current) {
        lastQueryRef.current = trimmed;
        setSearchQuery(trimmed);
      }
      return influencerOptions;
    },
    [setSearchQuery, influencerOptions]
  );

  return (
    <Card className="border-none shadow-none p-0">
      <CardContent className="space-y-4 p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search videos..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="glass-effect backdrop-blur-sm bg-cream/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-cream placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Influencer Filter - searchable combobox */}
          <div className="w-full">
            <AsyncSearchableSelect
              value={selectedInfluencer || ""}
              onValueChange={(value) =>
                setSelectedInfluencer(value === "all" ? "" : value)
              }
              placeholder={
                influencersLoading
                  ? "Loading influencers..."
                  : selectedInfluencer
                  ? "Select an influencer"
                  : "All Influencers"
              }
              searchPlaceholder="Search influencers..."
              fetchOptions={fetchInfluencerOptions}
              disabled={!!influencersLoading}
              error={!!influencersError}
              emptyMessage={influencersError || "No influencers found."}
              className="glass-effect backdrop-blur-sm"
            />
          </div>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-cream/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-cream">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="published_at">Published Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select
            value={sortOrder}
            onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
          >
            <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-cream/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-cream">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Has Listings Filter */}
          <Select
            value={hasListings?.toString() || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                setHasListings(undefined);
              } else {
                setHasListings(value === "true");
              }
            }}
          >
            <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-cream/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-cream">
              <SelectValue placeholder="Filter by listings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="true">With Listings</SelectItem>
              <SelectItem value="false">Without Listings</SelectItem>
            </SelectContent>
          </Select>

          {/* Processing Status Filter */}
          <Select
            value={processedFilter}
            onValueChange={(value: "all" | "completed" | "pending" | "failed") =>
              setProcessedFilter(value)
            }
          >
            <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-cream/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-cream">
              <SelectValue placeholder="Filter by processing status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
