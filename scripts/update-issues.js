#!/usr/bin/env node
// ============================================================
// Absolute Universe Data Pipeline  v2.0
// ============================================================
// Discovers new Absolute Universe issues via the Comic Vine API
// (free key from comicvine.gamespot.com) and merges them into
// data/issues.json.  Falls back to manual addition when no key
// is available.
//
// Usage:
//   node scripts/update-issues.js                          # dry run
//   node scripts/update-issues.js --apply                  # write changes
//   node scripts/update-issues.js --apply --covers         # + fetch covers
//   node scripts/update-issues.js --add "Title|#N|YYYY-MM-DD|Writer|Artist|Price|UPC"
//   node scripts/update-issues.js --sync-from-html         # bootstrap from index.html
//   node scripts/update-issues.js --validate               # check data integrity
//
// Environment:
//   COMIC_VINE_API_KEY — API key from comicvine.gamespot.com (free)
// ============================================================

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Paths ──
const ROOT_DIR     = path.resolve(__dirname, '..');
const DATA_DIR     = path.join(ROOT_DIR, 'data');
const ISSUES_JSON  = path.join(DATA_DIR, 'issues.json');
const INDEX_HTML   = path.join(ROOT_DIR, 'index.html');

// ── CLI flags ──
const DRY_RUN     = !process.argv.includes('--apply');
const WITH_COVERS = process.argv.includes('--covers');
const VALIDATE    = process.argv.includes('--validate');
const SYNC_HTML   = process.argv.includes('--sync-from-html');
const ADD_ARG     = process.argv.find(a => a.startsWith('--add='));
const ADD_INLINE  = ADD_ARG ? ADD_ARG.split('=').slice(1).join('=') : null;

// ── Comic Vine config ──
const CV_KEY = process.env.COMIC_VINE_API_KEY || '';
const CV_BASE = 'https://comicvine.gamespot.com/api';

// Absolute Universe series — map our name to Comic Vine volume IDs
// These IDs are stable and findable at comicvine.gamespot.com
const CV_VOLUMES = {
  'Absolute Batman':            148078,
  'Absolute Wonder Woman':      148079,
  'Absolute Superman':          148080,
  'Absolute Flash':             150391,
  'Absolute Martian Manhunter': 149320,
  'Absolute Green Lantern':     149321,
  'Absolute Green Arrow':       152050,
  'Absolute Catwoman':          152051,
  // One-shots don't have persistent volume IDs — handled separately
};

// Series we track that aren't standard volumes
const SPECIAL_TITLES = [
  { series: 'DC All In', searchTerm: 'DC All In Special' },
  { series: 'Absolute Evil', searchTerm: 'Absolute Evil' },
];

// Default pricing
const PRICE_MAP = { Annual: 5.99, Special: 9.99, FCBD: 0, default: 4.99 };

// ── HTTP helper ──
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'AbsoluteDCTracker-Pipeline/2.0',
        Accept: 'application/json',
        ...headers,
      },
      timeout: 20000,
    }, (res) => {
      // Follow redirects
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return resolve(httpGet(res.headers.location, headers));
      }
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
        else reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Load / save data ──
function loadData() {
  if (!fs.existsSync(ISSUES_JSON)) {
    return { _meta: {}, issues: [], coverMap: {}, seriesColors: {} };
  }
  return JSON.parse(fs.readFileSync(ISSUES_JSON, 'utf8'));
}

function saveData(data) {
  data._meta = {
    lastUpdated: new Date().toISOString().split('T')[0],
    source: 'Automated pipeline v2.0',
    issueCount: data.issues.length,
    coverCount: Object.keys(data.coverMap).length,
  };
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ISSUES_JSON, JSON.stringify(data, null, 2), 'utf8');

  // Append to run log
  const logPath = path.join(DATA_DIR, 'pipeline-log.json');
  const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : { runs: [] };
  log.runs.push({
    ts: new Date().toISOString(),
    issues: data.issues.length,
    covers: Object.keys(data.coverMap).length,
  });
  if (log.runs.length > 100) log.runs = log.runs.slice(-100);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf8');

  console.log(`\n✓ Saved ${data.issues.length} issues, ${Object.keys(data.coverMap).length} covers`);
}

// ── Issue key for dedup ──
function ikey(series, issue) { return `${series}||${issue}`; }

// ── Parse issue string from Comic Vine result ──
function cvIssueNumber(num) {
  if (!num) return null;
  const n = String(num).trim();
  if (/^\d+$/.test(n)) return `#${n}`;
  return n;
}

// ── Guess price ──
function guessPrice(issueStr) {
  if (!issueStr) return PRICE_MAP.default;
  if (/annual/i.test(issueStr)) return PRICE_MAP.Annual;
  if (/special/i.test(issueStr)) return PRICE_MAP.Special;
  if (/fcbd/i.test(issueStr)) return PRICE_MAP.FCBD;
  return PRICE_MAP.default;
}

// ── Fetch issues for a Comic Vine volume ──
async function fetchCVVolume(seriesName, volumeId) {
  if (!CV_KEY) return [];
  const url = `${CV_BASE}/issues/?api_key=${CV_KEY}&format=json&filter=volume:${volumeId}&sort=store_date:asc&limit=100&field_list=id,issue_number,name,store_date,cover_date,image,person_credits,volume`;
  console.log(`  [CV] ${seriesName} (volume ${volumeId})`);
  try {
    const raw = await httpGet(url);
    const json = JSON.parse(raw);
    if (json.status_code !== 1 || !json.results) {
      console.log(`       API error: ${json.error || 'unknown'}`);
      return [];
    }
    console.log(`       Found ${json.results.length} issues`);
    return json.results.map(r => ({
      series: seriesName,
      issue: cvIssueNumber(r.issue_number),
      title: `${seriesName} #${r.issue_number}`,
      date: r.store_date || r.cover_date || null,
      coverUrl: r.image ? (r.image.medium_url || r.image.small_url || null) : null,
      cvId: r.id,
      // person_credits would need a separate fetch per issue — skip for now
    }));
  } catch (e) {
    console.log(`       Error: ${e.message}`);
    return [];
  }
}

// ── Search Comic Vine for special titles ──
async function fetchCVSearch(searchTerm) {
  if (!CV_KEY) return [];
  const q = encodeURIComponent(searchTerm);
  const url = `${CV_BASE}/search/?api_key=${CV_KEY}&format=json&resources=issue&query=${q}&limit=20&field_list=id,issue_number,name,store_date,cover_date,image,volume`;
  console.log(`  [CV] Searching: "${searchTerm}"`);
  try {
    const raw = await httpGet(url);
    const json = JSON.parse(raw);
    if (json.status_code !== 1 || !json.results) return [];
    console.log(`       Found ${json.results.length} results`);
    return json.results.filter(r => {
      const vol = r.volume ? r.volume.name : '';
      const name = r.name || '';
      return (vol + ' ' + name).toLowerCase().includes(searchTerm.toLowerCase().split(' ')[0]);
    }).map(r => ({
      series: r.volume ? r.volume.name : searchTerm,
      issue: cvIssueNumber(r.issue_number) || 'Special #1',
      title: (r.volume ? r.volume.name : searchTerm) + (r.issue_number ? ` #${r.issue_number}` : ''),
      date: r.store_date || r.cover_date || null,
      coverUrl: r.image ? (r.image.medium_url || null) : null,
      cvId: r.id,
    }));
  } catch (e) {
    console.log(`       Error: ${e.message}`);
    return [];
  }
}

// ── Sync from index.html (bootstrap) ──
function syncFromHTML() {
  console.log('── Syncing from index.html ──\n');
  const html = fs.readFileSync(INDEX_HTML, 'utf8');

  // Extract ALL_ISSUES
  const issuesMatch = html.match(/const ALL_ISSUES = \[([\s\S]*?)\];/);
  if (!issuesMatch) throw new Error('Cannot find ALL_ISSUES in index.html');

  const issues = [];
  // This regex handles all fields including price and barcodes
  const re = /\{\s*series:'([^']*)',\s*issue:'([^']*)',\s*title:'([^']*)',\s*date:'([^']*)',\s*writer:'([^']*)',\s*artist:'([^']*)'(?:,\s*price:([\d.]+))?(?:,\s*barcodes:\{\s*upc:'([^']*)'\s*\})?\s*\}/g;
  let m;
  while ((m = re.exec(issuesMatch[1])) !== null) {
    const issue = {
      series: m[1],
      issue: m[2],
      title: m[3],
      date: m[4],
      writer: m[5],
      artist: m[6],
      price: m[7] ? parseFloat(m[7]) : guessPrice(m[2]),
    };
    if (m[8]) issue.upc = m[8];
    issues.push(issue);
  }

  // Extract coverMap
  const coverMatch = html.match(/var coverMap = \{([\s\S]*?)\};/);
  const coverMap = {};
  if (coverMatch) {
    const cre = /'([^']+)':\s*'([^']+)'/g;
    while ((m = cre.exec(coverMatch[1])) !== null) {
      coverMap[m[1]] = m[2];
    }
  }

  // Extract SERIES_COLORS
  const colorMatch = html.match(/const SERIES_COLORS = \{([\s\S]*?)\};/);
  const seriesColors = {};
  if (colorMatch) {
    const ccre = /'([^']+)':\s*'([^']+)'/g;
    while ((m = ccre.exec(colorMatch[1])) !== null) {
      seriesColors[m[1]] = m[2];
    }
  }

  console.log(`Extracted ${issues.length} issues, ${Object.keys(coverMap).length} covers, ${Object.keys(seriesColors).length} series colors`);

  return {
    _meta: { lastUpdated: new Date().toISOString().split('T')[0], source: 'Synced from index.html' },
    issues,
    coverMap,
    seriesColors,
  };
}

// ── Add issue from CLI string ──
function parseAddString(str) {
  // Format: "Series Name|#N|YYYY-MM-DD|Writer|Artist|Price|UPC"
  const parts = str.split('|').map(s => s.trim());
  if (parts.length < 5) {
    throw new Error('Add format: "Series|Issue|Date|Writer|Artist[|Price][|UPC]"');
  }
  const issue = {
    series: parts[0],
    issue: parts[1],
    title: `${parts[0]} ${parts[1]}`,
    date: parts[2],
    writer: parts[3],
    artist: parts[4],
    price: parts[5] ? parseFloat(parts[5]) : guessPrice(parts[1]),
  };
  if (parts[6]) issue.upc = parts[6];
  return issue;
}

// ── Validate data integrity ──
function validateData(data) {
  console.log('── Validating data integrity ──\n');
  let errors = 0;
  const seen = new Set();

  for (let i = 0; i < data.issues.length; i++) {
    const iss = data.issues[i];
    const key = ikey(iss.series, iss.issue);

    // Required fields
    for (const f of ['series', 'issue', 'title', 'date', 'writer', 'artist']) {
      if (!iss[f]) {
        console.log(`  [ERROR] Issue ${i}: missing '${f}' — ${JSON.stringify(iss)}`);
        errors++;
      }
    }

    // Date format
    if (iss.date && !/^\d{4}-\d{2}-\d{2}$/.test(iss.date)) {
      console.log(`  [WARN]  Issue ${i}: bad date format '${iss.date}' in ${iss.title}`);
    }

    // Duplicates
    if (seen.has(key)) {
      console.log(`  [ERROR] Duplicate: ${key}`);
      errors++;
    }
    seen.add(key);

    // Price sanity
    if (typeof iss.price === 'number' && (iss.price < 0 || iss.price > 50)) {
      console.log(`  [WARN]  Unusual price ${iss.price} for ${iss.title}`);
    }
  }

  // Check covers reference real issues
  const issueTitles = new Set(data.issues.map(i => i.title));
  for (const title of Object.keys(data.coverMap)) {
    if (!issueTitles.has(title)) {
      console.log(`  [WARN]  Cover for unknown issue: ${title}`);
    }
  }

  // Check for issues without covers
  let missingCovers = 0;
  for (const iss of data.issues) {
    if (!data.coverMap[iss.title]) missingCovers++;
  }

  console.log(`\nTotal issues:   ${data.issues.length}`);
  console.log(`Total covers:   ${Object.keys(data.coverMap).length}`);
  console.log(`Missing covers: ${missingCovers}`);
  console.log(`Errors:         ${errors}`);
  console.log(`Status:         ${errors === 0 ? '✓ PASS' : '✗ FAIL'}`);

  return errors === 0;
}

// ── Main ──
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Absolute Universe Data Pipeline  v2.0          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Ensure data dir
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // ── Mode: sync from HTML ──
  if (SYNC_HTML) {
    const data = syncFromHTML();
    if (!DRY_RUN) {
      saveData(data);
    } else {
      console.log('\n[DRY RUN] Would save synced data');
    }
    return;
  }

  // ── Mode: validate ──
  if (VALIDATE) {
    const data = loadData();
    const ok = validateData(data);
    process.exit(ok ? 0 : 1);
  }

  // ── Mode: add single issue ──
  if (ADD_INLINE) {
    const data = loadData();
    const newIssue = parseAddString(ADD_INLINE);
    const key = ikey(newIssue.series, newIssue.issue);
    const exists = data.issues.find(i => ikey(i.series, i.issue) === key);
    if (exists) {
      console.log(`Issue already exists: ${newIssue.title}`);
      return;
    }
    data.issues.push(newIssue);
    data.issues.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    console.log(`Added: ${newIssue.title}`);
    if (!DRY_RUN) {
      saveData(data);
    } else {
      console.log('[DRY RUN] Would save');
    }
    return;
  }

  // ── Mode: full pipeline ──
  console.log(`Mode:      ${DRY_RUN ? 'DRY RUN' : 'APPLY'}`);
  console.log(`Covers:    ${WITH_COVERS ? 'yes' : 'no'}`);
  console.log(`CV API:    ${CV_KEY ? 'configured ✓' : 'not set (set COMIC_VINE_API_KEY)'}\n`);

  const data = loadData();
  const startCount = data.issues.length;
  console.log(`Current:   ${startCount} issues, ${Object.keys(data.coverMap).length} covers\n`);

  if (!CV_KEY) {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  No Comic Vine API key set.                     ║');
    console.log('║                                                  ║');
    console.log('║  Get a free key at:                              ║');
    console.log('║  https://comicvine.gamespot.com/api/             ║');
    console.log('║                                                  ║');
    console.log('║  Then run:                                       ║');
    console.log('║  COMIC_VINE_API_KEY=xxx node scripts/update-issues.js ║');
    console.log('║                                                  ║');
    console.log('║  Or add as --add="Series|#N|Date|Writer|Artist"  ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('\nRunning validation on existing data instead...\n');
    validateData(data);
    return;
  }

  // Build dedup set
  const existing = new Set();
  data.issues.forEach(i => existing.add(ikey(i.series, i.issue)));

  const discovered = [];
  const newCovers = {};

  // Fetch each series volume
  console.log('── Fetching from Comic Vine ──\n');

  for (const [seriesName, volumeId] of Object.entries(CV_VOLUMES)) {
    const results = await fetchCVVolume(seriesName, volumeId);
    for (const r of results) {
      if (!r.issue || !r.date) continue;
      const key = ikey(r.series, r.issue);
      if (existing.has(key)) {
        // Already have it — maybe grab cover
        if (WITH_COVERS && r.coverUrl && !data.coverMap[r.title]) {
          newCovers[r.title] = r.coverUrl;
        }
        continue;
      }
      discovered.push({
        series: r.series,
        issue: r.issue,
        title: r.title,
        date: r.date,
        writer: 'TBA',
        artist: 'TBA',
        price: guessPrice(r.issue),
      });
      existing.add(key);
      if (r.coverUrl) newCovers[r.title] = r.coverUrl;
    }
    // Rate limit: CV allows 200 req/15min but let's be polite
    await sleep(2000);
  }

  // Search for special titles
  for (const sp of SPECIAL_TITLES) {
    const results = await fetchCVSearch(sp.searchTerm);
    for (const r of results) {
      const key = ikey(r.series, r.issue);
      if (existing.has(key)) continue;
      discovered.push({
        series: sp.series,
        issue: r.issue,
        title: r.title,
        date: r.date || 'TBD',
        writer: 'TBA',
        artist: 'TBA',
        price: guessPrice(r.issue),
      });
      existing.add(key);
      if (r.coverUrl) newCovers[r.title] = r.coverUrl;
    }
    await sleep(2000);
  }

  // ── Results ──
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Results                                         ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`New issues:  ${discovered.length}`);
  console.log(`New covers:  ${Object.keys(newCovers).length}`);

  if (discovered.length > 0) {
    console.log('\n── New Issues ──');
    discovered.forEach(d => console.log(`  + ${d.title} (${d.date})`));
  }

  if (Object.keys(newCovers).length > 0) {
    console.log('\n── New Covers ──');
    Object.entries(newCovers).forEach(([t, u]) => console.log(`  + ${t}: ${u.slice(0, 60)}...`));
  }

  if (discovered.length === 0 && Object.keys(newCovers).length === 0) {
    console.log('\nNo changes needed — data is up to date.');
    return;
  }

  // Merge
  for (const d of discovered) data.issues.push(d);
  data.issues.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  Object.assign(data.coverMap, newCovers);

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Total would be: ${data.issues.length} issues, ${Object.keys(data.coverMap).length} covers`);
    console.log('Run with --apply to write.');
  } else {
    saveData(data);
  }
}

main().catch(err => {
  console.error('\n✗ Pipeline error:', err);
  process.exit(1);
});
