/**
 * HEXINDO FLEET - OFFLINE MANAGER SYSTEM
 * Version: 2.1 (Auto-Path SW, Anti-Overlap UI & Smart Sync)
 */

class HexindoOfflineManager {
    constructor() {
        this.dbName = 'HexindoFleetDB';
        this.dbVersion = 2; 
        this.storeUploads = 'pending_uploads';
        this.storeManuals = 'cached_manuals';

        // 1. Inisialisasi Database Supabase Mandiri
        if (typeof CONFIG !== 'undefined' && typeof supabase !== 'undefined') {
            this.sbClient = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY);
        } else {
            console.warn("[Hexindo Offline] Supabase SDK belum siap. Sync tertunda.");
        }

        this.initDB();
        this.initUI();
        this.registerSW();

        // 2. Pantau Perubahan Sinyal (Real-time)
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
    }

    // ============================================================
    // 1. DATABASE LOGIC (INDEXED DB)
    // ============================================================

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                // Brankas Laporan (Form Data)
                if (!db.objectStoreNames.contains(this.storeUploads)) {
                    db.createObjectStore(this.storeUploads, { keyPath: 'id', autoIncrement: true });
                }

                // Brankas Manual (PDF Cache)
                if (!db.objectStoreNames.contains(this.storeManuals)) {
                    db.createObjectStore(this.storeManuals, { keyPath: 'url' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => {
                console.error("Database Error:", e);
                reject(e);
            };
        });
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, this.dbVersion);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    // ============================================================
    // 2. FORM SYNC LOGIC (Kirim Laporan)
    // ============================================================

    async submitData(tableName, payload) {
        if (navigator.onLine && this.sbClient) {
            try {
                this.showToast('Mengirim ke Server...', 'info');
                
                const { error } = await this.sbClient
                    .from(tableName)
                    .insert([payload]);

                if (error) throw error;

                this.showToast('Data Berhasil Disimpan (Cloud)', 'success');
                return true;

            } catch (error) {
                console.warn("Gagal kirim ke server, beralih ke brankas offline...", error);
                await this.saveToOutbox(tableName, payload);
                return false;
            }
        } else {
            // Langsung simpan ke HP jika tidak ada sinyal
            await this.saveToOutbox(tableName, payload);
            return false;
        }
    }

    async saveToOutbox(tableName, payload) {
        const db = await this.openDB();
        const tx = db.transaction(this.storeUploads, 'readwrite');
        
        await tx.objectStore(this.storeUploads).add({
            table: tableName,
            payload: payload,
            timestamp: new Date().toISOString()
        });

        this.showToast('Offline: Data Disimpan Sementara di HP', 'warning');
    }

    async syncData() {
        if (!this.sbClient) return;

        const db = await this.openDB();
        const tx = db.transaction(this.storeUploads, 'readonly');
        const store = tx.objectStore(this.storeUploads);
        const request = store.getAll();

        request.onsuccess = async () => {
            const items = request.result;
            if (items.length === 0) return; // Brankas kosong

            this.showToast(`Memulai Sinkronisasi ${items.length} Data...`, 'info');
            let successCount = 0;

            for (const item of items) {
                try {
                    const { error } = await this.sbClient
                        .from(item.table)
                        .insert([item.payload]);

                    if (!error) {
                        // Hapus data dari brankas HP setelah sukses masuk ke Cloud
                        const delTx = db.transaction(this.storeUploads, 'readwrite');
                        delTx.objectStore(this.storeUploads).delete(item.id);
                        successCount++;
                    } else {
                        console.error('Error Sync Supabase:', error);
                    }
                } catch (err) {
                    console.error('Gagal sync item:', item.id, err);
                }
            }
            
            if (successCount > 0) {
                this.showToast(`${successCount} Data Sukses Terkirim ke Cloud!`, 'success');
            }
        };
    }

    // ============================================================
    // 3. PDF CACHE LOGIC (Smart Troubleshoot)
    // ============================================================

    async getOrDownloadManual(fileUrl, progressCallback) {
        const db = await this.openDB();
        
        const tx = db.transaction(this.storeManuals, 'readonly');
        const store = tx.objectStore(this.storeManuals);
        
        const cachedItem = await new Promise(resolve => {
            const req = store.get(fileUrl);
            req.onsuccess = () => resolve(req.result);
        });

        // 1. Ditemukan di brankas HP
        if (cachedItem) {
            console.log("[Offline Cache] PDF diambil dari memori internal");
            if (progressCallback) progressCallback("Membaca dari Memori Internal...");
            return cachedItem.blob;
        }

        // 2. Harus Download Baru
        if (!navigator.onLine) {
            throw new Error("Anda sedang offline dan manual ini belum tersedia di cache HP Anda.");
        }

        console.log("[Network] Mengunduh PDF baru...");
        if (progressCallback) progressCallback("Mengunduh Manual (Proses Hemat Kuota)...");

        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Gagal mengunduh file dari server.");
        
        const blob = await response.blob();

        // 3. Simpan ke brankas HP untuk buka selanjutnya
        const txSave = db.transaction(this.storeManuals, 'readwrite');
        txSave.objectStore(this.storeManuals).put({
            url: fileUrl,
            blob: blob,
            downloaded_at: new Date().toISOString()
        });

        return blob;
    }

    async clearManualCache() {
        const db = await this.openDB();
        const tx = db.transaction(this.storeManuals, 'readwrite');
        tx.objectStore(this.storeManuals).clear();
        this.showToast('Memori Cache Manual berhasil dibersihkan.', 'success');
    }

    // ============================================================
    // 4. UI & UTILITIES
    // ============================================================

    registerSW() {
        if ('serviceWorker' in navigator) {
            // Otomatis mencari sw.js terlepas dari posisi folder file HTML
            let swPath = './sw.js'; 
            if (window.location.pathname.includes('/html/')) {
                swPath = '../sw.js';
            }

            navigator.serviceWorker.register(swPath)
                .then(reg => console.log('✅ [Service Worker] Aktif pada scope:', reg.scope))
                .catch(err => console.error('❌ [Service Worker] Gagal didaftarkan:', err));
        }
    }

    initUI() {
        // Hapus elemen lama agar tidak bertumpuk jika dipanggil ulang
        const oldBadge = document.getElementById('hexindo-status-badge');
        if (oldBadge) oldBadge.remove();
        const oldToast = document.getElementById('hexindo-toast');
        if (oldToast) oldToast.remove();

        // 1. Buat Status Badge (Dipatenkan di Kiri Bawah agar aman dari Floating Button)
        const badge = document.createElement('div');
        badge.id = 'hexindo-status-badge';
        const isOnline = navigator.onLine;
        
        badge.className = isOnline 
            ? 'fixed bottom-6 left-6 px-4 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-lg z-[99999] transition-all'
            : 'fixed bottom-6 left-6 px-4 py-1.5 rounded-xl border border-red-500/30 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest shadow-lg z-[99999] transition-all';
        
        badge.innerHTML = isOnline ? '<i class="fas fa-wifi mr-1"></i> ONLINE' : '<i class="fas fa-plane mr-1"></i> OFFLINE';
        document.body.appendChild(badge);

        // 2. Buat Toast Container (Di tengah atas agar terbaca jelas)
        const toast = document.createElement('div');
        toast.id = 'hexindo-toast';
        toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-xl border backdrop-blur-xl text-xs font-black tracking-wide uppercase transition-all duration-300 opacity-0 -translate-y-10 z-[99999] shadow-2xl pointer-events-none text-center min-w-[280px]';
        document.body.appendChild(toast);
    }

    handleConnectionChange(isOnline) {
        const badge = document.getElementById('hexindo-status-badge');
        if(!badge) return;

        if (isOnline) {
            badge.className = 'fixed bottom-6 left-6 px-4 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-lg z-[99999] transition-all';
            badge.innerHTML = '<i class="fas fa-wifi mr-1"></i> ONLINE';
            this.syncData(); 
        } else {
            badge.className = 'fixed bottom-6 left-6 px-4 py-1.5 rounded-xl border border-red-500/30 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest shadow-lg z-[99999] transition-all';
            badge.innerHTML = '<i class="fas fa-plane mr-1"></i> OFFLINE';
            this.showToast('Koneksi Hilang. Anda masuk ke Mode Offline.', 'warning');
        }
    }

    showToast(msg, type = 'info') {
        const toast = document.getElementById('hexindo-toast');
        if(!toast) return;

        const styles = {
            success: 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_10px_25px_rgba(16,185,129,0.3)]',
            warning: 'border-amber-500 bg-amber-50 text-amber-700 shadow-[0_10px_25px_rgba(245,158,11,0.3)]',
            info: 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-[0_10px_25px_rgba(6,182,212,0.3)]'
        };
        
        toast.className = `fixed top-6 md:top-10 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-xl border-2 backdrop-blur-xl text-[11px] font-black tracking-wider uppercase transition-all duration-300 z-[99999] pointer-events-none text-center min-w-[250px] ${styles[type]} opacity-100 translate-y-0`;
        toast.innerHTML = msg;

        // Auto hide
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', '-translate-y-10');
        }, 3500);
    }
}

// Inisialisasi Global untuk mempermudah akses fungsi dari HTML
window.HexindoFleet = new HexindoOfflineManager();
