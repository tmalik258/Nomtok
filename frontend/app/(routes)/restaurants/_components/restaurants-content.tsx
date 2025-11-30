"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowLeft, Grid3X3, Map, X } from "lucide-react";
import { Restaurant, Cuisine } from "@/lib/types";
import { getSearchPlaceholder } from "@/lib/utils/search-utils";
import { useRestaurantsPaginated } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RestaurantHeroSection } from "./restaurant-hero-section";
import { RestaurantSearchFilter } from "./restaurant-search-filter";
import { RestaurantGridView } from "./restaurant-grid-view";
import { RestaurantMapView } from "./restaurant-map-view";
import { RestaurantLatestListings } from "./restaurant-latest-listings";
import RestaurantsPagination from "./restaurants-pagination";

export function RestaurantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const city = searchParams.get("city") || "";
  const countryParam = searchParams.get("country") || "";
  const tagParam = searchParams.get("tag") || "";
  const viewParam = searchParams.get("view");

  // Default to grid if no parameter, otherwise use the specified view
  const initialViewMode = viewParam === "map" ? "map" : "grid";
  const [viewMode, setViewMode] = useState<"grid" | "map">(initialViewMode);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  // Initialize search and sort from URL parameters
  const searchQueryParam = searchParams.get("search") || "";
  const searchTypeParam = searchParams.get("searchType") || "";
  const sortByParam = searchParams.get("sortBy") || "";
  const influencerSlugParam = searchParams.get("influencer-slug") || undefined;
  const priceLevelParam = searchParams.get("priceLevel");
  const pageParam = Number(searchParams.get("page") || "1") || 1;
  const limitParam = Number(searchParams.get("limit") || "12") || 12;

  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [searchType, setSearchType] = useState(searchTypeParam);
  const [sortBy, setSortByState] = useState(sortByParam);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | undefined>(influencerSlugParam);
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<number | undefined>(
    priceLevelParam ? Number(priceLevelParam) : undefined
  );
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );

  // Initialize selected cuisines from URL parameters
  const cuisinesParam = searchParams.get("cuisines");
  const initialSelectedCuisines: Cuisine[] = cuisinesParam
    ? cuisinesParam
        .split(",")
        .map((cuisineName) => ({ id: "", name: cuisineName, created_at: "" }))
    : [];
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>(
    initialSelectedCuisines
  );

  // Function to update URL with view parameter
  const updateViewMode = (newViewMode: "grid" | "map") => {
    const params = new URLSearchParams(searchParams.toString());
    if (newViewMode === "grid") {
      params.delete("view"); // Remove view param for grid (default)
    } else {
      params.set("view", newViewMode);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    // Use router.replace with scroll: false to preserve scroll position
    router.replace(newUrl, { scroll: false });
    setViewMode(newViewMode);
  };

  // Function to clear city selection
  const clearCitySelection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("city");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.push(newUrl);
    setCityFilter("");
  };

  // Function to update URL with selected cuisines
  const updateSelectedCuisines = (newCuisines: Cuisine[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newCuisines.length === 0) {
      params.delete("cuisines");
    } else {
      const cuisineNames = newCuisines.map((cuisine) => cuisine.name).join(",");
      params.set("cuisines", cuisineNames);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSelectedCuisines(newCuisines);
  };

  // Function to update search query with URL parameter
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

  // Function to update search type with URL parameter
  const updateSearchType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "") {
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

  // Function to update sort by with URL parameter
  const updateSortBy = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "") {
      params.delete("sortBy");
    } else {
      params.set("sortBy", sort);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSortByState(sort);
  };

  // Function to update URL with influencer filter (use influencer-slug)
  const updateSelectedInfluencerId = (id?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // Clean up legacy param
    params.delete("influencer_id");
    if (!id) {
      params.delete("influencer-slug");
    } else {
      params.set("influencer-slug", id);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSelectedInfluencerId(id);
  };

  // Function to update URL with selected price level
  const updateSelectedPriceLevel = (priceLevel?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!priceLevel) {
      params.delete("priceLevel");
    } else {
      params.set("priceLevel", priceLevel.toString());
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSelectedPriceLevel(priceLevel);
  };

  const onPriceLevelChange = (priceLevel?: number) => {
    setSelectedPriceLevel(priceLevel);
  };

  const onInfluencerIdChange = (id?: string) => {
    setSelectedInfluencerId(id);
  };

  const {
    restaurants,
    loading,
    page,
    limit,
    totalPages,
    goToPage,
    setCityFilter,
    setInfluencerFilter,
    setSortBy,
    setSearchQuery: setBackendSearchQuery,
    setCuisineFilter,
    setPriceLevelFilter,
    setTagFilter,
  } = useRestaurantsPaginated({
    city: city || undefined,
    country: countryParam || undefined,
    name: searchQuery || undefined,
    influencer_id: influencerSlugParam,
    sort_by: sortByParam || undefined,
    cuisine: initialSelectedCuisines[0]?.name,
    tag: tagParam || undefined,
    price_level: selectedPriceLevel,
    page: pageParam,
    limit: limitParam,
  });

  // Keep hook in sync with influencer selection
  useEffect(() => {
    setInfluencerFilter(selectedInfluencerId);
  }, [selectedInfluencerId, setInfluencerFilter]);

  // Persist page and limit in URL when they change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentPageParam = params.get("page");
    const currentLimitParam = params.get("limit");
    const nextPage = String(page);
    const nextLimit = String(limit);

    let changed = false;
    if (currentPageParam !== nextPage) {
      params.set("page", nextPage);
      changed = true;
    }
    if (currentLimitParam !== nextLimit) {
      params.set("limit", nextLimit);
      changed = true;
    }

    if (changed) {
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [page, limit, pathname, router, searchParams]);

  // NEW: Keep filteredRestaurants in sync with backend results
  useEffect(() => {
    setFilteredRestaurants(restaurants);
  }, [restaurants]);

  // NEW: Trigger backend sort when sortBy changes
  useEffect(() => {
    if (sortBy) {
      setSortBy(sortBy);
    } else {
      // Default backend sort is name
      setSortBy("name");
    }
  }, [sortBy, setSortBy]);

  // NEW: Trigger backend search based on selected search type
  useEffect(() => {
    const query = searchQuery?.trim() || "";
    if (!query) {
      // Clear filters when search is empty
      setBackendSearchQuery("");
      return;
    }

    switch (searchType) {
      case "restaurant":
        setBackendSearchQuery(query);
        break;
      case "city":
        setCityFilter(query);
        break;
      case "cuisines":
        setCuisineFilter(query);
        break;
      default:
        // Fallback to name search for "all"
        setBackendSearchQuery(query);
        break;
    }
  }, [searchType, searchQuery, setBackendSearchQuery, setCityFilter, setCuisineFilter]);

  // NEW: Trigger backend cuisine filter when cuisines selection changes
  useEffect(() => {
    if (selectedCuisines.length > 0) {
      setCuisineFilter(selectedCuisines[0].name);
    } else {
      setCuisineFilter("");
    }
  }, [selectedCuisines, setCuisineFilter]);

  // NEW: Trigger backend price level filter when price level selection changes
  useEffect(() => {
    if (selectedPriceLevel) {
      setPriceLevelFilter(selectedPriceLevel);
    } else {
      setPriceLevelFilter(undefined);
    }
  }, [selectedPriceLevel, setPriceLevelFilter]);

  // Fallback: preserve typed influencer name filtering client-side (backend supports only influencer_id)
  useEffect(() => {
    const query = searchQuery?.trim().toLowerCase() || "";
    if (searchType === "influencer" && query) {
      const filtered = restaurants.filter((restaurant) =>
        restaurant?.listings?.some((listing) =>
          listing?.influencer?.name?.toLowerCase().includes(query)
        )
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchType, searchQuery, restaurants]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="p-2">
        <RestaurantHeroSection city={city} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              {city && (
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{city}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCitySelection}
                    className="h-5 w-5 p-0 ml-1 hover:bg-gray-200 text-gray-500 hover:text-gray-700 cursor-pointer"
                    title="Clear city selection"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="relative flex items-center bg-gray-100 rounded-lg p-1">
              <div
                className={`absolute top-1/2 -translate-y-1/2 left-1 h-8 w-[47%] bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out
                  ${viewMode === "map" ? "translate-x-full" : ""}
                `}
              ></div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateViewMode("grid")}
                className={`relative z-10 h-8 px-3 shadow-none bg-transparent hover:bg-transparent ${
                  viewMode === "grid"
                    ? "text-gray-900"
                    : "text-gray-700 hover:text-gray-800"
                }`}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => updateViewMode("map")}
                className={`relative z-10 h-8 px-3 shadow-none bg-transparent hover:bg-transparent ${
                  viewMode === "map"
                    ? "text-gray-900"
                    : "text-gray-700 hover:text-gray-800"
                }`}
              >
                <Map className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {city ? `Restaurants in ${city}` : "All Restaurants"}
          </h2>
        </div>

        <RestaurantSearchFilter
          city={city}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
          sortBy={sortBy}
          setSortBy={setSortByState}
          getSearchPlaceholder={getSearchPlaceholder}
          selectedCuisines={selectedCuisines}
          onCuisinesChange={setSelectedCuisines}
          updateSearchQuery={updateSearchQuery}
          updateSearchType={updateSearchType}
          updateSortBy={updateSortBy}
          updateSelectedCuisines={updateSelectedCuisines}
          selectedInfluencerId={selectedInfluencerId}
          onInfluencerIdChange={onInfluencerIdChange}
          updateSelectedInfluencerId={updateSelectedInfluencerId}
          selectedPriceLevel={selectedPriceLevel}
          onPriceLevelChange={onPriceLevelChange}
          updateSelectedPriceLevel={updateSelectedPriceLevel}
        />

        {filteredRestaurants.length === 0 && !loading ? (
          <Card className="text-center py-12 border-0">
            <CardContent className="py-8 border-0">
              <p className="text-slate-600 mb-4">
                No restaurants found in {city}.
              </p>
              <Button asChild variant="outline">
                <Link href="/">Try a different city</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Map View */}
            {viewMode === "map" && (
              <>
                <RestaurantMapView
                  filteredRestaurants={filteredRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  setSelectedRestaurant={setSelectedRestaurant}
                  loading={loading}
                />
                {/* Latest Listings Section (only for map view) */}
                <RestaurantLatestListings
                  restaurants={filteredRestaurants}
                  loading={loading}
                />
              </>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <>
                <RestaurantGridView
                  filteredRestaurants={filteredRestaurants}
                  loading={loading}
                />
              </>
            )}

            <RestaurantsPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}
