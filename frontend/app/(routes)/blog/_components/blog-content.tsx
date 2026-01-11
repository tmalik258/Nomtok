"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BlogPost, BlogCategory } from "@/lib/types";
import { useBlogs } from "@/lib/hooks";
import { BlogHero } from "./blog-hero";
import { BlogCategoryFilter } from "./blog-category-filter";
import { BlogGrid } from "./blog-grid";
import { BlogPagination } from "./blog-pagination";

interface BlogContentProps {
  initialBlogs: BlogPost[];
  initialCategories: BlogCategory[];
}

export function BlogContent({ initialBlogs, initialCategories }: BlogContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const categoryParam = searchParams.get("category") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const {
    blogs,
    total,
    page,
    totalPages,
    loading,
    setCategoryFilter,
    goToPage,
    updateParams,
  } = useBlogs({
    category: categoryParam || undefined,
    page: pageParam,
    limit: 12,
    sort_by: "published_at",
    sort_order: "desc",
  });

  // Sync hook with URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    updateParams({
      category: categoryParam || undefined,
      page: pageParam,
    });
  }, [categoryParam, pageParam, updateParams]);

  const updateCategory = useCallback((category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all" || !category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    params.set("page", "1");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl, { scroll: false });
    setCategoryFilter(category === "all" ? undefined : category);
  }, [searchParams, pathname, router, setCategoryFilter]);

  const updatePage = useCallback((pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNum.toString());
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
    goToPage(pageNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, pathname, router, goToPage]);

  return (
    <div className="min-h-screen bg-cream p-2">
      <BlogHero />
      
      <div className="max-w-7xl mx-auto px-4 py-16 -mt-8 relative z-10">
        <div className="bg-cream rounded-2xl shadow-xl p-8">
          <BlogCategoryFilter
            categories={initialCategories}
            selectedCategory={categoryParam}
            onCategoryChange={updateCategory}
          />
          
          {loading && blogs.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <BlogGrid blogs={blogs} />
              
              {totalPages > 1 && (
                <BlogPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={updatePage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
