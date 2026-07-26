const APP_VERSION = 'v26';
const CACHE_NAME = `flow-awareness-${APP_VERSION}`;
// 針對 iOS 離線開啟精準優化路徑
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    'index.html',
    './manifest.json',
    './icon-512.png'
];

// 安裝 Service Worker 並快取最新檔案
self.addEventListener('install', (event) => {
    self.skipWaiting();
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
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
    // 【重點修復】如果使用者是在請求網頁本身 (Navigate)，離線時無條件給予首頁 HTML，破解飛航模式白畫面
    if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('./index.html', { ignoreSearch: true }) || caches.match('./', { ignoreSearch: true });
            })
        );
        return;
    }

    // 一般靜態資源與音訊的請求：網路優先 (Network First)，失敗才給快取
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request, { ignoreSearch: true });
            })
    );
});