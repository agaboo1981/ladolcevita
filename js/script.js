/* ==========================================================================
   La Dolce Vita, page behaviour
   Vanilla ES module. Every block guards for the elements it needs, so one
   file serves every page. Nothing here is required for content to be read.
   ========================================================================== */

document.documentElement.classList.add('js');

const CART_KEY = 'ldv-cart';
const OPEN_MIN = 17 * 60;       // 17:00
const LAST_MIN = 21 * 60 + 30;  // 21:30
const CLOSE_MIN = 22 * 60;      // 22:00

/* ---- API base (same origin by default) ---- */
const getApiBase = () => {
  const configured = (import.meta.env?.VITE_API_BASE || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (['localhost', '127.0.0.1'].includes(location.hostname)) return 'http://localhost:3001';
  return '';
};
const API = getApiBase();
const api = (path) => `${API}${path}`;

/* ---- Small helpers ---- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let lockCount = 0;
let savedPad = '';
function lockScroll() {
  if (lockCount++ > 0) return;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  savedPad = document.body.style.paddingRight;
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  if (--lockCount > 0) return;
  lockCount = 0;
  document.body.style.overflow = '';
  document.body.style.paddingRight = savedPad;
}

/* ==========================================================================
   Header + mobile drawer
   ========================================================================== */
function initHeader() {
  const head = $('#siteHead');
  if (!head) return;
  const hasHero = !!$('.hero');
  const onScroll = () => {
    const solid = !hasHero || window.scrollY > 50;
    head.classList.toggle('is-solid', solid);
    head.classList.toggle('is-bare', hasHero && !solid);
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const toggle = $('.nav-toggle', head);
  const drawer = $('#drawer');
  if (!toggle || !drawer) return;
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('open', open);
    open ? lockScroll() : unlockScroll();
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', drawer).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

/* ==========================================================================
   Reveal on scroll
   ========================================================================== */
function initReveal() {
  const items = $$('.rise');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const group = entry.target.parentElement ? $$('.rise', entry.target.parentElement) : [entry.target];
      const i = group.indexOf(entry.target);
      entry.target.style.transitionDelay = `${Math.max(0, i) * 70}ms`;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  items.forEach((el) => io.observe(el));
}

/* ==========================================================================
   Hero, the slow crossfade (the signature move)
   ========================================================================== */
function initHero() {
  const frames = $$('.hero-frame');
  if (frames.length < 2) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  const advance = () => {
    frames[i].classList.remove('is-on');
    i = (i + 1) % frames.length;
    const img = $('img', frames[i]);
    // restart the drift
    if (img) { img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
    frames[i].classList.add('is-on');
  };
  setInterval(() => { if (!document.hidden) advance(); }, 6500);
}

/* ==========================================================================
   Showcase, one frame, three distances
   ========================================================================== */
function initShowcase() {
  const root = $('.showcase');
  if (!root) return;
  const rail = $('.showcase-rail', root);
  const step = () => {
    const rect = rail.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
    const stage = p < 0.34 ? '1' : p < 0.67 ? '2' : '3';
    if (root.dataset.stage !== stage) root.dataset.stage = stage;
  };
  step();
  addEventListener('scroll', step, { passive: true });
  addEventListener('resize', step);
}

/* ==========================================================================
   Reel, the evening, left to right
   ========================================================================== */
function initReel() {
  const row = $('#reelRow');
  if (!row) return;
  const bar = $('.reel-progress span');
  const update = () => {
    const sw = row.scrollWidth;
    const cw = row.clientWidth;
    const vis = sw > 0 ? (cw / sw) * 100 : 100;
    const pos = sw > cw ? row.scrollLeft / (sw - cw) : 0;
    const left = pos * (100 - vis);
    if (bar) { bar.style.width = `${vis}%`; bar.style.left = `${left}%`; }
  };
  row.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  const col = $('.reel-col', row);
  const delta = () => (col ? col.getBoundingClientRect().width + 32 : 312);
  $$('[data-reel]').forEach((btn) => btn.addEventListener('click', () => {
    row.scrollBy({ left: (btn.dataset.reel === 'next' ? 1 : -1) * delta(), behavior: 'smooth' });
  }));
  update();
}

/* ==========================================================================
   Tonight, computed from the real clock
   ========================================================================== */
function initTonight() {
  const el = $('#tonightValue');
  if (!el) return;
  const box = el.closest('.tonight');
  const now = new Date();
  const isMonday = now.getDay() === 1;
  const mins = now.getHours() * 60 + now.getMinutes();
  let text;
  let closed = false;
  if (isMonday) {
    text = 'Closed on Mondays. We open again tomorrow at 17:00.';
    closed = true;
  } else if (mins < OPEN_MIN) {
    text = `Open from 17:00, in about ${Math.max(1, Math.round((OPEN_MIN - mins) / 60))} hour${OPEN_MIN - mins >= 120 ? 's' : ''}.`;
  } else if (mins <= LAST_MIN) {
    text = 'Open now. The last table is taken at 21:30.';
  } else if (mins <= CLOSE_MIN) {
    text = 'Open now. The kitchen has stopped taking orders.';
  } else {
    text = 'Closed for tonight. We open again tomorrow at 17:00.';
    closed = true;
  }
  el.innerHTML = `<span class="t-state"><span class="t-dot"></span>${text}</span>`;
  if (box) box.classList.toggle('is-closed', closed);
}

/* ==========================================================================
   Toasts
   ========================================================================== */
function toast(message, bad = false) {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast${bad ? ' toast--bad' : ''}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 4600);
}

/* ==========================================================================
   Cart (order + checkout pages share one store)
   ========================================================================== */
const readCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
};
const writeCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  dispatchEvent(new CustomEvent('cart:change', { detail: cart }));
};
const addToCart = (item) => {
  const cart = readCart();
  const found = cart.find((x) => x.id === item.id);
  if (found) found.qty += 1; else cart.push({ ...item, qty: 1 });
  writeCart(cart);
};

function initOrder() {
  const tally = $('#tally');
  if (!tally) return;
  const money = (n) => `€${n.toFixed(2)}`;

  const render = () => {
    const cart = readCart();
    if (!cart.length) {
      tally.innerHTML = '<h2>Your order</h2><p class="tally-empty">Nothing yet. Add a dish and it will appear here.</p>';
      return;
    }
    const rows = cart.map((item) => `
      <div class="tally-row">
        <span>${item.qty} × ${item.name}</span>
        <span>${money(item.price * item.qty)}</span>
      </div>`).join('');
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    tally.innerHTML = `<h2>Your order</h2>${rows}
      <div class="tally-total"><span>Total</span><span>${money(total)}</span></div>
      <label class="sr-only" for="tally-note">Note for the kitchen</label>
      <p class="note" style="margin-top:14px;">Collect from Via Fillungo 42, Tuesday to Sunday, 17:00–22:00.</p>
      <a class="btn" href="checkout.html">Go to checkout <span class="arrow" aria-hidden="true">→</span></a>`;
  };

  $$('[data-add]').forEach((btn) => btn.addEventListener('click', () => {
    addToCart({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
    });
    toast(`${btn.dataset.name} added.`);
    render();
  }));
  render();
}

/* ==========================================================================
   Menu, filtering + the wine drawer
   ========================================================================== */
function initMenu() {
  const chips = $$('.chip[data-filter]');
  const dishes = $$('.dish');
  if (chips.length && dishes.length) {
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      dishes.forEach((dish) => {
        const diets = (dish.dataset.diet || '').split(/\s+/);
        const out = filter !== 'all' && !diets.includes(filter);
        dish.dataset.filteredOut = String(out);
      });
    }));
  }

  const drawer = $('#wineDrawer');
  if (!drawer) return;
  const openBtn = (el) => {
    const name = el.dataset.wineName;
    const note = el.dataset.wineNote;
    if (name) $('#wineName').textContent = name;
    if (note) $('#wineNote').textContent = note;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.setAttribute('data-open', '');
    lockScroll();
    $('.drawer-close', drawer)?.focus();
  };
  const close = () => {
    drawer.removeAttribute('data-open');
    drawer.setAttribute('aria-hidden', 'true');
    unlockScroll();
  };
  $$('[data-open-wine]').forEach((el) => el.addEventListener('click', () => openBtn(el)));
  $$('[data-drawer-close]', drawer).forEach((el) => el.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.hasAttribute('data-open')) close(); });
}

/* ==========================================================================
   Reservations, real availability, then submit
   ========================================================================== */
function initReservations() {
  const slotsBox = $('#slots');
  const dateInput = $('#res-date');
  const form = $('#reservation-form');
  if (!form) return;

  let chosenTime = '';
  const renderSlots = (slots, note) => {
    if (!slotsBox) return;
    slotsBox.innerHTML = '';
    slots.forEach((slot) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.textContent = slot.time;
      b.disabled = !slot.available;
      b.setAttribute('aria-pressed', 'false');
      if (!slot.available) b.setAttribute('aria-label', `${slot.time}, fully booked`);
      b.addEventListener('click', () => {
        $$('.slot', slotsBox).forEach((s) => s.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        chosenTime = slot.time;
      });
      slotsBox.appendChild(b);
    });
    const n = $('#slotsNote');
    if (n) n.textContent = note || 'Times shown as of just now.';
  };

  const loadAvailability = async () => {
    if (!slotsBox) return;
    const date = dateInput ? dateInput.value : '';
    if (date) {
      const day = new Date(`${date}T12:00:00`).getDay();
      if (day === 1) { renderSlots([], 'We are closed on Mondays. Please choose another day.'); return; }
    }
    try {
      const res = await fetch(api(`/api/availability?date=${encodeURIComponent(date)}`));
      const data = await res.json();
      renderSlots(data.timeSlots || []);
    } catch {
      renderSlots([
        { time: '17:00', available: true }, { time: '18:00', available: true },
        { time: '19:00', available: true }, { time: '20:00', available: true },
        { time: '21:00', available: true },
      ], 'Live availability is offline, these are our usual sittings.');
    }
  };

  if (dateInput) {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.min = today;
    dateInput.addEventListener('change', loadAvailability);
  }
  loadAvailability();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: (data.get('name') || '').toString().trim(),
      email: (data.get('email') || '').toString().trim(),
      phone: (data.get('phone') || '').toString().trim(),
      date: (data.get('date') || '').toString(),
      time: chosenTime || (data.get('time') || '').toString(),
      partySize: Number(data.get('partySize') || 2),
      requests: (data.get('requests') || '').toString().trim(),
    };
    if (!payload.time) { toast('Choose a time, or pick one from the list.', true); return; }
    if (payload.partySize > 8) { toast('For more than eight, please call us.', true); return; }
    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = 'Sending…';
    try {
      const res = await fetch(api('/api/reservations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      if (!res.ok || !out.success) throw new Error(out.message || 'Something went wrong.');
      toast(`Thank you, ${payload.name.split(' ')[0]}, we have your request for ${payload.partySize} at ${payload.time}.`);
      form.reset();
      chosenTime = '';
      $$('.slot', slotsBox || document).forEach((s) => s.setAttribute('aria-pressed', 'false'));
      loadAvailability();
    } catch (err) {
      toast(err.message || 'We could not send that. Please call us.', true);
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });
}

/* ==========================================================================
   Newsletter / contact (small, same-origin API)
   ========================================================================== */
function initSimpleForms() {
  $$('[data-api]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      const submit = $('button[type="submit"]', form);
      const label = submit ? submit.textContent : '';
      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
      try {
        const res = await fetch(api(form.dataset.api), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const out = await res.json();
        if (!res.ok || !out.success) throw new Error(out.message || 'Something went wrong.');
        toast(out.message || 'Thank you.');
        form.reset();
      } catch (err) {
        toast(err.message || 'That did not send. Please try again.', true);
      } finally {
        if (submit) { submit.disabled = false; submit.textContent = label; }
      }
    });
  });
}

/* ==========================================================================
   Dining zones (reservations)
   ========================================================================== */
function initZones() {
  const zones = $$('.zone');
  if (!zones.length) return;
  const hidden = $('#res-zone');
  zones.forEach((zone) => zone.addEventListener('click', () => {
    zones.forEach((other) => other.setAttribute('aria-selected', String(other === zone)));
    if (hidden) hidden.value = zone.dataset.zone || '';
  }));
}

/* ==========================================================================
   Thank-you page, reads what the kitchen was told
   ========================================================================== */
function initSuccess() {
  const title = $('#success-title');
  if (!title) return;
  const params = new URLSearchParams(location.search);
  const type = params.get('type');
  const id = params.get('id');
  const message = $('#success-message');
  const reference = $('#success-reference');
  if (type === 'order') {
    title.textContent = 'Grazie mille.';
    if (message) message.textContent = 'Your order has reached the kitchen. We will confirm it with you before you collect.';
  }
  if (id && reference) {
    reference.hidden = false;
    reference.textContent = `Reference ${id}`;
  }
}

/* ==========================================================================
   Offline page
   ========================================================================== */
function initRetry() {
  const retry = $('#retry');
  if (retry) retry.addEventListener('click', () => location.reload());
}

/* ==========================================================================
   Service worker, offline pages and cached pictures.
   Skipped on localhost so development never serves a stale cache.
   ========================================================================== */
function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  if (local || location.protocol !== 'https:') {
    navigator.serviceWorker.getRegistrations?.().then((list) => list.forEach((r) => r.unregister())).catch(() => {});
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

/* ---- boot ---- */
initHeader();
initReveal();
initHero();
initShowcase();
initReel();
initTonight();
initOrder();
initMenu();
initZones();
initReservations();
initSimpleForms();
initSuccess();
initRetry();
initServiceWorker();
