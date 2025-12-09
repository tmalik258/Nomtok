"use client";

import { toTitleFromSlug } from "@/lib/seo/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo/utils";
import Script from "next/script";
import { useRestaurantWithListings, useCityListings } from "@/lib/hooks";
import type { Restaurant } from "@/lib/types";
import { Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RestaurantMap from "@/components/dynamic-restaurant-map";
import GoogleReviews from "@/components/google-reviews";
import ErrorCard from "@/components/error-card";
import SkeletonLoading from "../_components/skeleton-loading";
import ListingCard from "../_components/listing-card";
import RestaurantKeyDetails from "../_components/restaurant-key-details";
import RestaurantHero from "./restaurant-hero";
import { ReviewsSlider } from "@/app/(routes)/_components/reviews-slider";
import RestaurantMetaSection from "./restaurant-meta-section";
import RelatedLinks from "./related-links";

interface RestaurantDetailClientProps {
  slug: string;
  initialRestaurant?: Restaurant;
  renderHero?: boolean;
  initialCityRestaurants?: Restaurant[];
}

export default function RestaurantDetailClient({ 
  slug, 
  initialRestaurant, 
  renderHero = true,
  initialCityRestaurants = [],
}: RestaurantDetailClientProps) {
  // Skip client-side fetching if we have initial data from server
  const skipFetch = !!initialRestaurant;
  
  const {
    restaurant,
    loading,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useRestaurantWithListings(slug, true, skipFetch);

  // Use initial data when available, otherwise use hook data
  const hydratedRestaurant = initialRestaurant || restaurant;
  const listings = hydratedRestaurant?.listings || [];
  const restaurantCity = hydratedRestaurant?.city;

  // Fetch city restaurants for Recent Reviews section
  const {
    restaurants: cityRestaurants,
    loading: cityLoading,
    error: cityError,
  } = useCityListings(restaurantCity || "");

  // Use initial data if available, otherwise use hook data
  const displayCityRestaurants = cityRestaurants.length > 0 
    ? cityRestaurants 
    : initialCityRestaurants;

  // Filter out the current restaurant from city restaurants
  const filteredCityRestaurants = displayCityRestaurants.filter(
    (r) => r.slug !== slug
  );

  const handleRefresh = () => {
    refetchRestaurant?.();
  };

  // Only show error if we don't have initial data and there's an error
  const error = !initialRestaurant ? restaurantError : null;

  // Only show loading skeleton if we don't have initial data and are loading
  if (loading && !hydratedRestaurant && !initialRestaurant) {
    return <SkeletonLoading />;
  }

  if (error || !hydratedRestaurant) {
    return (
      <div className="min-h-screen bg-cream">
        <ErrorCard
          title={error ? "Something went wrong" : "Restaurant not found"}
          message={
            error
              ? "We&apos;re having trouble loading this restaurant. Please try again later."
              : "The restaurant you&apos;re looking for doesn&apos;t exist or has been removed."
          }
          error={error || undefined}
          onRefresh={error ? handleRefresh : undefined}
          showRefreshButton={!!error}
        />
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-cream p-2 mb-5">
      {renderHero && hydratedRestaurant && (
        <RestaurantHero restaurant={hydratedRestaurant} />
      )}

      <Script id="breadcrumb-jsonld" type="application/ld+json">
        {JSON.stringify(
          buildBreadcrumbJsonLd([
            { name: "Home", url: "https://www.nomtok.com" },
            { name: "Restaurants", url: "https://www.nomtok.com/restaurants" },
            {
              name: toTitleFromSlug(String(hydratedRestaurant?.slug)),
              url: `https://www.nomtok.com/restaurants/${String(hydratedRestaurant?.slug)}`,
            },
          ])
        )}
      </Script>

      <div className="relative -mt-16 mb-8 mx-2 z-10">
        <RestaurantMap
          restaurants={hydratedRestaurant ? [hydratedRestaurant] : []}
          selectedRestaurant={hydratedRestaurant}
          onRestaurantSelect={() => {}}
          className="h-[300px] md:h-[350px] max-w-6xl w-[70vw] max-md:w-[80vw] mx-auto rounded-xl shadow-lg"
          showRestaurantCount={false}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {hydratedRestaurant && <RestaurantKeyDetails restaurant={hydratedRestaurant} />}
        {hydratedRestaurant && <RestaurantMetaSection restaurant={hydratedRestaurant} />}

        {listings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Influencer Reviews
              <Badge variant="secondary" className="ml-2">
                {listings.length}
              </Badge>
            </h2>
            <div className="space-y-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} restaurant_name={hydratedRestaurant?.name} />
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No influencer reviews available for this restaurant yet.</p>
              <Button variant="outline" asChild>
                <Link href="/influencers">Browse Influencers</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hydratedRestaurant && (
          <RelatedLinks
            restaurant={hydratedRestaurant}
            influencer={listings[0]?.influencer}
          />
        )}

        {hydratedRestaurant?.google_place_id && <GoogleReviews placeId={hydratedRestaurant.google_place_id} />}
      </div>

      {/* Recent Reviews in City Section */}
      {restaurantCity && !cityError && filteredCityRestaurants.length > 0 && (
        <div className="py-12 px-4 bg-cream mt-8">
          <div className="max-w-7xl mx-auto">
            <ReviewsSlider
              restaurants={filteredCityRestaurants}
              title={`Recent Reviews in ${restaurantCity}`}
              description={`Discover more restaurant recommendations in ${restaurantCity}`}
              maxItems={6}
              loading={cityLoading && filteredCityRestaurants.length === 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
