"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cuisine } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { useCuisines } from "@/lib/hooks/useCuisines";

interface CuisineSelectionProps {
  selectedCuisineIds: string[];
  onCuisinesChange: (cuisineIds: string[]) => void;
}

export function CuisineSelection({ selectedCuisineIds, onCuisinesChange }: CuisineSelectionProps) {
  const { cuisines: allCuisines, loading: isLoading, fetchAllCuisines } = useCuisines();

  useEffect(() => {
    if (allCuisines.length === 0) {
      fetchAllCuisines();
    }
  }, [allCuisines.length, fetchAllCuisines]);

  const isCuisineSelected = (cuisine: Cuisine) => {
    return selectedCuisineIds.includes(cuisine.id);
  };

  const handleCuisineToggle = (cuisine: Cuisine) => {
    if (isCuisineSelected(cuisine)) {
      // Remove cuisine
      const updatedCuisineIds = selectedCuisineIds.filter(cuisineId => cuisineId !== cuisine.id);
      onCuisinesChange(updatedCuisineIds);
    } else {
      // Add cuisine
      const updatedCuisineIds = [...selectedCuisineIds, cuisine.id];
      onCuisinesChange(updatedCuisineIds);
    }
  };

  // const handleRemoveCuisine = (cuisineToRemove: Cuisine) => {
  //   const updatedCuisineIds = selectedCuisineIds.filter(
  //     (cuisineId) => cuisineId !== cuisineToRemove.id
  //   );
  //   onCuisinesChange(updatedCuisineIds);
  // };

  return (
      <div className="space-y-4">
        {/* Available Cuisines */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allCuisines.map((cuisine) => {
                const isSelected = isCuisineSelected(cuisine);
                return (
                  <Badge
                    key={cuisine.id}
                    variant={isSelected ? "secondary" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-cream hover:bg-orange-600"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleCuisineToggle(cuisine)}
                  >
                    {cuisine.name}
                    {isSelected ? (
                      <X className="ml-1 h-3 w-3" />
                    ) : (
                      <Plus className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
}
