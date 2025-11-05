"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import {
  restaurantEditSchema,
  RestaurantEditFormData,
  cleanRestaurantFormData,
} from "@/lib/validations/restaurant-edit";

import { Restaurant } from "@/lib/types";
import axios from "axios";

interface UseRestaurantFormProps {
  restaurant: Restaurant;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useRestaurantForm({
  restaurant,
  onSuccess,
  onCancel,
}: UseRestaurantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<RestaurantEditFormData>({
    resolver: zodResolver(restaurantEditSchema),
    defaultValues: {
      name: restaurant.name,
      address: restaurant.address,
      latitude: restaurant.latitude || 0,
      longitude: restaurant.longitude || 0,
      city: restaurant.city || "",
      country: restaurant.country || "",
      google_place_id: restaurant.google_place_id || "",
      google_rating: restaurant.google_rating,
      business_status: restaurant.business_status || "",
      photo_url: restaurant.photo_url || "",
      is_active: restaurant.is_active || false,
    },
  });

  const onSubmit = async (data: RestaurantEditFormData) => {
    setIsSubmitting(true);
    
    try {
      const cleanedData = cleanRestaurantFormData(data);
      
      await adminApi.put(`/restaurants/${restaurant.slug}`, cleanedData);
      
      toast.success("Restaurant updated successfully!");
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/restaurants");
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating restaurant:", error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.error(`Failed to update restaurant: ${errorMessage}`);
      } else {
        toast.error("An unexpected error occurred while updating the restaurant.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard/restaurants");
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
    handleCancel,
  };
}