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

// Push notification event listener
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      console.error('Push event payload JSON parsing failed:', err);
      data = {
        title: 'DDT Structure Notification',
        body: event.data.text() || 'You have a new update in your workspace.'
      };
    }
  } else {
    data = {
      title: 'DDT Structure Notification',
      body: 'You have a new update in your workspace.'
    };
  }

  const title = data.title || 'DDT Structure Notification';
  const options = {
    body: data.body || 'New updates available.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    tag: data.tag || 'generic-notification',
    requireInteraction: data.requireInteraction !== false,
    vibrate: data.vibrate || [200, 100, 200],
    silent: false,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Push notification click event listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/';

  // Resolve absolute URL to target origin
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a window is already open, focus and navigate it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url && 'focus' in client) {
            return client.focus().then((focusedClient) => {
              if (focusedClient && 'navigate' in focusedClient) {
                return focusedClient.navigate(absoluteUrl);
              }
            });
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteUrl);
        }
      })
  );
});
