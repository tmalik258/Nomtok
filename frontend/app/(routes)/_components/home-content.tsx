"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReviewsSlider } from "../_components/reviews-slider";
import { AboutNomtokSection } from "../_components/about-nomtok-section";
import { Restaurant } from "@/lib/types";

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

  // Use only server-rendered data - no client-side fetching
  const popularCities = initialPopularCities;
  const displayRecentRestaurants = initialRecentRestaurants;
  const displayCity1Restaurants = initialCity1Restaurants;
  const displayCity2Restaurants = initialCity2Restaurants;
  const displayMarkWeinsRestaurants = initialMarkWeinsRestaurants;
  const displayAboutRestaurants = initialAboutRestaurants.length > 0 
    ? initialAboutRestaurants 
    : displayRecentRestaurants.filter(r => r.photo_url).slice(0, 5);
  
  // Get city names for section titles
  const firstCityName = initialPopularCities[0] || "City";
  const secondCityName = initialPopularCities[1] || "City";

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
            src="/hero-main.webp"
            alt="Food background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-cream mb-6 leading-tight">
            Where are you eating next?
          </h1>
          <p className="text-xl md:text-2xl text-cream/90 mb-12">
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
                  className="pl-12 pr-4 py-5 text-lg bg-cream border-0 rounded-l-lg sm:rounded-r-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-orange-600 hover:bg-orange-500 text-cream rounded-r-lg sm:rounded-l-none transition-all duration-200 hover:scale-105 cursor-pointer"
                disabled={!searchQuery.trim()}
              >
                Find Restaurants
              </Button>
            </form>
          </div>

          <div className="mb-16">
            <p className="text-cream/80 text-center mb-4">Popular destinations:</p>
            {popularCities?.length === 0 ? (
              <p className="text-cream/80 text-center">No popular cities found</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {popularCities.map((city) => (
                  <Button
                    key={city}
                    variant="outline"
                    onClick={() => handleCityClick(city)}
                    className="px-4 py-2 bg-cream/10 backdrop-blur-sm text-cream hover:text-cream rounded-full hover:bg-cream/20 transition-all duration-200 border border-orange-500/50 hover:border-orange-500/50 hover:scale-105 cursor-pointer"
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
      {displayRecentRestaurants.length > 0 && (
        <div className="py-12 px-4 bg-cream">
          <div className="max-w-7xl mx-auto">
            <ReviewsSlider
              restaurants={displayRecentRestaurants}
              title="Recent Reviews"
              description="Discover the latest restaurant recommendations from top food creators"
              maxItems={6}
            />
          </div>
        </div>
      )}

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
      {displayCity1Restaurants.length > 0 && (
        <div className="py-12 px-4 bg-cream">
          <div className="max-w-7xl mx-auto">
            <ReviewsSlider
              restaurants={displayCity1Restaurants}
              title={`Top Reviews - ${firstCityName}`}
              description={`Discover the best restaurant recommendations in ${firstCityName}`}
              maxItems={6}
            />
          </div>
        </div>
      )}

      {/* Latest Reviews by Mark Weins */}
      {displayMarkWeinsRestaurants.length > 0 && (
        <div className="py-12 px-4 bg-cream">
          <div className="max-w-7xl mx-auto">
            <ReviewsSlider
              restaurants={displayMarkWeinsRestaurants}
              title="Latest Reviews by Mark Weins"
              description="Explore the most recent restaurant recommendations from Mark Weins"
              maxItems={6}
            />
          </div>
        </div>
      )}

      {/* Top Reviews Section - Second City */}
      {displayCity2Restaurants.length > 0 && (
        <div className="py-12 px-4 bg-cream">
          <div className="max-w-7xl mx-auto">
            <ReviewsSlider
              restaurants={displayCity2Restaurants}
              title={`Top Reviews - ${secondCityName}`}
              description={`Discover the best restaurant recommendations in ${secondCityName}`}
              maxItems={6}
            />
          </div>
        </div>
      )}
    </div>
  );
}
