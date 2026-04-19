const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const csv     = require('csv-parser');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ── File Upload Setup ──────────────────────────────
const upload = multer({ dest: 'uploads/' });

// ── Default Demo Data ──────────────────────────────
// Removed — API will start empty so the empty-state renders,
// but we'll keep a richer initial dataset for demo purposes.
const DEMO_DATA = [
  { area_name: 'Mohali Sector 70',     price_growth: 12, listing_density: 150, infrastructure_score: 8  },
  { area_name: 'Zirakpur VIP Road',    price_growth: 10, listing_density: 200, infrastructure_score: 7  },
  { area_name: 'Kharar Landran Road',  price_growth:  8, listing_density: 120, infrastructure_score: 6  },
  { area_name: 'Chandigarh Sector 22', price_growth:  6, listing_density:  90, infrastructure_score: 9  },
  { area_name: 'Aerocity Mohali',      price_growth: 14, listing_density: 180, infrastructure_score: 9  },
  { area_name: 'Panchkula Sector 20',  price_growth:  5, listing_density:  75, infrastructure_score: 7  },
  { area_name: 'New Chandigarh',       price_growth: 11, listing_density: 160, infrastructure_score: 8  },
  { area_name: 'Dera Bassi',           price_growth:  3, listing_density:  60, infrastructure_score: 5  },
];

// ── Growth Score Formula ───────────────────────────
//  G = 0.4 * normPrice + 0.3 * normDensity + 0.3 * normInfra
//  Normalise each metric to [0, 10] range using max of dataset.
const processData = (rawData) => {
  if (!rawData || !rawData.length) return [];

  const toNum = (v) => parseFloat(v) || 0;

  const maxPrice   = Math.max(...rawData.map(d => toNum(d.price_growth)))      || 1;
  const maxDensity = Math.max(...rawData.map(d => toNum(d.listing_density)))    || 1;
  const maxInfra   = Math.max(...rawData.map(d => toNum(d.infrastructure_score))) || 1;

  // Base coordinates (Chandigarh tricity) with small random offsets
  const BASE_LAT = 30.7333;
  const BASE_LNG = 76.7794;

  // Use a stable seed per area so coords don't change on re-fetch
  const hashStr = (str) => {
    let h = 0;
    for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return h;
  };

  return rawData.map((data) => {
    const raw_price   = toNum(data.price_growth);
    const raw_density = toNum(data.listing_density);
    const raw_infra   = toNum(data.infrastructure_score);

    // Normalise to 0–10
    const normPrice   = (raw_price   / maxPrice)   * 10;
    const normDensity = (raw_density / maxDensity)  * 10;
    const normInfra   = (raw_infra   / maxInfra)    * 10;

    // Growth score G
    const score = 0.4 * normPrice + 0.3 * normDensity + 0.3 * normInfra;

    // Category classification
    let category = 'Low';
    if      (score > 7)  category = 'High';
    else if (score >= 4) category = 'Medium';

    // Undervalued: high infra but low price growth
    const undervalued = normInfra > 7 && normPrice < 4;

    // Stable deterministic lat/lng based on area name
    const seed = hashStr(String(data.area_name || ''));
    const lat  = BASE_LAT + ((seed % 1000) / 1000 - 0.5) * 0.18;
    const lng  = BASE_LNG + (((seed >> 10) % 1000) / 1000 - 0.5) * 0.18;

    return {
      area_name:            String(data.area_name || 'Unknown'),
      price_growth:         raw_price,
      listing_density:      raw_density,
      infrastructure_score: raw_infra,
      score:                parseFloat(score.toFixed(4)),
      category,
      undervalued,
      lat,
      lng,
    };
  });
};

// ── In-memory store ────────────────────────────────
let areasData = processData(DEMO_DATA);

// ── Routes ─────────────────────────────────────────

/**
 * POST /api/upload
 * Accepts a .csv or .json file via multipart form-data (field name: "file")
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
  }

  const filePath  = req.file.path;
  const origName  = req.file.originalname || '';
  const isJson    = origName.endsWith('.json') || req.file.mimetype === 'application/json';

  const cleanup = () => {
    try { fs.unlinkSync(filePath); } catch {}
  };

  try {
    if (isJson) {
      // ── JSON upload ──────────────────────────────
      const rawText = fs.readFileSync(filePath, 'utf8');
      const parsed  = JSON.parse(rawText);
      const rows    = Array.isArray(parsed) ? parsed : [parsed];
      areasData     = processData(rows);
      cleanup();
      return res.json({
        message: 'JSON processed successfully',
        count:   areasData.length,
        data:    areasData,
      });
    } else {
      // ── CSV upload ───────────────────────────────
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', () => {
          areasData = processData(results);
          cleanup();
          res.json({
            message: 'CSV processed successfully',
            count:   areasData.length,
            data:    areasData,
          });
        })
        .on('error', (err) => {
          cleanup();
          res.status(500).json({ error: 'Failed to parse CSV', detail: err.message });
        });
    }
  } catch (err) {
    cleanup();
    res.status(500).json({ error: 'Server error during upload', detail: err.message });
  }
});

/**
 * GET /api/areas
 * Returns all processed areas with scores
 */
app.get('/api/areas', (req, res) => {
  res.json(areasData);
});

/**
 * GET /api/top
 * Returns top 5 areas sorted by growth score (descending)
 */
app.get('/api/top', (req, res) => {
  const top5 = [...areasData]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  res.json(top5);
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', areas: areasData.length, timestamp: new Date().toISOString() });
});

// ── Start Server ───────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Urban Growth API server running on http://localhost:${PORT}`);
  console.log(`   GET  /api/health  → server status`);
  console.log(`   GET  /api/areas   → all ${areasData.length} areas`);
  console.log(`   GET  /api/top     → top 5 growth areas`);
  console.log(`   POST /api/upload  → upload CSV or JSON\n`);
});
