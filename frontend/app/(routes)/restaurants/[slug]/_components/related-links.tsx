"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Restaurant, Influencer } from "@/lib/types";
import { slugify } from "@/lib/utils/slugify";
import { MapPin, UtensilsCrossed, Tag as TagIcon, User } from "lucide-react";

interface RelatedLinksProps {
  restaurant: Restaurant;
  influencer?: Influencer;
}

export default function RelatedLinks({
  restaurant,
  influencer,
}: RelatedLinksProps) {
  const country = restaurant.country || "";
  const city = restaurant.city || "";
  const countryParam = country ? encodeURIComponent(country) : "";
  const cityParam = city ? encodeURIComponent(city) : "";
  const mainTag = restaurant.tags?.[0];
  const mainCuisine = restaurant.cuisines?.[0];

  if (!mainTag && !mainCuisine && !influencer && !city) {
    return null;
  }

  const links = [];

  if (city) {
    links.push({
      href: countryParam && cityParam
        ? `/restaurants?country=${countryParam}&city=${cityParam}`
        : cityParam
        ? `/restaurants?city=${cityParam}`
        : `/restaurants`,
      label: `Explore more in ${city}`,
      icon: MapPin,
    });
  }

  if (mainTag) {
    links.push({
      href: countryParam && cityParam
        ? `/restaurants?country=${countryParam}&city=${cityParam}&tag=${slugify(mainTag.name)}`
        : cityParam
        ? `/restaurants?city=${cityParam}&tag=${slugify(mainTag.name)}`
        : `/restaurants?tag=${slugify(mainTag.name)}`,
      label: `More ${mainTag.name} in ${city}`,
      icon: TagIcon,
    });
  }

  if (mainCuisine) {
    links.push({
      href: countryParam && cityParam
        ? `/restaurants?country=${countryParam}&city=${cityParam}&cuisines=${slugify(mainCuisine.name)}`
        : cityParam
        ? `/restaurants?city=${cityParam}&cuisines=${slugify(mainCuisine.name)}`
        : `/restaurants?cuisines=${slugify(mainCuisine.name)}`,
      label: `More ${mainCuisine.name} spots in ${city}`,
      icon: UtensilsCrossed,
    });
  }

  if (influencer) {
    links.push({
      href: `/influencers/${influencer.slug}`,
      label: `More places featured by ${influencer.name}`,
      icon: User,
    });
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mb-10 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Explore Related Content
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {links.map((link, index) => {
          const Icon = link.icon;
          return (
            <Button
              key={index}
              asChild
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 bg-cream hover:bg-orange-50 border-gray-300 hover:border-orange-500 hover:text-orange-600 transition-all duration-200 cursor-pointer group"
            >
              <Link href={link.href} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium text-left">{link.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

