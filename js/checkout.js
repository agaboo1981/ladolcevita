/* La Dolce Vita, checkout page.
   Shares the cart written by js/script.js (localStorage "ldv-cart"). */

const CART_KEY = 'ldv-cart';

const apiBase = () => {
  const meta = document.querySelector('meta[name="ldv-api-base"]')?.content?.trim() || '';
  const configured = (import.meta.env?.VITE_API_BASE || '').trim() || (window.LDV_API_BASE || '').trim() || meta;
  if (configured) return configured.replace(/\/+$/, '');
  if (['localhost', '127.0.0.1'].includes(location.hostname) && location.port !== '3001') return 'http://localhost:3001';
  return '';
};
const API = apiBase();
const api = (path) => `${API}${path}`;

const euro = (n) => `€${Number(n).toFixed(2)}`;

const readCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const toast = (message, bad = false) => {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast${bad ? ' toast--bad' : ''}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 5000);
};

const cart = readCart();
const itemsBox = document.getElementById('checkout-items');
const totalBox = document.getElementById('checkout-total-amount');
const form = document.getElementById('checkout-form');
const submit = document.getElementById('submit-checkout');
const stripeMount = document.getElementById('stripe-element');
const cardErrors = document.getElementById('card-errors');

const total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

if (itemsBox) {
  if (!cart.length) {
    itemsBox.innerHTML = '<p class="checkout-empty">Nothing here yet. Add something on the order page and it will appear.</p>';
    if (submit) submit.disabled = true;
  } else {
    itemsBox.innerHTML = cart.map((item) => `
      <div class="checkout-item">
        <span>${Number(item.qty)} × ${String(item.name)}</span>
        <span class="checkout-item__price">${euro(Number(item.price) * Number(item.qty))}</span>
      </div>`).join('');
  }
}
if (totalBox) totalBox.textContent = euro(total);

/* Card capture is optional: without a publishable key the page says so plainly. */
let stripe = null;
const PK = window.LDV_STRIPE_PUBLISHABLE_KEY || '';
if (window.Stripe && PK.startsWith('pk_') && stripeMount) {
  try {
    stripe = window.Stripe(PK);
    const card = stripe.elements().create('card', {
      style: { base: { fontSize: '16px', color: '#1A1815', fontFamily: 'Switzer, sans-serif' } },
    });
    card.mount('#stripe-element');
    card.on('change', (event) => { if (cardErrors) cardErrors.textContent = event.error ? event.error.message : ''; });
  } catch { stripe = null; }
} else if (stripeMount) {
  stripeMount.innerHTML = '<p class="checkout-note">Demo build: no card is charged. Press the button and we will hand the order to the kitchen.</p>';
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!cart.length) { toast('Your basket is empty.', true); return; }

    const label = submit?.querySelector('.btn-text');
    const loading = submit?.querySelector('.btn-loading');
    if (submit) submit.disabled = true;
    if (label) label.hidden = true;
    if (loading) loading.hidden = false;

    const payload = {
      items: cart,
      customer: {
        name: document.getElementById('checkout-name')?.value?.trim(),
        phone: document.getElementById('checkout-phone')?.value?.trim(),
        address: document.getElementById('checkout-address')?.value?.trim(),
        city: document.getElementById('checkout-city')?.value?.trim(),
        zip: document.getElementById('checkout-zip')?.value?.trim(),
        notes: document.getElementById('checkout-notes')?.value?.trim(),
      },
    };

    try {
      const res = await fetch(api('/api/create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'We could not take that order.');

      localStorage.removeItem(CART_KEY);

      if (stripe && data.sessionId) {
        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result?.error) throw new Error(result.error.message);
        return;
      }
      location.href = data.redirectUrl || `success.html?type=order&id=${encodeURIComponent(data.orderId || '')}`;
    } catch (error) {
      toast(error.message || 'That did not go through. Please try again.', true);
      if (submit) submit.disabled = false;
      if (label) label.hidden = false;
      if (loading) loading.hidden = true;
    }
  });
}
