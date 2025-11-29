import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import HomeContent from "./_components/home-content";
import { buildPageMetadata } from "@/lib/seo/utils";
import { fetchHomePageData } from "@/lib/actions";
import type { Restaurant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let recentRestaurants: Restaurant[] = [];
  let city1Restaurants: Restaurant[] = [];
  let city2Restaurants: Restaurant[] = [];
  let markWeinsRestaurants: Restaurant[] = [];
  let aboutRestaurants: Restaurant[] = [];
  let popularCities: string[] = [];

  // Fetch home page data with error logging
  try {
    const getCachedData = unstable_cache(
      async () => {
        const data = await fetchHomePageData();
        return data;
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
  } catch (error) {
    // Log errors but still render page with empty data
    // This allows the page to render during build even if backend isn't available
    console.error('[HomePage] Error fetching home page data:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    // Page will render with empty data, and ISR will fetch fresh data on first request
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
