"use strict";

/**
 * Tour image processor.
 *
 * For each tour object it:
 *  1. heroImg       – best scenic image (highest-quality from heroQuery)
 *  2. galleryImgs   – 6-8 diverse images from rotating gallery queries
 *  3. highlights[]  – each highlight gets its own targeted image
 *  4. seo.metaImage – dedicated quality image (from gallery or fresh query)
 *
 * Global deduplication is enforced via the shared `usedImages` Set.
 * Per-tour deduplication uses a local `tourUsed` Set.
 *
 * If no relevant image is found for a slot, that slot is left unchanged.
 */

const { generateQueries } = require("./queryBuilder");

const MIN_GALLERY_SIZE = 4; // minimum images to replace galleryImgs
const TARGET_GALLERY   = 8; // target gallery size

/**
 * Pick the first URL from `pool` that hasn't been used globally or in this tour.
 *
 * @param {string[]} pool       - candidates
 * @param {Set<string>} global  - global usedImages set (shared across all tours)
 * @param {Set<string>} local   - per-tour used set
 * @returns {string|null}
 */
function pickUnused(pool, global, local) {
  for (const url of pool) {
    if (url && !global.has(url) && !local.has(url)) {
      return url;
    }
  }
  return null;
}

/**
 * Rotate through gallery queries to fill the gallery pool.
 * Fetches in round-robin order until we have enough candidates.
 *
 * @param {string[]}        queries
 * @param {function}        fetchImages
 * @param {Set<string>}     global
 * @param {Set<string>}     local
 * @param {number}          target     - how many images we want
 * @returns {Promise<string[]>}
 */
async function fillGalleryPool(queries, fetchImages, global, local, target) {
  const pool = [];
  const seen = new Set();

  for (const q of queries) {
    if (pool.length >= target * 2) break; // have plenty of candidates

    const imgs = await fetchImages(q);
    for (const img of imgs) {
      if (img && !seen.has(img) && !global.has(img) && !local.has(img)) {
        seen.add(img);
        pool.push(img);
      }
    }
  }

  return pool;
}

/**
 * Process a single tour: replace image URLs with fresh, deduplicated ones.
 *
 * @param {object}      tour        - tour object (mutated in place)
 * @param {Set<string>} usedImages  - global dedup set (mutated as images are consumed)
 * @param {object}      imageApi    - { fetchImages }
 * @param {number}      tourIndex   - position in array (for debug logging)
 * @returns {Promise<{ heroUpdated, galleryUpdated, highlightsUpdated, seoImageUpdated }>}
 */
async function processTour(tour, usedImages, imageApi, tourIndex) {
  const result = {
    heroUpdated      : false,
    galleryUpdated   : false,
    highlightsUpdated: 0,
    seoImageUpdated  : false,
  };

  const { fetchImages } = imageApi;
  const { heroQuery, galleryQueries, highlightQueries } = generateQueries(tour);

  // Per-tour dedup — no URL appears twice within the same tour
  const tourUsed = new Set();

  // ─── 1. heroImg ─────────────────────────────────────────────────────────────
  const heroPool = await fetchImages(heroQuery);
  const heroImg  = pickUnused(heroPool, usedImages, tourUsed);

  if (heroImg) {
    usedImages.add(heroImg);
    tourUsed.add(heroImg);
    tour.heroImg   = heroImg;
    result.heroUpdated = true;
  }
  // If heroImg could not be assigned, keep the existing one (don't blank it)

  // ─── 2. galleryImgs (6–8 unique, diverse images) ────────────────────────────
  const galleryPool = await fillGalleryPool(
    galleryQueries,
    fetchImages,
    usedImages,
    tourUsed,
    TARGET_GALLERY
  );

  const gallery = [];
  for (const img of galleryPool) {
    if (gallery.length >= TARGET_GALLERY) break;
    if (!usedImages.has(img) && !tourUsed.has(img)) {
      usedImages.add(img);
      tourUsed.add(img);
      gallery.push(img);
    }
  }

  if (gallery.length >= MIN_GALLERY_SIZE) {
    tour.galleryImgs       = gallery;
    result.galleryUpdated  = true;
  }
  // If we got fewer than MIN_GALLERY_SIZE, keep existing gallery intact

  // ─── 3. highlights[].img ────────────────────────────────────────────────────
  const highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
  for (const [idx, highlight] of highlights.entries()) {
    const hQuery = highlightQueries.get(idx) || `${highlight.title || ""} ${tour.place || ""} landmark`;
    const hPool  = await fetchImages(hQuery);
    const hImg   = pickUnused(hPool, usedImages, tourUsed);

    if (hImg) {
      usedImages.add(hImg);
      tourUsed.add(hImg);
      highlight.img             = hImg;
      result.highlightsUpdated++;
    }
    // If no match, keep existing highlight.img
  }

  // ─── 4. seo.metaImage ───────────────────────────────────────────────────────
  // Prefer a dedicated fresh image; fall back to first gallery image or hero
  if (tour.seo) {
    // Try picking an unused image from the hero pool (different from heroImg)
    const metaFromHero = heroPool.find(
      (u) => u && !usedImages.has(u) && !tourUsed.has(u)
    );

    const metaImg = metaFromHero || gallery[0] || tour.heroImg || null;

    if (metaImg) {
      if (metaFromHero) {
        usedImages.add(metaFromHero);
        tourUsed.add(metaFromHero);
      }
      tour.seo.metaImage     = metaImg;
      result.seoImageUpdated = true;
    }
  }

  return result;
}

module.exports = { processTour };
