"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Restaurant } from "@/lib/types";
import { slugify } from "@/lib/utils/slugify";
import { UtensilsCrossed, Tag as TagIcon } from "lucide-react";

interface RestaurantMetaSectionProps {
  restaurant: Restaurant;
}

export default function RestaurantMetaSection({
  restaurant,
}: RestaurantMetaSectionProps) {
  const country = restaurant.country || "";
  const countryParam = country ? encodeURIComponent(country) : "";
  const cuisines = restaurant.cuisines || [];
  const tags = restaurant.tags || [];

  if (cuisines.length === 0 && tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg p-6 shadow-sm mb-10">
      {/* Cuisines */}
      {cuisines.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-gray-900">Cuisines</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cuisines.map((cuisine) => {
              const cuisineSlug = slugify(cuisine.name);
              const href = countryParam
                ? `/restaurants?country=${countryParam}&cuisine=${cuisineSlug}`
                : `/restaurants?cuisine=${cuisineSlug}`;

              return (
                <Link key={cuisine.id} href={href}>
                  <Badge
                    variant="outline"
                    className="bg-orange-600/15 text-orange-600 border-orange-600/30 hover:bg-orange-600/25 hover:border-orange-600/50 cursor-pointer transition-all duration-200 px-3 py-1.5"
                  >
                    {cuisine.name.charAt(0).toUpperCase() + cuisine.name.slice(1)}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TagIcon className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-gray-900">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const tagSlug = slugify(tag.name);
              const href = countryParam
                ? `/restaurants?country=${countryParam}&tag=${tagSlug}`
                : `/restaurants?tag=${tagSlug}`;

              return (
                <Link key={tag.id} href={href}>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-200 px-3 py-1.5 font-normal"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

