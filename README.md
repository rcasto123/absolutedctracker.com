# absolutedctracker.com

A web app for tracking your DC Absolute Universe comic book collection. Live at [absolutedctracker.com](https://absolutedctracker.com).

## What it does

absolutedctracker.com gives DC Absolute Universe readers a single place to manage their collection across every series in the line. The tracker is free and works in any modern browser.

### Features

- **Collection tracking** — mark individual issues as owned; completion stats update in real time
- **Stats dashboard** — see issues owned, total released, series count, collection percentage, and upcoming release count at a glance
- **Pull list** — subscribe to series or individual issues to track upcoming purchases
- **Spending tracker** — log what you paid per issue and track total money spent vs. estimated collection market value
- **Filter and search** — filter by owned/unowned/upcoming and search by title across the full issue list
- **Issue detail pages** — per-issue pages with cover art, creative team, and variant information
- **Variant tracking** — log and value variant covers separately from main issues
- **Barcode scanner** — scan issue barcodes with your device camera to quickly mark issues as owned (supports batch mode and a shopping-cart mode for use at a comic shop)
- **Calendar export** — export upcoming release dates as an .ics file to add to your calendar app
- **Share to social** — share your collection progress to X/Twitter with one click
- **CSV/data export** — export your collection data for use elsewhere
- **PWA / offline support** — installable as a Progressive Web App; collection browsing works offline via a service worker
- **Cloud sync** — optional sign-in with Google (Firebase Auth + Firestore) to sync your collection across devices
- **Dark, cinematic UI** — animated hero background, mobile-responsive layout

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Auth and sync | Firebase Authentication + Firestore (Google Sign-In) |
| Hosting | Netlify (static deploy, security headers, clean-URL redirects) |
| Offline | Service Worker (network-first for app shell, cache-first for assets) |
| Barcode scanning | html5-qrcode (via CDN) |
| Data | JSON flat files (data/issues.json, variants.json, prices.json) |

No build step or bundler required — the project deploys directly from the repository root.

## Getting started (local development)

1. Clone the repository.
2. Open `index.html` directly in a browser, **or** serve the root with any static file server to avoid service-worker restrictions:

   ```bash
   npx serve .
   # then open http://localhost:3000
   ```

3. Firebase Auth and Firestore features require a Firebase project. Copy `firebase-config.js` and replace the config values with your own project credentials. Collection tracking without sign-in uses `localStorage` and works out of the box without any credentials.

## License

MIT
