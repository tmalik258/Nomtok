import { z } from "zod";

// YouTube URL validation regex
const YOUTUBE_CHANNEL_URL_REGEX = /^(https?:\/\/)?(www\.)?youtube\.com\/(channel\/[\w.-]+|c\/[\w.-]+|user\/[\w.-]+|@[\w.-]+)$/;

// Base schema for common influencer fields
const baseInfluencerSchema = {
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar_url: z.url("Invalid avatar URL").optional().or(z.literal("")),
  banner_url: z.url("Invalid banner URL").optional().or(z.literal("")),
  youtube_channel_id: z.string().min(1, "YouTube Channel ID is required"),
  youtube_url: z
    .string()
    .url("Invalid YouTube channel URL")
    .optional()
    .or(z.literal("")),
  subscriber_count: z
    .number()
    .min(0, "Subscriber count must be positive")
    .optional(),
};

// Schema for creating influencer with YouTube URL only
export const createInfluencerByUrlSchema = z.object({
  youtube_url: z
    .string()
    .min(1, "YouTube channel URL is required")
    .regex(YOUTUBE_CHANNEL_URL_REGEX, "Please enter a valid YouTube channel URL (e.g., https://www.youtube.com/@channelname or https://www.youtube.com/channel/UCxxxxx)")
});

// Schema for updating an existing influencer
export const updateInfluencerSchema = z.object({
  ...baseInfluencerSchema,
  name: baseInfluencerSchema.name.optional(),
  youtube_channel_id: baseInfluencerSchema.youtube_channel_id.optional(),
});

// Type exports
export type CreateInfluencerByUrlFormData = z.infer<typeof createInfluencerByUrlSchema>;
export type UpdateInfluencerFormData = z.infer<typeof updateInfluencerSchema>;
