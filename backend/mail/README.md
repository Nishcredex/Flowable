# Email Notification Module

A reusable, backend-agnostic email infrastructure service for the Audit Management System.
Built with **Nodemailer** (Gmail SMTP) + **Handlebars** (HTML templates). Any module in the
app can trigger emails by calling `mailService` directly — no HTTP round-trip needed for
internal use, though REST endpoints are also exposed for Postman/frontend testing.

## 1. Installation

From `backend/`:

```bash
npm install
```

This installs the 3 new dependencies added for this module: `nodemailer`, `handlebars`, `dotenv`
(alongside your existing `express`, `cors`, `axios`, `multer`, `pg`).

## 2. Google App Password setup

Gmail SMTP will reject your normal account password. You need an **App Password**:

1. Go to your Google Account → **Security**.
2. Enable **2-Step Verification** if it isn't already on (required for App Passwords).
3. Go to https://myaccount.google.com/apppasswords
4. Create a new App Password (choose "Mail" / "Other" as the app name, e.g. "Audit Management System").
5. Google gives you a 16-character password like `abcd efgh ijkl mnop`. Copy it (spaces don't matter).

⚠️ **Never** put this password in code, commit it to git, or paste it into a chat/ticket in plaintext —
treat it like any other secret. If it's ever exposed, revoke it from the same App Passwords page and
generate a new one.

## 3. Environment variables

Copy the example file and fill in real values:

```bash
cd backend
cp .env.example .env
```

Then edit `.env`:

```env
PORT=3000

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=audit_app
PG_USER=postgres
PG_PASSWORD=postgres

FLOWABLE_BASE=http://localhost:8080/flowable-rest/service
FLOWABLE_USER=admin
FLOWABLE_PASS=test

EMAIL_USER=your-address@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM_NAME=Audit Management System

MAIL_DEBUG=false
```

`.env` is already covered by `.gitignore` — it will never be committed.

## 4. How to run

```bash
cd backend
npm install
npm start
```

On startup you'll see a line confirming (or denying) the SMTP connection:

```
✉️  Mail service verified   → SMTP connection verified for your-address@gmail.com
```

If it fails, check the console message — it will tell you whether it's an auth problem
(`EAUTH` → wrong App Password) or a network/timeout problem.

## 5. REST API reference

All responses follow this shape:

```json
// success
{ "success": true, "message": "...", "data": { ... } }
// failure
{ "success": false, "message": "...", "error": "..." }
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET  | `/api/mail/test` | Verifies SMTP connectivity/auth on demand |
| GET  | `/api/mail/templates` | Lists available template names |
| POST | `/api/mail/send` | Send a plain-text or raw HTML email (no template) |
| POST | `/api/mail/send-template` | Render a template with `context` and send it |
| POST | `/api/mail/send-attachment` | Same as above (or plain), `multipart/form-data` with files under field `attachments` |
| POST | `/api/mail/preview?raw=true` | Renders a template to HTML — add `?raw=true` to see it directly in a browser, omit for JSON `{ data: { html } }` |

### Example: `POST /api/mail/send-template`

```json
{
  "to": "employee@company.com",
  "cc": "manager@company.com",
  "subject": "New Audit Assigned - AUD-1042",
  "template": "audit-assigned",
  "context": {
    "employeeName": "Rohit Sharma",
    "auditId": "AUD-1042",
    "auditName": "Q3 Procurement Compliance Audit",
    "assignedBy": "Priya Verma",
    "dueDate": "2026-08-15",
    "remarks": "Please complete the checklist before the site visit.",
    "dashboardLink": "https://audit.example.com/audits/AUD-1042"
  }
}
```

### Available templates

`audit-assigned`, `observation-assigned`, `corrective-action-submitted`,
`clarification-requested`, `observation-closed`, `reminder`, `escalation`,
`generic-notification`.

Common placeholders across templates: `employeeName`, `auditId`, `auditName`,
`observationId`, `dueDate`, `assignedBy`, `dashboardLink`, `remarks`. Missing placeholders
render as empty strings rather than throwing (Handlebars default behavior), except
`template` itself, which is validated before sending.

## 6. Testing in Postman

Import both files from `backend/postman/`:

- `AuditManagement-Mail.postman_collection.json` — every endpoint, with sample payloads and saved example responses (success + failure) for each request.
- `AuditManagement-Local.postman_environment.json` — sets `{{baseUrl}}` (`http://localhost:3000`) and `{{testRecipient}}`.

Steps:
1. Postman → **Import** → select both files.
2. Select the "Audit Management - Local" environment (top-right dropdown).
3. Edit `testRecipient` in the environment to an inbox you can check.
4. Run **Test SMTP Connection** first to confirm your `.env` is correct.
5. Run **Send Templated Email - Audit Assigned** and check your inbox.
6. For **Send Email With Attachment(s)**, open the request body (form-data tab) and attach a real file to the `attachments` field before sending — Postman can't pre-fill a file picker from a saved collection.
7. For **Preview Template (Render in Browser)**, you can also just paste the request URL + body into a REST client that renders HTML, or use Postman's response "Preview" tab — it renders HTML responses inline.

## 7. How the frontend should consume these APIs (once it's ready)

Since the frontend isn't built yet, treat this as a plain REST contract:

- POST JSON to `/api/mail/send-template` with `to`, `subject`, `template`, `context`.
- Handle `success: false` responses by showing `message` to the user.
- For attachments, use `multipart/form-data` with a `context` field containing a **JSON string** (not a nested object — same as the Postman example), plus files under `attachments`.
- `/api/mail/preview` is useful for building a "preview before send" UI later — call it with `raw=true` in an `<iframe src="...">`-style flow isn't directly possible via POST, so the frontend would call it via fetch and inject the returned `data.html` into an iframe's `srcdoc`.

## 8. How other backend modules should trigger emails

Don't call the REST endpoints internally — that's for external/Postman/frontend use. Import
the service directly:

```js
const mailService = require('../mail/services/mailService');

// fire-and-forget style (recommended: don't let email failures block the main flow)
mailService
  .sendTemplate({
    to: auditeeEmail,
    subject: `Observation ${observationId} assigned to you`,
    template: 'observation-assigned',
    context: {
      employeeName: auditeeName,
      observationId,
      auditId,
      auditName,
      assignedBy: auditorName,
      dueDate,
      dashboardLink: `${process.env.FRONTEND_URL || ''}/observations/${observationId}`,
    },
  })
  .catch((err) => console.error('[mail] failed to notify auditee:', err.message));
```

Because `mailService` throws typed errors (`ValidationError`, `TemplateNotFoundError`, `SmtpError`,
etc. from `mail/utils/mailErrors.js`), callers can also `try/catch` and inspect `err.statusCode` /
`err.name` if they need different handling than "log and move on".

## 9. Where to trigger emails from in Audit workflow (see step 11 in the main analysis)

Suggested hook points inside `routes/audits.js` and `routes/tasks.js` (not wired up yet —
add these as small, non-blocking calls at the end of the relevant handler, mirroring the
snippet above):

| Event | Trigger location | Template |
|---|---|---|
| Observation created | `routes/audits.js` → `POST /` (after `startProcess`) | `observation-assigned` |
| Corrective action submitted | `routes/tasks.js` → `POST /:taskId/submit` | `corrective-action-submitted` |
| Extension requested (clarification-like) | `routes/tasks.js` → `POST /:taskId/extension` | `clarification-requested` |
| Extension approved | `routes/tasks.js` → `POST /:taskId/extension/approve` | `generic-notification` or a dedicated template |
| Extension rejected | `routes/tasks.js` → `POST /:taskId/extension/reject` | `generic-notification` |
| Observation approved/closed | `routes/tasks.js` → `POST /:taskId/approve` | `observation-closed` |
| Observation rejected (rework) | `routes/tasks.js` → `POST /:taskId/reject` | `clarification-requested` |
| Reminder (needs a scheduler — not present yet) | future cron/worker | `reminder` |
| Escalation (needs a scheduler — not present yet) | future cron/worker | `escalation` |

I haven't modified `audits.js`/`tasks.js` yet — say the word and I'll wire these calls in
directly, matching each route's existing variables so no extra lookups are needed.
