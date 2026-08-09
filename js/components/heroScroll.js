/* ==========================================================================
   Hero cinematic scroll — pins the homepage hero and scrubs three things in
   step with the shared 3D background camera (window.DZScene.setHeroProgress):

     Phase A (0    -> 0.28)  text content + resting badges leave
    Phase B (0.15 -> 0.65)  the ring/nucleus group grows and travels to the
                dead center of the hero, "orbit" attribute pills
                fade in and continuously revolve around it
    Phase C (0.86 -> 1.0)   the structure holds in place so it stays visible
                as the page scrolls into the next section

   Everything is driven by one scrub-linked timeline, so scroll speed maps
   1:1 onto animation speed in both directions (fast scroll = fast playback,
   slow scroll = slow playback) — there's no separate "speed" to tune.

   Safety-first: only runs on the homepage hero, only on desktop-sized
   viewports, and only when the visitor hasn't asked for reduced motion.
   Everything falls back to the existing scroll parallax in scene3d.js.
   ========================================================================== */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero || !window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.matchMedia({
    '(min-width: 900px)': function () {
      const heroBody = hero.querySelector('.hero-body');
      const visual = hero.querySelector('.hero-visual');
      const content = hero.querySelector('.hero-content');
      const rings = hero.querySelectorAll('.visual-ring');
      const badge = hero.querySelector('.visual-badge');
      const restCards = hero.querySelectorAll('.float-card');
      const orbit = hero.querySelector('.orbit-attrs');
      const orbitItems = hero.querySelectorAll('.orbit-attr');
      const processCinematic = hero.querySelector('.process-cinematic');

      const proxy = { p: 0 };
      const spin = { deg: 0 };

      const release = () => { if (window.DZScene) window.DZScene.setHeroProgress(null); };

      // Measured once, before any transform is applied, so it reflects true
      // resting layout position — this is what lets the visual group travel
      // from its spot in the right column to the exact center of the hero.
      let dx = 0, dy = 0;
      if (heroBody && visual) {
        const heroRect = heroBody.getBoundingClientRect();
        const visualRect = visual.getBoundingClientRect();
        dx = (heroRect.left + heroRect.width / 2) - (visualRect.left + visualRect.width / 2);
        dy = (heroRect.top + heroRect.height / 2) - (visualRect.top + visualRect.height / 2);
      }

      // Pin length gives the three phases room to actually read, but scrub
      // is kept tight (and fastScrollEnd on) so tracking always feels glued
      // to the scroll wheel/trackpad rather than catching up after the fact.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '+=48%',
          scrub: 0.3,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          fastScrollEnd: true,
          onLeave: release,
          onLeaveBack: release,
        },
      });

      // Background camera drives the whole way through (0 -> 1) on the same
      // duration/position as the pin itself, so it always finishes on the
      // exact same scroll position as the dissolve below — no dead frame
      // of "just background" once content/orbit are gone.
      tl.to(proxy, {
        p: 1,
        ease: 'none',
        duration: 1,
        onUpdate() { if (window.DZScene) window.DZScene.setHeroProgress(proxy.p); },
      }, 0);

      // ---- Phase A: text + resting badges leave ----
      if (content) {
        tl.to(content, { rotateX: 8, y: -60, z: -160, scale: 0.94, opacity: 0, ease: 'power1.in', duration: 0.28 }, 0);
      }
      if (restCards.length) {
        tl.to(restCards, { opacity: 0, scale: 0.8, ease: 'power1.in', duration: 0.2, stagger: 0.02 }, 0);
      }

      // ---- Phase B: ring/nucleus group travels to center and scales up ----
      if (visual) {
        tl.to(visual, {
          x: dx,
          y: dy,
          scale: 1.3,
          rotateY: 6,
          ease: 'power2.inOut',
          duration: 0.5,
        }, 0.15);
      }

      // ---- Phase B continued: orbit attributes fade in and continuously
      // revolve around the nucleus, like electrons around an atom ----
      if (orbit) {
        tl.to(orbit, { opacity: 1, ease: 'power1.out', duration: 0.18 }, 0.32);
        tl.to(spin, {
          deg: 360,
          ease: 'none',
          duration: 0.68,
          onUpdate() { orbit.style.setProperty('--spin', spin.deg + 'deg'); },
        }, 0.3);
      }
      if (processCinematic) {
        tl.to(processCinematic, {
          opacity: 1,
          y: 0,
          ease: 'power1.out',
          duration: 0.2,
        }, 0.3);
      }

      // Cleanup hook for matchMedia's own responsive teardown
      return () => {
        release();
        gsap.set(
          [content, visual, badge, orbit, processCinematic, ...rings, ...restCards, ...orbitItems].filter(Boolean),
          { clearProps: 'all' }
        );
        if (orbit) orbit.style.removeProperty('--spin');
      };
    },
  });
})();
