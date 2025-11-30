"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X } from "lucide-react";
import { CuisineSelection } from "./cuisine-selection";
import { Cuisine } from "@/lib/types";
import { cuisineActions } from "@/lib/actions/cuisine-actions";
import { toast } from "sonner";

interface CuisineManagementSectionProps {
  restaurantId: string;
  cuisines: Cuisine[];
  onCuisinesUpdated: () => void;
}

export function CuisineManagementSection({
  restaurantId,
  cuisines,
  onCuisinesUpdated,
}: CuisineManagementSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<string[]>(
    cuisines.map((cuisine) => cuisine.id)
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setSelectedCuisineIds(cuisines.map((cuisine) => cuisine.id));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedCuisineIds(cuisines.map((cuisine) => cuisine.id));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await cuisineActions.adminUpdateRestaurantCuisines(restaurantId, selectedCuisineIds);
      
      setIsEditing(false);
      toast.success("Cuisines updated successfully");
      onCuisinesUpdated();
    } catch (error) {
      console.error("Error updating cuisines:", error);
      toast.error("Failed to update cuisines");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCuisinesChange = (cuisineIds: string[]) => {
    setSelectedCuisineIds(cuisineIds);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cuisines</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Cuisines
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <CuisineSelection
              selectedCuisineIds={selectedCuisineIds}
              onCuisinesChange={handleCuisinesChange}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-cream"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cuisines.length > 0 ? (
              cuisines.map((cuisine) => (
                <Badge key={cuisine.id} variant="outline">
                  {cuisine.name}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No cuisines assigned</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}