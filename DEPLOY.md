# 数道·万象 —— 上线部署指南

目标：让 `/api/tasks`（AI 动画生成）与 `/api/chat`（问答兜底）在**公网可用**，
且前端无需改动（前端已用同源相对路径 `/api/tasks`、`/api/chat`）。

后端代码已重构为共享模块 `server-lib.js`，同一套逻辑可运行于两种形态：
- **本地 / VPS / 容器**：`server.js`（自带静态托管 + API）
- **Serverless（Vercel）**：`api/tasks.js`、`api/chat.js`、`api/teachings/[id]/preview.js`

---

## 0. 前置条件
- 一个 DeepSeek API Key（https://platform.deepseek.com）。
- 项目目录结构（已就绪）：
  ```
  D:/728
  ├─ server.js          # 本地/VPS 入口
  ├─ server-lib.js      # 共享逻辑（prompts / DeepSeek / 路由，跨平台）
  ├─ package.json       # 启动命令（Railway/Vercel 识别）
  ├─ api/               # Vercel Serverless 函数（Node req/res）
  │  ├─ tasks.js
  │  ├─ chat.js
  │  └─ teachings/[id]/preview.js
  ├─ functions/         # Cloudflare Pages Functions（Web 标准 Request/Response）
  │  └─ api/
  │     ├─ tasks.js
  │     └─ chat.js
  ├─ site/              # 前端静态站（index.html, app.js, anim-engine.js ...）
  ├─ vercel.json        # Vercel 配置
  ├─ wrangler.toml      # Cloudflare Pages 配置
  └─ Dockerfile         # 容器部署
  ```

---

## 方案一：Vercel Serverless（推荐，免费，同域名无跨域）

Vercel 会把 `site/` 作为静态站、`api/` 作为函数，二者**同域名**，
所以前端现成的相对路径 `/api/tasks` 直接可用，无需改代码、无需 CORS。

1. 把 `D:/728` 整个目录推到 GitHub（或 GitLab）。
2. 打开 https://vercel.com/new ，导入该仓库。
3. 配置（一般 Vercel 会自动识别 `vercel.json`）：
   - Framework Preset：选 **Other**
   - Root Directory：`D:/728` 这一层（即包含 `site/` 与 `api/` 的目录）
   - Build Command：留空
   - Output Directory：`site`（已由 `vercel.json` 指定，无需手填）
4. 进入项目 **Settings → Environment Variables**，添加：
   - `DEEPSEEK_KEY` = `sk-你的真实密钥`
5. 点击 Deploy。完成后：
   - 站点：`https://你的项目.vercel.app`
   - 接口：`https://你的项目.vercel.app/api/tasks`、`/api/chat`
6. 验证：`curl -X POST https://你的项目.vercel.app/api/chat -H "Content-Type: application/json" -d "{\"question\":\"1+1\"}"`

> 说明：本机开发时 `server-lib.js` 内有回退密钥常量，仅方便本地跑；
> 线上务必用环境变量 `DEEPSEEK_KEY`，不要把密钥写进会被前端下载的文件。

---

## 方案二：VPS / 容器（自有服务器，完全可控）

### 方式 A：直接跑 Node（最简单）
```bash
# 在服务器上
git clone <你的仓库> && cd <项目根>
npm i --omit=dev        # 本项目零依赖，可跳过
DEEPSEEK_KEY=sk-xxxx PORT=80 SITE_DIR=/root/site node server.js
```
前面再套 Nginx/Caddy 反代 + HTTPS（可选）。`PORT`/`SITE_DIR`/`GEN_DIR`/`HOST` 均可环境变量覆盖。

### 方式 B：Docker（推荐用于容器平台）
```bash
docker build -t shudao .
docker run -d --name shudao \
  -p 8080:8080 \
  -e DEEPSEEK_KEY=sk-xxxx \
  shudao
```
然后在云控制台 / 负载均衡 / Nginx 处暴露 8080 并加 TLS。
适用于 Railway、Fly.io、Render、阿里云/腾讯云容器服务等。

---

## 方案三：Cloudflare Pages（推荐，免手机号 / 免绑卡）

Cloudflare 注册只用邮箱，**不需要手机号验证、也不需要绑卡**，最适合快速上线。
静态站走全球 CDN（秒开），`/api/*` 由 Pages Functions 处理，二者同域名，前端无需改代码。

> 前提：本项目后端已改造为跨平台——`server-lib.js` 用原生 `fetch` 调用 DeepSeek、
> 且 `fs/path/os` 全部懒加载容错，Cloudflare Workers 运行时可零依赖运行。

### 方式 A：Git 连接（最简单，推荐）
1. 把 `D:/728` 推到 GitHub（已推到 `akonnne/test`）。
2. 打开 https://dash.cloudflare.com/ → 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
3. 授权 GitHub，选择 `akonnne/test` 仓库。
4. 构建设置：
   - **Framework preset**：选 **None**
   - **Build command**：留空
   - **Build output directory**：填 `site`
5. 展开 **Environment variables (production)**，添加：
   - `DEEPSEEK_KEY` = `sk-你的真实密钥`
6. 点击 **Save and Deploy**。完成后得到 `*.pages.dev` 域名（**Custom domains** 可绑自己的域名）。

### 方式 B：Wrangler CLI（本地控制）
```bash
npm i -g wrangler
wrangler pages deploy site --branch main
# 环境变量（或在 Dashboard 添加）：
wrangler pages secret put DEEPSEEK_KEY --project-name shudao-wanxiang
```

### 验证
```bash
curl -X POST https://你的项目.pages.dev/api/chat -H "Content-Type: application/json" -d "{\"question\":\"1+1\"}"
curl -X POST https://你的项目.pages.dev/api/tasks -H "Content-Type: application/json" -d "{\"question\":\"勾股定理 a=3 b=4\"}"
```

> 注意：Cloudflare 免费套餐对单次请求有 CPU 时间限制；DeepSeek 调用主要是网络等待（不占 CPU），
> 一般没问题。若个别复杂问题超时，可升级 Paid（$5/月起）或改用 Railway/VPS。

---

## 重要说明

1. **前端无需改动**：前端调用的是同源相对路径 `/api/tasks`、`/api/chat`。
   只要静态站与 API 在同一域名下（Vercel 天然满足；VPS 用同源反代也满足），直接可用。
   若你执意把静态放 A 域名、函数放 B 域名，需要把前端 API 基地址改为绝对 URL，
   并依赖代码里已开启的 CORS（`Access-Control-Allow-Origin: *`）——不推荐，优先同源部署。

2. **任务持久化**：`/api/tasks` 返回的 `spec` 直接内嵌在前端响应里，前端不依赖
   `/api/teachings/:id/preview`（该接口仅为与 xsyy.top 对齐而保留，前端当前未调用）。
   在 Serverless 环境下任务只存于内存 + `/tmp`（实例重启即清空），对现有前端流程无影响。

3. **密钥安全**：密钥只在服务端。前端永远拿不到。请勿把 `DEEPSEEK_KEY` 提交到前端代码。

4. **本地预览**：`node server.js`（默认 8099），或直接打开 `site/index.html` 配合本地服务。
   当前 `localhost:8099` 已运行重构后的新后端，可直接验证。
