"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useCreateVideo } from "@/lib/hooks/useVideos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  youtube_url: z
    .url("Please enter a valid YouTube URL")
    .refine(
      (url) => {
        const youtubePatterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([\w-]+)/,
        ];
        return youtubePatterns.some((pattern) => pattern.test(url));
      },
      {
        message: "Please enter a valid YouTube URL",
      }
    ),
});

type VideoFormValues = z.infer<typeof formSchema>;

interface VideoCreateFormModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
  onSuccess: () => void;
  onVideoCreated?: (videoId: string) => void;
}

export function VideoCreateFormModal({
  isCreateModalOpen,
  setIsCreateModalOpen,
  onSuccess,
  onVideoCreated,
}: VideoCreateFormModalProps) {
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtube_url: "",
    },
  });

  const {
    createVideoFromUrl,
    loading: isCreating,
    error: createError,
  } = useCreateVideo();

  useEffect(() => {
    if (createError) {
      toast.error(createError);
    }
  }, [createError]);

  const onSubmit = async (values: VideoFormValues) => {
    try {
      const createdVideo = await createVideoFromUrl({
        youtube_url: values.youtube_url,
      });
      if (!createError && createdVideo) {
        toast.success("Video created successfully from YouTube URL!");
        form.reset();
        onSuccess();
        // Call onVideoCreated with the new video's ID to open edit modal
        if (onVideoCreated && createdVideo.id) {
          onVideoCreated(createdVideo.id);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to create video:", error);
    }
  };

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-cream/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-cream">
            Create New Video
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Influencer selection removed; influencer will be auto-associated from metadata */}
            <FormField
              control={form.control}
              name="youtube_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      {...field}
                      className="glass-effect backdrop-blur-sm bg-cream/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-cream"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-orange-600 hover:bg-orange-700 text-cream border-orange-600 hover:border-orange-700 transition-all duration-200 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreating ? "Creating..." : "Create Video"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
