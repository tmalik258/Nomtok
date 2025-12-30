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
        // Custom sitemaps: restaurants and influencers
        source: '/(restaurants|influencers)-sitemap.xml',
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
    // API routing configuration
    if (process.env.NODE_ENV === 'development') {
      // In development, proxy to local backend or Docker backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8030';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*/`
        }
      ]
    }
    // In production (Vercel), API routes are handled by serverless functions
    return []
  },
  async redirects() {
    return [
      {
        // Redirect www to non-www (canonical is non-www)
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nomtok.com' }],
        destination: 'https://nomtok.com/:path*',
        permanent: true, // This is a 301 redirect
      },
    ];
  },
};

export default nextConfig;
