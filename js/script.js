const CART_STORAGE_KEY = 'ldv-cart';

const normalizeApiBase = (value) => value.replace(/\/+$/, '');

const getConfiguredApiBase = () => {
    const envBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
        ? String(import.meta.env.VITE_API_BASE).trim()
        : '';
    const windowBase = typeof window.LDV_API_BASE === 'string' ? window.LDV_API_BASE.trim() : '';
    const metaBase = document.querySelector('meta[name="ldv-api-base"]')?.getAttribute('content')?.trim() || '';
    const configuredBase = envBase || windowBase || metaBase;

    return configuredBase ? normalizeApiBase(configuredBase) : '';
};

const getApiBase = () => {
    const configuredBase = getConfiguredApiBase();
    if (configuredBase) {
        return configuredBase;
    }

    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    if (!isLocalHost) {
        return '';
    }

    if (window.location.port === '3001') {
        return '';
    }

    return 'http://localhost:3001';
};

const API_BASE = getApiBase();
const apiUrl = (path) => `${API_BASE}${path}`;
const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);

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

const getCart = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveCart = (cart) => {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.warn('LocalStorage write failed:', error);
    }
};

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

    requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
    });

    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
};

const bindAnchorScrolling = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function onClick(event) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') {
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (!targetElement) {
                return;
            }

            event.preventDefault();
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        });
    });
};

const bindScrollAnimations = () => {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section, .testimonial-card, .highlight-item, .gallery-item').forEach((el) => {
        observer.observe(el);
    });
};

const bindBackToTop = () => {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) {
        return;
    }

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.pageYOffset > 300) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

const bindGalleryLightbox = () => {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    if (!galleryItems.length) {
        return;
    }

    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    document.body.appendChild(lightbox);

    galleryItems.forEach((img) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            lightbox.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });

    lightbox.addEventListener('click', () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
};

const bindMenuFiltering = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-category li');

    if (!filterButtons.length || !menuItems.length) {
        return;
    }

    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            filterButtons.forEach((button) => button.classList.remove('active'));
            btn.classList.add('active');

            menuItems.forEach((item) => {
                if (filter === 'all' || item.dataset.diet === filter) {
                    item.style.display = 'grid';
                    item.style.animation = 'fadeIn 0.4s';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
};

const bindFooterReveal = () => {
    const footer = document.querySelector('.site-footer');
    if (!footer) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        footer.classList.add('is-visible');
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                footer.classList.add('is-visible');
                observer.disconnect();
            }
        });
    }, { threshold: 0.2 });

    observer.observe(footer);
};

const bindPreloader = () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) {
        return;
    }

    const dismiss = () => {
        preloader.classList.add('fade-out-loader');
    };

    // If the page has already fully loaded, dismiss immediately after a brief delay.
    if (document.readyState === 'complete') {
        setTimeout(dismiss, 300);
    } else {
        window.addEventListener('load', () => {
            setTimeout(dismiss, 700);
        });
    }

    // Safety net: always dismiss after 4 seconds even if window.load never fires
    // (e.g., a slow external image from a CDN blocks the load event).
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

const bindHeaderScroll = () => {
    const siteHeader = document.getElementById('navbar');
    if (!siteHeader) {
        return;
    }

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    siteHeader.classList.add('scrolled');
                } else {
                    siteHeader.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
};

const bindMobileMenu = () => {
    const menuToggle = document.querySelector('.nav__toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (!menuToggle || !mobileMenu) {
        return;
    }

    const closeMenu = () => {
        mobileMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    const openMenu = () => {
        mobileMenu.classList.add('open');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    };

    menuToggle.addEventListener('click', () => {
        if (mobileMenu.classList.contains('open')) {
            closeMenu();
            return;
        }

        openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
            closeMenu();
        }
    });
};

const bindNewsletterForm = () => {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) {
        return;
    }

    newsletterForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const input = newsletterForm.querySelector('input[type="email"]');
        const button = newsletterForm.querySelector('button[type="submit"]');
        const originalText = button?.textContent || 'Subscribe';
        const email = input?.value?.trim();

        if (!email) {
            showToast('Please enter your email address.', 'error');
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = 'Subscribing...';
        }

        try {
            const response = await fetch(apiUrl('/api/newsletter'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to subscribe right now.');
            }

            newsletterForm.reset();
            showToast(data.message || 'Successfully subscribed.');
        } catch (error) {
            showToast(error.message || 'Unable to subscribe right now.', 'error');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    });
};

const bindContactForm = () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) {
        return;
    }

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton?.textContent || 'Send Message';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
        }

        const payload = {
            name: contactForm.querySelector('#name')?.value?.trim(),
            email: contactForm.querySelector('#email')?.value?.trim(),
            phone: contactForm.querySelector('#phone')?.value?.trim(),
            message: contactForm.querySelector('#message')?.value?.trim()
        };

        try {
            const response = await fetch(apiUrl('/api/contact'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to send your message.');
            }

            window.location.href = 'success.html?type=contact';
        } catch (error) {
            showToast(error.message || 'Unable to send your message.', 'error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });
};

const bindReservationForm = () => {
    const reservationForm = document.getElementById('reservation-form');
    if (!reservationForm) {
        return;
    }

    reservationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = reservationForm.querySelector('button[type="submit"]');
        const originalText = submitButton?.textContent || 'Confirm Reservation';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Confirming...';
        }

        const payload = {
            name: reservationForm.querySelector('#res-name')?.value?.trim(),
            email: reservationForm.querySelector('#res-email')?.value?.trim(),
            date: reservationForm.querySelector('#res-date')?.value,
            time: reservationForm.querySelector('#res-time')?.value,
            partySize: Number(reservationForm.querySelector('#res-guests')?.value || 0),
            phone: reservationForm.querySelector('#res-phone')?.value?.trim(),
            requests: reservationForm.querySelector('#res-requests')?.value?.trim()
        };

        try {
            const response = await fetch(apiUrl('/api/reservations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to confirm your reservation.');
            }

            const reservationId = data.reservationId ? `&id=${encodeURIComponent(data.reservationId)}` : '';
            window.location.href = `success.html?type=reservation${reservationId}`;
        } catch (error) {
            showToast(error.message || 'Unable to confirm your reservation.', 'error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });
};

const bindOrderCart = () => {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.querySelector('.cart-total span:last-child');
    const addButtons = document.querySelectorAll('.btn-add');
    const checkoutButton = document.getElementById('checkout-btn');

    if (!cartItemsContainer || !cartTotalElement) {
        return;
    }

    let cart = getCart();

    const setCheckoutState = () => {
        if (!checkoutButton) {
            return;
        }
        const hasItems = cart.length > 0;
        checkoutButton.disabled = !hasItems;
        checkoutButton.classList.toggle('is-disabled', !hasItems);
    };

    const renderCart = () => {
        if (!cart.length) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is currently empty.</p>';
            cartTotalElement.textContent = '$0.00';
            setCheckoutState();
            return;
        }

        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        cartTotalElement.textContent = `$${total.toFixed(2)}`;

        cartItemsContainer.innerHTML = cart.map((item) => `
            <div class="cart-item-row">
                <div class="cart-item-row__content">
                    <div class="cart-item-row__name">${item.name}</div>
                    <div class="cart-item-row__meta">Qty: ${item.qty} • $${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-row__actions">
                    <span class="cart-item-row__line-total">$${(item.price * item.qty).toFixed(2)}</span>
                    <button class="btn-remove" data-item-id="${item.id}" aria-label="Remove ${item.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        cartItemsContainer.querySelectorAll('.btn-remove').forEach((button) => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.itemId;
                cart = cart.filter((item) => item.id !== itemId);
                saveCart(cart);
                renderCart();
            });
        });

        setCheckoutState();
    };

    const addToCart = (name, price) => {
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = cart.find((item) => item.id === id);

        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id, name, price, qty: 1 });
        }

        saveCart(cart);
        renderCart();
        showToast(`${name} added to your order.`);
    };

    addButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const itemElement = button.closest('.order-item');
            if (!itemElement) {
                return;
            }

            const title = itemElement.querySelector('h4')?.childNodes?.[0]?.textContent?.trim() || itemElement.querySelector('h4')?.textContent?.trim();
            const priceText = itemElement.querySelector('.price')?.textContent || '$0';
            const price = Number(priceText.replace('$', '').trim());

            if (!title || !Number.isFinite(price) || price <= 0) {
                showToast('Unable to add this item right now.', 'error');
                return;
            }

            addToCart(title, price);
        });
    });

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (!cart.length) {
                showToast('Add at least one item before checkout.', 'error');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    renderCart();
};

const bindSuccessPageMessage = () => {
    const title = document.getElementById('success-title');
    const message = document.getElementById('success-message');
    const reference = document.getElementById('success-reference');

    if (!title || !message) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const id = params.get('id');

    if (type === 'reservation') {
        title.textContent = 'Reservation Received';
        message.textContent = 'Your table request is in our queue. A confirmation email will arrive shortly.';
    } else if (type === 'order') {
        title.textContent = 'Order Confirmed';
        message.textContent = 'Your order is confirmed and is now being prepared by our kitchen team.';
    } else if (type === 'contact') {
        title.textContent = 'Message Sent';
        message.textContent = 'Thank you for reaching out. Our team will get back to you shortly.';
    }

    if (reference && id) {
        reference.hidden = false;
        reference.textContent = `Reference: ${id}`;
    }
};

const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator) || !window.location.protocol.startsWith('http')) {
        return;
    }

    window.addEventListener('load', async () => {
        if (isLocalDevelopment) {
            // Avoid stale cached assets while running Vite in development.
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((registration) => registration.unregister()));

                if ('caches' in window) {
                    const cacheKeys = await caches.keys();
                    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
                }
            } catch {
                // Best-effort cleanup only.
            }
            return;
        }

        navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {
            // Service worker registration is optional.
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    bindZoomGuards();

    bindAnchorScrolling();
    bindScrollAnimations();
    bindBackToTop();
    bindGalleryLightbox();
    bindMenuFiltering();
    bindFooterReveal();
    bindPreloader();
    bindCustomCursor();
    bindHeaderScroll();
    bindMobileMenu();
    bindNewsletterForm();
    bindContactForm();
    bindReservationForm();
    bindOrderCart();
    bindSuccessPageMessage();
    registerServiceWorker();
});

