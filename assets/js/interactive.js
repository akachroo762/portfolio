/* Aditya Kachroo · interactive layer
   Kinetic headline, prompt-to-platform playground (scripted, offline), cost slider,
   spotlight cards, click ripples, command palette and an interactive terminal.
   Everything here is client-side only: no network calls, no AI services. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const AK = window.AK || {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const go = target => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (AK.scrollToTarget) AK.scrollToTarget(el);
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  const isTyping = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

  /* =============== kinetic hero headline =============== */
  const title = $('#hero-title'), hero = $('#hero');
  if (title && !reduce) {
    const letters = [];
    $$('.line__in', title).forEach(word => {
      const chars = [...word.textContent];
      word.textContent = '';
      chars.forEach(ch => {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = ch;
        word.appendChild(s);
        letters.push({ el: s, x: 0, y: 0, r: 0, sc: 1, cx: 0, cy: 0 });
      });
      word.classList.add('is-split');
    });
    const gradWord = $('.line__in.grad', title);
    const layout = () => {
      const tr = title.getBoundingClientRect();
      letters.forEach(l => {
        const r = l.el.getBoundingClientRect();
        l.cx = r.left - tr.left + r.width / 2 - l.x; l.cy = r.top - tr.top + r.height / 2 - l.y;
      });
      if (gradWord) {
        const wr = gradWord.getBoundingClientRect();
        $$('.ch', gradWord).forEach((c, i) => {
          const r = c.getBoundingClientRect();
          c.style.backgroundSize = `${wr.width}px 100%`;
          c.style.backgroundPosition = `${-(r.left - wr.left - letters.find(l => l.el === c).x)}px 0`;
        });
      }
    };
    let px = -9999, py = -9999, raf = 0;
    const R = 240;
    const tick = () => {
      raf = 0; let moving = false;
      letters.forEach(l => {
        const dx = px - l.cx, dy = py - l.cy, d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / R), f2 = f * f;
        const tx = (-dx / d) * f2 * 12, ty = -f2 * 20 - (dy / d) * f2 * 6, tr = (dx > 0 ? -1 : 1) * f2 * 9, ts = 1 + f2 * 0.12;
        l.x += (tx - l.x) * 0.16; l.y += (ty - l.y) * 0.16; l.r += (tr - l.r) * 0.16; l.sc += (ts - l.sc) * 0.16;
        if (Math.abs(tx - l.x) + Math.abs(ty - l.y) + Math.abs(tr - l.r) > 0.04) moving = true;
        l.el.style.transform = `translate(${l.x.toFixed(2)}px,${l.y.toFixed(2)}px) rotate(${l.r.toFixed(2)}deg) scale(${l.sc.toFixed(3)})`;
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    if (fine) {
      hero.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const tr = title.getBoundingClientRect();
        px = e.clientX - tr.left; py = e.clientY - tr.top; kick();
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { px = py = -9999; kick(); });
    }
    const wave = () => letters.forEach((l, i) => l.el.animate(
      [{ transform: 'translateY(0) rotate(0) scale(1)' }, { transform: 'translateY(-.22em) rotate(-7deg) scale(1.12)' }, { transform: 'translateY(0) rotate(0) scale(1)' }],
      { duration: 650, delay: i * 38, easing: 'cubic-bezier(.2,.7,.2,1)', composite: 'add' }));
    title.addEventListener('click', wave);
    title.style.cursor = 'pointer';
    title.title = 'Click me';
    setTimeout(() => { layout(); wave(); }, 1900);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
    window.addEventListener('scroll', () => { if (window.scrollY < innerHeight) { clearTimeout(rt); rt = setTimeout(layout, 120); } }, { passive: true });
  }

  /* =============== spotlight cards =============== */
  $$('.stat, .cap, .project, .cert, .edu__item, .glance, .cost, .pg__console, .pg__stage, .tl__card').forEach(el => {
    el.classList.add('has-spot');
    const s = document.createElement('span'); s.className = 'spot'; s.setAttribute('aria-hidden', 'true');
    el.appendChild(s);
  });
  const spotMove = e => {
    const el = e.target.closest && e.target.closest('.has-spot');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${e.clientX - r.left}px`);
    el.style.setProperty('--sy', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', spotMove, { passive: true });
  document.addEventListener('pointerdown', e => { spotMove(e); const el = e.target.closest && e.target.closest('.has-spot'); if (el && e.pointerType !== 'mouse') { el.classList.add('is-touched'); setTimeout(() => el.classList.remove('is-touched'), 900); } }, { passive: true });

  /* =============== click ripples =============== */
  if (!reduce) {
    document.addEventListener('pointerdown', e => {
      const el = e.target.closest && e.target.closest('.btn, .filter, .pg-chip, .pg__send, .nav__cta, .nav__cmd, .term__chips button, .footer__cmd, .totop');
      if (!el) return;
      const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      el.classList.add('has-ripple'); el.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    });
  }

  /* =============== interactive cost slider =============== */
  const range = $('#cost-range');
  if (range) {
    const barB = $('.cost__bar--b'), valB = $$('.cost__val')[1], out = $('#cost-out'), now = $('#cost-now'), saved = $('#cost-saved'), badge = $('.cost__badge'), arrow = $('.cost__arrow'), head = $('.cost__arrowhead');
    const upd = () => {
      const p = range.value / 100, V = 1.5 - 0.4 * p, h = (170 * V) / 1.5;
      barB.setAttribute('height', h.toFixed(1)); barB.setAttribute('y', (210 - h).toFixed(1));
      valB.setAttribute('y', (200 - h).toFixed(1));
      const txt = p === 0 ? '$1.5M' : p === 1 ? '$1.1M' : `$${V.toFixed(2)}M`;
      valB.textContent = txt; now.textContent = txt;
      saved.textContent = `$${Math.round(400 * p)}K`;
      out.textContent = `${Math.round(p * 100)}%`;
      badge.textContent = p === 0 ? 'before' : `~${Math.round(26.67 * p)}% lower`;
      range.style.setProperty('--v', `${p * 100}%`);
      [arrow, head].forEach(a => { if (a) a.style.opacity = p > 0.03 ? '' : '0.15'; });
    };
    range.addEventListener('input', upd);
    upd();
  }

  /* =============== interactive terminal =============== */
  const tcode = $('#term-code'), tform = $('#term-form'), tin = $('#term-input'), tbody = $('.term__body');
  const pageFacts = () => {
    const txt = el => el.textContent.replace(/\s+/g, ' ').trim();
    const skillGroups = {};
    $$('#skill-list li').forEach(li => { (skillGroups[li.dataset.c] = skillGroups[li.dataset.c] || []).push(txt(li)); });
    const groupNames = {};
    $$('.filter').forEach(b => { groupNames[b.dataset.f] = txt(b); });
    const linkedin = ($('a[href*="linkedin.com"]') || {}).href || '';
    return {
      projects: $$('#projects h3').map(txt),
      migrations: $$('.mcard').map(c => `${txt($('h3', c))}  (${txt($('.card__org', c))})`),
      certs: $$('.cert figcaption').map(txt),
      edu: $$('.edu__item h3').map(txt),
      exp: $$('.timeline .tl').map(li => `${txt($('.tl__date', li)).padEnd(20)} ${txt($('.tl__role', li)).replace(/ Current$/, '')} · ${txt($('.tl__org', li))}`),
      stats: $$('.stat').map(st => { const n = $('.count', st); const num = txt($('.stat__num', st)); return `${n ? num.replace(/[\d,]+/, Number(n.dataset.to).toLocaleString('en-AU')) : num}  ${txt($('.stat__label', st))}`; }),
      skillGroups, groupNames, linkedin
    };
  };
  if (tcode && tform && tin) {
    const term = $('.term');
    let ready = false, pending = [], hist = [], hi = 0;
    const print = html => { tcode.insertAdjacentHTML('beforeend', html + '\n'); tbody.scrollTop = tbody.scrollHeight; };
    const sections = { home: '#hero', impact: '#impact', profile: '#about', about: '#about', code: '#iac', playground: '#playground', story: '#story', pipeline: '#pipeline', expertise: '#expertise', migrations: '#migrations', projects: '#projects', experience: '#experience', skills: '#skills', credentials: '#credentials', certs: '#credentials', contact: '#contact' };
    const list = (arr, color = 's') => arr.map(a => `  <span class="${color}">›</span> ${esc(a)}`).join('\n');
    const cmds = {
      help: () => [
        '<span class="ok">Commands</span>',
        '  whoami          who I am', '  skills [group]  languages, clouds and tools (groups: code, cloud, iac, …)',
        '  ls projects     notable projects', '  ls migrations   cloud migrations delivered', '  impact          outcomes, in numbers',
        '  experience      career timeline', '  certs           certifications & education', '  contact         how to reach me (LinkedIn)',
        '  open <section>  scroll to a section (e.g. open playground)', '  clear           clear the screen',
        '<span class="c">Tip: press / or Ctrl K anywhere for the command palette.</span>'
      ].join('\n'),
      whoami: () => ['<span class="ok">Aditya Kachroo</span>', '  Full-stack cloud engineer · 7+ years across cloud, DevOps and engineering',
        '  Code:   Python · C# (.NET) · JavaScript · HTML5 · CSS3', '  Clouds: Azure · AWS · Oracle Cloud (OCI) · VMware',
        '  Approach: hands-on, I architect it, write the code and build it', '  Based in Australia', '  Contact: LinkedIn (type contact)'].join('\n'),
      skills: arg => {
        const f = pageFacts(); const keys = Object.keys(f.skillGroups);
        if (arg) {
          const k = keys.find(k => k.startsWith(arg) || (f.groupNames[k] || '').toLowerCase().includes(arg));
          if (!k) return `<span class="c">No group "${esc(arg)}". Groups: ${keys.join(', ')}</span>`;
          return `<span class="ok">${esc(f.groupNames[k] || k)}</span>\n  ${esc(f.skillGroups[k].join(' · '))}`;
        }
        return keys.map(k => `<span class="k">${esc((f.groupNames[k] || k).padEnd(22))}</span>${esc(f.skillGroups[k].slice(0, 7).join(' · '))}${f.skillGroups[k].length > 7 ? ' …' : ''}`).join('\n') + '\n<span class="c">Try: skills cloud</span>';
      },
      ls: arg => {
        const f = pageFacts();
        if (/^proj/.test(arg)) return list(f.projects);
        if (/^mig/.test(arg)) return list(f.migrations);
        if (/^cert/.test(arg)) return list(f.certs);
        return '<span class="k">projects/</span>  <span class="k">migrations/</span>  <span class="k">certs/</span>\n<span class="c">Try: ls projects</span>';
      },
      impact: () => list(pageFacts().stats, 'ok'),
      experience: () => list(pageFacts().exp),
      certs: () => { const f = pageFacts(); return list(f.certs) + '\n' + list(f.edu, 'k'); },
      contact: () => { const li = pageFacts().linkedin; return `  LinkedIn  <a class="s" href="${esc(li)}" target="_blank" rel="noopener">${esc(li)}</a>\n<span class="c">  LinkedIn is the best way to reach me. Type open contact for the contact section.</span>`; },
      open: arg => { const k = Object.keys(sections).find(k => k.startsWith(arg || '-')); if (!k) return `<span class="c">Sections: ${Object.keys(sections).join(', ')}</span>`; setTimeout(() => go(sections[k]), 250); return `<span class="ok">→</span> opening ${k}…`; },
      clear: () => { tcode.innerHTML = ''; return null; },
      terraform: arg => /apply/.test(arg) ? '<span class="add">+</span> module.network, module.aks_platform, module.postgres, module.key_vault\n<span class="ok">Apply complete!</span> <span class="c">(illustrative, nothing was deployed)</span>' : '<span class="c">Usage: terraform apply</span>',
      sudo: () => '<span class="p">Permission denied:</span> this is a read-only demo terminal 🙂',
      echo: arg => esc(arg),
      history: () => hist.map((h, i) => `  ${String(i + 1).padStart(3)}  ${esc(h)}`).join('\n') || '  (empty)'
    };
    cmds.cd = cmds.open; cmds.man = cmds.help; cmds['?'] = cmds.help; cmds.about = cmds.whoami; cmds.projects = () => cmds.ls('projects'); cmds.migrations = () => cmds.ls('migrations');
    const run = raw => {
      const line = raw.trim();
      if (!line) return;
      hist.push(line); hi = hist.length;
      print(`<span class="p">$</span> ${esc(line)}`);
      const [c, ...rest] = line.split(/\s+/); const arg = rest.join(' ').toLowerCase();
      const fn = cmds[c.toLowerCase()];
      const res = fn ? fn(arg) : `<span class="p">command not found:</span> ${esc(c)}. Try <span class="s">help</span>.`;
      if (res) print(res);
      term.classList.remove('is-pulse'); void term.offsetWidth; term.classList.add('is-pulse');
    };
    const enable = () => {
      if (ready) return; ready = true;
      tform.hidden = false; term.classList.add('is-live');
      print('<span class="c"># Interactive now: type a command, or tap one below. Try </span><span class="s">help</span>');
      pending.forEach(run); pending = [];
    };
    if (tcode.dataset.ready === '1') enable();
    document.addEventListener('ak:term-ready', enable);
    tform.addEventListener('submit', e => { e.preventDefault(); const v = tin.value; tin.value = ''; run(v); });
    tin.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); tin.value = hist[hi]; }
      else if (e.key === 'ArrowDown' && hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); tin.value = hist[hi] || ''; }
      else if (e.key === 'Tab') {
        const v = tin.value.trim().toLowerCase(); const m = Object.keys(cmds).find(k => v && k.startsWith(v));
        if (m) { e.preventDefault(); tin.value = m + ' '; }
      }
    });
    $$('.term__chips button').forEach(b => b.addEventListener('click', () => {
      if (!ready) { pending.push(b.dataset.cmd); return; }
      run(b.dataset.cmd); if (fine) tin.focus({ preventScroll: true });
    }));
    tbody.addEventListener('click', () => { if (ready && fine && !window.getSelection().toString()) tin.focus({ preventScroll: true }); });
    AK.terminal = { run: c => (ready ? run(c) : pending.push(c)), focus: () => { if (ready) tin.focus({ preventScroll: true }); } };
  }

  /* =============== prompt → platform playground (scripted) =============== */
  const svg = $('#pg-svg'), log = $('#pg-log'), form = $('#pg-form'), input = $('#pg-input');
  if (svg && log && form && input) {
    const NS = 'http://www.w3.org/2000/svg';
    const hudL = $('#pg-hud-label'), hudV = $('#pg-hud-val'), stage = $('.pg__stage');
    const el = (tag, attrs = {}, parent = null) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    };
    const text = (parent, x, y, str, cls = 'pg-t', anchor = 'middle') => { const t = el('text', { x, y, 'text-anchor': anchor, class: cls }, parent); t.textContent = str; return t; };
    const icon = (parent, id, x, y, s) => el('use', { href: `#${id}`, x, y, width: s, height: s }, parent);
    class Cancel extends Error {}
    let token = 0, flows = [], stageOn = false, loopOn = false, interacted = false;
    const alive = tok => { if (tok !== token) throw new Cancel(); };
    const sleep = (ms, tok) => new Promise(r => setTimeout(r, reduce ? 0 : ms)).then(() => alive(tok));
    const easeOut = p => 1 - Math.pow(1 - p, 3);
    const tween = (ms, fn, tok, ease = easeOut) => new Promise(res => {
      if (reduce) { fn(1); res(); return; }
      const t0 = performance.now();
      const step = now => {
        if (tok !== token) { res(); return; }
        const p = Math.min((now - t0) / ms, 1); fn(ease(p));
        if (p < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    }).then(() => alive(tok));
    const fadeIn = (nodes, tok, ms = 450) => { nodes.forEach(n => n.style.opacity = 0); return tween(ms, p => nodes.forEach(n => { n.style.opacity = p; }), tok); };

    // packets flowing along paths
    const flowLoop = () => {
      if (!stageOn || !flows.length || document.hidden) { loopOn = false; return; }
      flows.forEach(f => {
        if (f.stopped) return;
        f.dots.forEach(d => {
          d.t += d.spd * f.speed; if (d.t > 1) d.t -= 1;
          const pt = f.path.getPointAtLength(d.t * f.len);
          d.c.setAttribute('cx', pt.x.toFixed(1)); d.c.setAttribute('cy', pt.y.toFixed(1));
          d.c.style.opacity = Math.sin(d.t * Math.PI).toFixed(2);
        });
      });
      requestAnimationFrame(flowLoop);
    };
    const startLoop = () => { if (!loopOn && stageOn && flows.length && !reduce) { loopOn = true; requestAnimationFrame(flowLoop); } };
    const addFlow = (g, d, n = 4, cls = '', speed = 1) => {
      const path = el('path', { d, class: `pg-flow ${cls}` }, g);
      const f = { path, len: path.getTotalLength(), speed, dots: [], stopped: false };
      if (!reduce) for (let i = 0; i < n; i++) f.dots.push({ c: el('circle', { r: 5, class: `pg-pkt ${cls}`, cx: -20, cy: -20 }, g), t: i / n, spd: 0.006 + Math.random() * 0.002 });
      flows.push(f); startLoop();
      return f;
    };
    const stopFlow = f => { f.stopped = true; f.dots.forEach(d => { d.c.style.opacity = 0; }); };
    new IntersectionObserver(([en]) => { stageOn = en.isIntersecting; startLoop(); }).observe(stage);

    const reset = () => {
      flows = []; svg.innerHTML = '';
      const defs = el('defs', {}, svg);
      const grad = (id, a, b) => { const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs); el('stop', { offset: 0, 'stop-color': a }, g); el('stop', { offset: 1, 'stop-color': b }, g); };
      grad('pgBlue', '#93c5fd', '#2563eb'); grad('pgTeal', '#5eead4', '#0d9488'); grad('pgViolet', '#c4b5fd', '#7c3aed'); grad('pgCoral', '#fda4af', '#e11d48'); grad('pgAmber', '#fde68a', '#f59e0b');
      const pat = el('pattern', { id: 'pgGrid', width: 28, height: 28, patternUnits: 'userSpaceOnUse' }, defs);
      el('path', { d: 'M28 0H0V28', fill: 'none', stroke: '#e0e7ff', 'stroke-width': 1 }, pat);
      el('rect', { x: 0, y: 0, width: 560, height: 380, fill: 'url(#pgGrid)', class: 'pg-bg' }, svg);
      return el('g', { class: 'pg-scene' }, svg);
    };
    const hud = (l, v = '') => { hudL.textContent = l; hudV.textContent = v; };

    const scenes = {
      migrate: {
        reply: "Planning the move: 78 environments from ECS on AWS to AKS on Azure. That's the program I led end to end: scope and estimate, re-architect with IaC and pipeline templates, then cut over within planned outage windows and within budget.",
        async play(tok, step) {
          const g = reset();
          const src = el('g', {}, g), dst = el('g', {}, g);
          el('rect', { x: 26, y: 50, width: 176, height: 290, rx: 24, class: 'pg-region pg-region--aws' }, src);
          icon(src, 'i-cloud-aws', 82, 58, 64); text(src, 114, 330, 'AWS · ECS', 'pg-sub');
          el('rect', { x: 358, y: 50, width: 176, height: 290, rx: 24, class: 'pg-region pg-region--az' }, dst);
          icon(dst, 'i-cloud-az', 414, 58, 64); text(dst, 446, 330, 'Azure · AKS', 'pg-sub');
          const srv = [...Array(6)].map((_, i) => el('rect', { x: 52, y: 136 + i * 30, width: 124, height: 20, rx: 6, class: 'pg-srv' }, src));
          const pods = [];
          for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) pods.push(el('rect', { x: 377 + c * 24, y: 136 + r * 30, width: 18, height: 20, rx: 5, class: 'pg-pod' }, dst));
          hud('Environments moved', '0');
          await fadeIn([src, dst], tok);
          step('Scoped & estimated');
          const fl = el('g', {}, g);
          [0, 1, 2].forEach(i => addFlow(fl, `M176 ${160 + i * 60} C 270 ${160 + i * 60}, 270 ${175 + i * 50}, 377 ${170 + i * 55}`, 4, i === 1 ? 'is-teal' : ''));
          await sleep(500, tok);
          step('Workloads re-architected with IaC and pipeline templates');
          await tween(3400, p => {
            hudV.textContent = Math.round(78 * p);
            const on = Math.round(pods.length * p), off = Math.round(srv.length * p);
            pods.forEach((pd, i) => pd.classList.toggle('is-on', i < on));
            srv.forEach((s, i) => s.classList.toggle('is-off', i < off));
          }, tok, p => p);
          step('Cut over within planned outage windows');
          flows.forEach(f => { f.speed = 0.35; });
          hud('Environments on Azure', '78');
          step('78 environments on Azure, within budget', true);
        }
      },
      pipeline: {
        reply: 'Adding a standard pipeline: commit, build, test, scan, deploy, observe. On the platforms I have built, pipelines and Infrastructure as Code replaced manual deployments and moved releases from monthly to weekly.',
        async play(tok, step) {
          const g = reset();
          const names = [['Commit', 'GitHub / Azure Repos', 'i-web'], ['Build', 'Docker / Azure DevOps', 'i-container'], ['Test', 'TDD / localstack', 'i-api'], ['Scan', 'SonarCloud / GitGuardian', 'i-shield'], ['Deploy', 'Terraform → AKS', 'i-rocket'], ['Observe', 'Datadog / Grafana', 'i-server']];
          const xs = names.map((_, i) => 75 + i * 82), ys = names.map((_, i) => (i % 2 ? 230 : 150));
          const d = xs.map((x, i) => (i ? `L${x} ${ys[i]}` : `M${x} ${ys[i]}`)).join(' ');
          el('path', { d, class: 'pg-track' }, g);
          const fill = el('path', { d, class: 'pg-track-fill' }, g);
          const L = fill.getTotalLength(); fill.style.strokeDasharray = L; fill.style.strokeDashoffset = L;
          const nodes = names.map(([n, tool, ic], i) => {
            const ng = el('g', { class: 'pg-stage' }, g);
            el('circle', { cx: xs[i], cy: ys[i], r: 30, class: 'pg-stage__c' }, ng);
            icon(ng, ic, xs[i] - 19, ys[i] - 19, 38);
            text(ng, xs[i], ys[i] + (i % 2 ? 52 : -58), n, 'pg-t');
            text(ng, xs[i], ys[i] + (i % 2 ? 68 : -42), tool, 'pg-sub pg-sub--sm');
            const ok = el('g', { class: 'pg-ok' }, ng);
            el('circle', { cx: xs[i] + 22, cy: ys[i] - 22, r: 9 }, ok); el('path', { d: `M${xs[i] + 18} ${ys[i] - 22} l3 3 l5 -6` }, ok);
            return ng;
          });
          const pkt = el('circle', { r: 7, class: 'pg-pkt pg-pkt--big', cx: xs[0], cy: ys[0] }, g);
          hud('Release cadence', 'Monthly');
          await fadeIn(nodes, tok, 400);
          for (let i = 0; i < names.length; i++) {
            const a = (L * i) / (names.length - 1), b = (L * (i + 1)) / (names.length - 1);
            nodes[i].classList.add('is-on');
            step(`${names[i][0]} · ${names[i][1]}`);
            if (i === names.length - 1) break;
            await tween(520, p => {
              const at = a + (b - a) * p; fill.style.strokeDashoffset = L - at;
              const pt = fill.getPointAtLength(at); pkt.setAttribute('cx', pt.x); pkt.setAttribute('cy', pt.y);
            }, tok);
          }
          hud('Release cadence', 'Weekly');
          step('Released: monthly → weekly', true);
        }
      },
      cost: {
        reply: 'Running a FinOps pass across AWS and Azure: architecture changes, Savings Plans, Reserved Instances and automated environment scheduling. On the real program that took annual cloud spend from USD $1.5M to $1.1M, about 27% lower.',
        async play(tok, step) {
          const g = reset();
          icon(g, 'i-cost', 34, 30, 64);
          text(g, 110, 58, 'Annual cloud spend (USD)', 'pg-sub', 'start');
          const big = text(g, 110, 96, '$1.50M', 'pg-big', 'start');
          el('rect', { x: 40, y: 120, width: 480, height: 34, rx: 17, class: 'pg-gauge-bg' }, g);
          const bar = el('rect', { x: 40, y: 120, width: 480, height: 34, rx: 17, class: 'pg-gauge' }, g);
          const cut = el('rect', { x: 392, y: 120, width: 128, height: 34, rx: 17, class: 'pg-gauge-cut' }, g); cut.style.opacity = 0;
          const levers = ['Architecture changes', 'Savings Plans & Reserved Instances', 'Automated environment scheduling'].map((t, i) => {
            const lg = el('g', { class: 'pg-lever' }, g);
            el('rect', { x: 40, y: 182 + i * 50, width: 330, height: 38, rx: 12, class: 'pg-lever__bg' }, lg);
            el('circle', { cx: 62, cy: 201 + i * 50, r: 9, class: 'pg-lever__dot' }, lg);
            text(lg, 82, 206 + i * 50, t, 'pg-t pg-t--sm', 'start');
            lg.style.opacity = 0; return lg;
          });
          const badge = el('g', { class: 'pg-badge' }, g);
          el('rect', { x: 392, y: 190, width: 128, height: 112, rx: 20 }, badge);
          text(badge, 456, 236, '−$400K', 'pg-badge__v');
          text(badge, 456, 262, 'a year', 'pg-sub');
          text(badge, 456, 284, '~27% lower', 'pg-badge__s');
          badge.style.opacity = 0;
          hud('Annual spend', '$1.5M');
          for (let i = 0; i < 3; i++) {
            await tween(380, p => { levers[i].style.opacity = p; levers[i].style.transform = `translateX(${(1 - p) * -16}px)`; }, tok);
            levers[i].classList.add('is-on');
            step(levers[i].textContent.trim());
            await sleep(180, tok);
          }
          cut.style.opacity = 1;
          await tween(1800, p => {
            const V = 1.5 - 0.4 * p; big.textContent = `$${V.toFixed(2)}M`;
            bar.setAttribute('width', (480 * V / 1.5).toFixed(1));
            hudV.textContent = `$${V.toFixed(2)}M`;
          }, tok);
          big.textContent = '$1.1M'; hudV.textContent = '$1.1M';
          await tween(450, p => { badge.style.opacity = p; badge.style.transform = `scale(${0.85 + 0.15 * p})`; }, tok);
          step('USD $1.5M → $1.1M a year (~27% lower)', true);
        }
      },
      k8s: {
        reply: "Shipping to Kubernetes: build the container image, roll it out with a rolling deployment, then scale out across the node pool. I run AKS, EKS and OCI Container Engine, and I'm a Certified Kubernetes Administrator (CKA).",
        async play(tok, step) {
          const g = reset();
          const img = el('g', {}, g);
          el('rect', { x: 24, y: 140, width: 110, height: 110, rx: 22, class: 'pg-card' }, img);
          icon(img, 'i-container', 49, 150, 60); text(img, 79, 232, 'image v2', 'pg-sub');
          const cl = el('g', {}, g);
          el('rect', { x: 170, y: 40, width: 366, height: 304, rx: 24, class: 'pg-region pg-region--k8s' }, cl);
          icon(cl, 'i-k8s', 186, 50, 44); text(cl, 238, 78, 'Kubernetes cluster', 'pg-t', 'start');
          const nodes = [0, 1, 2].map(i => { const x = 188 + i * 114; el('rect', { x, y: 104, width: 102, height: 222, rx: 16, class: 'pg-node' }, cl); text(cl, x + 51, 124, `node-${'abc'[i]}`, 'pg-sub pg-sub--sm'); return x; });
          const slot = (n, k) => ({ x: nodes[n] + 12 + (k % 2) * 42, y: 138 + Math.floor(k / 2) * 46 });
          const mk = (n, k, cls) => { const s = slot(n, k); return el('rect', { x: s.x, y: s.y, width: 36, height: 36, rx: 9, class: `pg-kpod ${cls}` }, cl); };
          const old = [];
          [0, 1, 2].forEach(n => [0, 1].forEach(k => old.push(mk(n, k, 'is-old'))));
          hud('Deployment', 'v1');
          await fadeIn([img, cl], tok);
          step('Image built (Docker)');
          const fl = el('g', {}, g);
          const f = addFlow(fl, 'M134 195 C 160 195, 165 215, 188 215', 3, 'is-teal', 0.8);
          await sleep(500, tok);
          step('Rolling deployment started');
          hud('Rolling deployment', 'v1 → v2');
          const fresh = [];
          for (let k = 0; k < 6; k++) {
            const n = k % 3, idx = Math.floor(k / 3);
            const p = mk(n, idx + 2, 'is-new'); fresh.push(p);
            await tween(260, q => { p.style.opacity = q; p.style.transform = `scale(${0.4 + 0.6 * q})`; }, tok);
            const o = old[n * 2 + idx];
            await tween(200, q => { o.style.opacity = 1 - q; }, tok);
          }
          step('New pods healthy, old pods retired');
          hud('Scaling out', 'v2');
          for (let k = 0; k < 6; k++) {
            const n = k % 3, idx = Math.floor(k / 3);
            const p = mk(n, idx + 4, 'is-new');
            await tween(200, q => { p.style.opacity = q; p.style.transform = `scale(${0.4 + 0.6 * q})`; }, tok);
          }
          [0, 1, 2].forEach(n => [0, 1].forEach(k => { const o = old[n * 2 + k]; o.remove(); const p = mk(n, k, 'is-new'); p.style.opacity = 0; tween(300, q => { p.style.opacity = q; }, tok).catch(() => {}); }));
          stopFlow(f);
          hud('Running', 'v2 · scaled out');
          step('Scaled out across the node pool', true);
        }
      },
      dr: {
        reply: 'Simulating a regional outage: health checks fail on the primary region, traffic shifts to the secondary region and the platform keeps serving. DR testing is part of how I run platforms. (Illustrative.)',
        async play(tok, step) {
          const g = reset();
          const top = el('g', {}, g);
          el('rect', { x: 200, y: 22, width: 160, height: 64, rx: 18, class: 'pg-card' }, top);
          icon(top, 'i-web', 212, 32, 44); text(top, 300, 60, 'Users', 'pg-t', 'start');
          const mkRegion = (x, label) => {
            const rg = el('g', { class: 'pg-dr' }, g);
            el('rect', { x, y: 170, width: 220, height: 180, rx: 22, class: 'pg-region pg-region--dr' }, rg);
            text(rg, x + 110, 198, label, 'pg-t');
            icon(rg, 'i-server', x + 28, 216, 64); icon(rg, 'i-db', x + 128, 216, 64);
            const st = text(rg, x + 110, 326, 'Standby', 'pg-sub'); rg._st = st; return rg;
          };
          const pri = mkRegion(30, 'Primary region'), sec = mkRegion(310, 'Secondary region');
          pri._st.textContent = 'Active';
          pri.classList.add('is-active');
          hud('Traffic', 'Primary region');
          await fadeIn([top, pri, sec], tok);
          const fl = el('g', {}, g);
          const fp = addFlow(fl, 'M260 86 C 240 120, 160 130, 140 170', 4);
          const rep = addFlow(fl, 'M250 290 C 280 300, 290 300, 310 290', 3, 'is-violet', 0.6);
          step('Replication to the secondary region healthy');
          await sleep(1400, tok);
          pri.classList.remove('is-active'); pri.classList.add('is-down'); pri._st.textContent = 'Health checks failing';
          stopFlow(fp); stopFlow(rep);
          hud('Primary region', 'Unhealthy');
          step('Primary health checks failing (simulated)');
          await sleep(900, tok);
          addFlow(fl, 'M300 86 C 320 120, 400 130, 420 170', 4, 'is-teal');
          sec.classList.add('is-active'); sec._st.textContent = 'Active';
          hud('Traffic', 'Secondary region');
          step('Traffic switched to the secondary region');
          await sleep(600, tok);
          step('Platform still serving', true);
        }
      },
      fallback: {
        reply: "I'm a scripted demo, so I only know a handful of changes. Try one of the presets below, like \"cut cloud costs\" or \"enable DR failover\".",
        async play(tok) {
          const g = reset();
          icon(g, 'i-rocket', 238, 110, 84);
          text(g, 280, 240, 'Pick a preset to see it run', 'pg-t');
          hud('Waiting for a prompt', '');
          $$('.pg-chip').forEach((c, i) => setTimeout(() => { c.classList.remove('is-hint'); void c.offsetWidth; c.classList.add('is-hint'); }, i * 90));
        }
      }
    };
    const intent = q => {
      q = q.toLowerCase();
      if (/fail ?over|disaster|\bdr\b|outage|resilien|backup|recovery|\bha\b/.test(q)) return 'dr';
      if (/cost|cheap|spend|saving|finops|budget|bill|reduce|\$/.test(q)) return 'cost';
      if (/migrat|move|lift|azure|aws|transfer|cut ?over/.test(q)) return 'migrate';
      if (/kube|k8s|pod|container|scale|aks|eks|helm|docker|deploy/.test(q)) return 'k8s';
      if (/pipeline|ci ?\/? ?cd|\bci\b|\bcd\b|release|build|devops|test/.test(q)) return 'pipeline';
      return 'fallback';
    };

    const addMsg = (who, str = '') => {
      const p = document.createElement('div');
      p.className = `pg__msg pg__msg--${who}`;
      if (who === 'user') p.textContent = str; else p.innerHTML = '<p class="pg__reply"></p><ul class="pg__steps"></ul>';
      log.appendChild(p);
      while (log.children.length > 9) log.removeChild(log.firstElementChild);
      log.scrollTop = log.scrollHeight;
      return p;
    };
    const typeInto = (node, str, tok) => new Promise(res => {
      if (reduce) { node.textContent = str; res(); return; }
      let i = 0; node.classList.add('is-typing');
      const tick = () => {
        if (tok !== token) { node.textContent = str; node.classList.remove('is-typing'); res(); return; }
        i = Math.min(str.length, i + 2); node.textContent = str.slice(0, i);
        log.scrollTop = log.scrollHeight;
        if (i < str.length) setTimeout(tick, 16); else { node.classList.remove('is-typing'); res(); }
      };
      tick();
    });
    const busy = on => { stage.classList.toggle('is-busy', on); form.classList.toggle('is-busy', on); };
    const runPrompt = async (q, tok) => {
      const key = intent(q); const sc = scenes[key];
      addMsg('user', q);
      const bot = addMsg('bot');
      const ul = $('.pg__steps', bot);
      const step = (t, done) => { const li = document.createElement('li'); li.textContent = t; if (done) li.className = 'is-done'; ul.appendChild(li); log.scrollTop = log.scrollHeight; };
      stage.dataset.scene = key; busy(true);
      try { await Promise.all([typeInto($('.pg__reply', bot), sc.reply, tok), sc.play(tok, step)]); }
      catch (e) { if (!(e instanceof Cancel)) throw e; }
      finally { if (tok === token) busy(false); }
    };
    const submit = q => { q = q.trim().slice(0, 90); if (!q) return; token++; runPrompt(q, token).catch(() => {}); };
    const typePrompt = async q => {
      token++; const tok = token;
      if (!reduce) for (let i = 1; i <= q.length; i++) { if (tok !== token) return; input.value = q.slice(0, i); await new Promise(r => setTimeout(r, 22)); }
      input.value = '';
      if (tok === token) submit(q);
    };
    form.addEventListener('submit', e => { e.preventDefault(); interacted = true; const q = input.value; input.value = ''; submit(q); });
    $$('.pg-chip').forEach(c => c.addEventListener('click', () => { interacted = true; typePrompt(c.dataset.prompt); }));
    input.addEventListener('focus', () => { interacted = true; });
    // idle stage
    (() => { const g = reset(); icon(g, 'i-cloud-az', 120, 120, 90); icon(g, 'i-k8s', 235, 150, 90); icon(g, 'i-cloud-aws', 350, 120, 90); text(g, 280, 300, 'Type a change or pick a preset', 'pg-t'); })();
    // teaser: auto-run the first preset the first time the playground is seen
    const tio = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return; tio.disconnect();
      setTimeout(() => { if (!interacted) typePrompt($('.pg-chip').dataset.prompt); }, 700);
    }, { threshold: 0.45 });
    tio.observe(stage);
    AK.playground = { run: q => { interacted = true; typePrompt(q); } };
  }

  /* =============== command palette =============== */
  const cmdk = $('#cmdk'), cin = $('#cmdk-input'), clist = $('#cmdk-list');
  if (cmdk && cin && clist) {
    const linkedin = ($('a[href*="linkedin.com"]') || {}).href;
    const secItems = [['Home', '#hero', 'Top of the page'], ['Impact', '#impact', 'Outcomes, in numbers'], ['Profile', '#about', 'About me'], ['Code → cloud', '#iac', 'Terraform terminal & diagram'], ['Prompt playground', '#playground', 'Prompt → platform demo'], ['Migration in motion', '#story', 'AWS → Azure story'], ['Delivery pipeline', '#pipeline', 'CI/CD stages'], ['Expertise', '#expertise', 'What I do'], ['Migrations delivered', '#migrations', 'Cloud migrations'], ['Projects', '#projects', 'Platforms & programs'], ['Experience', '#experience', 'Career timeline'], ['Tech stack', '#skills', 'Languages, frameworks & platforms'], ['Credentials', '#credentials', 'Certifications & education'], ['Contact', '#contact', 'Get in touch']]
      .map(([label, href, hint]) => ({ group: 'Jump to', label, hint, icon: '↳', run: () => go(href) }));
    const prompts = ['Migrate 78 environments to Azure', 'Add a CI/CD pipeline', 'Cut cloud costs', 'Deploy to Kubernetes', 'Enable DR failover']
      .map(p => ({ group: 'Playground', label: `Run: ${p}`, hint: 'Scripted demo', icon: '✦', run: () => { go('#playground'); setTimeout(() => AK.playground && AK.playground.run(p), 900); } }));
    const actions = [
      { label: 'Open the terminal', hint: "Type 'help'", icon: '>_', run: () => { go('#iac'); setTimeout(() => AK.terminal && AK.terminal.focus(), 1100); } },
      linkedin && { label: 'Message me on LinkedIn', hint: 'Opens in a new tab', icon: '↗', run: () => window.open(linkedin, '_blank', 'noopener') },
      { label: 'Back to top', hint: 'Scroll to the top', icon: '↑', run: () => go('#hero') }
    ].filter(Boolean).map(a => ({ group: 'Actions', ...a }));
    const all = [...secItems, ...prompts, ...actions];
    let shown = all, active = 0, lastFocus = null;
    const toast = msg => {
      const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
      document.body.appendChild(t); setTimeout(() => t.classList.add('is-out'), 1800); setTimeout(() => t.remove(), 2300);
    };
    const score = (item, q) => {
      if (!q) return 1;
      const hay = `${item.label} ${item.hint} ${item.group}`.toLowerCase();
      const toks = q.split(/\s+/).filter(Boolean);
      if (toks.every(t => hay.includes(t))) return 2 + (item.label.toLowerCase().startsWith(toks[0]) ? 1 : 0);
      let i = 0; for (const ch of hay) { if (ch === q[i]) i++; if (i === q.length) return 0.5; }
      return 0;
    };
    const render = () => {
      const q = cin.value.trim().toLowerCase();
      shown = all.map(it => ({ it, s: score(it, q) })).filter(x => x.s > 0).sort((a, b) => (q ? b.s - a.s : 0)).map(x => x.it);
      active = Math.min(active, Math.max(0, shown.length - 1));
      let html = '', group = '';
      shown.forEach((it, i) => {
        if (!q && it.group !== group) { group = it.group; html += `<li class="cmdk__group" role="presentation">${esc(group)}</li>`; }
        html += `<li class="cmdk__item${i === active ? ' is-active' : ''}" role="option" id="cmdk-o${i}" data-i="${i}" aria-selected="${i === active}"><span class="cmdk__ic" aria-hidden="true">${esc(it.icon)}</span><span class="cmdk__label">${esc(it.label)}</span><span class="cmdk__hint">${esc(it.hint)}</span></li>`;
      });
      if (!shown.length) html = '<li class="cmdk__empty" role="presentation">No matches. Try "projects" or "costs".</li>';
      clist.innerHTML = html;
      cin.setAttribute('aria-activedescendant', shown.length ? `cmdk-o${active}` : '');
    };
    const setActive = i => {
      if (!shown.length) return;
      active = (i + shown.length) % shown.length;
      $$('.cmdk__item', clist).forEach(li => { const on = +li.dataset.i === active; li.classList.toggle('is-active', on); li.setAttribute('aria-selected', on); if (on) li.scrollIntoView({ block: 'nearest' }); });
      cin.setAttribute('aria-activedescendant', `cmdk-o${active}`);
    };
    const isOpen = () => !cmdk.hidden;
    const open = () => {
      if (isOpen()) return;
      if (document.body.classList.contains('menu-open')) { const t = $('.nav__toggle'); if (t) t.click(); }
      lastFocus = document.activeElement;
      cmdk.hidden = false; cin.value = ''; active = 0; render();
      requestAnimationFrame(() => cmdk.classList.add('is-open'));
      if (AK.lenis) AK.lenis.stop();
      document.documentElement.classList.add('cmdk-lock');
      cin.focus({ preventScroll: true });
    };
    const close = () => {
      if (!isOpen()) return;
      cmdk.classList.remove('is-open');
      document.documentElement.classList.remove('cmdk-lock');
      if (AK.lenis) AK.lenis.start();
      setTimeout(() => { cmdk.hidden = true; }, reduce ? 0 : 180);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    const exec = i => { const it = shown[i]; if (!it) return; close(); setTimeout(() => it.run(), 60); };
    cin.addEventListener('input', () => { active = 0; render(); });
    cin.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); exec(active); }
      else if (e.key === 'Tab') { e.preventDefault(); setActive(active + (e.shiftKey ? -1 : 1)); }
    });
    clist.addEventListener('click', e => { const li = e.target.closest('.cmdk__item'); if (li) exec(+li.dataset.i); });
    clist.addEventListener('pointermove', e => { const li = e.target.closest('.cmdk__item'); if (li && +li.dataset.i !== active) setActive(+li.dataset.i); });
    cmdk.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); isOpen() ? close() : open(); return; }
      if (e.key === 'Escape' && isOpen()) { e.preventDefault(); close(); return; }
      if (e.key === '/' && !isOpen() && !isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
    });
    $$('.nav__cmd, [data-open-cmdk]').forEach(b => b.addEventListener('click', open));
    AK.palette = { open, close };
  }
})();
