"use client";

import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Youtube,
  Calendar,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";
import { Influencer } from "@/lib/types";

interface InfluencersTableProps {
  influencers: Influencer[];
  total: number;
  loading: boolean;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onEditInfluencer: (influencer: Influencer) => void;
  onDeleteInfluencer: (influencer: Influencer) => void;
  onCreateInfluencer: () => void;
  onPageChange: (page: number) => void;
}

export const InfluencersTable = ({
  influencers,
  total,
  loading,
  searchTerm,
  currentPage,
  totalPages,
  itemsPerPage,
  onEditInfluencer,
  onDeleteInfluencer,
  onCreateInfluencer,
  onPageChange,
}: InfluencersTableProps) => {
  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Showing{" "}
          <span className="text-orange-600 dark:text-orange-400 font-semibold">
            {influencers.length}
          </span>{" "}
          of{" "}
          <span className="text-orange-600 dark:text-orange-400 font-semibold">
            {total}
          </span>{" "}
          influencers
          {searchTerm && (
            <span className="ml-1 text-orange-500">
              matching &quot;{searchTerm}&quot;
            </span>
          )}
        </p>
      </div>

      {/* Influencers Table */}
      <Card className="glass-effect backdrop-blur-xl bg-cream/10 dark:bg-gray-900/20 border-orange-500/20 shadow-2xl p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
                <TableHead className="w-16 font-semibold text-gray-700 dark:text-gray-200">
                  Avatar
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Users className="h-4 w-4 text-orange-500" />
                    Name
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Users className="h-4 w-4 text-orange-500" />
                    Subscribers
                  </div>
                </TableHead>
                <TableHead className="w-24">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Youtube className="h-4 w-4 text-orange-500" />
                    Videos
                  </div>
                </TableHead>
                <TableHead className="w-24 font-semibold text-gray-700 dark:text-gray-200">
                  Channel
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Added
                  </div>
                </TableHead>
                <TableHead className="w-32 text-right font-semibold text-gray-700 dark:text-gray-200">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {influencers.map((influencer) => (
                <TableRow
                  key={influencer.id}
                  className="cursor-pointer hover:bg-orange-500/5 transition-all duration-200 border-orange-500/10"
                >
                  <TableCell>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cream border shadow-sm">
                      {influencer.avatar_url ? (
                        <Image
                          src={influencer.avatar_url}
                          alt={influencer.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 text-cream font-bold text-sm">
                          {influencer?.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{influencer.name}</div>
                      {influencer.bio && (
                        <div className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {influencer.bio}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNumberAbbreviated(
                      influencer.subscriber_count || 0
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNumberAbbreviated(influencer.total_videos || 0)}
                  </TableCell>
                  <TableCell>
                    {influencer.youtube_channel_url ? (
                      <Badge variant="outline" className="text-xs">
                        <Youtube className="w-3 h-3 mr-1" />
                        YouTube
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        N/A
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(influencer.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditInfluencer(influencer)}
                        className="cursor-pointer text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 transition-all duration-200 dark:text-orange-400 dark:hover:text-orange-300"
                        aria-label={`Edit ${influencer.name}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteInfluencer(influencer)}
                        className="cursor-pointer text-red-600 hover:bg-red-500/10 hover:text-red-700 transition-all duration-200 dark:text-red-400 dark:hover:text-red-300"
                        aria-label={`Delete ${influencer.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, total)} of {total}{" "}
            influencers
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {influencers.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No influencers found
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm
                ? "Try adjusting your search"
                : "Get started by adding your first influencer"}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateInfluencer}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Influencer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};