"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Youtube } from "lucide-react";
import { useAdminInfluencer } from "@/lib/hooks/useAdminInfluencer";
import { 
  createInfluencerByUrlSchema, 
  type CreateInfluencerByUrlFormData 
} from "@/lib/validations/influencer";
import { toast } from "sonner";

interface CreateInfluencerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateInfluencerModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateInfluencerModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInfluencer } = useAdminInfluencer();

  const form = useForm<CreateInfluencerByUrlFormData>({
    resolver: zodResolver(createInfluencerByUrlSchema),
    defaultValues: {
      youtube_url: "",
    },
  });

  const onSubmit = async (data: CreateInfluencerByUrlFormData) => {
    setIsSubmitting(true);
    try {
      await createInfluencer(data);
      toast.success("Influencer created successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const apiError = error as { 
        response?: { 
          data?: { 
            detail?: string | Array<{ loc: string[]; msg: string; type: string; input?: unknown }> 
          } 
        }; 
        message?: string 
      };
      
      let errorMessage = "Failed to create influencer. Please try again.";
      
      if (apiError?.response?.data?.detail) {
        const detail = apiError.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract the first validation error message
          errorMessage = detail[0].msg || "Validation error occurred";
        }
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            Add New Influencer
          </DialogTitle>
          <DialogDescription>
            Enter a YouTube channel URL to automatically create an influencer profile. 
            We&apos;ll fetch the channel details for you.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="youtube_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Channel URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/@channelname"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Influencer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};