"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RestaurantPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRestaurants?: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function RestaurantPagination({
  currentPage,
  totalPages,
  totalRestaurants,
  onPageChange,
  loading = false,
}: RestaurantPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        {totalRestaurants && (
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalRestaurants)} of {totalRestaurants} restaurants
          </p>
        )}
      </div>
      
      <div className="flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={`${
                  currentPage <= 1 || loading
                    ? "pointer-events-none opacity-50"
                    : "hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                }`}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={pageNum === currentPage}
                    className={`${
                      loading
                        ? "pointer-events-none opacity-50"
                        : pageNum === currentPage
                        ? "bg-orange-600 text-cream hover:bg-orange-700"
                        : "hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                    }`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={
                  currentPage >= totalPages || loading
                    ? "pointer-events-none opacity-50"
                    : "hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}