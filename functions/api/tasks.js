// Cloudflare Pages Function: POST /api/tasks
// 复用 server-lib 的 Web 标准 handler（Request -> Response）。
// fetch 在 Cloudflare Workers 运行时原生可用，无需任何 Node 依赖。
const lib = require('../../server-lib.js');

module.exports = {
  async onRequestOptions() {
    return new Response(null, { status: 204, headers: lib.CORS });
  },
  async onRequestPost({ request }) {
    return lib.handleTasksWeb(request);
  }
};
