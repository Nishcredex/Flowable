const fs = require('fs');
const { transporter, verifyConnection, EMAIL_FROM_NAME, EMAIL_USER } = require('../config/transporter');
const { renderTemplate, listTemplates } = require('../helpers/templateEngine');
const { fromSmtpError, AttachmentError } = require('../utils/mailErrors');
const logger = require('../utils/logger');

/**
 * Converts multer file objects (req.files) into Nodemailer attachment descriptors.
 */
function buildAttachmentsFromMulterFiles(files = []) {
  return files.map((file) => {
    if (!fs.existsSync(file.path)) {
      throw new AttachmentError(`Uploaded file "${file.originalname}" could not be found on disk`);
    }
    return {
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
    };
  });
}

/**
 * Sends a raw mail (plain text and/or HTML), no template involved.
 * This is the lowest-level primitive every other send* method builds on.
 */
async function sendEmail({ to, cc, bcc, subject, text, html, attachments = [] }) {
  try {
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      cc: cc && cc.length ? (Array.isArray(cc) ? cc.join(',') : cc) : undefined,
      bcc: bcc && bcc.length ? (Array.isArray(bcc) ? bcc.join(',') : bcc) : undefined,
      subject,
      text,
      html,
      attachments,
    });
    logger.info(`Email sent: ${info.messageId} → ${Array.isArray(to) ? to.join(',') : to}`);
    return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
  } catch (err) {
    logger.error('sendEmail failed:', err.message);
    throw fromSmtpError(err);
  }
}

/**
 * Renders a Handlebars template with the given context and sends it as the HTML body.
 */
async function sendTemplate({ to, cc, bcc, subject, template, context = {}, attachments = [] }) {
  const html = renderTemplate(template, context);
  return sendEmail({ to, cc, bcc, subject, html, attachments });
}

/**
 * Sends an email (plain or templated) with one or more file attachments.
 * `files` are multer file objects (req.files); converts them to Nodemailer format.
 */
async function sendAttachment({ to, cc, bcc, subject, text, html, template, context = {}, files = [] }) {
  const attachments = buildAttachmentsFromMulterFiles(files);

  if (template) {
    return sendTemplate({ to, cc, bcc, subject, template, context, attachments });
  }
  return sendEmail({ to, cc, bcc, subject, text, html, attachments });
}

/**
 * Renders a template WITHOUT sending — used by the preview endpoint so the
 * (currently frontend-less) team can eyeball templates in a browser.
 */
function previewTemplate(template, context = {}) {
  return renderTemplate(template, context);
}

module.exports = {
  sendEmail,
  sendTemplate,
  sendAttachment,
  previewTemplate,
  verifyConnection,
  listTemplates,
};
