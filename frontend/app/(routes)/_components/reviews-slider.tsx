"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { RestaurantCard } from "@/components/restaurant-card";
import { Restaurant } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewsSliderProps {
  restaurants: Restaurant[];
  title: string;
  description?: string;
  maxItems?: number;
  loading?: boolean;
}

export function ReviewsSlider({
  restaurants,
  title,
  description,
  maxItems = 6,
  loading = false,
}: ReviewsSliderProps) {
  // Limit to maxItems
  const displayedRestaurants = restaurants.slice(0, maxItems);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          {description && <Skeleton className="h-4 w-96 mx-auto" />}
        </div>
        <div className="flex justify-center gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-80">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No restaurants available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      <Carousel
        opts={{
          slidesToScroll: 1,
          align: "start",
        }}
        className="w-full max-w-7xl mx-auto"
      >
        <CarouselContent className="-ml-4">
          {displayedRestaurants.map((restaurant) => (
            <CarouselItem
              key={restaurant.slug}
              className="border-0 pl-2 md:basis-1/2 lg:basis-1/3 self-center"
            >
              <Card className="border-0 p-0 shadow-none bg-transparent">
                <CardContent className="p-4">
                  <RestaurantCard
                    restaurant={restaurant}
                    listings={restaurant.listings || []}
                    showButton={false}
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:left-4 shadow-md cursor-pointer bg-orange-500 hover:bg-orange-600 text-cream border-0 transition-all transform hover:scale-105 duration-300" />
        <CarouselNext className="-right-4 md:right-4 shadow-md cursor-pointer bg-orange-500 hover:bg-orange-600 text-cream border-0 transition-all transform hover:scale-105 duration-300" />
      </Carousel>
    </div>
  );
}

