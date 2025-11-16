## Overview

* Implement standardized, performant, and maintainable SEO across all pages using Next.js App Router and TypeScript.

* Centralize site-wide defaults; enable dynamic, per-route overrides via `generateMetadata`.

* Include favicon and PWA manifest, Open Graph/Twitter, canonical URLs, JSON-LD structured data, and breadcrumb schema.

## Assumptions

* Next.js (App Router) with TypeScript and `app/` directory.

* Assets placed in `public/` unless using file-based metadata in `app/`.

* Base URL: `https://nomtok.com` (adjust as needed).

## 1) Meta Tags Implementation

* Create `@/lib/seo/site.ts` with shared SEO config: base URL, site name, default title/description, default OG image, per-route keyword hints.

* In `app/layout.tsx`:

  * Define `metadataBase` with site URL; set `title` default/template; `description`; `keywords`.

  * Add `viewport: 'width=device-width, initial-scale=1'`.

  * Set `alternates.canonical` to base URL for root; page-specific canonicals handled per page.

  * Add `robots` (index/follow) and `icons` and `manifest` (see sections below).

  * Include `<meta charSet="utf-8" />` in `<head>` to satisfy charset requirement.

* For each page in `app/.../page.tsx`:

  * Implement `export async function generateMetadata(...)` to return per-page `Metadata` with:

    * `title`: ≤60 chars, unique, primary keyword first; uses layout template.

    * `description`: ≤160 chars, compelling, keyword-rich.

    * `alternates.canonical`: computed from route params and `metadataBase`.

    * `keywords`: page-specific.

    * `openGraph` and `twitter` populated (see Section 3).

### Example: layout metadata (TypeScript)

```ts
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://nomtok.com'),
  title: { default: 'Nomtok', template: '%s | Nomtok' },
  description: 'Discover Nomtok — modern solutions to accelerate your workflow.',
  keywords: ['nomtok', 'workflow', 'productivity'],
  viewport: 'width=device-width, initial-scale=1',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nomtok.com' },
}
```

### Example: charset in layout head

```tsx
// app/layout.tsx (inside returned JSX)
<html lang="en">
  <head>
    <meta charSet="utf-8" />
  </head>
  <body>{/* ... */}</body>
</html>
```

### Example: per-page metadata

```ts
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const canonical = new URL(`/blog/${params.slug}`, 'https://nomtok.com').toString()
  const title = 'Primary Keyword — Descriptive Post Title' // ≤60 chars
  const description = 'Compelling summary including primary and secondary keywords (≤160 chars).'

  return {
    title,
    description,
    alternates: { canonical },
    keywords: ['primary keyword', 'secondary keyword', 'nomtok'],
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      images: [{ url: '/og/blog-default.png', width: 1200, height: 630, alt: title }],
      siteName: 'Nomtok',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og/blog-default.png'],
    },
  }
}
```

## 2) Favicon Setup

* Generate PNG favicons: `16x16`, `32x32`, `48x48`, `64x64` and `favicon.ico`.

* Create Apple Touch icon: `180x180` (plus optional sizes 120/152/167 as needed).

* Place assets in `public/` (or adopt file-based metadata: `app/icon.png`, `app/apple-icon.png`).

* Add manifest for PWA compatibility at `/public/manifest.json`.

* Declare icons in `metadata.icons` and link manifest via `metadata.manifest`.

### Example: icons in metadata

```ts
// app/layout.tsx
export const metadata = {
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.json',
}
```

### Example: `manifest.json`

```json
{
  "name": "Nomtok",
  "short_name": "Nomtok",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": [
    { "src": "/favicon-64x64.png", "sizes": "64x64", "type": "image/png" },
    { "src": "/favicon-48x48.png", "sizes": "48x48", "type": "image/png" },
    { "src": "/favicon-32x32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "/favicon-16x16.png", "sizes": "16x16", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png", "purpose": "any" }
  ]
}
```

## 3) Open Graph (OG) & Twitter Tags

* Provide global defaults in layout; override per page via `generateMetadata`.

* Enforce OG image size `1200x630`, optimized and compressed; store in `/public/og/*`.

* Set `openGraph`:`type` (`website` for general pages; `article` for blog/news), `url` from canonical, `siteName`.

* Set `twitter.card = 'summary_large_image'` and matching `title/description/images`.

### Example: global defaults

```ts
// app/layout.tsx
export const metadata = {
  openGraph: {
    type: 'website',
    title: 'Nomtok',
    description: 'Discover Nomtok — modern solutions to accelerate your workflow.',
    url: 'https://nomtok.com',
    images: [{ url: '/og/default.png', width: 1200, height: 630, alt: 'Nomtok' }],
    siteName: 'Nomtok',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nomtok',
    description: 'Discover Nomtok — modern solutions to accelerate your workflow.',
    images: ['/og/default.png'],
  },
}
```

## 4) Keyword Optimization

* Research intent-driven keywords per page; maintain a lightweight map in `@/lib/seo/keywords.ts`.

* Enforce semantic HTML5:

  * Exactly one `h1` per page, descriptive and keyword-led.

  * Logical `h2`–`h6` hierarchy; avoid skipping levels.

* Include keywords in:

  * Page titles (`title`), meta descriptions (`description`), header tags (`h*`), image `alt`.

* Structured data:

  * For articles, add `Article` JSON-LD (author, datePublished, headline, image, publisher).

  * For product/listing pages, add appropriate schema (`Product`, `FAQPage`, etc.).

### Example: JSON-LD in a page

```tsx
// app/blog/[slug]/page.tsx
import Script from 'next/script'

export default function BlogPostPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Primary Keyword — Descriptive Post Title',
    datePublished: '2025-11-15',
    author: [{ '@type': 'Person', name: 'Nomtok Editorial' }],
    image: ['https://nomtok.com/og/blog-default.png']
  }

  return (
    <>
      <Script id="article-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
      {/* page content */}
    </>
  )
}
```

## 5) Technical SEO Implementation

* URLs: ensure descriptive, unique slugs for dynamic routes; avoid query-string heavy pages for indexable content.

* 301 redirects: define in `next.config.ts` using `async redirects()` for legacy → new paths.

* Page speed:

  * Compress OG and favicon assets (PNG/WebP); keep OG ≤300KB.

  * Use `next/image` with `sizes` and `priority` for above-the-fold; default lazy-loading elsewhere.

  * Defer non-critical scripts; prefer code-splitting (`dynamic()` for large client-only components).

* Breadcrumb schema:

  * Generate JSON-LD `BreadcrumbList` from URL segments; inject via `<Script type="application/ld+json">` on pages with nesting.

### Example: redirects

```ts
// next.config.ts
const nextConfig = {
  async redirects() {
    return [
      { source: '/old-url', destination: '/new-url', permanent: true },
      { source: '/blog/post-123', destination: '/blog/primary-keyword-descriptive-title', permanent: true },
    ]
  },
}
export default nextConfig
```

### Example: breadcrumb JSON-LD

```tsx
import Script from 'next/script'

function BreadcrumbJsonLd({ segments }: { segments: { name: string; url: string }[] }) {
  const itemListElement = segments.map((s, i) => ({
    '@type': 'ListItem', position: i + 1, name: s.name, item: s.url,
  }))
  return (
    <Script id="breadcrumb-jsonld" type="application/ld+json">
      {JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement })}
    </Script>
  )
}
```

## 6) Quality Assurance

* Validate meta: programmatic tests using Playwright to assert presence/values of `title`, `meta[name="description"]`, canonical, OG/Twitter tags.

* Social previews: test with Facebook Sharing Debugger and Twitter Card Validator.

* Favicon: verify across Chrome/Firefox/Safari + iOS/Android.

* Mobile responsiveness & speed: run Lighthouse (Desktop/Mobile), fix regressions; focus on Core Web Vitals.

* Accessibility/alt tags: audit with axe/lighthouse; ensure all `Image` components have descriptive `alt`.

* Broken links: crawl site with a link checker and fix 404s; add redirects where appropriate.

## 7) Monitoring & Maintenance

* Quarterly SEO audits: re-check titles/descriptions, structured data, breadcrumbs, canonical correctness, redirects.

* Track rankings for target keywords via GSC and analytics; monitor CTR and impressions.

* Review pages with low CTR; iteratively optimize titles/descriptions within character limits.

* Keep OG images up-to-date for key landing/blog pages; retire outdated redirects.

* Maintain consistency via centralized `@/lib/seo` helpers; document patterns for new pages.

## Deliverables

* Site-wide metadata in `app/layout.tsx` with charset, viewport, icons, manifest, defaults.

* Per-page `generateMetadata` implementations with canonical, OG, Twitter, keywords.

* Favicon assets and `manifest.json` in `public/`.

* JSON-LD components for Articles and Breadcrumbs; integrated on relevant pages.

* Redirects in `next.config.ts` for legacy paths.

* Automated Playwright checks for meta tags and structured data.

## Acceptance Criteria

* Titles ≤60 chars; descriptions ≤160 chars; unique per page; canonicals correct.

* Valid OG/Twitter previews; images 1200x630; `summary_large_image` set.

* Favicons and Apple Touch icons visible across devices; manifest passes Lighthouse PWA checks.

* Breadcrumb JSON-LD validated; no broken links; alt tags present.

* Lighthouse performance and SEO scores ≥90 on key pages; Core Web Vitals within thresholds.

