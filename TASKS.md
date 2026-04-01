TASKS.md# Absolute DC Tracker — Project Tasks

**Site:** https://absolutedctracker.com (absolutedctracker.netlify.app)
**Repo:** https://github.com/rcasto123/absolutedctracker.com
**Stack:** Static HTML/CSS/JS, Firebase Auth (Google/Apple/Email), Firestore, Netlify
**Created:** March 30, 2026

---

## What's Been Done (from commit history)

- Initial site build with Firebase Auth, Firestore sync, admin dashboard, and tracking for 110+ issues
- Preview mode for signed-out users with sign-up banner
- Fixed memory leaks, Storage.prototype patching, auth listener management
- Comprehensive SEO: meta tags, OG tags, Twitter Card, canonical URL, JSON-LD structured data, sitemap.xml, robots.txt
- Accessibility improvements: touch targets (44px min), aria-live on collection results, keyboard nav, contrast fixes, focus states
- Performance: replaced setInterval polling with MutationObserver, deferred script loading, preconnect hints
- Mobile responsive: breakpoints for 480px and 1024px, clamp() for hero min-height
- Security: Netlify headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Auth UX: dismissible preview banner, Escape key to close sign-up modal, focus trap, mobile modal overflow
- Export checklist with stats
- Theme switcher: 4 base themes + 8 hero-inspired themes
- Theme picker: smooth panel transitions, top-right positioning near auth button

---

## Open Tasks — Bugs & Code Quality

### High Priority

1. **Cloud sync functions are externally referenced but not co-located**
   loadOwnedFromCloud(), syncOwnedToCloud(), and mergeOwned() are called in auth-integration.js but defined in firebase-config.js. If that file fails to load, these silently break.

2. **Admin check (isCurrentUserAdmin()) is unresolved in auth-integration.js**
   Referenced but never defined in the same file — depends on an external script. Should add a guard or fallback.

3. **Silent error swallowing in theme-switcher.js**
   Bare catch (e) {} blocks suppress localStorage errors without logging. In privacy/incognito mode this could cause confusing behavior.

4. **XSS protection is minimal**
   escapeHtml() in auth-integration.js is basic. If display names contain crafted input, this may not be sufficient.

### Medium Priority

5. **No theme validation on load**
   If stored theme IDs become stale after a code update, there's no migration or cleanup.

6. **Sync debounce is hardcoded at 1500ms**
   May be too fast on slow connections or too slow for quick edits. Consider making it adaptive.

7. **Banner dismiss uses sessionStorage only**
   Users see the preview banner again every new session. Consider offering a persistent dismiss via localStorage.

---

## Open Tasks — Feature Ideas & Improvements

### Accessibility

8. **Add comprehensive ARIA attributes to theme picker**
   Dropdown panel and swatches lack ARIA roles/labels.

9. **Add keyboard navigation (arrow keys) to auth dropdown menu**
   Currently lacks Tab/arrow key handling within the dropdown.

### UX / Design

10. **Make theme picker positioning configurable**
    Currently hardcoded positioning — should adapt for different screen sizes.

11. **Add "What's New" or changelog section**
    A changelog or version badge would help returning users see updates.

12. **Add comic cover images to issue cards**
    Adding cover art would make the experience more visual and engaging.

### Data & Sync

13. **Add offline support / service worker enhancements**
    A service worker with cached data would enable offline browsing.

14. **Add data export in multiple formats**
    Consider adding CSV/JSON export for external collection management.

### SEO & Marketing

15. **Expand sitemap.xml with more pages**
    Currently only lists homepage and auth page.

16. **Add social sharing for collection stats**
    Let users share their collection progress on social media.

---

## Project References

- **GitHub Repo:** https://github.com/rcasto123/absolutedctracker.com
- **Live Site:** https://absolutedctracker.com
- **Netlify Dashboard:** https://app.netlify.com/projects/absolutedctracker
