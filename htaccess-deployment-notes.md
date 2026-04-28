# .htaccess Deployment Notes — Innovative Repairs

This document summarizes the `.htaccess` rules added to the project root
and what the site owner needs to do to fully activate them on GoDaddy.

## What was added

A brand-new `.htaccess` (none existed before) covering:

1. **GZIP compression** (`mod_deflate`) for HTML, CSS, JS, JSON, SVG, XML,
   and font files.
2. **Brotli compression** (`mod_brotli`) for the same MIME types — gated by
   `<IfModule>` so it no-ops if GoDaddy hasn't enabled Brotli on the account.
3. **Cache lifetimes** (`mod_expires`):
   - HTML: 1 hour
   - CSS / JS / JSON: 1 month
   - Images (jpg, jpeg, png, webp, gif, svg, ico): 1 year
   - Video (mp4, webm, mov): 1 year
   - Fonts (woff, woff2, ttf, otf, eot): 1 year
4. **Cache-Control headers** (`mod_headers`) mirroring the Expires values,
   since some CDNs and browsers prefer `Cache-Control` over `Expires`.
   Long-lived assets get `immutable` to skip revalidation.
5. **Security headers** (safe, no per-site tuning required):
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Frame-Options: SAMEORIGIN`
   - (CSP intentionally skipped — needs careful per-site tuning.)
6. **`Options -Indexes`** — disables directory listing.
7. **`AddDefaultCharset utf-8`** — ensures text responses are tagged UTF-8.
8. **HTTPS redirect block** — included but **commented out**. See below.

Every module-specific block is wrapped in `<IfModule>` so a missing module
on the shared host won't 500 the site.

## What was preserved

Nothing — there was no existing `.htaccess` in the project root. The
`CNAME` file (GitHub Pages artifact) was left untouched; it doesn't affect
Apache.

The following were intentionally **not** added:

- **www / non-www canonicalization** — preference unknown; risky to assume.
- **Custom 404 (`ErrorDocument 404`)** — no `404.html` exists in the project.
- **Content Security Policy** — needs per-site tuning to avoid breakage.

## Manual step required: enable the HTTPS redirect

The HTTPS redirect block is commented out by default. **Do not enable it
until SSL is active on GoDaddy** — otherwise visitors will be redirected to
a URL that doesn't resolve, taking the site offline.

To enable after SSL is live:

1. In GoDaddy cPanel, install/activate the SSL certificate.
2. Verify `https://yourdomain.com` loads with a valid padlock icon.
3. Open `.htaccess` and remove the leading `#` from these four lines:

   ```
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteCond %{HTTPS} off
       RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   </IfModule>
   ```

4. Re-upload the file via cPanel File Manager.

## How to upload to GoDaddy

1. cPanel → File Manager.
2. Open the `public_html` folder (site root).
3. Click **Settings** (top-right) and tick **Show Hidden Files (dotfiles)**
   — required because the filename starts with a dot.
4. Upload `.htaccess` into `public_html`.

## Expected Lighthouse impact

- **"Use efficient cache lifetimes"** — Lighthouse flagged ~13,293 KiB of
  potential savings. Once a returning visitor's browser sees the new
  `Cache-Control` and `Expires` headers, ~13 MB of images/fonts/CSS/JS will
  be served from cache instead of re-downloaded on subsequent visits.
- **"Avoid enormous network payloads"** — GZIP/Brotli will shrink the
  text-based portion of the 15 MB page weight (HTML + CSS + JS + SVG)
  significantly on first load. The bulk of the 15 MB is likely images and
  video, which compression won't shrink — those need separate optimization
  (resize, WebP/AVIF, lazy-loading) outside the scope of `.htaccess`.

## Cache busting after CSS/JS edits

CSS and JS are cached for 1 month. To force a refresh after editing
`style.css` or `script.js`, either rename the file or append a version
query string in the HTML, e.g. `style.css?v=2`.
