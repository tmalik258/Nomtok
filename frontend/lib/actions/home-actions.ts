import axios from 'axios';
import type { Restaurant, Listing } from '@/lib/types';

interface HomePageData {
  recentRestaurants: Restaurant[];
  city1Restaurants: Restaurant[];
  city2Restaurants: Restaurant[];
  markWeinsRestaurants: Restaurant[];
  aboutRestaurants: Restaurant[];
  popularCities: string[];
}

export async function fetchHomePageData(): Promise<HomePageData> {
  // Use direct axios calls for server-side rendering
  // The /api proxy doesn't work in server components
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8030';
  const apiClient = axios.create({
    baseURL: base,
    timeout: 60000, // Increased timeout to 60 seconds for heavy queries
  });

  // Fetch all data in parallel
  console.log('[HomePage] Fetching data from:', base);
  const [
    popularCitiesData,
    topCitiesData,
    recentRestaurantsData,
    markWeinsRestaurantsData,
    restaurantsForAboutData,
  ] = await Promise.allSettled([
    // Popular cities (full list of top 5)
    apiClient.get('/restaurants/popular-cities/').then(res => {
      console.log('[HomePage] Popular cities fetched:', res.data?.length || 0);
      return res.data;
    }),
    // Top cities with restaurants (top 2 cities with their restaurants)
    apiClient.get('/restaurants/top-cities-with-restaurants/', {
      params: { limit: 2, restaurants_per_city: 6 },
    }).then(res => {
      console.log('[HomePage] Top cities fetched:', res.data?.cities?.length || 0);
      return res.data;
    }),
    // Recent restaurants (with listings to sort by most recent listing)
    // Reduced limit to 20 to avoid timeout - we only need 6 anyway
    apiClient.get('/restaurants/', {
      params: {
        sort_by: 'updated',
        limit: 6,
        include_listings: true,
      },
    }).then(res => {
      const data = res.data;
      const restaurants = Array.isArray(data) ? data : (data?.restaurants || []);
      console.log('[HomePage] Recent restaurants fetched:', restaurants.length);
      return res.data;
    }),
    // Mark Weins restaurants
    // Reduced limit to 20 to avoid timeout - we only need 6 anyway
    apiClient.get('/restaurants/', {
      params: {
        influencer_id: 'mark-wiens',
        limit: 6,
        include_listings: true,
      },
    }).then(res => {
      const data = res.data;
      const restaurants = Array.isArray(data) ? data : (data?.restaurants || []);
      console.log('[HomePage] Mark Weins restaurants fetched:', restaurants.length);
      return res.data;
    }),
    // Restaurants for About section (5 restaurants with photos)
    apiClient.get('/restaurants/', {
      params: {
        limit: 10,
      },
    }).then(res => {
      const data = res.data;
      const restaurants = Array.isArray(data) ? data : (data?.restaurants || []);
      console.log('[HomePage] About restaurants fetched:', restaurants.length);
      return res.data;
    }),
  ]);

  // Get popular cities (full list)
  const popularCities =
    popularCitiesData.status === 'fulfilled'
      ? popularCitiesData.value
      : [];

  // Extract restaurants from top cities response
  let city1Restaurants: Restaurant[] = [];
  let city2Restaurants: Restaurant[] = [];

  if (topCitiesData.status === 'fulfilled') {
    const citiesData = topCitiesData.value.cities || [];
    
    if (citiesData.length > 0) {
      city1Restaurants = processCityRestaurants(citiesData[0].restaurants || []);
    }
    if (citiesData.length > 1) {
      city2Restaurants = processCityRestaurants(citiesData[1].restaurants || []);
    }
  }

  // Process recent restaurants: filter for approved listings and sort by most recent listing
  let recentRestaurants: Restaurant[] = [];
  if (recentRestaurantsData.status === 'fulfilled') {
    const data = recentRestaurantsData.value;
    const restaurants = Array.isArray(data)
      ? data
      : data?.restaurants || [];
    recentRestaurants = processRecentRestaurants(restaurants);
  } else {
    console.error('Failed to fetch recent restaurants:', recentRestaurantsData.reason);
  }

  // Process Mark Weins restaurants: filter for approved listings
  let markWeinsRestaurants: Restaurant[] = [];
  if (markWeinsRestaurantsData.status === 'fulfilled') {
    const data = markWeinsRestaurantsData.value;
    const restaurants = Array.isArray(data)
      ? data
      : data?.restaurants || [];
    markWeinsRestaurants = processInfluencerRestaurants(restaurants);
  } else {
    console.error('Failed to fetch Mark Weins restaurants:', markWeinsRestaurantsData.reason);
  }

  // Get restaurants for About section (with photos)
  let aboutRestaurants: Restaurant[] = [];
  if (restaurantsForAboutData.status === 'fulfilled') {
    const data = restaurantsForAboutData.value;
    const restaurants = Array.isArray(data)
      ? data
      : data?.restaurants || [];

    // Filter for restaurants with photos first
    const restaurantsWithPhotos = restaurants.filter(
      (r: Restaurant) => r.photo_url
    );

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

  return {
    recentRestaurants,
    city1Restaurants,
    city2Restaurants,
    markWeinsRestaurants,
    aboutRestaurants,
    popularCities,
  };
}

/**
 * Processes recent restaurants: filters for approved listings,
 * sorts by most recent listing date, and limits to 6
 */
function processRecentRestaurants(restaurants: Restaurant[]): Restaurant[] {
  if (!Array.isArray(restaurants)) {
    return [];
  }

  // Filter restaurants that have approved listings
  const restaurantsWithApprovedListings = restaurants
    .filter(
      (r: Restaurant) =>
        r.listings &&
        r.listings.length > 0 &&
        r.listings.some((l: Listing) => l.approved === true)
    )
    .map((r: Restaurant) => ({
      ...r,
      listings: r.listings?.filter((l: Listing) => l.approved === true) || [],
    }));

  // Sort by most recent listing's created_at date
  const sorted = restaurantsWithApprovedListings.sort((a, b) => {
    const aLatestListing = a.listings
      ?.map((l) => new Date(l.created_at || 0).getTime())
      .sort((x, y) => y - x)[0] || 0;
    const bLatestListing = b.listings
      ?.map((l) => new Date(l.created_at || 0).getTime())
      .sort((x, y) => y - x)[0] || 0;
    return bLatestListing - aLatestListing;
  });

  return sorted.slice(0, 6);
}

/**
 * Processes influencer restaurants: filters for approved listings and limits to 6
 */
function processInfluencerRestaurants(restaurants: Restaurant[]): Restaurant[] {
  if (!Array.isArray(restaurants)) {
    return [];
  }

  // Filter restaurants that have approved listings
  const restaurantsWithApprovedListings = restaurants
    .filter(
      (r: Restaurant) =>
        r.listings &&
        r.listings.length > 0 &&
        r.listings.some((l: Listing) => l.approved === true)
    )
    .map((r: Restaurant) => ({
      ...r,
      listings: r.listings?.filter((l: Listing) => l.approved === true) || [],
    }));

  // Sort by rating (if available) or number of listings, limit to 6
  return restaurantsWithApprovedListings
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

/**
 * Processes city restaurants: filters for approved listings, sorts, and limits
 */
function processCityRestaurants(restaurants: Restaurant[]): Restaurant[] {
  if (!Array.isArray(restaurants)) {
    return [];
  }

  // Filter restaurants that have approved listings
  const restaurantsWithListings = restaurants.filter(
    (r: Restaurant) =>
      r.listings &&
      r.listings.length > 0 &&
      r.listings.some((l: Listing) => l.approved === true)
  );

  // Filter listings to only approved ones for each restaurant
  const restaurantsWithApprovedListings = restaurantsWithListings.map(
    (r: Restaurant) => ({
      ...r,
      listings: r.listings?.filter((l: Listing) => l.approved === true) || [],
    })
  );

  // Sort by rating (if available) or number of listings, limit to 6
  return restaurantsWithApprovedListings
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

