
(function() {
  var coverMap = {
    'DC All In Special': 'https://static.dc.com/2024-09/DC_ALLIN_SP_Cv1_00111_C1.jpg',
    'DC All In FCBD 2025': 'https://s3.amazonaws.com/comicgeeks/comics/covers/large-3255930.jpg',
    'Absolute Batman #1': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-batman-1-max-1-per-customer-193132.jpg',
    'Absolute Batman #2': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8081353.jpg',
    'Absolute Batman #3': 'https://static.dc.com/2024-12/ABS_BM_Cv3_00311_DIGITAL.jpg',
    'Absolute Batman #4': 'https://www.midtowncomics.com/images/PRODUCT/XL/2382484_xl.jpg',
    'Absolute Batman #5': 'https://www.midtowncomics.com/images/PRODUCT/XL/2391597_xl.jpg',
    'Absolute Batman #6': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-batman-6-cover-c-simon-bisley-card-stock-variant-349680.jpg',
    'Absolute Batman #7': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-batman-7-cover-a-nick-dragotta-227921.jpg',
    'Absolute Batman #8': 'https://www.midtowncomics.com/images/PRODUCT/XL/2423394_xl.jpg',
    'Absolute Batman #9': 'https://www.midtowncomics.com/images/PRODUCT/XL/2432707_xl.jpg',
    'Absolute Batman #10': 'https://www.midtowncomics.com/images/PRODUCT/XL/2439651_xl.jpg',
    'Absolute Batman #11': 'https://www.midtowncomics.com/images/PRODUCT/XL/2448425_xl.jpg',
    'Absolute Batman #12': 'https://www.midtowncomics.com/images/PRODUCT/XL/2461133_xl.jpg',
    'Absolute Batman #13': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-batman-13-cover-a-nick-dragotta-5254974.jpg',
    'Absolute Batman #14': 'https://www.midtowncomics.com/images/PRODUCT/XL/2481536_xl.jpg',
    'Absolute Batman #15': 'https://www.midtowncomics.com/images/PRODUCT/XL/2491517_xl.jpg',
    'Absolute Batman #16': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-batman-16-2nd-print-cover-a-nick-dragotta-2282436.jpg',
    'Absolute Batman #17': 'https://www.midtowncomics.com/images/PRODUCT/XL/2511959_xl.jpg',
    'Absolute Batman #18': 'https://www.midtowncomics.com/images/PRODUCT/XL/2521324_xl.jpg',
    'Absolute Batman #19': 'https://www.midtowncomics.com/images/PRODUCT/XL/2531275_xl.jpg',
    'Absolute Batman #20': 'https://www.midtowncomics.com/images/PRODUCT/XL/2521324_xl.jpg',
    'Absolute Batman 2025 Annual #1': 'https://static.dc.com/2025-10/T2469000015001.jpg',
    'Absolute Batman: Ark M Special #1': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7993695.jpg',
    'Absolute Wonder Woman #1': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-wonder-woman-1-cover-c-jim-lee-card-stock-variant-one-copy-per-customer-365350.jpg',
    'Absolute Wonder Woman #2': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-6278246.jpg',
    'Absolute Wonder Woman #3': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2965850.jpg',
    'Absolute Wonder Woman #4': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2319654.jpg',
    'Absolute Wonder Woman #5': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3348187.jpg',
    'Absolute Wonder Woman #6': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-wonder-woman-6-cover-a-hayden-sherman-490818.jpg',
    'Absolute Wonder Woman #7': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-4846924.jpg',
    'Absolute Wonder Woman #8': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2750287.jpg',
    'Absolute Wonder Woman #9': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3559835.jpg',
    'Absolute Wonder Woman #10': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3167576.jpg',
    'Absolute Wonder Woman #11': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-6904268.jpg',
    'Absolute Wonder Woman #12': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-wonder-woman-12-cover-a-hayden-sherman-7476631.jpg',
    'Absolute Wonder Woman #13': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-6966871.jpg',
    'Absolute Wonder Woman #14': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7801063.jpg',
    'Absolute Wonder Woman #15': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7164499.jpg',
    'Absolute Wonder Woman #16': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7126669.jpg',
    'Absolute Wonder Woman #17': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8091930.jpg',
    'Absolute Wonder Woman #18': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-wonder-woman-18-cover-a-hayden-sherman-2470468.jpg',
    'Absolute Wonder Woman #19': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-1701890.jpg',
    'Absolute Superman #1': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7938850.jpg',
    'Absolute Superman #2': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-1356696.jpg',
    'Absolute Superman #3': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3909135.jpg',
    'Absolute Superman #4': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-4509167.jpg',
    'Absolute Superman #5': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3601635.jpg',
    'Absolute Superman #6': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-superman-6-cover-a-rafa-sandoval-929990.jpg',
    'Absolute Superman #7': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-6840272.jpg',
    'Absolute Superman #8': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-4132139.jpg',
    'Absolute Superman #9': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-1662918.jpg',
    'Absolute Superman #10': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7031658.jpg',
    'Absolute Superman #11': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2583532.jpg',
    'Absolute Superman #12': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-superman-12-cover-a-rafa-sandoval-7973885.jpg',
    'Absolute Superman #13': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3106468.jpg',
    'Absolute Superman #14': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8208323.jpg',
    'Absolute Superman #15': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-6230146.jpg',
    'Absolute Superman #16': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2567304.jpg',
    'Absolute Superman #17': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7505264.jpg',
    'Absolute Superman #18': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2985577.jpg',
    'Absolute Flash #1': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-flash-1-cover-a-nick-robles-1-copy-per-customer-888803.jpg',
    'Absolute Flash #2': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-flash-2-cover-a-nick-robles-874502.jpg',
    'Absolute Flash #3': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-1613026.jpg',
    'Absolute Flash #4': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7234696.jpg',
    'Absolute Flash #5': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8900255.jpg',
    'Absolute Flash #6': 'https://static.dc.com/2025-08/AB_FLS_Cv6_00611_DIGITAL.jpg',
    'Absolute Flash #7': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-flash-7-cover-a-nick-robles-1076932.jpg',
    'Absolute Flash #8': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3834156.jpg',
    'Absolute Flash #9': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2250466.jpg',
    'Absolute Flash #10': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8744594.jpg',
    'Absolute Flash #11': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8285365.jpg',
    'Absolute Flash #12': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-5446399.jpg',
    'Absolute Flash #13': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-flash-13-cover-a-nick-robles-8645147.jpg',
    'Absolute Flash #14': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-2061139.jpg',
    'Absolute Martian Manhunter #1': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-martian-manhunter-1-of-6-cover-a-javier-rodriguez-one-copy-per-customer-436868.jpg',
    'Absolute Martian Manhunter #2': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-martian-manhunter-2-of-6-cover-a-javier-rodriguez-750206.jpg',
    'Absolute Martian Manhunter #3': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-4573663.jpg',
    'Absolute Martian Manhunter #4': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-4272772.jpg',
    'Absolute Martian Manhunter #5': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-4643183.jpg',
    'Absolute Martian Manhunter #6': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7379797.jpg',
    'Absolute Martian Manhunter #7': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3472304.jpg',
    'Absolute Martian Manhunter #8': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-1616741.jpg',
    'Absolute Martian Manhunter #9': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8933371.jpg',
    'Absolute Martian Manhunter #10': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-martian-manhunter-10-cover-a-javier-rodriguez-5111564.jpg',
    'Absolute Martian Manhunter #11': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7595139.jpg',
    'Absolute Martian Manhunter #12': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7124600.jpg',
    'Absolute Green Lantern #1': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-green-lantern-1-cover-a-jahnoy-lindsay-661858.jpg',
    'Absolute Green Lantern #2': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-green-lantern-2-cover-c-taurin-clarke-card-stock-variant-7355236.jpg',
    'Absolute Green Lantern #3': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3629696.jpg',
    'Absolute Green Lantern #4': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-5445219.jpg',
    'Absolute Green Lantern #5': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-1569974.jpg',
    'Absolute Green Lantern #6': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-3668202.jpg',
    'Absolute Green Lantern #7': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-green-lantern-7-cover-a-jahnoy-lindsay-4449864.jpg',
    'Absolute Green Lantern #8': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-5343448.jpg',
    'Absolute Green Lantern #9': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-8476102.jpg',
    'Absolute Green Lantern #10': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7884761.jpg',
    'Absolute Green Lantern #11': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-7329570.jpg',
    'Absolute Green Lantern #12': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-green-lantern-12-cover-a-jahnoy-lindsay-3751091.jpg',
    'Absolute Green Lantern #13': 'https://s3.amazonaws.com/comicgeeks/comics/covers/medium-4835946.jpg',
    'Absolute Green Arrow #1': 'https://static.dc.com/2026-02/Absolute%20Green%20Arrow%201%20Main%20Albuquerque%20Maiolo.jpg',
    'Absolute Green Arrow #2': 'https://static.dc.com/2026-02/Absolute%20Green%20Arrow%201%20Main%20Albuquerque%20Maiolo.jpg',
    'Absolute Green Arrow #3': 'https://static.dc.com/2026-02/Absolute%20Green%20Arrow%201%20Main%20Albuquerque%20Maiolo.jpg',
    'Absolute Green Arrow #4': 'https://static.dc.com/2026-02/Absolute%20Green%20Arrow%201%20Main%20Albuquerque%20Maiolo.jpg',
    'Absolute Green Arrow #5': 'https://static.dc.com/2026-02/Absolute%20Green%20Arrow%201%20Main%20Albuquerque%20Maiolo.jpg',
    'Absolute Green Arrow #6': 'https://static.dc.com/2026-02/Absolute%20Green%20Arrow%201%20Main%20Albuquerque%20Maiolo.jpg',
    'Absolute Catwoman #1': 'https://static.dc.com/2026-02/Absolute%20Catwoman%201%20Main%20Bengal_0.jpg',
    'Absolute Catwoman #2': 'https://static.dc.com/2026-02/Absolute%20Catwoman%201%20Main%20Bengal_0.jpg',
    'Absolute Catwoman #3': 'https://static.dc.com/2026-02/Absolute%20Catwoman%201%20Main%20Bengal_0.jpg',
    'Absolute Catwoman #4': 'https://static.dc.com/2026-02/Absolute%20Catwoman%201%20Main%20Bengal_0.jpg',
    'Absolute Evil #1': 'https://cdn.shopify.com/s/files/1/0403/3514/7159/files/absolute-evil-1-one-shot-cover-a-giussepe-camuncoli-stefano-nesi-4517323.jpg'
  };

  // ── External data loader ──
  // Try to load fresh data from data/issues.json (written by the pipeline).
  // Falls back to the inline data above if the fetch fails or is offline.
  var _dataLoaded = false;
  function _loadExternalData() {
    return fetch('data/issues.json?v=' + Date.now())
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(json) {
        if (!json.issues || !Array.isArray(json.issues) || json.issues.length === 0) {
          console.log('[data] External JSON empty or invalid — using inline data');
          return;
        }
        // Replace inline data with external data
        var newIssues = json.issues.map(function(i) {
          var obj = {
            series: i.series,
            issue: i.issue,
            title: i.title,
            date: i.date,
            writer: i.writer,
            artist: i.artist,
            price: typeof i.price === 'number' ? i.price : 4.99,
          };
          if (i.upc) obj.barcodes = { upc: i.upc };
          return obj;
        });
        ALL_ISSUES = newIssues;

        if (json.coverMap && typeof json.coverMap === 'object') {
          // Merge — external covers take priority
          var keys = Object.keys(json.coverMap);
          for (var k = 0; k < keys.length; k++) {
            coverMap[keys[k]] = json.coverMap[keys[k]];
          }
        }

        if (json.seriesColors && typeof json.seriesColors === 'object') {
          var cKeys = Object.keys(json.seriesColors);
          for (var c = 0; c < cKeys.length; c++) {
            SERIES_COLORS[cKeys[c]] = json.seriesColors[cKeys[c]];
          }
        }

        _dataLoaded = true;
        console.log('[data] Loaded ' + newIssues.length + ' issues from external JSON (updated ' + (json._meta ? json._meta.lastUpdated : 'unknown') + ')');
      })
      .catch(function(err) {
        console.log('[data] External JSON unavailable (' + err.message + ') — using inline data');
      });
  }

  // Lazy-load cover art with IntersectionObserver + blur-up effect
  var _coverObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var card = entry.target;
      var bg = card.querySelector('.card-bg');
      if (!bg || bg.classList.contains('loaded')) return;
      var url = bg.dataset.src;
      if (!url) return;
      // Preload the image, then fade in
      var img = new Image();
      img.onload = function() {
        bg.style.backgroundImage = 'url(' + url + ')';
        bg.classList.add('loaded');
        // Remove placeholder after transition
        var ph = card.querySelector('.card-bg-placeholder');
        if (ph) setTimeout(function() { ph.remove(); }, 600);
      };
      img.src = url;
      _coverObserver.unobserve(card);
    });
  }, { rootMargin: '200px 0px', threshold: 0 });

  function applyCoverBackgrounds() {
    document.querySelectorAll('.issue-card').forEach(function(card) {
      if (card.querySelector('.card-bg')) return;
      var name = card.querySelector('.issue-name');
      if (name) {
        var url = coverMap[name.textContent.trim()];
        if (url) {
          // Blurred placeholder (uses same URL, rendered blurry at low opacity)
          var ph = document.createElement('div');
          ph.className = 'card-bg-placeholder';
          ph.style.backgroundImage = 'url(' + url + ')';
          card.insertBefore(ph, card.firstChild);
          // Full-res layer (lazy-loaded)
          var bg = document.createElement('div');
          bg.className = 'card-bg';
          bg.dataset.src = url;
          card.insertBefore(bg, card.firstChild);
          _coverObserver.observe(card);
        }
      }
    });
  }

  applyCoverBackgrounds();

  // Use MutationObserver to apply covers when new cards are added
  var _bgObserver = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length) {
        var needsBg = false;
        var cards = document.querySelectorAll('.issue-card');
        for (var j = 0; j < cards.length; j++) {
          if (!cards[j].querySelector('.card-bg')) { needsBg = true; break; }
        }
        if (needsBg) applyCoverBackgrounds();
        break;
      }
    }
  });
  _bgObserver.observe(document.body, { childList: true, subtree: true });
  applyCoverBackgrounds();
})()
