// ============================================================
// Theme Switcher for Absolute Universe Collection Tracker
// ============================================================
// Adds a palette icon that lets users choose between color themes.
// Selection is saved to localStorage and applied on every page load.
// ============================================================

(function () {
  var STORAGE_KEY = 'au_theme';

  // ── Theme definitions ──
  // Each theme overrides CSS custom properties + adds body background
  var themes = {
    default: {
      name: 'Original Dark',
      swatch: '#0a0c10',
      vars: {
        '--bg-primary': '#0a0c10',
        '--bg-secondary': '#12151c',
        '--bg-card': '#181c26',
        '--bg-card-hover': '#1e2330',
        '--border': '#2a2f3e'
      },
      bodyBg: '#0a0c10'
    },
    navy: {
      name: 'Deep Navy',
      swatch: '#0f1628',
      vars: {
        '--bg-primary': '#0f1628',
        '--bg-secondary': '#162040',
        '--bg-card': '#1a2548',
        '--bg-card-hover': '#1f2d55',
        '--border': '#2e3f6e'
      },
      bodyBg: 'radial-gradient(ellipse at 20% 0%, #1a2a5e 0%, #0f1628 40%, #0a0e1a 100%)'
    },
    midnight: {
      name: 'Midnight Glow',
      swatch: '#111827',
      vars: {
        '--bg-primary': '#111827',
        '--bg-secondary': '#1e2a4a',
        '--bg-card': '#1c2744',
        '--bg-card-hover': '#243052',
        '--border': '#334872'
      },
      bodyBg: 'radial-gradient(ellipse at 15% 5%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 85% 20%, rgba(139,92,246,0.1) 0%, transparent 45%), radial-gradient(ellipse at 50% 80%, rgba(6,182,212,0.08) 0%, transparent 50%), linear-gradient(180deg, #111827 0%, #0c1220 100%)'
    },
    warmslate: {
      name: 'DC Warm',
      swatch: '#141821',
      vars: {
        '--bg-primary': '#141821',
        '--bg-secondary': '#1c2030',
        '--bg-card': '#1e2235',
        '--bg-card-hover': '#252a40',
        '--border': '#353b55'
      },
      bodyBg: 'radial-gradient(ellipse at 10% 0%, rgba(220,38,38,0.1) 0%, transparent 40%), radial-gradient(ellipse at 90% 10%, rgba(212,168,68,0.08) 0%, transparent 40%), radial-gradient(ellipse at 50% 60%, rgba(59,130,246,0.06) 0%, transparent 50%), linear-gradient(175deg, #1a1e2e 0%, #111420 40%, #0d1018 100%)'
    }
  };

  // ── Apply a theme ──
  function applyTheme(id) {
    var t = themes[id];
    if (!t) t = themes['default'];

    var root = document.documentElement;
    Object.keys(t.vars).forEach(function (k) {
      root.style.setProperty(k, t.vars[k]);
    });
    document.body.style.background = t.bodyBg;

    // Persist
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}

    // Update active swatch in picker
    var swatches = document.querySelectorAll('.ts-swatch');
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].classList.toggle('ts-active', swatches[i].dataset.theme === id);
    }
  }

  // ── Build the picker UI ──
  function createPicker() {
    // Container — fixed bottom-left
    var wrap = document.createElement('div');
    wrap.id = 'themeSwitcher';
    wrap.style.cssText = 'position:fixed;bottom:1rem;left:1rem;z-index:998;';

    // Toggle button (palette icon)
    var btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.setAttribute('aria-label', 'Change color theme');
    btn.style.cssText = 'width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.08);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;color:#aaa;';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10c0 .9-.1 1.8-.4 2.6-.5 1.5-1.8 2.4-3.3 2.4h-2c-1.1 0-2 .9-2 2 0 .5.2 1 .5 1.3.3.4.5.8.5 1.3 0 1.1-.9 2.4-3.3 2.4z"/></svg>';
    btn.onmouseenter = function () { btn.style.background = 'rgba(255,255,255,0.14)'; btn.style.color = '#fff'; };
    btn.onmouseleave = function () { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.color = '#aaa'; };

    // Dropdown panel
    var panel = document.createElement('div');
    panel.id = 'themePanel';
    panel.style.cssText = 'display:none;position:absolute;bottom:calc(100% + 8px);left:0;background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,0.5);';

    // Title
    var title = document.createElement('div');
    title.textContent = 'Theme';
    title.style.cssText = 'font-size:0.75rem;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:8px;font-weight:600;';
    panel.appendChild(title);

    // Theme options
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}

    Object.keys(themes).forEach(function (id) {
      var t = themes[id];
      var row = document.createElement('button');
      row.className = 'ts-swatch';
      row.dataset.theme = id;
      row.style.cssText = 'display:flex;align-items:center;gap:10px;width:100%;padding:8px;border:none;background:none;cursor:pointer;border-radius:8px;transition:background 0.15s;';
      row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.06)'; };
      row.onmouseleave = function () { row.style.background = 'none'; };

      // Color dot
      var dot = document.createElement('div');
      dot.style.cssText = 'width:24px;height:24px;border-radius:50%;flex-shrink:0;border:2px solid rgba(255,255,255,0.15);transition:border-color 0.2s;';
      dot.style.background = t.swatch;

      // Label
      var label = document.createElement('span');
      label.textContent = t.name;
      label.style.cssText = 'font-size:0.85rem;color:#cbd5e1;';

      // Check mark
      var check = document.createElement('span');
      check.style.cssText = 'margin-left:auto;font-size:0.8rem;color:#3b82f6;display:none;';
      check.textContent = '\u2713';

      if (id === (saved || 'default')) {
        dot.style.borderColor = '#3b82f6';
        check.style.display = 'inline';
        row.classList.add('ts-active');
      }

      row.appendChild(dot);
      row.appendChild(label);
      row.appendChild(check);
      panel.appendChild(row);

      row.onclick = function (e) {
        e.stopPropagation();
        applyTheme(id);
        // Update all dots/checks
        var allRows = panel.querySelectorAll('.ts-swatch');
        for (var j = 0; j < allRows.length; j++) {
          var d = allRows[j].querySelector('div');
          var c = allRows[j].querySelector('span:last-child');
          var isActive = allRows[j].dataset.theme === id;
          d.style.borderColor = isActive ? '#3b82f6' : 'rgba(255,255,255,0.15)';
          c.style.display = isActive ? 'inline' : 'none';
        }
      };
    });

    wrap.appendChild(panel);
    wrap.appendChild(btn);

    // Toggle panel
    btn.onclick = function (e) {
      e.stopPropagation();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
    document.addEventListener('click', function () { panel.style.display = 'none'; });

    document.body.appendChild(wrap);
  }

  // ── Init ──
  function init() {
    // Apply saved theme immediately (before full render if possible)
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && themes[saved]) {
      applyTheme(saved);
    }
    createPicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
