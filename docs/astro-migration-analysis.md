# Astro Migration Analysis

This branch migrates the current `view1.kr` source tree to an Astro SSG build pipeline without changing production `main` or deploying production.

## Current Production

- Operating domain: `https://view1.kr`
- Repository: `kimssi1201-ux/hospitalnearme`
- Current production host indicated by the repository: Cloudflare Pages project `hospitalnearme`
- Custom domain file: `CNAME` contains `view1.kr`
- Worker/API layer: `_worker.js` handles `/api/*` routes
- Cloudflare output setting before migration: repository root (`pages_build_output_dir = "."`)
- Important conflict: the migration request mentions GitHub Pages, but the current repository documentation and config identify Cloudflare Pages as production. This branch therefore keeps Cloudflare Pages compatibility and adds a GitHub Pages workflow for review; production host selection should be confirmed before merging.

## Current File Structure

- HTML pages tracked: 286
- Root HTML pages: `index.html`, `about.html`, `articles.html`, `contact.html`, `disclaimer.html`, `editorial-policy.html`, `festival-detail.html`, `privacy.html`, `recipes.html`, `resources.html`, `search.html`, `terms.html`
- Editorial article pages: `articles/*/index.html`
- Festival event pages: `seoul-events/*/index.html`
- CSS files tracked: 16 root CSS files, including `travel.css`, `article-static.css`, `festival-detail.css`, `policy-pages.css`
- JavaScript files tracked: `_worker.js`, `festival-detail.js`, `search.js`, `travel-data.js`, `travel.js`
- Content/data scripts: `scripts/generate-static-articles.mjs`, `scripts/update-seoul-content.mjs`, `scripts/report-photo-coverage.mjs`
- Generated data: `generated/seoul-events.json`
- Current checked-in festival data snapshot: `requestedMonth` is `202608`; this migration branch does not refresh or rewrite production content because URL/content parity is the priority.

## SEO And Discovery

- Canonical host: `https://view1.kr`
- `robots.txt`: allows all crawlers and points to `https://view1.kr/sitemap.xml`
- `sitemap.xml`: currently lists the home page, trust/editorial pages, and curated article URLs; generated festival detail pages are intentionally not listed by the current tests.
- RSS: `feed.xml` exists and is linked from `index.html` as an RSS alternate feed.
- AdSense account: `ca-pub-5751319666030430`
- AdSense script: present on the home, policy pages, article pages, and dynamic detail shell.
- Search verification meta: no Google/Naver/Bing verification meta tags or standalone verification files were found in the tracked root files during migration analysis.
- Open Graph: present on the home page, article pages, event pages, and `festival-detail.html`.
- JSON-LD: present on editorial article pages, event pages, and `festival-detail.html`.

## Existing URL Surface

- Home: `/`
- Trust pages use extensionless canonical URLs, with source files kept as root `.html` files, for example `/about`, `/privacy`, `/terms`.
- Curated articles: `/articles/{slug}/`
- Generated festival pages: `/seoul-events/{slug}/`
- Dynamic detail shell: `/festival-detail.html` and `/festival-detail`
- Current redirects: `/articles`, `/articles.html`, `/recipes`, `/recipes.html`, `/resources`, `/resources.html`
- Existing `404.html`: not present before migration.

## Migration Strategy

- Keep existing HTML/CSS/JS files in place as the migration source of truth.
- Add Astro scaffold under `src/` for layouts and components.
- Run `astro build` into `dist/`.
- Copy the current deployable legacy files into `dist/` after Astro build so existing URLs, metadata, body markup, CSS, JavaScript, ads, `CNAME`, `robots.txt`, `sitemap.xml`, `feed.xml`, `_headers`, `_redirects`, and `_worker.js` remain byte-for-byte preserved.
- Defer converting 286 HTML pages into Astro-native content until a follow-up pass, because the safe first step is production parity.

## Deletion Candidates

No tracked production files are deleted in this branch. After the Astro build output is validated in production-like preview, root HTML/CSS/JS files can be reviewed as possible long-term source cleanup candidates, but they remain required as the parity source for this migration.
