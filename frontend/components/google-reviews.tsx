"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import Image from "next/image";
import ErrorCard from "@/components/error-card";
import { googleReviewsActions } from "@/lib/actions/google-reviews-actions";
import { GoogleReview } from "@/lib/types/google-reviews";

interface GoogleReviewsProps {
  placeId: string;
  className?: string;
}

export default function GoogleReviews({ placeId, className = "" }: GoogleReviewsProps) {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await googleReviewsActions.getGoogleReviews(placeId);
      setReviews(data.reviews || []);
      setRating(data.rating || 0);
      setTotalRatings(data.user_ratings_total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    if (placeId) {
      fetchReviews();
    }
  }, [fetchReviews, placeId]);

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const starSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className={className}>
        <ErrorCard
          title="Unable to load reviews"
          message="We're having trouble loading Google Reviews for this location."
          error={error}
          onRefresh={fetchReviews}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Google Reviews</h2>
        <span className="text-xl font-semibold text-gray-700">{rating.toFixed(1)}</span>
        {renderStars(rating, "md")}
        <span className="text-sm text-gray-500">({totalRatings.toLocaleString()} reviews)</span>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((review, index) => (
          <Card key={index} className="h-full border-none">
            <CardContent className="p-4">
              {/* Reviewer Info */}
              <div className="flex items-start gap-3 mb-3">
                <Image
                  width={40}
                  height={40}
                  src={review.profile_photo_url || ""}
                  alt={review.author_name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      review.author_name
                    )}&background=f3f4f6&color=374151&size=40`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {review.author_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {review.relative_time_description}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-2">
                {renderStars(review.rating)}
              </div>

              {/* Review Text */}
              <p className="text-sm text-gray-700 line-clamp-4">
                {review.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>No recent reviews available</p>
        </div>
      )}
    </div>
  );
}