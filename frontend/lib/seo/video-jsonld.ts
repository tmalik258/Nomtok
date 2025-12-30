/**
 * Utility to generate VideoObject JSON-LD schema for YouTube videos.
 * 
 * Follows Schema.org VideoObject specification:
 * https://schema.org/VideoObject
 */

export interface VideoMetadata {
  title?: string;
  description?: string;
  published_at?: string;
  thumbnail_url?: string;
  duration?: string;
  channel_title?: string;
}

export interface VideoObjectJsonLdOptions {
  videoId: string;
  metadata: VideoMetadata;
  restaurantUrl: string;
  restaurantName: string;
}

/**
 * Build VideoObject JSON-LD schema for a YouTube video.
 * 
 * @param options - Video metadata and context
 * @returns VideoObject JSON-LD object
 */
export function buildVideoObjectJsonLd({
  videoId,
  metadata,
  restaurantUrl,
  restaurantName,
}: VideoObjectJsonLdOptions) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const contentUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Ensure restaurant URL uses canonical non-www format
  const canonicalRestaurantUrl = restaurantUrl.startsWith("https://www.nomtok.com")
    ? restaurantUrl.replace("https://www.nomtok.com", "https://nomtok.com")
    : restaurantUrl;
  
  interface VideoObjectSchema {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    thumbnailUrl?: string;
    uploadDate?: string;
    embedUrl: string;
    contentUrl: string;
    mainEntityOfPage: {
      "@type": string;
      "@id": string;
    };
    publisher: {
      "@type": string;
      name: string;
      url: string;
    };
    duration?: string;
    creator?: {
      "@type": string;
      name: string;
    };
    [key: string]: unknown;
  }
  
  const videoObject: VideoObjectSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: metadata.title || `${restaurantName} Review`,
    description: metadata.description || `Review of ${restaurantName}`,
    thumbnailUrl: metadata.thumbnail_url || undefined,
    uploadDate: metadata.published_at || undefined,
    embedUrl: embedUrl,
    contentUrl: contentUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalRestaurantUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Nomtok",
      url: "https://nomtok.com",
    },
  };
  
  // Add duration if available (convert seconds to ISO 8601 if needed)
  if (metadata.duration) {
    // If duration is already in ISO 8601 format, use it
    if (metadata.duration.startsWith("PT")) {
      videoObject.duration = metadata.duration;
    } else {
      // Assume it's in seconds, convert to ISO 8601
      const seconds = parseInt(metadata.duration, 10);
      if (!isNaN(seconds)) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        let durationStr = "PT";
        if (hours > 0) durationStr += `${hours}H`;
        if (minutes > 0) durationStr += `${minutes}M`;
        if (secs > 0) durationStr += `${secs}S`;
        
        videoObject.duration = durationStr;
      }
    }
  }
  
  // Add creator if channel title is available
  if (metadata.channel_title) {
    videoObject.creator = {
      "@type": "Person",
      name: metadata.channel_title,
    };
  }
  
  // Remove undefined values
  Object.keys(videoObject).forEach((key) => {
    if (videoObject[key] === undefined) {
      delete videoObject[key];
    }
  });
  
  return videoObject;
}


