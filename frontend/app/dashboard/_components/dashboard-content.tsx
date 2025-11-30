"use client";

import { useEffect } from "react";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { MetricCard } from "./metric-card";
import { RealTimeJobsCard } from "./real-time-jobs-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import ErrorCard from "@/components/error-card";

const DashboardContent = () => {
  const { data, isLoading, error, refresh } = useDashboardData();

  // Fetch data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  if (isLoading && !data.stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const fallbackStats = {
    total_listings: 0,
    total_restaurants: 0,
    total_influencers: 0,
    total_videos: 0,
    ...data.stats,
  };

  if (error) {
    return <ErrorCard title="" error={error} onRefresh={refresh} />
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-effect backdrop-blur-sm bg-cream/70 border border-orange-200/50 rounded-lg p-4">
        <div className="flex items-center gap-2">
          {data.lastUpdated && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {data.lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="cursor-pointer bg-orange-600 dark:bg-orange-600 hover:bg-orange-700 dark:hover:border-orange-500 hover:text-cream focus:ring-orange-500 text-cream border-orange-600"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 text-cream ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Listings"
          value={fallbackStats.total_listings}
          description="Active food listings"
          isLoading={isLoading}
        />
        <MetricCard
          title="Restaurants"
          value={fallbackStats.total_restaurants}
          description="Registered restaurants"
          isLoading={isLoading}
        />
        <MetricCard
          title="Influencers"
          value={fallbackStats.total_influencers}
          description="Active influencers"
          isLoading={isLoading}
        />
        <MetricCard
          title="Videos"
          value={fallbackStats.total_videos}
          description="Total video content"
          isLoading={isLoading}
        />
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid gap-6 grid-cols-1">
        {/* <QuickActionsCard /> */}
        <RealTimeJobsCard jobs={data.jobs} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default DashboardContent