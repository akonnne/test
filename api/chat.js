// Vercel Serverless Function：POST /api/chat
const lib = require('../server-lib');
module.exports = (req, res) => lib.handleChat(req, res);
