# 数道·万象 — 数学交互式教学动画平台

纯前端 Canvas 动画 + AI 助教（对话式生成可交互动画）+ DeepSeek 后端生成引擎。
对标 [xsyy.top](https://www.xsyy.top/)，支持上传图片 / 拍照 / 文件向 AI 提问。

## 本地运行

```bash
# 1) 在项目根创建 .env，写入你的 DeepSeek 密钥
cp .env.example .env
#   然后编辑 .env 填入真实 key
# 2) 启动（默认 http://localhost:8099）
node server.js
```

## 部署（Vercel，推荐）

详见 [DEPLOY.md](./DEPLOY.md)：

1. 将本仓库推到 GitHub。
2. 在 Vercel 导入该仓库。
3. 添加环境变量 `DEEPSEEK_KEY`。
4. 点击 Deploy。

`api/` 为 Serverless 函数，`site/` 为静态站点，二者同域名（前端用同源 `/api/*`，无跨域问题）。

## 目录结构

- `site/` 前端（index.html + 动画引擎 / AI 助教逻辑）
- `server-lib.js` 后端共享逻辑（本地与 Vercel 共用）
- `server.js` 本地 / VPS / 容器入口（自带静态托管）
- `api/` Vercel Serverless 函数（tasks / chat / teachings）
