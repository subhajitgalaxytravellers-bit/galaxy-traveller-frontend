const STABLE_REMOTE_FALLBACKS = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
];

const DEAD_UNSPLASH_PATH_REPLACEMENTS = {
  "photo-1574417806681-e6cfe6a3461f":
    "https://images.unsplash.com/photo-1448375240586-882707db888b",
  "photo-1542727313-4f3e9791d7ac":
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
};

function hashString(input) {
  let h = 0;
  const s = String(input || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickStableRemoteFallback(seed) {
  return STABLE_REMOTE_FALLBACKS[
    hashString(seed) % STABLE_REMOTE_FALLBACKS.length
  ];
}

function isSourceUnsplashUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase() === "source.unsplash.com";
  } catch {
    return false;
  }
}

function isBrokenUnsplashCdnUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== "images.unsplash.com") return false;
    const match = parsed.pathname.match(/^\/photo-([^/]+)$/i);
    if (!match) return false;
    return !/^\d{10,}(?:-[A-Za-z0-9_-]+)?$/i.test(match[1] || "");
  } catch {
    return false;
  }
}

function rewriteDeadUnsplashUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== "images.unsplash.com") return null;
    const deadBase = DEAD_UNSPLASH_PATH_REPLACEMENTS[
      parsed.pathname.replace(/^\//, "")
    ];
    if (!deadBase) return null;
    return `${deadBase}${parsed.search}`;
  } catch {
    return null;
  }
}

export function sanitizeGCSUrl(url, seed = "") {
  if (!url || typeof url !== "string") return "";

  if (isSourceUnsplashUrl(url) || isBrokenUnsplashCdnUrl(url)) {
    return pickStableRemoteFallback(seed || url);
  }

  const deadUnsplashReplacement = rewriteDeadUnsplashUrl(url);
  if (deadUnsplashReplacement) {
    return deadUnsplashReplacement;
  }

  try {
    new URL(url);
    return url;
  } catch {
    // Continue and fix broken URLs
  }

  const parts = url.split(".com/");
  if (parts.length !== 2) return url;

  const base = parts[0] + ".com";
  const path = parts[1];

  const safePath = path
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");

  return `${base}/${safePath}`;
}
