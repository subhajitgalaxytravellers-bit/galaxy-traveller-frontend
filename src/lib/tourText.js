const GENERIC_PLACE_TERMS = /\b(tour|tours|package|packages|trip|trips|holiday|holidays|plan)\b/gi;
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
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function clampWords(value, maxWords = 3) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

export function formatTourTitle(value, fallback = "Untitled Tour") {
  const normalized = normalizeSpaces(value);
  if (!normalized) return fallback;

  const hasNoSpaces = !/\s/.test(normalized);
  const needsCaseFix = hasNoSpaces || /^[A-Z0-9\s]+$/.test(normalized);
  return needsCaseFix ? toTitleCase(normalized) : normalized;
}

export function formatTourPlaceShort(place, fallbackTitle = "") {
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

export function normalizeTourKey(value) {
  return normalizeSpaces(value).toLowerCase();
}
