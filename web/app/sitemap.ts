import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const locales = routing.locales;

  const staticRoutes = ['', '/about', '/about-us', '/pricing', '/login', '/register', '/forgot-password', '/privacy', '/terms'];

  return locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1.0 : 0.8,
    }))
  );
}
