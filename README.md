# Urban Matrix AI (UrbanDev)

A premium full-stack real estate analytics dashboard that uses multi-source geospatial telemetry to generate predictive urban growth models.

## Features
- **Advanced Normalization Engine**: Automatically normalizes volatile attributes (e.g., listing density, infrastructure) to generate consistent intelligence metrics.
- **Geospatial Mapping**: Transparent CartoDB maps using Leaflet to intelligently center on the bounds of calculated coordinate zones (currently tracking Chandigarh domains).
- **Glassmorphism UI**: Beautiful, fully responsive `TailwindCSS` dashboards utilizing React `recharts` for seamless analytical reading.
- **Undervalued Asset Identification**: Highlighting critical algorithmic signals dynamically inside custom map popups for rapid investment action.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Recharts + React Leaflet
- Backend: Node.js + Express + Multer + CSV-Parser

## Quick Start
You can instantly install dependencies and boot both the backend and frontend servers simultaneously by executing the included macro script from the root directory:
```bash
.\start.bat
```

### Manual Setup
**Backend**:
```bash
cd server
npm install
npm run dev
```

**Frontend**:
```bash
cd client
npm install
npm run dev
```

The application natively listens for telemetry on `http://localhost:5173`.
