"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import {
  Carousel, 
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Video } from '@/lib/types';

interface VideoSliderProps {
  videos: Video[];
  timestamps?: { [videoId: string]: number }; // Optional timestamps for videos
}

export function VideoSlider({ videos, timestamps }: VideoSliderProps) {
  // If no videos, show a message
  if (!videos || videos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="text-center">
          <Play className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No videos available</p>
        </div>
      </div>
    );
  }

  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full"
    >
      <CarouselContent>
        {videos.map((video, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card className="bg-transparent border-none p-0 rounded-lg shadow-none">
                <CardContent className="flex aspect-video items-center justify-center p-0 rounded-lg mb-0">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.youtube_video_id}${
                      timestamps && timestamps[video.id] 
                        ? `?start=${timestamps[video.id]}` 
                        : ''
                    }`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </CardContent>
                <div className="p-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-1">
                    {video.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {video?.published_at ? (
                      (() => {
                        const publishDate = new Date(video.published_at);
                        const now = new Date();
                        const diffInSeconds = Math.floor((now.getTime() - publishDate.getTime()) / 1000);

                        const intervals = {
                          year: 31536000,
                          month: 2592000,
                          week: 604800,
                          day: 86400,
                          hour: 3600,
                          minute: 60
                        };

                        for (const [unit, seconds] of Object.entries(intervals)) {
                          const value = Math.floor(diffInSeconds / seconds);
                          if (value >= 1) {
                            return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
                          }
                        }
                        return 'Just now';
                      })()
                    ) : ''}
                  </p>
                </div>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="bg-orange-500 hover:bg-orange-600 text-cream border-0 transition-all transform hover:scale-105 duration-300" />
      <CarouselNext className="bg-orange-500 hover:bg-orange-600 text-cream border-0 transition-all transform hover:scale-105 duration-300" />
    </Carousel>
  );
}