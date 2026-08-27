/* ==========================================================================
   script.js — combined JavaScript for the one-page site
   Sections: Hero (mobile menu + parallax), About (scroll reveal + parallax),
   Gallery (lightbox)
   ========================================================================== */

// Force page scroll to top on refresh/reload (modern browser standard scrollRestoration)
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

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

        const MAX_PARALLAX_PX = 130; // noticeable drift on scroll
        const PARALLAX_RATE = 0.22; // image moves slower than the page
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
       2. About — scroll reveal triggered when visual is reached in viewport
       --------------------------------------------------------------------- */
    (function () {
        const visualContainer = document.querySelector('.about-visual');
        const portrait = document.querySelector('.about-portrait');
        if (!visualContainer || !portrait) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion) {
            portrait.classList.add('is-visible');
            return;
        }

        // Reveal: the portrait rises up from below + un-blurs only when we
        // scroll and reach the visual container in the viewport. It stays
        // visible once triggered.
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    portrait.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealObserver.observe(visualContainer);
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

    /* ---------------------------------------------------------------------
       4. Process Section — Scroll Reveal Text Animation
       --------------------------------------------------------------------- */
    (function () {
        const config = {
            stagger: 0.15,       // delay between each character's reveal start
            duration: 0.5,       // reveal duration per character
            xOffset: 7,          // horizontal slide
            yOffset: 0,
            blur: 0,
            rotateX: 0,
            scale: 1,
            colorHidden: "rgba(255, 255, 255, 0.35)",   // initial: light enough to read, dim
            colorRevealed: "rgba(255, 255, 255, 0.72)", // final: warm light grey (not pure white)
            offsetStart: 100,     // reveal starts the moment text enters from below
            offsetEnd: 80         // fully revealed when text is 20% above the bottom edge
        };

        const paragraphs = document.querySelectorAll('.process-desc');
        paragraphs.forEach(el => {
            const text = el.textContent.trim().replace(/\s+/g, ' ');
            el.textContent = ''; // clear text

            const tokens = text.split(/(\s+)/);
            const charEls = [];
            let unitIndex = 0;

            tokens.forEach(token => {
                const isSpace = /^\s+$/.test(token);
                if (isSpace) {
                    el.appendChild(document.createTextNode(token));
                } else {
                    const wordSpan = document.createElement("span");
                    wordSpan.className = "reveal-word";
                    Array.from(token).forEach(ch => {
                        const charSpan = document.createElement("span");
                        charSpan.className = "reveal-char";
                        charSpan.textContent = ch;
                        charSpan.dataset.unit = unitIndex++;
                        wordSpan.appendChild(charSpan);
                        charEls.push(charSpan);
                    });
                    el.appendChild(wordSpan);
                }
            });

            const totalUnits = unitIndex;
            const totalTime = config.duration + (totalUnits - 1) * config.stagger;

            function applyProgress(scrollP) {
                const time = scrollP * totalTime;

                charEls.forEach(charSpan => {
                    const unit = parseInt(charSpan.dataset.unit, 10);
                    const p = totalUnits <= 1
                        ? scrollP
                        : Math.max(0, Math.min(1, (time - unit * config.stagger) / config.duration));

                    const opacity = 0.3 + p * 0.7;
                    const tx = (-config.xOffset + config.xOffset * p).toFixed(1);
                    const ty = (config.yOffset * (1 - p)).toFixed(1);

                    const transform = `translateX(${tx}px) translateY(${ty}px)`;
                    charSpan.style.transform = transform;
                    charSpan.style.opacity = opacity;

                    const pct = Math.round(p * 100);
                    charSpan.style.color = `color-mix(in srgb, ${config.colorRevealed} ${pct}%, ${config.colorHidden})`;
                });
            }

            const startFrac = config.offsetStart / 100;
            const endFrac = config.offsetEnd / 100;
            let isVisible = false;
            let scheduled = false;

            function update() {
                const vh = window.innerHeight;
                const rect = el.getBoundingClientRect();
                const range = (startFrac - endFrac) * vh;
                if (range <= 0) return;
                const scrollP = Math.max(0, Math.min(1, (startFrac * vh - rect.top) / range));
                applyProgress(scrollP);
            }

            const observer = new IntersectionObserver(([entry]) => {
                isVisible = entry.isIntersecting;
                if (entry.isIntersecting) update();
            }, { rootMargin: "200px" });

            observer.observe(el);

            function onScroll() {
                if (!isVisible || scheduled) return;
                scheduled = true;
                requestAnimationFrame(() => {
                    update();
                    scheduled = false;
                });
            }

            window.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("resize", onScroll);

            // Initial state
            applyProgress(0);
            update();
        });
    })();
});
