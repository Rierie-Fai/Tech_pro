const CACHE_NAME = 'hexindo-fleet-v1';
// Masukkan semua file penting yang dibutuhkan teknisi
const assets = [
  '/',
  '/login.html',
  '/index.html',
  '/daily-activity.html',
  '/toolbox.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com' // Masukkan script external jika ingin tampilannya tetap rapi saat offline
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching all assets...');
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      // Jika ada di cache, pakai cache. Jika tidak, ambil dari jaringan.
      return response || fetch(e.request);
    })
  );
});
