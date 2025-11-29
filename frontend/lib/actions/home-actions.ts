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
  // Use the same pattern as sitemap generation
  // NEXT_PUBLIC_API_URL is available at both build-time and runtime
  // Falls back to 'http://backend:8000' for Docker production, or 'http://localhost:8030' for local dev
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'production' ? 'http://backend:8000' : 'http://localhost:8030')
  ).replace(/\/$/, '');

  console.log('[HomePage] Fetching data from API:', API_URL);
  console.log('[HomePage] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    hasNextPublicApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
  });

  const [
    popularCitiesData,
    topCitiesData,
    recentRestaurantsData,
    markWeinsRestaurantsData,
    restaurantsForAboutData,
  ] = await Promise.allSettled([
    // Popular cities (full list of top 5)
    axios.get(`${API_URL}/restaurants/popular-cities/`, { timeout: 60000 }).then(res => {
      console.log('[HomePage] Popular cities fetched:', res.data?.length || 0);
      return res.data;
    }),
    // Top cities with restaurants (top 2 cities with their restaurants)
    axios.get(`${API_URL}/restaurants/top-cities-with-restaurants/`, {
      params: { limit: 2, restaurants_per_city: 6 },
      timeout: 60000,
    }).then(res => {
      console.log('[HomePage] Top cities fetched:', res.data?.cities?.length || 0);
      return res.data;
    }),
            // Recent restaurants (with listings to sort by most recent listing)
            // Set include_video_details=false to reduce payload size and speed up request
            axios.get(`${API_URL}/restaurants/`, {
      params: {
        sort_by: 'updated',
        limit: 6,
        include_listings: true,
        include_video_details: false, // Don't need full video details, just basic listing info
      },
      timeout: 60000,
    }).then(res => {
      const data = res.data;
      const restaurants = Array.isArray(data) ? data : (data?.restaurants || []);
      console.log('[HomePage] Recent restaurants fetched:', restaurants.length);
      return res.data;
    }),
            // Mark Weins restaurants
            // Set include_video_details=false to reduce payload size and speed up request
            axios.get(`${API_URL}/restaurants/`, {
      params: {
        influencer_id: 'mark-wiens',
        limit: 6,
        include_listings: true,
        include_video_details: false, // Don't need full video details, just basic listing info
      },
      timeout: 60000,
    }).then(res => {
      const data = res.data;
      const restaurants = Array.isArray(data) ? data : (data?.restaurants || []);
      console.log('[HomePage] Mark Weins restaurants fetched:', restaurants.length);
      return res.data;
    }),
            // Restaurants for About section (5 restaurants with photos)
            axios.get(`${API_URL}/restaurants/`, {
      params: {
        limit: 10,
      },
      timeout: 60000,
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

  if (popularCitiesData.status === 'rejected') {
    const error = popularCitiesData.reason;
    console.error('[HomePage] Failed to fetch popular cities:', {
      message: error?.message || String(error),
      code: error?.code,
      response: error?.response?.status,
      url: error?.config?.url || `${API_URL}/restaurants/popular-cities/`,
    });
  }

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
  } else if (topCitiesData.status === 'rejected') {
    const error = topCitiesData.reason;
    console.error('[HomePage] Failed to fetch top cities with restaurants:', {
      message: error?.message || String(error),
      code: error?.code,
      response: error?.response?.status,
      url: error?.config?.url || `${API_URL}/restaurants/top-cities-with-restaurants/`,
    });
  }

  // Process recent restaurants: filter for approved listings and sort by most recent listing
  let recentRestaurants: Restaurant[] = [];
  if (recentRestaurantsData.status === 'fulfilled') {
    const data = recentRestaurantsData.value;
    const restaurants = Array.isArray(data)
      ? data
      : data?.restaurants || [];
    recentRestaurants = processRecentRestaurants(restaurants);
  } else if (recentRestaurantsData.status === 'rejected') {
    const error = recentRestaurantsData.reason;
    console.error('[HomePage] Failed to fetch recent restaurants:', {
      message: error?.message || String(error),
      code: error?.code,
      response: error?.response?.status,
      url: error?.config?.url || `${API_URL}/restaurants/`,
    });
  }

  // Process Mark Weins restaurants: filter for approved listings
  let markWeinsRestaurants: Restaurant[] = [];
  if (markWeinsRestaurantsData.status === 'fulfilled') {
    const data = markWeinsRestaurantsData.value;
    const restaurants = Array.isArray(data)
      ? data
      : data?.restaurants || [];
    markWeinsRestaurants = processInfluencerRestaurants(restaurants);
  } else if (markWeinsRestaurantsData.status === 'rejected') {
    const error = markWeinsRestaurantsData.reason;
    console.error('[HomePage] Failed to fetch Mark Weins restaurants:', {
      message: error?.message || String(error),
      code: error?.code,
      response: error?.response?.status,
      url: error?.config?.url || `${API_URL}/restaurants/`,
    });
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
  } else if (restaurantsForAboutData.status === 'rejected') {
    const error = restaurantsForAboutData.reason;
    console.error('[HomePage] Failed to fetch about restaurants:', {
      message: error?.message || String(error),
      code: error?.code,
      response: error?.response?.status,
      url: error?.config?.url || `${API_URL}/restaurants/`,
    });
  }

  // Log summary of fetched data
  console.log('[HomePage] Data fetch summary:', {
    popularCities: popularCities.length,
    city1Restaurants: city1Restaurants.length,
    city2Restaurants: city2Restaurants.length,
    recentRestaurants: recentRestaurants.length,
    markWeinsRestaurants: markWeinsRestaurants.length,
    aboutRestaurants: aboutRestaurants.length,
    apiUrl: API_URL,
  });

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

