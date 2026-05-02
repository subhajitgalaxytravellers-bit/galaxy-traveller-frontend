#!/usr/bin/env node
/**
 * fixHighlightsPatch.js
 *
 * Patches highlights for tours at indices 150–157 that were skipped
 * in fixToursData2.js due to Groq rate limit.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Load .env files ──────────────────────────────────────────────────────────
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
const GROQ_KEYS = [
  env.GROQ_API_KEY,
  env.GROQ_API_KEY2,
  process.env.GROQ_API_KEY,
].filter(Boolean);
if (!GROQ_KEYS.length) { console.error('❌  Groq API key not found'); process.exit(1); }
let groqKeyIndex = 0;
function currentKey() { return GROQ_KEYS[groqKeyIndex % GROQ_KEYS.length]; }
function nextKey() { groqKeyIndex++; return currentKey(); }
console.log(`Groq keys: ${GROQ_KEYS.length} found\n`);

// ── Load tours.json ──────────────────────────────────────────────────────────
const TOURS_PATH = path.resolve(__dirname, 'output/tours.json');
const tours = JSON.parse(fs.readFileSync(TOURS_PATH, 'utf8'));
console.log(`Loaded ${tours.length} tours.\n`);

// ── Groq helper ──────────────────────────────────────────────────────────────
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
          Authorization: `Bearer ${currentKey()}`,
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

// ── Groq highlight fixer ─────────────────────────────────────────────────────
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
  ✅ Good: "Tiger's Nest Monastery Hike", "Pangong Lake at Sunrise", "Traditional Thangka Painting"
  ❌ Bad: "Experience 1", "Explore Bhutan", "Discover Nepal"
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
  }
]

Tours:
${JSON.stringify(input, null, 2)}`;

  let raw;
  try {
    raw = await groqChat(
      [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
      2000
    );
  } catch (e) {
    throw e;
  }

  // Strip markdown fences
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Retry once
    await sleep(3000);
    raw = await groqChat(
      [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
      2000
    );
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    parsed = JSON.parse(raw);
  }

  return parsed;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const INDICES_TO_FIX = [150, 151, 152, 153, 154, 155, 156, 157];
const BATCH_SIZE = 4;
const GROQ_DELAY = 4000;

(async () => {
  console.log(`Patching highlights for ${INDICES_TO_FIX.length} tours...\n`);

  let fixed = 0;
  let skipped = 0;

  for (let b = 0; b < INDICES_TO_FIX.length; b += BATCH_SIZE) {
    const batchIndices = INDICES_TO_FIX.slice(b, b + BATCH_SIZE);
    const batch = batchIndices.map(i => tours[i]);

    const label = `[${batchIndices[0]}–${batchIndices[batchIndices.length - 1]}]`;
    process.stdout.write(`  ${label} `);

    try {
      const results = await fixHighlightsBatch(batch);

      for (const r of results) {
        const tourIdx = batchIndices[r.id];
        const tour = tours[tourIdx];
        if (!tour || !Array.isArray(r.highlights)) continue;

        for (let hi = 0; hi < Math.min(tour.highlights.length, r.highlights.length); hi++) {
          if (r.highlights[hi].title) tour.highlights[hi].title = r.highlights[hi].title;
          if (r.highlights[hi].brief) {
            let brief = r.highlights[hi].brief.substring(0, 165);
            if (!brief.endsWith('.')) brief += '.';
            tour.highlights[hi].brief = brief;
          }
        }
        fixed++;
        process.stdout.write(`✓ ${tour.title?.slice(0, 35)} | `);
      }
      console.log();
    } catch (e) {
      if (/rate limit/i.test(e.message) && GROQ_KEYS.length > 1) {
        console.log(`(rate limit, rotating key...)`);
        nextKey();
        await sleep(2000);
        try {
          const results2 = await fixHighlightsBatch(batch);
          for (const r of results2) {
            const tourIdx = batchIndices[r.id];
            const tour = tours[tourIdx];
            if (!tour || !Array.isArray(r.highlights)) continue;
            for (let hi = 0; hi < Math.min(tour.highlights.length, r.highlights.length); hi++) {
              if (r.highlights[hi].title) tour.highlights[hi].title = r.highlights[hi].title;
              if (r.highlights[hi].brief) {
                let brief = r.highlights[hi].brief.substring(0, 165);
                if (!brief.endsWith('.')) brief += '.';
                tour.highlights[hi].brief = brief;
              }
            }
            fixed++;
            process.stdout.write(`✓ ${tour.title?.slice(0, 35)} | `);
          }
          console.log();
        } catch (e2) {
          console.log(`✗  Error: ${e2.message?.slice(0, 80)}`);
          skipped += batchIndices.length;
        }
      } else {
        console.log(`✗  Error: ${e.message?.slice(0, 80)}`);
        skipped += batchIndices.length;
      }
    }

    if (b + BATCH_SIZE < INDICES_TO_FIX.length) await sleep(GROQ_DELAY);
  }

  console.log('\nSaving tours.json...');
  fs.writeFileSync(TOURS_PATH, JSON.stringify(tours, null, 2), 'utf8');

  console.log(`\n✅  Patch done.`);
  console.log(`   Highlights fixed   : ${fixed} tours`);
  console.log(`   Highlights skipped : ${skipped} tours`);
})();
