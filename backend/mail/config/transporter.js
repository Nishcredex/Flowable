const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Audit Management System';

if (!EMAIL_USER || !EMAIL_PASS) {
  logger.warn(
    'EMAIL_USER / EMAIL_PASS are not set in .env — mail sending will fail until configured.'
  );
}

/**
 * Singleton Nodemailer transporter using Gmail SMTP.
 * Credentials are read from process.env only — never hardcoded.
 * Requires a Google App Password (not the normal account password).
 */
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Verifies SMTP connectivity + auth. Called once at app startup (non-blocking)
 * and also exposed via GET /api/mail/test.
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    logger.info(`SMTP connection verified for ${EMAIL_USER}`);
    return { ok: true, message: `SMTP connection verified for ${EMAIL_USER}` };
  } catch (err) {
    logger.error('SMTP verification failed:', err.message);
    return { ok: false, message: err.message, code: err.code };
  }
}

module.exports = {
  transporter,
  verifyConnection,
  EMAIL_FROM_NAME,
  EMAIL_USER,
};
