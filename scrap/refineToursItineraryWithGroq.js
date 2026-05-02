"use strict";

/**
 * Refine itinerary blocks in scrap/output/tours.json using Groq.
 *
 * What it fixes:
 * - Title == activity clones
 * - Arrow/all-caps/raw transfer lines
 * - Weak or generic transfer titles
 *
 * Output:
 * - Professional day/block title
 * - Logical activity text (not same as title)
 *
 * Usage:
 *   node scrap/refineToursItineraryWithGroq.js
 *
 * Optional:
 *   TOUR_ITINERARY_START=0 TOUR_ITINERARY_LIMIT=20 node scrap/refineToursItineraryWithGroq.js
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = path.resolve(__dirname, "..", "..");
const TOURS_PATH = path.join(__dirname, "output", "tours.json");
const CHECKPOINT_PATH = path.join(__dirname, "output", "tours-itinerary-refine-checkpoint.json");
const REPORT_PATH = path.join(__dirname, "output", "tours-itinerary-refine-report.json");

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MIN_INTERVAL_MS = Number(process.env.GROQ_MIN_INTERVAL_MS || "900");
const TITLE_MAX = 72;
const ACTIVITY_MAX = 320;

function readEnvFile(fp) {
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf("=");
      if (idx < 0) continue;
      const key = t.slice(0, idx).trim();
      let val = t.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
    return out;
  } catch {
    return {};
  }
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€“|â€”/g, "-")
    .replace(/→|->/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value) {
  const words = cleanText(value).toLowerCase().split(" ").filter(Boolean);
  return words
    .map((w) => {
      if (/^\d/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function isAllCapsLike(text) {
  const t = cleanText(text);
  if (!t) return false;
  return t === t.toUpperCase() && /[A-Z]{4,}/.test(t);
}

function normalizeForCompare(text) {
  return cleanText(text).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function needsFix(title, activity) {
  const t = cleanText(title);
  const a = cleanText(activity);
  if (!t || !a) return true;
  if (normalizeForCompare(t) === normalizeForCompare(a)) return true;
  if (isAllCapsLike(t)) return true;
  if (/tranfer|trasnfer/i.test(t)) return true;
  if (/^day\s*\d+\s*(plan|sightseeing)/i.test(t)) return true;
  if (/detailed itinerary will be shared on confirmation/i.test(a)) return true;
  if (/^\W/.test(String(title || ""))) return true;
  if (/transfer|arrival|departure|drop|pickup|sightseeing|excursion/i.test(t)) return true;
  return false;
}

function trimSmart(text, maxLen) {
  const t = cleanText(text);
  if (!t) return "";
  if (t.length <= maxLen) return t;
  const sliced = t.slice(0, maxLen);
  const punct = Math.max(sliced.lastIndexOf("."), sliced.lastIndexOf("!"), sliced.lastIndexOf("?"));
  if (punct >= Math.floor(maxLen * 0.7)) return sliced.slice(0, punct + 1).trim();
  return sliced.trim();
}

function heuristicRewrite(title, activity, dayLabel) {
  const source = cleanText(title || activity);
  const route = source.match(/([A-Za-z][A-Za-z\s]+)\s*-\s*([A-Za-z][A-Za-z\s]+)/);
  let nextTitle = "";
  let nextActivity = "";

  if (route) {
    const from = toTitleCase(route[1]);
    const to = toTitleCase(route[2]);
    nextTitle = `${from} to ${to} Transfer`;
    nextActivity = `Drive from ${from} to ${to} with scheduled comfort breaks and scenic en-route halts. On arrival, check in and spend the evening at leisure.`;
  } else if (/sightseeing/i.test(source)) {
    const place = toTitleCase(source.replace(/sightseeing|local|tour|full day|\[.*?\]/gi, "").trim()) || "Local Area";
    nextTitle = `${place} Sightseeing Tour`;
    nextActivity = `Proceed for curated local sightseeing covering key landmarks, cultural spots, and viewpoints. Return to hotel for an overnight stay.`;
  } else if (/arrival|pickup/i.test(source)) {
    nextTitle = "Arrival and Hotel Check-in";
    nextActivity = "Meet and transfer from the arrival point to the hotel. Complete check-in formalities and keep the remaining time free for rest.";
  } else if (/departure|drop/i.test(source)) {
    nextTitle = "Departure Transfer";
    nextActivity = "After breakfast, transfer to the airport/railway station for onward journey with trip memories and completion support from the team.";
  } else if (/excursion/i.test(source)) {
    nextTitle = trimSmart(toTitleCase(source.replace(/\[.*?\]/g, "")), TITLE_MAX) || `Day ${dayLabel} Excursion`;
    nextActivity = "Take a planned excursion to nearby attractions with return by evening. The day is paced for photo stops, short breaks, and local experiences.";
  } else {
    nextTitle = trimSmart(toTitleCase(source), TITLE_MAX) || `Day ${dayLabel} Travel Plan`;
    nextActivity = `Continue the planned journey for Day ${dayLabel} with route-based sightseeing, transit support, and scheduled breaks before overnight stay.`;
  }

  return {
    title: trimSmart(nextTitle, TITLE_MAX),
    activity: trimSmart(nextActivity, ACTIVITY_MAX),
  };
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = String(raw || "")
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const first = cleaned.indexOf("[");
    const last = cleaned.lastIndexOf("]");
    if (first < 0 || last < 0 || last <= first) return null;
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

let lastRequestAt = 0;
async function waitInterval() {
  const elapsed = Date.now() - lastRequestAt;
  const wait = MIN_INTERVAL_MS - elapsed;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

async function groqRewriteForTour(tour, targets, env) {
  const keys = [env.GROQ_API_KEY, env.GROQ_API_KEY2].filter(Boolean);
  if (!keys.length) throw new Error("Missing GROQ_API_KEY.");

  const input = targets.map((x) => ({
    dayIndex: x.dayIndex,
    blockIndex: x.blockIndex,
    day: x.day,
    title: x.title,
    activity: x.activity,
    time: x.time || "",
    notes: x.notes || "",
  }));

  const prompt = [
    "Rewrite travel itinerary blocks into professional format.",
    "Return ONLY a JSON array with items:",
    '[{"dayIndex":0,"blockIndex":0,"title":"...","activity":"..."}]',
    "",
    "Rules:",
    "1) Keep route/day intent same. Do not change destinations.",
    "2) title: 4-9 words, professional, no arrows, no ALL CAPS, no emoji.",
    "3) activity: 1-2 sentences, clear logistics + experience, 90-240 chars.",
    "4) activity MUST be different from title text.",
    "5) No marketing claims, no phone/call text.",
    "",
    `Tour title: ${cleanText(tour.title)}`,
    `Place: ${cleanText(tour.place)}`,
    `Duration: ${cleanText(tour?.details?.duration)}`,
    "Blocks to rewrite:",
    JSON.stringify(input, null, 2),
  ].join("\n");

  let lastErr = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const key = keys[attempt % keys.length];
    try {
      await waitInterval();
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: MODEL,
          temperature: 0.35,
          max_tokens: 2200,
          messages: [
            {
              role: "system",
              content: "You are a professional travel operations writer. Output strict JSON only.",
            },
            { role: "user", content: prompt },
          ],
        },
        {
          timeout: 90000,
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
        }
      );
      const text = res?.data?.choices?.[0]?.message?.content || "";
      const parsed = safeJsonParse(text);
      if (Array.isArray(parsed)) return parsed;
      lastErr = new Error("Invalid JSON from Groq.");
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      const retriable = !status || status === 429 || status >= 500;
      if (retriable && attempt < 5) {
        const delay = 1200 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr || new Error("Groq rewrite failed.");
}

function loadCheckpoint() {
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
  } catch {
    return { done: {}, updatedAt: null };
  }
}

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function run() {
  const env = {
    ...readEnvFile(path.join(ROOT, "front/.env")),
    ...readEnvFile(path.join(ROOT, "galaxy-traveller-backend/.env")),
    ...process.env,
  };

  if (!fs.existsSync(TOURS_PATH)) throw new Error(`tours.json not found: ${TOURS_PATH}`);
  const tours = JSON.parse(fs.readFileSync(TOURS_PATH, "utf8"));
  if (!Array.isArray(tours)) throw new Error("tours.json must contain array.");

  const start = Number(process.env.TOUR_ITINERARY_START || "0");
  const limit = Number(process.env.TOUR_ITINERARY_LIMIT || "0");
  const endExclusive = limit > 0 ? Math.min(tours.length, start + limit) : tours.length;

  const cp = loadCheckpoint();
  const done = cp.done || {};
  const report = {
    generatedAt: new Date().toISOString(),
    range: [start, endExclusive - 1],
    toursProcessed: 0,
    toursSkipped: 0,
    toursWithChanges: 0,
    blocksRewritten: 0,
    usedFallbackTours: 0,
    failures: [],
  };

  for (let i = start; i < endExclusive; i += 1) {
    const tour = tours[i];
    const key = `${String(tour?.slug || `tour-${i}`)}#${i}`;
    if (done[key]) {
      report.toursSkipped += 1;
      continue;
    }

    const itinerary = Array.isArray(tour?.itinerary) ? tour.itinerary : [];
    const targets = [];
    for (let dIdx = 0; dIdx < itinerary.length; dIdx += 1) {
      const dayItem = itinerary[dIdx] || {};
      const blocks = Array.isArray(dayItem.blocks) ? dayItem.blocks : [];
      for (let bIdx = 0; bIdx < blocks.length; bIdx += 1) {
        const block = blocks[bIdx] || {};
        if (needsFix(block.title, block.activity)) {
          targets.push({
            dayIndex: dIdx,
            blockIndex: bIdx,
            day: String(dayItem.day || dIdx + 1),
            title: cleanText(block.title),
            activity: cleanText(block.activity),
            time: cleanText(block.time),
            notes: cleanText(block.notes),
          });
        }
      }
    }

    if (!targets.length) {
      done[key] = { updatedAt: new Date().toISOString(), changed: 0 };
      cp.done = done;
      cp.updatedAt = new Date().toISOString();
      saveCheckpoint(cp);
      report.toursProcessed += 1;
      continue;
    }

    let rewritten = [];
    let usedFallback = false;
    try {
      rewritten = await groqRewriteForTour(tour, targets, env);
    } catch (err) {
      usedFallback = true;
      rewritten = targets.map((t) => ({
        dayIndex: t.dayIndex,
        blockIndex: t.blockIndex,
        ...heuristicRewrite(t.title, t.activity, t.day),
      }));
      report.failures.push({
        slug: tour?.slug || `tour-${i}`,
        reason: err?.message || String(err),
      });
    }

    let changed = 0;
    for (const item of rewritten) {
      const dIdx = Number(item?.dayIndex);
      const bIdx = Number(item?.blockIndex);
      if (!Number.isInteger(dIdx) || !Number.isInteger(bIdx)) continue;
      const dayObj = itinerary[dIdx];
      if (!dayObj || !Array.isArray(dayObj.blocks) || !dayObj.blocks[bIdx]) continue;

      const oldTitle = cleanText(dayObj.blocks[bIdx].title);
      const oldActivity = cleanText(dayObj.blocks[bIdx].activity);
      let nextTitle = trimSmart(item?.title, TITLE_MAX);
      let nextActivity = trimSmart(item?.activity, ACTIVITY_MAX);

      if (!nextTitle || !nextActivity || normalizeForCompare(nextTitle) === normalizeForCompare(nextActivity)) {
        const fallback = heuristicRewrite(oldTitle, oldActivity, String(dayObj.day || dIdx + 1));
        nextTitle = fallback.title;
        nextActivity = fallback.activity;
      }

      if (nextTitle !== oldTitle || nextActivity !== oldActivity) {
        dayObj.blocks[bIdx].title = nextTitle;
        dayObj.blocks[bIdx].activity = nextActivity;
        changed += 1;
      }
    }

    done[key] = { updatedAt: new Date().toISOString(), changed };
    cp.done = done;
    cp.updatedAt = new Date().toISOString();
    saveCheckpoint(cp);

    report.toursProcessed += 1;
    report.blocksRewritten += changed;
    if (changed > 0) report.toursWithChanges += 1;
    if (usedFallback) report.usedFallbackTours += 1;

    console.log(
      `[${i + 1}/${tours.length}] ${tour?.slug || `tour-${i}`} -> changed blocks: ${changed}${usedFallback ? " (fallback)" : ""}`
    );
  }

  fs.writeFileSync(TOURS_PATH, `${JSON.stringify(tours, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("\nDone.");
  console.log(`Saved tours: ${TOURS_PATH}`);
  console.log(`Saved checkpoint: ${CHECKPOINT_PATH}`);
  console.log(`Saved report: ${REPORT_PATH}`);
  console.log(
    `Processed ${report.toursProcessed} tours, changed ${report.blocksRewritten} blocks, fallback tours ${report.usedFallbackTours}.`
  );
}

run().catch((err) => {
  console.error("[fatal]", err?.message || err);
  process.exit(1);
});

