"use client";

import { useParams } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/utils";
import { toTitleFromSlug } from "@/lib/seo/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo/utils";
import Script from "next/script";
import { useRestaurantWithListings } from "@/lib/hooks";
import { MapPin, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RestaurantMap from "@/components/dynamic-restaurant-map";
import GoogleReviews from "@/components/google-reviews";
import ErrorCard from "@/components/error-card";
import SkeletonLoading from "./_components/skeleton-loading";
import SocialShareButtons from "@/components/social-share-buttons";
import ListingCard from "./_components/listing-card";
import RestaurantKeyDetails from "./_components/restaurant-key-details";
import RestaurantImage from "@/components/restaurant-image";

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantSlug = params.slug as string;

  const {
    restaurant,
    loading,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useRestaurantWithListings(restaurantSlug, true); // Include video details for restaurant page
  
  // Extract listings from restaurant data
  const listings = restaurant?.listings || [];

  const handleRefresh = () => {
    refetchRestaurant?.();
  };

  const error = restaurantError;

  if (loading) {
    return (
      <SkeletonLoading />
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-white">
        <ErrorCard
          title={error ? "Something went wrong" : "Restaurant not found"}
          message={error ? "We're having trouble loading this restaurant. Please try again later." : "The restaurant you're looking for doesn't exist or has been removed."}
          error={error || undefined}
          onRefresh={error ? handleRefresh : undefined}
          showRefreshButton={!!error}
        />
      </div>
    );
  }

  const business_status = restaurant?.business_status?.toLowerCase() === "operational" ? "Open" : restaurant?.business_status;

  return (
    <div className="min-h-screen bg-white p-2 mb-5">
      {/* Full Width Hero Section with Overlay Title */}
      <div className="relative h-[calc(65vh)] rounded-xl overflow-hidden">
        <RestaurantImage
          src={restaurant.photo_url || undefined}
          alt={restaurant.name}
          restaurantSlug={String(restaurant.slug)}
          className="brightness-[0.5] filter"
          sizes="100vw"
          fill
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Title Overlay */}
        <div className="absolute bottom-20 left-0 right-0 text-center p-6 md:p-8 z-50">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-xl">
            {restaurant.name}
          </h1>
          <div className="text-white mb-4">
            {restaurant.address}
          </div>
          <div className="flex items-center justify-center rounded-lg text-white gap-5 mb-4">
            <div className="flex items-center gap-1">
              <Badge className="bg-white text-black">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.city}</span>
                </div>
              </Badge>
            </div>
            {/* Business Status - Right Aligned */}
            <div className="flex items-center">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-100"
              >
                {business_status}
              </Badge>
            </div>
          </div>
          {/* Social Share Buttons */}
          <div className="flex justify-center">
            <SocialShareButtons
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={`Check out ${restaurant.name} - Amazing restaurant in ${restaurant.city}`}
              variant="inline"
              className="bg-white backdrop-blur-sm border-white/20 px-4 py-1 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Breadcrumb JSON-LD */}
      <Script id="breadcrumb-jsonld" type="application/ld+json">
        {JSON.stringify(
          buildBreadcrumbJsonLd([
            { name: "Home", url: "https://www.nomtok.com" },
            { name: "Restaurants", url: "https://www.nomtok.com/restaurants" },
            { name: toTitleFromSlug(String(restaurant.slug)), url: `https://www.nomtok.com/restaurants/${String(restaurant.slug)}` },
          ])
        )}
      </Script>
      {/* Overlapping Restaurant Map */}
      <div className="relative -mt-16 mb-8 mx-2 z-10">
        <RestaurantMap
          restaurants={[restaurant]}
          selectedRestaurant={restaurant}
          onRestaurantSelect={() => {}}
          className="h-[300px] md:h-[350px] max-w-6xl w-[70vw] max-md:w-[80vw] mx-auto rounded-xl shadow-lg"
          showRestaurantCount={false}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Key Details */}
        <RestaurantKeyDetails restaurant={restaurant} />
        {/* Influencer Reviews */}
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
                <ListingCard key={listing.id} listing={listing} restaurant_name={restaurant?.name} />
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                No influencer reviews available for this restaurant yet.
              </p>
              <Button variant="outline" asChild>
                <Link href="/influencers">Browse Influencers</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Google Maps Reviews */}
        {restaurant.google_place_id && (
          <GoogleReviews placeId={restaurant.google_place_id} />
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = `${toTitleFromSlug(params.slug)} — Restaurant`;
  const description = `Discover ${toTitleFromSlug(params.slug)} — reviews, location, and influencer recommendations.`;
  return buildPageMetadata({
    title,
    description,
    path: `/restaurants/${params.slug}`,
    type: "article",
    keywords: ["restaurant", params.slug, "city", "reviews"],
    imageUrl: "/hero-main.jpg",
  });
}
