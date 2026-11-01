/* Aditya Kachroo · portfolio interactions
   Progressive enhancement: all content is in the HTML; if the CDN libraries
   (GSAP, ScrollTrigger, Lenis, Three.js) fail to load, IntersectionObserver
   fallbacks keep the page working. Honours prefers-reduced-motion. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = mqReduce.matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const G = window.gsap, ST = window.ScrollTrigger;
  const hasGsap = !!(G && ST) && !reduce;
  if (hasGsap) G.registerPlugin(ST);
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
  const isDesktop = () => window.innerWidth >= 1000;

  /* ---------------- smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    try {
      lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothTouch: false });
      root.classList.add('has-lenis');
      if (hasGsap) {
        lenis.on('scroll', ST.update);
        G.ticker.add(t => lenis.raf(t * 1000));
        G.ticker.lagSmoothing(0);
      } else {
        const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    } catch (e) { lenis = null; }
  }
  const scrollToTarget = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: el.id === 'hero' ? 0 : -20, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  window.AK = { lenis, scrollToTarget, reduce, fine, hasGsap, vel: () => 0 };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    if (document.body.classList.contains('menu-open')) toggleMenu(false);
    scrollToTarget(id);
    history.replaceState(null, '', id === '#hero' ? location.pathname : id);
  }));

  /* ---------------- nav: hide on scroll down, active indicator ---------------- */
  const nav = $('.nav'), bar = $('.scroll-progress span'), totop = $('.totop');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    const p = h > 0 ? Math.min(y / h, 1) : 0;
    bar.style.transform = `scaleX(${p})`;
    if (totop) totop.style.setProperty('--sp', p.toFixed(3));
    if (!document.body.classList.contains('menu-open')) {
      if (y > 160 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 160) nav.classList.remove('is-hidden');
    }
    lastY = y;
    updateTimeline();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const indicator = $('.nav__indicator');
  const navLinks = $$('.nav__links a');
  const moveIndicator = (a) => {
    if (!indicator) return;
    if (!a) { indicator.style.opacity = 0; return; }
    indicator.style.opacity = 1;
    indicator.style.width = a.offsetWidth + 'px';
    indicator.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  const sectionMap = { impact: 'impact', about: 'impact', iac: 'expertise', story: 'migrations', pipeline: 'expertise', expertise: 'expertise', migrations: 'migrations', projects: 'projects', experience: 'experience', skills: 'skills', credentials: 'credentials' };
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const key = sectionMap[en.target.id];
      const link = key ? navLinks.find(l => l.getAttribute('href') === '#' + key) : null;
      navLinks.forEach(l => l.classList.toggle('is-active', l === link));
      moveIndicator(link);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => spy.observe(s));

  /* ---------------- mobile menu ---------------- */
  const toggle = $('.nav__toggle'), menu = $('#menu');
  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    nav.classList.remove('is-hidden');
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => $('.menu__links a', menu).focus({ preventScroll: true }), 300);
  }
  toggle.addEventListener('click', () => toggleMenu());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { toggleMenu(false); toggle.focus(); } });

  /* ---------------- cursor follower + magnetic buttons ---------------- */
  if (fine && !reduce) {
    root.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => { if (e.target.closest('a,button,.tilt,.filter')) cur.classList.add('is-hover'); });
    document.addEventListener('pointerout', e => { if (e.target.closest('a,button,.tilt,.filter')) cur.classList.remove('is-hover'); });

    $$('.magnetic').forEach(el => {
      const strength = el.classList.contains('totop') ? 0.4 : 0.3;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength, y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transition = 'transform .15s ease-out';
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)'; el.style.transform = ''; });
    });
  }

  /* ---------------- split headings into words ---------------- */
  const splitWords = (el) => {
    const frag = document.createDocumentFragment();
    const walk = (node, cls) => {
      node.childNodes.forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'split-w';
            const i = document.createElement('span'); i.textContent = part; if (cls) i.className = cls;
            w.appendChild(i); frag.appendChild(w);
          });
        } else if (n.nodeType === 1) walk(n, n.className || cls);
      });
    };
    walk(el, '');
    el.textContent = ''; el.appendChild(frag);
    return $$('.split-w > span', el);
  };

  /* ---------------- reveals ---------------- */
  const reveals = $$('[data-reveal]');
  const splits = $$('[data-split]');
  if (reduce) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else if (hasGsap) {
    reveals.forEach(el => { el.style.opacity = ''; });
    ST.batch(reveals, {
      start: 'top 88%', once: true,
      onEnter: batch => batch.forEach((el, i) => { el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`); el.classList.add('is-in'); })
    });
    splits.forEach(h => {
      const words = splitWords(h);
      G.from(words, { yPercent: 110, rotate: 4, duration: 1, ease: 'expo.out', stagger: 0.045, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
  } else {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  }
  // safety net: never leave content hidden
  setTimeout(() => reveals.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); }), 2500);

  /* ---------------- hero intro ---------------- */
  if (hasGsap) {
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.line__in', { yPercent: 115, duration: 1.3, stagger: 0.12 }, 0.1)
      .from('.eyebrow, .hero__role, .hero__lead, .hero__ctas, .hero__chips', { y: 28, opacity: 0, duration: 1.1, stagger: 0.09 }, 0.35)
      .from('.hero__chips li', { y: 16, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.8)
      .from('#hero-canvas', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0.5);
    // parallax drift of hero content on scroll
    G.to('.hero__content', { yPercent: 18, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------------- typing role ---------------- */
  const roles = ['Full-Stack Cloud Engineer', 'Web · HTML, CSS & JavaScript', 'Backend · Python, FastAPI, C#', 'Cloud · Azure, AWS & OCI', 'Kubernetes · Terraform · CI/CD', 'Multi-Cloud Architect'];
  const typed = $('#typed');
  if (!reduce && typed) {
    let r = 0, i = roles[0].length, del = true;
    const tick = () => {
      const w = roles[r];
      i += del ? -1 : 1;
      typed.textContent = w.slice(0, i);
      let delay = del ? 30 : 65;
      if (del && i <= 0) { del = false; r = (r + 1) % roles.length; delay = 350; }
      else if (!del && i >= w.length) { del = true; delay = 2200; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2800);
  }

  /* ---------------- counters ---------------- */
  const fmt = (n, sep) => sep ? n.toLocaleString('en-AU') : String(n);
  const counters = $$('.count');
  if (!reduce) {
    counters.forEach(c => { c.textContent = '0'; });
    const cio = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, to = +el.dataset.to, sep = el.dataset.sep, t0 = performance.now(), dur = 1800;
      const step = t => { const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(to * e), sep); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); cio.unobserve(el);
    }), { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------------- cost chart ---------------- */
  if (hasGsap) {
    const tl = G.timeline({ scrollTrigger: { trigger: '.cost', start: 'top 80%', once: true } });
    tl.from('.cost__bar', { scaleY: 0, duration: 1.2, ease: 'expo.out', stagger: 0.25 })
      .from('.cost__val', { opacity: 0, y: 10, duration: 0.5, stagger: 0.25 }, '-=0.8')
      .from('.cost__arrow', { strokeDashoffset: 120, opacity: 0, duration: 0.8 }, '-=0.3')
      .from('.cost__arrowhead', { opacity: 0, duration: 0.3 })
      .from('.cost__badge', { scale: 0.6, opacity: 0, duration: 0.6, ease: 'back.out(2)' }, '-=0.2');
  }

  /* ---------------- tilt cards ---------------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(card => {
      let raf;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transition = 'transform .08s ease-out, box-shadow .3s, border-color .3s';
          card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg) translateY(-4px)`;
          card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
        });
      });
      card.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); card.style.transition = 'transform .7s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s'; card.style.transform = ''; });
    });
  }

  /* ---------------- terminal + self-drawing IaC diagram ---------------- */
  const term = $('#term-code');
  const diagram = $('.diagram__svg');
  const codeLines = [
    ['c', '# platform/main.tf  (illustrative)'],
    ['', '<span class="k">module</span> <span class="s">"network"</span> {'],
    ['', '  source = <span class="s">"./modules/network"</span>'],
    ['', '}'],
    ['', '<span class="k">module</span> <span class="s">"aks_platform"</span> {'],
    ['', '  source     = <span class="s">"./modules/aks"</span>'],
    ['', '  subnet_id  = module.network.apps_subnet_id'],
    ['', '}'],
    ['', '<span class="k">module</span> <span class="s">"postgres"</span> {'],
    ['', '  source = <span class="s">"./modules/postgres"</span>'],
    ['', '}'],
    ['', ''],
    ['', '<span class="p">$</span> terraform apply -auto-approve'],
    ['net', '<span class="add">+</span> module.network: Creating...'],
    ['edge', '<span class="add">+</span> module.edge_waf: Creating...'],
    ['k8s', '<span class="add">+</span> module.aks_platform: Creating...'],
    ['db', '<span class="add">+</span> module.postgres: Creating...'],
    ['kv', '<span class="add">+</span> module.key_vault: Creating...'],
    ['done', '<span class="ok">Apply complete!</span> Resources: 5 added, 0 changed, 0 destroyed.']
  ];
  const dgParts = diagram ? {
    net: [$('.dg--net', diagram)], edge: [$('.dg--edge', diagram), ...$$('.dg__line', diagram).slice(0, 1)],
    k8s: [$('.dg--k8s', diagram)], db: [$$('.dg__line', diagram)[1], $('.dg--db', diagram)], kv: [$$('.dg__line', diagram)[2], $('.dg--kv', diagram)]
  } : {};
  const prepDiagram = () => {
    if (!diagram) return;
    $$('rect,path', diagram).forEach(el => {
      if (el.classList.contains('dg__pkt')) return;
      const len = el.getTotalLength ? el.getTotalLength() : 600;
      el.style.strokeDasharray = len; el.style.strokeDashoffset = len;
      el.style.transition = 'stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1), fill-opacity .6s';
      if (el.tagName === 'rect') el.style.fillOpacity = 0;
    });
    $$('text', diagram).forEach(t => { t.style.opacity = 0; t.style.transition = 'opacity .6s'; });
  };
  const drawPart = key => (dgParts[key] || []).forEach(g => {
    if (!g) return;
    const els = g.tagName === 'path' ? [g] : $$('rect,path,text', g);
    els.forEach(el => { if (el.tagName === 'text') el.style.opacity = 1; else { el.style.strokeDashoffset = 0; el.style.fillOpacity = 1; } });
  });
  const runPacket = () => {
    const pkt = $('.dg__pkt', diagram), paths = $$('.dg__line', diagram);
    if (!pkt || reduce) return;
    let i = 0, t = 0, visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(diagram);
    pkt.style.opacity = 1;
    const loop = () => {
      if (visible) {
        const p = paths[i], L = p.getTotalLength();
        t += 2.2; if (t > L) { t = 0; i = (i + 1) % paths.length; }
        const pt = p.getPointAtLength(t); pkt.setAttribute('cx', pt.x); pkt.setAttribute('cy', pt.y);
      }
      requestAnimationFrame(loop);
    };
    loop();
  };
  if (term) {
    const full = codeLines.map(l => l[1]).join('\n');
    const ready = () => { term.dataset.ready = '1'; document.dispatchEvent(new CustomEvent('ak:term-ready')); };
    if (reduce) { term.innerHTML = full; ready(); }
    else {
      prepDiagram();
      term.innerHTML = '';
      const run = async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        let html = '';
        for (const [tag, line] of codeLines) {
          if (tag === '' && line.startsWith('<span class="p">$')) {
            const plain = ' terraform apply -auto-approve';
            html += '<span class="p">$</span>';
            for (let k = 1; k <= plain.length; k++) { term.innerHTML = html + plain.slice(0, k); await sleep(38); }
            html += plain + '\n'; term.innerHTML = html; await sleep(300); continue;
          }
          html += line + '\n'; term.innerHTML = html;
          if (dgParts[tag]) drawPart(tag);
          if (tag === 'done') runPacket();
          await sleep(tag ? 520 : 70);
        }
        ready();
      };
      const tio = new IntersectionObserver(([en]) => { if (en.isIntersecting) { tio.disconnect(); run(); } }, { threshold: 0.35 });
      tio.observe($('.term'));
    }
  }

  /* ---------------- migration story: AWS → Azure ---------------- */
  const story = $('#story'), svg = $('#story-svg');
  if (story && svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const podsG = $('.pods', svg), pktsG = $('.pkts', svg);
    const pods = [];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', 452 + c * 25); rect.setAttribute('y', 152 + r * 32);
      rect.setAttribute('width', 19); rect.setAttribute('height', 24); rect.setAttribute('rx', 5);
      podsG.appendChild(rect); pods.push(rect);
    }
    const servers = $$('.srv rect', svg);
    const paths = $$('.flow', svg);
    const lens = paths.map(p => p.getTotalLength());
    const num = $('#story-num'), steps = $$('.story__steps li'), sbar = $('.story__bar');
    let progress = 0;
    const setProgress = p => {
      progress = p;
      const n = Math.round(78 * p); if (num) num.textContent = n;
      const on = Math.round(pods.length * p);
      pods.forEach((pd, i) => pd.classList.toggle('is-on', i < on));
      const off = Math.round(servers.length * p);
      servers.forEach((s, i) => s.classList.toggle('is-off', i < off));
      const st = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
      steps.forEach((s, i) => s.classList.toggle('is-on', i <= st));
      if (sbar) sbar.style.setProperty('--p', p.toFixed(3));
    };
    // packets
    const packets = [];
    for (let i = 0; i < 14; i++) {
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 9); c.setAttribute('cx', -50); pktsG.appendChild(c);
      packets.push({ el: c, path: i % paths.length, t: Math.random(), speed: 0.004 + Math.random() * 0.004 });
    }
    let visible = false;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: '100px' }).observe(story);
    const loopPk = () => {
      if (visible) {
        const intensity = progress > 0.98 ? 0.25 : 0.5 + progress * 0.8;
        packets.forEach((k, i) => {
          const active = i < Math.max(3, Math.round(packets.length * Math.min(1, intensity)));
          k.t += k.speed * (active ? 1 : 0);
          if (k.t > 1) { k.t = 0; k.path = (k.path + 1 + (i % 2)) % paths.length; }
          const pt = paths[k.path].getPointAtLength(k.t * lens[k.path]);
          k.el.setAttribute('cx', pt.x); k.el.setAttribute('cy', pt.y);
          k.el.style.opacity = active ? Math.sin(k.t * Math.PI).toFixed(2) : 0;
        });
      }
      requestAnimationFrame(loopPk);
    };
    if (reduce) { setProgress(1); packets.forEach(k => k.el.style.opacity = 0); }
    else {
      requestAnimationFrame(loopPk);
      if (hasGsap) {
        const mm = G.matchMedia();
        mm.add('(min-width: 1000px)', () => {
          setProgress(0);
          ST.create({ trigger: story, start: 'top top', end: '+=170%', pin: '.story__pin', scrub: 0.6, onUpdate: s => setProgress(s.progress) });
        });
        mm.add('(max-width: 999px)', () => {
          setProgress(0);
          ST.create({ trigger: '.story__viz', start: 'top 85%', end: 'bottom 35%', scrub: 0.6, onUpdate: s => setProgress(s.progress) });
        });
      } else {
        setProgress(0);
        let started = false;
        new IntersectionObserver(([en]) => {
          if (!en.isIntersecting || started) return; started = true;
          const t0 = performance.now();
          const anim = t => { const p = Math.min((t - t0) / 6000, 1); setProgress(p); if (p < 1) requestAnimationFrame(anim); };
          requestAnimationFrame(anim);
        }, { threshold: 0.4 }).observe(story);
      }
    }
  }

  /* ---------------- CI/CD pipeline ---------------- */
  const pipe = $('.pipe');
  if (pipe) {
    const stages = $$('.pipe__stage', pipe), fill = $('.pipe__fill', pipe), msg = $('#pipe-msg'), status = $('.pipe__status');
    const names = ['Commit', 'Build', 'Test', 'Scan', 'Deploy', 'Observe'];
    const setPipe = p => {
      pipe.style.setProperty('--p', p.toFixed(3)); if (fill) fill.style.setProperty('--p', p.toFixed(3));
      const n = Math.min(stages.length, Math.floor(p * stages.length + 0.15));
      stages.forEach((s, i) => s.classList.toggle('is-on', i < n));
      if (msg) msg.textContent = n === 0 ? 'Pipeline idle' : n >= stages.length ? 'All stages passed · released' : `Running: ${names[n - 1]} ✓ → ${names[n]}`;
      if (status) status.classList.toggle('is-done', n >= stages.length);
    };
    if (reduce) setPipe(1);
    else if (hasGsap) {
      setPipe(0);
      ST.create({ trigger: pipe, start: 'top 80%', end: 'bottom 45%', scrub: 0.5, onUpdate: s => setPipe(s.progress) });
    } else {
      setPipe(0);
      const pio = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; pio.disconnect();
        let i = 0; const iv = setInterval(() => { i++; setPipe(i / stages.length); if (i >= stages.length) clearInterval(iv); }, 450);
      }, { threshold: 0.4 });
      pio.observe(pipe);
    }
  }

  /* ---------------- Kubernetes pods assemble ---------------- */
  if (hasGsap && $('.k8s')) {
    const podsEls = $$('.k8s .pod');
    G.from(podsEls, {
      x: () => G.utils.random(-1, 1) * Math.min(260, innerWidth * 0.25), y: () => G.utils.random(-140, 140), rotate: () => G.utils.random(-120, 120),
      scale: 0.3, opacity: 0, ease: 'power3.out', stagger: { each: 0.03, from: 'random' },
      scrollTrigger: { trigger: '.k8s', start: 'top 92%', end: 'center 55%', scrub: 0.8 }
    });
  }

  /* ---------------- migrations: horizontal pinned gallery ---------------- */
  const migs = $('#migrations'), track = $('.migs__track'), viewport = $('.migs__viewport');
  if (migs && track) {
    if (hasGsap) {
      const mm = G.matchMedia();
      mm.add('(min-width: 1000px)', () => {
        root.classList.add('h-scroll');
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tw = G.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: migs, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
        return () => { root.classList.remove('h-scroll'); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); G.set(track, { x: 0 }); };
      });
    }
    viewport.classList.add('is-native');
  }

  /* ---------------- timeline fill ---------------- */
  const tlWrap = $('.timeline');
  function updateTimeline() {
    if (!tlWrap) return;
    const r = tlWrap.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.65 - r.top) / r.height, 0), 1);
    tlWrap.style.setProperty('--tl', `${p * 100}%`);
  }

  /* ---------------- footer wordmark ---------------- */
  if (hasGsap) {
    G.from('.footer__word span', { yPercent: 100, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.footer__word', start: 'top 95%', once: true } });
    G.from('.cta__orbit', { opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 75%', once: true } });
  }

  /* ---------------- skills filter ---------------- */
  const skills = $$('#skill-list li');
  $$('.filter').forEach(b => b.addEventListener('click', () => {
    $$('.filter').forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
    const f = b.dataset.f;
    skills.forEach(s => { const hit = f === 'all' || s.dataset.c === f; s.classList.toggle('is-dim', !hit); s.classList.toggle('is-hit', hit && f !== 'all'); });
  }));


  /* ---------------- marquee: pause offscreen ---------------- */
  const marquee = $('.marquee');
  let mqOn = true, mqHover = false;
  if (marquee) {
    new IntersectionObserver(([en]) => { mqOn = en.isIntersecting; marquee.classList.toggle('is-off', !en.isIntersecting); }).observe(marquee);
    marquee.addEventListener('pointerenter', () => { mqHover = true; });
    marquee.addEventListener('pointerleave', () => { mqHover = false; });
  }
  /* scroll velocity: drives marquee speed/direction and a subtle skew */
  let sv = 0, lastSY = window.scrollY;
  window.AK.vel = () => sv;
  if (!reduce) {
    const tracks = $$('.marquee__track').map((t, i) => ({ t, x: 0, dir: i % 2 ? 1 : -1, w: 0 }));
    root.classList.add('js-marquee');
    const measure = () => tracks.forEach(k => { k.w = k.t.scrollWidth / 2; });
    measure(); window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    let lastSkew = 0;
    const vloop = () => {
      requestAnimationFrame(vloop);
      const raw = lenis ? (lenis.velocity || 0) : (window.scrollY - lastSY);
      lastSY = window.scrollY;
      sv += (raw - sv) * 0.12;
      if (Math.abs(sv) < 0.01) sv = 0;
      const skew = Math.max(-7, Math.min(7, sv * 0.3));
      if (mqOn && !document.hidden) {
        const boost = Math.min(Math.abs(sv) * 0.55, 14), sign = sv < -0.5 ? -1 : 1;
        tracks.forEach(k => {
          if (!k.w) return;
          k.x += k.dir * sign * ((mqHover ? 0.2 : 0.6) + boost);
          if (k.x <= -k.w) k.x += k.w; if (k.x > 0) k.x -= k.w;
          k.t.style.transform = `translate3d(${k.x.toFixed(2)}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
        });
      }
      if (hasGsap && track && root.classList.contains('h-scroll') && Math.abs(skew - lastSkew) > 0.05) {
        G.set(track, { skewX: -skew * 0.6 }); lastSkew = skew;
      }
    };
    requestAnimationFrame(vloop);
  }

  /* ---------------- hero visual: orbital cloud platform (Canvas 2D) ----------------
     A calm, light composition placed in the free space beside the hero text:
     an isometric platform stack (infra -> platform -> app) with three glass
     cloud regions (Azure, AWS, OCI) on a tilted orbit, thin links and light
     packets. No external libraries, so it looks the same everywhere. */
  const hero = $('.hero'), canvas = $('#hero-canvas');
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  let heroVisible = true;
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }).observe(hero);

  /* hero interaction: drag to orbit (mouse), click / tap the scene to deploy a node */
  const heroCtl = { spawn: null, dragging: false, orbit: { x: 0, y: 0, vx: 0, vy: 0 } };
  window.AK.hero = heroCtl;
  if (!reduce) {
    let drag = null, dragged = false;
    const blocked = t => t.closest('.hero__content > *, a, button, input');
    hero.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || blocked(e.target)) return;
      drag = { x: e.clientX, y: e.clientY }; dragged = false;
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!dragged && Math.hypot(dx, dy) > 6) { dragged = true; heroCtl.dragging = true; hero.classList.add('is-dragging'); }
      if (dragged) {
        const o = heroCtl.orbit;
        o.vy = dx * 0.006; o.vx = dy * 0.004; o.y += o.vy; o.x = Math.max(-1, Math.min(1, o.x + o.vx));
        drag.x = e.clientX; drag.y = e.clientY;
      }
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = null; heroCtl.dragging = false; hero.classList.remove('is-dragging');
      setTimeout(() => { dragged = false; }, 0);
    });
    hero.addEventListener('click', e => {
      if (dragged || blocked(e.target) || !heroCtl.spawn) return;
      if (!heroCtl.spawn(e.clientX, e.clientY)) return;
      const pop = document.createElement('span');
      pop.className = 'hero__pop'; pop.textContent = '+ node deployed';
      const r = hero.getBoundingClientRect();
      pop.style.left = (e.clientX - r.left) + 'px'; pop.style.top = (e.clientY - r.top) + 'px';
      hero.appendChild(pop); setTimeout(() => pop.remove(), 1200);
    });
  }
  const orbitStep = () => {
    const o = heroCtl.orbit;
    if (!heroCtl.dragging) { o.y += o.vy; o.vy *= 0.94; o.vx *= 0.9; o.x *= 0.97; }
  };

  const startScene = () => initOrbit();
  if ('requestIdleCallback' in window) requestIdleCallback(startScene, { timeout: 600 }); else setTimeout(startScene, 200);

  function initOrbit() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const TAU = Math.PI * 2;
    const INDIGO = '99,102,241', TEAL = '20,184,166', BLUE = '59,130,246', CORAL = '249,115,98';
    const regions = [
      { name: 'Azure', c: BLUE, off: 0 },
      { name: 'AWS', c: CORAL, off: TAU / 3 },
      { name: 'OCI', c: TEAL, off: (TAU * 2) / 3 }
    ];
    const plates = [{ c: TEAL, label: 'infra' }, { c: INDIGO, label: 'platform' }, { c: BLUE, label: 'app' }];
    const OUT = 1.2;
    let W = 0, H = 0, dpr = 1;
    const L = { cx: 0, cy: 0, rx: 0 }, T = { cx: 0, cy: 0, rx: 0 };
    let ready = false;

    // composition extents for a given orbit radius (relative to the centre)
    const extents = rx => {
      const R = nodeR(rx), tilt = 0.42, ry2 = rx * OUT * tilt;
      return { left: rx * OUT + R * 0.6, right: rx * OUT + R * 0.6, top: Math.max(ry2 + R + 6, rx * 0.66), bottom: ry2 + R + 34 };
    };
    const nodeR = rx => Math.max(15, Math.min(30, rx * 0.14));
    const obstacles = () => {
      const hr = hero.getBoundingClientRect();
      const sel = '.hero__content .eyebrow, .hero__title .line, .hero__role, .hero__lead, .hero__ctas > *, .hero__chips li, .hero__hint, .hero__scroll';
      return $$(sel).map(e => { const r = e.getBoundingClientRect(); const right = e.classList.contains('hero__role') ? Math.min(r.right, r.left + 470) : r.right; return { l: r.left - hr.left - 28, t: r.top - hr.top - 30, r: right - hr.left + 28, b: r.bottom - hr.top + 30 }; })
        .filter(o => o.r - o.l > 60 && o.b > o.t && getComputedStyle(document.querySelector('.hero__content')).display !== 'none');
    };
    const solve = () => {
      const obs = obstacles(), top = 86, pad = 14;
      const maxRx = Math.min(290, W * 0.2, H * 0.36);
      const px = W * 0.74, py = H * 0.52;
      for (let rx = maxRx; rx >= 64; rx -= 6) {
        const e = extents(rx); let best = null, bd = Infinity;
        for (let cy = top + e.top; cy <= H - pad - e.bottom; cy += 8) {
          for (let cx = W - pad - e.right; cx >= pad + e.left; cx -= 8) {
            const box = { l: cx - e.left, r: cx + e.right, t: cy - e.top, b: cy + e.bottom };
            if (obs.some(o => !(box.r < o.l || box.l > o.r || box.b < o.t || box.t > o.b))) continue;
            const d = (cx - px) ** 2 + ((cy - py) * 1.4) ** 2;
            if (d < bd) { bd = d; best = { cx, cy }; }
          }
        }
        if (best) return { cx: best.cx, cy: best.cy, rx };
      }
      return { cx: W * 0.75, cy: H * 0.75, rx: 0 };
    };
    const layout = (snap) => {
      const s = solve(); Object.assign(T, s);
      if (snap || !ready) { Object.assign(L, s); ready = true; }
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (window.scrollY < 40) layout(!ready);
    };

    // ambient particles + satellites + deployed nodes
    const parts = Array.from({ length: 34 }, () => ({ u: Math.random(), v: Math.random(), s: 0.004 + Math.random() * 0.008, r: 0.8 + Math.random() * 1.2, ph: Math.random() * TAU, c: Math.random() < 0.7 ? INDIGO : TEAL }));
    const sats = Array.from({ length: 5 }, (_, i) => ({ off: (i / 5) * TAU + 0.4, sp: 0.03 + i * 0.006 }));
    const deployed = [], ripples = [];
    const comets = Array.from({ length: 3 }, (_, i) => ({ off: (i / 3) * TAU + 1, sp: 0.35 + i * 0.05, c: [INDIGO, TEAL, CORAL][i] }));

    const rgba = (c, a) => `rgba(${c},${a})`;
    const ease = t => 1 - Math.pow(1 - t, 3);
    let time = 0, last = performance.now(), rot = 0, tilt = 0.42, pX = 0, pY = 0;
    const proj = (theta, k) => {
      const x = L.cx + pX * 10 + Math.cos(theta) * L.rx * k;
      const y = L.cy + pY * 6 + Math.sin(theta) * L.rx * k * tilt;
      const d = Math.sin(theta);
      return { x, y, d, s: 0.78 + 0.22 * (d + 1) / 2 };
    };
    const hub = () => ({ x: L.cx + pX * 6, y: L.cy + pY * 4 - L.rx * 0.08 });

    const cloud = (x, y, w, c, a) => {
      const h = w * 0.52;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.42, y + h * 0.42);
      ctx.arc(x - w * 0.24, y + h * 0.12, h * 0.34, Math.PI * 0.55, Math.PI * 1.5);
      ctx.arc(x + w * 0.02, y - h * 0.08, h * 0.46, Math.PI * 1.1, Math.PI * 1.95);
      ctx.arc(x + w * 0.27, y + h * 0.16, h * 0.28, Math.PI * 1.45, Math.PI * 0.45);
      ctx.closePath();
      ctx.fillStyle = rgba(c, a * 0.16); ctx.fill();
      ctx.strokeStyle = rgba(c, a * 0.9); ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
    };
    const pill = (x, y, text, c, a) => {
      ctx.font = '600 12px Inter, system-ui, -apple-system, Segoe UI, sans-serif';
      const tw = ctx.measureText(text).width, w = tw + 26, h = 22;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 11);
      ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fill();
      ctx.strokeStyle = rgba(c, 0.35); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(x - w / 2 + 11, y, 3, 0, TAU); ctx.fillStyle = rgba(c, 1); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(text, x - w / 2 + 18, y + 0.5);
      ctx.globalAlpha = 1;
    };
    const glassNode = (x, y, R, c, a, label, la = 1) => {
      ctx.globalAlpha = a;
      const halo = ctx.createRadialGradient(x, y, R * 0.6, x, y, R * 2.2);
      halo.addColorStop(0, rgba(c, 0.16)); halo.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, R * 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(30,41,99,.08)'; ctx.beginPath(); ctx.ellipse(x, y + R * 1.12, R * 0.78, R * 0.2, 0, 0, TAU); ctx.fill();
      ctx.save();
      ctx.shadowColor = 'rgba(30,41,99,.16)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
      const body = ctx.createRadialGradient(x - R * 0.35, y - R * 0.45, R * 0.1, x, y, R);
      body.addColorStop(0, 'rgba(255,255,255,1)'); body.addColorStop(0.7, 'rgba(255,255,255,.92)'); body.addColorStop(1, rgba(c, 0.18));
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = rgba(c, 0.55); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba(c, 0.18); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, R * 0.7, 0, TAU); ctx.stroke();
      cloud(x, y + R * 0.02, R * 0.92, c, 1);
      ctx.globalAlpha = 1;
      if (label && la > 0.02) pill(x, y + R + 17, label, c, a * la);
    };
    const plate = (x, y, hw, hh, th, c, a) => {
      // isometric rounded-ish rhombus with a thin edge
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x + hw, y); ctx.lineTo(x + hw, y + th); ctx.lineTo(x, y + hh + th); ctx.lineTo(x - hw, y + th); ctx.closePath();
      ctx.fillStyle = rgba(c, 0.22); ctx.fill();
      const g = ctx.createLinearGradient(x - hw, y - hh, x + hw, y + hh);
      g.addColorStop(0, 'rgba(255,255,255,.96)'); g.addColorStop(1, rgba(c, 0.2));
      ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath();
      ctx.save(); ctx.shadowColor = 'rgba(30,41,99,.12)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.fillStyle = g; ctx.fill(); ctx.restore();
      ctx.strokeStyle = rgba(c, 0.6); ctx.lineWidth = 1.2; ctx.stroke();
      // inner grid hint
      ctx.strokeStyle = rgba(c, 0.18); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - hw / 2, y - hh / 2); ctx.lineTo(x + hw / 2, y + hh / 2); ctx.moveTo(x + hw / 2, y - hh / 2); ctx.lineTo(x - hw / 2, y + hh / 2); ctx.stroke();
      ctx.globalAlpha = 1;
    };
    const curve = (a, b, lift) => ({ a, b, c: { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift } });
    const bez = (q, u) => ({ x: (1 - u) * (1 - u) * q.a.x + 2 * (1 - u) * u * q.c.x + u * u * q.b.x, y: (1 - u) * (1 - u) * q.a.y + 2 * (1 - u) * u * q.c.y + u * u * q.b.y });
    const dot = (x, y, r, c, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
      g.addColorStop(0, rgba(c, a)); g.addColorStop(0.35, rgba(c, a * 0.5)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (L.rx < 60) { drawParticles(0.6); return; }
      const rx = L.rx, R = nodeR(rx), h = hub();
      // soft glow
      const glow = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, rx * 1.7);
      glow.addColorStop(0, rgba(INDIGO, 0.13)); glow.addColorStop(0.5, rgba(TEAL, 0.05)); glow.addColorStop(1, rgba(INDIGO, 0));
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(L.cx, L.cy, rx * 1.7, 0, TAU); ctx.fill();
      const fl = ctx.createRadialGradient(L.cx, L.cy, rx * 0.2, L.cx, L.cy, rx * OUT);
      fl.addColorStop(0, 'rgba(255,255,255,.55)'); fl.addColorStop(0.75, rgba(INDIGO, 0.05)); fl.addColorStop(1, rgba(INDIGO, 0.02));
      ctx.save(); ctx.translate(L.cx + pX * 10, L.cy + pY * 6); ctx.scale(1, tilt); ctx.translate(-L.cx, -L.cy);
      ctx.fillStyle = fl; ctx.beginPath(); ctx.arc(L.cx, L.cy, rx * OUT, 0, TAU); ctx.fill(); ctx.restore();
      drawParticles(1);
      const ring = (k, from, to, a, dash) => {
        ctx.setLineDash(dash || []); ctx.strokeStyle = rgba(INDIGO, a); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(L.cx + pX * 10, L.cy + pY * 6, rx * k, rx * k * tilt, 0, from, to); ctx.stroke(); ctx.setLineDash([]);
      };
      // items with depth
      const items = [];
      regions.forEach(rg => { const p = proj(rot + rg.off, 1); items.push({ d: p.d, f: () => drawRegion(rg, p, R, h) }); });
      sats.forEach(s => { const p = proj(rot * 0.6 + s.off + time * s.sp, OUT); items.push({ d: p.d, f: () => { ctx.globalAlpha = 0.5 + 0.4 * (p.d + 1) / 2; ctx.fillStyle = '#fff'; ctx.strokeStyle = rgba(INDIGO, 0.55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, 3.4 * p.s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; } }); });
      deployed.forEach(n => {
        const k = Math.min(1, (time - n.born) / 0.9), e = ease(k);
        const p = proj(rot + n.off, OUT);
        const x = n.x + (p.x - n.x) * e, y = n.y + (p.y - n.y) * e;
        items.push({ d: k < 1 ? 2 : p.d, f: () => {
          if (k >= 1) { ctx.setLineDash([2, 4]); ctx.strokeStyle = rgba(n.c, 0.28); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(h.x, h.y); ctx.stroke(); ctx.setLineDash([]); }
          const r = (6 + 2 * (1 - e)) * (k < 1 ? 1 : p.s);
          ctx.save(); ctx.shadowColor = rgba(n.c, 0.5); ctx.shadowBlur = 10;
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
          ctx.strokeStyle = rgba(n.c, 0.85); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
          ctx.fillStyle = rgba(n.c, 0.9); ctx.beginPath(); ctx.arc(x, y, r * 0.38, 0, TAU); ctx.fill();
        } });
      });
      items.sort((a, b) => a.d - b.d);
      ring(OUT, Math.PI, TAU, 0.16, [2, 6]); ring(1, Math.PI, TAU, 0.22);
      items.filter(i => i.d < 0).forEach(i => i.f());
      drawHub(h, rx);
      ring(1, 0, Math.PI, 0.38); ring(OUT, 0, Math.PI, 0.24, [2, 6]);
      // comets along the inner ring (front half only reads as motion along the orbit)
      comets.forEach(cm => {
        for (let j = 0; j < 6; j++) {
          const p = proj(rot + cm.off + time * cm.sp - j * 0.035, 1);
          ctx.fillStyle = rgba(cm.c, (0.7 - j * 0.11) * (0.45 + 0.55 * (p.d + 1) / 2));
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 - j * 0.25, 0, TAU); ctx.fill();
        }
      });
      items.filter(i => i.d >= 0).forEach(i => i.f());
      // ripples + sparks
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i], t = (time - rp.born) / 0.8;
        if (t >= 1) { ripples.splice(i, 1); continue; }
        const e = ease(t);
        ctx.strokeStyle = rgba(INDIGO, 0.45 * (1 - t)); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, 6 + e * 34, 0, TAU); ctx.stroke();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU + rp.rot;
          ctx.fillStyle = rgba(k % 2 ? TEAL : INDIGO, 0.8 * (1 - t));
          ctx.beginPath(); ctx.arc(rp.x + Math.cos(a) * (8 + e * 26), rp.y + Math.sin(a) * (8 + e * 26), 1.6, 0, TAU); ctx.fill();
        }
      }
    };
    function drawParticles(a) {
      const bx = L.rx >= 60 ? L.cx - L.rx * 1.8 : W * 0.5, bw = L.rx >= 60 ? L.rx * 3.6 : W * 0.5;
      const by = L.rx >= 60 ? L.cy - L.rx * 1.2 : H * 0.1, bh = L.rx >= 60 ? L.rx * 2.4 : H * 0.8;
      parts.forEach(p => {
        const x = bx + ((p.u + Math.sin(time * 0.3 + p.ph) * 0.01) % 1) * bw;
        const y = by + (1 - ((p.v + time * p.s) % 1)) * bh;
        const edge = Math.min(1, Math.sin(((p.v + time * p.s) % 1) * Math.PI) * 1.5);
        ctx.fillStyle = rgba(p.c, 0.35 * edge * a); ctx.beginPath(); ctx.arc(x, y, p.r, 0, TAU); ctx.fill();
      });
    }
    function drawRegion(rg, p, R, h) {
      const q = curve({ x: h.x, y: h.y }, { x: p.x, y: p.y - R * p.s * 0.2 }, L.rx * 0.18);
      const a = 0.42 + 0.58 * (p.d + 1) / 2;
      const g = ctx.createLinearGradient(q.a.x, q.a.y, q.b.x, q.b.y);
      g.addColorStop(0, rgba(INDIGO, 0.15 * a)); g.addColorStop(1, rgba(rg.c, 0.55 * a));
      ctx.strokeStyle = g; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(q.a.x, q.a.y); ctx.quadraticCurveTo(q.c.x, q.c.y, q.b.x, q.b.y); ctx.stroke();
      for (let k = 0; k < 2; k++) {
        let u = (time * 0.22 + k * 0.5 + rg.off * 0.1) % 1; if (k) u = 1 - u;
        const pt = bez(q, u);
        dot(pt.x, pt.y, 2.1, k ? rg.c : INDIGO, 0.9 * Math.sin(u * Math.PI) * a);
      }
      glassNode(p.x, p.y, R * p.s, rg.c, a, rg.name, Math.max(0, Math.min(1, (p.d + 0.55) / 0.6)));
    }
    function drawHub(h, rx) {
      const hw = rx * 0.21, hh = hw * 0.48, th = 4, gap = rx * 0.17;
      const ys = plates.map((_, i) => h.y + rx * 0.14 - i * gap + Math.sin(time * 0.9 + i * 0.8) * 1.6);
      // vertical guide + rising data
      ctx.strokeStyle = rgba(INDIGO, 0.18); ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(h.x, ys[0] + hh); ctx.lineTo(h.x, ys[2] - hh - 10); ctx.stroke(); ctx.setLineDash([]);
      plates.forEach((pl, i) => {
        plate(h.x, ys[i], hw, hh, th, pl.c, 1);
        if (i < plates.length - 1) {
          for (let k = 0; k < 2; k++) {
            const u = (time * 0.5 + k * 0.5 + i * 0.3) % 1;
            const y = ys[i] - u * gap, x = h.x + (k ? hw * 0.35 : -hw * 0.35) * (1 - u * 0.2);
            dot(x, y, 1.6, k ? TEAL : INDIGO, 0.85 * Math.sin(u * Math.PI));
          }
        }
        ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(71,85,105,.75)';
        ctx.strokeStyle = rgba(pl.c, 0.35); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(h.x + hw + 4, ys[i] + th / 2); ctx.lineTo(h.x + hw + 14, ys[i] + th / 2); ctx.stroke();
        ctx.fillText(pl.label, h.x + hw + 18, ys[i] + th / 2);
      });
    }

    heroCtl.spawn = reduce ? null : (cx, cy) => {
      if (L.rx < 60) return false;
      const r = canvas.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
      const theta = Math.atan2((y - L.cy) / tilt, x - L.cx);
      const cs = [INDIGO, TEAL, BLUE, CORAL];
      deployed.push({ x, y, off: theta - rot, born: time, c: cs[deployed.length % cs.length] });
      if (deployed.length > 8) deployed.shift();
      ripples.push({ x, y, born: time, rot: Math.random() });
      if (!running) frame(performance.now());
      return true;
    };
    root.classList.add('hero-playable');

    let running = false;
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!reduce) {
        time += dt; orbitStep();
        pX += (pointer.tx - pX) * 0.04; pY += (pointer.ty - pY) * 0.04;
        rot = time * 0.07 + heroCtl.orbit.y * 0.8;
        tilt = Math.max(0.3, Math.min(0.54, 0.42 + pY * 0.03 + heroCtl.orbit.x * 0.1));
        L.cx += (T.cx - L.cx) * 0.06; L.cy += (T.cy - L.cy) * 0.06; L.rx += (T.rx - L.rx) * 0.06;
      }
      draw();
    };
    const loop = now => {
      requestAnimationFrame(loop);
      running = heroVisible && !document.hidden;
      if (!running) { last = now; return; }
      frame(now);
    };
    resize();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); layout(true); if (reduce) draw(); }, 150); });
    const relayout = () => { if (window.scrollY < 40) { layout(false); if (reduce) draw(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    setTimeout(relayout, 2600);
    if (reduce) { rot = 0.5; draw(); return; }
    requestAnimationFrame(loop);
  }

  onScroll();
  window.addEventListener('load', () => { if (hasGsap) ST.refresh(); });
})();
