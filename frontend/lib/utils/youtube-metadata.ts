/**
 * Utility functions for YouTube video metadata extraction and fetching.
 */

/**
 * Extract YouTube video ID from various URL formats or iframe src.
 * 
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * 
 * @param url - YouTube URL or iframe src
 * @returns Video ID or null if not found
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Fetch YouTube video metadata from backend API (server-side only).
 * 
 * @param videoId - YouTube video ID
 * @param apiBaseUrl - Base URL for the API (defaults to NEXT_PUBLIC_API_URL)
 * @returns Video metadata or null if not found
 */
export async function fetchYouTubeMetadata(
  videoId: string,
  apiBaseUrl?: string
): Promise<{
  title?: string;
  description?: string;
  published_at?: string;
  thumbnail_url?: string;
  duration?: string;
  channel_title?: string;
} | null> {
  try {
    const base = apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
    const response = await fetch(`${base}/youtube-metadata/${videoId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching YouTube metadata for video ${videoId}:`, error);
    return null;
  }
}
