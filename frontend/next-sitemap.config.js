const config = {
  siteUrl: 'https://nomtok.com',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [
    '/dashboard',
    '/dashboard/*',
    '/login',
    '/signup',
    '/auth/*',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://nomtok.com/restaurants-sitemap.xml',
      'https://nomtok.com/influencers-sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        disallow: ['/dashboard', '/dashboard/', '/login', '/signup', '/auth/'],
      },
    ],
  },
}

export default config
