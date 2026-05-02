# Tour Image Fixer — Production Script

Fixes all image URLs in `tours.json` using Unsplash API (primary) and Freepik API (fallback), with global deduplication, smart query generation, and automatic DB seeding.

---

## Folder structure

```
front/scrap/fixToursImagesProd/
├── index.js                  ← Main runner
├── .env.example              ← API key template
├── lib/
│   ├── queryBuilder.js       ← Smart query generation per tour / highlight
│   ├── imageApi.js           ← Unsplash + Freepik with retry + in-memory cache
│   ├── tourProcessor.js      ← Process one tour; assigns all image slots
│   └── limiter.js            ← Concurrency limiter (no extra deps)
│
galaxy-traveller-backend/
└── scripts/
    └── seedTours.js          ← MongoDB seeder (delete old → bulk insert)
```

---

## Prerequisites

`axios` is already installed in the project. No additional packages needed.

---

## Step 1 — Add API keys

Add your keys to **`front/.env`** (or `galaxy-traveller-backend/.env`):

```env
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
FREEPIK_API_KEY=your_freepik_key_here   # optional
```

Get a free Unsplash key at <https://unsplash.com/developers>  
(Free tier: 50 req/hour demo → apply for Production: 5,000 req/hour)

---

## Step 2 — Run the image fixer

```bash
cd "GalaxyTravellers/front"
node scrap/fixToursImagesProd/index.js
```

**Output files:**
| File | Description |
|------|-------------|
| `front/scrap/output/tours.updated.json` | Tours with all images replaced |
| `front/scrap/output/image-fix-report.json` | Stats + errors per run |

---

## Step 3 — Seed the database

```bash
cd "GalaxyTravellers/galaxy-traveller-backend"
node scripts/seedTours.js
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--dry-run` | Validate only, no DB writes |
| `--keep-existing` | Upsert mode (skip deleteMany) |
| `--status=published` | Set tour status (default: `draft`) |

**Example — seed as published:**
```bash
node scripts/seedTours.js --status=published
```

**Example — dry run first:**
```bash
node scripts/seedTours.js --dry-run
```

---

## What it does

### Image fixer (`index.js`)

1. **Loads** `tours.json` (100–200 objects)
2. **Processes all tours** with concurrency limit of 5 parallel tasks
3. For each tour:
   - Generates targeted queries from `place`, `title`, `highlights[].title`
   - Fetches Unsplash images (per_page=15, orientation=landscape)
   - Falls back to Freepik if Unsplash returns < 5 results
   - Assigns **`heroImg`** — best scenic landscape image
   - Assigns **`galleryImgs`** — 6–8 unique images from rotating queries
   - Assigns **`highlights[].img`** — highlight-specific targeted query
   - Assigns **`seo.metaImage`** — from gallery or fresh query
4. **Global deduplication** — no URL is reused across any tour or slot
5. **In-memory cache** — same query is never fetched twice from the API
6. **Retry** — failed API calls retry up to 3× with exponential back-off

### DB seeder (`seedTours.js`)

1. Validates all required fields (`slug`, `title`, `place`, `heroImg`, etc.)
2. Sanitizes data (strips non-schema fields like `relationHint`)
3. **Deletes ALL existing Tour documents**
4. Bulk-inserts valid tours via `Tour.insertMany({ ordered: false })`
5. Reports successes and individual write failures

---

## Deduplication guarantees

- `usedImages` Set is shared across **all** tours
- `tourUsed` Set prevents the same URL appearing twice in one tour
- Gallery queries rotate across 6–8 different queries per destination
- Result: 160 tours × 8+ images = 1,280+ unique images minimum

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `No API key found` | Add `UNSPLASH_ACCESS_KEY` to `front/.env` |
| `tours.json not found` | Run the scraping pipeline first |
| `tours.updated.json not found` (seeder) | Run the image fixer first |
| `MONGO_URI not set` (seeder) | Check `galaxy-traveller-backend/.env` |
| Too many Unsplash 403 errors | Apply for Production access on Unsplash |
| Freepik returns empty results | Check API key; Freepik free tier has daily limits |
| Few images on a niche destination | Script uses `generic` fallback queries automatically |
