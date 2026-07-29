// Cloudflare Pages Function: POST /api/chat
import lib from '../../server-lib.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: lib.CORS });
}

export async function onRequestPost({ request }) {
  return lib.handleChatWeb(request);
}
