import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@/lib/types";
import { Globe, Phone, Clock } from "lucide-react";

interface RestaurantKeyDetailsProps {
  restaurant: Restaurant;
}

export default function RestaurantKeyDetails({ restaurant }: RestaurantKeyDetailsProps) {
  const openNow = restaurant?.current_opening_hours?.open_now ?? restaurant?.opening_hours?.open_now;
  const weekdayText = restaurant?.current_opening_hours?.weekday_text ?? restaurant?.opening_hours?.weekday_text;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        {restaurant.website && (
          <Button asChild variant="outline" className="cursor-pointer">
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit website"
            >
              <Globe className="w-4 h-4 mr-2" /> Visit Website
            </a>
          </Button>
        )}
        {restaurant.international_phone_number && (
          <Button asChild variant="outline" className="cursor-pointer">
            <a href={`tel:${restaurant.international_phone_number}`} aria-label="Call restaurant">
              <Phone className="w-4 h-4 mr-2" /> {restaurant.international_phone_number}
            </a>
          </Button>
        )}
        {typeof openNow === "boolean" && (
          <Badge className={openNow ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}>
            <Clock className="w-4 h-4 mr-1" /> {openNow ? "Open now" : "Closed"}
          </Badge>
        )}
      </div>
      {Array.isArray(weekdayText) && weekdayText.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Opening Hours</h3>
          <ul className="text-sm text-gray-700">
            {weekdayText.map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}