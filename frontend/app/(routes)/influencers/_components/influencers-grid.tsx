"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import ErrorCard from "@/components/error-card";
import { InfluencerCardSkeleton } from "@/components/loading-states";
import InfluencerCard from "./influencer-card";
import { Influencer } from "@/lib/types";

interface InfluencersGridProps {
  loading: boolean;
  error: string | null;
  influencers: Influencer[];
  searchQuery: string;
  clearSearch: () => void;
  onRefresh: () => void;
}

export default function InfluencersGrid({
  loading,
  error,
  influencers,
  searchQuery,
  clearSearch,
  onRefresh,
}: InfluencersGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <InfluencerCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorCard
        title="Something went wrong"
        message="We're having trouble loading the influencers. Please try again later."
        error={error}
        onRefresh={onRefresh}
      />
    );
  }

  if (influencers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-cream rounded-2xl shadow-xl p-12 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {searchQuery ? "No matches found" : "No influencers available"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? `We couldn't find any influencers matching "${searchQuery}". Try adjusting your search terms.`
              : "There are currently no influencers to display."}
          </p>
          {searchQuery && (
            <Button
              onClick={clearSearch}
              className="bg-orange-600 hover:bg-orange-500 text-cream px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            >
              Clear search
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {influencers.map((influencer) => (
        <InfluencerCard key={influencer.slug} influencer={influencer} />
      ))}
    </div>
  );
}
