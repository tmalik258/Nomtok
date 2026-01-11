import { Suspense } from 'react';
import { BlogManagement } from './_components/blog-management';
import { BlogLoading } from './_components/blog-loading';

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Blog Management
        </h1>
        <p className="text-muted-foreground">
          Manage blog posts, create content, and publish articles
        </p>
      </div>
      
      <Suspense fallback={<BlogLoading count={6} />}>
        <BlogManagement />
      </Suspense>
    </div>
  );
}
