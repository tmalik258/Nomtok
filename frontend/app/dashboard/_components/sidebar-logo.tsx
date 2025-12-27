"use client";

import React, { memo, useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SidebarLogoProps {
  isCollapsed: boolean;
  forMobile?: boolean;
}

export const SidebarLogo = memo(
  ({ isCollapsed, forMobile = false }: SidebarLogoProps) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
      // Check initial theme
      const checkTheme = () => {
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        const isDark =
          savedTheme === "dark" ||
          (!savedTheme && systemPrefersDark) ||
          document.documentElement.classList.contains("dark");
        setIsDarkMode(isDark);
      };

      checkTheme();

      // Listen for DOM class changes (when theme toggle updates the class)
      const observer = new MutationObserver(() => {
        checkTheme();
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // Listen for system preference changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = () => {
        checkTheme();
      };

      mediaQuery.addEventListener("change", handleMediaChange);

      // Listen for storage changes (when theme is changed in another tab/window)
      const handleStorageChange = () => {
        checkTheme();
      };

      window.addEventListener("storage", handleStorageChange);

      // Also listen for custom theme change events (if dispatched by theme toggle)
      const handleThemeChange = () => {
        checkTheme();
      };

      window.addEventListener("themechange", handleThemeChange);

      return () => {
        observer.disconnect();
        mediaQuery.removeEventListener("change", handleMediaChange);
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("themechange", handleThemeChange);
      };
    }, []);

    const logoSrc = isDarkMode
      ? "/logo-2.2-without-name-transparent-dark.png"
      : "/logo-2.2-without-name-transparent-light.png";

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
            src={logoSrc}
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
            src={logoSrc}
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