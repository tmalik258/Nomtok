import { Suspense } from 'react';
import { BlogCategoriesManagement } from './_components/blog-categories-management';
import { Skeleton } from '@/components/ui/skeleton';

function CategoriesLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function BlogCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Blog Categories
        </h1>
        <p className="text-muted-foreground">
          Manage blog post categories
        </p>
      </div>
      
      <Suspense fallback={<CategoriesLoading />}>
        <BlogCategoriesManagement />
      </Suspense>
    </div>
  );
}
