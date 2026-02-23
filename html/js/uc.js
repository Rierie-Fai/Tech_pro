// --- CONFIGURATION ---
const CONFIG = {
    SB_URL: "https://corpgiuxyhfxdnqwwmlv.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E"
};
const sb = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY);
const MY_NIK = localStorage.getItem('userNIK') || 'UNKNOWN';

// --- ITEMS DEFINITION (Standard Hitachi EX3600/2500 approx) ---
const itemsRaw = [
    { name: "Track Shoe Tooth Length", std: 0, limit: 35 },
    { name: "Track Shoe Tread", std: 21.5, limit: 31.5 },
    { name: "Track Shoe Grouser Height", std: 30, limit: 0 },
    { name: "Track Shoe Pitch", std: 1491, limit: 1530 },
    { name: "Front Idler Tread Dia.", std: 203, limit: 188 },
    { name: "Drive Tumbler Tread Dia.", std: 144, limit: 129 },
    { name: "Upper Roller 1 Dia.", std: 380, limit: 350 },
    { name: "Upper Roller 2 Dia.", std: 380, limit: 350 },
    { name: "Upper Roller 3 Dia.", std: 380, limit: 350 },
    { name: "Lower Roller 1 Dia.", std: 490, limit: 460 },
    { name: "Lower Roller 2 Dia.", std: 490, limit: 460 },
    { name: "Lower Roller 3 Dia.", std: 490, limit: 460 },
    { name: "Lower Roller 4 Dia.", std: 490, limit: 460 },
    { name: "Lower Roller 5 Dia.", std: 490, limit: 460 },
    { name: "Lower Roller 6 Dia.", std: 490, limit: 460 },
    { name: "Lower Roller 7 Dia.", std: 490, limit: 460 },
    { name: "Lower Roller 8 Dia.", std: 490, limit: 460 }
];

// --- APP LOGIC ---
const App = {
    async init() {
        // 1. SUNTIK TEMA & FONT MANEKIN
        const theme = localStorage.getItem('appTheme') || 'mint';
        const font = localStorage.getItem('appFont') || 'jelly';
        document.body.className = `tema-${theme}`;
        document.body.setAttribute('data-font', font);

        this.runAutoScale();
        window.addEventListener('resize', () => this.runAutoScale());

        document.getElementById('inspDate').valueAsDate = new Date();
        this.renderTable();
        await this.syncProfile();

        // 2. JALANKAN SENSOR TIRAI ANTI-FOUC
        this.executeCurtainDrop();
    },

    executeCurtainDrop() {
        let tiraiTerbuka = false;
        const bukaTirai = () => {
            if(tiraiTerbuka) return; 
            tiraiTerbuka = true;
            const splash = document.getElementById('splash-screen');
            const scaler = document.getElementById('scaler-context');
            if(splash) { splash.style.opacity = '0'; setTimeout(() => splash.style.display = 'none', 500); }
            if(scaler) { scaler.classList.remove('opacity-0'); scaler.style.opacity = '1'; }
        };

        document.fonts.ready.then(() => {
            requestAnimationFrame(() => { requestAnimationFrame(() => setTimeout(bukaTirai, 150)); });
        }).catch(bukaTirai);

        setTimeout(bukaTirai, 2000); 
        window.addEventListener('pageshow', (event) => { if (event.persisted) { tiraiTerbuka = false; bukaTirai(); } });
    },

    runAutoScale() {
        const s = document.getElementById('scaler-context');
        if(!s) return;
        const w = document.documentElement.clientWidth;
        if (w < 720) {
            const r = w / 720;
            s.style.transform = 'none'; 
            s.style.zoom = r;           
            s.style.margin = '0';       
        } else {
            s.style.transform = 'none';
            s.style.zoom = 1;
            s.style.margin = '0 auto';  
        }
    },

    async syncProfile() {
        try {
            const { data: user } = await sb.from('users').select('full_name').eq('nik', MY_NIK).single();
            if(user) {
                document.getElementById('techName').value = user.full_name.toUpperCase();
                document.getElementById('techNik').value = MY_NIK;
                document.getElementById('roleText').innerText = `NIK: ${MY_NIK} | AUTHENTICATED`;
            } else {
                document.getElementById('techNik').value = MY_NIK;
                document.getElementById('techName').value = localStorage.getItem('userName') || "GUEST";
            }
        } catch(e) { console.error(e); }
    },

    // PERBAIKAN: Input form dibuat w-full agar tidak tergencet
    renderTable() {
        document.getElementById('inspectionBody').innerHTML = itemsRaw.map((item, i) => `
            <tr class="hover:bg-black/5 transition-colors">
                <td class="font-bold warna-teks text-[11px] pl-4 py-3 text-left">${item.name}</td>
                <td class="text-center warna-aksen font-mono text-xs font-bold">${item.std}</td>
                <td class="text-center font-mono text-xs font-bold">${item.limit}</td>
                <td class="p-1"><input type="number" step="0.1" class="input-utama w-full !p-2 text-center font-mono font-bold" id="l_${i}" oninput="App.calc(${i}, 'l')"></td>
                <td class="p-1"><input type="number" step="0.1" class="input-utama w-full !p-2 text-center font-mono font-bold" id="r_${i}" oninput="App.calc(${i}, 'r')"></td>
                <td id="wl_${i}" class="worn-output">-</td><td id="wr_${i}" class="worn-output">-</td>
            </tr>`).join('');
    },

    calc(idx, side) {
        const val = parseFloat(document.getElementById(`${side}_${idx}`).value);
        const target = document.getElementById(`w${side}_${idx}`);
        const item = itemsRaw[idx];
        
        if(isNaN(val)) {
            target.innerText = "-";
            target.className = "worn-output";
            return;
        }
        
        // Logic: Jika Std > Limit vs Std < Limit
        let worn = (item.std > item.limit) 
            ? ((item.std - val) / (item.std - item.limit)) * 100 
            : ((val - item.std) / (item.limit - item.std)) * 100;
        
        let res = Math.max(0, Math.round(worn));
        target.innerText = res + "%";
        
        target.className = "worn-output " + (res >= 100 ? "worn-danger" : res >= 75 ? "worn-warning" : "worn-safe");
    },

    async syncToCloud() {
        const btn = document.getElementById('btnSync');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span><i class="fas fa-circle-notch fa-spin mr-2"></i>PROCESSING...</span>`;
        btn.disabled = true;
        
        const unit = document.getElementById('unitSN').value.toUpperCase();
        if(!unit) { 
            alert("Please input Unit Serial Number"); 
            btn.innerHTML = originalText; 
            btn.disabled = false; 
            return; 
        }

        const payload = {
            nik: MY_NIK,
            unit_no: unit,
            inspection_date: document.getElementById('inspDate').value,
            report_data: {
                measurements: itemsRaw.map((_, i) => ({ 
                    lh: document.getElementById(`l_${i}`) ? document.getElementById(`l_${i}`).value : '', 
                    rh: document.getElementById(`r_${i}`) ? document.getElementById(`r_${i}`).value : '' 
                })),
                comments: document.getElementById('commentInp').value
            }
        };
        
        try {
            if(window.HexindoFleet) {
                const isSuccess = await window.HexindoFleet.submitData('uc_reports', payload);
                window.HexindoFleet.submitData('activity_logs', { nik: MY_NIK, activity: "UC Inspection Report", details: `Unit: ${unit}` });
                if (isSuccess) alert("✅ REPORT SUBMITTED TO SERVER!"); 
                else alert("⚠️ OFFLINE MODE: Report saved to device. Will sync automatically when signal returns.");
            } else {
                 const { error } = await sb.from('uc_reports').insert([payload]);
                 if(error) throw error;
                 alert("✅ REPORT SAVED!");
            }

            // Bersihkan form
            document.querySelectorAll('input[type="number"]').forEach(i => i.value = '');
            document.querySelectorAll('.worn-output').forEach(s => { s.innerText = '-'; s.className = 'worn-output'; });
            document.getElementById('unitSN').value = '';
            document.getElementById('commentInp').value = '';
            
            if(document.getElementById('rightDrawer').classList.contains('open')) App.fetchHistory();

        } catch (err) {
            alert("System Error: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async fetchHistory() {
        const container = document.getElementById('historyBody');
        container.innerHTML = '<div class="text-center py-10 opacity-50 text-[10px] font-bold uppercase tracking-widest warna-teks"><i class="fas fa-circle-notch fa-spin mr-2"></i>Loading Archives...</div>';
        
        const { data } = await sb.from('uc_reports').select('*').eq('nik', MY_NIK).order('id', {ascending:false}).limit(15);
        
        container.innerHTML = (data || []).map(row => `
            <div class="panel-utama p-4 m-0 flex flex-col gap-2 hover:border-black/30 transition-all group">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="warna-teks font-black text-sm uppercase" style="font-family: var(--font-judul);">${row.unit_no}</div>
                        <div class="text-[10px] opacity-60 warna-teks font-mono mt-1"><i class="fas fa-clock mr-1"></i>${new Date(row.inspection_date).toLocaleDateString()}</div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick='App.loadEdit(${JSON.stringify(row)})' class="h-8 w-8 bg-black/5 warna-teks rounded-lg font-bold hover:bg-black/10 transition-all"><i class="fas fa-download"></i></button>
                        <button onclick="App.delReport(${row.id})" class="h-8 w-8 bg-red-50 text-red-500 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>`).join('') || '<p class="opacity-50 text-center py-10 font-bold text-[10px] warna-teks">NO REPORTS FOUND</p>';
    },

    loadEdit(row) {
        document.getElementById('unitSN').value = row.unit_no;
        document.getElementById('commentInp').value = row.report_data.comments || "";
        document.getElementById('inspDate').value = row.inspection_date;
        
        row.report_data.measurements.forEach((m, i) => {
            if(i < itemsRaw.length) {
                if(document.getElementById(`l_${i}`)) { document.getElementById(`l_${i}`).value = m.lh; this.calc(i, 'l'); }
                if(document.getElementById(`r_${i}`)) { document.getElementById(`r_${i}`).value = m.rh; this.calc(i, 'r'); }
            }
        });
        window.toggleDrawer(); window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    async delReport(id) {
        if(confirm("PERMANENTLY DELETE THIS REPORT?")) { 
            await sb.from('uc_reports').delete().eq('id', id); 
            await sb.from('activity_logs').insert([{ nik: MY_NIK, activity: "Deleted Report", details: `ID: ${id}` }]);
            this.fetchHistory(); 
        }
    }
};

// --- GLOBAL EXPORTS ---
window.App = App;
window.toggleDrawer = () => {
    const drw = document.getElementById('rightDrawer');
    const ovl = document.getElementById('drawerOverlay');
    if(drw.classList.contains('open')) {
        drw.classList.remove('open'); ovl.classList.remove('visible');
    } else {
        drw.classList.add('open'); ovl.classList.add('visible');
        App.fetchHistory();
    }
};
window.syncToCloud = () => App.syncToCloud();

window.onload = () => App.init();
