/* ============================================================
   教学动画 · 第二批新增模块 (teaching-partC.js)
   覆盖 xsyy.top 截图/滚动区中尚未复刻的 12 个常见题型。
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
       C1 · 整数加法（1+1 型）
       ========================================================= */
    JX.register({
        key: 'integer-addition', title: '整数加法计算', field: '数与运算 · 整数加减',
        difficulty: 1, time: '3 分钟',
        steps: ['在数轴上标出第一个加数。', '按第二个加数的大小向右（正）或向左（负）移动。', '落点即为和。'],
        tags: '运算能力 · 数感', badge: 'new',
        desc: '用数轴直观演示两个整数相加：从起点出发，按方向和距离移动，落点就是和。',
        problem: '计算 <span class="formula">a + b</span>。在数轴上从 <span class="mk">a</span> 出发，移动 <span class="mk">b</span> 个单位，观察终点对应的数。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('ia-a', '加数 a', -10, 10, 1, 3, '') +
                slider('ia-b', '加数 b', -10, 10, 1, 4, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var a = +q('#ia-a', card).value, b = +q('#ia-b', card).value;
                var sum = a + b;
                var cx = w * 0.5, cy = h * 0.55, unit = Math.min(w / 28, h / 14);
                D.line(ctx, 20, cy, w - 20, cy, 'rgba(212,165,116,0.5)', 2);
                for (var i = -12; i <= 12; i++) {
                    var x = cx + i * unit;
                    D.line(ctx, x, cy - 4, x, cy + 4, 'rgba(201,209,217,0.5)', 1);
                    if (Math.abs(i) <= 10) D.label(ctx, String(i), x, cy + 18, 'rgba(201,209,217,0.85)', 'center', '12px');
                }
                D.dot(ctx, cx + a * unit, cy, 7, '#d4a574');
                D.label(ctx, 'a=' + a, cx + a * unit, cy - 18, '#d4a574', 'center', '13px');
                var arrColor = b >= 0 ? '#5c8a8a' : '#e74c3c';
                D.line(ctx, cx + a * unit, cy, cx + sum * unit, cy, arrColor, 3);
                D.dot(ctx, cx + sum * unit, cy, 7, '#e6c9a8');
                D.label(ctx, '和=' + sum, cx + sum * unit, cy - 28, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">' + a + ' + ' + b + ' = <strong>' + sum + '</strong></p>');
            }
            bind('#ia-a', card, 'input', draw);
            bind('#ia-b', card, 'input', draw);
            draw();
        }
    });

    /* =========================================================
       C2 · 相反数的概念
       ========================================================= */
    JX.register({
        key: 'opposite-number', title: '相反数的概念', field: '数与运算 · 相反数',
        difficulty: 1, time: '3 分钟',
        steps: ['在数轴上标出数 a。', '找到关于原点对称的另一个点。', '验证 a + (-a) = 0。'],
        tags: '数感 · 运算能力', badge: 'new',
        desc: '在数轴上观察一对相反数：它们位于原点两侧，到原点距离相等，和为 0。',
        problem: '数 <span class="formula">a</span> 的相反数是什么？在数轴上标出 <span class="mk">a</span> 与 <span class="mk">-a</span>，观察它们到原点的距离关系。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('on-a', '数 a', -8, 8, 1, 5, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var a = +q('#on-a', card).value;
                var cx = w * 0.5, cy = h * 0.55, unit = Math.min(w / 24, h / 12);
                D.line(ctx, 20, cy, w - 20, cy, 'rgba(212,165,116,0.5)', 2);
                for (var i = -10; i <= 10; i++) {
                    var x = cx + i * unit;
                    D.line(ctx, x, cy - 4, x, cy + 4, 'rgba(201,209,217,0.5)', 1);
                    if (Math.abs(i) <= 8) D.label(ctx, String(i), x, cy + 18, 'rgba(201,209,217,0.85)', 'center', '12px');
                }
                D.dot(ctx, cx, cy, 5, '#d4a574');
                D.label(ctx, '0', cx, cy + 32, '#d4a574', 'center', '13px');
                if (a !== 0) {
                    D.dot(ctx, cx + a * unit, cy, 8, '#5c8a8a');
                    D.label(ctx, 'a = ' + a, cx + a * unit, cy - 22, '#5c8a8a', 'center', '13px');
                    D.dot(ctx, cx - a * unit, cy, 8, '#e74c3c');
                    D.label(ctx, '-a = ' + (-a), cx - a * unit, cy - 22, '#e74c3c', 'center', '13px');
                    D.line(ctx, cx + a * unit, cy - 35, cx - a * unit, cy - 35, 'rgba(201,209,217,0.4)', 1);
                    D.label(ctx, '到原点距离相等', cx, cy - 42, 'rgba(201,209,217,0.7)', 'center', '11px');
                }
                setAns(answer, '<p class="formula">' + a + ' 的相反数是 <strong>' + (-a) + '</strong>；' + a + ' + (' + (-a) + ') = <strong>0</strong></p>');
            }
            bind('#on-a', card, 'input', draw);
            draw();
        }
    });

    /* =========================================================
       C3 · 三角形内角和
       ========================================================= */
    JX.register({
        key: 'triangle-angle-sum', title: '三角形内角和', field: '几何与图形 · 三角形',
        difficulty: 2, time: '4 分钟',
        steps: ['拖动三角形顶点改变形状。', '量出三个内角。', '发现无论怎么变，三个内角和恒为 180°。'],
        tags: '推理意识 · 几何直观', badge: 'new',
        desc: '任意拖动三角形顶点，实时测量三个内角，验证三角形内角和恒为 180°。',
        problem: '任意三角形的三个内角之和是多少？拖动顶点改变形状，观察 <span class="mk">∠A + ∠B + ∠C</span> 是否始终不变。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<p class="jx-hint">拖动顶点 A/B/C，观察三个内角和。</p>';
            var P = [{ x: 0.35, y: 0.25 }, { x: 0.15, y: 0.75 }, { x: 0.75, y: 0.7 }];
            var drag = -1;
            function ang(a, b, c) {
                var A = Math.atan2(a.y - b.y, a.x - b.x);
                var C = Math.atan2(c.y - b.y, c.x - b.x);
                var d = Math.abs(A - C);
                if (d > Math.PI) d = 2 * Math.PI - d;
                return d;
            }
            function toDeg(r) { return Math.round(r * 180 / Math.PI); }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var pts = P.map(function (p) { return { x: p.x * w, y: p.y * h }; });
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                ctx.lineTo(pts[1].x, pts[1].y);
                ctx.lineTo(pts[2].x, pts[2].y);
                ctx.closePath();
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                ctx.fillStyle = 'rgba(212,165,116,0.12)'; ctx.fill();
                var angs = [
                    toDeg(ang(pts[1], pts[0], pts[2])),
                    toDeg(ang(pts[0], pts[1], pts[2])),
                    toDeg(ang(pts[0], pts[2], pts[1]))
                ];
                var sum = angs[0] + angs[1] + angs[2];
                ['A', 'B', 'C'].forEach(function (lab, i) {
                    D.dot(ctx, pts[i].x, pts[i].y, 8, '#5c8a8a');
                    D.label(ctx, lab, pts[i].x, pts[i].y - 16, '#e6c9a8', 'center', '14px');
                    D.label(ctx, '∠' + lab + '=' + angs[i] + '°', pts[i].x, pts[i].y + 26, 'rgba(201,209,217,0.9)', 'center', '12px');
                });
                setAns(answer, '<p class="formula">∠A + ∠B + ∠C = ' + angs[0] + '° + ' + angs[1] + '° + ' + angs[2] + '° = <strong>' + sum + '°</strong></p>');
            }
            function down(e) { var r = cv.getBoundingClientRect(); var x = (e.clientX - r.left), y = (e.clientY - r.top); drag = -1; P.forEach(function (p, i) { if (Math.hypot(x - p.x * r.width, y - p.y * r.height) < 18) drag = i; }); }
            function move(e) { if (drag < 0) return; var r = cv.getBoundingClientRect(); P[drag].x = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width)); P[drag].y = Math.max(0.1, Math.min(0.9, (e.clientY - r.top) / r.height)); draw(); }
            function up() { drag = -1; }
            cv.addEventListener('mousedown', down);
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
            card._jxCleanup = function () { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
            draw();
        }
    });

    /* =========================================================
       C4 · 勾股定理推导（赵爽弦图）
       ========================================================= */
    JX.register({
        key: 'pythagorean-proof', title: '勾股定理推导', field: '几何与图形 · 直角三角形',
        difficulty: 3, time: '5 分钟',
        steps: ['构造一个边长为 c 的大正方形。', '内部用 4 个全等直角三角形围成一个小正方形。', '用面积关系推出 a² + b² = c²。'],
        tags: '推理意识 · 几何直观', badge: 'new',
        desc: '用赵爽弦图演示勾股定理：大正方形面积 = 小正方形面积 + 4 个直角三角形面积。',
        problem: '直角三角形两直角边为 <span class="mk">a</span>、<span class="mk">b</span>，斜边为 <span class="mk">c</span>。通过面积拼补证明 <span class="formula">a² + b² = c²</span>。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('pp-a', '直角边 a', 2, 7, 0.5, 3, '') +
                slider('pp-b', '直角边 b', 2, 7, 0.5, 4, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var a = +q('#pp-a', card).value, b = +q('#pp-b', card).value;
                var c = Math.sqrt(a * a + b * b);
                var s = Math.min(w, h) * 0.6 / (a + b);
                var ox = (w - (a + b) * s) * 0.5, oy = (h - (a + b) * s) * 0.55;
                var A = { x: ox, y: oy }, B = { x: ox + (a + b) * s, y: oy };
                var C = { x: ox + (a + b) * s, y: oy + (a + b) * s }, Dp = { x: ox, y: oy + (a + b) * s };
                ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(Dp.x, Dp.y); ctx.closePath();
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2; ctx.stroke();
                var pts = [A, { x: ox + a * s, y: oy }, { x: ox + (a + b) * s, y: oy + a * s }, { x: ox + b * s, y: oy + (a + b) * s }, Dp];
                ctx.beginPath(); ctx.moveTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y); ctx.lineTo(pts[3].x, pts[3].y); ctx.lineTo(pts[4].x, pts[4].y); ctx.closePath();
                ctx.strokeStyle = 'rgba(201,209,217,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
                for (var i = 0; i < 4; i++) {
                    ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[(i + 1) % 4].x, pts[(i + 1) % 4].y); ctx.lineTo(pts[(i + 4) % 5 === 0 ? 4 : (i + 4) % 5].x, pts[(i + 4) % 5 === 0 ? 4 : (i + 4) % 5].y); ctx.closePath();
                    ctx.fillStyle = 'rgba(92,138,138,0.18)'; ctx.fill();
                }
                D.label(ctx, 'c', ox + (a + b) * s * 0.5, oy - 10, '#e6c9a8', 'center', '14px');
                D.label(ctx, 'a²+b²=c²', ox + (a + b) * s * 0.5, oy + (a + b) * s * 0.5, '#d4a574', 'center', '14px');
                setAns(answer, '<p class="formula">a=' + a + ', b=' + b + ', c≈' + c.toFixed(3) + '<br>大正方形面积 = c² = ' + (c * c).toFixed(2) + '<br>4×三角形 + 小正方形 = 2ab + (b-a)² = <strong>' + (a * a + b * b).toFixed(2) + '</strong></p>');
            }
            bind('#pp-a', card, 'input', function () { q('#pp-a-v', card).textContent = q('#pp-a', card).value; draw(); });
            bind('#pp-b', card, 'input', function () { q('#pp-b-v', card).textContent = q('#pp-b', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       C5 · 长方体体积计算
       ========================================================= */
    JX.register({
        key: 'cuboid-volume', title: '长方体体积计算', field: '立体图形 · 体积',
        difficulty: 1, time: '4 分钟',
        steps: ['确定长方体的长、宽、高。', '用公式 V = 长 × 宽 × 高。', '拖动滑块观察体积变化。'],
        tags: '量感 · 空间观念', badge: 'new',
        desc: '通过拖动长、宽、高，直观理解长方体体积公式 V = lwh。',
        problem: '一个长方体的长、宽、高分别为 <span class="mk">l</span>、<span class="mk">w</span>、<span class="mk">h</span>，求体积 <span class="formula">V</span>。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('cv-l', '长 l', 1, 8, 1, 4, '') +
                slider('cv-w', '宽 w', 1, 6, 1, 3, '') +
                slider('cv-h', '高 h', 1, 5, 1, 2, '');
            function isoBox(ctx, x, y, l, w, h, s) {
                var dx = l * s, dy = w * s * 0.55, dz = h * s;
                ctx.beginPath();
                ctx.moveTo(x, y); ctx.lineTo(x + dx, y - dy * 0.3); ctx.lineTo(x + dx - dy, y + dy * 0.7); ctx.lineTo(x - dy, y + dy); ctx.closePath();
                ctx.fillStyle = 'rgba(212,165,116,0.18)'; ctx.fill(); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y); ctx.lineTo(x + dx, y - dy * 0.3); ctx.lineTo(x + dx, y - dy * 0.3 - dz); ctx.lineTo(x, y - dz); ctx.closePath();
                ctx.fillStyle = 'rgba(92,138,138,0.22)'; ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + dx, y - dy * 0.3); ctx.lineTo(x + dx - dy, y + dy * 0.7); ctx.lineTo(x + dx - dy, y + dy * 0.7 - dz); ctx.lineTo(x + dx, y - dy * 0.3 - dz); ctx.closePath();
                ctx.fillStyle = 'rgba(231,76,60,0.15)'; ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y - dz); ctx.lineTo(x + dx, y - dy * 0.3 - dz); ctx.lineTo(x + dx - dy, y + dy * 0.7 - dz); ctx.lineTo(x - dy, y + dy - dz); ctx.closePath();
                ctx.fillStyle = 'rgba(212,165,116,0.28)'; ctx.fill(); ctx.stroke();
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var l = +q('#cv-l', card).value, ww = +q('#cv-w', card).value, hh = +q('#cv-h', card).value;
                var s = Math.min(w / 14, h / 10);
                isoBox(ctx, w * 0.45, h * 0.68, l, ww, hh, s);
                D.label(ctx, 'l=' + l, w * 0.45 + l * s * 0.5, h * 0.68 - ww * s * 0.2, '#e6c9a8', 'center', '13px');
                D.label(ctx, 'w=' + ww, w * 0.45 + l * s - ww * s * 0.6, h * 0.68 + ww * s * 0.4, '#e6c9a8', 'center', '13px');
                D.label(ctx, 'h=' + hh, w * 0.45 + l * s + 15, h * 0.68 - hh * s * 0.5, '#e6c9a8', 'left', '13px');
                setAns(answer, '<p class="formula">V = l × w × h = ' + l + ' × ' + ww + ' × ' + hh + ' = <strong>' + (l * ww * hh) + '</strong></p>');
            }
            bind('#cv-l', card, 'input', function () { q('#cv-l-v', card).textContent = q('#cv-l', card).value; draw(); });
            bind('#cv-w', card, 'input', function () { q('#cv-w-v', card).textContent = q('#cv-w', card).value; draw(); });
            bind('#cv-h', card, 'input', function () { q('#cv-h-v', card).textContent = q('#cv-h', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       C6 · 实数混合运算
       ========================================================= */
    JX.register({
        key: 'real-number-ops', title: '实数混合运算', field: '数与运算 · 实数运算',
        difficulty: 3, time: '5 分钟',
        steps: ['先算乘方、开方、绝对值。', '再算乘除。', '最后算加减，得出结果。'],
        tags: '运算能力 · 数感', badge: 'new',
        desc: '分步演示含乘方、绝对值、根号的实数混合运算，逐步高亮当前步骤。',
        problem: '计算 <span class="formula">(-2)² + |√3 - 2| - √12 + (1/3)⁻¹</span>。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row"><button class="action-btn" id="rno-prev">上一步</button><button class="action-btn" id="rno-next">下一步</button></div>';
            var step = 0;
            var steps = [
                { text: '(-2)² + |√3 - 2| - √12 + (1/3)⁻¹', note: '原式' },
                { text: '= 4 + (2 - √3) - 2√3 + 3', note: '乘方、绝对值、根式、负指数' },
                { text: '= (4 + 2 + 3) - (√3 + 2√3)', note: '合并同类项' },
                { text: '= 9 - 3√3', note: '最终结果' }
            ];
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                ctx.textAlign = 'center';
                ctx.font = '500 18px "Noto Serif SC", serif';
                ctx.fillStyle = '#e6c9a8';
                ctx.fillText('实数混合运算分步演示', w * 0.5, 36);
                for (var i = 0; i < steps.length; i++) {
                    var y = 80 + i * 48;
                    ctx.fillStyle = i <= step ? '#e6c9a8' : 'rgba(201,209,217,0.4)';
                    ctx.font = i === step ? '600 17px "Noto Sans SC", sans-serif' : '400 15px "Noto Sans SC", sans-serif';
                    ctx.fillText(steps[i].text, w * 0.5, y);
                    ctx.font = '400 12px "Noto Sans SC", sans-serif';
                    ctx.fillStyle = 'rgba(212,165,116,0.8)';
                    ctx.fillText(steps[i].note, w * 0.5, y + 18);
                }
                setAns(answer, '<p class="formula">当前步骤：' + steps[step].note + '</p>');
            }
            bind('#rno-prev', card, 'click', function () { step = Math.max(0, step - 1); draw(); });
            bind('#rno-next', card, 'click', function () { step = Math.min(steps.length - 1, step + 1); draw(); });
            draw();
        }
    });

    /* =========================================================
       C7 · 平行线间三角形等积
       ========================================================= */
    JX.register({
        key: 'equal-area-triangles', title: '平行线间三角形等积', field: '几何与图形 · 面积',
        difficulty: 2, time: '4 分钟',
        steps: ['画两条平行线。', '固定底边，移动顶点在另一条平行线上。', '观察面积不变。'],
        tags: '几何直观 · 量感', badge: 'new',
        desc: '在两条平行线之间，等底等高的三角形面积相等。拖动顶点验证这一性质。',
        problem: '两条平行线间有一个三角形，底边固定。把顶点沿平行线拖动，三角形面积是否变化？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<p class="jx-hint">拖动顶点 C 在上方平行线上左右移动。</p>';
            var baseY = 0.75, topY = 0.3, Cx = 0.5;
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var y1 = h * topY, y2 = h * baseY;
                D.line(ctx, 20, y1, w - 20, y1, 'rgba(212,165,116,0.5)', 2);
                D.line(ctx, 20, y2, w - 20, y2, 'rgba(212,165,116,0.5)', 2);
                D.label(ctx, '平行线', w - 28, y1 - 8, 'rgba(201,209,217,0.6)', 'right', '11px');
                var A = { x: w * 0.2, y: y2 }, B = { x: w * 0.5, y: y2 }, C = { x: w * Cx, y: y1 };
                ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath();
                ctx.fillStyle = 'rgba(92,138,138,0.25)'; ctx.fill(); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2; ctx.stroke();
                D.dot(ctx, A.x, A.y, 6, '#5c8a8a'); D.dot(ctx, B.x, B.y, 6, '#5c8a8a'); D.dot(ctx, C.x, C.y, 8, '#e74c3c');
                D.label(ctx, 'A', A.x, A.y + 20, '#e6c9a8', 'center', '13px');
                D.label(ctx, 'B', B.x, A.y + 20, '#e6c9a8', 'center', '13px');
                D.label(ctx, 'C', C.x, C.y - 16, '#e6c9a8', 'center', '13px');
                D.line(ctx, C.x, y1, C.x, y2, 'rgba(231,76,60,0.6)', 1.5);
                D.label(ctx, '高 h', C.x + 8, (y1 + y2) * 0.5, '#e74c3c', 'left', '12px');
                var base = (B.x - A.x) / 40, height = (y2 - y1) / 40;
                var area = 0.5 * base * height;
                setAns(answer, '<p class="formula">底 = ' + base.toFixed(2) + '，高 = ' + height.toFixed(2) + '<br>S = ½ × 底 × 高 = <strong>' + area.toFixed(3) + '</strong></p>');
            }
            function down(e) { var r = cv.getBoundingClientRect(); var x = e.clientX - r.left, y = e.clientY - r.top; if (Math.abs(y - h * topY) < 18) Cx = Math.max(0.15, Math.min(0.85, x / r.width)); draw(); }
            function move(e) { if (e.buttons !== 1) return; down(e); }
            cv.addEventListener('mousedown', down);
            cv.addEventListener('mousemove', move);
            draw();
        }
    });

    /* =========================================================
       C8 · 乘方计算（指数增长）
       ========================================================= */
    JX.register({
        key: 'power-calc', title: '乘方计算', field: '数与运算 · 乘方',
        difficulty: 2, time: '4 分钟',
        steps: ['选择底数和指数。', '观察幂的值如何随指数快速增长。', '理解乘方的意义。'],
        tags: '运算能力 · 数感', badge: 'new',
        desc: '用条形图展示乘方增长，例如 2 的多次幂如何快速变大。',
        problem: '计算 <span class="formula">aⁿ</span>。选择底数 a 和指数 n，观察幂随指数增长的趋势。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('pc-a', '底数 a', 2, 5, 1, 2, '') +
                slider('pc-n', '指数 n', 1, 20, 1, 10, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var a = +q('#pc-a', card).value, n = +q('#pc-n', card).value;
                var vals = [];
                for (var i = 1; i <= n; i++) vals.push(Math.pow(a, i));
                var max = vals[vals.length - 1];
                var barW = Math.max(4, (w - 60) / n - 4);
                for (var i = 0; i < n; i++) {
                    var bh = Math.min(h * 0.65, (vals[i] / max) * h * 0.6);
                    var x = 40 + i * (barW + 4);
                    var y = h * 0.78 - bh;
                    ctx.fillStyle = i === n - 1 ? '#d4a574' : 'rgba(92,138,138,0.7)';
                    ctx.fillRect(x, y, barW, bh);
                    D.label(ctx, String(i + 1), x + barW * 0.5, h * 0.78 + 16, 'rgba(201,209,217,0.8)', 'center', '10px');
                    if (bh > 20) D.label(ctx, vals[i].toString(), x + barW * 0.5, y + 14, '#fff', 'center', '10px');
                }
                D.label(ctx, a + ' 的 1~' + n + ' 次方', w * 0.5, 28, '#e6c9a8', 'center', '15px');
                setAns(answer, '<p class="formula">' + a + '<sup>' + n + '</sup> = <strong>' + (Math.pow(a, n)).toLocaleString() + '</strong></p>');
            }
            bind('#pc-a', card, 'input', function () { q('#pc-a-v', card).textContent = q('#pc-a', card).value; draw(); });
            bind('#pc-n', card, 'input', function () { q('#pc-n-v', card).textContent = q('#pc-n', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       C9 · 鸡兔同笼问题
       ========================================================= */
    JX.register({
        key: 'chicken-rabbit', title: '鸡兔同笼问题', field: '综合应用 · 方程建模',
        difficulty: 2, time: '5 分钟',
        steps: ['设鸡 x 只，兔 y 只。', '列方程组：x + y = 头数，2x + 4y = 脚数。', '解方程组得到答案。'],
        tags: '模型意识 · 推理意识', badge: 'new',
        desc: '用假设法或方程法解经典鸡兔同笼问题，拖动头数和脚数观察答案变化。',
        problem: '鸡兔同笼，上有 35 个头，下有 94 只脚。鸡和兔各有多少只？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('cr-h', '头数', 5, 60, 1, 35, '') +
                slider('cr-f', '脚数', 10, 200, 2, 94, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var heads = +q('#cr-h', card).value, feet = +q('#cr-f', card).value;
                var y = (feet - 2 * heads) / 2, x = heads - y;
                var valid = y >= 0 && x >= 0 && Number.isInteger(y) && (2 * x + 4 * y === feet);
                var cx = w * 0.5;
                // 画鸡和兔
                var total = heads || 1;
                var iconW = Math.min(40, (w - 60) / total);
                var startX = (w - iconW * total) * 0.5;
                for (var i = 0; i < heads; i++) {
                    var ix = startX + i * iconW + iconW * 0.5;
                    var isRabbit = i >= x;
                    ctx.fillStyle = isRabbit ? '#d4a574' : '#5c8a8a';
                    ctx.beginPath(); ctx.arc(ix, h * 0.35, iconW * 0.35, 0, JX.TAU); ctx.fill();
                    D.label(ctx, isRabbit ? '兔' : '鸡', ix, h * 0.35 + 5, '#fff', 'center', '12px');
                }
                D.label(ctx, '共 ' + heads + ' 个头，' + feet + ' 只脚', cx, h * 0.58, '#e6c9a8', 'center', '14px');
                if (valid) {
                    setAns(answer, '<p class="formula">鸡 <strong>' + x + '</strong> 只，兔 <strong>' + y + '</strong> 只</p>');
                } else {
                    setAns(answer, '<p class="formula">无解（脚数需满足：2×头数 ≤ 脚数 ≤ 4×头数，且为偶数）</p>');
                }
            }
            bind('#cr-h', card, 'input', function () { q('#cr-h-v', card).textContent = q('#cr-h', card).value; draw(); });
            bind('#cr-f', card, 'input', function () { q('#cr-f-v', card).textContent = q('#cr-f', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       C10 · 列车追及相遇应用题
       ========================================================= */
    JX.register({
        key: 'train-meet', title: '列车追及相遇应用题', field: '综合应用 · 行程问题',
        difficulty: 3, time: '5 分钟',
        steps: ['确定两车速度、车长与初始距离。', '相遇问题：相对速度 = 速度之和。', '追及问题：相对速度 = 速度之差。'],
        tags: '模型意识 · 量感', badge: 'new',
        desc: '用线段图演示两列火车在同一直线上的相遇与追及，拖动速度观察运动过程。',
        problem: '快车长 180m、速度 25m/s，货车长 100m。快车追上并超过货车用了 28 秒；若两车相向而行，从相遇到完全离开需要几秒？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row"><button class="action-btn" id="tm-mode">切换：追及 → 相遇</button></div>' +
                slider('tm-v1', '快车速度 m/s', 10, 50, 1, 25, '') +
                slider('tm-v2', '货车速度 m/s', 5, 40, 1, 15, '');
            var mode = 'chase'; // chase / meet
            var t = 0, playing = false;
            function reset() { t = 0; playing = true; }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var v1 = +q('#tm-v1', card).value, v2 = +q('#tm-v2', card).value;
                var L1 = 180, L2 = 100;
                var scale = (w - 80) / 1200;
                var roadY = h * 0.55;
                D.line(ctx, 20, roadY, w - 20, roadY, 'rgba(212,165,116,0.5)', 2);
                var x1, x2;
                if (mode === 'chase') {
                    var vrel = v1 - v2;
                    var T = vrel > 0 ? (L1 + L2) / vrel : 0;
                    if (playing && T > 0) { t += 0.05; if (t > T) t = T; }
                    x1 = 30 + (v1 * t) * scale;
                    x2 = 30 + (v2 * t) * scale;
                } else {
                    var vrel = v1 + v2;
                    var T = vrel > 0 ? (L1 + L2) / vrel : 0;
                    if (playing && T > 0) { t += 0.05; if (t > T) t = T; }
                    x1 = 30 + (v1 * t) * scale;
                    x2 = w - 30 - L2 * scale - (v2 * t) * scale;
                }
                ctx.fillStyle = 'rgba(92,138,138,0.6)'; ctx.fillRect(x1, roadY - 28, L1 * scale, 18);
                ctx.fillStyle = 'rgba(231,76,60,0.6)'; ctx.fillRect(x2, roadY + 10, L2 * scale, 18);
                D.label(ctx, '快', x1 + L1 * scale * 0.5, roadY - 17, '#fff', 'center', '11px');
                D.label(ctx, '货', x2 + L2 * scale * 0.5, roadY + 21, '#fff', 'center', '11px');
                var T = mode === 'chase' ? (L1 + L2) / Math.max(0.1, v1 - v2) : (L1 + L2) / Math.max(0.1, v1 + v2);
                D.label(ctx, (mode === 'chase' ? '追及' : '相遇') + ' 时间 ≈ ' + T.toFixed(2) + 's', w * 0.5, 30, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">' + (mode === 'chase' ? '追及' : '相遇') + '时间 = (L₁+L₂) / ' + (mode === 'chase' ? '(v₁-v₂)' : '(v₁+v₂)') + ' = ' + (L1 + L2) + ' / ' + (mode === 'chase' ? (v1 - v2) : (v1 + v2)) + ' ≈ <strong>' + T.toFixed(2) + ' 秒</strong></p>');
            }
            bind('#tm-mode', card, 'click', function () { mode = mode === 'chase' ? 'meet' : 'chase'; q('#tm-mode', card).textContent = mode === 'chase' ? '切换：追及 → 相遇' : '切换：相遇 → 追及'; reset(); });
            bind('#tm-v1', card, 'input', function () { q('#tm-v1-v', card).textContent = q('#tm-v1', card).value; reset(); });
            bind('#tm-v2', card, 'input', function () { q('#tm-v2-v', card).textContent = q('#tm-v2', card).value; reset(); });
            JX.loop(cv, draw);
        }
    });

    /* =========================================================
       C11 · 平行四边形面积推导
       ========================================================= */
    JX.register({
        key: 'parallelogram-area', title: '平行四边形面积推导', field: '几何与图形 · 面积',
        difficulty: 2, time: '4 分钟',
        steps: ['从平行四边形一边作高。', '沿高剪下一个直角三角形。', '平移拼成长方形，面积 = 底 × 高。'],
        tags: '几何直观 · 量感', badge: 'new',
        desc: '通过割补法把平行四边形转化成长方形，直观推导面积公式 S = 底 × 高。',
        problem: '平行四边形的面积怎么求？拖动底和高，观察割补成长方形后的面积。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('pa-b', '底', 3, 10, 0.5, 6, '') +
                slider('pa-h', '高', 2, 7, 0.5, 4, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var b = +q('#pa-b', card).value, hh = +q('#pa-h', card).value;
                var skew = 1.2, s = Math.min(w / 16, h / 12);
                var ox = (w - (b + skew + 1) * s) * 0.5, oy = h * 0.65;
                // 原平行四边形
                var A = { x: ox + skew * s, y: oy }, B = { x: ox + (b + skew) * s, y: oy };
                var C = { x: ox + b * s, y: oy - hh * s }, Dp = { x: ox, y: oy - hh * s };
                ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(Dp.x, Dp.y); ctx.closePath();
                ctx.fillStyle = 'rgba(212,165,116,0.15)'; ctx.fill(); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2; ctx.stroke();
                // 高
                D.line(ctx, C.x, C.y, C.x, oy, 'rgba(231,76,60,0.7)', 1.5);
                D.label(ctx, '高', C.x + 8, (C.y + oy) * 0.5, '#e74c3c', 'left', '12px');
                D.label(ctx, '底', (A.x + B.x) * 0.5, oy + 18, '#e6c9a8', 'center', '13px');
                // 割补后的长方形示意
                var rx = ox + (b + skew + 2) * s, ry = oy - hh * s;
                ctx.strokeStyle = 'rgba(92,138,138,0.7)'; ctx.lineWidth = 1.5;
                ctx.strokeRect(rx, ry, b * s, hh * s);
                D.label(ctx, 'S = 底 × 高', rx + b * s * 0.5, ry + hh * s * 0.5, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">S = 底 × 高 = ' + b + ' × ' + hh + ' = <strong>' + (b * hh) + '</strong></p>');
            }
            bind('#pa-b', card, 'input', function () { q('#pa-b-v', card).textContent = q('#pa-b', card).value; draw(); });
            bind('#pa-h', card, 'input', function () { q('#pa-h-v', card).textContent = q('#pa-h', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       C12 · 坐标变换规律
       ========================================================= */
    JX.register({
        key: 'coordinate-transform', title: '坐标变换规律', field: '函数与图形 · 坐标变换',
        difficulty: 2, time: '4 分钟',
        steps: ['给定三角形顶点坐标。', '选择平移、关于 x 轴对称或关于原点对称。', '观察变换后坐标的变化规律。'],
        tags: '几何直观 · 模型意识', badge: 'new',
        desc: '在坐标系中拖动三角形，实时观察平移、轴对称、中心对称后的坐标变化。',
        problem: '点 P(x, y) 经过平移、x 轴对称、原点对称后，新坐标分别是什么？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row"><button class="action-btn" id="ct-t">平移 (+3,+2)</button><button class="action-btn" id="ct-x">关于 x 轴对称</button><button class="action-btn" id="ct-o">关于原点对称</button></div>';
            var mode = 'translate';
            var P = [{ x: 1, y: 2 }, { x: 4, y: 1 }, { x: 2, y: 4 }];
            function transform(x, y) {
                if (mode === 'translate') return { x: x + 3, y: y + 2 };
                if (mode === 'xaxis') return { x: x, y: -y };
                return { x: -x, y: -y };
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var cx = w * 0.45, cy = h * 0.55, s = Math.min(w / 18, h / 14);
                D.line(ctx, 20, cy, w - 20, cy, 'rgba(212,165,116,0.4)', 1.5);
                D.line(ctx, cx, 20, cx, h - 20, 'rgba(212,165,116,0.4)', 1.5);
                D.label(ctx, 'O', cx + 10, cy + 16, '#d4a574', 'left', '12px');
                function plot(pts, color, labelColor) {
                    ctx.beginPath(); ctx.moveTo(cx + pts[0].x * s, cy - pts[0].y * s);
                    for (var i = 1; i < pts.length; i++) ctx.lineTo(cx + pts[i].x * s, cy - pts[i].y * s);
                    ctx.closePath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = color.replace(')', ',0.15)').replace('rgb', 'rgba'); ctx.fill();
                    pts.forEach(function (p, i) {
                        D.dot(ctx, cx + p.x * s, cy - p.y * s, 5, color);
                        D.label(ctx, '(' + p.x + ',' + p.y + ')', cx + p.x * s, cy - p.y * s - 10, labelColor, 'center', '10px');
                    });
                }
                plot(P, '#5c8a8a', '#e6c9a8');
                var Q = P.map(function (p) { return transform(p.x, p.y); });
                plot(Q, '#d4a574', '#e6c9a8');
                var labels = { translate: '平移：x′=x+3, y′=y+2', xaxis: '关于 x 轴对称：x′=x, y′=-y', origin: '关于原点对称：x′=-x, y′=-y' };
                D.label(ctx, labels[mode], w * 0.5, 28, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">' + labels[mode] + '</p>');
            }
            bind('#ct-t', card, 'click', function () { mode = 'translate'; draw(); });
            bind('#ct-x', card, 'click', function () { mode = 'xaxis'; draw(); });
            bind('#ct-o', card, 'click', function () { mode = 'origin'; draw(); });
            draw();
        }
    });
})();
