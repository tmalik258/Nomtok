import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RatingStars from "@/components/rating-stars";
import { Restaurant, Listing, Cuisine } from "@/lib/types";
import { cn } from "@/lib/utils";
import SocialShareButtons from "@/components/social-share-buttons";
import RestaurantImage from "@/components/restaurant-image";

interface RestaurantDetailCardProps {
  restaurant: Restaurant;
  listings?: Listing[];
  cuisines?: Cuisine[];
  showInfluencer?: boolean;
  className?: string;
}

export function RestaurantDetailCard({
  restaurant,
  listings,
  cuisines,
  showInfluencer = true,
  className
}: RestaurantDetailCardProps) {
  return (
    <Card
      className={cn("border-none shadow-xl bg-white h-full", className)}
    >
      <CardContent className="p-6 h-full">
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          <div className="w-full md:w-80 rounded-xl overflow-hidden relative flex-grow md:flex-shrink-0 min-h-[200px]">
            <RestaurantImage
              src={restaurant.photo_url || undefined}
              alt={restaurant.name}
              restaurantSlug={String(restaurant.slug)}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 320px"
            />
          </div>
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {restaurant.name}
            </h3>
            <p className="text-gray-700 mb-2">{restaurant.address}</p>
            {restaurant.google_rating && (
              <div className="mb-2">
                <RatingStars rating={restaurant.google_rating} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {cuisines?.map((cuisine) => (
                <span
                  key={cuisine.id}
                  className="bg-orange-500/15 text-orange-500 text-xs font-medium px-2.5 py-0.5 rounded-full"
                >
                  {cuisine.name}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/restaurants/${restaurant?.slug}`}>
                    View Full Details
                  </Link>
                </Button>
                {restaurant.google_place_id && (
                  <Button asChild variant="outline">
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Google Maps
                    </a>
                  </Button>
                )}
              </div>
              {/* Social Share Buttons */}
              <SocialShareButtons
                url={typeof window !== 'undefined' ? `${window.location.origin}/restaurants/${restaurant.slug}` : ''}
                title={`Check out ${restaurant.name} - Amazing restaurant in ${restaurant.city || 'the city'}`}
                variant="inline"
                className="pt-2 self-start border-none shadow-none"
              />
            </div>
          </div>
        </div>
        <div>
          {/* Influencer Information */}
          {listings?.map((listing, index) => {
            const influencer = listing?.influencer;
            return (
              <div key={index} className="mt-4 p-3">
                <div className="mb-4 last:mb-0">
                  {influencer && showInfluencer && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Featured by:
                      </span>
                      {influencer.avatar_url && (
                        <Image
                          src={influencer.avatar_url}
                          alt={`${influencer.name} avatar`}
                          width={25}
                          height={25}
                          className="rounded-full mr-1"
                        />
                      )}
                      <span className="text-xl font-semibold text-orange-700">
                        {influencer.name}
                      </span>
                    </div>
                  )}
                  {(() => {
                    if (listing.review_sections) {
                      // Priority: show verbatim quotes if available
                      if (listing.review_sections.verbatim_quotes && listing.review_sections.verbatim_quotes.length > 0) {
                        return (
                          <div className="space-y-2">
                            {listing.review_sections.verbatim_quotes.map((quote: string, quoteIndex: number) => (
                              <div
                                key={quoteIndex}
                                className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500"
                              >
                                <div className="flex items-start gap-2">
                                  <Quote className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <blockquote className="text-gray-700 italic text-sm">
                                    &quot;{quote}&quot;
                                  </blockquote>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      // Fallback to other review sections
                      const reviewText = 
                        listing.review_sections.overview ||
                        listing.review_sections.history_context ||
                        listing.review_sections.nomtok_reflection ||
                        (listing.review_sections.what_they_ate && listing.review_sections.what_they_ate.length > 0 ? listing.review_sections.what_they_ate[0] : '');
                      
                      if (reviewText) {
                        return (
                          <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                            <div className="flex items-start gap-2">
                              <Quote className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <blockquote className="text-gray-700 italic text-sm">
                                &quot;{reviewText}&quot;
                              </blockquote>
                            </div>
                          </div>
                        );
                      }
                    }
                    

                    
                    return null;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RestaurantDetailCard;
