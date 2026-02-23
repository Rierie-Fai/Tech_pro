// --- KONFIGURASI SUPABASE ---
const CONFIG = {
    SB_URL: "https://corpgiuxyhfxdnqwwmlv.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E",
    STORAGE_KEY: "techLogs_v4_mecha"
};
const sb = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY);

let isEditMode = false;
let currentFilter = { keyword: "", startDate: "", endDate: "", status: "all" };
const userNik = localStorage.getItem('userNIK');
const userName = localStorage.getItem('userName'); 

const App = {
    async init() {
        // 1. Suntik Tema & Font Manekin
        const theme = localStorage.getItem('appTheme') || 'mint';
        const font = localStorage.getItem('appFont') || 'jelly';
        document.body.className = `tema-${theme}`;
        document.body.setAttribute('data-font', font);

        // 2. Setup Data User
        if (!userName) {
             const { data } = await sb.from('users').select('full_name').eq('nik', userNik).single();
             if (data) localStorage.setItem('userName', data.full_name);
        }
        document.getElementById('nameInp').value = localStorage.getItem('userName') || 'Technician';
        document.getElementById('nikInp').value = userNik;
        document.getElementById('dateInp').valueAsDate = new Date();
        
        if(!document.getElementById('detailRowsContainer').children.length) addDetailRow();
        refreshTable();
        runAutoScale();

        // 3. Sensor Buka Tirai Anti-FOUC
        let tiraiTerbuka = false;
        const bukaTirai = () => {
            if(tiraiTerbuka) return; 
            tiraiTerbuka = true;
            const splash = document.getElementById('splash-screen');
            const appCtx = document.getElementById('app-context');
            if(splash) { splash.style.opacity = '0'; setTimeout(() => splash.style.display = 'none', 500); }
            if(appCtx) appCtx.classList.remove('opacity-0');
        };

        document.fonts.ready.then(() => setTimeout(bukaTirai, 300)).catch(bukaTirai);
        setTimeout(bukaTirai, 2000); // Pengaman Mutlak 2 detik
    }
};

// --- MESIN SKALA PRESISI (NATIVE ZOOM TERBARU) ---
function runAutoScale() { 
    const s = document.getElementById('scaler-context'); 
    if(!s) return;
    const w = document.documentElement.clientWidth; 
    
    if (w < 720) {
        // Gunakan zoom untuk HP, hilangkan margin hantu
        const r = w / 720;
        s.style.transform = 'none'; 
        s.style.zoom = r;           
        s.style.margin = '0'; 
        s.style.marginBottom = '0px'; 
    } else {
        // Mode Desktop
        s.style.transform = 'none';
        s.style.zoom = 1;
        s.style.margin = '0 auto';
        s.style.marginBottom = '0px';
    }
}
window.addEventListener('resize', runAutoScale);

function toggleFilterDrawer() {
    document.getElementById('filterDrawer').classList.toggle('open');
    document.getElementById('drawerOverlay').classList.toggle('visible');
}

// --- LOGIKA MULTILINE & ROW ---
function formatBullet(text) {
    if (!text) return "";
    return text.split('\n').map(l => l.trim()).filter(l => l !== "").map(l => l.startsWith('•') ? l : `• ${l}`).join('\n');
}

// DIPERBAIKI: Tambahan w-full agar kotak mengetik melebar penuh
function addDetailRow(timeF = '', timeT = '', desc = '') {
    const container = document.getElementById('detailRowsContainer');
    const div = document.createElement('div');
    // Tambahkan items-stretch agar tinggi selaras
    div.className = "flex gap-3 items-stretch bg-black/5 p-3 rounded-xl border border-black/5 relative group";
    div.innerHTML = `
        <div class="absolute -left-1 top-4 w-1.5 h-8 rounded-r" style="background-color: var(--warna-aksen);"></div>
        <div class="w-24 flex-shrink-0 flex flex-col gap-2">
            <input type="time" class="input-utama w-full text-center !p-2 text-xs font-mono !bg-white" value="${timeF}">
            <input type="time" class="input-utama w-full text-center !p-2 text-xs font-mono !bg-white" value="${timeT}">
        </div>
        <div class="flex-1 flex w-full">
            <textarea class="input-utama w-full flex-1 !p-3 min-h-[80px] text-sm !bg-white" placeholder="Input Detail...">${desc}</textarea>
        </div>
        <button onclick="this.parentElement.remove()" class="opacity-30 hover:opacity-100 hover:text-red-500 font-black p-2 text-2xl transition-colors flex items-center">&times;</button>`;
    container.appendChild(div);
    runAutoScale();
}

function smartAddTask() {
    const rows = document.querySelectorAll('#detailRowsContainer > div');
    let lastTime = rows.length > 0 ? rows[rows.length - 1].querySelectorAll('input[type="time"]')[1].value : "";
    addDetailRow(lastTime, "");
}

async function submitLog() {
    const dateVal = document.getElementById('dateInp').value;
    const details = Array.from(document.querySelectorAll('#detailRowsContainer > div')).map(row => {
        const t = row.querySelectorAll('input[type="time"]');
        const rawDesc = row.querySelector('textarea').value;
        return { f: t[0].value, t: t[1].value, d: formatBullet(rawDesc) };
    }).filter(item => item.d !== "");

    if(!dateVal || details.length === 0) return alert("Required: Date & Progress!");

    const logEntry = {
        id: isEditMode ? parseInt(document.getElementById('editId').value) : Date.now(),
        date: dateVal, name: document.getElementById('nameInp').value, nik: userNik,
        customer: document.getElementById('customerInp').value.toUpperCase(),
        location: document.getElementById('locationInp').value.toUpperCase(),
        model: document.getElementById('modelInp').value.toUpperCase(), 
        sn: document.getElementById('snInp').value.toUpperCase(),
        hm: document.getElementById('hmInp').value, 
        job: document.getElementById('jobDescInp').value.toUpperCase(),
        isSynced: navigator.onLine,
        detailData: details
    };

    let logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    isEditMode ? logs = logs.map(l => l.id === logEntry.id ? logEntry : l) : logs.push(logEntry);
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(logs));

    const payloadTechLogs = { id: logEntry.id, nik: userNik, log_data: logEntry };

    if(window.HexindoFleet) {
        window.HexindoFleet.submitData('tech_logs', payloadTechLogs).then(isSuccess => {
            if (isSuccess) {
                let currentLogs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
                currentLogs = currentLogs.map(l => l.id === logEntry.id ? { ...l, isSynced: true } : l);
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(currentLogs));
                refreshTable();
            }
        });

        window.HexindoFleet.submitData('activity_logs', {
            nik: userNik, activity: isEditMode ? "Updated Activity Report" : "New Activity Report",
            details: `${logEntry.customer} - ${logEntry.model}`
        });
    }

    clearForm(); refreshTable(); 
}

// --- CLOUD OPS ---
async function syncToCloud() {
    if (!navigator.onLine) return alert("Anda sedang offline. Data akan otomatis terkirim saat sinyal kembali.");
    const btn = document.getElementById('btnSyncSmall');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Pushing...`; btn.disabled = true;

    try {
        if(window.HexindoFleet) await window.HexindoFleet.syncData();
        let logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(logs.map(l => ({ ...l, isSynced: true }))));
        refreshTable();
    } catch (err) { console.error("Manual sync error", err); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
}

async function pullFromCloud() {
    const btn = document.getElementById('btnPull');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Pulling...`; btn.disabled = true;
    try {
        const { data, error } = await sb.from('tech_logs').select('log_data').eq('nik', userNik).order('id', { ascending: false });
        if(error) throw error;
        if(data && data.length > 0) {
            if(confirm(`Found ${data.length} records. Overwrite local?`)) {
                const cloudLogs = data.map(item => item.log_data);
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(cloudLogs));
                refreshTable(); alert("✅ Data Pulled!");
            }
        } else { alert("☁️ Cloud is Empty."); }
    } catch (err) { alert("Pull Error: " + err.message); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
}

// --- TABLE LOGIC ---
function applyFilter() {
    currentFilter.keyword = document.getElementById('filterKeyword').value.toLowerCase();
    currentFilter.startDate = document.getElementById('filterDateStart').value;
    currentFilter.endDate = document.getElementById('filterDateEnd').value;
    currentFilter.status = document.getElementById('filterStatus').value;
    refreshTable(); toggleFilterDrawer();
}

function resetFilter() {
    document.getElementById('filterKeyword').value = ""; document.getElementById('filterDateStart').value = "";
    document.getElementById('filterDateEnd').value = ""; document.getElementById('filterStatus').value = "all";
    applyFilter();
}

function refreshTable() {
    const masterList = document.getElementById('masterList');
    masterList.innerHTML = '';
    let logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    
    const filteredLogs = logs.filter(obj => {
        const matchKeyword = !currentFilter.keyword || (obj.customer + obj.model + obj.job).toLowerCase().includes(currentFilter.keyword);
        const matchDate = (!currentFilter.startDate || obj.date >= currentFilter.startDate) && (!currentFilter.endDate || obj.date <= currentFilter.endDate);
        const matchStatus = currentFilter.status === 'all' || (currentFilter.status === 'synced' && obj.isSynced) || (currentFilter.status === 'local' && !obj.isSynced);
        return matchKeyword && matchDate && matchStatus;
    });

    if(filteredLogs.length === 0) { masterList.innerHTML = `<div class="text-center p-8 opacity-50 font-bold text-sm bg-black/5 rounded-xl border border-black/10 border-dashed warna-teks">NO DATA FOUND</div>`; return; }

    filteredLogs.sort((a,b) => b.id - a.id).forEach(obj => {
        let chronoRows = (obj.detailData || []).map(item => `<tr><td class="cell-time font-mono" style="font-family: var(--font-teks);">${item.f}-${item.t}</td><td class="description-text warna-teks" style="font-family: var(--font-teks);">${item.d}</td></tr>`).join('');
        const section = document.createElement('div');
        section.className = "panel-utama p-0 overflow-hidden mb-6 shadow-sm border border-white/50";
        section.innerHTML = `
            <div class="bg-black/5 p-3 flex justify-between items-center border-b border-black/10">
                <span class="text-[9px] font-bold ${obj.isSynced ? 'text-blue-500' : 'text-orange-500'} uppercase font-mono ml-2 tracking-wider" style="font-family: var(--font-teks);">${obj.isSynced ? '❄️ SYNCED_CLOUD' : '⚠️ LOCAL_STORAGE'}</span>
                <div class="flex gap-4 mr-2">
                    <button onclick="editLog(${obj.id})" class="text-blue-500 hover:text-blue-700 text-xs font-black uppercase">EDIT</button>
                    <button onclick="deleteLog(${obj.id})" class="text-red-500 hover:text-red-700 text-xs font-black uppercase">DELETE</button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse table-fixed">
                    <thead><tr><th style="width: 100px" class="warna-teks">Date</th><th style="width: 140px" class="warna-teks">Tech & Client</th><th style="width: 130px" class="warna-teks">Unit Info</th><th style="width: auto" class="warna-teks">Progress</th></tr></thead>
                    <tbody>
                        <tr>
                            <td class="td-main font-bold warna-teks text-center text-xs bg-white/50">${obj.date}</td>
                            <td class="td-main">
                                <b class="warna-teks text-sm font-black" style="font-family: var(--font-judul);">${obj.name}</b><br><span class="text-xs opacity-50 font-mono warna-teks">ID: ${obj.nik}</span>
                                <div class="h-px bg-black/10 my-2"></div><b class="warna-aksen font-black" style="font-family: var(--font-judul);">${obj.customer}</b><br><span class="text-xs font-bold bg-black/5 px-1.5 rounded warna-teks">${obj.location}</span>
                            </td>
                            <td class="td-main">
                                <span class="text-xs font-bold uppercase block mb-1 bg-black/5 inline-block px-1.5 rounded warna-teks">${obj.job || '-'}</span>
                                <div class="h-px bg-black/10 my-2"></div><b class="warna-teks text-sm font-black" style="font-family: var(--font-judul);">${obj.model}</b><br><span class="text-xs opacity-50 font-mono warna-teks">SN: ${obj.sn}</span><br><span class="text-xs opacity-50 font-mono warna-teks">HM: ${obj.hm}</span>
                            </td>
                            <td class="p-0 bg-white/50"><table class="w-full border-none">${chronoRows}</table></td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
        masterList.appendChild(section);
    });
    runAutoScale();
}

function editLog(id) {
    const logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    const log = logs.find(l => l.id === id);
    isEditMode = true;
    document.getElementById('editId').value = log.id;
    document.getElementById('customerInp').value = log.customer; document.getElementById('locationInp').value = log.location;
    document.getElementById('dateInp').value = log.date; document.getElementById('modelInp').value = log.model;
    document.getElementById('snInp').value = log.sn; document.getElementById('hmInp').value = log.hm;
    document.getElementById('jobDescInp').value = log.job;
    document.getElementById('detailRowsContainer').innerHTML = '';
    log.detailData.forEach(d => addDetailRow(d.f, d.t, d.d));
    document.getElementById('submitBtn').innerHTML = "<span>Authorize & Update</span>";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteLog(id) {
    if(confirm("Delete record?")) {
        let logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)).filter(l => l.id !== id);
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(logs));
        sb.from('activity_logs').insert([{ nik: userNik, activity: "Deleted Activity Report", details: `ID: ${id}` }]);
        refreshTable();
    }
}

function clearForm() {
    isEditMode = false;
    ['customerInp','locationInp','modelInp','snInp','hmInp','jobDescInp'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('detailRowsContainer').innerHTML = ''; addDetailRow();
    document.getElementById('submitBtn').innerHTML = "<span>Authorize & Submit</span>";
}

function exportToPDF() {
    const { jsPDF } = window.jspdf; const doc = new jsPDF('l', 'mm', 'a4');
    const logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    let flatData = [];
    logs.forEach(l => {
        l.detailData.forEach((d, i) => { flatData.push([ i === 0 ? l.date : '', i === 0 ? l.name : '', i === 0 ? l.customer : '', i === 0 ? l.model : '', i === 0 ? l.job : '', `${d.f}-${d.t}`, d.d ]); });
    });
    doc.autoTable({ head: [['DATE', 'TECH', 'CLIENT', 'UNIT', 'JOB', 'TIME', 'DETAIL']], body: flatData, headStyles: { fillColor: [30, 41, 59] }, styles: { fontSize: 9, textColor: [30, 41, 59] }, alternateRowStyles: { fillColor: [241, 245, 249] } });
    doc.save("Activity_Report.pdf");
}

function exportToExcel() {
    let logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    let flat = logs.flatMap(l => l.detailData.map(d => ({ Tgl: l.date, Tech: l.name, NIK: l.nik, Client: l.customer, Unit: l.model, Job: l.job, Jam: `${d.f}-${d.t}`, Detail: d.d })));
    const ws = XLSX.utils.json_to_sheet(flat); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Logs"); XLSX.writeFile(wb, "Activity_Report.xlsx");
}

window.onload = () => App.init();
