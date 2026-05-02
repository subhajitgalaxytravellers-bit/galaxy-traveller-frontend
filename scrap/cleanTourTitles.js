/**
 * cleanTourTitles.js
 * Cleans title and place fields in tours.json:
 *  - Removes "BEST DEAL" and other marketing junk
 *  - When a title/place has multiple comma-separated variants, keeps only the first (best) one
 *  - Fixes ALL_CAPS titles to Title Case
 *  - Removes "Book " prefix artifacts from scraping
 */

const fs = require("fs");
const path = require("path");

const TOURS_JSON = path.join(__dirname, "output", "tours.json");

// ─── helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(str) {
  const SMALL = new Set(["a","an","and","at","but","by","for","in","nor","of","on","or","so","the","to","up","yet"]);
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i === 0 || !SMALL.has(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(" ");
}

function isUpperCase(str) {
  const letters = str.replace(/[^a-zA-Z]/g, "");
  if (!letters) return false;
  return (letters.match(/[A-Z]/g) || []).length / letters.length > 0.65;
}

/** Strip all known marketing / junk patterns */
function stripJunk(t) {
  return t
    // Remove "- 2026 Best Deals!" / "- 2024 Best Deal!" combined pattern (year + Best Deal)
    .replace(/[\s-]+\d{4}\s+Best\s+Deals?[!.,]*/gi, "")
    // Remove "- BEST DEAL 2026!" / "- BEST SEASON DEAL 2026" (Best Deal + optional year)
    .replace(/[\s-]+BEST\s+(SEASON\s+)?DEAL[\s!.,]*\d*[\s!.,]*/gi, "")
    // Remove PUJA SPL BEST DEAL
    .replace(/[\s-]+PUJA\s+SPL\s+BEST\s+DEAL[\s!.,]*/gi, "")
    // Remove "- Book From #..." / "- Book" standalone call-to-action suffix
    .replace(/[\s-]+Book\s+From\s.*$/gi, "")
    .replace(/[\s-]+\bBook\b\s*$/gi, "")
    // Remove "by NatureWings..." / "- Northeast India's Local..." branding
    .replace(/\s+by\s+NatureWings.*$/gi, "")
    // Remove "Best Tour Plan" marketing junk
    .replace(/\s+Best\s+Tour\s+Plan\s*$/gi, "")
    // Remove NatureWings branding suffixes
    .replace(/[\s-]+from\s+NatureWings(?:\s+Holidays)?\s*$/gi, "")
    .replace(/[\s-]+NatureWings\s+Holidays\s*$/gi, "")
    // Remove "- GLENBURN TEA ESTATE" branding
    .replace(/[\s-]+GLENBURN\s+TEA\s+ESTATE\s*$/gi, "")
    // Remove "- FOR 2026" / "@ IN 2026" / "@ OF 2026"
    .replace(/[\s-]+FOR\s+\d{4}\s*$/gi, "")
    .replace(/\s*@\s*IN\s+\d{4}\s*$/gi, "")
    .replace(/\s*@\s*OF\s+\d{4}\s*$/gi, "")
    // Remove " - North East Spl" / " - XYZ Spl" subtitle junk
    .replace(/[\s-]+\w[\w\s]*\s+Spl\s*$/gi, "")
    // Remove standalone year suffixes like "- 2026" / "- 2024" with optional trailing chars
    .replace(/[\s-]+\d{4}[a-z]?[!.,\s]*$/gi, "")
    // Remove leftover " Spl" at end
    .replace(/\s+Spl\s*[@!.,]*/gi, "")
    // Remove "@ " price placeholders
    .replace(/\s+@\s*\S*\s*$/g, "")
    .replace(/\s+@\s*$/g, "")
    // Remove " #..." tags
    .replace(/\s+#\S*\s*$/g, "")
    // Remove " - At " / "at" empty price placeholder at end
    .replace(/[\s-]+(At|at)\s*$/g, "")
    // Remove " -!" / "- !" trailing junk
    .replace(/[\s-]+[!.,]+\s*$/g, "")
    // Remove trailing " -"
    .replace(/\s+-\s*$/, "")
    // Remove trailing lone year stuck to word (e.g., "Tour2025" → "Tour")
    .replace(/(\D)\d{4}[a-z]?[!.,]*$/, "$1")
    // Remove "[...]" bracket suffixes (e.g., "[Optional]")
    .replace(/\s*\[.*?\]\s*$/, "")
    // Remove "Beautiful Bengal" style sub-branding
    .replace(/\s*-\s*Beautiful\s+Bengal\s*$/gi, "")
    // Remove " - Explore Now!"
    .replace(/\s*-\s*Explore\s+Now[!.,]*\s*$/gi, "")
    .trim();
}

function cleanTitle(raw) {
  if (!raw) return raw;

  // Step 1: Split by comma → take first segment
  let t = raw.split(",")[0].trim();

  // Step 2: Remove "Book " scraping artifact prefix
  t = t.replace(/^Book\s+/i, "");

  // Step 3: Strip junk patterns
  t = stripJunk(t);

  // Step 4: Fix fully ALL_CAPS titles
  if (isUpperCase(t)) {
    t = toTitleCase(t);
  } else {
    // Step 4b: Fix any remaining all-caps sub-words (4+ chars) inside mixed-case titles
    // e.g. "Guwahati with GUWAHATI - PARO DIRECT FLIGHT" → "Guwahati with Guwahati - Paro Direct Flight"
    t = t.replace(/\b([A-Z]{4,})\b/g, (m) => m.charAt(0) + m.slice(1).toLowerCase());
  }

  return t.trim();
}

function cleanPlace(raw) {
  if (!raw) return raw;

  // Step 1: Split by comma → take first segment
  let p = raw.split(",")[0].trim();

  // Step 2: Remove "Book " prefix
  p = p.replace(/^Book\s+/i, "");

  // Step 3: Remove stray " s " artifact (from "Tour Packages" → lone "s") and everything after
  // e.g. "Bhutan s with Flight Tickets [Optional]" → "Bhutan"
  p = p.replace(/\s+s\b.*$/i, "");

  // Step 4: Remove "ism" → "Tourism" artifact (e.g., "Tea ism in Darjeeling")
  p = p.replace(/\bism\b/gi, "Tourism");

  // Step 5: Strip junk patterns
  p = stripJunk(p);

  // Step 6: Fix ALL_CAPS
  if (isUpperCase(p)) {
    p = toTitleCase(p);
  } else {
    // Fix any remaining all-caps sub-words (4+ chars)
    p = p.replace(/\b([A-Z]{4,})\b/g, (m) => m.charAt(0) + m.slice(1).toLowerCase());
  }

  return p.trim();
}

// ─── main ─────────────────────────────────────────────────────────────────────

const tours = JSON.parse(fs.readFileSync(TOURS_JSON, "utf8"));

let changed = 0;

tours.forEach((tour, i) => {
  const oldTitle = tour.title;
  const oldPlace = tour.place;

  const newTitle = cleanTitle(oldTitle);
  const newPlace = cleanPlace(oldPlace);

  if (newTitle !== oldTitle || newPlace !== oldPlace) {
    changed++;
    console.log(`[${i + 1}] ${tour.slug}`);
    if (newTitle !== oldTitle) {
      console.log(`  TITLE: "${oldTitle}"`);
      console.log(`     → "${newTitle}"`);
    }
    if (newPlace !== oldPlace) {
      console.log(`  PLACE: "${oldPlace}"`);
      console.log(`     → "${newPlace}"`);
    }
  }

  tour.title = newTitle;
  tour.place = newPlace;
});

fs.writeFileSync(TOURS_JSON, JSON.stringify(tours, null, 2), "utf8");

console.log(`\nDone. ${changed} tours updated out of ${tours.length} total.`);
console.log(`Saved to: ${TOURS_JSON}`);
