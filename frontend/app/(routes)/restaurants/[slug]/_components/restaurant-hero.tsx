"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, Share2 } from "lucide-react";
import RestaurantImage from "@/components/restaurant-image";
import SocialShareButtons from "@/components/social-share-buttons";
import type { Restaurant } from "@/lib/types";
import { useState } from "react";

export default function RestaurantHero({ restaurant }: { restaurant: Restaurant }) {
  const status = restaurant?.business_status?.toLowerCase() === "operational" ? "Open" : restaurant?.business_status;
  const [showShare, setShowShare] = useState(false);
  
  return (
    <div className="relative h-[calc(75vh)] rounded-xl overflow-hidden">
      <RestaurantImage
        src={restaurant.photo_url || undefined}
        alt={restaurant.name}
        restaurantSlug={String(restaurant.slug)}
        className="brightness-[0.5] filter"
        sizes="100vw"
        fill
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      <div className="absolute bottom-10 left-0 right-0 text-center p-6 md:p-8 z-50">
        <h1 className="text-4xl md:text-5xl font-extrabold text-cream mb-4 drop-shadow-xl">{restaurant.name}</h1>
        <div className="text-cream mb-4">{restaurant.address}</div>
        
        {/* City, Status & Share Section */}
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-lg px-4 py-3 shadow-sm flex items-center gap-3">
            {/* City Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{restaurant.city}</span>
            </div>
            
            {/* Status Badge */}
            <div className={`flex items-center px-3 py-1.5 rounded-md border ${
              status === "Open" 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                status === "Open" ? "bg-green-500" : "bg-gray-400"
              }`} />
              <span className="text-sm font-medium">{status}</span>
            </div>
            
            {/* Share Button */}
            <button
              onClick={() => setShowShare(!showShare)}
              className="p-2 rounded-lg transition-all duration-200 cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 hover:shadow-sm"
              title="Share"
              aria-label="Share restaurant"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
      </div>
      
      {/* Social Share Buttons - Show when share is clicked - Absolute positioned */}
      <div className={`absolute bottom-5 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        showShare 
          ? "opacity-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}>
        <SocialShareButtons
          url={typeof window !== "undefined" ? window.location.href : ""}
          title={`Check out ${restaurant.name} - Amazing restaurant in ${restaurant.city}`}
          variant="inline"
        />
      </div>
    </div>
  );
}
