# JS / DOM / Animation Optimization Notes

Stream D of the Lighthouse 95+ pass. Vanilla JS only, surgical edits.

## 1. Forced-reflow instances fixed

The carousel `updatePosition()` was reading `getBoundingClientRect()` on every tick and (worse) calling `getVisibleCount()` which itself read it twice more. Combined with the auto-advance `setInterval` and rapid prev/next clicks, repeated `updatePosition()` calls during the same task could trigger forced-synchronous-layout warnings because each call's reads come right after the previous call's writes (`track.style.transform`).

### Portfolio carousel

**Before** (`script.js` ~line 217):

```js
const updatePosition = () => {
  const slideWidth = slides[0].getBoundingClientRect().width + gap;     // READ
  const maxIndex = Math.max(slides.length - getVisibleCount(), 0);      // READ x2 inside getVisibleCount
  index = clamp(index, 0, maxIndex);
  track.style.transform = `translateX(${-index * slideWidth}px)`;       // WRITE
  if (progressBar) {
    const total = slides.length;
    const visible = getVisibleCount();                                  // READ x2 again
    const widthPct = (visible / total) * 100;
    const offsetPct = (index / total) * 100;
    progressBar.style.width = `${widthPct}%`;                           // WRITE
    progressBar.style.transform = `translateX(...)%`;                   // WRITE
  }
  ...
};

const getVisibleCount = () => {
  const containerWidth = carousel.getBoundingClientRect().width;        // READ
  const slideWidth = slides[0].getBoundingClientRect().width + gap;     // READ
  return Math.max(1, Math.floor(containerWidth / slideWidth));
};
```

**After** (`script.js` lines 217-243): introduced `recalc()` which performs the layout reads exactly once and caches `slideWidth` + `visibleCount`. `updatePosition()` is now write-only and reflow-free. `recalc()` is invoked once on init and once per debounced `resize`. `onDragEnd()` (line 271) also now uses the cached `slideWidth` instead of a fresh `getBoundingClientRect()`.

```js
let slideWidth = 0;
let visibleCount = 1;

const recalc = () => {
  const containerWidth = carousel.getBoundingClientRect().width;
  slideWidth = slides[0].getBoundingClientRect().width + gap;
  visibleCount = Math.max(1, Math.floor(containerWidth / slideWidth));
};

const updatePosition = () => {
  const maxIndex = Math.max(slides.length - visibleCount, 0);
  index = clamp(index, 0, maxIndex);
  track.style.transform = `translateX(${-index * slideWidth}px)`;
  if (progressBar) {
    const widthPct = (visibleCount / slides.length) * 100;
    const offsetPct = (index / slides.length) * 100;
    const scaleFactor = widthPct / 100;
    const translatePct = widthPct === 0 ? 0 : (offsetPct / widthPct) * 100;
    progressBar.style.transform = `translateX(${translatePct}%) scaleX(${scaleFactor})`;
  }
  ...
};

window.addEventListener("resize", debounce(() => { recalc(); updatePosition(); }, 200));
recalc();
updatePosition();
```

### Reviews carousel

Same pattern applied at `script.js` lines 349-378.

## 2. Long main-thread task

`DOMContentLoaded` previously ran 13 init functions back-to-back, several of which iterate every `<img>`, every `[data-reveal]`, and every `a[data-lightbox]` on the page — small individually, ~200ms cumulatively on the gallery page on a slow CPU.

**Identified non-critical inits** (no first-paint or first-interaction dependency):

- `optimizeMediaLoading()` — iterates every `<img>`, `<iframe>`, `<video>` setting attributes.
- `prioritizeGalleryPreviews()` — iterates 33 gallery `<img>` tags.
- `initLightbox()` — builds an overlay, registers global click + keydown handlers, only needed on user interaction.
- `initRevealAnimations()` — iterates every `[data-reveal]` element and registers an IntersectionObserver. Reveal CSS already has a sensible fallback, so deferring this by a few ms is invisible.

**Wrapping applied** (`script.js` lines 675-707):

```js
const whenIdle = (callback, timeout = 1500) => {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);   // Safari fallback
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Critical-path inits run synchronously
  setCurrentYear();
  setActiveNavLink();
  initMobileMenu();
  initHeroAnimation();
  initCounters();
  initPortfolioCarousel();
  initReviewsCarousel();
  initGalleryTabs();
  initCustomCursor();
  initMagneticButtons();
  initParallax();
  initAutoplayVideoVisibility();

  // Deferred to idle time
  whenIdle(() => {
    optimizeMediaLoading();
    prioritizeGalleryPreviews();
    initLightbox();
    initRevealAnimations();
  });
});
```

This breaks the previously-monolithic init into two slices: a small synchronous critical block and a deferred idle block.

## 3. Passive event listeners

Verified each listener does **not** call `preventDefault` before adding `{ passive: true }`. Listeners updated:

| script.js line | Event | Target | Notes |
|---|---|---|---|
| 282 | `mousemove` | `window` (portfolio drag) | Was non-passive; doesn't preventDefault. |
| 283 | `mouseup` | `window` (portfolio drag) | Was non-passive; doesn't preventDefault. |
| 287 | `touchend` | `track` (portfolio drag) | Was non-passive; doesn't preventDefault. |
| 539 | `mousemove` | `document` (custom cursor) | Was non-passive; doesn't preventDefault. |
| 555 | `mouseover` | `document` (custom cursor) | Was non-passive; doesn't preventDefault. |
| 558 | `mouseout` | `document` (custom cursor) | Was non-passive; doesn't preventDefault. |
| 604 | `scroll` | `window` (parallax) | Was non-passive; doesn't preventDefault. |

The `mousedown` on the track at line 281 keeps its `e.preventDefault()` call (it suppresses default text-drag) and is therefore intentionally **not** passive.

## 4. Non-composited animations rewritten

| Selector | Old animated property | New animated property |
|---|---|---|
| `.process-step` (style.css 1342-1354) | `padding-left` (layout) | `transform: translateX()` (composited) |
| `.process-step::before` (1356-1369) | `width` (layout) | `transform: scaleX()` with `transform-origin: left center` (composited). Combined with the existing `translateY(-50%)` to preserve vertical centering. |
| `.cursor-dot` + `.is-hovering` (1906-1924) | `width`, `height`, `background` (size = layout) | `transform: scale()` (composited). Removed the centering `transform: translate(-50%, -50%)` and replaced with `margin: -4px 0 0 -4px` (half the 8px dot) so transform is free for animation. |
| `.carousel-controls .progress-bar` (1070-1079) | `width` + `transform: translateX` | `transform: scaleX()` + `transform: translateX()` (single composited transition) |

### Coordinated JS edits

- **Cursor positioning** (`script.js` line 549): switched from `dot.style.transform = translate(...)` to `dot.style.translate = ...` (the standalone CSS `translate` property). This keeps the JS-driven per-frame position from clobbering the CSS `transform: scale()` on `.is-hovering`.
- **Progress bar updates** (`script.js` lines 239 & 369): switched from `progressBar.style.width = "X%"` to `progressBar.style.transform = "translateX(...) scaleX(...)"` matching the new CSS `width: 100%; transform-origin: left center`.

## 5. DOM size table

| Page | `<` count | Notes |
|---|---|---|
| index.html | 363 | Healthy |
| about-us.html | 195 | Healthy |
| services.html | 237 | Healthy |
| gallery.html | ~240 (template + 33 gallery items) | Healthy. If grown beyond ~60 cards in the future, virtualize. |
| get-a-quote.html | 171 | Healthy |

All under Lighthouse's 800-node threshold. No DOM-pruning required.

## 6. Selectors / rules changed in style.css

The CSS-minify agent should re-process the file from scratch, but for cross-checking, the **only** rules I edited are these (4 surgical Edit-tool calls):

1. `.process-step` — base block (lines 1342-1350)
2. `.process-step:hover` — hover block (lines 1352-1354)
3. `.process-step::before` — base block (lines 1356-1367)
4. `.process-step:hover::before` — hover one-liner (line 1369)
5. `.carousel-controls .progress-bar` — base block (lines 1070-1079)
6. `.cursor-dot` (inside `@media (hover: hover) and (pointer: fine)`) — base block (lines 1906-1919)
7. `.cursor-dot.is-hovering` — hover block (lines 1921-1924)

(Rules 1-2 were combined in one Edit call; rules 3-4 in another; rules 6-7 in another; rule 5 was its own. Total 4 Edit calls as planned.)

No other selectors were touched. PurgeCSS scans should treat all of these as `:hover`-state classes that need to be preserved (they all match real HTML).

## 7. Things I did NOT fix and why

- **`transition: all var(--duration) var(--ease)`** on hover-only buttons (~lines 1093, 1499, 1565, 1760, 1883). These can include layout properties, but they only fire on rare hover events on small elements; not flagged by Lighthouse and changing them risks breaking design.
- **`box-shadow` transitions** on `.service-card` and similar — paint-only, common pattern, leave alone.
- **`getBoundingClientRect()` per `mousemove` in magnetic buttons** — not a forced reflow per spec (no write-then-read in the same handler), and the buttons are few. Caching on `mouseenter` would be a perf nicety but no functional change.
- **`getComputedStyle` on `onDragStart`** — runs once per drag start, before any write in that handler, so it's not a reflow.
- **HTML script tags** — already `defer`-ed in all five HTML files. No change needed.
- **Gallery images** — `loading="lazy"` is already applied; the eager-load upgrade in `prioritizeGalleryPreviews` (first 8 images) is correct as-is.
