"use strict";

/**
 * Smart query builder for tour image searches.
 *
 * Generates multiple targeted search queries per tour so we can:
 *   - Get the best heroImg (scenic, high-quality)
 *   - Get diverse gallery images
 *   - Get highlight-specific images
 *
 * Each query is mapped from the tour's place / title / highlights.
 */

// ─── Destination → curated query sets ─────────────────────────────────────────
const DESTINATION_QUERIES = {
  bhutan: [
    "Bhutan Himalaya monastery valley landscape",
    "Bhutan Paro Punakha mountains mist scenic",
    "Tiger Nest Paro Taktsang monastery Bhutan cliff",
    "Punakha Dzong Bhutan fortress Mo Chhu river",
    "Thimphu Bhutan Buddha Dordenma hill",
    "Bhutan rice terraces mountains clouds aerial",
    "Bumthang valley Bhutan autumn forest",
    "Bhutan ancient dzong fortress architecture",
  ],
  kashmir: [
    "Kashmir valley Himalaya Dal Lake scenic",
    "Gulmarg Kashmir snow mountains meadow",
    "Pahalgam Kashmir Lidder river meadow",
    "Srinagar Dal Lake shikara lotus reflections",
    "Sonmarg Kashmir glacier alpine landscape",
    "Gurez Bangus valley Kashmir hidden mountains",
    "Kashmir autumn chinar trees Himalaya",
    "Doodhpathri Kashmir green meadow mountains",
  ],
  ladakh: [
    "Ladakh Pangong Tso lake blue mountains",
    "Leh palace Ladakh Himalaya landscape",
    "Nubra valley Ladakh sand dunes Bactrian camels",
    "Tso Moriri lake Ladakh reflection sacred",
    "Ladakh Khardungla pass mountains road",
    "Ladakh monastery cliff sparse landscape",
    "Hanle Ladakh dark sky observatory",
    "Zanskar river valley Ladakh gorge",
  ],
  sikkim: [
    "Sikkim Kanchenjunga snow peak sunrise",
    "Gangtok Sikkim Himalaya valley panorama",
    "Pelling Sikkim Kanchenjunga monastery",
    "North Sikkim Yumthang valley flowers alpine",
    "Gurudongmar lake Sikkim sacred mountains",
    "Lachung Lachen Sikkim alpine landscape",
    "Ravangla Buddha park Sikkim mountains",
    "Silk route Sikkim valley lakes mountains",
  ],
  darjeeling: [
    "Darjeeling tea garden Himalaya mountains",
    "Darjeeling toy train Himalayan landscape",
    "Tiger Hill Darjeeling sunrise Kanchenjunga",
    "Sandakphu trek Himalaya panorama",
    "Kalimpong Himalaya valley Buddhist monastery",
    "Mirik lake Darjeeling tea garden",
  ],
  assam: [
    "Kaziranga national park rhino grassland Assam",
    "Assam Brahmaputra river landscape",
    "Majuli island Assam river monastery",
    "Assam tea garden sunrise misty hills",
    "Manas national park Assam wildlife forest",
  ],
  meghalaya: [
    "Meghalaya Cherrapunji waterfall mist living root bridge",
    "Shillong Meghalaya lakes hills Scotland East",
    "Dawki river crystal clear Meghalaya",
    "Mawlynnong cleanest village Meghalaya",
    "Nohkalikai falls Meghalaya tallest waterfall",
    "Mawsmai cave Cherrapunji Meghalaya",
  ],
  arunachal: [
    "Tawang monastery Arunachal Pradesh mountains",
    "Tawang valley snow mountains landscape",
    "Ziro valley Arunachal Pradesh paddy fields",
    "Bumla pass border Arunachal mountains snow",
    "Dirang valley Arunachal Pradesh landscape",
    "Namdapha national park Arunachal forest",
  ],
  nagaland: [
    "Nagaland Kohima Dzukou valley hills green",
    "Hornbill festival Nagaland tribe culture",
    "Dzukou valley wildflowers Nagaland Manipur",
    "Nagaland Northeast India hill terrace",
  ],
  manipur: [
    "Loktak lake Manipur floating islands sunrise",
    "Keibul Lamjao national park Manipur",
    "Manipur Shirui Kashong Ukhrul landscape",
  ],
  northeast: [
    "Northeast India misty mountains green hills",
    "Seven sisters India valley landscape",
    "Northeast India tribal village hills mist",
  ],
  nepal: [
    "Nepal Himalaya Annapurna Everest base camp",
    "Pokhara Nepal Phewa Lake Machhapuchhre mountain",
    "Kathmandu valley Nepal temples heritage",
    "Muktinath temple Nepal Himalaya sacred",
    "Chitwan national park Nepal elephant safari",
    "Lumbini birthplace Buddha Nepal garden",
    "Nagarkot Nepal Himalaya sunrise panorama",
  ],
  andaman: [
    "Andaman islands Havelock Radhanagar beach",
    "Andaman sea tropical coral reef underwater",
    "Neil Island Andaman turquoise lagoon beach",
    "Baratang island Andaman mangrove creek",
    "Ross Island Andaman heritage ruins sunset",
  ],
  maldives: [
    "Maldives overwater bungalow turquoise lagoon",
    "Maldives coral reef tropical beach sunrise",
    "Maldives bioluminescent beach night stars",
    "Maldives atoll aerial blue water",
  ],
  bali: [
    "Bali Tanah Lot temple sunset ocean",
    "Bali Tegalalang rice terraces green",
    "Bali Mount Batur volcano sunrise",
    "Bali Ubud jungle monkey forest",
    "Bali beach Seminyak Kuta sunset surfing",
  ],
  thailand: [
    "Thailand Phi Phi island tropical beach",
    "Bangkok Thailand Wat Arun temple river",
    "Chiang Mai Thailand temple mountain",
    "Phuket Thailand tropical beach sunset",
    "Krabi limestone karst sea kayak Thailand",
  ],
  vietnam: [
    "Vietnam Ha Long Bay limestone karst sea mist",
    "Sapa Vietnam rice terrace mountain mist",
    "Hoi An Vietnam lanterns river night",
    "Phong Nha cave Vietnam river",
    "Mekong delta Vietnam boats",
  ],
  srilanka: [
    "Sri Lanka Sigiriya rock fortress aerial",
    "Sri Lanka Ella nine arch bridge train",
    "Sri Lanka Nuwara Eliya tea estate hill",
    "Kandy Sri Lanka temple lake",
    "Sri Lanka Mirissa Unawatuna beach whale watching",
  ],
  kailash: [
    "Mount Kailash Tibet sacred mountain lake",
    "Mansarovar lake Kailash Tibet sacred",
    "Kailash Manasarovar pilgrimage landscape",
  ],
  uttarakhand: [
    "Uttarakhand Kedarnath temple snow Himalaya",
    "Valley of Flowers Uttarakhand alpine meadow",
    "Rishikesh Uttarakhand Ganges river yoga",
    "Haridwar Ganga aarti sunset India",
    "Badrinath temple Uttarakhand Himalaya",
    "Auli Uttarakhand ski resort snow mountains",
  ],
  himachal: [
    "Himachal Pradesh Spiti valley desert mountain",
    "Manali Himachal snow mountains Rohtang",
    "Kullu Manali river valley Himalaya",
    "Shimla Himachal Pradesh colonial hill station",
    "Dharamshala McLeod Ganj mountains monasteries",
    "Kasol Parvati valley Himachal river",
  ],
  rajasthan: [
    "Rajasthan desert sand dunes camel sunset",
    "Jodhpur blue city Mehrangarh fort",
    "Jaipur Amber fort palace Rajasthan",
    "Jaisalmer golden fort Rajasthan desert",
    "Udaipur lake palace Rajasthan",
    "Pushkar camel fair Rajasthan",
  ],
  goa: [
    "Goa beach sunset palm trees tropical",
    "Goa Colva Palolem beach sea sand",
    "Old Goa Portuguese church heritage",
    "Goa Dudhsagar waterfall forest train",
  ],
  kerala: [
    "Kerala backwaters houseboat Alleppey",
    "Kerala Munnar tea estate mountains mist",
    "Kerala Wayanad forest waterfall green",
    "Kerala Varkala cliff beach sunset",
    "Kerala Periyar elephant national park",
  ],
  generic: [
    "India Himalaya mountain valley landscape",
    "India scenic travel destination nature",
    "South Asia mountain landscape travel",
  ],
};

// ─── Highlight keyword → specific query ────────────────────────────────────────
const HIGHLIGHT_KEYWORD_MAP = {
  "tiger's nest": "Paro Taktsang Tiger Nest monastery Bhutan cliff",
  "paro taktsang": "Paro Taktsang monastery Bhutan cliff ancient",
  "punakha dzong": "Punakha Dzong Bhutan fortress river Mo Chhu",
  "thimphu city": "Thimphu city Bhutan Buddha hill monastery market",
  "buddha point": "Buddha Dordenma statue Thimphu Bhutan hill",
  "dochula pass": "Dochula pass 108 chortens Bhutan mountains clouds",
  "dal lake": "Dal Lake Srinagar Kashmir shikara lotus boat",
  "gulmarg": "Gulmarg Kashmir snow mountains meadow gondola",
  "pahalgam": "Pahalgam Kashmir Lidder river alpine meadow",
  "sonmarg": "Sonmarg Kashmir glacier alpine scenic",
  "pangong": "Pangong Tso lake Ladakh blue water mountains",
  "nubra valley": "Nubra valley Ladakh sand dunes camels monastery",
  "leh palace": "Leh palace Ladakh Himalaya monastery mountain",
  "kanchenjunga": "Kanchenjunga mountain Sikkim snow peak sunrise",
  "pelling": "Pelling Sikkim monastery Kanchenjunga landscape",
  "yumthang": "Yumthang valley Sikkim alpine meadow flowers",
  "gurudongmar": "Gurudongmar sacred lake North Sikkim mountains",
  "tiger hill": "Tiger Hill Darjeeling sunrise Kanchenjunga panorama",
  "toy train": "Darjeeling Himalayan Railway toy train mountain",
  "kaziranga": "Kaziranga rhino grassland safari Assam national park",
  "cherrapunji": "Cherrapunji Sohra waterfall Meghalaya mist",
  "root bridge": "Meghalaya living root bridge natural bridge",
  "dawki": "Dawki river crystal clear boats Meghalaya",
  "tawang monastery": "Tawang monastery Arunachal Pradesh mountains",
  "dzukou valley": "Dzukou valley wildflowers hills Nagaland Manipur",
  "loktak lake": "Loktak lake Manipur floating island sunrise",
  "annapurna": "Annapurna base camp Nepal Himalaya trekking",
  "everest": "Everest base camp Nepal Himalaya khumbu glacier",
  "pokhara": "Pokhara Nepal Phewa Lake reflection Machhapuchhre",
  "havelock": "Havelock Island Radhanagar beach Andaman tropical",
  "radhanagar": "Radhanagar beach Havelock island Andaman turquoise",
  "ross island": "Ross island Andaman heritage ruins colonial sunset",
  "sigiriya": "Sigiriya rock fortress aerial Sri Lanka",
  "ella": "Ella nine arch bridge Sri Lanka train",
  "ha long": "Ha Long Bay Vietnam limestone karst sea mist",
  "phi phi": "Phi Phi island Thailand tropical beach turquoise",
  "tanah lot": "Tanah Lot Bali temple sunset ocean",
  "rice terrace": "Bali Tegalalang rice terrace green drone aerial",
  "kedarnath": "Kedarnath temple Uttarakhand Himalaya snow",
  "valley of flowers": "Valley of Flowers Uttarakhand alpine meadow",
  "spiti valley": "Spiti valley Himachal Pradesh mountain monastery",
  "amber fort": "Amber fort Jaipur Rajasthan palace mountain",
  "mehrangarh": "Mehrangarh fort Jodhpur Rajasthan blue city",
  "jaisalmer fort": "Jaisalmer golden fort Rajasthan desert sunset",
  "backwaters": "Kerala backwaters houseboat Alleppey coconut",
  "munnar": "Munnar tea estate Kerala mountains mist sunrise",
  "dudhsagar": "Dudhsagar waterfall Goa forest train",
  "kailash": "Mount Kailash Tibet snow peak sacred pilgrimage",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function clean(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detect the primary destination key from place/title/slug.
 * @param {string} place
 * @param {string} title
 * @param {string} slug
 * @returns {string} key into DESTINATION_QUERIES
 */
function detectDestination(place = "", title = "", slug = "") {
  const t = clean(`${place} ${title} ${slug}`);

  if (/bhutan|paro|punakha|thimphu|bumthang|wangdue|trongsa|phuentsholing|haa|taktshang/.test(t)) return "bhutan";
  if (/kashmir|gulmarg|sonmarg|srinagar|pahalgam|gurez|bangus|doodhpathri/.test(t)) return "kashmir";
  if (/ladakh|leh|pangong|nubra|siachen|khardung|hanle|tso moriri|zanskar/.test(t)) return "ladakh";
  if (/kailash|mansarovar/.test(t)) return "kailash";
  if (/tawang|dirang|bomdila|zemithang|bumla|arunachal/.test(t)) return "arunachal";
  if (/kaziranga|manas|majuli|pobitora/.test(t)) return "assam";
  if (/assam|guwahati|tezpur|jorhat/.test(t)) return "assam";
  if (/meghalaya|shillong|cherrapunji|sohra|dawki|wari chora|mawlynnong/.test(t)) return "meghalaya";
  if (/nagaland|kohima|dzukou|mokokchung|hornbill/.test(t)) return "nagaland";
  if (/manipur|imphal|loktak/.test(t)) return "manipur";
  if (/north east|northeast|seven sisters|mizoram/.test(t)) return "northeast";
  if (/sikkim|gangtok|pelling|ravangla|lachung|lachen|yumthang|gurudongmar|silk route/.test(t)) return "sikkim";
  if (/darjeeling|kalimpong|tinchuley|sandakphu|tiger hill|mirik/.test(t)) return "darjeeling";
  if (/sundarban/.test(t)) return "generic";
  if (/nepal|kathmandu|pokhara|muktinath|lumbini|nagarkot|chitwan|annapurna|everest/.test(t)) return "nepal";
  if (/andaman|havelock|neil island|baratang|ross island|radhanagar/.test(t)) return "andaman";
  if (/maldives/.test(t)) return "maldives";
  if (/bali|ubud|seminyak|kuta|tanah lot/.test(t)) return "bali";
  if (/thailand|bangkok|pattaya|phuket|chiang mai|krabi|phi phi/.test(t)) return "thailand";
  if (/vietnam|hanoi|ho chi minh|saigon|ha long|hoi an|sapa/.test(t)) return "vietnam";
  if (/sri lanka|sigiriya|kandy|colombo|ella|nuwara/.test(t)) return "srilanka";
  if (/uttarakhand|kedarnath|badrinath|rishikesh|haridwar|auli|mussoorie/.test(t)) return "uttarakhand";
  if (/himachal|manali|shimla|spiti|dharamshala|kasol|kullu/.test(t)) return "himachal";
  if (/rajasthan|jaipur|jodhpur|jaisalmer|udaipur|pushkar/.test(t)) return "rajasthan";
  if (/goa|colva|palolem|varca|calangute/.test(t)) return "goa";
  if (/kerala|alleppey|munnar|wayanad|varkala|kovalam|periyar/.test(t)) return "kerala";

  // last resort: use place name directly
  return "generic";
}

/**
 * Build the hero image query — the most scenic, highest quality.
 * @param {string} place
 * @param {string} destination  – detected destination key
 * @returns {string}
 */
function buildHeroQuery(place, destination) {
  const destQueries = DESTINATION_QUERIES[destination] || DESTINATION_QUERIES.generic;
  // Return the most scenic query for this destination
  return destQueries[0];
}

/**
 * Build gallery queries — diverse pool of 5–6 queries.
 * @param {string} place
 * @param {string} destination
 * @param {string} title
 * @returns {string[]}
 */
function buildGalleryQueries(place, destination, title) {
  const destQueries = DESTINATION_QUERIES[destination] || DESTINATION_QUERIES.generic;

  // Take the first 6 curated queries, add a title-based one if different
  const base = destQueries.slice(0, 6);
  const cleanPlace = (place || "").trim();

  // Add a title-derived query for unique images
  if (cleanPlace) {
    base.push(`${cleanPlace} scenic travel landscape beautiful`);
  }
  return [...new Set(base)];
}

// Words that add noise to Unsplash searches when they appear in highlight titles
const STRIP_TITLE_WORDS = /\b(visit|tour|hike|trek|trip|exploration|drive|ride|experience|walk|day|half|full|overnight|journey|excursion|stopover|transfer|check[- ]in|check[- ]out|arrival|departure|return)\b/gi;

/**
 * Clean a highlight title into a tight Unsplash-friendly search phrase.
 * e.g. "Magnetic Hill Visit" → "Magnetic Hill Ladakh"
 */
function cleanHighlightTitle(title, place) {
  const stripped = title
    .replace(STRIP_TITLE_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim();
  // If stripping left nothing meaningful, use original
  const base = stripped.length >= 4 ? stripped : title;
  return `${base} ${place}`.trim();
}

/**
 * Build a targeted query for a specific highlight.
 * @param {string} highlightTitle
 * @param {string} place
 * @param {string} destination
 * @returns {string}
 */
function buildHighlightQuery(highlightTitle, place, destination) {
  const titleLower = clean(highlightTitle);

  // Try exact keyword map first (these are known to have good Unsplash results)
  for (const [keyword, query] of Object.entries(HIGHLIGHT_KEYWORD_MAP)) {
    if (titleLower.includes(keyword)) return query;
  }

  // Build a clean, Unsplash-friendly query from the title
  return cleanHighlightTitle(highlightTitle, place);
}

/**
 * Main entry: generate all queries for a tour.
 *
 * @param {object} tour
 * @returns {{ heroQuery: string, galleryQueries: string[], highlightQueries: Map<number,string> }}
 */
function generateQueries(tour) {
  const place = (tour.place || "").trim();
  const title = (tour.title || "").trim();
  const slug = (tour.slug || "").trim();
  const highlights = Array.isArray(tour.highlights) ? tour.highlights : [];

  const destination = detectDestination(place, title, slug);
  const heroQuery = buildHeroQuery(place, destination);
  const galleryQueries = buildGalleryQueries(place, destination, title);

  // Map: highlight index → query string
  const highlightQueries = new Map();
  highlights.forEach((h, idx) => {
    highlightQueries.set(idx, buildHighlightQuery(h.title || "", place, destination));
  });

  return { heroQuery, galleryQueries, highlightQueries, destination };
}

module.exports = { generateQueries, detectDestination, DESTINATION_QUERIES };
