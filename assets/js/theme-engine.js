/* =========================================
   SUTRADARA VISUAL ENGINE & PARTICLES
   ========================================= */
const ThemeEngine = {
    init() {
        const theme = localStorage.getItem('appTheme') || 'mint';
        
        // Atur Panggung Belakang (Background Canvas)
        const mechaCanvas = document.getElementById('mecha-canvas');
        const bubbleCanvas = document.getElementById('bubble-canvas');

        if (theme === 'mint') {
            if(mechaCanvas) mechaCanvas.style.display = 'none';
            if(bubbleCanvas) bubbleCanvas.style.display = 'block';
        } else {
            if(mechaCanvas) mechaCanvas.style.display = 'block';
            if(bubbleCanvas) bubbleCanvas.style.display = 'none';
            // Nyalakan Scanner (Crosshair acak) hanya jika tema Mecha
            this.initScanner(); 
        }

        // Jalankan kedua mesin partikel (Mereka akan otomatis sembunyi sesuai tema)
        this.runMechaParticles();
        this.runMintBubbles();
    },

    initScanner() {
        const reticle = document.getElementById('target-reticle');
        const container = document.getElementById('scaler-context');
        if (!reticle || !container) return;

        const run = () => {
            const targets = document.querySelectorAll('.scan-target');
            if (targets.length === 0 || document.body.className !== 'tema-mecha') return;

            const chosen = targets[Math.floor(Math.random() * targets.length)];
            const rect = chosen.getBoundingClientRect();
            const cRect = container.getBoundingClientRect();
            
            const scale = rect.width / chosen.offsetWidth;

            reticle.style.left = `${(rect.left - cRect.left) / scale - 12}px`;
            reticle.style.top = `${(rect.top - cRect.top) / scale - 12}px`;
            reticle.style.width = `${chosen.offsetWidth + 24}px`;
            reticle.style.height = `${chosen.offsetHeight + 24}px`;
            
            reticle.classList.add('active');
            
            setTimeout(() => {
                reticle.classList.remove('active');
                setTimeout(run, Math.random() * 3000 + 2000); 
            }, 2000); 
        };

        setTimeout(run, 1500);
    },

    /* =========================================
       MESIN PARTIKEL 1: MECHA (BLUEPRINT & DATA NODES)
       ========================================= */
    runMechaParticles() {
        const canvas = document.getElementById('mecha-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height, particles = [];

        const resize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize); resize();

        class Node {
            constructor() {
                this.x = Math.random() * width; this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2.5 + 1.5;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.fillStyle = 'rgba(14, 165, 233, 0.8)'; // Cyan-500
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Ciptakan 60 titik data
        for (let i = 0; i < 60; i++) particles.push(new Node());

        const animate = () => {
            if (canvas.style.display === 'none') return requestAnimationFrame(animate); // Hemat baterai jika disembunyikan
            
            ctx.clearRect(0, 0, width, height);

            // 1. Gambar Kertas Cetak Biru (Grid)
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.03)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            for(let x = 0; x < width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
            for(let y = 0; y < height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

            // 2. Gambar Titik dan Garis Konstelasi Laser
            particles.forEach(p => { p.update(); p.draw(); });
            ctx.lineWidth = 1;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < 120) {
                        ctx.strokeStyle = `rgba(14, 165, 233, ${0.2 - dist/600})`; 
                        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        };
        animate();
    },

    /* =========================================
       MESIN PARTIKEL 2: MINT (FLOATING JELLY BUBBLES)
       ========================================= */
    runMintBubbles() {
        const canvas = document.getElementById('bubble-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height, bubbles = [];

        const resize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize); resize();

        class Bubble {
            constructor() {
                this.reset(true);
            }
            reset(randomY = false) {
                this.x = Math.random() * width;
                this.y = randomY ? Math.random() * height : height + 50;
                this.size = Math.random() * 30 + 10;
                this.speed = Math.random() * 1.5 + 0.3;
                this.wobble = Math.random() * Math.PI * 2;
                this.wobbleSpeed = Math.random() * 0.03 + 0.01;
            }
            update() {
                this.y -= this.speed;
                this.wobble += this.wobbleSpeed;
                this.x += Math.sin(this.wobble) * 0.5; // Bergoyang ke kiri-kanan secara natural
                
                if (this.y < -this.size - 10) this.reset(); // Muncul lagi dari bawah jika sudah lewat atas
            }
            draw() {
                // Dasar Gelembung (Emerald Pucat)
                ctx.fillStyle = 'rgba(16, 185, 129, 0.08)'; 
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
                
                // Pantulan Cahaya (Efek Kaca 3D)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath(); ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.2, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Ciptakan 25 Gelembung
        for (let i = 0; i < 25; i++) bubbles.push(new Bubble());

        const animate = () => {
            if (canvas.style.display === 'none') return requestAnimationFrame(animate); // Hemat baterai
            
            ctx.clearRect(0, 0, width, height);
            bubbles.forEach(b => { b.update(); b.draw(); });
            requestAnimationFrame(animate);
        };
        animate();
    }
};

window.addEventListener('DOMContentLoaded', () => ThemeEngine.init());
