import { Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RestaurantDetailCard from "@/components/restaurant-detail-card";
import type { Listing } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import InfluencersPagination from "@/app/(routes)/influencers/_components/influencers-pagination";
import { useMemo } from "react";
import ErrorCard from "@/components/error-card";

interface AllReviewsProps {
  listings: Listing[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  error?: string | null;
  onRefetch?: () => void;
}

export const AllReviews: React.FC<AllReviewsProps> = ({ listings, loading = false, currentPage, totalPages, onPageChange, error, onRefetch }) => {
  const itemCount = useMemo(() => listings.length, [listings]);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">All Reviews</h2>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {itemCount}
        </Badge>
      </div>

      {/* Single Column Restaurant Cards */}
      <div className="space-y-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <Skeleton className="h-5 w-56 mb-2" />
              <Skeleton className="h-4 w-40 mb-4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))
        ) : error ? (
          <ErrorCard
            title="Something went wrong"
            message="We&apos;re having trouble loading reviews. Please try again."
            error={error}
            onRefresh={onRefetch}
            showRefreshButton={!!onRefetch}
          />
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-lg text-center p-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Reviews Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No restaurant reviews available from this influencer yet. Check back later for new content!
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
          </div>
        ) : (
          listings.map(
            (listing) =>
              listing?.restaurant && (
                <RestaurantDetailCard
                  key={listing.id}
                  restaurant={listing.restaurant}
                  listings={[listing]}
                  cuisines={listing.restaurant?.cuisines}
                  showInfluencer={false}
                  className="mt-6"
                />
              )
          )
        )}
      </div>

      <div className="mt-8">
        <InfluencersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          loading={false}
        />
      </div>
    </div>
  );
};
