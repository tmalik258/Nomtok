import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'

type BaseItem = {
  slug?: string
  updated_at?: string
  created_at?: string
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nomtok.com').replace(/\/$/, '')
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8030').replace(/\/$/, '')

const LIMIT = Number(process.env.SITEMAP_PAGE_SIZE || 100)

async function fetchAll<T extends BaseItem>(
  resource: 'restaurants' | 'influencers',
  listKey: 'restaurants' | 'influencers'
): Promise<T[]> {
  const results: T[] = []
  let skip = 0

  // configure axios for backend origin (avoid Next /api proxy at build-time)
  const client = axios.create({
    baseURL: API_URL,
    timeout: 30_000,
  })

  while (true) {
    try {
      const { data } = await client.get(`/${resource}/`, {
        params: { skip, limit: LIMIT },
      })

      const items: T[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.[listKey])
        ? data[listKey]
        : []

      if (!items.length) break
      results.push(...items)

      const total = typeof data?.total === 'number' ? data.total : undefined
      skip += LIMIT

      if (total !== undefined && skip >= total) break
      if (items.length < LIMIT) break
    } catch (err) {
      console.error(`[sitemaps] ${resource} page fetch failed at skip=${skip}:`, err)
      // Break to avoid infinite loop on repeated failures
      break
    }
  }

  return results
}

function xmlHeader(): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
}

function xmlFooter(): string {
  return '</urlset>\n'
}

function toISODate(value?: string): string {
  try {
    if (!value) return new Date().toISOString()
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return new Date().toISOString()
    return d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function urlXml(locPath: string, lastmod?: string, changefreq = 'weekly', priority = 0.7): string {
  const loc = `${SITE_URL}${locPath}`
  const lm = toISODate(lastmod)
  return (
    '  <url>\n' +
    `    <loc>${loc}</loc>\n` +
    `    <lastmod>${lm}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    '  </url>\n'
  )
}

async function writeXml(filename: string, body: string): Promise<void> {
  const outPath = path.join(process.cwd(), 'public', filename)
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, body, 'utf8')
  console.log(`[sitemaps] wrote ${filename} (${body.length} bytes)`) 
}

async function generateRestaurantsSitemap(): Promise<void> {
  try {
    const items = await fetchAll<BaseItem>('restaurants', 'restaurants')
    const urls = items
      .filter((r) => !!r.slug)
      .map((r) => urlXml(`/restaurants/${encodeURIComponent(r.slug!)}`, r.updated_at || r.created_at))
    const xml = xmlHeader() + urls.join('') + xmlFooter()
    await writeXml('restaurants-sitemap.xml', xml)
  } catch (err) {
    console.error('[sitemaps] restaurants generation failed:', err)
    // Write an empty sitemap to avoid breaking build/deploy pipelines
    await writeXml('restaurants-sitemap.xml', xmlHeader() + xmlFooter())
  }
}

async function generateInfluencersSitemap(): Promise<void> {
  try {
    const items = await fetchAll<BaseItem>('influencers', 'influencers')
    const urls = items
      .filter((i) => !!i.slug)
      .map((i) => urlXml(`/influencers/${encodeURIComponent(i.slug!)}`, i.updated_at || i.created_at))
    const xml = xmlHeader() + urls.join('') + xmlFooter()
    await writeXml('influencers-sitemap.xml', xml)
  } catch (err) {
    console.error('[sitemaps] influencers generation failed:', err)
    await writeXml('influencers-sitemap.xml', xmlHeader() + xmlFooter())
  }
}

async function main(): Promise<void> {
  console.log('[sitemaps] start generation', { SITE_URL, API_URL, LIMIT })
  await Promise.all([generateRestaurantsSitemap(), generateInfluencersSitemap()])
  console.log('[sitemaps] generation complete')
}

void main()