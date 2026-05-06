/** @type {import('next').NextConfig} */

// Extract hostname from NEXT_PUBLIC_BASE_API env var so production images
// from the real backend are automatically whitelisted without hardcoding.
function getApiHostname() {
  const raw = process.env.NEXT_PUBLIC_BASE_API || "";
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const apiHostname = getApiHostname(); // e.g. "api.galaxytravellers.com" in prod

/** @type {import('next').NextConfig['images']['remotePatterns']} */
const remotePatterns = [
  // ── Backend / uploads ────────────────────────────────────────────────────
  // localhost dev
  { protocol: "http",  hostname: "127.0.0.1", pathname: "/**" },
  { protocol: "http",  hostname: "localhost",  pathname: "/**" },
  // production API server (auto-detected from env)
  ...(apiHostname
    ? [{ protocol: "https", hostname: apiHostname, pathname: "/**" }]
    : []),

  // ── Google / Firebase storage ─────────────────────────────────────────
  { protocol: "https", hostname: "storage.googleapis.com",  pathname: "/**" },
  { protocol: "https", hostname: "*.googleapis.com",        pathname: "/**" },
  { protocol: "https", hostname: "developers.google.com",   pathname: "/**" },
  { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },

  // ── External CMS / supplier images ────────────────────────────────────
  { protocol: "http", hostname: "img.b2bpic.net", pathname: "/**" },
  { protocol: "https", hostname: "img.b2bpic.net", pathname: "/**" },

  // ── Unsplash (placeholder / seeded images) ────────────────────────────
  { protocol: "https", hostname: "images.unsplash.com",  pathname: "/**" },
  { protocol: "https", hostname: "plus.unsplash.com",    pathname: "/**" },
];

const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
