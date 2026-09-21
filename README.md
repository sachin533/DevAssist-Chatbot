# Phonebook Application — CyberMax Solutions Evaluation

Classic CRUD phonebook (add, view, update, delete) as a clean monolith:
**Node.js + Express JSON API · SQL Server Express (mssql + Stored Procedures) · Vue 3 SPA**.

## Module system
**ES modules** (`"type": "module"`, `import`/`export`) used consistently across the backend and the Vite+Vue frontend.

## Project structure
```
.
├── server.js                 # entrypoint (npm start) — connects pool, serves API+UI
├── src/
│   ├── app.js                # Express app, /api routes, static SPA serving, error handler
│   ├── config/db.js          # single shared mssql pool (Windows auth or SQL login via .env)
│   ├── models/contact.js     # domain model / DTO mapper
│   ├── models/pagedResult.js # { items, totalCount, currentPage, pageSize, totalPages }
│   ├── repositories/contactRepository.js  # stored-procedure calls ONLY
│   ├── controllers/contactsController.js # validation + status codes, thin HTTP layer
│   ├── routes/contacts.js    # GET /api/contacts, /:id, POST, PUT, DELETE, /check-phone
│   └── utils/validation.js   # input validation + paging parser
├── sql/schema.sql            # table + sp_GetContactsPaged/ById/Insert/Update/Delete (+check helper)
├── scripts/enable-sql-tcp.ps1 # one-time admin setup: TCP/IP + Mixed Mode + SQL login
├── client/                   # Vue 3 + Vite SPA source (proxied to API in dev)
├── public/                   # production build output served by Express (express.static + SPA fallback)
├── .env / .env.example
└── package.json
```

## Prerequisites
- Node.js LTS (18+) + npm, Windows 11
- SQL Server Express running (instance `.\SQLEXPRESS` in this guide)
- `sqlcmd` on PATH
- Administrator rights **once** (to enable TCP/IP on the Express instance — Node's `mssql`/Tedious driver connects over TCP)

## 0. One-time SQL network setup (run as Administrator)
SQL Server Express ships with TCP/IP disabled, which the Node `mssql` driver requires.
Right-click PowerShell → **Run as administrator**, then:
```powershell
cd "<project-folder>"
powershell -ExecutionPolicy Bypass -File scripts\enable-sql-tcp.ps1
```
This enables TCP/IP on static port 1433, switches to Mixed Mode auth, restarts
`MSSQL$SQLEXPRESS`, creates SQL login `phonebook_user`, and applies `sql\schema.sql`.
Expected tail output: `TCP + SQL-auth verification query SUCCEEDED.` / `SETUP_OK`.

## 1. Database setup
If the admin script above already ran, the database is ready. Otherwise (or to reset):
```powershell
sqlcmd -S ".\SQLEXPRESS" -E -i sql\schema.sql
```
Creates `PhonebookDB`, table `Contacts`, and procedures:
`sp_GetContactsPaged` (OFFSET/FETCH + `@TotalCount` OUTPUT + optional `@SearchTerm`),
`sp_GetContactById`, `sp_InsertContact`, `sp_UpdateContact`, `sp_DeleteContact`
(plus `sp_CheckPhoneExists` for the optional unique-phone pre-check).

## 2. Configure environment
```powershell
Copy-Item .env.example .env
```
Defaults (created by the admin script in step 0):
```
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=PhonebookDB
DB_TRUSTED_CONNECTION=false
DB_USER=phonebook_user
DB_PASSWORD=****
```
(Windows integrated auth over Shared Memory is not supported by the Tedious
driver — TCP + SQL login is the configured path.)

## 3. Install + run
```powershell
npm install
npm start            # http://localhost:3000 (API + UI in one process)
# dev variants:
npm run dev          # API with nodemon
npm --prefix client run dev  # Vite dev at http://localhost:5173 (proxies /api → :3000)
```

## 4. Build frontend for production
```powershell
npm --prefix client run build   # outputs to public/, served by Express
```

## API
| Method | Route | Success |
|---|---|---|
| GET | `/api/contacts?pageNumber=1&pageSize=10&searchTerm=` | 200 `{ items, totalCount, currentPage, pageSize, totalPages }` |
| GET | `/api/contacts/:id` | 200 contact / 404 |
| POST | `/api/contacts` `{name, phoneNumber, email?, address?}` | 201 contact / 400 |
| PUT | `/api/contacts/:id` | 200 contact / 400 / 404 |
| DELETE | `/api/contacts/:id` | 204 / 404 |
| GET | `/api/contacts/check-phone?phoneNumber=&excludeId=` | 200 `{ phoneNumber, exists }` |
| GET | `/api/health` | 200 `{ ok: true }` |

Pagination is done **in the database engine** (`OFFSET … FETCH NEXT`, only the page slice returns to Node).

## Notes
- No ORM / query builder — `mssql` pool + typed `request.input/output` + `.execute(proc)` only.
- No server templates / jQuery — UI is 100% Vue 3 SPA calling `/api/contacts` with `fetch`.
- Client + server validation (required name/phone, phone format, email format, unique phone → 400).
