import {
  RefreshCw,
  MapPin,
  User,
  Video,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import type { ListingTableProps } from "@/lib/types";
import { CustomPagination } from "@/components/custom-pagination";
import ListingTableSkeleton from "./listing-table-skeleton";

export function ListingTable({
  listings,
  loading,
  actionLoading,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: ListingTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeVariant = (approved?: boolean) => {
    if (approved === true) return "default";
    if (approved === false) return "destructive";
    return "secondary";
  };

  const getStatusText = (approved?: boolean) => {
    if (approved === true) return "Approved";
    if (approved === false) return "Rejected";
    return "Pending";
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <ListingTableSkeleton itemsPerPage={itemsPerPage} />
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

  if (listings.length === 0) {
    return (
      <>
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-cream mb-2">
            No listings found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            There are no listings matching your current filters.
          </p>
        </div>
        {totalItems !== undefined && totalItems > 0 && (
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

  return (
    <>
      <div className="glass-effect backdrop-blur-xl bg-cream/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 rounded-lg">
        <Table className=" overflow-hidden">
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Id
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Restaurant
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Influencer
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Video
                </div>
              </TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Confidence
                </div>
              </TableHead>
              <TableHead className="w-32">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Visit Date
                </div>
              </TableHead>
              <TableHead className="w-32">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Created
                </div>
              </TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow
                key={listing.id}
                className="hover:bg-cream/20 dark:hover:bg-gray-800/50 border-b border-white/10 dark:border-gray-700/30"
              >
                <TableCell className="font-medium text-gray-900 dark:text-cream">
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      if (listing.id && navigator.clipboard) {
                        navigator.clipboard.writeText(listing.id);
                        toast.success("Listing ID copied to clipboard!");
                      }
                    }}
                  >
                    {listing.id ? `${listing.id.substring(0, 10)}${listing.id.length > 10 ? "..." : ""}` : "N/A"}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-cream">
                  {listing.restaurant?.name || "Unknown Restaurant"}
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">
                  {listing.influencer?.name || "Unknown Influencer"}
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">
                  <div className="max-w-[200px] truncate">
                    {listing.video?.title || "No Video"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(listing?.approved)}>
                    {getStatusText(listing?.approved)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">
                  {listing.confidence_score
                    ? `${(listing.confidence_score * 100).toFixed(1)}%`
                    : "N/A"}
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">
                  {listing?.visit_date ? formatDate(listing?.visit_date) : "N/A"}
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">
                  {formatDate(listing.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {listing.approved === undefined && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApprove(listing.id)}
                          className="h-8 w-8 p-0 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          disabled={actionLoading === listing.id}
                        >
                          {actionLoading === listing.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReject(listing.id)}
                          className="h-8 w-8 p-0 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          disabled={actionLoading === listing.id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(listing.id)}
                      className="h-8 w-8 p-0 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(listing.id)}
                      className="h-8 w-8 p-0 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalItems !== undefined && totalItems > 0 && (
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
