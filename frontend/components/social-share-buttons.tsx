"use client";

import { Share2, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./whatsapp-icon";
import { copyToClipboard } from "@/lib/utils/copy-to-clipboard";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  className?: string;
  variant?: "default" | "compact" | "inline";
}

export function SocialShareButtons({
  url,
  title,
  className,
  variant = "default"
}: SocialShareButtonsProps) {
  const shareData = {
    whatsapp: {
      url: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      label: "WhatsApp",
      icon: WhatsAppIcon,
      hoverColor: "hover:bg-green-50 hover:text-green-600"
    },
    facebook: {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
      label: "Facebook",
      icon: Facebook,
      hoverColor: "hover:bg-blue-50 hover:text-blue-600"
    },
    twitter: {
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      label: "Twitter",
      icon: Twitter,
      hoverColor: "hover:bg-sky-50 hover:text-sky-600"
    },
  };

  const handleShare = (platform: keyof typeof shareData) => {
    window.open(
      shareData[platform].url,
      "_blank",
      "width=600,height=400,scrollbars=yes,resizable=yes"
    );
  };

  const handleCopyLink = () => {
    copyToClipboard(url, "Link copied to clipboard!");
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("flex items-center gap-2", className)}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(shareData).map(([platform, data]) => {
            const Icon = data.icon;
            return (
              <DropdownMenuItem
                key={platform}
                onClick={() => handleShare(platform as keyof typeof shareData)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Icon className="w-4 h-4" />
                {data.label}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem
            onClick={handleCopyLink}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
            Copy Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("bg-white rounded-lg px-4 py-3 shadow-sm", className)}>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            {Object.entries(shareData).map(([platform, data]) => {
              const Icon = data.icon;
              return (
                <button
                  key={platform}
                  onClick={() => handleShare(platform as keyof typeof shareData)}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                    "bg-white border border-gray-200 text-gray-600",
                    data.hoverColor,
                    "hover:border-gray-300 hover:shadow-sm"
                  )}
                  title={`Share on ${data.label}`}
                  aria-label={`Share on ${data.label}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            <button
              onClick={handleCopyLink}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                "bg-white border border-gray-200 text-gray-600",
                "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 hover:shadow-sm"
              )}
              title="Copy link"
              aria-label="Copy link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - individual buttons
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Object.entries(shareData).map(([platform, data]) => {
        const Icon = data.icon;
        return (
          <Button
            key={platform}
            onClick={() => handleShare(platform as keyof typeof shareData)}
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              "bg-white border-gray-200 text-gray-700",
              data.hoverColor,
              "hover:border-gray-300 hover:shadow-sm"
            )}
          >
            <Icon className="w-4 h-4" />
            {data.label}
          </Button>
        );
      })}
      <Button
        onClick={handleCopyLink}
        variant="outline"
        size="sm"
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          "bg-white border-gray-200 text-gray-700",
          "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 hover:shadow-sm"
        )}
      >
        <LinkIcon className="w-4 h-4" />
        Copy Link
      </Button>
    </div>
  );
}

export default SocialShareButtons;
