# Absolute DC Universe Collection Tracker — Feature Roadmap

**Generated:** March 31, 2026
**Site:** [absolutedctracker.com](https://www.absolutedctracker.com)
**Repo:** github.com/rcasto123/absolutedctracker.com

---

## Current State Summary

The site is a polished single-page app (~2900 lines in index.html) with 8 main tabs: Collection, Release Calendar, Series Guide, Trade Paperbacks, Reading Order, Analytics, Achievements, and Media.

**What's working well:** Core collection tracking loop is tight — mark issues owned, see progress bars, filter/search, export, sync across devices.

**Where the gaps are:** Cover art URLs are hardcoded and many reuse the same image. No dark/light mode toggle. The monolithic index.html will become harder to maintain.

---

## Quick Wins

### 1. Add a Web App Manifest (PWA)
**What:** Create a manifest.json with app name, icons, theme color, and display: standalone.
**Effort:** Small

### 2. Fix Duplicate / Placeholder Cover Art
**What:** Audit coverMap and replace reused placeholder URLs with actual cover art.
**Effort:** Small

### 3. Jump to Today on Release Calendar
**What:** Add a button that auto-scrolls to the current month/week.
**Effort:** Small

### 4. Keyboard Shortcut for Quick-Toggle Owned
**What:** Pressing O or Space on a focused card toggles owned state.
**Effort:** Small

### 5. Persist Active Tab in URL Hash
**What:** Update window.location.hash when switching tabs.
**Effort:** Small

### 6. Collection Count in Page Title
**What:** Update document.title dynamically to show owned/total count.
**Effort:** Small

### 7. Mark All Released as Owned Button
**What:** Bulk-mark every released issue as owned.
**Effort:** Small

---

## Medium Features

### 8. Pull List / Wish List
**Effort:** Medium | **Impact:** High

### 9. Spending Tracker
**Effort:** Medium | **Impact:** Medium

### 10. Collection Sharing Page
**Effort:** Medium | **Impact:** High

### 11. Dark/Light Mode
**Effort:** Medium | **Impact:** Medium

### 12. Variant Cover Ownership Tracking ✅ IN PROGRESS
**Effort:** Medium–Large | **Impact:** High
**What:** Let users mark individual variant covers as owned. Show variant progress badges on collection cards (e.g., "Variants: 2/5"). Add checkbox overlays to variant gallery on issue detail page. Sync variant ownership to Firebase alongside regular issue ownership.
**Phases:** (1) Data model & sync, (2) Issue page UI, (3) Collection card badges, (4) Testing

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

### 21. Price Guide / Market Value
**Effort:** Large | **Impact:** Medium

### 22. Native Mobile (Barcode Scan)
**Effort:** Large | **Impact:** Medium

### 23. Personal Collection Journal
**Effort:** Large | **Impact:** Medium

---

## Suggested First Sprint

Tackle items 1, 2, 3, 5, and 6 — they're all independent, small, and immediately visible to users. Total estimated time: 2–3 hours.
