import type { Metadata } from "next";
import { toTitleFromSlug } from "@/lib/seo/site";
import { buildPageMetadata } from "@/lib/seo/utils";
import RestaurantDetailClient from "./_components/restaurant-detail-client";
import RestaurantHero from "./_components/restaurant-hero";
import axios from "axios";
import { unstable_cache } from "next/cache";
import type { Restaurant } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export default async function RestaurantDetailPage({ params }: Props) {
  const { slug } = await params;
  let initialRestaurant: Restaurant | undefined;
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
  return (
    <>
      {initialRestaurant && <div className="p-2">
        <RestaurantHero restaurant={initialRestaurant} />
      </div>}
      <RestaurantDetailClient slug={slug} initialRestaurant={initialRestaurant} renderHero={!initialRestaurant} />
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
