import type { Listing } from "@/lib/types/index";

export const getUniqueRestaurantsCount = (listings: Listing[]): number => {
  return new Set(listings.map((listing) => listing?.restaurant?.slug)).size;
};

export const getUniqueCitiesCount = (listings: Listing[]): number => {
  if (!listings || listings.length === 0) return 0;
  
  const uniqueCities = new Set(
    listings
      .map((listing) => listing?.restaurant?.city)
      .filter((city): city is string => Boolean(city))
  );
  
  return uniqueCities.size;
};

export const getMostReviewedCuisine = (listings: Listing[]): string => {
  if (!listings || listings.length === 0) return "Cuisine";

  const cuisineCount: Record<string, number> = {};

  listings.forEach((listing) => {
    listing?.restaurant?.cuisines?.forEach((cuisine) => {
      if (cuisine?.name) {
        cuisineCount[cuisine.name] = (cuisineCount[cuisine.name] || 0) + 1;
      }
    });
  });

  if (Object.keys(cuisineCount).length === 0) return "Cuisine";

  const mostReviewedCuisine = Object.entries(cuisineCount)
    .sort(([, a], [, b]) => b - a)[0][0];

  return mostReviewedCuisine;
};