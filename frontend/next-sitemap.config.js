const config = {
  siteUrl: 'https://nomtok.com', // 👈 your live domain
  generateRobotsTxt: true,       // also creates robots.txt automatically
  changefreq: 'weekly',
  priority: 0.7,
  additionalSitemaps: [
    'https://nomtok.com/restaurants-sitemap.xml',
    'https://nomtok.com/influencers-sitemap.xml',
  ],
}

export default config
