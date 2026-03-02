# Wallet Watch Frontend

React SPA migrated to Vite.

## Prerequisites

- Node.js 18+
- Running Wallet Watch backend API

## Environment

Create `frontend/.env` from the example:

```bash
cp .env.example .env
```

Set:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

Use your deployed backend URL in production.

## Scripts

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # outputs ./dist
npm run preview  # serves production build locally
```

## Deployment Notes

- API calls are environment-driven through `VITE_API_BASE_URL`.
- No frontend host-level `/api` rewrites are required.
- For Netlify, `netlify.toml` is configured for SPA routing and Vite build output.
