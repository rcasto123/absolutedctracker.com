// Initialization: Modal listeners, main app render, What's New toggle, Roadmap toggle, Service Worker

document.addEventListener('DOMContentLoaded', () => {

document.getElementById('shareCollection').addEventListener('click', () => {
  const overlay = document.getElementById('shareOverlay');
  const preview = document.getElementById('sharePreview');
  const shareText = generateShareText();

  preview.textContent = shareText;
  overlay.classList.add('open');
});

document.getElementById('shareModalClose').addEventListener('click', () => {
  document.getElementById('shareOverlay').classList.remove('open');
});

document.getElementById('shareOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('shareOverlay')) {
    document.getElementById('shareOverlay').classList.remove('open');
  }
});

document.getElementById('shareCopyButton').addEventListener('click', () => {
  const shareText = generateShareText();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText).then(() => {
      const tooltip = document.getElementById('shareCopyTooltip');
      const btn = document.getElementById('shareCopyButton');
      const rect = btn.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width / 2 - 60 + 'px';
      tooltip.style.top = rect.top - 35 + 'px';
      tooltip.classList.add('show');
      setTimeout(() => tooltip.classList.remove('show'), 2000);
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = shareText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      const tooltip = document.getElementById('shareCopyTooltip');
      const btn = document.getElementById('shareCopyButton');
      const rect = btn.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width / 2 - 60 + 'px';
      tooltip.style.top = rect.top - 35 + 'px';
      tooltip.classList.add('show');
      setTimeout(() => tooltip.classList.remove('show'), 2000);
    } catch(err) {
      alert('Failed to copy to clipboard');
    }
    document.body.removeChild(textarea);
  }
});

document.getElementById('shareDownloadButton').addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#e8eaf0';
  ctx.font = 'bold 28px Oswald';
  ctx.textAlign = 'center';
  ctx.fillText('DC Absolute Universe Collection', canvas.width / 2, 50);

  const released = ALL_ISSUES.filter(i => isReleased(i.date));
  const ownedCount = ALL_ISSUES.filter(i => owned[issueKey(i)]).length;
  const pct = released.length > 0 ? Math.round((ownedCount / released.length) * 100) : 0;

  ctx.fillStyle = '#1a7aff';
  ctx.font = 'bold 56px Bebas Neue';
  ctx.fillText(pct + '%', canvas.width / 2, 140);

  ctx.fillStyle = '#8b92a8';
  ctx.font = '14px Source Sans 3';
  ctx.fillText(ownedCount + ' of ' + released.length + ' issues', canvas.width / 2, 165);

  const seriesNames = getSeriesNames();
  let y = 220;
  const maxSeries = Math.min(seriesNames.length, 6);
  for (let i = 0; i < maxSeries; i++) {
    const sName = seriesNames[i];
    const allInSeries = ALL_ISSUES.filter(j => j.series === sName && isReleased(j.date));
    if (allInSeries.length === 0) continue;
    const ownedInSeries = allInSeries.filter(j => owned[issueKey(j)]).length;
    const sPct = Math.round((ownedInSeries / allInSeries.length) * 100);

    const color = SERIES_COLORS[sName] || '#555';
    ctx.fillStyle = color;
    ctx.fillRect(50, y, 20, 14);
    ctx.fillStyle = '#e8eaf0';
    ctx.font = '12px Source Sans 3';
    ctx.textAlign = 'left';
    ctx.fillText(sName.substring(0, 20) + ': ' + sPct + '%', 80, y + 12);
    y += 25;
  }

  ctx.fillStyle = '#6b7394';
  ctx.font = '11px Source Sans 3';
  ctx.textAlign = 'center';
  ctx.fillText('absolutedctracker.com', canvas.width / 2, canvas.height - 15);

  canvas.toBlob(blob => {
    if (!blob) {
      alert('Failed to generate image');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-collection-' + new Date().toISOString().slice(0, 10) + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
});

// ── Feature 2: Import/Export ──
document.getElementById('importExport').addEventListener('click', () => {
  document.getElementById('importExportOverlay').classList.add('open');
});

document.getElementById('importExportModalClose').addEventListener('click', () => {
  document.getElementById('importExportOverlay').classList.remove('open');
});

document.getElementById('importExportOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('importExportOverlay')) {
    document.getElementById('importExportOverlay').classList.remove('open');
  }
});

document.getElementById('exportJsonBtn').addEventListener('click', () => {
  const exportData = {
    exported: new Date().toISOString().slice(0, 10),
    source: 'absolutedctracker.com',
    owned: owned,
    prices: prices || {},
    pullSeries: pullSeries || {},
    pullIssues: pullIssues || {},
    marketValues: marketValues || {}
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-collection-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  let csv = 'Series,Issue,Title,Date,Owned,Price Paid,Market Value\n';

  ALL_ISSUES.forEach(issue => {
    const key = issueKey(issue);
    const isOwned = owned[key] ? 'Yes' : 'No';
    const price = getPrice(key) || '';
    const marketVal = getMarketValue(key) || '';

    const series = (issue.series || '').replace(/"/g, '""');
    const issueNum = (issue.issue || '').replace(/"/g, '""');
    const title = (issue.title || '').replace(/"/g, '""');
    const date = issue.date || '';

    csv += '"' + series + '","' + issueNum + '","' + title + '","' + date + '",' + isOwned;
    csv += ',' + (price ? price : '') + ',' + (marketVal ? marketVal : '') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-collection-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(event.target.result);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          alert('Invalid import file: expected a JSON object with an "owned" key.');
          return;
        }
        if (data.owned) {
          Object.keys(data.owned).forEach(key => {
            owned[key] = true;
          });
        }
        if (data.prices) {
          Object.keys(data.prices).forEach(key => {
            prices[key] = data.prices[key];
          });
        }
        if (data.pullSeries) {
          Object.keys(data.pullSeries).forEach(key => {
            pullSeries[key] = true;
          });
        }
        if (data.pullIssues) {
          Object.keys(data.pullIssues).forEach(key => {
            pullIssues[key] = true;
          });
        }
        if (data.marketValues) {
          Object.keys(data.marketValues).forEach(key => {
            marketValues[key] = data.marketValues[key];
          });
        }
        if (data.variantPrices) {
          Object.keys(data.variantPrices).forEach(key => {
            Object.keys(data.variantPrices[key]).forEach(idx => {
              if (typeof setVariantPrice === 'function') setVariantPrice(key, idx, data.variantPrices[key][idx]);
            });
          });
        }
        if (data.variantMarketValues) {
          Object.keys(data.variantMarketValues).forEach(key => {
            Object.keys(data.variantMarketValues[key]).forEach(idx => {
              if (typeof setVariantMarketValue === 'function') setVariantMarketValue(key, idx, data.variantMarketValues[key][idx]);
            });
          });
        }
        alert('Imported ' + Object.keys(data.owned || {}).length + ' collection entries');
      } else if (file.name.endsWith('.csv')) {
        const lines = event.target.result.split('\n');
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = [];
          let col = '';
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '"') {
              inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
              cols.push(col);
              col = '';
            } else {
              col += ch;
            }
          }
          cols.push(col);

          if (cols.length >= 5) {
            const series = cols[0].replace(/^"|"$/g, '');
            const issue = cols[1].replace(/^"|"$/g, '');
            const isOwnedStr = cols[4].trim();
            const price = cols[5] ? parseFloat(cols[5].replace(/^"|"$/g, '')) : 0;
            const marketVal = cols[6] ? parseFloat(cols[6].replace(/^"|"$/g, '')) : 0;

            if (isOwnedStr === 'Yes' || isOwnedStr === 'true') {
              const key = series + '|' + issue;
              owned[key] = true;
              imported++;
              if (price > 0) prices[key] = price;
              if (marketVal > 0) marketValues[key] = marketVal;
            }
          }
        }
        alert('Imported ' + imported + ' owned issues from CSV');
      }

      saveOwned();
      savePrices();
      saveMarketValues();
      savePullSeries();
      savePullIssues();
      renderCollection(currentFilter, currentSearch);
      renderStats();
      renderArcs();
      renderAnalytics();
      renderAchievements();
      document.getElementById('importExportOverlay').classList.remove('open');
      document.getElementById('fileInput').value = '';
    } catch(err) {
      alert('Error importing file: ' + err.message);
    }
  };
  reader.readAsText(file);
});

}); // end DOMContentLoaded — share/import-export modal listeners

// Defer all render calls to DOMContentLoaded so that defer'd scripts
// (firebase-config.js, auth-integration.js) have loaded their globals
// (getTotalVariantSpent, countOwnedVariants, etc.) before we use them.
document.addEventListener('DOMContentLoaded', () => {
  function _renderAll() {
    renderStats();
    renderCollection('all', '');
    renderCalendar(false);

    // Restore tab from URL hash
    if (location.hash) {
      const hashTab = location.hash.slice(1);
      const target = document.querySelector('.nav-tab[data-tab="' + hashTab + '"]');
      if (target) switchTab(target);
    }
    renderSeriesGuide();
    renderTrades();
    renderArcs();
    renderAnalytics();
    renderAchievements();
  }

  // Try loading external data first, then render (falls back to inline data)
  _loadExternalData().then(_renderAll).catch(_renderAll);
});

// What's New toggle
(function() {
  var toggle = document.getElementById('whatsNewToggle');
  var body = document.getElementById('whatsNewBody');
  if (!toggle || !body) return;
  toggle.addEventListener('click', function() {
    var open = body.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  // Check if user has seen the latest changelog — hide badge if so
  try {
    var lastSeen = localStorage.getItem('changelog_seen');
    // Extract latest date from first changelog entry so we don't need to hardcode it
    var firstDateEl = document.querySelector('#whatsNewBody .changelog-date');
    var latestDate = firstDateEl ? firstDateEl.textContent.trim() : '';
    if (lastSeen === latestDate) {
      var badge = toggle.querySelector('.whats-new-badge');
      if (badge) badge.style.display = 'none';
    }
    toggle.addEventListener('click', function() {
      try { localStorage.setItem('changelog_seen', latestDate); } catch(e) {}
      var badge = toggle.querySelector('.whats-new-badge');
      if (badge) badge.style.display = 'none';
    }, { once: true });
  } catch(e) {}
})();

// Roadmap toggle
(function() {
  var toggle = document.getElementById('roadmapToggle');
  var body = document.getElementById('roadmapBody');
  if (!toggle || !body) return;
  toggle.addEventListener('click', function() {
    var open = body.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
})();

// ── Cart Summary Bar ──
function updateCartSummaryBar() {
  if (typeof loadCollectionCart === 'function') loadCollectionCart(); // refresh from localStorage (scanner may have changed it)
  var bar = document.getElementById('cartSummaryBar');
  if (!bar) return;
  var count = collectionCart.length;
  var total = typeof getCollectionCartTotal === 'function' ? getCollectionCartTotal() : 0;
  document.getElementById('cartBarCount').textContent = count;
  document.getElementById('cartBarTotal').textContent = total.toFixed(2);
  bar.classList.toggle('visible', count > 0);
}

document.getElementById('cartBarCheckout')?.addEventListener('click', function() {
  if (typeof checkoutCollectionCart === 'function') {
    var count = checkoutCollectionCart();
    renderCollection(currentFilter, currentSearch);
    renderStats();
    renderAnalytics();
    renderAchievements();
    updateCartSummaryBar();
  }
});

document.getElementById('cartBarClear')?.addEventListener('click', function() {
  if (typeof clearCollectionCart === 'function') {
    clearCollectionCart();
    renderCollection(currentFilter, currentSearch);
    updateCartSummaryBar();
  }
});

// Initial cart bar render
updateCartSummaryBar();

// Listen for storage changes from scanner (in case scanner is open in another tab)
window.addEventListener('storage', function(e) {
  if (e.key === 'au_scanner_cart') {
    loadCollectionCart();
    updateCartSummaryBar();
  }
});

// ── Variant Picker Events ──
document.getElementById('variantPickerClose')?.addEventListener('click', function() {
  if (typeof closeVariantPicker === 'function') closeVariantPicker();
});

document.getElementById('variantPickerOverlay')?.addEventListener('click', function(e) {
  if (e.target === this && typeof closeVariantPicker === 'function') closeVariantPicker();
});

document.getElementById('variantPickerAdd')?.addEventListener('click', function() {
  if (typeof addPickerSelectionToCart === 'function') addPickerSelectionToCart();
});

// Close picker on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && typeof closeVariantPicker === 'function') {
    var overlay = document.getElementById('variantPickerOverlay');
    if (overlay && overlay.classList.contains('open')) closeVariantPicker();
  }
});

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log('[SW] Registered, scope:', reg.scope);
    }).catch(function(err) {
      console.warn('[SW] Registration failed:', err);
    });
  });
}
