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


  // intro: build "my story" letterforms and fade the section on scroll
  const introAnim = document.getElementById('introAnim');
  const intro = document.getElementById('intro');

  if (introAnim) {
    const text = 'my story';
    [...text].forEach((ch, i) => {
      const outer = document.createElement('span');
      outer.className = 'intro__char' + (ch === ' ' ? ' intro__char--space' : '');
      outer.style.setProperty('--i', i);
      if (ch !== ' ') {
        const inner = document.createElement('span');
        inner.className = 'intro__char__inner';
        inner.style.setProperty('--i', i);
        inner.textContent = ch;
        outer.appendChild(inner);
      }
      introAnim.appendChild(outer);
    });
  }

  if (intro && introAnim) {
    window.addEventListener('scroll', () => {
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.8), 1);
      introAnim.style.opacity = String(1 - progress);
      introAnim.style.transform = `translateY(${progress * -60}px) scale(${1 - progress * 0.1})`;
    }, { passive: true });
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
