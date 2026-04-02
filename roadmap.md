# Absolute DC Universe Collection Tracker — Feature Roadmap

**Updated:** April 1, 2026
**Site:** [absolutedctracker.com](https://www.absolutedctracker.com)
**Repo:** github.com/rcasto123/absolutedctracker.com

---

## Current State Summary

The site is a polished single-page app (~4100 lines in index.html) with 8 main tabs: Collection, Release Calendar, Series Guide, Trade Paperbacks, Reading Order, Analytics, Achievements, and Media.

**What's working well:** Core collection tracking loop is tight — mark issues owned, see progress bars, filter/search, export, sync across devices. Themed hero backgrounds with per-hero CSS animations. Variant cover ownership tracking. Light and dark mode with 12 themes. Keyboard shortcuts, bulk actions, and cloud sync. Pull list for tracking upcoming issues. Spending tracker and price guide with market value estimates.

**Where the gaps are:** The monolithic index.html will become harder to maintain. Some newer series (Green Arrow, Catwoman) still use #1 cover for unsolicited issues. Price guide data requires periodic manual updates (automated weekly via scheduled task).

---

## Completed

### 1. Add a Web App Manifest (PWA) ✅
### 2. Fix Duplicate / Placeholder Cover Art ✅
Batman #4–20 now have unique covers from Midtown Comics. Green Arrow #2–6 and Catwoman #2–4 still use #1 cover (issues not yet solicited).
### 3. Jump to Today on Release Calendar ✅
### 4. Keyboard Shortcut for Quick-Toggle Owned ✅
O, Space, or Enter on a focused card toggles owned state.
### 5. Persist Active Tab in URL Hash ✅
### 6. Collection Count in Page Title ✅
### 7. Mark All Released as Owned Button ✅
### 8. Pull List / Wish List ✅
Subscribe to entire series or pin individual upcoming issues. "Pull List" filter in Collection tab. Pull count in stats bar. localStorage persistence with `au_pull_series` and `au_pull_issues`.
### 9. Spending Tracker ✅
Inline price inputs on owned cards. Spending Tracker card in Analytics with total spent, average price, and per-series breakdown. Total spent in stats bar. localStorage key `au_prices`.
### 11. Dark/Light Mode ✅
3 light themes (Clean Light, Warm Light, DC Blue Light) + 8 dark hero themes. Comprehensive CSS overhaul for proper contrast.
### 12. Variant Cover Ownership Tracking ✅
Checkbox overlays on variant gallery, badge counts on collection cards, Firebase sync.
### 21. Price Guide / Market Value ✅
Price Guide card in Analytics with cover price totals, market value, ROI vs cover, and per-series value bars. Market value inputs on owned issue cards and variant covers. Central `prices.json` data file with ~100 issue prices loaded as defaults — user overrides take priority. External links to GoCollect, PriceCharting, CovrPrice, ComicsPriceGuide. Automated weekly price research via scheduled task.
### Themed Hero Backgrounds ✅
Each hero theme swaps the hero banner to that series' #1 cover art with crossfade transitions and unique CSS animation overlays (Batman rain, Superman energy, Flash speed lines, etc.). Default theme shows the Character Showcase video.

---

## Medium Features

### 10. Collection Sharing Page
**Effort:** Medium | **Impact:** High

### 13. Better Mobile Bottom Nav
**Effort:** Medium | **Impact:** High

### 14. Lazy-Load Cover Art
**Effort:** Medium | **Impact:** High

### 15. Enriched Media Tab
**Effort:** Medium | **Impact:** Medium

### 16. Batch Import CSV/JSON
**Effort:** Medium | **Impact:** Medium

### 17. Reading Order Enhancements
**Effort:** Medium | **Impact:** Medium

---

## Big Bets

### 18. Modular Codebase Refactor
**Effort:** Large | **Impact:** High

### 19. Compare Collections
**Effort:** Large | **Impact:** Medium

### 20. Automated Data Pipeline
**Effort:** Large | **Impact:** High

### 22. Native Mobile (Barcode Scan)
**Effort:** Large | **Impact:** Medium

### 23. Personal Collection Journal
**Effort:** Large | **Impact:** Medium

---

## Suggested Next Sprint

Tackle items 10, 13, and 14 — Collection Sharing, Better Mobile Bottom Nav, and Lazy-Load Cover Art. These improve shareability and performance, the two biggest gaps after the recent feature push.
