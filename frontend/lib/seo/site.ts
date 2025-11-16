export const siteConfig = {
  baseUrl: "https://www.nomtok.com",
  siteName: "Nomtok",
  defaultOgImage: "/hero-main.jpg",
  defaultKeywords: [
    "nomtok",
    "restaurants",
    "influencers",
    "food",
    "city guides",
  ],
};

export const canonicalForPath = (path: string) =>
  new URL(path, siteConfig.baseUrl).toString();

export const toTitleFromSlug = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 60);