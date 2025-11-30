"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { VideoHeaderProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VideoHeader({
  onCreateClick,
  selectedVideos = [],
  onProcessSelectedVideos,
  isProcessModalOpen,
}: VideoHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-cream">
          Video Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage and organize video content from influencers
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-3">
          {/* Split Button for Select/Process Videos */}
          <Button
            onClick={onProcessSelectedVideos}
            variant="outline"
            className={cn(
              "shadow-none rounded-md focus-visible:z-10 border-orange-500 text-orange-600 hover:text-cream hover:bg-orange-600 dark:hover:bg-orange-900/20 transition-all duration-200",
              isProcessModalOpen &&
                "bg-orange-600 hover:bg-orange-700 text-cream hover:text-cream"
            )}
            disabled={selectedVideos?.length === 0}
          >
            Process ({selectedVideos.length})
          </Button>

          <Button
            onClick={onCreateClick}
            className="bg-orange-600 hover:bg-orange-700 text-cream border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Video
          </Button>
        </div>
      </div>
    </div>
  );
}
