import { Suspense } from 'react';
import { RestaurantsContent } from './_components/restaurants-content';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/utils';

export const revalidate = 3600;

export default function RestaurantsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    }>
      {/* <h1 className="sr-only">Find Restaurants by City &amp; Influencers</h1> */}
      <RestaurantsContent />
    </Suspense>
  );
}

export const metadata: Metadata = buildPageMetadata({
  title: 'Find Restaurants by City & Influencers',
  description:
    'Browse curated restaurant recommendations by influencers. Filter by city and discover top places to eat.',
  path: '/restaurants',
  type: 'website',
  keywords: ['restaurants', 'city', 'influencers', 'food guide'],
  imageUrl: '/hero-main.jpg',
});
