"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Hero Section Loading
export function HeroSectionSkeleton() {
  return (
    <div className="relative h-[60vh] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-96 mx-auto bg-white/20" />
          <Skeleton className="h-6 w-64 mx-auto bg-white/20" />
        </div>
      </div>
    </div>
  );
}

// Restaurant Card Loading
export function RestaurantCardSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group p-4">
      {/* Image Section - matches RestaurantCard's h-48 rounded-lg */}
      <div className="relative h-48 rounded-lg overflow-hidden mb-4">
        <Skeleton className="w-full h-full" />
        {/* Rating Badge Skeleton - positioned like actual badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-gray-200 rounded px-2 py-1 flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
      
      {/* Content Section - matches CardContent structure */}
      <CardContent className="p-0 flex flex-col flex-1 justify-between gap-3">
        {/* Top: Restaurant Info Section */}
        <div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-1" />
          <div className="flex gap-2 mb-1">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-14 rounded" />
          </div>
        </div>
        
        {/* Bottom: Listings/quotes + CTA */}
        <div className="mt-2 flex flex-col gap-3">
          {/* Listings Section - flexible height */}
          <div className="flex-grow flex flex-col">
            <div className="space-y-2">
              {/* Influencer listing */}
              <div className="flex items-center">
                <Skeleton className="w-8 h-8 rounded-full mr-2" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </div>
          {/* Button Section - matches actual button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// Influencer Card Loading
export function InfluencerCardSkeleton() {
  return (
    <Card className="text-center">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-20 w-20 rounded-full mx-auto" />
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-14 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Video Card Loading
export function VideoCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

// Listing Card Loading
export function ListingCardSkeleton() {
  return (
    <Card className="card-hover">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}

// Grid Loading Component
interface GridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  type: 'restaurant' | 'influencer' | 'video' | 'listing';
  className?: string;
}

export function GridSkeleton({ 
  count = 6, 
  columns = 3, 
  type, 
  className = "" 
}: GridSkeletonProps) {
  const getSkeletonComponent = () => {
    switch (type) {
      case 'restaurant':
        return RestaurantCardSkeleton;
      case 'influencer':
        return InfluencerCardSkeleton;
      case 'video':
        return VideoCardSkeleton;
      case 'listing':
        return ListingCardSkeleton;
      default:
        return RestaurantCardSkeleton;
    }
  };

  const SkeletonComponent = getSkeletonComponent();
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

// Page Loading Component
interface PageLoadingProps {
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export function PageLoading({ 
  message = "Loading...", 
  showSpinner = true, 
  className = "" 
}: PageLoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] space-y-4 ${className}`}>
      {showSpinner && (
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      )}
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
}

// Inline Loading Component
interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({ 
  message = "Loading...", 
  size = 'md', 
  className = "" 
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-orange-500`} />
      <span className="text-gray-600">{message}</span>
    </div>
  );
}

// Retry Loading Component
interface RetryLoadingProps {
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
  message?: string;
  className?: string;
}

export function RetryLoading({ 
  onRetry, 
  retryCount, 
  maxRetries, 
  isRetrying, 
  message = "Retrying...", 
  className = "" 
}: RetryLoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 p-8 ${className}`}>
      <div className="flex items-center gap-2">
        <RefreshCw className={`h-6 w-6 text-orange-500 ${isRetrying ? 'animate-spin' : ''}`} />
        <span className="text-gray-600">
          {isRetrying ? message : 'Ready to retry'}
        </span>
      </div>
      
      <div className="text-sm text-gray-500">
        Attempt {retryCount} of {maxRetries}
      </div>
      
      {!isRetrying && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="cursor-pointer"
          disabled={retryCount >= maxRetries}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// Section Loading Component
interface SectionLoadingProps {
  title?: string;
  count?: number;
  type: 'restaurant' | 'influencer' | 'video' | 'listing';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SectionLoading({ 
  title, 
  count = 3, 
  type, 
  columns = 3, 
  className = "" 
}: SectionLoadingProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <Skeleton className="h-8 w-48" />
      )}
      <GridSkeleton count={count} columns={columns} type={type} />
    </div>
  );
}