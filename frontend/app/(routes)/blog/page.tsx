import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/utils";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogContent } from "./_components/blog-content";
import axios from "axios";
import { unstable_cache } from "next/cache";
import { BlogPost, BlogCategory } from "@/lib/types";

export const revalidate = 3600;

function BlogLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-cream p-2">
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg bg-gray-200">
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <Skeleton className="h-16 w-96 mx-auto mb-6" />
          <Skeleton className="h-8 w-[600px] mx-auto mb-8" />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-16 -mt-8 relative z-10">
        <div className="bg-cream rounded-2xl shadow-xl p-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function BlogPage() {
  let initialBlogs: BlogPost[] = [];
  let initialCategories: BlogCategory[] = [];

  // Check if we're in Next.js build phase where backend isn't available
  // NEXT_PHASE is only set during `next build`, not at runtime
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
  const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isBackendUnavailable = base.includes('backend:') && isNextBuildPhase;

  if (isBackendUnavailable) {
    console.log('[BlogPage] Skipping fetch during build (backend unavailable)');
  } else {
    try {
      const getCachedBlogs = unstable_cache(
        async () => {
          const { data } = await axios.get(`${base}/blog/`, {
            params: { limit: 12, skip: 0 }
          });
          return data.blogs || [];
        },
        ["blog-list"],
        { revalidate: 3600 }
      );

      const getCachedCategories = unstable_cache(
        async () => {
          const { data } = await axios.get(`${base}/blog/categories/`);
          return data || [];
        },
        ["blog-categories"],
        { revalidate: 3600 }
      );

      [initialBlogs, initialCategories] = await Promise.all([
        getCachedBlogs(),
        getCachedCategories(),
      ]);
    } catch (error) {
      console.error('[BlogPage] Error fetching blog data:', error);
    }
  }

  return (
    <Suspense fallback={<BlogLoadingSkeleton />}>
      <BlogContent initialBlogs={initialBlogs} initialCategories={initialCategories} />
    </Suspense>
  );
}

export const metadata: Metadata = buildPageMetadata({
  title: "Blog | Nomtok",
  description:
    "Read our latest blog posts about restaurants, food culture, and dining experiences.",
  path: "/blog",
  type: "website",
  keywords: ["blog", "restaurants", "food", "dining", "articles"],
  imageUrl: "/hero-main.jpg",
});
