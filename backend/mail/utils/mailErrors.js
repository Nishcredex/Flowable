/**
 * Custom error types for the mail module.
 * Each carries a statusCode so the error-handling middleware can respond correctly
 * without string-matching error messages.
 */

class MailError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'MailError';
    this.statusCode = statusCode;
  }
}

class ValidationError extends MailError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class TemplateNotFoundError extends MailError {
  constructor(templateName) {
    super(`Email template "${templateName}" was not found`, 404);
    this.name = 'TemplateNotFoundError';
  }
}

class TemplateCompilationError extends MailError {
  constructor(templateName, originalMessage) {
    super(`Failed to compile template "${templateName}": ${originalMessage}`, 500);
    this.name = 'TemplateCompilationError';
  }
}

class AttachmentError extends MailError {
  constructor(message) {
    super(message, 400);
    this.name = 'AttachmentError';
  }
}

class SmtpError extends MailError {
  constructor(message, statusCode = 502) {
    super(message, statusCode);
    this.name = 'SmtpError';
  }
}

/**
 * Maps a raw Nodemailer/SMTP error into one of our typed errors so the
 * controller/response layer can give the caller a meaningful message.
 */
function fromSmtpError(err) {
  const code = err.code || '';
  const msg = err.message || 'Unknown SMTP error';

  if (code === 'EAUTH') {
    return new SmtpError(
      'SMTP authentication failed. Check EMAIL_USER / EMAIL_PASS (use a Google App Password, not your normal Gmail password).',
      502
    );
  }
  if (code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNECTION') {
    return new SmtpError('SMTP connection timed out. Check network access to smtp.gmail.com:465/587.', 504);
  }
  if (code === 'EENVELOPE') {
    return new SmtpError('Invalid sender/recipient envelope. Check the "to" address(es).', 400);
  }
  return new SmtpError(`SMTP error: ${msg}`, 502);
}

module.exports = {
  MailError,
  ValidationError,
  TemplateNotFoundError,
  TemplateCompilationError,
  AttachmentError,
  SmtpError,
  fromSmtpError,
};
