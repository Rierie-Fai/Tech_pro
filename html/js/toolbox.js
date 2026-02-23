const CONFIG = {
    SB_URL: "https://corpgiuxyhfxdnqwwmlv.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E"
};
const sbClient = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY);

const listAlat = [
    "Adjustable wrench L=12\"", "Adjustable wrench pipe L=10\"", "Allen key 12mm", "Allen key 14mm", 
    "Allen key 17mm", "Allen key set 2-10mm", "Brush steel W=30mm", "Catridge belt wrench 125mm", 
    "Chisel plate W=11 L=140mm", "Combination wrench 24mm", "Combination wrench 27mm", 
    "Combination wrench 30mm", "Combination wrench 32mm", "Combination wrench 36mm", 
    "Combination wrench 41mm", "Extention socket 1/2\" L=10\"", "Extention socket 1/2\" L=5\"", 
    "Extention socket 3/4\" L=18\"", "Extention socket 3/4\" L=8\"", "Extention socket 1/2\" U-joint", 
    "Feeler gauge set", "Files set (5 pcs) 150mm", "Files plate type 250mm", "Files round type 250mm", 
    "Haksaw iron & blade", "Half moon wrench 14x17", "Half moon wrench 19x22", "Hammer besi 0.5kg", 
    "Hammer karet 0.5kg", "Hammer plastik 0.5kg", "Handle socket T 1/2\"", "Handle socket T 3/4\"", 
    "Handle rachet 1/2\"", "Handle rachet 3/4\"", "Magnetic stick L=50cm", "Multitester CD 800", 
    "Open end 6x7", "Open end 8x9", "Open end 10x11", "Open end 12x13", "Open end 14x15", 
    "Open end 16x17", "Open end 18x19", "Open end 20x22", "Open end 24x26", "Open end 36x41", 
    "Paint brush", "Pliers combination 200mm", "Pliers side cutting 200mm", "Pliers water pump", 
    "Pliers viece grip", "Pliers snap ring (in)", "Pliers snap ring (out)", "Pry bar L=40cm", 
    "Punch drift 150mm", "Punch center 130mm", "Ring spanner 6x7", "Ring spanner 8x9", 
    "Ring spanner 10x11", "Ring spanner 12x13", "Ring spanner 14x15", "Ring spanner 16x17", 
    "Ring spanner 18x19", "Ring spanner 20x22", "Ring spanner 24x26", "Scale meter roll 2.5m", 
    "Scrape blade W=25mm", "Screw drive plus 75mm", "Screw drive plus 100mm", "Screw drive plus 125mm", 
    "Screw drive plus 150mm", "Screw drive plate 75mm", "Screw drive plate 100mm", "Screw drive plate 150mm", 
    "Screw drive plate 200mm", "Socket (12) 1/2\" 10mm", "Socket (12) 1/2\" 11mm", "Socket (12) 1/2\" 12mm", 
    "Socket (12) 1/2\" 13mm", "Socket (12) 1/2\" 14mm", "Socket (12) 1/2\" 15mm", "Socket (12) 1/2\" 16mm", 
    "Socket (12) 1/2\" 17mm", "Socket (12) 1/2\" 18mm", "Socket (12) 1/2\" 19mm", "Socket (12) 1/2\" 20mm", 
    "Socket (12) 1/2\" 21mm", "Socket (12) 1/2\" 22mm", "Socket (12) 3/4\" 22mm", "Socket (12) 3/4\" 23mm", 
    "Socket (12) 3/4\" 24mm", "Socket (12) 3/4\" 27mm", "Socket (12) 3/4\" 28mm", "Socket (12) 3/4\" 29mm", 
    "Socket (12) 3/4\" 30mm", "Socket (12) 3/4\" 32mm", "Socket (12) 3/4\" 36mm", "Socket (12) 3/4\" 38mm", 
    "Socket (12) 3/4\" 41mm", "Socket (12) 3/4\" 46mm", "Stop watch digital", "Thermometer 0-200C", 
    "Treeds gauge set", "Tools box 3 step", "Test pen DC", "Vernier caliper 150mm"
];

const userNik = localStorage.getItem('userNIK') || 'UNKNOWN';
const userNameCache = localStorage.getItem('userName') || 'TECHNICIAN';

const App = {
    async init() {
        // 1. SUNTIK TEMA & FONT MANEKIN
        const theme = localStorage.getItem('appTheme') || 'mint';
        const font = localStorage.getItem('appFont') || 'jelly';
        document.body.className = `tema-${theme}`;
        document.body.setAttribute('data-font', font);

        this.runAutoScale();
        window.addEventListener('resize', () => this.runAutoScale());
        
        // Render Tabel Alat
        this.initTable();
        
        document.getElementById('asset').value = userNik;
        document.getElementById('pic').value = userNameCache.toUpperCase();
        document.getElementById('tgl').valueAsDate = new Date();
        updateMonthBadge();
        
        await this.syncUserData();
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

    async syncUserData() {
        try {
            const { data } = await sbClient.from('users').select('full_name').eq('nik', userNik).single();
            if (data) {
                document.getElementById('pic').value = data.full_name.toUpperCase();
                document.getElementById('roleText').innerText = `NIK: ${userNik} | ${data.full_name}`;
            }
        } catch (e) { console.error(e); }
    },

    initTable() {
        document.getElementById('toolTableBody').innerHTML = listAlat.map((name, i) => `
            <tr id="row-${i+1}" class="border-b border-black/5 hover:bg-black/5 transition-colors">
                <td class="text-center font-mono text-[10px] font-bold opacity-50 warna-teks py-3">${i + 1}</td>
                <td class="pl-4 pr-2 font-medium warna-teks py-3 text-sm">${name}</td>
                <td class="text-center"><input type="radio" name="t-${i+1}" value="B" onclick="App.updateRowStyle(${i+1}, 'B')"></td>
                <td class="text-center"><input type="radio" name="t-${i+1}" value="R" onclick="App.updateRowStyle(${i+1}, 'R')"></td>
                <td class="text-center"><input type="radio" name="t-${i+1}" value="H" onclick="App.updateRowStyle(${i+1}, 'H')"></td>
            </tr>`).join('');
    },

    updateRowStyle(idx, status) {
        const tr = document.getElementById(`row-${idx}`);
        tr.classList.remove('row-baik', 'row-rusak', 'row-hilang');
        if (status) tr.classList.add(`row-${status === 'B' ? 'baik' : status === 'R' ? 'rusak' : 'hilang'}`);
        this.refreshSummary();
    },

    refreshSummary() {
        let b=0, r=0, h=0;
        listAlat.forEach((_, i) => {
            const v = document.querySelector(`input[name="t-${i+1}"]:checked`)?.value;
            if(v === 'B') b++; else if(v === 'R') r++; else if(v === 'H') h++;
        });
        document.getElementById('countB').innerText = b;
        document.getElementById('countR').innerText = r;
        document.getElementById('countH').innerText = h;
    }
};

// Global Exposure agar onclick di HTML bisa mendeteksi App
window.App = App;

window.checkAllBaik = () => {
    listAlat.forEach((_, i) => {
        const rb = document.querySelector(`input[name="t-${i+1}"][value="B"]`);
        if(rb) { rb.checked = true; App.updateRowStyle(i+1, 'B'); }
    });
};

window.applyFilter = (type) => {
    document.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
    document.getElementById(`f-${type}`).classList.add('active');
    listAlat.forEach((_, i) => {
        const tr = document.getElementById(`row-${i+1}`);
        const val = document.querySelector(`input[name="t-${i+1}"]:checked`)?.value;
        if (type === 'ALL' || val === type) tr.classList.remove('hidden'); else tr.classList.add('hidden');
    });
};

window.prosesSimpan = async () => {
    const vals = listAlat.map((_, i) => document.querySelector(`input[name="t-${i+1}"]:checked`)?.value || null);
    if(vals.includes(null)) return alert("⚠️ Mohon lengkapi semua item!");

    const payload = { nik: userNik, pic_name: document.getElementById('pic').value, check_date: document.getElementById('tgl').value, items_data: vals };
    const { error } = await sbClient.from('toolbox_reports').insert([payload]);
    if (!error) { alert("✅ Data Berhasil Disimpan!"); resetForm(); } else alert("Error: " + error.message);
};

window.fetchHistory = async () => {
    const { data } = await sbClient.from('toolbox_reports').select('*').eq('nik', userNik).order('check_date', {ascending: false}).limit(10);
    document.getElementById('histBody').innerHTML = (data || []).map(row => `
        <tr class="border-b border-black/5 hover:bg-black/5 transition-colors">
            <td class="pl-4 py-3 font-mono text-[11px] font-bold warna-teks">${new Date(row.check_date).toLocaleDateString()}</td>
            <td class="text-right pr-4 py-3"><button onclick='loadData(${JSON.stringify(row)})' class="bg-blue-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase shadow-sm">LOAD</button></td>
        </tr>`).join('');
};

window.loadData = (row) => {
    document.getElementById('editingId').value = row.id;
    document.getElementById('tgl').value = row.check_date;
    row.items_data.forEach((val, i) => {
        const rad = document.querySelector(`input[name="t-${i+1}"][value="${val}"]`);
        if(rad) { rad.checked = true; App.updateRowStyle(i+1, val); }
    });
    closeAllDrawers(); updateMonthBadge();
};

window.resetForm = () => {
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    document.querySelectorAll('tr').forEach(tr => tr.classList.remove('row-baik','row-rusak','row-hilang'));
    App.refreshSummary();
};

window.toggleDrawer = () => { document.getElementById('sideDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('visible'); };
window.openHistory = () => { document.getElementById('bottomDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('visible'); fetchHistory(); };
window.closeAllDrawers = () => { document.getElementById('sideDrawer').classList.remove('open'); document.getElementById('bottomDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('visible'); };

function updateMonthBadge() {
    const d = new Date(document.getElementById('tgl').value);
    const m = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
    document.getElementById('currentMonthBadge').innerText = `${m[d.getMonth()]} ${d.getFullYear()}`;
}

window.onload = () => App.init();
