"use strict";

/**
 * ============================================================
 *  GALAXY TRAVELLERS — Tour Image Fixer  (Production Script)
 * ============================================================
 *
 *  Strategy (3-phase):
 *    Phase 1 – Collect ALL unique queries across every tour (instant)
 *    Phase 2 – Pre-warm cache: fetch every unique query once via API
 *    Phase 3 – Assign images from cache to all tours (no more API calls)
 *
 *  This minimises API calls to  ≈ unique_queries  (not tours × queries).
 *  For 160 tours across ~25 destinations: ~120–180 unique queries total.
 *
 *  Reads  : front/scrap/output/tours.json
 *  Writes : front/scrap/output/tours.updated.json
 *           front/scrap/output/image-fix-report.json
 *
 *  Usage:
 *    cd front
 *    node scrap/fixToursImagesProd/index.js
 *
 *  Env keys (in front/.env OR galaxy-traveller-backend/.env):
 *    UNSPLASH_ACCESS_KEY=<your key>
 *    FREEPIK_API_KEY=<your key>       (optional — Unsplash alone is fine)
 *    DEBUG_IMAGES=1                   (optional verbose logging)
 */

const fs   = require("fs");
const path = require("path");

// ─── Resolve project root & load .env from both sub-projects ──────────────────
const SCRIPT_DIR = __dirname;
const ROOT       = path.resolve(SCRIPT_DIR, "../../..");  // GalaxyTravellers/

function loadEnvFile(fp) {
  if (!fs.existsSync(fp)) return;
  const lines = fs.readFileSync(fp, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx < 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let   val = line.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Don't overwrite vars that were already set in the actual process.env
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(ROOT, "front",                    ".env"));
loadEnvFile(path.join(ROOT, "galaxy-traveller-backend", ".env"));

// ─── Validate API keys ────────────────────────────────────────────────────────
const UNSPLASH_KEY = (
  process.env.UNSPLASH_ACCESS_KEY ||
  process.env.UNSPLASH_API_KEY    ||
  process.env.UNSPLASH_KEY        || ""
).trim();

const PEXELS_KEY  = (process.env.PEXELS_API_KEY || "").trim();
const FREEPIK_KEY = (process.env.FREEPIK_API_KEY || "").trim();

if (!UNSPLASH_KEY && !PEXELS_KEY && !FREEPIK_KEY) {
  console.error(
    "\n[ERROR] No API key found.\n" +
    "        Add at least one of these to front/.env:\n\n" +
    "          PEXELS_API_KEY=<key>         (recommended — 200 req/hr free)\n" +
    "          UNSPLASH_ACCESS_KEY=<key>    (50 req/hr demo / 5000 production)\n"
  );
  process.exit(1);
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const OUTPUT_DIR   = path.join(ROOT, "front", "scrap", "output");
const TOURS_INPUT  = path.join(OUTPUT_DIR, "tours.json");
const TOURS_OUTPUT = path.join(OUTPUT_DIR, "tours.updated.json");
const REPORT_PATH  = path.join(OUTPUT_DIR, "image-fix-report.json");
const CACHE_PATH   = path.join(OUTPUT_DIR, "image-cache.json");   // disk cache for resuming

// ─── Modules ──────────────────────────────────────────────────────────────────
const { createImageApi }  = require("./lib/imageApi");
const { processTour }     = require("./lib/tourProcessor");
const { generateQueries } = require("./lib/queryBuilder");

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const banner = "=".repeat(62);
  console.log(`\n${banner}`);
  console.log("   GALAXY TRAVELLERS — Tour Image Fixer  (Production)");
  console.log(`${banner}\n`);

  console.log(`[CONFIG] Pexels key   : ${PEXELS_KEY   ? "✓ present" : "✗ missing (add PEXELS_API_KEY)"  }`);
  console.log(`[CONFIG] Unsplash key : ${UNSPLASH_KEY ? "✓ present" : "✗ missing"}`);
  console.log(`[CONFIG] Freepik key  : ${FREEPIK_KEY  ? "\u2713 present (enabled as fallback)" : "\u2717 missing"}`);
  if (!PEXELS_KEY && !FREEPIK_KEY && !UNSPLASH_KEY) {
    console.warn(
      "\n[WARN]  No image API key found at all. No images will be updated.\n"
    );
  } else if (!FREEPIK_KEY) {
    console.log("[INFO]  No Freepik key — using Unsplash only (50 req/hr demo limit).\n");
  }

  // ── Load tours ──────────────────────────────────────────────────────────────
  if (!fs.existsSync(TOURS_INPUT)) {
    console.error(`[ERROR] Input file not found:\n        ${TOURS_INPUT}`);
    process.exit(1);
  }

  let tours;
  try {
    tours = JSON.parse(fs.readFileSync(TOURS_INPUT, "utf8"));
  } catch (err) {
    console.error(`[ERROR] Failed to parse tours.json: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(tours) || tours.length === 0) {
    console.error("[ERROR] tours.json must be a non-empty array.");
    process.exit(1);
  }

  console.log(`[INFO]  Loaded ${tours.length} tours from input file.\n`);

  const imageApi = createImageApi({
    unsplashKey  : UNSPLASH_KEY,
    pexelsKey    : PEXELS_KEY,
    freepikKey   : FREEPIK_KEY,
    diskCachePath: CACHE_PATH,
  });

  const diskLoaded = imageApi.getDiskCacheLoaded();
  if (diskLoaded > 0) {
    console.log(`[CACHE]  Loaded ${diskLoaded} queries from disk cache (resuming previous run).\n`);
  }

  // ════════════════════════════════════════════════════════════
  //  PHASE 1 — Collect ALL unique queries from every tour
  // ════════════════════════════════════════════════════════════
  console.log("[PHASE 1]  Collecting unique queries from all tours...");

  const allQueriesSet = new Set();

  for (const tour of tours) {
    if (!tour || typeof tour !== "object" || !tour.slug) continue;
    const { heroQuery, galleryQueries, highlightQueries } = generateQueries(tour);
    allQueriesSet.add(heroQuery);
    for (const q of galleryQueries)               allQueriesSet.add(q);
    for (const [, q] of highlightQueries.entries()) allQueriesSet.add(q);
  }

  const allQueries = [...allQueriesSet];
  console.log(`[PHASE 1]  Found ${allQueries.length} unique queries across ${tours.length} tours.\n`);

  // ════════════════════════════════════════════════════════════
  //  PHASE 2 — Pre-warm cache: fetch every unique query ONCE
  // ════════════════════════════════════════════════════════════
  console.log("[PHASE 2]  Pre-warming image cache (all API calls happen here)...");
  console.log(`           Fetching ${allQueries.length} queries — each is called only once.\n`);

  const phase2Start = Date.now();
  let fetchedCount  = 0;

  for (const query of allQueries) {
    fetchedCount++;
    const pct = Math.round((fetchedCount / allQueries.length) * 100);
    process.stdout.write(
      `\r[PHASE 2]  ${String(fetchedCount).padStart(4)}/${allQueries.length}  (${String(pct).padStart(3)}%)  —  ${((Date.now() - phase2Start) / 1000).toFixed(1)}s  query: ${query.substring(0, 50)}...   `
    );
    await imageApi.fetchImages(query);
  }

  process.stdout.write("\n");
  const phase2Elapsed = ((Date.now() - phase2Start) / 1000).toFixed(1);
  const apiStats      = imageApi.getStats();
  console.log(`\n[PHASE 2]  Done in ${phase2Elapsed}s`);
  console.log(`           API calls — Pexels: ${apiStats.pexelsCalls}  Unsplash: ${apiStats.unsplashCalls}  Freepik: ${apiStats.freepikCalls}`);
  console.log(`           Cache size: ${imageApi.getCacheSize()} queries  |  Total images indexed: ${apiStats.totalImages}\n`);

  // ════════════════════════════════════════════════════════════
  //  PHASE 3 — Assign images to all tours from cache (no API calls)
  // ════════════════════════════════════════════════════════════
  console.log("[PHASE 3]  Assigning images to all tours from cache...\n");

  /** @type {Set<string>} Global dedup — no URL reused across any tour */
  const usedImages = new Set();

  const report = {
    startedAt        : new Date().toISOString(),
    total            : tours.length,
    processed        : 0,
    heroUpdated      : 0,
    galleryUpdated   : 0,
    highlightsUpdated: 0,
    seoImageUpdated  : 0,
    errors           : [],
    skipped          : [],
  };

  const phase3Start = Date.now();
  let done          = 0;

  for (const [idx, tour] of tours.entries()) {
    if (!tour || typeof tour !== "object") {
      report.skipped.push({ index: idx, reason: "not an object" });
      done++;
      continue;
    }
    if (!tour.slug) {
      report.skipped.push({ index: idx, reason: "missing slug" });
      done++;
      continue;
    }

    try {
      const res = await processTour(tour, usedImages, imageApi, idx);
      if (res.heroUpdated)           report.heroUpdated++;
      if (res.galleryUpdated)        report.galleryUpdated++;
      if (res.highlightsUpdated > 0) report.highlightsUpdated += res.highlightsUpdated;
      if (res.seoImageUpdated)       report.seoImageUpdated++;
      report.processed++;
    } catch (err) {
      report.errors.push({ slug: tour.slug || `#${idx}`, message: err.message });
    }

    done++;
    const pct = Math.round((done / tours.length) * 100);
    process.stdout.write(
      `\r[PHASE 3]  ${String(done).padStart(4)}/${tours.length}  (${String(pct).padStart(3)}%)  —  ${((Date.now() - phase3Start) / 1000).toFixed(1)}s elapsed   `
    );
  }

  process.stdout.write("\n");

  // ── Save output ──────────────────────────────────────────────────────────────
  const totalElapsed = ((Date.now() - phase2Start) / 1000 + parseFloat(phase2Elapsed)).toFixed(1);
  report.finishedAt          = new Date().toISOString();
  report.elapsedSec          = totalElapsed;
  report.uniqueImagesAssigned = usedImages.size;
  report.apiStats            = imageApi.getStats();
  report.pexelsRateLimited   = imageApi.isPexelsRateLimited();
  report.freepikRateLimited  = imageApi.isFreepikRateLimited();

  fs.writeFileSync(TOURS_OUTPUT, JSON.stringify(tours,  null, 2), "utf8");
  fs.writeFileSync(REPORT_PATH,  JSON.stringify(report, null, 2), "utf8");

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${banner}`);
  console.log("[DONE]  Summary");
  console.log(banner);
  console.log(`  Tours total         : ${report.total}`);
  console.log(`  Tours processed     : ${report.processed}`);
  console.log(`  heroImg updated     : ${report.heroUpdated}`);
  console.log(`  galleryImgs updated : ${report.galleryUpdated}`);
  console.log(`  highlights updated  : ${report.highlightsUpdated}`);
  console.log(`  seo.metaImage upd.  : ${report.seoImageUpdated}`);
  console.log(`  Unique imgs used    : ${usedImages.size}`);
  console.log(`  Errors              : ${report.errors.length}`);
  console.log(`  Phase 2 (API calls) : ${phase2Elapsed}s`);
  console.log(`\n  API — Pexels: ${report.apiStats.pexelsCalls}  Unsplash: ${report.apiStats.unsplashCalls}  Cache hits: ${report.apiStats.cacheHits}  Disk loaded: ${report.apiStats.diskCacheLoaded}`);
  console.log(`\n  Output → ${TOURS_OUTPUT}`);
  console.log(`  Report → ${REPORT_PATH}`);
  console.log(`  Cache  → ${CACHE_PATH}`);
  console.log(banner);

  if (report.freepikRateLimited) {
    console.log(
      "\n[RATE LIMIT]  Freepik daily quota reached mid-run.\n" +
      "              Partial cache saved to: " + CACHE_PATH + "\n" +
      "              Re-run this script tomorrow when the daily quota resets.\n" +
      "              Already-fetched queries are loaded from disk — no duplicate API calls.\n"
    );
  }

  if (report.pexelsRateLimited) {
    console.log(
      "\n[RATE LIMIT]  Pexels 200 req/hr reached mid-run.\n" +
      "              Partial cache saved to: " + CACHE_PATH + "\n" +
      "              Re-run this script in ~1 hour to fetch the remaining queries.\n" +
      "              Already-fetched queries are loaded from disk — no duplicate API calls.\n"
    );
  }

  if (report.errors.length > 0) {
    console.log("\n[ERRORS]");
    for (const e of report.errors) {
      console.log(`  ${e.slug}: ${e.message}`);
    }
  }

  console.log("\n[NEXT STEP]  Run the DB seeder:");
  console.log("  cd galaxy-traveller-backend");
  console.log("  node scripts/seedTours.js\n");
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
