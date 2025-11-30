"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Utensils, X } from "lucide-react";
import { Cuisine } from "@/lib/types";
import { useCuisines } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CuisineFilterDropdownProps {
  city?: string;
  selectedCuisines: Cuisine[];
  onCuisinesChange: (cuisines: Cuisine[]) => void;
  className?: string;
}

export function CuisineFilterDropdown({
  city,
  selectedCuisines,
  onCuisinesChange,
  className = "",
}: CuisineFilterDropdownProps) {
  const { cuisines, loading, error, fetchAllCuisines } = useCuisines();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllCuisines(100, city);
  }, [fetchAllCuisines, city]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCuisineToggle = (cuisine: Cuisine) => {
    const isSelected = selectedCuisines.some((c) => c.id === cuisine.id);
    if (isSelected) {
      onCuisinesChange(selectedCuisines.filter((c) => c.id !== cuisine.id));
    } else {
      onCuisinesChange([...selectedCuisines, cuisine]);
    }
  };

  const clearAllCuisines = () => {
    onCuisinesChange([]);
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-sm text-red-600", className)}>
        Failed to load cuisines: {error}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} ref={dropdownRef}>
      {/* Custom Multi-Select using Select styling */}
      <div className="relative z-[1500]">
        <Button
          type="button"
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent hover:bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9 cursor-pointer z-0"
          )}
          disabled={loading}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            <span
              className={
                selectedCuisines.length === 0 ? "text-muted-foreground" : ""
              }
            >
              {selectedCuisines.length > 0
                ? `${selectedCuisines.length} cuisine${
                    selectedCuisines.length > 1 ? "s" : ""
                  } selected`
                : "Select cuisines"}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform opacity-50",
              isOpen && "rotate-180"
            )}
          />
        </Button>

        {isOpen && (
          <div
            className={cn(
              "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 absolute max-h-60 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border shadow-md top-full left-0 right-0 mt-1"
            )}
          >
            <div className="p-1">
              {loading && (
                <div className="p-2 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {error && (
                <div className="p-2 text-sm text-red-600">
                  Error loading cuisines: {error}
                </div>
              )}
              {!loading && !error && cuisines.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">
                  No cuisines available
                </div>
              )}
              {selectedCuisines.length > 0 && (
                <div className="border-b border-border mt-1 pt-1">
                  <div className="relative">
                    <button
                      className={cn(
                        "focus:bg-accent focus:text-accent-foreground relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-destructive/10 hover:text-destructive cursor-pointer text-destructive"
                      )}
                      onClick={clearAllCuisines}
                    >
                      Clear all
                    </button>
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded-sm hover:bg-destructive/20 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllCuisines();
                      }}
                      aria-label="Clear all cuisines"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {!loading &&
                !error &&
                cuisines.map((cuisine) => {
                  const isSelected = selectedCuisines.some((c) => c.id === cuisine.id);
                  return (
                    <div
                      key={cuisine.id}
                      className={cn(
                        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      )}
                      onClick={() => handleCuisineToggle(cuisine)}
                    >
                      <span className="flex items-center gap-2">
                        {cuisine.name}
                      </span>
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}