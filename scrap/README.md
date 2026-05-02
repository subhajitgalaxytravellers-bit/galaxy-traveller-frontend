# NatureWings Scrape Pipeline

This pipeline scrapes package pages from `https://www.naturewings.com`, enriches missing content with Groq, fills missing images with Unsplash, and exports review-ready JSON files for seeding.

## Output

- `scrap/output/tours.json`
- `scrap/output/destinations.json`
- `scrap/output/blogs.json`
- `scrap/output/scrape-report.json`

## Environment

The script reads environment values from:

1. `front/.env`
2. `galaxy-traveller-backend/.env`
3. runtime `process.env`

Required for full enrichment:

- `GROQ_API_KEY` (optional but recommended)
- `GROQ_API_KEY2` (optional fallback key)
- `UNSPLASH_ACCESS_KEY` (optional but recommended)

If these are missing, the scraper still runs with deterministic fallback content/images.

## Run

```bash
npm run scrape:naturewings
```

Optional limit for testing:

```bash
SCRAPE_MAX_PACKAGES=5 npm run scrape:naturewings
```

Optional Groq enrichment cap (defaults to 40 pages):

```bash
SCRAPE_MAX_GROQ_CALLS=80 npm run scrape:naturewings
```

For PowerShell:

```powershell
$env:SCRAPE_MAX_PACKAGES="5"; npm run scrape:naturewings
```

## Notes

- Uses sitemap discovery first, then homepage link fallback.
- Uses HTTP fetch first and Playwright rendering fallback.
- Maps output fields to the `CLIENT_CONTENT_INTAKE.txt` expectations for tours, destinations, and blogs.
