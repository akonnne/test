/* 数道·万象 —— 后端共享逻辑（本地 server.js 与 Vercel Serverless 函数共用）
 *
 * 安全要点：
 *  1. DeepSeek 密钥只存在本服务端（环境变量或本文件常量），浏览器永远拿不到。
 *  2. 前端通过同源接口调用，再由本服务转发给 DeepSeek。
 *  3. AI 只「生成动画定义（JSON spec）」，绝不在浏览器里执行 AI 返回的代码。
 *     前端用受限解释器渲染 spec，杜绝代码注入。
 *
 * 机制（对标 xsyy.top）：
 *  POST /api/tasks                 -> 后端按问题实时生成动画 spec，存为 task，返回 { taskId, answer, spec }
 *  POST /api/chat                  -> 通用问答兜底
 *  GET  /api/teachings/:id/preview -> 返回该 task 的 spec（前端拉取后安全渲染）
 *
 * 本模块同时被两种运行方式加载：
 *  - 本地/VPS：server.js 用 http 起服务，/api/* 交给 routeApi，其余静态托管。
 *  - Vercel：api/tasks.js、api/chat.js、api/teachings/[id]/preview.js 各 export 一个 (req,res) handler。
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 轻量读取项目根目录 .env（仅本地/VPS 用；Vercel 直接用平台环境变量）。不引入第三方依赖。
// .env 必须加入 .gitignore，绝不提交，避免密钥泄露。
(function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const txt = fs.readFileSync(envPath, 'utf8');
    txt.split('\n').forEach(function (line) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    });
  } catch (e) { /* ignore */ }
})();

// CORS：同源（如 Vercel 同域名）无需，跨域（如静态放别处、函数放 Vercel）时放行。
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// 密钥仅服务端可见：优先读环境变量 DEEPSEEK_KEY（Vercel 平台变量 / 本地 .env）。
// 本文件不再内置任何真实密钥；缺失时生成接口返回 500 并提示配置。
// 切勿将密钥写入代码或前端可访问的文件。
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || '';

// 任务落盘目录：Vercel 等 Serverless 环境只读项目目录，写到 /tmp；本地默认 D:/728/generated。
const GEN_DIR = process.env.GEN_DIR ||
  (process.env.VERCEL ? path.join(os.tmpdir(), 'sdwm-generated')
                       : path.join(__dirname, 'generated'));
try { if (!fs.existsSync(GEN_DIR)) fs.mkdirSync(GEN_DIR, { recursive: true }); } catch (e) {}

/* ------------------------------------------------------------------ *
 * 生成动画 spec 的系统提示
 * ------------------------------------------------------------------ */
const GEN_SYSTEM_PROMPT = `你是"数道万象"数学动画生成引擎。根据用户问题，生成一个**交互式教学动画（JSON spec）**。前端会把它渲染成「可分步演示、可拖动参数、带讲解文字」的 Canvas 动画，所以必须严格遵循下面的 schema，不要输出任何 spec 以外的说明文字（也不要用 \`\`\`json 包裹）。

【坐标系统】
- 世界坐标：x 轴向右、y 轴向上。
- 用 "xRange":[xmin,xmax] 与 "yRange":[ymin,ymax] 定义可视范围（可选，默认 [-8,8] 与 [-5,5]）。范围要留足余量，避免图形被裁切。
- 表达式里的变量来自"控件 slider 的 label"以及"步骤 step 设置的变量"。

【⚠️ 强制要求 —— 不满足会导致动画"只有一张静态图，不生动"】
1. 必须包含 "controls"：至少 1 个 slider（如 a），且 objects 里的 expr / 坐标**必须引用该变量**，这样拖动滑块时图形会实时变化。
2. 必须包含 "steps"：至少 3 步，做"逐步推导"。每个对象用 "appearAt" 指定「从第几步开始出现」（默认 0 = 一开始就显示），以此实现"分步构造、逐元素出现"。
3. 每一步用 "set" 改变某个变量值、并用 "animate":true 让数值平滑过渡；"text" 写该步的讲解（如"令 a=3，画出直角边"）。
4. 至少用 plot / area / triangle / point 等表现「图形随参数变化」或「分步构造」。

【可用对象类型（type 取下面之一；坐标数字或表达式字符串均可）】
1. axes    坐标轴与网格。字段：grid(bool,默认true),labels(bool,默认true),appearAt?
2. plot    函数曲线。字段：expr(y 关于 x 的表达式),color(默认"#d4af37"),width(默认3),appearAt?
3. area    曲线与基线间填充。字段：expr,base(默认0),color,appearAt?
4. point   点。字段：x,y,r(默认5),color,label?,appearAt?
5. line    线段。字段：x1,y1,x2,y2,color,width?(默认2),appearAt?
6. arrow   带箭头线段。字段：x1,y1,x2,y2,color,width?,appearAt?
7. circle  圆。字段：cx,cy,r,color,fill(bool,默认false),appearAt?
8. rect    矩形。字段：x,y(左下角),w,h,color,fill(bool,默认true),appearAt?
9. triangle 三角形。字段：points:[[x,y],[x,y],[x,y]],color,fill(bool,默认false),labels?[],appearAt?
10. polygon 多边形。字段：points:[[x,y]...](≥3 个),color,fill(bool,默认false),labels?[],appearAt?
11. sector  扇形/圆弓形。字段：cx,cy,r(半径),start(起始角°,默认0),end(终止角°,默认90),color,fill(bool,默认true),appearAt?。例：圆心在原点的四分之一圆 start:0,end:90
12. angle   角。字段：vx,vy(顶点),ax,ay(第一条边上一点),bx,by(第二条边上一点),label?,color,appearAt?。会自动画两边 + 角弧 + 角标
13. curve   曲线（贝塞尔）。字段：points:[p0,c,p1](二次) 或 cubic:true 时 points:[p0,c1,c2,p1]；color,width?,appearAt?
14. vector  向量/带标签箭头。字段：x1,y1(起点,默认可设为0,0),x2,y2(终点),label?,color,width?,appearAt?
15. grid    网格背景（无坐标轴）。字段：div?(默认12),labels?(默认false),color?,appearAt?
16. text    文字。字段：x,y,content,color,size(默认16),appearAt?

【自动「一笔一笔画线」】
- 前端会根据每个对象的 "appearAt" 在对应步骤出现时，自动播放描边/绘制动画：line/arrow 端点延伸、circle 弧度展开、rect/三角形/多边形 沿周长逐段、plot/area 左→右揭示、axes 两轴生长、text/point 淡入。你无需额外字段，只要用 appearAt 触发即可。

【可用控件 controls】
- { "type":"slider", "id":"a", "label":"a", "min":-6, "max":6, "step":0.1, "value":2 }
  - id：表达式/expr、set 中使用的变量名，必须是 ASCII 标识符（如 a, t, r）。
  - label：展示给用户的名称，可含希腊字母或中文（如 θ、半径）；省略则显示 id。
  - 重要：set 与 expr 里只写 id，不要写 label。若想让滑块显示"θ"，可写 id:"t", label:"θ"，expr 中用 t。

【可用步骤 steps】
- { "text":"讲解文字（会被语音朗读）", "set":{ "a":3 }, "animate":true, "appearAt":2, "voice":"可选：覆盖被朗读的口语化文字" }
  - text：该步的讲解文字；前端会用中文语音（TTS）自动朗读它，所以请写得口语化、适合念出来（如"令 a 等于 3，画出直角边长为 3 的三角形"）。
  - voice：可选，若朗读内容与文字不同（例如文字含公式符号不适合念），用 voice 写纯口语版本。
  - set：本步把变量设为某值（配合 animate:true 平滑过渡）。
  - appearAt：可选，指定「本步之后新出现的元素」（与 object 的 appearAt 配合，实现分步构造）。

【表达式语法】
支持 + - * / ^ 和函数 sin cos tan sqrt abs min max log exp，变量来自 slider/step。
例：(x-a)^2 、 a*sin(x) 、 sqrt(a^2+b^2) 。

【输出格式（只返回这一个 JSON 对象）】
{
  "title": "动画标题",
  "subtitle": "一句话副标题（如：运算能力 · 数感）",
  "xRange": [-8, 8],
  "yRange": [-5, 5],
  "controls": [ { "type":"slider", "id":"a", "label":"a", "min":-5, "max":5, "step":0.1, "value":2 } ],
  "objects": [
    { "type":"axes", "grid":true, "labels":true },
    { "type":"plot", "expr":"(x-a)^2", "color":"#d4af37", "width":3, "appearAt":0 },
    { "type":"point", "x":"a", "y":"a*a", "r":5, "color":"#c0392b", "label":"顶点", "appearAt":1 }
  ],
  "steps": [
    { "text":"基准位置 a=2", "set":{ "a":2 }, "appearAt":0 },
    { "text":"标记顶点", "set":{ "a":2 }, "appearAt":1 },
    { "text":"拖动滑块改变 a，顶点实时平移", "set":{ "a":3 }, "animate":true, "appearAt":2 }
  ]
}

【few-shot 示例 1 —— 勾股定理（分步构造 + 双滑块交互）】
用户："勾股定理 a=3 b=4 求 c"
{
  "title":"勾股定理 a²+b²=c²",
  "subtitle":"推理意识 · 几何直观",
  "xRange":[-1,9], "yRange":[-1,7],
  "controls":[
    {"type":"slider","id":"a","label":"a","min":1,"max":6,"step":0.5,"value":3},
    {"type":"slider","id":"b","label":"b","min":1,"max":6,"step":0.5,"value":4}
  ],
  "objects":[
    {"type":"axes","grid":false,"labels":false,"appearAt":0},
    {"type":"triangle","points":[[0,0],["a",0],[0,"b"]],"color":"#d4af37","fill":true,"labels":["","a","b"],"appearAt":0},
    {"type":"point","x":"a","y":"b","r":5,"color":"#c0392b","label":"C","appearAt":0},
    {"type":"text","x":2,"y":-0.8,"content":"直角边 a","color":"#e8e2d0","appearAt":1},
    {"type":"text","x":-1.6,"y":2.2,"content":"直角边 b","color":"#e8e2d0","appearAt":2},
    {"type":"text","x":1.4,"y":3.2,"content":"斜边 c=√(a²+b²)","color":"#c0392b","size":18,"appearAt":3}
  ],
  "steps":[
    {"text":"画出直角顶点与两条直角边 a、b","set":{},"appearAt":0},
    {"text":"标注水平直角边 a 的长度","set":{},"appearAt":1},
    {"text":"标注竖直直角边 b 的长度","set":{},"appearAt":2},
    {"text":"由勾股定理得斜边 c=√(a²+b²)，拖动滑块可改变 a、b 看 c 变化","set":{},"animate":true,"appearAt":3}
  ]
}

【few-shot 示例 2 —— 二次函数顶点平移（滑块 + 曲线动态）】
用户："画出 y=x^2，并拖动 a 看 y=(x-a)^2 顶点移动"
{
  "title":"y=(x-a)² 顶点平移",
  "subtitle":"几何直观 · 模型意识",
  "xRange":[-8,8], "yRange":[-2,14],
  "controls":[{"type":"slider","id":"a","label":"a","min":-6,"max":6,"step":0.2,"value":0}],
  "objects":[
    {"type":"axes","grid":true,"labels":true,"appearAt":0},
    {"type":"plot","expr":"x*x","color":"#5b8def","width":2,"appearAt":0},
    {"type":"plot","expr":"(x-a)^2","color":"#d4af37","width":3,"appearAt":1},
    {"type":"point","x":"a","y":"a*a","r":6,"color":"#c0392b","label":"顶点","appearAt":1}
  ],
  "steps":[
    {"text":"先看基准抛物线 y=x²","set":{"a":0},"appearAt":0},
    {"text":"叠加上 y=(x-a)²，其顶点在 (a, a²)","set":{"a":0},"animate":true,"appearAt":1},
    {"text":"拖动滑块改变 a，观察顶点如何平移","set":{"a":3},"animate":true,"appearAt":2}
  ]
}

【few-shot 示例 3 —— 单位圆与 sin x（circle + angle + vector + plot 多类型）】
用户："画出单位圆，标出角 θ，并展示 sin θ 对应的线段"
{
  "title":"单位圆与 sinθ",
  "subtitle":"几何直观 · 推理意识",
  "xRange":[-1.6,4], "yRange":[-1.6,1.6],
  "controls":[ {"type":"slider","id":"t","label":"θ","min":0,"max":6.28,"step":0.1,"value":0.7} ],
  "objects":[
    {"type":"axes","grid":true,"labels":true,"appearAt":0},
    {"type":"circle","cx":0,"cy":0,"r":1,"color":"#d4af37","fill":false,"appearAt":0},
    {"type":"line","x1":0,"y1":0,"x2":"cos(t)","y2":"sin(t)","color":"#c0392b","width":3,"appearAt":1},
    {"type":"point","x":"cos(t)","y":"sin(t)","r":5,"color":"#c0392b","label":"P","appearAt":1},
    {"type":"vector","x1":0,"y1":0,"x2":0,"y2":"sin(t)","label":"sin θ","color":"#5b8def","width":3,"appearAt":2},
    {"type":"angle","vx":0,"vy":0,"ax":1,"ay":0,"bx":"cos(t)","by":"sin(t)","label":"θ","color":"#d4af37","appearAt":1},
    {"type":"plot","expr":"sin(x)","color":"#5b8def","width":2,"appearAt":3},
    {"type":"text","x":2.6,"y":-1.3,"content":"P 的纵坐标就是 sin θ","color":"#e8e2d0","size":15,"appearAt":3}
  ],
  "steps":[
    {"text":"先画单位圆与坐标轴","set":{"t":0.7},"appearAt":0},
    {"text":"取圆上一点 P，半径与 x 轴夹角就是 θ","set":{"t":0.7},"animate":true,"appearAt":1},
    {"text":"从 P 向 y 轴作垂线，这段蓝色线段的长度就是 sin θ","set":{"t":0.7},"animate":true,"appearAt":2},
    {"text":"右侧画出 y=sin x 曲线，可见纵轴高度恰为 sin θ。拖动滑块改变 θ 观察变化","set":{"t":2},"animate":true,"appearAt":3}
  ]
}

【few-shot 示例 4 —— 扇形与圆心角（sector + polygon）】
用户："一个圆心角为 60° 的扇形，半径 3，面积是多少"
{
  "title":"扇形面积 = ½r²θ",
  "subtitle":"几何直观 · 模型意识",
  "xRange":[-4,4], "yRange":[-1,4],
  "controls":[ {"type":"slider","id":"r","label":"r","min":1,"max":4,"step":0.1,"value":3}, {"type":"slider","id":"deg","label":"θ","min":10,"max":180,"step":1,"value":60} ],
  "objects":[
    {"type":"axes","grid":false,"labels":false,"appearAt":0},
    {"type":"sector","cx":0,"cy":0,"r":"r","start":0,"end":"deg","color":"#d4af37","fill":true,"appearAt":0},
    {"type":"line","x1":0,"y1":0,"x2":"r","y2":0,"color":"#c0392b","width":2,"appearAt":1},
    {"type":"polygon","points":[[0,0],["r",0],["r*cos(deg*3.14159/180)","r*sin(deg*3.14159/180)"]],"color":"#5b8def","fill":false,"appearAt":2},
    {"type":"text","x":0,"y":-0.6,"content":"半径 r","color":"#e8e2d0","appearAt":1},
    {"type":"text","x":1.2,"y":2.4,"content":"面积 = ½·r²·θ(弧度)","color":"#c0392b","size":16,"appearAt":2}
  ],
  "steps":[
    {"text":"画一个半径为 r、圆心角为 θ 的扇形","set":{"r":3,"deg":60},"appearAt":0},
    {"text":"扇形的两条半径长度都为 r","set":{"r":3,"deg":60},"animate":true,"appearAt":1},
    {"text":"扇形面积 = ½ × r² × θ（θ 用弧度）。拖动滑块可改变半径与角度，看面积如何变化","set":{"r":3,"deg":60},"animate":true,"appearAt":2}
  ]
}

【附件支持】
- 用户可能会上传图片或文件。若请求中附带图片 base64 或文件文本，请结合附件内容理解题意并生成对应的教学动画。
- 图片中若是几何图形、函数图像、公式或题目照片，请识别其中的数学对象（点、线、圆、坐标、方程等）并用相应对象类型绘制。
- 文件中若是文字题目，请提取关键条件、未知数与问题，生成可交互动画来演示求解过程。

【规则】
- 必须有 "title"、"controls"（≥1 slider）、"steps"（≥3）、"objects"（≥1）。
- type 只取上面 16 种之一；未知字段会被前端忽略。优先使用新类型（sector/angle/vector/polygon/curve/grid）让动画更生动。
- 每一步 text 会被中文语音朗读，请写得口语化。
- 不要输出解释文字，直接输出 JSON。`;

const CHAT_SYSTEM_PROMPT = `你是"数道万象"数学助手。请用简洁、专业的中文回答数学问题（1-3 句）。如果涉及具体计算请给出结果。`;

/* ------------------------------------------------------------------ *
 * 底层调用与工具
 * ------------------------------------------------------------------ */
function callDeepSeek(messages, maxTokens) {
  if (!DEEPSEEK_KEY) {
    return Promise.reject(new Error('未配置 DEEPSEEK_KEY：请在 Vercel 环境变量或本地 .env 中设置（详见 DEPLOY.md）'));
  }
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.4,
      max_tokens: maxTokens || 1500
    });
    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error('DeepSeek ' + res.statusCode + ' ' + data)); return; }
        try {
          const json = JSON.parse(data);
          resolve(json.choices[0].message.content);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function extractJSON(text) {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s === -1 || e === -1 || e <= s) return null;
  try { return JSON.parse(t.slice(s, e + 1)); } catch (e2) { return null; }
}

function buildUserContent(question, context) {
  const header = '请为下面的数学问题生成一个交互式教学动画：\n' + (question || '');
  if (!context) return header;
  const parts = [];
  const imgRegex = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  let cursor = 0;
  let firstText = header;
  let m;
  while ((m = imgRegex.exec(context)) !== null) {
    const before = context.slice(cursor, m.index);
    if (before.trim()) firstText += '\n\n' + before.trim();
    parts.push({ type: 'text', text: firstText });
    parts.push({ type: 'image_url', image_url: { url: m[0] } });
    firstText = '';
    cursor = imgRegex.lastIndex;
  }
  const tail = context.slice(cursor);
  if (tail.trim() || firstText) {
    parts.push({ type: 'text', text: firstText + (tail.trim() ? '\n\n' + tail.trim() : '') });
  }
  return parts;
}

// 任务存储：内存 Map 为主（Serverless 同实例 warm 复用），并尽力落盘。
const store = new Map();
function saveTask(record) {
  store.set(record.taskId, record);
  try {
    if (!fs.existsSync(GEN_DIR)) fs.mkdirSync(GEN_DIR, { recursive: true });
    fs.writeFileSync(path.join(GEN_DIR, record.taskId + '.json'), JSON.stringify(record, null, 2));
  } catch (e) { /* 只读环境静默失败，内存中仍有 */ }
}
function getTask(taskId) {
  if (store.has(taskId)) return store.get(taskId);
  try { return JSON.parse(fs.readFileSync(path.join(GEN_DIR, taskId + '.json'), 'utf8')); } catch (e) { return null; }
}

function generateTask(question, context) {
  const userContent = buildUserContent(question, context);
  return callDeepSeek([
    { role: 'system', content: GEN_SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ], 1500).then(text => {
    const spec = extractJSON(text);
    if (!spec || !Array.isArray(spec.objects) || !spec.objects.length) {
      return { taskId: null, answer: text.trim(), spec: null };
    }
    const taskId = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const record = {
      taskId,
      question,
      createdAt: new Date().toISOString(),
      spec: {
        title: spec.title || 'AI 生成的交互式动画',
        subtitle: spec.subtitle || '',
        xRange: Array.isArray(spec.xRange) ? spec.xRange : [-8, 8],
        yRange: Array.isArray(spec.yRange) ? spec.yRange : [-5, 5],
        controls: Array.isArray(spec.controls) ? spec.controls : [],
        objects: spec.objects.filter(o => o && typeof o.type === 'string'),
        steps: Array.isArray(spec.steps) ? spec.steps : []
      }
    };
    saveTask(record);
    return { taskId, answer: text.trim(), spec: record.spec };
  });
}

function chatReply(question, context) {
  const userContent = context
    ? buildUserContent(question, context)
    : (question || '');
  return callDeepSeek([
    { role: 'system', content: CHAT_SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ], 1024).then(text => text.trim());
}

/* ------------------------------------------------------------------ *
 * HTTP 适配层（兼容 Node 原生 req/res 与 Vercel 函数）
 * ------------------------------------------------------------------ */
function readBody(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined && req.body !== null) {
      try { resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); return; }
      catch (e) { resolve({}); return; }
    }
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function sendJSON(res, code, obj) {
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS));
  res.end(JSON.stringify(obj));
}

function handleChat(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  if (req.method !== 'POST') { sendJSON(res, 405, { error: 'method not allowed' }); return; }
  readBody(req).then(o => {
    const question = o.question, context = o.context;
    if (!question && !context) { sendJSON(res, 400, { error: 'no question' }); return; }
    chatReply(question || '', context || '').then(reply => sendJSON(res, 200, { reply }))
      .catch(e => sendJSON(res, 502, { error: String(e && e.message || e) }));
  });
}

function handleTasks(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  if (req.method !== 'POST') { sendJSON(res, 405, { error: 'method not allowed' }); return; }
  readBody(req).then(o => {
    const question = o.question, context = o.context;
    if (!question && !context) { sendJSON(res, 400, { error: 'no question' }); return; }
    generateTask(question || '', context || '').then(r => sendJSON(res, 200, r))
      .catch(e => sendJSON(res, 502, { error: String(e && e.message || e) }));
  });
}

function handleTeachingPreview(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  if (req.method !== 'GET') { sendJSON(res, 405, { error: 'method not allowed' }); return; }
  let id = (req.query && req.query.id);
  if (!id) {
    const m = (req.url || '').split('?')[0].match(/^\/api\/teachings\/([\w-]+)\/preview$/);
    id = m && m[1];
  }
  if (!id) { sendJSON(res, 400, { error: 'no id' }); return; }
  const record = getTask(id);
  if (!record) { sendJSON(res, 404, { error: 'task not found' }); return; }
  sendJSON(res, 200, { taskId: record.taskId, spec: record.spec });
}

// 供 server.js 使用：处理 /api/*，返回 true 表示已处理（无需静态托管）。
function routeApi(req, res) {
  const url = (req.url || '').split('?')[0];
  if (req.method === 'POST' && url === '/api/chat') { handleChat(req, res); return true; }
  if (req.method === 'POST' && url === '/api/tasks') { handleTasks(req, res); return true; }
  if (req.method === 'GET' && /^\/api\/teachings\/[\w-]+\/preview$/.test(url)) { handleTeachingPreview(req, res); return true; }
  return false;
}

module.exports = {
  CORS,
  DEEPSEEK_KEY,
  GEN_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  callDeepSeek,
  extractJSON,
  buildUserContent,
  generateTask,
  chatReply,
  saveTask,
  getTask,
  readBody,
  sendJSON,
  handleChat,
  handleTasks,
  handleTeachingPreview,
  routeApi
};
