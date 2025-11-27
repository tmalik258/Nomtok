import type { Metadata } from "next";
import { toTitleFromSlug } from "@/lib/seo/site";
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
  const title = `${toTitleFromSlug(slug)} — Restaurant Review`;
  const description = `Discover ${toTitleFromSlug(slug)} — reviews, location, and influencer recommendations.`;
  return buildPageMetadata({
    title,
    description,
    path: `/restaurants/${slug}`,
    type: "article",
    keywords: ["restaurant", slug, "city", "reviews"],
    imageUrl: "/hero-main.jpg",
  });
}
