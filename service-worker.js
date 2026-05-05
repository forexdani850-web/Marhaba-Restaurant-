// Marhaba Restaurant Service Worker
const CACHE_NAME = 'marhaba-v1';
const urlsToCache = [
  '/Marhaba-Restaurant-/',
  '/Marhaba-Restaurant-/index.html',
  '/Marhaba-Restaurant-/styles.css',
  '/Marhaba-Restaurant-/app.js',
  '/Marhaba-Restaurant-/manifest.json',
  '/Marhaba-Restaurant-/offline.html'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching assets');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Some assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone the response
        const clonedResponse = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clonedResponse);
          });
        }

        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return offline page if available
            if (request.destination === 'document') {
              return caches.match('/Marhaba-Restaurant-/offline.html');
            }
          });
      })
  );
});

// Handle background sync for orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // Sync pending orders with server
      new Promise((resolve, reject) => {
        console.log('Service Worker: Syncing orders');
        resolve();
      })
    );
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/Marhaba-Restaurant-/images/icon-192.png',
      badge: '/Marhaba-Restaurant-/images/badge-72.png',
      tag: 'marhaba-notification',
      requireInteraction: false
    };
    event.waitUntil(
      self.registration.showNotification('Marhaba Restaurant', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if window is already open
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].url === '/Marhaba-Restaurant-/' && 'focus' in clientList[i]) {
            return clientList[i].focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow('/Marhaba-Restaurant-/');
        }
      })
  );
});
