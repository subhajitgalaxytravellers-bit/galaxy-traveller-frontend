/**
 * normalizeToursOutput.js
 *
 * Normalizes `title` + `place` in scrap/output/tours.json so tour cards render
 * clean, short, and readable location chips.
 *
 * Also removes duplicate-looking rows by normalized title+place key.
 */

const fs = require("fs");
const path = require("path");

const TOURS_JSON = path.join(__dirname, "output", "tours.json");

const GENERIC_PLACE_TERMS =
  /\b(tour|tours|package|packages|trip|trips|holiday|holidays|plan)\b/gi;
const CUT_OFF_TERMS = /\b(with|from|for|along|via|to)\b.*$/i;

function normalizeSpaces(value) {
  return String(value || "")
    .replace(/tourpackages?/gi, "tour packages")
    .replace(/holidaypackages?/gi, "holiday packages")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/([a-zA-Z])(tourpackages?|packages?|tours?|holidays?|trips?)/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanTitle(value, fallback = "Untitled Tour") {
  const normalized = normalizeSpaces(value);
  if (!normalized) return fallback;

  const hasNoSpaces = !/\s/.test(normalized);
  const isAllUpper = /^[A-Z0-9\s]+$/.test(normalized);
  if (hasNoSpaces || isAllUpper) return toTitleCase(normalized);
  return normalized;
}

function clampWords(value, maxWords = 3) {
  const words = String(value || "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

function cleanPlace(place, fallbackTitle) {
  const source = normalizeSpaces(place || fallbackTitle);
  if (!source) return "Location";

  const firstSegment = source.split(/[|,/;]+/)[0].trim();
  let cleaned = firstSegment.replace(GENERIC_PLACE_TERMS, " ");
  cleaned = cleaned.replace(CUT_OFF_TERMS, "").replace(/\s+/g, " ").trim();

  if (!cleaned) {
    cleaned = source.replace(GENERIC_PLACE_TERMS, " ").replace(/\s+/g, " ").trim();
  }

  const short = clampWords(cleaned, 3) || "Location";
  return short.length > 28 ? `${short.slice(0, 27).trim()}...` : short;
}

function normalizeKey(value) {
  return normalizeSpaces(value).toLowerCase();
}

function qualityScore(tour) {
  let score = 0;
  score += String(tour?.brief || "").trim().length;
  score += String(tour?.description || "").trim().length;
  score += (Array.isArray(tour?.itinerary) ? tour.itinerary.length : 0) * 10;
  score += (Array.isArray(tour?.highlights) ? tour.highlights.length : 0) * 6;
  score += (Array.isArray(tour?.galleryImgs) ? tour.galleryImgs.length : 0) * 3;
  score += Number(tour?.details?.totalDays || 0) * 2;
  score += Number(tour?.details?.pricePerPerson || 0) > 0 ? 15 : 0;
  return score;
}

function run() {
  const raw = fs.readFileSync(TOURS_JSON, "utf8").replace(/^\uFEFF/, "");
  const tours = JSON.parse(raw);

  let changed = 0;
  const normalizedRows = tours.map((tour) => {
    const oldTitle = String(tour?.title || "");
    const oldPlace = String(tour?.place || "");
    const cleanTourTitle = cleanTitle(oldTitle || tour?.slug);
    const cleanTourPlace = cleanPlace(
      oldPlace || tour?.relationHint?.destinationTitle,
      cleanTourTitle
    );

    if (cleanTourTitle !== oldTitle || cleanTourPlace !== oldPlace) changed += 1;

    return {
      ...tour,
      title: cleanTourTitle,
      place: cleanTourPlace,
    };
  });

  const uniqueMap = new Map();
  let removedDuplicates = 0;

  for (const row of normalizedRows) {
    const dedupeKey = `${normalizeKey(row.title)}|${normalizeKey(row.place)}`;
    if (!uniqueMap.has(dedupeKey)) {
      uniqueMap.set(dedupeKey, row);
      continue;
    }

    const current = uniqueMap.get(dedupeKey);
    if (qualityScore(row) > qualityScore(current)) {
      uniqueMap.set(dedupeKey, row);
    }
    removedDuplicates += 1;
  }

  const finalRows = Array.from(uniqueMap.values());
  fs.writeFileSync(TOURS_JSON, JSON.stringify(finalRows, null, 2), "utf8");

  console.log(`Updated title/place rows: ${changed}`);
  console.log(`Removed duplicate-looking rows: ${removedDuplicates}`);
  console.log(`Final row count: ${finalRows.length}`);
  console.log(`Saved: ${TOURS_JSON}`);
}

run();
