const CONFIG = {
    SB_URL: "https://corpgiuxyhfxdnqwwmlv.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E"
};

const App = {
    sb: supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY),
    nik: localStorage.getItem('userNIK'),

    async init() {
        // 1. Suntik Tema Manekin
        const theme = localStorage.getItem('appTheme') || 'mint';
        const font = localStorage.getItem('appFont') || 'jelly';
        document.body.className = `tema-${theme}`;
        document.body.setAttribute('data-font', font);

        this.updateDate();
        
        try {
            const { data: user, error } = await this.sb.from('users').select('role, full_name').eq('nik', this.nik).single();
            if(error || user.role !== 'admin') throw new Error("Unauthorized");
            
            document.getElementById('adminName').innerText = user.full_name;
            
            this.loadDashboard();
            this.initChart();
            this.setupForm();
            
            this.executeCurtainDrop();
        } catch (err) {
            window.location.replace('login.html');
        }
    },

    executeCurtainDrop() {
        let tiraiTerbuka = false;
        const bukaTirai = () => {
            if(tiraiTerbuka) return; 
            tiraiTerbuka = true;
            const splash = document.getElementById('splash-screen');
            const appCtx = document.getElementById('app-context');
            if(splash) { splash.style.opacity = '0'; setTimeout(() => splash.style.display = 'none', 500); }
            if(appCtx) { appCtx.classList.remove('opacity-0'); }
        };

        document.fonts.ready.then(() => {
            requestAnimationFrame(() => { requestAnimationFrame(() => setTimeout(bukaTirai, 150)); });
        }).catch(bukaTirai);

        setTimeout(bukaTirai, 2000); 
        window.addEventListener('pageshow', (event) => { if (event.persisted) { tiraiTerbuka = false; bukaTirai(); } });
    },

    updateDate() {
        document.getElementById('currentDate').innerText = new Date().toLocaleDateString('id-ID', { 
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
        }).toUpperCase();
    },

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('mobile-overlay').classList.toggle('show');
    },

    switchTab(tabName) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('mobile-overlay').classList.remove('show');

        ['dashboard', 'users', 'reports-pump', 'reports-uc', 'audit'].forEach(t => {
            document.getElementById(`tab-${t}`).classList.add('hidden');
            document.getElementById(`nav-${t}`).classList.remove('active');
        });
        
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');
        document.getElementById(`nav-${tabName}`).classList.add('active');
        
        const titleMap = { 'dashboard': 'DASHBOARD', 'users': 'USERS', 'reports-pump': 'HYDRAULIC', 'reports-uc': 'INSPECTION', 'audit': 'AUDIT' };
        document.getElementById('pageTitle').innerText = titleMap[tabName];

        if(tabName === 'users') this.fetchUsers();
        if(tabName === 'reports-pump') this.fetchPumpReports();
        if(tabName === 'reports-uc') this.fetchUCReports();
        if(tabName === 'audit') this.fetchAuditLogs();
    },

    async loadDashboard() {
        const [users, pump, uc, logs] = await Promise.all([
            this.sb.from('users').select('*', { count: 'exact', head: true }),
            this.sb.from('pump_performance_reports').select('*', { count: 'exact', head: true }),
            this.sb.from('uc_reports').select('*', { count: 'exact', head: true }),
            this.sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        document.getElementById('stat-users').innerText = users.count || 0;
        document.getElementById('stat-pump').innerText = pump.count || 0;
        document.getElementById('stat-uc').innerText = uc.count || 0;

        const logContainer = document.getElementById('mini-audit-log');
        if (logs.data) {
            logContainer.innerHTML = logs.data.map(l => `
                <div class="flex items-center gap-3 p-3 bg-black/5 rounded-lg border border-black/5 mb-2">
                    <div class="w-1 h-8 rounded-full" style="background-color: var(--warna-aksen);"></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] font-black uppercase truncate warna-teks">${l.activity}</p>
                        <p class="text-[9px] font-bold opacity-50 warna-teks font-mono">${new Date(l.created_at).toLocaleTimeString()}</p>
                    </div>
                </div>
            `).join('');
        }
    },

    initChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        const isMecha = document.body.classList.contains('tema-mecha');
        const mainColor = isMecha ? '#f59e0b' : '#10b981';
        const bgColor = isMecha ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';

        new Chart(ctx, {
            type: 'line', 
            data: {
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{
                    label: 'Data',
                    data: [5, 12, 8, 15, 10, 4, 9],
                    borderColor: mainColor,
                    backgroundColor: bgColor,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } }
            }
        });
    },

    async fetchUsers() {
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4"><i class="fas fa-circle-notch fa-spin text-2xl warna-aksen"></i></td></tr>`;
        const { data } = await this.sb.from('users').select('*').order('created_at', { ascending: false });
        tbody.innerHTML = data.map(u => `
            <tr>
                <td class="font-bold opacity-70 font-mono">${u.nik}</td>
                <td class="font-black uppercase">${u.full_name}</td>
                <td><span class="px-2 py-1 bg-black/5 rounded text-[9px] uppercase font-black warna-teks">${u.role}</span></td>
                <td><div class="w-2 h-2 rounded-full ${u.status !== 'inactive' ? 'bg-emerald-500' : 'bg-red-500'} shadow"></div></td>
                <td class="text-right"><button onclick="App.deleteUser('${u.nik}')" class="text-red-500 hover:scale-110 transition-transform"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    },

    async fetchPumpReports() {
        const tbody = document.getElementById('pumpTableBody');
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4"><i class="fas fa-circle-notch fa-spin text-2xl warna-aksen"></i></td></tr>`;
        const { data } = await this.sb.from('pump_performance_reports').select('*').order('test_date', { ascending: false }).limit(30);
        tbody.innerHTML = data.map(r => `
            <tr>
                <td class="opacity-60 font-mono">${new Date(r.test_date).toLocaleDateString()}</td>
                <td class="font-black">${r.unit_model}</td>
                <td class="opacity-80 font-mono">${r.serial_number}</td>
                <td><span class="px-2 py-1 bg-black/5 rounded text-[9px] font-black warna-teks">${r.nik}</span></td>
                <td><i class="fas fa-check text-emerald-500"></i></td>
            </tr>
        `).join('');
    },

    async fetchUCReports() {
        const tbody = document.getElementById('ucTableBody');
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4"><i class="fas fa-circle-notch fa-spin text-2xl warna-aksen"></i></td></tr>`;
        const { data } = await this.sb.from('uc_reports').select('*').order('inspection_date', { ascending: false }).limit(30);
        tbody.innerHTML = data.map(r => `
            <tr>
                <td class="opacity-60 font-mono">${new Date(r.inspection_date).toLocaleDateString()}</td>
                <td class="font-black">${r.unit_no || r.serial_number}</td>
                <td><span class="px-2 py-1 bg-black/5 rounded text-[9px] font-black warna-teks">${r.nik}</span></td>
                <td class="uppercase">${r.unit_model}</td>
                <td><i class="fas fa-sync text-blue-500"></i></td>
            </tr>
        `).join('');
    },

    async fetchAuditLogs() {
        const tbody = document.getElementById('auditTableBody');
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4"><i class="fas fa-circle-notch fa-spin text-2xl warna-aksen"></i></td></tr>`;
        const { data } = await this.sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
        tbody.innerHTML = data.map(l => `
            <tr>
                <td class="opacity-60 font-mono">${new Date(l.created_at).toLocaleString()}</td>
                <td class="font-black warna-aksen">${l.nik}</td>
                <td class="font-bold uppercase">${l.activity}</td>
                <td class="opacity-60 truncate max-w-[150px] inline-block">${l.details || '-'}</td>
            </tr>
        `).join('');
    },

    setupForm() {
        document.getElementById('addUserForm').onsubmit = async (e) => {
            e.preventDefault();
            const nik = document.getElementById('newNik').value.toUpperCase();
            const full_name = document.getElementById('newName').value.toUpperCase();
            if(!nik || !full_name) return alert("Empty fields");
            
            const btn = e.target.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            const { error } = await this.sb.from('users').insert([{ nik, full_name, password: 'hexindo123', role: 'technician', status: 'active' }]);
            
            if(!error) {
                document.getElementById('modalUser').classList.add('hidden');
                document.getElementById('addUserForm').reset();
                this.fetchUsers();
                btn.innerHTML = 'CREATE';
            } else {
                alert(error.message);
                btn.innerHTML = 'CREATE';
            }
        };
    }
};

window.onload = () => App.init();
