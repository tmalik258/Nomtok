'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, User, Eye, Edit, Trash2, Clock, Play } from 'lucide-react';

import type { VideoTableProps } from '@/lib/types';
import { CustomPagination } from '@/components/custom-pagination';

export function VideoTable({
  videos,
  loading = false,
  searchTerm,
  selectedInfluencer,
  hasListings,
  onViewVideo,
  onEditVideo,
  onDeleteVideo,
  onClearFilters,
  // Pagination props
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  // Selection props
  selectedVideos = [],
  onVideoSelect,
  onSelectAll,
}: VideoTableProps) {
  // Determine if selection mode is active based on whether any videos are selected
  const isSelectionActive = selectedVideos.length > 0;
  // Loading skeleton for table content
  const renderLoadingSkeleton = () => (
    <Card className="glass-effect backdrop-blur-xl bg-cream/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 p-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {isSelectionActive && <TableHead className="w-12">Select</TableHead>}
              <TableHead>Video</TableHead>
              <TableHead>Title & Description</TableHead>
              <TableHead>Influencer</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Total Listings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: itemsPerPage || 10 }).map((_, index) => (
              <TableRow key={index} className="border-b border-white/10 dark:border-gray-700/30">
                {isSelectionActive && (
                  <TableCell>
                    <Skeleton className="w-4 h-4" />
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton className="w-32 h-18 rounded-lg" />
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Show loading state
  if (loading) {
    return (
      <>
        {renderLoadingSkeleton()}
        <CustomPagination
          currentPage={currentPage || 1}
          totalItems={totalItems || 0}
          itemsPerPage={itemsPerPage || 10}
          onPageChange={onPageChange || (() => {})}
          onItemsPerPageChange={onItemsPerPageChange || (() => {})}
          loading={true}
        />
      </>
    );
  }

  // Show empty state
  if (videos.length === 0) {
    return (
      <Card className="glass-effect backdrop-blur-xl bg-cream/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
        <CardContent className="text-center py-12">
          <Play className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {searchTerm || selectedInfluencer || hasListings !== undefined
              ? 'No videos found matching your filters.'
              : 'No videos available.'}
          </p>
          {(searchTerm || selectedInfluencer || hasListings !== undefined) && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show videos table
  return (
    <>
      <Card className="glass-effect backdrop-blur-xl bg-cream/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isSelectionActive && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={videos.length > 0 && videos.every(video => selectedVideos.includes(video))}
                      onCheckedChange={(checked) => onSelectAll?.(!!checked)}
                      aria-label="Select all videos"
                    />
                  </TableHead>
                )}
                <TableHead>Video</TableHead>
                <TableHead>Title & Description</TableHead>
                <TableHead>Influencer</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Processing Status</TableHead>
                <TableHead>Total Listings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow 
                  key={video.id} 
                  className="hover:bg-orange-50/50 dark:hover:bg-orange-900/20 border-b border-white/10 dark:border-gray-700/30 transition-all duration-200 cursor-pointer"

                  onClick={() => {
                    // Toggle the selection state
                    onVideoSelect?.(video, !selectedVideos.includes(video));
                  }}
                >
                  {isSelectionActive && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedVideos.includes(video)}
                        onCheckedChange={(checked) => onVideoSelect?.(video, !!checked)}
                        aria-label={`Select video ${video.title}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="w-32 h-18 bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
                        title={video.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div>
                      <div className="font-semibold line-clamp-2 mb-1 text-gray-900 dark:text-cream">{video.title}</div>
                      {video.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {video.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          ID: {video.id.slice(0, 8)}...
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          YT: {video.youtube_video_id}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-900 dark:text-cream">{video.influencer?.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {video.published_at ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-900 dark:text-cream">{new Date(video.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {video.status === 'failed' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          >
                            Failed
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={8}>
                          {video.error_message || 'Processing failed'}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge
                        variant={video.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          video.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }
                      >
                        {video.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-900 dark:text-cream font-medium">
                        {video.listings_count || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewVideo(video);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditVideo(video);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVideo(video);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination - show when has items */}
      {totalItems && totalItems > 0 && (
        <CustomPagination
          currentPage={currentPage || 1}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage || 10}
          onPageChange={onPageChange || (() => {})}
          onItemsPerPageChange={onItemsPerPageChange || (() => {})}
          loading={false}
        />
      )}
    </>
  );
}