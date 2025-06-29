// public/sw.js

// This is a placeholder service worker file.
// In a real application, you would add logic here for:
// 1. Caching static assets for offline use (app shell).
// 2. Caching API responses for offline data access.
// 3. Handling background sync to upload data when connection is restored.
// 4. Listening for push notifications from a server.

const CACHE_NAME = "norruva-v1";
const urlsToCache = [
  "/",
  "/dashboard",
  "/manifest.json", // Example, you would create this
  // Add other critical assets here
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell");
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache");
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Fetching", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    }),
  );
});

// TODO: Implement background sync listener
// self.addEventListener('sync', event => { ... });

// TODO: Implement push notification listener
// self.addEventListener('push', event => { ... });
