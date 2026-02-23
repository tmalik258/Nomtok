import type { Metadata } from "next";
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
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
  
  // Skip fetching during build phase - backend not accessible
  const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isDockerInternalUrl = base.includes('backend:') || base.includes('host.docker.internal');
  const shouldSkipFetch = isNextBuildPhase || isDockerInternalUrl;

  if (!shouldSkipFetch) {
    try {
      const getInfluencerCached = unstable_cache(
        async () => {
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
  }
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
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
  
  // Skip fetching during build phase - backend not accessible
  const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isDockerInternalUrl = base.includes('backend:') || base.includes('host.docker.internal');
  const shouldSkipFetch = isNextBuildPhase || isDockerInternalUrl;

  // Fetch influencer data for metadata
  let influencer: Influencer | undefined;
  let listings: Listing[] | undefined;
  
  if (!shouldSkipFetch) {
    try {
      const getInfluencerCached = unstable_cache(
        async () => {
          const { data } = await axios.get(`${base}/influencers/${slug}/`);
          return data as Influencer;
        },
        ["influencer-metadata", slug],
        { revalidate: 3600 }
      );
      influencer = await getInfluencerCached();
    } catch {}

    // Fetch listings to extract cities, cuisines, and tags
    if (influencer) {
      try {
        const getListingsCached = unstable_cache(
          async () => {
            const { data } = await axios.get(`${base}/listings/`, {
              params: { influencer_slug: slug, approved_status: "Approved", limit: 100 }
            });
            return (data.listings ?? data) as Listing[];
          },
          ["influencer-metadata-listings", slug],
          { revalidate: 3600 }
        );
        listings = await getListingsCached();
      } catch {}
    }
  }

  // Handle influencer not found
  if (!influencer) {
    return buildPageMetadata({
      title: "Influencer Not Found | Nomtok",
      description: "This influencer could not be found on Nomtok.",
      path: `/influencers/${slug}`,
      type: "article",
      keywords: ["influencer", slug],
      imageUrl: "/hero-influencer.jpg",
    });
  }

  const name = influencer.name || "";
  const bio = influencer.bio || "";
  const subscriberCount = influencer.subscriber_count;
  const totalListings = influencer.total_listings || listings?.length || 0;

  // Extract top cities from listings
  const cityCounts = new Map<string, number>();
  listings?.forEach((listing) => {
    const city = listing.restaurant?.city;
    if (city) {
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    }
  });
  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city]) => city);

  // Extract top cuisines from listings
  const cuisineCounts = new Map<string, number>();
  listings?.forEach((listing) => {
    const cuisines = listing.restaurant?.cuisines || [];
    cuisines.forEach((cuisine) => {
      if (cuisine.name) {
        cuisineCounts.set(cuisine.name, (cuisineCounts.get(cuisine.name) || 0) + 1);
      }
    });
  });
  const topCuisines = Array.from(cuisineCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cuisine]) => cuisine);

  // Extract top tags from listings (filter out generic words)
  const excluded = ["restaurant", "food", "place", "classic", "general"];
  const tagCounts = new Map<string, number>();
  listings?.forEach((listing) => {
    const tags = listing.restaurant?.tags || [];
    tags.forEach((tag) => {
      const tagName = tag.name?.toLowerCase();
      if (tagName && !excluded.includes(tagName)) {
        tagCounts.set(tagName, (tagCounts.get(tagName) || 0) + 1);
      }
    });
  });
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  // Build SEO title
  let title = `${name} | Food Influencer`;
  if (topCities.length > 0) {
    title += ` in ${topCities[0]}`;
  }
  if (topCuisines.length > 0) {
    title += ` | ${topCuisines[0]} Reviews`;
  }
  if (subscriberCount && subscriberCount > 0) {
    const subscribers = subscriberCount >= 1000000
      ? `${(subscriberCount / 1000000).toFixed(1)}M`
      : subscriberCount >= 1000
      ? `${(subscriberCount / 1000).toFixed(1)}K`
      : subscriberCount.toString();
    title += ` (${subscribers} subscribers)`;
  }

  // Build meta description
  let description = `${name} is a food influencer`;
  
  if (subscriberCount && subscriberCount > 0) {
    const subscribers = subscriberCount >= 1000000
      ? `${(subscriberCount / 1000000).toFixed(1)}M`
      : subscriberCount >= 1000
      ? `${(subscriberCount / 1000).toFixed(1)}K`
      : subscriberCount.toString();
    description += ` with ${subscribers} subscribers`;
  }
  
  if (totalListings > 0) {
    description += ` who has reviewed ${totalListings} restaurant${totalListings !== 1 ? "s" : ""}`;
  }
  
  if (topCities.length > 0) {
    description += ` in ${topCities.join(", ")}`;
  }
  
  if (topCuisines.length > 0) {
    description += `. Specializing in ${topCuisines.join(", ")} cuisine${topCuisines.length > 1 ? "s" : ""}`;
  }
  
  if (topTags.length > 0) {
    description += ` with a focus on ${topTags.join(", ")}`;
  }
  
  description += ". Explore restaurant reviews, videos, and recommendations on Nomtok.";
  
  if (bio) {
    // Add a snippet from bio if available (limit to 50 chars to keep description concise)
    const bioSnippet = bio.length > 50 ? bio.substring(0, 47) + "..." : bio;
    description += ` ${bioSnippet}`;
  }

  // Get image URL
  const imageUrl =
    influencer.banner_url || influencer.avatar_url || "/hero-influencer.jpg";

  // Build keywords
  const keywords = [
    name,
    "food influencer",
    "restaurant reviews",
    ...topCities,
    ...topCuisines,
    ...topTags,
    "youtube",
    subscriberCount ? "food vlogger" : undefined,
  ].filter(Boolean) as string[];

  return buildPageMetadata({
    title,
    description,
    path: `/influencers/${slug}`,
    type: "article",
    keywords,
    imageUrl,
  });
}
