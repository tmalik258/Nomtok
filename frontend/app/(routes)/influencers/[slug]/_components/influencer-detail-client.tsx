"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useInfluencer,
  useInfluencerListings,
  useInfluencerVideos,
  useMostRecentListing,
} from "@/lib/hooks";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";
import { Listing, Influencer } from "@/lib/types";
import ErrorCard from "@/components/error-card";
import { VideoSlider } from "@/components/video-slider";
import { StatsCard } from "../_components/stats-card";
import { HeroSection } from "../_components/hero-section";
import { ProfileDetails } from "../_components/profile-details";
import { TrendingQuoteCard } from "../_components/trending-quote-card";
import { SignaturePicksCard } from "../_components/signature-picks-card";
import { AllReviews } from "../_components/all-reviews";
import { LoadingSkeleton } from "../_components/loading-skeleton";
import {
  getUniqueRestaurantsCount,
  getUniqueCitiesCount,
  getMostReviewedCuisine,
} from "../_components/utils";
import RestaurantMap from "@/components/restaurant-map-wrapper";
import { toTitleFromSlug } from "@/lib/seo/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo/utils";
import Script from "next/script";
import { InfluencerSearchFilter } from "../../_components/influencer-search-filter";

export default function InfluencerDetailClient({ slug, initialInfluencer, initialListings, renderHero = true }: { slug: string; initialInfluencer?: Influencer; initialListings?: Listing[]; renderHero?: boolean }) {
  const influencerSlug = slug;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchQueryParam = searchParams.get("search") || "";
  const searchTypeParam = searchParams.get("searchType") || "all";
  const sortByParam = searchParams.get("sortBy") || "default";
  const countryParam = searchParams.get("country") || "";

  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [searchType, setSearchType] = useState(searchTypeParam);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [country, setCountry] = useState(countryParam);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);

  const {
    influencer,
    loading: influencerLoading,
    error: influencerError,
    refetch: refetchInfluencer,
  } = useInfluencer(influencerSlug);

  const {
    listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useInfluencerListings(influencerSlug);

  const {
    videos,
    loading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
  } = useInfluencerVideos(influencerSlug, 10);

  const {
    listing: mostRecentListing,
    loading: mostRecentLoading,
    error: mostRecentError,
    refetch: refetchMostRecent,
  } = useMostRecentListing(influencerSlug);

  useEffect(() => {
    setSearchQuery(searchQueryParam);
  }, [searchQueryParam]);

  useEffect(() => {
    setSearchType(searchTypeParam);
  }, [searchTypeParam]);

  useEffect(() => {
    setSortBy(sortByParam);
  }, [sortByParam]);

  useEffect(() => {
    setCountry(countryParam);
  }, [countryParam]);

  useEffect(() => {
    const baseListings = listings.length > 0 ? listings : (initialListings || []);
    if (baseListings.length > 0) {
      let filtered = [...baseListings];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((listing) => {
          switch (searchType) {
            case "restaurant":
              return listing?.restaurant?.name?.toLowerCase().includes(query);
            case "city":
              return listing?.restaurant?.city?.toLowerCase().includes(query);
            case "all":
            default:
              return (
                listing?.restaurant?.name?.toLowerCase().includes(query) ||
                listing?.restaurant?.city?.toLowerCase().includes(query)
              );
          }
        });
      }

      if (country) {
        filtered = filtered.filter((listing) => {
          return listing?.restaurant?.country === country;
        });
      }

      filtered.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a?.restaurant?.name || "").localeCompare(
              b?.restaurant?.name || ""
            );
          case "rating":
            return (
              (b?.restaurant?.google_rating || 0) -
              (a?.restaurant?.google_rating || 0)
            );
          case "city":
            return (a?.restaurant?.city || "").localeCompare(
              b?.restaurant?.city || ""
            );
          case "recent":
            return (
              new Date(b?.created_at || 0).getTime() -
              new Date(a?.created_at || 0).getTime()
            );
          case "default":
          default:
            return 0;
        }
      });

      setFilteredListings(filtered);
    }
  }, [listings, initialListings, searchQuery, searchType, sortBy, country]);

  const updateSearchQuery = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query === "") {
      params.delete("search");
    } else {
      params.set("search", query);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSearchQuery(query);
  };

  const updateSearchType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("searchType");
    } else {
      params.set("searchType", type);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSearchType(type);
  };

  const updateSortBy = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "default") {
      params.delete("sortBy");
    } else {
      params.set("sortBy", sort);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSortBy(sort);
  };

  const updateCountry = (countryValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (countryValue === "") {
      params.delete("country");
    } else {
      params.set("country", countryValue);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setCountry(countryValue);
  };

  const clearAllFilters = () => {
    router.replace(pathname, { scroll: false });
    setSearchQuery("");
    setSearchType("all");
    setSortBy("default");
    setCountry("");
  };

  const handleRefresh = () => {
    refetchInfluencer?.();
    refetchListings?.();
    refetchMostRecent?.();
    refetchVideos?.();
  };

  const hydratedInfluencer = influencer || initialInfluencer;
  const hydratedListings = listings.length > 0 ? listings : (initialListings || []);
  const loading = (influencerLoading || listingsLoading || videosLoading) && !hydratedInfluencer;
  const error = influencerError || listingsError || videosError;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !hydratedInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <ErrorCard
          title={error ? "Something went wrong" : "Influencer not found"}
          message={
            error
              ? "We&apos;re having trouble loading this influencer. Please try again later."
              : "The influencer you&apos;re looking for doesn&apos;t exist or has been removed."
          }
          error={error || undefined}
          onRefresh={error ? handleRefresh : undefined}
          showRefreshButton={!!error}
        />
      </div>
    );
  }

  const uniqueRestaurants = getUniqueRestaurantsCount(filteredListings || []);
  const uniqueCities = getUniqueCitiesCount(filteredListings || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Script id="breadcrumb-jsonld" type="application/ld+json">
        {JSON.stringify(
          buildBreadcrumbJsonLd([
            { name: "Home", url: "https://www.nomtok.com" },
            { name: "Influencers", url: "https://www.nomtok.com/influencers" },
            { name: toTitleFromSlug(influencerSlug), url: `https://www.nomtok.com/influencers/${influencerSlug}` },
          ])
        )}
      </Script>
      {renderHero && <HeroSection influencer={hydratedInfluencer} />}

      <div className="relative z-20 -mt-20 mb-8 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard value={uniqueRestaurants} label="Restaurants" />
          <StatsCard value={uniqueCities} label="Cities" />
          <StatsCard
            value={formatNumberAbbreviated(hydratedInfluencer.subscriber_count)}
            label="Subscribers"
          />
          <StatsCard
            value={getMostReviewedCuisine(listings || [])}
            label="Most Reviewed"
            isGradient
            showBadge
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="mb-6">
          <ProfileDetails influencer={hydratedInfluencer} />
        </div>

        <div className="mb-6">
          <InfluencerSearchFilter
            searchQuery={searchQuery}
            searchType={searchType}
            sortBy={sortBy}
            country={country}
            countriesSource="restaurants"
            influencerSlug={influencerSlug}
            disableSearchType={false}
            onSearchQueryChange={updateSearchQuery}
            onSearchTypeChange={updateSearchType}
            onSortByChange={updateSortBy}
            onCountryChange={updateCountry}
            onClearFilters={clearAllFilters}
          />
        </div>

        <RestaurantMap
          restaurants={filteredListings.map(
            (listing) => listing?.restaurant || null
          )}
          className="h-80 w-full mb-6"
        />

        <div className="grid grid-cols-1 gap-6 mb-12">
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Popular Videos</h2>
              </div>
              <VideoSlider videos={videos} />
            </CardContent>
          </Card>

          <SignaturePicksCard listings={filteredListings || []} />

          <TrendingQuoteCard
            listing={mostRecentListing || undefined}
            loading={mostRecentLoading}
            error={mostRecentError}
            onRefetch={refetchMostRecent}
          />
        </div>

        <AllReviews listings={filteredListings || []} loading={listingsLoading && hydratedListings.length === 0} />
      </div>
    </div>
  );
}
