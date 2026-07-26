const CACHE_NAME = 'flow-awareness-v25';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-512.png'
];

// 安裝 Service Worker 並快取最新檔案
self.addEventListener('install', (event) => {
    self.skipWaiting(); // 強制立刻啟用最新的 Service Worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 清除舊版本的 Cache 快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache); // 刪除過期快取
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 攔截請求：網路優先，失敗時才使用快取
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 若網路正常取得最新 response，順便更新快取
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // 【修復 Bug 5】離線時使用快取，並忽略 query string (例如 ?v=25)，確保離線時能精確命中
                return caches.match(event.request, { ignoreSearch: true });
            })
    );
});