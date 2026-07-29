// Cloudflare Pages Function: POST /api/chat
const lib = require('../../server-lib.js');

module.exports = {
  async onRequestOptions() {
    return new Response(null, { status: 204, headers: lib.CORS });
  },
  async onRequestPost({ request }) {
    return lib.handleChatWeb(request);
  }
};
