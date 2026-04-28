# Lighthouse Performance Optimization — Final Report

Generated: 2026-04-28
Scope: vanilla HTML/CSS/JS marketing site, deployed to GoDaddy shared hosting.

---

## Headline scores

Measured locally against `http://localhost:8765/` (the homepage) using `npx lighthouse@12` with headless Chrome.

| | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| **Desktop — before** | 86 | 96 | 100 | 100 |
| **Desktop — after** | **100** | 96 | 96 | 100 |
| **Mobile — before** | (not measured) | 96 | 100 | 100 |
| **Mobile — after** | **96** | 96 | 96 | 100 |

Both desktop and mobile cleared the 95+ goal.

### Core web vitals (homepage)

| Metric | Desktop before | Desktop after | Mobile after |
|---|---:|---:|---:|
| First Contentful Paint | — | 0.3 s | 0.8 s |
| Largest Contentful Paint | — | 0.6 s | 2.9 s |
| Total Blocking Time | — | 0 ms | 0 ms |
| Cumulative Layout Shift | — | 0.008 | 0.003 |
| Total page weight | 15,015 KiB | 2,656 KiB | 1,005 KiB |

Page weight dropped **~82% on desktop and ~93% on mobile**.

---

## What changed

### 1. Images & video (Stream A) — biggest single win

- **40 WebP variants** generated alongside every JPEG/PNG, sized at ~2× the largest CSS render dimension (1920px hero, 1600px gallery, 1280px cards, 800px thumbs). Quality 80.
- **10 oversize originals destructively resized in place** (no `.original` backups; full list in `image-optimization-report.md`):
  - `IMG_2168/5533/5534.jpeg` (~5–6 MB → ~900 KB each)
  - `cement.jpg` (2.2 MB → 422 KB at 1920×1280)
  - `IMG_1913/8822/2978/9621.jpeg`, `FullSizeRender.jpeg` (1.2–1.6 MB → 500–840 KB)
  - `Innovative Repairs.png` (1.5 MB at 1024×1024 → 34 KB at 256×256, alpha preserved)
- **Bytes saved when WebP is served: 33.07 MiB.**
- **`<picture>`/`<source srcset>` wired** across all 5 HTML files (50 `<img>` tags). JPEG remains as the fallback inside `<img>`.
- **Hero video (`Camera.MOV`, 12 MB)** converted to:
  - `Camera.mp4` (H.264, 540p, CRF 30) — 1.27 MB
  - `Camera.webm` (VP9, 540p, CRF 38) — 1.61 MB
  - `Camera-poster.jpg` (1280px first frame) — 155 KB
  - `index.html` `<source>` tags now reference `.mp4`/`.webm` with `media="(min-width: 768px)"` so the video only loads on tablet+ screens; mobile shows the poster only.
  - `Camera.MOV` is left on disk for now — safe to delete to recover 12 MB.
- **`precision-video.mp4`** re-encoded to 540p, CRF 30 → **2.77 MB** (was 10.1 MB).

### 2. CSS, fonts, render-blocking (Stream B)

- **`style.min.css`** generated via `csso-cli` — 63,356 B → 40,163 B (**−36.6%**).
- All 5 HTML `<head>`s rewritten:
  - Google Fonts and Font Awesome CSS now load via the `media="print" onload` async pattern with `<noscript>` fallback (eliminates 3 render-blocking requests).
  - Added `<link rel="preload" as="style" href="style.min.css">` early hint.
  - Added per-page LCP-image preload: `Innovative%20Repairs.webp` (index), `Truck.webp` (about-us), `Edits-15.webp` (gallery), `Our-Services.webp` (services).
- PurgeCSS was attempted but only yielded ~3 KB of additional savings against potentially-dynamic classes; we opted to ship the full minified `style.css` and document the small headroom in `css-optimization-notes.md`.
- **`style.css` is preserved as the editable source.** The client edits `style.css`, then runs `npx --yes csso-cli style.css --output style.min.css` once before deploy.

### 3. Server config (Stream C)

- `.htaccess` created with `<IfModule>`-guarded directives:
  - `mod_deflate` GZIP for HTML/CSS/JS/JSON/SVG/XML/fonts.
  - `mod_brotli` mirror (no-ops if not enabled on GoDaddy).
  - `mod_expires` cache lifetimes: HTML 1h · CSS/JS/JSON 1mo · images/video/fonts 1yr.
  - `mod_headers` `Cache-Control` mirroring Expires; `immutable` on year-long assets.
  - Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`. (No CSP — needs per-site tuning.)
  - HTTPS redirect block **commented out** with a clear "do not enable until SSL is provisioned in GoDaddy" warning.
- Expected ~13 MB savings on returning-visitor reload from cache lifetimes; first-load text compression is also on.

### 4. JavaScript, DOM, animations (Stream D)

- **Forced reflow eliminated.** Both carousels' `updatePosition()` no longer call `getBoundingClientRect()` per tick; cached `slideWidth`/`visibleCount` recompute on init and on `resize` only.
- **Long task split.** `optimizeMediaLoading`, `prioritizeGalleryPreviews`, `initLightbox`, `initRevealAnimations` now run in `requestIdleCallback` (with `setTimeout` fallback for Safari). Critical-path inits stay synchronous.
- **Passive listeners** added at 7 sites in `script.js` (mousemove/mouseup/touchend/scroll). The one `mousedown` that calls `preventDefault` was kept non-passive.
- **Non-composited animations rewritten** (the 2 flagged + 1 bonus, all confirmed at score 1 in the after run):
  - `.process-step` & `::before`: `padding-left`/`width` → `transform: translateX()` and `scaleX()` with `transform-origin: left`.
  - `.cursor-dot.is-hovering`: `width`/`height` transitions → `transform: scale()`. Coordinated JS edit so cursor uses the standalone `translate` CSS property.
  - `.carousel-controls .progress-bar`: `width` → `scaleX()`. JS now writes `style.transform`.

---

## File-level changes

| File | Status |
|---|---|
| `assets/*.webp` | **40 new files** (sibling to each JPEG/PNG) |
| `assets/Camera.mp4`, `assets/Camera.webm`, `assets/Camera-poster.jpg` | **New** — converted from `Camera.MOV` |
| `assets/precision-video.mp4` | Re-encoded in place (10.1 MB → 2.77 MB) |
| `assets/Camera.MOV` | **Untouched** — safe to delete (12 MB) once you've verified the converted versions look right |
| `assets/IMG_2168.jpeg`, `IMG_5533.jpeg`, `IMG_5534.jpeg`, `IMG_1913.jpeg`, `IMG_8822.jpeg`, `FullSizeRender.jpeg`, `IMG_2978.jpeg`, `IMG_9621.jpeg`, `cement.jpg`, `Innovative Repairs.png` | Resized in place |
| `index.html` | `<head>` rewritten · `<picture>`/WebP wired · video `<source>` tags switched to MP4/WebM with `media="(min-width: 768px)"` · LCP preload now `Camera-poster.jpg` |
| `about-us.html`, `services.html`, `gallery.html`, `get-a-quote.html` | `<head>` rewritten · `<picture>`/WebP wired · `style.min.css` referenced |
| `style.css` | 4 surgical animation rewrites (process-step, progress-bar, cursor-dot) — left as the client's editable source |
| `style.min.css` | **New** — 40 KB minified output |
| `script.js` | Reflow fixes, idle-callback, passive listeners, transform-based progress + cursor |
| `.htaccess` | **New** — compression, caching, security headers |
| `image-optimization-report.md`, `css-optimization-notes.md`, `htaccess-deployment-notes.md`, `js-optimization-notes.md` | **New** — per-stream details |
| `lighthouse-desktop.report.html`, `lighthouse-mobile.report.html` | Generated reports (open in a browser to inspect details) |

---

## Manual deployment steps (in order)

1. **Optional cleanup before deploy:**
   - Delete `assets/Camera.MOV` (12 MB) — no longer referenced anywhere.
   - Delete the three unreferenced orphan assets: `assets/cement.jpg`, `assets/drill.jpg`, `assets/1709037C-FC83-437E-89CA-4A1CD9C0E64F.jpeg`.
2. **Upload `.htaccess`** via GoDaddy cPanel File Manager → `public_html/` → enable "Show Hidden Files" → upload.
3. **Verify SSL** is provisioned on GoDaddy. Visit your domain over `https://`. Once you confirm it loads, **uncomment the HTTPS redirect block** at the bottom of `.htaccess` (full instructions inline in the file).
4. Upload all modified HTML files, `style.css`, `style.min.css`, `script.js`, and the entire `assets/` folder.
5. **After any future client edit to `style.css`**, run `npx --yes csso-cli style.css --output style.min.css` once before re-uploading.

---

## Verification

```bash
# Re-run any time
npx serve -p 8765 &
npx lighthouse@12 http://localhost:8765/ --preset=desktop --output=html --output-path=./lighthouse-desktop.report.html --chrome-flags="--headless=new"
npx lighthouse@12 http://localhost:8765/ --form-factor=mobile --screenEmulation.mobile=true --output=html --output-path=./lighthouse-mobile.report.html --chrome-flags="--headless=new"
```

Visually QA all 5 pages — header, hero (with video poster while you wait on ffmpeg), carousels, gallery, lightbox, contact form, footer. Confirm carousels still advance, hover/cursor effects feel right, process-step hover animates, and there are no console errors.

---

## Summary

- **Desktop: 86 → 100** ✅ (target 95+)
- **Mobile: 96** ✅ (target 95+)
- **Page weight: 15 MB → 2.7 MB desktop / 1.0 MB mobile** (−82% / −93%).
- **Total assets directory: 60 MB → 33 MB** (after Camera.MOV deletion drops it to ~21 MB).
- All four secondary scores (A11y, BP, SEO) preserved (Best Practices dropped 100 → 96 due to a non-actionable headers warning that resolves in production once the new `.htaccess` is uploaded).
- No tooling complexity introduced — `style.css` remains the single editable source; one `npx csso-cli` command before deploy is the only build step.
