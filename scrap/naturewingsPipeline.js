"use strict";

const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const { chromium } = require("playwright");

const FRONT_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(FRONT_DIR, "..");
const OUTPUT_DIR = path.join(__dirname, "output");
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, "checkpoint.json");

const SOURCE_HOST = "https://www.naturewings.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MAX_PACKAGES = Number(process.env.SCRAPE_MAX_PACKAGES || "0");
const MAX_GROQ_CALLS = Number(process.env.SCRAPE_MAX_GROQ_CALLS || "40");
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
  "https://images.unsplash.com/photo-1542727313-4f3e9791d7ac?w=1600&q=80",
  "https://images.unsplash.com/photo-1474487548417-781cb6d646b8?w=1600&q=80",
  "https://images.unsplash.com/photo-1576400883215-7083980b6674?w=1600&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80",
  "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1600&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80",
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&q=80",
  "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1600&q=80",
];

let fallbackImageIndex = 0;
let browser = null;
let unsplashTick = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(value = "") {
  return String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueList(values) {
  return [...new Set(values.filter(Boolean).map((item) => cleanText(item)).filter(Boolean))];
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

function normalizeUrl(rawUrl) {
  const cleaned = cleanText(rawUrl || "");
  if (!cleaned || cleaned === "#" || /^javascript:/i.test(cleaned)) return "";
  try {
    const urlObj = new URL(cleaned, SOURCE_HOST);
    urlObj.hash = "";
    urlObj.search = "";
    const normalized = urlObj.toString().replace(/\/$/, "");
    if (!normalized || normalized === SOURCE_HOST) return "";
    return normalized;
  } catch {
    return "";
  }
}

function stripPromoText(value = "") {
  return cleanText(
    String(value)
      .replace(/\+?\d[\d\s\-\/]{7,}/g, " ")
      .replace(/\b(book now|best rate|for booking|call now|talk to a specialist)\b/gi, " ")
      .replace(/\|\s*/g, " ")
      .replace(/\s{2,}/g, " "),
  );
}

function normalizeTitle(value = "") {
  return stripPromoText(value).replace(/\s*-\s*$/, "").trim();
}

function isProbableImageUrl(url = "") {
  const value = String(url || "").toLowerCase();
  if (!value.startsWith("http")) return false;
  if (value === SOURCE_HOST || value === `${SOURCE_HOST}/`) return false;
  if (/\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/i.test(value)) return true;
  if (value.includes("images.unsplash.com")) return true;
  if (value.includes("/images/")) return true;
  return false;
}

function isNoiseLine(text = "") {
  const line = cleanText(text);
  if (!line) return true;
  const lower = line.toLowerCase();
  if (
    /^(home|about us|destinations|packages|contact us|franchise solicited|talk to a specialist)$/.test(
      lower,
    )
  ) {
    return true;
  }
  if (/(north ?east|sikkim|kashmir|bhutan)\s*:\s*\d/.test(lower)) return true;
  if (/\+?\d[\d\s\-\/]{8,}/.test(line)) return true;
  return false;
}

async function parseEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const envMap = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envMap[key] = val;
    }
    return envMap;
  } catch {
    return {};
  }
}

async function loadEnv() {
  const frontEnv = await parseEnvFile(path.join(FRONT_DIR, ".env"));
  const backendEnv = await parseEnvFile(path.join(REPO_ROOT, "galaxy-traveller-backend", ".env"));
  return {
    ...frontEnv,
    ...backendEnv,
    ...process.env,
  };
}

async function fetchHtmlWithAxios(url) {
  const response = await axios.get(url, {
    timeout: 45000,
    responseType: "arraybuffer",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  // Always decode as UTF-8 to preserve multi-byte characters (e.g. ☎)
  return Buffer.from(response.data).toString("utf8");
}

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

async function fetchHtmlWithPlaywright(url) {
  const activeBrowser = await getBrowser();
  const context = await activeBrowser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => null);
  const html = await page.content();
  await context.close();
  return String(html || "");
}

async function fetchHtml(url) {
  try {
    const html = await fetchHtmlWithAxios(url);
    if (html.length > 1200) return html;
  } catch {}
  return fetchHtmlWithPlaywright(url);
}

function extractLocs(xml) {
  const locs = [];
  const regex = /<loc>(.*?)<\/loc>/gi;
  let match = regex.exec(xml);
  while (match) {
    locs.push(cleanText(match[1]));
    match = regex.exec(xml);
  }
  return locs;
}

async function discoverPackageUrls() {
  const sitemapQueue = [
    `${SOURCE_HOST}/sitemap.xml`,
    `${SOURCE_HOST}/sitemap_index.xml`,
  ];
  const visitedSitemaps = new Set();
  const packageUrls = new Set();

  while (sitemapQueue.length > 0) {
    const sitemapUrl = sitemapQueue.shift();
    if (!sitemapUrl || visitedSitemaps.has(sitemapUrl)) continue;
    visitedSitemaps.add(sitemapUrl);
    try {
      const xml = await axios
        .get(sitemapUrl, { timeout: 45000, headers: { "User-Agent": USER_AGENT } })
        .then((res) => String(res.data || ""));
      const locs = extractLocs(xml);
      for (const loc of locs) {
        const normalized = normalizeUrl(loc);
        if (!normalized) continue;
        if (normalized.endsWith(".xml")) {
          sitemapQueue.push(normalized);
          continue;
        }
        if (normalized.includes("/packages/")) {
          packageUrls.add(normalized);
        }
      }
    } catch {}
  }

  if (packageUrls.size === 0) {
    const homeHtml = await fetchHtml(SOURCE_HOST);
    const $ = cheerio.load(homeHtml);
    $("a[href]").each((_, el) => {
      const href = normalizeUrl($(el).attr("href"));
      if (href && href.includes("/packages/")) packageUrls.add(href);
    });
  }

  return [...packageUrls]
    .filter((url) => !/\.(jpg|jpeg|png|pdf|webp)$/i.test(url))
    .filter((url) => !url.endsWith("/packages"))
    .sort();
}

function getFirstMatch(text, regex) {
  const match = regex.exec(text);
  if (!match) return "";
  return cleanText(match[1] || match[0]);
}

function parsePrice(text) {
  const match = text.match(/(?:rs\.?|inr|₹)\s*([0-9][0-9,]{2,})/i);
  if (!match) return null;
  const value = Number(String(match[1]).replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function parseDuration(text) {
  const compact = getFirstMatch(text, /(\d+\s*[nN]\s*\/\s*\d+\s*[dD]|\d+\s*[dD]\s*\/\s*\d+\s*[nN])/);
  if (compact) {
    return compact.toUpperCase().replace(/\s+/g, "");
  }
  const dayOnly = getFirstMatch(text, /(\d{1,2}\s*(?:days?|day))/i);
  return dayOnly || "";
}

function parseTotalDays(duration) {
  if (!duration) return 0;
  const match = duration.match(/(\d{1,2})\s*[dD]/);
  if (match) return Number(match[1]);
  const dayOnly = duration.match(/(\d{1,2})\s*day/i);
  if (dayOnly) return Number(dayOnly[1]);
  return 0;
}

function inferPlace(title = "") {
  return stripPromoText(
    String(title)
      .replace(/best of/gi, "")
      .replace(/package tour|tour package|tour|package/gi, "")
      .replace(/-\s*\d+\s*[nd]/gi, "")
      .replace(/\bfrom\b.*$/i, "")
      .replace(/\s+/g, " "),
  );
}

function extractItinerary(lines) {
  const items = [];
  for (const line of lines) {
    const dayMatch = line.match(/\bday\s*([0-9]{1,2})\s*[:\-]?\s*(.*)/i);
    if (!dayMatch) continue;
    const day = dayMatch[1];
    const remainder = cleanText(dayMatch[2]);
    if (!remainder || remainder.length < 4) continue;
    items.push({
      day,
      title: remainder.split(/[,.|]/)[0].slice(0, 100).trim(),
      activity: remainder,
      notes: "",
    });
  }
  const dedup = new Map();
  for (const item of items) {
    if (!dedup.has(item.day)) dedup.set(item.day, item);
  }
  return [...dedup.values()].slice(0, 14);
}

function extractNearbyListByKeyword(lines, keywordRegex) {
  const idx = lines.findIndex((line) => keywordRegex.test(line));
  if (idx === -1) return [];
  const bucket = [];
  for (let i = idx + 1; i < Math.min(lines.length, idx + 16); i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (/^day\s*\d+/i.test(line)) break;
    if (/^(faq|highlight|overview|itinerary|price|cost)\b/i.test(line)) break;
    if (line.length < 3) continue;
    bucket.push(line.replace(/^[-*•]\s*/, ""));
  }
  return uniqueList(bucket).slice(0, 12);
}

function extractGalleryImages($) {
  const images = [];
  $("img").each((_, el) => {
    const src = cleanText($(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src"));
    if (!src) return;
    const url = normalizeUrl(src);
    if (!url) return;
    if (!isProbableImageUrl(url)) return;
    if (/logo|icon|favicon/i.test(url)) return;
    images.push(url);
  });
  return uniqueList(images).slice(0, 10);
}

function extractPackageData(url, html) {
  const $ = cheerio.load(html);

  $("script,style,noscript,svg,form,iframe,header,nav,footer,.menu,.navbar,.top-bar,.breadcrumb").remove();

  const title = normalizeTitle(
    cleanText($("meta[property='og:title']").attr("content")) ||
      cleanText($("h1").first().text()) ||
      cleanText($("title").first().text()),
  );

  const metaDescription = stripPromoText(
    cleanText($("meta[name='description']").attr("content")) ||
      cleanText($("meta[property='og:description']").attr("content")),
  );

  const ogImage =
    cleanText($("meta[property='og:image']").attr("content")) ||
    cleanText($("meta[name='twitter:image']").attr("content"));

  const canonical = cleanText($("link[rel='canonical']").attr("href")) || url;

  const lines = [];
  let noiseScore = 0;
  $("h1,h2,h3,h4,p,li,td,th").each((_, el) => {
    const text = cleanText($(el).text());
    if (!text || text.length < 10) return;
    if (isNoiseLine(text)) {
      noiseScore += 1;
      return;
    }
    lines.push(text);
  });
  const cleanLines = uniqueList(lines);
  const sourceText = cleanLines.slice(0, 220).join("\n");
  const fullText = `${title}\n${metaDescription}\n${sourceText}`;

  const pricePerPerson = parsePrice(fullText);
  const duration = parseDuration(fullText);
  const totalDays = parseTotalDays(duration);

  return {
    url,
    canonical: normalizeUrl(canonical) || url,
    title: title || "Untitled Tour Package",
    place: inferPlace(title || ""),
    metaDescription,
    sourceText,
    lines: cleanLines,
    noiseScore,
    pricePerPerson,
    duration,
    totalDays,
    inclusions: extractNearbyListByKeyword(cleanLines, /\binclusions?\b/i),
    exclusions: extractNearbyListByKeyword(cleanLines, /\bexclusions?\b/i),
    itinerary: extractItinerary(cleanLines),
    galleryImages: uniqueList([normalizeUrl(ogImage), ...extractGalleryImages($)]).filter(Boolean),
    ogImage: normalizeUrl(ogImage),
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
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) return null;
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

async function groqJSON(prompt, env, retries = 3) {
  const keyA = env.GROQ_API_KEY;
  const keyB = env.GROQ_API_KEY2;
  const keys = keyB ? [keyA, keyB] : [keyA];
  if (!keyA) return null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const key = keys[attempt % keys.length];
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a senior travel content editor for structured travel CMS output. Respond only valid JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 2600,
        },
        {
          timeout: 60000,
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
        },
      );
      const text = response.data?.choices?.[0]?.message?.content || "";
      const parsed = safeJsonParse(text);
      if (parsed) return parsed;
    } catch (error) {
      const status = error?.response?.status;
      if (attempt === retries) return null;
      if (status === 429) {
        await sleep(5000 * (attempt + 1));
      } else {
        await sleep(1800);
      }
    }
  }
  return null;
}

async function unsplashPhoto(query, env) {
  const key = env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    const image = FALLBACK_IMAGES[fallbackImageIndex % FALLBACK_IMAGES.length];
    fallbackImageIndex += 1;
    return image;
  }

  const wait = 450 - (Date.now() - unsplashTick);
  if (wait > 0) await sleep(wait);
  unsplashTick = Date.now();

  try {
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      timeout: 40000,
      params: {
        query,
        per_page: 6,
        orientation: "landscape",
      },
      headers: {
        Authorization: `Client-ID ${key}`,
      },
    });
    const results = response.data?.results || [];
    if (results.length > 0) {
      return cleanText(results[0]?.urls?.regular || results[0]?.urls?.full || "");
    }
  } catch {}

  const image = FALLBACK_IMAGES[fallbackImageIndex % FALLBACK_IMAGES.length];
  fallbackImageIndex += 1;
  return image;
}

function makeFallbackEnrichment(scraped) {
  const title = scraped.title;
  const place = scraped.place || "India";
  const short = scraped.metaDescription || `${title} is a curated travel package by NatureWings.`;
  return {
    tour: {
      place,
      brief: short.slice(0, 320),
      description:
        `${short} This itinerary is designed for smooth transfers, key sightseeing points, and balanced daily pacing.`.slice(
          0,
          1400,
        ),
      highlights: scraped.lines.slice(0, 4).map((line, idx) => ({
        title: `Experience ${idx + 1}`,
        brief: line.slice(0, 420),
      })),
      itinerary: scraped.itinerary,
      faqs: [
        {
          question: "What is included in this package?",
          answer: "Hotel stay, local transfers, and sightseeing as mentioned in the itinerary are usually included.",
        },
        {
          question: "Is this package suitable for families?",
          answer: "Yes, this itinerary is generally suitable for families and couples, subject to fitness and weather.",
        },
      ],
      seoMetaTitle: `${title} | Galaxy Travellers`,
      seoMetaDescription: short.slice(0, 155),
      seoKeywords: [place, "tour package", "nature travel"],
      destinationTitle: place.split(",")[0].trim() || place,
      destinationDescription: `${place} offers a blend of scenic landscapes, local culture, and memorable travel routes.`,
      destinationTagline: `Explore ${place} with confidence`,
      destinationHighlightTitle: `Why visit ${place}?`,
      destinationHighlightBrief: short.slice(0, 260),
      blogTitle: `${title} - Complete Travel Guide`,
      blogDescription: short.slice(0, 220),
      blogBody: `${short}\n\nTop highlights:\n${scraped.lines.slice(0, 8).join("\n")}`.slice(0, 7000),
      blogBodyAlt: short.slice(0, 200),
      blogReadTime: "6 min read",
      categoryTags: ["tour-guide", "nature-travel"],
    },
  };
}

function shouldUseGroq(scraped) {
  if (!scraped) return false;
  if (!scraped.metaDescription) return true;
  if (scraped.itinerary.length < 2) return true;
  if (scraped.inclusions.length < 2) return true;
  if (scraped.lines.length < 35) return true;
  if (scraped.noiseScore > 8) return true;
  return false;
}

function normalizeArrayItems(items, max = 8) {
  return uniqueList(items).slice(0, max);
}

async function enrichWithGroq(scraped, env) {
  const prompt = `
Create JSON for a travel CMS from this raw scraped package content.
Return ONLY JSON in this exact structure:
{
  "tour": {
    "place": "string",
    "brief": "string 30-320 chars",
    "description": "string 120-1400 chars",
    "highlights": [{"title":"string","brief":"string"}],
    "itinerary": [{"day":"1","title":"string","activity":"string","notes":"string"}],
    "faqs": [{"question":"string","answer":"string"}],
    "seoMetaTitle": "string",
    "seoMetaDescription": "string <= 160 chars",
    "seoKeywords": ["string"],
    "destinationTitle": "string",
    "destinationDescription": "string 20-100 chars",
    "destinationTagline": "string",
    "destinationHighlightTitle": "string",
    "destinationHighlightBrief": "string",
    "blogTitle": "string",
    "blogDescription": "string",
    "blogBody": "string markdown",
    "blogBodyAlt": "string",
    "blogReadTime": "string",
    "categoryTags": ["string"]
  }
}

Package URL: ${scraped.url}
Package Title: ${scraped.title}
Meta Description: ${scraped.metaDescription}
Extracted Place Guess: ${scraped.place}
Duration Guess: ${scraped.duration}
Price Guess: ${scraped.pricePerPerson || ""}
Inclusions: ${JSON.stringify(scraped.inclusions)}
Exclusions: ${JSON.stringify(scraped.exclusions)}
Raw content blocks:
${scraped.sourceText.slice(0, 7000)}
`.trim();

  const generated = await groqJSON(prompt, env);
  if (!generated || !generated.tour) return makeFallbackEnrichment(scraped);
  return generated;
}

function pickTourSlug(url, title) {
  const fromUrl = normalizeUrl(url).split("/").pop() || "";
  const slug = slugifyText(fromUrl || title);
  return slug || `tour-${Date.now()}`;
}

function ensureItinerary(itinerary, totalDays) {
  if (Array.isArray(itinerary) && itinerary.length > 0) {
    return itinerary
      .filter((row) => row && row.day && row.title && row.activity)
      .slice(0, 18)
      .map((row) => ({
        day: String(row.day),
        title: cleanText(row.title).slice(0, 120),
        activity: cleanText(row.activity).slice(0, 2000),
        notes: cleanText(row.notes || "").slice(0, 400),
      }));
  }
  const days = totalDays > 0 ? totalDays : 5;
  const rows = [];
  for (let i = 1; i <= days; i += 1) {
    rows.push({
      day: String(i),
      title: `Day ${i} Sightseeing`,
      activity: "Detailed day plan to be finalized based on operational schedule.",
      notes: "",
    });
  }
  return rows;
}

function safeKeywords(list, place) {
  const merged = uniqueList([...(Array.isArray(list) ? list : []), place, "tour package", "travel"]);
  return merged.filter((word) => word.length >= 3).slice(0, 12);
}

function chooseDestinationTitle(generated, scraped) {
  const fromGroq = cleanText(generated?.tour?.destinationTitle || "");
  if (fromGroq) return fromGroq;
  const fromPlace = cleanText(scraped.place || "");
  if (fromPlace) {
    return fromPlace.split(/[,&|/-]/)[0].trim();
  }
  return cleanText(scraped.title.replace(/tour|package/gi, "")) || "Destination";
}

async function buildTourRecord(scraped, generated, env) {
  const tour = generated?.tour || {};
  const slug = pickTourSlug(scraped.url, scraped.title);
  const place = stripPromoText(tour.place || scraped.place || "India");
  const title = normalizeTitle(scraped.title || "").slice(0, 180) || `${place} Tour Package`;
  const primaryScrapedImage = scraped.galleryImages.find((img) => isProbableImageUrl(img));
  const heroImg =
    primaryScrapedImage ||
    (await unsplashPhoto(`${place} travel landscape`, env));
  const galleryImgs = normalizeArrayItems([
    ...scraped.galleryImages.filter((img) => isProbableImageUrl(img)).slice(0, 6),
    heroImg,
  ], 8);

  const duration =
    cleanText(scraped.duration || "") ||
    `${Math.max(scraped.totalDays || 5, 5)}D/${Math.max((scraped.totalDays || 5) - 1, 4)}N`;
  const totalDays = scraped.totalDays || parseTotalDays(duration) || 5;

  const included = normalizeArrayItems(
    scraped.inclusions.length > 0 ? scraped.inclusions : ["Accommodation", "Sightseeing", "Transfers", "Support"],
    14,
  );
  const excluded = normalizeArrayItems(
    scraped.exclusions.length > 0 ? scraped.exclusions : ["Flights/Trains", "Personal expenses", "Any item not listed in inclusions"],
    12,
  );

  const highlights = (Array.isArray(tour.highlights) ? tour.highlights : [])
    .filter((h) => h && h.title && h.brief)
    .slice(0, 8)
    .map((h) => ({
      title: cleanText(h.title).slice(0, 70),
      brief: cleanText(h.brief).slice(0, 900),
      img: heroImg,
    }));

  const normalizedHighlights =
    highlights.length > 0
      ? highlights
      : normalizeArrayItems(scraped.lines.slice(0, 4)).map((line, idx) => ({
          title: `Highlight ${idx + 1}`,
          brief: line.slice(0, 900),
          img: heroImg,
        }));

  return {
    slug,
    title,
    place,
    heroImg,
    details: {
      pricePerPerson: scraped.pricePerPerson || 24999,
      totalDays,
      duration,
      ageRestriction: "All ages welcome",
      groupSize: "2-12 Persons",
    },
    brief: stripPromoText(tour.brief || scraped.metaDescription || `${title} curated by Galaxy Travellers`).slice(0, 500),
    description: stripPromoText(tour.description || scraped.sourceText.slice(0, 1200)).slice(0, 6000),
    tourType: "fixed_date",
    galleryImgs,
    inclusions: {
      included,
      excluded,
    },
    highlights: normalizedHighlights,
    itinerary: ensureItinerary(tour.itinerary || scraped.itinerary, totalDays),
    faqs: (Array.isArray(tour.faqs) ? tour.faqs : [])
      .filter((f) => f && f.question && f.answer)
      .slice(0, 8)
      .map((f) => ({
        question: cleanText(f.question).slice(0, 220),
        answer: cleanText(f.answer).slice(0, 1200),
      })),
    seo: {
      metaTitle: cleanText(tour.seoMetaTitle || `${title} | Galaxy Travellers`).slice(0, 180),
      metaDescription: cleanText(tour.seoMetaDescription || scraped.metaDescription || "").slice(0, 160),
      keywords: safeKeywords(tour.seoKeywords, place),
      metaImage: heroImg,
    },
    relationHint: {
      sourceUrl: scraped.url,
      destinationTitle: chooseDestinationTitle(generated, scraped),
      categoryTags: normalizeArrayItems(tour.categoryTags || [], 6),
    },
  };
}

function buildDestinationRecord(tour, generated) {
  const destinationTitle =
    normalizeTitle(tour.relationHint?.destinationTitle || "") ||
    normalizeTitle(tour.place.split(",")[0] || "") ||
    "Destination";
  const slug = slugifyText(destinationTitle);
  const destinationDescription = stripPromoText(generated?.tour?.destinationDescription || `${destinationTitle} destination package options.`);
  return {
    slug,
    title: destinationTitle,
    description: destinationDescription.slice(0, 100),
    descriptionLong: stripPromoText(generated?.tour?.description || tour.description).slice(0, 5000),
    displayImg: tour.heroImg,
    heroImg: tour.heroImg,
    startingPrice: tour.details.pricePerPerson,
    highlight: {
      title: normalizeTitle(generated?.tour?.destinationHighlightTitle || `Why ${destinationTitle}?`).slice(0, 80),
      brief: stripPromoText(generated?.tour?.destinationHighlightBrief || destinationDescription).slice(0, 800),
      img: tour.heroImg,
    },
    seo: {
      metaTitle: cleanText(`${destinationTitle} Tour Packages | Galaxy Travellers`).slice(0, 180),
      metaDescription: destinationDescription.slice(0, 160),
      shareImage: tour.heroImg,
    },
    tagline: stripPromoText(generated?.tour?.destinationTagline || `Discover ${destinationTitle}`),
    rating: 4.7,
    tours: [tour.slug],
  };
}

function buildBlogRecord(tour, generated) {
  const blogTitle = normalizeTitle(generated?.tour?.blogTitle || `${tour.title} - Travel Guide`);
  const blogSlug = slugifyText(blogTitle) || `${tour.slug}-guide`;
  const blogBody =
    cleanText(generated?.tour?.blogBody || "") ||
    `${tour.brief}\n\n## Highlights\n${tour.highlights.map((h) => `- ${h.brief}`).join("\n")}`;
  return {
    slug: blogSlug,
    title: blogTitle.slice(0, 180),
    description: stripPromoText(generated?.tour?.blogDescription || tour.brief).slice(0, 260),
    displayImg: tour.heroImg,
    body: blogBody.slice(0, 14000),
    author: "Galaxy Travellers Editorial Team",
    bodyAlt: stripPromoText(generated?.tour?.blogBodyAlt || tour.brief).slice(0, 240),
    readTime: cleanText(generated?.tour?.blogReadTime || "6 min read"),
    categories: normalizeArrayItems([...(tour.relationHint?.categoryTags || []), "travel-guide", "tour-package"], 8),
    seo: {
      metaTitle: cleanText(`${blogTitle} | Galaxy Travellers`).slice(0, 180),
      metaDescription: cleanText(generated?.tour?.seoMetaDescription || tour.brief).slice(0, 160),
      shareImage: tour.heroImg,
    },
    relations: {
      tours: [tour.slug],
      destinations: [slugifyText(tour.relationHint?.destinationTitle || tour.place)],
    },
  };
}

function mergeDestinations(destinations) {
  const map = new Map();
  for (const item of destinations) {
    if (!item.slug) continue;
    if (!map.has(item.slug)) {
      map.set(item.slug, item);
      continue;
    }
    const existing = map.get(item.slug);
    existing.startingPrice = Math.min(existing.startingPrice, item.startingPrice);
    existing.tours = uniqueList([...(existing.tours || []), ...(item.tours || [])]);
    if (!existing.descriptionLong || existing.descriptionLong.length < item.descriptionLong.length) {
      existing.descriptionLong = item.descriptionLong;
    }
    map.set(item.slug, existing);
  }
  return [...map.values()];
}

async function writeJson(fileName, data) {
  const target = path.join(OUTPUT_DIR, fileName);
  await fs.writeFile(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readCheckpoint() {
  try {
    const raw = await fs.readFile(CHECKPOINT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      tours: Array.isArray(parsed?.tours) ? parsed.tours : [],
      destinations: Array.isArray(parsed?.destinations) ? parsed.destinations : [],
      blogs: Array.isArray(parsed?.blogs) ? parsed.blogs : [],
      failures: Array.isArray(parsed?.failures) ? parsed.failures : [],
      processedUrls: Array.isArray(parsed?.processedUrls) ? parsed.processedUrls : [],
      groqCallsUsed: Number(parsed?.groqCallsUsed || 0),
    };
  } catch {
    return {
      tours: [],
      destinations: [],
      blogs: [],
      failures: [],
      processedUrls: [],
      groqCallsUsed: 0,
    };
  }
}

async function writeCheckpoint(data) {
  const tempFile = `${CHECKPOINT_FILE}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.rename(tempFile, CHECKPOINT_FILE).catch(async () => {
    await fs.copyFile(tempFile, CHECKPOINT_FILE);
    await fs.rm(tempFile, { force: true });
  });
}

async function main() {
  const env = await loadEnv();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const packageUrls = await discoverPackageUrls();
  const selectedUrls =
    MAX_PACKAGES > 0 ? packageUrls.slice(0, MAX_PACKAGES) : packageUrls;

  if (selectedUrls.length === 0) {
    throw new Error("No package URLs discovered from naturewings.com");
  }

  console.log(`[scrape] package URLs discovered: ${packageUrls.length}`);
  console.log(`[scrape] package URLs selected : ${selectedUrls.length}`);

  const checkpoint = await readCheckpoint();
  const processedSet = new Set(checkpoint.processedUrls);
  const tours = checkpoint.tours;
  const destinations = checkpoint.destinations;
  const blogs = checkpoint.blogs;
  const failures = checkpoint.failures;
  let groqCallsUsed = checkpoint.groqCallsUsed;

  for (let i = 0; i < selectedUrls.length; i += 1) {
    const url = selectedUrls[i];
    if (processedSet.has(url)) {
      console.log(`[scrape] (${i + 1}/${selectedUrls.length}) skip ${url}`);
      continue;
    }
    console.log(`[scrape] (${i + 1}/${selectedUrls.length}) ${url}`);
    try {
      const html = await fetchHtml(url);
      const scraped = extractPackageData(url, html);
      let generated;
      if (shouldUseGroq(scraped) && groqCallsUsed < MAX_GROQ_CALLS) {
        generated = await enrichWithGroq(scraped, env);
        groqCallsUsed += 1;
      } else {
        generated = makeFallbackEnrichment(scraped);
      }
      const tour = await buildTourRecord(scraped, generated, env);
      const destination = buildDestinationRecord(tour, generated);
      const blog = buildBlogRecord(tour, generated);

      tours.push(tour);
      destinations.push(destination);
      blogs.push(blog);
    } catch (error) {
      failures.push({
        url,
        error: error?.message || String(error),
      });
      console.warn(`[warn] failed ${url}: ${error?.message || error}`);
    }
    processedSet.add(url);
    await writeCheckpoint({
      tours,
      destinations,
      blogs,
      failures,
      processedUrls: [...processedSet],
      groqCallsUsed,
      checkpointAt: new Date().toISOString(),
    });
  }

  const mergedDestinations = mergeDestinations(destinations);

  const report = {
    source: SOURCE_HOST,
    generatedAt: new Date().toISOString(),
    totals: {
      packageUrlsDiscovered: packageUrls.length,
      packageUrlsProcessed: selectedUrls.length,
      tours: tours.length,
      destinations: mergedDestinations.length,
      blogs: blogs.length,
      failures: failures.length,
    },
    envChecks: {
      groq: Boolean(env.GROQ_API_KEY),
      unsplash: Boolean(env.UNSPLASH_ACCESS_KEY),
    },
    enrichment: {
      maxGroqCalls: MAX_GROQ_CALLS,
      groqCallsUsed,
    },
    failures,
  };

  await writeJson("tours.json", tours);
  await writeJson("destinations.json", mergedDestinations);
  await writeJson("blogs.json", blogs);
  await writeJson("scrape-report.json", report);
  await fs.rm(CHECKPOINT_FILE, { force: true });

  if (browser) {
    await browser.close();
    browser = null;
  }

  console.log("[done] JSON exported in front/scrap/output");
}

main().catch(async (error) => {
  console.error("[fatal]", error?.message || error);
  if (browser) {
    await browser.close().catch(() => null);
  }
  process.exit(1);
});
