const CACHE_NAME = 'glacier-fleet-v1';

// Daftar asset berdasarkan struktur file di gambar Anda
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/settings.html',
  '/admin-dashboard.html',
  '/daily-activity.html',
  '/toolbox.html',
  '/undercarriage.html',
  '/logo.png',
  '/manifest.json',
  // CDN External agar tetap bisa load saat sinyal lemah
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Tahap Install: Membekukan asset ke dalam cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Glacier Cache: Freezing assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Tahap Aktivasi: Membersihkan cache lama jika versi berubah
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Glacier Cache: Clearing old shards...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Tahap Fetch: Mengambil data dari cache terlebih dahulu (Cache First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Jika ada di cache, gunakan itu. Jika tidak, ambil dari jaringan.
      return response || fetch(event.request);
    })
  );
});
