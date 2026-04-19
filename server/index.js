const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// User's explicitly requested dataset
const initialData = [
  { "area_name": "Mohali Sector 70", "price_growth": 12, "listing_density": 150, "infrastructure_score": 8 },
  { "area_name": "Zirakpur VIP Road", "price_growth": 10, "listing_density": 200, "infrastructure_score": 7 },
  { "area_name": "Kharar Landran Road", "price_growth": 8, "listing_density": 120, "infrastructure_score": 6 },
  { "area_name": "Chandigarh Sector 22", "price_growth": 6, "listing_density": 90, "infrastructure_score": 9 },
  { "area_name": "Aerocity Mohali", "price_growth": 14, "listing_density": 180, "infrastructure_score": 9 }
];

// Process the raw data
const processData = (rawData) => {
  if (!rawData.length) return [];
  
  const maxPriceGrowth = Math.max(...rawData.map(d => parseFloat(d.price_growth || 0))) || 1;
  const maxListingDensity = Math.max(...rawData.map(d => parseFloat(d.listing_density || 0))) || 1;
  const maxInfraScore = Math.max(...rawData.map(d => parseFloat(d.infrastructure_score || 0))) || 1;
  
  return rawData.map(data => {
    const raw_price = parseFloat(data.price_growth || 0);
    const raw_density = parseFloat(data.listing_density || 0);
    const raw_infra = parseFloat(data.infrastructure_score || 0);

    const normPrice = (raw_price / maxPriceGrowth) * 10;
    const normDensity = (raw_density / maxListingDensity) * 10;
    const normInfra = (raw_infra / maxInfraScore) * 10;
    
    const score = (0.4 * normPrice) + (0.3 * normDensity) + (0.3 * normInfra);
    
    let category = 'Low';
    if (score > 7) category = 'High';
    else if (score >= 4) category = 'Medium';
    
    const undervalued = normInfra > 7 && normPrice < 4;

    const baseLat = 30.7333;
    const baseLng = 76.7794;
    const coords = {
      lat: baseLat + (Math.random() - 0.5) * 0.1,
      lng: baseLng + (Math.random() - 0.5) * 0.1
    };

    return {
      area_name: data.area_name || 'Unknown',
      price_growth: raw_price,
      listing_density: raw_density,
      infrastructure_score: raw_infra,
      score,
      category,
      undervalued,
      ...coords
    };
  });
};

// In-memory data store automatically populated on load
let areasData = processData(initialData);

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const isJson = req.file.originalname.endsWith('.json') || req.file.mimetype === 'application/json';

  try {
    if (isJson) {
      const rawFile = fs.readFileSync(req.file.path, 'utf8');
      const jsonData = JSON.parse(rawFile);
      areasData = processData(jsonData);
      fs.unlinkSync(req.file.path);
      return res.json({ message: 'JSON processed', count: areasData.length, data: areasData });
    } else {
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          areasData = processData(results);
          fs.unlinkSync(req.file.path);
          res.json({ message: 'CSV processed', count: areasData.length, data: areasData });
        })
        .on('error', () => {
          res.status(500).json({ error: 'Error parsing CSV' });
        });
    }
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/areas', (req, res) => {
  res.json(areasData);
});

app.get('/api/top', (req, res) => {
  const topAreas = [...areasData].sort((a, b) => b.score - a.score).slice(0, 5);
  res.json(topAreas);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
