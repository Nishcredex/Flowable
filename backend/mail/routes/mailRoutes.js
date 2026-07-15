const express = require('express');
const mailController = require('../controllers/mailController');
const { upload } = require('../utils/upload');
const { failure } = require('../utils/response');
const { MailError } = require('../utils/mailErrors');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/test', mailController.testConnection);
router.get('/templates', mailController.listTemplates);

router.post('/send', mailController.sendEmail);
router.post('/send-template', mailController.sendTemplate);
router.post('/send-attachment', upload.array('attachments', 10), mailController.sendAttachment);
router.post('/preview', mailController.previewTemplate);

// ── Multer errors (file too large, bad type, etc.) ──────────────────
router.use((err, _req, res, next) => {
  if (err && err.name === 'MulterError') {
    return failure(res, { message: `Attachment upload error: ${err.message}`, statusCode: 400 });
  }
  return next(err);
});

// ── Mail-module error handler (typed errors from mailErrors.js) ─────
router.use((err, _req, res, _next) => {
  if (err instanceof MailError) {
    logger.error(`${err.name}: ${err.message}`);
    return failure(res, { message: err.message, statusCode: err.statusCode || 500 });
  }
  logger.error('Unhandled mail module error:', err.message || err);
  return failure(res, { message: 'Unexpected error in mail module', statusCode: 500, error: err.message });
});

module.exports = router;
