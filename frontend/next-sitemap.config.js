const config = {
  siteUrl: 'https://nomtok.com', // 👈 your live domain
  generateRobotsTxt: true,       // also creates robots.txt automatically
  changefreq: 'weekly',
  priority: 0.7,
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://nomtok.com/restaurants-sitemap.xml',
      'https://nomtok.com/influencers-sitemap.xml',
    ],
    // Exclude /dashboard from crawling
    policies: [
      {
        userAgent: '*', // Apply the rule to all bots
        disallow: ['/dashboard'], // Exclude /dashboard path
      },
    ],
  },
}

export default config
