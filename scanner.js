// ============================================================
// Barcode Scanner Module for Absolute Universe Collection Tracker
// ============================================================
// Phase 3: Rapid batch mode, scan history, trade paperback ISBNs
// ============================================================

(function() {
  'use strict';

  // ── State ──
  var scanner = null;       // Html5Qrcode instance
  var isScanning = false;
  var overlay = null;       // DOM overlay element
  var lastScannedCode = ''; // Debounce duplicate scans
  var lastScanTime = 0;
  var batchMode = false;    // Rapid batch scanning
  var scanHistory = [];     // Session scan log

  // ── Barcode Index ──
  var barcodeIndex = {};

  function buildBarcodeIndex() {
    barcodeIndex = {};
    // Index individual issues
    if (typeof ALL_ISSUES !== 'undefined') {
      ALL_ISSUES.forEach(function(issue) {
        if (!issue.barcodes) return;
        var slug = issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        var key = issue.series + '|' + issue.issue;
        var entry = { slug: slug, title: issue.title, key: key, variant: null, type: 'issue' };
        if (issue.barcodes.upc) {
          barcodeIndex[issue.barcodes.upc] = entry;
          if (issue.barcodes.upc.length === 12) {
            barcodeIndex[issue.barcodes.upc.substring(0, 11)] = entry;
          }
        }
        if (issue.barcodes.isbn) {
          barcodeIndex[issue.barcodes.isbn] = entry;
        }
        if (issue.barcodes.variants) {
          Object.keys(issue.barcodes.variants).forEach(function(varId) {
            barcodeIndex[issue.barcodes.variants[varId]] = { slug: slug, title: issue.title, key: key, variant: varId, type: 'issue' };
          });
        }
      });
    }
    // Index trade paperbacks
    if (typeof TRADES !== 'undefined') {
      TRADES.forEach(function(trade) {
        if (!trade.isbn) return;
        var slug = trade.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        var key = trade.title; // trade key format
        var entry = { slug: slug, title: trade.title, key: key, variant: null, type: 'trade', subtitle: trade.subtitle || '' };
        barcodeIndex[trade.isbn] = entry;
        // Also index without hyphens/spaces
        var clean = trade.isbn.replace(/[-\s]/g, '');
        if (clean !== trade.isbn) barcodeIndex[clean] = entry;
        // Index ISBN-10 if 13-digit
        if (clean.length === 13 && clean.indexOf('978') === 0) {
          barcodeIndex[clean.substring(3, 12)] = entry;
        }
      });
    }
  }

  // ── Lookup ──
  function lookupBarcode(code) {
    code = code.trim().replace(/[-\s]/g, '');
    if (barcodeIndex[code]) return barcodeIndex[code];
    var stripped = code.replace(/^0+/, '');
    if (barcodeIndex[stripped]) return barcodeIndex[stripped];
    // Prefix match: first 15 of 17 digits (variant-agnostic UPC match)
    if (code.length >= 15) {
      var prefix15 = code.substring(0, 15);
      var keys = Object.keys(barcodeIndex);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].length >= 15 && keys[i].substring(0, 15) === prefix15) return barcodeIndex[keys[i]];
      }
    }
    if (code.length >= 11) {
      var prefix = code.substring(0, 11);
      if (barcodeIndex[prefix]) return barcodeIndex[prefix];
    }
    return null;
  }

  // ── Owned State Helpers ──
  function getOwnedState() {
    try { return JSON.parse(localStorage.getItem('au_owned') || '{}'); } catch(e) { return {}; }
  }
  function getOwnedTrades() {
    try { return JSON.parse(localStorage.getItem('au_trades') || '{}'); } catch(e) { return {}; }
  }

  function setOwnedState(key, val, type) {
    var storageKey = (type === 'trade') ? 'au_trades' : 'au_owned';
    var state;
    try { state = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch(e) { state = {}; }
    if (val) { state[key] = true; } else { delete state[key]; }
    localStorage.setItem(storageKey, JSON.stringify(state));
    // Sync
    if (type !== 'trade' && typeof syncOwnedToCloud === 'function') {
      try { syncOwnedToCloud(); } catch(e) {}
    }
    if (type !== 'trade' && typeof owned !== 'undefined' && typeof saveOwned === 'function') {
      if (val) { owned[key] = true; } else { delete owned[key]; }
      saveOwned();
    }
    if (type === 'trade' && typeof ownedTrades !== 'undefined' && typeof saveTrades === 'function') {
      if (val) { ownedTrades[key] = true; } else { delete ownedTrades[key]; }
      saveTrades();
    }
  }

  function isOwned(key, type) {
    var state = (type === 'trade') ? getOwnedTrades() : getOwnedState();
    return !!state[key];
  }

  // ── Create Scanner Button ──
  function createScannerButton() {
    var btn = document.createElement('button');
    btn.id = 'scannerBtn';
    btn.setAttribute('aria-label', 'Scan barcode');
    btn.setAttribute('title', 'Scan Barcode');
    btn.style.cssText = 'position:fixed;top:1rem;right:10rem;z-index:998;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.08);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;color:#aaa;';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="8" x2="13" y2="8"/><line x1="7" y1="16" x2="11" y2="16"/></svg>';
    btn.onmouseenter = function() { btn.style.background = 'rgba(255,255,255,0.14)'; btn.style.color = '#fff'; };
    btn.onmouseleave = function() { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.color = '#aaa'; };
    btn.onclick = openScanner;
    document.body.appendChild(btn);
    var style = document.createElement('style');
    style.textContent = '@media(max-width:600px){#scannerBtn{top:auto!important;right:auto!important;bottom:1rem!important;left:4rem!important;}}';
    document.head.appendChild(style);
  }

  // ── Scanner Overlay ──
  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'scannerOverlay';
    overlay.innerHTML = ''
      + '<div class="scanner-header">'
      +   '<button class="scanner-close-btn" id="scannerCloseBtn" aria-label="Close scanner">'
      +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      +   '</button>'
      +   '<span class="scanner-title">Scan Barcode</span>'
      +   '<button class="scanner-batch-btn" id="scannerBatchBtn" aria-label="Toggle batch mode" title="Batch mode: auto-add on scan">'
      +     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
      +   '</button>'
      +   '<button class="scanner-torch-btn" id="scannerTorchBtn" aria-label="Toggle flashlight" title="Toggle flashlight" style="display:none;">'
      +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
      +   '</button>'
      + '</div>'
      + '<div class="scanner-body">'
      +   '<div id="scannerReader"></div>'
      +   '<div class="scanner-hint" id="scannerHint">Point your camera at a barcode</div>'
      +   '<div class="scanner-toast" id="scannerToast"></div>'
      + '</div>'
      + '<div class="scanner-history" id="scannerHistory" style="display:none;">'
      +   '<div class="scanner-history-header">'
      +     '<span id="scannerHistoryTitle">Scan History</span>'
      +     '<button class="scanner-history-clear" id="scannerHistoryClear">Clear</button>'
      +   '</div>'
      +   '<div class="scanner-history-list" id="scannerHistoryList"></div>'
      + '</div>'
      + '<div class="scanner-footer">'
      +   '<div class="scanner-manual">'
      +     '<input type="text" id="manualBarcodeInput" class="scanner-manual-input" placeholder="Or enter UPC / ISBN manually..." maxlength="20">'
      +     '<button class="scanner-manual-btn" id="manualLookupBtn">Look Up</button>'
      +   '</div>'
      + '</div>'
      + '<div class="scanner-result" id="scannerResult" style="display:none;">'
      +   '<div class="scanner-result-inner">'
      +     '<div class="scanner-result-title" id="scannerResultTitle"></div>'
      +     '<div class="scanner-result-code" id="scannerResultCode"></div>'
      +     '<div class="scanner-result-actions">'
      +       '<a class="scanner-result-btn primary" id="scannerViewBtn">View Issue</a>'
      +       '<button class="scanner-result-btn secondary" id="scannerRescanBtn">Scan Another</button>'
      +     '</div>'
      +     '<button class="scanner-result-btn owned-btn" id="scannerOwnedBtn" style="display:none;margin-top:8px;width:100%;">Mark as Owned</button>'
      +   '</div>'
      + '</div>';

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('scannerCloseBtn').addEventListener('click', closeScanner);
    document.getElementById('scannerBatchBtn').addEventListener('click', toggleBatchMode);
    document.getElementById('scannerHistoryClear').addEventListener('click', clearHistory);
    document.getElementById('scannerRescanBtn').addEventListener('click', function() {
      document.getElementById('scannerResult').style.display = 'none';
      document.getElementById('scannerHint').textContent = batchMode ? 'Batch mode — scanning...' : 'Point your camera at a barcode';
      lastScannedCode = '';
      resumeScanning();
    });
    document.getElementById('manualLookupBtn').addEventListener('click', function() {
      var code = document.getElementById('manualBarcodeInput').value.trim();
      if (code) handleScanResult(code);
    });
    document.getElementById('manualBarcodeInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var code = this.value.trim();
        if (code) handleScanResult(code);
      }
    });
    overlay._escHandler = function(e) {
      if (e.key === 'Escape') closeScanner();
    };
  }

  // ── Batch Mode ──
  function toggleBatchMode() {
    batchMode = !batchMode;
    var btn = document.getElementById('scannerBatchBtn');
    btn.style.color = batchMode ? '#ffc107' : '#aaa';
    btn.style.background = batchMode ? 'rgba(255,193,7,0.15)' : 'rgba(255,255,255,0.06)';
    btn.style.borderColor = batchMode ? 'rgba(255,193,7,0.3)' : 'rgba(255,255,255,0.12)';
    btn.title = batchMode ? 'Batch mode ON: auto-adds to collection' : 'Batch mode: auto-add on scan';
    var hint = document.getElementById('scannerHint');
    if (batchMode) {
      hint.textContent = 'Batch mode — scanning...';
      // If result card is showing, hide it and resume
      document.getElementById('scannerResult').style.display = 'none';
      lastScannedCode = '';
      resumeScanning();
    } else {
      hint.textContent = 'Point your camera at a barcode';
    }
  }

  // ── Toast (for batch mode) ──
  var toastTimer = null;
  function showToast(html, duration) {
    var el = document.getElementById('scannerToast');
    el.innerHTML = html;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      el.classList.remove('show');
    }, duration || 2000);
  }

  // ── Scan History ──
  function addToHistory(code, result) {
    var entry = {
      code: code,
      title: result ? result.title : 'Unknown',
      type: result ? result.type : 'unknown',
      key: result ? result.key : null,
      slug: result ? result.slug : null,
      found: !!result,
      owned: result ? isOwned(result.key, result.type) : false,
      time: new Date()
    };
    scanHistory.unshift(entry);
    if (scanHistory.length > 50) scanHistory.pop();
    renderHistory();
  }

  function renderHistory() {
    var container = document.getElementById('scannerHistory');
    var list = document.getElementById('scannerHistoryList');
    var titleEl = document.getElementById('scannerHistoryTitle');
    if (scanHistory.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    titleEl.textContent = 'Scan History (' + scanHistory.length + ')';
    var html = '';
    scanHistory.forEach(function(e, i) {
      var icon = !e.found ? '<span class="sh-icon miss">?</span>'
        : e.owned ? '<span class="sh-icon owned">✓</span>'
        : '<span class="sh-icon new">+</span>';
      var timeStr = e.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var typeLabel = e.type === 'trade' ? ' <span class="sh-type">TPB</span>' : '';
      var link = e.slug ? ' href="issue.html?id=' + e.slug + '"' : '';
      html += '<div class="sh-entry" data-idx="' + i + '">'
        + icon
        + '<div class="sh-info">'
        + (e.found ? '<a class="sh-title"' + link + '>' + e.title + typeLabel + '</a>' : '<span class="sh-title">' + e.title + '</span>')
        + '<span class="sh-code">' + e.code + ' · ' + timeStr + '</span>'
        + '</div>'
        + '</div>';
    });
    list.innerHTML = html;
  }

  function clearHistory() {
    scanHistory = [];
    renderHistory();
  }

  // ── Open Scanner ──
  function openScanner() {
    createOverlay();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', overlay._escHandler);
    document.getElementById('scannerResult').style.display = 'none';
    document.getElementById('scannerHint').textContent = batchMode ? 'Batch mode — scanning...' : 'Point your camera at a barcode';
    document.getElementById('manualBarcodeInput').value = '';
    lastScannedCode = '';
    renderHistory();
    startCamera();
  }

  // ── Close Scanner ──
  function closeScanner() {
    stopCamera();
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', overlay._escHandler);
    }
  }

  // ── Camera ──
  function startCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      document.getElementById('scannerHint').textContent = 'Scanner library not loaded. Use manual entry below.';
      return;
    }
    scanner = new Html5Qrcode('scannerReader');
    isScanning = true;
    var config = {
      fps: 10,
      qrbox: function(viewfinderWidth, viewfinderHeight) {
        var minDim = Math.min(viewfinderWidth, viewfinderHeight);
        var size = Math.floor(minDim * 0.7);
        return { width: Math.max(size, 200), height: Math.max(Math.floor(size * 0.6), 120) };
      },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39
      ]
    };
    scanner.start(
      { facingMode: 'environment' },
      config,
      function onScanSuccess(decodedText) {
        var now = Date.now();
        if (decodedText === lastScannedCode && (now - lastScanTime) < 3000) return;
        lastScannedCode = decodedText;
        lastScanTime = now;
        if (navigator.vibrate) navigator.vibrate(100);
        handleScanResult(decodedText);
      },
      function onScanFailure() {}
    ).then(function() {
      document.getElementById('scannerHint').textContent = batchMode ? 'Batch mode — scanning...' : 'Point your camera at a barcode';
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        try {
          scanner.applyVideoConstraints({ advanced: [{}] }).then(function() {
            document.getElementById('scannerTorchBtn').style.display = 'flex';
            document.getElementById('scannerTorchBtn').onclick = toggleTorch;
          }).catch(function() {});
        } catch(e) {}
      }
    }).catch(function(err) {
      console.warn('Camera start failed:', err);
      var hint = document.getElementById('scannerHint');
      if (err && err.toString().indexOf('NotAllowedError') > -1) {
        hint.textContent = 'Camera access denied. Use manual entry below.';
      } else if (err && err.toString().indexOf('NotFoundError') > -1) {
        hint.textContent = 'No camera found. Use manual entry below.';
      } else {
        hint.textContent = 'Camera unavailable. Use manual entry below.';
      }
      isScanning = false;
    });
  }

  function stopCamera() {
    if (scanner && isScanning) {
      try {
        scanner.stop().then(function() {
          scanner.clear();
          isScanning = false;
        }).catch(function() { isScanning = false; });
      } catch(e) { isScanning = false; }
    }
  }

  function resumeScanning() {
    if (scanner && !isScanning) {
      startCamera();
    } else if (scanner && isScanning) {
      try { scanner.resume(); } catch(e) {}
    }
  }

  var torchOn = false;
  function toggleTorch() {
    if (!scanner) return;
    torchOn = !torchOn;
    try {
      var videoTrack = scanner.getRunningTrackCameraCapabilities && scanner.getRunningTrackCameraCapabilities();
      if (videoTrack && videoTrack.torchFeature && videoTrack.torchFeature().isSupported()) {
        videoTrack.torchFeature().apply(torchOn);
        document.getElementById('scannerTorchBtn').style.color = torchOn ? '#ffc107' : '#aaa';
      }
    } catch(e) {
      console.warn('Torch toggle failed', e);
    }
  }

  // ── Handle Scan Result ──
  function handleScanResult(code) {
    var result = lookupBarcode(code);

    // Add to history
    addToHistory(code, result);

    if (batchMode && result) {
      // Batch mode: auto-mark as owned, show toast, keep scanning
      if (!isOwned(result.key, result.type)) {
        setOwnedState(result.key, true, result.type);
        // Update history entry
        if (scanHistory.length > 0) scanHistory[0].owned = true;
        renderHistory();
      }
      var icon = '<span style="color:#22c55e;">✓</span>';
      showToast(icon + ' <strong>' + result.title + '</strong> added', 2000);
      // Don't pause camera — keep scanning
      return;
    }

    if (batchMode && !result) {
      // Batch mode, not found: brief toast
      showToast('<span style="color:#eab308;">?</span> Unknown barcode: ' + code, 2500);
      return;
    }

    // Normal mode: pause and show result card
    if (scanner && isScanning) {
      try { scanner.pause(true); } catch(e) {}
    }

    var resultEl = document.getElementById('scannerResult');
    var titleEl = document.getElementById('scannerResultTitle');
    var codeEl = document.getElementById('scannerResultCode');
    var viewBtn = document.getElementById('scannerViewBtn');
    var ownedBtn = document.getElementById('scannerOwnedBtn');

    if (result) {
      var ownedNow = isOwned(result.key, result.type);
      var typeLabel = result.type === 'trade' ? ' <span style="font-size:0.7rem;opacity:0.6;font-weight:400;">(TPB)</span>' : '';
      if (ownedNow) {
        titleEl.innerHTML = '<span style="color:var(--accent-green,#22c55e);">✓</span> ' + result.title + typeLabel;
      } else {
        titleEl.innerHTML = '<span style="color:var(--accent-blue,#3b82f6);">●</span> ' + result.title + typeLabel;
      }
      codeEl.textContent = 'Barcode: ' + code;
      if (result.type === 'trade') {
        viewBtn.style.display = 'none'; // no detail page for TPBs yet
      } else {
        var url = 'issue.html?id=' + result.slug;
        if (result.variant) url += '&variant=' + result.variant;
        viewBtn.href = url;
        viewBtn.style.display = '';
      }

      var updateOwnedBtn = function(isOwn) {
        if (isOwn) {
          ownedBtn.textContent = '✓ Owned — Remove?';
          ownedBtn.className = 'scanner-result-btn owned-btn owned';
          titleEl.innerHTML = '<span style="color:var(--accent-green,#22c55e);">✓</span> ' + result.title + typeLabel;
        } else {
          ownedBtn.textContent = result.type === 'trade' ? 'Mark Trade as Owned' : 'Mark as Owned';
          ownedBtn.className = 'scanner-result-btn owned-btn';
          titleEl.innerHTML = '<span style="color:var(--accent-blue,#3b82f6);">●</span> ' + result.title + typeLabel;
        }
      };
      updateOwnedBtn(ownedNow);
      ownedBtn.style.display = 'block';
      ownedBtn.onclick = function() {
        var toggled = !isOwned(result.key, result.type);
        setOwnedState(result.key, toggled, result.type);
        updateOwnedBtn(toggled);
        // Update history
        if (scanHistory.length > 0) { scanHistory[0].owned = toggled; renderHistory(); }
      };

      document.getElementById('scannerHint').textContent = 'Issue found!';
    } else {
      titleEl.innerHTML = '<span style="color:var(--accent-gold);">?</span> Issue not found';
      codeEl.textContent = 'Barcode: ' + code;
      viewBtn.style.display = 'none';
      ownedBtn.style.display = 'none';
      document.getElementById('scannerHint').textContent = 'Barcode not in database. Try another or search manually.';
    }

    resultEl.style.display = 'flex';
  }

  // ── Styles ──
  function injectStyles() {
    var css = document.createElement('style');
    css.textContent = ''
      + '#scannerOverlay {'
      +   'display:none;position:fixed;inset:0;z-index:10000;background:#0a0c10;'
      +   'flex-direction:column;'
      + '}'
      + '#scannerOverlay.open { display:flex; }'
      + '.scanner-header {'
      +   'display:flex;align-items:center;gap:12px;padding:12px 16px;'
      +   'background:rgba(0,0,0,0.4);border-bottom:1px solid rgba(255,255,255,0.08);'
      +   'flex-shrink:0;'
      + '}'
      + '.scanner-title {'
      +   'flex:1;font-family:"Oswald",sans-serif;font-size:1.1rem;font-weight:600;'
      +   'letter-spacing:0.05em;text-transform:uppercase;color:#fff;'
      + '}'
      + '.scanner-close-btn,.scanner-torch-btn,.scanner-batch-btn {'
      +   'width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);'
      +   'background:rgba(255,255,255,0.06);cursor:pointer;display:flex;align-items:center;'
      +   'justify-content:center;color:#aaa;transition:all 0.15s;flex-shrink:0;'
      + '}'
      + '.scanner-close-btn:hover,.scanner-torch-btn:hover,.scanner-batch-btn:hover { background:rgba(255,255,255,0.12);color:#fff; }'
      + '.scanner-body {'
      +   'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;'
      +   'position:relative;overflow:hidden;'
      + '}'
      + '#scannerReader { width:100%;max-width:500px; }'
      + '#scannerReader video { border-radius:8px; }'
      + '.scanner-hint {'
      +   'text-align:center;color:var(--text-muted,#8b95a5);font-size:0.85rem;'
      +   'padding:12px 16px;'
      + '}'
      // Toast
      + '.scanner-toast {'
      +   'position:absolute;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);'
      +   'background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:10px;'
      +   'padding:10px 18px;font-size:0.85rem;color:#fff;white-space:nowrap;'
      +   'opacity:0;transition:all 0.25s ease;pointer-events:none;'
      +   'box-shadow:0 4px 20px rgba(0,0,0,0.5);z-index:20;'
      + '}'
      + '.scanner-toast.show { opacity:1;transform:translateX(-50%) translateY(0); }'
      // History panel
      + '.scanner-history {'
      +   'max-height:180px;border-top:1px solid rgba(255,255,255,0.08);'
      +   'background:rgba(0,0,0,0.25);flex-shrink:0;overflow:hidden;display:flex;flex-direction:column;'
      + '}'
      + '.scanner-history-header {'
      +   'display:flex;align-items:center;justify-content:space-between;padding:8px 16px;'
      +   'font-size:0.75rem;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;'
      +   'letter-spacing:0.05em;'
      + '}'
      + '.scanner-history-clear {'
      +   'background:none;border:none;color:rgba(255,255,255,0.35);font-size:0.7rem;cursor:pointer;'
      +   'text-transform:uppercase;letter-spacing:0.05em;'
      + '}'
      + '.scanner-history-clear:hover { color:#fff; }'
      + '.scanner-history-list { overflow-y:auto;flex:1;padding:0 12px 8px; }'
      + '.sh-entry {'
      +   'display:flex;align-items:center;gap:8px;padding:5px 4px;'
      +   'border-bottom:1px solid rgba(255,255,255,0.04);'
      + '}'
      + '.sh-icon {'
      +   'width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
      +   'font-size:0.7rem;font-weight:700;flex-shrink:0;'
      + '}'
      + '.sh-icon.owned { background:rgba(34,197,94,0.15);color:#22c55e; }'
      + '.sh-icon.new { background:rgba(59,130,246,0.15);color:#3b82f6; }'
      + '.sh-icon.miss { background:rgba(234,179,8,0.15);color:#eab308; }'
      + '.sh-info { flex:1;min-width:0; }'
      + '.sh-title { display:block;font-size:0.8rem;color:#fff;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }'
      + 'a.sh-title:hover { text-decoration:underline; }'
      + '.sh-type { font-size:0.6rem;background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;color:rgba(255,255,255,0.5); }'
      + '.sh-code { display:block;font-size:0.65rem;color:rgba(255,255,255,0.3);font-family:monospace; }'
      // Footer
      + '.scanner-footer {'
      +   'padding:12px 16px;border-top:1px solid rgba(255,255,255,0.08);'
      +   'background:rgba(0,0,0,0.3);flex-shrink:0;'
      + '}'
      + '.scanner-manual { display:flex;gap:8px;max-width:500px;margin:0 auto; }'
      + '.scanner-manual-input {'
      +   'flex:1;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);'
      +   'background:rgba(255,255,255,0.06);color:#fff;font-size:0.9rem;font-family:inherit;'
      +   'outline:none;transition:border-color 0.15s;'
      + '}'
      + '.scanner-manual-input:focus { border-color:var(--accent-blue,#3b82f6); }'
      + '.scanner-manual-input::placeholder { color:rgba(255,255,255,0.3); }'
      + '.scanner-manual-btn {'
      +   'padding:8px 16px;border-radius:6px;border:none;'
      +   'background:var(--accent-blue,#3b82f6);color:#fff;font-weight:600;'
      +   'font-size:0.85rem;cursor:pointer;transition:background 0.15s;font-family:inherit;'
      + '}'
      + '.scanner-manual-btn:hover { background:var(--accent-blue,#2563eb);filter:brightness(1.1); }'
      // Result card
      + '.scanner-result {'
      +   'display:none;position:absolute;bottom:80px;left:0;right:0;'
      +   'justify-content:center;padding:0 16px;z-index:10;'
      + '}'
      + '.scanner-result-inner {'
      +   'background:#1a1d24;border:1px solid rgba(255,255,255,0.1);border-radius:12px;'
      +   'padding:16px 20px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.5);'
      + '}'
      + '.scanner-result-title {'
      +   'font-family:"Oswald",sans-serif;font-size:1.1rem;font-weight:600;color:#fff;'
      +   'margin-bottom:4px;'
      + '}'
      + '.scanner-result-code { font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:12px;font-family:monospace; }'
      + '.scanner-result-actions { display:flex;gap:8px; }'
      + '.scanner-result-btn {'
      +   'flex:1;padding:10px 16px;border-radius:8px;font-size:0.85rem;font-weight:600;'
      +   'text-align:center;cursor:pointer;transition:all 0.15s;font-family:inherit;'
      +   'text-decoration:none;display:inline-block;border:none;'
      + '}'
      + '.scanner-result-btn.primary { background:var(--accent-green,#22c55e);color:#fff; }'
      + '.scanner-result-btn.primary:hover { filter:brightness(1.1); }'
      + '.scanner-result-btn.secondary { background:rgba(255,255,255,0.08);color:#aaa;border:1px solid rgba(255,255,255,0.12); }'
      + '.scanner-result-btn.secondary:hover { background:rgba(255,255,255,0.12);color:#fff; }'
      + '.scanner-result-btn.owned-btn { background:rgba(59,130,246,0.15);color:var(--accent-blue,#3b82f6);border:1px solid rgba(59,130,246,0.3); }'
      + '.scanner-result-btn.owned-btn:hover { background:rgba(59,130,246,0.25); }'
      + '.scanner-result-btn.owned-btn.owned { background:rgba(34,197,94,0.15);color:var(--accent-green,#22c55e);border-color:rgba(34,197,94,0.3); }'
      + '.scanner-result-btn.owned-btn.owned:hover { background:rgba(34,197,94,0.25); }'
      // html5-qrcode overrides
      + '#scannerReader img[alt="Info icon"] { display:none !important; }'
      + '#scannerReader__header_message { display:none !important; }'
      + '#scannerReader__dashboard { display:none !important; }'
      + '#scannerReader__scan_region { border:none !important; }'
      + '#scannerReader__scan_region video { border-radius:8px; }'
      + '#scannerReader { border:none !important; }'
      // Light mode
      + '.light-mode #scannerOverlay { background:#f8fafc; }'
      + '.light-mode .scanner-header { background:rgba(0,0,0,0.04);border-bottom-color:rgba(0,0,0,0.08); }'
      + '.light-mode .scanner-title { color:#1a1a2e; }'
      + '.light-mode .scanner-close-btn,.light-mode .scanner-torch-btn,.light-mode .scanner-batch-btn { border-color:rgba(0,0,0,0.1);background:rgba(0,0,0,0.04);color:#555; }'
      + '.light-mode .scanner-footer { background:rgba(0,0,0,0.03);border-top-color:rgba(0,0,0,0.08); }'
      + '.light-mode .scanner-manual-input { background:#fff;border-color:rgba(0,0,0,0.15);color:#1a1a2e; }'
      + '.light-mode .scanner-manual-input::placeholder { color:rgba(0,0,0,0.3); }'
      + '.light-mode .scanner-result-inner { background:#fff;border-color:rgba(0,0,0,0.1);box-shadow:0 4px 16px rgba(0,0,0,0.1); }'
      + '.light-mode .scanner-result-title { color:#1a1a2e; }'
      + '.light-mode .scanner-result-code { color:rgba(0,0,0,0.4); }'
      + '.light-mode .scanner-result-btn.secondary { background:rgba(0,0,0,0.04);color:#555;border-color:rgba(0,0,0,0.1); }'
      + '.light-mode .scanner-toast { background:#fff;border-color:rgba(0,0,0,0.1);color:#1a1a2e;box-shadow:0 4px 16px rgba(0,0,0,0.1); }'
      + '.light-mode .scanner-history { background:rgba(0,0,0,0.03);border-top-color:rgba(0,0,0,0.08); }'
      + '.light-mode .sh-title { color:#1a1a2e; }'
      + '.light-mode .sh-code { color:rgba(0,0,0,0.35); }';
    document.head.appendChild(css);
  }

  // ── Init ──
  function init() {
    injectStyles();
    buildBarcodeIndex();
    createScannerButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }

  window.BarcodeScanner = {
    open: openScanner,
    close: closeScanner,
    rebuildIndex: buildBarcodeIndex
  };
})();
