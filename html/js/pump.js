const CONFIG = {
    SB_URL: "https://corpgiuxyhfxdnqwwmlv.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E"
};
const sb = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY);

let currentNik = localStorage.getItem('userNIK');
let currentRecordId = null;
let currentPump = "1";
let nikChart;
let masterStore = JSON.parse(localStorage.getItem('nik_master_store')) || {};

const pumpFlowStd = [
    { label: 'P50', p: '50 ± 2', ne: 1900, i: 1.02, np: 1838, min: 524, max: 535, std: '502 ± 5' },
    { label: 'P137', p: '137 ± 5', ne: 1900, i: 1.02, np: 1838, min: 512, max: 523, std: '491 ± 5' },
    { label: 'P170', p: '170', ne: 1900, i: 1.02, np: 1838, min: 422, max: 453, std: '415 ± 15' },
    { label: 'P250', p: '250 ± 5', ne: 1900, i: 1.02, np: 1838, min: 284, max: 315, std: '284 ± 15' },
    { label: 'P300', p: '300 ± 2', ne: 1900, i: 1.02, np: 1838, min: 234, max: 245, std: '227 ± 5' }
];

const App = {
    async init() {
        const theme = localStorage.getItem('appTheme') || 'mint';
        const font = localStorage.getItem('appFont') || 'jelly';
        document.body.className = `tema-${theme}`;
        document.body.setAttribute('data-font', font);

        this.runAutoScale();
        window.addEventListener('resize', () => this.runAutoScale());

        initGeneralForms();
        await this.syncProfile();
        this.fetchHistory();

        const dateInp = document.getElementById('test_date');
        if(dateInp) dateInp.valueAsDate = new Date();
        
        document.getElementById('display-nik').innerText = currentNik || 'GUEST';
        document.getElementById('nik').value = currentNik || 'GUEST';

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
            if(scaler) { scaler.classList.remove('opacity-0'); scaler.style.opacity = '1'; scaler.style.pointerEvents = 'auto'; }
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
        if (!currentNik) return;
        try {
            const { data } = await sb.from('users').select('full_name').eq('nik', currentNik).single();
            const name = data ? data.full_name.toUpperCase() : "UNKNOWN";
            document.getElementById('nama_pic').value = name;
            localStorage.setItem('userName', name);
        } catch (err) { console.error(err); }
    },

    async fetchHistory() {
        const list = document.getElementById('history-list');
        const { data } = await sb.from('pump_performance_reports').select('*').order('created_at', { ascending: false }).limit(10);
        
        if (data && data.length > 0) {
            list.innerHTML = data.map(rec => `
                <div class="flex justify-between items-center p-4 bg-black/5 rounded-xl border border-black/10 shadow-sm hover:border-black/30 transition-all cursor-pointer group" onclick="loadRecord('${rec.id}')">
                    <div>
                        <p class="text-xs font-black warna-teks transition-colors">${rec.unit_model} - <span class="font-mono opacity-60">${rec.serial_number}</span></p>
                        <p class="text-[10px] opacity-60 warna-teks font-mono mt-1"><i class="fas fa-calendar-alt mr-1"></i>${new Date(rec.test_date).toLocaleDateString()}</p>
                    </div>
                    <i class="fas fa-chevron-right opacity-30 warna-teks text-xs group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"></i>
                </div>`).join('');
        } else {
            list.innerHTML = `<div class="text-center p-6 opacity-50 text-[10px] font-bold warna-teks uppercase">NO HISTORY FOUND</div>`;
        }
    }
};
// --- VALIDATION HELPER ---
function valColor(el, min, max) {
    const val = parseFloat(el.value);
    el.classList.remove('text-emerald-600', 'text-amber-500', 'text-red-500', 'font-black', 'warna-aksen');
    if (isNaN(val)) return;

    el.classList.add('font-black');
    if (val >= min && val <= max) el.classList.add('text-emerald-600');
    else if (val < min) el.classList.add('text-amber-500');
    else el.classList.add('text-red-500');
}

// --- UI HELPERS ---
window.switchTab = function(t) {
    document.getElementById('section-general').classList.toggle('hidden', t !== 'general');
    document.getElementById('section-pump').classList.toggle('hidden', t !== 'pump');
    document.getElementById('tab-gen').classList.toggle('active', t === 'general');
    document.getElementById('tab-pump').classList.toggle('active', t === 'pump');
    if(t === 'pump') { if(!nikChart) initChart(); renderPumpAnalysis(); }
}

window.toggleHistory = function(event) {
    if(event) event.stopPropagation();
    const panel = document.getElementById('history-panel');
    panel.classList.toggle('minimized');
    if(!panel.classList.contains('minimized')) App.fetchHistory();
}

document.addEventListener('click', (e) => {
    const panel = document.getElementById('history-panel');
    const trigger = document.getElementById('history-trigger');
    if (!panel.contains(e.target) && !trigger.contains(e.target)) panel.classList.add('minimized');
});

// --- PERBAIKAN: TABEL DAN INPUT FULL WIDTH ---
function initGeneralForms() {
    const compBody = document.getElementById('comp-history-body');
    const comps = ["ENGINE", "PUMP 1-2", "PUMP 3-4", "PUMP 5-6", "PUMP 7-8"];
    compBody.innerHTML = comps.map(c => `
        <tr>
            <td class="p-2 font-bold text-[10px] text-left pl-4 warna-teks">${c}</td>
            <td class="p-1"><input type="text" class="input-utama w-full !p-2 text-center data-comp text-[10px] font-mono"></td>
            <td class="p-1"><input type="text" class="input-utama w-full !p-2 text-center data-comp text-[10px] font-mono"></td>
            <td class="p-1"><input type="number" class="input-utama w-full !p-2 text-center data-comp text-[10px] font-mono"></td>
            <td class="p-1"><input type="text" class="input-utama w-full !p-2 text-center data-comp text-[10px]"></td>
        </tr>`).join('');

    const pumpGrid = document.getElementById('pump-relief-grid');
    pumpGrid.innerHTML = Array.from({length:8}, (_,i)=>`
        <div class="relative w-full flex flex-col items-center">
            <label class="text-[10px] font-black opacity-50 warna-teks mb-1 block">P${i+1}</label>
            <input type="number" class="input-utama w-full text-center font-mono text-sm font-bold warna-aksen data-pump !py-2" oninput="valColor(this, 300, 320)">
        </div>`).join('');

    const engBody = document.getElementById('engine-speed-body');
    const engData = [{n: "Low Idle", s: "780-820"}, {n: "High Idle", s: "1850-1950"}, {n: "Auto Idle", s: "1350-1450"}, {n: "Relief Idle", s: "1770-1830"}];
    engBody.innerHTML = engData.map(e => {
        const [min, max] = e.s.split('-').map(Number);
        return `
        <tr>
            <td class="p-2 font-bold text-[10px] pl-3 text-left warna-teks">${e.n}</td>
            <td class="p-2 text-[9px] font-bold opacity-60 warna-teks font-mono">${e.s}</td>
            <td class="p-1"><input type="number" class="input-utama w-full data-eng text-center text-xs font-bold !p-2" oninput="valColor(this, ${min}, ${max})"></td>
            <td class="p-1"><input type="number" class="input-utama w-full data-eng text-center text-xs font-bold !p-2" oninput="valColor(this, ${min}, ${max})"></td>
        </tr>`
    }).join('');

    const cycBody = document.getElementById('cycle-time-body');
    const actions = [{n: "Boom Raise", s: "8.2±0.5"},{n: "Arm Roll-in", s: "7.0±0.5"},{n: "Arm Roll-out", s: "7.0±0.5"},{n: "Bucket Roll-in", s: "4.7±0.5"},{n: "Bucket Roll-out", s: "4.2±0.5"},{n: "Swing RH", s: "57±3"},{n: "Swing LH", s: "57±3"}];
    cycBody.innerHTML = actions.map(a => {
        const [base, tol] = a.s.split('±').map(Number);
        const min = (base - tol).toFixed(1);
        const max = (base + tol).toFixed(1);
        return `
        <tr>
            <td class="p-2 text-[10px] text-left font-bold pl-3 warna-teks">${a.n}</td>
            <td class="p-2 text-[9px] font-mono opacity-60 warna-teks font-bold">${a.s}</td>
            <td class="p-1"><input type="number" step="0.1" class="input-utama w-full text-center data-cyc text-xs font-bold !p-2" oninput="valColor(this, ${min}, ${max})"></td>
            <td class="p-1"><input type="number" step="0.1" class="input-utama w-full text-center data-cyc text-xs font-bold !p-2" oninput="valColor(this, ${min}, ${max})"></td>
        </tr>`
    }).join('');
}
// --- PUMP LOGIC & ANALYSIS ---
window.changePump = function(v) { 
    currentPump = v; 
    document.getElementById('active-p-num').innerText = v; 
    renderPumpAnalysis(); 
}

window.renderPumpAnalysis = function() {
    const container = document.getElementById('pump-tables-container');
    const pumpData = masterStore[currentPump] || { valuesBefore: [], valuesAfter: [] };
    
    const buildTable = (title, type) => {
        const values = (type === 'after' ? pumpData.valuesAfter : pumpData.valuesBefore) || [];
        return `
            <div class="panel-utama m-0 p-0 overflow-hidden mb-6">
                <div class="bg-black/5 p-3 border-b border-black/10 flex justify-between items-center">
                    <h3 class="text-[10px] font-black warna-teks uppercase px-2 tracking-wider" style="font-family: var(--font-judul);">${title}</h3>
                </div>
                <div class="overflow-x-auto p-2">
                    <table class="w-full min-w-[420px]">
                        <thead>
                            <tr>
                                <th class="p-2 text-[10px] warna-teks text-left">Point</th>
                                <th class="p-2 text-[10px] warna-teks text-center">Press(Kg)</th>
                                <th class="warna-aksen p-2 text-[10px] text-center">Flow Q Input</th>
                                <th class="p-2 text-[10px] warna-teks text-center">QC Calc</th>
                                <th class="p-2 text-[10px] warna-teks text-center">Std QC</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pumpFlowStd.map((item, i) => {
                                const val = values[i] || '';
                                const qc = val ? Math.round((item.np * val) / (item.i * item.ne)) : '-';
                                let color = 'opacity-50 warna-teks';
                                
                                if(qc !== '-') {
                                    const [base, tol] = item.std.split('±').map(Number);
                                    if (qc < base - tol) color = 'text-amber-500 font-black'; 
                                    else if (qc > base + tol) color = 'text-red-500 font-black'; 
                                    else color = 'text-emerald-500 font-black'; 
                                }
                                
                                return `<tr>
                                    <td class="p-2 font-bold warna-teks text-[11px] text-left">${item.label}</td>
                                    <td class="p-2 opacity-50 warna-teks font-mono text-[10px] text-center">${item.p}</td>
                                    <td class="p-1 align-top">
                                        <input type="number" class="input-utama w-full !p-2 text-center font-mono font-bold text-xs" data-type="${type}" data-idx="${i}" value="${val}" oninput="updatePumpValueRealtime(this)">
                                        <div class="text-[8px] font-bold opacity-50 warna-teks text-center mt-1 uppercase tracking-widest">
                                            Guide: ${item.min} - ${item.max}
                                        </div>
                                    </td>
                                    <td class="p-2 qc-output ${color} text-xs text-center align-top pt-3">${qc}</td>
                                    <td class="p-2 font-bold opacity-50 warna-teks text-[9px] font-mono text-center align-top pt-3">${item.std}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    };
    container.innerHTML = buildTable('1. BEFORE ADJUSTMENT', 'before') + buildTable('2. AFTER ADJUSTMENT', 'after');
    updateChart();
}

window.updatePumpValueRealtime = function(el) {
    const type = el.dataset.type;
    const idx = parseInt(el.dataset.idx);
    if(!masterStore[currentPump]) masterStore[currentPump] = { valuesBefore: [], valuesAfter: [] };
    masterStore[currentPump][type === 'after' ? 'valuesAfter' : 'valuesBefore'][idx] = el.value;
    localStorage.setItem('nik_master_store', JSON.stringify(masterStore));
    
    renderPumpAnalysis();
    
    // Kembalikan fokus ke input setelah dirender ulang
    const newInput = document.querySelector(`input[data-type="${type}"][data-idx="${idx}"]`);
    if(newInput) {
        const val = newInput.value;
        newInput.focus();
        newInput.value = ''; newInput.value = val;
    }
}
// --- CHART LOGIC ---
window.initChart = function() {
    const ctx = document.getElementById('nikChart').getContext('2d');
    if (nikChart) nikChart.destroy();
    
    // Deteksi warna berdasarkan tema (Mannequin System)
    const isMecha = document.body.classList.contains('tema-mecha');
    const mainColor = isMecha ? '#f59e0b' : '#10b981'; // Kuning untuk Mecha, Hijau untuk Mint
    const secColor = '#94a3b8';

    nikChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: pumpFlowStd.map(d => d.label),
            datasets: [
                { label: 'Min', data: pumpFlowStd.map(i => parseInt(i.std.split('±')[0]) - parseInt(i.std.split('±')[1])), borderColor: 'rgba(0,0,0,0.1)', borderDash: [5,5], pointRadius: 0, borderWidth: 1 },
                { label: 'Max', data: pumpFlowStd.map(i => parseInt(i.std.split('±')[0]) + parseInt(i.std.split('±')[1])), borderColor: 'rgba(0,0,0,0.1)', borderDash: [5,5], pointRadius: 0, borderWidth: 1 },
                { label: 'Before', data: [], borderColor: secColor, tension: 0.3, pointRadius: 4, borderWidth: 2 },
                { label: 'After', data: [], borderColor: mainColor, tension: 0.3, pointRadius: 5, borderWidth: 3, backgroundColor: isMecha ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', fill: true }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { font: { family: 'sans-serif', size: 12 } } } },
            scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
        }
    });
}

window.updateChart = function() {
    if(!nikChart) return;
    const pumpData = masterStore[currentPump] || { valuesBefore: [], valuesAfter: [] };
    const calcQC = (v, i) => v ? Math.round((pumpFlowStd[i].np * v) / (pumpFlowStd[i].i * pumpFlowStd[i].ne)) : null;
    
    nikChart.data.datasets[2].data = (pumpData.valuesBefore || []).map(calcQC);
    nikChart.data.datasets[3].data = (pumpData.valuesAfter || []).map(calcQC);
    nikChart.update();
}
// --- CLOUD OPS (SIMPAN & MUAT DATA) ---
window.saveToCloud = async function() {
    const btn = document.querySelector('button[onclick="saveToCloud()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`;
    btn.disabled = true;
    
    const recId = document.getElementById('current_record_id').value;
    const unitModel = document.getElementById('unit_model').value.toUpperCase();

    if (!unitModel) {
        alert("Harap isi Model Unit!");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    // Susun paket data
    const record = {
        test_date: document.getElementById('test_date').value,
        nik: document.getElementById('nik').value,
        unit_model: unitModel,
        serial_number: document.getElementById('serial_num').value.toUpperCase(),
        hour_meter: document.getElementById('hour_meter').value,
        component_history: Array.from(document.querySelectorAll('.data-comp')).map(i => i.value),
        pump_relief_values: Array.from(document.querySelectorAll('.data-pump')).map(i => i.value),
        engine_speed_values: Array.from(document.querySelectorAll('.data-eng')).map(i => i.value),
        cycle_time_values: Array.from(document.querySelectorAll('.data-cyc')).map(i => i.value),
        all_pumps_data: masterStore
    };
    
    try {
        if (recId) {
            // MODE EDIT (Wajib Online)
            if (!navigator.onLine) {
                alert("⚠️ Anda sedang offline. Mengedit riwayat lama membutuhkan koneksi internet.");
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }
            const { error } = await sb.from('pump_performance_reports').update(record).eq('id', recId);
            if (error) throw error;
            alert("✅ Record Updated Successfully!");
        } else {
            // MODE ENTRY BARU (Bisa Offline/Online lewat Service Worker)
            if(window.HexindoFleet) {
                const isSuccess = await window.HexindoFleet.submitData('pump_performance_reports', record);
                window.HexindoFleet.submitData('activity_logs', {
                    nik: document.getElementById('nik').value,
                    activity: "Pump Tuning Report",
                    details: `Unit: ${unitModel}`
                });
                if (isSuccess) alert("✅ DATA SYNCED TO SERVER!");
                else alert("⚠️ OFFLINE MODE: Data disimpan di antrean HP. Akan dikirim otomatis saat sinyal kembali.");
            } else {
                // Pengaman jika offline manager gagal dimuat
                const { error } = await sb.from('pump_performance_reports').insert([record]);
                if (error) throw error;
                alert("✅ Record Saved Successfully!");
            }
        }
        
        window.prepareNewEntry(); 
        if(!document.getElementById('history-panel').classList.contains('minimized')) App.fetchHistory();
        
    } catch (err) {
        alert("System Error: " + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.loadRecord = async function(id) {
    const { data } = await sb.from('pump_performance_reports').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('current_record_id').value = data.id;
        document.getElementById('unit_model').value = data.unit_model;
        document.getElementById('serial_num').value = data.serial_number;
        document.getElementById('test_date').value = data.test_date;
        document.getElementById('hour_meter').value = data.hour_meter;
        
        // Pulihkan data flow Q ke dalam masterStore
        masterStore = data.all_pumps_data || {};
        localStorage.setItem('nik_master_store', JSON.stringify(masterStore));
        
        const populate = (sel, vals) => {
            document.querySelectorAll(sel).forEach((el, i) => {
                el.value = vals[i] || '';
                el.dispatchEvent(new Event('input')); // Memicu perubahan warna peringatan (hijau/kuning/merah)
            });
        };

        populate('.data-comp', data.component_history || []);
        populate('.data-pump', data.pump_relief_values || []);
        populate('.data-eng', data.engine_speed_values || []);
        populate('.data-cyc', data.cycle_time_values || []);
        
        if(!document.getElementById('section-pump').classList.contains('hidden')) window.renderPumpAnalysis();
        document.getElementById('history-panel').classList.add('minimized');
        
        document.getElementById('sync-status').innerText = "EDIT MODE";
        document.getElementById('status-dot').className = "w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse";
    }
}

window.prepareNewEntry = function() {
    document.getElementById('current_record_id').value = "";
    document.querySelectorAll('input:not([readonly])').forEach(i => {
        i.value = "";
        i.classList.remove('text-emerald-600', 'text-amber-500', 'text-red-500', 'font-black'); 
    });
    document.getElementById('test_date').valueAsDate = new Date();
    
    // Kosongkan master store untuk Pompa
    masterStore = {};
    localStorage.removeItem('nik_master_store');
    
    if(!document.getElementById('section-pump').classList.contains('hidden')) window.renderPumpAnalysis();
    document.getElementById('sync-status').innerText = "NEW ENTRY MODE";
    document.getElementById('status-dot').className = "w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse";
}

// --- INISIALISASI AKHIR ---
window.onload = () => App.init();
