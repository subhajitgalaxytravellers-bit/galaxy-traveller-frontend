#!/usr/bin/env node
/**
 * fixDestinationsBlogsImages.js
 *
 * Fixes front/scrap/output/destinations.json and blogs.json:
 *
 *  IMAGES (primary goal):
 *    Destinations: displayImg, heroImg, highlight.img, seo.shareImage, seo.metaImage
 *    Blogs       : displayImg, seo.shareImage, seo.metaImage
 *    → All replaced with location-relevant Unsplash photos
 *    → No duplicate URLs within the same entry
 *    → Entries with the same location rotate through the pool (variety)
 *    → seo.metaImage = heroImg  (destinations)
 *    → seo.metaImage = displayImg (blogs)
 *
 *  TEXT CLEANUP (bonus):
 *    → Strips ☎ CALL, &#9742;, 📞, "NatureWings" from description/brief/metaDescription
 *
 * Usage:
 *   cd front && node scrap/fixDestinationsBlogsImages.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const axios = require('axios');

// ── Paths ────────────────────────────────────────────────────────────────────
const ROOT          = path.resolve(__dirname, '../../');
const DEST_PATH     = path.resolve(__dirname, 'output/destinations.json');
const BLOGS_PATH    = path.resolve(__dirname, 'output/blogs.json');
const UNSPLASH_PP   = 20;        // photos per search page
const DELAY_UNS     = 900;       // ms between unique Unsplash API calls

// ── Load .env files ───────────────────────────────────────────────────────────
function parseEnv(fp) {
  const map = {};
  try {
    for (const line of fs.readFileSync(fp, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const idx = t.indexOf('=');
      if (idx === -1) continue;
      const k = t.slice(0, idx).trim();
      let v = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      map[k] = v;
    }
  } catch {}
  return map;
}
const env = {
  ...parseEnv(path.join(ROOT, 'front/.env')),
  ...parseEnv(path.join(ROOT, 'galaxy-traveller-backend/.env')),
};
const UNS_KEY = env.UNSPLASH_ACCESS_KEY || env.UNSPLASH_API_KEY || env.UNSPLASH_KEY;
if (!UNS_KEY) { console.error('❌  UNSPLASH_ACCESS_KEY not found in .env'); process.exit(1); }
console.log('Unsplash key: ✓ found\n');

// ── Place → search query map ──────────────────────────────────────────────────
// Ordered from most-specific to least; first match wins.
const PLACE_QUERIES = [
  // Bhutan
  ['eastern bhutan',     'Eastern Bhutan Trashigang monastery valley'],
  ['paro',               'Paro Tiger Nest Monastery Bhutan valley'],
  ['punakha',            'Punakha Dzong river Bhutan palace'],
  ['thimphu',            'Thimphu Bhutan capital Buddha mountain'],
  ['phuentsholing',      'Phuentsholing Bhutan border town hills'],
  ['jaigaon',            'Bhutan border India Himalayan town mountains'],
  ['bhutan',             'Bhutan Tiger Nest monastery Himalaya dzong'],
  // India mountains
  ['kailash',            'Kailash Mansarovar sacred lake Tibet pilgrimage'],
  ['leh ladakh',         'Leh Ladakh Pangong Tso monastery landscape'],
  ['pangong',            'Pangong Tso lake Ladakh blue water mountains'],
  ['nubra valley',       'Nubra Valley Ladakh sand dunes Bactrian camel'],
  ['siachen',            'Siachen glacier India Ladakh mountains snow'],
  ['ladakh',             'Ladakh Pangong monastery Leh mountain desert'],
  ['kashmir',            'Kashmir Dal Lake Gulmarg shikara valley snowy'],
  ['gulmarg',            'Gulmarg Kashmir ski resort meadow mountains'],
  ['sonmarg',            'Sonamarg Kashmir glacier river meadow'],
  ['vaishno devi',       'Vaishno Devi temple Katra pilgrimage Jammu'],
  ['gurez',              'Gurez Valley Kashmir remote village Himalaya'],
  ['doodhpathri',        'Doodhpathri Kashmir meadow stream mountains'],
  ['yusmarg',            'Yusmarg Kashmir meadow forest mountains'],
  ['amritsar',           'Amritsar Golden Temple Punjab Wagah border'],
  // Northeast India
  ['tawang',             'Tawang monastery Arunachal Pradesh Buddhist valley'],
  ['ziro',               'Ziro Valley Arunachal Pradesh paddy hills tribe'],
  ['arunachal',          'Arunachal Pradesh tribe mountain valley river'],
  ['bumla pass',         'Bumla Pass Indo-China border Arunachal snow'],
  ['shillong',           'Shillong Meghalaya Scotland of East cathedral'],
  ['cherrapunji',        'Cherrapunji Meghalaya waterfall living root bridge'],
  ['meghalaya',          'Meghalaya Cherrapunji living root bridge waterfall'],
  ['kaziranga',          'Kaziranga National Park rhino elephant Assam'],
  ['manas',              'Manas National Park tiger rhino Assam forest'],
  ['majuli',             'Majuli river island Assam Brahmaputra festival'],
  ['pobitora',           'Pobitora Wildlife Sanctuary rhino Assam wetland'],
  ['guwahati',           'Guwahati Brahmaputra Kamakhya temple Assam city'],
  ['assam',              'Assam tea garden Brahmaputra wildlife forest'],
  ['kohima',             'Kohima Nagaland war cemetery Hornbill Festival'],
  ['dzukou',             'Dzukou Valley Nagaland flowers trekking misty'],
  ['nagaland',           'Nagaland Hornbill festival tribal warrior village'],
  ['manipur',            'Manipur Loktak lake floating island Shirui flower'],
  ['imphal',             'Imphal Manipur Ima Keithel Kangla Fort'],
  ['mokokchung',         'Mokokchung Nagaland tribal village Ao Naga'],
  ['mizoram',            'Mizoram Aizawl bamboo hills tribe'],
  ['seven sisters',      'Northeast India seven sisters states mountains'],
  ['north east',         'Northeast India misty hills green valleys tribe'],
  // Sikkim & Darjeeling
  ['sandakphu',          'Sandakphu trekking Himalayan panorama Kanchenjunga'],
  ['kanchenjunga',       'Kanchenjunga Sikkim snow peak Himalaya'],
  ['north sikkim',       'North Sikkim Yumthang rhododendron Gurudongmar'],
  ['lachen',             'Lachen North Sikkim Gurudongmar Lake snow'],
  ['lachung',            'Lachung North Sikkim Yumthang valley flowers'],
  ['gangtok',            'Gangtok Sikkim city Himalayan mountain MG Marg'],
  ['pelling',            'Pelling West Sikkim Kanchenjunga monasteries'],
  ['ravangla',           'Ravangla Sikkim Buddha Park mountain valley'],
  ['namchi',             'Namchi Sikkim Samdruptse monastery statue'],
  ['okhrey',             'Okhrey Kaluk West Sikkim tea village misty'],
  ['kaluk',              'Kaluk village Sikkim tea garden mountain'],
  ['sikkim',             'Sikkim monastery Kanchenjunga sunrise Buddhist'],
  ['darjeeling',         'Darjeeling tea garden Tiger Hill sunrise Himalaya'],
  ['kolakham',           'Kolakham Neora Valley forest birding misty Bengal'],
  ['tinchuley',          'Tinchuley village Darjeeling orange orchard misty'],
  ['mangwa',             'Darjeeling Mangwa organic village misty forest'],
  ['silk route',         'Sikkim Silk Route Zuluk mountain zigzag road'],
  ['dooars',             'Dooars forest elephant safari tea Bengal river'],
  ['jaldapara',          'Jaldapara National Park rhino elephant Bengal'],
  ['neoravalley',        'Neora Valley National Park Bengal forest birding'],
  ['lava',               'Lava Lolegaon North Bengal pine forest village misty'],
  ['lolegaon',           'Lolegaon canopy walk North Bengal forest'],
  ['rishop',             'Rishop North Bengal forest mountain village'],
  ['reshikhola',         'Reshikhola village river North Bengal forest'],
  ['sillery gaon',       'Sillery Gaon North Bengal bamboo cottage'],
  ['garpanchkot',        'Garpanchkot fort ruins North Bengal misty hills'],
  ['ramdhura',           'Ramdhura village North Bengal forest scenic'],
  ['sundarban',          'Sundarbans mangrove delta Bengal Royal Bengal Tiger'],
  ['north bengal',       'North Bengal Himalayan foothills river tea'],
  // Nepal
  ['muktinath',          'Muktinath temple Nepal pilgrimage Mustang'],
  ['jomsom',             'Jomsom Mustang Nepal Annapurna valley desert'],
  ['lumbini',            'Lumbini Nepal Buddha birthplace monastery peace'],
  ['pokhara',            'Pokhara Nepal Phewa Lake Annapurna reflection'],
  ['chitwan',            'Chitwan National Park Nepal elephant rhino jungle'],
  ['nagarkot',           'Nagarkot Nepal Himalaya sunrise viewpoint'],
  ['kathmandu',          'Kathmandu Nepal Durbar Square Boudhanath stupa'],
  ['nepal',              'Nepal Himalaya Annapurna Kathmandu mountain valley'],
  // International
  ['andaman',            'Andaman Islands tropical beach clear turquoise water'],
  ['maldives',           'Maldives overwater bungalow lagoon tropical coral'],
  ['bali',               'Bali Indonesia rice terraces temple sunset volcano'],
  ['bangkok',            'Bangkok Thailand grand palace tuk-tuk Chao Phraya'],
  ['pattaya',            'Pattaya Thailand beach resort coral night market'],
  ['vietnam',            'Vietnam Ha Long Bay limestone karst emerald water'],
  ['hanoi',              'Hanoi Vietnam old quarter lotus lake lantern'],
  ['ho chi minh',        'Ho Chi Minh City Vietnam Saigon skyline street'],
  ['sri lanka',          'Sri Lanka Sigiriya tea plantation ocean coast'],
  ['belun',              'Bhutan luxury eco resort Himalayan forest'],
  ['six senses',         'Bhutan Six Senses luxury resort Paro valley'],
  // Fallback
  ['bike',               'Ladakh motorcycle road trip Himalayan highway'],
  ['b2b',                'Bhutan travel trade agent tour package'],
];

function getSearchQuery(slug = '', title = '') {
  const text = (slug + ' ' + title).toLowerCase().replace(/-/g, ' ');
  for (const [key, q] of PLACE_QUERIES) {
    if (text.includes(key)) return q;
  }
  // Generic fallback: pick first word not a common stopword
  const stopwords = new Set(['the', 'a', 'an', 'from', 'to', 'and', 'or', 'in', 'of', 'with', 'for', 'on', 'at', 'by', 'tour', 'package', 'best', 'deal', 'guide', 'complete', 'book', 'discover', 'travel', 'hidden', 'gem', 'packages']);
  const words = text.split(/[\s\-_]+/).filter(w => w.length > 2 && !stopwords.has(w));
  const keyword = words[0] || 'India';
  return `${keyword} India scenic travel landscape mountains`;
}

// ── Text cleaner ──────────────────────────────────────────────────────────────
function cleanText(t) {
  if (!t) return t;
  return t
    .replace(/[☎📞]\s*CALL\b/g, '')
    .replace(/&#9742;\s*CALL\b/g, '')
    .replace(/&#9742;/g, '')
    .replace(/☎/g, '').replace(/📞/g, '')
    .replace(/\bCALL\b/g, '')
    .replace(/\bNatureWings\b/g, 'Galaxy Travellers')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/\s+\.$/, '.')
    .replace(/([^.!?])$/, '$1.');
}

// ── Unsplash fetcher (cached per query) ───────────────────────────────────────
const poolCache = new Map();       // query → url[]
const poolOffsets = new Map();     // query → next pick offset (for rotation)
let lastUnsCall = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getPool(query) {
  if (poolCache.has(query)) return poolCache.get(query);

  const wait = DELAY_UNS - (Date.now() - lastUnsCall);
  if (wait > 0) await sleep(wait);
  lastUnsCall = Date.now();

  console.log(`  📸 Unsplash: "${query}"`);
  try {
    const r = await axios.get('https://api.unsplash.com/search/photos', {
      timeout: 20000,
      params: {
        query,
        per_page: UNSPLASH_PP,
        orientation: 'landscape',
        page: 1,
        order_by: 'relevant',
      },
      headers: { Authorization: `Client-ID ${UNS_KEY}` },
    });
    const results = (r.data?.results || []);
    const urls = results.map(p =>
      `https://images.unsplash.com/photo-${p.id}?auto=format&fit=crop&w=1600&q=80`
    );
    // Ensure we have at least 5; pad with fallback if fewer
    const pool = urls.length >= 5 ? urls : [...FALLBACK_POOL, ...urls];
    poolCache.set(query, pool);
    poolOffsets.set(query, 0);
    return pool;
  } catch (e) {
    console.warn(`    ⚠ Unsplash failed: ${e.message}`);
    poolCache.set(query, [...FALLBACK_POOL]);
    poolOffsets.set(query, 0);
    return [...FALLBACK_POOL];
  }
}

// ── Fallback pool ─────────────────────────────────────────────────────────────
const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1542727313-4f3e9791d7ac?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1576400883215-7083980b6674?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1574417806681-e6cfe6a3461f?auto=format&fit=crop&w=1600&q=80',
];

/**
 * Pick `n` unique photos from the pool, rotating position per query
 * so different entries with same location get different photos.
 */
function pickPhotos(pool, query, n) {
  const offset = poolOffsets.get(query) || 0;
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(pool[(offset + i) % pool.length]);
  }
  // Ensure no duplicates within this pick (handle if pool < n)
  const seen = new Set();
  const deduped = [];
  for (const url of result) {
    if (!seen.has(url)) { seen.add(url); deduped.push(url); }
    else {
      // find next unused
      for (let k = 0; k < pool.length; k++) {
        const alt = pool[(offset + k) % pool.length];
        if (!seen.has(alt)) { seen.add(alt); deduped.push(alt); break; }
      }
    }
  }
  // Advance offset for next entry with same query
  poolOffsets.set(query, (offset + n) % pool.length);
  return deduped;
}

// ── Destination fixer ─────────────────────────────────────────────────────────
/**
 * Image slots needed per destination entry:
 *   [0] displayImg
 *   [1] heroImg
 *   [2] highlight.img
 *   seo.shareImage  = [0]  (same as displayImg)
 *   seo.metaImage   = [1]  (same as heroImg)
 */
async function fixDestination(dest) {
  const query = getSearchQuery(dest.slug, dest.title);
  const pool  = await getPool(query);
  const imgs  = pickPhotos(pool, query, 3);

  dest.displayImg = imgs[0];
  dest.heroImg    = imgs[1];

  if (dest.highlight) {
    dest.highlight.img   = imgs[2];
    dest.highlight.brief = cleanText(dest.highlight.brief);
  }

  if (dest.seo) {
    dest.seo.shareImage = imgs[0];
    dest.seo.metaImage  = imgs[1];
    if (dest.seo.metaDescription) dest.seo.metaDescription = cleanText(dest.seo.metaDescription);
  }

  if (dest.description)     dest.description     = cleanText(dest.description);
  if (dest.descriptionLong) dest.descriptionLong = cleanText(dest.descriptionLong);
}

// ── Blog fixer ────────────────────────────────────────────────────────────────
/**
 * Image slots needed per blog entry:
 *   [0] displayImg
 *   seo.shareImage = [0]
 *   seo.metaImage  = [0]
 */
async function fixBlog(blog) {
  const query = getSearchQuery(blog.slug, blog.title);
  const pool  = await getPool(query);
  const imgs  = pickPhotos(pool, query, 1);

  blog.displayImg = imgs[0];

  if (blog.seo) {
    blog.seo.shareImage = imgs[0];
    blog.seo.metaImage  = imgs[0];
    if (blog.seo.metaDescription) blog.seo.metaDescription = cleanText(blog.seo.metaDescription);
  }

  if (blog.description) blog.description = cleanText(blog.description);
  if (blog.bodyAlt)     blog.bodyAlt     = cleanText(blog.bodyAlt);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const readJson = fp => JSON.parse(fs.readFileSync(fp, 'utf8').replace(/^\uFEFF/, ''));
  const destinations = readJson(DEST_PATH);
  const blogs        = readJson(BLOGS_PATH);
  console.log(`Loaded ${destinations.length} destinations, ${blogs.length} blogs.\n`);

  // ── Destinations ────────────────────────────────────────────────────────────
  console.log('─── Fixing destinations images ───\n');
  for (let i = 0; i < destinations.length; i++) {
    const d = destinations[i];
    try {
      await fixDestination(d);
      console.log(`  [${String(i + 1).padStart(3)}/${destinations.length}] ✓  ${d.title?.slice(0, 55)}`);
    } catch (e) {
      console.error(`  [${String(i + 1).padStart(3)}/${destinations.length}] ✗  ${d.title?.slice(0, 40)} — ${e.message}`);
    }
  }

  console.log('\n─── Fixing blogs images ───\n');
  for (let i = 0; i < blogs.length; i++) {
    const b = blogs[i];
    try {
      await fixBlog(b);
      console.log(`  [${String(i + 1).padStart(3)}/${blogs.length}] ✓  ${b.title?.slice(0, 55)}`);
    } catch (e) {
      console.error(`  [${String(i + 1).padStart(3)}/${blogs.length}] ✗  ${b.title?.slice(0, 40)} — ${e.message}`);
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  console.log('\nSaving destinations.json...');
  fs.writeFileSync(DEST_PATH, JSON.stringify(destinations, null, 2), 'utf8');
  console.log('Saving blogs.json...');
  fs.writeFileSync(BLOGS_PATH, JSON.stringify(blogs, null, 2), 'utf8');

  // ── Summary ───────────────────────────────────────────────────────────────
  const uniqueQueries = poolCache.size;
  console.log(`
✅  Done.
   Destinations updated   : ${destinations.length}
   Blogs updated          : ${blogs.length}
   Unique Unsplash queries: ${uniqueQueries}
   (${uniqueQueries} API calls made — rest served from cache)
`);
})();
