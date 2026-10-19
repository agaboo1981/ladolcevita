# La Dolce Vita, Lucca

A multi-page restaurant site for a **fictional** trattoria in the real city of Lucca,
built as a portfolio piece. Plain HTML, CSS and vanilla JavaScript on the front, a
small Express demo API behind it, and a service worker for offline reading.

The design is deliberate, not templated: one typeface, five type sizes, one button
shape, and a palette taken from the stone of Lucca's walls. See `PROJECT.md` for the
design system and `CONTENT.md` for exactly what is real and what is invented.

## What is here

- Nine pages: home, menu, gallery, order, checkout, reservations, success, 404, offline
- A persistent cart and a checkout flow
- API-backed reservations with real availability, plus contact and newsletter forms
- A real-clock "tonight" module on the homepage
- Service worker offline shell and image cache
- No invented press, no invented reviews, no testimonials

## Run it locally

```bash
npm install
npm run dev:full
```

Then open:

- Site: <http://localhost:5173>
- API health: <http://localhost:3001/api/health>

`npm run dev:full` starts the API and the Vite dev server together. If port 5173 is
busy, Vite picks the next free port.

To run just one of them:

```bash
npm run api        # API only, on :3001
npm run dev:site   # Vite only
```

The site works without the API. When the API is not reachable the reservations form
says so plainly and the checkout runs in a labelled demo mode.

## Scripts

| script | what it does |
|--------|--------------|
| `npm run dev` / `npm run dev:site` | Vite dev server |
| `npm run api` | Express API, port 3001 |
| `npm run dev:full` | API and dev server together |
| `npm test` | the 130-check suite in `test/run-tests.js` |
| `npm run images` | rebuild `images/build/` from the sources with sharp |
| `npm run seo` | write `robots.txt` and `sitemap.xml` from `SITE_URL` |
| `npm run build` | production build (runs `seo` first) |
| `npm run preview` | preview the production build |
| `npm start` | start the API server |

## API

All responses are JSON. Validation errors return HTTP 400 with a readable `message`.

| method | route | notes |
|--------|-------|-------|
| `GET` | `/api/health` | liveness check |
| `GET` | `/api/availability?date=YYYY-MM-DD` | the day's sittings, each with `time` and `available` |
| `POST` | `/api/reservations` | `date`, `time`, `partySize` (1 to 20), `name`, `email`, `phone`, and optional `requests` |
| `POST` | `/api/create-checkout-session` | `items` and `customer`; prices come from the server's own table |
| `POST` | `/api/newsletter` | `email` |
| `POST` | `/api/contact` | `name`, `email`, and a `message` |

Cart items are priced **server-side** from `MENU_PRICES` in `api-server.js`. A
client-supplied price is ignored, so a tampered price cannot change what is charged.

## Configuration

Set these for a production deployment:

- `SITE_URL` — the public base URL, used by `robots.txt`, `sitemap.xml` and the API
  CORS allowlist.
- `VITE_API_BASE` — optional API base, for a split front/back deployment. Leave unset
  when both are served from the same origin.
- `ALLOWED_ORIGINS` — optional comma-separated CORS origins for the API.
- `PORT` — the API port (defaults to 3001).
- `SITEMAP_LASTMOD` — optional `YYYY-MM-DD` override for the sitemap's `lastmod`,
  otherwise today's date.

Copy `.env.example` to `.env` as a starting point.

PowerShell example:

```powershell
$env:SITE_URL = "https://yourdomain.com"
$env:VITE_API_BASE = "https://api.yourdomain.com"
$env:ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
npm run build
```

## Notes

- Checkout runs in a labelled demo mode. The demo API never calls Stripe: it validates
  the order, prices it server-side, and returns a demo order id. No card is charged and
  the page says so. The client will use a publishable key if one is supplied through
  `window.LDV_STRIPE_PUBLISHABLE_KEY`, but the redirect is the only thing that key does.
- The service worker registers only over HTTPS and unregisters itself on localhost,
  so development never serves a stale cache.
- The restaurant, its address, its hours and its prices are sample content. The
  photographs of Lucca are real and credited in the footer. Details in `CONTENT.md`.

## Licence

The code is MIT (see `LICENSE`). The photographs of Lucca are **not** covered by that
licence: they come from Wikimedia Commons under their own Creative Commons licences,
recorded per file in `images/lucca/CREDITS.json`. The font carries its own licence.
