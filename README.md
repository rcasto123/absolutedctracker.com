# DC Absolute Universe Collection Tracker

[![Live Site](https://img.shields.io/badge/Live%20Site-absolutedctracker.com-0476F2?style=for-the-badge&logo=googlechrome&logoColor=white)](https://absolutedctracker.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://absolutedctracker.com)
[![Netlify Status](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://absolutedctracker.com)

A production Progressive Web App for tracking your DC Absolute Universe comic book collection. Mark issues as owned, track what you've read, scan barcodes at the shop, monitor your spending, and sync your collection across devices with Google sign-in — all without installing anything.

---

## Overview

The DC Absolute Universe launched in late 2024 with reimagined takes on Batman, Wonder Woman, Superman, Flash, Martian Manhunter, Green Lantern, Green Arrow, Catwoman, and more. Keeping up with 10+ concurrent monthly series — each with multiple variant covers — is genuinely hard. This tracker solves that.

It covers every released and upcoming issue across all Absolute Universe titles (111+ issues and counting), with cover art, writer/artist credits, release dates, cover prices, and secondary market values. The app works offline, installs to your home screen like a native app, and optionally syncs your collection to the cloud.

**Who it's for:** DC comics collectors who want a purpose-built, no-account-required tool to manage their Absolute Universe pull list and collection — without the noise of a general-purpose comics platform.

---

## Features

### Collection Tracking
- Mark any issue as **owned** with a single tap — state persists immediately to localStorage
- **Per-series progress bars** showing owned vs. released count and percentage for each title
- **Accordion series view** — expand/collapse each series independently; state remembered across sessions
- **Owned / Missing / Upcoming / Pull List** filter tabs to focus on exactly what you need
- **Full-text search** across issue titles, writers, and artists

### Stats Dashboard
- Live stats: issues owned, total released, completion percentage, upcoming count, active series count
- **Total spent** — running sum of all prices you've recorded for owned issues (including variants)
- **Collection value** — estimated market value of your owned issues, sourced from a curated `prices.json` price guide (GoCollect / PriceCharting / eBay comps)
- **Pull list count** — number of upcoming issues currently on your pull list

### Pull List & Spending Tracker
- Subscribe to an **entire series** with one toggle, or add individual issues to your pull list
- Record the **actual price you paid** for any issue (defaults to cover price)
- Spending aggregates across all owned issues and variants to show total outlay
- Upcoming issues on your pull list are highlighted in the filtered view

### Variant Cover Tracking
- Every issue's known variant covers are catalogued (Cover B, C, connecting variants, etc.) with cover art thumbnails
- Track variants as **owned independently** from the base cover
- **Variant picker UI** — visual grid of all covers for an issue; select multiple to add to cart at once
- Per-variant price and market value entry
- Variant ownership and spend contribute to overall stats

### Price Guide & Market Values
- Embedded `prices.json` with cover price and approximate NM raw market value for every issue
- Manual **market value override** per issue and per variant
- Collection value display toggles between cover price and market value

### Barcode Scanner
- Camera-based barcode scanner using **html5-qrcode**, launched from the scanner page (`/scanner.html`)
- Matches scanned UPC barcodes against the issue database instantly
- **Standard mode** — scan a single issue and immediately mark it owned
- **Batch mode** — rapid scanning without confirmation prompts; processes multiple issues in quick succession
- **Cart mode** — scans add items to a shopping cart rather than marking owned immediately; review the cart and check out all at once (or discard)
- Audio feedback (two-tone beep) and haptic vibration on successful scans
- Session scan history and running session value shown in the scanner UI
- Cart persists in localStorage and is shared with the main collection view's cart

### Shopping Cart
- Add issues to a cart from the main collection view (base cover or any variant)
- Cart summary bar shows item count and total price
- Checkout marks all cart items as owned in a single operation
- Shared cart state between the scanner and collection views via a single localStorage key

### Export & Backup
- **Export as CSV** — spreadsheet-compatible file of all visible (filtered) issues with series, title, date, status, and owned flag
- **Export as JSON** — structured backup with metadata (exported timestamp, filter applied, totals, full issue list)
- **Print Checklist** — opens a formatted HTML checklist in a new tab and triggers print; grouped by series with owned checkboxes, stat summary block, and print-optimized CSS

### iCal Calendar Export
- Exports all **upcoming releases** as a `.ics` calendar file
- Each event is an all-day event on the release date with the issue title and creator credits
- Imports directly into Apple Calendar, Google Calendar, Outlook, or any iCal-compatible app

### Social Sharing
- **Share on X (Twitter)** — posts collection stats as a tweet with a link to the tracker
- **Share on Bluesky** — same stats formatted for Bluesky's compose intent
- **Share on Reddit** — submits a post to reddit.com/submit with stats and the site URL
- **Copy to Clipboard** — copies the stats text for pasting anywhere
- **Profile Card** — generates a standalone HTML page with a styled collection card: donut chart showing completion percentage, per-series progress bars with series colors, and owned/missing/series counts; opens in a new tab for screenshotting and sharing
- **Privacy Mode** toggle hides the Share button entirely when enabled

### Release Notifications
- Browser-native push notifications for upcoming release days
- Per-series subscription — opt in only to the series you follow
- Notifications fire on release day (requires notification permission grant)
- Preferences stored in localStorage; no account required

### Firebase Cloud Sync
- **Google Sign-In** via Firebase Authentication
- On sign-in, local localStorage collection is merged with cloud Firestore data (union merge — no issues are lost)
- Subsequent changes debounce-sync to Firestore (adaptive delay, minimum 3s between syncs)
- Sync works across devices: sign in on any device to restore your collection
- Works gracefully offline — localStorage is always the source of truth; cloud sync is additive

### Progressive Web App
- **Service Worker** (network-first for HTML/JS/JSON, cache-first for images) with pre-cached app shell for full offline operation
- **installable** — add to home screen on iOS, Android, or desktop Chrome via `manifest.json` (`display: standalone`)
- App shell cached on install; stale-while-revalidate for other assets; fallback to cached `index.html` for offline navigation
- Cache versioned (`au-tracker-v67`) with automatic old-cache cleanup on activation

### Issue Detail Pages
- Dedicated per-issue URL (`/issue/:slug`) with cover art, full credits, price, market value, owned toggle, and variant list
- Shareable deep links for individual issues

### Theme & UI
- Dark theme by default with a theme switcher
- Responsive layout with mobile-first CSS; works on phone, tablet, and desktop
- Accessible filter bar with keyboard-navigable share and export menus (ARIA roles, keyboard arrow navigation, Escape to close)
- Inline error boundary (`window.onerror` + `unhandledrejection` handlers) with graceful degradation
- Storage-full warning toast when localStorage quota is exceeded

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (ES5/ES6), HTML5, CSS3 |
| PWA | Service Worker, Web App Manifest (W3C) |
| Barcode Scanning | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |
| Authentication | Firebase Auth (Google Sign-In, compat SDK v10) |
| Cloud Sync | Firebase Firestore (compat SDK v10) |
| Offline Storage | localStorage (owned state, prices, pull list, variants, market values) |
| Fonts | Google Fonts (Source Sans 3, Oswald, Inter) |
| Deployment | [Netlify](https://netlify.com) (static hosting + security headers) |

No build step, no bundler, no npm. The entire app is plain HTML/CSS/JS served as static files.

---

## Architecture

### Data Flow

```
data/issues.json          variants.json         prices.json
      │                        │                     │
      ▼                        ▼                     ▼
  js/data.js              state.js             state.js
  (ALL_ISSUES array,    (lazy-loaded,         (lazy-loaded,
   SERIES_COLORS,        _variantData)         _priceGuideData)
   barcodes, UPCs)
         │
         ▼
     state.js  ◄──── localStorage (au_owned, au_prices, au_pull_series,
         │                          au_pull_issues, au_market_values,
         │                          au_owned_variants, au_scanner_cart…)
         │
         ▼
   js/renders.js  (renderCollection, renderStats, renderAnalytics)
         │
         ▼
    DOM / UI
         │
    ┌────┴────────────────────────┐
    │  (on sign-in)               │
    ▼                             ▼
firebase-config.js         auth-integration.js
(Firestore sync)           (Google auth UI, sync orchestration)
```

**Offline-first principle:** localStorage is always written to first; cloud sync is a background operation that never blocks the UI. If Firebase fails to load (ad-blocker, network error), the app degrades silently to local-only mode.

### Module Responsibilities

| File | Role |
|---|---|
| `js/data.js` | `ALL_ISSUES` array (series, issue, title, date, writer, artist, price, barcodes), `SERIES_COLORS` map, variant/price data loaders, shopping cart, variant picker logic |
| `js/state.js` | localStorage read/write for owned, trades, prices, pull list, market values; helper functions (`issueKey`, `isReleased`, `isUpcoming`, `makeSlug`) |
| `js/renders.js` | `renderStats()`, `renderCollection()`, `renderAnalytics()` — all DOM mutation lives here |
| `js/init.js` | DOMContentLoaded wiring: modal listeners, share/download handlers, service worker registration |
| `js/features/export.js` | CSV, JSON, and printable checklist export logic; injected dynamically into the filter bar |
| `js/features/share.js` | Twitter, Bluesky, Reddit, clipboard, and profile card share logic; privacy mode toggle |
| `js/features/notifications.js` | iCal export; browser notification permission flow and per-series subscription UI |
| `scanner.js` | Barcode scanner module: html5-qrcode integration, batch/cart modes, audio feedback, session history |
| `firebase-config.js` | Firebase init, Firestore sync helpers (`syncOwnedToCloud`, `loadOwnedFromCloud`, `mergeOwned`), variant ownership helpers |
| `auth-integration.js` | Google sign-in UI, auth state listener, debounced Firestore sync, localStorage change detection |
| `sw.js` | Service Worker: app shell pre-cache, network-first for HTML/JSON/JS, cache-first for images, stale-while-revalidate fallback |
| `theme-switcher.js` | Dark/light theme toggle |

### PWA Caching Strategy

| Request type | Strategy |
|---|---|
| Navigation (`index.html`, `.html`) | Network-first → cache fallback |
| Scripts and JSON data files | Network-first → cache fallback |
| Same-origin images | Cache-first → network → 1×1 GIF fallback |
| Cross-origin images (cover art CDN) | Browser-native (bypasses SW to avoid CSP issues) |
| Firebase SDK / Google APIs | Bypassed (never cached) |
| Large video (`dc_absolute_universe_bg.mp4`) | Bypassed (never cached) |

---

## Data Model

### `data/issues.json`

Top-level object with `_meta` and `issues` array:

```json
{
  "_meta": {
    "lastUpdated": "2026-04-02",
    "source": "Automated pipeline v2.0",
    "issueCount": 111,
    "coverCount": 111
  },
  "issues": [
    {
      "series": "Absolute Batman",
      "issue": "#1",
      "title": "Absolute Batman #1",
      "date": "2024-10-09",
      "writer": "Scott Snyder",
      "artist": "Nick Dragotta",
      "price": 4.99,
      "upc": "76194138584600111"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `series` | string | Series name (e.g., `"Absolute Batman"`) — used as the primary grouping key |
| `issue` | string | Issue identifier (e.g., `"#1"`, `"Annual #1"`, `"Special #1"`) |
| `title` | string | Full display title |
| `date` | string | Release date in `YYYY-MM-DD` format (parsed as local date to avoid UTC timezone shifts) |
| `writer` | string | Writer credit(s) |
| `artist` | string | Artist/penciller credit(s) |
| `price` | number | Cover price in USD |
| `upc` | string | UPC barcode for scanner lookup |

**Issue key** (used for all localStorage keys): `"{series}|{issue}"` — e.g., `"Absolute Batman|#1"`.

### `variants.json`

Keyed by issue slug (`makeSlug(title)`). Each value is an array of variant objects:

```json
{
  "absolute-batman-1": [
    {
      "url": "https://cdn.example.com/cover-b.jpg",
      "name": "Absolute Batman #1 Cover B Variant"
    }
  ]
}
```

### `prices.json`

```json
{
  "_meta": { "lastUpdated": "...", "source": "GoCollect / PriceCharting / eBay" },
  "issues": {
    "Absolute Batman|#1": { "cover": 4.99, "market": 150.00 }
  }
}
```

Market prices are approximate NM (near-mint) raw copy values. Updated manually and redeployed.

---

## Getting Started (Local Development)

No build step required. Serve the repo root as a static file server:

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8000`.

> **Note:** Camera access (barcode scanner) requires HTTPS or `localhost`. The scanner will not work over an `http://192.168.x.x` LAN address.

The app works fully without Firebase configured — it operates in local-only mode. Cloud sync and Google sign-in require the Firebase project credentials in `firebase-config.js` (see below).

---

## Firebase Setup

To enable cloud sync and Google sign-in:

1. Create a [Firebase project](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in providers → **Google**
3. Enable **Firestore Database** in production mode
4. Add the following Firestore security rules (users can only read/write their own document):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. Copy your Firebase project config into `firebase-config.js`:
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
6. Add your deployment domain to Firebase → Authentication → Authorized domains

The `firebase-config.js` in this repo contains the public config for the production deployment. It is safe to commit Firebase web config (it is not a secret — access is controlled by Firestore security rules and Auth domain allowlisting).

---

## Deployment

The site deploys automatically to **Netlify** on push to the main branch.

`netlify.toml` is already configured with:
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Permissions-Policy`)
- Cache-Control rules (1 year for `.mp4`, 1 day for `.js`)
- Clean URL redirects (`/index` → `/`, `/admin` → `/admin.html`)

The `publish` directory is `.` (repo root) — no build step.

To deploy your own fork:
1. Connect your GitHub repo to Netlify
2. Set publish directory to `.` and build command to empty
3. Netlify will detect `netlify.toml` automatically

---

## Project Structure

```
.
├── index.html                  # Main app shell (collection view, stats, analytics tabs)
├── issue.html                  # Individual issue detail page
├── auth.html                   # Sign-in page
├── admin.html                  # Admin panel (restricted to admin email)
├── scanner.js                  # Barcode scanner module (self-contained IIFE)
├── firebase-config.js          # Firebase init + Firestore sync helpers
├── auth-integration.js         # Google sign-in UI + cloud sync orchestration
├── theme-switcher.js           # Dark/light theme toggle
├── manifest.json               # PWA web app manifest
├── sw.js                       # Service Worker (offline caching)
├── netlify.toml                # Netlify deploy config + security headers
├── robots.txt                  # Search engine directives
├── sitemap.xml                 # XML sitemap for SEO
├── dc_absolute_universe_bg.mp4 # Background video asset
├── cover-fingerprints.json     # Cover art perceptual hash index
│
├── data/
│   ├── issues.json             # Master issue database (111+ issues, auto-updated)
│   └── pipeline-log.json       # Data pipeline update log
│
├── js/
│   ├── data.js                 # ALL_ISSUES array, SERIES_COLORS, cart, variant picker
│   ├── state.js                # localStorage read/write, helper functions
│   ├── renders.js              # All DOM rendering (stats, collection, analytics)
│   ├── init.js                 # App initialization, modal/SW wiring
│   ├── cover-map.js            # Issue title → cover image URL mapping
│   ├── styles.css              # Global styles
│   └── features/
│       ├── export.js           # CSV / JSON / print checklist export
│       ├── share.js            # Social sharing + privacy mode
│       └── notifications.js    # iCal export + browser push notifications
│
├── scripts/
│   └── update-issues.js        # Data pipeline: fetches new issue data and updates issues.json
│
├── tools/
│   └── generate-cover-fingerprints.py  # Generates perceptual hashes for cover deduplication
│
├── variants.json               # Per-issue variant cover catalogue
├── prices.json                 # Cover and secondary market prices per issue
├── roadmap.md                  # Public feature roadmap
└── TASKS.md                    # Development task backlog
```

---

## License

[MIT](LICENSE)
