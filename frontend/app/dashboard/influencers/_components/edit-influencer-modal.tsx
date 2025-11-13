'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, User, Youtube, Globe, Users } from 'lucide-react';
import { useAdminInfluencer } from '@/lib/hooks/useAdminInfluencer';
import { 
  updateInfluencerSchema, 
  UpdateInfluencerFormData 
} from '@/lib/validations/influencer';
import { Influencer } from '@/lib/types';
import { toast } from 'sonner';

interface EditInfluencerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer: Influencer | null;
  onSuccess?: () => void;
}

export function EditInfluencerModal({
  open,
  onOpenChange,
  influencer,
  onSuccess,
}: EditInfluencerModalProps) {
  const { updateInfluencer, loading: isSubmitting } = useAdminInfluencer();

  const form = useForm<UpdateInfluencerFormData>({
    resolver: zodResolver(updateInfluencerSchema),
    defaultValues: {
      name: '',
      bio: '',
      avatar_url: '',
      banner_url: '',
      youtube_channel_id: '',
      youtube_url: '',
      subscriber_count: undefined,
    },
  });

  // Reset form when influencer changes or modal opens
  useEffect(() => {
    if (influencer && open) {
      form.reset({
        name: influencer.name || '',
        bio: influencer.bio || '',
        avatar_url: influencer.avatar_url || '',
        banner_url: influencer.banner_url || '',
        youtube_channel_id: influencer.youtube_channel_id || '',
        youtube_url: influencer.youtube_channel_url || '',
        subscriber_count: influencer.subscriber_count || undefined,
      });
    }
  }, [influencer, open, form]);

  const onSubmit = async (data: UpdateInfluencerFormData) => {
    if (!influencer) return;

    try {
      // Filter out empty strings and undefined values
      const filteredData: Partial<UpdateInfluencerFormData> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          (filteredData as Record<string, string | number | boolean | undefined>)[key] = value;
        }
      });

      await updateInfluencer(influencer.id, filteredData);
      
      toast.success('Influencer updated successfully!');
      onOpenChange(false);
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error('Failed to update influencer:', error);
      toast.error('Failed to update influencer. Please try again.');
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!influencer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            Edit Influencer
          </DialogTitle>
          <DialogDescription>
            Update the influencer&apos;s information. All fields are optional - only update what you need to change.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500" />
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter influencer name"
                        {...field}
                        disabled={isSubmitting}
                        className="focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a brief bio (optional)"
                        className="resize-none focus:border-orange-500 focus:ring-orange-500/20"
                        rows={3}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* YouTube Channel ID */}
              <FormField
                control={form.control}
                name="youtube_channel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      YouTube Channel ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UC..."
                        {...field}
                        disabled={isSubmitting}
                        className="focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* YouTube Channel URL */}
              <FormField
                control={form.control}
                name="youtube_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      YouTube Channel URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://youtube.com/@channel"
                        {...field}
                        disabled={isSubmitting}
                        className="focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Avatar URL */}
              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        {...field}
                        disabled={isSubmitting}
                        className="focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banner URL */}
              <FormField
                control={form.control}
                name="banner_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/banner.jpg"
                        {...field}
                        disabled={isSubmitting}
                        className="focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subscriber Count */}
              <FormField
                control={form.control}
                name="subscriber_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      Subscriber Count
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        disabled={isSubmitting}
                        className="focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Updating...' : 'Update Influencer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}