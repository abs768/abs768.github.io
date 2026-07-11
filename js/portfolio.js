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
    const cur = { x: -1000, y: -1000, w: 36, h: 36, r: 18 };

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      boxEl = e.target.closest(BOX_SEL);
      caretEl = boxEl ? null : e.target.closest(TEXT_SEL);
    });

    const lerp = (a, b, t) => a + (b - a) * t;

    (function cursorLoop() {
      let tx = mx;
      let ty = my;
      let tw = 36;
      let th = 36;
      let tr = 18;

      let caretMode = false;
      if (boxEl && boxEl.isConnected) {
        const r = boxEl.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
        tw = r.width + 14;
        th = r.height + 14;
        const br = parseFloat(getComputedStyle(boxEl).borderRadius);
        tr = Number.isFinite(br) && br > 0 ? Math.min(br + 7, th / 2) : 10;
      } else if (caretEl && caretEl.isConnected) {
        tw = 3.5;
        th = parseFloat(getComputedStyle(caretEl).fontSize) * 1.4;
        tr = 2;
        caretMode = true;
      }
      cursor.classList.toggle('is-caret', caretMode);

      const t = 0.24;
      cur.x = lerp(cur.x, tx, t);
      cur.y = lerp(cur.y, ty, t);
      cur.w = lerp(cur.w, tw, t);
      cur.h = lerp(cur.h, th, t);
      cur.r = lerp(cur.r, tr, t);

      cursor.style.left = cur.x + 'px';
      cursor.style.top = cur.y + 'px';
      cursor.style.width = cur.w + 'px';
      cursor.style.height = cur.h + 'px';
      cursor.style.borderRadius = cur.r + 'px';

      requestAnimationFrame(cursorLoop);
    })();
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

    const senderEmail = document.getElementById('senderEmail');
    const thanksName = document.getElementById('thanksName');
    const thanksBack = document.getElementById('thanksBack');

    // "zurich@gmail.com" -> "Zurich", "tushar.panthri@x.com" -> "Tushar"
    const firstNameFrom = (addr) => {
      const token = (addr.split('@')[0] || '')
        .replace(/[0-9]+/g, ' ')
        .split(/[._\-+ ]+/)
        .filter(Boolean)[0] || '';
      return token ? token[0].toUpperCase() + token.slice(1) : 'friend';
    };

    send.addEventListener('click', (e) => {
      e.preventDefault();
      const addr = senderEmail ? senderEmail.value.trim() : '';
      if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
        senderEmail.classList.add('is-error');
        senderEmail.focus();
        return;
      }
      if (senderEmail) senderEmail.classList.remove('is-error');
      const body = message.value.trim() + (addr ? `\n\n— ${addr}` : '');
      window.location.href =
        `mailto:${EMAIL}?subject=${encodeURIComponent('hi bhavani')}&body=${encodeURIComponent(body)}`;
      if (thanksName) thanksName.textContent = firstNameFrom(addr);
      document.body.classList.remove('is-writing');
      document.body.classList.add('is-sent');
    });

    if (senderEmail) {
      senderEmail.addEventListener('input', () => senderEmail.classList.remove('is-error'));
    }

    if (thanksBack) {
      thanksBack.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.remove('is-sent');
        message.value = '';
        if (senderEmail) senderEmail.value = '';
      });
    }
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

  if (intro && introAnim && introBall) {
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
        setTimeout(() => {
          document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
        }, 700);
        // once we've scrolled away, quietly restore the finished word —
        // transitions off for a frame so there's no visible pop, and
        // scrolling back to the top shows it sitting there, complete
        setTimeout(() => {
          const anim = intro.querySelector('.intro__anim');
          anim.classList.add('intro__anim--notrans');
          intro.classList.remove('intro--done');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => anim.classList.remove('intro__anim--notrans'));
          });
        }, 2200);
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
    graphTilt.addEventListener('mousemove', (e) => {
      const r = graphTilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      svg.style.transform = `rotateY(${px * 14}deg) rotateX(${py * -14}deg)`;
      far.style.transform = `translate(${px * -10}px, ${py * -10}px)`;
      near.style.transform = `translate(${px * 8}px, ${py * 8}px)`;
    });
    graphTilt.addEventListener('mouseleave', () => {
      svg.style.transform = '';
      far.style.transform = '';
      near.style.transform = '';
    });
  }

  // display mockup: grows gently as it crosses the viewport
  const docDevice = document.getElementById('docDevice');
  if (docDevice && !reduceMotionLab) {
    const onScroll = () => {
      const r = docDevice.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const progress = Math.max(0, 1 - Math.abs(mid - innerHeight / 2) / (innerHeight / 2));
      docDevice.style.transform = `scale(${(0.94 + progress * 0.08).toFixed(4)})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // the conversation on the screen: type, answer, cite, repeat
  const chatQ = document.getElementById('chatQ');
  const chatA = document.getElementById('chatA');
  const chatAText = document.getElementById('chatAText');
  const chatCites = document.getElementById('chatCites');
  if (chatQ && chatA && chatAText && chatCites) {
    const turns = [
      { q: 'what does the warranty cover?', a: 'Parts and labor for 24 months — accidental damage is excluded.', c: ['p.4 §2', 'p.11 §5'] },
      { q: 'who signed the 2019 agreement?', a: 'No retrieved passage answers this. I can\u2019t say.', c: ['refusal'] },
      { q: 'summarize the termination clause', a: 'Either party may exit with 30 days\u2019 written notice after year one.', c: ['p.7 §9'] }
    ];
    if (reduceMotionLab) {
      chatQ.textContent = turns[0].q;
      chatAText.textContent = turns[0].a;
      chatCites.innerHTML = turns[0].c.map((c) => `<span>${c}</span>`).join('');
      chatA.classList.add('is-in');
    } else {
      let turn = 0;
      const playTurn = () => {
        const t = turns[turn % turns.length];
        turn += 1;
        chatQ.textContent = '';
        chatA.classList.remove('is-in');
        let i = 0;
        const type = setInterval(() => {
          chatQ.textContent = t.q.slice(0, ++i);
          if (i >= t.q.length) {
            clearInterval(type);
            setTimeout(() => {
              chatAText.textContent = t.a;
              chatCites.innerHTML = t.c.map((c) => `<span>${c}</span>`).join('');
              chatA.classList.add('is-in');
              setTimeout(playTurn, 3600);
            }, 600);
          }
        }, 55);
      };
      playTurn();
    }
  }

  // hover-to-zoom dashboard: origin follows the cursor
  const dashZoom = document.getElementById('dashZoom');
  if (dashZoom) {
    const img = dashZoom.querySelector('img');
    if (finePointer) {
      dashZoom.addEventListener('mousemove', (e) => {
        const r = dashZoom.getBoundingClientRect();
        img.style.transformOrigin =
          `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`;
      });
      dashZoom.addEventListener('mouseenter', () => dashZoom.classList.add('is-zoomed'));
      dashZoom.addEventListener('mouseleave', () => dashZoom.classList.remove('is-zoomed'));
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
