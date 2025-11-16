"use client";

import RestaurantImage from "@/components/restaurant-image";

export default function ImagePreviewTest() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">RestaurantImage Preview (Test)</h1>
      <div className="relative w-[600px] h-[300px] border rounded overflow-hidden">
        <RestaurantImage
          src={"http://localhost:3000/does-not-exist.jpg"}
          alt={"Test Restaurant"}
          restaurantSlug={"test-restaurant"}
          className=""
          sizes="600px"
          fill
        />
      </div>
      <p className="mt-4 text-sm text-gray-600">
        This page renders RestaurantImage with an invalid URL to exercise validation,
        caching and refetch throttling. Expect initial letter fallback and logs.
      </p>
    </div>
  );
}