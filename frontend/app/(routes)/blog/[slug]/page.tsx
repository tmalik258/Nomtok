import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/utils";
import { BlogDetailClient } from "./_components/blog-detail-client";
import axios from "axios";
import { unstable_cache } from "next/cache";
import type { BlogPost } from "@/lib/types";
import { BlogHero } from "./_components/blog-hero";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  let initialBlog: BlogPost | undefined;
  
  try {
    const getBlogCached = unstable_cache(
      async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
        const { data } = await axios.get(`${base}/blog/${slug}/`);
        return data as BlogPost;
      },
      ["blog-detail", slug],
      { revalidate: 3600 }
    );
    initialBlog = await getBlogCached();
  } catch {}

  return (
    <>
      {initialBlog && (
        <div className="p-2">
          <BlogHero blog={initialBlog} />
        </div>
      )}
      <BlogDetailClient slug={slug} initialBlog={initialBlog} renderHero={!initialBlog} />
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  let blog: BlogPost | undefined;
  
  try {
    const getBlogCached = unstable_cache(
      async () => {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8030";
        const { data } = await axios.get(`${base}/blog/${slug}/`);
        return data as BlogPost;
      },
      ["blog-metadata", slug],
      { revalidate: 3600 }
    );
    blog = await getBlogCached();
  } catch {}

  if (!blog) {
    return buildPageMetadata({
      title: "Blog Post Not Found | Nomtok",
      description: "This blog post could not be found on Nomtok.",
      path: `/blog/${slug}`,
      type: "article",
      keywords: ["blog", slug],
      imageUrl: "/hero-main.jpg",
    });
  }

  const title = blog.meta_title || blog.title;
  const description = blog.meta_description || blog.excerpt || `Read ${blog.title} on Nomtok`;
  const keywords = blog.meta_keywords 
    ? blog.meta_keywords.split(",").map(k => k.trim())
    : [blog.title, "blog", "restaurant", "food"];

  return buildPageMetadata({
    title: `${title} | Nomtok Blog`,
    description,
    path: `/blog/${slug}`,
    type: "article",
    keywords,
    imageUrl: blog.cover_image_url || "/hero-main.jpg",
  });
}
