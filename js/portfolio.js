/* (c) 2026 Bhavani Shankar Ajith. All rights reserved. See /LICENSE. */
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

  // contextual cursor: orb by default, a grey rounded rect wrapping
  // tiles/buttons on hover, a text caret over plain copy
  const cursor = document.getElementById('cursor');
  if (cursor && finePointer) {
    const BOX_SEL = '.tile, .btn, .fab, .footer__home';
    const TEXT_SEL = 'p, h1, h2, h3, li, a, span, textarea';
    let mx = -1000;
    let my = -1000;
    let boxEl = null;
    let caretEl = null;
    let running = false;

    // Target geometry is measured only when the hovered element changes,
    // never inside the animation frame — reading layout every frame while
    // also writing to it is what makes a custom cursor stutter the page.
    const target = { x: -1000, y: -1000, w: 36, h: 36, r: 18, caret: false };
    const cur = { x: -1000, y: -1000, w: 36, h: 36, r: 18 };
    let painted = { w: -1, h: -1, r: -1 };

    const measure = () => {
      if (boxEl && boxEl.isConnected) {
        const r = boxEl.getBoundingClientRect();
        target.follow = false;
        target.x = r.left + r.width / 2;
        target.y = r.top + r.height / 2;
        target.w = r.width + 14;
        target.h = r.height + 14;
        const br = parseFloat(getComputedStyle(boxEl).borderRadius);
        target.r = Number.isFinite(br) && br > 0 ? Math.min(br + 7, target.h / 2) : 10;
        target.caret = false;
      } else if (caretEl && caretEl.isConnected) {
        target.follow = true;
        target.w = 3.5;
        target.h = parseFloat(getComputedStyle(caretEl).fontSize) * 1.4;
        target.r = 2;
        target.caret = true;
      } else {
        target.follow = true;
        target.w = 36;
        target.h = 36;
        target.r = 18;
        target.caret = false;
      }
      cursor.classList.toggle('is-caret', target.caret);
    };

    const wake = () => {
      if (running) return;
      running = true;
      requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      wake();
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      const nextBox = e.target.closest(BOX_SEL);
      const nextCaret = nextBox ? null : e.target.closest(TEXT_SEL);
      if (nextBox === boxEl && nextCaret === caretEl) return;
      boxEl = nextBox;
      caretEl = nextCaret;
      measure();
      wake();
    }, { passive: true });

    // A pinned box moves with the page, so keep it measured while scrolling —
    // but defer the measurement to the next frame rather than reading layout
    // inside the scroll event itself.
    let remeasure = false;
    window.addEventListener('scroll', () => {
      if (!boxEl || remeasure) return;
      remeasure = true;
      requestAnimationFrame(() => {
        remeasure = false;
        if (!boxEl) return;
        measure();
        wake();
      });
    }, { passive: true });

    measure();

    const lerp = (a, b, t) => a + (b - a) * t;
    const T = 0.24;

    function loop() {
      const tx = target.follow ? mx : target.x;
      const ty = target.follow ? my : target.y;

      cur.x = lerp(cur.x, tx, T);
      cur.y = lerp(cur.y, ty, T);
      cur.w = lerp(cur.w, target.w, T);
      cur.h = lerp(cur.h, target.h, T);
      cur.r = lerp(cur.r, target.r, T);

      // translate3d keeps the cursor on the compositor; width/height/radius
      // are only written when they actually changed by a visible amount.
      cursor.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      if (Math.abs(cur.w - painted.w) > 0.2) { cursor.style.width = cur.w.toFixed(1) + 'px'; painted.w = cur.w; }
      if (Math.abs(cur.h - painted.h) > 0.2) { cursor.style.height = cur.h.toFixed(1) + 'px'; painted.h = cur.h; }
      if (Math.abs(cur.r - painted.r) > 0.2) { cursor.style.borderRadius = cur.r.toFixed(1) + 'px'; painted.r = cur.r; }

      // Park the loop once everything has settled; a mousemove wakes it.
      const settled =
        Math.abs(cur.x - tx) < 0.15 && Math.abs(cur.y - ty) < 0.15 &&
        Math.abs(cur.w - target.w) < 0.15 && Math.abs(cur.h - target.h) < 0.15 &&
        Math.abs(cur.r - target.r) < 0.15;
      if (settled) { running = false; return; }
      requestAnimationFrame(loop);
    }
  }

  // magnetic buttons
  if (finePointer) {
    document.querySelectorAll('.btn, .fab').forEach((btn) => {
      let box = null;
      let queued = false;
      let px = 0;
      let py = 0;

      btn.addEventListener('mouseenter', () => { box = btn.getBoundingClientRect(); }, { passive: true });
      btn.addEventListener('mousemove', (e) => {
        px = e.clientX;
        py = e.clientY;
        if (queued) return;
        queued = true;
        // One write per frame, and the box is measured on enter rather than
        // on every move, so the pointer never triggers a layout mid-scroll.
        requestAnimationFrame(() => {
          queued = false;
          if (!box) box = btn.getBoundingClientRect();
          const x = (px - (box.left + box.width / 2)) * 0.2;
          const y = (py - (box.top + box.height / 2)) * 0.3;
          btn.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(1.015)`;
        });
      }, { passive: true });
      btn.addEventListener('mouseleave', () => {
        box = null;
        btn.style.transform = '';
      }, { passive: true });
    });
  }

  // say hi → writing mode
  const sayHi = document.getElementById('sayHi');
  const send = document.getElementById('send');
  const message = document.getElementById('message');

  if (sayHi && send && message) {
    sayHi.addEventListener('click', (e) => {
      e.preventDefault();
      if (document.body.classList.contains('is-sent')) return;
      const writing = document.body.classList.toggle('is-writing');
      if (writing) {
        setTimeout(() => message.focus(), 400);
      } else {
        message.blur();
      }
    });

    // a short burst of confetti, palette colors, then gone
    const popConfetti = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const colors = ['#1c86ff', '#ff4fa0', '#ffe07a', '#2ee6a8', '#b48aff', '#ff4757'];
      const wrap = document.createElement('div');
      wrap.className = 'confetti';
      document.body.appendChild(wrap);
      for (let i = 0; i < 90; i += 1) {
        const p = document.createElement('span');
        p.style.background = colors[i % colors.length];
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = -(4 + Math.random() * 16) + 'vh';
        wrap.appendChild(p);
        p.animate(
          [
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${(Math.random() - 0.5) * 28}vw, ${65 + Math.random() * 50}vh) rotate(${360 + Math.random() * 720}deg)`, opacity: 0 }
          ],
          { duration: 2200 + Math.random() * 1600, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', fill: 'forwards' }
        );
      }
      setTimeout(() => wrap.remove(), 4200);
    };

    send.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.remove('is-writing');
      document.body.classList.add('is-sent');
      message.blur();
      popConfetti();
    });

    // cmd/ctrl+enter sends from the textarea
    message.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        send.click();
      }
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


  // intro: the ball is the pen tip. It traces each letter's path while
  // the stroke draws in white directly beneath it; when a letter
  // completes it takes its color, and after the final "s" the ball
  // glides down and lands as the period.
  const introAnim = document.getElementById('introAnim');
  const intro = document.getElementById('intro');
  const introBall = document.getElementById('introBall');
  const reduceMotionIntro = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // a reload always replays the intro from the start; only moving
  // around within the site (lab -> home, back/forward) skips it
  let skipIntro = false;
  const navEntry = performance.getEntriesByType('navigation')[0];
  const navType = navEntry ? navEntry.type : 'navigate';
  if (navType !== 'reload') {
    if (document.referrer.indexOf(location.origin) === 0) skipIntro = true;
    if (navType === 'back_forward') skipIntro = true;
  }

  if (intro && skipIntro) {
    intro.style.display = 'none'; // straight to the greeting
  } else if (intro && introAnim && introBall) {
    const letters = [...introAnim.querySelectorAll('.intro__letter')].map((el) => ({
      el,
      len: el.getTotalLength(),
      color: el.dataset.color
    }));
    const PERIOD = { x: 560, y: 236 };

    if (reduceMotionIntro) {
      // show the finished word, no motion, no auto-scroll
      letters.forEach((l) => { l.el.style.stroke = l.color; });
    } else {
      let advanced = false;

      const advance = () => {
        if (advanced) return;
        advanced = true;
        intro.classList.add('intro--done');
        // once the word has faded, remove the intro entirely — the
        // greeting becomes the top of the page
        setTimeout(() => {
          intro.style.display = 'none';
          window.scrollTo(0, 0);
        }, 950);
      };

      // prep: hide each stroke behind its own dash offset
      letters.forEach((l) => {
        l.el.style.strokeDasharray = String(l.len);
        l.el.style.strokeDashoffset = String(l.len);
        l.el.style.visibility = 'visible';
      });

      const totalLen = letters.reduce((s, l) => s + l.len, 0);
      const WRITE_MS = 3400;   // constant pen speed across the whole word
      const GAP_MS = 160;      // pen lift between letters
      const LAND_MS = 520;     // hop from the s down to the period
      const START_MS = 600;    // let the guides fade in first

      const placeBall = (x, y) => {
        introBall.style.opacity = '1';
        introBall.style.transform = `translate(${x}px, ${y}px)`;
      };

      // build the schedule: [start, end] per letter at constant speed
      let acc = START_MS;
      letters.forEach((l) => {
        l.start = acc;
        l.end = acc + (l.len / totalLen) * WRITE_MS;
        acc = l.end + GAP_MS;
      });
      const writeEnd = letters[letters.length - 1].end;
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      const t0 = performance.now();
      const tick = (now) => {
        if (advanced) return;
        const t = now - t0;

        letters.forEach((l) => {
          if (t <= l.start) return;
          const p = Math.min((t - l.start) / (l.end - l.start), 1);
          const drawn = l.len * p;
          l.el.style.strokeDashoffset = String(l.len - drawn);
          if (p < 1) {
            const pt = l.el.getPointAtLength(drawn);
            placeBall(pt.x, pt.y);
          } else if (!l.colored) {
            l.colored = true;
            l.el.style.stroke = l.color; // formed: white becomes the letter's color
          }
        });

        if (t >= writeEnd) {
          // the s just finished: land as the period
          const from = letters[letters.length - 1].el.getPointAtLength(letters[letters.length - 1].len);
          const q = Math.min((t - writeEnd) / LAND_MS, 1);
          const e = easeOut(q);
          placeBall(from.x + (PERIOD.x - from.x) * e, from.y + (PERIOD.y - from.y) * e);
          if (q >= 1) {
            setTimeout(advance, 1300);
            return; // choreography complete
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      // a user gesture skips the wait and hands off immediately
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
        window.addEventListener(evt, () => {
          // show the finished word before leaving
          letters.forEach((l) => {
            l.el.style.strokeDashoffset = '0';
            l.el.style.stroke = l.color;
          });
          placeBall(PERIOD.x, PERIOD.y);
          advance();
        }, { once: true, passive: true });
      });
    }
  }

  // ===== lab: interactive cards (all guarded; only exist on experiments.html)
  const reduceMotionLab = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // tilt card: graph follows the cursor with a little parallax depth
  const graphTilt = document.getElementById('graphTilt');
  if (graphTilt && finePointer && !reduceMotionLab) {
    const svg = graphTilt.querySelector('.tiltcard__svg');
    const far = graphTilt.querySelector('.tilt-far');
    const near = graphTilt.querySelector('.tilt-near');
    let box = null;
    let queued = false;
    let cx = 0;
    let cy = 0;

    graphTilt.addEventListener('mouseenter', () => { box = graphTilt.getBoundingClientRect(); }, { passive: true });
    graphTilt.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (!box) box = graphTilt.getBoundingClientRect();
        const px = (cx - box.left) / box.width - 0.5;
        const py = (cy - box.top) / box.height - 0.5;
        svg.style.transform = `rotateY(${(px * 14).toFixed(2)}deg) rotateX(${(py * -14).toFixed(2)}deg)`;
        far.style.transform = `translate(${(px * -10).toFixed(2)}px, ${(py * -10).toFixed(2)}px)`;
        near.style.transform = `translate(${(px * 8).toFixed(2)}px, ${(py * 8).toFixed(2)}px)`;
      });
    }, { passive: true });
    graphTilt.addEventListener('mouseleave', () => {
      box = null;
      svg.style.transform = '';
      far.style.transform = '';
      near.style.transform = '';
    }, { passive: true });
  }

  // display mockup: grows gently as it crosses the viewport
  const docDevice = document.getElementById('docDevice');
  if (docDevice && !reduceMotionLab) {
    let onScreen = false;
    let queued = false;

    const paint = () => {
      queued = false;
      const r = docDevice.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const progress = Math.max(0, 1 - Math.abs(mid - innerHeight / 2) / (innerHeight / 2));
      docDevice.style.transform = `scale(${(0.94 + progress * 0.08).toFixed(4)})`;
    };

    // Reading layout inside the scroll event forces a synchronous reflow on
    // every wheel tick. Defer to the next frame, and do nothing at all while
    // the mockup is off screen.
    const onScroll = () => {
      if (!onScreen || queued) return;
      queued = true;
      requestAnimationFrame(paint);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        if (onScreen) onScroll();
      }, { rootMargin: '20% 0px' }).observe(docDevice);
    } else {
      onScreen = true;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
  }

  // the screen zooms under the cursor, slow and smooth, like leaning
  // into a photo — wheel/trackpad in, ease back out on leave
  const screenZoom = document.getElementById('screenZoom');
  const screenArt = document.getElementById('screenContent');
  if (screenZoom && screenArt) {
    const BASE = 1;
    let z = 1;
    let tz = 1;
    let ox = 50;
    let oy = 50;

    screenZoom.addEventListener('wheel', (e) => {
      e.preventDefault();
      // wheel intensity maps to zoom speed, clamped 1x–3.2x
      tz = Math.min(4.5, Math.max(1, tz * (1 - e.deltaY * 0.0022)));
    }, { passive: false });

    screenZoom.addEventListener('mousemove', (e) => {
      const r = screenZoom.getBoundingClientRect();
      ox = ((e.clientX - r.left) / r.width) * 100;
      oy = ((e.clientY - r.top) / r.height) * 100;
    }, { passive: true });

    screenZoom.addEventListener('mouseleave', () => { tz = 1; });

    // pinch to zoom on touch devices
    let pinchDist = 0;
    screenZoom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    screenZoom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinchDist > 0) {
        e.preventDefault();
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        tz = Math.min(4.5, Math.max(1, tz * (d / pinchDist)));
        pinchDist = d;
        const r = screenZoom.getBoundingClientRect();
        ox = (((e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left) / r.width) * 100;
        oy = (((e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top) / r.height) * 100;
      }
    }, { passive: false });

    // The loop only runs while the zoom is actually moving. Left running
    // permanently it would write to the DOM on every frame of every scroll,
    // for a card that is usually nowhere near the viewport.
    let zooming = false;
    const wakeZoom = () => {
      if (zooming) return;
      zooming = true;
      requestAnimationFrame(zoomLoop);
    };

    function zoomLoop() {
      z += (tz - z) * 0.055; // the "slowly, slowly" part
      screenArt.style.transformOrigin = `${ox.toFixed(1)}% ${oy.toFixed(1)}%`;
      screenArt.style.transform = `scale(${(BASE * z).toFixed(4)})`;
      if (Math.abs(tz - z) < 0.0005) {
        z = tz;
        screenArt.style.transform = `scale(${(BASE * z).toFixed(4)})`;
        zooming = false;
        return;
      }
      requestAnimationFrame(zoomLoop);
    }

    screenZoom.addEventListener('wheel', wakeZoom, { passive: true });
    screenZoom.addEventListener('mousemove', wakeZoom, { passive: true });
    screenZoom.addEventListener('mouseleave', wakeZoom, { passive: true });
    screenZoom.addEventListener('touchmove', wakeZoom, { passive: true });
    zoomLoop();
  }

  // the conversation on the screen: type, answer, cite, repeat
  const chatQ = document.getElementById('chatQ');
  const chatA = document.getElementById('chatA');
  const chatAText = document.getElementById('chatAText');
  const chatCites = document.getElementById('chatCites');
  if (chatQ && chatA && chatAText && chatCites) {
    const reduceMotionChat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const turns = [
      { q: 'what does the warranty cover?', a: 'Parts and labor for 24 months — accidental damage is excluded.', c: ['p.4 §2', 'p.11 §5'] },
      { q: 'who signed the 2019 agreement?', a: 'No retrieved passage answers this. I can\u2019t say.', c: ['refusal'] },
      { q: 'summarize the termination clause', a: 'Either party may exit with 30 days\u2019 written notice after year one.', c: ['p.7 §9'] }
    ];
    if (reduceMotionChat) {
      chatQ.textContent = turns[0].q;
      chatAText.textContent = turns[0].a;
      chatCites.innerHTML = turns[0].c.map((c) => `<span>${c}</span>`).join('');
      chatA.classList.add('is-in');
    } else {
      // The conversation only runs while it is actually on screen and the
      // tab is in front — a typewriter ticking away in a background tab is
      // pure wasted main-thread work.
      let turn = 0;
      let timer = null;
      let typing = null;
      let onScreen = false;
      let live = false;

      const stop = () => {
        clearTimeout(timer);
        clearInterval(typing);
        timer = null;
        typing = null;
        live = false;
      };

      const playTurn = () => {
        const t = turns[turn % turns.length];
        turn += 1;
        chatQ.textContent = '';
        chatA.classList.remove('is-in');
        let i = 0;
        typing = setInterval(() => {
          chatQ.textContent = t.q.slice(0, ++i);
          if (i >= t.q.length) {
            clearInterval(typing);
            typing = null;
            timer = setTimeout(() => {
              chatAText.textContent = t.a;
              chatCites.innerHTML = t.c.map((c) => `<span>${c}</span>`).join('');
              chatA.classList.add('is-in');
              timer = setTimeout(playTurn, 3600);
            }, 600);
          }
        }, 55);
      };

      const sync = () => {
        const shouldRun = onScreen && !document.hidden;
        if (shouldRun && !live) {
          live = true;
          playTurn();
        } else if (!shouldRun && live) {
          stop();
        }
      };

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          onScreen = entries[0].isIntersecting;
          sync();
        }, { threshold: 0.15 }).observe(chatA.closest('.device') || chatA);
      } else {
        onScreen = true;
      }
      document.addEventListener('visibilitychange', sync);
      sync();
    }
  }

  // hover-to-zoom dashboard: origin follows the cursor
  const dashZoom = document.getElementById('dashZoom');
  if (dashZoom) {
    const img = dashZoom.querySelector('img');
    if (finePointer) {
      let box = null;
      let queued = false;
      let cx = 0;
      let cy = 0;

      dashZoom.addEventListener('mousemove', (e) => {
        cx = e.clientX;
        cy = e.clientY;
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          if (!box) box = dashZoom.getBoundingClientRect();
          img.style.transformOrigin =
            `${(((cx - box.left) / box.width) * 100).toFixed(1)}% ${(((cy - box.top) / box.height) * 100).toFixed(1)}%`;
        });
      }, { passive: true });
      dashZoom.addEventListener('mouseenter', () => {
        box = dashZoom.getBoundingClientRect();
        dashZoom.classList.add('is-zoomed');
      }, { passive: true });
      dashZoom.addEventListener('mouseleave', () => {
        box = null;
        dashZoom.classList.remove('is-zoomed');
      }, { passive: true });
    } else {
      dashZoom.addEventListener('click', () => dashZoom.classList.toggle('is-zoomed'));
    }
  }

  // replay buttons rewind SMIL animations
  document.querySelectorAll('[data-replay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const svg = document.getElementById(btn.dataset.replay);
      if (svg && svg.setCurrentTime) svg.setCurrentTime(0);
    });
  });

  // resume peek: work entries open the matching resume excerpt
  const peek = document.getElementById('peek');
  const peekImg = document.getElementById('peekImg');
  if (peek && peekImg) {
    const close = () => {
      peek.hidden = true;
      document.body.style.overflow = '';
    };
    document.querySelectorAll('.resume-peek').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        peekImg.src = a.dataset.resume;
        peek.hidden = false;
        document.body.style.overflow = 'hidden';
      });
    });
    peek.querySelectorAll('[data-peek-close]').forEach((el) => {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !peek.hidden) close();
    });
  }

  // the greeting says hi in rotation: hi, gr\u00fcetzi, bonjour
  const greetEl = document.getElementById('greet');
  if (greetEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const greetings = ['hi', 'gr\u00fcetzi', 'bonjour'];
    let gi = 0;
    let greetTimer = null;
    // Hold the rotation while the tab is hidden rather than queueing up
    // hundreds of timer callbacks that all fire the moment it comes back.
    const later = (fn, ms) => {
      clearTimeout(greetTimer);
      greetTimer = setTimeout(() => {
        if (document.hidden) { later(fn, 400); return; }
        fn();
      }, ms);
    };
    const erase = () => {
      const t = greetEl.textContent;
      if (t.length > 0) {
        greetEl.textContent = t.slice(0, -1);
        later(erase, 80);
      } else {
        gi = (gi + 1) % greetings.length;
        type();
      }
    };
    const type = () => {
      const target = greetings[gi];
      const t = greetEl.textContent;
      if (t.length < target.length) {
        greetEl.textContent = target.slice(0, t.length + 1);
        later(type, 110);
      } else {
        later(erase, 2800);
      }
    };
    later(erase, 3200);
  }

  // a real buzz on devices that can do it
  if ('vibrate' in navigator) {
    document.querySelectorAll('.tile, .workgrid__item, .btn').forEach((el) => {
      el.addEventListener('touchstart', () => navigator.vibrate(8), { passive: true });
    });
  }

  // the blue load streak: sweeps on arrival, and again when you
  // navigate within the site
  const loadbar = document.getElementById('loadbar');
  if (loadbar) {
    const sweep = () => {
      loadbar.classList.remove('is-loading');
      void loadbar.offsetWidth; // restart the animation
      loadbar.classList.add('is-loading');
    };
    sweep();
    document.querySelectorAll('a[href*=".html"], a[href="./"]').forEach((a) => {
      a.addEventListener('click', sweep);
    });
  }

  // Park infinite tile animations while they are scrolled out of view.
  if ('IntersectionObserver' in window) {
    const animated = document.querySelectorAll('.workgrid__item, .demo-card, .play__orb');
    if (animated.length) {
      const idleObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const idle = !entry.isIntersecting;
          entry.target.classList.toggle('is-idle', idle);
          // CSS play-state does not reach SMIL, and the tiles are full of
          // <animateMotion>. Pause those explicitly.
          entry.target.querySelectorAll('svg').forEach((svg) => {
            if (typeof svg.pauseAnimations !== 'function') return;
            if (idle) svg.pauseAnimations();
            else svg.unpauseAnimations();
          });
        });
      }, { rootMargin: '25% 0px' });
      animated.forEach((el) => idleObserver.observe(el));
    }
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
