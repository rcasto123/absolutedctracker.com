# Absolute DC Universe Collection Tracker

**Live site:** https://absolutedctracker.com (also https://absolutedctracker.netlify.app)
**Repo:** https://github.com/rcasto123/absolutedctracker.com
**Deployment:** Netlify (manual deploys, publish root is `.`)

## What This Is

A single-page web app for tracking your DC Absolute Universe comic book collection. Users can mark issues as owned, view release calendars, browse series guides, see analytics/achievements, and sync their collection across devices via Firebase auth.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no build step, no framework)
- **Auth & data:** Firebase Authentication (Google, Apple, email) + Cloud Firestore
- **Hosting:** Netlify with custom domain
- **PWA:** Service worker (`sw.js`) + `manifest.json` for offline support and installability
- **Video:** 11MB hero background video (`dc_absolute_universe_bg.mp4`)

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Main app (~2900 lines). 8 tabs: Collection, Calendar, Series Guide, Trade Paperbacks, Reading Order, Analytics, Achievements, Media. |
| `issue.html` | Detailed issue view - cover art, synopsis, credits, variant gallery, purchase links. |
| `admin.html` | Admin dashboard - user management, collection stats across all users. |
| `auth.html` | Sign-in / sign-up page (Google, Apple, email providers). |
| `firebase-config.js` | Shared Firebase init (compat SDK). Exposes window.auth, window.db, sync helpers. |
| `auth-integration.js` | Auth UI logic - login/logout flows, profile display, cloud sync orchestration. |
| `theme-switcher.js` | Hero-themed color schemes (Batman, Superman, Wonder Woman, etc.). |
| `sw.js` | Service worker - caches pages, JS, and fonts for offline use. |
| `variants.json` | Variant cover data used by issue.html for the variant gallery. |
| `manifest.json` | PWA manifest - app name, icons, theme color, standalone display. |
| `netlify.toml` | Netlify config - security headers, caching rules, clean URL redirects. |
| `robots.txt` | Search engine crawl rules. |
| `sitemap.xml` | Sitemap for SEO. |
| `roadmap.md` | Feature roadmap with 23+ ideas across quick wins, medium features, and big bets. |

## Key Patterns

### Data Model
- All issue data is hardcoded in `index.html` (the `ALL_ISSUES` array and `coverMap` object)
- Owned state is stored in `localStorage` under key `au_owned` as `{ "issueKey": true }`
- When signed in, owned state syncs to Firestore at `users/{uid}.owned`
- Merge strategy: union merge (if either local or cloud says owned, it is owned)

### Tabs and Navigation
- Tabs are switched via `switchTab(tabName)` which shows/hides `.tab-content` sections
- Active tab persists in URL hash (e.g., `#calendar`, `#analytics`)
- Mobile: bottom navigation bar for the 8 main tabs

### Themes
- `theme-switcher.js` injects CSS custom properties for each hero theme
- Each theme has primary/secondary/accent colors and a gradient
- Theme choice saved in localStorage

### Deployment
- No build step - just push HTML/JS/CSS files
- Netlify serves from the repo root
- The `.mp4` file is large (11MB) - cached with immutable headers

## Common Tasks

### Adding a new issue
1. Add the issue object to `ALL_ISSUES` in `index.html`
2. Add its cover art URL to `coverMap` in `index.html`
3. If it has variant covers, add entries in `variants.json`
4. Add the issue detail page data in `issue.html`
5. Update the service worker cache version in `sw.js` if needed

### Updating cover art
- Cover URLs are in `coverMap` (index.html) and inline in `issue.html`
- Many issues currently reuse placeholder art - replacing these is a known task

### Deploying
- Commit and push to `main`
- Then deploy via Netlify dashboard (manual deploy) or set up auto-deploy from GitHub

## Known Issues / Tech Debt

- `index.html` is a monolith (~2900 lines) - should be modularized
- Some cover art is duplicated/placeholder across multiple issues
- `TODAY` date was previously hardcoded - verify it uses `new Date()` dynamically
- The hero video is 11MB with no lazy-loading
- 8 tabs on mobile can be cramped - bottom nav helps but could use refinement
- No dark/light mode toggle (all themes are dark variants)
- `setInterval` polls in a few places could be replaced with `MutationObserver`

## Roadmap

See `roadmap.md` for the full feature roadmap. Priority items:
1. Fix duplicate/placeholder cover art
2. Modular codebase refactor (break up index.html)
3. Pull list / wish list feature
4. Spending tracker on Analytics tab
5. Light mode option
