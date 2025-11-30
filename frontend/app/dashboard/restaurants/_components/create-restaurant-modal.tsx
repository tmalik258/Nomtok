'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminRestaurant } from '@/lib/hooks/useAdminRestaurant';
import {
  createRestaurantSchema,
  CreateRestaurantFormData,
  defaultRestaurantFormValues,
} from '@/lib/validations/restaurant-create';

interface CreateRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateRestaurantModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateRestaurantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRestaurant } = useAdminRestaurant();

  const form = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: defaultRestaurantFormValues,
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<CreateRestaurantFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      const result = await createRestaurant(data);
      
      if (result) {
        toast.success('Restaurant created successfully!', {
          description: `${data.name} has been added to your restaurant list.`,
          duration: 4000,
        });
        form.reset();
        onClose();
        onSuccess?.();
      }
    } catch (error: unknown) {
      console.error('Error creating restaurant:', error);
      
      // Extract error message from API response
      const apiError = error as { response?: { data?: { detail?: string }; status?: number }; message?: string };
      const errorMessage = apiError.response?.data?.detail || apiError.message || 'Failed to create restaurant';
      const statusCode = apiError.response?.status;
      
      // Display user-friendly error messages based on status code
      if (statusCode === 409) {
        toast.error('Restaurant Already Exists', {
          description: errorMessage,
          duration: 5000,
        });
      } else if (statusCode === 400) {
        toast.error('Invalid Information', {
          description: errorMessage,
          duration: 5000,
        });
      } else if (statusCode && statusCode >= 500) {
        toast.error('Server Error', {
          description: 'Something went wrong on our end. Please try again later.',
          duration: 5000,
        });
      } else {
        toast.error('Error Creating Restaurant', {
          description: errorMessage,
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-md glass-effect border-orange-500/30 backdrop-blur-xl shadow-2xl"
        aria-describedby="create-restaurant-description"
      >
        <DialogHeader className="pb-6 border-b border-border/20">
          <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-foreground">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <MapPin className="h-6 w-6 text-orange-500" />
            </div>
            Create New Restaurant
          </DialogTitle>
          <DialogDescription id="create-restaurant-description" className="text-muted-foreground mt-2">
            Enter the restaurant details. Additional information will be fetched automatically from Google Places.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Restaurant Details */}
            <div className="space-y-6 p-6 rounded-xl bg-card/50 border border-border/30">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Restaurant Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter restaurant name" 
                        {...field}
                        disabled={isSubmitting}
                        autoFocus
                        className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
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
                      <FormLabel className="text-sm font-medium text-foreground">City</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter city" 
                          {...field}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
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
                      <FormLabel className="text-sm font-medium text-foreground">Country</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter country" 
                          {...field}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                          defaultValue={"USA"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="hover:bg-muted/50 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="bg-orange-500 hover:bg-orange-600 text-cream transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Restaurant'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}