/* ============================================
   数道 · 万象 — 交互式数学可视化引擎
   ============================================ */

(function () {
    'use strict';

    /* ===== 工具函数 ===== */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const rand = (min, max) => Math.random() * (max - min) + min;

    // 可见性检测：跳过视口外Canvas的绘制，大幅降低CPU占用
    function isInViewport(el, threshold = 150) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.bottom > -threshold && rect.top < (window.innerHeight + threshold) &&
               rect.right > -threshold && rect.left < (window.innerWidth + threshold);
    }

    function setupCanvas(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w: rect.width, h: rect.height };
    }

    /* ===== UI: 加载动画 ===== */
    window.addEventListener('load', () => {
        setTimeout(() => {
            $('#loader').classList.add('hidden');
        }, 1200);
    });

    /* ===== UI: 自定义光标 ===== */
    const cursorDot = $('#cursor-dot');
    const cursorRing = $('#cursor-ring');
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    function animateCursor() {
        ringX = lerp(ringX, mouseX, 0.15);
        ringY = lerp(ringY, mouseY, 0.15);
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, input, canvas, .proof-btn, .color-scheme, .toggle-btn')) {
            cursorRing.classList.add('expanded');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, input, canvas, .proof-btn, .color-scheme, .toggle-btn')) {
            cursorRing.classList.remove('expanded');
        }
    });

    /* ===== UI: 滚动进度 + 导航 ===== */
    const nav = $('#nav');
    const progressBar = $('#scroll-progress');
    const navLinks = $$('.nav-links a');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollY / docH) * 100;
        progressBar.style.width = progress + '%';

        if (scrollY > 60) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // 导航高亮
        const sections = $$('section, header');
        let current = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 100;
            if (scrollY >= top) current = sec.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    });

    // 移动端菜单
    const menuBtn = $('#navMenuBtn');
    const navLinksUl = $('.nav-links');
    menuBtn?.addEventListener('click', () => {
        navLinksUl.classList.toggle('mobile-open');
    });

    /* ===== UI: 滚动揭示 ===== */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    $$('.reveal').forEach(el => observer.observe(el));

    /* ===== UI: 标题字符动画延迟 ===== */
    $$('.title-char').forEach(char => {
        const delay = parseInt(char.dataset.delay) || 0;
        char.style.animationDelay = (delay * 0.15) + 's';
    });

    /* ===================================================
       模块一：数学曲线动态背景
       极坐标玫瑰线 + 利萨如曲线 + 参数方程网格，随鼠标交互
       =================================================== */
    (function initTaiji() {
        const canvas = $('#taiji-canvas');
        if (!canvas) return;
        const { ctx, w, h } = setupCanvas(canvas);
        let angle = 0;
        let mouseInfluence = { x: 0, y: 0 };
        let targetInfluence = { x: 0, y: 0 };
        const particles = [];

        // 背景粒子
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: rand(0, w),
                y: rand(0, h),
                vx: rand(-0.3, 0.3),
                vy: rand(-0.3, 0.3),
                r: rand(0.5, 2),
                opacity: rand(0.1, 0.4)
            });
        }

        document.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            if (e.clientY < rect.bottom) {
                targetInfluence.x = (e.clientX - rect.left - w / 2) / w;
                targetInfluence.y = (e.clientY - rect.top - h / 2) / h;
            }
        });

        function draw() {
            if (!isInViewport(canvas)) { requestAnimationFrame(draw); return; }
            ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
            ctx.fillRect(0, 0, w, h);

            mouseInfluence.x = lerp(mouseInfluence.x, targetInfluence.x, 0.05);
            mouseInfluence.y = lerp(mouseInfluence.y, targetInfluence.y, 0.05);

            // 背景粒子
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 165, 116, ${p.opacity})`;
                ctx.fill();
            });

            const cx = w / 2 + mouseInfluence.x * 30;
            const cy = h / 2 + mouseInfluence.y * 30;
            const radius = Math.min(w, h) * 0.18;

            // 外层光环
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius * (1.3 + i * 0.3), 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(212, 165, 116, ${0.06 - i * 0.015})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // 极坐标网格辅助线
            ctx.save();
            ctx.translate(cx, cy);
            ctx.strokeStyle = 'rgba(212, 165, 116, 0.05)';
            ctx.lineWidth = 0.5;
            for (let i = 1; i <= 4; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.5 * i, 0, Math.PI * 2);
                ctx.stroke();
            }
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * radius * 2, Math.sin(a) * radius * 2);
                ctx.stroke();
            }
            ctx.restore();

            // 主玫瑰线 r = R·cos(k·θ)，k 随时间变化
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle * 0.3);
            ctx.beginPath();
            const roseRadius = radius * 1.8;
            const k = 5;
            for (let t = 0; t <= Math.PI * 2; t += 0.005) {
                const r = roseRadius * Math.cos(k * t);
                const px = r * Math.cos(t);
                const py = r * Math.sin(t);
                if (t === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = 'rgba(192, 57, 43, 0.25)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();

            // 内层利萨如曲线 (3:4 频率比)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.beginPath();
            const lissaR = radius * 0.9;
            for (let t = 0; t <= Math.PI * 2; t += 0.01) {
                const px = lissaR * Math.sin(3 * t + angle * 2);
                const py = lissaR * Math.sin(4 * t);
                if (t === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // 中心发光点
            ctx.save();
            ctx.translate(cx, cy);
            const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.2);
            centerGrad.addColorStop(0, 'rgba(212, 165, 116, 0.4)');
            centerGrad.addColorStop(1, 'rgba(212, 165, 116, 0)');
            ctx.fillStyle = centerGrad;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            angle += 0.003;
            requestAnimationFrame(draw);
        }
        draw();

        // 窗口resize
        window.addEventListener('resize', () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        });
    })();

    /* ===================================================
       模块二：分形之树 — L-System 递归分形
       L-system 递归分形，支持风吹效果
       =================================================== */
    (function initFractalTree() {
        const canvas = $('#fractal-tree-canvas');
        if (!canvas) return;
        let { ctx, w, h } = setupCanvas(canvas);
        let depth = 10;
        let angle = 25;
        let ratio = 0.72;
        let windOn = true;
        let windPhase = 0;
        let time = 0;

        const depthSlider = $('#tree-depth');
        const angleSlider = $('#tree-angle');
        const ratioSlider = $('#tree-ratio');
        const windBtn = $('#tree-wind');

        depthSlider.addEventListener('input', (e) => {
            depth = +e.target.value;
            $('#tree-depth-val').textContent = depth;
            updateInfo();
        });
        angleSlider.addEventListener('input', (e) => {
            angle = +e.target.value;
            $('#tree-angle-val').textContent = angle + '°';
        });
        ratioSlider.addEventListener('input', (e) => {
            ratio = +e.target.value / 100;
            $('#tree-ratio-val').textContent = ratio.toFixed(2);
        });
        windBtn.addEventListener('click', () => {
            windOn = !windOn;
            windBtn.classList.toggle('active', windOn);
            windBtn.textContent = windOn ? '风 起' : '风 止';
        });

        function updateInfo() {
            const branches = Math.pow(2, depth) - 1;
            $('#tree-branch-count').textContent = branches;
            // 分形维数近似
            const dim = Math.log(2) / Math.log(1 / ratio);
            $('#tree-fractal-dim').textContent = '≈ ' + dim.toFixed(2);
        }
        updateInfo();

        function drawBranch(x, y, len, ang, d) {
            if (d <= 0 || len < 1) return;

            const wind = windOn ? Math.sin(time * 0.001 + d * 0.5 + windPhase) * (12 - d) * 0.08 : 0;
            const actualAngle = ang + wind;

            const x2 = x + Math.cos(actualAngle) * len;
            const y2 = y + Math.sin(actualAngle) * len;

            // 渐变颜色：根部深，枝头浅
            const t = 1 - d / depth;
            const r = Math.round(lerp(138, 212, t));
            const g = Math.round(lerp(90, 165, t));
            const b = Math.round(lerp(50, 116, t));

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = Math.max(0.5, d * 0.8);
            ctx.lineCap = 'round';
            ctx.stroke();

            // 末梢叶子
            if (d <= 2) {
                ctx.beginPath();
                ctx.arc(x2, y2, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 165, 116, ${0.3 + t * 0.4})`;
                ctx.fill();
            }

            const rad = angle * Math.PI / 180;
            drawBranch(x2, y2, len * ratio, actualAngle - rad, d - 1);
            drawBranch(x2, y2, len * ratio, actualAngle + rad, d - 1);
        }

        function draw() {
            if (!isInViewport(canvas)) { requestAnimationFrame(draw); return; }
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(0, 0, w, h);

            // 水墨纹理背景
            const grad = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h);
            grad.addColorStop(0, 'rgba(212, 165, 116, 0.03)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            const startLen = Math.min(w, h) * 0.15;
            drawBranch(w / 2, h * 0.95, startLen, -Math.PI / 2, depth);

            windPhase += 0.02;
            time++;
            requestAnimationFrame(draw);
        }
        draw();

        window.addEventListener('resize', () => {
            ({ ctx, w, h } = setupCanvas(canvas));
        });
    })();

    /* ===================================================
       模块三：勾股之理 — 勾股定理动态证明
       赵爽弦图 / 面积割补 / 相似比例
       =================================================== */
    (function initGougu() {
        const canvas = $('#gougu-canvas');
        if (!canvas) return;
        let { ctx, w, h } = setupCanvas(canvas);
        let proofMode = 'zhaoshuang';
        let gou = 3, gu = 4;
        let animPhase = 0;

        $$('.proof-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.proof-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                proofMode = btn.dataset.proof;
                animPhase = 0;
            });
        });

        $('#gou').addEventListener('input', (e) => {
            gou = +e.target.value;
            $('#gou-val').textContent = gou;
            updateInfo();
        });
        $('#gu').addEventListener('input', (e) => {
            gu = +e.target.value;
            $('#gu-val').textContent = gu;
            updateInfo();
        });

        function updateInfo() {
            const xian = Math.sqrt(gou * gou + gu * gu);
            $('#xian-val').textContent = xian.toFixed(2);
            $('#sum-squares').textContent = (gou * gou + gu * gu).toFixed(2);
            $('#xian-square').textContent = (xian * xian).toFixed(2);
        }
        updateInfo();

        function drawZhaoshuang() {
            const cx = w / 2, cy = h / 2;
            const scale = Math.min(w, h) * 0.06;
            const a = gou * scale, b = gu * scale;
            const halfDiag = Math.sqrt(a * a + b * b) / 2;

            // 弦图：4个直角三角形围成大正方形，中间是小正方形
            ctx.save();
            ctx.translate(cx, cy);

            const rotation = Math.sin(animPhase * 0.02) * 0.3;
            ctx.rotate(rotation);

            // 大正方形（弦²）
            ctx.beginPath();
            ctx.rect(-halfDiag, -halfDiag, halfDiag * 2, halfDiag * 2);
            ctx.fillStyle = 'rgba(192, 57, 43, 0.06)';
            ctx.fill();
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 4个直角三角形
            const triColors = [
                'rgba(212, 165, 116, 0.3)',
                'rgba(92, 138, 138, 0.3)',
                'rgba(192, 57, 43, 0.2)',
                'rgba(155, 89, 182, 0.2)'
            ];

            const corners = [
                [-halfDiag, -halfDiag],
                [halfDiag, -halfDiag],
                [halfDiag, halfDiag],
                [-halfDiag, halfDiag]
            ];

            for (let i = 0; i < 4; i++) {
                const [x1, y1] = corners[i];
                const [x2, y2] = corners[(i + 1) % 4];
                // 三角形顶点
                let px, py;
                if (i === 0) { px = x1 + b; py = y1; }
                else if (i === 1) { px = x2; py = y2 + b; }
                else if (i === 2) { px = x2 - b; py = y2; }
                else { px = x1; py = y1 - b; }

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(px, py);
                ctx.closePath();
                ctx.fillStyle = triColors[i];
                ctx.fill();
                ctx.strokeStyle = '#d4a574';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // 中间小正方形 (边长 = |a-b|)
            const smallSide = Math.abs(b - a);
            ctx.beginPath();
            ctx.rect(-smallSide / 2, -smallSide / 2, smallSide, smallSide);
            ctx.fillStyle = 'rgba(212, 165, 116, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 标注
            ctx.fillStyle = '#1a1a2e';
            ctx.font = '12px "Noto Sans SC"';
            ctx.textAlign = 'center';
            ctx.fillText(`勾²=${(a * a / scale / scale).toFixed(0)}`, -halfDiag * 0.5, halfDiag * 0.5);
            ctx.fillText(`股²=${(b * b / scale / scale).toFixed(0)}`, halfDiag * 0.5, -halfDiag * 0.5);

            ctx.restore();

            // 公式
            ctx.fillStyle = '#c0392b';
            ctx.font = 'bold 16px "Noto Serif SC"';
            ctx.textAlign = 'center';
            ctx.fillText(`勾² + 股² = 弦² → ${gou}² + ${gu}² = ${Math.sqrt(gou*gou+gu*gu).toFixed(2)}²`, cx, h - 30);
        }

        function drawArea() {
            const cx = w / 2, cy = h / 2;
            const scale = Math.min(w, h) * 0.05;
            const a = gou * scale, b = gu * scale;
            const xian = Math.sqrt(a * a + b * b);

            ctx.save();
            ctx.translate(cx - b, cy - a / 2 - 40);

            // 左侧：正方形(a²+b²)分解为两个正方形和两个矩形
            // 大正方形 a+b
            const big = a + b;
            ctx.beginPath();
            ctx.rect(0, 0, big, big);
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 分割线
            ctx.beginPath();
            ctx.moveTo(a, 0); ctx.lineTo(a, big);
            ctx.moveTo(0, a); ctx.lineTo(big, a);
            ctx.strokeStyle = 'rgba(192, 57, 43, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 填色
            ctx.fillStyle = 'rgba(212, 165, 116, 0.2)';
            ctx.fillRect(0, 0, a, a); // a²
            ctx.fillStyle = 'rgba(92, 138, 138, 0.2)';
            ctx.fillRect(a, a, b, b); // b²
            ctx.fillStyle = 'rgba(192, 57, 43, 0.15)';
            ctx.fillRect(a, 0, b, a);
            ctx.fillRect(0, a, a, b);

            // 右侧：重组为弦²
            const offsetX = big + 30;
            const rotateAngle = Math.atan2(a, b) + Math.sin(animPhase * 0.02) * 0.1;

            ctx.save();
            ctx.translate(offsetX + xian / 2, big / 2);
            ctx.rotate(rotateAngle);

            // 弦正方形
            ctx.beginPath();
            ctx.rect(-xian / 2, -xian / 2, xian, xian);
            ctx.fillStyle = 'rgba(212, 165, 116, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 内部4个三角形
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(-xian / 2, -xian / 2);
                ctx.lineTo(xian / 2, -xian / 2);
                ctx.lineTo(-xian / 2 + b, -xian / 2 + a);
                ctx.closePath();
                ctx.fillStyle = ['rgba(212,165,116,0.2)', 'rgba(92,138,138,0.2)', 'rgba(192,57,43,0.15)', 'rgba(155,89,182,0.15)'][i];
                ctx.fill();
                ctx.strokeStyle = '#d4a574';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
            ctx.restore();

            // 箭头
            ctx.fillStyle = '#d4a574';
            ctx.font = '20px "Noto Serif SC"';
            ctx.textAlign = 'center';
            ctx.fillText('→', cx, cy + 20);

            ctx.fillStyle = '#1a1a2e';
            ctx.font = '13px "Noto Sans SC"';
            ctx.fillText('面积割补：四个直角三角形可重组', cx, h - 30);
        }

        function drawSimilar() {
            const cx = w / 2, cy = h / 2 + 30;
            const scale = Math.min(w, h) * 0.06;
            const a = gou * scale, b = gu * scale;
            const xian = Math.sqrt(a * a + b * b);

            // 直角三角形
            const tx = cx - b / 2, ty = cy + a / 2;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + b, ty);
            ctx.lineTo(tx + b, ty - a);
            ctx.closePath();
            ctx.fillStyle = 'rgba(212, 165, 116, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 作高线
            const hx = tx + b, hy = ty - a;
            const angleC = Math.atan2(a, b);
            const footX = tx + (a * a) / xian * Math.cos(angleC);
            const footY = ty - (a * a) / xian * Math.sin(angleC);

            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(footX, footY);
            ctx.strokeStyle = '#d4a574';
            ctx.setLineDash([5, 3]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // 三个相似三角形标注
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 13px "Noto Serif SC"';
            ctx.textAlign = 'center';
            ctx.fillText('△ABC', tx + b / 2, ty + 18);
            ctx.fillText('△ACH', tx + (footX - tx) / 2, ty - (ty - footY) / 2 + 15);
            ctx.fillText('△BCH', (footX + hx) / 2, (footY + hy) / 2 + 15);

            // 标注边
            ctx.font = '11px "Noto Sans SC"';
            ctx.fillStyle = '#c0392b';
            ctx.fillText(`股=${gu}`, tx + b / 2, ty - 5);
            ctx.fillText(`勾=${gou}`, tx + b + 10, ty - a / 2);
            ctx.fillText(`弦=${Math.sqrt(gou*gou+gu*gu).toFixed(2)}`, tx + b / 2 - 15, ty - a / 2 - 15);

            // 相似关系
            ctx.fillStyle = '#1a1a2e';
            ctx.font = '13px "Noto Sans SC"';
            ctx.fillText('△ABC ∽ △ACH ∽ △BCH', cx, h - 45);
            ctx.fillText(`→ 勾² = 弦·CH, 股² = 弦·BH, 故 勾²+股² = 弦²`, cx, h - 25);
        }

        function draw() {
            if (!isInViewport(canvas)) { requestAnimationFrame(draw); return; }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            if (proofMode === 'zhaoshuang') drawZhaoshuang();
            else if (proofMode === 'area') drawArea();
            else drawSimilar();

            animPhase++;
            requestAnimationFrame(draw);
        }
        draw();

        window.addEventListener('resize', () => {
            ({ ctx, w, h } = setupCanvas(canvas));
        });
    })();

    /* ===================================================
       模块四：割圆求π — 刘徽割圆术
       内接+外切多边形逼近圆周率
       =================================================== */
    (function initGeyuan() {
        const canvas = $('#geyuan-canvas');
        if (!canvas) return;
        let { ctx, w, h } = setupCanvas(canvas);
        let sides = 96;
        let animSides = 6;
        let animating = false;
        let animTarget = 6;

        const sidesSlider = $('#geyuan-sides');
        const animateBtn = $('#geyuan-animate');

        sidesSlider.addEventListener('input', (e) => {
            sides = +e.target.value;
            $('#geyuan-sides-val').textContent = sides;
            if (!animating) animSides = sides;
            updateInfo();
        });

        animateBtn.addEventListener('click', () => {
            if (animating) return;
            animating = true;
            animSides = 6;
            animTarget = sides;
            animateStep();
        });

        function animateStep() {
            if (animSides < animTarget) {
                animSides = Math.min(animSides + Math.max(1, Math.floor((animTarget - animSides) / 10)), animTarget);
                updateInfo();
                setTimeout(animateStep, 80);
            } else {
                animating = false;
            }
        }

        function calcPi(n) {
            const inner = n * Math.sin(Math.PI / n);
            const outer = n * Math.tan(Math.PI / n);
            return (inner + outer) / 2;
        }

        function updateInfo() {
            const n = animating ? animSides : sides;
            const pi = calcPi(n);
            const error = Math.abs(pi - Math.PI) / Math.PI * 100;
            $('#geyuan-pi').textContent = pi.toFixed(10);
            $('#geyuan-error').textContent = error < 0.0001 ? '<0.0001%' : error.toFixed(4) + '%';
        }
        updateInfo();

        function draw() {
            if (!isInViewport(canvas)) { requestAnimationFrame(draw); return; }
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(0, 0, w, h);

            const cx = w / 2, cy = h / 2;
            const radius = Math.min(w, h) * 0.35;
            const n = animating ? animSides : sides;

            // 外切多边形
            ctx.beginPath();
            const outerR = radius / Math.cos(Math.PI / n);
            for (let i = 0; i <= n; i++) {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                const px = cx + outerR * Math.cos(a);
                const py = cy + outerR * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = 'rgba(192, 57, 43, 0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 圆
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 内接多边形
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                const px = cx + radius * Math.cos(a);
                const py = cy + radius * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(212, 165, 116, 0.06)';
            ctx.fill();
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 顶点
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                const px = cx + radius * Math.cos(a);
                const py = cy + radius * Math.sin(a);
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#d4a574';
                ctx.fill();
            }

            // 中心连线
            ctx.beginPath();
            for (let i = 0; i < Math.min(n, 8); i++) {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
            }
            ctx.strokeStyle = 'rgba(212, 165, 116, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // 标注
            ctx.fillStyle = '#d4a574';
            ctx.font = 'bold 16px "Noto Serif SC"';
            ctx.textAlign = 'center';
            ctx.fillText(`正 ${n} 边形`, cx, h - 50);

            ctx.fillStyle = '#c9d1d9';
            ctx.font = '13px "Noto Sans SC"';
            const pi = calcPi(n);
            ctx.fillText(`π ≈ ${pi.toFixed(10)}`, cx, h - 25);

            requestAnimationFrame(draw);
        }
        draw();

        window.addEventListener('resize', () => {
            ({ ctx, w, h } = setupCanvas(canvas));
        });
    })();

    /* ===================================================
       模块五：曼德博集合 — 交互式分形探索
       支持缩放、平移、配色切换
       =================================================== */
    (function initMandelbrot() {
        const canvas = $('#mandelbrot-canvas');
        if (!canvas) return;

        // 不使用DPR放大，用CSS尺寸直接渲染，大幅减少像素量
        const rect = canvas.parentElement.getBoundingClientRect();
        const cw = Math.floor(rect.width);
        const ch = Math.floor(rect.height);
        canvas.width = cw;
        canvas.height = ch;
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
        const ctx = canvas.getContext('2d');

        let centerX = -0.5, centerY = 0;
        let zoom = 1;
        let maxIter = 120;
        let colorScheme = 0;
        let isDragging = false;
        let isAdjusting = false; // 滑块拖动中
        let dragStart = { x: 0, y: 0 };
        let dragCenter = { x: 0, y: 0 };
        let renderQuality = 1; // 拖动时降至0.4
        let pendingHighRender = false;
        let pendingPreviewRender = false;

        const PREVIEW_QUALITY = 0.25;   // 滑块/拖动时的预览质量
        const PREVIEW_ITER = 50;         // 预览时的迭代上限

        const schemes = [
            (t) => {
                const r = Math.round(9 * (1 - t) * t * t * t * 255);
                const g = Math.round(15 * (1 - t) * (1 - t) * t * t * 255);
                const b = Math.round(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
                return [r, g, b];
            },
            (t) => {
                const r = Math.round(255 * Math.pow(t, 0.3));
                const g = Math.round(60 * t);
                const b = Math.round(40 * (1 - t));
                return [r, g, b];
            },
            (t) => {
                const r = Math.round(46 * t);
                const g = Math.round(204 * Math.pow(t, 0.5));
                const b = Math.round(113 * t);
                return [r, g, b];
            },
            (t) => {
                const r = Math.round(155 * t);
                const g = Math.round(89 * Math.pow(t, 0.7));
                const b = Math.round(182 * Math.pow(t, 0.4));
                return [r, g, b];
            }
        ];

        function render(quality) {
            quality = quality || renderQuality;
            const rw = Math.max(1, Math.floor(canvas.width * quality));
            const rh = Math.max(1, Math.floor(canvas.height * quality));
            const imgData = ctx.createImageData(rw, rh);
            const data = imgData.data;
            const scale = 3.0 / (zoom * Math.min(rw, rh));
            const scheme = schemes[colorScheme];
            const effectiveIter = isDragging ? Math.min(maxIter, PREVIEW_ITER) : maxIter;

            for (let py = 0; py < rh; py++) {
                for (let px = 0; px < rw; px++) {
                    const x0 = centerX + (px - rw / 2) * scale;
                    const y0 = centerY + (py - rh / 2) * scale;
                    let x = 0, y = 0, iter = 0;
                    while (x * x + y * y < 4 && iter < effectiveIter) {
                        const xt = x * x - y * y + x0;
                        y = 2 * x * y + y0;
                        x = xt;
                        iter++;
                    }

                    const idx = (py * rw + px) * 4;
                    if (iter === effectiveIter) {
                        data[idx] = 10; data[idx + 1] = 10; data[idx + 2] = 15;
                    } else {
                        // 平滑着色
                        const t = (iter + 1 - Math.log2(Math.log2(x * x + y * y))) / effectiveIter;
                        const tc = clamp(t, 0, 1);
                        const [r, g, b] = scheme(tc);
                        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b;
                    }
                    data[idx + 3] = 255;
                }
            }

            // 缩放绘制到canvas
            ctx.imageSmoothingEnabled = quality < 1;
            ctx.putImageData(imgData, 0, 0);
            if (quality < 1) {
                // 通过临时canvas放大
                const tmp = document.createElement('canvas');
                tmp.width = rw; tmp.height = rh;
                tmp.getContext('2d').putImageData(imgData, 0, 0);
                ctx.imageSmoothingEnabled = true;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
            }
            updateInfo();
        }

        function scheduleHighRender() {
            if (pendingHighRender) return;
            pendingHighRender = true;
            requestAnimationFrame(() => {
                pendingHighRender = false;
                renderQuality = 1;
                render(1);
            });
        }

        function updateInfo() {
            $('#mandelbrot-zoom').textContent = zoom < 1000 ? zoom.toFixed(1) + '×' : zoom.toExponential(2) + '×';
            $('#mandelbrot-coord').textContent = `(${centerX.toFixed(6)}, ${centerY.toFixed(6)})`;
        }

        // 滚轮缩放
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const scale = 3.0 / (zoom * Math.min(canvas.width, canvas.height));
            const wx = centerX + (mx - canvas.width / 2) * scale;
            const wy = centerY + (my - canvas.height / 2) * scale;

            const factor = e.deltaY < 0 ? 1.4 : 1 / 1.4;
            zoom *= factor;
            zoom = clamp(zoom, 0.5, 1e14);

            const newScale = 3.0 / (zoom * Math.min(canvas.width, canvas.height));
            centerX = wx - (mx - canvas.width / 2) * newScale;
            centerY = wy - (my - canvas.height / 2) * newScale;

            render(0.5);
            scheduleHighRender();
        }, { passive: false });

        // 拖动平移
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStart = { x: e.clientX, y: e.clientY };
            dragCenter = { x: centerX, y: centerY };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            const scale = 3.0 / (zoom * Math.min(canvas.width, canvas.height));
            centerX = dragCenter.x - dx * scale;
            centerY = dragCenter.y - dy * scale;
            render(0.35);
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                scheduleHighRender();
            }
        });

        canvas.addEventListener('dblclick', () => {
            centerX = -0.5; centerY = 0; zoom = 1;
            render(1);
        });

        $('#mandelbrot-iter').addEventListener('input', (e) => {
            maxIter = +e.target.value;
            $('#mandelbrot-iter-val').textContent = maxIter;
            isAdjusting = true;
            // 用 rAF 节流：多次 input 只渲染一次预览
            if (pendingPreviewRender) return;
            pendingPreviewRender = true;
            requestAnimationFrame(() => {
                pendingPreviewRender = false;
                if (!isAdjusting) return; // 已被 change 接管
                render(PREVIEW_QUALITY);
            });
        });

        $('#mandelbrot-iter').addEventListener('change', () => {
            // 松手后渲染高质量
            isAdjusting = false;
            render(1);
        });

        $$('.color-scheme').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.color-scheme').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                colorScheme = +btn.dataset.scheme;
                render(1);
            });
        });

        $('#mandelbrot-reset').addEventListener('click', () => {
            centerX = -0.5; centerY = 0; zoom = 1;
            render(1);
        });

        // 初始渲染
        render(1);

        window.addEventListener('resize', () => {
            const rect2 = canvas.parentElement.getBoundingClientRect();
            canvas.width = Math.floor(rect2.width);
            canvas.height = Math.floor(rect2.height);
            canvas.style.width = rect2.width + 'px';
            canvas.style.height = rect2.height + 'px';
            render(1);
        });
    })();

    /* ===================================================
       模块六：黄金螺旋 — 斐波那契数列可视化
       动画演示数列展开与黄金螺旋
       =================================================== */
    (function initFibonacci() {
        const canvas = $('#fibonacci-canvas');
        if (!canvas) return;
        let { ctx, w, h } = setupCanvas(canvas);
        let playing = false;
        let currentN = 1;
        let animProgress = 0;
        let sequence = [];

        function fib(n) {
            if (n <= 0) return 0;
            if (n <= 2) return 1;
            let a = 1, b = 1;
            for (let i = 3; i <= n; i++) {
                [a, b] = [b, a + b];
            }
            return b;
        }

        function drawStatic() {
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(0, 0, w, h);

            const cx = w / 2, cy = h / 2;
            const baseScale = Math.min(w, h) * 0.008;

            // 斐波那契数列
            const fibs = [1, 1];
            for (let i = 2; i < 20; i++) {
                fibs.push(fibs[i - 1] + fibs[i - 2]);
                if (fibs[i] * baseScale > Math.min(w, h) * 0.42) {
                    fibs.pop();
                    break;
                }
            }

            // 边界跟踪法计算方块位置
            let leftX = 0, rightX = 1, topY = 0, bottomY = 1;
            let dir = 0; // 0:右 1:下 2:左 3:上
            const squares = [{ x: 0, y: 0, size: 1, dir: 0, n: 1, value: 1 }];

            for (let i = 1; i < fibs.length; i++) {
                const size = fibs[i];
                let sx, sy;
                if (dir === 0) { sx = rightX; sy = topY; rightX += size; }
                else if (dir === 1) { sx = leftX; sy = bottomY; bottomY += size; }
                else if (dir === 2) { sx = leftX - size; sy = topY; leftX -= size; }
                else { sx = leftX; sy = topY - size; topY -= size; }
                squares.push({ x: sx, y: sy, size, dir, n: i + 1, value: size });
                dir = (dir + 1) % 4;
            }

            // 居中偏移
            const offX = cx - (leftX + rightX) / 2 * baseScale;
            const offY = cy - (topY + bottomY) / 2 * baseScale;

            const visibleCount = playing ? Math.min(Math.floor(animProgress), squares.length) : squares.length;

            // 画正方形
            for (let i = 0; i < visibleCount; i++) {
                const sq = squares[i];
                const sx = offX + sq.x * baseScale;
                const sy = offY + sq.y * baseScale;
                const ss = sq.size * baseScale;

                ctx.beginPath();
                ctx.rect(sx, sy, ss, ss);
                ctx.strokeStyle = `rgba(212, 165, 116, ${0.15 + (i / squares.length) * 0.3})`;
                ctx.lineWidth = 1;
                ctx.stroke();

                if (ss > 20) {
                    ctx.fillStyle = 'rgba(212, 165, 116, 0.5)';
                    ctx.font = `${Math.min(ss * 0.3, 14)}px "Noto Serif SC"`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(sq.value, sx + ss / 2, sy + ss / 2);
                }
            }

            // 画黄金螺旋
            ctx.beginPath();
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 2.5;
            let started = false;

            for (let i = 0; i < visibleCount; i++) {
                const sq = squares[i];
                const sx = offX + sq.x * baseScale;
                const sy = offY + sq.y * baseScale;
                const ss = sq.size * baseScale;

                // 每个方块内1/4圆弧（顺时针螺旋）
                let arcCx, arcCy, startAngle, endAngle;
                if (sq.dir === 0) { arcCx = sx; arcCy = sy + ss; startAngle = -Math.PI / 2; endAngle = 0; }
                else if (sq.dir === 1) { arcCx = sx; arcCy = sy; startAngle = 0; endAngle = Math.PI / 2; }
                else if (sq.dir === 2) { arcCx = sx + ss; arcCy = sy; startAngle = Math.PI / 2; endAngle = Math.PI; }
                else { arcCx = sx + ss; arcCy = sy + ss; startAngle = Math.PI; endAngle = Math.PI * 1.5; }

                // 动画时的部分弧
                let actualEnd = endAngle;
                if (playing && i === Math.floor(animProgress) - 1 && i === visibleCount - 1) {
                    const frac = animProgress - Math.floor(animProgress);
                    actualEnd = startAngle + (endAngle - startAngle) * frac;
                }

                if (!started) {
                    ctx.moveTo(arcCx + ss * Math.cos(startAngle), arcCy + ss * Math.sin(startAngle));
                    started = true;
                }
                ctx.arc(arcCx, arcCy, ss, startAngle, actualEnd);
            }
            ctx.stroke();

            // 更新信息
            if (visibleCount > 0) {
                const lastN = squares[Math.min(visibleCount, squares.length) - 1]?.n || 1;
                const curFib = fib(lastN);
                const prevFib = fib(lastN - 1);
                $('#fib-current').textContent = curFib;
                $('#fib-ratio').textContent = prevFib > 0 ? (curFib / prevFib).toFixed(8) : '—';
            }
        }

        function updateSequence() {
            const container = $('#fib-sequence');
            container.innerHTML = '';
            const count = playing ? Math.min(Math.floor(animProgress), 12) : 8;
            for (let i = 1; i <= count; i++) {
                const span = document.createElement('span');
                span.textContent = fib(i);
                container.appendChild(span);
            }
        }

        $('#fibonacci-play').addEventListener('click', function() {
            if (playing) return;
            playing = true;
            animProgress = 0;
            this.textContent = '演 化 中';
            this.style.opacity = '0.5';
            
            function step() {
                animProgress += 0.05;
                drawStatic();
                updateSequence();
                if (animProgress < 12) {
                    requestAnimationFrame(step);
                } else {
                    playing = false;
                    const btn = $('#fibonacci-play');
                    btn.textContent = '演 化';
                    btn.style.opacity = '1';
                }
            }
            step();
        });

        drawStatic();
        updateSequence();

        window.addEventListener('resize', () => {
            ({ ctx, w, h } = setupCanvas(canvas));
            drawStatic();
        });
    })();

    /* ===================================================
       模块七：排序算法 — 四种经典排序可视化
       冒泡/快速/归并/堆排序，水墨风格
       =================================================== */
    (function initSort() {
        const canvas = $('#sort-canvas');
        if (!canvas) return;
        let { ctx, w, h } = setupCanvas(canvas);
        let arr = [];
        let size = 60;
        let speed = 3;
        let sortType = 'bubble';
        let running = false;
        let comparisons = 0, swaps = 0;
        let highlights = new Set();
        let sorted = new Set();

        const speedLabels = { 1: '极慢', 2: '慢', 3: '中', 4: '快', 5: '极快' };
        const complexities = {
            bubble: 'O(n²)',
            quick: 'O(n log n)',
            merge: 'O(n log n)',
            heap: 'O(n log n)'
        };

        const pseudocodes = {
            bubble: 'for i ← 0 to n-1:\n  for j ← 0 to n-2-i:\n    if arr[j] > arr[j+1]:\n      swap(arr[j], arr[j+1])',
            quick: 'quickSort(lo, hi):\n  if lo ≥ hi: return\n  pivot ← arr[hi]\n  i ← lo - 1\n  for j ← lo to hi-1:\n    if arr[j] < pivot:\n      i++; swap(arr[i],arr[j])\n  swap(arr[i+1], arr[hi])\n  quickSort(lo, i)\n  quickSort(i+2, hi)',
            merge: 'mergeSort(lo, hi):\n  if lo ≥ hi: return\n  mid ← (lo+hi)/2\n  mergeSort(lo, mid)\n  mergeSort(mid+1, hi)\n  merge(lo, mid, hi)\n───\nmerge: 双指针归并\ntemp[] → copy back',
            heap: 'heapSort():\n  build max-heap\n  for i ← n-1 down to 1:\n    swap(arr[0], arr[i])\n    heapify(i, 0)\n───\nheapify(n, i):\n  largest ← i\n  compare with left/right child\n  if largest ≠ i: swap & recurse'
        };

        function updatePseudocode() {
            $('#sort-pseudocode').textContent = pseudocodes[sortType];
        }
        updatePseudocode();

        function generateArray() {
            arr = [];
            for (let i = 0; i < size; i++) {
                arr.push(rand(10, 100));
            }
            comparisons = 0; swaps = 0;
            highlights.clear();
            sorted.clear();
            updateStats();
            draw();
        }

        function updateStats() {
            $('#sort-comparisons').textContent = comparisons;
            $('#sort-swaps').textContent = swaps;
            $('#sort-complexity').textContent = complexities[sortType];
        }

        function sleep(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        function getDelay() {
            return { 1: 80, 2: 40, 3: 15, 4: 5, 5: 1 }[speed];
        }

        async function bubbleSort() {
            for (let i = 0; i < arr.length - 1; i++) {
                for (let j = 0; j < arr.length - 1 - i; j++) {
                    if (!running) return;
                    highlights.clear();
                    highlights.add(j);
                    highlights.add(j + 1);
                    comparisons++;
                    updateStats();
                    draw();
                    await sleep(getDelay());
                    if (arr[j] > arr[j + 1]) {
                        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                        swaps++;
                        updateStats();
                        draw();
                        await sleep(getDelay());
                    }
                }
                sorted.add(arr.length - 1 - i);
            }
            sorted.add(0);
        }

        async function quickSort(lo, hi) {
            if (lo >= hi || !running) return;
            const pivot = arr[hi];
            let i = lo - 1;
            for (let j = lo; j < hi; j++) {
                if (!running) return;
                highlights.clear();
                highlights.add(j);
                highlights.add(hi);
                comparisons++;
                updateStats();
                draw();
                await sleep(getDelay());
                if (arr[j] < pivot) {
                    i++;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    swaps++;
                    draw();
                    await sleep(getDelay());
                }
            }
            [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
            swaps++;
            draw();
            await sleep(getDelay());
            const p = i + 1;
            sorted.add(p);
            await quickSort(lo, p - 1);
            await quickSort(p + 1, hi);
        }

        async function mergeSort(lo, hi) {
            if (lo >= hi || !running) return;
            const mid = Math.floor((lo + hi) / 2);
            await mergeSort(lo, mid);
            await mergeSort(mid + 1, hi);
            await merge(lo, mid, hi);
        }

        async function merge(lo, mid, hi) {
            const temp = [];
            let i = lo, j = mid + 1;
            while (i <= mid && j <= hi) {
                if (!running) return;
                highlights.clear();
                highlights.add(i);
                highlights.add(j);
                comparisons++;
                updateStats();
                draw();
                await sleep(getDelay());
                if (arr[i] <= arr[j]) {
                    temp.push(arr[i++]);
                } else {
                    temp.push(arr[j++]);
                }
            }
            while (i <= mid) temp.push(arr[i++]);
            while (j <= hi) temp.push(arr[j++]);
            for (let k = 0; k < temp.length; k++) {
                if (!running) return;
                arr[lo + k] = temp[k];
                swaps++;
                highlights.clear();
                highlights.add(lo + k);
                draw();
                await sleep(getDelay());
            }
            for (let k = lo; k <= hi; k++) sorted.add(k);
        }

        async function heapSort() {
            const n = arr.length;
            // 建堆
            for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
                await heapify(n, i);
            }
            // 排序
            for (let i = n - 1; i > 0; i--) {
                if (!running) return;
                [arr[0], arr[i]] = [arr[i], arr[0]];
                swaps++;
                sorted.add(i);
                draw();
                await sleep(getDelay());
                await heapify(i, 0);
            }
            sorted.add(0);
        }

        async function heapify(n, i) {
            let largest = i;
            const l = 2 * i + 1, r = 2 * i + 2;
            if (l < n) {
                if (!running) return;
                highlights.clear();
                highlights.add(l);
                highlights.add(i);
                comparisons++;
                updateStats();
                draw();
                await sleep(getDelay());
                if (arr[l] > arr[largest]) largest = l;
            }
            if (r < n) {
                if (!running) return;
                highlights.clear();
                highlights.add(r);
                highlights.add(largest);
                comparisons++;
                updateStats();
                draw();
                await sleep(getDelay());
                if (arr[r] > arr[largest]) largest = r;
            }
            if (largest !== i) {
                [arr[i], arr[largest]] = [arr[largest], arr[i]];
                swaps++;
                draw();
                await sleep(getDelay());
                await heapify(n, largest);
            }
        }

        function draw() {
            ctx.fillStyle = '#f4f1ea';
            ctx.fillRect(0, 0, w, h);

            const barW = w / arr.length;
            const maxVal = Math.max(...arr);
            const padding = 20;

            arr.forEach((val, i) => {
                const barH = (val / maxVal) * (h - padding * 2);
                const x = i * barW;
                const y = h - barH - padding / 2;

                // 水墨渐变
                const grad = ctx.createLinearGradient(0, y, 0, h);
                if (sorted.has(i)) {
                    grad.addColorStop(0, '#5c8a8a');
                    grad.addColorStop(1, '#3d5c5c');
                } else if (highlights.has(i)) {
                    grad.addColorStop(0, '#e74c3c');
                    grad.addColorStop(1, '#c0392b');
                } else {
                    grad.addColorStop(0, '#d4a574');
                    grad.addColorStop(1, '#8a7355');
                }

                ctx.fillStyle = grad;
                ctx.fillRect(x + 1, y, barW - 2, barH);

                // 顶部圆角
                ctx.beginPath();
                ctx.arc(x + barW / 2, y, (barW - 2) / 2, 0, Math.PI, true);
                ctx.fill();
            });
        }

        // 事件
        $$('.proof-btn[data-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (running) return;
                $$('.proof-btn[data-sort]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                sortType = btn.dataset.sort;
                updateStats();
                updatePseudocode();
            });
        });

        $('#sort-size').addEventListener('input', (e) => {
            if (running) return;
            size = +e.target.value;
            $('#sort-size-val').textContent = size;
            generateArray();
        });

        $('#sort-speed').addEventListener('input', (e) => {
            speed = +e.target.value;
            $('#sort-speed-val').textContent = speedLabels[speed];
        });

        $('#sort-start').addEventListener('click', async function() {
            if (running) {
                running = false;
                this.textContent = '起 舞';
                return;
            }
            running = true;
            this.textContent = '停 止';
            comparisons = 0; swaps = 0;
            sorted.clear();
            updateStats();

            if (sortType === 'bubble') await bubbleSort();
            else if (sortType === 'quick') await quickSort(0, arr.length - 1);
            else if (sortType === 'merge') await mergeSort(0, arr.length - 1);
            else if (sortType === 'heap') await heapSort();

            if (running) {
                // 完成动画
                highlights.clear();
                for (let i = 0; i < arr.length; i++) {
                    sorted.add(i);
                    draw();
                    await sleep(10);
                }
            }
            running = false;
            this.textContent = '起 舞';
        });

        $('#sort-shuffle').addEventListener('click', () => {
            if (running) return;
            generateArray();
        });

        generateArray();

        window.addEventListener('resize', () => {
            ({ ctx, w, h } = setupCanvas(canvas));
            draw();
        });
    })();

    /* ===== 平滑滚动 ===== */
    $$('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = $(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                $('.nav-links')?.classList.remove('mobile-open');
            }
        });
    });

    /* ===== 键盘快捷键 ===== */
    const sectionMap = {
        '1': 'daosheng',
        '2': 'gougu',
        '3': 'geyuan',
        '4': 'fenxing',
        '5': 'huangjin',
        '6': 'suanfa',
        '7': 'tech',
        '8': 'jiaoxue'
    };

    document.addEventListener('keydown', (e) => {
        // 输入框中不触发
        if (e.target.matches('input, textarea')) return;
        const key = e.key;
        if (sectionMap[key]) {
            const target = $('#' + sectionMap[key]);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
    });

    /* ===== 回到顶部 ===== */
    const backToTop = $('#back-to-top');
    const kbdHint = $('#kbd-hint');

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 600) {
            backToTop.classList.add('visible');
            kbdHint.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
            kbdHint.classList.remove('visible');
        }
    });

    /* ===== 提问引擎 ===== */
    const askInput = $('#ask-input');
    const askBtn = $('#ask-btn');
    const askResult = $('#ask-result');
    const askAttachmentPreview = $('#ask-attachment-preview');
    const askImgInput = $('#ask-img-input');
    const askCameraInput = $('#ask-camera-input');
    const askFileInput = $('#ask-file-input');
    let currentAttachments = [];

    function scrollToSection(id) {
        const el = $('#' + id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    function isImageFile(file) {
        return file && file.type && file.type.startsWith('image/');
    }

    function renderAttachmentPreview() {
        if (!askAttachmentPreview) return;
        askAttachmentPreview.innerHTML = '';
        currentAttachments.forEach((att, idx) => {
            const item = document.createElement('div');
            item.className = 'ask-attachment-item';
            let thumb = '';
            if (att.type === 'image') {
                thumb = `<img src="${att.data}" alt="附件图片">`;
            } else {
                thumb = `<span>📄 ${escapeHtml(att.name)}</span>`;
            }
            item.innerHTML = `${thumb}<button class="ask-attachment-remove" data-idx="${idx}" aria-label="移除附件">×</button>`;
            askAttachmentPreview.appendChild(item);
        });
        askAttachmentPreview.querySelectorAll('.ask-attachment-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                currentAttachments.splice(idx, 1);
                renderAttachmentPreview();
            });
        });
    }

    function escapeHtml(s) {
        return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    async function handleFileSelect(file) {
        if (!file) return;
        try {
            if (isImageFile(file)) {
                const data = await readFileAsBase64(file);
                currentAttachments.push({ type: 'image', name: file.name, data: data });
            } else {
                const text = await readFileAsText(file);
                currentAttachments.push({ type: 'file', name: file.name, data: text });
            }
            renderAttachmentPreview();
        } catch (e) {
            console.error('读取附件失败', e);
        }
    }

    $('#ask-img-btn')?.addEventListener('click', () => askImgInput?.click());
    $('#ask-camera-btn')?.addEventListener('click', () => askCameraInput?.click());
    $('#ask-file-btn')?.addEventListener('click', () => askFileInput?.click());
    askImgInput?.addEventListener('change', (e) => { handleFileSelect(e.target.files[0]); e.target.value = ''; });
    askCameraInput?.addEventListener('change', (e) => { handleFileSelect(e.target.files[0]); e.target.value = ''; });
    askFileInput?.addEventListener('change', (e) => { handleFileSelect(e.target.files[0]); e.target.value = ''; });

    function buildAttachmentContext() {
        if (!currentAttachments.length) return '';
        const parts = currentAttachments.map((att, i) => {
            if (att.type === 'image') {
                return `[附件${i + 1}：图片 ${att.name}]\n${att.data}`;
            } else {
                return `[附件${i + 1}：文件 ${att.name}]\n${att.data}`;
            }
        });
        return '用户上传了以下附件，请结合附件内容生成教学动画：\n' + parts.join('\n\n');
    }

    // 调后端代理 /api/chat（密钥仅存于服务端，前端不持有）
    async function askAI(question) {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        if (!res.ok) throw new Error('后端返回 ' + res.status);
        const data = await res.json();
        return data.reply;
    }

    // 本地降级计算
    function askLocal(q) {
        if (/勾股|弦|直角/.test(q)) {
            let a = 3, b = 4;
            const aM = q.match(/(?:勾|a|A)\s*[=:：]\s*(\d+(?:\.\d+)?)/);
            const bM = q.match(/(?:股|b|B)\s*[=:：]\s*(\d+(?:\.\d+)?)/);
            if (aM) a = parseFloat(aM[1]); if (bM) b = parseFloat(bM[1]);
            const c = Math.sqrt(a * a + b * b);
            return `${a}²+${b}²=${c.toFixed(4)}² → 勾股定理验证成功`;
        }
        if (/π|圆周率|割圆|pi/i.test(q)) {
            let n = 96; const nM = q.match(/(?:边数|n|N)\s*[=:：]?\s*(\d+)/);
            if (nM) n = clamp(parseInt(nM[1]), 6, 10000);
            const pi = (n * Math.sin(Math.PI / n) + n * Math.tan(Math.PI / n)) / 2;
            return `正${n}边形 → π ≈ ${pi.toFixed(10)}`;
        }
        if (/斐波那契|黄金|fib/i.test(q)) {
            const nM = q.match(/(?:第\s*)?(\d+)\s*(?:项|位|个)/);
            const n = nM ? parseInt(nM[1]) : 10;
            let a = 1, b = 1; for (let i = 3; i <= n; i++) { const c = a + b; a = b; b = c; }
            return `F(${n}) = ${b}，相邻比→${(b / a || 0).toFixed(6)}`;
        }
        if (/分形|树/.test(q)) {
            const dM = q.match(/(?:深度|深|层)\s*[=:：]?\s*(\d+)/);
            const d = dM ? clamp(parseInt(dM[1]), 3, 13) : 10;
            return `深度${d} → 枝条${Math.pow(2, d) - 1}，分形维数≈${(Math.log(2) / Math.log(1 / 0.72)).toFixed(2)}`;
        }
        return null;
    }

    async function handleAsk(input) {
        const q = (input != null ? input : askInput.value).trim();
        if (!q && !currentAttachments.length) { askResult.style.display = 'none'; return; }
        askInput.value = q;

        const context = buildAttachmentContext();
        let displayQuestion = q;
        if (currentAttachments.length) {
            displayQuestion = (q ? q + ' ' : '') + `（附 ${currentAttachments.length} 个附件）`;
        }

        askResult.innerHTML = '<div class="ask-result-title"><span class="taiji-icon" aria-hidden="true"></span> AI 思考中</div><div class="ask-result-body"><span class="ask-thinking">·</span></div>';
        askResult.style.display = 'block';

        // 主路径：调用生成引擎 /api/tasks（后端按问题实时生成动画 spec，密钥仅服务端）
        let task = null, failed = false;
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: q, context: context })
            });
            if (!res.ok) throw new Error('后端返回 ' + res.status);
            task = await res.json();
        } catch (e) { failed = true; }

        if (failed || !task) {
            // 兜底：通用问答 + 本地降级
            let reply = '';
            try {
                const r2 = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, context: context }) });
                if (r2.ok) reply = (await r2.json()).reply;
            } catch (e2) {}
            if (!reply) { const local = askLocal(q); reply = local || '💡 AI 暂时不可用，试试：勾股 a=3 b=4 | π 边数=200 | 斐波那契 第10项 | 分形 深度=12 | 3×5+2=?'; }
            showTextReply(reply);
            return;
        }

        const answer = cleanAnswer(task.answer || '');
        const spec = task.spec;
        const solution = task.solution || null;
        const isMath = task.isMath === true;

        if (!isMath) {
            // 非数学问题：直接按 DeepSeek 输出回答
            showTextReply(answer);
        } else if (spec && Array.isArray(spec.objects) && spec.objects.length) {
            // 数学问题 + 可交互动画：展示动画与解题思路/步骤
            showGeneratedResult(displayQuestion, answer, spec, solution, task.taskId);
        } else {
            // 数学问题但没有可生成动画：直接展示解题思路与步骤
            showSolutionText(displayQuestion, answer, solution);
        }

        // 提交后清空已上传附件
        currentAttachments = [];
        renderAttachmentPreview();
    }

    // 清理模型返回里的 JSON / 代码块，避免把 spec 当答案显示
    function cleanAnswer(text) {
        let t = (text || '').trim();
        const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fence) t = fence[1].trim();
        const s = t.indexOf('{'), e = t.lastIndexOf('}');
        if (s !== -1 && e > s && e === t.length - 1) t = t.slice(0, s).trim();
        return t;
    }

    // 纯文字回复（兼容旧的 counter/compare/sequence/router 即时演示）
    function showTextReply(reply) {
        let actionHtml = '', actionObj = null;
        const actionMatch = reply.match(/###ACTION###\s*(\{[\s\S]*?\})/);
        if (actionMatch) {
            try {
                actionObj = JSON.parse(actionMatch[1]);
                if (actionObj.type === 'router' && actionObj.target) {
                    actionHtml = `<a class="ask-result-link" href="#${actionObj.target}">→ 查看对应模块演示</a>`;
                }
            } catch (e) {}
            reply = reply.replace(/###ACTION###\s*\{[\s\S]*?\}/, '');
        }
        const cleanReply = reply.trim();
        askResult.innerHTML = `<div class="ask-result-title"><span class="taiji-icon" aria-hidden="true"></span> 数学助手</div>
            <div class="ask-result-body">${cleanReply.replace(/\n/g, '<br>')}</div>
            ${actionHtml}`;
        askResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (actionObj) renderInstantDemo(actionObj);
        else $('#ask-canvas-wrap').style.display = 'none';
    }

    // 数学问题 + 可交互动画：展示动画与解题思路/步骤
    function showGeneratedResult(question, answer, spec, solution, taskId) {
        const solHtml = (window.JX && window.JX.renderSolution) ? window.JX.renderSolution(solution) : '';
        const displayAnswer = (answer && answer.length > 4) ? answer : ('已根据你的提问生成交互式教学动画：' + (spec.title || ''));
        const previewLink = taskId ? `<a class="ask-result-link" href="/teaching.html?id=${encodeURIComponent(taskId)}" target="_blank" rel="noopener">↗ 打开讲解预览页</a>` : '';
        askResult.innerHTML = `<div class="ask-result-title"><span class="taiji-icon" aria-hidden="true"></span> AI 生成动画 + 解题</div>
            <div class="ask-result-body">${displayAnswer.replace(/\n/g, '<br>')}${solHtml}</div>
            <button class="ask-gen-btn" id="ask-open-ai-dialog">▶ 在 AI助教 对话框中查看 / 播放动画</button>${previewLink}`;
        askResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        $('#ask-canvas-wrap').style.display = 'none';
        const btn = document.getElementById('ask-open-ai-dialog');
        if (btn) {
            btn.addEventListener('click', function () {
                if (window.JX && window.JX.openAiDialog) {
                    window.JX.openAiDialog({
                        title: spec.title || question,
                        initialQuestion: question,
                        initialAnswer: displayAnswer,
                        initialSpec: spec,
                        initialSolution: solution
                    });
                }
            });
        }
        // 自动打开 AI助教 对话框
        if (window.JX && window.JX.openAiDialog) {
            setTimeout(function () {
                window.JX.openAiDialog({
                    title: spec.title || question,
                    initialQuestion: question,
                    initialAnswer: displayAnswer,
                    initialSpec: spec,
                    initialSolution: solution
                });
            }, 250);
        }
    }

    // 数学问题但没有可生成动画：直接展示解题思路与步骤
    function showSolutionText(question, answer, solution) {
        const solHtml = (window.JX && window.JX.renderSolution) ? window.JX.renderSolution(solution) : '';
        const displayAnswer = answer || '已为你生成解题思路与步骤。';
        askResult.innerHTML = `<div class="ask-result-title"><span class="taiji-icon" aria-hidden="true"></span> AI 解题</div>
            <div class="ask-result-body">${displayAnswer.replace(/\n/g, '<br>')}${solHtml}</div>`;
        askResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        $('#ask-canvas-wrap').style.display = 'none';
    }

    // 核心生成函数：返回 { answer, spec, solution, isMath, topic }，供首页搜索栏和弹层 AI 对话框复用
    // question 可以是字符串，也可以是 { question, context }
    async function generateAnimation(question) {
        let q = '', context = '';
        if (question && typeof question === 'object') {
            q = (question.question || '').trim();
            context = question.context || '';
        } else {
            q = (question || '').trim();
        }
        if (!q && !context) throw new Error('请输入问题或上传附件');
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, context: context })
        });
        if (!res.ok) throw new Error('后端返回 ' + res.status);
        const task = await res.json();
        const answer = cleanAnswer(task.answer || '');
        const spec = task.spec;
        const solution = task.solution || null;
        const isMath = task.isMath === true;
        const topic = task.topic || '';
        // 持久化到本地，便于 /teaching.html?id= 预览页（同浏览器）回看
        if (task.taskId) {
            try {
                localStorage.setItem('sdwm_task_' + task.taskId, JSON.stringify({ taskId: task.taskId, title: task.title || (spec && spec.title) || '', spec: spec, solution: solution, isMath: isMath }));
            } catch (e) { /* 忽略隐私模式等写入失败 */ }
        }
        return { answer, spec, solution, isMath, topic, question: q, taskId: task.taskId };
    }

    // 供教学卡片「问 AI」按钮调用
    window.AskAI = {
        ask: function (question) {
            if (!askInput) return;
            askInput.value = question || '';
            const area = askInput.closest('.ask-area') || askInput;
            area.scrollIntoView({ behavior: 'smooth', block: 'center' });
            askInput.focus();
            handleAsk(question);
        },
        generateAnimation: generateAnimation
    };

    // 即时动画渲染（counter/compare/sequence）
    function renderInstantDemo(action) {
        const wrap = $('#ask-canvas-wrap');
        const canvas = $('#ask-canvas');
        const header = $('#ask-canvas-header');
        const question = $('#ask-canvas-question');
        const footer = $('#ask-canvas-footer');
        if (!wrap || !canvas) return;

        // 填充卡片头部
        const q = askInput.value.trim();
        question.textContent = q;

        if (action.type === 'counter') {
            header.innerHTML = '<span class="tag tag-t1">运算能力</span><span class="tag tag-t2">数感</span><span class="tag tag-t5">直观想象</span>';
            footer.textContent = '观看数字的变化过程 · 交互式教学演示';
            drawCounter(canvas, action);
            wrap.style.display = 'block';
        } else if (action.type === 'compare') {
            header.innerHTML = '<span class="tag tag-t3">推理意识</span><span class="tag tag-t1">数感</span>';
            footer.textContent = '对比两个数字的大小关系 · 交互式教学演示';
            drawCompare(canvas, action);
            wrap.style.display = 'block';
        } else if (action.type === 'sequence') {
            header.innerHTML = '<span class="tag tag-t4">推理意识</span><span class="tag tag-t2">运算能力</span>';
            footer.textContent = '数列逐项展示 · 交互式教学演示';
            drawSequence(canvas, action);
            wrap.style.display = 'block';
        } else {
            wrap.style.display = 'none';
        }
    }

    // 计数器动画（教学卡片风格）
    function drawCounter(canvas, action) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || 600;
        const h = 220;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const expr = action.expression || '';
        const num = parseFloat(action.result) || 0;
        const isInt = Number.isInteger(num);
        const icons = action.icons || [];
        const hasIcons = icons.length > 0;

        let frame = 0;
        const totalFrames = 60;

        function tick() {
            // 暖白纸感背景
            ctx.fillStyle = '#faf8f4';
            ctx.fillRect(0, 0, w, h);

            const progress = frame / totalFrames;
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = num * easeProgress;
            const currentInt = Math.max(1, Math.min(Math.round(currentVal), icons.length));

            if (hasIcons) {
                // 图标区
                const iconSize = 44;
                const gap = 16;
                const cols = Math.min(icons.length, 8);
                const totalW = cols * iconSize + (cols - 1) * gap;
                const startX = (w - totalW) / 2;
                ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let i = 0; i < currentInt && i < icons.length; i++) {
                    ctx.fillText(icons[i], startX + i * (iconSize + gap) + iconSize / 2, 75);
                }

                // 分隔线
                ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(w * 0.15, 112);
                ctx.lineTo(w * 0.85, 112);
                ctx.stroke();

                // 大数字
                ctx.fillStyle = '#c0392b';
                ctx.font = 'bold 38px "Cormorant Garamond", serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(num.toString(), w / 2, 162);
                ctx.textBaseline = 'alphabetic';

                // 底部提示
                ctx.fillStyle = '#b8a88a';
                ctx.font = '13px "Noto Sans SC", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${expr} = ${num}`, w / 2, 202);
            } else {
                // 纯算式风格
                ctx.fillStyle = '#1a1a2e';
                ctx.font = '500 20px "Noto Serif SC", serif';
                ctx.textAlign = 'center';
                ctx.fillText(expr, w / 2, 50);

                ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(w * 0.2, 68);
                ctx.lineTo(w * 0.8, 68);
                ctx.stroke();

                // 大数字动画
                ctx.fillStyle = '#c0392b';
                ctx.font = 'bold 80px "Cormorant Garamond", serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(isInt ? Math.round(currentVal).toString() : currentVal.toFixed(2), w / 2, 130);
                ctx.textBaseline = 'alphabetic';

                // = 结果
                ctx.fillStyle = '#8a7355';
                ctx.font = '500 16px "Noto Serif SC", serif';
                ctx.fillText(`= ${isInt ? Math.round(currentVal) : currentVal.toFixed(2)}`, w / 2, 188);
            }

            if (frame < totalFrames) {
                frame++;
                requestAnimationFrame(tick);
            }
        }
        tick();
    }

    // 比较动画（卡片风格）
    function drawCompare(canvas, action) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || 600;
        const h = 220;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const a = action.a || 0, b = action.b || 0;
        const maxVal = Math.max(Math.abs(a), Math.abs(b), 1) * 1.3;
        const barH = 56, gap = 38;
        const center = w * 0.45;
        const barW = Math.min(140, w * 0.28);

        function draw() {
            ctx.fillStyle = '#faf8f4';
            ctx.fillRect(0, 0, w, h);

            const w1 = (Math.abs(a) / maxVal) * barW;
            const w2 = (Math.abs(b) / maxVal) * barW;

            // A柱
            ctx.fillStyle = a > b ? '#50B86C' : '#D9726A';
            ctx.beginPath();
            ctx.roundRect(center - w1, 48, w1, barH, [0, 6, 6, 0]);
            ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            ctx.font = '600 18px "Cormorant Garamond", serif';
            ctx.textAlign = 'right';
            ctx.fillText(a.toString(), center - 14, 48 + barH / 2 + 6);

            // B柱
            const y2 = 48 + barH + gap;
            ctx.fillStyle = b > a ? '#50B86C' : '#D9726A';
            ctx.beginPath();
            ctx.roundRect(center - w2, y2, w2, barH, [0, 6, 6, 0]);
            ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            ctx.font = '600 18px "Cormorant Garamond", serif';
            ctx.textAlign = 'right';
            ctx.fillText(b.toString(), center - 14, y2 + barH / 2 + 6);

            // 标签
            ctx.fillStyle = '#8a7355';
            ctx.font = '12px "Noto Sans SC", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('A', center + 8, 48 + barH / 2 + 4);
            ctx.fillText('B', center + 8, y2 + barH / 2 + 4);

            // 结果
            const winner = a > b ? `${a} > ${b}` : b > a ? `${b} > ${a}` : `${a} = ${b}`;
            ctx.fillStyle = '#c0392b';
            ctx.font = '500 15px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.fillText(`结果：${winner}`, w * 0.5, h - 14);
        }
        draw();
    }

    // 序列动画（卡片风格）
    function drawSequence(canvas, action) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || 600;
        const h = 220;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const items = action.items || [];
        if (items.length === 0) return;
        let frame = 0;
        const totalFrames = 30;
        const maxVal = Math.max(...items.map(v => Math.abs(v)), 1);

        function tick() {
            ctx.fillStyle = '#faf8f4';
            ctx.fillRect(0, 0, w, h);

            const visible = Math.floor((frame / totalFrames) * items.length);
            const n = Math.min(visible + 1, items.length);
            const itemW = w / items.length;
            const barW = Math.min(itemW * 0.55, 50);
            const pad = (itemW - barW) / 2;

            for (let i = 0; i < n; i++) {
                const v = items[i];
                const bh = (Math.abs(v) / maxVal) * 120;
                const x = i * itemW + pad;
                const y = h - 45 - bh;

                const colors = ['#4A90D9', '#50B86C', '#E09D3E', '#D9726A', '#9B6BBF'];
                ctx.fillStyle = colors[i % colors.length];
                ctx.beginPath();
                ctx.roundRect(x, y, barW, bh, 4);
                ctx.fill();

                ctx.fillStyle = '#1a1a2e';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(v.toString(), x + barW / 2, h - 28);
            }

            if (frame < totalFrames) {
                frame++;
                requestAnimationFrame(tick);
            }
        }
        tick();
    }

    askBtn.addEventListener('click', () => handleAsk(askInput.value));
    askInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAsk(askInput.value); });

    // 示例标签
    $$('.ask-example').forEach(btn => {
        btn.addEventListener('click', () => {
            askInput.value = btn.dataset.q;
            handleAsk(askInput.value);
        });
    });

})();
