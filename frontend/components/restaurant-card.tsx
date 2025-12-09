import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Restaurant, Listing } from "@/lib/types";
import { Star } from "lucide-react";
import RestaurantImage from "@/components/restaurant-image";

interface RestaurantCardProps {
  restaurant: Restaurant;
  listings: Listing[];
  showButton?: boolean; // Optional prop to control button visibility
}

export function RestaurantCard({
  restaurant,
  listings,
  showButton = true,
}: RestaurantCardProps) {
  
  // Derived details from new fields
  const openNow =
    restaurant?.current_opening_hours?.open_now ??
    restaurant?.opening_hours?.open_now;
  const priceText =
    typeof restaurant?.price_level === "number" && restaurant.price_level > 0
      ? "$".repeat(Math.min(4, Math.max(1, restaurant.price_level)))
      : null;
  
  // Helper function to get the first available review section text
  const getFirstReviewSectionText = (listing: Listing): string => {
    if (listing.review_sections) {
      // Priority order for display text
      if (listing.review_sections.overview) return listing.review_sections.overview;
      if (listing.review_sections.history_context) return listing.review_sections.history_context;
      if (listing.review_sections.nomtok_reflection) return listing.review_sections.nomtok_reflection;
      if (listing.review_sections.what_they_ate && listing.review_sections.what_they_ate.length > 0) {
        return listing.review_sections.what_they_ate[0];
      }
      if (listing.review_sections.verbatim_quotes && listing.review_sections.verbatim_quotes.length > 0) {
        return listing.review_sections.verbatim_quotes[0];
      }
    }
    
    return "";
  };
  return (
    <Link href={`/restaurants/${restaurant.slug}`} className="block h-full">
      <Card
        key={restaurant.slug}
        className="h-full flex flex-col overflow-hidden border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 group p-4"
      >
      <div className="relative h-48 rounded-lg overflow-hidden">
        {/* Use fallback-aware image component */}
        <RestaurantImage
          src={restaurant.photo_url || undefined}
          alt={restaurant.name}
          restaurantSlug={String(restaurant.slug)}
          className="group-hover:scale-105 transition-transform duration-300"
        />
        {restaurant.google_rating && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-black/70 text-cream px-2 py-1 flex items-center">
              <Star className="h-5 w-5 fill-current text-orange-400" />{" "}
              {restaurant.google_rating}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-0 flex flex-col flex-1 justify-between gap-3">
        {/* Top: Restaurant basic info */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
            {restaurant.name}
          </h3>
          <p className="text-gray-600 mb-1">{restaurant?.city}</p>
          <p className="text-gray-600 mb-1">
            {restaurant.cuisines &&
              restaurant.cuisines.length > 0 &&
              restaurant.cuisines.slice(0, 4).map((cuisine) => (
                <Badge
                  key={cuisine.id}
                  className="mr-2 bg-orange-600/15 text-orange-600"
                >
                  {cuisine?.name?.charAt(0)?.toUpperCase() + (cuisine?.name?.slice(1) || '')}
                </Badge>
              ))}
          </p>
          {/* New: price level and open status */}
          <div className="mt-2 flex items-center gap-2">
            {priceText && (
              <Badge className="bg-gray-100 text-gray-800 px-2 py-1">
                {priceText}
              </Badge>
            )}
            {typeof openNow === "boolean" && (
              <Badge
                className={
                  openNow
                    ? "bg-green-100 text-green-700 px-2 py-1"
                    : "bg-gray-200 text-gray-700 px-2 py-1"
                }
              >
                {openNow ? "Open now" : "Closed"}
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom: Quotes/listings and CTA button */}
        <div className="flex flex-col gap-3">
          {listings && listings.length > 0 && (
            <div>
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center mb-2">
                  {listing.influencer && listing.influencer.avatar_url && (
                    <Image
                      width={32}
                      height={32}
                      src={listing.influencer?.avatar_url}
                      alt={listing.influencer.name}
                      className="w-8 h-8 rounded-full mr-2 object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {listing.influencer?.name}
                    </p>
                    {(() => {
                      const reviewText = getFirstReviewSectionText(listing);
                      if (reviewText) {
                        return (
                          <p className="text-xs text-gray-500 italic line-clamp-3">
                            &quot;{reviewText}&quot;
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showButton !== false && (
            <div
              className="w-full mt-auto bg-orange-500 text-cream hover:bg-orange-600 transition-colors duration-200 cursor-pointer rounded-md px-4 py-2 text-center font-medium"
            >
              View Details
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
