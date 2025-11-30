"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
} from "lucide-react";
import { Influencer } from "@/lib/types";
import { useInfluencers } from "@/lib/hooks/useInfluencers";
import { useAdminInfluencer } from "@/lib/hooks/useAdminInfluencer";
import DashboardLoadingSkeleton from "@/app/dashboard/_components/dashboard-loading-skeleton";
import { CreateInfluencerModal } from "./create-influencer-modal";
import { EditInfluencerModal } from "./edit-influencer-modal";
import { InfluencersTable } from "./influencers-table";

export default function InfluencerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "subscriber_count" | "total_videos" | "created_at"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<Influencer | null>(null);
  const itemsPerPage = 10;

  const { influencers, loading, error, refetch } = useInfluencers({
    limit: 1000,
  }); // Fetch large number for client-side operations
  const { deleteInfluencer } = useAdminInfluencer();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Client-side filtering and sorting
  const filteredAndSortedInfluencers = useMemo(() => {
    let filtered = [...influencers];

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (influencer) =>
          influencer.name.toLowerCase().includes(searchLower) ||
          (influencer.bio &&
            influencer.bio.toLowerCase().includes(searchLower)) ||
          (influencer.youtube_channel_id &&
            influencer.youtube_channel_id.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "subscriber_count":
          aValue = a.subscriber_count || 0;
          bValue = b.subscriber_count || 0;
          break;
        case "total_videos":
          aValue = a.total_videos || 0;
          bValue = b.total_videos || 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [influencers, debouncedSearchTerm, sortBy, sortOrder]);

  // Client-side pagination
  const paginatedInfluencers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedInfluencers.slice(startIndex, endIndex);
  }, [filteredAndSortedInfluencers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    filteredAndSortedInfluencers.length / itemsPerPage
  );
  const total = filteredAndSortedInfluencers.length;

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback(
    (newSortBy: string) => {
      if (newSortBy === sortBy) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(
          newSortBy as
            | "name"
            | "subscriber_count"
            | "total_videos"
            | "created_at"
        );
        setSortOrder("asc");
      }
      setCurrentPage(1);
    },
    [sortBy, sortOrder]
  );

  // CRUD operations
  const handleCreateInfluencer = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditInfluencer = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setIsEditModalOpen(true);
  };

  const handleDeleteInfluencer = async (influencer: Influencer) => {
    if (window.confirm(`Are you sure you want to delete ${influencer.name}?`)) {
      try {
        await deleteInfluencer(influencer.id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error("Failed to delete influencer:", error);
      }
    }
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return <DashboardLoadingSkeleton variant="management" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Influencers</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateInfluencer}>
            <Plus className="mr-2 h-4 w-4" /> Add Influencer
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-0 dark:bg-none dark:bg-transparent border-0 shadow-none dark:border-none">
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 h-4 w-4" />
              <Input
                placeholder="Search by name, bio, or channel ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-48 glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl bg-cream/95 dark:bg-gray-900/95 border-orange-500/20">
                <SelectItem
                  value="name"
                  className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400"
                >
                  Name
                </SelectItem>
                <SelectItem
                  value="subscriber_count"
                  className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400"
                >
                  Subscribers
                </SelectItem>
                <SelectItem
                  value="total_videos"
                  className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400"
                >
                  Videos
                </SelectItem>
                <SelectItem
                  value="created_at"
                  className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400"
                >
                  Date Added
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!error && (
        <>
          {/* Influencers Table */}
          <InfluencersTable
            influencers={paginatedInfluencers}
            total={total}
            loading={loading}
            searchTerm={debouncedSearchTerm}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onEditInfluencer={handleEditInfluencer}
            onDeleteInfluencer={handleDeleteInfluencer}
            onCreateInfluencer={handleCreateInfluencer}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <CreateInfluencerModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <EditInfluencerModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        influencer={selectedInfluencer}
        onSuccess={() => {
          refetch();
          setIsEditModalOpen(false);
          setSelectedInfluencer(null);
        }}
      />
    </div>
  );
}
