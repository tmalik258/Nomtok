'use client';

import { useEffect } from 'react';
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
import { BlogUpdate } from '@/lib/actions/admin-blog-actions';
import { BlogPost } from '@/lib/types';
import { z } from 'zod';
import { BlogFormBasicFields } from './blog-form-basic-fields';
import { BlogFormStatusFields } from './blog-form-status-fields';
import { BlogFormCategoriesField } from './blog-form-categories-field';
import { BlogFormSEOFields } from './blog-form-seo-fields';
import { BlogFormActions } from './blog-form-actions';

const editBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  excerpt: z.string().optional(),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  meta_title: z.string().max(255, 'Meta title must be less than 255 characters').optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  category_ids: z.array(z.string()).optional(),
});

type EditBlogFormData = z.infer<typeof editBlogSchema>;

interface EditBlogModalProps {
  blog: BlogPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditBlogModal({
  blog,
  isOpen,
  onClose,
  onSuccess,
}: EditBlogModalProps) {
  const { updateBlog, loading: isSubmitting } = useAdminBlog();

  const form = useForm<EditBlogFormData>({
    resolver: zodResolver(editBlogSchema),
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

  useEffect(() => {
    if (blog && isOpen) {
      form.reset({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt || '',
        cover_image_url: blog.cover_image_url || '',
        meta_title: blog.meta_title || '',
        meta_description: blog.meta_description || '',
        meta_keywords: blog.meta_keywords || '',
        is_published: blog.is_published,
        is_featured: blog.is_featured,
        category_ids: blog.categories?.map(c => c.id) || [],
      });
    }
  }, [blog, isOpen, form]);

  const onSubmit: SubmitHandler<EditBlogFormData> = async (data) => {
    if (!blog) return;

    try {
      const blogData: BlogUpdate = {
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
      
      await updateBlog(blog.id, blogData);
      
      toast.success('Blog post updated successfully!');
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error updating blog post:', error);
      // Error is already handled by the hook
    }
  };

  if (!blog) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Blog Post</DialogTitle>
          <DialogDescription>
            Update the blog post details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BlogFormBasicFields form={form} />
            <BlogFormStatusFields form={form} />
            <BlogFormCategoriesField form={form} prefix="edit-category" />
            <BlogFormSEOFields form={form} />
            <BlogFormActions
              isSubmitting={isSubmitting}
              onCancel={onClose}
              submitText="Update Post"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
