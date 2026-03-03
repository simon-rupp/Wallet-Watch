# Wallet Watch

Wallet Watch is a modernized MERN + Plaid app for tracking spending, income, and cash flow.
The architecture is still MERN (MongoDB, Express, React, Node.js), with updated tooling and hosting:
Vite frontend on Vercel, Express API on Render, and MongoDB Atlas.

Live site (frontend): https://wallet-watch-seven.vercel.app/
Live API (backend): https://wallet-watch-t5cu.onrender.com
Health check: https://wallet-watch-t5cu.onrender.com/api/health

## Repository Layout

- `backend/`: Express + MongoDB API (auth, transactions, Plaid sync)
- `frontend/`: React (Vite) client
- `AGENTS.md`: modernization handoff and phased upgrade plan

## Production Deployment (Current)

- Frontend hosting: Vercel (Hobby)
- Backend hosting: Render Web Service (free tier)
- Database: MongoDB Atlas `M0`
- Frontend URL: `https://wallet-watch-seven.vercel.app`
- Backend URL: `https://wallet-watch-t5cu.onrender.com`

## Prerequisites

- Node.js 18.x
- npm 9+
- MongoDB database (local or Atlas)
- Plaid sandbox credentials (optional unless testing bank-link flows)

## Local Setup

### 1) Configure environment variables

Backend:

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env` values before running the API.

Important for local CORS:

- Set `FRONTEND_ORIGIN=http://localhost:5173` for Vite local dev.

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

Set `VITE_API_BASE_URL` to your backend origin (for local dev: `http://localhost:4000`).

### 2) Install dependencies

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

### 3) Start development servers

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

The Vite dev server runs on `http://localhost:5173` by default.

## Tests

Backend smoke tests cover:

- auth register/login
- transaction create/read/update/delete
- auth requirement on protected routes

Run:

```bash
cd backend
npm test
```

## Production Environment Variables

Backend (Render):

- `PORT` (set by Render automatically)
- `MONGO_URI` (Atlas connection string)
- `SECRET` (JWT signing secret)
- `FRONTEND_ORIGIN` (comma-separated allowed origins)
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV` (`sandbox` or `production`)
- `PLAID_PRODUCTS`
- `PLAID_COUNTRY_CODES`

Frontend (Vercel):

- `VITE_API_BASE_URL=https://wallet-watch-t5cu.onrender.com`

`FRONTEND_ORIGIN` should include each origin that must call the API, for example:

```env
FRONTEND_ORIGIN=https://wallet-watch-seven.vercel.app,http://localhost:5173
```

If you test from Vercel preview URLs, include the exact preview domain as well.

## Redeploy Checklist

### Backend (Render)

1. Push backend changes to `master`.
2. Confirm Render service root directory is `backend`.
3. Confirm build/start commands:
   - Build: `npm ci`
   - Start: `npm start`
4. Verify Render env vars are still present and correct.
5. Open `https://wallet-watch-t5cu.onrender.com/api/health` and confirm `{"status":"ok"}`.

### Frontend (Vercel)

1. Push frontend changes to `master`.
2. Confirm Vercel project root directory is `frontend`.
3. Confirm `VITE_API_BASE_URL` points to Render backend.
4. Redeploy and confirm app loads at `https://wallet-watch-seven.vercel.app`.

### Post-Deploy Smoke Test

1. Register/login.
2. Create and delete a transaction.
3. Open Income and Spending pages.
4. Open Connect Bank page and verify link-token flow initializes.
5. Verify browser devtools shows no CORS failures.

## Rollback (Quick)

1. In Render, redeploy the previous successful backend deploy from deployment history.
2. In Vercel, promote/redeploy the previous successful frontend build.
3. Keep `VITE_API_BASE_URL` and `FRONTEND_ORIGIN` aligned with the active frontend/backend pair.
4. Re-run the smoke test checklist above before declaring rollback complete.

## Troubleshooting

### CORS errors (`No 'Access-Control-Allow-Origin' header`)

- Verify Render `FRONTEND_ORIGIN` includes the exact frontend origin (no trailing slash).
- Include all required origins as comma-separated values, for example:

```env
FRONTEND_ORIGIN=https://wallet-watch-seven.vercel.app,http://localhost:5173
```

- Redeploy Render after env var changes.

### Backend startup crash with `querySrv ENOTFOUND`

- Your Atlas hostname in `MONGO_URI` is invalid/expired or has a typo.
- Re-copy the URI from Atlas Connect > Drivers.
- Confirm Atlas DB user, password, and network access list.

### Frontend can load but API calls fail

- Confirm Vercel `VITE_API_BASE_URL` points to the active Render URL.
- Confirm Render backend is healthy: `GET /api/health`.

## UI Screenshots

The screenshots below were captured from the live deployment after seeding realistic sample data (multiple income entries and a larger set of expenses) via Playwright automation.

### Dashboard Overview

![Dashboard Overview](docs/screenshots/dashboard-overview.png)

### Dashboard Full (Transaction Feed)

![Dashboard Full](docs/screenshots/dashboard-full.png)

### Spending Page

![Spending Page](docs/screenshots/spending-page.png)

### Income Page

![Income Page](docs/screenshots/income-page.png)

### Connect Bank Page

![Connect Bank Page](docs/screenshots/link-bank-page.png)

### Dashboard Mobile

![Dashboard Mobile](docs/screenshots/dashboard-mobile.png)

## Project Handoff

Track modernization progress and implementation history in `AGENTS.md`.
