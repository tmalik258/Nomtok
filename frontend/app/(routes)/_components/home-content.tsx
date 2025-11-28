"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePopularCities, useRecentListings, useCityListings, useInfluencerListings } from "@/lib/hooks";
import { ReviewsSlider } from "../_components/reviews-slider";
import { AboutNomtokSection } from "../_components/about-nomtok-section";
import { Restaurant, Listing } from "@/lib/types";
import ErrorCard from "@/components/error-card";

interface HomeContentProps {
  initialRecentRestaurants?: Restaurant[];
  initialCity1Restaurants?: Restaurant[];
  initialCity2Restaurants?: Restaurant[];
  initialMarkWeinsRestaurants?: Restaurant[];
  initialAboutRestaurants?: Restaurant[];
  initialPopularCities?: string[];
}

export default function HomeContent({
  initialRecentRestaurants = [],
  initialCity1Restaurants = [],
  initialCity2Restaurants = [],
  initialMarkWeinsRestaurants = [],
  initialAboutRestaurants = [],
  initialPopularCities = [],
}: HomeContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Use server-side cities if available, otherwise fallback to client-side hook
  const { cities: clientPopularCities, loading: citiesLoading } = usePopularCities();
  const popularCities = initialPopularCities.length > 0 ? initialPopularCities : clientPopularCities;
  
  // Recent Reviews Section
  const {
    restaurants: recentRestaurants,
    loading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useRecentListings();

  // Top Reviews - First City
  // ALWAYS skip client-side fetch if we have initial server data (ISR/SSR) for instant display
  // Only fetch client-side as fallback if server data is missing
  const hasInitialCity1Data = initialCity1Restaurants.length > 0;
  const firstCity = popularCities[0];
  // Only pass city if we don't have initial data (to avoid hook from running unnecessarily)
  const {
    restaurants: city1Restaurants,
    loading: city1Loading,
    error: city1Error,
    refetch: refetchCity1,
  } = useCityListings(
    hasInitialCity1Data ? "" : (firstCity || ""), 
    hasInitialCity1Data, 
    initialCity1Restaurants
  );

  // Top Reviews - Second City
  // ALWAYS skip client-side fetch if we have initial server data (ISR/SSR) for instant display
  // Only fetch client-side as fallback if server data is missing
  const hasInitialCity2Data = initialCity2Restaurants.length > 0;
  const secondCity = popularCities[1];
  // Only pass city if we don't have initial data (to avoid hook from running unnecessarily)
  const {
    restaurants: city2Restaurants,
    loading: city2Loading,
    error: city2Error,
    refetch: refetchCity2,
  } = useCityListings(
    hasInitialCity2Data ? "" : (secondCity || ""), 
    hasInitialCity2Data, 
    initialCity2Restaurants
  );

  // Latest Reviews by Mark Weins
  const {
    listings: markWeinsListings,
    loading: markWeinsLoading,
    error: markWeinsError,
    refetch: refetchMarkWeins,
  } = useInfluencerListings("mark-wiens");

  // Convert Mark Weins listings to restaurants
  const markWeinsRestaurants = useMemo(() => {
    if (!markWeinsListings || markWeinsListings.length === 0) {
      return initialMarkWeinsRestaurants;
    }
    const restaurantMap = new Map<string, Restaurant>();
    markWeinsListings.slice(0, 6).forEach((listing: Listing) => {
      if (listing.restaurant) {
        const restaurantId = listing.restaurant.id;
        if (!restaurantMap.has(restaurantId)) {
          restaurantMap.set(restaurantId, {
            ...listing.restaurant,
            listings: [],
          });
        }
        const restaurant = restaurantMap.get(restaurantId)!;
        if (restaurant.listings) {
          restaurant.listings.push(listing);
        } else {
          restaurant.listings = [listing];
        }
      }
    });
    return Array.from(restaurantMap.values());
  }, [markWeinsListings, initialMarkWeinsRestaurants]);

  // ALWAYS prioritize server-side initial data (ISR/SSR) for instant display and SEO
  // Client-side hooks are ONLY used as fallback if server data fails to load
  const displayRecentRestaurants = initialRecentRestaurants.length > 0 ? initialRecentRestaurants : recentRestaurants;
  const displayCity1Restaurants = initialCity1Restaurants.length > 0 ? initialCity1Restaurants : city1Restaurants;
  const displayCity2Restaurants = initialCity2Restaurants.length > 0 ? initialCity2Restaurants : city2Restaurants;
  const displayMarkWeinsRestaurants = initialMarkWeinsRestaurants.length > 0 ? initialMarkWeinsRestaurants : markWeinsRestaurants;
  
  // For About section, use initial data if available, otherwise try to get from recent restaurants
  const displayAboutRestaurants = initialAboutRestaurants.length > 0 
    ? initialAboutRestaurants 
    : displayRecentRestaurants.filter(r => r.photo_url).slice(0, 5);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/restaurants?city=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  const handleCityClick = (city: string) => {
    router.push(`/restaurants?city=${encodeURIComponent(city)}`);
  };

  return (
    <div className="min-h-screen p-2">
      <div className="relative min-h-[calc(100vh-1rem)] flex items-center justify-center overflow-hidden pt-20 rounded-2xl">
        <div className="absolute inset-0">
          <Image
            src="/hero-main.jpg"
            alt="Food background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Where are you eating next?
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12">
            See what the experts recommend in your city.
          </p>

          <div className="max-w-2xl mx-auto mb-12">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Enter your city or suburb"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-5 text-lg bg-white border-0 rounded-l-lg sm:rounded-r-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-r-lg sm:rounded-l-none transition-all duration-200 hover:scale-105 cursor-pointer"
                disabled={!searchQuery.trim()}
              >
                Find Restaurants
              </Button>
            </form>
          </div>

          <div className="mb-16">
            <p className="text-white/80 text-center mb-4">Popular destinations:</p>
            {popularCities?.length === 0 && !citiesLoading ? (
              <p className="text-white/80 text-center">No popular cities found</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {citiesLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-10 w-24 rounded-full bg-white/10"
                      />
                    ))
                  : popularCities.map((city) => (
                      <Button
                        key={city}
                        variant="outline"
                        onClick={() => handleCityClick(city)}
                        className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white hover:text-white rounded-full hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-orange-500/50 hover:scale-105 cursor-pointer"
                      >
                        {city}
                      </Button>
                    ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reviews Section */}
      <div className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {recentError ? (
            <ErrorCard
              title="Unable to Load Recent Reviews"
              message={recentError}
              onRefresh={refetchRecent}
              showRefreshButton={true}
            />
          ) : (
            <ReviewsSlider
              restaurants={displayRecentRestaurants}
              title="Recent Reviews"
              description="Discover the latest restaurant recommendations from top food creators"
              maxItems={6}
              loading={recentLoading && displayRecentRestaurants.length === 0}
            />
          )}
        </div>
      </div>

      {/* About Nomtok Section - Always show if we have restaurants */}
      {displayAboutRestaurants.length > 0 ? (
        <AboutNomtokSection restaurants={displayAboutRestaurants} />
      ) : (
        // Fallback: Show section with placeholder if no restaurants with photos
        <div className="py-12 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold tracking-tight">
                  About Nomtok
                </h2>
                <div className="space-y-4 text-lg text-gray-700">
                  <p>
                    Nomtok is your trusted guide to discovering exceptional
                    restaurants curated by the world&apos;s top food creators and
                    celebrity chefs. We transform authentic video reviews into
                    actionable recommendations, helping you find the perfect dining
                    experience in your city.
                  </p>
                  <p>
                    Our platform aggregates expert reviews from renowned food
                    influencers, providing you with honest insights, detailed
                    recommendations, and city-specific picks that go beyond typical
                    restaurant listings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Reviews Section - First City */}
      {(displayCity1Restaurants.length > 0 || (firstCity && !hasInitialCity1Data && city1Loading)) && (
        <div className="py-12 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            {city1Error && !hasInitialCity1Data ? (
              <ErrorCard
                title={`Unable to Load Top Reviews for ${firstCity}`}
                message={city1Error}
                onRefresh={refetchCity1}
                showRefreshButton={true}
              />
            ) : (
              <ReviewsSlider
                restaurants={displayCity1Restaurants}
                title={`Top Reviews - ${firstCity || initialPopularCities[0] || 'City'}`}
                description={`Discover the best restaurant recommendations in ${firstCity || initialPopularCities[0] || 'this city'}`}
                maxItems={6}
                loading={!hasInitialCity1Data && city1Loading && displayCity1Restaurants.length === 0}
              />
            )}
          </div>
        </div>
      )}

      {/* Latest Reviews by Mark Weins */}
      <div className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {markWeinsError ? (
            <ErrorCard
              title="Unable to Load Mark Weins Reviews"
              message={markWeinsError}
              onRefresh={refetchMarkWeins}
              showRefreshButton={true}
            />
          ) : (
            <ReviewsSlider
              restaurants={displayMarkWeinsRestaurants}
              title="Latest Reviews by Mark Weins"
              description="Explore the most recent restaurant recommendations from Mark Weins"
              maxItems={6}
              loading={markWeinsLoading && displayMarkWeinsRestaurants.length === 0}
            />
          )}
        </div>
      </div>

      {/* Top Reviews Section - Second City */}
      {(displayCity2Restaurants.length > 0 || (secondCity && !hasInitialCity2Data && city2Loading)) && (
        <div className="py-12 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            {city2Error && !hasInitialCity2Data ? (
              <ErrorCard
                title={`Unable to Load Top Reviews for ${secondCity}`}
                message={city2Error}
                onRefresh={refetchCity2}
                showRefreshButton={true}
              />
            ) : (
              <ReviewsSlider
                restaurants={displayCity2Restaurants}
                title={`Top Reviews - ${secondCity || initialPopularCities[1] || 'City'}`}
                description={`Discover the best restaurant recommendations in ${secondCity || initialPopularCities[1] || 'this city'}`}
                maxItems={6}
                loading={!hasInitialCity2Data && city2Loading && displayCity2Restaurants.length === 0}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
