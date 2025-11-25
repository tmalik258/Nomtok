"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CountrySelect } from "@/components/ui/country-select";
import { getSearchPlaceholder } from "@/lib/utils/search-utils";
// import { TagFilterDropdown } from "@/app/(routes)/restaurants/_components/tag-filter-dropdown";
// import { Tag } from "@/lib/types";
import { useCountries, CountriesSource } from "@/lib/hooks/useCountries";

interface InfluencerSearchFilterProps {
  searchQuery: string;
  searchType: string;
  sortBy: string;
  country: string;
  countriesSource?: CountriesSource;
  influencerSlug?: string;
  disableCountryFilter?: boolean;
  disableSearchType?: boolean;
  customSortOptions?: { value: string; label: string }[];
  onSearchQueryChange: (query: string) => void;
  onSearchTypeChange: (type: string) => void;
  onSortByChange: (sort: string) => void;
  onCountryChange: (country: string) => void;
  onClearFilters: () => void;
}

const SEARCH_TYPES = [
  { value: "all", label: "All" },
  { value: "restaurant", label: "Restaurant" },
  { value: "city", label: "City" },
];

const DEFAULT_SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "name", label: "Name A-Z" },
  { value: "subscribers", label: "Subscribers" },
  { value: "restaurants", label: "Most Restaurants" },
  { value: "recent", label: "Most Recent" },
];

const RESTAURANT_SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "name", label: "Restaurant Name A-Z" },
  { value: "rating", label: "Highest Rating" },
  { value: "city", label: "City A-Z" },
  { value: "recent", label: "Most Recent" },
];

export function InfluencerSearchFilter({
  searchQuery,
  searchType,
  sortBy,
  country,
  countriesSource = "influencers",
  influencerSlug,
  disableCountryFilter = false,
  disableSearchType = false,
  customSortOptions,
  onSearchQueryChange,
  onSearchTypeChange,
  onSortByChange,
  onCountryChange,
  onClearFilters,
}: InfluencerSearchFilterProps) {
  // Use custom sort options if provided, otherwise use default based on search type
  const sortOptions = customSortOptions || 
    (influencerSlug ? RESTAURANT_SORT_OPTIONS : DEFAULT_SORT_OPTIONS);
  // Only fetch countries if country filter is enabled
  const { countries, loading, error, refetch } = useCountries(
    countriesSource, 
    influencerSlug,
    disableCountryFilter
  );

  const hasActiveFilters =
    searchQuery ||
    (!disableSearchType && searchType && searchType !== "all") ||
    (sortBy && sortBy !== "default") ||
    (!disableCountryFilter && country && country !== "all");

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={getSearchPlaceholder(searchType)}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search Type */}
        {!disableSearchType && (
          <Select
            value={searchType}
            onValueChange={onSearchTypeChange}
          >
            <SelectTrigger className="w-full lg:w-48 h-11 border-gray-200">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent className="z-[10000]">
              {SEARCH_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Country Filter */}
        {!disableCountryFilter && (
          <div className="flex items-center gap-2 w-full lg:w-48">
            <CountrySelect
              value={country ? country : ""}
              onValueChange={(value) => onCountryChange(value || "")}
              placeholder="All Countries"
              className="w-full"
              countries={countries}
              loading={loading}
              error={error || ""}
            />
            {error && !loading && (
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="h-10 cursor-pointer"
              >
                Retry
              </Button>
            )}
          </div>
        )}
        {/* Commented out for influencers list page - countries search functionality disabled */}
        {/* {disableCountryFilter && (
          <CountrySelect
            value={country ? country : ""}
            onValueChange={(value) => onCountryChange(value || "")}
            placeholder="All Countries"
            className="w-full lg:w-48"
            countries={countries}
            loading={loading}
            error={error || ""}
          />
        )} */}

        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full lg:w-48 h-11 border-gray-200">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="z-[2000]">
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Active filters:</span>
          </div>

          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchQueryChange("")}
                className="h-4 w-4 p-0 hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {!disableSearchType && searchType && searchType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Search by:{" "}
              {searchType}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchTypeChange("all")}
                className="h-4 w-4 p-0 hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {country && (
            <Badge variant="secondary" className="gap-1">
              Country: {countries.find((c) => c.name === country)?.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCountryChange("")}
                className="h-4 w-4 p-0 hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {sortBy && sortBy !== "default" && (
            <Badge variant="secondary" className="gap-1">
              Sort: {sortOptions.find((s) => s.value === sortBy)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSortByChange("default")}
                className="h-4 w-4 p-0 hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="ml-2 h-7 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
