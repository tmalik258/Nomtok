import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import HomeContent from "./_components/home-content";
import { buildPageMetadata } from "@/lib/seo/utils";
import { fetchHomePageData } from "@/lib/actions";
import type { Restaurant } from "@/lib/types";

export const revalidate = 3600;

export default async function Home() {
  // Don't cache errors - only cache successful responses
  let recentRestaurants: Restaurant[] = [];
  let city1Restaurants: Restaurant[] = [];
  let city2Restaurants: Restaurant[] = [];
  let markWeinsRestaurants: Restaurant[] = [];
  let aboutRestaurants: Restaurant[] = [];
  let popularCities: string[] = [];

  try {
    const getCachedData = unstable_cache(
      async () => {
        console.log('[HomePage] Cache miss - fetching fresh data');
        try {
          const data = await fetchHomePageData();
          console.log('[HomePage] Data fetched successfully:', {
            recent: data.recentRestaurants?.length || 0,
            city1: data.city1Restaurants?.length || 0,
            city2: data.city2Restaurants?.length || 0,
            markWeins: data.markWeinsRestaurants?.length || 0,
            about: data.aboutRestaurants?.length || 0,
            cities: data.popularCities?.length || 0,
          });
          return data;
        } catch (fetchError) {
          console.error('[HomePage] Error in fetchHomePageData:', fetchError);
          // Return empty data structure instead of throwing
          // This prevents caching errors
          return {
            recentRestaurants: [],
            city1Restaurants: [],
            city2Restaurants: [],
            markWeinsRestaurants: [],
            aboutRestaurants: [],
            popularCities: [],
          };
        }
      },
      ["home-page-data"],
      { revalidate: 3600 }
    );

    const data = await getCachedData();
    recentRestaurants = data.recentRestaurants || [];
    city1Restaurants = data.city1Restaurants || [];
    city2Restaurants = data.city2Restaurants || [];
    markWeinsRestaurants = data.markWeinsRestaurants || [];
    aboutRestaurants = data.aboutRestaurants || [];
    popularCities = data.popularCities || [];
    
    console.log('[HomePage] Final data to render:', {
      recent: recentRestaurants.length,
      city1: city1Restaurants.length,
      city2: city2Restaurants.length,
      markWeins: markWeinsRestaurants.length,
      about: aboutRestaurants.length,
      cities: popularCities.length,
    });
  } catch (error) {
    console.error("[HomePage] Critical error fetching home page data:", error);
    // Use empty arrays as fallback - page will still render
  }

  return (
    <HomeContent
      initialRecentRestaurants={recentRestaurants}
      initialCity1Restaurants={city1Restaurants}
      initialCity2Restaurants={city2Restaurants}
      initialMarkWeinsRestaurants={markWeinsRestaurants}
      initialAboutRestaurants={aboutRestaurants}
      initialPopularCities={popularCities}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Nomtok - Discover Top Restaurant Recommendations",
    description:
      "Discover exceptional restaurants curated by the world's top food creators and celebrity chefs. Find authentic reviews, detailed recommendations, and city-specific picks from renowned food influencers.",
    path: "/",
    type: "website",
    keywords: [
      "nomtok",
      "restaurants",
      "food influencers",
      "restaurant recommendations",
      "city guides",
      "food reviews",
      "celebrity chefs",
      "dining",
    ],
    imageUrl: "/hero-main.jpg",
  });
}
