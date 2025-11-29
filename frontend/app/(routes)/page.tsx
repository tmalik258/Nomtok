import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import HomeContent from "./_components/home-content";
import HomeLoadingSkeleton from "./_components/home-loading-skeleton";
import { buildPageMetadata } from "@/lib/seo/utils";
import { fetchHomePageData } from "@/lib/actions";
import type { Restaurant } from "@/lib/types";

export const revalidate = 3600;

async function HomeContentWrapper() {
  const getCachedData = unstable_cache(
    async () => fetchHomePageData(),
    ["home-page-data"],
    { revalidate: 3600 }
  );

  let recentRestaurants: Restaurant[] = [];
  let city1Restaurants: Restaurant[] = [];
  let city2Restaurants: Restaurant[] = [];
  let markWeinsRestaurants: Restaurant[] = [];
  let aboutRestaurants: Restaurant[] = [];
  let popularCities: string[] = [];

  try {
    const data = await getCachedData();
    recentRestaurants = data.recentRestaurants || [];
    city1Restaurants = data.city1Restaurants || [];
    city2Restaurants = data.city2Restaurants || [];
    markWeinsRestaurants = data.markWeinsRestaurants || [];
    aboutRestaurants = data.aboutRestaurants || [];
    popularCities = data.popularCities || [];
  } catch (error) {
    console.error("Error fetching home page data:", error);
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

export default async function Home() {
  return (
    <Suspense fallback={<HomeLoadingSkeleton />}>
      <HomeContentWrapper />
    </Suspense>
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
