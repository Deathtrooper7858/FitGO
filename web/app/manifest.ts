import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitGO — Tu mejor versión',
    short_name: 'FitGO',
    description: 'App de fitness gamificada. Entrena, registra tu nutrición y planifica tu progreso.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f0f',
    theme_color: '#6c5ce7',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icon-192.svg', sizes: '512x512', type: 'image/svg+xml' },
      { src: '/icon-192.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
