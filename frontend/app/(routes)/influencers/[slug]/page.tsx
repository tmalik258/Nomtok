import type { Metadata } from "next";
import { toTitleFromSlug } from "@/lib/seo/site";
import { buildPageMetadata } from "@/lib/seo/utils";
import InfluencerDetailClient from "./_components/influencer-detail-client";
import axios from "axios";
import { unstable_cache } from "next/cache";
import type { Influencer, Listing } from "@/lib/types";
import { HeroSection } from "./_components/hero-section";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export default async function InfluencerDetailPage({ params }: Props) {
  const { slug } = await params;
  let initialInfluencer: Influencer | undefined;
  let initialListings: Listing[] | undefined;
  try {
    const getInfluencerCached = unstable_cache(
      async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
        const { data } = await axios.get(`${base}/influencers/${slug}/`);
        return data as Influencer;
      },
      ["influencer-detail", slug],
      { revalidate: 3600 }
    );
    initialInfluencer = await getInfluencerCached();
  } catch {}
  try {
    const getListingsCached = unstable_cache(
      async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
        const { data } = await axios.get(`${base}/listings/`, {
          params: { influencer_slug: slug, approved_status: "Approved" }
        });
        return (data.listings ?? data) as Listing[];
      },
      ["influencer-listings", slug],
      { revalidate: 3600 }
    );
    initialListings = await getListingsCached();
  } catch {}
  return (
    <>
      {initialInfluencer && <div className="p-2">
        <HeroSection influencer={initialInfluencer} />
      </div>}
      <InfluencerDetailClient slug={slug} initialInfluencer={initialInfluencer} initialListings={initialListings} renderHero={!initialInfluencer} />
    </>
  );
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
