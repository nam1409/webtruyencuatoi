const CACHE_NAME = 'zenstory-v2';
const OFFLINE_URL = '/';

// Tăng cường danh sách cache ban đầu
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tải từng file một để nếu thiếu 1 file thì các file khác vẫn được cache
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Không cache các yêu cầu API hoặc Chrome Extensions
  if (url.pathname.startsWith('/api') || url.origin.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Trả về từ Cache nếu có (Ưu tiên tốc độ cho Assets)
      if (cachedResponse && !event.request.mode === 'navigate') {
        return cachedResponse;
      }

      // 2. Nếu không có hoặc là yêu cầu điều hướng (Trang HTML), thử mạng
      return fetch(event.request)
        .then((networkResponse) => {
          const isImage = event.request.destination === 'image';
          
          // Chỉ cache các phản hồi hợp lệ (hoặc ảnh từ domain khác)
          if (!networkResponse || networkResponse.status !== 200) {
            if (!isImage) return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // 3. Kịch bản Offline: Nếu mất mạng
          if (event.request.mode === 'navigate') {
            // Thử tìm trang hiện tại trong cache
            return caches.match(event.request).then((fallback) => {
              return fallback || caches.match(OFFLINE_URL);
            });
          }
          return cachedResponse;
        });
    })
  );
});
