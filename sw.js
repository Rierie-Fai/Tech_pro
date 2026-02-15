const CACHE_NAME = 'hexindo-fleet-mecha-v2.2';

// Daftar file yang akan disimpan ke memori HP (Offline Cache)
const ASSETS_TO_CACHE = [
    // 1. Halaman Utama (HTML)
    './',
    './index.html',
    './login.html',
    './admin.html',
    './dar.html',
    './ppu.html',
    './pump-tuning.html',
    './settings-mecha.html',
    './toolbox.html',
    
    // 2. Ikon Aplikasi (PWA Icons) - TERBARU
    './icon-192.png',
    './icon-512.png',

    // 3. Styles (CSS) - Sesuai folder 'css' di gambar
    './css/all.min.css',
    './css/jetbrain.css',
    './css/rajdhani.css',

    // 4.Scripts (JS) - Sesuai folder 'js' di gambar
    './js/chart.js',
    './js/jspdf.plugin.autotable.min.js',
    './js/jspdf.umd.min.js',
    './js/supabase-js@2.js',
    './js/tailwindcss.js',
    './js/xlsx.full.min.js',

    // 5. Fonts - Sesuai folder 'webfonts' di gambar
    // FontAwesome
    './webfonts/fa-brands-400.woff2',
    './webfonts/fa-regular-400.woff2',
    './webfonts/fa-solid-900.woff2',
    './webfonts/fa-v4compatibility.woff2',
    
    // Custom Fonts (JetBrains & Rajdhani ada di dalam folder webfonts di gambar)
    './webfonts/JetBrainsMono-Bold.ttf',
    './webfonts/JetBrainsMono-Regular.ttf',
    './webfonts/Rajdhani-Bold.ttf',
    './webfonts/Rajdhani-Medium.ttf', 
    './webfonts/Rajdhani-Regular.ttf'
];

// --- 1. INSTALL EVENT (Menyimpan file saat pertama kali dibuka) ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// --- 2. ACTIVATE EVENT (Menghapus cache lama jika ada update) ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Cleaning Old Cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// --- 3. FETCH EVENT (Strategi: Cache First, Network Fallback) ---
self.addEventListener('fetch', (event) => {
    // PENTING: Jangan cache request ke Supabase agar data database selalu update
    if (event.request.url.includes('supabase.co')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Jika file ada di cache HP, pakai itu. Jika tidak, ambil dari internet.
            return response || fetch(event.request).catch(() => {
                // Opsional: Jika offline total dan file tidak ada (misal gambar baru), biarkan error/kosong
            });
        })
    );
});
