import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import RestaurantImage from "@/components/restaurant-image";
import SocialShareButtons from "@/components/social-share-buttons";
import type { Restaurant } from "@/lib/types";

export default function RestaurantHero({ restaurant }: { restaurant: Restaurant }) {
  const status = restaurant?.business_status?.toLowerCase() === "operational" ? "Open" : restaurant?.business_status;
  return (
    <div className="relative h-[calc(65vh)] rounded-xl overflow-hidden">
      <RestaurantImage
        src={restaurant.photo_url || undefined}
        alt={restaurant.name}
        restaurantSlug={String(restaurant.slug)}
        className="brightness-[0.5] filter"
        sizes="100vw"
        fill
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      <div className="absolute bottom-20 left-0 right-0 text-center p-6 md:p-8 z-50">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-xl">{restaurant.name}</h1>
        <div className="text-white mb-4">{restaurant.address}</div>
        <div className="flex items-center justify-center rounded-lg text-white gap-5 mb-4">
          <div className="flex items-center gap-1">
            <Badge className="bg-white text-black">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.city}</span>
              </div>
            </Badge>
          </div>
          <div className="flex items-center">
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>
          </div>
        </div>
        <div className="flex justify-center">
          <SocialShareButtons
            url={typeof window !== "undefined" ? window.location.href : ""}
            title={`Check out ${restaurant.name} - Amazing restaurant in ${restaurant.city}`}
            variant="inline"
            className="bg-white backdrop-blur-sm border-white/20 px-4 py-1 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
