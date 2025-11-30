"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin, Building, Globe, Star } from "lucide-react";
import { Restaurant } from "@/lib/types";
import { toast } from "sonner";
import { useGeocoding } from "@/lib/hooks/useGeocoding";
import { useRestaurantUpdate } from "@/lib/hooks/useRestaurantUpdate";

const restaurantDetailsSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").max(100, "Name too long"),
  address: z.string().min(1, "Address is required").max(200, "Address too long"),
  city: z.string().min(1, "City is required").max(50, "City name too long"),
  country: z.string().min(1, "Country is required").max(50, "Country name too long"),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  google_place_id: z.string().optional(),
  photo_url: z.string().url("Invalid photo URL").optional().or(z.literal("")),
  is_active: z.boolean(),
});

type RestaurantDetailsFormData = z.infer<typeof restaurantDetailsSchema>;

interface RestaurantDetailsTabProps {
  restaurant: Restaurant;
  onSuccess: () => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function RestaurantDetailsTab({
  restaurant,
  onSuccess,
  onUnsavedChanges,
}: RestaurantDetailsTabProps) {
  const { geocodeAddress, loading: isLoadingLocation, error: geocodingError } = useGeocoding();
  const { updateRestaurant, isUpdating } = useRestaurantUpdate({
    onSuccess,
  });

  const form = useForm<RestaurantDetailsFormData>({
    resolver: zodResolver(restaurantDetailsSchema),
    defaultValues: {
      name: restaurant.name || "",
      address: restaurant.address || "",
      city: restaurant.city || "",
      country: restaurant.country || "",
      latitude: restaurant.latitude || undefined,
      longitude: restaurant.longitude || undefined,
      google_place_id: restaurant.google_place_id || "",
      photo_url: restaurant.photo_url || "",
      is_active: restaurant.is_active ?? true,
    },
  });

  const { watch, formState: { isDirty } } = form;

  // Watch for form changes to notify parent about unsaved changes
  useEffect(() => {
    onUnsavedChanges(isDirty);
  }, [isDirty, onUnsavedChanges]);

  const handleSave = async (data: RestaurantDetailsFormData) => {
    await updateRestaurant(restaurant.id, {
      name: data.name,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      google_place_id: data.google_place_id,
      photo_url: data.photo_url,
      is_active: data.is_active,
    });
  };

  const handleCancel = () => {
    form.reset({
      name: restaurant.name || "",
      address: restaurant.address || "",
      city: restaurant.city || "",
      country: restaurant.country || "",
      latitude: restaurant.latitude || undefined,
      longitude: restaurant.longitude || undefined,
      google_place_id: restaurant.google_place_id || "",
      photo_url: restaurant.photo_url || "",
      is_active: restaurant.is_active ?? true,
    });
    onUnsavedChanges(false);
  };

  const handleGeocodeAddress = async () => {
    const address = watch("address");
    const city = watch("city");
    const country = watch("country");
    
    if (!address || !city || !country) {
      toast.error("Please fill in address, city, and country first");
      return;
    }

    try {
      const result = await geocodeAddress({
        address,
        city,
        country
      });

      if (result) {
        form.setValue("latitude", result.latitude);
        form.setValue("longitude", result.longitude);
        toast.success(`Location coordinates updated: ${result.formatted_address}`);
      } else if (geocodingError) {
        toast.error(geocodingError);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error("Failed to geocode address");
    }
  };

  return (
    <div className="pt-6 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          {/* Basic Information */}
          <Card className="glass-effect border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-orange-500" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter restaurant name"
                        {...field}
                        className="focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel>Restaurant Status</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Control whether this restaurant is active and visible
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-orange-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="glass-effect border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-orange-500" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter full address"
                        {...field}
                        className="focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter city"
                          {...field}
                          className="focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter country"
                          {...field}
                          className="focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Coordinates</h4>
                    <p className="text-sm text-muted-foreground">
                      Latitude and longitude for precise location
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeocodeAddress}
                    disabled={isLoadingLocation}
                    className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                  >
                    {isLoadingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Coordinates
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., 40.7128"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., -74.0060"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="glass-effect border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-orange-500" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="google_place_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Place ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Google Place ID (optional)"
                        {...field}
                        className="focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/photo.jpg"
                          {...field}
                          className="focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display Google Rating if available */}
              {restaurant.google_rating && (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">
                    Google Rating: {restaurant.google_rating}/5
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
              className="hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
              className="bg-orange-500 hover:bg-orange-600 text-cream"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}