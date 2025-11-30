"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInfluencers } from "@/lib/hooks";
import { Influencer } from "@/lib/types";
import InfluencersHero from "./influencers-hero";
import { InfluencerSearchFilter } from "./influencer-search-filter";
import InfluencersGrid from "./influencers-grid";
import InfluencersPagination from "./influencers-pagination";

export default function InfluencersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize search parameters from URL
  const searchQueryParam = searchParams.get("search") || "";
  const sortByParam = searchParams.get("sortBy") || "default";
  const countryParam = searchParams.get("country") || "";
  
  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [country, setCountry] = useState(countryParam);
  const [filteredInfluencers, setFilteredInfluencers] = useState<Influencer[]>([]);
  
  const {
    influencers,
    loading,
    error,
    page,
    totalPages,
    goToPage,
    refetch
  } = useInfluencers({
    limit: 12
  });

  // Function to update URL with search query
  const updateSearchQuery = useCallback((query: string) => {
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
  }, [searchParams, pathname, router]);



  // Function to update sort by with URL parameter
  const updateSortBy = useCallback((sort: string) => {
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
  }, [searchParams, pathname, router]);

  // Function to update country with URL parameter
  const updateCountry = useCallback((countryValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (countryValue === "all") {
      params.delete("country");
    } else {
      params.set("country", countryValue);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setCountry(countryValue);
  }, [searchParams, pathname, router]);

  // Function to clear all filters
  const clearAllFilters = () => {
    // Clear all URL parameters by navigating to clean pathname
    router.replace(pathname, { scroll: false });
    
    // Reset all local state to default values
    setSearchQuery("");
    setSortBy("default");
    setCountry("all");
  };

  const handleRefresh = () => {
    refetch();
  };

  // Sync local state with URL parameters
  useEffect(() => {
    setSearchQuery(searchQueryParam);
  }, [searchQueryParam]);

  useEffect(() => {
    setSortBy(sortByParam);
  }, [sortByParam]);

  useEffect(() => {
    setCountry(countryParam);
  }, [countryParam]);

  // Set up filtered influencers
  useEffect(() => {
    if (influencers.length > 0) {
      let filtered = [...influencers];

      // Apply search filter - search only by influencer name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((influencer) => {
          return influencer.name.toLowerCase().includes(query);
        });
      }

      // Apply country filter - COMMENTED OUT for influencers list page
      // Countries search functionality disabled for influencers list page
      // if (country && country !== "") {
      //   filtered = filtered.filter((influencer) => (influencer?.country === country));
      // }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "subscribers":
            return (b.subscriber_count || 0) - (a.subscriber_count || 0);
          case "restaurants":
            return (b.listings?.length || 0) - (a.listings?.length || 0);
          case "recent":
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          case "default":
          default:
            return 0;
        }
      });

      setFilteredInfluencers(filtered);
    }
  }, [influencers, searchQuery, sortBy, country]);

  return (
    <div className="min-h-screen bg-cream p-2">
      <InfluencersHero 
        loading={loading}
        influencers={filteredInfluencers}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-16 -mt-8 relative z-10">
        <InfluencerSearchFilter
          searchQuery={searchQuery}
          searchType="name"
          sortBy={sortBy}
          country={country}
          disableCountryFilter={true}
          disableSearchType={true}
          onSearchQueryChange={updateSearchQuery}
          onSearchTypeChange={() => {}}
          onSortByChange={updateSortBy}
          onCountryChange={updateCountry}
          onClearFilters={clearAllFilters}
        />
        
        <InfluencersGrid 
          loading={loading}
          error={error}
          influencers={filteredInfluencers}
          searchQuery={searchQuery}
          clearSearch={() => updateSearchQuery("")}
          onRefresh={handleRefresh}
        />
        
        <InfluencersPagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          loading={loading}
        />
      </div>
    </div>
  );
}