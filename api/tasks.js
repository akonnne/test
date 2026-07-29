// Vercel Serverless Function：POST /api/tasks
// 与本地 server.js 共用 server-lib 的同一套逻辑，保证行为一致。
const lib = require('../server-lib');
module.exports = (req, res) => lib.handleTasks(req, res);
