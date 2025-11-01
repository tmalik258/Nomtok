import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@/lib/types/index";

interface TrendingQuoteProps {
  listing?: Listing;
  loading: boolean;
  error: string | null;
  onRefetch?: () => void;
}

export const TrendingQuoteCard: React.FC<TrendingQuoteProps> = ({ 
  listing, 
  loading, 
  error, 
  onRefetch 
}) => (
  <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl border-0">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Quote className="w-6 h-6" />
        <h2 className="text-xl font-bold">Latest Review</h2>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-white/20" />
          <Skeleton className="h-4 w-3/4 bg-white/20" />
          <Skeleton className="h-3 w-1/2 bg-white/20" />
        </div>
      ) : error ? (
        <div className="text-white/80">
          <p className="text-sm">Unable to load latest review</p>
          {onRefetch && (
            <button 
              onClick={onRefetch} 
              className="text-xs underline hover:no-underline mt-1"
            >
              Try again
            </button>
          )}
        </div>
      ) : listing ? (
        <div>
          <blockquote className="text-lg italic font-light leading-relaxed">
            {(() => {
              if (listing.review_sections) {
                // Priority order for display text
                if (listing.review_sections.overview) return `"${listing.review_sections.overview}"`;
                if (listing.review_sections.history_context) return `"${listing.review_sections.history_context}"`;
                if (listing.review_sections.nomtok_reflection) return `"${listing.review_sections.nomtok_reflection}"`;
                if (listing.review_sections.what_they_ate && listing.review_sections.what_they_ate.length > 0) {
                  return `"${listing.review_sections.what_they_ate[0]}"`;
                }
                if (listing.review_sections.verbatim_quotes && listing.review_sections.verbatim_quotes.length > 0) {
                  return `"${listing.review_sections.verbatim_quotes[0]}"`;
                }
              }
              
              return `"Latest review from ${listing.restaurant?.name}"`;
            })()}
          </blockquote>
          <p className="text-sm text-white/80 mt-3">
            — {listing.influencer?.name} at {listing.restaurant?.name}
          </p>
        </div>
      ) : (
        <div className="text-white/80">
          <p className="text-sm">No recent reviews available</p>
        </div>
      )}
    </CardContent>
  </Card>
);