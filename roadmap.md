# Absolute DC Universe Collection Tracker — Feature Roadmap

**Updated:** April 1, 2026
**Site:** [absolutedctracker.com](https://www.absolutedctracker.com)
**Repo:** github.com/rcasto123/absolutedctracker.com

---

## Current State Summary

The site is a polished single-page app (~3200 lines in index.html) with 8 main tabs: Collection, Release Calendar, Series Guide, Trade Paperbacks, Reading Order, Analytics, Achievements, and Media.

**What's working well:** Core collection tracking loop is tight — mark issues owned, see progress bars, filter/search, export, sync across devices. Themed hero backgrounds with per-hero CSS animations. Variant cover ownership tracking. Light and dark mode with 12 themes. Keyboard shortcuts, bulk actions, and cloud sync.

**Where the gaps are:** The monolithic index.html will become harder to maintain. Some newer series (Green Arrow, Catwoman) still use #1 cover for unsolicited issues.

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
### 11. Dark/Light Mode ✅
3 light themes (Clean Light, Warm Light, DC Blue Light) + 8 dark hero themes. Comprehensive CSS overhaul for proper contrast.
### 12. Variant Cover Ownership Tracking ✅
Checkbox overlays on variant gallery, badge counts on collection cards, Firebase sync.
### Themed Hero Backgrounds ✅
Each hero theme swaps the hero banner to that series' #1 cover art with crossfade transitions and unique CSS animation overlays (Batman rain, Superman energy, Flash speed lines, etc.). Default theme shows the Character Showcase video.

---

## Medium Features

### 8. Pull List / Wish List
**Effort:** Medium | **Impact:** High

### 9. Spending Tracker
**Effort:** Medium | **Impact:** Medium

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

### 21. Price Guide / Market Value
**Effort:** Large | **Impact:** Medium

### 22. Native Mobile (Barcode Scan)
**Effort:** Large | **Impact:** Medium

### 23. Personal Collection Journal
**Effort:** Large | **Impact:** Medium

---

## Suggested Next Sprint

Tackle items 8, 9, and 10 — Pull List, Spending Tracker, and Collection Sharing. These build on the existing collection data and add the most user-facing value.
