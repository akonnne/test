/* ============================================================
   教学动画 · 概率与统计新增模块 (teaching-partE.js)
   新增 10 个交互式动画，覆盖分布、推断、回归与经典概率问题。
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
       E1 · 二项分布
       ========================================================= */
    JX.register({
        key: 'binomial', title: '二项分布', field: '概率统计 · 二项分布',
        difficulty: 2, time: '5 分钟',
        steps: ['设定试验次数 n 与成功概率 p。', '计算 P(X = k) = C(n,k) p^k (1-p)^(n-k)。', '观察分布形状随参数变化。'],
        tags: '数据意识 · 模型意识', badge: 'new',
        desc: '用条形图展示二项分布，直观理解 n、p 对分布形态的影响。',
        problem: '抛 n 次公平或不公平硬币，正面朝上 k 次的概率如何分布？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('bn-n', '试验次数 n', 5, 30, 1, 10, '') +
                slider('bn-p', '成功概率 p', 0.05, 0.95, 0.05, 0.5, '');
            function C(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var n = +q('#bn-n', card).value, p = +q('#bn-p', card).value;
                var probs = []; for (var k = 0; k <= n; k++) probs.push(C(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k));
                var max = Math.max.apply(null, probs);
                var pad = 40, bw = Math.max(2, (w - pad * 2) / (n + 1) - 2);
                for (var k = 0; k <= n; k++) {
                    var bh = probs[k] / max * (h * 0.55);
                    var x = pad + k * (bw + 2);
                    var y = h * 0.72 - bh;
                    ctx.fillStyle = k === Math.round(n * p) ? '#d4a574' : 'rgba(92,138,138,0.7)';
                    ctx.fillRect(x, y, bw, bh);
                    if (n <= 15) D.label(ctx, String(k), x + bw * 0.5, h * 0.72 + 12, 'rgba(201,209,217,0.7)', 'center', '9px');
                }
                D.label(ctx, 'X ~ B(n=' + n + ', p=' + p.toFixed(2) + ')', w * 0.5, 30, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">期望 E(X) = np = ' + (n * p).toFixed(2) + '</p>');
            }
            bind('#bn-n', card, 'input', function () { q('#bn-n-v', card).textContent = q('#bn-n', card).value; draw(); });
            bind('#bn-p', card, 'input', function () { q('#bn-p-v', card).textContent = q('#bn-p', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       E2 · 频率分布直方图
       ========================================================= */
    JX.register({
        key: 'histogram', title: '频率分布直方图', field: '概率统计 · 数据分布',
        difficulty: 1, time: '4 分钟',
        steps: ['生成一组随机数据。', '选择组距，把数据分到不同区间。', '用矩形高度表示频率/组距。'],
        tags: '数据意识 · 量感', badge: 'new',
        desc: '模拟生成数据并绘制频率分布直方图，理解组距选择对图形的影响。',
        problem: '一组身高或成绩数据如何分组展示？改变组距，观察直方图形状变化。',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('hg-bin', '组数', 4, 20, 1, 10, '') +
                '<div class="jx-btn-row"><button class="action-btn" id="hg-new">重新生成数据</button></div>';
            var data = [];
            function gen() { data = []; for (var i = 0; i < 200; i++) data.push(JX.rand(0, 100)); }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var bins = +q('#hg-bin', card).value;
                var counts = new Array(bins).fill(0);
                data.forEach(function (v) { var b = Math.min(bins - 1, Math.floor(v / 100 * bins)); counts[b]++; });
                var max = Math.max.apply(null, counts);
                var bw = (w - 60) / bins;
                for (var i = 0; i < bins; i++) {
                    var bh = counts[i] / max * (h * 0.55);
                    var x = 30 + i * bw;
                    var y = h * 0.72 - bh;
                    ctx.fillStyle = 'rgba(92,138,138,0.7)';
                    ctx.fillRect(x + 1, y, bw - 2, bh);
                }
                D.label(ctx, '组数 = ' + bins + '，样本量 n = 200', w * 0.5, 30, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">每个矩形面积 ≈ 该组频率，总面积 ≈ 1</p>');
            }
            gen();
            bind('#hg-bin', card, 'input', function () { q('#hg-bin-v', card).textContent = q('#hg-bin', card).value; draw(); });
            bind('#hg-new', card, 'click', function () { gen(); draw(); });
            draw();
        }
    });

    /* =========================================================
       E3 · 条件概率
       ========================================================= */
    JX.register({
        key: 'conditional', title: '条件概率', field: '概率统计 · 条件概率',
        difficulty: 3, time: '5 分钟',
        steps: ['设定事件 A、B 的概率与交集概率。', '计算 P(A|B) = P(A∩B) / P(B)。', '拖动滑块观察条件概率变化。'],
        tags: '数据意识 · 推理意识', badge: 'new',
        desc: '用维恩图动态演示条件概率，理解“已知 B 发生后 A 的概率”为何变化。',
        problem: '已知事件 <span class="mk">B</span> 发生，事件 <span class="mk">A</span> 发生的概率如何计算？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('cp-pa', 'P(A)', 0.1, 0.9, 0.05, 0.5, '') +
                slider('cp-pb', 'P(B)', 0.1, 0.9, 0.05, 0.4, '') +
                slider('cp-pab', 'P(A∩B)', 0.05, 0.5, 0.05, 0.2, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var pa = +q('#cp-pa', card).value, pb = +q('#cp-pb', card).value, pab = Math.min(+q('#cp-pab', card).value, pa, pb);
                q('#cp-pab', card).value = pab; q('#cp-pab-v', card).textContent = pab.toFixed(2);
                var cx = w * 0.35, cy = h * 0.55, r = Math.min(w, h) * 0.22;
                D.circle(ctx, cx - r * 0.3, cy, r, 'rgba(92,138,138,0.25)', 'rgba(92,138,138,0.7)', 2);
                D.circle(ctx, cx + r * 0.3, cy, r, 'rgba(212,165,116,0.2)', 'rgba(212,165,116,0.7)', 2);
                D.label(ctx, 'A', cx - r * 0.3 - r - 8, cy, '#5c8a8a', 'right', '13px');
                D.label(ctx, 'B', cx + r * 0.3 + r + 8, cy, '#d4a574', 'left', '13px');
                D.label(ctx, 'A∩B', cx, cy, '#e6c9a8', 'center', '12px');
                var cond = pb > 0 ? pab / pb : 0;
                D.label(ctx, 'P(A|B) = P(A∩B) / P(B)', w * 0.75, cy - 12, '#e6c9a8', 'center', '13px');
                D.label(ctx, '= ' + pab.toFixed(2) + ' / ' + pb.toFixed(2) + ' ≈ ' + cond.toFixed(2), w * 0.75, cy + 12, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">P(A|B) = ' + pab.toFixed(2) + ' / ' + pb.toFixed(2) + ' ≈ <strong>' + cond.toFixed(3) + '</strong></p>');
            }
            bind('#cp-pa', card, 'input', function () { q('#cp-pa-v', card).textContent = q('#cp-pa', card).value; draw(); });
            bind('#cp-pb', card, 'input', function () { q('#cp-pb-v', card).textContent = q('#cp-pb', card).value; draw(); });
            bind('#cp-pab', card, 'input', function () { q('#cp-pab-v', card).textContent = q('#cp-pab', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       E4 · 期望与方差
       ========================================================= */
    JX.register({
        key: 'expectation', title: '期望与方差', field: '概率统计 · 数字特征',
        difficulty: 2, time: '5 分钟',
        steps: ['设定离散随机变量的取值与概率。', '计算期望 E(X) 与方差 Var(X)。', '观察分布集中趋势与离散程度。'],
        tags: '数据意识 · 运算能力', badge: 'new',
        desc: '通过可调的离散分布，理解期望（均值）与方差（波动）的几何意义。',
        problem: '如何衡量一组随机变量的“平均水平”与“波动大小”？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('ev-p1', 'P(X=1)', 0, 0.6, 0.05, 0.2, '') +
                slider('ev-p2', 'P(X=2)', 0, 0.6, 0.05, 0.3, '') +
                slider('ev-p3', 'P(X=3)', 0, 0.6, 0.05, 0.3, '') +
                slider('ev-p4', 'P(X=4)', 0, 0.6, 0.05, 0.2, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var p = [+q('#ev-p1', card).value, +q('#ev-p2', card).value, +q('#ev-p3', card).value, +q('#ev-p4', card).value];
                var sum = p.reduce(function (a, b) { return a + b; }, 0);
                if (sum < 0.001) { setAns(answer, '<p class="formula">概率之和须大于 0</p>'); return; }
                p = p.map(function (x) { return x / sum; });
                var vals = [1, 2, 3, 4];
                var ex = vals.reduce(function (s, v, i) { return s + v * p[i]; }, 0);
                var ex2 = vals.reduce(function (s, v, i) { return s + v * v * p[i]; }, 0);
                var varx = ex2 - ex * ex;
                var pad = 50, bw = (w - pad * 2) / 4;
                for (var i = 0; i < 4; i++) {
                    var bh = p[i] * (h * 0.6);
                    var x = pad + i * bw;
                    var y = h * 0.75 - bh;
                    ctx.fillStyle = 'rgba(92,138,138,0.7)';
                    ctx.fillRect(x + 4, y, bw - 8, bh);
                    D.label(ctx, 'x=' + vals[i], x + bw * 0.5, h * 0.75 + 18, 'rgba(201,209,217,0.8)', 'center', '12px');
                    D.label(ctx, (p[i] * 100).toFixed(0) + '%', x + bw * 0.5, y - 10, '#e6c9a8', 'center', '11px');
                }
                // 期望线
                var exX = pad + (ex - 1) * bw;
                D.line(ctx, exX, h * 0.2, exX, h * 0.75, '#e74c3c', 2);
                D.label(ctx, 'E(X)≈' + ex.toFixed(2), exX, h * 0.18, '#e74c3c', 'center', '12px');
                setAns(answer, '<p class="formula">E(X) ≈ ' + ex.toFixed(3) + '，Var(X) ≈ ' + varx.toFixed(3) + '</p>');
            }
            ['#ev-p1', '#ev-p2', '#ev-p3', '#ev-p4'].forEach(function (sel) {
                bind(sel, card, 'input', function () { q(sel + '-v', card).textContent = q(sel, card).value; draw(); });
            });
            draw();
        }
    });

    /* =========================================================
       E5 · 中心极限定理
       ========================================================= */
    JX.register({
        key: 'clt', title: '中心极限定理', field: '概率统计 · 极限定理',
        difficulty: 3, time: '5 分钟',
        steps: ['选择原始分布（均匀/指数/两点）。', '每次抽取 n 个样本并计算样本均值。', '重复多次，观察样本均值的分布趋近正态。'],
        tags: '数据意识 · 模型意识', badge: 'new',
        desc: '用蒙特卡洛模拟验证中心极限定理：无论总体分布如何，样本均值近似正态分布。',
        problem: '为什么统计推断中常用正态分布近似？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('clt-n', '样本量 n', 1, 50, 1, 5, '') +
                '<div class="jx-btn-row"><button class="action-btn" id="clt-run">模拟 500 次</button><button class="action-btn" id="clt-dist">切换分布</button></div>';
            var dist = 'uniform'; // uniform, exp, bernoulli
            var means = [];
            function sample() {
                var s = 0;
                for (var i = 0; i < (+q('#clt-n', card).value); i++) {
                    if (dist === 'uniform') s += JX.rand(0, 1);
                    else if (dist === 'exp') s += -Math.log(Math.random());
                    else s += Math.random() < 0.3 ? 1 : 0;
                }
                return s / (+q('#clt-n', card).value);
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var n = +q('#clt-n', card).value;
                while (means.length < 500) means.push(sample());
                var min = Math.min.apply(null, means), max = Math.max.apply(null, means);
                var bins = 20, counts = new Array(bins).fill(0);
                means.forEach(function (m) { var b = Math.min(bins - 1, Math.floor((m - min) / (max - min + 0.0001) * bins)); counts[b]++; });
                var cmax = Math.max.apply(null, counts);
                var bw = (w - 60) / bins;
                for (var i = 0; i < bins; i++) {
                    var bh = counts[i] / cmax * (h * 0.55);
                    var x = 30 + i * bw;
                    ctx.fillStyle = 'rgba(92,138,138,0.7)';
                    ctx.fillRect(x + 1, h * 0.72 - bh, bw - 2, bh);
                }
                D.label(ctx, dist + ' 分布，n=' + n + '，模拟次数=' + means.length, w * 0.5, 30, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">样本均值的均值 ≈ ' + (means.reduce(function (a, b) { return a + b; }, 0) / means.length).toFixed(3) + '</p>');
            }
            bind('#clt-n', card, 'input', function () { q('#clt-n-v', card).textContent = q('#clt-n', card).value; means = []; draw(); });
            bind('#clt-run', card, 'click', function () { for (var i = 0; i < 500; i++) means.push(sample()); draw(); });
            bind('#clt-dist', card, 'click', function () { dist = dist === 'uniform' ? 'exp' : (dist === 'exp' ? 'bernoulli' : 'uniform'); means = []; draw(); });
            draw();
        }
    });

    /* =========================================================
       E6 · 线性回归
       ========================================================= */
    JX.register({
        key: 'regression', title: '线性回归', field: '概率统计 · 回归分析',
        difficulty: 2, time: '5 分钟',
        steps: ['在平面上生成或拖动散点。', '用最小二乘法拟合最佳直线。', '观察回归线如何描述变量关系。'],
        tags: '数据意识 · 模型意识', badge: 'new',
        desc: '在散点图上实时拟合最小二乘回归直线，理解斜率、截距与相关系数。',
        problem: '给定一组 <span class="mk">(x, y)</span> 数据，如何找到最能代表它们关系的直线？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = '<div class="jx-btn-row"><button class="action-btn" id="rg-new">重新生成散点</button></div>';
            var pts = [];
            function gen() { pts = []; for (var i = 0; i < 20; i++) { var x = JX.rand(0, 10); pts.push({ x: x, y: 2 + 0.8 * x + JX.rand(-3, 3) }); } }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var pad = 40, gw = w - pad * 2, gh = h - pad * 2;
                D.line(ctx, pad, h - pad, w - pad, h - pad, 'rgba(201,209,217,0.4)', 1.5);
                D.line(ctx, pad, h - pad, pad, pad, 'rgba(201,209,217,0.4)', 1.5);
                var mx = pts.reduce(function (a, p) { return a + p.x; }, 0) / pts.length;
                var my = pts.reduce(function (a, p) { return a + p.y; }, 0) / pts.length;
                var num = pts.reduce(function (a, p) { return a + (p.x - mx) * (p.y - my); }, 0);
                var den = pts.reduce(function (a, p) { return a + (p.x - mx) * (p.x - mx); }, 0);
                var b = den === 0 ? 0 : num / den, a = my - b * mx;
                var x1 = 0, y1 = a + b * x1, x2 = 10, y2 = a + b * x2;
                var sx = function (x) { return pad + x / 10 * gw; };
                var sy = function (y) { return h - pad - (y - (-2)) / 14 * gh; };
                D.line(ctx, sx(x1), sy(y1), sx(x2), sy(y2), '#d4a574', 2.5);
                pts.forEach(function (p) { D.dot(ctx, sx(p.x), sy(p.y), 5, '#5c8a8a'); });
                D.label(ctx, 'y = ' + b.toFixed(2) + 'x + ' + a.toFixed(2), w * 0.5, 30, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">回归方程：ŷ = ' + b.toFixed(3) + 'x + ' + a.toFixed(3) + '</p>');
            }
            gen();
            bind('#rg-new', card, 'click', function () { gen(); draw(); });
            draw();
        }
    });

    /* =========================================================
       E7 · 贝叶斯定理
       ========================================================= */
    JX.register({
        key: 'bayes', title: '贝叶斯定理', field: '概率统计 · 贝叶斯推断',
        difficulty: 3, time: '5 分钟',
        steps: ['设定疾病的先验患病率 P(D)。', '设定检测灵敏度与特异度。', '计算阳性后的后验概率 P(D|+)。'],
        tags: '数据意识 · 推理意识', badge: 'new',
        desc: '用贝叶斯定理演示医学检测中的后验概率，破除“阳性即患病”的直觉误区。',
        problem: '一项疾病检测呈阳性，实际患病的概率有多大？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('by-pd', '患病率 P(D)', 0.001, 0.5, 0.001, 0.01, '') +
                slider('by-sens', '灵敏度 P(+|D)', 0.5, 1, 0.01, 0.95, '') +
                slider('by-spec', '特异度 P(-|¬D)', 0.5, 1, 0.01, 0.9, '');
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var pd = +q('#by-pd', card).value, sens = +q('#by-sens', card).value, spec = +q('#by-spec', card).value;
                var pPos = sens * pd + (1 - spec) * (1 - pd);
                var post = pPos > 0 ? sens * pd / pPos : 0;
                var cx = w * 0.5, cy = h * 0.55;
                // 患病率圆
                D.circle(ctx, cx - 80, cy, 60 * Math.sqrt(pd), 'rgba(231,76,60,0.25)', null, 0);
                D.circle(ctx, cx + 80, cy, 60 * Math.sqrt(1 - pd), 'rgba(92,138,138,0.2)', null, 0);
                D.label(ctx, '患病 ' + (pd * 100).toFixed(1) + '%', cx - 80, cy + 70, '#e74c3c', 'center', '12px');
                D.label(ctx, '健康 ' + ((1 - pd) * 100).toFixed(1) + '%', cx + 80, cy + 70, '#5c8a8a', 'center', '12px');
                D.label(ctx, 'P(D|+) = ' + (post * 100).toFixed(1) + '%', cx, cy - 90, '#e6c9a8', 'center', '16px');
                setAns(answer, '<p class="formula">P(D|+) = ' + sens.toFixed(2) + '×' + pd.toFixed(3) + ' / ' + pPos.toFixed(4) + ' ≈ <strong>' + (post * 100).toFixed(1) + '%</strong></p>');
            }
            bind('#by-pd', card, 'input', function () { q('#by-pd-v', card).textContent = q('#by-pd', card).value; draw(); });
            bind('#by-sens', card, 'input', function () { q('#by-sens-v', card).textContent = q('#by-sens', card).value; draw(); });
            bind('#by-spec', card, 'input', function () { q('#by-spec-v', card).textContent = q('#by-spec', card).value; draw(); });
            draw();
        }
    });

    /* =========================================================
       E8 · 抽样分布
       ========================================================= */
    JX.register({
        key: 'sampling', title: '抽样分布', field: '概率统计 · 抽样分布',
        difficulty: 3, time: '5 分钟',
        steps: ['设定总体分布与样本量 n。', '重复抽取样本并计算样本均值。', '观察样本均值的分布（标准误）。'],
        tags: '数据意识 · 模型意识', badge: 'new',
        desc: '模拟样本均值的抽样分布，理解标准误随样本量增大而减小。',
        problem: '从同一总体中反复抽样，样本均值的分布有什么规律？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('sp-n', '样本量 n', 2, 50, 1, 10, '') +
                '<div class="jx-btn-row"><button class="action-btn" id="sp-run">再模拟 300 次</button></div>';
            var means = [];
            function sampleMean(n) { var s = 0; for (var i = 0; i < n; i++) s += JX.rand(0, 10); return s / n; }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var n = +q('#sp-n', card).value;
                while (means.length < 300) means.push(sampleMean(n));
                var min = 0, max = 10;
                var bins = 18, counts = new Array(bins).fill(0);
                means.forEach(function (m) { var b = Math.min(bins - 1, Math.floor(m / 10 * bins)); counts[b]++; });
                var cmax = Math.max.apply(null, counts);
                var bw = (w - 60) / bins;
                for (var i = 0; i < bins; i++) {
                    var bh = counts[i] / cmax * (h * 0.55);
                    ctx.fillStyle = 'rgba(92,138,138,0.7)';
                    ctx.fillRect(30 + i * bw + 1, h * 0.72 - bh, bw - 2, bh);
                }
                var meanOfMeans = means.reduce(function (a, b) { return a + b; }, 0) / means.length;
                var se = Math.sqrt(means.reduce(function (a, m) { return a + (m - meanOfMeans) * (m - meanOfMeans); }, 0) / means.length);
                D.label(ctx, '样本量 n=' + n + '，均值的标准误 ≈ ' + se.toFixed(2), w * 0.5, 30, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">样本均值的均值 ≈ ' + meanOfMeans.toFixed(2) + '，标准误 ≈ ' + se.toFixed(3) + '</p>');
            }
            bind('#sp-n', card, 'input', function () { q('#sp-n-v', card).textContent = q('#sp-n', card).value; means = []; draw(); });
            bind('#sp-run', card, 'click', function () { for (var i = 0; i < 300; i++) means.push(sampleMean(+q('#sp-n', card).value)); draw(); });
            draw();
        }
    });

    /* =========================================================
       E9 · 相关性散点图
       ========================================================= */
    JX.register({
        key: 'scatter', title: '相关性散点图', field: '概率统计 · 相关分析',
        difficulty: 1, time: '4 分钟',
        steps: ['选择相关系数 r。', '生成对应线性相关的散点。', '观察 r 越接近 ±1，点越集中在直线附近。'],
        tags: '数据意识 · 几何直观', badge: 'new',
        desc: '通过可调的相关系数生成散点图，理解正相关、负相关与无关。',
        problem: '如何用散点图判断两个变量的相关性强弱？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('sc-r', '相关系数 r', -0.95, 0.95, 0.05, 0.7, '') +
                '<div class="jx-btn-row"><button class="action-btn" id="sc-new">重新生成</button></div>';
            var pts = [];
            function gen() {
                var r = +q('#sc-r', card).value;
                pts = [];
                for (var i = 0; i < 50; i++) {
                    var x = JX.rand(-3, 3);
                    var y = r * x + Math.sqrt(1 - r * r) * JX.rand(-2, 2);
                    pts.push({ x: x, y: y });
                }
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var cx = w * 0.5, cy = h * 0.55;
                D.line(ctx, 20, cy, w - 20, cy, 'rgba(201,209,217,0.3)', 1);
                D.line(ctx, cx, 20, cx, h - 20, 'rgba(201,209,217,0.3)', 1);
                pts.forEach(function (p) { D.dot(ctx, cx + p.x * 25, cy - p.y * 25, 4, '#5c8a8a'); });
                var r = +q('#sc-r', card).value;
                D.line(ctx, cx - 70, cy + r * 70, cx + 70, cy - r * 70, '#d4a574', 2);
                var desc = Math.abs(r) > 0.7 ? '强' : (Math.abs(r) > 0.3 ? '中等' : '弱');
                D.label(ctx, 'r = ' + r.toFixed(2) + '（' + (r > 0 ? '正' : '负') + '相关，' + desc + '）', w * 0.5, 30, '#e6c9a8', 'center', '14px');
                setAns(answer, '<p class="formula">相关系数 r = ' + r.toFixed(2) + '：' + desc + (r > 0 ? '正相关' : '负相关') + '</p>');
            }
            gen();
            bind('#sc-r', card, 'input', function () { q('#sc-r-v', card).textContent = q('#sc-r', card).value; gen(); draw(); });
            bind('#sc-new', card, 'click', function () { gen(); draw(); });
            draw();
        }
    });

    /* =========================================================
       E10 · 生日悖论
       ========================================================= */
    JX.register({
        key: 'birthday', title: '生日悖论', field: '概率统计 · 古典概型',
        difficulty: 2, time: '4 分钟',
        steps: ['设定房间人数 n。', '计算“至少两人生日相同”的概率。', '观察 n = 23 时概率为何已超过 50%。'],
        tags: '数据意识 · 推理意识', badge: 'new',
        desc: '用排列组合与模拟验证生日悖论，理解概率直觉与真实计算的差异。',
        problem: '一个 23 人的房间里，至少两人生日相同的概率是多少？',
        mount: function (card) {
            var cv = q('.jx-canvas-wrap canvas', card);
            var controls = q('.jx-controls', card);
            var answer = q('.jx-answer', card);
            controls.innerHTML = slider('bd-n', '人数 n', 2, 60, 1, 23, '') +
                '<div class="jx-btn-row"><button class="action-btn" id="bd-sim">模拟 1000 次</button></div>';
            var simRate = null;
            function prob(n) { var p = 1; for (var i = 0; i < n; i++) p *= (365 - i) / 365; return 1 - p; }
            function simulate(n) {
                var hit = 0;
                for (var t = 0; t < 1000; t++) {
                    var seen = {};
                    for (var i = 0; i < n; i++) { var d = Math.floor(Math.random() * 365); if (seen[d]) { hit++; break; } seen[d] = 1; }
                }
                return hit / 1000;
            }
            function draw() {
                var o = JX.setupCanvas(cv); var ctx = o.ctx, w = o.w, h = o.h;
                D.clearBG(ctx, w, h);
                var n = +q('#bd-n', card).value;
                ctx.beginPath();
                for (var x = 0; x <= 60; x++) {
                    var px = 30 + x * (w - 60) / 60;
                    var py = h * 0.72 - prob(x) * (h * 0.55);
                    if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 2.5; ctx.stroke();
                var curP = prob(n);
                var curX = 30 + n * (w - 60) / 60, curY = h * 0.72 - curP * (h * 0.55);
                D.dot(ctx, curX, curY, 7, '#e74c3c');
                D.label(ctx, 'n=' + n + ', P≈' + (curP * 100).toFixed(1) + '%', curX + 10, curY - 12, '#e74c3c', 'left', '13px');
                var sRate = simRate !== null ? '模拟：' + (simRate * 100).toFixed(1) + '%' : '';
                D.label(ctx, sRate, w * 0.5, 30, '#e6c9a8', 'center', '13px');
                setAns(answer, '<p class="formula">P(至少两人生日相同) ≈ <strong>' + (curP * 100).toFixed(1) + '%</strong></p>');
            }
            bind('#bd-n', card, 'input', function () { q('#bd-n-v', card).textContent = q('#bd-n', card).value; simRate = null; draw(); });
            bind('#bd-sim', card, 'click', function () { simRate = simulate(+q('#bd-n', card).value); draw(); });
            draw();
        }
    });
})();
