# Aditya Kachroo · Personal portfolio

A fast, animated single-page portfolio for a full-stack cloud engineer. It is plain HTML, CSS and JavaScript with **no build step**, so it can be hosted free on GitHub Pages (or any static host).

## Structure

```
index.html                 All content (one page, semantic sections)
assets/css/style.css       Light colourful theme, layout, responsive rules, reduced-motion rules
assets/js/main.js          All animation and interaction logic
assets/img/favicon.svg     "AK" favicon
assets/img/certs/          Certification badges
.nojekyll                  Tells GitHub Pages to serve files as-is
```

The glossy 3D-style icons are hand-made inline SVG symbols (a hidden `<svg>` sprite at the top of `index.html`), reused with `<use href="#i-…">`. There are no external image assets.

## Libraries (loaded from the jsDelivr CDN)

| Library | Used for |
|---|---|
| GSAP 3.12.5 + ScrollTrigger | Pinned and scroll-scrubbed sections, text reveals, intro timeline |
| Lenis 1.1.13 | Smooth scrolling (switched off for reduced motion) |
| Three.js 0.160.0 | Hero 3D scene. It is only imported (via dynamic `import()`) on desktop screens with WebGL, and not when reduced motion or data-saver is on |

### Graceful fallbacks

- **CDN cannot be reached:** every piece of content is in the HTML. Reveals, counters, the pipeline and the migration story fall back to IntersectionObserver-driven animations. The hero falls back to a lightweight 2D canvas network.
- **Mobile, low power or no WebGL:** 2D canvas hero. The horizontal gallery becomes a native swipe carousel, and pinned sections become simple on-scroll animations.
- **`prefers-reduced-motion`:** no smooth scroll, no pinning and no looping motion. Final states (full code, finished diagram, 78 environments) are shown immediately.
- Animation loops pause when their section is off screen or the tab is hidden.

## Sections and animations

| Section | Animations |
|---|---|
| Hero | WebGL scene of cloud clusters, containers and servers with data packets and pointer parallax, floating glossy icons, typed role line, animated gradient mesh |
| Tech marquee | Two-row infinite marquee |
| Impact | Counters, plus a cost chart with bars growing from USD $1.5M to $1.1M |
| Profile | At-a-glance tilt card |
| Code → cloud | Terminal typing an illustrative Terraform `apply`, while the infrastructure diagram draws itself |
| Migration in motion | Pinned, scroll-scrubbed AWS → Azure story: packets flow, servers retire, pods light up, counter runs to 78 |
| Delivery | CI/CD stages light up in sequence on scroll |
| Expertise | Bento cards, with Kubernetes pods that assemble into nodes |
| Migrations | Horizontal pinned gallery of tilt cards (a swipe carousel on mobile) |
| Projects, Experience, Skills, Credentials | Staggered reveals, timeline progress line, skill filters |
| Contact | Magnetic buttons, orbiting icons, copy-email button |
| Footer | Large wordmark reveal, back-to-top button with scroll-progress ring |

There is also a floating pill navigation that hides on scroll down, shows on scroll up and has a sliding active indicator. On mobile it opens a full-screen menu. On desktop there is a cursor follower.

## Editing

- **Text:** edit `index.html` directly. Every section is a `<section id="…">` and the order on the page matches the order in the file.
- **Metrics:** stat counters use `data-to="…"` (the number counted to). The visible number in the HTML is the no-JS fallback, so keep both in sync.
- **Typed roles in the hero:** see the `roles` array in `assets/js/main.js`.
- **Terraform snippet:** see the `codeLines` array in `assets/js/main.js` (illustrative only).
- **Colours:** CSS custom properties at the top of `assets/css/style.css`.
- **Certificates:** replace the images in `assets/img/certs/` and keep the same filenames, or update the `src` paths.

To preview locally:

```bash
cd portfolio-site
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages (free)

### Option A: user site at `https://akachroo762.github.io/`

1. On GitHub, create a **public** repository named exactly `akachroo762.github.io`.
2. Push this folder to it:
   ```bash
   cd portfolio-site
   git remote add origin https://github.com/akachroo762/akachroo762.github.io.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, then set **Branch** to `main` and the folder to `/ (root)`, and save.
4. After a minute or two the site is live at `https://akachroo762.github.io/`.

### Option B: project site

Use any repository name (for example `portfolio`) and follow the same steps. The site is then served at `https://akachroo762.github.io/portfolio/`. All asset paths are relative, so this works without changes.

### Updating

Commit and push to `main`. GitHub Pages redeploys automatically.

### Custom domain (optional)

In **Settings → Pages → Custom domain**, enter the domain, add the DNS records GitHub shows, then tick **Enforce HTTPS**.

### Alternative: Cloudflare Pages

Connect the repository in Cloudflare Pages. Choose framework preset *None*, leave the build command empty and set the output directory to `/`.
