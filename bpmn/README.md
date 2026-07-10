# Deploy BPMN to Flowable (Docker)

1. Copy `bpmn/auditObservationWorkflow.bpmn20.xml` into your Flowable container or use Flowable UI → Processes → Import.

2. Ensure Flowable identity groups exist:
   - `commercialHead`
   - `functionalHead`
   - `auditee` (optional — auditee tasks use direct assignee)

3. Assign users to groups via Administration → Users or Flowable IDM REST API.

4. Default Flowable REST credentials used by this app: `admin:test`  
   Override with env vars: `FLOWABLE_USER`, `FLOWABLE_PASS`, `FLOWABLE_BASE`

# PostgreSQL (attachment metadata)

Create database (optional — uploads still work via Flowable variables if PG unavailable):

```sql
CREATE DATABASE audit_app;
```

Env vars for Node backend:

```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=audit_app
PG_USER=postgres
PG_PASSWORD=postgres
```

# Start services

```bash
cd backend && npm install && npm start
npm run dev   # from project root (Vite + proxies /api and /flowable-api)
```
