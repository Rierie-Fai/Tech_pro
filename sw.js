// PERBAIKAN 1: Gunakan 'const' (huruf kecil), bukan 'Const'
const CACHE_NAME = 'hexindo-fleet-mecha-v3';

// Daftar file yang akan disimpan ke memori HP (Offline Cache)
const ASSETS_TO_CACHE = [
    // 1. Halaman Utama (HTML)
    './', 
    
    // PERBAIKAN 2: Gunakan './' (masuk folder), bukan '../' (mundur)
    // Pastikan nama folder dan nama file di bawah ini SESUAI dengan struktur asli Anda
    './index/index-mecha.html',
    './login/login-mecha.html',
    './admin/admin-mecha.html',
    './activity/dar-mecha.html',
    './uc/ppu-mecha.html',
    './hyd/pump-tuning-mecha.html',
    './settings/settings-mecha.html',
    './tool/toolbox-mecha.html',
    
    // 2. Ikon Aplikasi (PWA Icons)
    './icon-192.png',
    './icon-512.png',

    // 3. Styles (CSS)
    './css/all.min.css',
    './css/jetbrain.css',
    './css/rajdhani.css',

    // 4. Scripts (JS)
    './js/chart.js',
    './js/jspdf.plugin.autotable.min.js',
    './js/jspdf.umd.min.js',
    './js/supabase-js@2.js',
    './js/tailwindcss.js',
    './js/xlsx.full.min.js',

    // 5. Fonts
    './webfonts/fa-brands-400.woff2',
    './webfonts/fa-regular-400.woff2',
    './webfonts/fa-solid-900.woff2',
    './webfonts/fa-v4compatibility.woff2',
    
    './webfonts/JetBrainsMono-Bold.ttf',
    './webfonts/JetBrainsMono-Regular.ttf',
    './webfonts/Rajdhani-Bold.ttf',
    './webfonts/Rajdhani-Medium.ttf', 
    './webfonts/Rajdhani-Regular.ttf'
];

// --- 1. INSTALL EVENT ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Assets...');
            // Menambahkan error handling agar kita tahu file mana yang salah path-nya
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.error('[SW Error] Gagal cache file. Cek path ASSETS_TO_CACHE:', err);
            });
        })
    );
    self.skipWaiting();
});

// --- 2. ACTIVATE EVENT ---
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

// --- 3. FETCH EVENT ---
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('supabase.co')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
