// ============================================================
// Service Worker for Absolute Universe Collection Tracker
// ============================================================
// Strategy: Network-first for HTML/JS, Cache-first for images.
// Falls back to cache when offline so users can still browse
// their collection.
// ============================================================

var CACHE_NAME = 'au-tracker-v24';

// App shell — files to pre-cache on install
var APP_SHELL = [
  '/',
  '/index.html',
  '/issue.html',
  '/auth.html',
  '/auth-integration.js',
  '/theme-switcher.js',
  '/firebase-config.js',
  '/scanner.js',
  '/variants.json',
  '/prices.json'
];

// Skip caching these patterns
var SKIP_PATTERNS = [
  /dc_absolute_universe_bg\.mp4/,   // Large video file
  /firebasejs/,                      // Firebase SDK (CDN)
  /googleapis\.com/,                 // Google APIs
  /gstatic\.com/,                    // Google static assets
  /firestore\.googleapis/,           // Firestore API calls
  /identitytoolkit/,                 // Firebase Auth API
  /securetoken/,                     // Firebase token refresh
  /chrome-extension/                 // Browser extensions
];

// Install: pre-cache the app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(APP_SHELL);
    }).then(function() {
      // Activate immediately without waiting for existing tabs to close
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(function() {
      // Take control of all open tabs immediately
      return self.clients.claim();
    })
  );
});

// Helper: trim a cache to a max number of entries (FIFO)
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(function(cache) {
    cache.keys().then(function(keys) {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(function() {
          if (keys.length - 1 > maxItems) trimCache(cacheName, maxItems);
        });
      }
    });
  });
}

// Fetch: network-first for navigation/scripts, cache-first for images
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip URLs that match skip patterns
  for (var i = 0; i < SKIP_PATTERNS.length; i++) {
    if (SKIP_PATTERNS[i].test(url)) return;
  }

  // For navigation requests and same-origin scripts: network-first
  if (event.request.mode === 'navigate' ||
      (event.request.destination === 'script' && url.indexOf(self.location.origin) === 0) ||
      url.indexOf('.html') !== -1 ||
      url.indexOf('.json') !== -1) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        // Clone and cache the fresh response
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Network failed — try the cache
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // If no cached version and it's a navigation, show the cached index
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // For images: cache-first for same-origin only.
  // Cross-origin images (cover art from CDNs) are left to the browser
  // so they use img-src CSP instead of connect-src, avoiding CSP blocks.
  if (event.request.destination === 'image' ||
      /\.(jpg|jpeg|png|gif|svg|webp)(\?|$)/i.test(url)) {
    // Skip cross-origin image requests — let the browser load them directly
    if (url.indexOf(self.location.origin) !== 0) return;

    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
              // Keep image cache from growing unbounded
              trimCache(CACHE_NAME, 200);
            });
          }
          return response;
        }).catch(function() {
          // Return a transparent 1x1 pixel as fallback for images
          return new Response(
            atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
            { headers: { 'Content-Type': 'image/gif' } }
          );
        });
      })
    );
    return;
  }

  // For everything else: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var fetchPromise = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        return cached || new Response('Offline', { status: 503 });
      });
      return cached || fetchPromise;
    })
  );
});
