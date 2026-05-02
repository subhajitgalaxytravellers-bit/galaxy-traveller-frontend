#!/usr/bin/env node
/**
 * fixToursData2.js
 *
 * Fixes in tours.json (one-shot, industry-grade):
 *
 * 1.  inclusions.included  — removes contamination (EXCLUSIONS headers, bleed-in
 *                            exclusion items, ALL-CAPS section titles, paragraphs)
 * 2.  inclusions.excluded  — removes FAQ Q&A bleed, section headers, MUST-VISIT
 *                            headings, and long paragraph answers
 * 3.  brief / description  — strips ☎ CALL, &#9742; CALL, HTML phone entities
 *                            and replaces "NatureWings" → "Galaxy Travellers"
 * 4.  highlights[].title   — replaces generic "Experience N" with place-specific
 *                            3-5 word titles via Groq
 * 5.  highlights[].brief   — rewrites vague / place-irrelevant briefs via Groq
 *                            (max 155 chars, factual, no promo)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Load .env files ───────────────────────────────────────────────────────────
const ENV_PATHS = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../galaxy-traveller-backend/.env'),
];
const env = {};
for (const ep of ENV_PATHS) {
  if (!fs.existsSync(ep)) continue;
  for (const line of fs.readFileSync(ep, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_0-9]+)\s*=\s*(.+)/);
    if (m) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
}
const GROQ_KEY = env.GROQ_API_KEY || env.GROQ_API_KEY2 || process.env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error('❌  Groq API key not found'); process.exit(1); }
console.log('Groq key: ✓ found\n');

// ── Load tours.json ───────────────────────────────────────────────────────────
const TOURS_PATH = path.resolve(__dirname, 'output/tours.json');
const tours = JSON.parse(fs.readFileSync(TOURS_PATH, 'utf8'));
console.log(`Loaded ${tours.length} tours.\n`);

// ── Groq helper ───────────────────────────────────────────────────────────────
function groqChat(messages, maxTokens = 2048) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
    });
    const req = https.request(
      {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) return reject(new Error(json.error.message));
            resolve(json.choices[0].message.content.trim());
          } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Rule-based cleaners ───────────────────────────────────────────────────────

/**
 * Returns true if an item in the `included` array is contamination that
 * should be removed.
 */
function isContaminatedIncluded(item) {
  const t = (item || '').trim();
  if (!t) return true;
  // Long paragraphs bleed
  if (t.length > 350) return true;
  // Exclusions section headers
  if (/EXCLUSIONS\s*:/i.test(t)) return true;
  if (/^EXCLUSIONS\b/i.test(t)) return true;
  // "XYZ Tour Inclusions:" section marker (it's a label, not a bullet)
  if (/\bInclusions\s*:/i.test(t)) return true;
  // ALL-CAPS section headers (>= 10 uppercase letters with spaces, no real sentence punctuation)
  if (t === t.toUpperCase() && /[A-Z]{5,}/.test(t) && !/^[A-Z][a-z]/.test(t)) return true;
  return false;
}

/**
 * Returns true if an item in the `excluded` array is contamination.
 */
function isContaminatedExcluded(item) {
  const t = (item || '').trim();
  if (!t) return true;
  // Long FAQ answers / paragraphs
  if (t.length > 350) return true;
  // FAQ questions
  if (/^Q\.\s/i.test(t)) return true;
  if (/^A\.\s/i.test(t)) return true;
  // FAQ / section headers
  if (/FREQUENTLY ASKED/i.test(t)) return true;
  if (/MUST[-\s]VISIT/i.test(t)) return true;
  if (/VALLEYS MUST/i.test(t)) return true;
  if (/WHAT ARE THE.*(?:VISIT|DESTINATION)/i.test(t)) return true;
  if (/WHAT IS THE DISTANCE/i.test(t)) return true;
  if (/WHAT IS HORNBILL/i.test(t)) return true;
  if (/IMPORTANT DESTINATIONS/i.test(t)) return true;
  // ALL-CAPS section headers (same logic as above)
  if (t === t.toUpperCase() && /[A-Z]{5,}/.test(t) && !/^[A-Z][a-z]/.test(t)) return true;
  // Sentence that starts with a place description (FAQ answer bleed)
  if (/^Must-visit destinations/i.test(t)) return true;
  return false;
}

/**
 * Strips CTA artifacts and brand name from brief / description / metaDescription.
 */
function cleanCTAText(text) {
  if (!text) return text;
  return text
    .replace(/[☎📞]\s*CALL\b/g, '')
    .replace(/&#9742;\s*CALL\b/g, '')
    .replace(/&#9742;/g, '')
    .replace(/☎/g, '')
    .replace(/📞/g, '')
    .replace(/\bCALL\b/g, '')
    .replace(/\bNatureWings\b/g, 'Galaxy Travellers')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[,\s]+\.$/, '.')  // trailing comma-space before period
    .replace(/\s+\.$/, '.')
    .replace(/([^.])$/, '$1.');  // ensure ends with period
}

// ── Groq highlight fixer ──────────────────────────────────────────────────────

/**
 * Given a batch of tours (up to BATCH_SIZE), return Groq-generated highlights.
 * Retries once on parse failure.
 */
async function fixHighlightsBatch(batch) {
  const input = batch.map((t, idx) => ({
    id: idx,
    tourTitle: t.title,
    place: t.place,
    highlights: t.highlights.map(h => ({
      existingBrief: (h.brief || '').substring(0, 160),
    })),
  }));

  const systemMsg = `You are a professional travel content writer for Galaxy Travellers, an Indian tour operator.
Respond ONLY with a valid JSON array. No markdown, no extra text.`;

  const userMsg = `For each tour below, produce 4 highlight objects with:
- "title": 3–5 words, highly specific to the place/experience.
  ✅ Good: "Tiger's Nest Monastery Hike", "Pangong Lake at Sunrise", "Traditional Thangka Painting", "Dzong Architecture Walk"
  ❌ Bad: "Experience 1", "Explore Bhutan", "Discover Nepal", "Himalayan Getaway"
- "brief": max 155 characters, 1–2 factual, engaging sentences. Place-specific.
  No promotional language ("book now", "best ever", "amazing"). No first-person.

Return ONLY a JSON array:
[
  {
    "id": 0,
    "highlights": [
      {"title":"...","brief":"..."},
      {"title":"...","brief":"..."},
      {"title":"...","brief":"..."},
      {"title":"...","brief":"..."}
    ]
  },
  ...
]

Tours:
${JSON.stringify(input, null, 2)}`;

  let raw;
  try {
    raw = await groqChat(
      [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      2200
    );
  } catch (err) {
    throw new Error(`Groq API error: ${err.message}`);
  }

  // Strip markdown code fences if present
  const jsonStr = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let results;
  try {
    results = JSON.parse(jsonStr);
  } catch (parseErr) {
    // Retry: extract JSON array from response
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) {
      results = JSON.parse(match[0]);
    } else {
      throw new Error(`JSON parse failed: ${parseErr.message}`);
    }
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 3;   // tours per Groq call
const GROQ_DELAY = 2700; // ms between calls

async function main() {
  console.log('=== fixToursData2.js ===\n');

  // ── STEP 1: Rule-based cleanup ──────────────────────────────────────────────
  console.log('── Step 1: Rule-based inclusions/exclusions cleanup ──');
  let incFixCount = 0;

  for (const tour of tours) {
    if (!tour.inclusions) continue;

    const origIncLen = (tour.inclusions.included || []).length;
    const origExcLen = (tour.inclusions.excluded || []).length;

    if (Array.isArray(tour.inclusions.included)) {
      tour.inclusions.included = tour.inclusions.included.filter(
        item => !isContaminatedIncluded(item)
      );
    }
    if (Array.isArray(tour.inclusions.excluded)) {
      tour.inclusions.excluded = tour.inclusions.excluded.filter(
        item => !isContaminatedExcluded(item)
      );
    }

    const newIncLen = (tour.inclusions.included || []).length;
    const newExcLen = (tour.inclusions.excluded || []).length;

    if (newIncLen !== origIncLen || newExcLen !== origExcLen) {
      incFixCount++;
      const removedInc = origIncLen - newIncLen;
      const removedExc = origExcLen - newExcLen;
      process.stdout.write(
        `  ✓ ${tour.title.substring(0, 50)}` +
        (removedInc ? ` [-${removedInc} included]` : '') +
        (removedExc ? ` [-${removedExc} excluded]` : '') +
        '\n'
      );
    }
  }
  console.log(`\n  Total tours with inclusions fixed: ${incFixCount}\n`);

  // ── STEP 2: Clean brief / description / metaDescription ────────────────────
  console.log('── Step 2: Cleaning CTA artifacts from text fields ──');
  let textFixCount = 0;
  for (const tour of tours) {
    let changed = false;

    const newBrief = cleanCTAText(tour.brief);
    if (newBrief !== tour.brief) { tour.brief = newBrief; changed = true; }

    const newDesc = cleanCTAText(tour.description);
    if (newDesc !== tour.description) { tour.description = newDesc; changed = true; }

    if (tour.seo?.metaDescription) {
      const newMeta = cleanCTAText(tour.seo.metaDescription);
      if (newMeta !== tour.seo.metaDescription) { tour.seo.metaDescription = newMeta; changed = true; }
    }

    if (changed) textFixCount++;
  }
  console.log(`  Total tours with text cleaned: ${textFixCount}\n`);

  // ── STEP 3: Groq highlights fix ─────────────────────────────────────────────
  console.log('── Step 3: Fixing highlights titles & briefs via Groq ──\n');
  let groqSuccess = 0;
  let groqFail = 0;

  for (let i = 0; i < tours.length; i += BATCH_SIZE) {
    const batch = tours.slice(i, Math.min(i + BATCH_SIZE, tours.length));
    const batchEnd = i + batch.length;

    const label = `[${String(i + 1).padStart(3)}-${String(batchEnd).padStart(3)}/${tours.length}]`;
    process.stdout.write(`  ${label} `);

    let attempt = 0;
    let success = false;

    while (attempt < 2 && !success) {
      try {
        if (attempt > 0) {
          process.stdout.write('(retry) ');
          await sleep(3000);
        }
        const results = await fixHighlightsBatch(batch);

        for (const result of results) {
          const tour = batch[result.id];
          if (!tour || !Array.isArray(result.highlights)) continue;
          result.highlights.forEach((h, j) => {
            if (!tour.highlights[j]) return;
            if (h.title && !/^experience\s*\d+$/i.test(h.title)) {
              tour.highlights[j].title = h.title;
            }
            if (h.brief && h.brief.length >= 20) {
              // Truncate to 155 chars if Groq went over
              tour.highlights[j].brief = h.brief.substring(0, 155).trimEnd();
            }
          });
        }

        const names = batch.map(t => t.title.substring(0, 28)).join(' | ');
        console.log(`✓  ${names}`);
        groqSuccess += batch.length;
        success = true;
      } catch (err) {
        attempt++;
        if (attempt >= 2) {
          console.log(`✗  Skipped (${err.message.substring(0, 80)})`);
          groqFail += batch.length;
        }
      }
    }

    if (batchEnd < tours.length) await sleep(GROQ_DELAY);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  console.log('\nSaving tours.json...');
  fs.writeFileSync(TOURS_PATH, JSON.stringify(tours, null, 2), 'utf8');

  console.log(`
✅  Done.
   Inclusions/exclusions fixed : ${incFixCount} tours
   Text fields cleaned          : ${textFixCount} tours
   Highlights fixed (Groq)      : ${groqSuccess} tours
   Highlights skipped (errors)  : ${groqFail} tours
`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
