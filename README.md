# La Dolce Vita Restaurant Site

A polished restaurant website demo with a production-style frontend and a lightweight API server for reservations, contact, newsletter, and checkout.

## Features

- Multi-page restaurant marketing site
- Persistent cart and checkout flow
- API-backed forms:
  - Reservations
  - Contact messages
  - Newsletter subscription
- Checkout API with order confirmation
- Service worker support for offline fallback

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript, Vite
- Backend: Node.js, Express, CORS

## Run Locally

1. Install dependencies:

```bash
npm install
```

1. Run frontend + API together:

```bash
npm run dev:full
```

1. Open the site in your browser:

- Frontend: <http://localhost:5173>
- API health check: <http://localhost:3001/api/health>

If port `5173` is already occupied, Vite will auto-switch to `5174` (or another free port).

## Available Scripts

- `npm run dev` or `npm run dev:site`: Start Vite dev server
- `npm run api`: Start API server only
- `npm run dev:full`: Start API + Vite together
- `npm run seo`: Generate `robots.txt` and `sitemap.xml` from `SITE_URL`
- `npm run build`: Build static assets with Vite
- `npm run preview`: Preview production build
- `npm run start`: Start API server

## Deployment Configuration

Set these environment variables for production deployments:

- `SITE_URL`: Public base URL (used for `robots.txt`, `sitemap.xml`, and API CORS origin allowlist)
- `VITE_API_BASE`: Optional API base URL for split frontend/backend deployments
  - Example: `https://api.yourdomain.com`
  - Leave unset when frontend and API are served from the same origin
- `ALLOWED_ORIGINS`: Optional comma-separated CORS origins for API
  - Example: `https://yourdomain.com,https://www.yourdomain.com`

PowerShell example:

```powershell
$env:SITE_URL = "https://yourdomain.com"
$env:VITE_API_BASE = "https://api.yourdomain.com"
$env:ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
npm run build
```

## API Endpoints

- `POST /api/reservations`
- `POST /api/newsletter`
- `POST /api/contact`
- `POST /api/create-checkout-session`
- `GET /api/availability`
- `GET /api/health`

## Notes

- Checkout runs in demo mode unless real Stripe keys and server integration are added.
- API responses are validated and return user-friendly error messages.
