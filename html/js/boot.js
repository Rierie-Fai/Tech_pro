/* =========================================
   BOOTLOADER ENGINE
   ========================================= */

const Bootloader = {
    init() {
        // 1. Ambil Identitas dari LocalStorage
        const theme = localStorage.getItem('appTheme') || 'mint';
        const font = localStorage.getItem('appFont') || 'jelly';
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        // 2. Terapkan Identitas ke Body
        const bodyEl = document.getElementById('boot-body');
        const msgEl = document.getElementById('loading-msg');

        bodyEl.className = `tema-${theme}`;
        bodyEl.setAttribute('data-font', font);

        // 3. Ubah Teks Sesuai Karakteristik Tema
        if (theme === 'mecha') {
            msgEl.innerText = 'SYSTEM INITIALIZATION...';
        } else {
            msgEl.innerText = 'Menyiapkan ruang kerjamu . . .';
        }

        // 4. Mulai Simulasi Waktu Tunggu
        this.executeRouting(isLoggedIn);
    },

    executeRouting(isLoggedIn) {
        // Biarkan animasi berputar memanjakan mata selama 2.5 detik
        setTimeout(() => {
            // Efek memudar perlahan yang elegan
            document.body.classList.add('fade-out');

            // Setelah layar gelap, pindah halaman
            setTimeout(() => {
                if (isLoggedIn) {
                    window.location.replace('dashboard.html');
                } else {
                    window.location.replace('login.html');
                }
            }, 500); 
        }, 2500);
    }
};

window.addEventListener('DOMContentLoaded', () => Bootloader.init());
