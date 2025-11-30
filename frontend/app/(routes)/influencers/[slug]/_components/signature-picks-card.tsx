import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/lib/types";

interface SignaturePicksCardProps {
  listings: Listing[];
}

export const SignaturePicksCard: React.FC<SignaturePicksCardProps> = ({ listings }) => (
  <Card className="bg-transparent shadow-none border-none">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Star className="w-6 h-6 text-yellow-500 fill-current" />
        <h2 className="text-xl font-bold text-gray-900">
          Signature Picks
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.slice(0, 4).map((listing) => {
          const restaurantSlug = listing?.restaurant?.slug;
          if (!restaurantSlug) return null;

          return (
            <Link
              key={listing.id}
              href={`/restaurants/${restaurantSlug}`}
              className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shadow-lg"
            >
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-cream fill-current" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {listing?.restaurant?.name}
                </h3>
                <p className="text-xs text-gray-600">
                  {listing?.restaurant?.cuisines?.[0]?.name || "Restaurant"} •{" "}
                  {listing?.restaurant?.city}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </CardContent>
  </Card>
);