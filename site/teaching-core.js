/* ============================================================
   教学动画 · 框架核心 (teaching-core.js)
   自包含 IIFE，与 app.js 完全隔离（不修改原站任何代码）。
   提供：工具函数、Canvas DPR 初始化、视口门控、resize 重绘、
        动画注册表、目录画廊与模块卡片自动生成、
        点击弹窗（Modal）演示、画廊分页。
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 工具 ---------- */
    function createFileInput(id, accept) {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.id = id;
        inp.style.display = 'none';
        if (accept) inp.accept = accept;
        return inp;
    }
    function escapeHtml(s) {
        return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return (r || document).querySelectorAll(s); };
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var rand = function (a, b) { return Math.random() * (b - a) + a; };
    var TAU = Math.PI * 2;

    function isInViewport(el, threshold) {
        threshold = threshold || 150;
        if (!el) return false;
        var rect = el.getBoundingClientRect();
        return rect.bottom > -threshold && rect.top < (window.innerHeight + threshold) &&
            rect.right > -threshold && rect.left < (window.innerWidth + threshold);
    }

    // DPR 安全的 Canvas 初始化（与 app.js 同规范）
    function setupCanvas(canvas) {
        var dpr = window.devicePixelRatio || 1;
        var rect = canvas.parentElement.getBoundingClientRect();
        var w = Math.max(1, Math.floor(rect.width));
        var h = Math.max(1, Math.floor(rect.height));
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx: ctx, w: w, h: h };
    }

    /* ---------- resize 重绘登记 ---------- */
    var resizers = [];
    var resizeTimer = null;
    window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizers.forEach(function (fn) { try { fn(); } catch (e) { } });
        }, 150);
    });

    // 静态/交互型：初始化一次 + 监听 resize 重绘
    function resizable(canvas, draw) {
        var o = setupCanvas(canvas);
        draw(o.ctx, o.w, o.h);
        function resizeFn() { o = setupCanvas(canvas); draw(o.ctx, o.w, o.h); }
        resizers.push(resizeFn);
        canvas._jxResizerStop = function () {
            var i = resizers.indexOf(resizeFn);
            if (i > -1) resizers.splice(i, 1);
        };
        var api = {
            redraw: function () { draw(o.ctx, o.w, o.h); },
            get view() { return o; },
            stop: function () { canvas._jxResizerStop && canvas._jxResizerStop(); }
        };
        canvas._jxViewApi = api;
        return api;
    }

    // 连续动画型：rAF 循环，视口外跳过绘制，尺寸变化自动重置；
    // canvas 被移出 DOM 后自动停止，避免 Modal 关闭后空转。
    function loop(canvas, frame) {
        var o = setupCanvas(canvas);
        var lastW = o.w, lastH = o.h;
        var running = true;
        function tick(t) {
            if (!running) return;
            if (!canvas.isConnected) { running = false; return; }
            if (!isInViewport(canvas)) { requestAnimationFrame(tick); return; }
            var rect = canvas.parentElement.getBoundingClientRect();
            if (rect.width !== lastW || rect.height !== lastH) {
                o = setupCanvas(canvas); lastW = o.w; lastH = o.h;
            }
            frame(o.ctx, o.w, o.h, t);
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        canvas._jxLoopStop = function () { running = false; };
        return { stop: function () { running = false; canvas._jxLoopStop = null; } };
    }

    /* ---------- 通用绘图小工具 ---------- */
    function clearBG(ctx, w, h, color) {
        ctx.fillStyle = color || '#1c2333';
        ctx.fillRect(0, 0, w, h);
    }
    function line(ctx, x1, y1, x2, y2, color, width) {
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = color || '#c9d1d9';
        ctx.lineWidth = width || 1.5;
        ctx.stroke();
    }
    function circle(ctx, x, y, r, fill, stroke, lw) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
    }
    function dot(ctx, x, y, r, color) {
        circle(ctx, x, y, r || 4, color || '#d4a574');
    }
    function label(ctx, text, x, y, color, font, align) {
        ctx.fillStyle = color || '#c9d1d9';
        ctx.font = font || '13px "Noto Sans SC", sans-serif';
        ctx.textAlign = align || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }
    function roundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
    }

    // 简易坐标系（用于函数图像类）：把数据坐标映射到画布
    function coordSys(ctx, w, h, opts) {
        var o = opts || {};
        var xmin = o.xmin != null ? o.xmin : -5, xmax = o.xmax != null ? o.xmax : 5;
        var ymin = o.ymin != null ? o.ymin : -5, ymax = o.ymax != null ? o.ymax : 5;
        var pad = o.pad != null ? o.pad : 28;
        var sx = (w - 2 * pad) / (xmax - xmin);
        var sy = (h - 2 * pad) / (ymax - ymin);
        var X = function (x) { return pad + (x - xmin) * sx; };
        var Y = function (y) { return h - pad - (y - ymin) * sy; };
        return {
            X: X, Y: Y, sx: sx, sy: sy, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax, pad: pad,
            drawGrid: function (color, lw) {
                ctx.strokeStyle = color || 'rgba(255,255,255,0.06)';
                ctx.lineWidth = lw || 1;
                var stepx = niceStep((xmax - xmin) / 10), stepy = niceStep((ymax - ymin) / 10);
                for (var x = Math.ceil(xmin / stepx) * stepx; x <= xmax; x += stepx) {
                    line(ctx, X(x), pad, X(x), h - pad, color || 'rgba(255,255,255,0.06)', 1);
                }
                for (var y = Math.ceil(ymin / stepy) * stepy; y <= ymax; y += stepy) {
                    line(ctx, pad, Y(y), w - pad, Y(y), color || 'rgba(255,255,255,0.06)', 1);
                }
                // 坐标轴
                line(ctx, X(0), pad, X(0), h - pad, 'rgba(212,165,116,0.4)', 1.4);
                line(ctx, pad, Y(0), w - pad, Y(0), 'rgba(212,165,116,0.4)', 1.4);
                ctx.fillStyle = 'rgba(201,209,217,0.7)';
                ctx.font = '11px "Noto Sans SC", sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                for (var x2 = Math.ceil(xmin / stepx) * stepx; x2 <= xmax; x2 += stepx) {
                    if (Math.abs(x2) < 1e-9) continue;
                    ctx.fillText(fmt(x2), X(x2), Y(0) + 3);
                }
                ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
                for (var y2 = Math.ceil(ymin / stepy) * stepy; y2 <= ymax; y2 += stepy) {
                    if (Math.abs(y2) < 1e-9) continue;
                    ctx.fillText(fmt(y2), X(0) - 4, Y(y2));
                }
            }
        };
    }
    function niceStep(r) {
        var p = Math.pow(10, Math.floor(Math.log10(r)));
        var n = r / p;
        var s = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
        return s * p;
    }
    function fmt(v) {
        if (Math.abs(v) < 1e-9) return '0';
        var r = Math.round(v * 100) / 100;
        return ('' + r);
    }

    /* ---------- 动画注册表 ---------- */
    var anims = [];
    function register(a) { anims.push(a); }

    /* ---------- 图标 ---------- */
    var fieldIcons = {
        '代数': '∑', '有理数': '±', '函数': 'ƒ', '方程': '=',
        '几何': '△', '立体图形': '□', '尺规作图': '⎙', '四边形': '▱',
        '圆锥曲线': '○', '三角函数': '∿', '概率': '?', '组合数学': '☷',
        '平面向量': '→', '数值估算': 'π', '分步': '⇣', '综合': '✦'
    };

    /* ---------- 缩略图背景艺术（黑金主题 SVG） ---------- */
    function hashString(s) {
        var h = 0;
        for (var i = 0; i < (s || '').length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
        return h || 1;
    }
    function seededRandom(seed) {
        return function () {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
    }
    function svgEl(tag, attrs) {
        var s = '<' + tag;
        for (var k in attrs) {
            if (attrs[k] != null) s += ' ' + k + '="' + attrs[k] + '"';
        }
        return s + '/>';
    }
    function svgOpen(tag, attrs) {
        var s = '<' + tag;
        for (var k in attrs) {
            if (attrs[k] != null) s += ' ' + k + '="' + attrs[k] + '"';
        }
        return s + '>';
    }
    function artPalette(light) {
        return {
            gold: light ? '#8a5e2a' : 'rgba(230, 190, 132, 0.82)',
            goldDim: light ? '#a67c3e' : 'rgba(212, 165, 116, 0.55)',
            goldFaint: light ? '#bf9b62' : 'rgba(212, 165, 116, 0.32)',
            ink: light ? '#e8e1d6' : 'rgba(255,255,255,0.10)',
            line: light ? '#d9d0c3' : 'rgba(255,255,255,0.08)'
        };
    }

    function artCalc(rng, title, light) {
        var c = artPalette(light);
        var out = '';
        // 底部数轴
        out += '<line x1="35" y1="108" x2="365" y2="108" stroke="' + c.goldDim + '" stroke-width="1.5" stroke-linecap="round"/>';
        out += '<polygon points="361,103 365,108 361,113" fill="' + c.goldDim + '"/>';
        for (var i = 0; i < 8; i++) {
            var x = 60 + i * 40;
            out += '<line x1="' + x + '" y1="103" x2="' + x + '" y2="113" stroke="' + c.goldFaint + '" stroke-width="1.2"/>';
        }
        // 漂浮运算符号
        var symbols = ['+', '−', '×', '÷', '=', '±', '∑'];
        for (var j = 0; j < 9; j++) {
            var x = 40 + rng() * 320;
            var y = 18 + rng() * 68;
            var sym = symbols[Math.floor(rng() * symbols.length)];
            var size = 14 + rng() * 12;
            out += '<text x="' + x + '" y="' + y + '" fill="' + c.goldFaint + '" font-size="' + size + '" font-family="Georgia, serif" font-weight="500">' + sym + '</text>';
        }
        // 立体 / 体积相关：线框立方体
        if (/体|积|立方|长方/.test(title)) {
            var cx = 295, cy = 48;
            out += '<polygon points="' + (cx - 36) + ',' + (cy - 10) + ' ' + (cx + 8) + ',' + (cy - 22) + ' ' + (cx + 8) + ',' + (cy + 34) + ' ' + (cx - 36) + ',' + (cy + 22) + '" fill="none" stroke="' + c.goldDim + '" stroke-width="1.2"/>';
            out += '<polygon points="' + (cx - 36) + ',' + (cy - 10) + ' ' + (cx - 16) + ',' + (cy - 42) + ' ' + (cx + 30) + ',' + (cy - 30) + ' ' + (cx + 8) + ',' + (cy - 22) + '" fill="none" stroke="' + c.goldFaint + '" stroke-width="1.1"/>';
            out += '<line x1="' + (cx + 8) + '" y1="' + (cy - 22) + '" x2="' + (cx + 8) + '" y2="' + (cy + 34) + '" stroke="' + c.goldFaint + '" stroke-width="1.1"/>';
            out += '<line x1="' + (cx + 30) + '" y1="' + (cy - 30) + '" x2="' + (cx + 30) + '" y2="' + (cy + 26) + '" stroke="' + c.goldFaint + '" stroke-width="1.1"/>';
            out += '<line x1="' + (cx + 8) + '" y1="' + (cy + 34) + '" x2="' + (cx + 30) + '" y2="' + (cy + 26) + '" stroke="' + c.goldDim + '" stroke-width="1.2"/>';
            out += '<line x1="' + (cx - 36) + '" y1="' + (cy + 22) + '" x2="' + (cx - 16) + '" y2="' + (cy - 10) + '" stroke="' + c.goldFaint + '" stroke-width="1.1"/>';
        }
        return out;
    }

    function artFunc(rng, title, light) {
        var c = artPalette(light);
        var out = '';
        // 坐标轴
        out += '<line x1="45" y1="112" x2="355" y2="112" stroke="' + c.goldDim + '" stroke-width="1.4" stroke-linecap="round"/>';
        out += '<line x1="55" y1="18" x2="55" y2="120" stroke="' + c.goldDim + '" stroke-width="1.4" stroke-linecap="round"/>';
        // 抛物线 / 曲线
        var open = rng() > 0.5 ? -1 : 1;
        var path = 'M 90 ' + (112 - open * 8) + ' Q 200 ' + (112 - open * 58) + ' 310 ' + (112 - open * 8);
        out += '<path d="' + path + '" fill="none" stroke="' + c.gold + '" stroke-width="2" stroke-linecap="round"/>';
        // 辅助切线
        var tx1 = 130, ty1 = 112 - open * 40, tx2 = 250, ty2 = 112 - open * 25;
        out += '<line x1="' + tx1 + '" y1="' + ty1 + '" x2="' + tx2 + '" y2="' + ty2 + '" stroke="' + c.goldFaint + '" stroke-width="1.3" stroke-dasharray="3 3"/>';
        // 符号
        out += '<text x="320" y="38" fill="' + c.goldFaint + '" font-size="17" font-family="Georgia, serif" font-style="italic">ƒ(x)</text>';
        out += '<text x="335" y="108" fill="' + c.goldDim + '" font-size="13" font-family="Georgia, serif" font-style="italic">x</text>';
        return out;
    }

    function artGeo(rng, title, light) {
        var c = artPalette(light);
        var out = '';
        // 主体三角形
        var bx = 70, by = 108;
        var tx = 140 + rng() * 45;
        var ty = 26 + rng() * 28;
        out += '<polygon points="' + bx + ',' + by + ' ' + (bx + 105) + ',' + by + ' ' + tx + ',' + ty + '" fill="none" stroke="' + c.gold + '" stroke-width="1.8" stroke-linejoin="round"/>';
        // 内切圆
        var cx = (bx + bx + 105 + tx) / 3;
        var cy = (by + by + ty) / 3;
        out += '<circle cx="' + cx + '" cy="' + cy + '" r="18" fill="none" stroke="' + c.goldDim + '" stroke-width="1.3" stroke-dasharray="3 3"/>';
        // 直角标记
        out += '<polyline points="' + (bx + 12) + ',' + by + ' ' + (bx + 12) + ',' + (by - 12) + ' ' + bx + ',' + (by - 12) + '" fill="none" stroke="' + c.goldFaint + '" stroke-width="1.2"/>';
        // 尺规弧线
        out += '<path d="M 245 108 A 32 32 0 0 1 277 76" fill="none" stroke="' + c.goldDim + '" stroke-width="1.5" stroke-linecap="round"/>';
        out += '<line x1="277" y1="108" x2="277" y2="76" stroke="' + c.goldFaint + '" stroke-width="1.2"/>';
        // 等长 / 全等标记
        out += '<line x1="' + (bx + 28) + '" y1="' + (by - 5) + '" x2="' + (bx + 38) + '" y2="' + (by - 5) + '" stroke="' + c.goldFaint + '" stroke-width="1.2"/>';
        out += '<line x1="' + (tx + 5) + '" y1="' + (ty + 28) + '" x2="' + (tx + 14) + '" y2="' + (ty + 22) + '" stroke="' + c.goldFaint + '" stroke-width="1.2"/>';
        return out;
    }

    function artCurves(rng, title, light, key) {
        var c = artPalette(light);
        var out = '';
        var arrowId = 'jx-arrow-' + (key || 'k') + (light ? '-l' : '-d');
        // 正弦 / 波形
        var path = 'M 35 70 ';
        for (var i = 0; i <= 165; i += 5) {
            var y = 70 + Math.sin(i * 0.05 + rng() * TAU) * 26;
            path += 'L ' + (35 + i) + ' ' + y + ' ';
        }
        out += '<path d="' + path + '" fill="none" stroke="' + c.gold + '" stroke-width="1.8" stroke-linecap="round"/>';
        // 椭圆
        out += '<ellipse cx="285" cy="52" rx="48" ry="30" fill="none" stroke="' + c.goldDim + '" stroke-width="1.5"/>';
        out += '<line x1="237" y1="52" x2="333" y2="52" stroke="' + c.goldFaint + '" stroke-width="1.2" stroke-dasharray="3 3"/>';
        out += '<line x1="285" y1="22" x2="285" y2="82" stroke="' + c.goldFaint + '" stroke-width="1.2" stroke-dasharray="3 3"/>';
        // 向量箭头
        var ax1 = 245, ay1 = 98, ax2 = 330, ay2 = 58;
        out += '<defs><marker id="' + arrowId + '" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="' + c.goldFaint + '"/></marker></defs>';
        out += '<line x1="' + ax1 + '" y1="' + ay1 + '" x2="' + ax2 + '" y2="' + ay2 + '" stroke="' + c.goldFaint + '" stroke-width="1.8" stroke-linecap="round" marker-end="url(#' + arrowId + ')"/>';
        return out;
    }

    function artProb(rng, title, light) {
        var c = artPalette(light);
        var out = '';
        // 高尔顿板钉子
        for (var row = 0; row < 5; row++) {
            for (var col = 0; col <= row; col++) {
                var x = 200 + (col - row / 2) * 20;
                var y = 22 + row * 14;
                out += '<circle cx="' + x + '" cy="' + y + '" r="2.5" fill="' + c.goldDim + '"/>';
            }
        }
        // 钟形曲线
        var path = 'M 50 110 ';
        for (var i = 0; i <= 130; i += 4) {
            var x = 50 + i;
            var y = 110 - 42 * Math.exp(-Math.pow((i - 65) / 24, 2));
            path += 'L ' + x + ' ' + y + ' ';
        }
        out += '<path d="' + path + '" fill="none" stroke="' + c.gold + '" stroke-width="1.8" stroke-linecap="round"/>';
        // 散点
        for (var j = 0; j < 18; j++) {
            var sx = 285 + rng() * 95;
            var sy = 45 + rng() * 60;
            out += '<circle cx="' + sx + '" cy="' + sy + '" r="2" fill="' + c.goldFaint + '"/>';
        }
        // 骰子轮廓
        out += '<rect x="305" y="22" width="22" height="22" rx="4" fill="none" stroke="' + c.goldDim + '" stroke-width="1.2"/>';
        out += '<circle cx="311" cy="28" r="2" fill="' + c.goldDim + '"/><circle cx="321" cy="28" r="2" fill="' + c.goldDim + '"/>';
        out += '<circle cx="311" cy="38" r="2" fill="' + c.goldDim + '"/><circle cx="321" cy="38" r="2" fill="' + c.goldDim + '"/>';
        return out;
    }

    function renderThumbArt(a, light) {
        var seed = hashString(a.key);
        var rng = seededRandom(seed);
        var theme = groupOf(a.field);
        var title = a.title || '';
        var w = 400, h = 140;
        var txFill = light ? 'rgba(138,94,42,0.07)' : 'rgba(212,165,116,0.06)';
        var defs = '<defs>' +
            '<linearGradient id="jxbg-' + a.key + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="' + (light ? '#f4eee3' : '#1c2230') + '"/>' +
            '<stop offset="1" stop-color="' + (light ? '#e8e0d3' : '#131720') + '"/>' +
            '</linearGradient>' +
            '<pattern id="jxtx-' + a.key + '" width="22" height="22" patternUnits="userSpaceOnUse">' +
            '<circle cx="1.5" cy="1.5" r="0.85" fill="' + txFill + '"/>' +
            '</pattern>' +
            '</defs>' +
            '<rect width="' + w + '" height="' + h + '" fill="url(#jxbg-' + a.key + ')"/>' +
            '<rect width="' + w + '" height="' + h + '" fill="url(#jxtx-' + a.key + ')"/>';
        var el = '';
        if (theme === 'calc') el = artCalc(rng, title, light);
        else if (theme === 'func') el = artFunc(rng, title, light);
        else if (theme === 'geo') el = artGeo(rng, title, light);
        else if (theme === 'curves') el = artCurves(rng, title, light, a.key);
        else el = artProb(rng, title, light);
        return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' + defs + el + '</svg>';
    }

    function pickIcon(a) {
        var f = a.field || '';
        for (var k in fieldIcons) if (f.indexOf(k) > -1) return fieldIcons[k];
        return '✦';
    }
    function difficultyDots(n) {
        n = clamp(n || 1, 1, 5);
        var s = '';
        for (var i = 1; i <= 5; i++) {
            s += '<i class="jx-dot' + (i <= n ? ' active' : '') + '"></i>';
        }
        return s;
    }
    function renderSteps(steps) {
        if (!steps || !steps.length) return '';
        var html = '<div class="jx-steps-list">';
        steps.forEach(function (s, i) {
            html += '<div class="jx-step-item"><span class="jx-step-n">' + (i + 1) + '</span><span>' + s + '</span></div>';
        });
        html += '</div>';
        return html;
    }

    /* ---------- Modal 系统 ---------- */
    var modal = null;
    function ensureModal() {
        if (modal) return;
        modal = document.createElement('div');
        modal.id = 'jxModal';
        modal.className = 'jx-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML =
            '<div class="jx-modal-backdrop"></div>' +
            '<div class="jx-modal-shell" role="dialog" aria-modal="true">' +
            '  <button class="jx-modal-close" aria-label="关闭">×</button>' +
            '  <div class="jx-modal-body"></div>' +
            '</div>';
        document.body.appendChild(modal);
        var backdrop = $('.jx-modal-backdrop', modal);
        var shell = $('.jx-modal-shell', modal);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) closeModal();
        });
        // 阻止内部交互冒泡到 backdrop（某些事件委托场景下的防御）
        shell.addEventListener('mousedown', function (e) { e.stopPropagation(); });
        shell.addEventListener('click', function (e) { e.stopPropagation(); });
        $('.jx-modal-close', modal).addEventListener('click', closeModal);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal();
        });
    }

    function openModal(key) {
        ensureModal();
        var a = anims.filter(function (x) { return x.key === key; })[0];
        if (!a) return;
        var body = $('.jx-modal-body', modal);
        // 如果已经打开同一个动画，直接显示
        var existing = body.firstElementChild;
        if (existing && existing.getAttribute('data-key') === key) {
            document.body.classList.add('jx-modal-open');
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            return;
        }
        // 创建新的完整演示卡片并 mount
        body.innerHTML = '';
        var card = makeFullCard(a);
        body.appendChild(card);
        document.body.classList.add('jx-modal-open');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        // 等 Modal 过渡/layout 完成后再 mount，避免 canvas 尺寸异常
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
            try {
                if (typeof a.mount === 'function') a.mount(card);
            } catch (e) {
                console.error('[教学动画] mount 失败:', a.key, e);
                var aw = $('.jx-answer', card);
                if (aw) aw.innerHTML = '<span class="err">该模块加载出错：' + (e && e.message) + '</span>';
            }
        }, 80);
    }

    function closeModal() {
        if (!modal) return;
        document.body.classList.remove('jx-modal-open');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        // 等过渡动画结束后清空 Modal body，loop 会因 canvas.isConnected=false 自动停止
        setTimeout(function () {
            var body = $('.jx-modal-body', modal);
            if (body) {
                var cards = body.querySelectorAll('.jx-card');
                cards.forEach(function (c) {
                    if (typeof c._jxCleanup === 'function') { try { c._jxCleanup(); } catch (e) { } }
                });
                body.innerHTML = '';
            }
            var shell = $('.jx-modal-shell', modal);
            if (shell) shell.classList.remove('jx-modal-light');
            window.dispatchEvent(new Event('resize'));
        }, 350);
    }

    /* 打开「AI 生成的动画」：复用同一套弹层，由 anim-engine 安全渲染 spec */
    function openGenerated(spec, meta) {
        if (!spec) return;
        ensureModal();
        var shell = $('.jx-modal-shell', modal);
        if (shell) shell.classList.add('jx-modal-light');
        var body = $('.jx-modal-body', modal);
        body.innerHTML = '';
        var card = document.createElement('article');
        card.className = 'jx-card jx-card-generated';
        var title = (spec.title || 'AI 生成的交互式动画');
        var sub = (spec.subtitle || 'AI 实时生成');
        var answer = (meta && meta.answer) ? meta.answer : '';
        card.innerHTML =
            '<div class="jx-card-head">' +
            '  <span class="jx-card-icon"><span class="taiji-icon" aria-hidden="true"></span></span>' +
            '  <div class="jx-card-titles">' +
            '    <h3 class="jx-card-title">' + title + '</h3>' +
            '    <p class="jx-card-tags">' + sub + '</p>' +
            '  </div>' +
            '  <button class="jx-card-ai-btn" aria-label="AI助教" title="让 AI 继续讲解"><span class="taiji-icon" aria-hidden="true"></span> AI助教</button>' +
            '</div>' +
            (answer ? '<p class="jx-problem">' + answer.replace(/</g, '&lt;') + '</p>' : '') +
            '<div class="jx-gen-mount"></div>';
        var aiBtn = card.querySelector('.jx-card-ai-btn');
        if (aiBtn) {
            aiBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openAiDialog({ title: spec.title || '当前问题' });
            });
        }
        body.appendChild(card);
        document.body.classList.add('jx-modal-open');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
            var mount = card.querySelector('.jx-gen-mount');
            if (mount && window.AnimEngine && typeof window.AnimEngine.render === 'function') {
                try {
                    var handle = window.AnimEngine.render(spec, mount);
                    if (handle && typeof handle.cleanup === 'function') {
                        card._jxCleanup = handle.cleanup;
                    }
                } catch (e) {
                    console.error('[生成动画] 渲染失败:', e);
                    mount.innerHTML = '<p class="err">该动画渲染出错：' + (e && e.message) + '</p>';
                }
            }
        }, 80);
    }

    /* ---------- 分组定义（替代数字编排，按知识主线归类） ---------- */
    var GROUPS = [
        { key: 'calc',   icon: '∑', title: '数与运算',       sub: '从数字运算，到用字母丈量空间。' },
        { key: 'func',   icon: '=', title: '方程与函数',     sub: '等式描绘变化，曲线从方程生长。' },
        { key: 'geo',    icon: '△', title: '几何与图形',     sub: '尺规、全等、四边形——以推理搭建图形世界。' },
        { key: 'curves', icon: '∿', title: '曲线·向量·三角', sub: '圆、椭圆与向量，解析几何的浪漫。' },
        { key: 'prob',   icon: '?', title: '概率与统计',     sub: '随机中藏着规律，用实验逼近真理。' }
    ];

    /* 每栏名人名言（与主题呼应） */
    var QUOTES = {
        calc:   { text: '数学是科学的皇后，而算术是数学的皇后。', author: '高斯' },
        func:   { text: '函数是数学的灵魂，它让变化有了语言。', author: '莱布尼茨' },
        geo:    { text: '几何无王者之路，唯有步步推理。', author: '欧几里得' },
        curves: { text: '宇宙这本书是用数学语言写成的。', author: '伽利略' },
        prob:   { text: '概率是生活的指南，它教我们在不确定中寻找确定。', author: '巴特勒' }
    };

    /* 过滤标签（核心素养，与卡片真实标签一一对应） */
    var FILTER_TAGS = ['运算能力', '数感', '量感', '模型意识', '空间观念', '几何直观', '推理意识', '数据意识'];
    var ALLOWED_COMP = {
        '运算能力': 1, '数感': 1, '量感': 1, '模型意识': 1,
        '空间观念': 1, '几何直观': 1, '推理意识': 1, '数据意识': 1
    };
    /* 按真实主题分组（field 是「主题 · 细分」，不含素养词） */
    function groupOf(f) {
        f = f || '';
        if (/圆锥曲线|三角函数|平面向量/.test(f)) return 'curves';
        if (/数与运算|有理数|实数|代数表达式|乘方|组合数学/.test(f)) return 'calc';
        if (/一次函数|二次函数|分式方程|一元一次方程|函数|坐标系|坐标变换|综合应用/.test(f)) return 'func';
        if (/尺规作图|几何与图形|几何最值|几何证明|三角形|四边形|立体图形|综合法/.test(f)) return 'geo';
        if (/概率|概率统计/.test(f)) return 'prob';
        return 'calc';
    }

    /* ---------- 组内排序：按难度升序，再按标题 ---------- */
    function sortByLearning(a, b) {
        var dA = a.difficulty || 2, dB = b.difficulty || 2;
        if (dA !== dB) return dA - dB;
        return (a.title || '').localeCompare(b.title || '');
    }

    /* ---------- 卡片工厂 ---------- */
    // 读取动画自带 tags（已清理为真实核心素养），并对缺失情况做关键词兜底
    function splitTags(s) {
        return (s || '').split(/[·•·\/]/).map(function (t) { return t.trim(); }).filter(Boolean);
    }
    function pickCompetencies(a) {
        var list = splitTags(a.tags).filter(function (t) { return ALLOWED_COMP[t]; });
        if (!list.length) {
            var t = (a.title || '') + ' ' + (a.field || '');
            if (/推理|证明|综合法|分析法|最值|动态/.test(t)) list.push('推理意识');
            if (/空间|立体|三视图|体积|棱长/.test(t)) list.push('空间观念');
            if (/直观|画图|图像|图形|尺规|几何/.test(t)) list.push('几何直观');
            if (/模型|应用|实际问题|行程|方程思想|建模/.test(t)) list.push('模型意识');
            if (/数据|统计|频率|概率/.test(t)) list.push('数据意识');
            if (/运算|加减|乘|除|混合/.test(t)) list.push('运算能力');
            if (/数感|整数|有理数|实数|相反数|估算/.test(t)) list.push('数感');
            if (/量|面积|长度|单位/.test(t)) list.push('量感');
            list = list.filter(function (x) { return ALLOWED_COMP[x]; });
        }
        if (!list.length) list = ['几何直观'];
        var seen = {}, out = [];
        list.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
        return out.slice(0, 3);
    }

    // xsyy 风格卡片：顶部大图 + 标题 + 题面 + 素养标签 + 收藏
    function makeThumb(a, compact) {
        var isNew = a.badge === 'new';
        var diff = clamp(a.difficulty || 2, 1, 5);
        var time = a.time || '5 分钟';
        var tags = pickCompetencies(a);
        var like = (hashString(a.key) % 89) + 12; // 稳定的"收藏数"

        var card = document.createElement('article');
        card.className = 'jx-card-thumb reveal' + (compact ? ' jx-card-thumb-compact' : '');
        card.id = 'jx-thumb-' + a.key;
        card.setAttribute('data-key', a.key);
        card.setAttribute('data-field', a.field || '');
        card.innerHTML =
            '<div class="jx-thumb-art' + (compact ? ' jx-thumb-art-light' : '') + '">' + renderThumbArt(a, !!compact) + '</div>' +
            '<div class="jx-thumb-body">' +
            '  <div class="jx-thumb-head">' +
            '    <h3 class="jx-thumb-title">' + a.title + '</h3>' +
            '    <button class="jx-thumb-like" aria-label="收藏" title="收藏">' +
            '      <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
            '      <span class="jx-like-count">' + like + '</span>' +
            '    </button>' +
            '    <button class="jx-thumb-ask" aria-label="问 AI" title="让 AI 用动画讲解"><span class="taiji-icon" aria-hidden="true"></span> 问 AI</button>' +
            '  </div>' +
            '  <p class="jx-thumb-desc">' + (a.problem || a.desc) + '</p>' +
            '  <div class="jx-thumb-tags">' + tags.map(function (t) { return '<span class="jx-thumb-tag">' + t + '</span>'; }).join('') + '</div>' +
            '  <div class="jx-thumb-meta">' +
            '    <span class="jx-thumb-field">' + a.field + '</span>' +
            '    <span class="jx-thumb-difficulty" title="难度">' + difficultyDots(diff) + '</span>' +
            '    <span class="jx-thumb-time">⏱ ' + time + '</span>' +
            '  </div>' +
            '</div>';

        // 收藏按钮交互（仅视觉，不持久化）
        var likeBtn = card.querySelector('.jx-thumb-like');
        if (likeBtn) {
            likeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var countEl = likeBtn.querySelector('.jx-like-count');
                var count = parseInt(countEl.textContent, 10) || 0;
                if (likeBtn.classList.toggle('liked')) {
                    countEl.textContent = count + 1;
                } else {
                    countEl.textContent = Math.max(0, count - 1);
                }
            });
        }
        // 「问 AI」按钮：打开 AI助教并预填该动画相关问题（不触发打开演示）
        var askBtn = card.querySelector('.jx-thumb-ask');
        if (askBtn) {
            askBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (window.AskAI && typeof window.AskAI.ask === 'function') {
                    window.AskAI.ask('请用交互式动画讲解：' + a.title);
                }
            });
        }
        return card;
    }

    // 完整演示卡片：只在 Modal 中渲染并 mount
    function makeFullCard(a) {
        var diff = clamp(a.difficulty || 2, 1, 5);
        var time = a.time || '5 分钟';
        var steps = a.steps || [];
        var icon = pickIcon(a);
        var card = document.createElement('article');
        card.className = 'jx-card';
        card.id = 'jx-' + a.key;
        card.setAttribute('data-key', a.key);
        card.innerHTML =
            '<div class="jx-card-head">' +
            '  <span class="jx-card-icon">' + icon + '</span>' +
            '  <div class="jx-card-titles">' +
            '    <h3 class="jx-card-title">' + a.title + '</h3>' +
            '    <p class="jx-card-tags">' + pickCompetencies(a).join(' · ') + '</p>' +
            '  </div>' +
            '  <button class="jx-card-ai-btn" aria-label="AI助教" title="让 AI 用动画讲解"><span class="taiji-icon" aria-hidden="true"></span> AI助教</button>' +
            '</div>' +
            '<div class="jx-card-meta">' +
            '  <span class="jx-card-field">' + a.field + '</span>' +
            '  <span class="jx-card-difficulty" title="难度">' + difficultyDots(diff) + '</span>' +
            '  <span class="jx-card-time">⏱ ' + time + '</span>' +
            '</div>' +
            '<p class="jx-problem">' + a.problem + '</p>' +
            (steps.length ? '<div class="jx-steps-preview">' + renderSteps(steps.slice(0, 3)) + '</div>' : '') +
            '<div class="jx-canvas-wrap"><canvas id="jx-' + a.key + '-c"></canvas></div>' +
            '<div class="jx-controls"></div>' +
            '<div class="jx-answer"></div>';

        var aiBtn = card.querySelector('.jx-card-ai-btn');
        if (aiBtn) {
            aiBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openAiDialog(a);
            });
        }
        return card;
    }

    /* AI助教对话窗口：点击弹层卡片头部「AI助教」打开，按 xsyy 机制生成动画并内嵌播放 */
    var aiDialog = null;

    // 把 solution（解题思路 / 解题步骤 / 答案）渲染成安全 HTML（供首页 ask 结果与对话气泡复用）
    function renderSolutionHtml(s) {
        if (!s) return '';
        var esc = function (t) {
            return (t == null ? '' : String(t)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };
        var h = '<div class="jx-solution">';
        if (s.thinking) {
            h += '<div class="jx-solution-block"><div class="jx-solution-label">💡 解题思路</div><div class="jx-solution-text">' + esc(s.thinking) + '</div></div>';
        }
        if (Array.isArray(s.steps) && s.steps.length) {
            h += '<div class="jx-solution-block"><div class="jx-solution-label">📐 解题步骤</div><ol class="jx-solution-steps">';
            s.steps.forEach(function (st) { h += '<li>' + esc(st) + '</li>'; });
            h += '</ol></div>';
        }
        if (s.answer) {
            h += '<div class="jx-solution-block jx-solution-answer"><div class="jx-solution-label">✅ 最终答案</div><div class="jx-solution-text">' + esc(s.answer) + '</div></div>';
        }
        h += '</div>';
        return h;
    }

    function openAiDialog(a) {
        a = a || {};
        if (aiDialog) { aiDialog.remove(); aiDialog = null; }
        var dialogId = 'jxaid_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        var wrap = document.createElement('div');
        wrap.className = 'jx-ai-dialog active';
        wrap.setAttribute('aria-hidden', 'false');
        wrap.id = dialogId;
        var title = (a.title || '').replace(/</g, '&lt;');
        var defaultQ = '请用交互式动画讲解：' + (a.title || '');
        wrap.innerHTML =
            '<div class="jx-ai-dialog-backdrop"></div>' +
            '<div class="jx-ai-dialog-shell jx-ai-dialog-light" role="dialog" aria-modal="true">' +
            '  <button class="jx-ai-dialog-close" aria-label="关闭">×</button>' +
            '  <div class="jx-ai-dialog-head">' +
            '    <span class="jx-ai-dialog-icon"><span class="taiji-icon" aria-hidden="true"></span></span>' +
            '    <div>' +
            '      <h4 class="jx-ai-dialog-title">AI助教</h4>' +
            '      <p class="jx-ai-dialog-sub">用动画讲解「' + title + '」</p>' +
            '    </div>' +
            '  </div>' +
            '  <div class="jx-ai-dialog-chat" role="log" aria-live="polite"></div>' +
            '  <div class="jx-ai-dialog-input-area">' +
            '    <div class="jx-ai-dialog-attachments" id="jx-ai-attachments-' + dialogId + '"></div>' +
            '    <div class="jx-ai-dialog-input-row">' +
            '      <div class="jx-ai-dialog-uploads">' +
            '        <button class="jx-ai-dialog-upload" data-type="image" title="上传图片" aria-label="上传图片">' +
            '          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>' +
            '        </button>' +
            '        <button class="jx-ai-dialog-upload" data-type="camera" title="拍照" aria-label="拍照">' +
            '          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor"/><path d="M20 6h-2.5l-1.5-2h-7L7.5 6H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/></svg>' +
            '        </button>' +
            '        <button class="jx-ai-dialog-upload" data-type="file" title="上传文件" aria-label="上传文件">' +
            '          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" fill="currentColor"/></svg>' +
            '        </button>' +
            '      </div>' +
            '      <input type="text" class="jx-ai-dialog-input" placeholder="例如：用动画演示这个知识点的关键步骤" value="' + defaultQ.replace(/"/g, '&quot;') + '">' +
            '      <button class="jx-ai-dialog-send">发送</button>' +
            '    </div>' +
            '    <p class="jx-ai-dialog-tip">AI 会生成交互式动画，直接在对话框内播放。支持上传图片/文件提问。</p>' +
            '  </div>' +
            '</div>';
        document.body.appendChild(wrap);
        aiDialog = wrap;
        document.body.classList.add('jx-ai-dialog-open');

        // 隐藏文件输入
        var fileInputs = {
            image: createFileInput(dialogId + '_img', 'image/*'),
            camera: createFileInput(dialogId + '_cam', 'image/*;capture=camera'),
            file: createFileInput(dialogId + '_file', '')
        };
        Object.values(fileInputs).forEach(function (inp) { wrap.appendChild(inp); });

        var shell = wrap.querySelector('.jx-ai-dialog-shell');
        var backdrop = wrap.querySelector('.jx-ai-dialog-backdrop');
        var closeBtn = wrap.querySelector('.jx-ai-dialog-close');
        var input = wrap.querySelector('.jx-ai-dialog-input');
        var sendBtn = wrap.querySelector('.jx-ai-dialog-send');
        var chatEl = wrap.querySelector('.jx-ai-dialog-chat');
        var attachmentContainer = wrap.querySelector('.jx-ai-dialog-attachments');
        var uploadBtns = wrap.querySelectorAll('.jx-ai-dialog-upload');
        var animHandles = [];
        var dialogAttachments = [];

        function close() {
            document.body.classList.remove('jx-ai-dialog-open');
            wrap.classList.remove('active');
            wrap.setAttribute('aria-hidden', 'true');
            animHandles.forEach(function (h) { if (h && typeof h.cleanup === 'function') { try { h.cleanup(); } catch (e) {} } });
            animHandles = [];
            dialogAttachments = [];
            setTimeout(function () { if (wrap.parentNode) wrap.remove(); aiDialog = null; }, 250);
        }

        function scrollToBottom() {
            chatEl.scrollTop = chatEl.scrollHeight;
        }

        function appendMessage(role, html, mountSpec) {
            var msg = document.createElement('div');
            msg.className = 'jx-ai-msg jx-ai-msg-' + role;
            var inner = document.createElement('div');
            inner.className = 'jx-ai-msg-bubble';
            inner.innerHTML = html;
            msg.appendChild(inner);
            chatEl.appendChild(msg);
            if (mountSpec && window.AnimEngine && typeof window.AnimEngine.render === 'function') {
                var mount = document.createElement('div');
                mount.className = 'jx-ai-msg-anim';
                inner.appendChild(mount);
                try {
                    var handle = window.AnimEngine.render(mountSpec, mount);
                    if (handle && typeof handle.cleanup === 'function') animHandles.push(handle);
                } catch (e) {
                    mount.innerHTML = '<p class="jx-ai-msg-anim-err">动画渲染失败：' + (e && e.message) + '</p>';
                }
            }
            scrollToBottom();
            return msg;
        }

        function setLoading(isLoading) {
            input.disabled = isLoading;
            sendBtn.disabled = isLoading;
            sendBtn.textContent = isLoading ? '生成中…' : '发送';
        }

        function readFileAsBase64(file) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function () { resolve(reader.result); };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        function readFileAsText(file) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function () { resolve(reader.result); };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }
        function isImageFile(file) { return file && file.type && file.type.indexOf('image/') === 0; }

        function renderDialogAttachments() {
            if (!attachmentContainer) return;
            attachmentContainer.innerHTML = '';
            dialogAttachments.forEach(function (att, idx) {
                var item = document.createElement('span');
                item.className = 'jx-ai-dialog-attachment';
                if (att.type === 'image') {
                    item.innerHTML = '<img src="' + att.data + '" alt=""> ' + escapeHtml(att.name) +
                        ' <button data-idx="' + idx + '" aria-label="移除">×</button>';
                } else {
                    item.innerHTML = '📄 ' + escapeHtml(att.name) +
                        ' <button data-idx="' + idx + '" aria-label="移除">×</button>';
                }
                attachmentContainer.appendChild(item);
            });
            attachmentContainer.querySelectorAll('button').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    dialogAttachments.splice(parseInt(btn.dataset.idx, 10), 1);
                    renderDialogAttachments();
                });
            });
        }

        async function handleDialogFileSelect(file) {
            if (!file) return;
            try {
                if (isImageFile(file)) {
                    var data = await readFileAsBase64(file);
                    dialogAttachments.push({ type: 'image', name: file.name, data: data });
                } else {
                    var text = await readFileAsText(file);
                    dialogAttachments.push({ type: 'file', name: file.name, data: text });
                }
                renderDialogAttachments();
            } catch (e) { console.error('读取附件失败', e); }
        }

        function buildDialogAttachmentContext() {
            if (!dialogAttachments.length) return '';
            var parts = dialogAttachments.map(function (att, i) {
                if (att.type === 'image') {
                    return '[附件' + (i + 1) + '：图片 ' + att.name + ']\n' + att.data;
                }
                return '[附件' + (i + 1) + '：文件 ' + att.name + ']\n' + att.data;
            });
            return '用户上传了以下附件，请结合附件内容生成教学动画：\n' + parts.join('\n\n');
        }

        uploadBtns.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var type = btn.dataset.type;
                var inp = fileInputs[type];
                if (inp) inp.click();
            });
        });
        Object.keys(fileInputs).forEach(function (type) {
            fileInputs[type].addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (file) handleDialogFileSelect(file);
                e.target.value = '';
            });
        });

        async function submit() {
            var q = input.value.trim();
            if (!q && !dialogAttachments.length) { input.focus(); return; }
            var context = buildDialogAttachmentContext();
            var displayQ = q;
            if (dialogAttachments.length) {
                displayQ = (q ? q + ' ' : '') + '（附 ' + dialogAttachments.length + ' 个附件）';
            }
            appendMessage('user', escapeHtml(displayQ));
            input.value = '';
            input.focus();
            setLoading(true);
            var thinking = appendMessage('ai', '<div class="jx-ai-dialog-thinking"><span></span><span></span><span></span>AI助教正在生成动画…</div>');
            try {
                var gen = window.AskAI && window.AskAI.generateAnimation;
                if (typeof gen !== 'function') throw new Error('AI助教未初始化');
                var data = await gen({ question: q, context: context });
                var answer = data.answer || '';
                var spec = data.spec;
                var solution = data.solution || null;
                thinking.remove();
                var html = '';
                if (answer) {
                    html += '<div class="jx-ai-dialog-answer">' + answer.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>';
                }
                if (solution && typeof renderSolutionHtml === 'function') {
                    html += renderSolutionHtml(solution);
                }
                if (!spec || !Array.isArray(spec.objects) || !spec.objects.length) {
                    if (!html) html += '<div class="jx-ai-dialog-hint">💡 这个问题暂时没能生成可交互动画，我再用文字补充说明一下。</div>';
                }
                appendMessage('ai', html, spec);
            } catch (err) {
                thinking.remove();
                appendMessage('ai', '<div class="jx-ai-dialog-error">AI 生成失败：' + (err && err.message ? err.message : '请检查网络或后端服务') + '</div>');
            } finally {
                setLoading(false);
                dialogAttachments = [];
                renderDialogAttachments();
            }
        }

        closeBtn.addEventListener('click', close);
        backdrop.addEventListener('click', close);
        sendBtn.addEventListener('click', submit);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape' && wrap && wrap.classList.contains('active')) { close(); document.removeEventListener('keydown', esc); }
        });

        appendMessage('ai', '你好！我是 <strong>AI助教</strong>，你可以直接问我数学问题，我会在这个对话框里生成可交互的教学动画。');

        // 如果有预置的初始问题+结果（例如首页搜索栏直接生成后打开），自动展示
        if (a.initialQuestion) {
            input.value = '';
            appendMessage('user', (a.initialQuestion + '').replace(/</g, '&lt;'));
            var initHtml = '';
            if (a.initialAnswer) {
                initHtml += '<div class="jx-ai-dialog-answer">' + (a.initialAnswer + '').replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>';
            }
            if (a.initialSolution && typeof renderSolutionHtml === 'function') {
                initHtml += renderSolutionHtml(a.initialSolution);
            }
            if (!a.initialSpec || !Array.isArray(a.initialSpec.objects) || !a.initialSpec.objects.length) {
                if (!initHtml) initHtml += '<div class="jx-ai-dialog-hint">💡 已收到你的问题，可以继续追问。</div>';
            }
            appendMessage('ai', initHtml, a.initialSpec);
        }

        setTimeout(function () { input.focus(); if (!a.initialQuestion) input.select(); }, 50);
    }

    function membersOf(groupKey) {
        return anims.filter(function (a) { return groupOf(a.field) === groupKey; })
                    .sort(sortByLearning);
    }

    // 横向滚动容器支持鼠标拖拽滚动
    function enableDragScroll(el) {
        if (!el) return;
        var isDown = false, startX, scrollLeft;
        el.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            isDown = true;
            el.classList.add('dragging');
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        });
        el.addEventListener('mouseleave', function () { isDown = false; el.classList.remove('dragging'); });
        el.addEventListener('mouseup', function () { isDown = false; el.classList.remove('dragging'); });
        el.addEventListener('mousemove', function (e) {
            if (!isDown) return;
            e.preventDefault();
            var x = e.pageX - el.offsetLeft;
            var walk = (x - startX) * 1.2;
            el.scrollLeft = scrollLeft - walk;
        });
    }

    function build() {
        var guideGrid = $('#guide .guide-grid');
        if (!guideGrid) return;

        // reveal 观察器：row 进入视口时，同步让栏内所有卡片可见，
        // 避免横向滚动容器中的卡片因单独观察未触发而保持 opacity:0
        var obs = ('IntersectionObserver' in window)
            ? new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    e.target.classList.add('visible');
                    if (e.target.classList.contains('jx-row')) {
                        var cards = $$('.jx-card-thumb', e.target);
                        cards.forEach(function (c) { c.classList.add('visible'); });
                    }
                    obs.unobserve(e.target);
                });
            }, { threshold: 0.05, rootMargin: '0px 0px 80px 0px' })
            : null;

        // 过滤标签
        var filterTags = ['全部'].concat(FILTER_TAGS);

        var extra = document.createElement('div');
        extra.id = 'jiaoxue';
        extra.className = 'jx-guide-extra';
        extra.innerHTML =
            '<div class="jx-guide-extra-head">' +
            '  <h2 class="section-title">已生成的交互式教学动画</h2>' +
            '  <p class="jx-guide-extra-sub">探索智慧 · 在交互中理解数学的本质</p>' +
            '</div>' +
            '<div class="jx-filter-bar">' +
            filterTags.map(function (t, i) {
                return '<button class="jx-filter-btn' + (i === 0 ? ' active' : '') + '" data-filter="' + t + '">' + t + '</button>';
            }).join('') +
            '</div>' +
            '<div class="jx-rows"></div>';
        guideGrid.parentNode.insertBefore(extra, guideGrid.nextSibling);

        var rowsWrap = $('.jx-rows', extra);

        GROUPS.forEach(function (g) {
            var members = membersOf(g.key);
            if (!members.length) return;
            var q = QUOTES[g.key] || { text: '', author: '' };
            var row = document.createElement('div');
            row.className = 'jx-row reveal';
            row.setAttribute('data-group', g.key);
            row.innerHTML =
                '<div class="jx-row-head">' +
                '  <div class="jx-row-icon">' + g.icon + '</div>' +
                '  <div class="jx-row-titles">' +
                '    <h3 class="jx-row-title">' + g.title + '</h3>' +
                '    <p class="jx-row-quote">“' + q.text + '” <span class="jx-row-author">—— ' + q.author + '</span></p>' +
                '  </div>' +
                '  <span class="jx-row-count">' + members.length + ' 课</span>' +
                '</div>' +
                '<div class="jx-row-scroll"></div>';
            var scroll = $('.jx-row-scroll', row);
            members.forEach(function (a) {
                var card = makeThumb(a, true);
                scroll.appendChild(card);
                if (obs) obs.observe(card);
                card.addEventListener('click', function (e) {
                    if (e.target.closest('.jx-thumb-like')) return;
                    openModal(a.key);
                });
            });
            enableDragScroll(scroll);
            rowsWrap.appendChild(row);
            if (obs) obs.observe(row);
        });

        // 过滤标签交互：按卡片真实素养标签匹配，隐藏无匹配卡片的栏
        var filterBtns = $$('.jx-filter-btn', extra);
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tag = btn.getAttribute('data-filter');
                filterBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
                var rows = $$('.jx-row', rowsWrap);
                rows.forEach(function (r) {
                    var cards = $$('.jx-card-thumb', r);
                    var rowHas = false;
                    cards.forEach(function (c) {
                        var akey = c.getAttribute('data-key');
                        var a = anims.filter(function (x) { return x.key === akey; })[0];
                        var tags = pickCompetencies(a || {});
                        var match = (tag === '全部' || tags.indexOf(tag) > -1);
                        c.style.display = match ? '' : 'none';
                        if (match) { rowHas = true; c.classList.add('visible'); }
                    });
                    r.style.display = rowHas ? '' : 'none';
                    if (rowHas) r.classList.add('visible');
                });
            });
        });
    }

    function init() { build(); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ---------- 暴露 API ---------- */
    window.JX = {
        register: register,
        build: build,
        openModal: openModal,
        openGenerated: openGenerated,
        openAiDialog: openAiDialog,
        renderSolution: renderSolutionHtml,
        closeModal: closeModal,
        $: $, $$: $$, lerp: lerp, clamp: clamp, rand: rand, TAU: TAU,
        isInViewport: isInViewport,
        setupCanvas: setupCanvas,
        resizable: resizable,
        loop: loop,
        draw: { clearBG: clearBG, line: line, circle: circle, dot: dot, label: label, roundRect: roundRect, coordSys: coordSys }
    };
})();
