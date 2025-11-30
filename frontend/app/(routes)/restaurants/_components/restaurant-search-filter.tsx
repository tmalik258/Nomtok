"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import {  RestaurantSearchFilterProps } from "@/lib/types";
import { CuisineFilterDropdown } from "./cuisine-filter-dropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncSearchableSelect } from "@/components/ui/async-searchable-select";
import { useInfluencerOptions } from "@/lib/hooks/useInfluencerOptions";
import { useInfluencer } from "@/lib/hooks/useInfluencers";

export function RestaurantSearchFilter({
  city,
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  sortBy,
  setSortBy,
  getSearchPlaceholder,
  // selectedTags,
  // onTagsChange,
  selectedCuisines,
  onCuisinesChange,
  updateSearchQuery,
  updateSearchType,
  updateSortBy,
  // updateSelectedTags,
  updateSelectedCuisines,
  selectedInfluencerId,
  onInfluencerIdChange,
  updateSelectedInfluencerId,
  selectedPriceLevel,
  onPriceLevelChange,
  updateSelectedPriceLevel,
}: RestaurantSearchFilterProps) {
  // Determine effective city: from URL param or from searchQuery when searchType is "city"
  const effectiveCity = city || (searchType === "city" && searchQuery ? searchQuery : undefined);
  
  // Fetch influencers for async select via hook with city filter
  const { fetchInfluencerOptions } = useInfluencerOptions(effectiveCity);
  // Fetch selected influencer details by slug to show name in badge
  const { influencer } = useInfluencer(selectedInfluencerId || "", {
    include_listings: false,
    include_video_details: false,
  });

  return (
    <div className="mb-8 flex flex-col gap-4 z-[10000] bg-white shadow-lg p-6 rounded-xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={getSearchPlaceholder(searchType)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className="w-full sm:w-48 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent className="z-[1500]">
              <SelectItem value="restaurant">Restaurant Name</SelectItem>
              <SelectItem value="influencer">Influencer Name</SelectItem>
              {/* <SelectItem value="video">Video Name</SelectItem> */}
              {/* <SelectItem value="tags">Tags</SelectItem> */}
              <SelectItem value="cuisines">Cuisines</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="w-full">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="z-[1500]">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* <div className="w-full">
            <TagFilterDropdown
              city={city}
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
            />
          </div> */}
          <div className="w-full">
            <CuisineFilterDropdown
              city={effectiveCity}
              selectedCuisines={selectedCuisines}
              onCuisinesChange={onCuisinesChange}
            />
          </div>
          {/* Influencer dropdown */}
          <div className="w-full">
            <AsyncSearchableSelect
              value={selectedInfluencerId}
              onValueChange={(val) => {
                onInfluencerIdChange(val || undefined);
              }}
              fetchOptions={fetchInfluencerOptions}
              placeholder="Filter by influencer..."
              searchPlaceholder="Search influencers..."
              className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          {/* Price Level dropdown */}
          <div className="w-full">
            <Select
              value={selectedPriceLevel?.toString() || "all"}
              onValueChange={(val) => {
                const priceLevel = val === "all" ? undefined : parseInt(val, 10);
                onPriceLevelChange(priceLevel);
              }}
            >
              <SelectTrigger className="w-full h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500">
                <SelectValue placeholder="Price Level" />
              </SelectTrigger>
              <SelectContent className="z-[1500]">
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="1">$ (Inexpensive)</SelectItem>
                <SelectItem value="2">$$ (Moderate)</SelectItem>
                <SelectItem value="3">$$$ (Expensive)</SelectItem>
                <SelectItem value="4">$$$$ (Very Expensive)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selected Options Display */}
      {(selectedCuisines.length > 0 ||
        searchQuery ||
        searchType ||
        sortBy ||
        selectedInfluencerId ||
        selectedPriceLevel) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Search Query Badge */}
          {searchQuery && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            >
              <span className="text-xs text-muted-foreground">Search:</span>
              <span>{searchQuery}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 cursor-pointer transition-colors duration-200"
                onClick={() => updateSearchQuery("")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {/* Search Type Badge */}
          {searchType && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            >
              <span className="text-xs text-muted-foreground">Search by:</span>
              <span>
                {searchType === "restaurant"
                  ? "Restaurant Name"
                  : searchType === "influencer"
                  ? "Influencer Name"
                  // : searchType === "tags"
                  // ? "Tags"
                  : searchType === "cuisines"
                  ? "Cuisines"
                  : searchType === "city"
                  ? "City"
                  : searchType}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 cursor-pointer transition-colors duration-200"
                onClick={() => updateSearchType("")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {/* Sort By Badge */}
          {sortBy && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            >
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <span>
                {sortBy === "name"
                  ? "Name"
                  : sortBy === "rating"
                  ? "Rating"
                  : sortBy === "city"
                  ? "City"
                  : sortBy}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 cursor-pointer transition-colors duration-200"
                onClick={() => updateSortBy("")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {/* Selected Cuisines */}
          {selectedCuisines.map((cuisine) => (
            <Badge
              key={cuisine.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            >
              <span className="text-xs text-muted-foreground">Cuisine:</span>
              <span>{cuisine.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 cursor-pointer transition-colors duration-200"
                onClick={() => {
                  const newCuisines = selectedCuisines.filter(
                    (c) => c.id !== cuisine.id
                  );
                  updateSelectedCuisines(newCuisines);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}

          {/* Influencer Filter Badge */}
          {selectedInfluencerId && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            >
              <span className="text-xs text-muted-foreground">Influencer:</span>
              <span>{influencer?.name || selectedInfluencerId}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 cursor-pointer transition-colors duration-200"
                onClick={() => updateSelectedInfluencerId(undefined)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {/* Price Level Filter Badge */}
          {selectedPriceLevel && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            >
              <span className="text-xs text-muted-foreground">Price:</span>
              <span>
                {selectedPriceLevel === 1
                  ? "$"
                  : selectedPriceLevel === 2
                  ? "$$"
                  : selectedPriceLevel === 3
                  ? "$$$"
                  : selectedPriceLevel === 4
                  ? "$$$$"
                  : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 cursor-pointer transition-colors duration-200"
                onClick={() => updateSelectedPriceLevel(undefined)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {/* Clear All Button */}
          {(selectedCuisines.length > 0 ||
            searchQuery ||
            searchType ||
            sortBy ||
            selectedInfluencerId ||
            selectedPriceLevel) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // updateSelectedTags([]);
                updateSelectedCuisines([]);
                updateSearchQuery("");
                updateSearchType("");
                updateSortBy("");
                updateSelectedInfluencerId(undefined);
                onInfluencerIdChange(undefined);
                updateSelectedPriceLevel(undefined);
                onPriceLevelChange(undefined);
              }}
              className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer border-gray-200 hover:border-gray-300"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
