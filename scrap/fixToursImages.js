"use strict";
/**
 * fixToursImages.js
 *
 * Fixes front/scrap/output/tours.json:
 *  1. heroImg, galleryImgs, highlights[].img  → place-relevant Unsplash images,
 *     unique within each tour (no internal duplicates).
 *  2. highlights[].brief → max 2-3 lines (~160 chars), clean text via Groq.
 *  3. seo.metaImage synced to heroImg.
 *
 * Usage:
 *   node scrap/fixToursImages.js
 */

const fs   = require("fs/promises");
const path = require("path");
const axios = require("axios");

const TOURS_JSON   = path.join(__dirname, "output", "tours.json");
const REPO_ROOT    = path.resolve(__dirname, "../../");
const GROQ_MODEL   = "llama-3.3-70b-versatile";
const MAX_BRIEF    = 165;          // max highlight brief chars
const UNSPLASH_PP  = 20;           // per_page for Unsplash search
const DELAY_UNS    = 800;          // ms between Unsplash calls
const DELAY_GROQ   = 2600;         // ms between Groq calls (~23/min, safe under 30)

// ─── ENV ─────────────────────────────────────────────────────────────────────
async function parseEnvFile(fp) {
  try {
    const raw = await fs.readFile(fp, "utf8");
    const map = {};
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf("=");
      if (idx === -1) continue;
      const k = t.slice(0, idx).trim();
      let v = t.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      map[k] = v;
    }
    return map;
  } catch { return {}; }
}

async function loadEnv() {
  const fe = await parseEnvFile(path.join(REPO_ROOT, "front/.env"));
  const be = await parseEnvFile(path.join(REPO_ROOT, "galaxy-traveller-backend/.env"));
  return { ...fe, ...be, ...process.env };
}

// ─── PLACE → UNSPLASH QUERY MAPPING ──────────────────────────────────────────
const PLACE_QUERIES = [
  ["bhutan",          "Bhutan Paro monastery Himalaya Tiger Nest"],
  ["kashmir",         "Kashmir Dal Lake Gulmarg snowy valley"],
  ["ladakh",          "Ladakh Pangong Tso lake monastery Leh"],
  ["meghalaya",       "Meghalaya Cherrapunji living root bridge waterfall"],
  ["tawang",          "Tawang monastery Arunachal Pradesh Buddhist"],
  ["arunachal",       "Arunachal Pradesh tribal mountain valley"],
  ["ziro",            "Ziro valley Arunachal rice paddy hills"],
  ["kaziranga",       "Kaziranga rhino elephant wetland Assam"],
  ["assam",           "Assam Brahmaputra tea garden wildlife"],
  ["manipur",         "Manipur Loktak lake floating island landscape"],
  ["nagaland",        "Nagaland Hornbill Festival tribal village"],
  ["mizoram",         "Mizoram hills bamboo forest tribe"],
  ["north east",      "Northeast India misty hills green valley"],
  ["sikkim",          "Sikkim Kanchenjunga sunrise monastery"],
  ["north sikkim",    "North Sikkim Yumthang rhododendron valley"],
  ["gangtok",         "Gangtok Sikkim mountain city MG Marg"],
  ["pelling",         "Pelling West Sikkim Kanchenjunga view"],
  ["darjeeling",      "Darjeeling tea garden Tiger Hill sunrise"],
  ["sandakphu",       "Sandakphu trekking Himalayan panoramic Kanchenjunga"],
  ["silk route",      "Sikkim Silk Route Zuluk mountain zigzag road"],
  ["kolakham",        "Kolakham forest Neora Valley birding misty"],
  ["dooars",          "Dooars forest elephant safari Bengal"],
  ["sundarban",       "Sundarbans mangrove delta tiger river Bengal"],
  ["north bengal",    "North Bengal mountains river Teesta valley"],
  ["nepal",           "Nepal Himalaya Kathmandu Pokhara Annapurna"],
  ["andaman",         "Andaman Nicobar Islands beach tropical clear water"],
  ["maldives",        "Maldives overwater bungalow turquoise ocean lagoon"],
  ["bali",            "Bali Indonesia temple terraced rice field sunset"],
  ["bangkok",         "Bangkok Thailand grand palace golden temple"],
  ["pattaya",         "Pattaya Thailand beach resort tropical"],
  ["vietnam",         "Vietnam Ha Long Bay limestone karst emerald water"],
  ["sri lanka",       "Sri Lanka Sigiriya tea plantation scenic coast"],
  ["lumbini",         "Lumbini Nepal Buddhist birthplace monastery"],
  ["pokhara",         "Pokhara Nepal Phewa Lake Annapurna reflection"],
  ["kailash",         "Kailash Mansarovar sacred lake Tibetan pilgrimage"],
  ["garpanchkot",     "Garpanchkot fort ruins North Bengal misty"],
  ["ramdhura",        "Ramdhura Kolakham village North Bengal forest"],
  ["reshikhola",      "Reshikhola village river North Bengal forest"],
  ["lava",            "Lava Lolegaon North Bengal forest misty village"],
];

function getSearchQuery(place = "", title = "") {
  const text = (place + " " + title).toLowerCase();
  for (const [key, q] of PLACE_QUERIES) {
    if (text.includes(key)) return q;
  }
  // Fallback: use first meaningful word from place field
  const word = place.replace(/[^a-zA-Z\s]/g, " ").trim().split(/\s+/)[0] || "India";
  return `${word} scenic travel landscape India`;
}

// ─── FALLBACK IMAGE POOL (if Unsplash key missing/fails) ─────────────────────
const FALLBACK_POOL = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1574417806681-e6cfe6a3461f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1542727313-4f3e9791d7ac?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1576400883215-7083980b6674?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1600&q=80",
];

// ─── UNSPLASH FETCHER (cached per query) ──────────────────────────────────────
const imgPoolCache = new Map();   // query → string[]
let lastUnsCall    = 0;

async function getImagePool(query, unsKey) {
  if (imgPoolCache.has(query)) return imgPoolCache.get(query);

  if (!unsKey) {
    imgPoolCache.set(query, [...FALLBACK_POOL]);
    return FALLBACK_POOL;
  }

  const wait = DELAY_UNS - (Date.now() - lastUnsCall);
  if (wait > 0) await sleep(wait);
  lastUnsCall = Date.now();

  console.log(`  📸 Unsplash: "${query}"`);
  try {
    const r = await axios.get("https://api.unsplash.com/search/photos", {
      timeout: 30000,
      params: { query, per_page: UNSPLASH_PP, orientation: "landscape", page: 1 },
      headers: { Authorization: `Client-ID ${unsKey}` },
    });
    const results = r.data?.results || [];
    const imgs = results
      .map(img => `https://images.unsplash.com/photo-${img.id}?auto=format&fit=crop&w=1600&q=80`)
      .filter(Boolean);

    const pool = imgs.length >= 5 ? imgs : [...FALLBACK_POOL, ...imgs];
    imgPoolCache.set(query, pool);
    return pool;
  } catch (e) {
    console.warn(`    ⚠ Unsplash failed: ${e.message}`);
    imgPoolCache.set(query, [...FALLBACK_POOL]);
    return FALLBACK_POOL;
  }
}

// ─── IMAGE ASSIGNMENT ─────────────────────────────────────────────────────────
/**
 * Pick `count` unique images from pool.
 * If pool is smaller than count, images may repeat but won't be adjacent.
 */
function pickUnique(pool, count) {
  const result = [];
  // First pass: unique from pool
  for (const img of pool) {
    if (result.length >= count) break;
    if (!result.includes(img)) result.push(img);
  }
  // Second pass: wrap around if still short
  if (result.length < count) {
    for (let i = 0; result.length < count; i++) {
      const img = pool[i % pool.length];
      // allow a repeat only if we absolutely have to
      result.push(img);
    }
  }
  return result.slice(0, count);
}

async function assignImages(tour, unsKey) {
  const query   = getSearchQuery(tour.place, tour.title);
  const pool    = await getImagePool(query, unsKey);

  const galleryCount    = Array.isArray(tour.galleryImgs)    ? tour.galleryImgs.length    : 6;
  const highlightCount  = Array.isArray(tour.highlights)     ? tour.highlights.length     : 4;
  const totalNeeded     = 1 + galleryCount + highlightCount;

  const assigned = pickUnique(pool, totalNeeded);
  let idx = 0;

  tour.heroImg     = assigned[idx++];
  tour.galleryImgs = assigned.slice(idx, idx + galleryCount);
  idx += galleryCount;

  if (Array.isArray(tour.highlights)) {
    for (let i = 0; i < tour.highlights.length; i++) {
      tour.highlights[i].img = assigned[idx++] || pool[i % pool.length];
    }
  }

  // Sync SEO image to heroImg
  if (tour.seo) tour.seo.metaImage = tour.heroImg;
}

// ─── BRIEF CLEANER ────────────────────────────────────────────────────────────
function cleanBrief(brief = "") {
  return brief
    .trim()
    .replace(/[☎📞]\s*CALL/gi, "")
    .replace(/\bCALL\b/gi, "")
    .replace(/\bBOOK\s+NOW\b/gi, "")
    .replace(/\bBEST\s+RATE\b/gi, "")
    .replace(/at\.\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function trimToLimit(text) {
  const t = cleanBrief(text);
  if (t.length <= MAX_BRIEF) return t;
  // Cut at sentence boundary
  const cut = t.slice(0, MAX_BRIEF);
  const dot  = cut.lastIndexOf(".");
  const qm   = cut.lastIndexOf("?");
  const em   = cut.lastIndexOf("!");
  const boundary = Math.max(dot, qm, em);
  if (boundary > 60) return cut.slice(0, boundary + 1).trim();
  // No sentence boundary found — cut at word boundary
  const sp = cut.lastIndexOf(" ");
  return (sp > 60 ? cut.slice(0, sp) : cut).trim();
}

function needsFix(brief = "") {
  const b = cleanBrief(brief);
  if (!b || b.length < 5)             return true;   // empty/too short
  if (b.length > MAX_BRIEF)           return true;   // too long
  if (b === b.toUpperCase() && b.length > 15) return true; // ALL CAPS
  if (/customized\s+tour/i.test(b))   return true;   // generic CTA
  if (/^["'""]/.test(b) && b.length > MAX_BRIEF) return true;
  return false;
}

// ─── GROQ HIGHLIGHT BRIEF REWRITER ───────────────────────────────────────────
let lastGroqCall = 0;

async function fixBriefsWithGroq(tour, env) {
  if (!Array.isArray(tour.highlights) || tour.highlights.length === 0) return;

  const anyNeedsFix = tour.highlights.some(h => needsFix(h.brief));

  if (!anyNeedsFix) {
    // Just clean & ensure within limit
    for (const h of tour.highlights) h.brief = trimToLimit(h.brief);
    return;
  }

  const groqKey = env.GROQ_API_KEY || env.GROQ_API_KEY2;
  if (!groqKey) {
    for (const h of tour.highlights) h.brief = trimToLimit(h.brief);
    return;
  }

  const place = (tour.place || tour.title || "").trim();
  const list  = tour.highlights
    .map((h, i) => `${i + 1}. "${(h.brief || h.title || "no description").trim()}"`)
    .join("\n");

  const prompt =
`You are a travel copywriter for a tour package about "${place}".

Rewrite each highlight description below:
- 1–2 complete sentences only
- Max ${MAX_BRIEF} characters per description
- Specific to ${place} travel experience
- No phone numbers, no "CALL", "BOOK NOW", "CUSTOMIZED TOUR"
- Natural, inviting, informative tone
- Do NOT cut off mid-word or mid-sentence

Current descriptions:
${list}

Reply with ONLY a JSON array of strings (same count, same order):
["rewritten 1", "rewritten 2", ...]`;

  try {
    const wait = DELAY_GROQ - (Date.now() - lastGroqCall);
    if (wait > 0) await sleep(wait);
    lastGroqCall = Date.now();

    const r = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 600,
      },
      {
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        timeout: 35000,
      }
    );

    const content = r.data?.choices?.[0]?.message?.content || "";
    const match   = content.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error("No JSON array in Groq response");

    const briefs = JSON.parse(match[0]);
    for (let i = 0; i < tour.highlights.length; i++) {
      const nb = briefs[i];
      tour.highlights[i].brief = (typeof nb === "string" && nb.trim())
        ? nb.trim().slice(0, MAX_BRIEF + 20)   // allow tiny overrun, clean next
        : trimToLimit(tour.highlights[i].brief);
    }
  } catch (e) {
    console.warn(`    ⚠ Groq failed (${tour.title.slice(0, 40)}): ${e.message}`);
    for (const h of tour.highlights) h.brief = trimToLimit(h.brief);
  }
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== fixToursImages.js ===\n");

  const env = await loadEnv();

  const unsKey  = env.UNSPLASH_ACCESS_KEY;
  const groqKey = env.GROQ_API_KEY || env.GROQ_API_KEY2;
  console.log(`Unsplash key: ${unsKey ? "✓ found" : "✗ MISSING — using fallbacks"}`);
  console.log(`Groq key:     ${groqKey ? "✓ found" : "✗ MISSING — briefs will be trimmed only"}`);

  const tours = JSON.parse(await fs.readFile(TOURS_JSON, "utf8"));
  console.log(`\nLoaded ${tours.length} tours.\n`);

  let imgFixed   = 0;
  let briefFixed = 0;
  let errors     = 0;

  for (let i = 0; i < tours.length; i++) {
    const tour = tours[i];
    const label = `[${String(i + 1).padStart(3, "0")}/${tours.length}] ${tour.title.slice(0, 55)}`;
    process.stdout.write(`${label}...`);

    try {
      // 1. Assign place-relevant, intra-tour-unique images
      await assignImages(tour, unsKey);
      imgFixed++;

      // 2. Rewrite/trim highlight briefs via Groq
      await fixBriefsWithGroq(tour, env);
      briefFixed++;

      process.stdout.write(" ✓\n");
    } catch (e) {
      process.stdout.write(` ✗ ${e.message}\n`);
      errors++;
    }
  }

  console.log(`\nSaving tours.json...`);
  await fs.writeFile(TOURS_JSON, JSON.stringify(tours, null, 2) + "\n", "utf8");

  console.log(`\n✅ Done.`);
  console.log(`   Image pools fetched: ${imgPoolCache.size} unique queries`);
  console.log(`   Tours with images fixed: ${imgFixed}`);
  console.log(`   Tours with briefs fixed: ${briefFixed}`);
  if (errors) console.log(`   ⚠ Errors: ${errors}`);
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
