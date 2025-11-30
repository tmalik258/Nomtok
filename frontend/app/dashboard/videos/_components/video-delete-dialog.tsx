'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video } from '@/lib/types';
import { useDeleteVideo } from '@/lib/hooks/useVideos';

interface VideoDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
  onSuccess: () => void;
}

export function VideoDeleteDialog({ isOpen, onClose, video, onSuccess }: VideoDeleteDialogProps) {
  const { deleteVideo, loading } = useDeleteVideo();

  const handleDelete = async () => {
    if (!video) return;
    await deleteVideo(video.id);
    onClose();
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect backdrop-blur-xl bg-cream/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-cream">Confirm Deletion</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete the video &quot;{video?.title}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 cursor-pointer">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-cream border-red-600 hover:border-red-700 transition-all duration-200 cursor-pointer">
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}