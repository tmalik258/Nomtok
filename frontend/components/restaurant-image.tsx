"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface RestaurantImageProps {
  src?: string | null;
  alt: string;
  restaurantSlug?: string;
  nameInitial?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
}

export default function RestaurantImage({
  src,
  alt,
  restaurantSlug,
  nameInitial,
  className,
  fill = true,
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: RestaurantImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src ?? null);
  const [isValid, setIsValid] = useState<boolean>(!!src);
  const [attemptedRefetchForUrl, setAttemptedRefetchForUrl] = useState<string | null>(null);
  const [loadingRefetch, setLoadingRefetch] = useState<boolean>(false);

  // Helper: attempt backend refetch and update image src
  const tryRefetch = useCallback(async () => {
    if (!restaurantSlug || attemptedRefetchForUrl === currentSrc || loadingRefetch) return;
    setAttemptedRefetchForUrl(currentSrc);
    setLoadingRefetch(true);
    try {
      const resp = await api.post(`/restaurants/${restaurantSlug}/refetch-photo/`);
      const newUrl: string | undefined = resp?.data?.photo_url;
      if (newUrl) {
        setCurrentSrc(newUrl);
        // Re-validate new URL via lightweight preload
        const recheck = new window.Image();
        recheck.referrerPolicy = "no-referrer";
        recheck.src = newUrl;
        recheck.onload = () => setIsValid(true);
        recheck.onerror = () => setIsValid(false);
      }
    } catch (e) {
      console.log("Failed to refetch photo", e);
    } finally {
      setLoadingRefetch(false);
    }
  }, [restaurantSlug, attemptedRefetchForUrl, currentSrc, loadingRefetch]);

  // Keep internal src in sync if parent changes
  useEffect(() => {
    setCurrentSrc(src ?? null);
    setIsValid(!!src);
    setAttemptedRefetchForUrl(null);
  }, [src]);

  useEffect(() => {
    if (!currentSrc) {
      setIsValid(false);
      return;
    }

    // Preload to detect errors without rendering a broken image
    const testImg = new window.Image();
    testImg.referrerPolicy = "no-referrer";
    testImg.src = currentSrc;
    testImg.onload = () => setIsValid(true);
    testImg.onerror = async () => {
      setIsValid(false);
      await tryRefetch();
    };

    return () => {
      // Cleanup image object
      testImg.onload = null;
      testImg.onerror = null;
    };
  }, [currentSrc, restaurantSlug, attemptedRefetchForUrl, loadingRefetch, tryRefetch]);

  if (!isValid) {
    const initial = (nameInitial || (alt?.[0] ?? "")).toUpperCase() || "?";
    return (
      <div
        className={cn(
          "w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center",
          className
        )}
      >
        <span className="text-white font-bold text-4xl">{initial}</span>
      </div>
    );
  }

  // Use Next/Image when valid for optimization
  return (
    <Image
      src={currentSrc as string}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={cn("object-cover w-full h-full", className)}
      referrerPolicy="no-referrer"
      // If Next/Image optimization fails (e.g., upstream 403), trigger backend refetch
      onError={async () => {
        setIsValid(false);
        await tryRefetch();
      }}
      priority={false}
    />
  );
}