# Project: La Dolce Vita, Lucca

A fictional trattoria, built as a portfolio piece. Nine static pages, one small
Express demo API, one service worker. No framework, no build step required to run it.

## The design direction

Drawn from the `design-taste-frontend` skill, direction **"the place carries it"**
(seed `1946510763`), saved in `docs/direction.json`.

The argument the site makes is the one thing a competitor cannot copy: *where the
restaurant is*. Lucca is the subject. The walls, the rooftops, the tower and the
piazza carry the page, and the food is shown inside them.

- **Idea:** on this page, the walls of Lucca and the dinner served inside them become
  the argument, carried by a full-bleed photograph.
- **Live thing:** a real-clock "tonight" module on the homepage, and a real
  availability picker on the reservations page, both fed by the demo API.

### Palette

Proportions from the dealt palette (a dark bracket, a light middle, one sparing
accent), colours taken from the subject rather than the deal:

| token | value | role |
|-------|-------|------|
| `--ground` | `#131110` | evening, warm near-black |
| `--ground-2` / `--ground-3` | `#1C1917` / `#292420` | raised dark surfaces |
| `--ink` / `--ink-muted` | `#F2F1EF` / `#A49C92` | text on the dark ground |
| `--paper` / `--paper-2` | `#E8E6E1` / `#DEDBD4` | the stone of the walls, by day |
| `--paper-ink` / `--paper-muted` | `#1A1815` / `#6C665E` | text on the light field |
| `--accent` / `--accent-deep` | `#7E2028` / `#66171E` | Sangiovese, the brick of the walls |

There is no cream-and-terracotta pairing, no violet, no gradient, and no glass.

### Type

One family, self-hosted: **Switzer** (`fonts/Switzer-400.woff2`, `Switzer-500.woff2`,
declared in `fonts/ldv-fonts.css`). No webfont is loaded from a third party.

Five steps, and no more:

| token | size | used for |
|-------|------|----------|
| `--step-small` | 14px | labels, notes, captions |
| `--step-body` | 17px | running text, controls |
| `--step-lead` | 24px | leads, dish names, card headings |
| `--step-head` | 40px | section headings |
| `--step-display` | 68px | hero and page titles (44px below 640px) |

### House style

One button shape, square (`border-radius: 0`), filled with the accent, never
outlined. No eyebrow labels, no index numbering, no hairline rules, no fixed-width
type, no resting shadows, no text shadows, no gradients. Pictures lead; type is set
plainly against them.

## Architecture

### Pages

| file | what it is |
|------|------------|
| `index.html` | hero, the room, one dish in three distances, the place, the evening, the visit card |
| `menu.html` | the printed carta, dietary filtering, a wine-pairing drawer |
| `gallery.html` | eight photographs, city and food, with honest captions |
| `order.html` | six dishes to collect, a live tally, checkout handoff |
| `checkout.html` | collection details, Stripe element (demo), order summary |
| `reservations.html` | dining zones, real availability, the request form |
| `success.html` | what the kitchen was told, read from session storage |
| `404.html`, `offline.html` | the two failure pages |

### Styles

One file, `css/style.css`, in sections: tokens, reset, layout, type, buttons,
header and drawer, hero, about, showcase, frames, reel, visit, footer, sub-pages,
forms, toasts, motion, responsive, reduced motion. It is the single source of every
design token and pattern.

### Behaviour

Two ES modules, both dependency-free and guarded, so one file serves every page:

- `js/script.js` — header, mobile drawer, scroll reveal, hero crossfade, the
  showcase stages, the dish reel, the real-clock "tonight" module, toasts, the cart
  store, menu filtering and the wine drawer, the reservations availability flow and
  submit, `[data-api]` forms, and the zones / success / retry helpers. Registers the
  service worker on secure origins only.
- `js/checkout.js` — reads the cart, renders the summary in euro, and submits to
  `/api/create-checkout-session`; falls back to a labelled demo mode when no Stripe
  key is configured.

Nothing in either module is required for the content to be read or navigated.

### The move: real width transitions

The homepage "one dish, three distances" section grows its frame with real `width`
and `height` transitions, not `transform: scale`. That is deliberate: a scaled
picture lies to the layout, and a pinned title can end up sitting on top of it. With
real dimensions the picture pushes the title instead, so the headline can never be
covered.

### Data

`api-server.js` is an Express 5 server with six routes and no database:

| route | behaviour |
|-------|-----------|
| `GET /api/health` | liveness |
| `GET /api/availability` | fixed sittings for a requested date |
| `POST /api/reservations` | validates date, time, party size (1 to 20), name, email, phone |
| `POST /api/create-checkout-session` | prices the cart from **server-side** `MENU_PRICES`, ignores any client-supplied price, returns `EUR` |
| `POST /api/newsletter`, `POST /api/contact` | validated, in-memory acknowledgements |

The server's own price table is the authority. A client that posts a tampered price
is still charged the server's price; `test/run-tests.js` asserts exactly that.

### Offline

`sw.js` caches the page shell, both modules, the stylesheet, the two Switzer files,
the manifest and the icons, and caches images at runtime. It is registered only over
HTTPS, and it unregisters itself on localhost so development never serves a stale
cache.

### Installable surface

`manifest.json` names the site for an install prompt, and `icons/` holds the mark: an
arch on wine red, as SVG plus 192px and 512px PNGs. The mark is a gateway in the walls,
drawn from the same two tokens as the rest of the site, not a stock icon or an emoji.
Every page links the manifest and declares `#131110` as its theme colour, so the browser
chrome matches the ground.

## Images

Two pipelines feed `images/build/` (76 files, about 10.5 MB):

1. **Real photographs of Lucca** (`images/lucca/`, seven files, provenance in
   `images/lucca/CREDITS.json`) drive the hero, the frames, the visit background and
   the sub-page bands.
2. **Generated kitchen and dish photographs** stand in for commissioned
   photography. They are used at section size, never as the hero, and never beside a
   named dish on the order page, because a generated plate and a specific dish would
   not match.

`scripts/optimize-images.mjs` (sharp) writes WebP at 640/800/1024/1400/2000/2400,
capped at the source width, plus one JPEG fallback per picture. Run it with
`npm run images`.

For what is real and what is invented, see `CONTENT.md`.

## Scripts

- `scripts/fetch-commons.mjs` / `list-commons.mjs` — look up and download Lucca
  photographs from Wikimedia Commons.
- `scripts/optimize-images.mjs` — the image pipeline described above.
- `scripts/generate-seo-files.cjs` — writes `robots.txt` and `sitemap.xml` from
  `SITE_URL`; runs automatically before a build.

## House rules, and where they are checked

Two gates from the skill, both run from the project root:

- `lint.mjs` — static source scan for the banned tells (shadows, gradients,
  fixed-width type, eyebrows, numbering, emoji, hairlines, glass, and the banned
  palettes). Current result: **0 FAIL, 0 WARN** over 16 files.
- `inspect.mjs` — renders the page in a real browser at 1440 / 768 / 390 and measures
  type scale, body size, contrast, headline line counts, covered and clipped text,
  broken images, side scroll, and the motion count. Current result: **0 FAIL on every
  page**; the remaining warnings are `no-footage` (defended in `TEST_READY.md`) and
  `side-scroll` on the homepage dish reel, which is a deliberate snap rail.

`npm test` runs the 130-check suite in `test/run-tests.js`.
