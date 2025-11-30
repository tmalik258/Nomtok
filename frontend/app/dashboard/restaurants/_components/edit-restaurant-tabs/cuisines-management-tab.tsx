"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, X, ChefHat, Search } from "lucide-react";
import { Restaurant, Cuisine } from "@/lib/types";
import { toast } from "sonner";
import { cuisineActions } from "@/lib/actions/cuisine-actions";

const cuisineSchema = z.object({
  name: z
    .string()
    .min(1, "Cuisine name is required")
    .max(50, "Cuisine name too long"),
});

type CuisineFormData = z.infer<typeof cuisineSchema>;

interface CuisinesManagementTabProps {
  restaurant: Restaurant;
  onSuccess: () => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function CuisinesManagementTab({
  restaurant,
  onSuccess,
  onUnsavedChanges,
}: CuisinesManagementTabProps) {
  const [cuisines, setCuisines] = useState<Cuisine[]>(
    restaurant.cuisines || []
  );
  const [availableCuisines, setAvailableCuisines] = useState<Cuisine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CuisineFormData>({
    resolver: zodResolver(cuisineSchema),
    defaultValues: {
      name: "",
    },
  });

  // Check for unsaved changes
  useEffect(() => {
    const originalCuisineIds = new Set(
      restaurant.cuisines?.map((c) => c.id) || []
    );
    const currentCuisineIds = new Set(cuisines.map((c) => c.id));

    const hasChanges =
      originalCuisineIds.size !== currentCuisineIds.size ||
      [...originalCuisineIds].some((id) => !currentCuisineIds.has(id));

    onUnsavedChanges(hasChanges);
  }, [cuisines, restaurant.cuisines, onUnsavedChanges]);

  // Fetch available cuisines from backend
  const fetchAvailableCuisines = useCallback(async () => {
    setIsLoading(true);
    try {
      const allCuisines = await cuisineActions.getAllCuisines();
      
      // Filter out cuisines that are already assigned to the restaurant
      const availableCuisines = allCuisines.filter(
        (cuisine) => !restaurant.cuisines?.some((rc) => rc.id === cuisine.id)
      );
      
      setAvailableCuisines(availableCuisines);
    } catch (error) {
      console.error("Error fetching cuisines:", error);
      toast.error("Failed to fetch cuisines", {
        description: "An unexpected error occurred while loading cuisines",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [restaurant]);

  useEffect(() => {
    fetchAvailableCuisines();
  }, [restaurant.slug, fetchAvailableCuisines]);

  const handleAddCuisine = (cuisine: Cuisine) => {
    setCuisines((prev) => [...prev, cuisine]);
    setAvailableCuisines((prev) => prev.filter((c) => c.id !== cuisine.id));
  };

  const handleRemoveCuisine = (cuisineId: string) => {
    const removedCuisine = cuisines.find((c) => c.id === cuisineId);
    if (removedCuisine) {
      setCuisines((prev) => prev.filter((c) => c.id !== cuisineId));
      setAvailableCuisines((prev) => [...prev, removedCuisine]);
    }
  };

  const handleCreateCuisine = async (data: CuisineFormData) => {
    try {
      // This would be replaced with actual API call to create cuisine
      const newCuisine: Cuisine = {
        id: `new-${Date.now()}`,
        name: data.name,
        created_at: new Date().toISOString(),
      };

      setCuisines((prev) => [...prev, newCuisine]);
      form.reset();
      toast.success(`Cuisine "${data.name}" created and added`);
    } catch (error) {
      console.error("Error creating cuisine:", error);
      toast.error("Failed to create cuisine");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // This would be replaced with actual API call to update restaurant cuisines
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      toast.success("Cuisines updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating cuisines:", error);
      toast.error("Failed to update cuisines");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCuisines(restaurant.cuisines || []);
    onUnsavedChanges(false);
  };

  const filteredAvailableCuisines = availableCuisines.filter((cuisine) =>
    cuisine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pt-6 space-y-6">
        {/* Current Cuisines */}
        <Card className="glass-effect border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="h-5 w-5 text-orange-500" />
              Current Cuisines ({cuisines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cuisines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cuisines.map((cuisine) => (
                  <Badge
                    key={cuisine.id}
                    variant="default"
                    className="bg-orange-600 hover:bg-orange-700 text-cream px-3 py-1 text-sm flex items-center gap-2"
                  >
                    {cuisine.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCuisine(cuisine.id)}
                      className="h-4 w-4 p-0 hover:bg-orange-800 text-cream"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No cuisines assigned. Add cuisines from the available options
                below.
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Add Available Cuisines */}
        <Card className="glass-effect border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-lg">Add Cuisines</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search available cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="ml-2 text-muted-foreground">
                  Loading cuisines...
                </span>
              </div>
            ) : filteredAvailableCuisines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredAvailableCuisines.map((cuisine) => (
                  <Badge
                    key={cuisine.id}
                    variant="outline"
                    className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10 cursor-pointer px-3 py-1 text-sm flex items-center gap-2 transition-colors"
                    onClick={() => handleAddCuisine(cuisine)}
                  >
                    <Plus className="h-3 w-3" />
                    {cuisine.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {searchTerm
                  ? "No cuisines found matching your search."
                  : "No available cuisines to add."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Create New Cuisine */}
        <Card className="glass-effect border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-lg">Create New Cuisine</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreateCuisine)}
                className="flex gap-3"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Enter new cuisine name"
                          {...field}
                          className="focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-cream"
                  disabled={!form.formState.isValid}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create & Add
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex justify-end pt-4 gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          className="hover:bg-muted/50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600 text-cream"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
