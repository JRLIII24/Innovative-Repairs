# CSS / Render-Blocking Optimization Notes

Stream B of the Lighthouse 95+ pass. Render-blocking, font display, CSS minification, and unused-CSS audit. No build pipeline introduced — the workflow is "edit `style.css`, run one command, deploy."

---

## 1. Files changed

| File | Change |
|---|---|
| `index.html` | Head rewritten (async fonts + FA + preload `style.min.css` + image preload) |
| `about-us.html` | Same head rewrite + LCP image preload |
| `services.html` | Same head rewrite + LCP image preload |
| `gallery.html` | Same head rewrite + LCP image preload |
| `get-a-quote.html` | Same head rewrite (no LCP image preload — iframe LCP) |
| `style.min.css` | **NEW** — minified production stylesheet |
| `style.css` | **Untouched.** This remains the client's editable source. |

---

## 2. Render-blocking strategy (Option B)

**Chose Option B** — keep `style.min.css` as a normal `<link rel="stylesheet">`, but kick off the fetch early via `<link rel="preload" as="style">` placed before any blocking stylesheet declaration.

**Why not Option A (inline critical CSS)?**
- Five different above-the-fold sections (cinema-hero, image hero on services/about, gallery grid, quote layout) → would need five separate critical-CSS extractions, re-pasted into HTML. The user has no build pipeline; every future style edit would mean re-running critical CSS extraction on five files. Long-term maintenance liability.
- FOUC risk: stale inline critical CSS vs. updated `style.css` would flash old styles, then jump.
- Goal is 95+, not 100. The ~100–200 ms we'd gain over Option B isn't worth the maintenance cost.

**The Option-B head pattern (applied to all 5 pages):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>

<!-- Early hints: kick off fetches in parallel with HTML parse -->
<link rel="preload" as="style" href="style.min.css">
<link rel="preload" as="style" href="<google-fonts-url>">
<link rel="preload" as="style" href="<font-awesome-url>" crossorigin="anonymous">
<link rel="preload" as="image" href="<page-LCP-image>" fetchpriority="high"> <!-- when applicable -->

<!-- Local CSS stays render-blocking (it's layout-critical) -->
<link rel="stylesheet" href="style.min.css">

<!-- Remote CSS becomes async via the print-then-all trick -->
<link rel="stylesheet" href="<google-fonts-url>" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="<google-fonts-url>"></noscript>

<link rel="stylesheet" href="<font-awesome-url>" ... media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="<font-awesome-url>" ...></noscript>
```

**Net effect:** Google Fonts CSS and Font Awesome CSS are no longer render-blocking. `style.min.css` *is* still render-blocking but is preloaded and 36% smaller than `style.css`. Fonts have `&display=swap` already, so text shows immediately in fallback (`Times New Roman`, `Arial Narrow`, `system-ui`, `Menlo`) and swaps when web fonts arrive — FOUT, not FOIT.

`<noscript>` fallbacks ensure JS-disabled users still get fully styled fonts and icons.

`dns-prefetch` for cdnjs was upgraded to a full `preconnect` (with `crossorigin` because the integrity hash is on the same domain).

---

## 3. Per-page LCP image preload

| Page | Preloaded asset | Notes |
|---|---|---|
| `index.html` | `assets/Innovative Repairs.png` | Pre-existing logo preload kept (cinema-hero `<video>` has no poster, so logo is the only above-the-fold image). |
| `about-us.html` | `assets/Truck.jpeg` | New — image hero. |
| `services.html` | `assets/Our-Services.jpeg` | New — video poster. |
| `gallery.html` | `assets/Edits-15.jpg` | New — first gallery item. |
| `get-a-quote.html` | *(none)* | LCP is the iframe; preloading would only steal bandwidth from CSS. |

### IMPORTANT — coordinate with image agent

When the image agent finishes WebP/AVIF conversion, the `<link rel="preload" as="image">` href on every page **must** be updated to point at the new file (and `type="image/webp"` should be added). If preload `href` doesn't match the actual `<img src>` (or `srcset` candidate) the browser picks, the preload is wasted. Specifically:

```html
<!-- Current -->
<link rel="preload" as="image" href="assets/Truck.jpeg" fetchpriority="high">

<!-- After WebP conversion (example) -->
<link rel="preload" as="image" href="assets/Truck.webp" type="image/webp" fetchpriority="high">
```

Same template for all four image-preloading pages.

---

## 4. Minification

```bash
npx --yes csso-cli style.css --output style.min.css
```

| File | Size | Reduction |
|---|---|---|
| `style.css` (source, untouched) | 63,356 bytes (~62 KB) | — |
| `style.min.css` (deployed) | 40,163 bytes (~39 KB) | **−36.6%** (−23,193 bytes) |

Brace integrity verified: `style.css` has 368 matched `{`/`}` pairs; `style.min.css` has 386 matched pairs (csso splits/merges some selectors during optimization, so a slightly different brace count is expected and benign).

---

## 5. PurgeCSS audit — what was scanned, what was removed, what was kept

Ran PurgeCSS with `style.css` against all 5 HTML files plus `script.js` as content sources. Used a config file (`purgecss.config.cjs`, since deleted) with the following safelist:

```js
standard: [
  "is-visible", "is-ready", "is-open", "is-hovering",
  "active", "dragging", "gallery-item-hidden", "lightbox-open",
  "cursor-dot",
  "lightbox", "lightbox-figure", "lightbox-image",
  "lightbox-caption", "lightbox-close", "lightbox-nav",
  "lightbox-prev", "lightbox-next",
  "fa-bars", "fa-xmark",
  // Stream D edited rules
  "process-step", "progress-bar", "carousel-controls",
  // Forward-compat
  "fancy-button", "image-marquee", "image-marquee-track", "image-marquee-item",
  "split-word", "hero-meta", "col-image-overlay", "dot",
],
greedy: [
  /^fa-/, /^lightbox/, /^process-step/, /^image-marquee/,
  /^split-word/, /^hero-meta/, /data-/, /-aos/, /-reveal/,
  /-parallax/, /-counter/, /-magnetic/,
],
```

PurgeCSS-purged size: ~58.8 KB (from 62 KB) — only **3 KB / ~5%** of additional savings beyond minification, all in selectors that **may be re-added** to HTML in the future.

### Selectors PurgeCSS proposed removing

These are NOT currently in any HTML, but per the plan's "If any uncertainty at all, KEEP IT" rule, **all of these were preserved** in the final `style.min.css`:

| Selector(s) | Reason kept |
|---|---|
| `input:focus-visible`, `textarea:focus-visible`, `select:focus-visible` (kept as part of grouped rule with `button:focus-visible` and `a:focus-visible`) | Form-element focus styling. The quote page uses an iframe form, but any future native form (newsletter, contact, etc.) needs this. Cost: ~80 bytes. |
| `h5`, `h6` (in grouped `h1, h2, h3, h4, h5, h6 { line-height: 1.02 }`) | Clients add headings unpredictably. Cost: ~10 bytes. |
| `.hero-body`, `.hero-headline`, `.hero-headline .line`, `.hero-headline .line > .line-inner`, `.hero-headline em` | Older home-page hero markup, replaced by `.cinema-hero-*`. `script.js` still does `document.querySelectorAll(".hero-container, .cinema-hero")` so the JS path is forward-compatible. Removing the CSS would mean a re-add silently looks broken. Cost: ~1.5 KB. |
| `.hero-container.is-ready .hero-headline .line:nth-child(1..5) > .line-inner { animation-delay: ... }` | Same — paired with `.hero-headline` rules. |
| `.hero-sub`, `.hero-sub p`, `.hero-actions`, `.hero-stats`, `.hero-stat`, `.hero-stat .num`, `.hero-stat .label` | Same forward-compat case. Cost: ~1 KB. |
| `.review-author .author-mark` | The `.author-mark` element was removed from HTML in commit `2c8d31e` ("drop avatar initials") but the styling for the slot is small and the slot may return. Cost: ~280 bytes. |
| `@media (max-width: 1100px)` and `@media (max-width: 900px)` blocks containing `.hero-stats`, `.hero-headline` overrides | Subset of the above. |
| `@media (prefers-reduced-motion: reduce) { .hero-headline .line > .line-inner, .hero-sub { ... } }` | Accessibility fallback for the (kept) hero classes. Must stay paired with them. |

### Selectors PurgeCSS already correctly preserved (sanity check)

- All Stream-D-modified rules (`.process-step`, `.process-step:hover`, `.process-step::before`, `.process-step:hover::before`, `.carousel-controls .progress-bar`, `.cursor-dot` in `@media (hover: hover)`, `.cursor-dot.is-hovering`) — confirmed present in purged output and in `style.min.css`.
- All `[data-reveal]`, `[data-aos]` attribute selectors — confirmed.
- All `.lightbox-*` classes — confirmed (these are only added by JS via `innerHTML`, so safelist was load-bearing).
- All `fa-*` Font Awesome icon classes — N/A, they're not in our CSS file (FA is on CDN); safelist was defensive.

### Decision: minify the **full** `style.css`, not the purged version

Final `style.min.css` is the csso-minified version of the **complete** `style.css`. PurgeCSS's incremental savings (~3 KB) didn't justify the risk of breaking forward-compat layouts. The 36% size reduction comes from minification alone, which is non-destructive.

---

## 6. Re-minify workflow for the client

When `style.css` is edited, regenerate `style.min.css` before deploying:

```bash
cd /path/to/Innovative-Repairs
npx --yes csso-cli style.css --output style.min.css
```

Fallback if `csso-cli` is unavailable on the network:

```bash
npx --yes clean-css-cli -o style.min.css style.css
```

Both commands are one-shot — no `package.json`, no `node_modules` is required (`npx` fetches transiently). After running, commit both `style.css` (source) and `style.min.css` (deploy artifact).

**Warning:** never edit `style.min.css` directly — the next regeneration will overwrite changes.

---

## 7. Coordination with other streams

- **Stream A (HTML/images):** When WebP variants ship, update each page's `<link rel="preload" as="image">` `href` to the new path and add `type="image/webp"`. See section 3 above.
- **Stream D (JS/CSS animations):** Stream D edited 7 rules in `style.css` (listed in `js-optimization-notes.md` §6). All 7 are preserved in `style.min.css` because the safelist included `process-step`, `progress-bar`, `carousel-controls`, and `cursor-dot` plus greedy patterns covering them. The minifier handled their composited transforms correctly.
- **Stream C (caching/.htaccess):** No coordination needed; `.htaccess` rules apply to whatever filenames we serve.

---

## 8. Verification checklist

- [x] All 5 HTML files reference `style.min.css` (not `style.css`).
- [x] All 5 HTML files have async font + FA pattern with `<noscript>` fallback.
- [x] All 5 HTML files have well-formed `<head>` with balanced tags.
- [x] `style.css` is byte-identical to before this stream ran (untouched source).
- [x] `style.min.css` exists, is 36% smaller, has balanced braces.
- [x] LCP image preload is set on `index`, `about-us`, `services`, `gallery`.
- [x] No image preload on `get-a-quote.html` (iframe LCP).
- [x] All 7 Stream-D-edited selectors survived in `style.min.css`.
- [x] No `purged/`, `purged-style.css`, or `purgecss.config.cjs` artifacts left in repo.
