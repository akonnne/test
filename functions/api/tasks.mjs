// Cloudflare Pages Function: POST /api/tasks
// 复用 server-lib 的 Web 标准 handler（Request -> Response）。
// 注意：Pages Functions 的路由探测只识别 ESM export，因此本文件用 .mjs + export。
// server-lib.js 是 CommonJS（module.exports），由 esbuild 互操作后默认导入即为整个导出对象。
import lib from '../../server-lib.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: lib.CORS });
}

export async function onRequestPost({ request, env }) {
  // Cloudflare Pages Functions 的 Secret 通过 env 对象传入，注入 process.env 供 server-lib 动态读取
  if (env && env.DEEPSEEK_KEY) process.env.DEEPSEEK_KEY = env.DEEPSEEK_KEY;
  return lib.handleTasksWeb(request);
}
