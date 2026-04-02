// ============================================================
// Auth Integration for Absolute Universe Collection Tracker
// ============================================================
// Add this script (+ Firebase SDK + firebase-config.js) to
// index.html and issue.html to enable auth & cloud sync.
//
// Required script tags (add before </body>):
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
//   <script src="firebase-config.js"></script>
//   <script src="auth-integration.js"></script>
// ============================================================

(function() {
  // ── State management ──
  // Track initialization to prevent duplicate setup
  var _initialized = false;
  // Auth listener unsubscribe function
  var _unsubscribeAuth = null;
  // Preview guard listener references for cleanup
  var _previewClickHandler = null;
  var _previewKeydownHandler = null;
  // Dropdown close listener reference
  var _dropdownCloseHandler = null;
  // Sync debounce timer + adaptive delay
  var _syncTimeout = null;
  var _syncDelay = 1500; // ms — adjusted dynamically based on connection
  var _lastSyncDuration = null;
  // Original Storage.prototype.setItem reference (for restore)
  var _originalSetItem = Storage.prototype.setItem;
  // Whether localStorage has been patched
  var _storagePatched = false;
  // Focus trap references
  var _modalEscapeHandler = null;
  var _previousFocusElement = null;

  // ── Safe wrappers for external dependencies ──
  // These functions are defined in firebase-config.js. If that script
  // fails to load (network error, ad-blocker, etc.) we fall back to
  // safe no-ops so auth-integration doesn't throw.

  function _syncOwnedToCloud(owned) {
    if (typeof syncOwnedToCloud === 'function') return syncOwnedToCloud(owned);
    console.warn('[auth] syncOwnedToCloud is not available — firebase-config.js may not have loaded');
    return Promise.resolve();
  }

  function _loadOwnedFromCloud() {
    if (typeof loadOwnedFromCloud === 'function') return loadOwnedFromCloud();
    console.warn('[auth] loadOwnedFromCloud is not available — firebase-config.js may not have loaded');
    return Promise.resolve(null);
  }

  function _mergeOwned(local, cloud) {
    if (typeof mergeOwned === 'function') return mergeOwned(local, cloud);
    console.warn('[auth] mergeOwned is not available — firebase-config.js may not have loaded');
    // Fallback: simple union merge
    var merged = {};
    var keys = Object.keys(Object.assign({}, local, cloud));
    keys.forEach(function(k) {
      if ((local && local[k]) || (cloud && cloud[k])) merged[k] = true;
    });
    return merged;
  }

  function _isCurrentUserAdmin() {
    if (typeof isCurrentUserAdmin === 'function') return isCurrentUserAdmin();
    console.warn('[auth] isCurrentUserAdmin is not available — firebase-config.js may not have loaded');
    return Promise.resolve(false);
  }

  // ── Preview mode: block owned-toggling for signed-out users ──
  // We intercept clicks on issue cards and show a sign-up prompt
  // instead of toggling ownership when the user isn't signed in.

  function injectPreviewBanner() {
    // Check if banner has been dismissed — persistent (localStorage) or session
    try {
      if (localStorage.getItem('previewBannerDismissed') || sessionStorage.getItem('previewBannerDismissed')) {
        return;
      }
    } catch(e) {
      // Private browsing may block storage — fall through and show banner
    }

    var banner = document.createElement('div');
    banner.id = 'previewBanner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-top:2px solid #3b82f6;padding:0.9rem 1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;box-shadow:0 -4px 24px rgba(0,0,0,0.5);';
    banner.innerHTML = ''
      + '<div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;justify-content:center;flex:1">'
      + '  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink:0"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      + '  <span style="color:#cbd5e1;font-size:0.9rem"><strong style="color:#fff">Preview Mode</strong> — Create a free account to track your collection and sync across devices</span>'
      + '  <a href="auth.html" style="background:#3b82f6;color:#fff;padding:0.5rem 1.2rem;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600;white-space:nowrap;transition:background 0.2s;flex-shrink:0" onmouseenter="this.style.background=\'#2563eb\'" onmouseleave="this.style.background=\'#3b82f6\'">Sign Up Free</a>'
      + '</div>'
      + '<button id="previewBannerClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:0.25rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:color 0.2s" onmouseenter="this.style.color=\'#cbd5e1\'" onmouseleave="this.style.color=\'#94a3b8\'" title="Dismiss banner">'
      + '  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>';

    document.body.appendChild(banner);

    // Close button handler — persist dismiss so it doesn't come back
    document.getElementById('previewBannerClose').onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      try {
        localStorage.setItem('previewBannerDismissed', 'true');
      } catch(ignore) {
        // Fallback for private browsing
        try { sessionStorage.setItem('previewBannerDismissed', 'true'); } catch(ignore2) {}
      }
      removePreviewBanner();
    };

    // Add bottom padding so banner doesn't cover content
    document.body.style.paddingBottom = '70px';
  }

  function removePreviewBanner() {
    var banner = document.getElementById('previewBanner');
    if (banner) banner.remove();
    document.body.style.paddingBottom = '';
  }

  // Show a sign-up prompt modal when a signed-out user tries to interact
  function showSignUpPrompt() {
    // Don't show if one is already open
    if (document.getElementById('signUpPromptOverlay')) return;

    // Store the currently focused element for focus restoration
    _previousFocusElement = document.activeElement;

    var overlay = document.createElement('div');
    overlay.id = 'signUpPromptOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn 0.2s ease;will-change:transform,opacity;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:2rem;max-width:380px;width:90%;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,0.5);animation:slideUp 0.25s ease;max-height:90vh;overflow-y:auto;will-change:transform,opacity;';

    modal.innerHTML = ''
      + '<div style="width:56px;height:56px;background:rgba(59,130,246,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">'
      + '  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
      + '</div>'
      + '<h3 style="color:#fff;font-size:1.15rem;margin:0 0 0.5rem;font-weight:700">Create an Account to Track</h3>'
      + '<p style="color:#94a3b8;font-size:0.88rem;margin:0 0 1.5rem;line-height:1.5">Sign up for free to mark issues as owned, sync your collection across devices, and never miss a release.</p>'
      + '<a href="auth.html" id="signUpPromptLink" style="display:block;padding:0.7rem;background:#3b82f6;color:#fff;border-radius:10px;text-decoration:none;font-size:0.95rem;font-weight:600;margin-bottom:0.6rem;transition:background 0.2s" onmouseenter="this.style.background=\'#2563eb\'" onmouseleave="this.style.background=\'#3b82f6\'">Sign Up / Sign In</a>'
      + '<button id="signUpPromptClose" style="background:none;border:none;color:#64748b;font-size:0.85rem;cursor:pointer;padding:0.4rem;transition:color 0.2s" onmouseenter="this.style.color=\'#94a3b8\'" onmouseleave="this.style.color=\'#64748b\'">Continue browsing</button>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close handlers
    var closeOverlay = function() {
      overlay.remove();
      // Restore focus to previous element
      if (_previousFocusElement && typeof _previousFocusElement.focus === 'function') {
        _previousFocusElement.focus();
      }
      _previousFocusElement = null;
      // Remove escape listener
      if (_modalEscapeHandler) {
        document.removeEventListener('keydown', _modalEscapeHandler);
        _modalEscapeHandler = null;
      }
    };

    document.getElementById('signUpPromptClose').onclick = closeOverlay;
    overlay.onclick = function(e) { if (e.target === overlay) closeOverlay(); };

    // Escape key to close modal
    _modalEscapeHandler = function(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOverlay();
      }
    };
    document.addEventListener('keydown', _modalEscapeHandler);

    // Add animation styles if not present
    if (!document.getElementById('previewAnimStyles')) {
      var style = document.createElement('style');
      style.id = 'previewAnimStyles';
      style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(style);
    }

    // Set focus to the Sign Up link (first interactive element)
    var signUpLink = document.getElementById('signUpPromptLink');
    if (signUpLink) {
      signUpLink.focus();
    }
  }

  // Intercept ownership clicks for signed-out users
  // Uses named handler functions so they can be removed later if needed.
  function installPreviewGuard() {
    // Guard against duplicate installation
    if (_previewClickHandler) return;

    _previewClickHandler = function(e) {
      // Only block when signed out
      if (auth.currentUser) return;

      // Issue cards: navigate to the issue detail page instead of toggling ownership
      var card = e.target.closest('.issue-card');
      if (card) {
        var link = card.querySelector('a[href]');
        if (link) {
          e.stopImmediatePropagation();
          e.preventDefault();
          window.location.href = link.href;
          return;
        }
      }

      // TPB cards: no detail page, so show sign-up prompt
      var tpbCard = e.target.closest('.tpb-card');
      if (tpbCard) {
        e.stopImmediatePropagation();
        e.preventDefault();
        showSignUpPrompt();
        return;
      }
    };

    _previewKeydownHandler = function(e) {
      if (auth.currentUser) return;
      if (e.key === 'Enter' || e.key === ' ') {
        // Issue cards: navigate to issue detail page
        var card = e.target.closest('.issue-card');
        if (card) {
          var link = card.querySelector('a[href]');
          if (link) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.href = link.href;
            return;
          }
        }

        // TPB cards: show sign-up prompt
        var tpbCard = e.target.closest('.tpb-card');
        if (tpbCard) {
          e.stopImmediatePropagation();
          e.preventDefault();
          showSignUpPrompt();
        }
      }
    };

    document.addEventListener('click', _previewClickHandler, true);
    document.addEventListener('keydown', _previewKeydownHandler, true);
  }

  // Remove preview guard listeners (cleanup)
  function removePreviewGuard() {
    if (_previewClickHandler) {
      document.removeEventListener('click', _previewClickHandler, true);
      _previewClickHandler = null;
    }
    if (_previewKeydownHandler) {
      document.removeEventListener('keydown', _previewKeydownHandler, true);
      _previewKeydownHandler = null;
    }
  }

  // Inject auth UI button into the page
  function injectAuthUI() {
    // Guard against duplicate injection
    if (document.getElementById('authUI')) return;

    // Create the user button container
    var container = document.createElement('div');
    container.id = 'authUI';
    container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:999;display:flex;align-items:center;gap:0.5rem;';

    // Sync status indicator
    var syncBadge = document.createElement('div');
    syncBadge.id = 'syncBadge';
    syncBadge.style.cssText = 'font-size:0.7rem;color:#666;display:none;padding:0.25rem 0.5rem;background:rgba(0,0,0,0.4);border-radius:4px;';
    container.appendChild(syncBadge);

    // User button
    var btn = document.createElement('button');
    btn.id = 'authBtn';
    btn.style.cssText = 'background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:50%;width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:0.85rem;font-weight:600;transition:all 0.2s;';
    btn.onmouseenter = function() { btn.style.background = 'rgba(255,255,255,0.12)'; };
    btn.onmouseleave = function() { btn.style.background = 'rgba(255,255,255,0.08)'; };
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    container.appendChild(btn);

    // Dropdown menu
    var dropdown = document.createElement('div');
    dropdown.id = 'authDropdown';
    dropdown.setAttribute('role', 'menu');
    dropdown.setAttribute('aria-label', 'Account menu');
    dropdown.style.cssText = 'display:none;position:absolute;top:calc(100% + 0.5rem);right:0;background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:10px;min-width:220px;box-shadow:0 8px 32px rgba(0,0,0,0.5);overflow:hidden;';
    container.appendChild(dropdown);

    // ARIA attributes for the toggle button
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'authDropdown');
    btn.setAttribute('aria-label', 'Account menu');

    // Helper: get all focusable menu items in the dropdown
    function getMenuItems() {
      return Array.prototype.slice.call(dropdown.querySelectorAll('[role="menuitem"]'));
    }

    // Helper: open/close the dropdown with focus management
    function toggleDropdown(open) {
      if (open) {
        dropdown.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        // Focus first menu item when opening
        var items = getMenuItems();
        if (items.length) items[0].focus();
      } else {
        dropdown.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
      }
    }

    // Toggle dropdown on click
    btn.onclick = function(e) {
      e.stopPropagation();
      var isOpen = dropdown.style.display !== 'none';
      toggleDropdown(!isOpen);
    };

    // Keyboard navigation on the toggle button
    btn.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        if (dropdown.style.display === 'none') {
          e.preventDefault();
          toggleDropdown(true);
        }
      } else if (e.key === 'Escape') {
        if (dropdown.style.display !== 'none') {
          e.preventDefault();
          toggleDropdown(false);
          btn.focus();
        }
      }
    });

    // Keyboard navigation within the dropdown menu
    dropdown.addEventListener('keydown', function(e) {
      var items = getMenuItems();
      var idx = items.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = idx < items.length - 1 ? idx + 1 : 0;
        items[next].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = idx > 0 ? idx - 1 : items.length - 1;
        items[prev].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (items.length) items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        if (items.length) items[items.length - 1].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggleDropdown(false);
        btn.focus();
      } else if (e.key === 'Tab') {
        // Close dropdown when tabbing out
        toggleDropdown(false);
      }
    });

    // Close dropdown on outside click — use named function so it's not duplicated
    _dropdownCloseHandler = function(e) {
      if (dropdown.style.display !== 'none' && !container.contains(e.target)) {
        toggleDropdown(false);
      }
    };
    document.addEventListener('click', _dropdownCloseHandler);

    // Add focus styles for keyboard navigation on menu items
    if (!document.getElementById('authDropdownStyles')) {
      var style = document.createElement('style');
      style.id = 'authDropdownStyles';
      style.textContent = '#authDropdown [role="menuitem"]:focus{outline:2px solid #3b82f6;outline-offset:-2px;background:rgba(255,255,255,0.08) !important;}';
      document.head.appendChild(style);
    }

    document.body.appendChild(container);
  }

  // Update auth UI based on state
  function updateAuthUI(user) {
    var btn = document.getElementById('authBtn');
    var dropdown = document.getElementById('authDropdown');
    if (!btn || !dropdown) return;

    if (user) {
      // Signed in — show avatar/initials
      var initials = (user.displayName || user.email || '?').charAt(0).toUpperCase();
      if (user.photoURL) {
        var img = document.createElement('img');
        img.src = user.photoURL;
        img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover';
        img.alt = 'Profile';
        btn.textContent = '';
        btn.appendChild(img);
      } else {
        btn.textContent = initials;
        btn.style.color = '#fff';
        btn.style.background = '#3b82f6';
      }

      var name = user.displayName || 'User';
      var email = user.email || '';
      var menuHTML = '<div style="padding:0.8rem 1rem;border-bottom:1px solid rgba(255,255,255,0.08)">';
      menuHTML += '<div style="font-size:0.9rem;font-weight:600;color:#fff">' + escapeHtml(name) + '</div>';
      menuHTML += '<div style="font-size:0.75rem;color:#888;margin-top:0.15rem">' + escapeHtml(email) + '</div>';
      menuHTML += '</div>';
      menuHTML += '<div style="padding:0.4rem">';
      menuHTML += '<button role="menuitem" tabindex="-1" onclick="window._authSyncNow()" style="display:block;width:100%;text-align:left;padding:0.5rem 0.7rem;background:none;border:none;color:#ddd;font-size:0.85rem;cursor:pointer;border-radius:6px" onmouseenter="this.style.background=\'rgba(255,255,255,0.06)\'" onmouseleave="this.style.background=\'none\'">Sync collection now</button>';

      // Admin link
      _isCurrentUserAdmin().then(function(isAdmin) {
        if (isAdmin) {
          var adminBtn = document.createElement('button');
          adminBtn.textContent = 'Admin Dashboard';
          adminBtn.setAttribute('role', 'menuitem');
          adminBtn.setAttribute('tabindex', '-1');
          adminBtn.onclick = function() { window.location.href = 'admin.html'; };
          adminBtn.style.cssText = 'display:block;width:100%;text-align:left;padding:0.5rem 0.7rem;background:none;border:none;color:#f59e0b;font-size:0.85rem;cursor:pointer;border-radius:6px';
          adminBtn.onmouseenter = function() { this.style.background = 'rgba(255,255,255,0.06)'; };
          adminBtn.onmouseleave = function() { this.style.background = 'none'; };
          var menuItems = document.querySelector('#authDropdown > div:last-child');
          if (menuItems) menuItems.insertBefore(adminBtn, menuItems.lastElementChild);
        }
      });

      menuHTML += '</div>';
      menuHTML += '<div style="border-top:1px solid rgba(255,255,255,0.08);padding:0.4rem">';
      menuHTML += '<button role="menuitem" tabindex="-1" onclick="window._authSignOut()" style="display:block;width:100%;text-align:left;padding:0.5rem 0.7rem;background:none;border:none;color:#f87171;font-size:0.85rem;cursor:pointer;border-radius:6px" onmouseenter="this.style.background=\'rgba(255,255,255,0.06)\'" onmouseleave="this.style.background=\'none\'">Sign out</button>';
      menuHTML += '</div>';
      dropdown.innerHTML = menuHTML;

      // Remove preview banner when signed in
      removePreviewBanner();
    } else {
      // Signed out — show login button
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      btn.style.color = '#aaa';
      btn.style.background = 'rgba(255,255,255,0.08)';
      dropdown.innerHTML = '<div style="padding:1rem;text-align:center"><div style="font-size:0.85rem;color:#aaa;margin-bottom:0.75rem">Sign in to sync your collection across devices</div><a href="auth.html" role="menuitem" tabindex="-1" style="display:block;padding:0.6rem;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600">Sign In / Sign Up</a></div>';

      // Show preview banner when signed out
      injectPreviewBanner();
    }
  }

  function escapeHtml(str) {
    if (str == null) return '';
    var s = String(str);
    // Belt-and-suspenders: manual replacement is faster and doesn't
    // rely on DOM behaviour that varies across engines.
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Show sync status
  function showSyncStatus(msg) {
    var badge = document.getElementById('syncBadge');
    if (!badge) return;
    badge.textContent = msg;
    badge.style.display = 'block';
    setTimeout(function() { badge.style.display = 'none'; }, 3000);
  }

  // Patch localStorage.setItem to also sync au_owned to Firestore.
  // Uses a scoped wrapper instead of modifying Storage.prototype globally.
  function patchLocalStorage() {
    if (_storagePatched) return;
    _storagePatched = true;

    Storage.prototype.setItem = function(key, value) {
      // Call the original method
      _originalSetItem.call(this, key, value);
      // Sync au_owned to cloud when a user is signed in
      if ((key === 'au_owned' || key === 'au_owned_variants') && auth.currentUser) {
        clearTimeout(_syncTimeout);
        // Use adaptive delay: if previous sync was slow, wait longer
        var delay = _lastSyncDuration ? Math.max(1000, Math.min(_lastSyncDuration * 2, 5000)) : _syncDelay;
        _syncTimeout = setTimeout(function() {
          try {
            var start = Date.now();
            _syncOwnedToCloud().then(function() {
              _lastSyncDuration = Date.now() - start;
              showSyncStatus('Synced');
            }).catch(function(e) {
              console.warn('[auth] Cloud sync failed:', e);
              showSyncStatus('Sync failed');
            });
          } catch(e) {
            console.warn('[auth] Failed to sync:', e);
          }
        }, delay);
      }
    };
  }

  // Restore original localStorage.setItem (cleanup)
  function unpatchLocalStorage() {
    if (_storagePatched) {
      Storage.prototype.setItem = _originalSetItem;
      _storagePatched = false;
    }
    clearTimeout(_syncTimeout);
  }

  // Load cloud data and merge with local on sign in
  async function handleSignIn(user) {
    showSyncStatus('Syncing...');
    try {
      var cloudData = await _loadOwnedFromCloud();
      var localRaw = localStorage.getItem('au_owned');
      var localOwned = localRaw ? JSON.parse(localRaw) : {};
      var localVariants = (typeof getOwnedVariants === 'function') ? getOwnedVariants() : {};

      if (cloudData) {
        // Support both old format (flat object) and new format ({ owned, ownedVariants })
        var cloudOwned = cloudData.owned || cloudData;
        var cloudVariants = cloudData.ownedVariants || {};

        // Merge local + cloud (union)
        var merged = _mergeOwned(
          { owned: localOwned, ownedVariants: localVariants },
          { owned: cloudOwned, ownedVariants: cloudVariants }
        );
        var mergedOwned = merged.owned || merged;
        var mergedVariants = merged.ownedVariants || {};

        localStorage.setItem('au_owned', JSON.stringify(mergedOwned));
        if (typeof setOwnedVariants === 'function') setOwnedVariants(mergedVariants);

        // Push merged back to cloud
        await _syncOwnedToCloud();
        showSyncStatus('Synced');

        // Reload if there were changes
        if (JSON.stringify(localOwned) !== JSON.stringify(mergedOwned) ||
            JSON.stringify(localVariants) !== JSON.stringify(mergedVariants)) {
          location.reload();
        }
      } else {
        // No cloud data — push local to cloud
        if (Object.keys(localOwned).length > 0 || Object.keys(localVariants).length > 0) {
          await _syncOwnedToCloud();
        }
        showSyncStatus('Synced');
      }

      // Update login timestamp
      await db.collection('users').doc(user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) {
      console.error('Sync error:', e);
      showSyncStatus('Sync failed');
    }
  }

  // Manual sync
  window._authSyncNow = async function() {
    if (!auth.currentUser) return;
    showSyncStatus('Syncing...');
    try {
      var localRaw = localStorage.getItem('au_owned');
      var localOwned = localRaw ? JSON.parse(localRaw) : {};
      var localVariants = (typeof getOwnedVariants === 'function') ? getOwnedVariants() : {};
      var cloudData = await _loadOwnedFromCloud();
      var cloudOwned = cloudData ? (cloudData.owned || cloudData) : {};
      var cloudVariants = cloudData ? (cloudData.ownedVariants || {}) : {};
      var merged = _mergeOwned(
        { owned: localOwned, ownedVariants: localVariants },
        { owned: cloudOwned, ownedVariants: cloudVariants }
      );
      var mergedOwned = merged.owned || merged;
      var mergedVariants = merged.ownedVariants || {};
      localStorage.setItem('au_owned', JSON.stringify(mergedOwned));
      if (typeof setOwnedVariants === 'function') setOwnedVariants(mergedVariants);
      await _syncOwnedToCloud();
      showSyncStatus('Synced');
      location.reload();
    } catch(e) {
      showSyncStatus('Sync failed');
    }
  };

  // Sign out
  window._authSignOut = function() {
    auth.signOut().then(function() {
      location.reload();
    });
  };

  // Initialize
  function init() {
    // Guard against double initialization
    if (_initialized) return;
    _initialized = true;

    injectAuthUI();
    patchLocalStorage();
    installPreviewGuard();

    // Capture the unsubscribe function so we can clean up if needed
    _unsubscribeAuth = auth.onAuthStateChanged(function(user) {
      updateAuthUI(user);
      if (user) {
        handleSignIn(user);
      }
    });
  }

  // Expose cleanup for testing or SPA teardown
  window._authCleanup = function() {
    if (_unsubscribeAuth) {
      _unsubscribeAuth();
      _unsubscribeAuth = null;
    }
    removePreviewGuard();
    unpatchLocalStorage();
    if (_dropdownCloseHandler) {
      document.removeEventListener('click', _dropdownCloseHandler);
      _dropdownCloseHandler = null;
    }
    if (_modalEscapeHandler) {
      document.removeEventListener('keydown', _modalEscapeHandler);
      _modalEscapeHandler = null;
    }
    var authUI = document.getElementById('authUI');
    if (authUI) authUI.remove();
    removePreviewBanner();
    _previousFocusElement = null;
    _initialized = false;
  };

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
