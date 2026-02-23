const CACHE_NAME = 'hexindo-cache-v1.6.4';

// Daftarkan semua file yang ada di folder Anda berdasarkan struktur direktori
const urlsToCache = [
  './',
  './manifest.json',
  
  // HTML ROOT
  './activity.html',
  './admin.html',
  './dashboard.html',
  './index.html',
  './login.html',
  './pump-tuning.html',
  './setting.html',
  './toolbox.html',
  './troubleshoot.html',
  './uc.html',

  // HTML/CSS
  './html/css/activity.css',
  './html/css/admin.css',
  './html/css/dashboard-theme.css',
  './html/css/login-theme.css',
  './html/css/pump.css',
  './html/css/toolbox.css',
  './html/css/uc.css',

  // HTML/JS
  './html/js/activity.js',
  './html/js/admin.js',
  './html/js/auth.js',
  './html/js/boot.js',
  './html/js/dashboard.js',
  './html/js/pump.js',
  './html/js/toolbox.js',
  './html/js/uc.js',

  // ASSETS/CSS
  './assets/css/all.min.css',
  './assets/css/core-font.css',
  './assets/css/fredoka.css',
  './assets/css/jetbrain.css',
  './assets/css/nunito.css',
  './assets/css/orbitron.css',
  './assets/css/quicksand.css',
  './assets/css/rajdhani.css',
  './assets/css/roboto-mono.css',
  './assets/css/space-mono.css',
  './assets/css/splash-theme.css',
  './assets/css/teko.css',
  './assets/css/theme-engine.css',
  './assets/css/varela-round.css',

  // ASSETS/JS
  './assets/js/chart.js',
  './assets/js/jspdf.autotable.min.js',
  './assets/js/jspdf.umd.min.js',
  './assets/js/splash.js',
  './assets/js/supabase.js',
  './assets/js/tailwindcss.js',
  './assets/js/theme-engine.js',
  './assets/js/xlsx.full.min.js',
  './assets/js/pdf.min.js', 
  './assets/js/offline-manager.js',

  // ASSETS/WEBFONTS (AWAS TYPO)
  './assets/webfonts/fa-brands-400.woff2',
  './assets/webfonts/fa-regular-400.woff2',
  './assets/webfonts/fa-solid-900.woff2',
  './assets/webfonts/fa-v4compatibility.woff2',
  
  './assets/webfonts/fredoka-v17-latin-600.woff2',
  './assets/webfonts/fredoka-v17-latin-700.woff2',
  './assets/webfonts/fredoka-v17-latin-regular.woff2',
  
  './assets/webfonts/JetBrainsMono-Bold.woff2',
  './assets/webfonts/JetBrainsMono-Light.woff2',
  './assets/webfonts/JetBrainsMono-Medium.woff2',
  './assets/webfonts/JetBrainsMono-Regular.woff2',
  
  './assets/webfonts/nunito-v32-latin-300.woff2',
  './assets/webfonts/nunito-v32-latin-500.woff2',
  './assets/webfonts/nunito-v32-latin-600.woff2',
  './assets/webfonts/nunito-v32-latin-700.woff2',
  './assets/webfonts/nunito-v32-latin-regular.woff2',
  
  './assets/webfonts/orbitron-v35-latin-500.woff2',
  './assets/webfonts/orbitron-v35-latin-700.woff2',
  './assets/webfonts/orbitron-v35-latin-900.woff2',
  './assets/webfonts/orbitron-v35-latin-regular.woff2',
  
  './assets/webfonts/quicksand-v37-latin-500.woff2',
  './assets/webfonts/quicksand-v37-latin-700.woff2',
  './assets/webfonts/quicksand-v37-latin-regular.woff2',
  
  './assets/webfonts/Rajdhani-Light.woff2',
  './assets/webfonts/Rajdhani-Medium.woff2',
  './assets/webfonts/Rajdhani-Regular.woff2',
  './assets/webfonts/Rajdhani-Variable.woff2',
  
  './assets/webfonts/roboto-mono-v31-latin-300.woff2',
  './assets/webfonts/roboto-mono-v31-latin-600.woff2',
  './assets/webfonts/roboto-mono-v31-latin-700.woff2',
  './assets/webfonts/roboto-mono-v31-latin-regular.woff2',
  
  './assets/webfonts/space-mono-v17-latin-700.woff2',
  './assets/webfonts/space-mono-v17-latin-700italic.woff2',
  './assets/webfonts/space-mono-v17-latin-italic.woff2',
  './assets/webfonts/space-mono-v17-latin-regular.woff2',
  
  './assets/webfonts/teko-v23-latin-600.woff2',
  './assets/webfonts/teko-v23-latin-700.woff2',
  './assets/webfonts/teko-v23-latin-regular.woff2',
  
  './assets/webfonts/varela-round-v21-latin-regular.woff2'
];

// --- 1. INSTALL SERVICE WORKER ---
self.addEventListener('install', event => {
  self.skipWaiting(); // Langsung aktif tanpa nunggu tab ditutup
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// --- 2. ACTIVATE (BERSIHKAN CACHE LAMA) ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ambil alih kontrol halaman saat ini juga
});

// --- 3. FETCH (AMBIL DATA) ---
self.addEventListener('fetch', event => {
  
  // PENGECUALIAN MUTLAK: Biarkan koneksi Supabase & API eksternal lolos ke internet (JANGAN DI-CACHE!)
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('unpkg.com') || 
      event.request.url.includes('cloudflare')) {
    return;
  }

  // STRATEGI: Cache First, fallback ke Network (Sangat Cepat & Mendukung Offline)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ada di cache (memori HP), langsung berikan!
        if (response) {
          return response;
        }

        // Jika tidak ada di cache, terpaksa download dari internet
        return fetch(event.request).then(
          function(response) {
            // Cek apakah response valid (agar tidak menyimpan error 404 ke memori)
            if(!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
              return response;
            }

            // Simpan file baru ke dalam cache diam-diam
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
             // Fallback murni offline jika gagal fetch (opsional)
             console.log("Koneksi terputus total. File tidak ada di cache.");
        });
      })
    );
});
