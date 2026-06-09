// Forces the waiting service worker to become the active service worker immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Forces the active worker to immediately control all open tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Custom fetch event listener for next-pwa custom worker
self.addEventListener('fetch', (event) => {
  // Only intercept and return the full-screen offline asset for true page navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline') || caches.match('/offline.html');
      })
    );
    return;
  }

  // For standard background data files, fonts, or JS chunks, use standard Stale-While-Revalidate caching
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
