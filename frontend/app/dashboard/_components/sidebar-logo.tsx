"use client";

import React, { memo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SidebarLogoProps {
  isCollapsed: boolean;
  forMobile?: boolean;
}

export const SidebarLogo = memo(
  ({ isCollapsed, forMobile = false }: SidebarLogoProps) => {
    return (
      <div className="flex items-center space-x-2">
        {/* Compact circular logo (always mounted) */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "transition-all duration-300 ease-out transform hover:scale-110",
            "will-change-opacity",
            isCollapsed || forMobile
              ? "opacity-100 translate-x-0 max-w-none"
              : "opacity-0 translate-x-2 max-w-0"
          )}
        >
          <Image
            src={"/logo-transparent-black-without-name.png"}
            alt="Logo"
            width={150}
            height={150}
            className="w-auto h-10 object-contain"
            priority
            sizes="(max-width: 768px) 40px, 80px"
          />
        </div>

        {/* Full wordmark logo (always mounted) */}
        <span
          className={cn(
            "transition-all duration-300 ease-out",
            "will-change-opacity",
            !isCollapsed || forMobile
              ? "opacity-100 translate-x-0 max-w-none"
              : "opacity-0 translate-x-2 max-w-0"
          )}
        >
          <Image
            src={"/logo-transparent-black.png"}
            alt="Logo"
            width={150}
            height={150}
            className="w-auto h-10 object-contain"
            priority
            sizes="(max-width: 768px) 100px, 200px"
          />
        </span>
      </div>
    );
  },
  (prev, next) =>
    prev.isCollapsed === next.isCollapsed && prev.forMobile === next.forMobile
);

SidebarLogo.displayName = "SidebarLogo";