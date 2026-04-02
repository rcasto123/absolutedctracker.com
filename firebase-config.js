/* firebase-config.js — shared Firebase init (compat SDK) */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyDVq7dXEh8zDS5G6i361UqGLN4ghrlxbHY",
    authDomain: "absolute-universe-tracke-c982d.firebaseapp.com",
    projectId: "absolute-universe-tracke-c982d",
    storageBucket: "absolute-universe-tracke-c982d.firebasestorage.app",
    messagingSenderId: "285053160405",
    appId: "1:285053160405:web:a0ed1cc46992a867328b5c"
  };

  // Initialize Firebase (compat SDK loaded via CDN in HTML)
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Expose globals for other scripts
  window.auth = firebase.auth();
  window.db   = firebase.firestore();

  // Admin email — used by auth-integration.js & admin.html
  window.ADMIN_EMAIL = "robertmcasto@gmail.com";

  /* ── helper: wait for auth to be ready ── */
  window.onAuthReady = function () {
    return new Promise(function (resolve) {
      var unsub = auth.onAuthStateChanged(function (user) {
        unsub();
        resolve(user);
      });
    });
  };

  /* ── helper: check if current user is admin ── */
  window.isCurrentUserAdmin = function () {
    var user = auth.currentUser;
    if (!user) return Promise.resolve(false);
    if (user.email === ADMIN_EMAIL) return Promise.resolve(true);
    return db.collection("admins").doc(user.uid).get()
      .then(function (snap) { return snap.exists; })
      .catch(function () { return false; });
  };

  /* ── Variant ownership localStorage helpers ── */
  var VARIANT_KEY = "au_owned_variants";

  window.getOwnedVariants = function () {
    try {
      var raw = localStorage.getItem(VARIANT_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };

  window.setOwnedVariants = function (obj) {
    try { localStorage.setItem(VARIANT_KEY, JSON.stringify(obj)); } catch (e) {}
  };

  window.toggleVariantOwned = function (issueKey, variantId) {
    var all = getOwnedVariants();
    if (!all[issueKey]) all[issueKey] = {};
    if (all[issueKey][variantId]) {
      delete all[issueKey][variantId];
      if (Object.keys(all[issueKey]).length === 0) delete all[issueKey];
    } else {
      all[issueKey][variantId] = true;
    }
    setOwnedVariants(all);
    return all;
  };

  window.isVariantOwned = function (issueKey, variantId) {
    var all = getOwnedVariants();
    return !!(all[issueKey] && all[issueKey][variantId]);
  };

  window.countOwnedVariants = function (issueKey) {
    var all = getOwnedVariants();
    return all[issueKey] ? Object.keys(all[issueKey]).length : 0;
  };

  /* ── Variant Price & Market Value (shared across pages) ── */
  var _variantPrices = {};
  try { _variantPrices = JSON.parse(localStorage.getItem('au_variant_prices') || '{}'); } catch(e) { _variantPrices = {}; }
  var _variantMVs = {};
  try { _variantMVs = JSON.parse(localStorage.getItem('au_variant_market_values') || '{}'); } catch(e) { _variantMVs = {}; }

  function _saveVP() { try { localStorage.setItem('au_variant_prices', JSON.stringify(_variantPrices)); } catch(e){} }
  function _saveVMV() { try { localStorage.setItem('au_variant_market_values', JSON.stringify(_variantMVs)); } catch(e){} }

  window.setVariantPrice = function(issueKey, variantIdx, val) {
    var v = parseFloat(val);
    if (!_variantPrices[issueKey]) _variantPrices[issueKey] = {};
    if (v > 0) _variantPrices[issueKey][variantIdx] = v;
    else { delete _variantPrices[issueKey][variantIdx]; if (Object.keys(_variantPrices[issueKey]).length === 0) delete _variantPrices[issueKey]; }
    _saveVP();
  };
  window.getVariantPrice = function(issueKey, variantIdx) {
    if (_variantPrices[issueKey] && _variantPrices[issueKey][variantIdx]) return _variantPrices[issueKey][variantIdx];
    return null;
  };
  window.getTotalVariantSpent = function(issueKey) {
    if (!_variantPrices[issueKey]) return 0;
    return Object.values(_variantPrices[issueKey]).reduce(function(sum, v) { return sum + v; }, 0);
  };

  window.setVariantMarketValue = function(issueKey, variantIdx, val) {
    var v = parseFloat(val);
    if (!_variantMVs[issueKey]) _variantMVs[issueKey] = {};
    if (v > 0) _variantMVs[issueKey][variantIdx] = v;
    else { delete _variantMVs[issueKey][variantIdx]; if (Object.keys(_variantMVs[issueKey]).length === 0) delete _variantMVs[issueKey]; }
    _saveVMV();
  };
  window.getVariantMarketValue = function(issueKey, variantIdx) {
    if (_variantMVs[issueKey] && _variantMVs[issueKey][variantIdx]) return _variantMVs[issueKey][variantIdx];
    return null;
  };
  window.getTotalVariantValue = function(issueKey) {
    if (!_variantMVs[issueKey]) return 0;
    return Object.values(_variantMVs[issueKey]).reduce(function(sum, v) { return sum + v; }, 0);
  };

  /* ── Firestore sync helpers ── */
  window.syncOwnedToCloud = function () {
    var user = auth.currentUser;
    if (!user) return Promise.resolve();
    var raw = localStorage.getItem("au_owned");
    var owned = {};
    try { owned = raw ? JSON.parse(raw) : {}; } catch(e) { owned = {}; }
    var ownedVariants = getOwnedVariants();
    return db.collection("users").doc(user.uid).set({
      owned: owned,
      ownedVariants: ownedVariants,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      lastSync: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  };

  window.loadOwnedFromCloud = function () {
    var user = auth.currentUser;
    if (!user) return Promise.resolve(null);
    return db.collection("users").doc(user.uid).get().then(function (snap) {
      if (!snap.exists) return null;
      return {
        owned: snap.data().owned || {},
        ownedVariants: snap.data().ownedVariants || {}
      };
    });
  };

  window.mergeOwned = function (local, cloud) {
    // Merge regular issue ownership (union)
    var localOwned = local.owned || local;
    var cloudOwned = cloud.owned || cloud;
    var merged = {};
    var keys = Object.keys(Object.assign({}, localOwned, cloudOwned));
    keys.forEach(function (k) {
      if ((localOwned && localOwned[k]) || (cloudOwned && cloudOwned[k])) merged[k] = true;
    });

    // Merge variant ownership (union)
    var localVars = local.ownedVariants || {};
    var cloudVars = cloud.ownedVariants || {};
    var mergedVariants = {};
    var varKeys = Object.keys(Object.assign({}, localVars, cloudVars));
    varKeys.forEach(function (issueKey) {
      mergedVariants[issueKey] = {};
      var lv = localVars[issueKey] || {};
      var cv = cloudVars[issueKey] || {};
      var indices = Object.keys(Object.assign({}, lv, cv));
      indices.forEach(function (idx) {
        if ((lv && lv[idx]) || (cv && cv[idx])) mergedVariants[issueKey][idx] = true;
      });
    });

    return { owned: merged, ownedVariants: mergedVariants };
  };
})();
