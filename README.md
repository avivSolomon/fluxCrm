# FluxCRM

מערכת לניהול לקוחות, חשבוניות ותשלומים לנותני שירות — פרויקט גמר בהנדסת תוכנה (מה"ט).
Client, invoice and payment management — a final-year software engineering project.

**Stack:** Node.js · Express · MongoDB (Mongoose) · React 18 · Vite · Ant Design · Redux · Jest

## Quick start (Windows)

1. Install Node.js 20 or 22 and MongoDB Community Server (`winget install MongoDB.Server`).
2. Double-click **`start-demo.cmd`**.
3. Open http://localhost:3000 — login `admin@admin.com` / `admin123`.

Full instructions (Hebrew): [STUDENTS-GUIDE.md](STUDENTS-GUIDE.md). Stop with `scripts\stop-demo.ps1`.

## What the students developed (on top of the base)

| Area | End-to-end flow |
|---|---|
| Analytics, CSV export, user language preference, responsive layout | screen → `request` → route/controller → MongoDB aggregation / `Admin.language` → back to the screen (see the project book) |
| MongoDB aggregation, JWT authentication, automated tests | `backend/src/controllers/appControllers/invoiceController/analytics.js`, `createAuthMiddleware`, `backend/tests` |

Tests: `cd backend && npm test` (34 server tests, needs MongoDB), `cd frontend && npm test` (11 component tests), `cd e2e && npx playwright test` (7 browser tests, app running). CI: `.github/workflows/ci.yml`.

## Attribution and license

FluxCRM is based on **IDURAR ERP-CRM** (https://github.com/idurar/idurar-erp-crm), © its authors, released under the
**GNU Affero General Public License v3.0**. This project is distributed under the same license — see [LICENSE](LICENSE).
The code written by the students is listed in the project book; the base code can be told apart through the Git history
(the upstream history is preserved).
