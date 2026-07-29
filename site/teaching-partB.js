/* ============================================================
   教学动画 · 原创新增模块 (teaching-partB.js)
   下列 7 个交互式教学动画为「象数演易」所没有的原创内容。
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
       N1 · 单位圆与三角函数（新增）
       ========================================================= */
    JX.register({
        key: 'unit-circle', title: '单位圆与三角函数', field: '三角函数 · 单位圆',
        difficulty: 3,
        time: '5 分钟',
        steps: [
            '理解单位圆半径为 1，角 θ 从 x 轴正方向逆时针量取。',
            '观察 P 点横、纵坐标分别对应 cosθ、sinθ。',
            '拖动或自动旋转，验证 sin²θ + cos²θ = 1。',
        ],
        tags: '几何直观 · 推理意识', badge: 'new',
        desc: '在单位圆上转动一点 P，直观看到 sin、cos、tan 是如何从几何中诞生的。',
        problem: '在单位圆中，设半径 OP 与 x 轴正方向夹角为 <span class="formula">θ</span>。转动 P，观察 <span class="mk">sinθ</span>、<span class="mk">cosθ</span>、<span class="mk">tanθ</span> 对应的线段。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('uc-th', '角度 θ', 0, 360, 1, 30, '°') +
                '<div class="jx-btn-row"><button class="action-btn" id="uc-anim">自动旋转</button></div>';
            var th = 30 * Math.PI / 180, playing = false;
            bind('#uc-th', card, 'input', function (e) { th = (+e.target.value) * Math.PI / 180; q('#uc-th-v', card).textContent = e.target.value + '°'; draw(); });
            bind('#uc-anim', card, 'click', function () { playing = !playing; });
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var cx = w * 0.42, cy = h * 0.5, R = Math.min(w, h) * 0.34;
                // 坐标轴
                D.line(ctx, 20, cy, w - 20, cy, 'rgba(212,165,116,0.35)', 1.2);
                D.line(ctx, cx, 16, cx, h - 16, 'rgba(212,165,116,0.35)', 1.2);
                // 圆
                ctx.beginPath(); ctx.arc(cx, cy, R, 0, JX.TAU);
                ctx.strokeStyle = 'rgba(201,209,217,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
                var Px = cx + R * Math.cos(th), Py = cy - R * Math.sin(th);
                // 半径
                D.line(ctx, cx, cy, Px, Py, '#d4a574', 2.5);
                // cos 线段（水平）
                D.line(ctx, cx, cy, Px, cy, 'rgba(92,138,138,0.9)', 4);
                // sin 线段（垂直）
                D.line(ctx, Px, cy, Px, Py, 'rgba(231,76,60,0.9)', 4);
                // tan：过 (cx+R,cy) 的竖直线，OP 延长交于 T
                var tx = cx + R, ty;
                if (Math.abs(Math.cos(th)) > 1e-6) { ty = cy - R * Math.tan(th); }
                else ty = Py;
                D.line(ctx, cx + R, cy, cx + R, ty, 'rgba(212,165,116,0.25)', 1);
                D.line(ctx, Px, Py, tx, ty, 'rgba(212,165,116,0.5)', 1.5); // OP 延长
                D.line(ctx, cx + R, cy, tx, ty, 'rgba(192,57,43,0.8)', 4); // tan 线段
                D.circle(ctx, Px, Py, 6, '#e8c499', '#0a0a0f', 2);
                D.dot(ctx, cx, cy, 3, '#c9d1d9');
                D.label(ctx, 'P', Px + 10, Py - 8, '#e8c499');
                // 标注
                D.label(ctx, 'cos', (cx + Px) / 2, cy + 16, '#5c8a8a', '12px "Noto Sans SC"');
                D.label(ctx, 'sin', Px + 10, (cy + Py) / 2, '#e74c3c', '12px "Noto Sans SC"');
                if (Math.abs(Math.cos(th)) > 0.12) D.label(ctx, 'tan', cx + R + 10, (cy + ty) / 2, '#c0392b', '12px "Noto Sans SC"');
                var s = Math.sin(th), c = Math.cos(th), tn = Math.abs(Math.cos(th)) < 1e-6 ? '∞' : (Math.tan(th)).toFixed(3);
                setAns(answer, 'θ = <span class="hl">' + Math.round(th * 180 / Math.PI) + '°</span>　(' + (th).toFixed(2) + ' rad)<br>' +
                    'sinθ = <span class="hl">' + s.toFixed(3) + '</span>　cosθ = <span class="hl">' + c.toFixed(3) + '</span>　tanθ = <span class="hl">' + tn + '</span>');
            }
            var R2 = JX.resizable(cv, draw);
            // 自动旋转（轻量循环）
            (function anim() {
                if (playing) { th += 0.01; if (th > JX.TAU) th -= JX.TAU; q('#uc-th', card).value = Math.round(th * 180 / Math.PI); q('#uc-th-v', card).textContent = Math.round(th * 180 / Math.PI) + '°'; draw(); }
                requestAnimationFrame(anim);
            })();
            draw();
        }
    });

    /* =========================================================
       N2 · 椭圆的定义（双焦点）（新增）
       ========================================================= */
    JX.register({
        key: 'ellipse', title: '椭圆的定义 · 双焦点', field: '圆锥曲线 · 椭圆定义',
        difficulty: 3,
        time: '5 分钟',
        steps: [
            '设定半长轴 a 与半焦距 c，算出 b = √(a²−c²)。',
            '拖动椭圆上动点 P，观察 PF₁ + PF₂ 的值。',
            '验证该和恒等于 2a，即椭圆的第一定义。',
        ],
        tags: '几何直观 · 推理意识', badge: 'new',
        desc: '拖动椭圆上的动点 P，看 PF₁ + PF₂ 如何恒等于 2a——这正是椭圆的定义。',
        problem: '平面内到两个定点 <span class="mk">F₁、F₂</span> 的距离之和等于常数（大于 |F₁F₂|）的点的轨迹是椭圆。拖动 P，观察 <span class="formula">PF₁ + PF₂</span> 是否恒定。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('el-a', '半长轴 a', 0.6, 2.2, 0.05, 1.6) + slider('el-c', '半焦距 c', 0.2, 1.4, 0.05, 1.0) +
                '<div class="jx-btn-row"><button class="action-btn" id="el-reset">重置动点</button></div>';
            var a = 1.6, c = 1.0;
            var Pm = [a, 0]; // 动点（数学坐标，椭圆上）
            function geom(w, h) {
                var cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.4 / Math.max(a, c + 0.2);
                var b = Math.sqrt(Math.max(0.0001, a * a - c * c));
                return { cx: cx, cy: cy, s: s, b: b };
            }
            function project(P, g) { return [g.cx + P[0] * g.s, g.cy - P[1] * g.s]; }
            function unproject(px, py, g) { return [(px - g.cx) / g.s, (g.cy - py) / g.s]; }
            bind('#el-a', card, 'input', function (e) { a = +e.target.value; q('#el-a-v', card).textContent = a.toFixed(2); if (c > a - 0.05) { c = a - 0.05; q('#el-c', card).value = c; q('#el-c-v', card).textContent = c.toFixed(2); } draw(); });
            bind('#el-c', card, 'input', function (e) { c = Math.min(+e.target.value, a - 0.05); q('#el-c-v', card).textContent = c.toFixed(2); draw(); });
            bind('#el-reset', card, 'click', function () { Pm = [a, 0]; draw(); });
            var dragging = false;
            cv.addEventListener('pointerdown', function (e) { dragging = true; cv.setPointerCapture(e.pointerId); move(e); });
            cv.addEventListener('pointermove', move);
            cv.addEventListener('pointerup', function () { dragging = false; });
            function move(e) {
                if (!dragging) return;
                var r = cv.getBoundingClientRect(); var o = JX.setupCanvas(cv);
                var g = geom(o.w, o.h);
                var m = unproject(e.clientX - r.left, e.clientY - r.top, g);
                // 投影到椭圆：保持角度，缩放到椭圆上
                var ang = Math.atan2(m[1], m[0]);
                Pm = [a * Math.cos(ang), g.b * Math.sin(ang)];
                draw();
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var g = geom(w, h), b = g.b;
                // 椭圆轨迹
                ctx.beginPath();
                for (var t = 0; t <= JX.TAU + 0.01; t += 0.02) { var x = a * Math.cos(t), y = b * Math.sin(t); var p = project([x, y], g); t === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
                ctx.strokeStyle = 'rgba(212,165,116,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
                // 焦点
                var F1 = project([-c, 0], g), F2 = project([c, 0], g);
                D.circle(ctx, F1[0], F1[1], 5, '#e74c3c', '#fff', 2);
                D.circle(ctx, F2[0], F2[1], 5, '#e74c3c', '#fff', 2);
                D.label(ctx, 'F₁', F1[0] - 16, F1[1] + 12, '#e74c3c');
                D.label(ctx, 'F₂', F2[0] + 8, F2[1] + 12, '#e74c3c');
                // 动点 P
                var P = project(Pm, g);
                D.line(ctx, F1[0], F1[1], P[0], P[1], 'rgba(92,138,138,0.8)', 2);
                D.line(ctx, F2[0], F2[1], P[0], P[1], 'rgba(92,138,138,0.8)', 2);
                D.circle(ctx, P[0], P[1], 7, '#e8c499', '#0a0a0f', 2);
                D.label(ctx, 'P', P[0], P[1] - 14, '#e8c499');
                var Pf = unproject(P[0], P[1], g);
                var d1 = Math.hypot(Pf[0] + c, Pf[1]), d2 = Math.hypot(Pf[0] - c, Pf[1]);
                var sum = d1 + d2;
                var onEll = Math.abs(sum - 2 * a) < 0.02;
                setAns(answer, 'PF₁ = <span class="hl">' + d1.toFixed(3) + '</span>，PF₂ = <span class="hl">' + d2.toFixed(3) + '</span><br>' +
                    'PF₁ + PF₂ = <span class="hl">' + sum.toFixed(3) + '</span>　（理论值 2a = ' + (2 * a).toFixed(3) + '）<br>' +
                    (onEll ? '<span class="ok">✓ 恰为 2a，P 在椭圆上</span>' : '<span class="jx-hint">P 已吸附到椭圆，故和为常数</span>'));
            }
            JX.resizable(cv, draw);
            draw();
        }
    });

    /* =========================================================
       N3 · 杨辉三角（新增）
       ========================================================= */
    JX.register({
        key: 'pascal', title: '杨辉三角', field: '组合数学 · 二项式定理',
        difficulty: 2,
        time: '4 分钟',
        steps: [
            '从顶端 1 开始，每个数等于肩上两数之和。',
            '观察第 n 行对应 (a+b)^(n−1) 的系数。',
            '用某一行系数验证二项式展开。',
        ],
        tags: '推理意识 · 模型意识', badge: 'new',
        desc: '每一行都是二项式系数。选择一行，看它如何对应 (a+b)ⁿ 的展开。',
        problem: '杨辉三角（帕斯卡三角）中，每个数等于它上方两数之和，第 n 行恰好是 <span class="formula">(a+b)ⁿ</span> 的展开系数。选择一行查看对应展开式。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('ps-n', '行数 n', 1, 12, 1, 6) + slider('ps-r', '高亮行 r', 0, 6, 1, 4) +
                '<div class="jx-btn-row"><button class="action-btn" id="ps-exp">显示展开式</button></div>';
            var n = 6, r = 4;
            function tri(N) {
                var t = [[1]];
                for (var i = 1; i <= N; i++) { var row = [1]; for (var j = 1; j < i; j++) row.push(t[i - 1][j - 1] + t[i - 1][j]); row.push(1); t.push(row); }
                return t;
            }
            bind('#ps-n', card, 'input', function (e) { n = +e.target.value; q('#ps-n-v', card).textContent = n; if (r > n) { r = n; q('#ps-r', card).value = r; q('#ps-r-v', card).textContent = r; } draw(); });
            bind('#ps-r', card, 'input', function (e) { r = +e.target.value; q('#ps-r-v', card).textContent = r; draw(); });
            bind('#ps-exp', card, 'click', function () {
                var t = tri(n); var row = t[r];
                var terms = [];
                for (var k = 0; k <= r; k++) {
                    var co = row[k];
                    var aExp = r - k, bExp = k;
                    var s = (co === 1 ? '' : co);
                    if (aExp > 0) s += 'a' + (aExp === 1 ? '' : '<sup>' + aExp + '</sup>');
                    if (bExp > 0) s += 'b' + (bExp === 1 ? '' : '<sup>' + bExp + '</sup>');
                    terms.push(s);
                }
                setAns(answer, '(a+b)<sup>' + r + '</sup> = ' + terms.join(' + ') + '<br>' +
                    '<span class="jx-hint">系数即第 ' + r + ' 行：' + row.join(', ') + '</span>');
            });
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var t = tri(n);
                var dx = Math.max(4, Math.min(34, w / (n + 2)));
                var dy = Math.max(4, Math.min(26, (h - 20) / (n + 1)));
                var top = 14;
                for (var i = 0; i <= n; i++) {
                    var row = t[i];
                    var y = top + i * dy;
                    var x0 = w / 2 - (row.length - 1) * dx / 2;
                    for (var j = 0; j < row.length; j++) {
                        var x = x0 + j * dx;
                        var hl = (i === r);
                        ctx.beginPath(); ctx.arc(x, y, Math.min(dx, dy) * 0.42, 0, JX.TAU);
                        ctx.fillStyle = hl ? 'rgba(212,165,116,0.25)' : 'rgba(255,255,255,0.04)';
                        ctx.fill();
                        if (hl) { ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 1.5; ctx.stroke(); }
                        D.label(ctx, '' + row[j], x, y, hl ? '#e8c499' : '#c9d1d9', Math.max(9, Math.min(13, dx * 0.5)) + 'px "Noto Sans SC"');
                    }
                }
                D.label(ctx, '第 ' + r + ' 行 = (a+b)^' + r + ' 系数', w / 2, h - 8, '#6e7681', '12px "Noto Serif SC"');
            }
            JX.resizable(cv, draw);
            draw();
        }
    });

    /* =========================================================
       N4 · 蒙特卡洛求 π（新增，连续动画）
       ========================================================= */
    JX.register({
        key: 'monte-pi', title: '蒙特卡洛求 π', field: '概率统计 · 数值估算',
        difficulty: 2,
        time: '4 分钟',
        steps: [
            '在单位正方形内随机撒点。',
            '统计落在 1/4 圆内的点数比例。',
            '由面积比推得 π ≈ 4 × (圆内点数 / 总点数)。',
        ],
        tags: '数据意识 · 模型意识', badge: 'new',
        desc: '往单位正方形里随机投点，落在四分之一圆内的比例 ≈ π/4，点数越多越精确。',
        problem: '在边长为 1 的正方形内作四分之一圆，随机投点。设总点数为 N，落在圆内点数为 M，则 <span class="formula">π ≈ 4M / N</span>。观察估计值如何随投点增多而收敛。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('mc-speed', '投点速度', 1, 20, 1, 6) + slider('mc-size', '点大小', 1, 4, 0.5, 2) +
                '<div class="jx-btn-row"><button class="action-btn" id="mc-reset">重置</button></div>';
            var speed = 6, dotSize = 2, total = 0, inside = 0;
            var rects = []; // {x,y,in}
            bind('#mc-speed', card, 'input', function (e) { speed = +e.target.value; q('#mc-speed-v', card).textContent = speed; });
            bind('#mc-size', card, 'input', function (e) { dotSize = +e.target.value; q('#mc-size-v', card).textContent = dotSize; });
            bind('#mc-reset', card, 'click', function () { total = 0; inside = 0; rects = []; });
            JX.loop(cv, function (ctx, w, h) {
                D.clearBG(ctx, w, h);
                var m = Math.min(w, h) * 0.9, ox = (w - m) / 2, oy = (h - m) / 2;
                // 正方形 + 四分之一圆
                ctx.strokeStyle = 'rgba(201,209,217,0.4)'; ctx.lineWidth = 1.5;
                ctx.strokeRect(ox, oy, m, m);
                ctx.beginPath(); ctx.moveTo(ox, oy + m); ctx.arc(ox, oy + m, m, -Math.PI / 2, 0); ctx.closePath();
                ctx.fillStyle = 'rgba(212,165,116,0.12)'; ctx.fill();
                // 投点
                for (var i = 0; i < speed && rects.length < 6000; i++) {
                    var rx = Math.random(), ry = Math.random();
                    var px = ox + rx * m, py = oy + (1 - ry) * m;
                    var inv = (rx * rx + ry * ry) <= 1;
                    total++; if (inv) inside++;
                    rects.push({ x: px, y: py, in: inv });
                }
                rects.forEach(function (p) {
                    ctx.fillStyle = p.in ? 'rgba(212,165,116,0.8)' : 'rgba(92,138,138,0.6)';
                    ctx.fillRect(p.x - dotSize / 2, p.y - dotSize / 2, dotSize, dotSize);
                });
                var est = total ? 4 * inside / total : 0;
                D.label(ctx, 'N=' + total + '  M=' + inside, ox + 6, oy + 16, '#c9d1d9', '12px "Noto Sans SC"');
                D.label(ctx, 'π ≈ ' + est.toFixed(4), w / 2, h - 10, '#e8c499', '15px "Noto Serif SC"');
                setAns(answer, '已投 <span class="hl">' + total + '</span> 点，圆内 <span class="hl">' + inside + '</span><br>' +
                    'π ≈ 4M/N = <span class="hl">' + est.toFixed(4) + '</span>　（真值 3.1416）<br>' +
                    '<span class="jx-hint">点数越多，估计越接近 π</span>');
            });
        }
    });

    /* =========================================================
       N5 · 函数图像的变换（新增）
       ========================================================= */
    JX.register({
        key: 'fn-transform', title: '函数图像的变换', field: '函数 · 图像变换',
        difficulty: 3,
        time: '6 分钟',
        steps: [
            '选择基准函数，如 y = x² 或 y = sinx。',
            '分别改变 a、h、k，观察平移、伸缩、翻折效果。',
            '总结 y = a·f(x−h)+k 中各参数的几何意义。',
        ],
        tags: '几何直观 · 模型意识', badge: 'new',
        desc: '用 y = a·f(b·x + c) + d 的四个参数，亲眼看到平移、伸缩与翻转。',
        problem: '对基础函数 f(x)（如 sin x 或 x²）施加变换 <span class="formula">y = a·f(b·x + c) + d</span>：a 纵向伸缩/翻转，b 横向伸缩/翻转，c 横向平移，d 纵向平移。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('ft-a', 'a 纵伸缩', -2, 2, 0.1, 1) + slider('ft-b', 'b 横伸缩', -2, 2, 0.1, 1) +
                slider('ft-c', 'c 横平移', -4, 4, 0.1, 0) + slider('ft-d', 'd 纵平移', -3, 3, 0.1, 0) +
                '<div class="jx-btn-row">' +
                '<button class="action-btn" id="ft-sin">f(x)=sin x</button>' +
                '<button class="action-btn secondary" id="ft-sq">f(x)=x²</button></div>';
            var a = 1, b = 1, c = 0, d = 0, base = 'sin';
            ['a', 'b', 'c', 'd'].forEach(function (k) {
                bind('#ft-' + k, card, 'input', function (e) {
                    var v = +e.target.value; q('#ft-' + k + '-v', card).textContent = v.toFixed(1);
                    if (k === 'a') a = v; if (k === 'b') b = v; if (k === 'c') c = v; if (k === 'd') d = v;
                    draw();
                });
            });
            bind('#ft-sin', card, 'click', function () { base = 'sin'; draw(); });
            bind('#ft-sq', card, 'click', function () { base = 'sq'; draw(); });
            function f(x) { return base === 'sin' ? Math.sin(x) : x * x; }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var cs = D.coordSys(ctx, w, h, { xmin: -5, xmax: 5, ymin: -5, ymax: 5, pad: 30 });
                cs.drawGrid();
                // 原图（灰）
                ctx.beginPath();
                for (var px = 0; px <= w; px += 2) {
                    var x = cs.xmin + (px / w) * (cs.xmax - cs.xmin);
                    var y = f(x);
                    if (y < cs.ymin - 3 || y > cs.ymax + 3) continue;
                    px === 0 ? ctx.moveTo(px, cs.Y(y)) : ctx.lineTo(px, cs.Y(y));
                }
                ctx.strokeStyle = 'rgba(201,209,217,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
                // 变换后
                ctx.beginPath(); var started = false;
                for (var px2 = 0; px2 <= w; px2 += 1) {
                    var xv = cs.xmin + (px2 / w) * (cs.xmax - cs.xmin);
                    // 反解：要画 y=a f(bx+c)+d 在 xv 处的值，令 u = b*xv + c
                    var u = b * xv + c;
                    var yv = a * f(u) + d;
                    if (yv < cs.ymin - 3 || yv > cs.ymax + 3) { started = false; continue; }
                    var Y = cs.Y(yv);
                    if (!started) { ctx.moveTo(px2, Y); started = true; } else ctx.lineTo(px2, Y);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                D.label(ctx, '灰：原 f(x)　金：a·f(b·x+c)+d', w / 2, 22, '#6e7681', '12px "Noto Serif SC"');
                setAns(answer, '当前：<span class="hl">y = ' + a.toFixed(1) + '·f(' + b.toFixed(1) + 'x ' + (c >= 0 ? '+' : '−') + ' ' + Math.abs(c).toFixed(1) + ') ' + (d >= 0 ? '+' : '−') + ' ' + Math.abs(d).toFixed(1) + '</span><br>' +
                    '<span class="jx-hint">a 负→上下翻；b 负→左右翻；|a|>1 拉伸；|b|>1 压缩</span>');
            }
            JX.resizable(cv, draw);
            draw();
        }
    });

    /* =========================================================
       N6 · 向量加法（新增，可拖拽）
       ========================================================= */
    JX.register({
        key: 'vector', title: '向量加法', field: '平面向量 · 加法运算',
        difficulty: 2,
        time: '5 分钟',
        steps: [
            '在平面上画出两个向量 a、b。',
            '用平行四边形法则作出和向量 a+b。',
            '读取坐标，验证对应分量相加。',
        ],
        tags: '几何直观 · 运算能力', badge: 'new',
        desc: '拖动两个向量的终点，用平行四边形法则与三角形法则看它们的和向量。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row"><button class="action-btn" id="vc-reset">重置</button>' +
                '<button class="action-btn secondary" id="vc-rand">随机向量</button></div>';
            var U = [2.2, 1.4], V = [1.0, 2.0];
            function geom(w, h) { var ox = w * 0.5, oy = h * 0.62, s = Math.min(w, h) * 0.3 / 3; return { ox: ox, oy: oy, s: s }; }
            function P(v, g) { return [g.ox + v[0] * g.s, g.oy - v[1] * g.s]; }
            function inv(px, py, g) { return [(px - g.ox) / g.s, (g.oy - py) / g.s]; }
            var drag = -1;
            cv.addEventListener('pointerdown', function (e) {
                var r = cv.getBoundingClientRect(); var o = JX.setupCanvas(cv); var g = geom(o.w, o.h);
                var p = [e.clientX - r.left, e.clientY - r.top];
                var pu = P(U, g), pv = P(V, g);
                if (Math.hypot(pu[0] - p[0], pu[1] - p[1]) < 18) drag = 0;
                else if (Math.hypot(pv[0] - p[0], pv[1] - p[1]) < 18) drag = 1;
                if (drag >= 0) cv.setPointerCapture(e.pointerId);
            });
            cv.addEventListener('pointermove', function (e) {
                if (drag < 0) return; var r = cv.getBoundingClientRect(); var o = JX.setupCanvas(cv); var g = geom(o.w, o.h);
                var m = inv(e.clientX - r.left, e.clientY - r.top, g);
                if (drag === 0) U = m; else V = m; draw();
            });
            cv.addEventListener('pointerup', function () { drag = -1; });
            bind('#vc-reset', card, 'click', function () { U = [2.2, 1.4]; V = [1.0, 2.0]; draw(); });
            bind('#vc-rand', card, 'click', function () { U = [JX.rand(-2.5, 2.5), JX.rand(-2.5, 2.5)]; V = [JX.rand(-2.5, 2.5), JX.rand(-2.5, 2.5)]; draw(); });
            function mag(v) { return Math.hypot(v[0], v[1]); }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var g = geom(w, h);
                D.line(ctx, 20, g.oy, w - 20, g.oy, 'rgba(212,165,116,0.3)', 1.2);
                D.line(ctx, g.ox, 16, g.ox, h - 16, 'rgba(212,165,116,0.3)', 1.2);
                var O = P([0, 0], g), Pu = P(U, g), Pv = P(V, g), Ps = P([U[0] + V[0], U[1] + V[1]], g);
                // 平行四边形
                ctx.beginPath(); ctx.moveTo(Pu[0], Pu[1]); ctx.lineTo(Ps[0], Ps[1]); ctx.lineTo(Pv[0], Pv[1]); ctx.closePath();
                ctx.fillStyle = 'rgba(212,165,116,0.08)'; ctx.fill();
                ctx.strokeStyle = 'rgba(212,165,116,0.4)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
                // 向量
                function arrow(from, to, color, lbl) {
                    D.line(ctx, from[0], from[1], to[0], to[1], color, 3);
                    var ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
                    ctx.beginPath(); ctx.moveTo(to[0], to[1]);
                    ctx.lineTo(to[0] - 12 * Math.cos(ang - 0.4), to[1] - 12 * Math.sin(ang - 0.4));
                    ctx.lineTo(to[0] - 12 * Math.cos(ang + 0.4), to[1] - 12 * Math.sin(ang + 0.4));
                    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
                    D.label(ctx, lbl, to[0] + 8, to[1] - 8, color, '13px "Noto Sans SC"');
                }
                arrow(O, Pu, '#5c8a8a', 'u');
                arrow(O, Pv, '#9b59b6', 'v');
                arrow(O, Ps, '#e74c3c', 'u+v');
                D.circle(ctx, Pu[0], Pu[1], 7, drag === 0 ? '#e74c3c' : '#5c8a8a', '#0a0a0f', 2);
                D.circle(ctx, Pv[0], Pv[1], 7, drag === 1 ? '#e74c3c' : '#9b59b6', '#0a0a0f', 2);
                D.dot(ctx, O[0], O[1], 4, '#c9d1d9');
                D.label(ctx, 'O', O[0] - 12, O[1] + 12, '#c9d1d9');
                var su = [U[0] + V[0], U[1] + V[1]];
                setAns(answer, 'u = (<span class="hl">' + U[0].toFixed(2) + ', ' + U[1].toFixed(2) + '</span>)，|u| = ' + mag(U).toFixed(2) + '<br>' +
                    'v = (<span class="hl">' + V[0].toFixed(2) + ', ' + V[1].toFixed(2) + '</span>)，|v| = ' + mag(V).toFixed(2) + '<br>' +
                    'u + v = (<span class="hl">' + su[0].toFixed(2) + ', ' + su[1].toFixed(2) + '</span>)，|u+v| = ' + mag(su).toFixed(2));
            }
            JX.resizable(cv, draw);
            draw();
        }
    });

    /* =========================================================
       N7 · 高尔顿钉板（新增，连续动画）
       ========================================================= */
    JX.register({
        key: 'galton', title: '高尔顿钉板', field: '概率统计 · 正态分布',
        difficulty: 3,
        time: '6 分钟',
        steps: [
            '设置钉板层数，观察小球下落路径。',
            '每次碰撞向左/右概率各 1/2，小球最终落入底部槽中。',
            '大量小球堆积后近似正态分布钟形曲线。',
        ],
        tags: '数据意识 · 推理意识', badge: 'new',
        desc: '小球从顶端落下，在每颗钉子处随机左/右偏转，最终堆积成钟形（正态）分布。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('gt-rows', '钉板层数', 6, 14, 1, 11) + slider('gt-rate', '下落速度', 1, 12, 1, 4) +
                '<div class="jx-btn-row"><button class="action-btn" id="gt-reset">清空</button></div>';
            var ROWS = 11, rate = 4;
            var bins = []; var balls = []; var maxBin = 1;
            function init() { bins = new Array(ROWS + 1).fill(0); balls = []; maxBin = 1; }
            init();
            bind('#gt-rows', card, 'input', function (e) { ROWS = +e.target.value; q('#gt-rows-v', card).textContent = ROWS; init(); });
            bind('#gt-rate', card, 'input', function (e) { rate = +e.target.value; q('#gt-rate-v', card).textContent = rate; });
            bind('#gt-reset', card, 'click', init);
            // 球的状态：t 为下落进度（0..ROWS），path 为每一步方向累计；用连续 y 动画
            JX.loop(cv, function (ctx, w, h) {
                D.clearBG(ctx, w, h);
                var topY = 30, pegR = 3;
                var usableH = h - 50;
                var rowGap = usableH / (ROWS + 1);
                var colGap = Math.min(w / (ROWS + 2), rowGap * 0.9);
                var cx0 = w / 2;
                // 画钉子
                for (var r = 0; r <= ROWS; r++) {
                    var cnt = r + 1; var y = topY + r * rowGap;
                    for (var i = 0; i < cnt; i++) {
                        var x = cx0 + (i - r / 2) * colGap;
                        D.circle(ctx, x, y, pegR, '#6e7681');
                    }
                }
                // 生成新球
                for (var s = 0; s < rate; s++) {
                    if (balls.length < 400) balls.push({ r: 0, frac: 0, right: 0, dir: Math.random() < 0.5 ? 1 : -1 });
                }
                // 更新 & 画球
                var binY = topY + (ROWS + 1) * rowGap;
                for (var bi = balls.length - 1; bi >= 0; bi--) {
                    var ball = balls[bi];
                    ball.frac += 0.06;
                    var stepDone = false;
                    if (ball.frac >= 1) {
                        ball.frac = 0;
                        ball.right += (ball.dir > 0 ? 1 : 0);
                        ball.r++;
                        stepDone = true;
                    }
                    if (ball.r >= ROWS) {
                        var bin = JX.clamp(ball.right, 0, ROWS);
                        bins[bin]++; if (bins[bin] > maxBin) maxBin = bins[bin];
                        balls.splice(bi, 1); continue;
                    }
                    if (stepDone) ball.dir = Math.random() < 0.5 ? 1 : -1;
                    var yb = topY + ball.r * rowGap + ball.frac * rowGap;
                    var xCur = (2 * ball.right - ball.r) * colGap / 2;
                    var nextRight = ball.right + (ball.dir > 0 ? 1 : 0);
                    var xNext = (2 * nextRight - (ball.r + 1)) * colGap / 2;
                    var xb = cx0 + JX.lerp(xCur, xNext, ball.frac);
                    D.circle(ctx, xb, yb, 3.5, '#d4a574');
                }
                // 画底部直方图
                var bw = colGap * 0.8;
                for (var k = 0; k <= ROWS; k++) {
                    var bx = cx0 + (k - ROWS / 2) * colGap;
                    var bh = (bins[k] / maxBin) * (rowGap * 0.9);
                    ctx.fillStyle = 'rgba(212,165,116,0.55)';
                    ctx.fillRect(bx - bw / 2, binY - bh, bw, bh);
                }
                var total = bins.reduce(function (a, b) { return a + b; }, 0);
                D.label(ctx, '小球总数：' + total, w / 2, h - 8, '#c9d1d9', '12px "Noto Serif SC"');
                setAns(answer, '已落球 <span class="hl">' + total + '</span> 个<br>' +
                    '每步左右概率各 1/2，落点服从二项分布 B(n,' + (ROWS) + ',1/2)，近似正态分布（钟形）。<br>' +
                    '<span class="jx-hint">层数越多，钟形越平滑</span>');
            });
        }
    });

})();
