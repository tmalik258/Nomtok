import type { NextConfig } from "next";

// Avoid 'standalone' output on Windows to prevent symlink errors during local builds.
// Docker builds (Linux) will still use 'standalone'.
const isWindows = process.platform === 'win32'

const nextConfig: NextConfig = {
  ...(isWindows ? {} : { output: 'standalone' }), // Enable for Docker/Linux builds only
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'a.basemaps.cartocdn.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      }
    ],
  },
  async headers() {
    return [
      {
        // This handles all sitemap files, including sitemap.xml and sitemap-0.xml
        source: '/sitemap:path*.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
      {
        // Custom sitemaps: restaurants, influencers, and blogs
        source: '/(restaurants|influencers|blogs)-sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml' },
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, max-age=0, stale-while-revalidate=600',
          },
        ],
      },
      {
        // It's also good practice to set the correct type for robots.txt
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Sitemap rewrites - serve dynamically generated sitemaps via API route
    const sitemapRewrites = [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemaps/sitemap.xml',
      },
      {
        source: '/sitemap-0.xml',
        destination: '/api/sitemaps/sitemap-0.xml',
      },
      {
        source: '/restaurants-sitemap.xml',
        destination: '/api/sitemaps/restaurants-sitemap.xml',
      },
      {
        source: '/influencers-sitemap.xml',
        destination: '/api/sitemaps/influencers-sitemap.xml',
      },
      {
        source: '/blogs-sitemap.xml',
        destination: '/api/sitemaps/blogs-sitemap.xml',
      },
    ]

    // API routing configuration
    if (process.env.NODE_ENV === 'development') {
      // In development, proxy to local backend or Docker backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8030';
      return [
        ...sitemapRewrites,
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*/`
        }
      ]
    }
    // In production, only sitemap rewrites are needed
    return sitemapRewrites
  },
  async redirects() {
    // www -> non-www is handled by Nginx (single hop, no Next.js redirect)
    return [];
  },
};

export default nextConfig;
