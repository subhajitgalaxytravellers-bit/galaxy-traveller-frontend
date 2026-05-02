export function sanitizeGCSUrl(url) {
  if (!url || typeof url !== "string") return "";

  try {
    // If URL is already valid, return unchanged
    new URL(url);
    return url;
  } catch (err) {
    // Continue and fix broken URLs
  }

  // Encode ONLY the path, never the domain
  const parts = url.split(".com/");
  if (parts.length !== 2) return url; // not a gcs URL

  const base = parts[0] + ".com";
  const path = parts[1];

  // Encode ONLY unsafe characters
  const safePath = path
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");

  return `${base}/${safePath}`;
}
