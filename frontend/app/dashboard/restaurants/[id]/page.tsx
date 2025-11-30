"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminRestaurant } from "@/lib/hooks";
import { Restaurant } from "@/lib/types";
import { RestaurantEditForm } from "./_components/restaurant-edit-form";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { TagManagementSection } from "./_components/tag-management-section";
import { CuisineManagementSection } from "./_components/cuisine-management-section";
import { cn } from "@/lib/utils";

export default function RestaurantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getRestaurant, deleteRestaurant, loading } = useAdminRestaurant();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const restaurantId = params.id as string;

  const loadRestaurant = useCallback(async () => {
    const data = await getRestaurant(restaurantId);
    if (data) {
      setRestaurant(data);
    }
  }, [restaurantId, getRestaurant]);

  useEffect(() => {
    if (restaurantId) {
      loadRestaurant();
    }
    // Check if edit mode is enabled via URL parameter
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [restaurantId, searchParams, loadRestaurant]);

  const handleEdit = () => {
    setIsEditing(true);
    // Add edit parameter to URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('edit', 'true');
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Remove edit parameter from URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('edit');
    const newUrl = newSearchParams.toString() ? `${window.location.pathname}?${newSearchParams.toString()}` : window.location.pathname;
    router.replace(newUrl);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // Remove edit parameter from URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('edit');
    const newUrl = newSearchParams.toString() ? `${window.location.pathname}?${newSearchParams.toString()}` : window.location.pathname;
    router.replace(newUrl);
    loadRestaurant(); // Refresh data
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteRestaurant(restaurantId);
    if (success) {
      router.push("/dashboard/restaurants");
    }
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const handleBack = () => {
    router.push("/dashboard/restaurants");
  };

  if (loading && !restaurant) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Restaurants
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Restaurant not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel Edit
          </Button>
          <h1 className="text-2xl font-bold">Edit Restaurant</h1>
        </div>
        <RestaurantEditForm
          restaurant={restaurant}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Restaurants
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="text-sm">{restaurant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={restaurant.is_active ? "default" : "secondary"}
                    className={cn("", {
                      "bg-orange-500 text-cream": restaurant.is_active,
                      "bg-red-500 text-cream": !restaurant.is_active,
                    })}
                  >
                    {restaurant.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Address
                </label>
                <p className="text-sm">{restaurant.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  City
                </label>
                <p className="text-sm">{restaurant.city || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Country
                </label>
                <p className="text-sm">{restaurant.country || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Latitude
                </label>
                <p className="text-sm">{restaurant.latitude}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Longitude
                </label>
                <p className="text-sm">{restaurant.longitude}</p>
              </div>
              {restaurant.google_rating && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Google Rating
                  </label>
                  <p className="text-sm">{restaurant.google_rating}/5</p>
                </div>
              )}
              {restaurant.business_status && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Business Status
                  </label>
                  <p className="text-sm">{restaurant.business_status}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags Management Section */}
        <TagManagementSection
          restaurantId={restaurantId}
          tags={restaurant.tags || []}
          onTagsUpdated={loadRestaurant}
        />
        
        {/* Cuisines Management Section */}
        <CuisineManagementSection
          restaurantId={restaurantId}
          cuisines={restaurant.cuisines || []}
          onCuisinesUpdated={loadRestaurant}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Restaurant"
        description={`Are you sure you want to delete &quot;${restaurant.name}&quot;? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
