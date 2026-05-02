"use strict";

/**
 * Image API module — Pexels (primary) + Unsplash (secondary)
 *
 * Features:
 *  - In-memory query → URL[] cache (avoids duplicate API calls)
 *  - Retry with exponential back-off (max 3 attempts)
 *  - Per-call rate-limit delay between calls
 *  - Filters: width ≥ 1280, landscape orientation (width > height)
 *  - Stats tracking for debugging
 */

const axios = require("axios");
const fs    = require("fs");

const UNSPLASH_BASE   = "https://api.unsplash.com";
const PEXELS_BASE     = "https://api.pexels.com/v1";
const FREEPIK_BASE    = "https://api.freepik.com/v1";
const MIN_WIDTH       = 1280;
const PER_PAGE        = 20;           // results per API call
const RATE_DELAY_MS   = 300;          // 300ms between calls
const RETRY_DELAYS    = [3000, 8000, 20000]; // exponential back-off per attempt

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Retry an async function up to `maxAttempts` times.
 * On HTTP 429, waits 65 s before retry (respect rate-limit).
 */
async function withRetry(fn, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      const status = err?.response?.status;
      // Hard rate-limit: back off 65 s
      const delay = status === 429 ? 65_000 : RETRY_DELAYS[attempt];
      await sleep(delay);
    }
  }
}

/**
 * Build a clean Unsplash CDN URL from a photo object.
 * Uses `urls.raw` base + our own crop/quality params.
 */
function buildUnsplashUrl(photo) {
  const raw = (photo?.urls?.raw || "").split("?")[0];
  if (!raw) return null;
  return `${raw}?auto=format&fit=crop&w=1600&h=900&q=82`;
}

/**
 * Return true if photo qualifies:
 *  - width ≥ MIN_WIDTH
 *  - landscape (width > height)
 */
function isAcceptable(photo) {
  return (
    typeof photo.width  === "number" &&
    typeof photo.height === "number" &&
    photo.width >= MIN_WIDTH &&
    photo.width > photo.height
  );
}

/**
 * Build a Pexels photo URL (large2x preferred, fallback to large/original).
 */
function buildPexelsUrl(photo) {
  return (
    photo?.src?.large2x ||
    photo?.src?.large   ||
    photo?.src?.original ||
    null
  );
}

/** Pexels landscape filter — same rules as Unsplash. */
const isPexelsAcceptable = isAcceptable;

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create an image API client with shared cache and stats.
 *
 * @param {{ unsplashKey?: string, pexelsKey?: string, freepikKey?: string, diskCachePath?: string }} opts
 */
function createImageApi({ unsplashKey = "", pexelsKey = "", freepikKey = "", diskCachePath = "" } = {}) {
  /** @type {Map<string, string[]>} */
  const cache = new Map();
  let lastCallAt = 0;
  let pexelsRateLimited   = false;  // true once Pexels returns 429
  let freepikRateLimited  = false;  // true once Freepik returns 429
  let diskCacheLoaded = 0;

  // ── Load disk cache (resume previous partial run) ──────────────────────────
  if (diskCachePath && fs.existsSync(diskCachePath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(diskCachePath, "utf8"));
      for (const [k, v] of Object.entries(saved)) {
        if (Array.isArray(v) && v.length > 0) {
          cache.set(k, v);
          diskCacheLoaded++;
        }
      }
    } catch { /* corrupt cache file — start fresh */ }
  }

  const stats = {
    pexelsCalls   : 0,
    unsplashCalls : 0,
    freepikCalls  : 0,
    cacheHits     : 0,
    totalImages   : 0,
    diskCacheLoaded,
  };

  // ── Rate limiter ─────────────────────────────────────────────────────────────
  async function rateDelay() {
    const wait = RATE_DELAY_MS - (Date.now() - lastCallAt);
    if (wait > 0) await sleep(wait);
    lastCallAt = Date.now();
  }

  // ── Pexels ───────────────────────────────────────────────────────────────────
  /**
   * Fetch landscape photos from Pexels (primary source).
   * Fail-fast (no retries) — returns [] on any error.
   *
   * @param {string} query
   * @returns {Promise<string[]>}
   */
  async function fetchFromPexels(query) {
    if (!pexelsKey || pexelsRateLimited) return [];

    await rateDelay();
    stats.pexelsCalls++;

    try {
      const res = await axios.get(`${PEXELS_BASE}/search`, {
        timeout: 10_000,
        headers: { Authorization: pexelsKey },
        params: {
          query,
          per_page    : PER_PAGE,
          orientation : "landscape",
        },
      });

      const photos = Array.isArray(res.data?.photos) ? res.data.photos : [];
      return photos
        .filter(isPexelsAcceptable)
        .map(buildPexelsUrl)
        .filter(Boolean);
    } catch (err) {
      if (err?.response?.status === 429) {
        pexelsRateLimited = true;
        // Print on next tick so the current progress line clears first
        process.nextTick(() => {
          process.stderr.write(
            "\n\n[WARN] Pexels rate limit (200 req/hr) reached.\n" +
            "       Partial results saved to disk cache.\n" +
            "       Re-run the script in ~1 hour to fetch the remaining queries.\n\n"
          );
        });
      }
      return [];
    }
  }

  // ── Unsplash ─────────────────────────────────────────────────────────────────
  /**
   * Fetch up to `PER_PAGE` landscape photos from Unsplash (secondary).
   *
   * @param {string} query
   * @returns {Promise<string[]>} array of CDN image URLs
   */
  async function fetchFromUnsplash(query) {
    if (!unsplashKey) return [];

    const fetchPage = async (page) => {
      await rateDelay();
      stats.unsplashCalls++;

      // Single attempt — no retries. Cache stores [] on failure;
      // tourProcessor falls back to broader gallery queries.
      const res = await withRetry(() =>
        axios.get(`${UNSPLASH_BASE}/search/photos`, {
          timeout: 8_000,
          headers: { Authorization: `Client-ID ${unsplashKey}` },
          params: {
            query,
            orientation : "landscape",
            per_page    : PER_PAGE,
            page,
            order_by    : "relevant",
          },
        })
      , 1);  // maxAttempts = 1 → fail fast, no retry delays

      const results = Array.isArray(res.data?.results) ? res.data.results : [];
      return results.filter(isAcceptable).map(buildUnsplashUrl).filter(Boolean);
    };

    const page1 = await fetchPage(1);

    // 20 results is plenty; skip page 2 to conserve API quota
    return page1;
  }

  // ── Freepik ──────────────────────────────────────────────────────────────────
  /**
   * Fetch landscape photos from Freepik API (fallback).
   * Does NOT retry — fail fast and return empty on any error.
   *
   * @param {string} query
   * @returns {Promise<string[]>}
   */
  async function fetchFromFreepik(query) {
    if (!freepikKey || freepikRateLimited) return [];

    await rateDelay();
    stats.freepikCalls++;

    try {
      const res = await axios.get(`${FREEPIK_BASE}/resources`, {
        timeout: 10_000,  // generous timeout — Freepik can be slow
        headers: { "x-freepik-api-key": freepikKey },
        params: {
          term                              : query,
          "filters[content_type][photo]"   : 1,
          "filters[orientation][landscape]": 1,
          limit                            : 15,
          page                             : 1,
          order                            : "relevance",
        },
      });

      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      // Note: Freepik serves ~626px images — acceptable for travel thumbnails/gallery
      // We do NOT apply the MIN_WIDTH=1280 filter here so we always get results
      return rows
        .map((r) => (
          r?.image?.source?.url ||
          r?.preview?.url        ||
          r?.thumbnail?.url      ||
          null
        ))
        .filter(Boolean);
    } catch (err) {
      if (err?.response?.status === 429) {
        freepikRateLimited = true;
        process.nextTick(() => {
          process.stderr.write(
            "\n\n[WARN] Freepik rate limit reached (daily quota).\n" +
            "       Partial results saved to disk cache.\n" +
            "       Re-run the script tomorrow when the quota resets.\n\n"
          );
        });
      }
      return [];
    }
  }

  // ── Public: fetchImages ───────────────────────────────────────────────────────
  /**
   * Return image URLs for a query.
   * Uses cache, tries Unsplash first, then Freepik as fallback.
   *
   * @param {string} query
   * @returns {Promise<string[]>}
   */
  async function fetchImages(query) {
    const cacheKey = query.trim().toLowerCase();

    if (cache.has(cacheKey)) {
      stats.cacheHits++;
      return cache.get(cacheKey);
    }

    let images = [];

    // ── Primary: Freepik (no per-hour rate limit, ~500 req/day) ─────────────
    if (freepikKey) {
      try {
        images = await fetchFromFreepik(query);
      } catch (err) {
        if (process.env.DEBUG_IMAGES) {
          console.warn(`[imageApi] Freepik failed for "${query}": ${err.message}`);
        }
      }
    }

    // ── Secondary: Unsplash (only when Freepik returns < 5, conserve quota) ─
    if (images.length < 5 && unsplashKey) {
      try {
        const extra = await fetchFromUnsplash(query);
        images = [...new Set([...images, ...extra])];
      } catch (err) {
        if (process.env.DEBUG_IMAGES) {
          console.warn(`[imageApi] Unsplash failed for "${query}": ${err.message}`);
        }
      }
    }

    // ── Tertiary: Pexels (only if key present and still needed) ─────────────
    if (images.length < 5 && pexelsKey) {
      try {
        const extra = await fetchFromPexels(query);
        images = [...new Set([...images, ...extra])];
      } catch (err) {
        if (process.env.DEBUG_IMAGES) {
          console.warn(`[imageApi] Pexels failed for "${query}": ${err.message}`);
        }
      }
    }

    stats.totalImages += images.length;
    cache.set(cacheKey, images);

    // Persist non-empty results to disk so the next run can resume
    if (images.length > 0 && diskCachePath) {
      try {
        const obj = {};
        for (const [k, v] of cache.entries()) if (v.length > 0) obj[k] = v;
        fs.writeFileSync(diskCachePath, JSON.stringify(obj));
      } catch { /* non-fatal — disk write errors are ignored */ }
    }

    return images;
  }

  // ── Public: prefetchBatch ─────────────────────────────────────────────────────
  /**
   * Pre-warm the cache for a list of queries sequentially.
   * Useful if you want to batch prefetch before processing tours.
   *
   * @param {string[]} queries
   */
  async function prefetchBatch(queries) {
    for (const q of queries) {
      await fetchImages(q);
    }
  }

  // ── Expose internal stats ─────────────────────────────────────────────────────
  return {
    fetchImages,
    prefetchBatch,
    getCacheSize          : () => cache.size,
    getDiskCacheLoaded    : () => diskCacheLoaded,
    isPexelsRateLimited   : () => pexelsRateLimited,
    isFreepikRateLimited  : () => freepikRateLimited,
    getStats              : () => ({ ...stats }),
  };
}

module.exports = { createImageApi };
