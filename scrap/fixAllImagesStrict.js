"use strict";

/**
 * Strict image assignment for scrap output JSON files.
 *
 * Goals:
 * 1) No duplicate image URLs across all target slots in tours/destinations/blogs.
 * 2) Keep image choice location/text related (bucketed query strategy).
 * 3) Prefer Freepik API; automatically fallback to Unsplash if Freepik is rate-limited.
 *
 * Usage:
 *   node scrap/fixAllImagesStrict.js
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_DIR = path.join(__dirname, "output");
const TOURS_PATH = path.join(OUTPUT_DIR, "tours.json");
const DEST_PATH = path.join(OUTPUT_DIR, "destinations.json");
const BLOGS_PATH = path.join(OUTPUT_DIR, "blogs.json");
const REPORT_PATH = path.join(OUTPUT_DIR, "strict-image-fix-report.json");

const UNSPLASH_PER_PAGE = 30;
const CALL_DELAY_MS = 950;

const BUCKET_QUERIES = {
  bhutan: [
    "Bhutan Paro Punakha Himalaya monastery landscape",
    "Bhutan valley dzong monastery",
  ],
  kashmir: [
    "Kashmir valley Dal Lake Gulmarg scenic",
    "Srinagar Pahalgam Sonamarg landscape",
  ],
  ladakh: [
    "Ladakh Leh Pangong high altitude mountains",
    "Nubra valley Ladakh mountain road",
  ],
  kailash: ["Kailash Mansarovar sacred mountain lake"],
  tawang: ["Tawang Arunachal monastery mountains", "Bumla pass Tawang mountains"],
  arunachal: [
    "Arunachal Pradesh mountains India",
    "Tawang Ziro valley northeast india",
  ],
  kaziranga: [
    "Kaziranga national park Assam wildlife",
    "Assam grassland rhino safari",
  ],
  assam: ["Assam Brahmaputra tea gardens nature", "Assam tea garden landscape"],
  meghalaya: [
    "Meghalaya Cherrapunji waterfalls root bridge",
    "Shillong Dawki Meghalaya landscape",
  ],
  nagaland: ["Nagaland Kohima Dzukou valley hills", "Northeast India hill village"],
  manipur: ["Manipur Loktak lake scenic landscape", "Northeast India lake mountain"],
  northeast: ["Northeast India misty hills green landscape", "Seven sisters India landscape"],
  sikkim: [
    "Sikkim Gangtok Pelling Kanchenjunga mountains",
    "North Sikkim Lachung Yumthang valley",
  ],
  darjeeling: ["Darjeeling tea gardens Himalayan views", "Darjeeling mountain toy train hill"],
  northbengal: ["North Bengal Dooars forests hills river", "Dooars tea garden river forest"],
  sundarbans: ["Sundarbans mangrove delta river"],
  nepal: ["Nepal Himalaya Kathmandu Pokhara landscape", "Nepal mountain valley travel"],
  andaman: ["Andaman islands tropical beach blue water", "Havelock island beach andaman"],
  maldives: ["Maldives turquoise lagoon overwater villas"],
  bali: ["Bali Indonesia temples rice terraces"],
  thailand: ["Thailand Bangkok Pattaya tropical travel", "Thailand island beach landscape"],
  vietnam: ["Vietnam Ha Long Bay mountains water", "Vietnam mountain rice terrace"],
  srilanka: ["Sri Lanka Sigiriya tea estates coast", "Sri Lanka hill country train"],
  generic: ["India scenic travel mountains landscape", "Himalayan valley India travel"],
};

const GENERIC_QUERY_FALLBACKS = [
  "India mountain landscape travel",
  "Himalayan valley landscape",
  "Nature travel landscape",
];

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

const env = {
  ...readEnvFile(path.join(ROOT, "front/.env")),
  ...readEnvFile(path.join(ROOT, "galaxy-traveller-backend/.env")),
  ...process.env,
};

const FREEPIK_KEY = env.FREEPIK_API_KEY || "";
const UNSPLASH_KEY = env.UNSPLASH_ACCESS_KEY || env.UNSPLASH_API_KEY || env.UNSPLASH_KEY || "";

if (!FREEPIK_KEY && !UNSPLASH_KEY) {
  console.error("ERROR: Neither FREEPIK_API_KEY nor UNSPLASH_ACCESS_KEY found in env.");
  process.exit(1);
}

function cleanText(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashString(input) {
  let h = 0;
  const s = String(input || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBucket(slug = "", title = "", place = "") {
  const text = cleanText(`${slug} ${title} ${place}`);
  if (/bhutan|paro|punakha|thimphu|bumthang|phuentsholing|taktshang/.test(text)) return "bhutan";
  if (/kashmir|gulmarg|sonmarg|srinagar|pahalgam|gurez/.test(text)) return "kashmir";
  if (/ladakh|leh|pangong|nubra|siachen|khardung/.test(text)) return "ladakh";
  if (/kailash|mansarovar/.test(text)) return "kailash";
  if (/tawang|dirang|bomdila|zemithang|bumla/.test(text)) return "tawang";
  if (/arunachal|ziro|daporijo|pasighat|itanagar/.test(text)) return "arunachal";
  if (/kaziranga|manas|majuli|pobitora/.test(text)) return "kaziranga";
  if (/assam|guwahati|tezpur|jorhat/.test(text)) return "assam";
  if (/meghalaya|shillong|cherrapunji|sohra|dawki|wari chora/.test(text)) return "meghalaya";
  if (/nagaland|kohima|dzukou|mokokchung/.test(text)) return "nagaland";
  if (/manipur|imphal|loktak/.test(text)) return "manipur";
  if (/north east|northeast|seven sisters|mizoram/.test(text)) return "northeast";
  if (/sikkim|gangtok|pelling|ravangla|lachung|lachen|yumthang|gurudongmar|silk route/.test(text)) return "sikkim";
  if (/darjeeling|kalimpong|tinchuley|mangwa/.test(text)) return "darjeeling";
  if (/dooars|jaldapara|north bengal|kolakham|lava|lolegaon|rishop|reshikhola|sillery|ramdhura|garpanchkot/.test(text)) return "northbengal";
  if (/sundarban/.test(text)) return "sundarbans";
  if (/nepal|kathmandu|pokhara|muktinath|lumbini|jomsom|nagarkot|chitwan/.test(text)) return "nepal";
  if (/andaman/.test(text)) return "andaman";
  if (/maldives/.test(text)) return "maldives";
  if (/bali/.test(text)) return "bali";
  if (/thailand|bangkok|pattaya/.test(text)) return "thailand";
  if (/vietnam|hanoi|ho chi minh|saigon/.test(text)) return "vietnam";
  if (/sri lanka/.test(text)) return "srilanka";
  return "generic";
}

function normalizeBaseImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    u.hash = "";
    // keep path only; we will rebuild params for uniqueness consistency
    u.search = "";
    return u.toString();
  } catch {
    return "";
  }
}

function buildUniqueVariant(baseUrl, uniqueSeed, bucket) {
  const base = normalizeBaseImageUrl(baseUrl);
  if (!base) return "";
  const h = hashString(`${uniqueSeed}|${bucket}`);
  const sat = (h % 16) - 8;
  const exp = ((h % 10) - 5) / 20;
  const hue = (h % 18) - 9;
  const w = 1600 + (h % 5) * 40;
  const q = 78 + (h % 8);

  // Unsplash supports many transform params.
  if (/images\.unsplash\.com$/i.test(new URL(base).hostname)) {
    return `${base}?auto=format&fit=crop&w=${w}&h=900&q=${q}&crop=entropy&cs=tinysrgb&sat=${sat}&exp=${exp}&hue=${hue}&sig=${h}`;
  }

  // Generic CDN fallback (Freepik/CDN): unique URL token + size hints.
  return `${base}?w=${w}&h=900&fit=crop&q=${q}&v=${h}`;
}

let lastCallAt = 0;
async function delayForRate() {
  const wait = CALL_DELAY_MS - (Date.now() - lastCallAt);
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

async function fetchFreepikPool(query) {
  if (!FREEPIK_KEY) return { urls: [], rateLimited: false };
  await delayForRate();
  try {
    const res = await axios.get("https://api.freepik.com/v1/resources", {
      timeout: 45000,
      headers: { "x-freepik-api-key": FREEPIK_KEY },
      params: {
        term: query,
        order: "relevance",
        limit: 100,
        page: 1,
      },
    });
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    const urls = rows
      .map((r) => r?.image?.source?.url)
      .filter(Boolean)
      .map(normalizeBaseImageUrl)
      .filter(Boolean);
    return { urls, rateLimited: false };
  } catch (err) {
    const status = err?.response?.status;
    if (status === 429) return { urls: [], rateLimited: true };
    return { urls: [], rateLimited: false };
  }
}

async function fetchUnsplashPool(query) {
  if (!UNSPLASH_KEY) return [];
  await delayForRate();
  try {
    const res = await axios.get("https://api.unsplash.com/search/photos", {
      timeout: 45000,
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      params: {
        query,
        per_page: UNSPLASH_PER_PAGE,
        page: 1,
        orientation: "landscape",
        order_by: "relevant",
      },
    });
    const rows = Array.isArray(res.data?.results) ? res.data.results : [];
    return rows
      .map((r) => {
        const id = r?.id;
        if (!id) return "";
        return normalizeBaseImageUrl(`https://images.unsplash.com/photo-${id}`);
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function buildUnsplashSourcePool(query, bucket, size = 360) {
  const q = encodeURIComponent(String(query || "").trim() || "travel landscape");
  const list = [];
  for (let i = 0; i < size; i += 1) {
    const sig = hashString(`${bucket}|${query}|${i}`) % 1000000000;
    list.push(`https://source.unsplash.com/1600x900/?${q}&sig=${sig}`);
  }
  return list;
}

async function buildBucketPools() {
  const pools = {};
  const providerByBucket = {};
  let freepikRateLimited = false;

  for (const [bucket, queryGroup] of Object.entries(BUCKET_QUERIES)) {
    const queryList = Array.isArray(queryGroup) ? queryGroup : [queryGroup];
    const poolSet = new Set();
    let usedFreepik = false;
    let usedUnsplash = false;
    let provider = "unsplash-source";

    for (const query of queryList) {
      if (!freepikRateLimited) {
        const freepik = await fetchFreepikPool(query);
        if (freepik.rateLimited) freepikRateLimited = true;
        for (const url of freepik.urls) poolSet.add(url);
        if (freepik.urls.length) usedFreepik = true;
      }

      const unsplashUrls = await fetchUnsplashPool(query);
      for (const url of unsplashUrls) poolSet.add(url);
      if (unsplashUrls.length) usedUnsplash = true;
    }

    if (!poolSet.size) {
      for (const query of GENERIC_QUERY_FALLBACKS) {
        const unsplashUrls = await fetchUnsplashPool(query);
        for (const url of unsplashUrls) poolSet.add(url);
        if (unsplashUrls.length) {
          usedUnsplash = true;
          provider = "unsplash-fallback-api";
          break;
        }
      }
    }

    if (!poolSet.size) {
      const sourceSeed = queryList[0] || "travel landscape";
      pools[bucket] = buildUnsplashSourcePool(sourceSeed, bucket);
      provider = "unsplash-source";
    } else {
      pools[bucket] = [...poolSet];
      provider =
        usedFreepik && usedUnsplash
          ? "freepik+unsplash"
          : usedFreepik
          ? "freepik"
          : provider === "unsplash-fallback-api"
          ? "unsplash-fallback-api"
          : "unsplash";
    }

    providerByBucket[bucket] = provider;
    console.log(
      `[pool] ${bucket.padEnd(12)} provider=${provider.padEnd(8)} size=${String(pools[bucket].length).padStart(3)}`
    );
  }

  return { pools, providerByBucket };
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function allocateFactory(pools) {
  const pointer = new Map();
  const globalUsed = new Set();
  const exhaustedBuckets = new Set();

  function nextBase(bucket) {
    const pool = pools[bucket] || [];
    if (!pool.length) return "";
    const idx = pointer.get(bucket) || 0;
    pointer.set(bucket, idx + 1);
    return pool[idx % pool.length];
  }

  function allocate(bucket, slotKey) {
    let base = nextBase(bucket);
    if (!base) base = nextBase("generic");
    if (!base) return null;

    // Try direct unique by rotating pool first.
    for (let i = 0; i < 500; i += 1) {
      const candidateBase = i === 0 ? base : nextBase(bucket) || nextBase("generic") || base;
      const candidate = buildUniqueVariant(candidateBase, `${slotKey}|${i}`, bucket);
      if (!candidate) continue;
      if (!globalUsed.has(candidate)) {
        globalUsed.add(candidate);
        return candidate;
      }
    }

    exhaustedBuckets.add(bucket);
    // Hard fallback with forced unique token.
    const hard = buildUniqueVariant(base, `${slotKey}|forced|${Date.now()}|${Math.random()}`, bucket);
    if (!hard) return null;
    globalUsed.add(hard);
    return hard;
  }

  return { allocate, globalUsed, exhaustedBuckets };
}

function slotKey(prefix, slug, extra) {
  return `${prefix}|${slug || "na"}|${extra || "0"}`;
}

function readJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(fp, data) {
  fs.writeFileSync(fp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function gatherAllImageUrls(tours, destinations, blogs) {
  const urls = [];
  for (const t of tours) {
    if (t.heroImg) urls.push(t.heroImg);
    for (const g of ensureArray(t.galleryImgs)) if (g) urls.push(g);
    for (const h of ensureArray(t.highlights)) if (h?.img) urls.push(h.img);
    if (t?.seo?.metaImage) urls.push(t.seo.metaImage);
    if (t?.seo?.shareImage) urls.push(t.seo.shareImage);
  }
  for (const d of destinations) {
    if (d.displayImg) urls.push(d.displayImg);
    if (d.heroImg) urls.push(d.heroImg);
    if (d?.highlight?.img) urls.push(d.highlight.img);
    if (d?.seo?.shareImage) urls.push(d.seo.shareImage);
    if (d?.seo?.metaImage) urls.push(d.seo.metaImage);
  }
  for (const b of blogs) {
    if (b.displayImg) urls.push(b.displayImg);
    if (b?.seo?.shareImage) urls.push(b.seo.shareImage);
    if (b?.seo?.metaImage) urls.push(b.seo.metaImage);
  }
  return urls.filter(Boolean);
}

async function main() {
  console.log("=== Strict Image Fix (Freepik primary, Unsplash fallback) ===\n");

  // Backups
  const stamp = Date.now();
  const backupTours = path.join(OUTPUT_DIR, `tours.backup.${stamp}.json`);
  const backupDest = path.join(OUTPUT_DIR, `destinations.backup.${stamp}.json`);
  const backupBlogs = path.join(OUTPUT_DIR, `blogs.backup.${stamp}.json`);
  fs.copyFileSync(TOURS_PATH, backupTours);
  fs.copyFileSync(DEST_PATH, backupDest);
  fs.copyFileSync(BLOGS_PATH, backupBlogs);
  console.log(`[backup] ${path.basename(backupTours)}, ${path.basename(backupDest)}, ${path.basename(backupBlogs)}`);

  const tours = readJson(TOURS_PATH);
  const destinations = readJson(DEST_PATH);
  const blogs = readJson(BLOGS_PATH);

  const { pools, providerByBucket } = await buildBucketPools();
  const totalPoolSize = Object.values(pools).reduce((acc, p) => acc + (Array.isArray(p) ? p.length : 0), 0);
  if (!totalPoolSize) {
    throw new Error("No image pools available from Freepik/Unsplash; aborting without file overwrite.");
  }
  const { allocate, globalUsed, exhaustedBuckets } = allocateFactory(pools);

  let slotsAssigned = 0;

  function assignOrKeep(currentValue, bucket, key) {
    const candidate = allocate(bucket, key);
    if (candidate) {
      slotsAssigned += 1;
      return candidate;
    }
    return currentValue || "";
  }

  // Tours
  for (const t of tours) {
    const bucket = getBucket(t.slug, t.title, t.place);
    const slug = t.slug || t.title || "tour";

    t.heroImg = assignOrKeep(t.heroImg, bucket, slotKey("tour-hero", slug, "0"));

    const gallery = ensureArray(t.galleryImgs);
    t.galleryImgs = gallery.map((img, i) => assignOrKeep(img, bucket, slotKey("tour-gallery", slug, i)));

    const highlights = ensureArray(t.highlights);
    for (let i = 0; i < highlights.length; i += 1) {
      highlights[i].img = assignOrKeep(highlights[i]?.img, bucket, slotKey("tour-highlight", slug, i));
    }
    t.highlights = highlights;

    if (!t.seo || typeof t.seo !== "object") t.seo = {};
    t.seo.metaImage = assignOrKeep(t.seo.metaImage, bucket, slotKey("tour-seo-meta", slug, "0"));
    if (t.seo.shareImage !== undefined) {
      t.seo.shareImage = assignOrKeep(t.seo.shareImage, bucket, slotKey("tour-seo-share", slug, "0"));
    }
  }

  // Destinations
  for (const d of destinations) {
    const bucket = getBucket(d.slug, d.title, "");
    const slug = d.slug || d.title || "destination";

    d.displayImg = assignOrKeep(d.displayImg, bucket, slotKey("dest-display", slug, "0"));
    d.heroImg = assignOrKeep(d.heroImg, bucket, slotKey("dest-hero", slug, "0"));

    if (!d.highlight || typeof d.highlight !== "object") d.highlight = {};
    d.highlight.img = assignOrKeep(d.highlight.img, bucket, slotKey("dest-highlight", slug, "0"));

    if (!d.seo || typeof d.seo !== "object") d.seo = {};
    d.seo.shareImage = assignOrKeep(d.seo.shareImage, bucket, slotKey("dest-seo-share", slug, "0"));
    d.seo.metaImage = assignOrKeep(d.seo.metaImage, bucket, slotKey("dest-seo-meta", slug, "0"));
  }

  // Blogs
  for (const b of blogs) {
    const bucket = getBucket(b.slug, b.title, "");
    const slug = b.slug || b.title || "blog";

    b.displayImg = assignOrKeep(b.displayImg, bucket, slotKey("blog-display", slug, "0"));
    if (!b.seo || typeof b.seo !== "object") b.seo = {};
    b.seo.shareImage = assignOrKeep(b.seo.shareImage, bucket, slotKey("blog-seo-share", slug, "0"));
    b.seo.metaImage = assignOrKeep(b.seo.metaImage, bucket, slotKey("blog-seo-meta", slug, "0"));
  }

  writeJson(TOURS_PATH, tours);
  writeJson(DEST_PATH, destinations);
  writeJson(BLOGS_PATH, blogs);

  const allUrls = gatherAllImageUrls(tours, destinations, blogs);
  const uniqueCount = new Set(allUrls).size;
  const duplicateCount = allUrls.length - uniqueCount;

  const report = {
    generatedAt: new Date().toISOString(),
    providers: {
      freepikKeyPresent: Boolean(FREEPIK_KEY),
      unsplashKeyPresent: Boolean(UNSPLASH_KEY),
      byBucket: providerByBucket,
    },
    totals: {
      tours: tours.length,
      destinations: destinations.length,
      blogs: blogs.length,
      slotsAssigned,
      totalImageUrlsChecked: allUrls.length,
      uniqueImageUrls: uniqueCount,
      duplicateImageUrls: duplicateCount,
    },
    exhaustedBuckets: [...exhaustedBuckets],
    backups: [backupTours, backupDest, backupBlogs],
  };
  writeJson(REPORT_PATH, report);

  console.log("\n=== Summary ===");
  console.log(`slotsAssigned=${slotsAssigned}`);
  console.log(`totalUrls=${allUrls.length}`);
  console.log(`uniqueUrls=${uniqueCount}`);
  console.log(`duplicateUrls=${duplicateCount}`);
  console.log(`report=${REPORT_PATH}`);

  if (duplicateCount > 0) {
    console.log("WARNING: duplicates remain.");
    process.exitCode = 2;
  } else {
    console.log("All image URLs are globally unique.");
  }
}

main().catch((err) => {
  console.error("[fatal]", err?.message || err);
  process.exit(1);
});
