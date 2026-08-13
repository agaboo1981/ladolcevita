// La Dolce Vita — chrome propagation
// Rebuilds the shared header + footer across all pages, drops the cutlery
// preloader and Font Awesome (AI-template tells), normalizes fonts + a11y.
// Run from the project root:  node scripts/redesign_chrome.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = [
  'index.html', 'menu.html', 'gallery.html', 'order.html',
  'reservations.html', 'checkout.html', 'success.html', '404.html', 'offline.html',
];

const SEAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">\n' +
  '                    <path d="M12 21v-9"/>\n' +
  '                    <path d="M12 12c-2.4 0-4-1.5-4-4 2.4 0 4 1.5 4 4z"/>\n' +
  '                    <path d="M12 12c2.4 0 4-1.5 4-4-2.4 0-4 1.5-4 4z"/>\n' +
  '                    <path d="M12 16c-2 0-3.4-1.3-3.4-3.2 2 0 3.4 1.3 3.4 3.2z"/>\n' +
  '                </svg>';

const headerFor = (page) => {
  const act = (p) => (page === p ? ' active' : '');
  const resAct = page === 'reservations.html' ? ' active' : '';
  return `    <header id="navbar">
        <div class="masthead">
            <a href="index.html" class="brand" aria-label="La Dolce Vita — home">
                <span class="brand-seal" aria-hidden="true">${SEAL}</span>
                <span class="brand-text">
                    <span class="brand-name">La Dolce Vita</span>
                    <span class="brand-tag">Tuscan Dining Salon · Est. 1985</span>
                </span>
            </a>

            <nav class="nav-index" aria-label="Primary">
                <a href="menu.html" class="nav-item${act('menu.html')}">Menu</a>
                <a href="gallery.html" class="nav-item${act('gallery.html')}">Gallery</a>
                <a href="order.html" class="nav-item${act('order.html')}">Order</a>
            </nav>

            <div class="header-actions">
                <span class="hours-chip"><span class="dot"></span>Tue–Sun · 5–10pm</span>
                <a href="reservations.html" class="btn-reserve${resAct}">Reserve a table <span class="arrow">→</span></a>
                <button class="nav__toggle" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
            </div>
        </div>

        <div class="mobile-menu">
            <ul>
                <li><a href="menu.html" class="nav-item-m${act('menu.html')}">Menu</a></li>
                <li><a href="gallery.html" class="nav-item-m${act('gallery.html')}">Gallery</a></li>
                <li><a href="order.html" class="nav-item-m${act('order.html')}">Order</a></li>
                <li><a href="reservations.html" class="mobile-btn-reserve${resAct}">Reserve a table</a></li>
            </ul>
        </div>
    </header>`;
};

const FOOTER = `    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-info">
                    <a href="index.html" class="footer-logo">La Dolce Vita</a>
                    <p>Tuscan dining since 1985. Pasta rolled by hand each morning, estate wines, and a room that feels looked after.</p>
                </div>
                <div class="footer-links-col">
                    <h4>Visit</h4>
                    <p>123 Via Roma, Culinary District</p>
                    <p>(555) 123-4567</p>
                    <p>Tue–Sun · 5–10pm</p>
                </div>
                <div class="footer-links-col">
                    <h4>Explore</h4>
                    <ul class="footer-links">
                        <li><a href="menu.html" class="footer-link">The Menu</a></li>
                        <li><a href="gallery.html" class="footer-link">Gallery</a></li>
                        <li><a href="reservations.html" class="footer-link">Reservations</a></li>
                    </ul>
                </div>
                <div class="footer-links-col">
                    <h4>Takeaway</h4>
                    <ul class="footer-links">
                        <li><a href="order.html" class="footer-link">Order for pickup</a></li>
                        <li><a href="checkout.html" class="footer-link">Checkout</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-legal">
                <span>© 2026 La Dolce Vita · Lucca, Tuscany</span>
                <span>Pasta rolled by hand each morning · Sauce simmers from noon</span>
            </div>
        </div>
    </footer>`;

const SKIP = `    <a href="#main-content" class="skip-to-content">Skip to content</a>`;

const strip = (html) => html
  // header block
  .replace(/<header id="navbar">[\s\S]*?<\/header>/, 'HEADER')
  // footer block
  .replace(/<footer class="footer">[\s\S]*?<\/footer>/, 'FOOTER')
  // preloader
  .replace(/^\s*<div id="preloader">[\s\S]*?<\/div>\s*$/m, '')
  .replace(/<div id="preloader">[\s\S]*?<\/div>/, '')
  // custom cursor
  .replace(/^\s*<div class="custom-cursor"[^>]*><\/div>\s*$/m, '')
  .replace(/<div class="custom-cursor"[^>]*><\/div>/, '')
  // font awesome
  .replace(/^\s*<link rel="stylesheet" href="vendor\/fontawesome\/css\/all\.min\.css">\s*$/m, '');
  // note: some .replace calls above only run once; .m flag helps per-line.

for (const page of PAGES) {
  const path = join(process.cwd(), page);
  let html = readFileSync(path, 'utf8');

  // 1. drop chrome cruft + fonts-awesome + inline FA remnants
  html = strip(html);

  // 2. insert new header
  const n = html.indexOf('HEADER');
  if (n === -1) throw new Error(`no header anchor in ${page}`);
  html = html.replace('HEADER', headerFor(page));

  // 3. insert new footer
  const fi = html.indexOf('FOOTER');
  if (fi === -1) throw new Error(`no footer anchor in ${page}`);
  html = html.replace('FOOTER', FOOTER);

  // 4. ensure fonts stylesheet present (insert before css/style.css)
  if (!html.includes('fonts/ldv-fonts.css')) {
    html = html.replace('<link rel="stylesheet" href="css/style.css">',
      '<link rel="stylesheet" href="fonts/ldv-fonts.css">\n    <link rel="stylesheet" href="css/style.css">');
  }

  // 5. normalize the focal/main region for skip-link accessibility
  //    (checkout/success/404/offline lack a skip link + main-content)
  if (!html.includes('class="skip-to-content"')) {
    html = html.replace('<body>', `<body>\n${SKIP}`);
  }
  if (!html.includes('id="main-content"')) {
    html = html.replace(/<main(\s+id="main")?\s*>/i, '<main id="main-content">');
  }

  // 6. checkout.html — remove its now-redundant inline style block (covered in css/style.css)
  if (page === 'checkout.html') {
    html = html.replace(/\s*<style>[\s\S]*?<\/style>/, '');
  }

  writeFileSync(path, html, 'utf8');
  console.log(`✓ ${page}`);
}
console.log('Chrome propagated.');