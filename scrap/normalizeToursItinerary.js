const fs = require("fs");
const path = require("path");

const TOURS_PATH = path.join(__dirname, "output", "tours.json");

function asString(v) {
  return String(v ?? "").trim();
}

function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseDaysFromDuration(duration = "") {
  const d = asString(duration).match(/(\d+)\s*d/i);
  if (d) return Math.max(1, asNumber(d[1], 1));

  const n = asString(duration).match(/(\d+)\s*n/i);
  if (n) return Math.max(1, asNumber(n[1], 1) + 1);

  return 1;
}

function normalizeBlock(raw = {}, dayLabel = "1", idx = 0) {
  const title = asString(raw.title) || `Day ${dayLabel} Plan ${idx + 1}`;
  const activity =
    asString(raw.activity) ||
    "Detailed itinerary will be shared on confirmation.";

  return {
    time: asString(raw.time),
    title,
    activity,
    notes: asString(raw.notes),
    image: asString(raw.image),
  };
}

function normalizeDay(dayItem = {}, idx = 0) {
  const dayLabel = asString(dayItem.day) || String(idx + 1);

  let blocks = [];
  if (Array.isArray(dayItem.blocks) && dayItem.blocks.length > 0) {
    blocks = dayItem.blocks.map((b, bIdx) => normalizeBlock(b, dayLabel, bIdx));
  } else {
    // legacy: day-level title/activity/notes/image/time
    blocks = [normalizeBlock(dayItem, dayLabel, 0)];
  }

  return { day: dayLabel, blocks };
}

function buildPlaceholderItinerary(days = 1) {
  const maxDays = Math.min(Math.max(asNumber(days, 1), 1), 30);
  return Array.from({ length: maxDays }, (_, i) => ({
    day: String(i + 1),
    blocks: [
      {
        time: "",
        title: `Day ${i + 1} Sightseeing`,
        activity: "Detailed itinerary will be shared on confirmation.",
        notes: "",
        image: "",
      },
    ],
  }));
}

function run() {
  const tours = JSON.parse(fs.readFileSync(TOURS_PATH, "utf8"));
  if (!Array.isArray(tours)) {
    throw new Error("tours.json must contain a top-level array.");
  }

  let normalizedLegacy = 0;
  let filledEmpty = 0;

  const next = tours.map((tour) => {
    const totalDays =
      asNumber(tour?.details?.totalDays, 0) > 0
        ? asNumber(tour.details.totalDays, 1)
        : parseDaysFromDuration(tour?.details?.duration || "");

    if (!Array.isArray(tour.itinerary) || tour.itinerary.length === 0) {
      filledEmpty += 1;
      return { ...tour, itinerary: buildPlaceholderItinerary(totalDays) };
    }

    const hadLegacy = tour.itinerary.some(
      (d) => !Array.isArray(d?.blocks) || d.blocks.length === 0
    );
    if (hadLegacy) normalizedLegacy += 1;

    const itinerary = tour.itinerary.map((d, idx) => normalizeDay(d, idx));
    return { ...tour, itinerary };
  });

  fs.writeFileSync(TOURS_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");

  console.log(`total=${tours.length}`);
  console.log(`normalized_legacy_itinerary=${normalizedLegacy}`);
  console.log(`filled_empty_itinerary=${filledEmpty}`);
}

run();

