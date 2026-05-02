// lib/mapTourModel.js
import { formatTourPlaceShort, formatTourTitle } from "@/lib/tourText";

const FALLBACK_IMG =
  "https://images.musement.com/cover/0003/14/koh-samui-xxl-jpg_header-213595.jpeg";

export default function toTourModel(api) {
  if (!api) return null;

  // ------------------------------
  // DATE RANGE + DURATION
  // ------------------------------
  let startDate = api?.dateRange?.startDate
    ? new Date(api.dateRange.startDate)
    : null;

  let endDate = api?.dateRange?.endDate
    ? new Date(api.dateRange.endDate)
    : null;

  if (startDate && endDate && endDate < startDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  const msPerDay = 24 * 60 * 60 * 1000;

  let durationDays =
    startDate && endDate
      ? Math.max(1, Math.ceil((endDate - startDate) / msPerDay) + 1)
      : (Array.isArray(api?.days) ? api.days.length : 0) || 0;

  if (api?.details?.totalDays) {
    durationDays = Number(api.details.totalDays) || durationDays;
  }

  const durationStr = `${durationDays} day${durationDays === 1 ? "" : "s"}`;

  // ------------------------------
  // IMAGES
  // ------------------------------
  const gallery = Array.isArray(api?.galleryImgs) ? api.galleryImgs : [];
  const heroImage = api?.heroImg || gallery[0] || FALLBACK_IMG;

  // ------------------------------
  // TESTIMONIALS → RATING
  // ------------------------------
  const testimonials = Array.isArray(api?.testimonials) ? api.testimonials : [];

  const stars = testimonials.map((t) => Number(t?.stars) || 0);
  const avg = stars.length
    ? stars.reduce((a, b) => a + b, 0) / stars.length
    : 0;

  const rating = clamp(avg, 0, 5);

  // ------------------------------
  // INCLUSIONS
  // ------------------------------
  const included = Array.isArray(api?.inclusions?.included)
    ? api.inclusions.included
    : [];

  const excluded = Array.isArray(api?.inclusions?.excluded)
    ? api.inclusions.excluded
    : [];

  // ------------------------------
  // ITINERARY
  // ------------------------------
  const itinerary = mapItinerary(api?.itinerary);

  // ------------------------------
  // PRICE
  // ------------------------------
  const priceAdult =
    api?.details?.pricePerPerson ??
    api?.price?.adult ??
    api?.booking?.pricing?.adult ??
    0;

  // ------------------------------
  // BADGES
  // ------------------------------
  const badges = [];
  if (api?.tourType === "fixed_date") badges.push("Fixed Date");
  if (api?.tourType === "enquire") badges.push("Enquire Only");
  if (api?.status === "published") badges.push("Published");

  // ------------------------------
  // RELATED ITEMS (simplified models)
  // ------------------------------
  const related = {
    blogs: Array.isArray(api?.blogs) ? api.blogs.map(simplifyBlog) : [],
    destinations: Array.isArray(api?.destinations)
      ? api.destinations.map(simplifyDestination)
      : [],
    experiences: Array.isArray(api?.experiences)
      ? api.experiences.map(simplifyExperience)
      : [],
    spotlights: Array.isArray(api?.spotlights)
      ? api.spotlights.map(simplifySpotlight)
      : [],
    tours: Array.isArray(api?.tours) ? api.tours.map(simplifyTour) : [],
    tagMonths: Array.isArray(api?.tagMonths)
      ? api.tagMonths.map((m) => ({
          id: m?._id || m?.id,
          month: m?.month,
          monthTag: m?.monthTag,
          heroImg: m?.heroImg || "",
          displayImg: m?.displayImg || "",
        }))
      : [],
  };

  // ------------------------------
  // CREATOR
  // ------------------------------
  const creator = mapCreator(api?.createdBy);

  // ------------------------------
  // RETURN SAFE JSON OBJECT
  // ------------------------------
  const normalizedTitle = formatTourTitle(api?.title || "Untitled Tour");
  const normalizedLocation = formatTourPlaceShort(api?.place, normalizedTitle);

  return {
    title: normalizedTitle,
    subtitle: api?.brief || "",
    location: normalizedLocation,
    rating,
    reviewCount: testimonials.length,
    bookingCount: api?.bookingCount || 0,
    badges,
    price: api?.details?.pricePerPerson || 0,

    images: {
      hero: heroImage,
      gallery,
    },

    overview: {
      duration: durationStr,
      groupSize: api?.details?.groupSize || "—",
      ageRange: api?.details?.ageRestriction || api?.overview?.ageRange || "—",
      languages: api?.details?.languages || [],
      description: api?.description || "",
      tagMonths: Array.isArray(api?.tagMonths) ? api.tagMonths : [],
    },

    highlights: Array.isArray(api?.highlights) ? api.highlights : [],
    itinerary,
    included,
    excluded,
    stays: Array.isArray(api?.stays) ? api.stays : [],
    moments: Array.isArray(api?.moments) ? api.moments : [],
    faq: Array.isArray(api?.faqs) ? api.faqs : [],
    mapEmbed: api?.mapEmbed || api?.extras?.mapEmbed || "",
    reviews: testimonials,

    booking: {
      pricing: {
        adult: Number(priceAdult) || 0,
      },
    },
    payment: {
      full: {
        enabled: api?.paymentConfig?.full?.enabled ?? true,
      },
      partial: {
        enabled: api?.paymentConfig?.partial?.enabled ?? false,
        price: Number(api?.paymentConfig?.partial?.price) || 0,
      },
    },

    tourType: api?.tourType || "",
    dateRange: { startDate, endDate },
    slug: api?.slug,
    id: api?._id || api?.id,
    creatorId: api?.createdBy?._id || api?.createdBy?.id || api?.createdBy || null,
    status: api?.status,
    createdAt: api?.createdAt,
    updatedAt: api?.updatedAt,
    creator,
    related,
    seo: api?.seo || {},
    extras: api?.extras || {},
    video: Array.isArray(api?.video) ? api.video : [],
  };
}

/* ----------------------------------------------------
   HELPERS
---------------------------------------------------- */

function clamp(n, min, max) {
  n = Number(n);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function normalizeTime12(s = "") {
  const t = String(s).trim().replace(/\s+/g, "");
  const m = t.match(/^(\d{1,2}):?(\d{2})?([AaPp][Mm])$/);
  if (!m) return s;
  const h = Number(m[1]);
  if (h < 1 || h > 12) return s;
  const min = (m[2] || "00").padStart(2, "0");
  return `${h}:${min} ${m[3].toUpperCase()}`;
}

function mapBlocks(blocks) {
  if (Array.isArray(blocks)) {
    return blocks.map((b) => ({
      time: b?.time ? normalizeTime12(b.time) : "",
      title: b?.title || "",
      activity: b?.activity || "",
      notes: b?.notes || "",
      image: b?.image || "",
    }));
  }
  if (blocks && typeof blocks === "object") {
    return [
      {
        time: blocks?.time ? normalizeTime12(blocks.time) : "",
        title: blocks?.title || "",
        activity: blocks?.activity || "",
        notes: blocks?.notes || "",
        image: blocks?.image || "",
      },
    ];
  }
  return [];
}

function mapItinerary(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((d, idx) => {
    const blocks =
      Array.isArray(d?.blocks) && d.blocks.length
        ? mapBlocks(d.blocks)
        : mapBlocks({
            time: d?.time,
            title: d?.title || `Day ${idx + 1} Plan`,
            activity: d?.activity,
            notes: d?.notes,
            image: d?.image,
          });

    return {
      day: d?.day || String(idx + 1),
      title: d?.title || blocks?.[0]?.title || "",
      blocks,
    };
  });
}

// ----------------------------
// Simplifiers for related data
// ----------------------------
function simplifyBlog(b) {
  return {
    id: b?._id || b?.id,
    slug: b?.slug,
    title: b?.title,
    description: b?.description,
    image: b?.displayImg || b?.coverImage || b?.image || FALLBACK_IMG,
  };
}

function simplifyDestination(d) {
  return {
    id: d?._id || d?.id,
    slug: d?.slug,
    title: d?.title,
    description: d?.description,
    image:
      d?.displayImg ||
      d?.heroImg ||
      d?.highlight?.img ||
      d?.image ||
      FALLBACK_IMG,
  };
}

function simplifyExperience(x) {
  return {
    id: x?._id || x?.id,
    slug: x?.slug,
    title: x?.title,
    image: x?.heroImg || x?.displayImg || x?.image || FALLBACK_IMG,
    highlight: x?.highlight || null,
    status: x?.status,
  };
}

function simplifySpotlight(s) {
  return {
    id: s?._id || s?.id,
    title: s?.title,
    description: s?.description,
    image: s?.displayImg || s?.image || FALLBACK_IMG,
    tour: s?.tour || null,
  };
}

function simplifyTour(t) {
  return {
    id: t?._id || t?.id,
    slug: t?.slug,
    title: t?.title,
    place: t?.place,
    image: t?.heroImg || t?.image || FALLBACK_IMG,
    status: t?.status,
  };
}

function mapCreator(u) {
  if (!u || typeof u !== "object") return null;
  return {
    id: u?._id || u?.id,
    name: u?.name || "",
    email: u?.email || "",
    profileImg: u?.profileImg || "",
    bio: u?.bio || "",
    slug: u?.slug || "",
  };
}
