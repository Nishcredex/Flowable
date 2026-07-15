const mailService = require('../services/mailService');
const { success } = require('../utils/response');
const {
  validateSendEmail,
  validateTemplateRequest,
  validateAttachments,
} = require('../validators/mailValidator');

/** GET /api/mail/test — verifies SMTP connectivity/auth on demand */
async function testConnection(_req, res, next) {
  try {
    const result = await mailService.verifyConnection();
    if (!result.ok) {
      return res.status(502).json({ success: false, message: 'SMTP verification failed', error: result.message });
    }
    return success(res, { data: result, message: 'SMTP connection is healthy' });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/mail/templates — lists available template names */
async function listTemplates(_req, res, next) {
  try {
    const templates = mailService.listTemplates();
    return success(res, { data: { templates }, message: 'Available templates' });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/mail/send — plain or HTML email, no template */
async function sendEmail(req, res, next) {
  try {
    const payload = validateSendEmail(req.body);
    const result = await mailService.sendEmail(payload);
    return success(res, { data: result, message: 'Email sent successfully' });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/mail/send-template — templated email */
async function sendTemplate(req, res, next) {
  try {
    const payload = validateTemplateRequest(req.body);
    const result = await mailService.sendTemplate(payload);
    return success(res, { data: result, message: 'Templated email sent successfully' });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/mail/send-attachment — multipart/form-data with files[] */
async function sendAttachment(req, res, next) {
  try {
    const files = validateAttachments(req.files, { required: true });
    const useTemplate = !!req.body.template;

    let payload;
    if (useTemplate) {
      payload = validateTemplateRequest(req.body);
    } else {
      payload = validateSendEmail(req.body);
    }

    const result = await mailService.sendAttachment({ ...payload, files });
    return success(res, { data: result, message: 'Email with attachment(s) sent successfully' });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/mail/preview — renders a template to HTML without sending; returns raw HTML for browser preview */
async function previewTemplate(req, res, next) {
  try {
    const payload = validateTemplateRequest(req.body, { requireRecipient: false });
    const html = mailService.previewTemplate(payload.template, payload.context);

    if (req.query.raw === 'true') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }
    return success(res, { data: { html }, message: 'Template rendered successfully' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  testConnection,
  listTemplates,
  sendEmail,
  sendTemplate,
  sendAttachment,
  previewTemplate,
};
