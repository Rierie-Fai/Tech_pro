// PERUBAHAN 1: Naikkan versi cache agar browser mendeteksi update (v3 -> v4)
const CACHE_NAME = 'hexindo-fleet-mecha-v4.5.1';

const ASSETS_TO_CACHE = [
    // --- FILE UTAMA ---
    './',               // Root
    './index.html',     // <--- PERUBAHAN 2: File Redirector Baru (Wajib didaftarkan)
    
    // --- HALAMAN APLIKASI (Pastikan path ini sesuai struktur folder Anda) ---
    './login/login-mecha.html',
    './index/index-mecha.html',  // Halaman Dashboard Utama
    './admin/admin-mecha.html',
    './activity/dar-mecha.html',
    './uc/ppu-mecha.html',
    './hyd/pump-tuning-mecha.html',
    './settings/settings-mecha.html',
    './tool/toolbox-mecha.html',
    
    // --- ICON ---
    './icon-192.png',
    './icon-512.png',

    // --- CSS (Pastikan ada di folder css di Root) ---
    './css/all.min.css',
    './css/jetbrain.css',
    './css/rajdhani.css',

    // --- JS (Pastikan ada di folder js di Root) ---
    './js/chart.js',
    './js/jspdf.plugin.autotable.min.js',
    './js/jspdf.umd.min.js',
    './js/supabase-js@2.js',
    './js/tailwindcss.js',
    './js/xlsx.full.min.js',

    // --- FONTS ---
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

// --- INSTALL EVENT ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Assets (v4)...');
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.error('[SW Error] Gagal cache file. Cek path:', err);
            });
        })
    );
    self.skipWaiting();
});

// --- ACTIVATE EVENT (Pembersih Cache Lama) ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    // Hapus semua cache yang BUKAN v4
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Menghapus Cache Lama:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// --- FETCH EVENT ---
self.addEventListener('fetch', (event) => {
    // Jangan cache request database Supabase
    if (event.request.url.includes('supabase.co')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
