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
    },

    // ── Light themes ──

    light: {
      name: 'Clean Light',
      group: 'light',
      light: true,
      swatch: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      accent: '#2563eb',
      vars: {
        '--bg-primary': '#f1f5f9',
        '--bg-secondary': '#ffffff',
        '--bg-card': '#ffffff',
        '--bg-card-hover': '#f8fafc',
        '--border': '#e2e8f0',
        '--text-primary': '#1e293b',
        '--text-secondary': '#475569',
        '--text-muted': '#94a3b8',
        '--owned-bg': 'rgba(34, 197, 94, 0.1)',
        '--owned-border': 'rgba(34, 197, 94, 0.35)'
      },
      bodyBg: 'linear-gradient(180deg, #f1f5f9 0%, #e8ecf1 100%)'
    },

    lightWarm: {
      name: 'Warm Light',
      group: 'light',
      light: true,
      swatch: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
      accent: '#d97706',
      vars: {
        '--bg-primary': '#fefdf6',
        '--bg-secondary': '#fffef5',
        '--bg-card': '#fffef5',
        '--bg-card-hover': '#fefce8',
        '--border': '#fde68a',
        '--text-primary': '#292524',
        '--text-secondary': '#57534e',
        '--text-muted': '#a8a29e',
        '--owned-bg': 'rgba(34, 197, 94, 0.1)',
        '--owned-border': 'rgba(34, 197, 94, 0.35)'
      },
      bodyBg: 'linear-gradient(180deg, #fefdf6 0%, #fef9e7 100%)'
    },

    lightHero: {
      name: 'DC Blue Light',
      group: 'light',
      light: true,
      swatch: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      accent: '#0476F2',
      vars: {
        '--bg-primary': '#f0f6ff',
        '--bg-secondary': '#ffffff',
        '--bg-card': '#ffffff',
        '--bg-card-hover': '#f0f6ff',
        '--border': '#bfdbfe',
        '--text-primary': '#1e3a5f',
        '--text-secondary': '#3b6b9a',
        '--text-muted': '#93b4d4',
        '--owned-bg': 'rgba(34, 197, 94, 0.1)',
        '--owned-border': 'rgba(34, 197, 94, 0.35)'
      },
      bodyBg: 'radial-gradient(ellipse at 50% 0%, rgba(4,118,242,0.06) 0%, transparent 50%), linear-gradient(180deg, #f0f6ff 0%, #e6effc 100%)'
    }
  };

  // ── Hero background cover art per theme (high-res #1 covers) ──
  var heroCoverArt = {
    default:          'https://static.dc.com/2024-09/DC_ALLIN_SP_Cv1_00111_C1.jpg',
    batman:           'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-batman-1-max-1-per-customer-193132.jpg?width=2000',
    superman:         'https://s3.amazonaws.com/comicgeeks/comics/covers/large-7938850.jpg',
    wonderwoman:      'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-wonder-woman-1-cover-c-jim-lee-card-stock-variant-one-copy-per-customer-365350.jpg?width=2000',
    flash:            'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-flash-1-cover-a-nick-robles-1-copy-per-customer-888803.jpg?width=2000',
    greenlantern:     'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-green-lantern-1-cover-a-jahnoy-lindsay-661858.jpg?width=2000',
    martianmanhunter: 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-martian-manhunter-1-of-6-cover-a-javier-rodriguez-one-copy-per-customer-436868.jpg?width=2000',
    greenarrow:       'https://static.dc.com/2026-02/Absolute%20Green%20Arrow%201%20Main%20Albuquerque%20Maiolo.jpg',
    catwoman:         'https://static.dc.com/2026-02/Absolute%20Catwoman%201%20Main%20Bengal_0.jpg'
  };

  // Overlay gradient colors per theme (top tint, bottom fade)
  var heroOverlays = {
    default:          { top: 'rgba(10,12,16,0.5)',   bot: 'rgba(10,12,16,1)' },
    batman:           { top: 'rgba(13,13,26,0.4)',   bot: 'rgba(13,13,26,1)' },
    superman:         { top: 'rgba(12,14,36,0.35)',  bot: 'rgba(12,14,36,1)' },
    wonderwoman:      { top: 'rgba(18,10,24,0.4)',   bot: 'rgba(18,10,24,1)' },
    flash:            { top: 'rgba(20,10,6,0.4)',    bot: 'rgba(20,10,6,1)' },
    greenlantern:     { top: 'rgba(8,15,10,0.4)',    bot: 'rgba(8,15,10,1)' },
    martianmanhunter: { top: 'rgba(6,14,20,0.4)',    bot: 'rgba(6,14,20,1)' },
    greenarrow:       { top: 'rgba(10,16,10,0.4)',   bot: 'rgba(10,16,10,1)' },
    catwoman:         { top: 'rgba(14,10,18,0.4)',   bot: 'rgba(14,10,18,1)' }
  };

  // CSS animation class per theme
  var heroAnimClass = {
    default: 'anim-default', batman: 'anim-batman', superman: 'anim-superman',
    wonderwoman: 'anim-wonderwoman', flash: 'anim-flash', greenlantern: 'anim-greenlantern',
    martianmanhunter: 'anim-martianmanhunter', greenarrow: 'anim-greenarrow', catwoman: 'anim-catwoman'
  };

  // Preload hero images
  Object.keys(heroCoverArt).forEach(function(k) { var img = new Image(); img.src = heroCoverArt[k]; });

  // Theme display order
  var themeOrder = ['default', 'batman', 'superman', 'wonderwoman', 'flash', 'greenlantern', 'martianmanhunter', 'greenarrow', 'catwoman', 'light', 'lightWarm', 'lightHero'];

  // Track current theme for light/dark toggle
  var currentThemeId = 'default';
  var LIGHT_KEY = 'au_last_light';
  var DARK_KEY = 'au_last_dark';

  // ── Swap the hero background image with crossfade ──
  function _swapHeroBackground(themeId, isLight) {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var videoEl = document.getElementById('heroVideo');
    var overlayEl = hero.querySelector('.hero-overlay');
    var animEl = hero.querySelector('.hero-anim');

    // Resolve which cover to use — light themes and default use the video
    var useVideo = (themeId === 'default' || isLight);
    var coverKey = themeId;
    if (isLight) coverKey = 'default';

    // Toggle video vs cover art
    if (videoEl) {
      if (useVideo) {
        videoEl.classList.remove('hidden');
      } else {
        videoEl.classList.add('hidden');
      }
    }

    var ov = heroOverlays[coverKey] || heroOverlays['default'];
    var animCls = heroAnimClass[coverKey] || 'anim-default';

    // Update overlay gradient
    if (overlayEl) {
      overlayEl.style.background = 'linear-gradient(180deg, ' + ov.top + ' 0%, ' + ov.top.replace(/[\d.]+\)$/, '0.6)') + ' 40%, ' + ov.bot.replace(/1\)$/, '0.95)') + ' 80%, ' + ov.bot + ' 100%)';
    }

    // Update animation layer
    if (animEl) {
      animEl.className = 'hero-anim ' + animCls;
    }

    // If using video, fade out any cover art bg
    if (useVideo) {
      var existingBg = hero.querySelector('.hero-bg');
      if (existingBg) {
        existingBg.classList.remove('entering');
        existingBg.classList.add('exiting');
      }
      return;
    }

    // Crossfade the background image for hero themes
    var imgUrl = heroCoverArt[coverKey] || heroCoverArt['default'];
    var oldBg = hero.querySelector('.hero-bg');
    if (!oldBg) return;

    var newBg = document.createElement('div');
    newBg.className = 'hero-bg exiting';
    newBg.style.backgroundImage = 'url(' + imgUrl + ')';
    hero.insertBefore(newBg, videoEl ? videoEl.nextSibling : hero.firstChild);

    // Force reflow so browser registers the hidden state
    newBg.getBoundingClientRect();

    // Trigger crossfade
    oldBg.classList.remove('entering');
    oldBg.classList.add('exiting');
    newBg.classList.remove('exiting');
    newBg.classList.add('entering');

    // Remove old layer after transition
    setTimeout(function() {
      if (oldBg.parentNode) oldBg.parentNode.removeChild(oldBg);
    }, 900);
  }

  // ── Apply a theme ──
  function applyTheme(id) {
    var t = themes[id];
    if (!t) t = themes['default'];
    currentThemeId = id;

    var root = document.documentElement;
    var isLight = !!t.light;

    // Reset text vars if switching mode (dark themes don't set text vars, so restore defaults)
    if (!isLight) {
      root.style.setProperty('--text-primary', '#e8eaf0');
      root.style.setProperty('--text-secondary', '#8b92a8');
      root.style.setProperty('--text-muted', '#6b7394');
      root.style.setProperty('--owned-bg', 'rgba(34, 197, 94, 0.08)');
      root.style.setProperty('--owned-border', 'rgba(34, 197, 94, 0.3)');
    }

    Object.keys(t.vars).forEach(function (k) {
      root.style.setProperty(k, t.vars[k]);
    });
    document.body.style.background = t.bodyBg;

    // Toggle light-mode class for CSS overrides
    document.documentElement.classList.toggle('light-mode', isLight);

    // Remember last light and dark theme separately for the quick toggle
    try {
      if (isLight) { localStorage.setItem(LIGHT_KEY, id); }
      else { localStorage.setItem(DARK_KEY, id); }
    } catch (e) {}

    // Persist
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { console.warn('[theme] Could not save theme preference:', e.message); }

    // Update the sun/moon toggle icon
    var toggleIcon = document.getElementById('lightDarkToggleIcon');
    if (toggleIcon) {
      toggleIcon.innerHTML = isLight
        ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
        : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }

    // Update active swatch in picker
    var swatches = document.querySelectorAll('.ts-swatch');
    var dotBorderInactive = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)';
    for (var i = 0; i < swatches.length; i++) {
      var isActive = swatches[i].dataset.theme === id;
      swatches[i].classList.toggle('ts-active', isActive);
      swatches[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
      var dot = swatches[i].querySelector('.ts-dot');
      var check = swatches[i].querySelector('.ts-check');
      if (dot) dot.style.borderColor = isActive ? (themes[swatches[i].dataset.theme].accent || '#3b82f6') : dotBorderInactive;
      if (check) {
        check.style.display = isActive ? 'inline' : 'none';
        check.style.color = t.accent || '#3b82f6';
      }
    }

    // ── Swap hero background cover art ──
    _swapHeroBackground(id, isLight);

    // Update theme panel styling for light/dark
    var panel = document.getElementById('themePanel');
    if (panel) {
      panel.style.background = isLight ? '#ffffff' : '#1a1d24';
      panel.style.borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
      panel.style.boxShadow = isLight ? '0 8px 32px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.5)';
    }
    // Update panel labels, section headers, and dividers for light/dark
    var labels = document.querySelectorAll('.ts-swatch span:not(.ts-check):not(.ts-dot)');
    labels.forEach(function(l) { l.style.color = isLight ? '#334155' : '#cbd5e1'; });
    var sectionLabels = panel ? panel.querySelectorAll('[role="presentation"]') : [];
    sectionLabels.forEach(function(el) {
      if (el.style.height === '1px') {
        // Divider
        el.style.background = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
      } else {
        // Section label
        el.style.color = isLight ? '#64748b' : '#64748b';
      }
    });
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
    panel.style.cssText = 'position:absolute;top:calc(100% + 8px);right:0;background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;min-width:200px;max-height:70vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);opacity:0;visibility:hidden;transition:opacity 0.2s ease,transform 0.2s ease,visibility 0.2s;pointer-events:none;';

    // Scrollbar styling + responsive positioning + transform via CSS classes
    var switcherStyle = document.createElement('style');
    switcherStyle.textContent = ''
      + '#themePanel::-webkit-scrollbar{width:4px}'
      + '#themePanel::-webkit-scrollbar-track{background:transparent}'
      + '#themePanel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}'
      // Desktop: slide down when closed, reset when open
      + '#themePanel{transform:translateY(-8px)}'
      + '#themePanel.ts-open{transform:translateY(0)}'
      // Mobile: move to bottom-left, panel opens upward
      + '@media(max-width:600px){'
      +   '#themeSwitcher{top:auto !important;right:auto !important;bottom:1rem !important;left:1rem !important;}'
      +   '#themePanel{top:auto !important;bottom:calc(100% + 8px) !important;right:auto !important;left:0 !important;'
      +     'transform:translateY(8px);max-height:50vh !important;}'
      +   '#themePanel.ts-open{transform:translateY(0);}'
      + '}'
      // Tablets / narrow desktops: keep top-right but ensure panel doesn't overflow
      + '@media(min-width:601px) and (max-width:900px){'
      +   '#themePanel{min-width:180px;}'
      + '}';
    document.head.appendChild(switcherStyle);

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

    // Add hero themes (dark only)
    var heroThemes = ['batman', 'superman', 'wonderwoman', 'flash', 'greenlantern', 'martianmanhunter', 'greenarrow', 'catwoman'];
    for (var i = 0; i < heroThemes.length; i++) {
      addThemeRow(panel, heroThemes[i], saved);
    }

    // Divider + Light label
    var divider2 = document.createElement('div');
    divider2.setAttribute('role', 'presentation');
    divider2.style.cssText = 'height:1px;background:rgba(255,255,255,0.08);margin:8px 0;';
    panel.appendChild(divider2);

    var lightLabel = document.createElement('div');
    lightLabel.textContent = 'Light Themes';
    lightLabel.setAttribute('role', 'presentation');
    lightLabel.style.cssText = 'font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:6px;font-weight:600;';
    panel.appendChild(lightLabel);

    var lightThemes = ['light', 'lightWarm', 'lightHero'];
    for (var j = 0; j < lightThemes.length; j++) {
      addThemeRow(panel, lightThemes[j], saved);
    }

    // ── Sun/Moon quick toggle button ──
    var ldBtn = document.createElement('button');
    ldBtn.id = 'lightDarkToggle';
    ldBtn.setAttribute('aria-label', 'Toggle light/dark mode');
    ldBtn.style.cssText = 'width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.08);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;color:#aaa;';
    var isCurrentLight = themes[saved || 'default'] && themes[saved || 'default'].light;
    ldBtn.innerHTML = '<svg id="lightDarkToggleIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      + (isCurrentLight
        ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
        : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>')
      + '</svg>';
    ldBtn.onmouseenter = function () { ldBtn.style.background = 'rgba(255,255,255,0.14)'; ldBtn.style.color = '#fff'; };
    ldBtn.onmouseleave = function () { ldBtn.style.background = 'rgba(255,255,255,0.08)'; ldBtn.style.color = '#aaa'; };
    ldBtn.onclick = function (e) {
      e.stopPropagation();
      var current = themes[currentThemeId];
      if (current && current.light) {
        // Switch to last dark theme
        var lastDark = 'default';
        try { lastDark = localStorage.getItem(DARK_KEY) || 'default'; } catch (e) {}
        applyTheme(lastDark);
      } else {
        // Switch to last light theme
        var lastLight = 'light';
        try { lastLight = localStorage.getItem(LIGHT_KEY) || 'light'; } catch (e) {}
        applyTheme(lastLight);
      }
    };

    wrap.appendChild(ldBtn);
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
        panel.style.pointerEvents = 'auto';
        panel.classList.add('ts-open');
        // Focus the active swatch so arrow keys work immediately
        var active = panel.querySelector('.ts-active');
        if (active) active.focus();
      } else {
        panel.style.opacity = '0';
        panel.style.visibility = 'hidden';
        panel.style.pointerEvents = 'none';
        panel.classList.remove('ts-open');
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
        // togglePanel focuses the active swatch; only override if
        // no active swatch was focused (e.g. none is selected)
        if (document.activeElement && !document.activeElement.classList.contains('ts-swatch')) {
          var swatches = panel.querySelectorAll('.ts-swatch');
          if (swatches.length) swatches[e.key === 'ArrowDown' ? 0 : swatches.length - 1].focus();
        }
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
    row.onmouseenter = function () { row.style.background = document.documentElement.classList.contains('light-mode') ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'; };
    row.onmouseleave = function () { row.style.background = 'none'; };

    // Color dot (gradient-capable)
    var dot = document.createElement('div');
    dot.className = 'ts-dot';
    var dotBorder = document.documentElement.classList.contains('light-mode') ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';
    dot.style.cssText = 'width:22px;height:22px;border-radius:50%;flex-shrink:0;border:2px solid ' + dotBorder + ';transition:border-color 0.2s;';
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

    // Set initial hero background before first applyTheme (which does a crossfade)
    _initHeroBackground(saved && themes[saved] ? saved : 'default');

    if (saved) {
      if (themes[saved]) {
        applyTheme(saved);
      } else {
        console.warn('[theme] Stored theme "' + saved + '" no longer exists, resetting to default');
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        applyTheme('default');
      }
    }
    createPicker();
  }

  // Set the hero background for initial page load (no crossfade needed)
  function _initHeroBackground(themeId) {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var isLight = themes[themeId] && themes[themeId].light;
    var useVideo = (themeId === 'default' || isLight);
    var coverKey = isLight ? 'default' : themeId;

    var videoEl = document.getElementById('heroVideo');
    var bg = hero.querySelector('.hero-bg');
    var ov = heroOverlays[coverKey] || heroOverlays['default'];
    var animCls = heroAnimClass[coverKey] || 'anim-default';

    // Show video for default/light, hide for hero themes
    if (videoEl) {
      if (useVideo) {
        videoEl.classList.remove('hidden');
      } else {
        videoEl.classList.add('hidden');
      }
    }

    // Set cover art for hero themes
    if (bg) {
      if (useVideo) {
        bg.classList.remove('entering');
        bg.classList.add('exiting');
      } else {
        var imgUrl = heroCoverArt[coverKey] || heroCoverArt['default'];
        bg.style.backgroundImage = 'url(' + imgUrl + ')';
      }
    }

    var overlayEl = hero.querySelector('.hero-overlay');
    if (overlayEl) {
      overlayEl.style.background = 'linear-gradient(180deg, ' + ov.top + ' 0%, ' + ov.top.replace(/[\d.]+\)$/, '0.6)') + ' 40%, ' + ov.bot.replace(/1\)$/, '0.95)') + ' 80%, ' + ov.bot + ' 100%)';
    }

    var animEl = hero.querySelector('.hero-anim');
    if (animEl) animEl.className = 'hero-anim ' + animCls;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
