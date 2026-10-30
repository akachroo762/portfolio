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
      onEnter: batch => batch.forEach((el, i) => { el.style.setProperty('--d', `${i * 0.08}s`); el.classList.add('is-in'); })
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
      .from('.floater', { scale: 0.4, opacity: 0, duration: 1.4, stagger: 0.08, ease: 'back.out(1.6)' }, 0.4);
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

  /* ---------------- copy email ---------------- */
  const copyBtn = $('#copy-email'), copyMsg = $('.copy-msg');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('akachroo762@gmail.com'); copyMsg.textContent = 'Email copied to clipboard.'; }
    catch (e) { copyMsg.textContent = 'akachroo762@gmail.com'; }
    setTimeout(() => (copyMsg.textContent = ''), 3000);
  });

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

  /* ---------------- hero scene: WebGL (Three.js) or 2D fallback ---------------- */
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

  // floating glossy icons parallax
  const floaters = $$('.floater');
  if (!reduce && floaters.length) {
    const fl = () => {
      if (heroVisible) {
        pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
        floaters.forEach(f => { const d = +f.dataset.depth || 20; f.style.translate = `${(-pointer.x * d).toFixed(1)}px ${(-pointer.y * d).toFixed(1)}px`; });
      }
      requestAnimationFrame(fl);
    };
    fl();
  }

  /* hero interaction: drag to orbit (mouse), click / tap the scene to deploy a node */
  const heroCtl = { spawn: null, dragging: false, orbit: { x: 0, y: 0, vx: 0, vy: 0 } };
  window.AK.hero = heroCtl;
  if (!reduce) {
    let drag = null, dragged = false;
    const blocked = t => t.closest('.hero__content > *, a, button, input, .floater');
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
        o.vy = dx * 0.006; o.vx = dy * 0.004; o.y += o.vy; o.x = Math.max(-0.7, Math.min(0.7, o.x + o.vx));
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
      heroCtl.spawn(e.clientX, e.clientY);
      const pop = document.createElement('span');
      pop.className = 'hero__pop'; pop.textContent = '+ node deployed';
      const r = hero.getBoundingClientRect();
      pop.style.left = (e.clientX - r.left) + 'px'; pop.style.top = (e.clientY - r.top) + 'px';
      hero.appendChild(pop); setTimeout(() => pop.remove(), 1100);
    });
  }
  const orbitStep = () => {
    const o = heroCtl.orbit;
    if (!heroCtl.dragging) { o.y += o.vy; o.vy *= 0.94; o.vx *= 0.9; o.x *= 0.985; }
  };

  const webglOK = (() => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } })();
  const useWebGL = webglOK && !reduce && !saveData && window.innerWidth >= 900;
  const startScene = () => {
    if (useWebGL) {
      import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js')
        .then(THREE => initThree(THREE))
        .catch(() => init2D());
    } else init2D();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(startScene, { timeout: 1200 }); else setTimeout(startScene, 300);

  function initThree(THREE) {
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { init2D(); return; }
    root.classList.add('webgl');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 18);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc7d2fe, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(6, 8, 10); scene.add(key);
    const rim = new THREE.PointLight(0x5eead4, 30, 40); rim.position.set(-8, -4, 6); scene.add(rim);
    const warm = new THREE.PointLight(0xfda4af, 25, 40); warm.position.set(8, -6, 4); scene.add(warm);

    const world = new THREE.Group(); scene.add(world);
    const mat = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 });
    const clusters = [
      { name: 'azure', color: 0x3b82f6, pos: new THREE.Vector3(2.2, 1.6, 0) },
      { name: 'aws', color: 0xf59e0b, pos: new THREE.Vector3(-2.4, 0.4, -1.2) },
      { name: 'oci', color: 0xf43f5e, pos: new THREE.Vector3(1.0, -2.3, 0.8) }
    ];
    const boxGeo = new THREE.BoxGeometry(0.62, 0.62, 0.62);
    const srvGeo = new THREE.BoxGeometry(0.55, 1.05, 0.55);
    const coreGeo = new THREE.IcosahedronGeometry(0.95, 3);
    const ringGeo = new THREE.TorusGeometry(1.45, 0.045, 12, 80);
    const nodes = [];
    clusters.forEach((c, ci) => {
      const g = new THREE.Group(); g.position.copy(c.pos); world.add(g); c.group = g;
      const core = new THREE.Mesh(coreGeo, mat(c.color)); g.add(core); c.core = core;
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshPhysicalMaterial({ color: 0x6366f1, roughness: 0.3, clearcoat: 1, transparent: true, opacity: 0.55 }));
      ring.rotation.x = Math.PI / 2.4; ring.rotation.y = ci * 0.6; g.add(ring); c.ring = ring;
      const palette = [0x6366f1, 0x14b8a6, 0xa855f7, 0x60a5fa, c.color];
      for (let k = 0; k < 6; k++) {
        const isSrv = k % 3 === 0;
        const m = new THREE.Mesh(isSrv ? srvGeo : boxGeo, mat(palette[k % palette.length]));
        const ang = (k / 6) * Math.PI * 2 + ci, rad = 1.9 + (k % 2) * 0.45;
        m.userData = { ang, rad, y: (k % 3 - 1) * 0.55, spd: 0.15 + Math.random() * 0.15, ph: Math.random() * 6 };
        m.rotation.set(Math.random(), Math.random(), 0);
        g.add(m); nodes.push({ m, c });
      }
    });
    // links
    const linkPairs = [[0, 1], [1, 2], [2, 0]];
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.35 });
    const lineGeo = new THREE.BufferGeometry();
    const MAX_SPAWN = 12, spawned = [];
    const linePos = new Float32Array((linkPairs.length + nodes.length + MAX_SPAWN) * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    world.add(new THREE.LineSegments(lineGeo, lineMat));
    // packets travelling between clouds (migration flow)
    const pktGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const packets = [];
    for (let i = 0; i < 18; i++) {
      const pm = new THREE.Mesh(pktGeo, new THREE.MeshBasicMaterial({ color: [0x4f46e5, 0x0d9488, 0xf97362][i % 3] }));
      world.add(pm); packets.push({ m: pm, pair: linkPairs[i % 3], t: Math.random(), spd: 0.003 + Math.random() * 0.004, dir: i % 2 ? 1 : -1 });
    }
    // background dust
    const dustGeo = new THREE.BufferGeometry(); const dn = 260; const dp = new Float32Array(dn * 3);
    for (let i = 0; i < dn; i++) { dp[i * 3] = (Math.random() - 0.5) * 30; dp[i * 3 + 1] = (Math.random() - 0.5) * 18; dp[i * 3 + 2] = (Math.random() - 0.5) * 10 - 4; }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x818cf8, size: 0.06, transparent: true, opacity: 0.6 }));
    scene.add(dust);

    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
    // click-to-deploy: new container nodes fly in, with a packet burst
    const burstGeo = new THREE.SphereGeometry(0.07, 10, 10);
    const burst = Array.from({ length: 48 }, (_, i) => {
      const m = new THREE.Mesh(burstGeo, new THREE.MeshBasicMaterial({ color: [0x4f46e5, 0x14b8a6, 0xf97362, 0xa855f7][i % 4], transparent: true }));
      m.visible = false; world.add(m); return { m, v: new THREE.Vector3(), life: 0 };
    });
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
    const spawnColors = [0x6366f1, 0x14b8a6, 0xa855f7, 0x60a5fa, 0xf97362];
    heroCtl.spawn = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(plane, hit)) return;
      const local = world.worldToLocal(hit.clone());
      const c = clusters.reduce((b, cl) => (cl.group.position.distanceTo(local) < b.group.position.distanceTo(local) ? cl : b));
      const m = new THREE.Mesh(Math.random() < 0.5 ? boxGeo : srvGeo, mat(spawnColors[(Math.random() * spawnColors.length) | 0]));
      m.userData = { ang: Math.random() * 6.28, rad: 2.4 + Math.random() * 0.9, y: (Math.random() - 0.5) * 1.4, spd: 0.2 + Math.random() * 0.2, ph: Math.random() * 6, born: clock.getElapsedTime(), from: local.clone() };
      m.position.copy(local); m.scale.setScalar(0.01);
      world.add(m); spawned.push({ m, c });
      if (spawned.length > MAX_SPAWN) { const old = spawned.shift(); world.remove(old.m); old.m.material.dispose(); }
      let n = 0;
      for (const b of burst) {
        if (b.life > 0) continue;
        b.life = 1; b.m.visible = true; b.m.position.copy(local);
        b.v.set(Math.random() - 0.5, Math.random() - 0.5, (Math.random() - 0.5) * 0.6).normalize().multiplyScalar(0.06 + Math.random() * 0.08);
        if (++n >= 16) break;
      }
    };
    root.classList.add('hero-playable');
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      world.position.x = w > 1200 ? 4.6 : w > 1000 ? 3.8 : 2.8;
      world.scale.setScalar(w > 1200 ? 1 : 0.85);
    };
    resize();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
    const clock = new THREE.Clock();
    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });
    const render = () => {
      requestAnimationFrame(render);
      if (!running || !heroVisible) { clock.getDelta(); return; }
      const t = clock.getElapsedTime();
      orbitStep();
      const ob = heroCtl.orbit;
      world.rotation.y += ((pointer.x * 0.35 + Math.sin(t * 0.15) * 0.15 + ob.y) - world.rotation.y) * 0.08;
      world.rotation.x += ((pointer.y * 0.2 + ob.x) - world.rotation.x) * 0.08;
      camera.position.y = -window.scrollY * 0.004;
      clusters.forEach((c, i) => { c.group.position.y = c.pos.y + Math.sin(t * 0.8 + i * 2) * 0.18; c.core.rotation.y = t * 0.3; c.ring.rotation.z = t * (0.2 + i * 0.05); });
      nodes.forEach(({ m }) => {
        const u = m.userData; const a = u.ang + t * u.spd;
        m.position.set(Math.cos(a) * u.rad, u.y + Math.sin(t + u.ph) * 0.15, Math.sin(a) * u.rad * 0.6);
        m.rotation.x += 0.004; m.rotation.y += 0.006;
      });
      let o = 0;
      linkPairs.forEach(([a, b]) => {
        clusters[a].group.getWorldPosition(tmpA); clusters[b].group.getWorldPosition(tmpB);
        world.worldToLocal(tmpA); world.worldToLocal(tmpB);
        linePos.set([tmpA.x, tmpA.y, tmpA.z, tmpB.x, tmpB.y, tmpB.z], o); o += 6;
      });
      nodes.forEach(({ m, c }) => {
        const gp = c.group.position;
        linePos.set([gp.x, gp.y, gp.z, gp.x + m.position.x, gp.y + m.position.y, gp.z + m.position.z], o); o += 6;
      });
      spawned.forEach(({ m, c }) => {
        const u = m.userData, a = u.ang + t * u.spd, gp = c.group.position;
        tmpA.set(gp.x + Math.cos(a) * u.rad, gp.y + u.y + Math.sin(t + u.ph) * 0.15, gp.z + Math.sin(a) * u.rad * 0.6);
        const k = Math.min(1, (t - u.born) / 0.9), e = 1 - Math.pow(1 - k, 3);
        m.position.lerpVectors(u.from, tmpA, e); m.scale.setScalar(Math.max(0.01, e));
        m.rotation.x += 0.01; m.rotation.y += 0.012;
        linePos.set([gp.x, gp.y, gp.z, m.position.x, m.position.y, m.position.z], o); o += 6;
      });
      lineGeo.setDrawRange(0, o / 3);
      burst.forEach(b => {
        if (b.life <= 0) return;
        b.life -= 0.022; b.m.position.add(b.v); b.v.multiplyScalar(0.95);
        b.m.scale.setScalar(Math.max(0.01, b.life * 1.4)); b.m.material.opacity = Math.max(0, b.life);
        if (b.life <= 0) b.m.visible = false;
      });
      lineGeo.attributes.position.needsUpdate = true;
      packets.forEach(p => {
        p.t += p.spd; if (p.t > 1) p.t = 0;
        const [a, b] = p.dir > 0 ? p.pair : [p.pair[1], p.pair[0]];
        p.m.position.lerpVectors(clusters[a].group.position, clusters[b].group.position, p.t);
        p.m.scale.setScalar(0.6 + Math.sin(p.t * Math.PI) * 0.8);
      });
      dust.rotation.y = t * 0.01;
      renderer.render(scene, camera);
    };
    render();
  }

  function init2D() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W, H, dpr, nodes = [], pulses = [], rings = [], baseN = 0;
    const colors = ['37,99,235', '79,70,229', '13,148,136', '244,63,94', '124,58,237'];
    const mouse = { x: -1e4, y: -1e4 };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, Math.max(28, (W * H) / 18000)));
      baseN = n;
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 2 + 1.2, c: colors[(Math.random() * colors.length) | 0] }));
    };
    const LINK = 130;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      rings = rings.filter(g => g.t < 1);
      for (const g of rings) {
        g.t += 0.025;
        ctx.strokeStyle = `rgba(79,70,229,${(1 - g.t) * 0.6})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.x, g.y, 6 + g.t * 70, 0, Math.PI * 2); ctx.stroke();
      }
      for (const p of nodes) {
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          if (p.boost) { p.vx *= 0.97; p.vy *= 0.97; if (Math.hypot(p.vx, p.vy) < 0.35) p.boost = false; }
          if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 110 && d > 0) { p.x += dx / d; p.y += dy / d; }
        }
      }
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          ctx.strokeStyle = `rgba(${a.c},${(1 - Math.sqrt(d2) / LINK) * 0.3})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (!reduce && Math.random() < 0.0004 && pulses.length < 10) pulses.push({ a, b, t: 0 });
        }
      }
      for (const p of nodes) { ctx.fillStyle = `rgba(${p.c},.75)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      pulses = pulses.filter(p => p.t <= 1);
      for (const p of pulses) {
        p.t += 0.02; const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 8); g.addColorStop(0, 'rgba(249,115,98,.95)'); g.addColorStop(1, 'rgba(79,70,229,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      }
    };
    resize();
    if (!reduce) {
      heroCtl.spawn = (cx, cy) => {
        const r = canvas.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
        rings.push({ x, y, t: 0 });
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + Math.random(), sp = 2 + Math.random() * 2;
          nodes.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * 2 + 2, c: colors[(Math.random() * colors.length) | 0], boost: true });
        }
        if (nodes.length > baseN + 48) nodes.splice(baseN, 6);
      };
      root.classList.add('hero-playable');
    }
    hero.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduce) draw(); }, 150); });
    if (reduce) { draw(); return; }
    const loop = () => { if (heroVisible && !document.hidden) draw(); requestAnimationFrame(loop); };
    loop();
  }

  onScroll();
  window.addEventListener('load', () => { if (hasGsap) ST.refresh(); });
})();
