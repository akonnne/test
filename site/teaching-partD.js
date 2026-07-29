/* ============================================================
   教学动画 · 曲线·向量·三角新增模块 (teaching-partD.js)
   新增 10 个交互式动画，覆盖三角函数、圆锥曲线、平面向量与复数几何。
   ============================================================ */
(function () {
    'use strict';
    var JX = window.JX;
    var D = JX.draw;
    function q(sel, card) { return JX.$(sel, card); }
    function slider(id, label, min, max, step, val, unit) {
        unit = unit || '';
        return '<div class="control-group"><label>' + label +
            ' <span id="' + id + '-v">' + val + unit + '</span></label>' +
            '<input type="range" id="' + id + '" min="' + min + '" max="' + max +
            '" step="' + step + '" value="' + val + '"></div>';
    }
    function setAns(answer, html) { answer.innerHTML = html; }
    function bind(sel, card, ev, fn) { q(sel, card).addEventListener(ev, fn); }

    /* =========================================================
       D1 · 正弦函数图像
       ========================================================= */
    JX.register({
        key: 'sine-wave', title: '正弦函数图像', field: '三角函数 · 图像与性质',
        difficulty: 2, time: '4 分钟',
        steps: ['观察单位圆上点的纵坐标。', '将角度 θ 与 sin θ 对应到坐标系。', '拖动 θ，追踪正弦曲线的形成。'],
        tags: '几何直观 · 推理意识', badge: 'new',
        desc: '用单位圆与函数图像联动的方式，直观理解 y = sin x 的周期性与对称性。',
        problem: '正弦函数 <span class="formula">y = sin x</span> 的图像长什么样？拖动相位角，观察单位圆上点的纵坐标如何对应到曲线。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('sw-a', '振幅 A', 0.5, 3, 0.1, 1, '') +
                slider('sw-w', '角频率 ω', 0.5, 3, 0.1, 1, '') +
                slider('sw-p', '初相 φ', -3.14, 3.14, 0.1, 0, ' rad');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var A = +q('#sw-a', card).value, omega = +q('#sw-w', card).value, phi = +q('#sw-p', card).value;
                var cx = w * 0.12, cy = h * 0.35, r = Math.min(w, h) * 0.18;
                D.circle(ctx, cx, cy, r, null, 'rgba(212,165,116,0.5)', 2);
                D.line(ctx, cx - r - 10, cy, cx + r + 10, cy, 'rgba(201,209,217,0.3)', 1);
                D.line(ctx, cx, cy - r - 10, cx, cy + r + 10, 'rgba(201,209,217,0.3)', 1);
                var px = cx + r * Math.cos(phi), py = cy - r * Math.sin(phi);
                D.line(ctx, cx, cy, px, py, '#d4a574', 2);
                D.dot(ctx, px, py, 6, '#e6c9a8');
                D.label(ctx, 'P', px + 8, py - 8, '#e6c9a8', 'left', '12px');
                // 函数图像
                var gx = w * 0.38, gy = cy, gw = w * 0.55, gh = r * 2;
                D.line(ctx, gx, gy, gx + gw, gy, 'rgba(201,209,217,0.3)', 1);
                D.line(ctx, gx, gy - gh * 0.5, gx, gy + gh * 0.5, 'rgba(201,209,217,0.3)', 1);
                ctx.beginPath();
                for (var x = 0; x <= gw; x++) {
                    var t = x / gw * 4 * Math.PI;
                    var y = A * r * Math.sin(omega * t + phi);
                    if (x === 0) ctx.moveTo(gx + x, gy - y); else ctx.lineTo(gx + x, gy - y);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                D.label(ctx, 'y = A·sin(ωx + φ)', gx + gw * 0.5, gy + gh * 0.5 + 24, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">振幅 A=' + A + '，角频率 ω=' + omega + '，初相 φ=' + phi.toFixed(2) + '</p>');
            }
            bind('#sw-a', card, 'input', function () { q('#sw-a-v', card).textContent = q('#sw-a', card).value; draw(); });
            bind('#sw-w', card, 'input', function () { q('#sw-w-v', card).textContent = q('#sw-w', card).value; draw(); });
            bind('#sw-p', card, 'input', function () { q('#sw-p-v', card).textContent = q('#sw-p', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       D2 · 余弦定理
       ========================================================= */
    JX.register({
        key: 'cosine-law', title: '余弦定理', field: '平面向量 · 边角关系',
        difficulty: 3, time: '5 分钟',
        steps: ['给定三角形两边 a、b 及其夹角 C。', '用向量法或几何法推导 c² = a² + b² - 2ab cos C。', '改变夹角，验证公式。'],
        tags: '推理意识 · 运算能力', badge: 'new',
        desc: '通过可拖动的三角形，实时验证余弦定理并观察钝角、锐角对第三边的影响。',
        problem: '三角形中已知两边 <span class="mk">a、b</span> 及其夹角 <span class="mk">C</span>，如何用公式求第三边 <span class="formula">c</span>？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('cl-a', '边 a', 2, 8, 0.5, 5, '') +
                slider('cl-b', '边 b', 2, 8, 0.5, 6, '') +
                slider('cl-C', '夹角 C', 30, 150, 1, 60, '°');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var a = +q('#cl-a', card).value, b = +q('#cl-b', card).value, Cdeg = +q('#cl-C', card).value;
                var C = Cdeg * Math.PI / 180;
                var c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C));
                var s = Math.min(w / 18, h / 10);
                var ox = w * 0.15, oy = h * 0.72;
                var A = { x: ox, y: oy }, B = { x: ox + a * s, y: oy };
                var Pc = { x: ox + b * s * Math.cos(C), y: oy - b * s * Math.sin(C) };
                ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(Pc.x, Pc.y); ctx.closePath();
                ctx.fillStyle = 'rgba(212,165,116,0.14)'; ctx.fill(); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                D.dot(ctx, A.x, A.y, 6, '#5c8a8a'); D.dot(ctx, B.x, B.y, 6, '#5c8a8a'); D.dot(ctx, Pc.x, Pc.y, 6, '#5c8a8a');
                D.label(ctx, 'A', A.x, A.y + 22, '#e6c9a8', 'center', '13px');
                D.label(ctx, 'B', B.x, B.y + 22, '#e6c9a8', 'center', '13px');
                D.label(ctx, 'C', Pc.x, Pc.y - 18, '#e6c9a8', 'center', '13px');
                D.label(ctx, 'a=' + a, (A.x + B.x) * 0.5, A.y + 36, '#e6c9a8', 'center', '12px');
                D.label(ctx, 'b=' + b, (A.x + Pc.x) * 0.5 - 10, (A.y + Pc.y) * 0.5, '#e6c9a8', 'right', '12px');
                D.label(ctx, 'c≈' + c.toFixed(2), (B.x + Pc.x) * 0.5 + 8, (B.y + Pc.y) * 0.5, '#e6c9a8', 'left', '12px');
                var arcR = 32;
                ctx.beginPath(); ctx.arc(A.x, A.y, arcR, -C, 0); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5; ctx.stroke();
                D.label(ctx, '∠C=' + Cdeg + '°', A.x + arcR + 12, A.y - 12, '#e74c3c', 'left', '12px');
                setAns(answer, '<p class="formula">c² = a² + b² - 2ab·cos C = ' + a + '² + ' + b + '² - 2·' + a + '·' + b + '·cos ' + Cdeg + '°<br>c ≈ <strong>' + c.toFixed(3) + '</strong></p>');
            }
            bind('#cl-a', card, 'input', function () { q('#cl-a-v', card).textContent = q('#cl-a', card).value; draw(); });
            bind('#cl-b', card, 'input', function () { q('#cl-b-v', card).textContent = q('#cl-b', card).value; draw(); });
            bind('#cl-C', card, 'input', function () { q('#cl-C-v', card).textContent = q('#cl-C', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       D3 · 双曲线的定义
       ========================================================= */
    JX.register({
        key: 'hyperbola', title: '双曲线的定义', field: '圆锥曲线 · 双曲线',
        difficulty: 3, time: '5 分钟',
        steps: ['固定两个焦点 F₁、F₂。', '拖动点 P，使其到两焦点距离之差的绝对值恒定。', '观察双曲线两支的形成。'],
        tags: '几何直观 · 推理意识', badge: 'new',
        desc: '用距离差恒定的几何条件，动态绘制双曲线并理解焦点、实轴等概念。',
        problem: '平面上到两定点距离之差的绝对值为常数的点的轨迹是什么？拖动 P，验证 <span class="formula">||PF₁| - |PF₂|| = 2a</span>。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('hb-a', '实半轴 a', 1, 4, 0.2, 2, '') +
                slider('hb-c', '半焦距 c', 3, 7, 0.2, 5, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var a = +q('#hb-a', card).value, c = Math.max(a + 0.3, +q('#hb-c', card).value);
                var cx = w * 0.5, cy = h * 0.55, s = Math.min(w / 18, h / 10);
                var F1 = { x: cx - c * s, y: cy }, F2 = { x: cx + c * s, y: cy };
                D.dot(ctx, F1.x, F1.y, 6, '#e74c3c'); D.dot(ctx, F2.x, F2.y, 6, '#e74c3c');
                D.label(ctx, 'F₁', F1.x, F1.y + 22, '#e74c3c', 'center', '12px');
                D.label(ctx, 'F₂', F2.x, F2.y + 22, '#e74c3c', 'center', '12px');
                // 双曲线
                ctx.beginPath();
                for (var x = a + 0.05; x <= 8; x += 0.05) {
                    var y = a * Math.sqrt(x * x / (c * c - a * a) - 1) * Math.sqrt(c * c - a * a) / a;
                    var yy = y * s * 0.5;
                    if (x === a + 0.05) ctx.moveTo(cx + x * s, cy - yy); else ctx.lineTo(cx + x * s, cy - yy);
                }
                for (var x = 8; x >= a + 0.05; x -= 0.05) {
                    var y = a * Math.sqrt(x * x / (c * c - a * a) - 1) * Math.sqrt(c * c - a * a) / a;
                    var yy = y * s * 0.5;
                    ctx.lineTo(cx + x * s, cy + yy);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2; ctx.stroke();
                // 左支
                ctx.beginPath();
                for (var x = -(a + 0.05); x >= -8; x -= 0.05) {
                    var y = a * Math.sqrt(x * x / (c * c - a * a) - 1) * Math.sqrt(c * c - a * a) / a;
                    var yy = y * s * 0.5;
                    if (x === -(a + 0.05)) ctx.moveTo(cx + x * s, cy - yy); else ctx.lineTo(cx + x * s, cy - yy);
                }
                for (var x = -8; x <= -(a + 0.05); x += 0.05) {
                    var y = a * Math.sqrt(x * x / (c * c - a * a) - 1) * Math.sqrt(c * c - a * a) / a;
                    var yy = y * s * 0.5;
                    ctx.lineTo(cx + x * s, cy + yy);
                }
                ctx.stroke();
                D.label(ctx, '2a = ' + (2 * a).toFixed(1), cx, cy - h * 0.22, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">||PF₁| - |PF₂|| = 2a = ' + (2 * a).toFixed(1) + '，c = ' + c.toFixed(1) + '<br>b² = c² - a² = ' + (c * c - a * a).toFixed(2) + '</p>');
            }
            bind('#hb-a', card, 'input', function () { q('#hb-a-v', card).textContent = q('#hb-a', card).value; draw(); });
            bind('#hb-c', card, 'input', function () { q('#hb-c-v', card).textContent = q('#hb-c', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       D4 · 抛物线的几何定义
       ========================================================= */
    JX.register({
        key: 'parabola-geo', title: '抛物线的几何定义', field: '圆锥曲线 · 抛物线',
        difficulty: 2, time: '4 分钟',
        steps: ['设定焦点 F 和准线 l。', '拖动点 P，保持 |PF| = d(P, l)。', '观察抛物线轨迹。'],
        tags: '几何直观 · 推理意识', badge: 'new',
        desc: '用“到定点距离等于到定直线距离”的定义，动态生成抛物线。',
        problem: '平面上到定点 <span class="mk">F</span> 与定直线 <span class="mk">l</span> 距离相等的点的轨迹是什么？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('pg-p', '焦准距 p', 1, 5, 0.2, 3, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var p = +q('#pg-p', card).value;
                var cx = w * 0.5, cy = h * 0.55, s = Math.min(w / 18, h / 10) * 1.2;
                var F = { x: cx, y: cy - p * s * 0.5 };
                var directrixY = cy + p * s * 0.5;
                D.line(ctx, 20, directrixY, w - 20, directrixY, 'rgba(231,76,60,0.6)', 2);
                D.label(ctx, '准线 l', w - 28, directrixY - 8, '#e74c3c', 'right', '12px');
                D.dot(ctx, F.x, F.y, 6, '#e74c3c');
                D.label(ctx, 'F', F.x, F.y - 16, '#e74c3c', 'center', '12px');
                ctx.beginPath();
                for (var x = -8; x <= 8; x += 0.05) {
                    var y = x * x / (4 * p);
                    if (x === -8) ctx.moveTo(cx + x * s, cy - y * s); else ctx.lineTo(cx + x * s, cy - y * s);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                // 示例点
                var ex = 3;
                var ey = ex * ex / (4 * p);
                var Px = cx + ex * s, Py = cy - ey * s;
                D.dot(ctx, Px, Py, 6, '#e6c9a8');
                D.line(ctx, Px, Py, Px, directrixY, 'rgba(201,209,217,0.5)', 1.5);
                D.line(ctx, Px, Py, F.x, F.y, 'rgba(201,209,217,0.5)', 1.5);
                D.label(ctx, 'P', Px + 10, Py - 6, '#e6c9a8', 'left', '12px');
                setAns(answer, '<p class="formula">|PF| = d(P,l)，标准方程 x² = 4py = ' + (4 * p).toFixed(1) + 'y</p>');
            }
            bind('#pg-p', card, 'input', function () { q('#pg-p-v', card).textContent = q('#pg-p', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       D5 · 向量的数量积
       ========================================================= */
    JX.register({
        key: 'vector-dot', title: '向量的数量积', field: '平面向量 · 数量积',
        difficulty: 2, time: '4 分钟',
        steps: ['设定两个向量 a、b 的模长与夹角。', '数量积 a·b = |a||b|cosθ。', '改变夹角，观察正负变化。'],
        tags: '运算能力 · 几何直观', badge: 'new',
        desc: '通过向量夹角与投影，直观理解数量积的几何意义。',
        problem: '两个向量 <span class="formula">a、b</span> 的夹角为 θ，如何计算它们的数量积？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('vd-a', '|a|', 1, 6, 0.2, 4, '') +
                slider('vd-b', '|b|', 1, 6, 0.2, 5, '') +
                slider('vd-t', '夹角 θ', 0, 180, 1, 45, '°');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var aa = +q('#vd-a', card).value, bb = +q('#vd-b', card).value, tdeg = +q('#vd-t', card).value;
                var theta = tdeg * Math.PI / 180;
                var cx = w * 0.25, cy = h * 0.6, s = Math.min(w / 16, h / 10);
                var Ax = cx + aa * s, Ay = cy;
                var Bx = cx + bb * s * Math.cos(theta), By = cy - bb * s * Math.sin(theta);
                D.line(ctx, cx, cy, Ax, Ay, '#5c8a8a', 3);
                D.line(ctx, cx, cy, Bx, By, '#d4a574', 3);
                D.dot(ctx, cx, cy, 5, '#e6c9a8');
                D.label(ctx, 'a', (cx + Ax) * 0.5, (cy + Ay) * 0.5 - 10, '#5c8a8a', 'center', '13px');
                D.label(ctx, 'b', (cx + Bx) * 0.5 - 6, (cy + By) * 0.5 - 10, '#d4a574', 'center', '13px');
                // 投影
                var proj = bb * Math.cos(theta);
                var Px = cx + proj * s, Py = cy;
                D.line(ctx, Bx, By, Px, Py, 'rgba(231,76,60,0.5)', 1.5);
                D.dot(ctx, Px, Py, 5, '#e74c3c');
                D.label(ctx, '投影', (Bx + Px) * 0.5, (By + Py) * 0.5 - 10, '#e74c3c', 'center', '11px');
                var dot = aa * bb * Math.cos(theta);
                setAns(answer, '<p class="formula">a·b = |a||b|cos θ = ' + aa + '×' + bb + '×cos ' + tdeg + '° ≈ <strong>' + dot.toFixed(2) + '</strong></p>');
            }
            bind('#vd-a', card, 'input', function () { q('#vd-a-v', card).textContent = q('#vd-a', card).value; draw(); });
            bind('#vd-b', card, 'input', function () { q('#vd-b-v', card).textContent = q('#vd-b', card).value; draw(); });
            bind('#vd-t', card, 'input', function () { q('#vd-t-v', card).textContent = q('#vd-t', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       D6 · 平面向量分解
       ========================================================= */
    JX.register({
        key: 'vector-decompose', title: '平面向量分解', field: '平面向量 · 基底分解',
        difficulty: 3, time: '5 分钟',
        steps: ['给定一组不共线基底 e₁、e₂。', '任意向量 a 可唯一表示为 λe₁ + μe₂。', '拖动目标向量，观察分解系数变化。'],
        tags: '几何直观 · 运算能力', badge: 'new',
        desc: '用平行四边形法则演示平面向量基本定理：任意向量可由一组基底唯一线性表示。',
        problem: '如何用一组不共线基底 <span class="mk">e₁、e₂</span> 表示平面内任意向量 <span class="formula">a</span>？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<p class="jx-hint">拖动红色终点，改变向量 a，观察它如何被 e₁、e₂ 线性表示。</p>';
            var cx = 0.5, cy = 0.55, ex1 = 0.3, ey1 = -0.15, ex2 = 0.2, ey2 = 0.25, tx = 0.55, ty = -0.1;
            var drag = -1;
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var s = Math.min(w, h) * 0.7;
                var Ox = w * cx, Oy = h * cy;
                var E1 = { x: Ox + ex1 * s, y: Oy + ey1 * s }, E2 = { x: Ox + ex2 * s, y: Oy + ey2 * s };
                var T = { x: Ox + tx * s, y: Oy + ty * s };
                D.line(ctx, Ox, Oy, E1.x, E1.y, 'rgba(92,138,138,0.8)', 2);
                D.line(ctx, Ox, Oy, E2.x, E2.y, 'rgba(212,165,116,0.8)', 2);
                D.label(ctx, 'e₁', (Ox + E1.x) * 0.5, (Oy + E1.y) * 0.5 - 10, '#5c8a8a', 'center', '13px');
                D.label(ctx, 'e₂', (Ox + E2.x) * 0.5 + 10, (Oy + E2.y) * 0.5, '#d4a574', 'left', '13px');
                D.line(ctx, Ox, Oy, T.x, T.y, '#e74c3c', 3);
                D.dot(ctx, T.x, T.y, 8, '#e74c3c');
                D.label(ctx, 'a', (Ox + T.x) * 0.5 - 10, (Oy + T.y) * 0.5, '#e74c3c', 'right', '13px');
                // 分解
                var det = ex1 * ey2 - ex2 * ey1;
                var lam = (tx * ey2 - ty * ex2) / det;
                var mu = (ex1 * ty - ey1 * tx) / det;
                var P1 = { x: Ox + lam * ex1 * s, y: Oy + lam * ey1 * s };
                var P2 = { x: Ox + mu * ex2 * s, y: Oy + mu * ey2 * s };
                D.line(ctx, P1.x, P1.y, T.x, T.y, 'rgba(201,209,217,0.4)', 1.5);
                D.line(ctx, P2.x, P2.y, T.x, T.y, 'rgba(201,209,217,0.4)', 1.5);
                D.dot(ctx, P1.x, P1.y, 5, '#5c8a8a'); D.dot(ctx, P2.x, P2.y, 5, '#d4a574');
                setAns(answer, '<p class="formula">a ≈ ' + lam.toFixed(2) + ' e₁ + ' + mu.toFixed(2) + ' e₂</p>');
            }
            function hit(p, x, y) { return Math.hypot(p.x - x, p.y - y) < 18; }
            function down(e) { var r = cv.getBoundingClientRect(); var x = e.clientX - r.left, y = e.clientY - r.top; if (hit({ x: w * cx + tx * Math.min(w, h) * 0.7, y: h * cy + ty * Math.min(w, h) * 0.7 }, x, y)) drag = 0; }
            function move(e) { if (drag < 0) return; var r = cv.getBoundingClientRect(); var s = Math.min(r.width, r.height) * 0.7; tx = Math.max(-0.6, Math.min(0.6, (e.clientX - r.width * cx) / s)); ty = Math.max(-0.4, Math.min(0.4, (e.clientY - r.height * cy) / s)); draw(); }
            function up() { drag = -1; }
            cv.addEventListener('mousedown', down);
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
            card._jxCleanup = function () { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
            draw();
        }
    });

    /* =========================================================
       D7 · 三角函数诱导公式
       ========================================================= */
    JX.register({
        key: 'trig-induction', title: '三角函数诱导公式', field: '三角函数 · 诱导公式',
        difficulty: 2, time: '4 分钟',
        steps: ['在单位圆上选择任意角 α。', '观察 α + π、-α、π/2 - α 的终边位置。', '推导 sin、cos 的诱导公式。'],
        tags: '推理意识 · 几何直观', badge: 'new',
        desc: '借助单位圆对称性，直观理解三角函数诱导公式的来源。',
        problem: '已知 <span class="formula">sin α</span>，如何快速求 <span class="formula">sin(α + π)、sin(-α)、sin(π/2 - α)</span>？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('ti-a', '角 α', 0, 360, 1, 30, '°') +
                '<div class="jx-btn-row"><button class="action-btn" id="ti-plus">α + π</button><button class="action-btn" id="ti-neg">-α</button><button class="action-btn" id="ti-minus">π/2 - α</button></div>';
            var mode = 'plus';
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var alpha = +q('#ti-a', card).value * Math.PI / 180;
                var cx = w * 0.35, cy = h * 0.55, r = Math.min(w, h) * 0.22;
                D.circle(ctx, cx, cy, r, null, 'rgba(212,165,116,0.5)', 2);
                D.line(ctx, cx - r - 10, cy, cx + r + 10, cy, 'rgba(201,209,217,0.3)', 1);
                D.line(ctx, cx, cy - r - 10, cx, cy + r + 10, 'rgba(201,209,217,0.3)', 1);
                var beta = mode === 'plus' ? alpha + Math.PI : (mode === 'neg' ? -alpha : Math.PI / 2 - alpha);
                var P = { x: cx + r * Math.cos(alpha), y: cy - r * Math.sin(alpha) };
                var Q = { x: cx + r * Math.cos(beta), y: cy - r * Math.sin(beta) };
                D.line(ctx, cx, cy, P.x, P.y, '#5c8a8a', 2);
                D.line(ctx, cx, cy, Q.x, Q.y, '#d4a574', 2);
                D.dot(ctx, P.x, P.y, 6, '#5c8a8a'); D.dot(ctx, Q.x, Q.y, 6, '#d4a574');
                D.label(ctx, 'α', P.x + 8, P.y - 8, '#5c8a8a', 'left', '12px');
                D.label(ctx, mode === 'plus' ? 'α+π' : (mode === 'neg' ? '-α' : 'π/2-α'), Q.x + 8, Q.y - 8, '#d4a574', 'left', '12px');
                var formulas = {
                    plus: 'sin(α+π) = -sin α，cos(α+π) = -cos α',
                    neg: 'sin(-α) = -sin α，cos(-α) = cos α',
                    minus: 'sin(π/2-α) = cos α，cos(π/2-α) = sin α'
                };
                D.label(ctx, formulas[mode], w * 0.72, cy, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">' + formulas[mode] + '</p>');
            }
            bind('#ti-a', card, 'input', function () { q('#ti-a-v', card).textContent = q('#ti-a', card).value; draw(); });
            bind('#ti-plus', card, 'click', function () { mode = 'plus'; draw(); });
            bind('#ti-neg', card, 'click', function () { mode = 'neg'; draw(); });
            bind('#ti-minus', card, 'click', function () { mode = 'minus'; draw(); });
            draw();
        }
    });

    /* =========================================================
       D8 · 正切函数图像
       ========================================================= */
    JX.register({
        key: 'tangent-wave', title: '正切函数图像', field: '三角函数 · 图像与性质',
        difficulty: 2, time: '4 分钟',
        steps: ['观察 tan θ = sin θ / cos θ。', '当 cos θ = 0 时出现垂直渐近线。', '理解周期为 π。'],
        tags: '几何直观 · 推理意识', badge: 'new',
        desc: '绘制 y = tan x 的图像，观察渐近线、周期性与对称中心。',
        problem: '正切函数 <span class="formula">y = tan x</span> 的图像有什么特点？它与 sin x、cos x 有什么关系？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('tw-k', '系数 k', 0.5, 3, 0.1, 1, '') +
                slider('tw-a', '垂直拉伸 A', 0.5, 3, 0.1, 1, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var k = +q('#tw-k', card).value, A = +q('#tw-a', card).value;
                var cx = w * 0.5, cy = h * 0.55, s = Math.min(w / 16, h / 10);
                D.line(ctx, 20, cy, w - 20, cy, 'rgba(201,209,217,0.3)', 1);
                D.line(ctx, cx, 20, cx, h - 20, 'rgba(201,209,217,0.3)', 1);
                // 渐近线
                for (var n = -3; n <= 3; n++) {
                    var ax = cx + ((n + 0.5) * Math.PI / k) * s;
                    if (ax > 20 && ax < w - 20) D.line(ctx, ax, 20, ax, h - 20, 'rgba(231,76,60,0.35)', 1.5);
                }
                ctx.beginPath();
                var started = false;
                for (var x = -w * 0.5; x <= w * 0.5; x += 1) {
                    var t = x / s;
                    var y = A * Math.tan(k * t);
                    if (!isFinite(y) || Math.abs(y) > h * 0.45) { started = false; continue; }
                    if (!started) { ctx.moveTo(cx + x, cy - y * s); started = true; }
                    else ctx.lineTo(cx + x, cy - y * s);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                D.label(ctx, 'y = A·tan(kx)', w * 0.5, 32, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">周期 T = π / k = ' + (Math.PI / k).toFixed(2) + '</p>');
            }
            bind('#tw-k', card, 'input', function () { q('#tw-k-v', card).textContent = q('#tw-k', card).value; draw(); });
            bind('#tw-a', card, 'input', function () { q('#tw-a-v', card).textContent = q('#tw-a', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       D9 · 极坐标与参数方程
       ========================================================= */
    JX.register({
        key: 'polar-curve', title: '极坐标与参数方程', field: '圆锥曲线 · 极坐标',
        difficulty: 3, time: '5 分钟',
        steps: ['选择曲线类型：阿基米德螺线、心形线或玫瑰线。', '拖动参数 n，观察极坐标方程 r = f(θ) 的图形。', '比较极坐标与直角坐标的表达。'],
        tags: '模型意识 · 几何直观', badge: 'new',
        desc: '用极坐标方程绘制经典曲线，感受不同坐标系下数学之美的统一。',
        problem: '极坐标方程 <span class="formula">r = a + b·cos(nθ)</span> 能画出哪些优美曲线？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row"><button class="action-btn" id="pc-arch">阿基米德螺线</button><button class="action-btn" id="pc-card">心形线</button><button class="action-btn" id="pc-rose">玫瑰线</button></div>' +
                slider('pc-n', '参数 n', 1, 8, 1, 3, '');
            var mode = 'arch';
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var n = +q('#pc-n', card).value;
                var cx = w * 0.5, cy = h * 0.55, rMax = Math.min(w, h) * 0.38;
                D.circle(ctx, cx, cy, rMax * 0.2, null, 'rgba(212,165,116,0.25)', 1);
                D.circle(ctx, cx, cy, rMax * 0.4, null, 'rgba(212,165,116,0.25)', 1);
                D.circle(ctx, cx, cy, rMax * 0.6, null, 'rgba(212,165,116,0.25)', 1);
                ctx.beginPath();
                for (var t = 0; t <= 20 * Math.PI; t += 0.02) {
                    var r;
                    if (mode === 'arch') r = rMax * t / (6 * Math.PI);
                    else if (mode === 'card') r = rMax * 0.5 * (1 + Math.cos(t));
                    else r = rMax * 0.6 * Math.cos(n * t);
                    var x = cx + r * Math.cos(t), y = cy - r * Math.sin(t);
                    if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2; ctx.stroke();
                var labels = { arch: 'r = kθ（阿基米德螺线）', card: 'r = a(1 + cos θ)（心形线）', rose: 'r = a·cos(nθ)（玫瑰线）' };
                D.label(ctx, labels[mode], w * 0.5, 32, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">' + labels[mode] + '</p>');
            }
            bind('#pc-arch', card, 'click', function () { mode = 'arch'; draw(); });
            bind('#pc-card', card, 'click', function () { mode = 'card'; draw(); });
            bind('#pc-rose', card, 'click', function () { mode = 'rose'; draw(); });
            bind('#pc-n', card, 'input', function () { q('#pc-n-v', card).textContent = q('#pc-n', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       D10 · 复数的几何意义
       ========================================================= */
    JX.register({
        key: 'complex-plane', title: '复数的几何意义', field: '平面向量 · 复数几何',
        difficulty: 2, time: '4 分钟',
        steps: ['在复平面上确定复数 z = a + bi。', '观察模 |z| 与辐角 arg(z)。', '改变实部、虚部，理解复数与平面向量的一一对应。'],
        tags: '几何直观 · 模型意识', badge: 'new',
        desc: '把复数看作复平面上的向量，直观理解模、辐角及其几何运算意义。',
        problem: '复数 <span class="formula">z = a + bi</span> 在复平面上对应哪个点？它的模和辐角是多少？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('cp-a', '实部 a', -5, 5, 0.5, 3, '') +
                slider('cp-b', '虚部 b', -5, 5, 0.5, 2, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var a = +q('#cp-a', card).value, b = +q('#cp-b', card).value;
                var cx = w * 0.5, cy = h * 0.55, s = Math.min(w / 16, h / 10);
                D.line(ctx, 20, cy, w - 20, cy, 'rgba(201,209,217,0.3)', 1);
                D.line(ctx, cx, 20, cx, h - 20, 'rgba(201,209,217,0.3)', 1);
                D.label(ctx, '实轴', w - 28, cy + 16, 'rgba(201,209,217,0.6)', 'right', '11px');
                D.label(ctx, '虚轴', cx + 14, 24, 'rgba(201,209,217,0.6)', 'left', '11px');
                var Px = cx + a * s, Py = cy - b * s;
                D.line(ctx, cx, cy, Px, Py, '#d4a574', 2.5);
                D.dot(ctx, Px, Py, 7, '#e6c9a8');
                D.label(ctx, 'z=' + a + '+' + b + 'i', Px + 10, Py - 10, '#e6c9a8', 'left', '12px');
                var mod = Math.sqrt(a * a + b * b);
                var arg = Math.atan2(b, a) * 180 / Math.PI;
                var arcR = Math.min(40, mod * s * 0.5);
                if (mod > 0.3) {
                    ctx.beginPath(); ctx.arc(cx, cy, arcR, 0, Math.atan2(b, a)); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5; ctx.stroke();
                }
                D.label(ctx, '|z|=' + mod.toFixed(2) + ', arg=' + arg.toFixed(0) + '°', w * 0.5, 32, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">|z| = √(a²+b²) = ' + mod.toFixed(2) + '，arg(z) = ' + arg.toFixed(1) + '°</p>');
            }
            bind('#cp-a', card, 'input', function () { q('#cp-a-v', card).textContent = q('#cp-a', card).value; draw(); });
            bind('#cp-b', card, 'input', function () { q('#cp-b-v', card).textContent = q('#cp-b', card).value; draw(); });
            draw();
        }
    });
})();
