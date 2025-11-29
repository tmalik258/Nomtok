"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Users, Award } from "lucide-react";
import Image from "next/image";
import { Influencer } from "@/lib/types";

interface InfluencersHeroProps {
  loading: boolean;
  influencers: Influencer[];
}

export default function InfluencersHero({ loading, influencers }: InfluencersHeroProps) {
  const reviews = (influencers || []).reduce(
    (sum, i) => sum + (typeof i.total_listings === 'number' ? i.total_listings : (i.listings?.length || 0)),
    0
  );
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-influencer.webp"
          alt="Food influencers background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {loading ? (
          <>
            <Skeleton className="h-16 w-96 mx-auto mb-6 bg-white/10" />
            <Skeleton className="h-8 w-[600px] mx-auto mb-8 bg-white/10" />
            <div className="flex justify-center items-center gap-8 mb-8">
              <Skeleton className="h-6 w-40 bg-white/10" />
              <Skeleton className="h-6 w-32 bg-white/10" />
              <Skeleton className="h-6 w-36 bg-white/10" />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Food Influencers
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover the culinary experts who are shaping food trends and inspiring millions of food lovers worldwide
            </p>
            
            {/* Enhanced Stats */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <Users className="w-5 h-5 text-orange-400" />
                <span className="text-white font-semibold">{influencers?.length} Influencers</span>
              </div>
              {/* <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <Globe className="w-5 h-5 text-orange-400" />
                <span className="text-white font-semibold">
                  {new Set(influencers?.map(i => i.region).filter(Boolean)).size} Regions
                </span>
              </div> */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <Award className="w-5 h-5 text-orange-400" />
                <span className="text-white font-semibold">
                  {reviews} Reviews
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}