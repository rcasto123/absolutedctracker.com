// ============================================================
// Theme Switcher for Absolute Universe Collection Tracker
// ============================================================
// Adds a palette icon that lets users choose between color themes
// inspired by the DC heroes featured in the Absolute Universe.
// Selection is saved to localStorage and applied on every page load.
// ============================================================

(function () {
  var STORAGE_KEY = 'au_theme';

  // ── Theme definitions ──
  // Each theme is inspired by a hero's iconic color palette.
  // vars: CSS custom property overrides
  // bodyBg: background shorthand (solid or gradient)
  // accent: highlight color used for the swatch dot border when active

  var themes = {
    default: {
      name: 'Original Dark',
      group: 'general',
      swatch: '#0a0c10',
      accent: '#3b82f6',
      vars: {
        '--bg-primary': '#0a0c10',
        '--bg-secondary': '#12151c',
        '--bg-card': '#181c26',
        '--bg-card-hover': '#1e2330',
        '--border': '#2a2f3e'
      },
      bodyBg: '#0a0c10'
    },

    // ── Hero themes ──

    batman: {
      name: 'Batman',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      accent: '#f5c518',
      vars: {
        '--bg-primary': '#0d0d1a',
        '--bg-secondary': '#141428',
        '--bg-card': '#1a1a30',
        '--bg-card-hover': '#22223d',
        '--border': '#2d2d4a'
      },
      bodyBg: 'radial-gradient(ellipse at 50% -10%, rgba(245,197,24,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(30,30,60,0.8) 0%, transparent 60%), linear-gradient(180deg, #0d0d1a 0%, #080812 100%)'
    },

    superman: {
      name: 'Superman',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #1a1040 0%, #0f1a3d 100%)',
      accent: '#dc2626',
      vars: {
        '--bg-primary': '#0c0e24',
        '--bg-secondary': '#141838',
        '--bg-card': '#181e42',
        '--bg-card-hover': '#1e2550',
        '--border': '#2a3568'
      },
      bodyBg: 'radial-gradient(ellipse at 30% 0%, rgba(220,38,38,0.08) 0%, transparent 40%), radial-gradient(ellipse at 70% 10%, rgba(37,99,235,0.12) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(220,38,38,0.04) 0%, transparent 40%), linear-gradient(180deg, #0c0e24 0%, #080a1a 100%)'
    },

    wonderwoman: {
      name: 'Wonder Woman',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #2a1228 0%, #1a0e20 100%)',
      accent: '#d4a844',
      vars: {
        '--bg-primary': '#120a18',
        '--bg-secondary': '#1e1228',
        '--bg-card': '#241630',
        '--bg-card-hover': '#2e1c3c',
        '--border': '#3e2850'
      },
      bodyBg: 'radial-gradient(ellipse at 20% 5%, rgba(212,168,68,0.08) 0%, transparent 45%), radial-gradient(ellipse at 80% 15%, rgba(180,40,60,0.07) 0%, transparent 40%), radial-gradient(ellipse at 50% 70%, rgba(59,130,246,0.04) 0%, transparent 50%), linear-gradient(175deg, #160c1e 0%, #0e0814 50%, #0a0610 100%)'
    },

    flash: {
      name: 'Flash',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #2a1008 0%, #1e0c06 100%)',
      accent: '#ef4444',
      vars: {
        '--bg-primary': '#140a06',
        '--bg-secondary': '#201008',
        '--bg-card': '#28150c',
        '--bg-card-hover': '#321a10',
        '--border': '#4a2818'
      },
      bodyBg: 'radial-gradient(ellipse at 40% 0%, rgba(239,68,68,0.1) 0%, transparent 45%), radial-gradient(ellipse at 70% 30%, rgba(245,158,11,0.06) 0%, transparent 40%), radial-gradient(ellipse at 20% 80%, rgba(220,38,38,0.04) 0%, transparent 45%), linear-gradient(180deg, #140a06 0%, #0e0604 100%)'
    },

    greenlantern: {
      name: 'Green Lantern',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #0a1a0e 0%, #0e2414 100%)',
      accent: '#22c55e',
      vars: {
        '--bg-primary': '#080f0a',
        '--bg-secondary': '#0e1a12',
        '--bg-card': '#122218',
        '--bg-card-hover': '#182a1e',
        '--border': '#244032'
      },
      bodyBg: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.1) 0%, transparent 50%), radial-gradient(ellipse at 20% 60%, rgba(34,197,94,0.04) 0%, transparent 40%), radial-gradient(ellipse at 80% 40%, rgba(16,185,129,0.03) 0%, transparent 40%), linear-gradient(180deg, #080f0a 0%, #060a08 100%)'
    },

    martianmanhunter: {
      name: 'Martian Manhunter',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #0a1820 0%, #0e2028 100%)',
      accent: '#06b6d4',
      vars: {
        '--bg-primary': '#060e14',
        '--bg-secondary': '#0c1820',
        '--bg-card': '#10202c',
        '--bg-card-hover': '#162836',
        '--border': '#1e3a4a'
      },
      bodyBg: 'radial-gradient(ellipse at 50% 5%, rgba(6,182,212,0.1) 0%, transparent 50%), radial-gradient(ellipse at 15% 50%, rgba(220,38,38,0.05) 0%, transparent 35%), radial-gradient(ellipse at 85% 60%, rgba(34,197,94,0.04) 0%, transparent 40%), linear-gradient(180deg, #060e14 0%, #040a0e 100%)'
    },

    greenarrow: {
      name: 'Green Arrow',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #101a0e 0%, #0a1408 100%)',
      accent: '#65a30d',
      vars: {
        '--bg-primary': '#0a100a',
        '--bg-secondary': '#121c12',
        '--bg-card': '#182418',
        '--bg-card-hover': '#1e2e1e',
        '--border': '#2c4228'
      },
      bodyBg: 'radial-gradient(ellipse at 30% 0%, rgba(101,163,13,0.08) 0%, transparent 45%), radial-gradient(ellipse at 75% 30%, rgba(64,120,20,0.06) 0%, transparent 40%), linear-gradient(180deg, #0a100a 0%, #080c08 100%)'
    },

    catwoman: {
      name: 'Catwoman',
      group: 'heroes',
      swatch: 'linear-gradient(135deg, #1a141e 0%, #140e18 100%)',
      accent: '#a855f7',
      vars: {
        '--bg-primary': '#0e0a12',
        '--bg-secondary': '#18121e',
        '--bg-card': '#1e1828',
        '--bg-card-hover': '#262032',
        '--border': '#382e48'
      },
      bodyBg: 'radial-gradient(ellipse at 60% 0%, rgba(168,85,247,0.08) 0%, transparent 45%), radial-gradient(ellipse at 20% 40%, rgba(139,92,246,0.04) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(192,132,252,0.03) 0%, transparent 40%), linear-gradient(180deg, #0e0a12 0%, #0a080e 100%)'
    }
  };

  // Theme display order
  var themeOrder = ['default', 'batman', 'superman', 'wonderwoman', 'flash', 'greenlantern', 'martianmanhunter', 'greenarrow', 'catwoman'];

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
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { console.warn('[theme] Could not save theme preference:', e.message); }

    // Update active swatch in picker
    var swatches = document.querySelectorAll('.ts-swatch');
    for (var i = 0; i < swatches.length; i++) {
      var isActive = swatches[i].dataset.theme === id;
      swatches[i].classList.toggle('ts-active', isActive);
      swatches[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
      var dot = swatches[i].querySelector('.ts-dot');
      var check = swatches[i].querySelector('.ts-check');
      if (dot) dot.style.borderColor = isActive ? (themes[swatches[i].dataset.theme].accent || '#3b82f6') : 'rgba(255,255,255,0.15)';
      if (check) {
        check.style.display = isActive ? 'inline' : 'none';
        check.style.color = t.accent || '#3b82f6';
      }
    }
  }

  // ── Build the picker UI ──
  function createPicker() {
    // Container — fixed bottom-left
    var wrap = document.createElement('div');
    wrap.id = 'themeSwitcher';
    wrap.style.cssText = 'position:fixed;top:1rem;right:4rem;z-index:998;display:flex;align-items:center;gap:8px;';

    // Toggle button (palette icon)
    var btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.setAttribute('aria-label', 'Change color theme');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'themePanel');
    btn.style.cssText = 'width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.08);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;color:#aaa;';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10c0 .9-.1 1.8-.4 2.6-.5 1.5-1.8 2.4-3.3 2.4h-2c-1.1 0-2 .9-2 2 0 .5.2 1 .5 1.3.3.4.5.8.5 1.3 0 1.1-.9 2.4-3.3 2.4z"/></svg>';
    btn.onmouseenter = function () { btn.style.background = 'rgba(255,255,255,0.14)'; btn.style.color = '#fff'; };
    btn.onmouseleave = function () { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.color = '#aaa'; };

    // Dropdown panel
    var panel = document.createElement('div');
    panel.id = 'themePanel';
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', 'Color themes');
    panel.setAttribute('tabindex', '-1');
    panel.style.cssText = 'position:absolute;top:calc(100% + 8px);right:0;background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;min-width:200px;max-height:70vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);opacity:0;visibility:hidden;transform:translateY(-8px);transition:opacity 0.2s ease,transform 0.2s ease,visibility 0.2s;pointer-events:none;';

    // Scrollbar styling
    var scrollStyle = document.createElement('style');
    scrollStyle.textContent = '#themePanel::-webkit-scrollbar{width:4px}#themePanel::-webkit-scrollbar-track{background:transparent}#themePanel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}';
    document.head.appendChild(scrollStyle);

    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { console.warn('[theme] Could not read theme preference:', e.message); }

    // Group: General
    var genLabel = document.createElement('div');
    genLabel.textContent = 'Theme';
    genLabel.setAttribute('role', 'presentation');
    genLabel.style.cssText = 'font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:6px;font-weight:600;';
    panel.appendChild(genLabel);

    // Add default theme
    addThemeRow(panel, 'default', saved);

    // Divider + Heroes label
    var divider = document.createElement('div');
    divider.setAttribute('role', 'presentation');
    divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.08);margin:8px 0;';
    panel.appendChild(divider);

    var heroLabel = document.createElement('div');
    heroLabel.textContent = 'Hero Themes';
    heroLabel.setAttribute('role', 'presentation');
    heroLabel.style.cssText = 'font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:6px;font-weight:600;';
    panel.appendChild(heroLabel);

    // Add hero themes
    for (var i = 1; i < themeOrder.length; i++) {
      addThemeRow(panel, themeOrder[i], saved);
    }

    wrap.appendChild(btn);
    wrap.appendChild(panel);

    // Toggle panel
    var panelOpen = false;
    function togglePanel(open) {
      panelOpen = typeof open === 'boolean' ? open : !panelOpen;
      btn.setAttribute('aria-expanded', String(panelOpen));
      if (panelOpen) {
        panel.style.opacity = '1';
        panel.style.visibility = 'visible';
        panel.style.transform = 'translateY(0)';
        panel.style.pointerEvents = 'auto';
        // Focus the active swatch so arrow keys work immediately
        var active = panel.querySelector('.ts-active');
        if (active) active.focus();
      } else {
        panel.style.opacity = '0';
        panel.style.visibility = 'hidden';
        panel.style.transform = 'translateY(-8px)';
        panel.style.pointerEvents = 'none';
      }
    }
    btn.onclick = function (e) {
      e.stopPropagation();
      togglePanel();
    };
    // Keyboard support on toggle button
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!panelOpen) togglePanel(true);
        var swatches = panel.querySelectorAll('.ts-swatch');
        if (swatches.length) swatches[e.key === 'ArrowDown' ? 0 : swatches.length - 1].focus();
      } else if (e.key === 'Escape' && panelOpen) {
        e.preventDefault();
        togglePanel(false);
        btn.focus();
      }
    });
    // Arrow key navigation within the panel
    panel.addEventListener('keydown', function (e) {
      var swatches = Array.prototype.slice.call(panel.querySelectorAll('.ts-swatch'));
      var idx = swatches.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = idx < swatches.length - 1 ? idx + 1 : 0;
        swatches[next].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = idx > 0 ? idx - 1 : swatches.length - 1;
        swatches[prev].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        swatches[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        swatches[swatches.length - 1].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        togglePanel(false);
        btn.focus();
      }
    });
    document.addEventListener('click', function () { togglePanel(false); });

    document.body.appendChild(wrap);
  }

  function addThemeRow(panel, id, saved) {
    var t = themes[id];
    var row = document.createElement('button');
    row.className = 'ts-swatch';
    row.dataset.theme = id;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-label', t.name + ' theme');
    row.setAttribute('aria-selected', id === (saved || 'default') ? 'true' : 'false');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;width:100%;padding:7px 8px;border:none;background:none;cursor:pointer;border-radius:8px;transition:background 0.15s;';
    row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.06)'; };
    row.onmouseleave = function () { row.style.background = 'none'; };

    // Color dot (gradient-capable)
    var dot = document.createElement('div');
    dot.className = 'ts-dot';
    dot.style.cssText = 'width:22px;height:22px;border-radius:50%;flex-shrink:0;border:2px solid rgba(255,255,255,0.15);transition:border-color 0.2s;';
    dot.style.background = t.swatch;

    // Label
    var label = document.createElement('span');
    label.textContent = t.name;
    label.style.cssText = 'font-size:0.82rem;color:#cbd5e1;white-space:nowrap;';

    // Check mark
    var check = document.createElement('span');
    check.className = 'ts-check';
    check.style.cssText = 'margin-left:auto;font-size:0.8rem;display:none;';
    check.style.color = t.accent || '#3b82f6';
    check.textContent = '\u2713';

    var isActive = id === (saved || 'default');
    if (isActive) {
      dot.style.borderColor = t.accent || '#3b82f6';
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
    };
  }

  // ── Init ──
  function init() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { console.warn('[theme] Could not read theme preference:', e.message); }

    if (saved) {
      if (themes[saved]) {
        applyTheme(saved);
      } else {
        // Stale theme ID — clean it up and fall back to default
        console.warn('[theme] Stored theme "' + saved + '" no longer exists, resetting to default');
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        applyTheme('default');
      }
    }
    createPicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
