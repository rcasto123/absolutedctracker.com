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
  // ── Preview mode: block owned-toggling for signed-out users ──
  // We intercept clicks on issue cards and show a sign-up prompt
  // instead of toggling ownership when the user isn't signed in.

  function injectPreviewBanner() {
    var banner = document.createElement('div');
    banner.id = 'previewBanner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-top:2px solid #3b82f6;padding:0.9rem 1.2rem;display:flex;align-items:center;justify-content:center;gap:1rem;box-shadow:0 -4px 24px rgba(0,0,0,0.5);';
    banner.innerHTML = ''
      + '<div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;justify-content:center">'
      + '  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink:0"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      + '  <span style="color:#cbd5e1;font-size:0.9rem"><strong style="color:#fff">Preview Mode</strong> — Create a free account to track your collection and sync across devices</span>'
      + '  <a href="auth.html" style="background:#3b82f6;color:#fff;padding:0.5rem 1.2rem;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600;white-space:nowrap;transition:background 0.2s" onmouseenter="this.style.background=\'#2563eb\'" onmouseleave="this.style.background=\'#3b82f6\'">Sign Up Free</a>'
      + '</div>';
    document.body.appendChild(banner);
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

    var overlay = document.createElement('div');
    overlay.id = 'signUpPromptOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn 0.2s ease';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:2rem;max-width:380px;width:90%;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,0.5);animation:slideUp 0.25s ease';

    modal.innerHTML = ''
      + '<div style="width:56px;height:56px;background:rgba(59,130,246,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">'
      + '  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
      + '</div>'
      + '<h3 style="color:#fff;font-size:1.15rem;margin:0 0 0.5rem;font-weight:700">Create an Account to Track</h3>'
      + '<p style="color:#94a3b8;font-size:0.88rem;margin:0 0 1.5rem;line-height:1.5">Sign up for free to mark issues as owned, sync your collection across devices, and never miss a release.</p>'
      + '<a href="auth.html" style="display:block;padding:0.7rem;background:#3b82f6;color:#fff;border-radius:10px;text-decoration:none;font-size:0.95rem;font-weight:600;margin-bottom:0.6rem;transition:background 0.2s" onmouseenter="this.style.background=\'#2563eb\'" onmouseleave="this.style.background=\'#3b82f6\'">Sign Up / Sign In</a>'
      + '<button id="signUpPromptClose" style="background:none;border:none;color:#64748b;font-size:0.85rem;cursor:pointer;padding:0.4rem;transition:color 0.2s" onmouseenter="this.style.color=\'#94a3b8\'" onmouseleave="this.style.color=\'#64748b\'">Continue browsing</button>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById('signUpPromptClose').onclick = function() { overlay.remove(); };
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    // Add animation styles if not present
    if (!document.getElementById('previewAnimStyles')) {
      var style = document.createElement('style');
      style.id = 'previewAnimStyles';
      style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(style);
    }
  }

  // Intercept ownership clicks for signed-out users
  // We add a capturing event listener that catches clicks on issue cards
  // before the regular toggleOwned handler can fire.
  function installPreviewGuard() {
    document.addEventListener('click', function(e) {
      // Only block when signed out
      if (auth.currentUser) return;

      // Check if the click is on an issue card or inside one
      var card = e.target.closest('.issue-card');
      if (card) {
        e.stopImmediatePropagation();
        e.preventDefault();
        showSignUpPrompt();
        return;
      }

      // Also block TPB cards
      var tpbCard = e.target.closest('.tpb-card');
      if (tpbCard) {
        e.stopImmediatePropagation();
        e.preventDefault();
        showSignUpPrompt();
        return;
      }
    }, true); // "true" = capturing phase, runs before the card's own click handler

    // Also block keyboard toggles
    document.addEventListener('keydown', function(e) {
      if (auth.currentUser) return;
      if (e.key === 'Enter' || e.key === ' ') {
        var card = e.target.closest('.issue-card') || e.target.closest('.tpb-card');
        if (card) {
          e.stopImmediatePropagation();
          e.preventDefault();
          showSignUpPrompt();
        }
      }
    }, true);
  }

  // Inject auth UI button into the page
  function injectAuthUI() {
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
    dropdown.style.cssText = 'display:none;position:absolute;top:calc(100% + 0.5rem);right:0;background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:10px;min-width:220px;box-shadow:0 8px 32px rgba(0,0,0,0.5);overflow:hidden;';
    container.appendChild(dropdown);

    // Toggle dropdown
    btn.onclick = function(e) {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };
    document.addEventListener('click', function() { dropdown.style.display = 'none'; });

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
        btn.innerHTML = '<img src="' + user.photoURL + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" alt="Profile">';
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
      menuHTML += '<button onclick="window._authSyncNow()" style="display:block;width:100%;text-align:left;padding:0.5rem 0.7rem;background:none;border:none;color:#ddd;font-size:0.85rem;cursor:pointer;border-radius:6px" onmouseenter="this.style.background=\'rgba(255,255,255,0.06)\'" onmouseleave="this.style.background=\'none\'">Sync collection now</button>';

      // Admin link
      isCurrentUserAdmin().then(function(isAdmin) {
        if (isAdmin) {
          var adminBtn = document.createElement('button');
          adminBtn.textContent = 'Admin Dashboard';
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
      menuHTML += '<button onclick="window._authSignOut()" style="display:block;width:100%;text-align:left;padding:0.5rem 0.7rem;background:none;border:none;color:#f87171;font-size:0.85rem;cursor:pointer;border-radius:6px" onmouseenter="this.style.background=\'rgba(255,255,255,0.06)\'" onmouseleave="this.style.background=\'none\'">Sign out</button>';
      menuHTML += '</div>';
      dropdown.innerHTML = menuHTML;

      // Remove preview banner when signed in
      removePreviewBanner();
    } else {
      // Signed out — show login button
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      btn.style.color = '#aaa';
      btn.style.background = 'rgba(255,255,255,0.08)';
      dropdown.innerHTML = '<div style="padding:1rem;text-align:center"><div style="font-size:0.85rem;color:#aaa;margin-bottom:0.75rem">Sign in to sync your collection across devices</div><a href="auth.html" style="display:block;padding:0.6rem;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600">Sign In / Sign Up</a></div>';

      // Show preview banner when signed out
      injectPreviewBanner();
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Show sync status
  function showSyncStatus(msg) {
    var badge = document.getElementById('syncBadge');
    if (!badge) return;
    badge.textContent = msg;
    badge.style.display = 'block';
    setTimeout(function() { badge.style.display = 'none'; }, 3000);
  }

  // Override localStorage for au_owned to also sync to Firestore
  var _originalSetItem = localStorage.setItem.bind(localStorage);
  var _syncTimeout = null;

  function patchLocalStorage() {
    var originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      originalSetItem.call(this, key, value);
      if (key === 'au_owned' && auth.currentUser) {
        // Debounce sync to avoid hammering Firestore
        clearTimeout(_syncTimeout);
        _syncTimeout = setTimeout(function() {
          try {
            var owned = JSON.parse(value);
            syncOwnedToCloud(owned).then(function() {
              showSyncStatus('Synced');
            });
          } catch(e) {}
        }, 1500);
      }
    };
  }

  // Load cloud data and merge with local on sign in
  async function handleSignIn(user) {
    showSyncStatus('Syncing...');
    try {
      var cloudOwned = await loadOwnedFromCloud();
      var localRaw = localStorage.getItem('au_owned');
      var localOwned = localRaw ? JSON.parse(localRaw) : {};

      if (cloudOwned) {
        // Merge local + cloud (union)
        var merged = mergeOwned(localOwned, cloudOwned);
        localStorage.setItem('au_owned', JSON.stringify(merged));
        // Push merged back to cloud
        await syncOwnedToCloud(merged);
        showSyncStatus('Synced');
      } else {
        // No cloud data — push local to cloud
        if (Object.keys(localOwned).length > 0) {
          await syncOwnedToCloud(localOwned);
        }
        showSyncStatus('Synced');
      }

      // Update login timestamp
      await db.collection('users').doc(user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Reload the page to reflect synced data
      // Only reload if there were changes
      if (cloudOwned && JSON.stringify(localOwned) !== JSON.stringify(mergeOwned(localOwned, cloudOwned))) {
        location.reload();
      }
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
      var cloudOwned = await loadOwnedFromCloud();
      var merged = mergeOwned(localOwned, cloudOwned);
      localStorage.setItem('au_owned', JSON.stringify(merged));
      await syncOwnedToCloud(merged);
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
    injectAuthUI();
    patchLocalStorage();
    installPreviewGuard();

    auth.onAuthStateChanged(function(user) {
      updateAuthUI(user);
      if (user) {
        handleSignIn(user);
      }
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
