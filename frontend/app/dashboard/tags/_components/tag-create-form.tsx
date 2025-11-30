"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import axios from 'axios';
import { Tag } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Tag name must be at least 2 characters.' }).max(50, { message: 'Tag name must not exceed 50 characters.' }),
});

interface TagFormProps {
  mode: 'create' | 'edit';
  tag?: Tag;
  onSuccess: () => void;
}

export default function TagCreateForm({ mode, tag, onSuccess }: TagFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (mode === 'edit' && tag) {
      form.setValue('name', tag.name);
    } else {
      form.reset({ name: '' });
    }
  }, [mode, tag, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (mode === 'create') {
        await axios.post('/api/tags', values);
        toast.success('Tag created successfully!');
      } else {
        await axios.put(`/api/tags/${tag?.id}`, values);
        toast.success('Tag updated successfully!');
      }
      onSuccess();
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      console.error(`Failed to ${mode} tag:`, error);
      toast.error(`Failed to ${mode} tag. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter tag name" 
                  {...field} 
                  className="backdrop-blur-sm bg-cream/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-cream border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Tag' : 'Update Tag')}
          </Button>
        </div>
      </form>
    </Form>
  );
}