const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "output");
const TARGET_FILES = ["blogs.json", "destinations.json", "tours.json"];

// Stable Unsplash CDN URLs (not source.unsplash.com)
const UNSPLASH_POOL = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500048993959-dc5b3c1b56d6?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1602002418082-dd4a9d7d2f27?auto=format&fit=crop&w=1600&q=80",
];

const IMAGE_KEYS = new Set([
  "displayImg",
  "heroImg",
  "img",
  "image",
  "shareImage",
  "metaImage",
  "thumbnail",
  "coverImage",
  "bannerImage",
  "profileImg",
]);

const IMAGE_ARRAY_KEYS = new Set(["galleryImgs", "images"]);

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function isImagesUnsplash(url) {
  try {
    return new URL(url).hostname.toLowerCase() === "images.unsplash.com";
  } catch {
    return false;
  }
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

function pickUnsplash(seed) {
  const idx = hashString(seed) % UNSPLASH_POOL.length;
  return UNSPLASH_POOL[idx];
}

function normalizeImageUrl(value, seed) {
  // Use deterministic curated pool always to avoid dead/expired external URLs.
  // This intentionally replaces even existing images.unsplash.com links.
  return pickUnsplash(seed);
}

function normalizeNode(node, seedBase, counters) {
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    node.forEach((item, idx) => normalizeNode(item, `${seedBase}[${idx}]`, counters));
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    const seed = `${seedBase}.${key}`;

    if (IMAGE_ARRAY_KEYS.has(key) && Array.isArray(value)) {
      node[key] = value.map((v, idx) => {
        if (typeof v !== "string") return v;
        const next = normalizeImageUrl(v, `${seed}[${idx}]`);
        if (next !== v) counters.replaced += 1;
        return next;
      });
      continue;
    }

    if (IMAGE_KEYS.has(key)) {
      if (typeof value === "string") {
        const next = normalizeImageUrl(value, seed);
        if (next !== value) counters.replaced += 1;
        node[key] = next;
      } else if (!value) {
        node[key] = pickUnsplash(seed);
        counters.replaced += 1;
      }
      continue;
    }

    normalizeNode(value, seed, counters);
  }
}

function run() {
  const summary = [];

  for (const file of TARGET_FILES) {
    const abs = path.join(OUTPUT_DIR, file);
    if (!fs.existsSync(abs)) continue;

    const raw = fs.readFileSync(abs, "utf8");
    const data = JSON.parse(raw);
    const counters = { replaced: 0 };

    if (Array.isArray(data)) {
      data.forEach((row, idx) => {
        const seed = row?.slug || row?.title || `${file}:${idx}`;
        normalizeNode(row, seed, counters);
      });
    } else {
      normalizeNode(data, file, counters);
    }

    fs.writeFileSync(abs, JSON.stringify(data, null, 2) + "\n", "utf8");
    summary.push({ file, replaced: counters.replaced });
  }

  for (const row of summary) {
    console.log(`${row.file}: replaced_images=${row.replaced}`);
  }
}

run();
