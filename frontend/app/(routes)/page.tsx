import type { Metadata } from "next";
import axios from "axios";
import { unstable_cache } from "next/cache";
import HomeContent from "./_components/home-content";
import { buildPageMetadata } from "@/lib/seo/utils";
import type { Restaurant, Listing } from "@/lib/types";

export const revalidate = 3600;

async function fetchInitialData() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";

  // Fetch all data in parallel
  const [
    popularCitiesData,
    recentListingsData,
    markWeinsListingsData,
    restaurantsForAboutData,
  ] = await Promise.allSettled([
    // Popular cities
    axios.get(`${base}/restaurants/popular-cities/`),
    // Recent listings
    axios.get(`${base}/listings/`, {
      params: {
        approved_status: "Approved",
        sort_by: "created_at",
        sort_order: "desc",
        limit: 6,
        page: 1,
      },
    }),
    // Mark Weins listings
    axios.get(`${base}/listings/`, {
      params: {
        influencer_slug: "mark-wiens",
        approved_status: "Approved",
        limit: 6,
      },
    }),
    // Restaurants for About section (5 restaurants with photos)
    axios.get(`${base}/restaurants/`, {
      params: {
        limit: 20, // Get more to filter for ones with photos
      },
    }),
  ]);

  const popularCities =
    popularCitiesData.status === "fulfilled"
      ? popularCitiesData.value.data
      : [];

  // Convert recent listings to restaurants
  let recentRestaurants: Restaurant[] = [];
  if (recentListingsData.status === "fulfilled") {
    const listings = recentListingsData.value.data.listings || recentListingsData.value.data || [];
    const restaurantMap = new Map<string, Restaurant>();
    listings.forEach((listing: Listing) => {
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
    recentRestaurants = Array.from(restaurantMap.values());
  }

  // Convert Mark Weins listings to restaurants
  let markWeinsRestaurants: Restaurant[] = [];
  if (markWeinsListingsData.status === "fulfilled") {
    const listings = markWeinsListingsData.value.data.listings || markWeinsListingsData.value.data || [];
    const restaurantMap = new Map<string, Restaurant>();
    listings.slice(0, 6).forEach((listing: Listing) => {
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
    markWeinsRestaurants = Array.from(restaurantMap.values());
  }

  // Get restaurants for About section (with photos)
  // Prioritize restaurants with photos, but fallback to any restaurants if needed
  let aboutRestaurants: Restaurant[] = [];
  if (restaurantsForAboutData.status === "fulfilled") {
    const restaurants =
      restaurantsForAboutData.value.data.restaurants ||
      restaurantsForAboutData.value.data ||
      [];
    // Filter for restaurants with photos first
    const restaurantsWithPhotos = restaurants.filter((r: Restaurant) => r.photo_url);
    
    if (restaurantsWithPhotos.length >= 5) {
      aboutRestaurants = restaurantsWithPhotos.slice(0, 5);
    } else if (restaurantsWithPhotos.length > 0) {
      // If we have some but not 5, use what we have
      aboutRestaurants = restaurantsWithPhotos;
    } else if (restaurants.length > 0) {
      // Fallback: use any restaurants if none have photos (up to 5)
      aboutRestaurants = restaurants.slice(0, 5);
    }
  }

  // Fetch city-specific restaurants for top 2 cities
  let city1Restaurants: Restaurant[] = [];
  let city2Restaurants: Restaurant[] = [];

  if (popularCities.length > 0) {
    const [city1Data, city2Data] = await Promise.allSettled([
      axios.get(`${base}/restaurants/`, {
        params: {
          city: popularCities[0],
          include_listings: true,
          limit: 50,
        },
      }),
      popularCities.length > 1
        ? axios.get(`${base}/restaurants/`, {
            params: {
              city: popularCities[1],
              include_listings: true,
              limit: 50,
            },
          })
        : Promise.resolve({ data: { restaurants: [] } }),
    ]);

    // Process city 1 restaurants
    if (city1Data.status === "fulfilled") {
      const data = city1Data.value.data;
      const restaurants = Array.isArray(data)
        ? data
        : (data?.restaurants || []);
      
      if (Array.isArray(restaurants)) {
        const restaurantsWithListings = restaurants.filter(
          (r: Restaurant) =>
            r.listings &&
            r.listings.length > 0 &&
            r.listings.some((l: Listing) => l.approved === true)
        );
        const restaurantsWithApprovedListings = restaurantsWithListings.map(
          (r: Restaurant) => ({
            ...r,
            listings: r.listings?.filter((l: Listing) => l.approved === true) || [],
          })
        );
        city1Restaurants = restaurantsWithApprovedListings
          .sort((a, b) => {
            const aRating = a.google_rating || 0;
            const bRating = b.google_rating || 0;
            if (bRating !== aRating) {
              return bRating - aRating;
            }
            return (b.listings?.length || 0) - (a.listings?.length || 0);
          })
          .slice(0, 6);
      }
    }

    // Process city 2 restaurants
    if (city2Data.status === "fulfilled") {
      const data = city2Data.value.data;
      const restaurants = Array.isArray(data)
        ? data
        : (data?.restaurants || []);
      
      if (Array.isArray(restaurants)) {
        const restaurantsWithListings = restaurants.filter(
          (r: Restaurant) =>
            r.listings &&
            r.listings.length > 0 &&
            r.listings.some((l: Listing) => l.approved === true)
        );
        const restaurantsWithApprovedListings = restaurantsWithListings.map(
          (r: Restaurant) => ({
            ...r,
            listings: r.listings?.filter((l: Listing) => l.approved === true) || [],
          })
        );
        city2Restaurants = restaurantsWithApprovedListings
          .sort((a, b) => {
            const aRating = a.google_rating || 0;
            const bRating = b.google_rating || 0;
            if (bRating !== aRating) {
              return bRating - aRating;
            }
            return (b.listings?.length || 0) - (a.listings?.length || 0);
          })
          .slice(0, 6);
      }
    }
  }

  return {
    recentRestaurants,
    city1Restaurants,
    city2Restaurants,
    markWeinsRestaurants,
    aboutRestaurants,
  };
}

export default async function Home() {
  const getCachedData = unstable_cache(
    async () => fetchInitialData(),
    ["home-page-data"],
    { revalidate: 3600 }
  );

  const {
    recentRestaurants,
    city1Restaurants,
    city2Restaurants,
    markWeinsRestaurants,
    aboutRestaurants,
  } = await getCachedData();

  return (
    <HomeContent
      initialRecentRestaurants={recentRestaurants}
      initialCity1Restaurants={city1Restaurants}
      initialCity2Restaurants={city2Restaurants}
      initialMarkWeinsRestaurants={markWeinsRestaurants}
      initialAboutRestaurants={aboutRestaurants}
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
