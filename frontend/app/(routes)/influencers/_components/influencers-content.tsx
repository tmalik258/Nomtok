"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInfluencers } from "@/lib/hooks";
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
  const sortByParam = searchParams.get("sortBy") || "";
  const countryParam = searchParams.get("country") || "";
  const pageParam = Number(searchParams.get("page") || "1") || 1;
  
  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [country, setCountry] = useState(countryParam);
  
  // Pass URL params to hook for server-side filtering/sorting
  const {
    influencers,
    loading,
    error,
    page,
    totalPages,
    goToPage,
    setSearchQuery: setBackendSearchQuery,
    setSortBy: setBackendSortBy,
    refetch
  } = useInfluencers({
    limit: 12,
    page: pageParam,
    name: searchQueryParam || undefined,
    sort_by: sortByParam || undefined,
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

  // Sync local state with URL parameters and trigger backend fetch
  useEffect(() => {
    setSearchQuery(searchQueryParam);
    setBackendSearchQuery(searchQueryParam);
  }, [searchQueryParam, setBackendSearchQuery]);

  useEffect(() => {
    setSortBy(sortByParam);
    setBackendSortBy(sortByParam);
  }, [sortByParam, setBackendSortBy]);

  useEffect(() => {
    setCountry(countryParam);
  }, [countryParam]);

  return (
    <div className="min-h-screen bg-cream p-2">
      <InfluencersHero 
        loading={loading}
        influencers={influencers}
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
          influencers={influencers}
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