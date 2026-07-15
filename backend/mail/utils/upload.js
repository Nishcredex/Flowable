const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Mirrors the pattern used in backend/routes/attachments.js (diskStorage, UUID filenames)
// but stores mail attachments in their own folder and allows the broader file types
// requested for the mail module (PDF, DOC/DOCX, XLS/XLSX, PNG, JPEG).
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'mail');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

const ALLOWED_EXT = /\.(pdf|docx?|xlsx?|png|jpe?g)$/i;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.test(file.originalname);
    cb(ok ? null : new Error('Only PDF, DOC, DOCX, XLS, XLSX, PNG, JPEG files are allowed'), ok);
  },
});

module.exports = { upload, UPLOAD_DIR };
