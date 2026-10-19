# Test status

**Suite:** `test/run-tests.js`
**Result:** 130 passed, 0 failed
**Command:** `npm test`

```
LA DOLCE VITA · 9 pages, three passes

130 passed, 0 failed
```

## The three passes

| pass | checks | what it proves |
|------|:------:|----------------|
| static structure | 101 | every page has its title, stylesheet, header, navigation, footer, four or more pictures, described pictures, no dead links, and every referenced file on disk |
| house-style guards | 19 | no shadow, gradient or fixed-width type; one typeface; body at least 16px; square buttons; reduced-motion fallback; the service worker is wired; both modules parse; prices are in euro and the order page agrees with the menu; the manifest is linked, on-brand, and its icons exist |
| demo API | 10 | the server starts, validates reservations, prices in euro, **and charges its own price even when the client sends a tampered one** |

Full description in `TEST_INFRA.md`.

## Browser gate (the skill's `inspect.mjs`)

Served and rendered in real Chrome at 1440, 768 and 390px, all nine pages:

| page | FAIL | WARN |
|------|:----:|------|
| `index.html` | 0 | `no-footage`, `side-scroll` |
| `menu.html` | 0 | `no-footage` |
| `gallery.html` | 0 | `no-footage` |
| `order.html` | 0 | `no-footage` |
| `reservations.html` | 0 | `no-footage` |
| `checkout.html` | 0 | `no-footage` |
| `success.html` | 0 | `no-footage`, `still-page` |
| `404.html` | 0 | `no-footage`, `still-page` |
| `offline.html` | 0 | `no-footage`, `still-page` |

Source lint (`lint.mjs`, 16 files): **0 FAIL, 0 WARN**.

Measured on the homepage: hero headline 68px (4.7vw), one line; type sizes in use
14 / 17 / 24 / 40 / 68; body 17px; one typeface (Switzer 100%); 16 pictures; a single
picture holding the whole first viewport.

## The three warnings, and why they stand

A warning is not a failure, but it should be defended rather than ignored.

### `no-footage`, on every page

No video anywhere. The skill asks for one honest clip: *the place, the material, the
process*. There is no openly-licensed clip that fits this subject. The skill's own
asset helper (`scripts/assets.mjs --video`) was run and returned only three
irrelevant results: a video of the wrong town (Lucca Sicula, in Sicily), a folk-museum
piece, and a clip about Armenian pasta. Dropping an unrelated clip onto a page about
Lucca would be exactly the kind of dishonesty this rebuild set out to remove, so the
page carries motion instead: a three-frame slow crossfade of the walls at dusk, and a
drift on the active frame. Video is the one thing the site does without.

### `side-scroll`, on the homepage

One row scrolls sideways past its edge: the dish reel, "one evening, hour by hour".
This is deliberate and signposted, not an accident of layout. It is a snap rail with
visible earlier/later controls, a progress bar, and six numbered sittings from two
o'clock to ten o'clock that read naturally left to right, like the evening itself. The
direction blueprint called for it. At 768px and below it becomes a swipe rail, which
is the expected gesture there. There is no horizontal overflow of the *page*; only
this one rail moves, by design.

### `still-page`, on the three utility pages

`success.html`, `404.html` and `offline.html` move 9 or 10 elements on load and
scroll, against a threshold of 16 for a clean score. Each of those pages is a single
short message and a band of four photographs; every part of them already has an
entrance (the heading, the message, the actions, and each figure with its caption). To
push the count past 16 would mean inventing motion for its own sake on a page whose
whole job is to say one thing and get out of the way. The threshold is met in spirit:
nothing on those pages arrives unanimated.

Every other page clears 16.

## What the suite does not cover

- **Visual quality.** The measurements pass, which is the floor, not the grade. The
  rendered screenshots were read by eye at 1440, 768 and 390 before this was called
  done.
- **Cross-browser behaviour.** Chrome only.
- **The Stripe path.** Checkout is exercised in demo mode; a live Stripe key path is
  not tested.
- **Accessibility auditing.** No automated axe-style pass is run. Focus styles,
  `aria-expanded`, `aria-current`, `aria-selected`, live regions, alt text and the skip
  link are all present and checked for existence, not for a score.
