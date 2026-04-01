#!/usr/bin/env node
// ============================================================
// Absolute Universe Data Pipeline
// ============================================================
// Fetches issue data from League of Comic Geeks / Comic Vine
// and updates ALL_ISSUES, coverMap, and SERIES_INFO in index.html.
//
// Usage:
//   node scripts/update-issues.js                    # dry run (show changes)
//   node scripts/update-issues.js --apply            # apply changes to index.html
//   COMIC_VINE_API_KEY=xxx node scripts/update-issues.js --apply  # with Comic Vine covers
//
// Data sources:
//   1. League of Comic Geeks (LOCG) — primary for release dates
//   2. Comic Vine API — supplemental for covers and metadata
//   3. DC.com — fallback for announcements
// ============================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

const INDEX_PATH = path.resolve(__dirname, '..', 'index.html');
const DRY_RUN = !process.argv.includes('--apply');
const COMIC_VINE_KEY = process.env.COMIC_VINE_API_KEY || '';

// Absolute Universe series we track
const SERIES_SEARCH_TERMS = [
  'Absolute Batman',
  'Absolute Wonder Woman',
  'Absolute Superman',
  'Absolute Flash',
  'Absolute Martian Manhunter',
  'Absolute Green Lantern',
  'Absolute Green Arrow',
  'Absolute Catwoman',
  'Absolute Evil',
  'DC All In Special',
];

// ── HTTP helper ──
function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.get({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      headers: {
        'User-Agent': 'AbsoluteDCTracker-Pipeline/1.0',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Parse existing issues from index.html ──
function parseExistingIssues(html) {
  const match = html.match(/const ALL_ISSUES = \[([\s\S]*?)\];/);
  if (!match) throw new Error('Could not find ALL_ISSUES in index.html');

  const issues = [];
  const issueRegex = /\{\s*series:'([^']*)',\s*issue:'([^']*)',\s*title:'([^']*)',\s*date:'([^']*)',\s*writer:'([^']*)',\s*artist:'([^']*)'\s*\}/g;
  let m;
  while ((m = issueRegex.exec(match[1])) !== null) {
    issues.push({
      series: m[1],
      issue: m[2],
      title: m[3],
      date: m[4],
      writer: m[5],
      artist: m[6]
    });
  }
  return issues;
}

// ── Parse existing coverMap from index.html ──
function parseCoverMap(html) {
  const match = html.match(/var coverMap = \{([\s\S]*?)\};/);
  if (!match) return {};
  const map = {};
  const entryRegex = /'([^']+)':\s*'([^']+)'/g;
  let m;
  while ((m = entryRegex.exec(match[1])) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

// ── Fetch from League of Comic Geeks ──
async function fetchLOCG(seriesName) {
  try {
    const query = encodeURIComponent(seriesName + ' DC Comics');
    const url = `https://leagueofcomicgeeks.com/api/search?query=${query}`;
    console.log(`  [LOCG] Searching: ${seriesName}`);
    const data = await fetch(url);
    // LOCG may not have a public API — this is a best-effort attempt
    return JSON.parse(data);
  } catch (e) {
    console.log(`  [LOCG] ${seriesName}: ${e.message}`);
    return null;
  }
}

// ── Fetch from Comic Vine API ──
async function fetchComicVine(seriesName) {
  if (!COMIC_VINE_KEY) {
    console.log(`  [ComicVine] No API key, skipping`);
    return [];
  }
  try {
    const query = encodeURIComponent(seriesName);
    const url = `https://comicvine.gamespot.com/api/search/?api_key=${COMIC_VINE_KEY}&format=json&resources=issue&query=${query}&limit=50`;
    console.log(`  [ComicVine] Searching: ${seriesName}`);
    const data = await fetch(url);
    const json = JSON.parse(data);
    if (json.results) {
      return json.results.filter(r =>
        r.volume && r.volume.name && r.volume.name.includes('Absolute')
      ).map(r => ({
        title: r.volume.name + ' #' + r.issue_number,
        date: r.store_date || r.cover_date,
        coverUrl: r.image ? r.image.medium_url : null,
        description: r.description ? r.description.replace(/<[^>]+>/g, '').slice(0, 200) : ''
      }));
    }
    return [];
  } catch (e) {
    console.log(`  [ComicVine] ${seriesName}: ${e.message}`);
    return [];
  }
}

// ── Fetch from DC.com upcoming comics ──
async function fetchDCUpcoming() {
  try {
    console.log(`  [DC.com] Fetching upcoming Absolute Universe comics...`);
    const url = 'https://www.dc.com/comics?seriesid=absolute';
    const html = await fetch(url);
    // Parse basic issue info from DC.com HTML
    const issues = [];
    const cardRegex = /data-title="([^"]+)"[\s\S]*?data-date="([^"]+)"/g;
    let m;
    while ((m = cardRegex.exec(html)) !== null) {
      if (m[1].includes('Absolute')) {
        issues.push({ title: m[1], date: m[2] });
      }
    }
    console.log(`  [DC.com] Found ${issues.length} upcoming issues`);
    return issues;
  } catch (e) {
    console.log(`  [DC.com] ${e.message}`);
    return [];
  }
}

// ── Generate the updated ALL_ISSUES block ──
function generateIssuesBlock(issues) {
  const lines = issues.map(i => {
    const writer = i.writer.replace(/'/g, "\\'");
    const artist = i.artist.replace(/'/g, "\\'");
    return `  { series:'${i.series}', issue:'${i.issue}', title:'${i.title}', date:'${i.date}', writer:'${writer}', artist:'${artist}' },`;
  });
  return 'const ALL_ISSUES = [\n' + lines.join('\n') + '\n];';
}

// ── Generate the updated coverMap block ──
function generateCoverMapBlock(coverMap) {
  const entries = Object.entries(coverMap).map(([title, url]) => {
    return `    '${title}': '${url}',`;
  });
  return '  var coverMap = {\n' + entries.join('\n') + '\n  };';
}

// ── Main pipeline ──
async function main() {
  console.log('=== Absolute Universe Data Pipeline ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (use --apply to write changes)' : 'APPLY'}`);
  console.log(`Comic Vine API: ${COMIC_VINE_KEY ? 'configured' : 'not configured'}`);
  console.log('');

  // Read current state
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const existingIssues = parseExistingIssues(html);
  const existingCoverMap = parseCoverMap(html);

  console.log(`Current issues in index.html: ${existingIssues.length}`);
  console.log(`Current covers in coverMap: ${Object.keys(existingCoverMap).length}`);
  console.log('');

  // Build a lookup for existing issues
  const existingMap = {};
  existingIssues.forEach(i => {
    existingMap[i.title] = i;
  });

  // Fetch data from sources
  let newIssues = [];
  let newCovers = {};

  // Try Comic Vine for each series
  for (const series of SERIES_SEARCH_TERMS) {
    const cvResults = await fetchComicVine(series);
    for (const cv of cvResults) {
      if (!existingMap[cv.title]) {
        console.log(`  [NEW] ${cv.title} — ${cv.date}`);
        newIssues.push(cv);
      }
      if (cv.coverUrl && !existingCoverMap[cv.title]) {
        newCovers[cv.title] = cv.coverUrl;
      }
    }
  }

  // Try DC.com
  const dcResults = await fetchDCUpcoming();
  for (const dc of dcResults) {
    if (!existingMap[dc.title]) {
      console.log(`  [DC.com NEW] ${dc.title} — ${dc.date}`);
    }
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Existing issues: ${existingIssues.length}`);
  console.log(`New issues found: ${newIssues.length}`);
  console.log(`New covers found: ${Object.keys(newCovers).length}`);

  if (newIssues.length === 0 && Object.keys(newCovers).length === 0) {
    console.log('No changes needed.');
    return;
  }

  // Merge new issues into existing
  const mergedIssues = [...existingIssues];
  for (const ni of newIssues) {
    // Try to parse series and issue number from title
    const match = ni.title.match(/^(Absolute \w[\w\s]*?)(?:\s+#(\d+))?$/);
    if (match) {
      mergedIssues.push({
        series: match[1],
        issue: match[2] ? `#${match[2]}` : 'Special #1',
        title: ni.title,
        date: ni.date,
        writer: 'TBA',
        artist: 'TBA'
      });
    }
  }

  // Sort by date, then series, then issue
  mergedIssues.sort((a, b) => {
    if (a.series !== b.series) return a.series.localeCompare(b.series);
    return a.date.localeCompare(b.date);
  });

  // Merge covers
  const mergedCoverMap = { ...existingCoverMap, ...newCovers };

  if (DRY_RUN) {
    console.log('\n=== Dry Run — Changes that would be made ===');
    for (const ni of newIssues) {
      console.log(`  ADD: ${ni.title} (${ni.date})`);
    }
    for (const [title, url] of Object.entries(newCovers)) {
      console.log(`  COVER: ${title} → ${url.slice(0, 60)}...`);
    }
    console.log('\nRun with --apply to write changes to index.html');
  } else {
    // Apply changes
    let updatedHtml = html;

    // Replace ALL_ISSUES block
    const newBlock = generateIssuesBlock(mergedIssues);
    updatedHtml = updatedHtml.replace(
      /const ALL_ISSUES = \[[\s\S]*?\];/,
      newBlock
    );

    // Replace coverMap block
    const newCoverBlock = generateCoverMapBlock(mergedCoverMap);
    updatedHtml = updatedHtml.replace(
      /  var coverMap = \{[\s\S]*?\};/,
      newCoverBlock
    );

    fs.writeFileSync(INDEX_PATH, updatedHtml, 'utf8');
    console.log('\nChanges written to index.html');

    // Write a data snapshot for reference
    const snapshot = {
      lastUpdated: new Date().toISOString(),
      issueCount: mergedIssues.length,
      coverCount: Object.keys(mergedCoverMap).length,
      issues: mergedIssues,
      coverMap: mergedCoverMap
    };
    fs.writeFileSync(
      path.resolve(__dirname, '..', 'data-snapshot.json'),
      JSON.stringify(snapshot, null, 2),
      'utf8'
    );
    console.log('Data snapshot saved to data-snapshot.json');
  }
}

main().catch(err => {
  console.error('Pipeline error:', err);
  process.exit(1);
});
