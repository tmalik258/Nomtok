import Image from "next/image";

import type { HeroSectionProps } from "@/lib/types";
import SocialShareButtons from "@/components/social-share-buttons";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";

export const HeroSection: React.FC<HeroSectionProps> = ({ influencer }) => {
  const backgroundStyle = {
    backgroundImage: influencer.banner_url
      ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${influencer.banner_url})`
      : "linear-gradient(135deg, rgb(249, 115, 22), rgb(239, 68, 68))",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden rounded-lg">
      <div className="absolute inset-0" style={backgroundStyle} />

      <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
        {/* Avatar */}
        <div className="w-32 h-32 rounded-full bg-cream/20 backdrop-blur-sm flex items-center justify-center text-cream text-4xl font-bold border-4 border-white/30 shadow-xl mb-6">
          {influencer.avatar_url ? (
            <Image
              src={influencer.avatar_url}
              alt={influencer.name}
              width={128}
              height={128}
              className="rounded-full object-cover"
            />
          ) : (
            influencer?.name?.charAt(0) || '?'
          )}
        </div>

        {/* Profile Info */}
        <div className="text-cream max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {influencer.name}
          </h1>
          <p className="text-lg md:text-xl text-cream/90 mb-2">
            Food and travel vlogger exploring
          </p>
          <p className="text-lg md:text-xl text-cream/90">
            local favorites & hidden gems
          </p>
        </div>

        {/* Social Share Buttons */}
        <div className="flex justify-center my-3 pb-3">
          <SocialShareButtons
            url={typeof window !== "undefined" ? window.location.href : ""}
            title={`Check out ${
              influencer.name
            } - Food Influencer ${influencer.subscriber_count && `with ${formatNumberAbbreviated(
              influencer.subscriber_count
            )} subscribers`}`}
            variant="inline"
          />
        </div>
      </div>
    </div>
  );
};
