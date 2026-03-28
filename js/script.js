document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                }
            }
        });
    });

    // 2. Intersection Observer for Fade-in Animations
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section, .testimonial-card, .highlight-item, .gallery-item').forEach(el => {
        observer.observe(el);
    });

    // 3. Back to Top Button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 4. Gallery Lightbox
    const galleryItems = document.querySelectorAll('.gallery-item img');
    if (galleryItems.length > 0) {
        const lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        document.body.appendChild(lightbox);

        galleryItems.forEach(img => {
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
    }

    // 5. Menu Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-category li');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                
                // Toggle active class
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                menuItems.forEach(item => {
                    if (filter === 'all' || item.dataset.diet === filter) {
                        item.style.display = 'grid';
                        item.style.animation = 'fadeIn 0.5s';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // 6. Newsletter Submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input').value;
            alert(`Grazie! We've added ${email} to our newsletter.`);
            newsletterForm.reset();
        });
    }

    // 7. Form Redirection (General)
    const forms = ['contact-form', 'reservation-form'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', (e) => {
                if (formId === 'contact-form' || formId === 'reservation-form') {
                    e.preventDefault();
                    window.location.href = 'success.html';
                }
            });
        }
    });

    // 8. Order Cart Logic
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.querySelector('.cart-total span:last-child');
    const addBtns = document.querySelectorAll('.btn-add');
    let total = 0;

    if (addBtns.length > 0) {
        addBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.parentElement;
                const name = item.querySelector('h4').textContent.trim();
                const priceText = item.querySelector('.price').textContent.replace('$', '');
                const price = parseFloat(priceText);
                
                if (cartItemsContainer.querySelector('.empty-msg')) {
                    cartItemsContainer.innerHTML = '';
                }

                const cartRow = document.createElement('div');
                cartRow.className = 'cart-item-row';
                cartRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; border-bottom: 1px solid #f9f9f9; padding-bottom: 0.5rem;';
                cartRow.innerHTML = `
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.9rem;">${name}</div>
                        <div style="color: #888; font-size: 0.8rem;">$${price.toFixed(2)}</div>
                    </div>
                    <button class="btn-remove" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 0.8rem; padding: 0.2rem 0.5rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                cartRow.querySelector('.btn-remove').addEventListener('click', () => {
                    cartRow.remove();
                    total -= price;
                    cartTotalElement.textContent = `$${Math.max(0, total).toFixed(2)}`;
                    if (cartItemsContainer.children.length === 0) {
                        cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is currently empty.</p>';
                    }
                });

                cartItemsContainer.appendChild(cartRow);
                total += price;
                cartTotalElement.textContent = `$${total.toFixed(2)}`;
            });
        });
    }
    
    console.log('La Dolce Vita Ultimate Edition Loaded.');
});

// --- Ultra Premium JS Upgrades ---
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader')?.classList.add('fade-out-loader');
  }, 800);
});

const cursor = document.querySelector('.custom-cursor');
if(cursor) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, .btn-primary, .btn-secondary, .btn-reservations').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

const siteHeader = document.querySelector('header');
window.addEventListener('scroll', () => {
  if(window.scrollY > 50) {
    siteHeader?.classList.add('scrolled');
  } else {
    siteHeader?.classList.remove('scrolled');
  }
});

