const CACHE_PREFIX = 'poblumi-shell-'
const CACHE_NAME = `${CACHE_PREFIX}2026-08-10-12`
const APP_SHELL = [
  '/',
  '/about/',
  '/offline/',
  '/404.html',
  '/manifest.webmanifest',
  '/css/index.css?v=4.0.0',
  '/css/solitude-v4-compat.css',
  '/css/poblumi-brand.css?v=11',
  '/css/apple-liquid-glass.css?v=40',
  '/js/utils.js?v=4.0.0',
  '/js/main.js?v=4.0.0',
  '/js/solitude-v4-actions.js',
  '/js/poblumi-brand.js?v=11',
  '/img/pwa/poblumi-logo-192.png',
  '/img/poblumi-pack/blog-badge.webp',
  '/img/poblumi-pack/cover-character.webp'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.registration.navigationPreload
        ? self.registration.navigationPreload.enable()
        : undefined)
      .then(() => self.clients.claim())
  )
})

const cacheResponse = (request, response) => {
  if (!response || !response.ok) return response
  const copy = response.clone()
  caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {})
  return response
}

const networkFirstPage = (request, preloadResponse) => Promise.resolve(preloadResponse)
  .then(response => response || fetch(request))
  .then(response => cacheResponse(request, response))
  .catch(async () => {
    const exact = await caches.match(request, { ignoreSearch: true })
    return exact || caches.match('/offline/')
  })

// Static assets use versioned query strings. Match the exact request so a new
// `?v=` value cannot be shadowed by an older cached stylesheet or script.
const staleWhileRevalidate = request => caches.match(request)
  .then(cached => {
    const network = fetch(request)
      .then(response => cacheResponse(request, response))
      .catch(() => cached)
    return cached || network
  })

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request, event.preloadResponse))
    return
  }

  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
