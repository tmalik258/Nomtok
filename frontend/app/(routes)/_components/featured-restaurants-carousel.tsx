"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Link from "next/link";
import { RestaurantCard } from "@/components/restaurant-card";
import React, { useEffect, useState } from "react";

import type { FeaturedRestaurantsCarouselProps } from '@/lib/types';

export function FeaturedRestaurantsCarousel({
  cities,
}: FeaturedRestaurantsCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();

  const [displayedCity, setDisplayedCity] = useState("");

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateCity = () => {
      const newIndex = api.selectedScrollSnap();
      const currentRestaurant = cities.flatMap(cityData => cityData.restaurants)[newIndex];
      if (currentRestaurant && currentRestaurant.city && currentRestaurant.city !== displayedCity) {
        setDisplayedCity(currentRestaurant.city);
      }
    };

    api.on("select", updateCity);
    api.on("init", updateCity);
    
    // Automatically select first city on mount
    if (cities.length > 0 && cities[0].restaurants.length > 0 && !displayedCity) {
      setDisplayedCity(cities[0].city);
    }

    return () => {
      api.off("select", updateCity);
      api.off("init", updateCity);
    };
  }, [api, cities, displayedCity]);

  if (!cities || cities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No featured restaurants available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {displayedCity ? `${displayedCity}` : "Featured Cities & Restaurants"}
        </h2>
        <p className="text-muted-foreground mt-2">
          Discover the latest restaurant recommendations from top food cities
        </p>
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          slidesToScroll: 1,
          align: "start",
        }}
        className="w-full max-w-7xl mx-auto"
      >
        <CarouselContent className="-ml-4">
          {cities.flatMap((cityData) =>
            cityData.restaurants.map((restaurant) => (
              <CarouselItem
                key={`${cityData.city}-${restaurant.id}`}

                className="border-0 pl-2 md:basis-1/2 lg:basis-1/3 self-center"
              >
                <Card className="border-0 p-0 shadow-none">
                  <CardContent className="p-4">
                    <RestaurantCard
                      restaurant={restaurant}
                      listings={restaurant.listings || []}
                      showButton={false}
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:left-4 shadow-md cursor-pointer bg-orange-500 hover:bg-orange-600 text-white border-0 transition-all transform hover:scale-105 duration-300" />
        <CarouselNext className="-right-4 md:right-4 shadow-md cursor-pointer bg-orange-500 hover:bg-orange-600 text-white border-0 transition-all transform hover:scale-105 duration-300" />
      </Carousel>
      <div className="flex items-center justify-center">
        <Link
          href={`/restaurants?city=${encodeURIComponent(displayedCity)}`}
          className="rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-500 text-white hover:bg-orange-600 px-6 py-3"
        >
          View all restaurants in {displayedCity} →
        </Link>
      </div>
    </div>
  );
}
