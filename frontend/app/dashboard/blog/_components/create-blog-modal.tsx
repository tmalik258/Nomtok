'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { useAdminBlog } from '@/lib/hooks';
import { BlogCreate } from '@/lib/actions/admin-blog-actions';
import { z } from 'zod';
import { BlogFormBasicFields } from './blog-form-basic-fields';
import { BlogFormStatusFields } from './blog-form-status-fields';
import { BlogFormCategoriesField } from './blog-form-categories-field';
import { BlogFormSEOFields } from './blog-form-seo-fields';
import { BlogFormActions } from './blog-form-actions';

const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  meta_title: z.string().max(255, 'Meta title must be less than 255 characters').optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  category_ids: z.array(z.string()).optional(),
});

type CreateBlogFormData = z.infer<typeof createBlogSchema>;

interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateBlogModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBlogModalProps) {
  const { createBlog, loading: isSubmitting } = useAdminBlog();

  const form = useForm<CreateBlogFormData>({
    resolver: zodResolver(createBlogSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      cover_image_url: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      is_published: false,
      is_featured: false,
      category_ids: [],
    },
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<CreateBlogFormData> = async (data) => {
    try {
      const blogData: BlogCreate = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || undefined,
        cover_image_url: data.cover_image_url || undefined,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        meta_keywords: data.meta_keywords || undefined,
        is_published: data.is_published,
        is_featured: data.is_featured,
        category_ids: data.category_ids && data.category_ids.length > 0 ? data.category_ids : undefined,
      };
      
      await createBlog(blogData);
      
      toast.success('Blog post created successfully!');
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error creating blog post:', error);
      // Error is already handled by the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new blog post. You can publish it later.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BlogFormBasicFields form={form} />
            <BlogFormStatusFields form={form} />
            <BlogFormCategoriesField form={form} />
            <BlogFormSEOFields form={form} />
            <BlogFormActions
              isSubmitting={isSubmitting}
              onCancel={onClose}
              submitText="Create Post"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
