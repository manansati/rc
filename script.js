/* ==========================================================================
   script.js — combined JavaScript for the one-page site
   Sections: Hero (mobile menu + parallax), About (scroll reveal + parallax),
   Gallery (lightbox)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    /* ---------------------------------------------------------------------
       1. Hero — Mobile Menu Toggling + Portrait Parallax
       --------------------------------------------------------------------- */
    const toggleBtn = document.querySelector('.mobile-toggle');
    const drawer = document.querySelector('.mobile-drawer');

    if (toggleBtn && drawer) {
        const drawerLinks = document.querySelectorAll('.mobile-drawer .navbar-link, .mobile-drawer .navbar-cta');

        const toggleMenu = () => {
            toggleBtn.classList.toggle('open');
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };

        toggleBtn.addEventListener('click', toggleMenu);
        drawerLinks.forEach(link => link.addEventListener('click', toggleMenu));
    }

    const imageWrapper = document.querySelector('.hero-image-wrapper');
    const imageContainer = document.querySelector('.hero-image-container');
    if (imageWrapper && imageContainer) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Entrance: the portrait only starts rising/un-blurring once the
        // headline words and the description/CTA have finished their own
        // reveal (title finishes ~0.75s in; desc + CTA finish at their
        // 0.3s delay + 0.8s animation = 1.1s) — see the .is-visible rule
        // on .hero-image-container in styles.css for the actual motion.
        if (prefersReducedMotion) {
            imageContainer.classList.add('is-visible');
        } else {
            setTimeout(() => imageContainer.classList.add('is-visible'), 600);
        }

        const MAX_PARALLAX_PX = 90; // noticeable drift on scroll
        const PARALLAX_RATE = 0.15; // image moves slower than the page
        let parallaxTicking = false;

        const applyParallax = () => {
            parallaxTicking = false;
            if (prefersReducedMotion || window.innerWidth < 1200) {
                imageWrapper.style.transform = 'translate(-50%, 0)';
                return;
            }
            const scrollY = window.scrollY;
            const offset = Math.min(scrollY * PARALLAX_RATE, MAX_PARALLAX_PX);
            imageWrapper.style.transform = `translate(-50%, ${offset}px)`;
        };

        const requestParallax = () => {
            if (!parallaxTicking) {
                parallaxTicking = true;
                window.requestAnimationFrame(applyParallax);
            }
        };

        window.addEventListener('scroll', requestParallax, { passive: true });
        window.addEventListener('resize', requestParallax);
        applyParallax();
    }

    /* ---------------------------------------------------------------------
       2. About — repeatable scroll reveal (no parallax on this image)
       --------------------------------------------------------------------- */
    (function () {
        const section = document.querySelector('.about-section');
        const portrait = document.querySelector('.about-portrait');
        if (!section || !portrait) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion) {
            portrait.classList.add('is-visible');
            return;
        }

        // Reveal: the portrait rises up from below + un-blurs every time the
        // section scrolls into view, and resets when it scrolls back out —
        // so scrolling away and back replays the animation each time.
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                portrait.classList.toggle('is-visible', entry.isIntersecting);
            });
        }, { threshold: 0.2 });
        revealObserver.observe(section);
    })();

    /* ---------------------------------------------------------------------
       3. Gallery — Lightbox
       --------------------------------------------------------------------- */
    (function () {
        const cards = Array.from(document.querySelectorAll('.card'));
        if (!cards.length) return;

        const images = cards.map((c) => {
            const img = c.querySelector('img');
            return { full: img.dataset.full, alt: img.alt };
        });

        const lightbox = document.getElementById('lightbox');
        const lbImage = document.getElementById('lightboxImage');
        const lbClose = document.getElementById('lbClose');
        const lbPrev = document.getElementById('lbPrev');
        const lbNext = document.getElementById('lbNext');

        let currentIndex = 0;
        let lastFocused = null;

        function renderImage() {
            // restart the scaleIn animation on every navigation
            lbImage.style.animation = 'none';
            // eslint-disable-next-line no-unused-expressions
            lbImage.offsetWidth; // force reflow
            lbImage.style.animation = '';
            lbImage.src = images[currentIndex].full;
            lbImage.alt = images[currentIndex].alt;
        }

        function openLightbox(index) {
            currentIndex = index;
            lastFocused = document.activeElement;
            renderImage();
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            lbClose.focus();
        }

        function closeLightbox() {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (lastFocused) lastFocused.focus();
        }

        function showNext() {
            currentIndex = (currentIndex + 1) % images.length;
            renderImage();
        }

        function showPrev() {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            renderImage();
        }

        cards.forEach((card, i) => {
            card.addEventListener('click', () => openLightbox(i));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(i);
                }
            });
        });

        lbClose.addEventListener('click', closeLightbox);
        lbNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
        lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

        // click on the backdrop (not the image or the buttons) closes the modal
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('is-open')) return;

            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight') {
                showNext();
            } else if (e.key === 'ArrowLeft') {
                showPrev();
            }
        });
    })();
});
