/*
  Portfolio interactions
  - Custom cursor (orb, grows over links)
  - Magnetic pill buttons
  - "say hi" writing mode: title swaps for a textarea, send opens mailto
  - Write drawer (+ fab)
  - Scroll reveal
*/

(() => {
  'use strict';

  const EMAIL = 'abhavanishankar2002@gmail.com';
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // custom cursor
  const cursor = document.getElementById('cursor');
  if (cursor && finePointer) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('is-link', !!e.target.closest('a, button, textarea'));
    });
  }

  // magnetic buttons
  if (finePointer) {
    document.querySelectorAll('.btn, .fab').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.2;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
        btn.style.transform = `translate(${x}px, ${y}px) scale(1.015)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // say hi → writing mode
  const sayHi = document.getElementById('sayHi');
  const send = document.getElementById('send');
  const message = document.getElementById('message');

  if (sayHi && send && message) {
    sayHi.addEventListener('click', (e) => {
      e.preventDefault();
      const writing = document.body.classList.toggle('is-writing');
      if (writing) {
        setTimeout(() => message.focus(), 400);
      } else {
        message.blur();
      }
    });

    send.addEventListener('click', (e) => {
      e.preventDefault();
      const body = message.value.trim();
      window.location.href =
        `mailto:${EMAIL}?subject=${encodeURIComponent('hi bhavani')}&body=${encodeURIComponent(body)}`;
    });
  }

  // write drawer
  const drawer = document.getElementById('drawer');
  const drawerToggle = document.getElementById('drawerToggle');

  if (drawer && drawerToggle) {
    drawerToggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      drawerToggle.classList.toggle('is-toggled', open);
      drawerToggle.setAttribute('aria-expanded', String(open));
    });
  }


  // intro: scribble "my story" stroke by stroke, then hand off to the greeting
  const introAnim = document.getElementById('introAnim');
  const intro = document.getElementById('intro');
  const reduceMotionIntro = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (intro && introAnim && !reduceMotionIntro) {
    const strokes = introAnim.querySelectorAll('.scr');
    const DRAW_MS = 700;    // how long each letter takes to write
    const STAGGER_MS = 480; // gap before the next letter starts
    let advanced = false;

    const advance = () => {
      if (advanced) return;
      advanced = true;
      intro.classList.add('intro--done');
      setTimeout(() => {
        document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
      }, 700);
      // once we've moved on, bring the finished word back so scrolling
      // up doesn't land on an empty screen
      setTimeout(() => intro.classList.remove('intro--done'), 2800);
    };

    strokes.forEach((path, i) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.style.visibility = 'visible';
      path.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: DRAW_MS, delay: 400 + i * STAGGER_MS, easing: 'ease-in-out', fill: 'forwards' }
      );
    });

    // once the word is written, pause, then fade and move on
    const totalMs = 400 + (strokes.length - 1) * STAGGER_MS + DRAW_MS;
    const autoTimer = setTimeout(advance, totalMs + 1100);

    // a user gesture skips the wait and hands off immediately
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
      window.addEventListener(evt, () => {
        clearTimeout(autoTimer);
        advance();
      }, { once: true, passive: true });
    });
  } else if (intro) {
    // reduced motion: show the finished word, no auto-scroll
    intro.querySelectorAll('.scr').forEach((p) => { p.style.visibility = 'visible'; });
  }

  // scroll reveal
  const targets = document.querySelectorAll('section, .workgrid__item');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    targets.forEach((el) => {
      el.classList.add('reveal-init');
      observer.observe(el);
    });
    // anything already in view reveals immediately on load
    requestAnimationFrame(() => {
      targets.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('reveal-in');
        }
      });
    });
  }
})();
