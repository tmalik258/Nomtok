import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/utils";
import RestaurantDetailClient from "./_components/restaurant-detail-client";
import RestaurantHero from "./_components/restaurant-hero";
import axios from "axios";
import { unstable_cache } from "next/cache";
import type { Restaurant, Listing } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

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

  return (
    <>
      {initialRestaurant && <div className="p-2">
        <RestaurantHero restaurant={initialRestaurant} />
      </div>}
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
  const title = `${name} | ${category} | ${city} Influencer Review`;

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
