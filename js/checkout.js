document.addEventListener('DOMContentLoaded', () => {
  const bindZoomGuards = () => {
    let lastTouchEnd = 0;

    ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        event.preventDefault();
      }, { passive: false });
    });

    document.addEventListener('touchmove', (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 280) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    document.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    }, { passive: false });
  };

  bindZoomGuards();

  const CART_STORAGE_KEY = 'ldv-cart';
  const normalizeApiBase = (value) => value.replace(/\/+$/, '');
  const envBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).trim()
    : '';
  const windowBase = typeof window.LDV_API_BASE === 'string' ? window.LDV_API_BASE.trim() : '';
  const metaBase = document.querySelector('meta[name="ldv-api-base"]')?.getAttribute('content')?.trim() || '';
  const configuredApiBase = envBase || windowBase || metaBase;
  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const API_BASE = configuredApiBase
    ? normalizeApiBase(configuredApiBase)
    : (isLocalHost && window.location.port !== '3001' ? 'http://localhost:3001' : '');
  const apiUrl = (path) => `${API_BASE}${path}`;

  if (isLocalHost && 'serviceWorker' in navigator) {
    // Keep localhost development free from stale cached assets.
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => null);

    if ('caches' in window) {
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => null);
    }
  }

  const showToast = (message, type = 'success') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const cart = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total-amount');
  const checkoutForm = document.getElementById('checkout-form');
  const submitBtn = document.getElementById('submit-checkout');
  const stripeElementMount = document.getElementById('stripe-element');

  if (checkoutItems) {
    if (!cart.length) {
      checkoutItems.innerHTML = '<p class="checkout-empty">Your cart is empty. Please add items from the order page.</p>';
      if (submitBtn) {
        submitBtn.disabled = true;
      }
    } else {
      let total = 0;
      cart.forEach((item) => {
        total += Number(item.price) * Number(item.qty);
        const row = document.createElement('div');
        row.className = 'checkout-item';
        row.innerHTML = `
          <span class="checkout-item__name">${item.name} × ${item.qty}</span>
          <span class="checkout-item__price">$${(item.price * item.qty).toFixed(2)}</span>
        `;
        checkoutItems.appendChild(row);
      });

      if (checkoutTotal) {
        checkoutTotal.textContent = `$${total.toFixed(2)}`;
      }
    }
  }

  let stripe;
  const STRIPE_PUBLISHABLE_KEY = window.LDV_STRIPE_PUBLISHABLE_KEY || '';

  if (window.Stripe && STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.startsWith('pk_') && stripeElementMount) {
    try {
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      const elements = stripe.elements();
      const cardElement = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1A1A1A',
            fontFamily: 'Inter, sans-serif',
            '::placeholder': { color: '#9B9590' }
          },
          invalid: { color: '#C44040' }
        }
      });

      cardElement.mount('#stripe-element');

      cardElement.on('change', (event) => {
        const errorEl = document.getElementById('card-errors');
        if (errorEl) {
          errorEl.textContent = event.error ? event.error.message : '';
        }
      });
    } catch {
      stripe = null;
    }
  } else if (stripeElementMount) {
    stripeElementMount.innerHTML = '<p class="checkout-note">Demo mode: secure card capture is disabled in this portfolio build.</p>';
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!cart.length) {
        showToast('Your cart is empty.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';
      }

      const payload = {
        items: cart,
        customer: {
          name: document.getElementById('checkout-name')?.value?.trim(),
          phone: document.getElementById('checkout-phone')?.value?.trim(),
          address: document.getElementById('checkout-address')?.value?.trim(),
          city: document.getElementById('checkout-city')?.value?.trim(),
          zip: document.getElementById('checkout-zip')?.value?.trim(),
          notes: document.getElementById('checkout-notes')?.value?.trim()
        }
      };

      try {
        const response = await fetch(apiUrl('/api/create-checkout-session'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to process checkout.');
        }

        if (stripe && data.sessionId) {
          const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
          if (result?.error) {
            throw new Error(result.error.message);
          }
          return;
        }

        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch (error) {
          console.warn('LocalStorage remove failed:', error);
        }
        window.location.href = data.redirectUrl || `success.html?type=order&id=${encodeURIComponent(data.orderId || '')}`;
      } catch (error) {
        showToast(error.message || 'Unable to process checkout. Please try again.', 'error');

        if (submitBtn) {
          submitBtn.disabled = false;
          const btnText = submitBtn.querySelector('.btn-text');
          const btnLoading = submitBtn.querySelector('.btn-loading');
          if (btnText) btnText.style.display = 'inline';
          if (btnLoading) btnLoading.style.display = 'none';
        }
      }
    });
  }

  const bindPreloader = () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) {
      return;
    }

    const dismiss = () => {
      preloader.classList.add('fade-out-loader');
    };

    if (document.readyState === 'complete') {
      setTimeout(dismiss, 300);
    } else {
      window.addEventListener('load', () => {
        setTimeout(dismiss, 700);
      });
    }

    setTimeout(dismiss, 4000);
  };

  const bindCustomCursor = () => {
    const cursor = document.querySelector('.custom-cursor');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!cursor || isTouchDevice) {
      document.body.classList.remove('cursor-enabled');
      if (cursor) {
        cursor.style.display = 'none';
      }
      document.body.style.cursor = 'auto';
      return;
    }

    document.body.classList.add('cursor-enabled');

    document.addEventListener('mousemove', (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });

    document.querySelectorAll('a, button, .btn-primary, .btn-secondary, .btn-reservations, .btn-add').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  };

  bindPreloader();
  bindCustomCursor();

  const header = document.getElementById('navbar');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          header?.classList.add('scrolled');
        } else {
          header?.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
});
