import Image from "next/image";
import Link from "next/link";
import { Youtube, Star } from "lucide-react";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Influencer } from "@/lib/types";

interface InfluencerCardProps {
  influencer: Influencer;
}

const InfluencerCard = ({ influencer }: InfluencerCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 shadow-lg py-0 h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Card Header with Banner/Gradient */}
        <div
          className="h-32 relative rounded-xl mb-2"
          style={{
            backgroundImage: influencer.banner_url
              ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${influencer.banner_url})`
              : "linear-gradient(to right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(236, 72, 153))",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Avatar positioned to overlap */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-cream border-4 border-white shadow-lg">
              {influencer.avatar_url ? (
                <Image
                  src={influencer.avatar_url}
                  alt={influencer.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 text-cream font-bold text-xl">
                  {influencer?.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </div>

          {/* Top right badge for featured influencers */}
          {(influencer?.listings?.length ?? 0) > 10 && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-cream/20 backdrop-blur-sm text-cream border-white/30 px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="pt-8 px-2 flex-1 flex flex-col">
          {/* Name and Location */}
          <div className="mb-4">
            <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
              {influencer.name}
            </h3>
            {/* {influencer.country && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">{influencer.country}</span>
              </div>
            )} */}
          </div>

          {/* Bio */}
          <div className="flex-1 mb-6">
            {influencer.bio && (
              <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                {influencer.bio}
              </p>
            )}
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {typeof influencer.total_listings === 'number' ? influencer.total_listings : (influencer?.listings?.length || 0)}
              </div>
              <div className="text-xs text-gray-600 font-medium">Reviews</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatNumberAbbreviated(influencer.subscriber_count)}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                Subscribers
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto">
            <Button className="w-full bg-orange-600 hover:bg-orange-500 text-cream font-semibold py-2.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer" asChild>
              <Link href={`/influencers/${influencer.slug}`} className="flex-1">
                View Profile
              </Link>
            </Button>
            {influencer.youtube_channel_url && (
              <Button
                asChild
                className="bg-red-600 hover:bg-red-500 text-cream p-2.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <a
                  href={influencer.youtube_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default InfluencerCard;