# 🏙️ Urban Matrix AI
### Predictive Urban Growth Modeling for Real Estate Investment

> **Live Demo:** [**https://newurban2.vercel.app**](https://newurban2.vercel.app)

A full-stack web application that ingests multi-source urban data, computes predictive growth scores, classifies areas by trend, and visualizes insights through an interactive dark-mode dashboard — complete with charts, data tables, and a live Leaflet map.

---

## 🌐 Live Deployment

| Component | Status | URL |
| :--- | :--- | :--- |
| **Frontend (Vercel)** | ✅ Live | [https://newurban2.vercel.app](https://newurban2.vercel.app) |
| **Backend (Render)** | ✅ Live | [https://urban-matrix-backend.onrender.com](https://urban-matrix-backend.onrender.com) |

---

## 📸 Screenshots

| Overview Tab | Table Tab | Map Tab |
|---|---|---|
| Bar chart + Pie chart | Sortable data table | Interactive Leaflet map |
| Top 5 growth areas | Color-coded badges | Category-colored markers |

---

## 📁 Project Structure

```
urban-growth-app/
│
├── client/                        ← React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── App.jsx                ← Main dashboard (all components)
│   │   └── index.css              ← Tailwind + custom animations
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                        ← Node.js + Express backend
│   ├── index.js                   ← All API endpoints + score logic
│   ├── uploads/                   ← Temp directory for file uploads
│   └── package.json
│
├── sample_dataset.csv             ← Sample data (15 areas) for testing
├── sample_dataset.json            ← Sample data (10 areas) for testing
├── .gitignore
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **Charts** | Recharts (Bar + Pie) |
| **Map** | React-Leaflet + Leaflet.js |
| **Icons** | Lucide React |
| **Backend** | Node.js + Express 4 |
| **File Parsing** | Multer (upload), csv-parser (CSV) |
| **Database** | In-memory (easily extendable to MongoDB) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher → [Download](https://nodejs.org)
- **npm** (comes with Node.js)
- **Git**

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/aditya29625/newurban2.git
cd newurban2
```

---

### 2️⃣ Start the Backend (Express API)

```bash
cd server
npm install
node index.js
```

✅ You should see:
```
✅ Urban Growth API server running on http://localhost:5000
   GET  /api/health  → server status
   GET  /api/areas   → all 8 areas
   GET  /api/top     → top 5 growth areas
   POST /api/upload  → upload CSV or JSON
```

---

### 3️⃣ Start the Frontend (React + Vite)

Open a **new terminal** window:

```bash
cd client
npm install
npm run dev
```

✅ You should see:
```
  VITE v5.x.x  ready in ~1000ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## 📊 Core Features

### 1. Data Ingestion
- Drag & drop or click to upload a **CSV or JSON** file
- Supported fields:

| Field | Type | Description |
|-------|------|-------------|
| `area_name` | string | Name of the urban area |
| `price_growth` | number | Price appreciation metric |
| `listing_density` | number | Number of active property listings |
| `infrastructure_score` | number | Infrastructure quality score |

---

### 2. Growth Score Formula

```
G = 0.4 × price_growth + 0.3 × listing_density + 0.3 × infrastructure_score
```

> All three metrics are **normalized to a [0–10] scale** using the dataset's max values before applying weights.

**Example:**
```
price_growth = 14  → normalized = 10.0
listing_density = 180 → normalized = 10.0
infrastructure_score = 9 → normalized = 10.0

G = (0.4 × 10) + (0.3 × 10) + (0.3 × 10) = 10.0
```

---

### 3. Trend Classification

| Category | Score Range | Color |
|----------|------------|-------|
| 🔴 **High Growth** | > 7 | Red |
| 🟡 **Medium Growth** | 4 – 7 | Yellow |
| 🟢 **Low Growth** | < 4 | Green |

### 4. Undervalued Area Detection

An area is flagged **"Undervalued"** when:
- Normalized infrastructure score **> 7** (strong infrastructure)
- Normalized price growth **< 4** (price hasn't caught up yet)

> These are prime **buy-low** investment opportunities.

---

## 🔌 API Reference

Base URL: `http://localhost:5000`

### `GET /api/health`
Returns server status.

**Response:**
```json
{
  "status": "ok",
  "areas": 8,
  "timestamp": "2026-04-19T09:00:00.000Z"
}
```

---

### `GET /api/areas`
Returns all areas with computed growth scores.

**Response:**
```json
[
  {
    "area_name": "Aerocity Mohali",
    "price_growth": 14,
    "listing_density": 180,
    "infrastructure_score": 9,
    "score": 9.70,
    "category": "High",
    "undervalued": false,
    "lat": 30.741,
    "lng": 76.782
  }
]
```

---

### `GET /api/top`
Returns the **top 5** highest-scoring areas.

**Response:** Same schema as `/api/areas`, limited to 5 results sorted by score descending.

---

### `POST /api/upload`
Upload a CSV or JSON file to replace the active dataset.

**Request:** `multipart/form-data`
- Field name: `file`
- Accepted types: `.csv`, `.json`

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@sample_dataset.csv"
```

**Response:**
```json
{
  "message": "CSV processed successfully",
  "count": 15,
  "data": [...]
}
```

---

## 📂 Sample Dataset

### CSV format (`sample_dataset.csv`)
```csv
area_name,price_growth,listing_density,infrastructure_score
Aerocity Mohali,14,180,9
Mohali Sector 70,12,150,8
New Chandigarh,11,160,8
Zirakpur VIP Road,10,200,7
Mullanpur New Town,9,130,7
...
```

### JSON format (`sample_dataset.json`)
```json
[
  { "area_name": "Aerocity Mohali", "price_growth": 14, "listing_density": 180, "infrastructure_score": 9 },
  { "area_name": "Mohali Sector 70", "price_growth": 12, "listing_density": 150, "infrastructure_score": 8 }
]
```

---

## 🗺️ Dashboard Tabs

### Overview Tab
- **5 Stat Cards** — Total Areas, High / Medium / Low counts, Undervalued count
- **Bar Chart** — Top 5 growth areas ranked by score (Recharts)
- **Donut Pie Chart** — Category distribution breakdown
- **Ranking Cards** — Ranked top-5 with score, badge, and undervalued flag

### Table Tab
- Full sortable data table (sorted by score, highest first)
- Columns: Area Name · Price Growth · Listing Density · Infra Score · G Score · Category · Undervalued
- Color-coded category badges (Red / Yellow / Green)

### Map Tab
- Interactive **Leaflet map** with dark CartoDB tile layer
- **Color-coded markers** per category (🔴 High · 🟡 Medium · 🟢 Low)
- Click any marker for a popup with full area details
- Map legend overlay

---

## 🌐 Deployment

### Frontend → Vercel

1. Push `client/` to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set env variable: `VITE_API_BASE = https://your-backend.onrender.com/api`
4. Update `App.jsx`:
   ```js
   const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
   ```
5. Deploy ✅

### Backend → Render

1. Push `server/` to GitHub
2. Create a **Web Service** on [render.com](https://render.com)
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node index.js`
   - **Port:** `5000`
4. Deploy ✅

---

## 🔮 Extending to MongoDB

To persist data across server restarts, replace the in-memory store with MongoDB:

```bash
cd server
npm install mongoose
```

```js
// In server/index.js
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

const AreaSchema = new mongoose.Schema({ /* fields */ });
const Area = mongoose.model('Area', AreaSchema);

// Replace areasData array with Area.find() / Area.insertMany()
```

---

## 📝 Scripts Reference

| Command | Directory | Action |
|---------|-----------|--------|
| `node index.js` | `server/` | Start backend API |
| `npm run dev` | `client/` | Start frontend dev server |
| `npm run build` | `client/` | Build production bundle |
| `npm run preview` | `client/` | Preview production build |

---

## 🤝 Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
  <strong>Urban Matrix AI</strong> · Built with React + Express · Predictive Real Estate Intelligence
</div>