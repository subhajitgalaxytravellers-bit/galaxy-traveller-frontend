"use strict";
const path = require("path");
const fs   = require("fs");
const axios = require("axios");

// Load .env files
function loadEnv(fp) {
  if (!fs.existsSync(fp)) return;
  for (const raw of fs.readFileSync(fp, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
const ROOT = path.resolve(__dirname, "../../../..");
loadEnv(path.join(ROOT, "front", ".env"));
loadEnv(path.join(ROOT, "galaxy-traveller-backend", ".env"));

async function main() {
  const UNSPLASH = process.env.UNSPLASH_ACCESS_KEY || "";
  const FREEPIK  = process.env.FREEPIK_API_KEY || "";
  console.log("Unsplash key:", UNSPLASH ? UNSPLASH.substring(0, 8) + "..." : "MISSING");
  console.log("Freepik key :", FREEPIK  ? FREEPIK.substring(0, 8)  + "..." : "MISSING");

  // Test Unsplash
  try {
    const r = await axios.get("https://api.unsplash.com/search/photos", {
      timeout: 10000,
      headers: { Authorization: `Client-ID ${UNSPLASH}` },
      params: { query: "Bhutan mountains", per_page: 2 }
    });
    console.log("\nUnsplash OK:", r.status, "results:", r.data.results?.length, "rate-remaining:", r.headers["x-ratelimit-remaining"]);
  } catch (e) {
    console.log("\nUnsplash FAIL:", e.response?.status, "rate-remaining:", e.response?.headers?.["x-ratelimit-remaining"], String(e.response?.data?.errors || e.message).substring(0, 150));
  }

  // Test Freepik
  try {
    const r = await axios.get("https://api.freepik.com/v1/resources", {
      timeout: 12000,
      headers: { "x-freepik-api-key": FREEPIK },
      params: {
        term: "Ladakh monastery",
        "filters[content_type][photo]": 1,
        "filters[orientation][landscape]": 1,
        limit: 5,
        order: "relevance"
      }
    });
    const rows = r.data?.data || [];
    console.log("\nFreepik OK:", r.status, "rows:", rows.length);
    rows.forEach((rw, i) => {
      const url = rw?.image?.source?.url || rw?.preview?.url || rw?.thumbnail?.url || null;
      const size = rw?.image?.source?.size || "?";
      console.log(` [${i}] url: ${url ? url.substring(0, 80) : "NULL"}  size: ${size}`);
    });
  } catch (e) {
    console.log("\nFreepik FAIL:", e.response?.status, String(JSON.stringify(e.response?.data || e.message)).substring(0, 400));
  }
}

main();
