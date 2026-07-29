/* ============================================================
   教学动画 · 复刻「象数演易」全部 12 个已生成教学动画
   (teaching-partA.js) —— 题目原文一致，交互高质量重新实现
   ============================================================ */
(function () {
    'use strict';
    var JX = window.JX;
    var D = JX.draw;

    // 局部工具：在当前卡片作用域内查询
    function q(sel, card) { return JX.$(sel, card); }
    // 构造滑块控件 HTML
    function slider(id, label, min, max, step, val, unit) {
        unit = unit || '';
        return '<div class="control-group"><label>' + label +
            ' <span id="' + id + '-v">' + val + unit + '</span></label>' +
            '<input type="range" id="' + id + '" min="' + min + '" max="' + max +
            '" step="' + step + '" value="' + val + '"></div>';
    }
    function setAns(answer, html) { answer.innerHTML = html; }

    /* =========================================================
       01 · 用字母表示长方体的高
       ========================================================= */
    JX.register({
        key: 'rect-prism',
        difficulty: 2,
        time: '4 分钟',
        steps: [
            '识别已知量：长方体体积 V = 32，底面是边长为 x 的正方形。',
            '写出体积公式 V = x² · h，反解出 h = V / x²。',
            '把 x = 2 代入，计算 h 的具体数值并验证。',
        ],
        title: '用字母表示长方体的高',
        field: '代数表达式 · 变量关系',
        tags: '空间观念 · 模型意识',
        desc: '底面为正方形的长方体，体积恒定，用字母 x 表示底面边长，反推高 h 的代数式。',
        badge: 'copy',
        problem: '底面为正方形的长方体，体积为 <span class="mk">32 cm³</span>，底面边长为 <span class="mk">x cm</span>。请用含 x 的式子表示这个长方体的高 <span class="formula">h</span>，并求当 <span class="formula">x = 2</span> 时 h 的值。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('rp-x', '底面边长 x', 0.5, 8, 0.1, 2, ' cm') +
                '<div class="jx-btn-row"><button class="action-btn" id="rp-check">验算 x=2</button></div>';
            var x = 2;
            q('#rp-x', card).addEventListener('input', function (e) {
                x = +e.target.value; q('#rp-x-v', card).textContent = x.toFixed(1) + ' cm'; draw(); updateAns();
            });
            q('#rp-check', card).addEventListener('click', function () {
                x = 2; q('#rp-x', card).value = 2; q('#rp-x-v', card).textContent = '2.0 cm'; draw(); updateAns();
            });
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var hgt = 32 / (x * x); // 高
                // 自适应缩放
                var scale = Math.min((w * 0.4) / x, (h * 0.78) / (hgt + x * 0.5));
                scale = Math.max(scale, 4);
                var bw = x * scale, bh = hgt * scale;
                var ox = w / 2 - bw * 0.75, oy = h * 0.62; // 前下角
                var dep = bw * 0.42; // 深度偏移
                var ddx = dep, ddy = -dep * 0.55;
                // 前表面
                D.roundRect(ctx, ox, oy - bh, bw, bh, 4, 'rgba(212,165,116,0.18)', '#d4a574', 2);
                // 顶表面
                ctx.beginPath();
                ctx.moveTo(ox, oy - bh); ctx.lineTo(ox + bw, oy - bh);
                ctx.lineTo(ox + bw + ddx, oy - bh + ddy); ctx.lineTo(ox + ddx, oy - bh + ddy);
                ctx.closePath();
                ctx.fillStyle = 'rgba(192,57,43,0.16)'; ctx.fill();
                ctx.strokeStyle = '#e8c499'; ctx.lineWidth = 2; ctx.stroke();
                // 右表面
                ctx.beginPath();
                ctx.moveTo(ox + bw, oy); ctx.lineTo(ox + bw + ddx, oy + ddy);
                ctx.lineTo(ox + bw + ddx, oy - bh + ddy); ctx.lineTo(ox + bw, oy - bh);
                ctx.closePath();
                ctx.fillStyle = 'rgba(92,138,138,0.16)'; ctx.fill();
                ctx.strokeStyle = '#5c8a8a'; ctx.lineWidth = 2; ctx.stroke();
                // 标注：底面边长 x（前表面底边）
                D.label(ctx, 'x', ox + bw / 2, oy + 14, '#e8c499', '13px "Noto Sans SC"');
                // 标注：高 h（前表面左边）
                D.label(ctx, 'h', ox - 10, oy - bh / 2, '#d4a574', '13px "Noto Sans SC"');
                // 体积标注
                D.label(ctx, 'V = x²·h = 32', w / 2, h * 0.12, '#c9d1d9', '13px "Noto Serif SC"');
            }
            function updateAns() {
                var hgt = 32 / (x * x);
                setAns(answer, '体积公式：<span class="hl">V = x² · h = 32</span><br>' +
                    '∴ h = <span class="hl">32 / x²</span><br>' +
                    '当 x = 2 时，h = 32 / 4 = <span class="hl">' + hgt.toFixed(2) + ' cm</span>');
            }
            var R = JX.resizable(cv, draw);
            updateAns();
        }
    });

    /* =========================================================
       02 · 正方体棱长计算
       ========================================================= */
    JX.register({
        key: 'cube-edge',
        difficulty: 2,
        time: '3 分钟',
        steps: [
            '正方体有 12 条等长棱，棱长总和 = 12k。',
            '从图中读取 ∠DOE 的度数，计算其 2 倍。',
            '列方程 12k = 2·∠DOE，解出 k。',
        ],
        title: '正方体棱长计算',
        field: '立体图形 · 棱长与角度',
        tags: '空间观念 · 几何直观',
        desc: '正方体 12 条棱长总和，等于图中 ∠DOE 度数的 2 倍，反求棱长 k。',
        badge: 'copy',
        problem: '棱长为 <span class="mk">k</span> 的正方体，所有棱长之和恰好等于图中 <span class="formula">∠DOE</span> 度数的 2 倍；求正方体的棱长 <span class="formula">k</span>。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML =
                '<div class="control-group"><label>你算出的 k <span id="ce-k-v">?</span></label>' +
                '<input type="number" id="ce-k" step="0.1" placeholder="输入 k"></div>' +
                '<div class="jx-btn-row"><button class="action-btn" id="ce-check">验证</button></div>';
            var ANG = 90; // 图中 ∠DOE
            q('#ce-check', card).addEventListener('click', function () {
                var k = parseFloat(q('#ce-k', card).value);
                if (isNaN(k)) { setAns(answer, '请输入一个数值。'); return; }
                var sum = 12 * k, rhs = 2 * ANG;
                var ok = Math.abs(sum - rhs) < 0.01;
                setAns(answer, '正方体共 <span class="hl">12</span> 条棱，棱长总和 = 12k。<br>' +
                    '图中 ∠DOE = <span class="hl">' + ANG + '°</span>，其 2 倍 = <span class="hl">' + rhs + '</span>。<br>' +
                    '由 12k = ' + rhs + ' 得 k = <span class="hl">' + (rhs / 12) + '</span>。<br>' +
                    (ok ? '<span class="ok">✓ 正确！k = ' + (rhs / 12) + '</span>'
                        : '<span class="err">✗ 你的 12k = ' + sum + '，不等于 ' + rhs + '</span>'));
            });
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                // 等距正方体
                var s = Math.min(w, h) * 0.26;
                var cx = w * 0.32, cy = h * 0.58;
                var d = s * 0.5;
                var p = [
                    [cx, cy], [cx + s, cy], [cx + s + d, cy - d * 0.6], [cx + d, cy - d * 0.6], // 前下、前下右、后上右、后上左 -> 底面? 
                ];
                // 简化：画一个等距立方体
                var F = [[cx, cy - s], [cx + s, cy - s], [cx + s + d, cy - s - d * 0.6], [cx + d, cy - s - d * 0.6]]; // 顶面
                var B = [[cx, cy], [cx + s, cy], [cx + s + d, cy - d * 0.6], [cx + d, cy - d * 0.6]]; // 底面
                function poly(pts, fill, stroke) {
                    ctx.beginPath();
                    pts.forEach(function (pt, i) { i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); });
                    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
                }
                poly([B[0], B[1], F[1], F[0]], 'rgba(212,165,116,0.18)', '#d4a574'); // 前
                poly([B[1], B[2], F[2], F[1]], 'rgba(92,138,138,0.16)', '#5c8a8a'); // 右
                poly(F, 'rgba(192,57,43,0.14)', '#e8c499'); // 顶
                // 标一条棱 k
                D.label(ctx, 'k', (B[0][0] + B[1][0]) / 2, B[0][1] + 14, '#e8c499', '13px "Noto Sans SC"');
                D.label(ctx, '12 条棱', cx + s * 0.5, cy - s * 0.5, '#c9d1d9', '12px "Noto Serif SC"');
                // ∠DOE
                var ox = w * 0.74, oy = h * 0.5, r = 46;
                D.line(ctx, ox, oy, ox + r, oy, '#c9d1d9', 1.5);
                D.line(ctx, ox, oy, ox, oy - r, '#c9d1d9', 1.5);
                ctx.beginPath(); ctx.arc(ox, oy, 22, -Math.PI / 2, 0); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2; ctx.stroke();
                D.dot(ctx, ox, oy, 3, '#d4a574');
                D.label(ctx, 'O', ox - 14, oy + 14, '#c9d1d9');
                D.label(ctx, 'D', ox + r + 12, oy, '#c9d1d9');
                D.label(ctx, 'E', ox, oy - r - 12, '#c9d1d9');
                D.label(ctx, '∠DOE = ' + ANG + '°', ox + 40, oy - 56, '#d4a574', '13px "Noto Serif SC"');
            }
            JX.resizable(cv, draw);
            setAns(answer, '提示：正方体棱长总和 = <span class="hl">12k</span>，看图得 ∠DOE = <span class="hl">' + ANG + '°</span>，解 12k = 2×' + ANG + '。');
        }
    });

    /* =========================================================
       03 · 有理数混合运算（分步）
       ========================================================= */
    JX.register({
        key: 'rational-ops',
        difficulty: 3,
        time: '5 分钟',
        steps: [
            '先算乘方：注意 −2² 与 (−2)² 的符号区别。',
            '再算绝对值与乘除：|5−8| = 3，24÷(−3)×1/3 = −8/3。',
            '最后从左到右加减，合并得到最终结果。',
        ],
        title: '有理数混合运算',
        field: '有理数 · 混合运算',
        tags: '运算能力 · 数感',
        desc: '点击「下一步」逐层化简一个有理数混合运算式，体会先乘方、再乘除、后加减。',
        badge: 'copy',
        problem: '计算：<span class="formula">−2² + |5 − 8| + 24 ÷ (−3) × 1/3</span>',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row">' +
                '<button class="action-btn" id="ro-prev">上一步</button>' +
                '<button class="action-btn" id="ro-next">下一步</button>' +
                '<button class="action-btn secondary" id="ro-reset">重置</button></div>';
            var steps = [
                { t: '原式', e: '−2² + |5 − 8| + 24 ÷ (−3) × 1/3' },
                { t: '乘方：−2² = −(2²) = −4', e: '−4 + |5 − 8| + 24 ÷ (−3) × 1/3' },
                { t: '绝对值：|5 − 8| = |−3| = 3', e: '−4 + 3 + 24 ÷ (−3) × 1/3' },
                { t: '乘除（从左到右）：24 ÷ (−3) = −8；−8 × 1/3 = −8/3', e: '−4 + 3 + (−8/3)' },
                { t: '加减：−4 + 3 = −1；−1 + (−8/3) = −11/3', e: '−11/3' }
            ];
            var step = 0;
            function renderSteps() {
                var html = '';
                steps.forEach(function (s, i) {
                    var cls = i < step ? 'done' : (i === step ? 'active' : '');
                    html += '<div class="jx-step ' + cls + '"><span class="n">' + (i + 1) + '</span><b>' + s.t + '</b><br>' +
                        '<span style="font-family:var(--font-mono);color:var(--gold-bright)">' + s.e + '</span></div>';
                });
                answer.innerHTML = html;
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                D.label(ctx, '当前算式', w / 2, h * 0.3, '#6e7681', '13px "Noto Serif SC"');
                D.label(ctx, steps[step].e, w / 2, h * 0.52, '#e8c499', '20px "Noto Mono", monospace');
                D.label(ctx, '第 ' + (step + 1) + ' / ' + steps.length + ' 步', w / 2, h * 0.78, '#d4a574', '14px "Noto Serif SC"');
            }
            q('#ro-next', card).addEventListener('click', function () { step = Math.min(step + 1, steps.length - 1); renderSteps(); draw(); });
            q('#ro-prev', card).addEventListener('click', function () { step = Math.max(step - 1, 0); renderSteps(); draw(); });
            q('#ro-reset', card).addEventListener('click', function () { step = 0; renderSteps(); draw(); });
            JX.resizable(cv, draw);
            renderSteps();
        }
    });

    /* =========================================================
       04 · 一次函数解析式
       ========================================================= */
    JX.register({
        key: 'linear-fn',
        difficulty: 3,
        time: '5 分钟',
        steps: [
            '设一次函数解析式为 y = kx + b。',
            '把图象上两个已知点坐标代入，得到方程组。',
            '解方程组求出 k、b，写出完整解析式。',
        ],
        title: '一次函数解析式',
        field: '一次函数 · 待定系数法',
        tags: '模型意识 · 几何直观',
        desc: '拖动 k、b，让直线同时穿过两定点，直观理解待定系数法。',
        badge: 'copy',
        problem: '已知一次函数 <span class="formula">y = kx + b</span> 的图象经过点 <span class="mk">(2, 5)</span> 与 <span class="mk">(−1, −1)</span>。<br>(1) 求这个一次函数的解析式；(2) 当 x = 4 时，求 y 的值。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('lf-k', '斜率 k', -5, 5, 0.1, 2) + slider('lf-b', '截距 b', -5, 5, 0.1, 1) +
                '<div class="jx-btn-row"><button class="action-btn" id="lf-show">显示解析</button></div>';
            var k = 2, b = 1;
            q('#lf-k', card).addEventListener('input', function (e) { k = +e.target.value; q('#lf-k-v', card).textContent = k.toFixed(1); draw(); });
            q('#lf-b', card).addEventListener('input', function (e) { b = +e.target.value; q('#lf-b-v', card).textContent = b.toFixed(1); draw(); });
            q('#lf-show', card).addEventListener('click', function () {
                k = 2; b = 1; q('#lf-k', card).value = 2; q('#lf-k-v', card).textContent = '2.0';
                q('#lf-b', card).value = 1; q('#lf-b-v', card).textContent = '1.0'; draw();
                setAns(answer, '代入两点：<span class="hl">5 = 2k + b</span>，<span class="hl">−1 = −k + b</span><br>' +
                    '相减得 6 = 3k → <span class="hl">k = 2</span>，代入得 <span class="hl">b = 1</span>。<br>' +
                    '(1) 解析式：<span class="hl">y = 2x + 1</span><br>' +
                    '(2) x = 4 时，y = 2×4 + 1 = <span class="hl">9</span>。');
            });
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var cs = D.coordSys(ctx, w, h, { xmin: -6, xmax: 6, ymin: -6, ymax: 6, pad: 30 });
                cs.drawGrid();
                // 直线
                ctx.beginPath();
                var x1 = cs.xmin, x2 = cs.xmax;
                ctx.moveTo(cs.X(x1), cs.Y(k * x1 + b));
                ctx.lineTo(cs.X(x2), cs.Y(k * x2 + b));
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                // 定点
                var pts = [[2, 5], [-1, -1]];
                var onLine = Math.abs((k * 2 + b) - 5) < 0.05 && Math.abs((k * -1 + b) - (-1)) < 0.05;
                pts.forEach(function (p) {
                    D.circle(ctx, cs.X(p[0]), cs.Y(p[1]), 6, onLine ? '#5c8a8a' : '#e74c3c', '#fff', 2);
                    D.label(ctx, '(' + p[0] + ',' + p[1] + ')', cs.X(p[0]), cs.Y(p[1]) - 14, '#c9d1d9', '12px "Noto Sans SC"');
                });
                D.label(ctx, 'y = ' + k.toFixed(1) + 'x + ' + b.toFixed(1), w / 2, 24, onLine ? '#5c8a8a' : '#e8c499', '16px "Noto Serif SC"');
                if (onLine) D.label(ctx, '✓ 直线同时经过两定点', w / 2, h - 18, '#5c8a8a', '14px "Noto Serif SC"');
            }
            JX.resizable(cv, draw);
            setAns(answer, '拖动 k、b 让金色直线穿过两个红点；吻合后即为所求解析式。');
        }
    });

    /* =========================================================
       05 · 解分式方程
       ========================================================= */
    JX.register({
        key: 'rational-eq',
        difficulty: 3,
        time: '5 分钟',
        steps: [
            '确定最简公分母，方程两边同乘公分母去分母。',
            '解得到的一元一次方程。',
            '代入原方程验根，舍去使分母为 0 的增根。',
        ],
        title: '解分式方程',
        field: '分式方程 · 同解变形',
        tags: '运算能力 · 推理意识',
        desc: '输入 x 检验，或查看对称方程的巧妙解法，并验证增根。',
        badge: 'copy',
        problem: '解方程：<span class="formula">x/(x−2) + (x−9)/(x−7) = (x+1)/(x−1) + (x−8)/(x−6)</span>',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML =
                '<div class="control-group"><label>试根 x <span id="re-x-v">4</span></label>' +
                '<input type="number" id="re-x" step="0.5" value="4"></div>' +
                '<div class="jx-btn-row"><button class="action-btn" id="re-check">检验</button>' +
                '<button class="action-btn secondary" id="re-show">显示解法</button></div>';
            q('#re-x', card).addEventListener('input', function (e) {
                q('#re-x-v', card).textContent = e.target.value; check();
            });
            q('#re-check', card).addEventListener('click', check);
            q('#re-show', card).addEventListener('click', function () {
                setAns(answer, '<b>解法（同构变形）：</b><br>' +
                    '原式左边 = 1 + 2/(x−2) + 1 − 2/(x−7) = 2 + 2/(x−2) − 2/(x−7)<br>' +
                    '右边 = 1 + 2/(x−1) + 1 − 2/(x−6) = 2 + 2/(x−1) − 2/(x−6)<br>' +
                    '消去 2：<span class="hl">1/(x−2) − 1/(x−7) = 1/(x−1) − 1/(x−6)</span><br>' +
                    '通分得 −5/[(x−2)(x−7)] = −5/[(x−1)(x−6)]<br>' +
                    '∴ (x−2)(x−7) = (x−1)(x−6) → x²−9x+14 = x²−7x+6 → <span class="hl">x = 4</span><br>' +
                    '检验：x=4 不在禁集 {1,2,6,7} 中，故 <span class="hl">x = 4 是原方程的解</span>。');
            });
            function lhs(x) { return x / (x - 2) + (x - 9) / (x - 7); }
            function rhs(x) { return (x + 1) / (x - 1) + (x - 8) / (x - 6); }
            function check() {
                var x = parseFloat(q('#re-x', card).value);
                var bad = [2, 7, 1, 6].some(function (v) { return Math.abs(x - v) < 1e-9; });
                if (bad) { setAns(answer, '<span class="err">✗ x = ' + x + ' 使分母为 0，是增根（无意义）！</span>'); return; }
                var L = lhs(x), R = rhs(x);
                var ok = Math.abs(L - R) < 1e-6;
                setAns(answer, '左边 = <span class="hl">' + L.toFixed(4) + '</span>，右边 = <span class="hl">' + R.toFixed(4) + '</span><br>' +
                    (ok ? '<span class="ok">✓ 左右相等，x = ' + x + ' 是解</span>' : '<span class="err">✗ 左右不等</span>') +
                    '<br><span class="jx-hint">定义域排除 x ∈ {1, 2, 6, 7}</span>');
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var cs = D.coordSys(ctx, w, h, { xmin: -2, xmax: 10, ymin: -6, ymax: 14, pad: 30 });
                cs.drawGrid();
                // 画 f(x)=LHS 与 g(x)=RHS（避开奇点简单绘制）
                function plot(fn, color) {
                    ctx.beginPath(); var first = true;
                    for (var px = 0; px <= w; px += 2) {
                        var x = cs.xmin + (px / w) * (cs.xmax - cs.xmin);
                        var bad = [2, 7, 1, 6].some(function (v) { return Math.abs(x - v) < 0.04; });
                        if (bad) { first = true; continue; }
                        var y = fn(x);
                        if (y < cs.ymin - 5 || y > cs.ymax + 5) { first = true; continue; }
                        var Y = cs.Y(y);
                        if (first) { ctx.moveTo(px, Y); first = false; } else ctx.lineTo(px, Y);
                    }
                    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
                }
                plot(lhs, '#d4a574');
                plot(rhs, '#5c8a8a');
                // 交点 x=4
                D.circle(ctx, cs.X(4), cs.Y(lhs(4)), 6, '#e74c3c', '#fff', 2);
                D.label(ctx, '交点 x=4', cs.X(4), cs.Y(lhs(4)) - 16, '#c9d1d9', '12px "Noto Sans SC"');
                D.label(ctx, '金：左  青：右', w - 70, 22, '#6e7681', '12px "Noto Sans SC"');
            }
            JX.resizable(cv, draw);
            check();
        }
    });

    /* =========================================================
       06 · 尺规作角平分线（分步动画）
       ========================================================= */
    JX.register({
        key: 'angle-bisector',
        difficulty: 2,
        time: '6 分钟',
        steps: [
            '以角的顶点 O 为圆心画弧，交两边于 M、N。',
            '分别以 M、N 为圆心，大于 1/2 MN 为半径画弧，交于点 P。',
            '作射线 OP，即为所求角平分线。',
        ],
        title: '尺规作角平分线',
        field: '尺规作图 · 角平分线',
        tags: '几何直观 · 推理意识',
        desc: '跟随「下一步」用圆规逐步作出 ∠B 的角平分线，保留作图痕迹。',
        badge: 'copy',
        problem: '如图，在 △ABC 中，BC = 3 + √3，∠B = 60°，∠C = 45°。用尺规作图的方法作出 <span class="mk">∠B 的角平分线</span>（保留作图痕迹，不写作法）。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row">' +
                '<button class="action-btn" id="ab-prev">上一步</button>' +
                '<button class="action-btn" id="ab-next">下一步</button>' +
                '<button class="action-btn secondary" id="ab-reset">重置</button></div>';
            var step = 0; // 0 原始,1 弧PQ,2 弧交于R,3 连线
            var B, A, C, P, Q, R, r, Rr;
            function geom(w, h) {
                B = [w * 0.30, h * 0.72];
                // ∠B=60°, BC 水平向右
                var len = w * 0.42;
                C = [B[0] + len, B[1]];
                // 由 ∠B=60°, AB 与 BC 成 60°
                var abLen = len * 0.9;
                A = [B[0] + abLen * Math.cos(Math.PI / 3), B[1] - abLen * Math.sin(Math.PI / 3)];
                r = Math.min(60, len * 0.28);
                // P on BA, Q on BC
                var tP = r / abLen;
                P = [B[0] + (A[0] - B[0]) * tP, B[1] + (A[1] - B[1]) * tP];
                Q = [B[0] + r, B[1]];
                Rr = r * 1.4;
                // R: intersection of circles centered P and Q radius Rr, above
                var mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
                var dPQ = Math.hypot(P[0] - Q[0], P[1] - Q[1]);
                var hh = Math.sqrt(Math.max(0, Rr * Rr - (dPQ / 2) * (dPQ / 2)));
                R = [mx, my - hh];
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                geom(w, h);
                // 三角形（轻）
                ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath();
                ctx.strokeStyle = 'rgba(201,209,217,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
                D.label(ctx, 'A', A[0] - 14, A[1] - 6, '#c9d1d9');
                D.label(ctx, 'B', B[0] - 16, B[1] + 8, '#d4a574');
                D.label(ctx, 'C', C[0] + 8, C[1] + 8, '#c9d1d9');
                // 痕迹（按步骤）
                if (step >= 1) {
                    ctx.beginPath(); ctx.arc(B[0], B[1], r, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(212,165,116,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
                    D.dot(ctx, P[0], P[1], 4, '#d4a574'); D.dot(ctx, Q[0], Q[1], 4, '#d4a574');
                }
                if (step >= 2) {
                    ctx.beginPath(); ctx.arc(P[0], P[1], Rr, 0, Math.PI * 2);
                    ctx.beginPath(); ctx.arc(Q[0], Q[1], Rr, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(92,138,138,0.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
                    D.dot(ctx, R[0], R[1], 4, '#5c8a8a');
                }
                if (step >= 3) {
                    D.line(ctx, B[0], B[1], R[0], R[1], '#e74c3c', 2.5);
                    D.label(ctx, '∠B 的平分线', R[0] + 6, R[1] - 10, '#e74c3c', '13px "Noto Serif SC"');
                }
                D.dot(ctx, B[0], B[1], 5, '#d4a574');
            }
            var desc = ['原始 △ABC（∠B=60°，∠C=45°）',
                '① 以 B 为圆心、适当半径画弧，交 BA、BC 于 P、Q',
                '② 分别以 P、Q 为圆心、等半径画弧，两弧交于 R',
                '③ 连接 B、R，BR 即为 ∠B 的角平分线（平分得两个 30°）'];
            function render() { setAns(answer, '<span class="step-line">' + desc[step] + '</span>'); }
            q('#ab-next', card).addEventListener('click', function () { step = Math.min(step + 1, 3); render(); draw(); });
            q('#ab-prev', card).addEventListener('click', function () { step = Math.max(step - 1, 0); render(); draw(); });
            q('#ab-reset', card).addEventListener('click', function () { step = 0; render(); draw(); });
            JX.resizable(cv, draw);
            render();
        }
    });

    /* =========================================================
       07 · 全等三角形与最值
       ========================================================= */
    JX.register({
        key: 'congruent-ext',
        difficulty: 4,
        time: '8 分钟',
        steps: [
            '通过全等条件证明两三角形全等，得到对应边相等。',
            '把动点位置用变量表示，建立目标线段长度函数。',
            '利用几何不等式或函数极值求出最值。',
        ],
        title: '全等三角形与最值',
        field: '几何最值 · 动态探究',
        tags: '几何直观 · 推理意识',
        desc: '在等腰直角 △ABC 的 BC 上拖动 D，以 AD 为边作正方形，观察面积何时最小。',
        badge: 'copy',
        problem: '如图，在 △ABC 中，AB = AC，∠BAC = 90°。点 D 是 BC 边上一点（不与 B、C 重合），以 AD 为边在 AD 右侧作正方形 ADEF。<br>探究：正方形 ADEF 面积何时最小？最小值是多少？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('ce2-L', '腰长 AB=AC', 0.5, 2, 0.05, 1) + slider('ce2-t', 'D 位置 t', 0.05, 0.95, 0.01, 0.5) +
                '<div class="jx-btn-row"><button class="action-btn" id="ce2-min">跳到最值点</button></div>';
            var L = 1, t = 0.5;
            q('#ce2-L', card).addEventListener('input', function (e) { L = +e.target.value; q('#ce2-L-v', card).textContent = L.toFixed(2); draw(); upd(); });
            q('#ce2-t', card).addEventListener('input', function (e) { t = +e.target.value; q('#ce2-t-v', card).textContent = t.toFixed(2); draw(); upd(); });
            q('#ce2-min', card).addEventListener('click', function () { t = 0.5; q('#ce2-t', card).value = 0.5; q('#ce2-t-v', card).textContent = '0.50'; draw(); upd(); });
            function vertex() {
                // A 顶角, B、C 底
                var A = [0, L], B = [-L, 0], C = [L, 0]; // 等腰直角，A在上方
                var D = [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t];
                return { A: A, B: B, C: C, D: D };
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var v = vertex();
                var pad = 46, s = Math.min((w - 2 * pad), (h - 2 * pad)) / (2 * L);
                function P(p) { return [w / 2 + p[0] * s, h / 2 - p[1] * s]; }
                var pA = P(v.A), pB = P(v.B), pC = P(v.C), pD = P(v.D);
                // 三角形
                ctx.beginPath(); ctx.moveTo(pA[0], pA[1]); ctx.lineTo(pB[0], pB[1]); ctx.lineTo(pC[0], pC[1]); ctx.closePath();
                ctx.strokeStyle = 'rgba(201,209,217,0.6)'; ctx.lineWidth = 1.8; ctx.stroke();
                D.label(ctx, 'A', pA[0], pA[1] - 12, '#c9d1d9');
                D.label(ctx, 'B', pB[0] - 14, pB[1] + 6, '#d4a574');
                D.label(ctx, 'C', pC[0] + 10, pC[1] + 6, '#d4a574');
                // 正方形 ADEF（以 AD 为边，向右）
                var ax = pA[0], ay = pA[1], dx = pD[0], dy = pD[1];
                var vx = dx - ax, vy = dy - ay;
                // 垂直向量（向右）：旋转 -90° -> (vy, -vx)
                var ex = vy, ey = -vx;
                var E = [ax + ex, ay + ey], F = [dx + ex, dy + ey];
                ctx.beginPath(); ctx.moveTo(pA[0], pA[1]); ctx.lineTo(pD[0], pD[1]); ctx.lineTo(F[0], F[1]); ctx.lineTo(E[0], E[1]); ctx.closePath();
                ctx.fillStyle = 'rgba(212,165,116,0.16)'; ctx.fill();
                ctx.strokeStyle = '#e8c499'; ctx.lineWidth = 2; ctx.stroke();
                D.dot(ctx, pD[0], pD[1], 5, '#e74c3c');
                D.label(ctx, 'D', pD[0], pD[1] + 14, '#e74c3c');
                D.label(ctx, '正方形 ADEF', (pA[0] + F[0]) / 2 + 20, (pA[1] + F[1]) / 2, '#e8c499', '12px "Noto Serif SC"');
            }
            function upd() {
                var AD2 = L * L * (2 * t * t - 2 * t + 1); // 见综合证明
                var minAD2 = L * L / 2;
                var isMin = Math.abs(t - 0.5) < 0.01;
                setAns(answer, 'AD² = L²(2t² − 2t + 1)，正方形面积 = <span class="hl">' + AD2.toFixed(3) + '</span><br>' +
                    '当 t = 1/2（D 为 BC 中点）时面积最小 = <span class="hl">L²/2 = ' + minAD2.toFixed(3) + '</span>' +
                    (isMin ? '　<span class="ok">✓ 当前即最小值点</span>' : ''));
            }
            JX.resizable(cv, draw);
            upd();
        }
    });

    /* =========================================================
       08 · 几何综合证明题（最值证明）
       ========================================================= */
    JX.register({
        key: 'geo-proof',
        difficulty: 4,
        time: '8 分钟',
        steps: [
            '读题并标出已知条件与所求结论。',
            '寻找中间全等或相似三角形，建立边、角关系。',
            '用余弦定理、勾股定理或面积法完成证明。',
        ],
        title: '几何综合证明题',
        field: '综合法 · 余弦定理',
        tags: '推理意识 · 几何直观',
        desc: '用余弦定理 + 二次函数，严谨证明「正方形面积最小时 D 为 BC 中点」。',
        badge: 'copy',
        problem: '（承上题）证明：正方形 ADEF 的面积最小时，点 D 为 BC 的中点。<br><i>综合法：在 △ABD 中用余弦定理，化为关于 t 的二次函数求顶点。</i>',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('gp-t', 'D 位置 t', 0, 1, 0.01, 0.5) +
                '<div class="jx-btn-row"><button class="action-btn" id="gp-next">下一步</button>' +
                '<button class="action-btn secondary" id="gp-reset">重置</button></div>';
            var t = 0.5, step = 0;
            q('#gp-t', card).addEventListener('input', function (e) { t = +e.target.value; q('#gp-t-v', card).textContent = t.toFixed(2); draw(); });
            var steps = [
                '在 △ABD 中，由余弦定理：AD² = AB² + BD² − 2·AB·BD·cos∠B。',
                '∠B = 45°，AB = L，BD = t·BC = t·L√2（设 t∈(0,1)）。',
                '代入：AD² = L² + 2L²t² − 2·L·(tL√2)·(√2/2) = L²(2t² − 2t + 1)。',
                '这是开口向上的二次函数，顶点在 t = −(−2)/(2·2) = 1/2。',
                '当 t = 1/2（D 为 BC 中点）时，AD² 最小 = L²(2·1/4 − 1 + 1) = L²/2。',
                '即正方形 ADEF 面积最小 = L²/2，此时 D 为 BC 中点。　□'
            ];
            function render() {
                var html = '';
                steps.forEach(function (s, i) {
                    var cls = i < step ? 'done' : (i === step ? 'active' : '');
                    html += '<div class="jx-step ' + cls + '"><span class="n">' + (i + 1) + '</span>' + s + '</div>';
                });
                answer.innerHTML = html;
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                // 二次函数 f(t)=2t²-2t+1 曲线，标顶点
                var pad = 34, x0 = pad, x1 = w - pad, y0 = h - pad, y1 = pad;
                function X(tt) { return x0 + tt * (x1 - x0); }
                function Y(ff) { var mx = 1.1; return y0 - (ff / mx) * (y0 - y1); }
                // 网格轴
                D.line(ctx, x0, y0, x1, y0, 'rgba(212,165,116,0.4)', 1.4);
                D.line(ctx, x0, y1, x0, y0, 'rgba(212,165,116,0.4)', 1.4);
                D.label(ctx, 't', x1 - 6, y0 + 16, '#6e7681');
                D.label(ctx, 'AD²/L²', x0 - 6, y1 + 4, '#6e7681');
                ctx.beginPath();
                for (var tt = 0; tt <= 1.0001; tt += 0.01) {
                    var ff = 2 * tt * tt - 2 * tt + 1;
                    var px = X(tt), py = Y(ff);
                    tt === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                // 顶点
                var vx = X(0.5), vy = Y(0.5);
                D.circle(ctx, vx, vy, 6, '#e74c3c', '#fff', 2);
                D.label(ctx, '顶点 t=1/2', vx, vy - 16, '#e74c3c', '12px "Noto Serif SC"');
                // 当前 t 点
                var cxp = X(t), cyp = Y(2 * t * t - 2 * t + 1);
                D.circle(ctx, cxp, cyp, 5, '#5c8a8a', '#fff', 2);
            }
            q('#gp-next', card).addEventListener('click', function () { step = Math.min(step + 1, steps.length - 1); render(); draw(); });
            q('#gp-reset', card).addEventListener('click', function () { step = 0; render(); draw(); });
            JX.resizable(cv, draw);
            render();
        }
    });

    /* =========================================================
       09 · 平行四边形认识（拖拽探究）
       ========================================================= */
    JX.register({
        key: 'parallelogram',
        difficulty: 2,
        time: '5 分钟',
        steps: [
            '拖动顶点，观察对边是否始终平行且相等。',
            '验证平行四边形的对角线互相平分。',
            '总结平行四边形的判定与性质。',
        ],
        title: '平行四边形认识',
        field: '四边形 · 性质探究',
        tags: '几何直观 · 空间观念',
        desc: '拖动四个顶点，实时检验平行四边形的四条性质；一键「变成平行四边形」。',
        badge: 'copy',
        problem: '平行四边形的认识：对边平行且相等、对角相等、对角线互相平分。拖动顶点亲手验证这些性质。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row"><button class="action-btn" id="pg-snap">变成平行四边形</button>' +
                '<button class="action-btn secondary" id="pg-reset">重置</button></div>';
            // 归一化坐标
            var V = [[0.32, 0.34], [0.70, 0.28], [0.78, 0.70], [0.40, 0.76]];
            var drag = -1;
            function px(i, w, h) { return [V[i][0] * w, V[i][1] * h]; }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var P = V.map(function (v, i) { return px(i, w, h); });
                // 边
                ctx.beginPath();
                for (var i = 0; i < 4; i++) { var a = P[i], b = P[(i + 1) % 4]; i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1]); }
                ctx.closePath(); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                ctx.fillStyle = 'rgba(212,165,116,0.08)'; ctx.fill();
                // 对角线
                D.line(ctx, P[0][0], P[0][1], P[2][0], P[2][1], 'rgba(92,138,138,0.7)', 1.5);
                D.line(ctx, P[1][0], P[1][1], P[3][0], P[3][1], 'rgba(92,138,138,0.7)', 1.5);
                // 顶点
                P.forEach(function (p, i) { D.circle(ctx, p[0], p[1], 8, drag === i ? '#e74c3c' : '#e8c499', '#0a0a0f', 2); D.label(ctx, String.fromCharCode(65 + i), p[0], p[1] - 16, '#c9d1d9'); });
                check(P, w);
            }
            function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
            function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
            function len(v) { return Math.hypot(v[0], v[1]); }
            function approxParallel(v1, v2) { return Math.abs(cross(v1, v2)) < 0.06 * len(v1) * len(v2); }
            function approxEqual(a, b) { return Math.abs(a - b) < 0.05 * (a + b + 1e-6); }
            function check(P, W) {
                var s01 = sub(P[1], P[0]), s32 = sub(P[2], P[3]);
                var s12 = sub(P[2], P[1]), s03 = sub(P[3], P[0]);
                var par = approxParallel(s01, s32) && approxParallel(s12, s03);
                var eq = approxEqual(len(s01), len(s32)) && approxEqual(len(s12), len(s03));
                var angEq = approxEqual(Math.abs(cross(s01, s12)), Math.abs(cross(s32, s03)));
                // 对角线中点
                var m02 = [(P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2];
                var m13 = [(P[1][0] + P[3][0]) / 2, (P[1][1] + P[3][1]) / 2];
                var bisect = Math.hypot(m02[0] - m13[0], m02[1] - m13[1]) < 0.04 * W;
                var all = par && eq && angEq && bisect;
                function mark(name, ok) { return name + '：' + (ok ? '<span class="ok">✓</span>' : '<span class="err">✗</span>'); }
                setAns(answer, mark('对边平行', par) + '　' + mark('对边相等', eq) + '<br>' +
                    mark('对角相等', angEq) + '　' + mark('对角线平分', bisect) + '<br>' +
                    (all ? '<span class="ok">🎉 当前是平行四边形！</span>' : '<span class="jx-hint">拖动顶点使其满足全部性质</span>'));
            }
            function pos(e) {
                var r = cv.getBoundingClientRect();
                return [(e.clientX - r.left), (e.clientY - r.top)];
            }
            cv.addEventListener('pointerdown', function (e) {
                var p = pos(e); var o = JX.setupCanvas(cv);
                V.forEach(function (v, i) { var px = v[0] * o.w, py = v[1] * o.h; if (Math.hypot(px - p[0], py - p[1]) < 16) drag = i; });
                if (drag >= 0) cv.setPointerCapture(e.pointerId);
            });
            cv.addEventListener('pointermove', function (e) {
                if (drag < 0) return; var p = pos(e); var o = JX.setupCanvas(cv);
                V[drag] = [JX.clamp(p[0] / o.w, 0.06, 0.94), JX.clamp(p[1] / o.h, 0.06, 0.94)]; draw();
            });
            cv.addEventListener('pointerup', function () { drag = -1; });
            q('#pg-snap', card).addEventListener('click', function () {
                V = [[0.30, 0.32], [0.72, 0.32], [0.80, 0.72], [0.38, 0.72]]; draw();
            });
            q('#pg-reset', card).addEventListener('click', function () {
                V = [[0.32, 0.34], [0.70, 0.28], [0.78, 0.70], [0.40, 0.76]]; draw();
            });
            JX.resizable(cv, draw);
        }
    });

    /* =========================================================
       10 · 抛物线综合题
       ========================================================= */
    JX.register({
        key: 'parabola',
        difficulty: 4,
        time: '8 分钟',
        steps: [
            '设抛物线一般式 y = ax² + bx + c。',
            '把三个已知点代入，解三元一次方程组。',
            '由系数求顶点坐标、对称轴及与坐标轴交点。',
        ],
        title: '抛物线综合题',
        field: '二次函数 · 综合应用',
        tags: '几何直观 · 推理意识',
        desc: '调节 a、b、c，让抛物线穿过三个定点，求出解析式与顶点。',
        badge: 'copy',
        problem: '在平面直角坐标系 xOy 中，抛物线 <span class="formula">y = ax² + bx + c</span> 经过点 <span class="mk">A(−1,0)</span>、<span class="mk">B(3,0)</span>、<span class="mk">C(0,−3)</span>，顶点为 D。<br>(1) 求解析式；(2) 求顶点 D 与对称轴。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('pb-a', 'a', -3, 3, 0.1, 1) + slider('pb-b', 'b', -5, 5, 0.1, -2) + slider('pb-c', 'c', -6, 6, 0.1, -3) +
                '<div class="jx-btn-row"><button class="action-btn" id="pb-show">显示答案</button></div>';
            var a = 1, b = -2, c = -3;
            ['a', 'b', 'c'].forEach(function (key) {
                q('#pb-' + key, card).addEventListener('input', function (e) {
                    var val = +e.target.value; q('#pb-' + key + '-v', card).textContent = val.toFixed(1);
                    if (key === 'a') a = val; if (key === 'b') b = val; if (key === 'c') c = val;
                    draw();
                });
            });
            q('#pb-show', card).addEventListener('click', function () {
                a = 1; b = -2; c = -3;
                q('#pb-a', card).value = 1; q('#pb-a-v', card).textContent = '1.0';
                q('#pb-b', card).value = -2; q('#pb-b-v', card).textContent = '-2.0';
                q('#pb-c', card).value = -3; q('#pb-c-v', card).textContent = '-3.0';
                draw();
                var vx = -b / (2 * a), vy = a * vx * vx + b * vx + c;
                setAns(answer, '由 A、B 为根：y = a(x+1)(x−3) = a(x²−2x−3)<br>' +
                    '代入 C(0,−3)：−3 = a·(−3) → <span class="hl">a = 1</span><br>' +
                    '(1) y = <span class="hl">x² − 2x − 3</span><br>' +
                    '(2) 顶点 D(<span class="hl">' + vx.toFixed(0) + ', ' + vy.toFixed(0) + '</span>)，对称轴 <span class="hl">x = ' + vx.toFixed(0) + '</span>');
            });
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var cs = D.coordSys(ctx, w, h, { xmin: -4, xmax: 5, ymin: -6, ymax: 6, pad: 30 });
                cs.drawGrid();
                ctx.beginPath();
                for (var px = 0; px <= w; px += 2) {
                    var x = cs.xmin + (px / w) * (cs.xmax - cs.xmin);
                    var y = a * x * x + b * x + c;
                    var Y = cs.Y(y);
                    px === 0 ? ctx.moveTo(px, Y) : ctx.lineTo(px, Y);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                var pts = [[-1, 0], [3, 0], [0, -3]];
                var onCurve = pts.every(function (p) { return Math.abs(a * p[0] * p[0] + b * p[0] + c - p[1]) < 0.1; });
                pts.forEach(function (p) {
                    D.circle(ctx, cs.X(p[0]), cs.Y(p[1]), 6, onCurve ? '#5c8a8a' : '#e74c3c', '#fff', 2);
                    D.label(ctx, '(' + p[0] + ',' + p[1] + ')', cs.X(p[0]), cs.Y(p[1]) - 14, '#c9d1d9', '11px "Noto Sans SC"');
                });
                D.label(ctx, 'y = ' + a.toFixed(1) + 'x²' + (b >= 0 ? '+' : '') + b.toFixed(1) + 'x' + (c >= 0 ? '+' : '') + c.toFixed(1), w / 2, 22, onCurve ? '#5c8a8a' : '#e8c499', '15px "Noto Serif SC"');
            }
            JX.resizable(cv, draw);
            setAns(answer, '拖动 a、b、c 让金色抛物线穿过三个红点；全部吻合即求得解析式。');
        }
    });

    /* =========================================================
       11 · 外角平分线求角
       ========================================================= */
    JX.register({
        key: 'ext-bisector',
        difficulty: 3,
        time: '5 分钟',
        steps: [
            '利用三角形外角等于不相邻两内角之和。',
            '分别写出两个外角平分线与内角的关系。',
            '联立化简，求出目标角的度数。',
        ],
        title: '外角平分线求角',
        field: '三角形 · 外角性质',
        tags: '推理意识 · 几何直观',
        desc: '外角平分线交于旁心 P，利用 ∠BPC = 90° − ∠A/2 反求 ∠A。',
        badge: 'copy',
        problem: '已知 △ABC 中，∠ABC = 36°，点 P 在三角形外，BP 平分 ∠ABC 的外角，CP 平分 ∠ACB 的外角，若 <span class="mk">∠BPC = 42°</span>，求 ∠A 的度数。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('eb-A', '∠A', 20, 140, 1, 96) + slider('eb-B', '∠B', 10, 80, 1, 36) +
                '<div class="jx-btn-row"><button class="action-btn" id="eb-check">用 42° 求 ∠A</button></div>';
            var A = 96, B = 36;
            q('#eb-A', card).addEventListener('input', function (e) { A = +e.target.value; q('#eb-A-v', card).textContent = A + '°'; draw(); upd(); });
            q('#eb-B', card).addEventListener('input', function (e) { B = +e.target.value; q('#eb-B-v', card).textContent = B + '°'; draw(); upd(); });
            q('#eb-check', card).addEventListener('click', function () {
                A = 2 * (90 - 42); B = 36;
                q('#eb-A', card).value = A; q('#eb-A-v', card).textContent = A + '°';
                q('#eb-B', card).value = B; q('#eb-B-v', card).textContent = B + '°';
                draw(); upd();
                setAns(answer, '旁心性质：<span class="hl">∠BPC = 90° − ∠A/2</span><br>' +
                    '由 42° = 90° − ∠A/2 → ∠A/2 = 48° → <span class="hl">∠A = 96°</span>。');
            });
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var Cdeg = 180 - A - B;
                var cx = w * 0.42, cy = h * 0.40, R = Math.min(w, h) * 0.26;
                var Aang = -Math.PI / 2; // A 在上
                var Bang = Aang + (B) * Math.PI / 180;
                var Cang = Aang - (Cdeg) * Math.PI / 180;
                var Pa = [cx + R * Math.cos(Aang), cy + R * Math.sin(Aang)];
                var Pb = [cx + R * Math.cos(Bang), cy + R * Math.sin(Bang)];
                var Pc = [cx + R * Math.cos(Cang), cy + R * Math.sin(Cang)];
                ctx.beginPath(); ctx.moveTo(Pa[0], Pa[1]); ctx.lineTo(Pb[0], Pb[1]); ctx.lineTo(Pc[0], Pc[1]); ctx.closePath();
                ctx.strokeStyle = 'rgba(201,209,217,0.6)'; ctx.lineWidth = 1.8; ctx.stroke();
                D.label(ctx, 'A', Pa[0], Pa[1] - 12, '#d4a574');
                D.label(ctx, 'B', Pb[0] - 14, Pb[1] + 6, '#c9d1d9');
                D.label(ctx, 'C', Pc[0] + 10, Pc[1] + 6, '#c9d1d9');
                // P 旁心（在 A 对边外侧）：近似放在 A 的反方向稍偏
                var Ppx = cx, Ppy = cy - R * 1.5;
                D.dot(ctx, Ppx, Ppy, 5, '#e74c3c');
                D.label(ctx, 'P', Ppx, Ppy - 12, '#e74c3c');
                // 外角平分线示意（B、C 处向外）
                ctx.setLineDash([4, 4]);
                D.line(ctx, Pb[0], Pb[1], Ppx, Ppy, 'rgba(231,76,60,0.6)', 1.5);
                D.line(ctx, Pc[0], Pc[1], Ppx, Ppy, 'rgba(231,76,60,0.6)', 1.5);
                ctx.setLineDash([]);
                D.label(ctx, 'BP、CP 为外角平分线', w / 2, h - 16, '#6e7681', '12px "Noto Serif SC"');
            }
            function upd() {
                var bpc = 90 - A / 2;
                setAns(answer, '关系：<span class="hl">∠BPC = 90° − ∠A/2</span><br>' +
                    '当前 ∠A = ' + A + '° → ∠BPC = <span class="hl">' + bpc.toFixed(1) + '°</span>' +
                    (Math.abs(bpc - 42) < 0.5 ? '　<span class="ok">✓ 与已知 42° 吻合</span>' : ''));
            }
            JX.resizable(cv, draw);
            upd();
        }
    });

    /* =========================================================
       12 · 含参一元一次方程
       ========================================================= */
    JX.register({
        key: 'param-eq',
        difficulty: 3,
        time: '6 分钟',
        steps: [
            '把含参数 a 的方程化为最简形式。',
            '讨论一次项系数为 0 与不为 0 两种情况。',
            '分别求出对应参数取值及方程的解。',
        ],
        title: '含参一元一次方程',
        field: '一元一次方程 · 参数讨论',
        tags: '运算能力 · 推理意识',
        desc: '两方程的解互为相反数，列式解出参数 m。',
        badge: 'copy',
        problem: '已知关于 x 的方程 <span class="formula">2(x−1) = 3m−1</span> 与 <span class="formula">3x+2 = −2(m+1)</span> 的解互为相反数，求 <span class="mk">m</span> 的值。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML =
                '<div class="control-group"><label>猜 m <span id="pe-m-v">1</span></label>' +
                '<input type="number" id="pe-m" step="0.5" value="1"></div>' +
                '<div class="jx-btn-row"><button class="action-btn" id="pe-check">验证</button>' +
                '<button class="action-btn secondary" id="pe-show">显示过程</button></div>';
            q('#pe-m', card).addEventListener('input', function () { check(); });
            q('#pe-check', card).addEventListener('click', check);
            q('#pe-show', card).addEventListener('click', function () {
                setAns(answer, '由①：2x − 2 = 3m − 1 → <span class="hl">x₁ = (3m+1)/2</span><br>' +
                    '由②：3x = −2m − 4 → <span class="hl">x₂ = (−2m−4)/3</span><br>' +
                    '解互为相反数：x₁ = −x₂ → (3m+1)/2 = (2m+4)/3<br>' +
                    '交叉相乘：3(3m+1) = 2(2m+4) → 9m+3 = 4m+8 → <span class="hl">m = 1</span>。');
            });
            function check() {
                var m = parseFloat(q('#pe-m', card).value);
                if (isNaN(m)) { setAns(answer, '请输入 m。'); return; }
                var x1 = (3 * m + 1) / 2, x2 = (-2 * m - 4) / 3;
                var ok = Math.abs(x1 + x2) < 1e-9;
                setAns(answer, 'x₁ = ' + x1.toFixed(3) + '，x₂ = ' + x2.toFixed(3) + '，x₁ + x₂ = <span class="hl">' + (x1 + x2).toFixed(3) + '</span><br>' +
                    (ok ? '<span class="ok">✓ 互为相反数，m = ' + m + ' 正确！</span>' : '<span class="err">✗ 并非相反数</span>'));
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                D.label(ctx, '两方程的解', w / 2, h * 0.3, '#6e7681', '13px "Noto Serif SC"');
                D.label(ctx, 'x₁ = (3m+1)/2', w / 2, h * 0.5, '#e8c499', '16px "Noto Mono", monospace');
                D.label(ctx, 'x₂ = (−2m−4)/3', w / 2, h * 0.66, '#5c8a8a', '16px "Noto Mono", monospace');
                D.label(ctx, '要求 x₁ = −x₂', w / 2, h * 0.84, '#d4a574', '14px "Noto Serif SC"');
            }
            JX.resizable(cv, draw);
            check();
        }
    });

})();
