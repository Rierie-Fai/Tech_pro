// WAJIB DI ATAS: Konfigurasi Supabase
const CONFIG = {
    SB_URL: "https://corpgiuxyhfxdnqwwmlv.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcnBnaXV4eWhmeGRucXd3bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDMwNzcsImV4cCI6MjA4NTg3OTA3N30.PMp5yZOISYrBG0UUcIGaXUPnmEAaWVKgQ3Y1W8Nea_E"
};

const Dash = {
    sb: supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY),
    userNik: localStorage.getItem('userNIK'),
    activeChat: null,
    _chatListening: false,

    async init() {
        // 1. Suntik Identitas Baju & Font
        const theme = localStorage.getItem('appTheme') || 'mint';
        const font = localStorage.getItem('appFont') || 'jelly';
        document.body.className = `tema-${theme}`;
        document.body.setAttribute('data-font', font);

        // 2. Mesin Skala Presisi (Menggunakan ZOOM Native)
        this.runAutoScale();
        window.addEventListener('resize', () => this.runAutoScale());
        
        // 3. Mesin Jam Digital
        this.updateTime(); 
        setInterval(() => this.updateTime(), 1000);
        
        // 4. Tarik Data Sesi & Buka Tirai
        await this.loadSession();
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

    async loadSession() {
        if (!this.userNik) {
            window.location.replace('login.html');
            return;
        }

        try {
            const { data: user, error } = await this.sb.from('users').select('*').eq('nik', this.userNik).single();
            
            if (error) throw new Error("Koneksi server terputus");
            if (!user) throw new Error("Data NIK tidak ditemukan");

            // Masukkan Data Diri
            const nameEl = document.getElementById('userNameDisplay');
            const nikEl = document.getElementById('userNikDisplay');
            const roleEl = document.getElementById('roleBadge');

            if (nameEl) nameEl.innerText = user.full_name || "UNKNOWN OPERATOR";
            if (nikEl) nikEl.innerText = `NIK: ${user.nik}`;
            
            if (roleEl) {
                if (user.role === 'admin') {
                    roleEl.innerText = "ADMIN ACCESS";
                    roleEl.className = "badge-role role-admin";
                    
                    const adminModul = document.getElementById('modul-admin');
                    const notifBtn = document.getElementById('notifBtn');
                    if (adminModul) adminModul.classList.remove('hidden');
                    if (notifBtn) notifBtn.classList.remove('hidden');
                    
                    this.loadNotifications();
                } else {
                    roleEl.innerText = "TECHNICIAN";
                    roleEl.className = "badge-role role-tech";
                }
            }
            
            this.executeCurtainDrop();

        } catch (err) {
            console.error("Gagal memuat sesi:", err);
            alert("Gagal menyinkronkan data. Pastikan koneksi stabil lalu coba lagi.");
            localStorage.removeItem('isLoggedIn');
            window.location.replace('login.html');
        }
    },

    // --- SENSOR BUKA TIRAI ANTI-FOUC (TINGKAT DEWA) ---
    executeCurtainDrop() {
        let tiraiTerbuka = false;
        const bukaTirai = () => {
            if(tiraiTerbuka) return; 
            tiraiTerbuka = true;
            
            const scaler = document.getElementById('scaler-context');
            if(scaler) {
                scaler.classList.remove('opacity-0');
                scaler.style.opacity = '1';
                scaler.style.pointerEvents = 'auto'; // Pastikan bisa diklik
            }
        };

        // 1. Tunggu font siap -> 2. Pastikan piksel digambar browser -> 3. Buka tirai
        document.fonts.ready.then(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(bukaTirai, 150);
                });
            });
        }).catch(bukaTirai);

        setTimeout(bukaTirai, 2000); // Pengaman Mutlak 2 detik

        // PENGAMAN TOMBOL BACK / LOGOUT (Bfcache)
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                tiraiTerbuka = false; 
                bukaTirai();
            }
        });
    },

    updateTime() {
        const now = new Date();
        const timeEl = document.getElementById('liveTime');
        const dateEl = document.getElementById('liveDate');
        
        if (timeEl) timeEl.innerText = now.toLocaleTimeString('en-GB', { hour12: false });
        if (dateEl) dateEl.innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    },

    // --- FUNGSI NAVIGASI ANIMASI TEMA ---
    navigate(event, url, moduleName, element) {
        event.preventDefault(); 
        const theme = localStorage.getItem('appTheme') || 'mint';

        if (theme === 'mecha') {
            const crosshair = document.getElementById('crosshair-target');
            if (!crosshair) { window.location.assign(url); return; }

            const kotak = element.getBoundingClientRect(); 
            const padding = 10; 
            
            crosshair.style.left = (kotak.left - padding) + 'px';
            crosshair.style.top = (kotak.top - padding) + 'px';
            crosshair.style.width = (kotak.width + padding * 2) + 'px';
            crosshair.style.height = (kotak.height + padding * 2) + 'px';
            
            crosshair.classList.remove('mengunci');
            void crosshair.offsetWidth; 
            crosshair.classList.add('mengunci');

            setTimeout(() => {
                const layar = document.getElementById('mecha-layar-transisi');
                const teksTujuan = document.getElementById('mecha-teks-tujuan');
                if (teksTujuan) teksTujuan.innerText = "MEMUAT " + moduleName + "...";
                if (layar) layar.classList.add('aktif'); 
                setTimeout(() => window.location.assign(url), 500); 
            }, 1000); 

        } else {
            const overlay = document.getElementById('mint-loader-overlay');
            if (!overlay) { window.location.assign(url); return; }

            const teksTujuan = document.getElementById('mint-teks-tujuan');
            if (teksTujuan) teksTujuan.innerText = "Menyiapkan " + moduleName + "...";
            overlay.classList.add('aktif');
            setTimeout(() => window.location.assign(url), 1200);
        }
    },

    logout() {
        if (confirm("Cabut akses dari Hexindo Portal?")) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userNIK');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            window.location.replace('login.html');
        }
    },

    // ==========================================
    // MODULE: DRAWERS (LACI SISTEM)
    // ==========================================
    toggleDrawer(id) {
        const d = document.getElementById(id);
        const o = document.getElementById('drawerOverlay');
        if (!d || !o) return;
        
        const isOpen = d.classList.contains('open');
        this.closeAllDrawers(); 
        
        if (!isOpen) { 
            d.classList.add('open');
            o.classList.add('visible');
            
            document.body.style.overflow = 'hidden';
            
            if(id === 'chatDrawer') {
                const badge = document.getElementById('chatBadge');
                if(badge) badge.classList.add('hidden'); 
                if(!this.activeChat) this.loadContacts(); 
                this.initChatListener(); 
            } else if (id === 'notifDrawer') {
                this.loadNotifications();
            }
        }
    },

    closeAllDrawers() { 
        const chat = document.getElementById('chatDrawer');
        const notif = document.getElementById('notifDrawer');
        const overlay = document.getElementById('drawerOverlay');
        
        if(chat) chat.classList.remove('open');
        if(notif) notif.classList.remove('open');
        if(overlay) overlay.classList.remove('visible');
        
        document.body.style.overflow = '';
    },

    // ==========================================
    // MODULE: COMMS CENTER (PESAN/CHAT)
    // ==========================================
    initChatListener() {
        if(this._chatListening) return; 
        this._chatListening = true;
        this.sb.channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => { 
                this.handleIncomingMessage(payload.new); 
            }).subscribe();
    },

    async loadContacts() {
        const list = document.getElementById('userListContainer');
        if(!list) return;

        list.innerHTML = `<div class="text-center text-[10px] opacity-50 py-4"><i class="fas fa-spinner fa-spin"></i></div>`;
        
        const { data: users, error } = await this.sb.from('users')
            .select('nik, full_name')
            .neq('nik', this.userNik)
            .eq('status', 'active')
            .order('full_name');
            
        if (error || !users || users.length === 0) { 
            list.innerHTML = `<div class="text-center text-[10px] opacity-50 font-mono py-4">NO ACTIVE PERSONNEL</div>`; 
            return; 
        }
        
        // Pilihan Public Broadcast di atas
        let html = `
            <div onclick="Dash.openChat('ALL', 'PUBLIC BROADCAST')" class="p-3 mb-2 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform flex items-center justify-between group bg-blue-500/10 border border-blue-500/20">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-sm flex items-center justify-center"><i class="fas fa-bullhorn"></i></div>
                    <div><h5 class="text-xs font-black uppercase text-blue-600">Global Channel</h5><p class="text-[9px] opacity-50 font-bold uppercase">All Personnel</p></div>
                </div>
                <i class="fas fa-comment-dots text-blue-500 opacity-50 group-hover:opacity-100 transition-all"></i>
            </div>
            <div class="h-px w-full bg-black/5 my-3"></div>
        `;

        html += users.map(u => `
            <div onclick="Dash.openChat('${u.nik}', '${u.full_name}')" class="p-3 mb-2 border border-black/10 rounded-xl cursor-pointer hover:border-black/30 hover:shadow-sm transition-all flex items-center justify-between group bg-white/50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-black/5 font-bold text-xs flex items-center justify-center font-mono warna-teks uppercase">${u.nik.substring(0,2)}</div>
                    <div>
                        <h5 class="text-xs font-black uppercase warna-teks">${u.full_name}</h5>
                        <p class="text-[9px] opacity-50 font-mono flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ONLINE</p>
                    </div>
                </div>
                <i class="fas fa-comment-alt opacity-30 group-hover:text-amber-500 group-hover:opacity-100 text-xs transition-all"></i>
            </div>
        `).join('');
        
        list.innerHTML = html;
    },

    openChat(targetNik, targetName = "GLOBAL CHANNEL") {
        this.activeChat = targetNik;
        document.getElementById('contactListView').classList.add('hidden');
        document.getElementById('chatRoomView').classList.remove('hidden');
        document.getElementById('btnBackToContacts').classList.remove('hidden');
        document.getElementById('chatHeaderTitle').innerText = targetName;
        document.getElementById('chatHeaderSubtitle').innerText = targetNik === 'ALL' ? 'PUBLIC BROADCAST' : `ENCRYPTED: ${targetNik}`;
        this.loadMessages();
    },

    showContactList() {
        this.activeChat = null;
        document.getElementById('contactListView').classList.remove('hidden');
        document.getElementById('chatRoomView').classList.add('hidden');
        document.getElementById('btnBackToContacts').classList.add('hidden');
        document.getElementById('chatHeaderTitle').innerText = 'COMMS CENTER';
        document.getElementById('chatHeaderSubtitle').innerText = 'SELECT FREQUENCY';
    },

    async loadMessages() {
        const container = document.getElementById('chatMessages');
        container.innerHTML = `<div class="text-center py-10"><i class="fas fa-circle-notch fa-spin opacity-50"></i></div>`;
        
        let query = this.sb.from('messages').select('*').order('created_at', { ascending: true });
        
        if (this.activeChat === 'ALL') {
            query = query.eq('receiver_nik', 'ALL');
        } else {
            query = query.or(`and(sender_nik.eq.${this.userNik},receiver_nik.eq.${this.activeChat}),and(sender_nik.eq.${this.activeChat},receiver_nik.eq.${this.userNik})`);
        }
        
        const { data } = await query.limit(50);
        container.innerHTML = '';
        
        if(data && data.length > 0) {
            data.forEach(msg => this.renderMessageBubble(msg));
        } else {
            container.innerHTML = `<div class="text-center text-[10px] mt-10 font-bold opacity-30 uppercase bg-black/5 p-3 rounded-lg border border-black/10">Channel Established.<br>No Conversation History.</div>`;
        }
        this.scrollToBottom();
    },

    handleIncomingMessage(msg) {
        if (msg.receiver_nik === 'ALL') {
            if (this.activeChat === 'ALL') this.renderMessageBubble(msg); else this.showChatBadge();
        } else if (msg.receiver_nik === this.userNik) {
            if (this.activeChat === msg.sender_nik) this.renderMessageBubble(msg); else this.showChatBadge();
        }
    },

    async sendMessage(e) {
        if(e) e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim(); 
        if(!text || !this.activeChat) return;
        
        // Optimistic UI Update
        const tempMsg = { sender_nik: this.userNik, content: text, created_at: new Date().toISOString() };
        this.renderMessageBubble(tempMsg); 
        input.value = '';
        
        // Kirim
        await this.sb.from('messages').insert([{ sender_nik: this.userNik, receiver_nik: this.activeChat, content: text }]);
        this.scrollToBottom();
    },

    renderMessageBubble(msg) {
        const container = document.getElementById('chatMessages');
        const isMe = msg.sender_nik === this.userNik;
        
        // Bersihkan tulisan "Channel Established" jika ada chat masuk
        if(container.innerHTML.includes('Channel Established')) container.innerHTML = '';
        
        const div = document.createElement('div');
        div.className = `max-w-[85%] p-3 rounded-2xl mb-3 text-xs relative shadow-sm flex flex-col ${isMe ? 'self-end bg-blue-600 text-white rounded-br-sm' : 'self-start bg-white text-slate-700 border border-black/10 rounded-bl-sm'}`;
        
        div.innerHTML = `
            <span class="font-black text-[9px] uppercase mb-1 tracking-wider ${isMe ? 'text-blue-200' : 'warna-aksen'}">${isMe ? 'YOU' : msg.sender_nik}</span>
            <span class="leading-relaxed break-words font-medium">${msg.content}</span>
            <span class="text-[8px] text-right mt-1.5 opacity-60 font-mono font-bold">${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        `;
        
        container.appendChild(div); 
        this.scrollToBottom();
    },

    scrollToBottom() { 
        const c = document.getElementById('chatMessages'); 
        if(c) {
            // Gunakan setTimeout agar DOM sempat ter-render sebelum di-scroll
            setTimeout(() => { c.scrollTop = c.scrollHeight; }, 50);
        }
    },
    showChatBadge() { 
        const b = document.getElementById('chatBadge'); 
        if(b) { b.classList.remove('hidden'); b.classList.add('animate-bounce'); } 
    },

    // ==========================================
    // MODULE: ADMIN NOTIFICATIONS
    // ==========================================
    async loadNotifications() {
        const b = document.getElementById('notifBadge'), l = document.getElementById('notifList');
        if (!b || !l) return;

        const { data: r } = await this.sb.from('users').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        
        if (r && r.length > 0) { 
            b.classList.remove('hidden'); 
            l.innerHTML = r.map(q => `
                <div class="bg-white/50 p-4 rounded-xl border border-black/10 shadow-sm flex flex-col gap-3" id="req-${q.nik}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center warna-teks"><i class="fas fa-user-plus"></i></div>
                        <div><p class="text-sm font-black uppercase warna-teks">${q.full_name}</p><p class="text-[10px] opacity-50 font-mono font-bold">NIK: ${q.nik}</p></div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="Dash.handleRequest('${q.nik}', 'approve')" class="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-600 transition-colors shadow-sm">Accept</button>
                        <button onclick="Dash.handleRequest('${q.nik}', 'reject')" class="flex-1 py-2.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-colors">Reject</button>
                    </div>
                </div>
            `).join(''); 
        } else { 
            b.classList.add('hidden'); 
            l.innerHTML = `<div class="text-center py-10 opacity-30 text-xs font-black uppercase tracking-widest">No Pending<br>Requests</div>`; 
        }
    },

    async handleRequest(nik, act) {
        const el = document.getElementById(`req-${nik}`); 
        if(el) el.style.opacity = '0.5';
        
        if (act === 'approve') { 
            const { error } = await this.sb.from('users').update({ status: 'active' }).eq('nik', nik); 
            if (!error) { alert(`✅ User ${nik} Authorized!`); this.loadNotifications(); } 
        } else { 
            if(!confirm(`Tolak pendaftaran NIK: ${nik}?`)) { if(el) el.style.opacity = '1'; return; }
            const { error } = await this.sb.from('users').delete().eq('nik', nik); 
            if (!error) { alert(`🚫 User ${nik} Rejected.`); this.loadNotifications(); } 
        }
    }
};

window.onload = () => Dash.init();
