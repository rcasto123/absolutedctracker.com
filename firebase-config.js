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

  /* ── Firestore sync helpers ── */
  window.syncOwnedToCloud = function () {
    var user = auth.currentUser;
    if (!user) return Promise.resolve();
    var raw = localStorage.getItem("au_owned");
    var owned = raw ? JSON.parse(raw) : {};
    return db.collection("users").doc(user.uid).set({
      owned: owned,
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
      return snap.data().owned || {};
    });
  };

  window.mergeOwned = function (local, cloud) {
    var merged = {};
    var keys = Object.keys(Object.assign({}, local, cloud));
    keys.forEach(function (k) {
      if ((local && local[k]) || (cloud && cloud[k])) merged[k] = true;
    });
    return merged;
  };
})();
