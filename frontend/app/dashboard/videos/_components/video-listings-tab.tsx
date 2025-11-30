"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { ListingCard } from "./listing-card";
import { Listing } from "@/lib/types";

interface VideoListingsTabProps {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchVideos: () => void;
}

export function VideoListingsTab({
  listings,
  loading,
  error,
  refetch,
  refetchVideos,
}: VideoListingsTabProps) {
  const handleOnDelete = () => {
    refetch();
    refetchVideos();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-cream shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-cream shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading listings: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <Card className="bg-cream shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm">
              This video doesn&apos;t have any associated listings yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onDeleted={handleOnDelete}
          onUpdate={refetch}
        />
      ))}
    </div>
  );
}
