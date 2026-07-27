// 開發者除錯模式：徹底跳過快取，所有請求直接走網路
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // 一次清空以前留存的所有舊快取
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// 不攔截任何 fetch，全部放行直接連網
self.addEventListener('fetch', () => {
  return; 
});
