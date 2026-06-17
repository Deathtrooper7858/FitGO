const CACHE = 'fitgo-v1'
const STATIC_ASSETS = ['/', '/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((cached) => {
      // Network-first for HTML navigation, cache-first for assets
      if (request.headers.get('Accept')?.includes('text/html')) {
        return fetch(request)
          .then((response) => {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
            return response
          })
          .catch(() => cached || caches.match('/'))
      }
      return cached || fetch(request)
    })
  )
})
