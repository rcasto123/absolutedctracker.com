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
  return prices[issueKey] || null;
}

// Variant cover data cache — loaded once from variants.json
let _variantData = {};
fetch('variants.json?v=2').then(r => r.json()).then(d => {
  _variantData = d;
  // Re-render collection to show variant badges now that data is loaded
  if (typeof renderCollection === 'function') renderCollection(currentFilter, currentSearch);
}).catch(() => { console.warn('[variants] Failed to load variant data — variant features will be unavailable'); });

// Load price guide data
let _priceGuideData = null;
fetch('prices.json').then(r => r.json()).then(d => {
  _priceGuideData = d;
  renderStats();
  renderAnalytics();
}).catch(() => {});

function issueKey(issue) { return issue.series + '|' + issue.issue; }
function makeSlug(name) { return name.toLowerCase().replace(/[:#]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); }

function tradeKey(t) { return t.title; }

// Parse YYYY-MM-DD as local date (not UTC) to avoid timezone off-by-one
function parseLocalDate(dateStr) { const [y,m,d] = dateStr.split('-').map(Number); return new Date(y, m-1, d); }
function isReleased(dateStr) { return parseLocalDate(dateStr) <= getToday(); }
function isUpcoming(dateStr) { return parseLocalDate(dateStr) > getToday(); }

const checkSvg = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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
  localStorage.setItem(COLLECTION_CART_KEY, JSON.stringify(collectionCart));
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
