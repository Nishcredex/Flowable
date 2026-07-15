const { ValidationError } = require('../utils/mailErrors');
const { templateExists } = require('../helpers/templateEngine');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

function validateEmailList(value, fieldName, { required = true } = {}) {
  const list = toArray(value);
  if (required && list.length === 0) {
    throw new ValidationError(`"${fieldName}" is required and must contain at least one valid email address`);
  }
  for (const addr of list) {
    if (!EMAIL_REGEX.test(addr)) {
      throw new ValidationError(`"${addr}" in "${fieldName}" is not a valid email address`);
    }
  }
  return list;
}

/** Validates POST /api/mail/send */
function validateSendEmail(body) {
  const to = validateEmailList(body.to, 'to');
  const cc = validateEmailList(body.cc, 'cc', { required: false });
  const bcc = validateEmailList(body.bcc, 'bcc', { required: false });

  if (!body.subject || !String(body.subject).trim()) {
    throw new ValidationError('"subject" is required');
  }
  if (!body.text && !body.html) {
    throw new ValidationError('Either "text" or "html" body content is required');
  }
  return { to, cc, bcc, subject: String(body.subject).trim(), text: body.text, html: body.html };
}

/** Validates POST /api/mail/send-template and /api/mail/preview */
function validateTemplateRequest(body, { requireRecipient = true } = {}) {
  if (!body.template || !String(body.template).trim()) {
    throw new ValidationError('"template" is required');
  }
  const templateName = String(body.template).trim();
  if (!templateExists(templateName)) {
    throw new ValidationError(
      `Unknown template "${templateName}". Use GET /api/mail/templates to list available templates.`
    );
  }

  let to = [];
  let cc = [];
  let bcc = [];
  if (requireRecipient) {
    to = validateEmailList(body.to, 'to');
    cc = validateEmailList(body.cc, 'cc', { required: false });
    bcc = validateEmailList(body.bcc, 'bcc', { required: false });
  }

  if (requireRecipient && (!body.subject || !String(body.subject).trim())) {
    throw new ValidationError('"subject" is required');
  }

  const context = body.context && typeof body.context === 'object' ? body.context : {};

  return {
    to,
    cc,
    bcc,
    subject: body.subject ? String(body.subject).trim() : undefined,
    template: templateName,
    context,
  };
}

/** Validates attachment files coming from multer (req.files) */
function validateAttachments(files, { required = false } = {}) {
  if (required && (!files || files.length === 0)) {
    throw new ValidationError('At least one attachment file is required');
  }
  return files || [];
}

module.exports = {
  validateSendEmail,
  validateTemplateRequest,
  validateAttachments,
  validateEmailList,
};
