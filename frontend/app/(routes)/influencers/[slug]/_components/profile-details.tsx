import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Influencer } from "@/lib/types/index";

interface ProfileDetailsProps {
  influencer: Influencer;
}

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  influencer,
}) => (
  <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">About</h2>
    <p className="text-gray-600 leading-relaxed mb-6">
      {influencer.bio || "No bio available."}
    </p>

    {influencer.youtube_channel_id && (
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
        <div className="space-y-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full md:w-auto justify-start"
          >
            <a
              href={`https://www.youtube.com/channel/${influencer.youtube_channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              YouTube Channel
            </a>
          </Button>
        </div>
      </div>
    )}
  </div>
);
