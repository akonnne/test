// Vercel Serverless Function：GET /api/teachings/:id/preview
// Vercel 会把路径参数放在 req.query.id。
const lib = require('../../../server-lib');
module.exports = (req, res) => lib.handleTeachingPreview(req, res);
