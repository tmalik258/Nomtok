import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nomtok.com').replace(/\/$/, '')
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8030').replace(/\/$/, '')

const LIMIT = Number(process.env.SITEMAP_PAGE_SIZE || 100)

async function fetchAll(resource, listKey) {
  // Skip fetching during Next.js build phase - backend not accessible
  // Sitemaps will be generated at container startup via start-with-sitemaps.js
  const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
  
  if (isNextBuildPhase) {
    console.log(`[sitemaps] Skipping ${resource} fetch (build phase)`)
    return []
  }

  const results = []
  let skip = 0

  // configure axios for backend origin (avoid Next /api proxy at build-time)
  const client = axios.create({
    baseURL: API_URL,
    timeout: 10_000, // Reduced timeout for build-time
  })

  while (true) {
    try {
      const { data } = await client.get(`/${resource}/`, {
        params: { skip, limit: LIMIT },
      })

      const items = Array.isArray(data)
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
      // During build, log but don't fail - return empty results
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        console.log(`[sitemaps] ${resource} fetch skipped (backend unavailable: ${err.code})`)
        break
      }
      console.error(`[sitemaps] ${resource} page fetch failed at skip=${skip}:`, err)
      // Break to avoid infinite loop on repeated failures
      break
    }
  }

  return results
}

function xmlHeader() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
}

function xmlFooter() {
  return '</urlset>\n'
}

function toISODate(value) {
  try {
    if (!value) return new Date().toISOString()
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return new Date().toISOString()
    return d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function urlXml(locPath, lastmod, changefreq = 'weekly', priority = 0.7) {
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

async function writeXml(filename, body) {
  const outPath = path.join(process.cwd(), 'public', filename)
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, body, 'utf8')
  console.log(`[sitemaps] wrote ${filename} (${body.length} bytes)`) 
}

export async function generateRestaurantsSitemap() {
  try {
    const items = await fetchAll('restaurants', 'restaurants')
    const urls = items
      .filter((r) => !!r.slug)
      .map((r) => urlXml(`/restaurants/${encodeURIComponent(r.slug)}`, r.updated_at || r.created_at))
    const xml = xmlHeader() + urls.join('') + xmlFooter()
    await writeXml('restaurants-sitemap.xml', xml)
  } catch (err) {
    console.error('[sitemaps] restaurants generation failed:', err)
    // Write an empty sitemap to avoid breaking build/deploy pipelines
    await writeXml('restaurants-sitemap.xml', xmlHeader() + xmlFooter())
  }
}

export async function generateInfluencersSitemap() {
  try {
    const items = await fetchAll('influencers', 'influencers')
    const urls = items
      .filter((i) => !!i.slug)
      .map((i) => urlXml(`/influencers/${encodeURIComponent(i.slug)}`, i.updated_at || i.created_at))
    const xml = xmlHeader() + urls.join('') + xmlFooter()
    await writeXml('influencers-sitemap.xml', xml)
  } catch (err) {
    console.error('[sitemaps] influencers generation failed:', err)
    await writeXml('influencers-sitemap.xml', xmlHeader() + xmlFooter())
  }
}

export async function regenerateSitemapIndex() {
  try {
    console.log('[sitemaps] regenerating sitemap.xml index...')
    const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>${SITE_URL}/sitemap-0.xml</loc></sitemap>
<sitemap><loc>${SITE_URL}/restaurants-sitemap.xml</loc></sitemap>
<sitemap><loc>${SITE_URL}/influencers-sitemap.xml</loc></sitemap>
</sitemapindex>`
    await writeXml('sitemap.xml', index)
  } catch (err) {
    console.error('[sitemaps] Failed to regenerate sitemap.xml index:', err)
  }
}

async function main() {
  console.log('[sitemaps] runtime generation start', { SITE_URL, API_URL, LIMIT })
  await Promise.all([generateRestaurantsSitemap(), generateInfluencersSitemap()])
  await regenerateSitemapIndex()
  console.log('[sitemaps] runtime generation complete')
}

// Only run when executed directly via CLI (npm run generate-sitemaps)
// Don't run when imported by API route or start-with-sitemaps.js
const isDirectExecution = process.argv[1]?.includes('generate-sitemaps')
if (isDirectExecution) {
  main().catch((err) => console.error('[sitemaps] runtime generation error', err))
}

export default main
