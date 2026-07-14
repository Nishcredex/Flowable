// const express = require("express");
// const cors    = require("cors");
// const axios   = require("axios");
// const path    = require("path");
// const multer  = require("multer");
// const FormData = require("form-data");

// const { FLOWABLE_AUTH, FLOWABLE_USER, FLOWABLE_PASS } = require("./flowableClient");

// const app = express();

// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());
// app.use(express.static("public"));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// const FLOWABLE_BASE = process.env.FLOWABLE_BASE || "http://localhost:8080/flowable-ui/process-api";

// // ATR_EXTENSION_APPROVAL runs on Flowable's CMMN engine, which is a
// // separate REST app from the process (BPMN) engine above. Defaults to
// // swapping "process-api" for "cmmn-api" on the same host, matching a
// // standard flowable-ui deployment. Override with FLOWABLE_CMMN_BASE if
// // your deployment differs.
// const FLOWABLE_CMMN_BASE =
//   process.env.FLOWABLE_CMMN_BASE || FLOWABLE_BASE.replace("/process-api", "/cmmn-api");

// // ── Domain APIs ──────────────────────────────────────────────


// // Route 1 — resourcedata (binary PNG from deployment)
// app.get(
//   '/flowable-api/repository/deployments/:deploymentId/resourcedata/:filename',
//   async (req, res) => {
//     const { deploymentId, filename } = req.params;
//     const targetUrl = `${FLOWABLE_BASE}/repository/deployments/${deploymentId}/resourcedata/${filename}`;

//     try {
//       const upstream = await fetch(targetUrl, {
//         headers: { Authorization: FLOWABLE_AUTH },
//       });

//       if (!upstream.ok) {
//         return res.status(upstream.status).end();
//       }

//       const contentType = upstream.headers.get('Content-Type') || 'image/png';
//       res.set('Content-Type', contentType);
//       res.set('Cache-Control', 'no-store');

//       const buffer = await upstream.arrayBuffer();
//       return res.send(Buffer.from(buffer));
//     } catch (err) {
//       return res.status(500).json({ error: err.message });
//     }
//   }
// );

// // Route 2 — legacy /image endpoint
// app.get(
//   '/flowable-api/repository/process-definitions/:id/image',
//   async (req, res) => {
//     const targetUrl = `${FLOWABLE_BASE}/repository/process-definitions/${req.params.id}/image`;

//     try {
//       const upstream = await fetch(targetUrl, {
//         headers: { Authorization: FLOWABLE_AUTH },
//       });

//       if (!upstream.ok) {
//         return res.status(upstream.status).end();
//       }

//       const contentType = upstream.headers.get('Content-Type') || 'image/png';
//       res.set('Content-Type', contentType);
//       res.set('Cache-Control', 'no-store');

//       const buffer = await upstream.arrayBuffer();
//       return res.send(Buffer.from(buffer));
//     } catch (err) {
//       return res.status(500).json({ error: err.message });
//     }
//   }
// );

// // ─────────────────────────────────────────────────────────────
// // Route 3 — TASK ATTACHMENT UPLOAD (multipart passthrough)
// //
// // Must be registered BEFORE the generic JSON proxy below — Express
// // matches routes in declaration order, and this one needs to intercept
// // POST /flowable-api/runtime/tasks/:taskId/attachments before it falls
// // through to the catch-all.
// //
// // Why this can't go through the generic proxy: that proxy hard-codes
// // 'Content-Type: application/json' on every outgoing request and only
// // forwards req.body, which express.json() only populates for bodies
// // that were actually application/json. A multipart/form-data upload
// // (boundary + file bytes) never gets parsed by express.json(), so
// // req.body is empty for this request — and even if it weren't, forcing
// // application/json on the way out throws away the multipart boundary
// // entirely. Flowable then receives something that claims to be JSON but
// // isn't, and correctly rejects it with 400 Bad Request.
// //
// // Fix: accept the multipart upload with multer (memory storage), then
// // re-encode it as a fresh multipart/form-data request (via the `form-data`
// // package) addressed to Flowable, forwarding the exact same fields the
// // client sent (name, type, description, file).
// // ─────────────────────────────────────────────────────────────
// const upload = multer(); // memory storage — fine for typical evidence-file sizes

// app.post(
//   '/flowable-api/runtime/tasks/:taskId/attachments',
//   upload.single('file'),
//   async (req, res) => {
//     const { taskId } = req.params;

//     if (!req.file) {
//       return res.status(400).json({ error: 'No file included in upload (expected multipart field "file").' });
//     }

//     const form = new FormData();
//     form.append('name', req.body.name || req.file.originalname);
//     form.append('type', req.body.type || req.file.mimetype || 'application/octet-stream');
//     form.append('description', req.body.description || '');
//     form.append('file', req.file.buffer, {
//       filename: req.file.originalname,
//       contentType: req.file.mimetype,
//     });

//     try {
//       const response = await axios.post(
//         `${FLOWABLE_BASE}/runtime/tasks/${taskId}/attachments`,
//         form,
//         {
//           headers: {
//             ...form.getHeaders(),
//             Authorization: FLOWABLE_AUTH,
//           },
//           timeout: 30000,
//         }
//       );
//       return res.status(response.status).json(response.data);
//     } catch (err) {
//       const status  = err.response?.status || 500;
//       const message = err.response?.data   || err.message;
//       return res.status(status).json({ error: message });
//     }
//   }
// );

// // GENERIC JSON PROXY
// app.use('/flowable-api', async (req, res) => {
//   const targetUrl = `${FLOWABLE_BASE}${req.path}`;
//   const queryString = Object.keys(req.query).length
//     ? '?' + new URLSearchParams(req.query).toString()
//     : '';

//   try {
//     const response = await axios({
//       method:  req.method,
//       url:     targetUrl + queryString,
//       headers: {
//         'Content-Type':  'application/json',
//         'Authorization': FLOWABLE_AUTH,
//       },
//       data:    ['POST', 'PUT'].includes(req.method) ? req.body : undefined,
//       timeout: 30000,
//     });

//     return res.status(response.status).json(response.data);
//   } catch (err) {
//     const status  = err.response?.status || 500;
//     const message = err.response?.data   || err.message;
//     return res.status(status).json({ error: message });
//   }
// });

// // GENERIC JSON PROXY — CMMN engine (ATR_EXTENSION_APPROVAL case tasks:
// // commercialHeadApprovalTask / functionalHeadApprovalTask). Mirrors the
// // /flowable-api proxy above, just pointed at the CMMN REST app.
// app.use('/cmmn-flowable-api', async (req, res) => {
//   const targetUrl = `${FLOWABLE_CMMN_BASE}${req.path}`;
//   const queryString = Object.keys(req.query).length
//     ? '?' + new URLSearchParams(req.query).toString()
//     : '';

//   try {
//     const response = await axios({
//       method:  req.method,
//       url:     targetUrl + queryString,
//       headers: {
//         'Content-Type':  'application/json',
//         'Authorization': FLOWABLE_AUTH,
//       },
//       data:    ['POST', 'PUT'].includes(req.method) ? req.body : undefined,
//       timeout: 30000,
//     });

//     return res.status(response.status).json(response.data);
//   } catch (err) {
//     const status  = err.response?.status || 500;
//     const message = err.response?.data   || err.message;
//     return res.status(status).json({ error: message });
//   }
// });

// app.post("/start-process", async (req, res) => {
//   const { fullName, emailAddress } = req.body;
//   if (!fullName || !emailAddress) {
//     return res.status(400).json({ success: false, error: "Missing fullName or emailAddress" });
//   }
//   try {
//     const response = await axios.post(
//       `${FLOWABLE_BASE}/runtime/process-instances`,
//       {
//         processDefinitionKey: "registrationWorkflow",
//         variables: [
//           { name: "fullName",     value: fullName,     type: "string" },
//           { name: "emailAddress", value: emailAddress, type: "string" }
//         ]
//       },
//       { headers: { "Content-Type": "application/json", "Authorization": FLOWABLE_AUTH }, timeout: 30000 }
//     );
//     return res.json({ success: true, data: response.data });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.response?.data || err.message });
//   }
// });

// app.get("/health", (_req, res) => res.json({ ok: true }));

// const PORT = process.env.PORT || 3000;


//     app.listen(PORT, () => {
//       console.log(`\n🚀 Node server  → http://localhost:${PORT}`);
//       console.log(`   Flowable      → ${FLOWABLE_BASE}`);
//       console.log(`   Flowable auth → ${FLOWABLE_USER}:${FLOWABLE_PASS}`);
//       console.log(`   Proxy         → /flowable-api → Flowable (BPMN)`);
//       console.log(`   Proxy         → /cmmn-flowable-api → Flowable (CMMN) → ${FLOWABLE_CMMN_BASE}`);
//       console.log(`   Attachments   → POST /flowable-api/runtime/tasks/:taskId/attachments (multipart passthrough)`);
//       console.log(`   Domain APIs   → /api/audits, /api/tasks, /api/attachments\n`);
//     });


require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const axios   = require("axios");
const path    = require("path");
const multer  = require("multer");
const FormData = require("form-data");

const { FLOWABLE_AUTH, FLOWABLE_USER, FLOWABLE_PASS } = require("./flowableClient");

const app = express();

// '*' is fine for local dev but sends Access-Control-Allow-Origin: * to
// every caller in production. Set CORS_ORIGIN to your deployed frontend's
// exact origin (e.g. https://atrtool.example.com) once you know it; comma
// -separate multiple origins if you have staging + prod.
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const FLOWABLE_BASE = process.env.FLOWABLE_BASE || "http://localhost:8080/flowable-ui/process-api";

// ATR_EXTENSION_APPROVAL runs on Flowable's CMMN engine, which is a
// separate REST app from the process (BPMN) engine above. Defaults to
// swapping "process-api" for "cmmn-api" on the same host, matching a
// standard flowable-ui deployment. Override with FLOWABLE_CMMN_BASE if
// your deployment differs.
const FLOWABLE_CMMN_BASE =
  process.env.FLOWABLE_CMMN_BASE || FLOWABLE_BASE.replace("/process-api", "/cmmn-api");

// ── Domain APIs ──────────────────────────────────────────────


// Route 1 — resourcedata (binary PNG from deployment)
app.get(
  '/flowable-api/repository/deployments/:deploymentId/resourcedata/:filename',
  async (req, res) => {
    const { deploymentId, filename } = req.params;
    const targetUrl = `${FLOWABLE_BASE}/repository/deployments/${deploymentId}/resourcedata/${filename}`;

    try {
      const upstream = await fetch(targetUrl, {
        headers: { Authorization: FLOWABLE_AUTH },
      });

      if (!upstream.ok) {
        return res.status(upstream.status).end();
      }

      const contentType = upstream.headers.get('Content-Type') || 'image/png';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'no-store');

      const buffer = await upstream.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// Route 2 — legacy /image endpoint
app.get(
  '/flowable-api/repository/process-definitions/:id/image',
  async (req, res) => {
    const targetUrl = `${FLOWABLE_BASE}/repository/process-definitions/${req.params.id}/image`;

    try {
      const upstream = await fetch(targetUrl, {
        headers: { Authorization: FLOWABLE_AUTH },
      });

      if (!upstream.ok) {
        return res.status(upstream.status).end();
      }

      const contentType = upstream.headers.get('Content-Type') || 'image/png';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'no-store');

      const buffer = await upstream.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Route 4 — TASK ATTACHMENT CONTENT (binary passthrough)
//
// Must be registered BEFORE the generic JSON proxy. That proxy uses
// axios with its default responseType ('json'), which corrupts binary
// bodies (JPEG/PDF bytes) by trying to parse/re-stringify them through
// res.json() — the file "downloads" but is no longer valid content.
// This route fetches the raw bytes with responseType: 'arraybuffer'
// and streams them straight through with the original content-type.
// ─────────────────────────────────────────────────────────────
app.get(
  '/flowable-api/runtime/tasks/:taskId/attachments/:attachmentId/content',
  async (req, res) => {
    const { taskId, attachmentId } = req.params;
    const targetUrl = `${FLOWABLE_BASE}/runtime/tasks/${taskId}/attachments/${attachmentId}/content`;

    try {
      const upstream = await axios.get(targetUrl, {
        headers: { Authorization: FLOWABLE_AUTH },
        responseType: 'arraybuffer',
        timeout: 30000,
        validateStatus: () => true, // let us forward Flowable's real status instead of throwing
      });

      if (upstream.status >= 400) {
        return res.status(upstream.status).end();
      }

      const contentType = upstream.headers['content-type'] || 'application/octet-stream';
      res.set('Content-Type', contentType);
      const disposition = upstream.headers['content-disposition'];
      if (disposition) res.set('Content-Disposition', disposition);
      res.set('Cache-Control', 'no-store');

      return res.send(Buffer.from(upstream.data));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Route 3 — TASK ATTACHMENT UPLOAD (multipart passthrough)
//
// Must be registered BEFORE the generic JSON proxy below — Express
// matches routes in declaration order, and this one needs to intercept
// POST /flowable-api/runtime/tasks/:taskId/attachments before it falls
// through to the catch-all.
//
// Why this can't go through the generic proxy: that proxy hard-codes
// 'Content-Type: application/json' on every outgoing request and only
// forwards req.body, which express.json() only populates for bodies
// that were actually application/json. A multipart/form-data upload
// (boundary + file bytes) never gets parsed by express.json(), so
// req.body is empty for this request — and even if it weren't, forcing
// application/json on the way out throws away the multipart boundary
// entirely. Flowable then receives something that claims to be JSON but
// isn't, and correctly rejects it with 400 Bad Request.
//
// Fix: accept the multipart upload with multer (memory storage), then
// re-encode it as a fresh multipart/form-data request (via the `form-data`
// package) addressed to Flowable, forwarding the exact same fields the
// client sent (name, type, description, file).
// ─────────────────────────────────────────────────────────────
const upload = multer(); // memory storage — fine for typical evidence-file sizes

app.post(
  '/flowable-api/runtime/tasks/:taskId/attachments',
  upload.single('file'),
  async (req, res) => {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file included in upload (expected multipart field "file").' });
    }

    const form = new FormData();
    form.append('name', req.body.name || req.file.originalname);
    form.append('type', req.body.type || req.file.mimetype || 'application/octet-stream');
    form.append('description', req.body.description || '');
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    try {
      const response = await axios.post(
        `${FLOWABLE_BASE}/runtime/tasks/${taskId}/attachments`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: FLOWABLE_AUTH,
          },
          timeout: 30000,
        }
      );
      return res.status(response.status).json(response.data);
    } catch (err) {
      const status  = err.response?.status || 500;
      const message = err.response?.data   || err.message;
      return res.status(status).json({ error: message });
    }
  }
);

// GENERIC JSON PROXY
app.use('/flowable-api', async (req, res) => {
  const targetUrl = `${FLOWABLE_BASE}${req.path}`;
  const queryString = Object.keys(req.query).length
    ? '?' + new URLSearchParams(req.query).toString()
    : '';

  try {
    const response = await axios({
      method:  req.method,
      url:     targetUrl + queryString,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': FLOWABLE_AUTH,
      },
      data:    ['POST', 'PUT'].includes(req.method) ? req.body : undefined,
      timeout: 30000,
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    const status  = err.response?.status || 500;
    const message = err.response?.data   || err.message;
    return res.status(status).json({ error: message });
  }
});

// GENERIC JSON PROXY — CMMN engine (ATR_EXTENSION_APPROVAL case tasks:
// commercialHeadApprovalTask / functionalHeadApprovalTask). Mirrors the
// /flowable-api proxy above, just pointed at the CMMN REST app.
app.use('/cmmn-flowable-api', async (req, res) => {
  const targetUrl = `${FLOWABLE_CMMN_BASE}${req.path}`;
  const queryString = Object.keys(req.query).length
    ? '?' + new URLSearchParams(req.query).toString()
    : '';

  try {
    const response = await axios({
      method:  req.method,
      url:     targetUrl + queryString,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': FLOWABLE_AUTH,
      },
      data:    ['POST', 'PUT'].includes(req.method) ? req.body : undefined,
      timeout: 30000,
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    const status  = err.response?.status || 500;
    const message = err.response?.data   || err.message;
    return res.status(status).json({ error: message });
  }
});

app.post("/start-process", async (req, res) => {
  const { fullName, emailAddress } = req.body;
  if (!fullName || !emailAddress) {
    return res.status(400).json({ success: false, error: "Missing fullName or emailAddress" });
  }
  try {
    const response = await axios.post(
      `${FLOWABLE_BASE}/runtime/process-instances`,
      {
        processDefinitionKey: "registrationWorkflow",
        variables: [
          { name: "fullName",     value: fullName,     type: "string" },
          { name: "emailAddress", value: emailAddress, type: "string" }
        ]
      },
      { headers: { "Content-Type": "application/json", "Authorization": FLOWABLE_AUTH }, timeout: 30000 }
    );
    return res.json({ success: true, data: response.data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;


    app.listen(PORT, () => {
      console.log(`\n🚀 Node server  → http://localhost:${PORT}`);
      console.log(`   Flowable      → ${FLOWABLE_BASE}`);
      console.log(`   Flowable auth → ${FLOWABLE_USER}:${'*'.repeat(FLOWABLE_PASS.length)}`);
      console.log(`   Proxy         → /flowable-api → Flowable (BPMN)`);
      console.log(`   Proxy         → /cmmn-flowable-api → Flowable (CMMN) → ${FLOWABLE_CMMN_BASE}`);
      console.log(`   Attachments   → POST /flowable-api/runtime/tasks/:taskId/attachments (multipart passthrough)`);
      console.log(`   Domain APIs   → /api/audits, /api/tasks, /api/attachments\n`);
    });