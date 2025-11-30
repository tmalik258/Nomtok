"use client";
import Image from "next/image";

import { usePexelsImage } from "@/lib/hooks/usePexelsImage";

interface RestaurantHeroSectionProps {
  city: string;
}

export function RestaurantHeroSection({ city }: RestaurantHeroSectionProps) {
  const { imageUrl: pexelsImageUrl, loading } = usePexelsImage({
    query: city ? city + " city landscape" : "food",
  });

  const finalImageUrl = pexelsImageUrl;
  console.log("RestaurantHeroSection rendered. City:", city);
  console.log(finalImageUrl)

  return (
    <div className="relative min-h-[70vh] rounded-lg pt-10 flex items-center justify-center overflow-hidden">
      {loading || !finalImageUrl ? (
        <div className="absolute inset-0 z-0 bg-gray-200 animate-pulse" />
      ) : (
        <Image
          src={finalImageUrl}
          alt="Cityscape background"
          fill
          className="object-cover brightness-[0.5] filter"
          priority
          decoding="async"
        />
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

      {/* Title Overlay */}
      <div className="absolute bottom-20 left-0 right-0 text-center p-6 md:p-8 z-50">
        <h1 className="text-4xl md:text-5xl font-extrabold text-cream mb-4 drop-shadow-xl">
          {city ? city.toUpperCase() + "'S" : "Nomtok'S"}
        </h1>
        <p className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-cream">
          Critics&apos; Picks
        </p>
        <p className="text-lg md:text-xl text-cream/90">
          HANDPICKED BY CELEBRITY CHEFS & TOP FOOD CREATORS.
        </p>
      </div>
    </div>
  );
}
