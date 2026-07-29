/* 数道·万象 —— AI 生成动画的安全渲染器（anim-engine.js）
 *
 * 安全原则（重要）：
 *  - 只渲染后端返回的「动画定义（spec）」，绝不使用 eval / new Function 执行任何代码。
 *  - 表达式由自研 shunting-yard 求值器解析，变量只能来自 spec 里声明的 slider/step。
 *  - 只识别白名单内的对象类型与字段；未知字段一律忽略。
 *
 * 表现力（持续升级）：
 *  - 「一笔一笔画线」：对象随 appearAt 首次出现时，自动播放描边/绘制动画（line 端点插值、
 *    circle 弧度展开、rect/多边形 沿周长逐段、plot/area 左→右揭示、axes 逐步生长、文字淡入）。
 *  - 语音讲解：用 Web Speech API 朗读每一步 text（或 voice 字段），zh-CN；可开关与重读。
 *  - 更丰富的对象类型：polygon / sector / angle / curve / vector / grid 等。
 *
 * 对外暴露：window.AnimEngine.render(spec, mountEl) -> { cleanup }
 */
(function () {
  'use strict';

  /* ============ 安全表达式求值器（无 eval） ============ */
  var FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sqrt: Math.sqrt, abs: Math.abs,
    log: Math.log, exp: Math.exp,
    min: Math.min, max: Math.max,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    pow: Math.pow, sign: Math.sign, hypot: Math.hypot
  };

  function tokenize(s) {
    var tokens = [];
    var i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var num = '';
        while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i]; i++; }
        tokens.push({ t: 'num', v: parseFloat(num) });
        continue;
      }
      if (/[a-zA-Z_]/.test(c)) {
        var id = '';
        while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) { id += s[i]; i++; }
        tokens.push({ t: 'id', v: id });
        continue;
      }
      if ('+-*/^(),'.indexOf(c) !== -1) {
        tokens.push({ t: 'op', v: c });
        i++;
        continue;
      }
      i++;
    }
    return tokens;
  }

  function toRPN(tokens) {
    var out = [], stack = [];
    var prec = { '+': 2, '-': 2, '*': 3, '/': 3, '^': 4, 'u-': 5, 'f': 6 };
    var prevType = null;
    for (var k = 0; k < tokens.length; k++) {
      var tk = tokens[k];
      if (tk.t === 'num') { out.push(tk); prevType = 'num'; }
      else if (tk.t === 'id') {
        var nxt = tokens[k + 1];
        if (nxt && nxt.t === 'op' && nxt.v === '(') {
          stack.push({ t: 'op', v: 'f', name: tk.v });
          prevType = 'fn';
        } else {
          out.push({ t: 'var', v: tk.v });
          prevType = 'var';
        }
      }
      else if (tk.t === 'op') {
        if (tk.v === '(') { stack.push(tk); prevType = '('; }
        else if (tk.v === ')') {
          while (stack.length && stack[stack.length - 1].v !== '(') out.push(stack.pop());
          if (stack.length && stack[stack.length - 1].v === '(') stack.pop();
          if (stack.length && stack[stack.length - 1].v === 'f') out.push(stack.pop());
          prevType = ')';
        }
        else if (tk.v === ',') {
          while (stack.length && stack[stack.length - 1].v !== '(') out.push(stack.pop());
          prevType = ',';
        }
        else {
          var isUnary = (tk.v === '-') && (prevType === null || prevType === 'op' || prevType === '(' || prevType === ',');
          var op = isUnary ? 'u-' : tk.v;
          while (stack.length) {
            var top = stack[stack.length - 1];
            if (top.v === '(' || top.v === 'f') break;
            var tp = prec[top.v] || 0, opc = prec[op] || 0;
            if ((op !== '^' && tp >= opc) || (op === '^' && tp > opc)) out.push(stack.pop());
            else break;
          }
          stack.push({ t: 'op', v: op });
          prevType = 'op';
        }
      }
    }
    while (stack.length) out.push(stack.pop());
    return out;
  }

  function evalRPN(rpn, scope) {
    var st = [];
    for (var i = 0; i < rpn.length; i++) {
      var t = rpn[i];
      if (t.t === 'num') st.push(t.v);
      else if (t.t === 'var') {
        var val = scope[t.v];
        st.push(typeof val === 'number' && isFinite(val) ? val : 0);
      }
      else if (t.v === 'u-') { var a = st.pop(); st.push(-a); }
      else if (t.v === 'f') {
        var fn = FUNCS[t.name];
        if (!fn) { st.push(0); continue; }
        if (t.name === 'min' || t.name === 'max') {
          var b2 = st.pop(); var a2 = st.pop();
          st.push(fn(a2, b2));
        } else {
          var x = st.pop();
          st.push(fn(x));
        }
      }
      else {
        var r = st.pop(); var l = st.pop();
        if (t.v === '+') st.push(l + r);
        else if (t.v === '-') st.push(l - r);
        else if (t.v === '*') st.push(l * r);
        else if (t.v === '/') st.push(l / r);
        else if (t.v === '^') st.push(Math.pow(l, r));
      }
    }
    var res = st.pop();
    return typeof res === 'number' && isFinite(res) ? res : 0;
  }

  function val(expr, scope) {
    if (typeof expr === 'number') return expr;
    if (typeof expr === 'string') {
      var s = expr.trim();
      if (s === '') return 0;
      if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
      try {
        var rpn = toRPN(tokenize(s));
        return evalRPN(rpn, scope || {});
      } catch (e) { return 0; }
    }
    return 0;
  }

  /* ============ 渲染器 ============ */
  var DEFAULTS = {
    bg: '#15151f',
    grid: 'rgba(212,175,55,0.10)',
    axis: '#d4af37',
    axisText: '#9a916f',
    textColor: '#e8e2d0',
    defaultStroke: '#d4af37',
    accent: '#c0392b',
    secondary: '#5b8def'
  };
  var LIGHT_DEFAULTS = {
    bg: '#f4f1ea',
    grid: 'rgba(90,78,60,0.12)',
    axis: '#7a5c3c',
    axisText: '#6e6250',
    textColor: '#2a2a3e',
    defaultStroke: '#b8860b',
    accent: '#c0392b',
    secondary: '#3a6bc0'
  };

  function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }

  function render(spec, mountEl) {
    spec = spec || {};
    var isLight = false;
    try {
      isLight = !!(mountEl && mountEl.closest && (mountEl.closest('.jx-modal-light') || mountEl.closest('.jx-ai-dialog-shell')));
    } catch (e) { isLight = false; }
    var PAL = isLight ? LIGHT_DEFAULTS : DEFAULTS;
    var objects = Array.isArray(spec.objects) ? spec.objects : [];
    var controls = Array.isArray(spec.controls) ? spec.controls : [];
    var steps = Array.isArray(spec.steps) ? spec.steps : [];
    var xRange = Array.isArray(spec.xRange) && spec.xRange.length === 2 ? spec.xRange : [-8, 8];
    var yRange = Array.isArray(spec.yRange) && spec.yRange.length === 2 ? spec.yRange : [-5, 5];

    // 每个对象的绘制进度与揭示状态（用于「一笔一笔画线」）
    var progress = new Array(objects.length);
    var revealed = new Array(objects.length);
    var drawAnims = new Array(objects.length);
    for (var i0 = 0; i0 < objects.length; i0++) { progress[i0] = 0; revealed[i0] = false; drawAnims[i0] = null; }

    // 可变作用域：baseVars 存 slider 初始值，scope 为实际渲染用的变量（slider + 累积 steps.set）
    var scope = {};
    var baseVars = {};
    controls.forEach(function (c) {
      if (c && c.type === 'slider') {
        // id 是表达式里的变量名（推荐 ASCII），label 是展示给用户的名称（可含希腊字母/中文）
        var key = c.id || c.label;
        var v = parseFloat(c.value != null ? c.value : (c.min != null ? c.min : 0));
        scope[key] = v;
        baseVars[key] = v;
      }
    });

    mountEl.innerHTML =
      '<div class="gen-stage"><canvas class="gen-canvas"></canvas></div>' +
      '<div class="gen-controls"></div>' +
      '<div class="gen-steps"></div>';

    var canvas = mountEl.querySelector('.gen-canvas');
    var ctx = canvas.getContext('2d');
    var controlsEl = mountEl.querySelector('.gen-controls');
    var stepsEl = mountEl.querySelector('.gen-steps');
    var sliderEls = {};      // key -> { input, valEl }
    var manualMode = false;  // 用户拖动任一滑块后进入手动探索模式，忽略脚本 set

    var W = 0, H = 360, dpr = window.devicePixelRatio || 1;
    var padL = 42, padR = 18, padT = 18, padB = 30;
    var autoTimer = null;

    function resize() {
      var stage = mountEl.querySelector('.gen-stage');
      W = stage ? stage.clientWidth : (mountEl.clientWidth || 600);
      if (W < 200) W = 600;
      H = Math.max(260, Math.min(460, Math.round(W * 0.56)));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function sx(wx) { return padL + (wx - xRange[0]) / (xRange[1] - xRange[0]) * (W - padL - padR); }
    function sy(wy) { return padT + (yRange[1] - wy) / (yRange[1] - yRange[0]) * (H - padT - padB); }
    function wxOf(px) { return xRange[0] + (px - padL) / (W - padL - padR) * (xRange[1] - xRange[0]); }
    function wyOf(py) { return yRange[1] - (py - padT) / (H - padT - padB) * (yRange[1] - yRange[0]); }

    /* ---- 坐标辅助：把 pts(世界坐标) 转屏幕坐标 ---- */
    function toScreen(pts) {
      return pts.map(function (p) { return [sx(val(p[0], scope)), sy(val(p[1], scope))]; });
    }

    /* ---- 通用：沿边长逐段绘制（用于 rect / 多边形 / 三角形 的「一笔一笔画线」） ---- */
    function strokeProgress(screenPts, prog, closeLoop) {
      var pts = screenPts.slice();
      if (closeLoop) pts.push(screenPts[0]);
      var segs = [], total = 0;
      for (var i = 0; i < pts.length - 1; i++) {
        var d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        segs.push(d); total += d;
      }
      if (total === 0) return;
      var target = total * Math.max(0, Math.min(1, prog));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      var acc = 0;
      for (var j = 0; j < segs.length; j++) {
        if (acc + segs[j] <= target) {
          ctx.lineTo(pts[j + 1][0], pts[j + 1][1]);
          acc += segs[j];
        } else {
          var r = segs[j] === 0 ? 0 : (target - acc) / segs[j];
          ctx.lineTo(pts[j][0] + (pts[j + 1][0] - pts[j][0]) * r, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * r);
          break;
        }
      }
      ctx.stroke();
    }

    /* ---- 通用：圆弧采样（数学角度，屏幕自动翻转），支持 partial prog ---- */
    function arcScreen(cxW, cyW, rW, a0, a1, prog) {
      var n = 56, pts = [];
      for (var k = 0; k <= n; k++) {
        var t = k / n;
        var ang = a0 + (a1 - a0) * t * prog;
        var wx = cxW + rW * Math.cos(ang);
        var wy = cyW + rW * Math.sin(ang);
        pts.push([sx(wx), sy(wy)]);
      }
      return pts;
    }

    /* ===================== 各对象绘制（带 prog） ===================== */

    function drawObject(o, prog) {
      if (!o || typeof o.type !== 'string') return;
      var p = (prog == null) ? 1 : prog;
      var col = o.color || PAL.defaultStroke;
      switch (o.type) {
        case 'axes': drawAxes(o, p); break;
        case 'plot': drawPlot(o, col, p); break;
        case 'area': drawArea(o, col, p); break;
        case 'point': drawPoint(o, col, p); break;
        case 'line': drawLine(o, col, o.width || 2, p); break;
        case 'arrow': drawArrow(o, col, o.width || 2, p); break;
        case 'circle': drawCircle(o, col, o.fill === true, p); break;
        case 'rect': drawRect(o, col, o.fill === true, p); break;
        case 'triangle': drawTriangle(o, col, o.fill === true, p); break;
        case 'polygon': drawPolygon(o, col, o.fill === true, p); break;
        case 'sector': drawSector(o, col, o.fill !== false, p); break;
        case 'angle': drawAngle(o, col, p); break;
        case 'curve': drawCurve(o, col, o.width || 2, p); break;
        case 'vector': drawVector(o, col, o.width || 2, p); break;
        case 'grid': drawGrid(o, p); break;
        case 'text': drawText(o, o.color || PAL.textColor, p); break;
        default: break;
      }
    }

    function drawAxes(o, prog) {
      prog = (prog == null) ? 1 : prog;
      var showGrid = o.grid !== false;
      var showLabels = o.labels !== false;
      if (showGrid) {
        ctx.strokeStyle = PAL.grid;
        ctx.lineWidth = 1;
        var stepX = niceStep((xRange[1] - xRange[0]) / 10);
        var stepY = niceStep((yRange[1] - yRange[0]) / 10);
        ctx.beginPath();
        for (var gx = Math.ceil(xRange[0] / stepX) * stepX; gx <= xRange[1]; gx += stepX) {
          ctx.moveTo(sx(gx), padT); ctx.lineTo(sx(gx), H - padB);
        }
        for (var gy = Math.ceil(yRange[0] / stepY) * stepY; gy <= yRange[1]; gy += stepY) {
          ctx.moveTo(padL, sy(gy)); ctx.lineTo(W - padR, sy(gy));
        }
        ctx.stroke();
      }
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 1.5;
      // 轴逐步生长：x 轴从左向右，y 轴从下向上
      if (yRange[0] <= 0 && yRange[1] >= 0) {
        var y0 = sy(0);
        ctx.beginPath(); ctx.moveTo(padL, y0); ctx.lineTo(padL + (W - padL - padR) * prog, y0); ctx.stroke();
        // 箭头
        if (prog > 0.92) { ctx.beginPath(); ctx.moveTo(W - padR, y0); ctx.lineTo(W - padR - 8, y0 - 4); ctx.lineTo(W - padR - 8, y0 + 4); ctx.closePath(); ctx.fillStyle = PAL.axis; ctx.fill(); }
      }
      if (xRange[0] <= 0 && xRange[1] >= 0) {
        var x0 = sx(0);
        ctx.beginPath(); ctx.moveTo(x0, H - padB); ctx.lineTo(x0, (H - padB) - (H - padT - padB) * prog); ctx.stroke();
        if (prog > 0.92) { ctx.beginPath(); ctx.moveTo(x0, padT); ctx.lineTo(x0 - 4, padT + 8); ctx.lineTo(x0 + 4, padT + 8); ctx.closePath(); ctx.fillStyle = PAL.axis; ctx.fill(); }
      }
      if (showLabels && prog >= 1) {
        ctx.fillStyle = PAL.axisText;
        ctx.font = '11px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        var stepX2 = niceStep((xRange[1] - xRange[0]) / 10);
        for (var lx = Math.ceil(xRange[0] / stepX2) * stepX2; lx <= xRange[1]; lx += stepX2) {
          if (Math.abs(lx) < 1e-9) continue;
          ctx.fillText(fmt(lx), sx(lx), sy(0) + 4);
        }
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        var stepY2 = niceStep((yRange[1] - yRange[0]) / 10);
        for (var ly = Math.ceil(yRange[0] / stepY2) * stepY2; ly <= yRange[1]; ly += stepY2) {
          if (Math.abs(ly) < 1e-9) continue;
          ctx.fillText(fmt(ly), sx(0) - 5, sy(ly));
        }
      }
    }

    function drawPlot(o, col, prog) {
      var expr = o.expr || '0';
      var w = o.width || 3;
      ctx.save();
      if (prog < 1) {
        var x0 = sx(xRange[0]);
        var x1 = sx(xRange[0] + (xRange[1] - xRange[0]) * prog);
        ctx.beginPath(); ctx.rect(x0 - 1, padT - 1, (x1 - x0) + 2, (H - padT - padB) + 2); ctx.clip();
      }
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round';
      ctx.beginPath();
      var N = 240, started = false;
      for (var i = 0; i <= N; i++) {
        var wx = xRange[0] + (xRange[1] - xRange[0]) * i / N;
        var wy = val(expr, scope);
        if (!isFinite(wy) || wy < yRange[0] - 2 || wy > yRange[1] + 2) { started = false; continue; }
        var px = sx(wx), py = sy(wy);
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawArea(o, col, prog) {
      var expr = o.expr || '0';
      var baseY = (o.base != null) ? val(o.base, scope) : 0;
      ctx.save();
      if (prog < 1) {
        var x0 = sx(xRange[0]);
        var x1 = sx(xRange[0] + (xRange[1] - xRange[0]) * prog);
        ctx.beginPath(); ctx.rect(x0 - 1, padT - 1, (x1 - x0) + 2, (H - padT - padB) + 2); ctx.clip();
      }
      var N = 240, lastX = null;
      ctx.fillStyle = hexA(col, 0.20);
      ctx.beginPath();
      for (var i = 0; i <= N; i++) {
        var wx = xRange[0] + (xRange[1] - xRange[0]) * i / N;
        var wy = val(expr, scope);
        if (!isFinite(wy) || wy < yRange[0] - 4 || wy > yRange[1] + 4) { lastX = null; continue; }
        var px = sx(wx), py = sy(wy);
        if (lastX === null) { ctx.moveTo(sx(xRange[0]), sy(baseY)); ctx.lineTo(px, py); }
        else ctx.lineTo(px, py);
        lastX = px;
      }
      if (lastX !== null) { ctx.lineTo(lastX, sy(baseY)); ctx.lineTo(sx(xRange[0]), sy(baseY)); }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    function drawPoint(o, col, prog) {
      var px = sx(val(o.x, scope)), py = sy(val(o.y, scope));
      var r = (o.r || 5) * Math.max(0.05, prog);
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, prog);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      if (o.label && prog > 0.85) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = PAL.textColor;
        ctx.font = '13px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(o.label, px + r + 3, py - 2);
      }
      ctx.restore();
    }

    function drawLine(o, col, w, prog) {
      var x1 = sx(val(o.x1, scope)), y1 = sy(val(o.y1, scope));
      var x2 = sx(val(o.x2, scope)), y2 = sy(val(o.y2, scope));
      var ex = x1 + (x2 - x1) * prog, ey = y1 + (y2 - y1) * prog;
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
    }

    function drawArrow(o, col, w, prog) {
      var x1 = sx(val(o.x1, scope)), y1 = sy(val(o.y1, scope));
      var x2 = sx(val(o.x2, scope)), y2 = sy(val(o.y2, scope));
      var ex = x1 + (x2 - x1) * prog, ey = y1 + (y2 - y1) * prog;
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
      if (prog > 0.96) {
        var ang = Math.atan2(y2 - y1, x2 - x1);
        var ah = 9;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      }
    }

    function drawCircle(o, col, fill, prog) {
      var cx = sx(val(o.cx, scope)), cy = sy(val(o.cy, scope));
      var rw = (val(o.r, scope)) / (xRange[1] - xRange[0]) * (W - padL - padR);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (fill) {
        ctx.fillStyle = hexA(col, 0.18 * prog);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        var pts = arcScreen(val(o.cx, scope), val(o.cy, scope), val(o.r, scope), 0, Math.PI * 2, prog);
        for (var k = 0; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.closePath(); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, cy, Math.abs(rw), 0, Math.PI * 2 * prog); ctx.stroke();
    }

    function drawRect(o, col, fill, prog) {
      var x = val(o.x, scope), y = val(o.y, scope), w = val(o.w, scope), h = val(o.h, scope);
      var px = sx(x), py = sy(y + h);
      var pw = (w) / (xRange[1] - xRange[0]) * (W - padL - padR);
      var ph = (h) / (yRange[1] - yRange[0]) * (H - padT - padB);
      var corners = [[px, py], [px + pw, py], [px + pw, py + ph], [px, py + ph]];
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (fill && prog >= 1) { ctx.fillStyle = hexA(col, 0.18); ctx.fillRect(px, py, pw, ph); }
      strokeProgress(corners, prog, true);
    }

    function drawTriangle(o, col, fill, prog) {
      if (!Array.isArray(o.points) || o.points.length < 3) return;
      var sp = toScreen(o.points);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (fill && prog >= 1) {
        ctx.fillStyle = hexA(col, 0.18);
        ctx.beginPath();
        for (var i = 0; i < sp.length; i++) { if (i === 0) ctx.moveTo(sp[i][0], sp[i][1]); else ctx.lineTo(sp[i][0], sp[i][1]); }
        ctx.closePath(); ctx.fill();
      }
      strokeProgress(sp, prog, true);
      if (Array.isArray(o.labels) && prog > 0.9) {
        ctx.fillStyle = PAL.textColor;
        ctx.font = '13px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var j = 0; j < o.points.length && j < o.labels.length; j++) {
          if (!o.labels[j]) continue;
          ctx.fillText(o.labels[j], sp[j][0], sp[j][1] - 10);
        }
      }
    }

    function drawPolygon(o, col, fill, prog) {
      if (!Array.isArray(o.points) || o.points.length < 3) return;
      var sp = toScreen(o.points);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (fill && prog >= 1) {
        ctx.fillStyle = hexA(col, 0.18);
        ctx.beginPath();
        for (var i = 0; i < sp.length; i++) { if (i === 0) ctx.moveTo(sp[i][0], sp[i][1]); else ctx.lineTo(sp[i][0], sp[i][1]); }
        ctx.closePath(); ctx.fill();
      }
      strokeProgress(sp, prog, true);
      if (Array.isArray(o.labels) && prog > 0.9) {
        ctx.fillStyle = PAL.textColor;
        ctx.font = '13px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var j = 0; j < o.points.length && j < o.labels.length; j++) {
          if (!o.labels[j]) continue;
          ctx.fillText(o.labels[j], sp[j][0], sp[j][1] - 10);
        }
      }
    }

    function drawSector(o, col, fill, prog) {
      var cx = val(o.cx, scope), cy = val(o.cy, scope);
      var r = val(o.r, scope);
      var a0 = (o.start != null ? o.start : 0) * Math.PI / 180;
      var a1 = (o.end != null ? o.end : 90) * Math.PI / 180;
      var pts = arcScreen(cx, cy, r, a0, a1, prog);
      var cxp = sx(cx), cyp = sy(cy);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (fill) {
        ctx.fillStyle = hexA(col, 0.20);
        ctx.beginPath();
        ctx.moveTo(cxp, cyp);
        for (var k = 0; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.closePath(); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(cxp, cyp);
      for (var m = 0; m < pts.length; m++) ctx.lineTo(pts[m][0], pts[m][1]);
      ctx.stroke();
    }

    function drawAngle(o, col, prog) {
      var v = [val(o.vx, scope), val(o.vy, scope)];
      var pa = [val(o.ax, scope), val(o.ay, scope)];
      var pb = [val(o.bx, scope), val(o.by, scope)];
      var vs = [sx(v[0]), sy(v[1])];
      var as_ = [sx(pa[0]), sy(pa[1])];
      var bs = [sx(pb[0]), sy(pb[1])];
      // 两边（随 prog 一起出现，prog>0.15 即显示）
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (prog > 0.12) {
        ctx.beginPath(); ctx.moveTo(vs[0], vs[1]); ctx.lineTo(as_[0], as_[1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vs[0], vs[1]); ctx.lineTo(bs[0], bs[1]); ctx.stroke();
      }
      // 角弧：从第一条边扫到当前 prog
      var a0 = Math.atan2(pa[1] - v[1], pa[0] - v[0]);
      var a1 = Math.atan2(pb[1] - v[1], pb[0] - v[0]);
      // 归一化到 [a0, a0+2π)
      var da = a1 - a0;
      while (da < 0) da += Math.PI * 2;
      while (da > Math.PI * 2) da -= Math.PI * 2;
      var rr = 26;
      var arcPts = [];
      var n = 40;
      for (var t = 0; t <= n; t++) {
        var ang = a0 + da * (t / n) * prog;
        arcPts.push([vs[0] + rr * Math.cos(ang), vs[1] - rr * Math.sin(ang)]);
      }
      ctx.strokeStyle = PAL.accent; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var q = 0; q < arcPts.length; q++) { if (q === 0) ctx.moveTo(arcPts[q][0], arcPts[q][1]); else ctx.lineTo(arcPts[q][0], arcPts[q][1]); }
      ctx.stroke();
      if (o.label && prog > 0.9) {
        var mid = a0 + da * 0.5;
        ctx.fillStyle = PAL.accent;
        ctx.font = '13px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.label, vs[0] + (rr + 12) * Math.cos(mid), vs[1] - (rr + 12) * Math.sin(mid));
      }
    }

    function drawCurve(o, col, w, prog) {
      var pts, sp;
      if (o.cubic) {
        // [p0, c1, c2, p1]
        var P = o.points;
        if (!Array.isArray(P) || P.length < 4) return;
        var screen = toScreen(P);
        pts = [];
        var N = 80;
        for (var i = 0; i <= N * prog; i++) {
          var t = i / N;
          var mt = 1 - t;
          var x = mt * mt * mt * screen[0][0] + 3 * mt * mt * t * screen[1][0] + 3 * mt * t * t * screen[2][0] + t * t * t * screen[3][0];
          var y = mt * mt * mt * screen[0][1] + 3 * mt * mt * t * screen[1][1] + 3 * mt * t * t * screen[2][1] + t * t * t * screen[3][1];
          pts.push([x, y]);
        }
        sp = pts;
      } else {
        var Q = o.points;
        if (!Array.isArray(Q) || Q.length < 3) return;
        var ss = toScreen(Q);
        pts = [];
        var N2 = 80;
        for (var j = 0; j <= N2 * prog; j++) {
          var t2 = j / N2;
          var mt2 = 1 - t2;
          var x2 = mt2 * mt2 * ss[0][0] + 2 * mt2 * t2 * ss[1][0] + t2 * t2 * ss[2][0];
          var y2 = mt2 * mt2 * ss[0][1] + 2 * mt2 * t2 * ss[1][1] + t2 * t2 * ss[2][1];
          pts.push([x2, y2]);
        }
        sp = pts;
      }
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var k = 0; k < sp.length; k++) { if (k === 0) ctx.moveTo(sp[k][0], sp[k][1]); else ctx.lineTo(sp[k][0], sp[k][1]); }
      ctx.stroke();
    }

    function drawVector(o, col, w, prog) {
      var x1 = val(o.x1, scope), y1 = val(o.y1, scope);
      var x2 = val(o.x2, scope), y2 = val(o.y2, scope);
      drawArrow({ x1: sx(x1), y1: sy(y1), x2: sx(x1) + (sx(x2) - sx(x1)) * prog, y2: sy(y1) + (sy(y2) - sy(y1)) * prog }, col, w, Math.min(1, prog * 1.05));
      if (o.label && prog > 0.9) {
        var mx = sx(x1) + (sx(x2) - sx(x1)) * 0.55, my = sy(y1) + (sy(y2) - sy(y1)) * 0.55;
        ctx.fillStyle = col;
        ctx.font = '13px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.label, mx, my - 8);
      }
    }

    function drawGrid(o, prog) {
      var showLabels = o.labels === true;
      ctx.strokeStyle = PAL.grid;
      ctx.lineWidth = 1;
      var stepX = niceStep((xRange[1] - xRange[0]) / (o.div || 12));
      var stepY = niceStep((yRange[1] - yRange[0]) / (o.div || 10));
      var x0 = sx(xRange[0]), x1 = sx(xRange[0] + (xRange[1] - xRange[0]) * prog);
      ctx.beginPath();
      for (var gx = Math.ceil(xRange[0] / stepX) * stepX; gx <= xRange[1]; gx += stepX) {
        var px = sx(gx); if (px > x1) break;
        ctx.moveTo(px, padT); ctx.lineTo(px, H - padB);
      }
      for (var gy = Math.ceil(yRange[0] / stepY) * stepY; gy <= yRange[1]; gy += stepY) {
        ctx.moveTo(padL, sy(gy)); ctx.lineTo(W - padR, sy(gy));
      }
      ctx.stroke();
    }

    function drawText(o, col, prog) {
      var px = sx(val(o.x, scope)), py = sy(val(o.y, scope));
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, prog);
      ctx.fillStyle = col;
      ctx.font = (o.size || 16) + 'px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(o.content || '', px, py);
      ctx.restore();
    }

    /* ===================== 揭示与绘制进度 ===================== */

    function animateDraw(i, dur) {
      if (drawAnims[i]) cancelAnimationFrame(drawAnims[i]);
      progress[i] = 0;
      var t0 = performance.now();
      var d = dur || 620;
      function tick(now) {
        var p = Math.min(1, (now - t0) / d);
        var e = easeOutCubic(p);
        progress[i] = e;
        draw();
        if (p < 1) drawAnims[i] = requestAnimationFrame(tick);
        else { progress[i] = 1; drawAnims[i] = null; }
      }
      drawAnims[i] = requestAnimationFrame(tick);
    }

    // 根据当前 stepIndex，揭示该出现的对象并触发「一笔一笔画线」；隐藏已不应出现的对象
    function syncReveal() {
      for (var i = 0; i < objects.length; i++) {
        var o = objects[i];
        if (!o) continue;
        var ap = (o.appearAt != null) ? o.appearAt : 0;
        if (ap <= stepIndex && !revealed[i]) {
          revealed[i] = true;
          if (o.type === 'text' || o.type === 'point') animateDraw(i, 380);
          else animateDraw(i, 640);
        } else if (ap > stepIndex && revealed[i]) {
          revealed[i] = false;
          progress[i] = 0;
          if (drawAnims[i]) { cancelAnimationFrame(drawAnims[i]); drawAnims[i] = null; }
        }
      }
    }

    // 根据 baseVars 与步骤 set 重算当前作用域：
    // - 手动模式下忽略脚本 set，完全由滑块控制；
    // - 自动模式下，每一步的 set 会覆盖（绝对值）baseVars，即“本步把变量设为某值”。
    function recompute() {
      scope = {};
      for (var k in baseVars) if (baseVars.hasOwnProperty(k)) scope[k] = baseVars[k];
      if (!manualMode) {
        for (var i = 0; i <= stepIndex && i < steps.length; i++) {
          var st = steps[i];
          if (st && st.set) { for (var k2 in st.set) { if (st.set.hasOwnProperty(k2)) scope[k2] = parseFloat(st.set[k2]); } }
        }
      }
    }

    function draw() {
      recompute();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = PAL.bg;
      ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < objects.length; i++) {
        var o = objects[i];
        if (o && o.appearAt != null && o.appearAt > stepIndex) continue;
        var p = revealed[i] ? (progress[i] != null ? progress[i] : 1) : 0;
        drawObject(o, p);
      }
    }

    /* ---- 语音讲解（Web Speech API） ---- */
    var synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
    var autoSpeak = !!synth;
    function speak(text) {
      if (!synth || !text) return;
      try {
        synth.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN'; u.rate = 0.96; u.pitch = 1; u.volume = 1;
        synth.speak(u);
      } catch (e) {}
    }
    function stopSpeak() { if (synth) { try { synth.cancel(); } catch (e) {} } }

    /* ---- 控件：滑块 ---- */
    controls.forEach(function (c) {
      if (!c || c.type !== 'slider') return;
      var key = c.id || c.label; // 变量名用 id，展示用 label
      var wrap = document.createElement('div');
      wrap.className = 'gen-slider';
      var label = document.createElement('label');
      label.textContent = (c.label || c.id) + ' = ';
      var input = document.createElement('input');
      input.type = 'range';
      input.min = c.min != null ? c.min : 0;
      input.max = c.max != null ? c.max : 10;
      input.step = c.step != null ? c.step : 0.1;
      input.value = scope[key];
      var valEl = document.createElement('span');
      valEl.className = 'gen-slider-val';
      valEl.textContent = fmt(scope[key]);
      input.addEventListener('input', function () {
        stopAuto();
        manualMode = true;
        var v = parseFloat(input.value);
        baseVars[key] = v;
        scope[key] = v;
        valEl.textContent = fmt(v);
        draw();
      });
      sliderEls[key] = { input: input, valEl: valEl };
      label.appendChild(valEl);
      wrap.appendChild(label);
      wrap.appendChild(input);
      controlsEl.appendChild(wrap);
    });

    /* ---- 步骤步进 + 自动播放 ---- */
    var stepIndex = 0;
    var rafId = null;

    function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

    function syncSlidersToSet(set) {
      // 将本步 set 同步到 baseVars 与滑块 UI（手动模式下不执行）
      if (manualMode) return;
      for (var k in set) {
        if (!set.hasOwnProperty(k)) continue;
        var v = parseFloat(set[k]);
        baseVars[k] = v;
        var s = sliderEls[k];
        if (s) { s.input.value = v; s.valEl.textContent = fmt(v); }
      }
    }

    function applyStep(idx, animate) {
      if (idx < 0 || idx >= steps.length) return;
      stepIndex = idx;
      var st = steps[idx];
      var set = st.set || {};
      if (animate) {
        var from = {}, to = {}, keys = [];
        for (var k in set) {
          if (set.hasOwnProperty(k)) {
            from[k] = (scope[k] != null) ? scope[k] : (baseVars[k] != null ? baseVars[k] : 0);
            to[k] = parseFloat(set[k]);
            keys.push(k);
          }
        }
        var t0 = performance.now(), dur = 480;
        if (rafId) cancelAnimationFrame(rafId);
        function tween(now) {
          var p = Math.min(1, (now - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          keys.forEach(function (kk) { scope[kk] = from[kk] + (to[kk] - from[kk]) * e; });
          draw();
          if (p < 1) rafId = requestAnimationFrame(tween);
          else { syncSlidersToSet(set); }
        }
        rafId = requestAnimationFrame(tween);
      } else {
        syncSlidersToSet(set);
        recompute();
        draw();
      }
      // 揭示本步新出现的对象（触发逐笔绘制）
      syncReveal();
      // 更新说明文字
      var desc = stepsEl.querySelector('.gen-step-desc');
      if (desc) desc.textContent = (idx + 1) + '/' + steps.length + ' · ' + (st.text || '');
      var prev = stepsEl.querySelector('.gen-step-prev');
      var next = stepsEl.querySelector('.gen-step-next');
      if (prev) prev.disabled = (idx === 0);
      if (next) next.disabled = (idx === steps.length - 1);
      // 语音讲解
      if (autoSpeak) speak(st.voice || st.text || '');
    }

    if (steps.length) {
      var bar = document.createElement('div');
      bar.className = 'gen-step-bar';
      bar.innerHTML =
        '<button class="gen-step-prev" disabled>上一步</button>' +
        '<span class="gen-step-desc"></span>' +
        '<button class="gen-step-next">下一步</button>' +
        '<button class="gen-step-replay" title="重新播放">↺ 重播</button>' +
        '<button class="gen-step-voice' + (autoSpeak ? '' : ' off') + '" title="朗读讲解（语音）">' + (autoSpeak ? '🔊' : '🔇') + '</button>';
      stepsEl.appendChild(bar);
      var prevBtn = bar.querySelector('.gen-step-prev');
      var nextBtn = bar.querySelector('.gen-step-next');
      var replayBtn = bar.querySelector('.gen-step-replay');
      var voiceBtn = bar.querySelector('.gen-step-voice');
      prevBtn.addEventListener('click', function () { stopAuto(); manualMode = false; if (stepIndex > 0) { stepIndex--; applyStep(stepIndex, false); } });
      nextBtn.addEventListener('click', function () {
        stopAuto(); manualMode = false;
        if (stepIndex < steps.length - 1) { stepIndex++; applyStep(stepIndex, steps[stepIndex].animate === true); }
      });
      replayBtn.addEventListener('click', function () { stopAuto(); manualMode = false; stepIndex = 0; applyStep(0, false); startAuto(); });
      voiceBtn.addEventListener('click', function () {
        autoSpeak = !autoSpeak;
        voiceBtn.classList.toggle('off', !autoSpeak);
        voiceBtn.textContent = autoSpeak ? '🔊' : '🔇';
        if (autoSpeak) speak((steps[stepIndex] && (steps[stepIndex].voice || steps[stepIndex].text)) || '');
        else stopSpeak();
      });

      function startAuto() {
        stopAuto();
        autoTimer = setInterval(function () {
          if (stepIndex < steps.length - 1) { stepIndex++; applyStep(stepIndex, steps[stepIndex].animate === true); }
          else { stopAuto(); }
        }, 1600);
      }
      // 初始呈现第 0 步并触发首屏「逐笔绘制」
      applyStep(0, false);
      startAuto();
    } else {
      // 无步骤：直接揭示并逐笔绘制初始对象
      syncReveal();
      draw();
    }

    /* ---- 自适应 ---- */
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(mountEl); else window.addEventListener('resize', resize);

    resize();

    return {
      cleanup: function () {
        if (rafId) cancelAnimationFrame(rafId);
        for (var i = 0; i < drawAnims.length; i++) if (drawAnims[i]) cancelAnimationFrame(drawAnims[i]);
        stopSpeak();
        stopAuto();
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      }
    };
  }

  /* ============ 小工具 ============ */
  function niceStep(raw) {
    if (raw <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / p;
    var s = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
    return s * p;
  }
  function fmt(v) {
    if (typeof v !== 'number' || !isFinite(v)) return '0';
    if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.001 && v !== 0)) return v.toExponential(2);
    return (Math.round(v * 100) / 100).toString();
  }
  function hexA(hex, a) {
    if (typeof hex !== 'string' || hex[0] !== '#') return 'rgba(212,175,55,' + a + ')';
    var h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  window.AnimEngine = { render: render };
})();
