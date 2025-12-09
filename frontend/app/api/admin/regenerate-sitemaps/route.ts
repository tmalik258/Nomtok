import { NextRequest, NextResponse } from 'next/server';
import { generateRestaurantsSitemap, generateInfluencersSitemap } from '@/scripts/generate-sitemaps';

const SITEMAP_SECRET = process.env.SITEMAP_REGENERATION_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Validate authentication token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('x-sitemap-secret');

    if (!SITEMAP_SECRET || token !== SITEMAP_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate sitemaps
    await Promise.all([
      generateRestaurantsSitemap(),
      generateInfluencersSitemap()
    ]);

    return NextResponse.json({
      success: true,
      message: 'Sitemaps regenerated successfully'
    });
  } catch (error) {
    console.error('[sitemaps] API route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

