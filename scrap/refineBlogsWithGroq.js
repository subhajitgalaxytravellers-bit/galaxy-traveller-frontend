"use strict";

/**
 * Refine scrap/output/blogs.json with Groq:
 * - Professional title
 * - Short, readable slug (different from title slug)
 * - Description + bodyAlt
 * - Body trimmed to ~2000 chars
 * - Keeps relations.blogs consistent when slugs change
 *
 * Usage:
 *   node scrap/refineBlogsWithGroq.js
 *
 * Optional:
 *   BLOG_REFINE_LIMIT=25 node scrap/refineBlogsWithGroq.js
 *   BLOG_REFINE_START=0 node scrap/refineBlogsWithGroq.js
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_PATH = path.join(__dirname, "output", "blogs.json");
const CHECKPOINT_PATH = path.join(__dirname, "output", "blogs-refine-checkpoint.json");

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const TARGET_BODY_MAX = 2000;
const TARGET_BODY_MIN = 1600;
const DESCRIPTION_MAX = 170;
const BODY_ALT_MAX = 170;
const GROQ_MIN_INTERVAL_MS = Number(process.env.GROQ_MIN_INTERVAL_MS || "900");

const FILLER_STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "with",
  "for",
  "of",
  "to",
  "at",
  "in",
  "on",
  "by",
  "complete",
  "best",
  "top",
]);

function readEnvFile(fp) {
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf("=");
      if (idx === -1) continue;
      const k = t.slice(0, idx).trim();
      let v = t.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[k] = v;
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
    .replace(/â€¢/g, "-")
    .replace(/â‚¹/g, "Rs")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(value) {
  return cleanText(value)
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function trimSmart(text, maxChars) {
  const t = cleanText(text);
  if (!t) return "";
  if (t.length <= maxChars) return t;
  const slice = t.slice(0, maxChars);
  const lastPunct = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"), slice.lastIndexOf("?"));
  if (lastPunct >= Math.floor(maxChars * 0.75)) {
    return slice.slice(0, lastPunct + 1).trim();
  }
  return slice.trim();
}

function ensureBodyLength(text, fallbackText) {
  let out = trimSmart(text, TARGET_BODY_MAX);
  if (out.length >= TARGET_BODY_MIN) return out;

  const fb = cleanText(fallbackText);
  if (!fb) return out;

  const needed = TARGET_BODY_MIN - out.length;
  if (needed > 0) {
    const extra = trimSmart(fb, needed + 350);
    out = cleanText(`${out} ${extra}`.trim());
  }
  return trimSmart(out, TARGET_BODY_MAX);
}

function makeDescriptionFromBody(body, fallback) {
  const source = cleanText(body) || cleanText(fallback);
  if (!source) return "Travel guide and practical tips for planning this trip.";
  return trimSmart(source, DESCRIPTION_MAX);
}

function makeBodyAltFromBody(body, fallback) {
  const source = cleanText(body) || cleanText(fallback);
  if (!source) return "A concise travel overview with key highlights and planning essentials.";
  return trimSmart(source, BODY_ALT_MAX);
}

function makeShortSlug(candidateSlug, candidateTitle, usedSlugs) {
  const titleSlug = slugify(candidateTitle);
  const source = slugify(candidateSlug || candidateTitle);
  const rawTokens = source.split("-").filter(Boolean);
  const tokens = rawTokens.filter((t) => !FILLER_STOP_WORDS.has(t));
  const baseTokens = (tokens.length ? tokens : rawTokens).slice(0, 6);
  let slug = baseTokens.join("-");
  if (!slug) slug = titleSlug || "travel-guide";

  // Keep semantic but distinct from title.
  if (slug === titleSlug) slug = `${slug}-insights`;
  if (!/-guide|-insights|-tips|-itinerary/.test(slug)) slug = `${slug}-guide`;
  slug = slug.slice(0, 64).replace(/-+$/g, "");

  // Ensure uniqueness.
  let uniqueSlug = slug;
  let i = 2;
  while (usedSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${i}`.slice(0, 70).replace(/-+$/g, "");
    i += 1;
  }
  usedSlugs.add(uniqueSlug);
  return uniqueSlug;
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = String(raw || "")
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first < 0 || last < 0 || last <= first) return null;
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

let lastGroqRequestAt = 0;
async function waitGroqInterval() {
  const elapsed = Date.now() - lastGroqRequestAt;
  const wait = GROQ_MIN_INTERVAL_MS - elapsed;
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastGroqRequestAt = Date.now();
}

async function groqRefine(row, env) {
  const keys = [env.GROQ_API_KEY, env.GROQ_API_KEY2].filter(Boolean);
  if (!keys.length) throw new Error("Missing GROQ_API_KEY in env files.");

  const prompt = [
    "Rewrite this travel blog data for a professional travel website.",
    "Return ONLY strict JSON with keys: title, slug, description, bodyAlt, body",
    "",
    "Rules:",
    "1) title: 45-85 chars, natural and readable.",
    "2) slug: short, clear, lowercase-hyphen format, and NOT same meaning as exact title slug.",
    "3) description: 120-170 chars.",
    "4) bodyAlt: 110-170 chars.",
    "5) body: polished plain text in 1800-2000 chars. No markdown. No phone symbols. No random codes.",
    "6) Keep destination/package context and practical value.",
    "",
    `Current title: ${cleanText(row?.title)}`,
    `Current slug: ${cleanText(row?.slug)}`,
    `Current description: ${cleanText(row?.description)}`,
    `Current bodyAlt: ${cleanText(row?.bodyAlt)}`,
    "Current body:",
    cleanText(String(row?.body || "").slice(0, 4500)),
  ].join("\n");

  let lastErr = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const key = keys[attempt % keys.length];
    try {
      await waitGroqInterval();
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: MODEL,
          temperature: 0.35,
          max_tokens: 1800,
          messages: [
            {
              role: "system",
              content: "You are a professional travel editor. Output only valid JSON.",
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
      if (parsed && typeof parsed === "object") return parsed;
      lastErr = new Error("Groq returned invalid JSON.");
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      const retriable = status === 429 || status >= 500 || !status;
      if (retriable && attempt < 5) {
        const delay = 1200 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastErr || new Error("Groq call failed.");
}

function fallbackRefine(row) {
  const seedTitle = cleanText(row?.title || row?.slug || "Travel Guide");
  const title = titleCase(seedTitle);
  const bodyRaw = cleanText(row?.body || row?.description || row?.bodyAlt || "");
  const body = ensureBodyLength(bodyRaw, bodyRaw);
  const description = makeDescriptionFromBody(row?.description || body, body);
  const bodyAlt = makeBodyAltFromBody(row?.bodyAlt || description, body);
  return {
    title,
    slug: slugify(row?.slug || title),
    description,
    bodyAlt,
    body,
  };
}

function loadCheckpoint() {
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
  } catch {
    return { done: {}, updatedAt: null };
  }
}

function saveCheckpoint(data) {
  fs.writeFileSync(CHECKPOINT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function stableKeyForRow(row, index) {
  return `${slugify(row?.slug || row?.title || `row-${index}`)}#${index}`;
}

async function run() {
  const env = {
    ...readEnvFile(path.join(ROOT, "front/.env")),
    ...readEnvFile(path.join(ROOT, "galaxy-traveller-backend/.env")),
    ...process.env,
  };

  if (!fs.existsSync(OUTPUT_PATH)) {
    throw new Error(`blogs.json not found: ${OUTPUT_PATH}`);
  }

  const rows = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
  if (!Array.isArray(rows)) throw new Error("blogs.json must contain a top-level array.");

  const start = Number(process.env.BLOG_REFINE_START || "0");
  const limit = Number(process.env.BLOG_REFINE_LIMIT || "0");
  const endExclusive = limit > 0 ? Math.min(rows.length, start + limit) : rows.length;

  const checkpoint = loadCheckpoint();
  const doneMap = checkpoint.done || {};

  const oldToNewSlug = new Map();
  const usedSlugs = new Set(rows.map((r) => slugify(r?.slug)).filter(Boolean));
  const logs = {
    total: rows.length,
    range: [start, endExclusive - 1],
    updated: 0,
    skippedCheckpoint: 0,
    usedFallback: 0,
  };
  const fallbackRows = [];

  for (let idx = start; idx < endExclusive; idx += 1) {
    const row = rows[idx];
    const rowKey = stableKeyForRow(row, idx);
    const oldSlug = slugify(row?.slug);
    if (doneMap[rowKey]) {
      logs.skippedCheckpoint += 1;
      if (oldSlug) oldToNewSlug.set(oldSlug, oldSlug);
      continue;
    }

    let refined;
    try {
      refined = await groqRefine(row, env);
    } catch {
      refined = fallbackRefine(row);
      logs.usedFallback += 1;
      fallbackRows.push({
        index: idx,
        slug: oldSlug || row?.slug || "",
      });
    }

    const title = titleCase(refined?.title || row?.title || row?.slug || "Travel Guide");
    const slug = makeShortSlug(refined?.slug || row?.slug, title, usedSlugs);
    const description = trimSmart(refined?.description || row?.description, DESCRIPTION_MAX);
    const bodyRaw = cleanText(refined?.body || row?.body || "");
    const body = ensureBodyLength(bodyRaw, row?.body || row?.description || "");
    const bodyAlt = trimSmart(refined?.bodyAlt || row?.bodyAlt || description, BODY_ALT_MAX);

    row.title = title;
    row.slug = slug;
    row.description = description || makeDescriptionFromBody(body, row?.description);
    row.bodyAlt = bodyAlt || makeBodyAltFromBody(body, row?.bodyAlt);
    row.body = body;

    row.seo = row.seo && typeof row.seo === "object" ? row.seo : {};
    row.seo.metaTitle = `${title} | Galaxy Travellers`;
    row.seo.metaDescription = row.description;

    if (oldSlug) oldToNewSlug.set(oldSlug, slug);

    doneMap[rowKey] = {
      oldSlug,
      newSlug: slug,
      updatedAt: new Date().toISOString(),
    };
    logs.updated += 1;
    checkpoint.updatedAt = new Date().toISOString();
    checkpoint.done = doneMap;
    saveCheckpoint(checkpoint);

    console.log(
      `[${idx + 1}/${rows.length}] updated slug: ${oldSlug || "(none)"} -> ${slug}`
    );
  }

  // Keep cross-blog slug relations aligned.
  for (const row of rows) {
    if (!row?.relations || !Array.isArray(row.relations.blogs)) continue;
    row.relations.blogs = row.relations.blogs.map((s) => oldToNewSlug.get(slugify(s)) || slugify(s));
    row.relations.blogs = [...new Set(row.relations.blogs.filter(Boolean))];
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`\nDone. Updated ${logs.updated} blogs, fallback used ${logs.usedFallback}.`);
  if (fallbackRows.length) {
    const reportPath = path.join(__dirname, "output", "blogs-refine-fallback-report.json");
    fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), fallbackRows }, null, 2)}\n`, "utf8");
    console.log(`Fallback report: ${reportPath}`);
  }
  console.log(`Saved: ${OUTPUT_PATH}`);
  console.log(`Checkpoint: ${CHECKPOINT_PATH}`);
}

run().catch((err) => {
  console.error("[fatal]", err?.message || err);
  process.exit(1);
});
