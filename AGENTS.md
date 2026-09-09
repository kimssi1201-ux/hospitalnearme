# Daehan Festival News (대한축제뉴스)

## Project

This is an Astro static site deployed on Cloudflare Pages. Astro generates the new VIEW1 campaign portal into `dist/`, while the legacy 대한축제뉴스 festival and article assets are copied into `dist/` during the build. The Cloudflare Worker proxy lives in `_worker.js` and handles every `/api/*` route directly. There is no `functions/` (Pages Functions) directory — `_worker.js` fully supersedes it, so all API logic belongs in `_worker.js`, not in `functions/`.

Campaign operation is JSON-based. Add or edit CPA campaigns in `data/campaigns.json`; add categories in `data/categories.json`; put campaign images under `public/images/campaigns/`. Do not hardcode affiliate URLs in Astro components or generated HTML. API keys must remain in Cloudflare Pages environment variables and must not be committed to the repository.

The site covers festivals nationwide (17 Korea Tourism Organization TourAPI regions) via the main feed and the homepage's "지역별 축제 찾기" region picker. The 22 curated editorial posts (`travel-data.js`'s `editorialPosts`, the `#editorial` "서울 기획" section) are deliberately kept Seoul-specific neighborhood guides — do not regionalize or delete them without being asked. `generated/seoul-events.json` and the `seoul-events/` directory are legacy names from when the site was Seoul-only; they now hold nationwide TourAPI data. Don't rename them casually — several scripts, tests, and client routes reference these exact paths.

## Run Locally

- Astro dev server: `npm run dev` (or `pnpm run dev` in the Codex bundled runtime)
- Built static UI: `npm run build`, then serve `dist/`
- Cloudflare Worker and Pages assets: `npx wrangler pages dev dist`
- The site is deployed with `dist/` as the Pages output directory.

## Test And Checks

- Refresh current nationwide festival content: `npm run refresh`
- Regenerate static editorial and current-event pages from saved data: `npm run generate:articles` (also rebuilds legacy `sitemap.xml` and `feed.xml`)
- Report how many festivals currently have a photo gallery: `npm run report:photos`
- Unit and integration tests: `npm test`
- JavaScript syntax check: `npm run syntax`
- Static project and campaign data checks: `npm run lint`
- Full verification: `npm run check`
- Static build validation: `npm run build`

## Deploy

- Cloudflare Pages project: `hospitalnearme`
- Build command: `pnpm run build` or `npm run build`
- Build output directory: `dist`
- Deploy command: `npx wrangler pages deploy dist --project-name hospitalnearme`
- GitHub Actions refreshes nationwide festival data daily through `.github/workflows/daily-seoul-content.yml` (filename is legacy).

## Required Verification After Code Changes

Run `npm run check` before committing. Content updates must also run `npm run refresh`, which refreshes the current-month feed, regenerates static pages, updates crawlable landing links, and rebuilds `sitemap.xml` and `feed.xml`. For UI changes, also open the site at desktop and mobile widths and verify navigation, article links, image aspect ratios, API loading states, and empty/error states manually.

## Test Scope

Tests use Node's built-in `node:test` runner. External Seoul, TourAPI, MyRealTrip, Coupang, and OpenAI calls are mocked; tests never call production APIs.

## Dead Code

Before adding a new root-level `.js`/`.css` file, confirm it is actually loaded by an HTML page (`grep` the filename across `*.html`). This repo previously accumulated unreferenced files from earlier, unrelated project iterations (a recipe search feature, a climate-education app) — keep new work wired into real pages so it doesn't happen again.
