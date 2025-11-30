"use client";

import { useState } from "react";
import { Video } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Undo2, Play, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideos: Video[];
  onRemoveVideo: (video: Video) => void;
  onAddVideo: (video: Video) => void;
  onProcessVideos: (videoIds: string[]) => void;
  processing?: boolean;
}

export function VideoProcessModal({
  isOpen,
  onClose,
  selectedVideos,
  onRemoveVideo,
  onAddVideo,
  onProcessVideos,
  processing = false,
}: VideoProcessModalProps) {
  const [removedVideos, setRemovedVideos] = useState<Video[]>([]);

  const handleRemoveVideo = (video: Video) => {
    setRemovedVideos((prev) => [...prev, video]);
    onRemoveVideo(video);
  };

  const handleUndoRemove = (removedVideo: Video) => {
    setRemovedVideos((prev) => prev.filter((v) => v.id !== removedVideo.id));
    onAddVideo(removedVideo);
  };

  const handleClose = () => {
    setRemovedVideos([]);
    onClose();
  };

  const handleProcess = () => {
    const videoIds = selectedVideos.map((video) => video.id);
    onProcessVideos(videoIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-cream/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-cream flex items-center gap-2">
            <Play className="w-5 h-5 text-orange-600" />
            Process Selected Videos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {selectedVideos.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No videos selected for processing. Please select at least one
                video.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                You have selected <strong>{selectedVideos.length}</strong> video
                {selectedVideos.length !== 1 ? "s" : ""} for processing.
              </div>

              <ScrollArea className="h-64 w-full bg-cream rounded-md p-4">
                <div className="space-y-2">
                  {selectedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-3 bg-orange-200/25 dark:bg-gray-900/95 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-cream pr-5">
                          {video.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {video.influencer?.name || "Unknown Influencer"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVideo(video)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {removedVideos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recently Removed:
                  </h4>
                  <div className="flex flex-col gap-2">
                    {removedVideos.map((removedVideo) => (
                      <Badge
                        key={removedVideo.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleUndoRemove(removedVideo)}
                      >
                        <div className="truncate max-w-3xs">{removedVideo.title}</div>
                        <Undo2 className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click on a badge to undo removal
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={selectedVideos.length === 0 || processing}
            className="bg-orange-500 hover:bg-orange-600 text-cream"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Process {selectedVideos.length} Video
                {selectedVideos.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}