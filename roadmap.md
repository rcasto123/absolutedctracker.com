# Absolute DC Universe Collection Tracker — Feature Roadmap

**Updated:** April 1, 2026
**Site:** [absolutedctracker.com](https://www.absolutedctracker.com)
**Repo:** github.com/rcasto123/absolutedctracker.com

---

## Current State Summary

The site is a polished single-page app (~5000 lines in index.html) with 8 main tabs: Collection, Release Calendar, Series Guide, Trade Paperbacks, Reading Order, Analytics, Achievements, and Media.

**What's working well:** Full collection tracking loop with sharing, import/export, cloud sync. Themed hero backgrounds with per-hero CSS animations. Variant cover ownership. Light and dark mode with 12 themes. Pull list, spending tracker, and price guide with market values. Enriched media tab with creator spotlights. Enhanced reading order with progress tracking and recommendations. Improved mobile navigation. Lazy-loaded cover art.

**Where the gaps are:** The monolithic index.html is now 5000+ lines and badly needs modularization. Some newer series still use placeholder covers. No social features beyond text/image sharing.

---

## Completed

### Quick Wins ✅
1. PWA manifest
2. Fix duplicate / placeholder cover art
3. Jump to today on release calendar
4. Keyboard shortcuts (O/Space/Enter)
5. Persist active tab in URL hash
6. Collection count in page title
7. Mark all released as owned button

### Medium Features ✅
8. Pull list / wish list — series subscription + individual issue pinning
9. Spending tracker — inline price inputs, analytics card, per-series breakdown
10. Collection sharing — text summary + downloadable PNG card
11. Dark / light mode — 3 light + 8 dark hero themes
12. Variant cover ownership tracking — checkbox overlays, badge counts, Firebase sync
13. Better mobile bottom nav — scrollable, larger targets, active indicator
14. Lazy-load cover art — IntersectionObserver with blur-up placeholders
15. Enriched media tab — creator spotlights, collection stats, community links
16. Batch import / export — JSON + CSV, merge on import
17. Reading order enhancements — "read next", arc progress, series switches, status icons

### Big Bets ✅
21. Price guide / market value — cover prices, market values, ROI, prices.json pipeline
- Themed hero backgrounds — per-hero cover art + CSS animation overlays

---

## Remaining Big Bets

### 18. Modular Codebase Refactor
**Effort:** Large | **Impact:** High
Break index.html into modules (ES6 imports or separate JS files). Extract CSS into component stylesheets.

### 19. Compare Collections
**Effort:** Large | **Impact:** Medium
Let two signed-in users compare collections side by side — see gaps, overlaps, and trade opportunities.

### 20. Automated Data Pipeline
**Effort:** Large | **Impact:** High
Auto-fetch new issue data, cover art, and release dates from external sources instead of manual updates.

### 22. Native Mobile (Barcode Scan)
**Effort:** Large | **Impact:** Medium
Scan comic barcodes with phone camera to auto-add issues to collection.

### 23. Personal Collection Journal
**Effort:** Large | **Impact:** Medium
Add notes, ratings, and read dates to individual issues. Timeline view of reading history.

---

## Suggested Next Sprint

Item 18 (Modular Codebase Refactor) is now the top priority — the file is 5000+ lines and becoming unwieldy. After that, 20 (Automated Data Pipeline) would reduce manual maintenance burden.
