"use strict";

const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const SOURCE_HOST = "https://www.naturewings.com";
const OUTPUT_DIR = path.join(__dirname, "output");

function cleanText(value = "") {
  return String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function slugifyText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeUrl(url = "") {
  const raw = cleanText(url);
  if (!raw) return "";
  try {
    const parsed = new URL(raw, SOURCE_HOST);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return "";
  }
}

function pathSlugFromUrl(url = "") {
  try {
    const parsed = new URL(url, SOURCE_HOST);
    return decodeURIComponent(parsed.pathname).split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
}

async function readJson(file) {
  const data = await fs.readFile(path.join(OUTPUT_DIR, file), "utf8");
  return JSON.parse(data);
}

async function writeJson(file, data) {
  await fs.writeFile(path.join(OUTPUT_DIR, file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchMenuPackageOrder() {
  const html = await axios
    .get(SOURCE_HOST, {
      timeout: 60000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    })
    .then((res) => String(res.data || ""));

  const $ = cheerio.load(html);
  const menuOrder = [];
  const seen = new Set();

  const packagesRoot = $("li")
    .filter((_, el) =>
      cleanText($(el).children("a").first().text()).toUpperCase().startsWith("PACKAGES"),
    )
    .first();

  packagesRoot.find("ul.mega-dropdown-menu a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const absolute = normalizeUrl(href);
    if (!absolute) return;
    if (!absolute.includes("/packages/")) return;
    if (seen.has(absolute)) return;
    seen.add(absolute);
    menuOrder.push({
      href: absolute,
      label: cleanText($(el).text()),
      slug: slugifyText(pathSlugFromUrl(absolute)),
    });
  });

  return menuOrder;
}

function buildOrderMaps(menuOrder) {
  const byUrl = new Map();
  const bySlug = new Map();
  menuOrder.forEach((item, index) => {
    byUrl.set(item.href, index);
    if (item.slug && !bySlug.has(item.slug)) bySlug.set(item.slug, index);
  });
  return { byUrl, bySlug };
}

function getTourOrderIndex(tour, maps) {
  const sourceUrl = normalizeUrl(tour?.relationHint?.sourceUrl || "");
  const slug = slugifyText(tour?.slug || "");
  const sourceSlug = slugifyText(pathSlugFromUrl(sourceUrl));

  if (sourceUrl && maps.byUrl.has(sourceUrl)) return maps.byUrl.get(sourceUrl);
  if (sourceSlug && maps.bySlug.has(sourceSlug)) return maps.bySlug.get(sourceSlug);
  if (slug && maps.bySlug.has(slug)) return maps.bySlug.get(slug);
  return Number.POSITIVE_INFINITY;
}

function stableSort(array, scoreFn, tieFn) {
  return array
    .map((item, idx) => ({ item, idx, score: scoreFn(item) }))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const tie = tieFn(a.item, b.item);
      if (tie !== 0) return tie;
      return a.idx - b.idx;
    })
    .map((row) => row.item);
}

function alphaTie(a, b, aKey = "title", bKey = "title") {
  const x = cleanText(a?.[aKey] || "").toLowerCase();
  const y = cleanText(b?.[bKey] || "").toLowerCase();
  return x.localeCompare(y);
}

async function main() {
  const [tours, destinations, blogs] = await Promise.all([
    readJson("tours.json"),
    readJson("destinations.json"),
    readJson("blogs.json"),
  ]);

  const menuOrder = await fetchMenuPackageOrder();
  const maps = buildOrderMaps(menuOrder);

  const orderedTours = stableSort(
    tours,
    (tour) => getTourOrderIndex(tour, maps),
    (a, b) => alphaTie(a, b),
  );

  const tourIndexBySlug = new Map();
  orderedTours.forEach((tour, index) => {
    const slug = slugifyText(tour?.slug || "");
    if (slug) tourIndexBySlug.set(slug, index);
  });

  const orderedBlogs = stableSort(
    blogs,
    (blog) => {
      const tourSlug = slugifyText(blog?.relations?.tours?.[0] || "");
      if (tourSlug && tourIndexBySlug.has(tourSlug)) return tourIndexBySlug.get(tourSlug);
      return Number.POSITIVE_INFINITY;
    },
    (a, b) => alphaTie(a, b),
  );

  const orderedDestinations = stableSort(
    destinations,
    (destination) => {
      const linked = Array.isArray(destination?.tours) ? destination.tours : [];
      let min = Number.POSITIVE_INFINITY;
      for (const slug of linked) {
        const key = slugifyText(slug || "");
        if (tourIndexBySlug.has(key)) {
          min = Math.min(min, tourIndexBySlug.get(key));
        }
      }
      return min;
    },
    (a, b) => alphaTie(a, b),
  );

  const matchedMenuCount = menuOrder.filter((entry) => {
    const idxByUrl = maps.byUrl.get(entry.href);
    if (idxByUrl === undefined) return false;
    return orderedTours.some((tour) => getTourOrderIndex(tour, maps) === idxByUrl);
  }).length;

  const missingMenuEntries = menuOrder
    .filter((entry) => !orderedTours.some((tour) => getTourOrderIndex(tour, maps) === maps.byUrl.get(entry.href)))
    .map((entry) => ({ label: entry.label, href: entry.href }));

  const toursNotInMenu = orderedTours
    .filter((tour) => !Number.isFinite(getTourOrderIndex(tour, maps)))
    .map((tour) => ({
      slug: tour.slug,
      title: tour.title,
      sourceUrl: cleanText(tour?.relationHint?.sourceUrl || ""),
    }));

  await Promise.all([
    writeJson("tours.json", orderedTours),
    writeJson("destinations.json", orderedDestinations),
    writeJson("blogs.json", orderedBlogs),
    writeJson("menu-order-report.json", {
      source: SOURCE_HOST,
      generatedAt: new Date().toISOString(),
      totals: {
        menuPackages: menuOrder.length,
        tours: orderedTours.length,
        destinations: orderedDestinations.length,
        blogs: orderedBlogs.length,
        menuMatchedInTours: matchedMenuCount,
        menuMissingInTours: missingMenuEntries.length,
        toursNotInMenu: toursNotInMenu.length,
      },
      missingMenuEntries,
      toursNotInMenu: toursNotInMenu.slice(0, 80),
    }),
  ]);

  console.log("[done] Reordered tours/destinations/blogs by live NatureWings package-menu order.");
}

main().catch((error) => {
  console.error("[fatal]", error?.message || error);
  process.exit(1);
});
