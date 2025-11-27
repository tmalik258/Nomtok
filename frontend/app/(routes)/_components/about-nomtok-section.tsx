"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Restaurant } from "@/lib/types";
import RestaurantImage from "@/components/restaurant-image";

interface AboutNomtokSectionProps {
  restaurants: Restaurant[];
}

export function AboutNomtokSection({
  restaurants,
}: AboutNomtokSectionProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    if (!api) {
      return;
    }

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Limit to 5 restaurants
  const displayRestaurants = restaurants.slice(0, 5);

  return (
    <div className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Description */}
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
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Key Features:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Curated recommendations from top food creators</li>
                  <li>City-based restaurant discovery</li>
                  <li>Authentic reviews with detailed insights</li>
                  <li>Expert picks from celebrity chefs</li>
                  <li>Discover hidden gems in your area</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Auto-rotating Image Slider */}
          <div className="relative">
            <Carousel
              setApi={setApi}
              opts={{
                slidesToScroll: 1,
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {displayRestaurants.map((restaurant, index) => (
                  <CarouselItem key={restaurant.slug}>
                    <div className="relative h-96 rounded-lg overflow-hidden">
                      <RestaurantImage
                        src={restaurant.photo_url || undefined}
                        alt={restaurant.name}
                        restaurantSlug={String(restaurant.slug)}
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                        <h3 className="text-white font-semibold text-xl">
                          {restaurant.name}
                        </h3>
                        {restaurant.city && (
                          <p className="text-white/90 text-sm">{restaurant.city}</p>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {/* Indicator dots */}
            <div className="flex justify-center gap-2 mt-4">
              {displayRestaurants.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === current
                      ? "w-8 bg-orange-500"
                      : "w-2 bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

