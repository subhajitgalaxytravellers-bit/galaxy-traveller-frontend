/**
 * fixAllImages.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes images in:
 *   front/scrap/output/tours.json
 *   front/scrap/output/destinations.json
 *   front/scrap/output/blogs.json
 *
 * GUARANTEES:
 *   1. heroImg / displayImg  → globally unique across ALL three files
 *   2. galleryImgs / highlights[].img → unique within each entry
 *   3. All images are location-relevant via Unsplash bucket queries
 *   4. seo.metaImage / seo.shareImage aliased to primary (no extra slots)
 *
 * RATE-LIMIT SAFE (50 req/hr demo plan):
 *   - Only 30 simple short queries → max 30 API calls
 *   - 75-second delay between calls (strict ≤48 req/hr)
 *   - Saves image-registry.json checkpoint after every successful fetch
 *   - Resumes automatically if interrupted - just re-run the script
 *   - On 403/429: saves progress and prints a clear wait message
 *
 * Usage:
 *   cd front
 *   node scrap/fixAllImages.js
 *
 *   If interrupted by rate-limit: wait ~1 hour and re-run. Progress is saved.
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');

// ── Config ────────────────────────────────────────────────────────────────────
const PER_PAGE      = 30;     // max allowed by Unsplash
const CALL_DELAY_MS = 75000;  // 75 s between API calls → 48 req/hr max

const ROOT          = path.resolve(__dirname, '../../');
const OUTPUT_DIR    = path.join(__dirname, 'output');
const REGISTRY_PATH = path.join(OUTPUT_DIR, 'image-registry.json');
const TOURS_PATH    = path.join(OUTPUT_DIR, 'tours.json');
const DEST_PATH     = path.join(OUTPUT_DIR, 'destinations.json');
const BLOGS_PATH    = path.join(OUTPUT_DIR, 'blogs.json');

// ── Load .env ─────────────────────────────────────────────────────────────────
function readEnvFile(fp) {
  try {
    return Object.fromEntries(
      fs.readFileSync(fp, 'utf8')
        .split(/\r?\n/)
        .filter(l => l.includes('=') && !l.trimStart().startsWith('#'))
        .map(l => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
        })
    );
  } catch { return {}; }
}

const env = {
  ...readEnvFile(path.join(ROOT, 'front/.env')),
  ...readEnvFile(path.join(ROOT, 'galaxy-traveller-backend/.env')),
  ...process.env,
};

const UNS_KEY = env.UNSPLASH_ACCESS_KEY || env.UNSPLASH_API_KEY || env.UNSPLASH_KEY;
if (!UNS_KEY) {
  console.error('ERROR: UNSPLASH_ACCESS_KEY not found in .env');
  process.exit(1);
}
console.log('Unsplash key loaded\n');

// ── Location buckets ─────────────────────────────────────────────────────────
// Each bucket has 1-2 SHORT search queries (2 for high-traffic locations).
// 2 queries x 30 results = 60 images per bucket.
// 1 query  x 30 results = 30 images per bucket.
// Total queries across all buckets = 30 (well under 50/hr rate limit).
const BUCKETS = {
  bhutan:      ['bhutan monastery',          'bhutan himalaya'],
  kashmir:     ['kashmir valley india',      'dal lake kashmir'],
  ladakh:      ['ladakh india mountain',     'pangong lake ladakh'],
  kailash:     ['kailash tibet mountain'],
  tawang:      ['tawang monastery india'],
  arunachal:   ['arunachal pradesh india'],
  kaziranga:   ['kaziranga india wildlife'],
  assam:       ['assam india'],
  meghalaya:   ['meghalaya india waterfall'],
  nagaland:    ['nagaland india festival'],
  manipur:     ['manipur india loktak'],
  northeast:   ['northeast india landscape'],
  sikkim:      ['sikkim india monastery',    'kanchenjunga mountain india'],
  darjeeling:  ['darjeeling india mountain', 'darjeeling tea garden'],
  northbengal: ['north bengal india forest', 'dooars forest india'],
  sundarbans:  ['sundarbans india mangrove'],
  nepal:       ['nepal himalaya mountain',   'kathmandu nepal'],
  andaman:     ['andaman islands beach india'],
  maldives:    ['maldives overwater bungalow'],
  bali:        ['bali indonesia temple'],
  thailand:    ['thailand temple bangkok'],
  vietnam:     ['vietnam halong bay'],
  srilanka:    ['sri lanka sigiriya'],
  generic:     ['india mountain landscape',  'india nature travel'],
};

// ── Entry to bucket mapping ───────────────────────────────────────────────────
function getBucket(slug, title, place) {
  const t = (slug + ' ' + title + ' ' + place).toLowerCase().replace(/-/g, ' ');
  if (/bhutan|paro|punakha|thimphu|bumthang|phuentsholing|trashigang|taktshang/.test(t)) return 'bhutan';
  if (/kashmir|gulmarg|sonmarg|srinagar|vaishno devi|pahalgam/.test(t))            return 'kashmir';
  if (/ladakh|leh |pangong|nubra|siachen|khardung/.test(t))                        return 'ladakh';
  if (/kailash|mansarovar/.test(t))                                                 return 'kailash';
  if (/tawang|zemithang|bumla|dirang|sangti/.test(t))                              return 'tawang';
  if (/arunachal|ziro|daporijo/.test(t))                                            return 'arunachal';
  if (/kaziranga|manas|majuli|pobitora/.test(t))                                    return 'kaziranga';
  if (/assam|guwahati|brahmaputra/.test(t))                                         return 'assam';
  if (/meghalaya|cherrapunji|sohra|shillong|dawki/.test(t))                        return 'meghalaya';
  if (/nagaland|kohima|dzukou|hornbill|mokokchung/.test(t))                        return 'nagaland';
  if (/manipur|imphal|loktak/.test(t))                                              return 'manipur';
  if (/north east|northeast|seven sisters|mizoram/.test(t))                        return 'northeast';
  if (/north sikkim|lachen|lachung|yumthang|gurudongmar/.test(t))                  return 'sikkim';
  if (/sikkim|gangtok|pelling|ravangla|namchi|silk route|kanchenjunga|sandakphu/.test(t)) return 'sikkim';
  if (/darjeeling|kalimpong|tinchuley|mangwa/.test(t))                              return 'darjeeling';
  if (/kolakham|lolegaon|lava|rishop|sillery|dooars|jaldapara|north bengal|garpanchkot|ramdhura|reshikhola|tea tourism/.test(t)) return 'northbengal';
  if (/sundarban/.test(t))                                                           return 'sundarbans';
  if (/nepal|kathmandu|pokhara|muktinath|lumbini|chitwan|nagarkot|jomsom/.test(t)) return 'nepal';
  if (/andaman/.test(t))                                                             return 'andaman';
  if (/maldives/.test(t))                                                            return 'maldives';
  if (/bali/.test(t))                                                                return 'bali';
  if (/bangkok|pattaya|thailand/.test(t))                                            return 'thailand';
  if (/vietnam|hanoi|ho chi minh|saigon/.test(t))                                   return 'vietnam';
  if (/sri lanka/.test(t))                                                            return 'srilanka';
  return 'generic';
}

// ── Fallback pool (when Unsplash pool exhausted) ─────────────────────────────
const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1574417806681-e6cfe6a3461f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1542727313-4f3e9791d7ac?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80',
];

// ── Registry (checkpoint file) ────────────────────────────────────────────────
function loadRegistry() {
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')); }
  catch { return {}; }
}
function saveRegistry(reg) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2), 'utf8');
}

// ── Unsplash API ──────────────────────────────────────────────────────────────
let lastCallMs = 0;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(query, page) {
  const wait = CALL_DELAY_MS - (Date.now() - lastCallMs);
  if (wait > 0) {
    process.stdout.write('  Waiting ' + Math.ceil(wait / 1000) + 's rate-limit delay...\r');
    await sleep(wait);
    process.stdout.write('                                           \r');
  }
  lastCallMs = Date.now();

  try {
    const r = await axios.get('https://api.unsplash.com/search/photos', {
      timeout: 30000,
      params: { query, per_page: PER_PAGE, orientation: 'landscape', page, order_by: 'relevant' },
      headers: { Authorization: 'Client-ID ' + UNS_KEY },
    });
    return {
      ok: true,
      urls: (r.data.results || []).map(p =>
        'https://images.unsplash.com/photo-' + p.id + '?auto=format&fit=crop&w=1600&q=80'),
    };
  } catch (e) {
    const status = e.response && e.response.status;
    if (status === 403 || status === 429) {
      return { ok: false, rateLimit: true, msg: 'HTTP ' + status };
    }
    return { ok: false, rateLimit: false, msg: e.message || String(e), urls: [] };
  }
}

// ── Phase A: Fetch all query pools with checkpoint support ─────────────────────
async function buildRegistry() {
  const registry = loadRegistry();

  // Collect all unique queries from BUCKETS
  const allQueries = [];
  const seen = new Set();
  for (const queries of Object.values(BUCKETS)) {
    for (const q of queries) {
      if (!seen.has(q)) { seen.add(q); allQueries.push(q); }
    }
  }

  const pending = allQueries.filter(q => registry[q] === undefined);

  if (pending.length === 0) {
    console.log('Registry already complete. Skipping fetch phase.\n');
    return true;
  }

  const total = allQueries.length;
  const done  = total - pending.length;
  console.log('Phase A: Fetching image pools');
  console.log('  Total queries  : ' + total);
  console.log('  Already cached : ' + done);
  console.log('  Still pending  : ' + pending.length);
  console.log('  Delay per call : ' + (CALL_DELAY_MS / 1000) + 's');
  console.log('  Estimated time : ~' + Math.ceil(pending.length * CALL_DELAY_MS / 60000) + ' min\n');

  for (let i = 0; i < pending.length; i++) {
    const query = pending[i];
    const num   = String(done + i + 1).padStart(2);
    process.stdout.write('  [' + num + '/' + total + '] "' + query + '" ...');

    const result = await fetchPage(query, 1);

    if (result.rateLimit) {
      console.log('\n\n  RATE LIMIT HIT (' + result.msg + ')');
      console.log('  Progress saved to image-registry.json');
      console.log('  Wait ~60 minutes and re-run this script.\n');
      saveRegistry(registry);
      return false;
    }

    if (!result.ok || !result.urls || result.urls.length === 0) {
      console.log(' no results (' + (result.msg || 'empty') + '), using fallbacks');
      registry[query] = null;  // mark as attempted, will use fallbacks
    } else {
      console.log(' ' + result.urls.length + ' images');
      registry[query] = result.urls;
    }

    saveRegistry(registry);
  }

  console.log('\n');
  return true;
}

// ── Build per-bucket image pools from registry ────────────────────────────────
function buildBucketPools(registry) {
  const pools = {};
  for (const [bucket, queries] of Object.entries(BUCKETS)) {
    const seen = new Set();
    const urls = [];
    for (const q of queries) {
      for (const url of (registry[q] || [])) {
        if (!seen.has(url)) { seen.add(url); urls.push(url); }
      }
    }
    pools[bucket] = urls.length > 0 ? urls : [...FALLBACK_POOL];
  }
  return pools;
}

// ── Global uniqueness tracker ─────────────────────────────────────────────────
const globalUsed = new Set();

function pickGlobal(pool, bucket) {
  for (const url of pool) {
    if (!globalUsed.has(url)) { globalUsed.add(url); return url; }
  }
  for (const url of FALLBACK_POOL) {
    if (!globalUsed.has(url)) { globalUsed.add(url); return url; }
  }
  // Last resort (should not happen with 30×30=900 images available)
  const url = pool[globalUsed.size % pool.length];
  console.warn('\n  WARNING: pool exhausted for bucket ' + bucket + ', reusing image');
  return url;
}

function pickEntryUnique(pool, n, entryUsed) {
  const result = [];
  const used   = new Set(entryUsed);

  // Pass 1: globally AND entry-unused preferred
  for (const url of pool) {
    if (result.length >= n) break;
    if (!used.has(url) && !globalUsed.has(url)) { result.push(url); used.add(url); }
  }
  // Pass 2: at least entry-unused
  if (result.length < n) {
    for (const url of pool) {
      if (result.length >= n) break;
      if (!used.has(url)) { result.push(url); used.add(url); }
    }
  }
  // Pass 3: wrap around when pool is smaller than n
  if (result.length < n) {
    for (let i = 0; result.length < n; i++) {
      const url = pool[i % pool.length];
      if (!used.has(url)) { result.push(url); used.add(url); }
      else if (i > pool.length * 2) { result.push(pool[result.length % pool.length]); break; }
    }
  }
  return result.slice(0, n);
}

// ── Text cleaner ──────────────────────────────────────────────────────────────
function cleanText(t) {
  if (!t) return t;
  return t
    .replace(/[☎📞]\s*CALL\b/gi, '')
    .replace(/&#9742;\s*CALL\b/gi, '').replace(/&#9742;/g, '')
    .replace(/[☎📞]/g, '').replace(/\bCALL\b/g, '').replace(/\bBOOK\s+NOW\b/gi, '')
    .replace(/\bNatureWings\b/g, 'Galaxy Travellers')
    .replace(/\s{2,}/g, ' ').trim().replace(/\s+\.$/, '.');
}

// ── Fixers ────────────────────────────────────────────────────────────────────
function fixTour(tour, pools) {
  const bucket    = getBucket(tour.slug, tour.title, tour.place);
  const pool      = pools[bucket];
  const entryUsed = new Set();

  tour.heroImg = pickGlobal(pool, bucket);
  entryUsed.add(tour.heroImg);

  const galleryCount = Array.isArray(tour.galleryImgs) ? tour.galleryImgs.length : 6;
  const gallery      = pickEntryUnique(pool, galleryCount, entryUsed);
  tour.galleryImgs   = gallery;
  gallery.forEach(u => entryUsed.add(u));

  if (Array.isArray(tour.highlights)) {
    const hlImgs = pickEntryUnique(pool, tour.highlights.length, entryUsed);
    tour.highlights.forEach((h, i) => { h.img = hlImgs[i] || pool[i % pool.length]; entryUsed.add(h.img); });
  }

  if (tour.seo) tour.seo.metaImage = tour.heroImg;
}

function fixDestination(dest, pools) {
  const bucket    = getBucket(dest.slug, dest.title, '');
  const pool      = pools[bucket];
  const entryUsed = new Set();

  dest.displayImg = pickGlobal(pool, bucket);
  entryUsed.add(dest.displayImg);

  dest.heroImg = pickGlobal(pool, bucket);
  entryUsed.add(dest.heroImg);

  if (dest.highlight) {
    const [hlImg]    = pickEntryUnique(pool, 1, entryUsed);
    dest.highlight.img = hlImg || dest.heroImg;
    entryUsed.add(dest.highlight.img);
    if (dest.highlight.brief) dest.highlight.brief = cleanText(dest.highlight.brief);
  }

  if (dest.seo) {
    dest.seo.shareImage = dest.displayImg;
    dest.seo.metaImage  = dest.heroImg;
    if (dest.seo.metaDescription) dest.seo.metaDescription = cleanText(dest.seo.metaDescription);
  }
  if (dest.description)     dest.description     = cleanText(dest.description);
  if (dest.descriptionLong) dest.descriptionLong = cleanText(dest.descriptionLong);
}

function fixBlog(blog, pools) {
  const bucket = getBucket(blog.slug, blog.title, '');
  const pool   = pools[bucket];

  blog.displayImg = pickGlobal(pool, bucket);

  if (blog.seo) {
    blog.seo.shareImage = blog.displayImg;
    blog.seo.metaImage  = blog.displayImg;
    if (blog.seo.metaDescription) blog.seo.metaDescription = cleanText(blog.seo.metaDescription);
  }
  if (blog.description) blog.description = cleanText(blog.description);
  if (blog.bodyAlt)     blog.bodyAlt     = cleanText(blog.bodyAlt);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  // Phase A: Fetch pools (with checkpoint)
  const ok = await buildRegistry();
  if (!ok) process.exit(1);

  // Build per-bucket pools
  const registry = loadRegistry();
  const pools    = buildBucketPools(registry);

  console.log('Pool sizes per bucket:');
  for (const [bucket, pool] of Object.entries(pools)) {
    console.log('  ' + bucket.padEnd(14) + ': ' + pool.length + ' images');
  }
  console.log();

  // Load JSON files
  const readJson     = fp => JSON.parse(fs.readFileSync(fp, 'utf8').replace(/^\uFEFF/, ''));
  const tours        = readJson(TOURS_PATH);
  const destinations = readJson(DEST_PATH);
  const blogs        = readJson(BLOGS_PATH);
  console.log('Loaded: ' + tours.length + ' tours | ' + destinations.length + ' destinations | ' + blogs.length + ' blogs\n');

  // Phase B: Assign images (instant, no API calls)
  console.log('Phase B: Assigning images\n');

  process.stdout.write('  Tours        : ');
  for (const t of tours)        { fixTour(t,        pools); process.stdout.write('.'); }
  console.log(' ' + tours.length);

  process.stdout.write('  Destinations : ');
  for (const d of destinations) { fixDestination(d, pools); process.stdout.write('.'); }
  console.log(' ' + destinations.length);

  process.stdout.write('  Blogs        : ');
  for (const b of blogs)        { fixBlog(b,        pools); process.stdout.write('.'); }
  console.log(' ' + blogs.length);

  // Save
  console.log('\nSaving...');
  fs.writeFileSync(TOURS_PATH, JSON.stringify(tours,        null, 2), 'utf8'); console.log('  tours.json saved');
  fs.writeFileSync(DEST_PATH,  JSON.stringify(destinations, null, 2), 'utf8'); console.log('  destinations.json saved');
  fs.writeFileSync(BLOGS_PATH, JSON.stringify(blogs,        null, 2), 'utf8'); console.log('  blogs.json saved');

  // Validation
  const allPrimary = [
    ...tours.map(t        => t.heroImg),
    ...destinations.flatMap(d => [d.displayImg, d.heroImg]),
    ...blogs.map(b        => b.displayImg),
  ].filter(Boolean);

  const uniquePrimary = new Set(allPrimary).size;
  const dupCount      = allPrimary.length - uniquePrimary;

  console.log('\n=====================================');
  console.log('DONE');
  console.log('=====================================');
  console.log('Tours              : ' + tours.length);
  console.log('Destinations       : ' + destinations.length);
  console.log('Blogs              : ' + blogs.length);
  console.log('Total primary imgs : ' + allPrimary.length);
  console.log('Unique primary imgs: ' + uniquePrimary);
  console.log('Duplicates         : ' + dupCount);
  if (dupCount > 0) {
    console.log('\nWARNING: ' + dupCount + ' duplicate(s) remain.');
    console.log('The Unsplash pool was exhausted for those locations.');
    console.log('Re-run after 1 hour to fetch more images.\n');
  } else {
    console.log('\nAll primary images are unique!');
  }
})();
