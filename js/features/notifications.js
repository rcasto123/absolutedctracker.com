
(function() {
  var SERIES_COLORS_REF = typeof SERIES_COLORS !== 'undefined' ? SERIES_COLORS : {};

  // --- iCal Export ---
  function generateICS() {
    var issues = [];
    if (typeof ALL_ISSUES !== 'undefined') {
      issues = ALL_ISSUES.filter(function(i) {
        return parseLocalDate(i.date) > getToday();
      });
    }
    if (issues.length === 0) {
      showCalToast('No upcoming releases to export.');
      return;
    }
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AbsoluteDCTracker//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:DC Absolute Universe Releases'];
    function icsEscape(str) {
      return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }
    function nextDay(dateStr) {
      var d = new Date(dateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0,10).replace(/-/g, '');
    }
    issues.forEach(function(i) {
      var d = i.date.replace(/-/g, '');
      var uid = d + '-' + i.title.replace(/[^a-zA-Z0-9]/g, '') + '@absolutedctracker.com';
      lines.push('BEGIN:VEVENT');
      lines.push('DTSTART;VALUE=DATE:' + d);
      lines.push('DTEND;VALUE=DATE:' + nextDay(i.date));
      lines.push('SUMMARY:' + icsEscape(i.title + ' releases'));
      lines.push('DESCRIPTION:' + icsEscape(i.series + ' ' + i.issue + ' by ' + i.writer + ' / ' + i.artist));
      lines.push('URL:https://www.absolutedctracker.com');
      lines.push('UID:' + uid);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'absolute-universe-releases.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Browser Notifications ---
  function getNotifyPrefs() {
    try { return JSON.parse(localStorage.getItem('au_notify_prefs') || '{}'); } catch(e) { return {}; }
  }
  function saveNotifyPrefs(prefs) {
    try { localStorage.setItem('au_notify_prefs', JSON.stringify(prefs)); } catch(e) { /* private browsing */ }
  }

  function showNotifyModal() {
    var existing = document.getElementById('notifyModalOverlay');
    if (existing) existing.remove();

    var seriesNames = [];
    if (typeof ALL_ISSUES !== 'undefined') {
      var seen = {};
      ALL_ISSUES.forEach(function(i) { if (!seen[i.series]) { seen[i.series] = true; seriesNames.push(i.series); } });
    }
    var prefs = getNotifyPrefs();
    var enabled = prefs.enabled || false;
    var subscribedSeries = prefs.series || {};

    var overlay = document.createElement('div');
    overlay.className = 'notify-modal-overlay';
    overlay.id = 'notifyModalOverlay';

    var modal = document.createElement('div');
    modal.className = 'notify-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Release notifications settings');

    var html = '<h3>Release Notifications</h3>';
    html += '<p>Get notified on release day for the series you follow. Notifications appear in your browser.</p>';
    html += '<div class="notify-series-list">';
    seriesNames.forEach(function(s, idx) {
      var color = SERIES_COLORS_REF[s] || '#555';
      var checked = subscribedSeries[s] !== false;
      html += '<div class="notify-series-item">';
      html += '<input type="checkbox" id="notifySeries' + idx + '" value="' + s + '"' + (checked ? ' checked' : '') + '>';
      html += '<span class="notify-series-dot" style="background:' + color + '"></span>';
      html += '<label for="notifySeries' + idx + '">' + s + '</label>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="notify-modal-actions">';
    html += '<button class="notify-cancel" id="notifyCancel">Cancel</button>';
    html += '<button class="notify-save" id="notifySave">Save Preferences</button>';
    html += '</div>';

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(function() { overlay.classList.add('open'); });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeNotifyModal();
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { closeNotifyModal(); document.removeEventListener('keydown', handler); }
      if (e.key === 'Tab') {
        var focusable = modal.querySelectorAll('input, button, [tabindex]');
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    document.getElementById('notifyCancel').addEventListener('click', closeNotifyModal);
    document.getElementById('notifySave').addEventListener('click', function() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(function(perm) {
          if (perm === 'granted') saveAndClose();
          else { showCalToast('Notifications blocked by browser.'); closeNotifyModal(); }
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        saveAndClose();
      } else {
        showCalToast('Notifications not supported or blocked.');
        closeNotifyModal();
      }
    });

    function saveAndClose() {
      var checkboxes = modal.querySelectorAll('input[type="checkbox"]');
      var newPrefs = { enabled: true, series: {} };
      checkboxes.forEach(function(cb) { newPrefs.series[cb.value] = cb.checked; });
      saveNotifyPrefs(newPrefs);
      updateNotifyBtn();
      showCalToast('Notification preferences saved!');
      closeNotifyModal();
    }

    modal.querySelector('input[type="checkbox"]').focus();
  }

  function closeNotifyModal() {
    var overlay = document.getElementById('notifyModalOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 200);
    }
  }

  function updateNotifyBtn() {
    var btn = document.getElementById('calNotifyBtn');
    if (!btn) return;
    var prefs = getNotifyPrefs();
    if (prefs.enabled) {
      btn.classList.add('subscribed');
      btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="18" cy="3" r="3" fill="currentColor"/></svg>Subscribed';
    } else {
      btn.classList.remove('subscribed');
      btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Notify Me';
    }
  }

  // --- Check for today's releases and notify ---
  function checkTodayReleases() {
    var prefs = getNotifyPrefs();
    if (!prefs.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    var now = new Date();
    var today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    var lastNotified = localStorage.getItem('au_last_notify_date');
    if (lastNotified === today) return;

    if (typeof ALL_ISSUES !== 'undefined') {
      var todayIssues = ALL_ISSUES.filter(function(i) {
        return i.date === today && prefs.series[i.series] !== false;
      });
      if (todayIssues.length > 0) {
        var titles = todayIssues.map(function(i) { return i.title; }).join(', ');
        new Notification('DC Absolute Universe - New Release!', {
          body: todayIssues.length === 1 ? titles + ' is out today!' : todayIssues.length + ' new issues today: ' + titles,
          icon: 'https://www.absolutedctracker.com/favicon.ico',
          tag: 'au-release-' + today
        });
        try { localStorage.setItem('au_last_notify_date', today); } catch(e) {}
      }
    }
  }

  function showCalToast(msg) {
    var existing = document.getElementById('shareToast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.id = 'shareToast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('visible'); });
    setTimeout(function() { toast.classList.remove('visible'); setTimeout(function() { toast.remove(); }, 300); }, 2000);
  }

  // --- Inject buttons into calendar tab ---
  function injectCalActions() {
    var calFilterBar = document.querySelector('#tab-calendar .filter-bar');
    if (!calFilterBar || document.getElementById('calActions')) return;

    var actions = document.createElement('div');
    actions.className = 'cal-actions';
    actions.id = 'calActions';
    actions.innerHTML =
      '<button class="cal-action-btn" id="calIcalBtn" title="Download upcoming releases as an iCal file"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Add to Calendar</button>' +
      '<button class="cal-action-btn" id="calNotifyBtn" title="Get browser notifications on release day"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Notify Me</button>';

    calFilterBar.appendChild(actions);

    document.getElementById('calIcalBtn').addEventListener('click', generateICS);
    document.getElementById('calNotifyBtn').addEventListener('click', showNotifyModal);
    updateNotifyBtn();
  }

  injectCalActions();
  // Re-inject if removed (e.g. by tab re-render) — use MutationObserver instead of setInterval
  var _calObserver = new MutationObserver(function() { if (!document.getElementById('calActions')) injectCalActions(); });
  var _calTab = document.getElementById('tab-calendar');
  if (_calTab) _calObserver.observe(_calTab, { childList: true, subtree: true });
  setTimeout(checkTodayReleases, 3000);
})();
