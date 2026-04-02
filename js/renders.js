function renderStats() {
  const released = ALL_ISSUES.filter(i => isReleased(i.date)).length;
  const ownedCount = ALL_ISSUES.filter(i => owned[issueKey(i)]).length;
  const upcoming = ALL_ISSUES.filter(i => isUpcoming(i.date)).length;
  const series = new Set(ALL_ISSUES.filter(i => isReleased(i.date)).map(i => i.series));
  const pct = released > 0 ? Math.round((ownedCount / released) * 100) : 0;

  // Calculate pull list count (upcoming issues on pull list)
  const pullCount = ALL_ISSUES.filter(i => isUpcoming(i.date) && isOnPullList(issueKey(i), i.series)).length;

  // Calculate total spending (main issues + variants)
  let totalSpent = 0;
  ALL_ISSUES.forEach(i => {
    const k = issueKey(i);
    const price = getPrice(k);
    if (price) totalSpent += price;
    totalSpent += (typeof getTotalVariantSpent === 'function' ? getTotalVariantSpent(k) : 0);
  });

  // Calculate estimated collection value (main + variants)
  let collectionValue = 0;
  ALL_ISSUES.forEach(i => {
    const k = issueKey(i);
    if (owned[k]) {
      const mv = getMarketValue(k);
      collectionValue += mv ? mv : getCoverPrice(k);
    }
    collectionValue += (typeof getTotalVariantValue === 'function' ? getTotalVariantValue(k) : 0);
  });

  document.getElementById('statOwned').textContent = ownedCount;
  document.getElementById('statReleased').textContent = released;
  document.getElementById('statPercent').textContent = pct + '%';
  document.getElementById('statUpcoming').textContent = upcoming;
  document.getElementById('statSeries').textContent = series.size;
  document.getElementById('statPull').textContent = pullCount;
  document.getElementById('statSpent').textContent = '$' + totalSpent.toFixed(2);
  document.getElementById('statValue').textContent = '$' + collectionValue.toFixed(2);

  // Dynamic page title with collection count
  document.title = ownedCount + '/' + released + ' — DC Absolute Universe Collection Tracker';
}

function getAccordionState() {
  try { return JSON.parse(localStorage.getItem('accordion_state') || '{}'); } catch(e) { return {}; }
}
function saveAccordionState(state) {
  try { localStorage.setItem('accordion_state', JSON.stringify(state)); } catch(e) {
    console.warn('Accordion state: localStorage unavailable. State will not persist.');
  }
}

function renderCollection(filter, search) {
  const container = document.getElementById('collectionContainer');
  container.innerHTML = '';
  const seriesNames = getSeriesNames();
  let hasContent = false;
  const accState = getAccordionState();

  // Expand/Collapse all controls (appended only if content exists)
  const controls = document.createElement('div');
  controls.className = 'accordion-controls';
  controls.innerHTML = '<button class="accordion-ctrl-btn" id="expandAll">Expand All</button><button class="accordion-ctrl-btn" id="collapseAll">Collapse All</button>';

  seriesNames.forEach(sName => {
    let issues = ALL_ISSUES.filter(i => i.series === sName);
    if (filter === 'owned') issues = issues.filter(i => owned[issueKey(i)]);
    else if (filter === 'missing') issues = issues.filter(i => !owned[issueKey(i)] && isReleased(i.date));
    else if (filter === 'upcoming') issues = issues.filter(i => isUpcoming(i.date));
    else if (filter === 'pull') issues = issues.filter(i => isUpcoming(i.date) && isOnPullList(issueKey(i), sName));

    if (search) {
      const q = search.toLowerCase();
      issues = issues.filter(i => i.title.toLowerCase().includes(q) || i.writer.toLowerCase().includes(q) || i.artist.toLowerCase().includes(q));
    }

    if (issues.length === 0) return;
    hasContent = true;

    const block = document.createElement('div');
    block.className = 'series-block';

    const allInSeries = ALL_ISSUES.filter(i => i.series === sName && isReleased(i.date));
    const ownedInSeries = allInSeries.filter(i => owned[issueKey(i)]).length;
    const pct = allInSeries.length > 0 ? Math.round((ownedInSeries / allInSeries.length) * 100) : 0;
    const color = SERIES_COLORS[sName] || '#555';
    const isCollapsed = accState[sName] === true;

    const isSeriesSubscribed = isSeriesOnPull(sName);

    // Calculate total variants for this series
    let seriesVariantTotal = 0;
    let seriesVariantOwned = 0;
    issues.forEach(issue => {
      const slug = makeSlug(issue.title);
      const k = issueKey(issue);
      const variants = _variantData[slug];
      if (variants && variants.length > 0) {
        seriesVariantTotal += variants.length;
        if (typeof countOwnedVariants === 'function') {
          seriesVariantOwned += countOwnedVariants(k);
        }
      }
    });
    const varPct = seriesVariantTotal > 0 ? Math.round((seriesVariantOwned / seriesVariantTotal) * 100) : 0;
    const variantBarHTML = seriesVariantTotal > 0
      ? `<div class="series-variant-progress" title="${seriesVariantOwned}/${seriesVariantTotal} variants owned">
          <div class="variant-progress-bar"><div class="variant-progress-fill" style="width:${varPct}%"></div></div>
          <span class="variant-progress-text">${seriesVariantOwned}/${seriesVariantTotal} variants</span>
          <span class="variant-progress-pct">${varPct}%</span>
        </div>`
      : '';

    block.innerHTML = `
      <div class="series-header${isCollapsed ? ' collapsed' : ''}" style="--accent-color:${color}" role="button" tabindex="0" aria-expanded="${!isCollapsed}" aria-controls="grid-${sName.replace(/\s+/g, '-')}">
        <svg class="series-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <div class="series-title">${sName}</div>
        <span class="series-count">${issues.length} issues</span>
        <div class="series-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="progress-text">${ownedInSeries}/${allInSeries.length}</div>
          <div class="progress-pct">${pct}%</div>
        </div>
        ${variantBarHTML}
        <button class="series-subscribe${isSeriesSubscribed ? ' subscribed' : ''}" title="Toggle series subscription on pull list" aria-pressed="${isSeriesSubscribed}">Subscribe</button>
      </div>
      <div class="issue-grid" id="grid-${sName.replace(/\s+/g, '-')}"${isCollapsed ? ' style="display:none"' : ''}></div>
    `;

    const grid = block.querySelector('.issue-grid');
    issues.forEach(issue => {
      const key = issueKey(issue);
      const isOwned = !!owned[key];
      const released = isReleased(issue.date);
      const card = document.createElement('div');
      card.className = 'issue-card' + (isOwned ? ' owned' : '');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-pressed', isOwned ? 'true' : 'false');
      card.setAttribute('aria-label', `Toggle: ${issue.title}`);

      const badgeClass = released ? 'badge-released' : 'badge-upcoming';
      const badgeText = released ? '✓ Released' : '◇ Upcoming';
      const d = new Date(issue.date);
      const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

      // Check for variant covers
      const slug = makeSlug(issue.title);
      const variants = _variantData[slug];
      const variantCount = variants ? variants.length : 0;
      const variantOwnedCount = (variantCount > 0 && typeof countOwnedVariants === 'function') ? countOwnedVariants(key) : 0;
      // Variant progress bar
      let variantBarHTML = '';
      if (variantCount > 0) {
        const varPct = Math.round((variantOwnedCount / variantCount) * 100);
        variantBarHTML = `<div class="variant-tracker" title="${variantOwnedCount}/${variantCount} variants owned">
          <span class="variant-tracker-label">${variantOwnedCount}/${variantCount} variants</span>
          <div class="variant-tracker-bar"><div class="variant-tracker-fill" style="width:${varPct}%"></div></div>
        </div>`;
      }

      const isOnPull = isOnPullList(key, sName);
      const pullIconHTML = !released
        ? `<div class="pull-icon${isOnPull ? ' active' : ''}" title="Add to pull list">📌</div>`
        : '';

      const priceValue = getPrice(key) || '';
      const priceInputHTML = `<span class="price-group"><span class="price-label">Paid</span><input class="price-input" type="number" step="0.01" min="0" placeholder="0.00" value="${priceValue}" data-issue-key="${key}" title="Price paid for this issue"></span>`;

      const mvValue = getMarketValue(key) || '';
      const marketInputHTML = `<span class="price-group"><span class="price-label">Value</span><input class="market-input" type="number" step="0.01" min="0" placeholder="0.00" value="${mvValue}" data-issue-key="${key}" title="Estimated market value"></span>`;

      card.innerHTML = `
        <div class="issue-checkbox">${checkSvg}</div>
        <div class="issue-info">
          <div class="issue-name"><a href="issue.html?id=${slug}" onclick="event.stopPropagation()">${issue.title}</a></div>
          <div class="issue-date">${dateStr} · ${issue.writer}</div>
        </div>
        <div class="issue-badge ${badgeClass}">${badgeText}</div>
        <div class="card-meta">
          ${variantBarHTML}
          ${pullIconHTML}
          ${priceInputHTML}
          ${marketInputHTML}
        </div>
      `;

      const toggleOwned = () => {
        if (owned[key]) delete owned[key];
        else owned[key] = true;
        saveOwned();
        renderCollection(currentFilter, currentSearch);
        renderStats();
        renderArcs();
        renderAnalytics();
        renderAchievements();
      };

      // Pull icon handler for upcoming issues
      const pullIcon = card.querySelector('.pull-icon');
      if (pullIcon) {
        pullIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleIssuePull(key);
          pullIcon.classList.toggle('active');
          renderStats();
        });
      }

      // Price input handler for owned issues
      const priceInput = card.querySelector('.price-input');
      if (priceInput) {
        priceInput.addEventListener('click', (e) => e.stopPropagation());
        priceInput.addEventListener('focus', (e) => e.stopPropagation());
        priceInput.addEventListener('blur', (e) => {
          const price = parseFloat(e.target.value);
          if (e.target.value && price > 0) {
            setPrice(key, price);
          } else {
            delete prices[key];
            savePrices();
            e.target.value = '';
          }
          renderStats();
          renderAnalytics();
        });
        priceInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.target.blur();
          }
          e.stopPropagation();
        });
      }

      // Market value input handler for owned issues
      const marketInput = card.querySelector('.market-input');
      if (marketInput) {
        marketInput.addEventListener('click', (e) => e.stopPropagation());
        marketInput.addEventListener('focus', (e) => e.stopPropagation());
        marketInput.addEventListener('blur', (e) => {
          const val = parseFloat(e.target.value);
          if (e.target.value && val > 0) {
            setMarketValue(key, val);
          } else {
            delete marketValues[key];
            saveMarketValues();
            e.target.value = '';
          }
          renderStats();
          renderAnalytics();
        });
        marketInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') e.target.blur();
          e.stopPropagation();
        });
      }

      card.addEventListener('click', toggleOwned);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          toggleOwned();
        }
      });

      grid.appendChild(card);
    });

    // Accordion toggle handler
    const header = block.querySelector('.series-header');
    const subscribeBtn = header.querySelector('.series-subscribe');

    subscribeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSeriesPull(sName);
      subscribeBtn.classList.toggle('subscribed');
      subscribeBtn.setAttribute('aria-pressed', subscribeBtn.classList.contains('subscribed'));
      renderStats();
    });

    header.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('.series-subscribe')) return;
      const grd = block.querySelector('.issue-grid');
      const collapsed = header.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', !collapsed);
      if (collapsed) {
        grd.style.display = 'none';
        grd.classList.remove('animating');
      } else {
        grd.style.display = '';
        grd.classList.remove('animating');
        void grd.offsetWidth;
        grd.classList.add('animating');
      }
      const st = getAccordionState();
      st[sName] = collapsed;
      saveAccordionState(st);
    });
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });

    container.appendChild(block);
  });

  if (!hasContent) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">ð­</div><p>No issues match your filters.</p></div>';
  } else {
    // Insert controls at the top now that we know there's content
    container.insertBefore(controls, container.firstChild);
    // Expand / Collapse All handlers
    document.getElementById('expandAll').addEventListener('click', () => {
      const st = {};
      container.querySelectorAll('.series-header').forEach(h => {
        const wasCollapsed = h.classList.contains('collapsed');
        h.classList.remove('collapsed');
        h.setAttribute('aria-expanded', 'true');
        const g = h.nextElementSibling;
        if (g) {
          g.style.display = '';
          if (wasCollapsed) {
            g.classList.remove('animating');
            void g.offsetWidth;
            g.classList.add('animating');
          }
        }
        const name = h.querySelector('.series-title').textContent;
        st[name] = false;
      });
      saveAccordionState(st);
    });
    document.getElementById('collapseAll').addEventListener('click', () => {
      const st = {};
      container.querySelectorAll('.series-header').forEach(h => {
        h.classList.add('collapsed');
        h.setAttribute('aria-expanded', 'false');
        const g = h.nextElementSibling;
        if (g) g.style.display = 'none';
        const name = h.querySelector('.series-title').textContent;
        st[name] = true;
      });
      saveAccordionState(st);
    });
  }
}
function renderCalendar(showAll) {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';

  let issues = [...ALL_ISSUES].sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date));
  if (!showAll) issues = issues.filter(i => isUpcoming(i.date));

  if (issues.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">ð</div><p>No upcoming releases.</p></div>';
    return;
  }

  const months = {};
  issues.forEach(i => {
    const d = parseLocalDate(i.date);
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    if (!months[key]) months[key] = [];
    months[key].push(i);
  });

  Object.keys(months).sort().forEach(mKey => {
    const items = months[mKey];
    const d = new Date(items[0].date);
    const monthName = d.toLocaleDateString('en-US', { month:'long', year:'numeric' });

    const monthDiv = document.createElement('div');
    monthDiv.className = 'calendar-month';
    monthDiv.innerHTML = `<div class="calendar-month-title">${monthName}</div><div class="calendar-list"></div>`;

    const list = monthDiv.querySelector('.calendar-list');
    items.forEach(i => {
      const dd = parseLocalDate(i.date);
      const dayStr = dd.toLocaleDateString('en-US', { month:'short', day:'numeric' });
      const now = getToday();
      const past = dd < now;
      const isToday = dd.toDateString() === now.toDateString();
      const color = SERIES_COLORS[i.series] || '#555';

      const item = document.createElement('div');
      item.className = 'calendar-item' + (past ? ' past' : '') + (isToday ? ' today' : '');
      item.innerHTML = `
        <div class="calendar-date">${dayStr}</div>
        <div class="calendar-dot" style="background:${color}"></div>
        <div class="calendar-title">${i.title}</div>
        <div class="calendar-writer">${i.writer} / ${i.artist}</div>
      `;
      list.appendChild(item);
    });

    container.appendChild(monthDiv);
  });
}

function renderSeriesGuide() {
  const container = document.getElementById('seriesGuideContainer');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'info-grid';

  SERIES_INFO.forEach(s => {
    const color = SERIES_COLORS[s.name] || '#555';
    const typeClass = s.type.includes('Limited') ? 'limited' : s.type === 'Special' ? 'special' : '';
    const card = document.createElement('div');
    card.className = 'info-card';
    card.innerHTML = `
      <div class="info-card-header">
        <div class="info-card-color" style="background:${color}"></div>
        <div class="info-card-title">${s.name}</div>
        <div class="info-card-type ${typeClass}">${s.type}</div>
      </div>
      <div class="info-row"><span class="info-label">Writer</span><span class="info-value">${s.writer}</span></div>
      <div class="info-row"><span class="info-label">Artist</span><span class="info-value">${s.artist}</span></div>
      <div class="info-row"><span class="info-label">Colorist</span><span class="info-value">${s.colorist}</span></div>
      <div class="info-row"><span class="info-label">Launch</span><span class="info-value">${s.start}</span></div>
      <div class="info-description">${s.description}</div>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderTrades() {
  const container = document.getElementById('tradesContainer');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'tpb-grid';

  if (TRADES.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">ð</div><p>No trades available.</p></div>';
    return;
  }

  TRADES.forEach(t => {
    const key = tradeKey(t);
    const isOwned = !!ownedTrades[key];
    const released = isReleased(t.date);
    const d = new Date(t.date);
    const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

    const card = document.createElement('div');
    card.className = 'tpb-card' + (isOwned ? ' owned' : '');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', isOwned ? 'true' : 'false');
    card.setAttribute('aria-label', `Toggle: ${t.title}`);

    card.innerHTML = `
      <div class="issue-checkbox">${checkSvg}</div>
      <div class="tpb-info">
        <div class="tpb-title">${t.title}</div>
        <div class="tpb-sub">${t.subtitle} · ${dateStr}</div>
      </div>
      <div class="issue-badge ${released ? 'badge-released' : 'badge-upcoming'}">${released ? 'Released' : 'Upcoming'}</div>
    `;

    const toggleOwned = () => {
      if (ownedTrades[key]) delete ownedTrades[key];
      else ownedTrades[key] = true;
      saveTrades();
      renderTrades();
    };

    card.addEventListener('click', toggleOwned);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        toggleOwned();
      }
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// Essential reading list — curated shortlist for new readers
const ESSENTIAL_ISSUES = [
  {title:'DC All In Special', note:'The event that launches Earth-Alpha. Start here.'},
  {title:'Absolute Batman #1', note:'Bruce Wayne reimagined — no wealth, no Wayne Manor. The definitive Absolute origin.'},
  {title:'Absolute Superman #1', note:'Kal-El without the Kents. A raw, powerful new take on the Man of Steel.'},
  {title:'Absolute Wonder Woman #1', note:'Diana fights her way out of Hell in this mythology-heavy reimagining.'},
  {title:'Absolute Batman #3', note:'The first major Batman arc climax. Raises the stakes dramatically.'},
  {title:'Absolute Flash #1', note:'The speedster enters Earth-Alpha with a fresh twist on the Speed Force.'},
  {title:'Absolute Green Lantern #1', note:'A cosmic new direction for the ring-bearer.'},
  {title:'Absolute Martian Manhunter #1', note:'J\'onn J\'onzz arrives — alien horror meets detective noir.'},
  {title:'Absolute Batman #7', note:'The escalation begins. A turning point for the Absolute Universe.'},
  {title:'Absolute Evil #1', note:'The big bad arrives. Threads from all titles begin to converge.'},
  {title:'Absolute Green Arrow #1', note:'Oliver Queen joins the Universe with a grounded, street-level debut.'},
  {title:'Absolute Catwoman #1', note:'Selina Kyle enters with her own unique angle on Earth-Alpha.'},
];

let currentReadingOrder = 'arcs';

function renderArcs() {
  const container = document.getElementById('arcsContainer');
  container.innerHTML = '';

  const issueMap = {};
  ALL_ISSUES.forEach(i => { issueMap[i.title] = i; });

  // Find "What to read next" recommendation
  let nextRecommendation = null;
  if (currentReadingOrder === 'arcs') {
    for (let arc of STORY_ARCS) {
      const arcIssues = arc.issues.map(ai => {
        const issue = issueMap[ai.title];
        return issue ? { ...issue, order: ai.order, isOwned: owned[issueKey(issue)] } : null;
      }).filter(Boolean);

      // Find first unowned issue in this arc
      const unownedInArc = arcIssues.find(i => !i.isOwned);
      if (unownedInArc) {
        const ownedCount = arcIssues.filter(i => i.isOwned).length;
        nextRecommendation = { issue: unownedInArc, arc, arcTotal: arcIssues.length, ownedCount };
        break;
      }
    }

    // Add "What to read next" card if applicable
    if (nextRecommendation) {
      const next = nextRecommendation;
      const slug = next.issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const progress = next.ownedCount + '/' + next.arcTotal;
      const rec = document.createElement('a');
      rec.href = 'issue.html?id=' + slug;
      rec.className = 'read-next-card';
      rec.innerHTML = `
        <div class="read-next-label">📖 Read Next</div>
        <div class="read-next-title">${next.issue.title}</div>
        <div class="read-next-context">Part of ${next.arc.name} — ${progress} complete</div>
      `;
      container.appendChild(rec);
    }

    renderStoryArcs(container, issueMap);
  } else if (currentReadingOrder === 'publication') {
    renderPublicationOrder(container, issueMap);
  } else if (currentReadingOrder === 'essential') {
    renderEssentialOrder(container, issueMap);
  }
}

function getArcAccordionState() {
  try { return JSON.parse(localStorage.getItem('arc_accordion_state') || '{}'); } catch(e) { return {}; }
}
function saveArcAccordionState(state) {
  try { localStorage.setItem('arc_accordion_state', JSON.stringify(state)); } catch(e) {}
}

function renderStoryArcs(container, issueMap) {
  // Add expand/collapse controls
  const controls = document.createElement('div');
  controls.className = 'accordion-controls';
  controls.innerHTML = '<button class="accordion-ctrl-btn" id="arcExpandAll">Expand All</button><button class="accordion-ctrl-btn" id="arcCollapseAll">Collapse All</button>';
  container.appendChild(controls);

  const accState = getArcAccordionState();

  STORY_ARCS.forEach(arc => {
    const card = document.createElement('div');
    card.className = 'arc-card';
    const arcKey = 'arc-' + arc.name.replace(/\s+/g, '-').toLowerCase();
    const isCollapsed = accState[arcKey] === true;

    const arcIssues = arc.issues.map(ai => {
      const issue = issueMap[ai.title];
      return issue ? { ...issue, order: ai.order, isOwned: owned[issueKey(issue)] } : null;
    }).filter(Boolean);

    const ownedCount = arcIssues.filter(i => i.isOwned).length;
    const total = arcIssues.length;
    const pillClass = ownedCount === total ? 'complete' : ownedCount > 0 ? 'partial' : 'empty';
    const pillText = ownedCount + '/' + total;
    const progressPct = total > 0 ? Math.round((ownedCount / total) * 100) : 0;

    let html = '<div class="arc-header' + (isCollapsed ? ' collapsed' : '') + '" role="button" tabindex="0" aria-expanded="' + !isCollapsed + '">';
    html += '<svg class="arc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
    html += '<h3 class="arc-name">' + arc.name + '</h3>';
    html += '<span class="arc-progress-pill ' + pillClass + '">' + pillText + ' owned</span>';
    html += '</div>';
    html += '<div class="arc-body">';
    html += '<div class="arc-desc">' + arc.description + '</div>';
    html += '<div class="arc-progress">';
    html += '<div class="arc-progress-bar"><div class="arc-progress-fill" style="width:' + progressPct + '%"></div></div>';
    html += '<div class="arc-progress-text">' + progressPct + '%</div>';
    html += '</div>';
    html += '<div class="arc-issues">';

    const sortedIssues = arcIssues.sort((a,b) => a.order - b.order);
    sortedIssues.forEach((i, idx) => {
      // Inline series label when series changes
      if (idx > 0 && sortedIssues[idx - 1].series !== i.series) {
        html += '<div class="arc-series-switch">↳ ' + i.series + '</div>';
      }
      html += renderArcIssueRow(i);
    });

    html += '</div></div>';
    card.innerHTML = html;
    container.appendChild(card);

    // Accordion toggle
    const header = card.querySelector('.arc-header');
    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      const nowCollapsed = header.classList.contains('collapsed');
      header.setAttribute('aria-expanded', !nowCollapsed);
      const st = getArcAccordionState();
      if (nowCollapsed) st[arcKey] = true; else delete st[arcKey];
      saveArcAccordionState(st);
    });
  });

  // Expand/Collapse All
  document.getElementById('arcExpandAll').addEventListener('click', () => {
    container.querySelectorAll('.arc-header').forEach(h => {
      h.classList.remove('collapsed');
      h.setAttribute('aria-expanded', 'true');
    });
    saveArcAccordionState({});
  });
  document.getElementById('arcCollapseAll').addEventListener('click', () => {
    const st = {};
    container.querySelectorAll('.arc-header').forEach(h => {
      h.classList.add('collapsed');
      h.setAttribute('aria-expanded', 'false');
      const name = h.querySelector('.arc-name');
      if (name) st['arc-' + name.textContent.replace(/\s+/g, '-').toLowerCase()] = true;
    });
    saveArcAccordionState(st);
  });
}

function renderPublicationOrder(container, issueMap) {
  // Add expand/collapse controls
  const controls = document.createElement('div');
  controls.className = 'accordion-controls';
  controls.innerHTML = '<button class="accordion-ctrl-btn" id="pubExpandAll">Expand All</button><button class="accordion-ctrl-btn" id="pubCollapseAll">Collapse All</button>';
  container.appendChild(controls);

  const accState = getArcAccordionState();

  // Group released issues by month
  const released = ALL_ISSUES.filter(i => isReleased(i.date))
    .sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  const months = {};
  released.forEach((issue, idx) => {
    const d = new Date(issue.date);
    const key = d.toLocaleDateString('en-US', { month:'long', year:'numeric' });
    if (!months[key]) months[key] = [];
    months[key].push({ ...issue, order: idx + 1, isOwned: owned[issueKey(issue)] });
  });

  Object.keys(months).forEach(month => {
    const issues = months[month];
    const ownedCount = issues.filter(i => i.isOwned).length;
    const total = issues.length;
    const pillClass = ownedCount === total ? 'complete' : ownedCount > 0 ? 'partial' : 'empty';
    const monthKey = 'pub-' + month.replace(/\s+/g, '-').toLowerCase();
    const isCollapsed = accState[monthKey] === true;

    const card = document.createElement('div');
    card.className = 'arc-card';
    let html = '<div class="arc-header' + (isCollapsed ? ' collapsed' : '') + '" role="button" tabindex="0" aria-expanded="' + !isCollapsed + '">';
    html += '<svg class="arc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
    html += '<h3 class="arc-name">' + month + '</h3>';
    html += '<span class="arc-progress-pill ' + pillClass + '">' + ownedCount + '/' + total + ' owned</span>';
    html += '</div>';
    html += '<div class="arc-body">';
    html += '<div class="arc-desc">' + total + ' issues released</div>';
    html += '<div class="arc-issues">';

    issues.forEach(i => {
      html += renderArcIssueRow(i);
    });

    html += '</div></div>';
    card.innerHTML = html;
    container.appendChild(card);

    const header = card.querySelector('.arc-header');
    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      const nowCollapsed = header.classList.contains('collapsed');
      header.setAttribute('aria-expanded', !nowCollapsed);
      const st = getArcAccordionState();
      if (nowCollapsed) st[monthKey] = true; else delete st[monthKey];
      saveArcAccordionState(st);
    });
  });

  document.getElementById('pubExpandAll').addEventListener('click', () => {
    container.querySelectorAll('.arc-header').forEach(h => {
      h.classList.remove('collapsed');
      h.setAttribute('aria-expanded', 'true');
    });
    const st = getArcAccordionState();
    Object.keys(st).forEach(k => { if (k.startsWith('pub-')) delete st[k]; });
    saveArcAccordionState(st);
  });
  document.getElementById('pubCollapseAll').addEventListener('click', () => {
    const st = getArcAccordionState();
    container.querySelectorAll('.arc-header').forEach(h => {
      h.classList.add('collapsed');
      h.setAttribute('aria-expanded', 'false');
      const name = h.querySelector('.arc-name');
      if (name) st['pub-' + name.textContent.replace(/\s+/g, '-').toLowerCase()] = true;
    });
    saveArcAccordionState(st);
  });
}

function renderEssentialOrder(container, issueMap) {
  const accState = getArcAccordionState();
  const isCollapsed = accState['essential'] === true;

  const card = document.createElement('div');
  card.className = 'arc-card';

  const essentialIssues = ESSENTIAL_ISSUES.map((ei, idx) => {
    const issue = issueMap[ei.title];
    return issue ? { ...issue, order: idx + 1, isOwned: owned[issueKey(issue)], note: ei.note } : null;
  }).filter(Boolean);

  const ownedCount = essentialIssues.filter(i => i.isOwned).length;
  const total = essentialIssues.length;
  const pillClass = ownedCount === total ? 'complete' : ownedCount > 0 ? 'partial' : 'empty';

  let html = '<div class="arc-header' + (isCollapsed ? ' collapsed' : '') + '" role="button" tabindex="0" aria-expanded="' + !isCollapsed + '">';
  html += '<svg class="arc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
  html += '<h3 class="arc-name">Essential Reading</h3>';
  html += '<span class="arc-progress-pill ' + pillClass + '">' + ownedCount + '/' + total + ' owned</span>';
  html += '</div>';
  html += '<div class="arc-body">';
  html += '<div class="arc-desc">The curated shortlist for new readers. These are the key issues that define the Absolute Universe — start here if you\'re just getting into the line.</div>';
  html += '<div class="arc-issues">';

  essentialIssues.forEach(i => {
    const color = SERIES_COLORS[i.series] || '#555';
    const ownedClass = i.isOwned ? ' owned' : '';
    const slug = i.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    html += '<div class="arc-issue' + ownedClass + '">';
    html += '<div class="arc-order">' + i.order + '</div>';
    html += '<div class="arc-dot" style="background:' + color + '"></div>';
    html += '<div class="arc-issue-title"><a href="issue.html?id=' + slug + '">' + i.title + '</a>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + i.note + '</div>';
    html += '</div>';
    html += '<svg class="arc-check" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    html += '</div>';
  });

  html += '</div></div>';
  card.innerHTML = html;
  container.appendChild(card);

  const header = card.querySelector('.arc-header');
  header.addEventListener('click', () => {
    header.classList.toggle('collapsed');
    const nowCollapsed = header.classList.contains('collapsed');
    header.setAttribute('aria-expanded', !nowCollapsed);
    const st = getArcAccordionState();
    if (nowCollapsed) st['essential'] = true; else delete st['essential'];
    saveArcAccordionState(st);
  });
}

function renderArcIssueRow(i) {
  const color = SERIES_COLORS[i.series] || '#555';
  const d = parseLocalDate(i.date);
  const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const ownedClass = i.isOwned ? ' owned' : '';
  const slug = i.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Determine status
  let statusIcon = '◇'; // upcoming
  let statusClass = '';
  if (i.isOwned) {
    statusIcon = '✓';
    statusClass = ' owned';
  } else if (isReleased(i.date)) {
    statusIcon = '○';
    statusClass = ' released';
  }

  let html = '<div class="arc-issue' + ownedClass + '">';
  html += '<div class="arc-order">' + i.order + '</div>';
  html += '<div class="arc-dot" style="background:' + color + '"></div>';
  html += '<div class="arc-issue-title"><a href="issue.html?id=' + slug + '">' + i.title + '</a>';
  html += '<span class="arc-issue-status" title="Issue status">' + statusIcon + '</span>';
  html += '</div>';
  html += '<div class="arc-issue-date">' + dateStr + '</div>';
  html += '<svg class="arc-check" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
  html += '</div>';
  return html;
}

function renderAchievements() {
  const container = document.getElementById('achievementsContainer');
  if (!container) return;
  container.innerHTML = '';

  // Single-pass data collection
  const released = ALL_ISSUES.filter(i => isReleased(i.date));
  let ownedCount = 0;
  const totalReleased = released.length;
  const seriesStats = {};
  const ownedMonths = new Set();

  released.forEach(i => {
    const key = issueKey(i);
    const isOwn = !!owned[key];
    if (isOwn) { ownedCount++; ownedMonths.add(i.date.slice(0, 7)); }
    if (!seriesStats[i.series]) seriesStats[i.series] = { total: 0, owned: 0 };
    seriesStats[i.series].total++;
    if (isOwn) seriesStats[i.series].owned++;
  });

  const pct = totalReleased > 0 ? Math.round((ownedCount / totalReleased) * 100) : 0;
  const completedSeries = Object.values(seriesStats).filter(s => s.total > 0 && s.owned === s.total).length;
  const totalSeries = Object.keys(seriesStats).length;
  const seriesWithOwned = Object.values(seriesStats).filter(s => s.owned > 0).length;
  const distinctMonths = ownedMonths.size;

  // Variant collection data
  let totalVariants = 0, ownedVariants = 0;
  ALL_ISSUES.forEach(i => {
    const slug = makeSlug(i.title);
    const variants = _variantData[slug];
    if (variants && variants.length > 0) {
      totalVariants += variants.length;
      const k = issueKey(i);
      ownedVariants += window.countOwnedVariants(k);
    }
  });
  const variantPct = totalVariants > 0 ? Math.round((ownedVariants / totalVariants) * 100) : 0;

  const BADGES = [
    { id: 'first_issue', icon: '\u2B50', name: 'First Issue', desc: 'Add your first issue to the collection', check: () => ownedCount >= 1, progress: () => Math.min(ownedCount, 1), max: 1 },
    { id: 'getting_started', icon: '\uD83D\uDCDA', name: 'Getting Started', desc: 'Collect 5 issues', check: () => ownedCount >= 5, progress: () => Math.min(ownedCount, 5), max: 5 },
    { id: 'dedicated', icon: '\uD83D\uDD25', name: 'Dedicated Reader', desc: 'Collect 10 issues', check: () => ownedCount >= 10, progress: () => Math.min(ownedCount, 10), max: 10 },
    { id: 'serious', icon: '\uD83D\uDCAA', name: 'Serious Collector', desc: 'Collect 25 issues', check: () => ownedCount >= 25, progress: () => Math.min(ownedCount, 25), max: 25 },
    { id: 'power', icon: '\u26A1', name: 'Power Collector', desc: 'Collect 50 issues', check: () => ownedCount >= 50, progress: () => Math.min(ownedCount, 50), max: 50 },
    { id: 'quarter', icon: '\uD83C\uDF19', name: 'Quarter Way', desc: 'Reach 25% completion', check: () => pct >= 25, progress: () => pct, max: 100 },
    { id: 'half', icon: '\u2600\uFE0F', name: 'Halfway There', desc: 'Reach 50% completion', check: () => pct >= 50, progress: () => pct, max: 100 },
    { id: 'three_quarter', icon: '\uD83C\uDF1F', name: 'Almost Complete', desc: 'Reach 75% completion', check: () => pct >= 75, progress: () => pct, max: 100 },
    { id: 'completionist', icon: '\uD83C\uDFC6', name: 'Completionist', desc: 'Collect every released issue', check: () => pct === 100 && totalReleased > 0, progress: () => pct, max: 100 },
    { id: 'series_one', icon: '\uD83C\uDFAF', name: 'Series Complete', desc: 'Complete an entire series', check: () => completedSeries >= 1, progress: () => Math.min(completedSeries, 1), max: 1 },
    { id: 'series_three', icon: '\uD83C\uDF96\uFE0F', name: 'Multi-Series Master', desc: 'Complete 3 different series', check: () => completedSeries >= 3, progress: () => Math.min(completedSeries, 3), max: 3 },
    { id: 'all_series', icon: '\uD83D\uDC51', name: 'Universe Master', desc: 'Complete every series', check: () => completedSeries === totalSeries && totalSeries > 0, progress: () => Math.min(completedSeries, totalSeries), max: Math.max(totalSeries, 1) },
    { id: 'diverse', icon: '\uD83C\uDF0D', name: 'Diverse Taste', desc: 'Own at least one issue from every series', check: () => seriesWithOwned === totalSeries && totalSeries > 0, progress: () => Math.min(seriesWithOwned, totalSeries), max: Math.max(totalSeries, 1) },
    { id: 'monthly', icon: '\uD83D\uDCC5', name: 'Dedicated Subscriber', desc: 'Own issues from 3 different months', check: () => distinctMonths >= 3, progress: () => Math.min(distinctMonths, 3), max: 3 },
    { id: 'veteran', icon: '\uD83C\uDF93', name: 'Veteran Collector', desc: 'Own issues from 6 different months', check: () => distinctMonths >= 6, progress: () => Math.min(distinctMonths, 6), max: 6 },
    { id: 'variant_first', icon: '🎨', name: 'Art Appreciator', desc: 'Own your first variant cover', check: () => ownedVariants >= 1, progress: () => Math.min(ownedVariants, 1), max: 1 },
    { id: 'variant_10', icon: '🖼️', name: 'Variant Hunter', desc: 'Own 10 variant covers', check: () => ownedVariants >= 10, progress: () => Math.min(ownedVariants, 10), max: 10 },
    { id: 'variant_25', icon: '🃏', name: 'Cover Connoisseur', desc: 'Own 25 variant covers', check: () => ownedVariants >= 25, progress: () => Math.min(ownedVariants, 25), max: 25 },
    { id: 'variant_50', icon: '💎', name: 'Variant Vault', desc: 'Own 50 variant covers', check: () => ownedVariants >= 50, progress: () => Math.min(ownedVariants, 50), max: 50 },
    { id: 'variant_100', icon: '👑', name: 'Variant Royalty', desc: 'Own 100 variant covers', check: () => ownedVariants >= 100, progress: () => Math.min(ownedVariants, 100), max: 100 },
    { id: 'variant_quarter', icon: '🌅', name: 'Quarter Covered', desc: 'Own 25% of all variant covers', check: () => variantPct >= 25, progress: () => variantPct, max: 100 },
    { id: 'variant_complete', icon: '🏅', name: 'Variant Master', desc: 'Own every variant cover', check: () => variantPct === 100 && totalVariants > 0, progress: () => variantPct, max: 100 },
  ];

  const unlockedCount = BADGES.filter(b => b.check()).length;

  // Summary
  let html = '<div class="achievements-summary" role="status" aria-label="Achievement progress">';
  html += '<div class="trophy-icon" aria-hidden="true">\uD83C\uDFC6</div>';
  html += '<div><div class="trophy-stat">' + unlockedCount + ' / ' + BADGES.length + '</div>';
  html += '<div class="trophy-label">Achievements Unlocked</div></div>';
  html += '</div>';

  // Badges grid
  html += '<div class="badges-grid" role="list">';
  BADGES.forEach(b => {
    const unlocked = b.check();
    const prog = b.progress();
    const progPct = b.max > 0 ? Math.min(Math.round((prog / b.max) * 100), 100) : 0;
    html += '<div class="badge-card ' + (unlocked ? 'unlocked' : 'locked') + '" role="listitem" aria-label="' + b.name + ', ' + (unlocked ? 'unlocked' : 'locked — ' + progPct + '% progress') + '">';
    html += '<div class="badge-icon" aria-hidden="true">' + b.icon + '</div>';
    html += '<div class="badge-info">';
    html += '<div class="badge-name">' + b.name + '</div>';
    html += '<div class="badge-desc">' + b.desc + '</div>';
    if (!unlocked) {
      html += '<div class="badge-progress" role="progressbar" aria-valuenow="' + prog + '" aria-valuemin="0" aria-valuemax="' + b.max + '" aria-label="Progress towards ' + b.name + '"><div class="badge-progress-fill" style="width:' + progPct + '%"></div></div>';
    }
    html += '</div>';
    if (unlocked) {
      html += '<svg class="badge-check" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    }
    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

function renderMedia() {
  // Update collection stats
  const released = ALL_ISSUES.filter(i => isReleased(i.date));
  const ownedIssues = released.filter(i => !!owned[issueKey(i)]);
  const ownedCount = ownedIssues.length;
  const totalReleased = released.length;
  const pct = totalReleased > 0 ? Math.round((ownedCount / totalReleased) * 100) : 0;

  // Get unique series
  const uniqueSeries = new Set(released.map(i => i.series)).size;

  // Get first and latest release dates
  const releasedDates = released.map(i => parseLocalDate(i.date)).sort((a, b) => a - b);
  const firstDate = releasedDates.length > 0 ? releasedDates[0].toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '–';
  const latestDate = releasedDates.length > 0 ? releasedDates[releasedDates.length - 1].toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '–';

  document.getElementById('mediaTotalIssues').textContent = totalReleased;
  document.getElementById('mediaOwnedIssues').textContent = ownedCount;
  document.getElementById('mediaCompletionPct').textContent = pct + '%';
  document.getElementById('mediaUniqueSeries').textContent = uniqueSeries;
  document.getElementById('mediaFirstIssueDate').textContent = firstDate;
  document.getElementById('mediaLatestIssueDate').textContent = latestDate;

  // Render creator spotlight
  const creatorGrid = document.getElementById('creatorSpotlightGrid');
  creatorGrid.innerHTML = '';
  SERIES_INFO.forEach(series => {
    const card = document.createElement('div');
    card.className = 'creator-card';
    card.innerHTML = `
      <div class="creator-card-series">${series.name}</div>
      <div class="creator-card-type">${series.type}</div>
      <div class="creator-card-role"><strong>Writer:</strong> ${series.writer}</div>
      <div class="creator-card-role"><strong>Artist:</strong> ${series.artist}</div>
      <div class="creator-card-desc">${series.description}</div>
    `;
    creatorGrid.appendChild(card);
  });
}

function renderAnalytics() {
  const container = document.getElementById('analyticsContainer');
  container.innerHTML = '';

  const released = ALL_ISSUES.filter(i => isReleased(i.date));
  const ownedCount = released.filter(i => owned[issueKey(i)]).length;
  const totalReleased = released.length;
  const pct = totalReleased > 0 ? Math.round((ownedCount / totalReleased) * 100) : 0;

  // Build series stats
  const seriesStats = {};
  ALL_ISSUES.forEach(i => {
    if (!isReleased(i.date)) return;
    if (!seriesStats[i.series]) seriesStats[i.series] = { total: 0, owned: 0 };
    seriesStats[i.series].total++;
    if (owned[issueKey(i)]) seriesStats[i.series].owned++;
  });

  // Build monthly acquisition data
  const months = {};
  ALL_ISSUES.forEach(i => {
    if (!isReleased(i.date)) return;
    const d = parseLocalDate(i.date);
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    if (!months[key]) months[key] = { total: 0, owned: 0 };
    months[key].total++;
    if (owned[issueKey(i)]) months[key].owned++;
  });

  const grid = document.createElement('div');
  grid.className = 'analytics-grid';

  // === Donut Chart Card ===
  const donutCard = document.createElement('div');
  donutCard.className = 'analytics-card';
  const r = 70, stroke = 14, circ = 2 * Math.PI * r;
  const dashOffset = circ - (pct / 100) * circ;
  donutCard.innerHTML = `<h3>Collection Progress</h3>
    <div style="display:flex;justify-content:center;">
      <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="${pct}% collection complete">
        <circle cx="90" cy="90" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${stroke}"/>
        <circle cx="90" cy="90" r="${r}" fill="none" stroke="#22c55e" stroke-width="${stroke}" stroke-linecap="round"
          stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 90 90)" style="transition:stroke-dashoffset 0.8s ease;"/>
        <text aria-hidden="true" x="90" y="82" text-anchor="middle" fill="var(--text-primary)" class="donut-center" font-size="32" font-weight="700">${pct}%</text>
        <text aria-hidden="true" x="90" y="104" text-anchor="middle" fill="var(--text-muted)" font-size="12">${ownedCount} / ${totalReleased}</text>
      </svg>
    </div>
    <div class="analytics-stats-row" style="margin-top:12px;">
      <div class="stat-big"><div class="stat-big-number" style="color:#22c55e;">${ownedCount}</div><div class="stat-big-label">Owned</div></div>
      <div class="stat-big"><div class="stat-big-number" style="color:#ef4444;">${totalReleased - ownedCount}</div><div class="stat-big-label">Missing</div></div>
      <div class="stat-big"><div class="stat-big-number">${ALL_ISSUES.length}</div><div class="stat-big-label">Total Issues</div></div>
    </div>`;
  grid.appendChild(donutCard);

  // === Series Breakdown Card ===
  const seriesCard = document.createElement('div');
  seriesCard.className = 'analytics-card';
  let seriesHtml = '<h3>Series Breakdown</h3>';
  Object.keys(seriesStats).sort((a,b) => {
    const pa = seriesStats[a].total > 0 ? seriesStats[a].owned / seriesStats[a].total : 0;
    const pb = seriesStats[b].total > 0 ? seriesStats[b].owned / seriesStats[b].total : 0;
    return pb - pa;
  }).forEach(s => {
    const st = seriesStats[s];
    const pctS = st.total > 0 ? Math.round((st.owned / st.total) * 100) : 0;
    const color = SERIES_COLORS[s] || '#555';
    seriesHtml += `<div class="series-bar-row">
      <div class="series-bar-label" title="${s}">${s.replace('Absolute ','')}</div>
      <div class="series-bar-track"><div class="series-bar-fill" style="width:${pctS}%;background:${color};"></div></div>
      <div class="series-bar-count">${st.owned}/${st.total}</div>
    </div>`;
  });
  seriesCard.innerHTML = seriesHtml;
  grid.appendChild(seriesCard);

  // === Timeline Card ===
  const timeCard = document.createElement('div');
  timeCard.className = 'analytics-card full-width';
  const sortedMonths = Object.keys(months).sort();
  const maxTotal = Math.max(...sortedMonths.map(k => months[k].total), 1);
  let barsHtml = '';
  let labelsHtml = '';
  sortedMonths.forEach(k => {
    const m = months[k];
    const h = Math.round((m.total / maxTotal) * 100);
    const oh = m.total > 0 ? Math.round((m.owned / m.total) * h) : 0;
    const label = new Date(k + '-01').toLocaleDateString('en-US', {month:'short', year:'2-digit'});
    barsHtml += `<div class="timeline-bar" style="height:${h}px;background:rgba(255,255,255,0.08);">
      <div style="position:absolute;bottom:0;left:0;right:0;height:${oh}px;background:#22c55e;border-radius:3px 3px 0 0;"></div>
      <div class="timeline-tooltip">${label}: ${m.owned}/${m.total} owned</div>
    </div>`;
    labelsHtml += `<span>${label}</span>`;
  });
  timeCard.innerHTML = `<h3>Monthly Release Timeline</h3>
    <div class="timeline-row">${barsHtml}</div>
    <div class="timeline-labels">${labelsHtml}</div>`;
  grid.appendChild(timeCard);

  // === Spending Summary Card ===
  let totalSpent = 0;
  let itemsWithPrices = 0;
  const spendingBySeriesMap = {};
  ALL_ISSUES.forEach(i => {
    const k = issueKey(i);
    const price = getPrice(k);
    if (price) {
      totalSpent += price;
      itemsWithPrices++;
      if (!spendingBySeriesMap[i.series]) spendingBySeriesMap[i.series] = 0;
      spendingBySeriesMap[i.series] += price;
    }
    const varSpent = (typeof getTotalVariantSpent === 'function' ? getTotalVariantSpent(k) : 0);
    if (varSpent > 0) {
      totalSpent += varSpent;
      if (!spendingBySeriesMap[i.series]) spendingBySeriesMap[i.series] = 0;
      spendingBySeriesMap[i.series] += varSpent;
    }
  });

  const avgPrice = itemsWithPrices > 0 ? (totalSpent / itemsWithPrices).toFixed(2) : 0;
  const spendingCard = document.createElement('div');
  spendingCard.className = 'analytics-card';
  let spendingHtml = '<h3>Spending Tracker</h3><div class="spending-summary">';
  spendingHtml += `<div class="spending-stat">
    <span class="spending-stat-label">Total Spent</span>
    <span class="spending-stat-value">$${totalSpent.toFixed(2)}</span>
  </div>`;
  spendingHtml += `<div class="spending-stat">
    <span class="spending-stat-label">Average Price</span>
    <span class="spending-stat-value">$${avgPrice}</span>
  </div>`;

  if (Object.keys(spendingBySeriesMap).length > 0) {
    let mostExpensiveSeries = '';
    let mostExpensive = 0;
    Object.keys(spendingBySeriesMap).forEach(s => {
      if (spendingBySeriesMap[s] > mostExpensive) {
        mostExpensive = spendingBySeriesMap[s];
        mostExpensiveSeries = s;
      }
    });
    spendingHtml += `<div class="spending-stat">
      <span class="spending-stat-label">Top Spending</span>
      <span class="spending-stat-value">${mostExpensiveSeries.replace('Absolute ', '')}</span>
    </div>`;

    spendingHtml += '<div class="spending-by-series"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:8px;">By Series</div>';
    Object.keys(spendingBySeriesMap).sort((a,b) => spendingBySeriesMap[b] - spendingBySeriesMap[a]).forEach(s => {
      const spent = spendingBySeriesMap[s];
      spendingHtml += `<div class="spending-series-row">
        <span class="spending-series-label">${s.replace('Absolute ', '')}</span>
        <span class="spending-series-total">$${spent.toFixed(2)}</span>
      </div>`;
    });
    spendingHtml += '</div>';
  }
  spendingHtml += '</div>';
  spendingCard.innerHTML = spendingHtml;
  grid.appendChild(spendingCard);

  // === Price Guide Card ===
  const pgCard = document.createElement('div');
  pgCard.className = 'analytics-card';
  let coverTotal = 0, mvTotal = 0, mvCount = 0, variantTotal = 0, variantValued = 0;
  const seriesCover = {}, seriesMV = {};
  ALL_ISSUES.forEach(i => {
    const k = issueKey(i);
    if (owned[k]) {
      const cp = getCoverPrice(k);
      coverTotal += cp;
      if (!seriesCover[i.series]) seriesCover[i.series] = 0;
      seriesCover[i.series] += cp;
      const mv = getMarketValue(k);
      if (mv) {
        mvTotal += mv;
        mvCount++;
        if (!seriesMV[i.series]) seriesMV[i.series] = 0;
        seriesMV[i.series] += mv;
      }
    }
    // Add variant values
    const vv = (typeof getTotalVariantValue === 'function' ? getTotalVariantValue(k) : 0);
    if (vv > 0) {
      variantTotal += vv;
      variantValued++;
      if (!seriesMV[i.series]) seriesMV[i.series] = 0;
      seriesMV[i.series] += vv;
    }
  });
  const grandTotal = (mvCount > 0 ? mvTotal : coverTotal) + variantTotal;
  const roi = coverTotal > 0 ? ((grandTotal - coverTotal) / coverTotal * 100).toFixed(1) : '0.0';
  const roiClass = parseFloat(roi) < 0 ? ' negative' : '';

  let pgHtml = '<h3>Price Guide</h3><div class="price-guide-summary">';
  pgHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Cover Price Total</span><span class="price-guide-stat-value">$${coverTotal.toFixed(2)}</span></div>`;
  if (mvCount > 0) {
    pgHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Market Value Total</span><span class="price-guide-stat-value">$${mvTotal.toFixed(2)}</span></div>`;
    pgHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">ROI vs Cover</span><span class="price-guide-stat-value${roiClass}">${roi}%</span></div>`;
    pgHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Issues Valued</span><span class="price-guide-stat-value">${mvCount} / ${ownedCount}</span></div>`;
  }
  if (variantTotal > 0) {
    pgHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Variant Value</span><span class="price-guide-stat-value">$${variantTotal.toFixed(2)}</span></div>`;
    pgHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Grand Total</span><span class="price-guide-stat-value">$${grandTotal.toFixed(2)}</span></div>`;
  }
  pgHtml += '</div>';
  if (_priceGuideData && _priceGuideData._meta) {
    pgHtml += `<div style="font-size:11px;color:var(--text-muted);margin-top:12px;">Prices last updated: ${_priceGuideData._meta.lastUpdated}</div>`;
  }

  // Series value bars
  const seriesNames = Object.keys(seriesCover).sort((a,b) => (seriesMV[b]||seriesCover[b]) - (seriesMV[a]||seriesCover[a]));
  if (seriesNames.length > 0) {
    const maxVal = Math.max(...seriesNames.map(s => seriesMV[s] || seriesCover[s]));
    pgHtml += '<div class="value-bar-container"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:8px;">Value by Series</div>';
    seriesNames.forEach(s => {
      const val = seriesMV[s] || seriesCover[s];
      const pct = maxVal > 0 ? (val / maxVal * 100) : 0;
      const color = typeof SERIES_COLORS !== 'undefined' ? (SERIES_COLORS[s] || '#555') : '#555';
      pgHtml += `<div class="value-bar-row">
        <span class="value-bar-label">${s.replace('Absolute ', '')}</span>
        <div class="value-bar-track"><div class="value-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <span class="value-bar-amount">$${val.toFixed(2)}</span>
      </div>`;
    });
    pgHtml += '</div>';
  }

  // External links
  pgHtml += '<div class="price-guide-links">';
  pgHtml += '<a class="price-guide-link" href="https://gocollect.com/comics" target="_blank" rel="noopener">GoCollect</a>';
  pgHtml += '<a class="price-guide-link" href="https://www.pricecharting.com/brand/comic-books/dc" target="_blank" rel="noopener">PriceCharting</a>';
  pgHtml += '<a class="price-guide-link" href="https://covrprice.com/" target="_blank" rel="noopener">CovrPrice</a>';
  pgHtml += '<a class="price-guide-link" href="https://comicspriceguide.com/publishers/dc" target="_blank" rel="noopener">ComicsPriceGuide</a>';
  pgHtml += '</div>';

  pgCard.innerHTML = pgHtml;
  grid.appendChild(pgCard);

  // === Variant Collection Card ===
  const variantCard = document.createElement('div');
  variantCard.className = 'analytics-card';

  let totalVariants = 0, ownedVariants = 0;
  const variantSeriesStats = {};

  ALL_ISSUES.forEach(i => {
    const slug = makeSlug(i.title);
    const variants = _variantData[slug];
    if (variants && variants.length > 0) {
      totalVariants += variants.length;
      if (!variantSeriesStats[i.series]) variantSeriesStats[i.series] = { total: 0, owned: 0 };
      variantSeriesStats[i.series].total += variants.length;
      const k = issueKey(i);
      const ov = window.countOwnedVariants(k);
      ownedVariants += ov;
      variantSeriesStats[i.series].owned += ov;
    }
  });

  const variantPct = totalVariants > 0 ? Math.round((ownedVariants / totalVariants) * 100) : 0;

  let variantHtml = '<h3>Variant Collection</h3>';
  variantHtml += '<div class="price-guide-summary">';
  variantHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Total Variants Available</span><span class="price-guide-stat-value">${totalVariants}</span></div>`;
  variantHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Variants Owned</span><span class="price-guide-stat-value">${ownedVariants}</span></div>`;
  variantHtml += `<div class="price-guide-stat"><span class="price-guide-stat-label">Completion</span><span class="price-guide-stat-value">${variantPct}%</span></div>`;
  variantHtml += '</div>';

  // Variant completion bar
  variantHtml += '<div style="margin:12px 0;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:8px;">Overall Progress</div>';
  variantHtml += `<div style="height:8px;background:var(--bg-secondary);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${variantPct}%;background:var(--accent-purple);transition:width 0.3s ease;"></div></div>`;
  variantHtml += '</div>';

  // Per-series variant breakdown
  const variantSeriesNames = Object.keys(variantSeriesStats).sort((a,b) => variantSeriesStats[b].owned - variantSeriesStats[a].owned);
  if (variantSeriesNames.length > 0) {
    const topSeries = variantSeriesNames[0];
    variantHtml += `<div style="font-size:11px;color:var(--text-muted);margin:12px 0 6px 0;">Top Series: ${topSeries.replace('Absolute ', '')} (${variantSeriesStats[topSeries].owned} / ${variantSeriesStats[topSeries].total})</div>`;

    variantHtml += '<div class="variant-series-breakdown">';
    variantSeriesNames.forEach(s => {
      const stats = variantSeriesStats[s];
      const seriesPct = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
      variantHtml += `<div class="variant-series-row">
        <span class="variant-series-label">${s.replace('Absolute ', '')}</span>
        <div style="flex:1;display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${seriesPct}%;background:var(--accent-cyan);"></div></div>
          <span style="font-size:10px;color:var(--text-muted);min-width:45px;text-align:right;">${stats.owned} / ${stats.total}</span>
        </div>
      </div>`;
    });
    variantHtml += '</div>';
  }

  variantCard.innerHTML = variantHtml;
  grid.appendChild(variantCard);

  container.appendChild(grid);
}

let currentFilter = 'all';
let currentSearch = '';
let calendarShowAll = false;

// Tab switching with keyboard navigation (arrow keys)
function switchTab(tab) {
  if (!tab || !tab.dataset || !tab.dataset.tab) return;
  var tabPanel = document.getElementById('tab-' + tab.dataset.tab);
  if (!tabPanel) return;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');
  tab.setAttribute('tabindex', '0');
  tabPanel.classList.add('active');
  tab.focus();
  // Persist tab in URL hash
  history.replaceState(null, '', '#' + tab.dataset.tab);
  // Sync mobile bottom nav
  syncBottomNav(tab.dataset.tab);
  // Render tab content dynamically
  if (tab.dataset.tab === 'media') renderMedia();
  else if (tab.dataset.tab === 'analytics') renderAnalytics();
  else if (tab.dataset.tab === 'achievements') renderAchievements();
  else if (tab.dataset.tab === 'arcs') renderArcs();
}

// ── Mobile Bottom Nav ──
const primaryBnavTabs = ['collection', 'calendar', 'analytics', 'achievements'];
function syncBottomNav(tabName) {
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const overlay = document.getElementById('moreMenuOverlay');
  if (overlay) overlay.classList.remove('open');
  if (primaryBnavTabs.includes(tabName)) {
    const btn = document.querySelector('.bnav-btn[data-bnav="' + tabName + '"]');
    if (btn) {
      btn.classList.add('active');
      // Auto-scroll active tab into view on mobile
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  } else {
    // A "more" tab is active — highlight the More button
    const moreBtn = document.querySelector('.bnav-btn[data-bnav="more"]');
    if (moreBtn) {
      moreBtn.classList.add('active');
      moreBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }
  // Sync more menu active states
  document.querySelectorAll('.more-menu-item').forEach(m => {
    m.classList.toggle('active', m.dataset.bnav === tabName);
  });
}

document.querySelectorAll('.bnav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.bnav;
    if (tabName === 'more') {
      const overlay = document.getElementById('moreMenuOverlay');
      overlay.classList.toggle('open');
      return;
    }
    if (tabName === 'scanner') {
      // Trigger the scanner modal — scanner.js exposes _openScanner on window
      if (typeof window._openScanner === 'function') window._openScanner();
      return;
    }
    const navTab = document.querySelector('.nav-tab[data-tab="' + tabName + '"]');
    if (navTab) switchTab(navTab);
  });
});

document.querySelectorAll('.more-menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const navTab = document.querySelector('.nav-tab[data-tab="' + btn.dataset.bnav + '"]');
    if (navTab) switchTab(navTab);
  });
});

// Close more menu when tapping the overlay background
document.getElementById('moreMenuOverlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove('open');
  }
});

const allTabs = Array.from(document.querySelectorAll('.nav-tab'));
allTabs.forEach((tab, idx) => {
  if (idx > 0) tab.setAttribute('tabindex', '-1');
  tab.addEventListener('click', () => switchTab(tab));
  tab.addEventListener('keydown', (e) => {
    let target = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      target = allTabs[(idx + 1) % allTabs.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      target = allTabs[(idx - 1 + allTabs.length) % allTabs.length];
    } else if (e.key === 'Home') {
      e.preventDefault();
      target = allTabs[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      target = allTabs[allTabs.length - 1];
    }
    if (target) switchTab(target);
  });
});

document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentFilter = btn.dataset.filter;
    renderCollection(currentFilter, currentSearch);
  });
});

// Mark All Released as Owned
document.getElementById('markAllOwned').addEventListener('click', () => {
  const released = ALL_ISSUES.filter(i => isReleased(i.date));
  const unowned = released.filter(i => !owned[issueKey(i)]);
  if (unowned.length === 0) {
    // All already owned — offer to unmark all instead
    if (confirm('You already own all ' + released.length + ' released issues! Do you want to unmark them all?')) {
      released.forEach(i => { delete owned[issueKey(i)]; });
      saveOwned();
      renderCollection(currentFilter, currentSearch);
      renderStats();
      renderArcs();
      renderAnalytics();
      renderAchievements();
    }
    return;
  }
  if (confirm('Mark all ' + unowned.length + ' released issues as owned? (' + released.length + ' total released)')) {
    released.forEach(i => { owned[issueKey(i)] = true; });
    saveOwned();
    renderCollection(currentFilter, currentSearch);
    renderStats();
    renderArcs();
    renderAnalytics();
    renderAchievements();
  }
});

// Unmark All Owned
document.getElementById('unmarkAllOwned').addEventListener('click', () => {
  const ownedKeys = Object.keys(owned);
  if (ownedKeys.length === 0) {
    alert('You don\u2019t have any issues marked as owned.');
    return;
  }
  if (confirm('Are you sure you want to unmark all ' + ownedKeys.length + ' owned issues? This cannot be undone.')) {
    ownedKeys.forEach(k => { delete owned[k]; });
    saveOwned();
    renderCollection(currentFilter, currentSearch);
    renderStats();
    renderArcs();
    renderAnalytics();
    renderAchievements();
  }
});

document.querySelectorAll('[data-calendar-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-calendar-filter]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    calendarShowAll = btn.dataset.calendarFilter === 'all';
    renderCalendar(calendarShowAll);
  });
});

// Reading order type switcher
document.querySelectorAll('[data-reading-order]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-reading-order]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentReadingOrder = btn.dataset.readingOrder;
    renderArcs();
  });
});

document.getElementById('jumpToToday').addEventListener('click', () => {
  // Switch to All Dates first so today is visible
  if (!calendarShowAll) {
    document.querySelectorAll('[data-calendar-filter]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    const allBtn = document.querySelector('[data-calendar-filter="all"]');
    if (allBtn) { allBtn.classList.add('active'); allBtn.setAttribute('aria-pressed', 'true'); }
    calendarShowAll = true;
    renderCalendar(true);
  }
  const todayEl = document.querySelector('.calendar-item.today');
  if (todayEl) {
    todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    todayEl.style.outline = '2px solid var(--accent-gold)';
    setTimeout(() => { todayEl.style.outline = ''; }, 2000);
  } else {
    // No release today — scroll to nearest upcoming
    const upcoming = document.querySelector('.calendar-item:not(.past)');
    if (upcoming) upcoming.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

let _searchDebounce = null;
document.getElementById('searchInput').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => renderCollection(currentFilter, currentSearch), 150);
});

// ── Feature 1: Share Collection ──
function generateShareText() {
  const released = ALL_ISSUES.filter(i => isReleased(i.date));
  const ownedCount = ALL_ISSUES.filter(i => owned[issueKey(i)]).length;
  const pct = released.length > 0 ? Math.round((ownedCount / released.length) * 100) : 0;

  const seriesNames = getSeriesNames();
  let text = '🦇 My DC Absolute Universe Collection\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  text += ownedCount + '/' + released.length + ' issues collected (' + pct + '%)\n\n';

  seriesNames.forEach(sName => {
    const allInSeries = ALL_ISSUES.filter(i => i.series === sName && isReleased(i.date));
    if (allInSeries.length === 0) return;
    const ownedInSeries = allInSeries.filter(i => owned[issueKey(i)]).length;
    text += '✅ ' + sName + ': ' + ownedInSeries + '/' + allInSeries.length + '\n';
  });

  text += '\nTrack yours at absolutedctracker.com';
  return text;
}

// Defer share/import-export modal listeners — modal HTML is below this script block
