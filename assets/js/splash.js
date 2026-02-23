/* =========================================
   HEXINDO GLOBAL SPLASH SCREEN & ANTI-FOUC MODULE
   ========================================= */
(function() {
    const theme = localStorage.getItem('appTheme') || 'mint';
    
    // 1. Suntikkan CSS Animasi Splash Screen
    const style = document.createElement('style');
    style.innerHTML = `
        #hexindo-global-splash {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            transition: opacity 0.5s ease, visibility 0.5s ease;
        }
        #hexindo-global-splash.tema-mecha { background-color: #ffffff; }
        .splash-loader-mecha { width: 50px; height: 50px; border: 2px solid #e2e8f0; border-top: 2px solid #0ea5e9; border-right: 2px solid #0ea5e9; animation: spin-mecha-sharp 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; margin-bottom: 30px; position: relative; }
        .splash-loader-mecha::after { content: ''; position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; background-color: #0ea5e9; animation: pulse-core 1.5s infinite alternate; }
        .splash-text-mecha { font-family: 'JetBrains Mono', monospace; color: #0ea5e9; font-size: 14px; letter-spacing: 2px; font-weight: 800; text-transform: uppercase; animation: pulse-text 2s infinite; }
        
        #hexindo-global-splash.tema-mint { background-color: #ecfdf5; }
        .splash-loader-mint { width: 60px; height: 60px; background-color: #34d399; border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; animation: morph-jelly-splash 3s ease-in-out infinite alternate; box-shadow: 0 15px 25px rgba(16, 185, 129, 0.3), inset 0 8px 15px rgba(255,255,255,0.8); margin-bottom: 30px; }
        .splash-text-mint { font-family: 'Rajdhani', sans-serif; color: #047857; font-size: 16px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }

        @keyframes spin-mecha-sharp { 0% { transform: rotate(0deg); } 25% { transform: rotate(90deg); } 50% { transform: rotate(180deg); } 75% { transform: rotate(270deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse-core { 0% { opacity: 0.2; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.2); } }
        @keyframes morph-jelly-splash { 0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: scale(1) translateY(0); } 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1.15) translateY(-15px); } }
        @keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    `;
    document.documentElement.appendChild(style);
    
    // 2. Suntikkan HTML Splash
    const splash = document.createElement('div');
    splash.id = 'hexindo-global-splash';
    splash.className = `tema-${theme}`;
    const loader = document.createElement('div');
    loader.className = theme === 'mecha' ? 'splash-loader-mecha' : 'splash-loader-mint';
    const text = document.createElement('div');
    text.className = theme === 'mecha' ? 'splash-text-mecha' : 'splash-text-mint';
    text.innerText = theme === 'mecha' ? 'INITIALIZING...' : 'MENYIAPKAN WORKSPACE . . .';
    splash.appendChild(loader);
    splash.appendChild(text);
    document.documentElement.appendChild(splash);
    
    // 3. Logika Buka Tirai yang Sangat Agresif
    let isRevealed = false;
    window.hideSplashScreen = function() {
        if (isRevealed) return;
        isRevealed = true;
        
        const s = document.getElementById('hexindo-global-splash');
        if (s) {
            s.style.opacity = '0';
            s.style.visibility = 'hidden';
            setTimeout(() => s.remove(), 600);
        }
        
        // Hancurkan semua jenis tameng yang ada di halaman
        const tamengs = document.querySelectorAll('.tameng-besi, .opacity-0, .sembunyi, .lapis-depan');
        tamengs.forEach(el => {
            el.classList.remove('tameng-besi', 'opacity-0', 'sembunyi');
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.pointerEvents = 'auto';
            el.style.transform = 'scale(1)';
        });
    };
    
    // 4. EKSEKUSI: Buka tirai 400ms setelah DOM selesai dibaca (waktu ideal untuk Tailwind menggambar)
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(window.hideSplashScreen, 400);
    });
    
    // 5. FAILSAFE MUTLAK: Jika halaman hang, buka paksa dalam 2 detik
    setTimeout(window.hideSplashScreen, 2000);
    
    // Proteksi saat user klik tombol Back
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            isRevealed = false;
            window.hideSplashScreen();
        }
    });
})();