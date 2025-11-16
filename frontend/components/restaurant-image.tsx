"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getCachedUrl, setCachedUrl, validateImageUrl } from "@/lib/utils/image-cache";
import { refetchPhoto } from "@/lib/utils/image-refetch-manager";

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
  const tryRefetch = useCallback(async (force?: boolean) => {
    if (!restaurantSlug || attemptedRefetchForUrl === currentSrc || loadingRefetch) return;
    setAttemptedRefetchForUrl(currentSrc);
    setLoadingRefetch(true);
    try {
      const newUrl = await refetchPhoto(String(restaurantSlug), { force: !!force });
      if (newUrl) {
        setCurrentSrc(newUrl);
        setCachedUrl(String(restaurantSlug), newUrl);
        const ok = await validateImageUrl(newUrl);
        setIsValid(!!ok);
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
    const run = async () => {
      if (!restaurantSlug) return;
      if (!currentSrc) {
        const cached = getCachedUrl(String(restaurantSlug));
        if (cached) {
          setCurrentSrc(cached);
          const ok = await validateImageUrl(cached);
          setIsValid(!!ok);
          if (!ok) await tryRefetch(true);
        } else {
          setIsValid(false);
          await tryRefetch(true);
        }
        return;
      }
      const ok = await validateImageUrl(currentSrc);
      setIsValid(!!ok);
      if (ok) setCachedUrl(String(restaurantSlug), currentSrc);
      else await tryRefetch(true);
    };
    run();
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
      unoptimized={(() => { try { const u = new URL(currentSrc || ""); return u.hostname === "lh3.googleusercontent.com"; } catch { return false; } })()}
      // If Next/Image optimization fails (e.g., upstream 403), trigger backend refetch
      onError={async () => {
        setIsValid(false);
        await tryRefetch(true);
      }}
      priority={false}
    />
  );
}