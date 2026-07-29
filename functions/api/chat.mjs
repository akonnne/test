// Cloudflare Pages Function: POST /api/chat
import lib from '../../server-lib.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: lib.CORS });
}

export async function onRequestPost({ request, env }) {
  // Cloudflare Pages Functions 的 Secret 通过 env 对象传入，注入 process.env 供 server-lib 动态读取
  if (env && env.DEEPSEEK_KEY) process.env.DEEPSEEK_KEY = env.DEEPSEEK_KEY;
  return lib.handleChatWeb(request);
}
