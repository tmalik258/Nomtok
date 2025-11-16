"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedOptimized } from "@/lib/hooks/useFeaturedOptimized";
import { usePopularCities } from "@/lib/hooks";
import { FeaturedRestaurantsCarousel } from "./_components/featured-restaurants-carousel";
import ErrorCard from "@/components/error-card";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Use optimized hook for featured data
  const {
    data: featuredData,
    loading: featuredLoading,
    error: featuredError,
    refetch,
  } = useFeaturedOptimized();
  const { cities: popularCities, loading: citiesLoading } = usePopularCities();

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
      {/* Hero Section */}
      <div className="relative min-h-[calc(100vh-1rem)] flex items-center justify-center overflow-hidden pt-20 rounded-2xl">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/hero-main.jpg"
            alt="Food background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Where are you eating next?
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12">
            See what the experts recommend in your city.
          </p>

          {/* Search Form */}
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

          {/* Popular Cities */}
          <div className="mb-16">
            <p className="text-white/80 text-center mb-4">
              Popular destinations:
            </p>
            {popularCities?.length === 0 && !citiesLoading ? (
              <p className="text-white/80 text-center">
                No popular cities found
              </p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {citiesLoading
                  ? // Loading skeleton for cities
                    Array.from({ length: 6 }).map((_, index) => (
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

      {/* Featured Restaurants Section */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {featuredError ? (
            <ErrorCard
              title="Unable to Load Featured Restaurants"
              message={featuredError}
              onRefresh={refetch}
              showRefreshButton={true}
            />
          ) : featuredLoading ? (
            <div className="space-y-8">
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
              </div>
              <div className="flex justify-center gap-4 overflow-hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-80">
                    <Skeleton className="h-96 w-full rounded-lg" />
                  </div>
                ))}
              </div>
              <div className="text-center">
                <div className="h-10 bg-gray-200 rounded w-72 mx-auto mt-2"></div>
              </div>
            </div>
          ) : (
            <FeaturedRestaurantsCarousel cities={featuredData?.cities || []} />
          )}
        </div>
      </div>
    </div>
  );
}

// Metadata for the home page is provided at the (routes) layout level.
