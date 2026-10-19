# Test infrastructure

`test/run-tests.js` is the whole suite: one file, no dependencies beyond Node
built-ins, about 300 lines. It is the honest replacement for two large stale suites
(`test/e2e-suite.js` and `test/challenger-m1-test.js`) that asserted the markup of an
earlier, abandoned redesign.

Run it with:

```bash
npm test
```

It exits `0` when everything passes and `1` when anything fails, listing the failures.

## Why it is built this way

The suite is deliberately small and finite. It checks the two things that break
quietly on a static site, and that a human is unlikely to catch by eye:

1. Structure that every page must carry (navigation, footer, stylesheet, pictures).
2. The API's validation and its pricing authority.

It does **not** try to re-implement a browser. Where a check needs a rendered page,
that job belongs to the skill's `inspect.mjs` (see `TEST_READY.md`), which drives real
Chrome. Static checks here are cheap and run on every commit; the browser checks are
slower and run before calling a piece of work done.

## The three passes

### Pass 1, static structure (101 checks)

For each of the nine pages, eleven checks:

- a real `<title>` of at least five characters
- `lang="en"` on `<html>`
- a viewport meta tag
- both stylesheets linked (`css/style.css`, `fonts/ldv-fonts.css`)
- a `<header class="site-head">` with a wordmark linking home
- all four navigation links present
- a `<footer class="foot">`
- at least four `<img>` elements (the skill's `few-pictures` rule fails a page
  below four pictures at 1100px and wider)
- every `<img>` carries an `alt` attribute
- no `href` to a local `.html` file that does not exist
- every locally referenced `src` and every `srcset` candidate exists on disk

Plus two project-level checks: every page credits Wikimedia Commons, and the gallery
says the kitchen photographs are our own.

### Pass 2, house-style guards (19 checks)

The tells that must not creep back into the source:

- no resting shadow, no gradient, no fixed-width type, anywhere
- one typeface (Switzer), and no didone/geometric substitutes
- body copy is at least 16px
- the banned cream-and-terracotta pair is absent
- one button shape (square, `border-radius: 0`)
- a `prefers-reduced-motion` fallback exists
- the service worker is registered and caches the current pages
- both ES modules parse (`node --input-type=module --check`)
- prices are in euro, and no dollar price appears, on the menu and order pages
- the order page's prices are a subset of the menu's
- every page links the web manifest and declares the ground as its theme colour
- the manifest's theme colour is the ground token, and every icon it names is a real
  file on disk, not a data URI

The tells are assembled from string fragments in the test file itself, so the test
does not trip the skill's own source linter while searching for them.

### Pass 3, the demo API (10 checks)

The suite spawns `api-server.js` on port 3999 (override with `TEST_PORT`), waits for
health, then asserts:

- the server starts and answers `/api/health` with `status: "ok"`
- `/api/availability` returns a non-empty `timeSlots` array, each slot shaped
  `{ time, available }`
- a valid reservation is accepted and returns a `reservationId`
- an invalid reservation (empty date and time, a party of 99, a malformed email) is
  rejected with HTTP 400
- a valid checkout succeeds and returns `currency: "EUR"`
- **the server charges its own price**: a cart that posts a tampered `price: 1` for
  `tortelli-lucchesi` (server price €14, quantity 2) is billed €28
- an empty cart is rejected with HTTP 400

The pricing check is the important one. It is the difference between a demo that
merely responds and one that would not let a client set its own prices.

## Adding a check

Keep it in one of the three passes, keep it deterministic, and prefer a boolean
assertion with a short message. If a check needs a rendered page, do not add a headless
browser here; write it down for the browser gate instead.
