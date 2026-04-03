let owned = {};
let ownedTrades = {};
try {
  const stored = localStorage.getItem('au_owned');
  if (stored) {
    owned = JSON.parse(stored);
  } else {
    // First visit: initialize from Google Sheet data
    owned = Object.assign({}, SHEET_OWNED);
  }
  ownedTrades = JSON.parse(localStorage.getItem('au_trades') || '{}');
} catch(e) {
  owned = Object.assign({}, SHEET_OWNED);
}

function _showStorageError() {
  if (document.getElementById('storageWarning')) return;
  var w = document.createElement('div');
  w.id = 'storageWarning';
  w.style.cssText = 'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:#b91c1c;color:#fff;padding:10px 20px;border-radius:8px;z-index:9999;font-size:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
  w.textContent = 'Storage full — your changes may not be saved. Try clearing old browser data.';
  document.body.appendChild(w);
  setTimeout(function(){ w.remove(); }, 6000);
}
function saveOwned() { try { localStorage.setItem('au_owned', JSON.stringify(owned)); } catch(e){ _showStorageError(); } }
function saveTrades() { try { localStorage.setItem('au_trades', JSON.stringify(ownedTrades)); } catch(e){ _showStorageError(); } }

// Market Value localStorage model
let marketValues = {};
try { marketValues = JSON.parse(localStorage.getItem('au_market_values') || '{}'); } catch(e) { marketValues = {}; }
function saveMarketValues() { try { localStorage.setItem('au_market_values', JSON.stringify(marketValues)); } catch(e){} }
function setMarketValue(key, val) { var v = parseFloat(val); if (v > 0) marketValues[key] = v; else delete marketValues[key]; saveMarketValues(); }
function getMarketValue(key) {
  if (marketValues[key]) return marketValues[key];
  if (_priceGuideData && _priceGuideData.issues && _priceGuideData.issues[key]) return _priceGuideData.issues[key].market;
  return null;
}

// Variant Market Value & Price functions are defined in firebase-config.js (shared across pages)

// Pull List & Spending Tracker Functions
let pullSeries = {};
let pullIssues = {};
let prices = {};

try {
  pullSeries = JSON.parse(localStorage.getItem('au_pull_series') || '{}');
  pullIssues = JSON.parse(localStorage.getItem('au_pull_issues') || '{}');
  prices = JSON.parse(localStorage.getItem('au_prices') || '{}');
} catch(e) {
  pullSeries = {};
  pullIssues = {};
  prices = {};
}

function savePullSeries() { try { localStorage.setItem('au_pull_series', JSON.stringify(pullSeries)); } catch(e){} }
function savePullIssues() { try { localStorage.setItem('au_pull_issues', JSON.stringify(pullIssues)); } catch(e){} }
function savePrices() { try { localStorage.setItem('au_prices', JSON.stringify(prices)); } catch(e){} }

function getPullSeries() { return pullSeries; }
function getPullIssues() { return pullIssues; }
function getPrices() { return prices; }

function isSeriesOnPull(seriesName) { return !!pullSeries[seriesName]; }
function isIssueOnPull(issueKey) { return !!pullIssues[issueKey]; }
function isOnPullList(issueKey, seriesName) {
  return isSeriesOnPull(seriesName) || isIssueOnPull(issueKey);
}

function toggleSeriesPull(seriesName) {
  if (pullSeries[seriesName]) delete pullSeries[seriesName];
  else pullSeries[seriesName] = true;
  savePullSeries();
}

function toggleIssuePull(issueKey) {
  if (pullIssues[issueKey]) delete pullIssues[issueKey];
  else pullIssues[issueKey] = true;
  savePullIssues();
}

function setPrice(issueKey, price) {
  const p = parseFloat(price);
  if (p > 0) prices[issueKey] = p;
  else delete prices[issueKey];
  savePrices();
}

function getPrice(issueKey) {
  if (prices[issueKey]) return prices[issueKey];
  // Default to cover price for owned issues (most are $4.99)
  if (owned[issueKey] && typeof getCoverPrice === 'function') return getCoverPrice(issueKey);
  return null;
}

// Variant cover data cache — loaded once from variants.json
let _variantData = {};
let _variantDataLoaded = false;
let _variantLoadFailed = false;
fetch('variants.json?v=2').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
  _variantData = d;
  _variantDataLoaded = true;
  // Re-render collection to show variant badges now that data is loaded
  if (typeof renderCollection === 'function') renderCollection(currentFilter, currentSearch);
}).catch(e => {
  _variantDataLoaded = true;
  _variantLoadFailed = true;
  console.warn('[variants] Failed to load variant data:', e);
});

// Load price guide data
let _priceGuideData = null;
let _priceGuideLoadFailed = false;
fetch('prices.json?v=2').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
  _priceGuideData = d;
  renderStats();
  renderAnalytics();
}).catch(e => {
  _priceGuideLoadFailed = true;
  console.warn('[prices] Failed to load price guide:', e);
});

function issueKey(issue) { return issue.series + '|' + issue.issue; }
function makeSlug(name) { return name.toLowerCase().replace(/[:#]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); }

function tradeKey(t) { return t.title; }

// Parse YYYY-MM-DD as local date (not UTC) to avoid timezone off-by-one
function parseLocalDate(dateStr) { const [y,m,d] = dateStr.split('-').map(Number); return new Date(y, m-1, d); }
function isReleased(dateStr) { return parseLocalDate(dateStr) <= getToday(); }
function isUpcoming(dateStr) { return parseLocalDate(dateStr) > getToday(); }

const checkSvg = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Escape HTML entities to prevent XSS in innerHTML
function _escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getSeriesNames() {
  const s = new Set();
  ALL_ISSUES.forEach(i => s.add(i.series));
  return [...s];
}

// ── Shopping Cart (shared with scanner) ──
let collectionCart = [];
const COLLECTION_CART_KEY = 'au_scanner_cart'; // Same key as scanner to share state

function loadCollectionCart() {
  try { collectionCart = JSON.parse(localStorage.getItem(COLLECTION_CART_KEY) || '[]'); } catch(e) { collectionCart = []; }
}
function saveCollectionCart() {
  try { localStorage.setItem(COLLECTION_CART_KEY, JSON.stringify(collectionCart)); }
  catch(e) { if (typeof _showStorageError === 'function') _showStorageError(); }
}

function isInCart(issueKey) {
  for (var i = 0; i < collectionCart.length; i++) {
    if (collectionCart[i].key === issueKey && !collectionCart[i].variant) return true;
  }
  return false;
}

function toggleCartItem(issue) {
  var key = issueKey(issue);
  // Check if already in cart
  for (var i = 0; i < collectionCart.length; i++) {
    if (collectionCart[i].key === key && !collectionCart[i].variant) {
      collectionCart.splice(i, 1);
      saveCollectionCart();
      return false; // removed
    }
  }
  // Add to cart
  collectionCart.push({
    key: key,
    title: issue.title,
    slug: makeSlug(issue.title),
    type: 'issue',
    variant: null,
    variantName: null,
    price: 4.99,
    alreadyOwned: !!owned[key]
  });
  saveCollectionCart();
  return true; // added
}

function getCollectionCartTotal() {
  var total = 0;
  for (var i = 0; i < collectionCart.length; i++) total += collectionCart[i].price || 0;
  return total;
}

function checkoutCollectionCart() {
  var count = 0;
  for (var i = 0; i < collectionCart.length; i++) {
    var item = collectionCart[i];
    if (!owned[item.key]) {
      owned[item.key] = true;
      count++;
    }
  }
  if (count > 0) saveOwned();
  collectionCart = [];
  saveCollectionCart();
  return count;
}

function clearCollectionCart() {
  collectionCart = [];
  saveCollectionCart();
}

// Load cart on startup
loadCollectionCart();

// ── Variant Picker for Cart ──
var _pickerIssue = null;      // current issue object
var _pickerKey = null;         // issueKey of current issue
var _pickerSlug = null;        // slug for variant lookup
var _pickerSelected = {};      // { "base": true, "0": true, "1": true, ... }
var _pickerTrigger = null;     // element that opened the picker (for focus restoration)

// Close variant picker on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && _pickerIssue) closeVariantPicker();
});

function isVariantInCart(iKey, variantId) {
  for (var i = 0; i < collectionCart.length; i++) {
    if (collectionCart[i].key === iKey && collectionCart[i].variant === variantId) return true;
  }
  return false;
}

function openVariantPicker(issue) {
  _pickerTrigger = document.activeElement;
  _pickerIssue = issue;
  _pickerKey = issueKey(issue);
  _pickerSlug = makeSlug(issue.title);
  _pickerSelected = {};

  var overlay = document.getElementById('variantPickerOverlay');
  var grid = document.getElementById('variantPickerGrid');
  var title = document.getElementById('variantPickerTitle');
  if (!overlay || !grid) return;

  if (title) title.textContent = issue.title;
  grid.innerHTML = '';

  var variants = _variantData[_pickerSlug] || [];
  var baseCover = (typeof coverMap !== 'undefined' && coverMap[issue.title]) ? coverMap[issue.title] : '';
  var baseOwned = !!owned[_pickerKey];
  var baseInCart = isInCart(_pickerKey);

  // Base cover card
  var baseCard = document.createElement('div');
  baseCard.className = 'variant-pick-card' + (baseInCart ? ' vp-in-cart' : '');
  baseCard.dataset.vid = 'base';
  var baseBadge = '';
  if (baseOwned) baseBadge = '<span class="variant-pick-badge vpb-owned">Owned</span>';
  else if (baseInCart) baseBadge = '<span class="variant-pick-badge vpb-cart">In Cart</span>';
  baseCard.innerHTML = '<div class="variant-pick-img-wrap"><img class="variant-pick-img" src="' + _escHtml(baseCover) + '" alt="Cover A" loading="lazy" onerror="this.style.background=\'linear-gradient(135deg,#1e293b,#334155)\';this.style.objectFit=\'contain\';this.alt=\'Cover A (No Image)\'"></div>' +
    '<div class="variant-pick-check"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
    baseBadge +
    '<div class="variant-pick-info">Cover A (Base)</div>';
  if (!baseInCart) {
    baseCard.addEventListener('click', function() { togglePickerSelection('base', this); });
  }
  grid.appendChild(baseCard);

  // Variant cards
  for (var i = 0; i < variants.length; i++) {
    (function(idx, v) {
      var vid = String(idx);
      var vOwned = typeof isVariantOwned === 'function' && isVariantOwned(_pickerKey, vid);
      var vInCart = isVariantInCart(_pickerKey, vid);
      var card = document.createElement('div');
      card.className = 'variant-pick-card' + (vInCart ? ' vp-in-cart' : '');
      card.dataset.vid = vid;
      var badge = '';
      if (vOwned) badge = '<span class="variant-pick-badge vpb-owned">Owned</span>';
      else if (vInCart) badge = '<span class="variant-pick-badge vpb-cart">In Cart</span>';

      var letterLabel = idx < 26 ? String.fromCharCode(66 + idx) : 'V' + (idx + 2);
      var shortName = v.cover || v.name.replace(/^.*#\d+\s*/, '').replace(/\s*Variant\s*$/i, '') || 'Cover ' + letterLabel;
      card.innerHTML = '<div class="variant-pick-img-wrap"><img class="variant-pick-img" src="' + _escHtml(v.url) + '" alt="' + _escHtml(shortName) + '" loading="lazy" onerror="this.style.background=\'linear-gradient(135deg,#1e293b,#334155)\';this.style.objectFit=\'contain\'"></div>' +
        '<div class="variant-pick-check"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        badge +
        '<div class="variant-pick-info" title="' + _escHtml(v.name) + '">' + _escHtml(shortName) + '</div>';
      if (!vInCart) {
        card.addEventListener('click', function() { togglePickerSelection(vid, this); });
      }
      grid.appendChild(card);
    })(i, variants[i]);
  }

  updatePickerCount();
  overlay.classList.add('open');
}

function closeVariantPicker() {
  var overlay = document.getElementById('variantPickerOverlay');
  if (overlay) overlay.classList.remove('open');
  _pickerIssue = null;
  _pickerKey = null;
  _pickerSlug = null;
  _pickerSelected = {};
  // Restore focus to the element that opened the picker
  if (_pickerTrigger && typeof _pickerTrigger.focus === 'function') {
    _pickerTrigger.focus();
    _pickerTrigger = null;
  }
}

function togglePickerSelection(vid, cardEl) {
  if (_pickerSelected[vid]) {
    delete _pickerSelected[vid];
    cardEl.classList.remove('vp-selected');
  } else {
    _pickerSelected[vid] = true;
    cardEl.classList.add('vp-selected');
  }
  updatePickerCount();
}

function updatePickerCount() {
  var count = Object.keys(_pickerSelected).length;
  var countEl = document.getElementById('variantPickerCount');
  var addBtn = document.getElementById('variantPickerAdd');
  if (countEl) countEl.innerHTML = '<strong>' + count + '</strong> selected';
  if (addBtn) addBtn.disabled = (count === 0);
}

function addPickerSelectionToCart() {
  if (!_pickerIssue || !_pickerKey) return;
  var variants = _variantData[_pickerSlug] || [];
  var added = 0;

  Object.keys(_pickerSelected).forEach(function(vid) {
    if (vid === 'base') {
      // Add base issue
      if (!isInCart(_pickerKey)) {
        collectionCart.push({
          key: _pickerKey,
          title: _pickerIssue.title,
          slug: _pickerSlug,
          type: 'issue',
          variant: null,
          variantName: null,
          price: 4.99,
          alreadyOwned: !!owned[_pickerKey]
        });
        added++;
      }
    } else {
      // Add variant
      var idx = parseInt(vid, 10);
      var v = variants[idx];
      if (v && !isVariantInCart(_pickerKey, vid)) {
        var letterLabel = idx < 26 ? String.fromCharCode(66 + idx) : 'V' + (idx + 2);
        var shortName = v.cover || v.name.replace(/^.*#\d+\s*/, '').replace(/\s*Variant\s*$/i, '') || 'Cover ' + letterLabel;
        collectionCart.push({
          key: _pickerKey,
          title: _pickerIssue.title,
          slug: _pickerSlug,
          type: 'issue',
          variant: vid,
          variantName: shortName,
          variantFullName: v.name,
          price: 4.99,
          alreadyOwned: typeof isVariantOwned === 'function' && isVariantOwned(_pickerKey, vid)
        });
        added++;
      }
    }
  });

  if (added > 0) {
    saveCollectionCart();
    if (typeof updateCartSummaryBar === 'function') updateCartSummaryBar();
    if (typeof renderCollection === 'function') renderCollection(currentFilter, currentSearch);
  }
  closeVariantPicker();
}
