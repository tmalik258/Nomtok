"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X } from "lucide-react";
import { TagSelection } from "./tag-selection";
import { Tag } from "@/lib/types";
import { tagActions } from "@/lib/actions/tag-actions";
import { toast } from "sonner";

interface TagManagementSectionProps {
  restaurantId: string;
  tags: Tag[];
  onTagsUpdated: () => void;
}

export function TagManagementSection({
  restaurantId,
  tags,
  onTagsUpdated,
}: TagManagementSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    tags?.map((tag) => tag.id || "") || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setSelectedTagIds(tags?.map((tag) => tag.id || "") || []);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedTagIds(tags?.map((tag) => tag.id || "") || []);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await tagActions.adminUpdateRestaurantTags(restaurantId, selectedTagIds);
      
      toast.success("Tags updated successfully");
      setIsEditing(false);
      onTagsUpdated();
    } catch (error: unknown) {
      console.error("Error updating tags:", error);
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(
        apiError.response?.data?.detail || "Failed to update tags"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tags</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Tags
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <TagSelection
              selectedTagIds={selectedTagIds}
              onTagsChange={handleTagsChange}
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
            {tags?.length > 0 ? (
              tags?.map((tag) => (
                <Badge key={tag.id || ""} variant="outline">
                  {tag.name || ""}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No tags assigned</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}