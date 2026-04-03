document.addEventListener('DOMContentLoaded', () => {

  // --- Cart Data ---
  const cart = JSON.parse(localStorage.getItem('ldv-cart') || '[]');

  // --- Render Order Summary ---
  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total-amount');

  if (checkoutItems && cart.length > 0) {
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.qty;
      const row = document.createElement('div');
      row.className = 'checkout-item';
      row.innerHTML = `
        <span class="checkout-item__name">${item.name} × ${item.qty}</span>
        <span class="checkout-item__price">$${(item.price * item.qty).toFixed(2)}</span>
      `;
      checkoutItems.appendChild(row);
    });
    if (checkoutTotal) checkoutTotal.textContent = `$${total.toFixed(2)}`;
  } else if (checkoutItems) {
    checkoutItems.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem 0;">Your cart is empty.</p>';
  }

  // --- Stripe Integration ---
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_key_here';

  let stripe;
  let cardElement;

  try {
    if (window.Stripe) {
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      const elements = stripe.elements();
      cardElement = elements.create('card', {
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
        if (event.error) {
          errorEl.textContent = event.error.message;
        } else {
          errorEl.textContent = '';
        }
      });
    }
  } catch (e) {
    console.log('Stripe not available — using fallback checkout');
  }

  // --- Form Submission ---
  const checkoutForm = document.getElementById('checkout-form');
  const submitBtn = document.getElementById('submit-checkout');

  const createToast = (message, type = 'success') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>'}</span>
      <span class="toast__message">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('toast--visible'), 10);
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  };

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        createToast('Your cart is empty.', 'error');
        return;
      }

      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';
      }

      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            customer: {
              name: document.getElementById('checkout-name').value,
              phone: document.getElementById('checkout-phone').value,
              address: document.getElementById('checkout-address').value,
              city: document.getElementById('checkout-city').value,
              zip: document.getElementById('checkout-zip').value,
              notes: document.getElementById('checkout-notes').value
            }
          })
        });

        if (!response.ok) throw new Error('Failed to create checkout session');

        const { sessionId } = await response.json();

        if (stripe && sessionId) {
          const { error } = await stripe.redirectToCheckout({ sessionId });
          if (error) throw error;
        } else {
          localStorage.removeItem('ldv-cart');
          window.location.href = 'success.html';
        }
      } catch (error) {
        console.error('Checkout error:', error);
        if (submitBtn) {
          submitBtn.disabled = false;
          const btnText = submitBtn.querySelector('.btn-text');
          const btnLoading = submitBtn.querySelector('.btn-loading');
          if (btnText) btnText.style.display = 'inline';
          if (btnLoading) btnLoading.style.display = 'none';
        }
        createToast('Unable to process checkout. Please try again.', 'error');
      }
    });
  }

  // --- Mobile Menu ---
  const menuToggle = document.querySelector('.nav__toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Header Scroll ---
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

});
