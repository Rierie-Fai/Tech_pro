const CONFIG = {
    SB_URL: "https://corpgiuxyhfxdnqwwmlv.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E"
};

const App = {
    isRegisterMode: false,
    sb: null,

    init() {
        // 1. Terapkan Tema Terakhir
        const savedTheme = localStorage.getItem('appTheme') || 'mint';
        const bodyEl = document.getElementById('body-tema');
        if(bodyEl) bodyEl.className = `tema-${savedTheme}`;

        // 2. Proteksi Cegah Crash Supabase
        if (typeof supabase === 'undefined') {
            console.error("Supabase SDK gagal dimuat. Cek koneksi internet.");
            this.showStatus("NETWORK ERROR: SUPABASE MISSING", "error");
            return; // Hentikan inisialisasi agar tidak crash
        }
        
        this.sb = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY);
        document.getElementById('authForm').onsubmit = (e) => this.handleAuth(e);
    },

    toggleMode() {
        this.isRegisterMode = !this.isRegisterMode;
        const nameWrapper = document.getElementById('nameWrapper');
        const nameInput = document.getElementById('nameInput');
        const btnText = document.getElementById('btnText');
        const switchText = document.getElementById('switchText');
        const subTitle = document.getElementById('subTitle');
        const mainIcon = document.getElementById('mainIcon');

        if (this.isRegisterMode) {
            nameWrapper.classList.add('open');
            nameInput.required = true;
            btnText.innerText = "CREATE ACCOUNT";
            switchText.innerHTML = "Already have NIK? <span>Login</span>";
            subTitle.innerText = "IDENTITY REGISTRATION";
            mainIcon.className = "fas fa-user-plus";
        } else {
            nameWrapper.classList.remove('open');
            nameInput.required = false;
            btnText.innerText = "BOOT SYSTEM";
            switchText.innerHTML = "New Personnel? <span>Register NIK</span>";
            subTitle.innerText = "SECURE TERMINAL ACCESS";
            mainIcon.className = "fas fa-shield-halved";
        }
    },

    showStatus(msg, type='error') {
        const el = document.getElementById('statusMsg');
        el.innerText = msg;
        el.className = `msg-status msg-${type}`;
        if(type === 'error') {
            const card = document.getElementById('loginCard');
            card.style.transform = "translateX(10px)";
            setTimeout(() => card.style.transform = "translateX(0)", 100);
        }
    },

    async handleAuth(e) {
        e.preventDefault();
        if(!this.sb) {
            this.showStatus("DATABASE DISCONNECTED", "error");
            return;
        }

        const btn = document.getElementById('btnSubmit');
        const nik = document.getElementById('nikInput').value.toUpperCase().trim();
        const pass = document.getElementById('passInput').value.trim();
        
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> PROCESSING`;

        try {
            if (this.isRegisterMode) {
                const name = document.getElementById('nameInput').value.toUpperCase().trim();
                
                const { data: cek } = await this.sb.from('users').select('nik').eq('nik', nik).single();
                if (cek) throw new Error("NIK SUDAH TERDAFTAR");

                const { error } = await this.sb.from('users').insert([{
                    nik: nik, full_name: name, password: pass, status: 'pending'
                }]);
                if (error) throw error;

                this.showStatus("REGISTRASI BERHASIL, TUNGGU APPROVAL", "success");
                setTimeout(() => this.toggleMode(), 2000);

            } else {
                const { data, error } = await this.sb.from('users').select('*').eq('nik', nik).single();

                if (error || !data) throw new Error("NIK TIDAK DITEMUKAN");
                if (data.password !== pass) throw new Error("PASSWORD SALAH");
                
                if (data.status === 'pending') throw new Error("MENUNGGU PERSETUJUAN ADMIN");
                if (data.status === 'suspend') throw new Error("AKSES DITOLAK: AKUN DITANGGUHKAN");

                this.showStatus("ACCESS GRANTED", "success");
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userNIK', data.nik);
                localStorage.setItem('userName', data.full_name);
                
                setTimeout(() => window.location.replace('dashboard.html'), 1000);
            }
        } catch (err) {
            this.showStatus(err.message.toUpperCase(), "error");
            btn.disabled = false;
            btn.innerHTML = `<span>${this.isRegisterMode ? 'CREATE ACCOUNT' : 'BOOT SYSTEM'}</span> <i class="fas fa-bolt-lightning"></i>`;
        }
    }
};

window.onload = () => App.init();
