# AGENTS.md

Living handoff for this repo. Update this file as modernization work progresses.

## 1) Project Snapshot

- App: `Wallet Watch` (legacy MERN + Plaid integration)
- Goal: modernize codebase and redeploy on a free/low-cost stack for limited users
- Current shape: split frontend/backend with independent `package.json` files
- Primary branch: `master`

## 2) Repo Walkthrough

### Root

- `README.md`: minimal project description + old Netlify URL
- `.gitignore`: ignores root `/node_modules` and `.env`, but does **not** ignore `backend/node_modules`
- `.netlify/state.json`: Netlify site metadata
- `backend/`: Express/Mongoose API
- `frontend/`: CRA React app

### Backend (`backend/`)

- Entrypoint: `server.js`
  - Loads env via `dotenv`
  - Configures `express.json()`, `cors()`, request logging middleware
  - Mounts routes:
    - `/api/user`
    - `/api/transactions`
    - `/api/plaid`
  - Connects via `mongoose.connect(process.env.MONGO_URI)` then `app.listen(process.env.PORT)`

- Routes/controllers/models:
  - `routes/user.js` + `controllers/userController.js`
    - `POST /register`, `POST /login`
    - JWT with `SECRET`, 3-day expiry
  - `routes/transactions.js` + `controllers/transactionController.js`
    - Auth-protected CRUD for transactions
    - Supports `sortBy` query (`newest`, `oldest`, `highest`, etc.)
  - `routes/plaid.js` + `controllers/plaidController.js`
    - Auth-protected Plaid Link token creation, token exchange, transaction sync
  - `middleware/requireAuth.js`
    - Expects `Authorization: Bearer <token>`
  - `models/user.js`
    - Fields: `username`, `password`, `access_token`, `item_id[]`, `plaidCursor`
  - `models/transaction.js`
    - Fields: `name`, `type`, `amount`, `userID`, `plaidTransactionID`, `date`, `category[]`

- Deployment artifact:
  - `Procfile` (`web: node server.js`) indicates former Heroku deploy model

- Environment variables in use:
  - `PORT`
  - `MONGO_URI`
  - `SECRET`
  - `PLAID_CLIENT_ID`
  - `PLAID_SECRET`
  - `PLAID_ENV`
  - `PLAID_PRODUCTS`
  - `PLAID_COUNTRY_CODES`

### Frontend (`frontend/`)

- Framework/tooling: Create React App (`react-scripts@5`)
- Entrypoint: `src/index.js` with `AuthContextProvider` + `TransactionContextProvider`
- Routing: `src/App.js` using React Router v6
  - Protected routes for app pages, login/register gating by auth context
- State:
  - `context/authContext.js`: auth reducer with `LOGIN`/`LOGOUT`
  - `context/transactionContext.js`: transaction reducer
- Pages:
  - `Home`: transactions list + sort + pagination + sync button
  - `LinkAccounts`: Plaid Link flow
  - `Login`, `Register`, `Info`, plus `Income`/`Spending` (currently not linked in navbar)
- API calls:
  - Relative paths (`/api/...`)
  - Dev proxy in `frontend/package.json` -> `http://localhost:4000`
- Current hosting config:
  - `frontend/netlify.toml` rewrites `/api/*` to old Heroku API URL

## 3) Current Risks / Technical Debt (Observed)

### Repo hygiene and operability

- `backend/node_modules` is tracked in git (very large repo bloat)
- Historical/unused nested git dir exists at `backend/wallet-watch/.git`
- `git status` is slow/hangs due repo size and file layout

### Backend correctness/security

- Transaction ownership checks are missing for `getTransaction`, `deleteTransaction`, `updateTransaction` (uses raw `_id` without `userID` guard)
- Plaid sync bug: `fetchNewSyncData` catch block references undefined `initialCursor`
- Plaid multi-item model inconsistency:
  - `item_id` stored as array, but `access_token` stored as single value
  - `retrievePlaidTransactions` loops items but `syncTransactions` ignores `itemId` arg and reuses one access token
- `date` field stored as `String` while code sometimes writes `new Date()`, creating inconsistent semantics

### Frontend architecture/UX

- CRA stack is legacy and harder to optimize vs modern frameworks (Vite/Next)
- Several full page reload patterns (`window.location.reload`) instead of local state invalidation
- `useLinkAccount.js` exists but is empty/unused
- Formatting/validation patterns are inconsistent across components

### Deployment model drift

- App still assumes Netlify frontend + Heroku backend rewrite flow
- Heroku free plan constraints and old routing assumptions are incompatible with desired modern free deploy flow

## 4) Suggested Target Architecture

- Frontend: migrate to Vite React SPA and deploy on Vercel (Hobby) or Netlify free
- Backend: deploy separately on Render free web service (or equivalent free Node host)
- Database: MongoDB Atlas free tier (`M0`) for limited users
- Auth/API:
  - Keep JWT auth initially
  - Add strict CORS allowlist with frontend domain
  - Use explicit `API_BASE_URL` env variable in frontend (avoid host-coupled rewrites)

Reason: this minimizes rewrite risk while modernizing incrementally.

## 5) Modernization Plan (Phased)

### Phase 0: Safety + Baseline

- [x] Create branch `modernize-phase-0`
- [x] Add/validate `.gitignore` for `backend/node_modules`, `frontend/node_modules`, build outputs
- [x] Remove tracked `backend/node_modules` from git history tip (keep lockfiles)
- [x] Add `README` setup instructions and env template(s)
- [x] Add smoke tests for auth + transaction CRUD API

### Phase 1: Backend hardening

- [ ] Fix transaction ownership enforcement in all read/update/delete endpoints
- [ ] Fix Plaid sync retry bug (`initialCursor` reference)
- [ ] Redesign Plaid token storage (per-item token model)
- [ ] Normalize transaction date type (prefer `Date`)
- [ ] Add request validation and centralized error handling
- [ ] Add security middleware (`helmet`, tighter `cors`, basic rate limiting)

### Phase 2: Frontend modernization

- [ ] Migrate CRA app to Vite
- [ ] Replace host rewrite assumptions with env-driven `API_BASE_URL`
- [ ] Remove full page reload flows; update context state from API responses
- [ ] Add loading/error states around Plaid sync and data fetches
- [ ] Add component-level tests for auth and transaction list behaviors

### Phase 3: Deployment refresh

- [ ] Deploy API service (Render free or similar)
- [ ] Deploy frontend (Vercel Hobby)
- [ ] Configure production env vars and CORS domains
- [ ] Add health endpoint and post-deploy smoke checks
- [ ] Document rollback and troubleshooting steps

### Phase 4: Optional quality improvements

- [ ] Add TypeScript incrementally (backend first or shared DTO layer)
- [ ] Add CI (lint + tests + build checks)
- [ ] Add observability (structured logs, simple uptime checks)

## 6) Local Dev Commands

From repo root, run in separate terminals:

Backend:

```bash
cd backend
npm ci
npm run dev
```

Frontend:

```bash
cd frontend
npm ci
npm start
```

## 7) Codex Working Notes

- Prefer reading/editing only source paths, not `node_modules` or `build`
- Keep this file current after each modernization phase
- When changing deployment strategy, update:
  - `README.md`
  - frontend API base URL handling
  - env var docs
  - this `AGENTS.md` checklist status
