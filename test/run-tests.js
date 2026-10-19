#!/usr/bin/env node
'use strict';

/**
 * La Dolce Vita, test suite for the rebuilt site.
 *
 * Three passes:
 *   1. static , every page carries what it needs, and every picture exists on disk
 *   2. guards , no house-style tell has crept into the source
 *   3. api    , the demo server answers, validates, and charges its own prices
 *
 * Run: npm test
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGES = [
  'index.html',
  'menu.html',
  'gallery.html',
  'order.html',
  'reservations.html',
  'checkout.html',
  'success.html',
  '404.html',
  'offline.html'
];
const NAV = ['menu.html', 'gallery.html', 'order.html', 'reservations.html'];
const TEST_PORT = Number(process.env.TEST_PORT) || 3999;

let passed = 0;
let failed = 0;
const failures = [];

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

function section(title) {
  console.log(`\n${bold(title)}`);
}

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ${green('PASS')} ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  ${red('FAIL')} ${name}${detail ? dim(`, ${detail}`) : ''}`);
  }
}

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

/* ==========================================================================
   Pass 1, static structure
   ========================================================================== */

function passStatic() {
  section('Static structure');

  for (const page of PAGES) {
    const html = read(page);
    const label = page.padEnd(18);
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);

    check(`${label} title`, /<title>[^<]{5,}<\/title>/.test(html));
    check(`${label} language`, /<html[^>]+lang="en"/.test(html));
    check(`${label} viewport`, /name="viewport"/.test(html));
    check(`${label} stylesheet`, /href="css\/style\.css"/.test(html) && /href="fonts\/ldv-fonts\.css"/.test(html));
    check(`${label} header`, /<header[^>]*class="[^"]*\bsite-head\b/.test(html) && /class="wordmark"[^>]*href="index\.html"/.test(html));
    check(`${label} navigation`, NAV.every((n) => html.includes(`href="${n}"`)));
    check(`${label} footer`, /<footer class="foot/.test(html));
    check(`${label} at least four pictures`, imgs.length >= 4, `${imgs.length} found`);
    check(`${label} every picture described`, imgs.every((tag) => /\balt="/.test(tag)));
    check(`${label} no dead links to missing pages`, [...html.matchAll(/href="([^"#:]+\.html)"/g)].every((m) => exists(m[1])));

    // every referenced local file must exist on disk
    const urls = new Set();
    for (const m of html.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
      for (const part of m[1].split(',')) {
        const url = part.trim().split(/\s+/)[0];
        if (url && !/^https?:|^data:/.test(url)) urls.add(url);
      }
    }
    const missing = [...urls].filter((u) => !exists(u));
    check(`${label} referenced files exist`, missing.length === 0, missing.join(', '));
  }

  // the credits are real and present wherever Lucca is shown
  const credit = 'Wikimedia Commons';
  check('image credits on every page', PAGES.every((p) => read(p).includes(credit)));
  check('own photographs labelled as ours', read('gallery.html').includes('our own'));
}

/* ==========================================================================
   Pass 2, house-style guards
   ========================================================================== */
function passGuards() {
  section('House-style guards');

  const files = [...PAGES, 'css/style.css', 'js/script.js', 'js/checkout.js', 'sw.js'];
  const sources = files.map((f) => [f, read(f)]);

  // build the tells from parts so this file does not trip its own search
  const dash = String.fromCharCode(45);
  const tells = [
    ['resting elevation', 'box' + dash + 'shad' + 'ow'],
    ['gradient', 'linear' + dash + 'gradient'],
    ['fixed-width type', 'mono' + 'space'],
  ];

  for (const [label, needle] of tells) {
    const hits = sources.filter(([, text]) => text.includes(needle)).map(([f]) => f);
    check(`no ${label} in the site`, hits.length === 0, hits.join(', '));
  }

  const css = read('css/style.css');
  check('one typeface (Switzer)', /Switzer/.test(css) && !/Cormorant|Manrope|Playfair|Inter\b/.test(css));
  check('body copy is at least 16px', /--step-body:\s*1\.0625rem/.test(css));
  check('no banned cream/terracotta pair', !/#F6F1E6/i.test(css) && !/#C06038/i.test(css));
  check('one button shape (square)', /border-radius:\s*0/.test(css));
  check('a reduced-motion fallback', /prefers-reduced-motion/.test(css));
  check('service worker registered', read('js/script.js').includes("register('./sw.js')"));
  check('service worker caches the current pages', read('sw.js').includes('./menu.html'));

  // the installable surface: manifest, real icon files, theme colour
  const manifestRaw = read('manifest.json');
  const manifest = JSON.parse(manifestRaw);
  check('every page links the web manifest', PAGES.every((p) => read(p).includes('rel="manifest"')));
  check('every page declares the theme colour', PAGES.every((p) => read(p).includes('name="theme-color" content="#131110"')));
  check('manifest theme colour is the ground token', manifest.theme_color === '#131110', manifest.theme_color);
  const badIcons = manifest.icons.filter((i) => i.src.startsWith('data:') || !fs.existsSync(path.join(ROOT, i.src)));
  check('every manifest icon is a real file on disk', badIcons.length === 0, badIcons.map((i) => i.src).join(', '));

  // the two ES modules must parse
  for (const js of ['js/script.js', 'js/checkout.js']) {
    const out = spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: read(js),
      encoding: 'utf8'
    });
    check(`${js} parses`, out.status === 0, (out.stderr || '').split('\n')[0]);
  }

  // prices are in euro and the menu and order pages agree
  const menu = read('menu.html');
  const order = read('order.html');
  check('menu prices in euro', /€\d+/.test(menu) && !/\$\d/.test(menu));
  check('order prices in euro', /€\d+/.test(order) && !/\$\d/.test(order));
  const menuPrices = [...menu.matchAll(/class="dish-price num">€(\d+)/g)].map((m) => Number(m[1]));
  const orderPrices = [...order.matchAll(/class="dish-price num">€(\d+)/g)].map((m) => Number(m[1]));
  check('order prices are a subset of the menu', orderPrices.every((p) => menuPrices.includes(p)), `menu ${menuPrices} vs order ${orderPrices}`);
}

/* ==========================================================================
   Pass 3, the demo API
   ========================================================================== */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForApi(base, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await wait(250);
  }
  return false;
}

async function passApi() {
  section('Demo API');
  if (!exists('api-server.js')) {
    check('api-server.js present', false);
    return;
  }

  const server = spawn(process.execPath, ['api-server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: 'ignore'
  });

  const base = `http://127.0.0.1:${TEST_PORT}`;
  try {
    const up = await waitForApi(base);
    check('server starts and answers /api/health', up);
    if (!up) return;

    const health = await (await fetch(`${base}/api/health`)).json();
    check('health reports ok', health.status === 'ok');

    const avail = await (await fetch(`${base}/api/availability?date=2026-06-04`)).json();
    check('availability returns slots', avail.success === true && Array.isArray(avail.timeSlots) && avail.timeSlots.length > 0);
    check('every slot is shaped', avail.timeSlots.every((s) => typeof s.time === 'string' && typeof s.available === 'boolean'));

    const booking = await fetch(`${base}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-06-04', time: '19:30', partySize: 2, name: 'Test Guest', email: 'guest@example.com', phone: '+39 0583 000 000' })
    });
    const bookingBody = await booking.json();
    check('a valid reservation is accepted', booking.status === 200 && bookingBody.success === true && !!bookingBody.reservationId);

    const badBooking = await fetch(`${base}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '', time: '', partySize: 99, name: '', email: 'nope' })
    });
    check('an invalid reservation is rejected', badBooking.status === 400);

    // the server must ignore a client-supplied price and charge its own
    const order = await fetch(`${base}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'tortelli-lucchesi', name: 'Tortelli lucchesi', price: 1, qty: 2 }],
        customer: { name: 'Test Guest', phone: '+39 0583 000 000', address: 'Via Fillungo 12', city: 'Lucca', zip: '55100' }
      })
    });
    const orderBody = await order.json();
    check('checkout succeeds', order.status === 200 && orderBody.success === true);
    check('checkout is priced in euro', orderBody.currency === 'EUR');
    check('checkout charges the server price, not the client price', orderBody.amount === 28, `got ${orderBody.amount}`);

    const emptyOrder = await fetch(`${base}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [], customer: {} })
    });
    check('an empty order is rejected', emptyOrder.status === 400);
  } catch (error) {
    check('API pass completed', false, error.message);
  } finally {
    server.kill();
  }
}

/* ==========================================================================
   Run
   ========================================================================== */

(async () => {
  console.log(bold(`\nLA DOLCE VITA, ${PAGES.length} pages, three passes\n`));
  passStatic();
  passGuards();
  await passApi();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    console.log(red(`\nReview: ${failures.join(' · ')}\n`));
    process.exit(1);
  }
  console.log(green('\nAll good.\n'));
})();
