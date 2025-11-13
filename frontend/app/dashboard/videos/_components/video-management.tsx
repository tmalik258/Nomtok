"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Video } from "@/lib/types";
import { useVideos } from "@/lib/hooks/useVideos";
import { useDataSync } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { VideoHeader } from "./video-header";
import { VideoFilters } from "./video-filters";
import { VideoTable } from "./video-table";
import { VideoCreateFormModal } from "./video-create-form";
import EditVideoModal from "./edit-video-modal";
import { VideoDeleteDialog } from "./video-delete-dialog";
import { VideoProcessModal } from "./video-process-modal";
import { toast } from "sonner";

export default function VideoManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedFilter, setProcessedFilter] = useState<"all" | "completed" | "pending" | "failed">("all");

  const router = useRouter();
  const searchParams = useSearchParams();

  const { triggerNLPProcessing } = useDataSync();

  const {
    videos,
    totalCount,
    loading,
    error,
    params,
    setPage,
    setLimit,
    setSearchTerm,
    setInfluencerFilter,
    setHasListingsFilter,
    setSortBy,
    setSortOrder,
    setProcessedStatusFilter,
    refetch,
  } = useVideos({
    page: 1,
    limit: 10,
    sort_by: "published_at",
    sort_order: "desc",
    status: processedFilter,
  });

  useEffect(() => {
    const videoId = searchParams.get("id");
    if (videoId && videos.length > 0) {
      const videoToEdit = videos.find((video) => video.id === videoId);
      if (videoToEdit) {
        setSelectedVideo(videoToEdit);
        setIsEditModalOpen(true);
      }
    }
  }, [searchParams, videos]);

  const refreshVideos = () => {
    refetch();
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setLimit(newItemsPerPage);
  };

  // Handle filter changes
  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleInfluencerChange = (influencer: string) => {
    setInfluencerFilter(influencer);
    setPage(1); // Reset to first page when changing filters
  };

  const handleHasListingsChange = (hasListings: boolean | undefined) => {
    setHasListingsFilter(hasListings);
    setPage(1); // Reset to first page when changing filters
  };

  const handleProcessedFilterChange = (processed: "all" | "completed" | "pending" | "failed") => {
    setProcessedFilter(processed);
    setProcessedStatusFilter(processed);
    setPage(1); // Reset to first page when changing filters
  };

  const handleSortChange = (sortBy: string) => {
    setSortBy(sortBy);
  };

  const handleSortOrderChange = (sortOrder: "asc" | "desc") => {
    setSortOrder(sortOrder);
  };

  const handleViewVideo = (video: Video) => {
    window.open(video.video_url, "_blank");
  };

  const handleEditVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsEditModalOpen(true);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("id", video.id);
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  const handleDeleteVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsDeleteDialogOpen(true);
  };

  // Handle video selection
  const handleVideoSelect = (video: Video, selected: boolean) => {
    setSelectedVideos((prev) => {
      if (selected) {
        // Add video to selection
        return [...prev, video];
      } else {
        // Remove video from selection
        return prev.filter((v) => v !== video);
      }
    });
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedVideos((prev) => {
      if (selected) {
        // Add all videos from current page to selection
        return [...prev, ...videos];
      } else {
        // Remove all videos from current page from selection
        return prev.filter((v) => !videos.includes(v));
      }
    });
  };

  const handleProcessSelectedVideos = () => {
    setIsProcessModalOpen(true);
  };

  const handleRemoveVideoFromSelection = (video: Video) => {
    setSelectedVideos((prev) => {
      // Remove video from selection
      return prev.filter((v) => v !== video);
    });
  };

  const handleAddVideoToSelection = (video: Video) => {
    setSelectedVideos((prev) => {
      // Add video to selection
      return [...prev, video];
    });
  };

  const handleProcessVideos = async () => {
    setProcessing(true);
    try {
      const videoIds = selectedVideos.map((video) => video.id);
      const response = await triggerNLPProcessing(videoIds);

      if (response) {
        setSelectedVideos([]);
        setIsProcessModalOpen(false);
        toast.success("Process Initiated", {
          description: "Video processing has started successfully.",
        });
      } else {
        toast.error("Processing Failed", {
          description: "Failed to initiate video processing.",
        });
      }
    } catch (error) {
      console.error("Error processing videos:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during processing.";
      toast.error("Processing Error", {
        description: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12 glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 rounded-xl">
        <div className="text-orange-600 mb-4">
          <Play className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Error loading videos
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Get selected videos for the process modal
  const selectedVideosArray = Array.from(selectedVideos);

  const clearFilters = () => {
    setSearchTerm("");
    setInfluencerFilter("");
    setHasListingsFilter(undefined);
    setProcessedFilter("all");
    setProcessedStatusFilter("all");
    setPage(1); // Reset to first page when clearing filters
  };

  return (
    <div className="space-y-6 dark:bg-black rounded-lg p-6">
      <VideoHeader
        onCreateClick={() => setIsCreateModalOpen(true)}
        selectedVideos={selectedVideosArray}
        onProcessSelectedVideos={handleProcessSelectedVideos}
        isProcessModalOpen={isProcessModalOpen}
        showSelection={selectedVideosArray.length > 0}
      />

      <VideoFilters
        searchTerm={params.title || ""}
        setSearchTerm={handleSearchChange}
        sortBy={params.sort_by || "created_at"}
        setSortBy={handleSortChange}
        sortOrder={params.sort_order || "desc"}
        setSortOrder={handleSortOrderChange}
        selectedInfluencer={params.influencer_id || ""}
        setSelectedInfluencer={handleInfluencerChange}
        hasListings={params.has_listings}
        setHasListings={handleHasListingsChange}
        processedFilter={processedFilter}
        setProcessedFilter={handleProcessedFilterChange}
      />

      <VideoTable
        videos={videos}
        loading={loading}
        searchTerm={params.title || ""}
        selectedInfluencer={params.influencer_id || ""}
        hasListings={params.has_listings}
        processedFilter={processedFilter}
        onViewVideo={handleViewVideo}
        onEditVideo={handleEditVideo}
        onDeleteVideo={handleDeleteVideo}
        onClearFilters={clearFilters}
        currentPage={params.page || 1}
        totalItems={totalCount}
        itemsPerPage={params.limit || 10}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        selectedVideos={selectedVideosArray}
        onVideoSelect={handleVideoSelect}
        onSelectAll={handleSelectAll}
      />

      <VideoCreateFormModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        onSuccess={() => {
          refreshVideos();
          setIsCreateModalOpen(false);
        }}
        onVideoCreated={(videoId) => {
          // Find the newly created video in the videos array
          const newlyCreatedVideo = videos.find((video) => video.id === videoId);
          if (newlyCreatedVideo) {
            // Open edit modal with the newly created video
            handleEditVideo(newlyCreatedVideo);
          } else {
            // If video not found in current array, refresh and then try to find it
            refreshVideos();
            // Small delay to ensure data is refreshed
            setTimeout(() => {
              const updatedVideo = videos.find((video) => video.id === videoId);
              if (updatedVideo) {
                handleEditVideo(updatedVideo);
              }
            }, 500);
          }
        }}
      />

      <EditVideoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.delete("id");
          router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
        }}
        video={selectedVideo}
        onSuccess={() => {
          refreshVideos();
          setIsEditModalOpen(false);
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.delete("id");
          router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
        }}
        refetchVideos={refreshVideos}
      />

      <VideoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        video={selectedVideo}
        onSuccess={() => {
          refreshVideos();
          setIsDeleteDialogOpen(false);
        }}
      />

      <VideoProcessModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        selectedVideos={selectedVideosArray}
        onRemoveVideo={handleRemoveVideoFromSelection}
        onAddVideo={handleAddVideoToSelection}
        onProcessVideos={handleProcessVideos}
        processing={processing}
      />
    </div>
  );
}
