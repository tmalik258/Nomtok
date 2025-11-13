import { z } from "zod";

// YouTube URL validation regex
const YOUTUBE_VIDEO_URL_REGEX = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[\w-]+/;

// Base schema for video fields matching backend VideoUpdate schema
const baseVideoSchema = {
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  video_url: z
    .string()
    .url("Invalid video URL")
    .regex(YOUTUBE_VIDEO_URL_REGEX, "Must be a valid YouTube URL"),
  published_at: z
    .date()
    .optional()
    .nullable(),
  transcription: z
    .string()
    .max(10000, "Transcription must be less than 10000 characters")
    .optional()
    .or(z.literal("")),
};

// Schema for updating an existing video (all fields optional except those that should be required)
export const updateVideoSchema = z.object({
  title: baseVideoSchema.title.optional(),
  description: baseVideoSchema.description,
  video_url: baseVideoSchema.video_url.optional(),
  published_at: baseVideoSchema.published_at,
  transcription: baseVideoSchema.transcription,
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  error_message: z.string().max(1000, 'Error message must be less than 1000 characters').optional(),
});

// Schema for creating a video from URL (matches VideoCreateFromUrl)
export const createVideoFromUrlSchema = z.object({
  youtube_url: z
    .string()
    .min(1, "YouTube URL is required")
    .regex(YOUTUBE_VIDEO_URL_REGEX, "Must be a valid YouTube URL"),
});

// Type exports
export type UpdateVideoFormData = z.infer<typeof updateVideoSchema>;
export type CreateVideoFromUrlFormData = z.infer<typeof createVideoFromUrlSchema>;

// Default form values for editing
export const defaultVideoEditFormValues: Partial<UpdateVideoFormData> = {
  title: "",
  description: "",
  video_url: "",
  published_at: null,
  transcription: "",
};