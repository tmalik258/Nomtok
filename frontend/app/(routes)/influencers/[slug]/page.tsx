import type { Metadata } from "next";
import { toTitleFromSlug } from "@/lib/seo/site";
import { buildPageMetadata } from "@/lib/seo/utils";
import InfluencerDetailClient from "./_components/influencer-detail-client";

type Props = { params: Promise<{ slug: string }> };

export default async function InfluencerDetailPage({ params }: Props) {
  const { slug } = await params;
  return <InfluencerDetailClient slug={slug} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = `${toTitleFromSlug(slug)} — Influencer`;
  const description = `Explore ${toTitleFromSlug(slug)} — top picks, videos, and restaurant reviews.`;
  return buildPageMetadata({
    title,
    description,
    path: `/influencers/${slug}`,
    type: "article",
    keywords: ["influencer", slug, "restaurants", "videos"],
    imageUrl: "/hero-influencer.jpg",
  });
}