# Seoul Travel News

## Project

This is a framework-free HTML, CSS, and browser JavaScript site deployed on Cloudflare Pages. The Cloudflare Worker proxy lives in `_worker.js` and handles every `/api/*` route directly. There is no `functions/` (Pages Functions) directory — `_worker.js` fully supersedes it, so all API logic belongs in `_worker.js`, not in `functions/`.

There is no bundler or application database. API keys must remain in Cloudflare Pages environment variables and must not be committed to the repository.

## Run Locally

- Static UI only: `python -m http.server 4175`
- Cloudflare Worker and Functions: `npx wrangler pages dev .`
- The site is deployed with the repository root as the Pages output directory.

## Test And Checks

- Refresh current Seoul event content: `npm.cmd run refresh`
- Regenerate static editorial and current-event pages from saved data: `npm.cmd run generate:articles`
- Unit and integration tests: `npm.cmd test`
- JavaScript syntax check: `npm.cmd run syntax`
- Static project checks: `npm.cmd run lint`
- Full verification: `npm.cmd run check`
- Static build validation: `npm.cmd run build`

## Deploy

- Cloudflare Pages project: `hospitalnearme`
- Deploy command: `npx wrangler pages deploy . --project-name hospitalnearme`
- GitHub Actions refreshes Seoul event data daily through `.github/workflows/daily-seoul-content.yml`.

## Required Verification After Code Changes

Run `npm.cmd run check` before committing. Content updates must also run `npm.cmd run refresh`, which refreshes the current-month feed, regenerates static pages, updates crawlable landing links, and rebuilds `sitemap.xml`. For UI changes, also open the site at desktop and mobile widths and verify navigation, article links, image aspect ratios, API loading states, and empty/error states manually.

## Test Scope

Tests use Node's built-in `node:test` runner. External Seoul, TourAPI, MyRealTrip, Coupang, and OpenAI calls are mocked; tests never call production APIs.

## Dead Code

Before adding a new root-level `.js`/`.css` file, confirm it is actually loaded by an HTML page (`grep` the filename across `*.html`). This repo previously accumulated unreferenced files from earlier, unrelated project iterations (a recipe search feature, a climate-education app) — keep new work wired into real pages so it doesn't happen again.
