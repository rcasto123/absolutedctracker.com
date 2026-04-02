
(function() {
  function getShareStats() {
    var ownedEl = document.getElementById('statOwned');
    var releasedEl = document.getElementById('statReleased');
    var pctEl = document.getElementById('statPercent');
    var seriesEl = document.getElementById('statSeries');
    return {
      owned: ownedEl ? ownedEl.textContent.trim() : '0',
      released: releasedEl ? releasedEl.textContent.trim() : '0',
      pct: pctEl ? pctEl.textContent.trim() : '0%',
      series: seriesEl ? seriesEl.textContent.trim() : '0'
    };
  }

  function buildShareText() {
    var s = getShareStats();
    return 'I own ' + s.owned + '/' + s.released + ' issues (' + s.pct + ') of the DC Absolute Universe across ' + s.series + ' series! Track your collection at absolutedctracker.com';
  }

  function _safeOpen(url, opts) {
    var win = window.open(url, '_blank', opts);
    if (!win) alert('Pop-up blocked — please allow pop-ups for this site to share.');
  }

  function shareToTwitter() {
    var text = buildShareText();
    var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
    _safeOpen(url, 'width=550,height=420');
    closeShareMenu();
  }

  function shareToBluesky() {
    var text = buildShareText();
    var url = 'https://bsky.app/intent/compose?text=' + encodeURIComponent(text);
    _safeOpen(url, 'width=550,height=420');
    closeShareMenu();
  }

  function shareToReddit() {
    var text = buildShareText();
    var url = 'https://www.reddit.com/submit?title=' + encodeURIComponent(text) + '&url=' + encodeURIComponent('https://www.absolutedctracker.com');
    _safeOpen(url, 'width=700,height=500');
    closeShareMenu();
  }

  function copyToClipboard() {
    var text = buildShareText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard!');
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied to clipboard!');
    }
    closeShareMenu();
  }

  function showToast(msg) {
    var existing = document.getElementById('shareToast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.id = 'shareToast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      toast.classList.add('visible');
    });
    setTimeout(function() {
      toast.classList.remove('visible');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  function escapeHtml(text) {
    var map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  function generateProfileCard() {
    var s = getShareStats();
    // Build per-series data
    var seriesData = {};
    if (typeof ALL_ISSUES !== 'undefined' && typeof owned !== 'undefined') {
      ALL_ISSUES.forEach(function(i) {
        if (parseLocalDate(i.date) > getToday()) return;
        if (!seriesData[i.series]) seriesData[i.series] = { total: 0, owned: 0 };
        seriesData[i.series].total++;
        var key = i.series + '|' + i.issue;
        if (owned[key]) seriesData[i.series].owned++;
      });
    }
    var colors = typeof SERIES_COLORS !== 'undefined' ? SERIES_COLORS : {};

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>My DC Absolute Universe Collection</title>';
    html += '<meta name="viewport" content="width=device-width,initial-scale=1">';
    html += '<style>@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap");';
    html += '*{margin:0;padding:0;box-sizing:border-box;}';
    html += 'body{font-family:"Inter",sans-serif;background:#0a0e17;color:#e0e0e0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;}';
    html += '.card{background:linear-gradient(135deg,#111827 0%,#1f2937 100%);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;max-width:500px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.5);}';
    html += '.title{font-family:"Oswald",sans-serif;font-size:1.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;}';
    html += '.subtitle{color:#9ca3af;font-size:0.85rem;margin-bottom:28px;}';
    html += '.stats{display:flex;gap:24px;justify-content:center;margin-bottom:28px;}';
    html += '.stat{text-align:center;}';
    html += '.stat-num{font-family:"Oswald",sans-serif;font-size:2rem;font-weight:700;}';
    html += '.stat-label{font-size:0.75rem;color:#9ca3af;margin-top:2px;}';
    html += '.green{color:#22c55e;}.red{color:#ef4444;}.blue{color:#3b82f6;}';
    html += '.series-list{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;}';
    html += '.series-row{display:flex;align-items:center;gap:8px;}';
    html += '.series-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}';
    html += '.series-name{flex:1;font-size:0.8rem;}';
    html += '.series-bar{width:120px;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;}';
    html += '.series-fill{height:100%;border-radius:4px;}';
    html += '.series-count{width:40px;text-align:right;font-size:0.75rem;color:#9ca3af;}';
    html += '.footer{text-align:center;color:#6b7280;font-size:0.75rem;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);}';
    html += '.footer a{color:#60a5fa;text-decoration:none;}';
    html += '.donut-wrap{display:flex;justify-content:center;margin-bottom:20px;}';
    html += '</style></head><body>';
    html += '<div class="card">';
    html += '<div class="title">My Absolute Universe Collection</div>';
    html += '<div class="subtitle">DC Absolute Universe Tracker &bull; ' + new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'}) + '</div>';

    // Donut
    var pctNum = parseInt(s.pct) || 0;
    var r = 55, sw = 10, circ = 2 * Math.PI * r;
    var offset = circ - (pctNum / 100) * circ;
    html += '<div class="donut-wrap"><svg width="140" height="140" viewBox="0 0 140 140">';
    html += '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="' + sw + '"/>';
    html += '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#22c55e" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 70 70)"/>';
    html += '<text x="70" y="66" text-anchor="middle" fill="#e0e0e0" font-family="Oswald" font-size="28" font-weight="700">' + pctNum + '%</text>';
    html += '<text x="70" y="84" text-anchor="middle" fill="#9ca3af" font-size="11">complete</text>';
    html += '</svg></div>';

    html += '<div class="stats">';
    var ownedNum = parseInt(s.owned) || 0;
    var releasedNum = parseInt(s.released) || 0;
    html += '<div class="stat"><div class="stat-num green">' + ownedNum + '</div><div class="stat-label">Owned</div></div>';
    html += '<div class="stat"><div class="stat-num red">' + (releasedNum - ownedNum) + '</div><div class="stat-label">Missing</div></div>';
    html += '<div class="stat"><div class="stat-num blue">' + (parseInt(s.series) || 0) + '</div><div class="stat-label">Series</div></div>';
    html += '</div>';

    html += '<div class="series-list">';
    Object.keys(seriesData).forEach(function(name) {
      var sd = seriesData[name];
      var p = sd.total > 0 ? Math.round((sd.owned / sd.total) * 100) : 0;
      var rawC = colors[name] || '#555';
      var c = /^#[0-9A-Fa-f]{3,6}$/.test(rawC) ? rawC : '#555';
      html += '<div class="series-row">';
      html += '<div class="series-dot" style="background:' + c + '"></div>';
      html += '<div class="series-name">' + escapeHtml(name) + '</div>';
      html += '<div class="series-bar"><div class="series-fill" style="width:' + p + '%;background:' + c + ';"></div></div>';
      html += '<div class="series-count">' + sd.owned + '/' + sd.total + '</div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="footer">Track your collection at <a href="https://www.absolutedctracker.com">absolutedctracker.com</a></div>';
    html += '</div></body></html>';

    var win = window.open('', '_blank');
    if (!win) { showToast('Popup blocked — please allow popups for this site'); return; }
    win.document.write(html);
    win.document.close();
    closeShareMenu();
  }

  function closeShareMenu() {
    var menu = document.getElementById('share-menu');
    if (menu) menu.classList.remove('open');
    var btn = document.getElementById('share-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function isPrivacyMode() {
    try { return localStorage.getItem('privacy_mode') === 'true'; } catch(e) { return false; }
  }

  function injectShareButton() {
    var filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;
    // If privacy mode is on, remove existing share dropdown and bail
    if (isPrivacyMode()) {
      var existing = document.getElementById('share-dropdown');
      if (existing) existing.remove();
      return;
    }
    if (document.getElementById('share-dropdown')) return;

    var dropdown = document.createElement('div');
    dropdown.className = 'share-dropdown';
    dropdown.id = 'share-dropdown';
    dropdown.innerHTML = '<button class="share-btn" id="share-toggle" aria-haspopup="menu" aria-expanded="false" aria-controls="share-menu"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share</button>' +
      '<div class="share-menu" id="share-menu" role="menu" aria-label="Share collection stats">' +
      '<button class="share-menu-item" id="share-twitter" role="menuitem" tabindex="-1"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span class="share-label">Share on X</span></button>' +
      '<button class="share-menu-item" id="share-bluesky" role="menuitem" tabindex="-1"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.178 3.226-4.57.702-6.324 3.02-3.517 6.127C6.72 23.295 10.16 21.2 12 17.77c1.84 3.43 5.28 5.525 8.715 1.83 2.807-3.107 1.053-5.425-3.517-6.127 2.578.25 5.393-.599 6.178-3.226C23.622 9.418 24 4.458 24 3.768c0-.69-.139-1.861-.902-2.206-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg><span class="share-label">Share on Bluesky</span></button>' +
      '<button class="share-menu-item" id="share-reddit" role="menuitem" tabindex="-1"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg><span class="share-label">Share on Reddit</span></button>' +
      '<div class="share-menu-divider"></div>' +
      '<button class="share-menu-item" id="share-copy" role="menuitem" tabindex="-1"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span class="share-label">Copy to Clipboard</span></button>' +
      '<div class="share-menu-divider"></div>' +
      '<button class="share-menu-item" id="share-profile" role="menuitem" tabindex="-1"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span class="share-label">Profile Card</span></button>' +
      '</div>';

    filterBar.appendChild(dropdown);

    var toggleBtn = document.getElementById('share-toggle');
    var menu = document.getElementById('share-menu');

    function getMenuItems() {
      return Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]'));
    }
    function openMenu() {
      menu.classList.add('open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      var items = getMenuItems();
      if (items.length) items[0].focus();
    }
    function closeMenu() {
      menu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (menu.classList.contains('open')) closeMenu();
      else openMenu();
    });
    toggleBtn.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
    });
    menu.addEventListener('keydown', function(e) {
      var items = getMenuItems();
      var idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault(); items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault(); items[items.length - 1].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault(); closeMenu(); toggleBtn.focus();
      } else if (e.key === 'Tab') {
        closeMenu();
      }
    });
    document.getElementById('share-twitter').addEventListener('click', shareToTwitter);
    document.getElementById('share-bluesky').addEventListener('click', shareToBluesky);
    document.getElementById('share-reddit').addEventListener('click', shareToReddit);
    document.getElementById('share-copy').addEventListener('click', copyToClipboard);
    document.getElementById('share-profile').addEventListener('click', generateProfileCard);
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#share-dropdown')) {
        closeMenu();
      }
    });
  }

  function injectPrivacyToggle() {
    var filterBar = document.querySelector('.filter-bar');
    if (!filterBar || document.getElementById('privacy-toggle-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'privacy-toggle-wrap';
    wrap.id = 'privacy-toggle-wrap';
    var privOn = isPrivacyMode();
    wrap.innerHTML = '<label for="privacyToggle"><span class="privacy-switch"><input type="checkbox" id="privacyToggle" role="switch" aria-checked="' + privOn + '" aria-label="Toggle privacy mode"' + (privOn ? ' checked' : '') + '><span class="slider"></span></span><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Privacy Mode</label>';
    filterBar.appendChild(wrap);
    document.getElementById('privacyToggle').addEventListener('change', function() {
      this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
      try { localStorage.setItem('privacy_mode', this.checked ? 'true' : 'false'); } catch(e) {
        console.warn('Privacy Mode: localStorage unavailable. Setting will not persist.');
      }
      injectShareButton();
    });
  }

  injectShareButton();
  injectPrivacyToggle();
  var _shareObserver = new MutationObserver(function() {
    injectShareButton();
    if (!document.getElementById('privacy-toggle-wrap')) injectPrivacyToggle();
  });
  var _analyticsTab = document.getElementById('tab-analytics');
  if (_analyticsTab) _shareObserver.observe(_analyticsTab, { childList: true, subtree: true });
})();
