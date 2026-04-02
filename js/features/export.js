
(function() {
  // --- Export Feature ---
  function getVisibleCards() {
    var cards = [];
    document.querySelectorAll('.series-block').forEach(function(block) {
      if (block.style.display === 'none') return;
      var seriesTitle = block.querySelector('.series-title');
      var seriesName = seriesTitle ? seriesTitle.textContent.trim() : 'Unknown';
      block.querySelectorAll('.issue-card').forEach(function(card) {
        if (card.style.display === 'none' || card.closest('.issue-grid').style.display === 'none') return;
        var name = card.querySelector('.issue-name');
        var date = card.querySelector('.issue-date');
        var badge = card.querySelector('.issue-badge');
        var owned = card.classList.contains('owned');
        cards.push({
          series: seriesName,
          issue: name ? name.textContent.trim() : '',
          date: date ? date.textContent.trim() : '',
          status: badge ? badge.textContent.trim() : '',
          owned: owned
        });
      });
    });
    return cards;
  }

  function getActiveFilter() {
    var active = document.querySelector('.filter-btn.active');
    return active ? active.textContent.trim() : 'All';
  }

  function exportCSV() {
    var cards = getVisibleCards();
    var filter = getActiveFilter();
    var csv = 'Series,Issue,Release Date,Status,Owned\n';
    cards.forEach(function(c) {
      csv += '"' + c.series.replace(/"/g, '""') + '","' + c.issue.replace(/"/g, '""') + '","' + c.date.replace(/"/g, '""') + '","' + c.status + '","' + (c.owned ? 'Yes' : 'No') + '"\n';
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'absolute-universe-' + filter.toLowerCase() + '-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    closeExportMenu();
  }

  function exportJSON() {
    var cards = getVisibleCards();
    var filter = getActiveFilter();
    var data = {
      exported: new Date().toISOString(),
      filter: filter,
      totalIssues: cards.length,
      ownedCount: cards.filter(function(c) { return c.owned; }).length,
      issues: cards
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'absolute-universe-' + filter.toLowerCase() + '-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    closeExportMenu();
  }

  function exportChecklist() {
    var cards = getVisibleCards();
    var filter = getActiveFilter();
    var series = {};
    cards.forEach(function(c) {
      if (!series[c.series]) series[c.series] = [];
      series[c.series].push(c);
    });
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DC Absolute Universe - Collection Checklist</title>';
    html += '<style>@import url("https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap");';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    html += 'body { font-family: "Source Sans 3", sans-serif; padding: 32px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }';
    html += 'h1 { font-size: 1.6rem; margin-bottom: 4px; }';
    html += '.subtitle { color: #666; margin-bottom: 24px; font-size: 0.9rem; }';
    html += '.series-group { margin-bottom: 24px; break-inside: avoid; }';
    html += '.series-name { font-size: 1.1rem; font-weight: 700; border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 8px; }';
    html += '.issue-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 0.85rem; }';
    html += '.checkbox { width: 14px; height: 14px; border: 1.5px solid #999; border-radius: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }';
    html += '.checkbox.checked { background: #22c55e; border-color: #22c55e; color: white; font-size: 10px; }';
    html += '.issue-title { flex: 1; }';
    html += '.issue-meta { color: #888; font-size: 0.8rem; }';
    html += '.stats { background: #f5f5f5; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; display: flex; gap: 24px; font-size: 0.85rem; }';
    html += '.stat-val { font-weight: 700; font-size: 1.1rem; }';
    html += '@media print { body { padding: 16px; } .stats { background: #eee; } }';
    html += '</style></head><body>';
    html += '<h1>DC Absolute Universe Collection</h1>';
    html += '<div class="subtitle">Filter: ' + filter + ' &bull; Exported ' + new Date().toLocaleDateString() + '</div>';
    var owned = cards.filter(function(c) { return c.owned; }).length;
    html += '<div class="stats"><div><div class="stat-val">' + cards.length + '</div><div>Total Issues</div></div>';
    html += '<div><div class="stat-val">' + owned + '</div><div>Owned</div></div>';
    html += '<div><div class="stat-val">' + (cards.length - owned) + '</div><div>Missing</div></div>';
    html += '<div><div class="stat-val">' + Math.round(owned / cards.length * 100) + '%</div><div>Complete</div></div></div>';
    Object.keys(series).forEach(function(s) {
      html += '<div class="series-group"><div class="series-name">' + s + ' (' + series[s].filter(function(c){return c.owned;}).length + '/' + series[s].length + ')</div>';
      series[s].forEach(function(c) {
        html += '<div class="issue-row"><div class="checkbox' + (c.owned ? ' checked' : '') + '">' + (c.owned ? '&#10003;' : '') + '</div>';
        html += '<div class="issue-title">' + c.issue + '</div>';
        html += '<div class="issue-meta">' + c.date + '</div></div>';
      });
      html += '</div>';
    });
    html += '<script>window.onload=function(){window.print()}<\/script>';
    html += '</body></html>';
    var win = window.open('', '_blank');
    if (!win) { alert('Pop-up blocked — please allow pop-ups for this site to print your checklist.'); return; }
    win.document.write(html);
    win.document.close();
    closeExportMenu();
  }

  function closeExportMenu() {
    var menu = document.getElementById('export-menu');
    if (menu) menu.classList.remove('open');
  }

  // Inject Export button into filter bar
  function injectExportButton() {
    var filterBar = document.querySelector('.filter-bar');
    if (!filterBar || document.getElementById('export-dropdown')) return;
    
    var dropdown = document.createElement('div');
    dropdown.className = 'export-dropdown';
    dropdown.id = 'export-dropdown';
    dropdown.innerHTML = '<button class="export-btn" id="export-toggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export</button>' +
      '<div class="export-menu" id="export-menu">' +
      '<button class="export-menu-item" id="export-csv"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span><span class="export-label">Export as CSV</span><span class="export-desc">Spreadsheet-compatible file</span></span></button>' +
      '<button class="export-menu-item" id="export-json"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg><span><span class="export-label">Export as JSON</span><span class="export-desc">Structured data for backups</span></span></button>' +
      '<div class="export-menu-divider"></div>' +
      '<button class="export-menu-item" id="export-print"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg><span><span class="export-label">Print Checklist</span><span class="export-desc">Shop-ready printable checklist</span></span></button>' +
      '</div>';
    
    filterBar.appendChild(dropdown);

    document.getElementById('export-toggle').addEventListener('click', function(e) {
      e.stopPropagation();
      document.getElementById('export-menu').classList.toggle('open');
    });
    document.getElementById('export-csv').addEventListener('click', exportCSV);
    document.getElementById('export-json').addEventListener('click', exportJSON);
    document.getElementById('export-print').addEventListener('click', exportChecklist);
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#export-dropdown')) closeExportMenu();
    });
  }

  injectExportButton();
  var _exportObserver = new MutationObserver(function() { if (!document.getElementById('export-dropdown')) injectExportButton(); });
  var _collTab = document.getElementById('tab-collection');
  if (_collTab) _exportObserver.observe(_collTab, { childList: true, subtree: true });
})();
