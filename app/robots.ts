import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/new', '/calendar', '/run'],
    },
    sitemap: 'https://afterun.run/sitemap.xml',
  }
}
