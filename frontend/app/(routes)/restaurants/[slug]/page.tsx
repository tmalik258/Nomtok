import type { Metadata } from "next";
import { toTitleFromSlug } from "@/lib/seo/site";
import { buildPageMetadata } from "@/lib/seo/utils";
import RestaurantDetailClient from "./_components/restaurant-detail-client";

type Props = { params: Promise<{ slug: string }> };

export default async function RestaurantDetailPage({ params }: Props) {
  const { slug } = await params;
  return <RestaurantDetailClient slug={slug} />;
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