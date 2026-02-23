import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const ALLOWED_SITEMAPS = [
  'sitemap.xml',
  'sitemap-0.xml',
  'restaurants-sitemap.xml',
  'influencers-sitemap.xml',
  'blogs-sitemap.xml',
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  if (!ALLOWED_SITEMAPS.includes(filename)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const filePath = join(process.cwd(), 'public', filename)
    const content = await readFile(filePath, 'utf-8')

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, max-age=0, stale-while-revalidate=600',
      },
    })
  } catch {
    return new NextResponse('Sitemap not found', { status: 404 })
  }
}
