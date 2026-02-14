const CACHE_NAME = 'hexfleet-flat-v3';

// Daftar file yang akan disimpan ke dalam cache (disesuaikan dengan screenshot file Anda)
const urlsToCache = [
    './',
    './index.html',
    './login.html',
    
    // Modul Utama (Sesuai nama file di screenshot)
    './admin.html',
    './dar.html',           // Daily Activity Report
    './ppu.html',           // Undercarriage/PPU
    './pump-tuning.html',
    './settings-mecha.html',
    './toolbox.html',

    // Aset Gambar & Manifest
    './logo.png',
    './manifest.json',

    // Library Eksternal (Optional: Cache CDN agar lebih cepat load ulang)
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap'
];

// 1. Install Service Worker
self.addEventListener('install', event => {
    self.skipWaiting(); // Paksa SW baru untuk segera aktif
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Activate & Clean Old Caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Fetch Strategy: Network First (Coba internet dulu, baru cache)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
