import type { Metadata } from "next";
import Script from "next/script";
import type { ReactElement } from "react";
import { buildPageMetadata } from "@/lib/seo/utils";
import { canonicalForPath } from "@/lib/seo/site";
import { buildVideoObjectJsonLd } from "@/lib/seo/video-jsonld";
import { fetchYouTubeMetadata } from "@/lib/utils/youtube-metadata";
import RestaurantDetailClient from "./_components/restaurant-detail-client";
import RestaurantHero from "./_components/restaurant-hero";
import axios from "axios";
import { unstable_cache } from "next/cache";
import type { Restaurant, Listing } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

// Fetch all restaurant slugs at build time for static generation
async function fetchAllRestaurantSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let skip = 0;
  const LIMIT = 100; // Same as sitemap generation
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";

  // During Docker build, backend service isn't available yet
  // Return empty array to allow build to complete (pages will be generated on-demand)
  // NEXT_PHASE is only set during `next build`, not at runtime
  const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isBackendUnavailable = base.includes('backend:') && isNextBuildPhase;
  
  if (isBackendUnavailable) {
    console.log('[generateStaticParams] Skipping restaurant fetch during build (backend unavailable)');
    return [];
  }

  // Configure axios for build-time fetching
  const client = axios.create({
    baseURL: base,
    timeout: 10_000, // Reduced timeout for build-time
  });

  try {
    while (true) {
      try {
        const { data } = await client.get("/restaurants/", {
          params: { skip, limit: LIMIT },
        });

        const restaurants = Array.isArray(data)
          ? data
          : Array.isArray(data?.restaurants)
          ? data.restaurants
          : [];

        if (!restaurants.length) break;

        // Extract slugs from restaurants
        const pageSlugs = restaurants
          .map((r: { slug?: string }) => r.slug)
          .filter((slug: string | undefined): slug is string => !!slug);

        slugs.push(...pageSlugs);

        const total = typeof data?.total === "number" ? data.total : undefined;
        skip += LIMIT;

        // Break if we've fetched all restaurants
        if (total !== undefined && skip >= total) break;
        if (restaurants.length < LIMIT) break;
      } catch (err) {
        const error = err as { code?: string; message?: string };
        // During build, if backend is unavailable, just return empty array
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.log('[generateStaticParams] Backend unavailable during build, skipping static generation');
          return [];
        }
        console.error(
          `[generateStaticParams] Restaurant fetch failed at skip=${skip}:`,
          err
        );
        // Break to avoid infinite loop on repeated failures
        break;
      }
    }
  } catch (err) {
    const error = err as { code?: string; message?: string };
    // During build, if backend is unavailable, just return empty array
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('[generateStaticParams] Backend unavailable during build, skipping static generation');
      return [];
    }
    console.error("[generateStaticParams] Failed to fetch restaurant slugs:", err);
    // Return empty array to allow build to continue
    return [];
  }

  return slugs;
}

export async function generateStaticParams() {
  try {
    const slugs = await fetchAllRestaurantSlugs();
    console.log(`[generateStaticParams] Pre-generating ${slugs.length} restaurant pages`);
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("[generateStaticParams] Error generating static params:", error);
    // Return empty array to allow build to continue
    // Pages will still work via on-demand generation
    return [];
  }
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { slug } = await params;
  let initialRestaurant: Restaurant | undefined;
  let initialCityRestaurants: Restaurant[] = [];
  
  try {
    const getRestaurantCached = unstable_cache(
      async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
        const { data } = await axios.get(`${base}/restaurants/${slug}/`, {
          params: { include_listings: true, include_video_details: true },
        });
        return data as Restaurant;
      },
      ["restaurant-detail", slug],
      { revalidate: 3600 }
    );
    initialRestaurant = await getRestaurantCached();
  } catch {}

  // Fetch city restaurants if we have the restaurant and city
  if (initialRestaurant?.city) {
    try {
      const getCityRestaurantsCached = unstable_cache(
        async () => {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
          const { data } = await axios.get(`${base}/restaurants/`, {
            params: {
              city: initialRestaurant!.city,
              include_listings: true,
              limit: 50,
            },
          });
          const restaurants = Array.isArray(data)
            ? data
            : (data?.restaurants || []);
          
          if (Array.isArray(restaurants)) {
            // Filter restaurants that have approved listings and exclude current restaurant
            const restaurantsWithListings = restaurants.filter(
              (r: Restaurant) =>
                r.slug !== slug &&
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
            
            // Sort by rating or number of listings, limit to 6
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
          return [];
        },
        ["restaurant-city-reviews", slug, initialRestaurant.city],
        { revalidate: 3600 }
      );
      initialCityRestaurants = await getCityRestaurantsCached();
    } catch {}
  }

  // Generate VideoObject JSON-LD for embedded videos
  const videoJsonLdScripts: ReactElement[] = [];
  
  if (initialRestaurant?.listings) {
    const restaurantUrl = canonicalForPath(`/restaurants/${slug}`);
    const restaurantName = initialRestaurant.name || "";
    
    // Get unique videos from listings
    const videoMap = new Map<string, { videoId: string; listing: Listing }>();
    
    for (const listing of initialRestaurant.listings) {
      if (listing.approved && listing.video?.youtube_video_id) {
        const videoId = listing.video.youtube_video_id;
        if (!videoMap.has(videoId)) {
          videoMap.set(videoId, { videoId, listing });
        }
      }
    }
    
    // Fetch metadata and generate JSON-LD for each video
    for (const { videoId } of videoMap.values()) {
      try {
        const getVideoMetadataCached = unstable_cache(
          async () => {
            const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
            return await fetchYouTubeMetadata(videoId, base);
          },
          ["youtube-metadata", videoId],
          { revalidate: 3600 } // Cache for 1 hour
        );
        
        const metadata = await getVideoMetadataCached();
        
        if (metadata) {
          const videoJsonLd = buildVideoObjectJsonLd({
            videoId,
            metadata,
            restaurantUrl,
            restaurantName,
          });
          
          videoJsonLdScripts.push(
            <Script
              key={`video-jsonld-${videoId}`}
              id={`video-jsonld-${videoId}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(videoJsonLd),
              }}
            />
          );
        }
      } catch (error) {
        console.error(`Error generating VideoObject JSON-LD for video ${videoId}:`, error);
        // Continue with other videos even if one fails
      }
    }
  }

  return (
    <>
      {initialRestaurant && <div className="p-2">
        <RestaurantHero restaurant={initialRestaurant} />
      </div>}
      {videoJsonLdScripts}
      <RestaurantDetailClient 
        slug={slug} 
        initialRestaurant={initialRestaurant} 
        renderHero={!initialRestaurant}
        initialCityRestaurants={initialCityRestaurants}
      />
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch restaurant data for metadata
  let restaurant: Restaurant | undefined;
  try {
    const getRestaurantCached = unstable_cache(
      async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
        const { data } = await axios.get(`${base}/restaurants/${slug}/`, {
          params: { include_listings: true, include_video_details: true },
        });
        return data as Restaurant;
      },
      ["restaurant-metadata", slug],
      { revalidate: 3600 }
    );
    restaurant = await getRestaurantCached();
  } catch {}

  // Handle restaurant not found
  if (!restaurant) {
    return buildPageMetadata({
      title: "Restaurant Not Found | Nomtok",
      description: "This restaurant could not be found on Nomtok.",
      path: `/restaurants/${slug}`,
      type: "article",
      keywords: ["restaurant", slug],
      imageUrl: "/hero-main.jpg",
    });
  }

  const name = restaurant.name || "";
  const city = restaurant.city || "";
  const cuisines = restaurant.cuisines?.map((c) => c.name) ?? [];
  const cuisine = cuisines[0] || "Restaurant";

  // Filter tags to exclude generic words - use only first tag
  const excluded = ["restaurant", "food", "place", "classic", "general"];
  const tags = restaurant.tags
    ?.map((t) => t.name?.toLowerCase())
    .filter((t) => t && !excluded.includes(t))
    .slice(0, 1) || [];

  const tagString = tags.length ? tags[0] : "";

  // Get influencer from first listing
  const listing = restaurant.listings?.[0];
  const influencer = listing?.influencer?.name;

  // Build SEO title - format: {name} | {tag} | {city} Influencer Review or {name} | {cuisine} | {city} Influencer Review
  const category = tagString || cuisine;
  const title = `${name} | ${category} | ${city} | Influencer Review`;

  // Build meta description
  let description = `${name} in ${city}`;
  if (tagString) {
    description += ` - ${tagString}`;
  }
  description += ". Explore reviews, photos and influencer insights on Nomtok.";
  if (influencer) {
    description += ` Reviewed by ${influencer}.`;
  }

  // Get image URL
  const imageUrl =
    restaurant.photo_url || "/hero-main.jpg";

  // Build keywords
  const keywords = [
    name,
    city,
    cuisine,
    ...tags,
    "review",
    influencer,
  ].filter(Boolean) as string[];

  return buildPageMetadata({
    title,
    description,
    path: `/restaurants/${slug}`,
    type: "article",
    keywords,
    imageUrl,
  });
}
