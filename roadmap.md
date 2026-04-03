# Absolute DC Universe Collection Tracker — Feature Roadmap

**Updated:** April 3, 2026
**Site:** [absolutedctracker.com](https://www.absolutedctracker.com)
**Repo:** github.com/rcasto123/absolutedctracker.com

---

## Current State Summary

The site is a polished single-page app with a modular codebase (638-line index.html + 10 separate JS/CSS modules) and 8 main tabs: Collection, Release Calendar, Series Guide, Trade Paperbacks, Reading Order, Analytics, Achievements, and Media.

**What's working well:** Full collection tracking loop with sharing, import/export, cloud sync. Themed hero backgrounds with per-hero CSS animations. Variant cover ownership. Light and dark mode with 12 themes (auto-detects system preference on first visit). Pull list, spending tracker, and price guide with market values. Enriched media tab with creator spotlights. Enhanced reading order with progress tracking and recommendations. Improved mobile navigation with scanner access. Lazy-loaded cover art. Barcode scanning (Phases 1–4) with batch mode, history, and offline queue. 43-bug comprehensive security and stability audit completed. Automated data pipeline with Comic Vine API and GitHub Actions for weekly updates. External JSON data loading with offline fallback. Modular codebase — index.html split into focused JS/CSS modules for maintainability. Shopping cart with variant cover picker — add issues and specific variants to cart from collection view, cross-tab sync with scanner. 9-bug sweep completed — XSS hardening, accessibility improvements (ARIA modal, Escape key, focus management), error handling, and UI visibility fixes.

**Where the gaps are:** No social features beyond text/image sharing. No advanced search/filter system.

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
13. Better mobile bottom nav — scrollable, larger targets, active indicator, scanner access
14. Lazy-load cover art — IntersectionObserver with blur-up placeholders
15. Enriched media tab — creator spotlights, collection stats, community links
16. Batch import / export — JSON + CSV, merge on import
17. Reading order enhancements — "read next", arc progress, series switches, status icons
18. Collection analytics dashboard — donut chart, per-series progress, monthly timeline
19. Auto dark/light mode detection — respects prefers-color-scheme on first visit
20. WCAG AA light theme contrast — all muted text passes 4.5:1 ratio

### Big Bets ✅
21. Price guide / market value — cover prices, market values, ROI, prices.json pipeline
22. Barcode scanner (Phases 1–4) — camera-based UPC scanning, manual entry, batch mode, scan history, offline queue, trade paperback ISBNs, mobile bottom nav integration
23. Themed hero backgrounds — per-hero cover art + CSS animation overlays
24. 43-bug security & stability audit — CSP hardening, SRI hashes, XSS prevention, timezone fixes, sync race conditions, error handling, accessibility improvements, performance optimizations
25. Automated data pipeline — Comic Vine API integration, external JSON data loading, GitHub Actions weekly updates, pipeline CLI with validate/sync/add modes
26. Issue detail page cover art fix — 28 missing covers populated, broken cover loader fixed to use data pipeline JSON
27. GitHub Actions CI/CD — scheduled weekly data updates with auto-PR creation
28. Modular codebase refactor — 5,600-line index.html split into 10 focused modules (styles.css, data.js, state.js, renders.js, cover-map.js, init.js, export.js, share.js, notifications.js). 88% reduction in index.html size.
29. Shopping cart with variant cover picker — cart checkboxes on issue cards, variant picker popup with cover art gallery, multi-select, owned/in-cart badges, cross-tab sync with scanner, broken image fallback, responsive mobile layout (2-column grid).
30. Bug sweep (9 fixes) — duplicate HTML tags, cart save error handling, XSS sanitization in variant picker, null check guards, ARIA modal roles + Escape key, focus restoration, variant data race condition guard, prices.json cache busting, variant letter naming overflow fix (26+ covers). Improved cart icon and checkbox visibility.

---

## Remaining — Quick Wins

31. **Timeline view for collection growth** — Small effort. Visual timeline of when issues were added to the collection over time.
32. **Blind buy random issue picker** — Small effort. "Surprise me" button that picks a random unowned issue to try next.
33. **Completion date calculator** — Small effort. Estimate when you'll complete a series based on release schedule and buying pace.
34. **Release schedule digest email** — Small effort. Weekly email with upcoming releases for your pulled series.
35. **Custom tags for issues** — Small effort. User-defined labels (e.g. "signed", "first print", "graded") on individual issues.

---

## Remaining — Medium Features

36. **Series tier list / ranking** — Medium effort. Drag-and-drop ranking of series by personal preference.
37. **Collector's notes per issue** — Medium effort. Free-text notes field on each issue (synced to Firestore).
38. **Smart series recommendations** — Medium effort. "If you like X, try Y" based on owned series and reading history.
39. **Release window alerts** — Medium effort. Browser push notifications when a pulled issue's release date is approaching.
40. **Variant completion leaderboard** — Medium effort. Ranked list of variant completeness across all users.
41. **Series comparison tool** — Medium effort. Side-by-side comparison of two series (release cadence, page counts, prices, completion).
42. **Pre-order countdown badges** — Medium effort. Visual countdown badges on upcoming issues within 2 weeks of release.

---

## Remaining — Big Bets

43. **Community hub (profiles & feed)** — Large effort, Medium impact. Public profiles, collection leaderboards, and a community feed.
44. **Advanced search & filters** — Large effort, Medium impact. Full-text search across all fields, multi-facet filtering (writer, artist, date range, price range, owned status).
45. **Recommendation engine & curated lists** — Large effort, Medium impact. Algorithmic recommendations based on collection patterns plus editorially curated "best of" lists.
46. **Personal grading / condition tracker** — Large effort, Medium impact. CGC/CBCS grade entry, slab photos, condition notes, and grade-adjusted market values.
47. **Offline-first data sync** — Large effort, High impact. Full offline support with background sync when connectivity returns. IndexedDB local store.
48. **Market tracker & price alerts** — Large effort, Medium impact. Real-time eBay sold listings, price trend charts, and alerts for price drops/spikes.
49. **Third-party API & integrations** — Large effort, Medium impact. Connect to CLZ, GoCollect, LOCG, or other comic tracking services for data import/export.
50. **Collection insights & trends report** — Large effort, Medium impact. Monthly auto-generated report: spending trends, collection growth, market value changes, series completion velocity.
51. **Multi-user household sharing** — Large effort, Medium impact. Multiple collectors sharing a single account with separate owned/wish lists.

---

## Suggested Next Sprint

Bug sweep is done — the codebase is cleaner and more accessible. Items 31–35 (Quick Wins) are fast to ship and would add nice polish. After that, items 36–42 (Medium Features) add depth. The automated data pipeline keeps issue data fresh weekly.
