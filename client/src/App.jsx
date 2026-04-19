import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  UploadCloud, TrendingUp, AlertTriangle, Layers,
  MapPin, Activity, Star, RefreshCw, Building2, CheckCircle
} from 'lucide-react';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ✅ Uses env variable in production (Vercel), falls back to localhost in dev
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// ------------------------------------------------
// Helper: map center updater
// ------------------------------------------------
const UpdateMapCenter = ({ areas }) => {
  const map = useMap();
  useEffect(() => {
    if (areas.length > 0) {
      const bounds = L.latLngBounds(areas.map(a => [a.lat, a.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [areas, map]);
  return null;
};

// ------------------------------------------------
// Helper: category color theme
// Per spec: Red=High, Yellow=Medium, Green=Low
// ------------------------------------------------
const getCategoryTheme = (category) => {
  switch (category) {
    case 'High':   return { badge: 'bg-red-500/15 text-red-400 border border-red-500/30',    fill: '#ef4444', dot: 'bg-red-500',    glow: 'shadow-red-500/20' };
    case 'Medium': return { badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', fill: '#eab308', dot: 'bg-yellow-400', glow: 'shadow-yellow-500/20' };
    case 'Low':    return { badge: 'bg-green-500/15 text-green-400 border border-green-500/30',   fill: '#22c55e', dot: 'bg-green-500',   glow: 'shadow-green-500/20' };
    default:       return { badge: 'bg-slate-700 text-slate-300 border border-slate-600',          fill: '#94a3b8', dot: 'bg-slate-400',   glow: '' };
  }
};

// ------------------------------------------------
// Custom Tooltip for bar chart
// ------------------------------------------------
const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const theme = getCategoryTheme(d.category);
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[180px]">
        <p className="font-bold text-white mb-2 text-sm">{d.area_name}</p>
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex justify-between gap-4"><span>Growth Score</span><span className="font-black text-white">{d.score?.toFixed(2)}</span></div>
          <div className="flex justify-between gap-4"><span>Category</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${theme.badge}`}>{d.category}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ------------------------------------------------
// Main App
// ------------------------------------------------
export default function App() {
  const [areas, setAreas]       = useState([]);
  const [topAreas, setTopAreas] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      const [{ data: all }, { data: top }] = await Promise.all([
        axios.get(`${API_BASE}/areas`),
        axios.get(`${API_BASE}/top`),
      ]);
      setAreas(all);
      setTopAreas(top);
    } catch {
      showToast('Could not connect to backend (localhost:5000)', 'error');
    }
  };

  useEffect(() => { loadData(); }, []);

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    try {
      const { data } = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadData();
      showToast(`✅ Processed ${data.count} areas successfully!`);
    } catch {
      showToast('Upload failed — ensure backend is running on :5000', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    multiple: false,
  });

  // ── Derived stats ──────────────────────────────
  const highCount       = areas.filter(a => a.category === 'High').length;
  const mediumCount     = areas.filter(a => a.category === 'Medium').length;
  const lowCount        = areas.filter(a => a.category === 'Low').length;
  const undervaluedCount = areas.filter(a => a.undervalued).length;
  const avgScore        = areas.length ? (areas.reduce((s, a) => s + a.score, 0) / areas.length).toFixed(2) : '—';

  const pieData = [
    { name: 'High', value: highCount,   fill: '#ef4444' },
    { name: 'Medium', value: mediumCount, fill: '#eab308' },
    { name: 'Low',  value: lowCount,    fill: '#22c55e' },
  ].filter(d => d.value > 0);

  // ── Custom marker icons per category ──────────
  const makeIcon = (category) => {
    const colors = { High: '#ef4444', Medium: '#eab308', Low: '#22c55e' };
    const color  = colors[category] || '#94a3b8';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 6 8 18 8 18s8-12 8-18c0-4.4-3.6-8-8-8z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="8" r="3.5" fill="white"/>
    </svg>`;
    return new L.DivIcon({
      html: svg,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -38],
      className: '',
    });
  };

  // ── Render ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans selection:bg-indigo-500/30">

      {/* ── Toast ───────────────────────────────── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-3 animate-bounce-in
          ${toast.type === 'error' ? 'bg-red-900/90 border border-red-500/40 text-red-200' : 'bg-emerald-900/90 border border-emerald-500/40 text-emerald-200'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ── HEADER ──────────────────────────────── */}
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-indigo-950/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-800/60 shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"/>
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none"/>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-indigo-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                  <Layers size={22} className="text-white"/>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Urban Matrix AI
                </h1>
              </div>
              <p className="text-slate-400 text-sm font-medium ml-[52px]">
                Predictive Urban Growth Modeling · Real Estate Intelligence
              </p>
            </div>

            {/* Upload Zone */}
            <div
              {...getRootProps()}
              className={`flex-shrink-0 border-2 border-dashed rounded-2xl px-7 py-5 cursor-pointer transition-all duration-300 w-full md:w-80
                ${isDragActive
                  ? 'border-indigo-400 bg-indigo-500/10 scale-105'
                  : 'border-slate-700/60 hover:border-indigo-500/60 hover:bg-slate-800/40 hover:-translate-y-0.5'
                }`}
            >
              <input {...getInputProps()} />
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 transition-colors ${loading ? 'bg-indigo-500/30 animate-pulse' : 'bg-indigo-500/15'}`}>
                  {loading
                    ? <RefreshCw size={26} className="text-indigo-400 animate-spin"/>
                    : <UploadCloud size={26} className="text-indigo-400"/>
                  }
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">
                    {loading ? 'Processing data…' : isDragActive ? 'Release to upload' : 'Upload Dataset'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Accepts .CSV &amp; .JSON files</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── EMPTY STATE ─────────────────────────── */}
        {areas.length === 0 && (
          <div className="text-center py-28 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl"/>
            <TrendingUp size={64} strokeWidth={1} className="mx-auto text-slate-700 mb-6"/>
            <h2 className="text-2xl font-black text-slate-300 mb-3">Awaiting Your Dataset</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              Upload a <span className="text-slate-300 font-semibold">.CSV</span> or <span className="text-slate-300 font-semibold">.JSON</span> file with
              fields: <code className="bg-slate-800 px-1 rounded text-xs text-indigo-300">area_name</code>,&nbsp;
              <code className="bg-slate-800 px-1 rounded text-xs text-indigo-300">price_growth</code>,&nbsp;
              <code className="bg-slate-800 px-1 rounded text-xs text-indigo-300">listing_density</code>,&nbsp;
              <code className="bg-slate-800 px-1 rounded text-xs text-indigo-300">infrastructure_score</code>
            </p>
            <p className="text-slate-600 mt-4 text-xs">
              Default demo data loads automatically when backend is running.
            </p>
          </div>
        )}

        {/* ── DASHBOARD ───────────────────────────── */}
        {areas.length > 0 && (
          <div className="space-y-8">

            {/* ── STAT CARDS ──────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Total Areas */}
              <StatCard icon={<Building2 size={20}/>} label="Total Areas" value={areas.length} color="indigo" />
              {/* High Growth — Red */}
              <StatCard icon={<TrendingUp size={20}/>} label="High Growth" value={highCount} color="red" />
              {/* Medium Growth — Yellow */}
              <StatCard icon={<Activity size={20}/>} label="Medium Growth" value={mediumCount} color="yellow" />
              {/* Low Growth — Green */}
              <StatCard icon={<MapPin size={20}/>} label="Low Growth" value={lowCount} color="green" />
              {/* Undervalued */}
              <StatCard icon={<AlertTriangle size={20}/>} label="Undervalued" value={undervaluedCount} color="amber" sub="High infra, low price" />
            </div>

            {/* ── TABS ────────────────────────────── */}
            <div className="flex gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60 w-fit">
              {['overview', 'table', 'map'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200
                    ${activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ────────────────────── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Bar Chart — Top 5 */}
                <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-lg p-6 rounded-3xl border border-slate-800/60 shadow-xl flex flex-col h-[420px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <Star size={18} className="text-yellow-400"/> Top 5 Growth Areas
                    </h3>
                    <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full">Avg Score: <span className="text-white font-bold">{avgScore}</span></span>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topAreas} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b"/>
                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false}/>
                        <YAxis dataKey="area_name" type="category" width={145} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CustomBarTooltip/>} cursor={{ fill: '#1e293b60' }}/>
                        <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={26}>
                          {topAreas.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={getCategoryTheme(entry.category).fill}/>
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart — distribution */}
                <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-lg p-6 rounded-3xl border border-slate-800/60 shadow-xl flex flex-col h-[420px]">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-cyan-400"/> Category Distribution
                  </h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} stroke="transparent"/>
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
                          formatter={(v, n) => [v + ' areas', n]}
                        />
                        <Legend
                          iconType="circle"
                          formatter={(v) => <span className="text-slate-400 text-sm">{v}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend color reference */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg py-2">
                      <div className="font-black text-red-400 text-lg">{highCount}</div>
                      <div className="text-slate-500">High</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg py-2">
                      <div className="font-black text-yellow-400 text-lg">{mediumCount}</div>
                      <div className="text-slate-500">Medium</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg py-2">
                      <div className="font-black text-green-400 text-lg">{lowCount}</div>
                      <div className="text-slate-500">Low</div>
                    </div>
                  </div>
                </div>

                {/* Top 5 ranked cards */}
                <div className="lg:col-span-12">
                  <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <Star size={18} className="text-indigo-400"/> Top Growth Ranking
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {topAreas.map((area, i) => {
                      const theme = getCategoryTheme(area.category);
                      return (
                        <div key={i} className={`bg-slate-900/70 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 shadow-lg ${theme.glow}`}>
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-2xl font-black text-slate-600">#{i + 1}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${theme.badge}`}>{area.category}</span>
                          </div>
                          <p className="font-bold text-white text-sm mb-1 leading-tight">{area.area_name}</p>
                          {area.undervalued && (
                            <p className="text-amber-400 text-xs flex items-center gap-1 mb-2"><AlertTriangle size={10}/> Undervalued</p>
                          )}
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <span className="text-2xl font-black" style={{ color: theme.fill }}>{area.score.toFixed(2)}</span>
                            <span className="text-slate-500 text-xs ml-1">/ 10</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── TABLE TAB ───────────────────────── */}
            {activeTab === 'table' && (
              <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800/60 overflow-hidden shadow-2xl">
                <div className="px-8 py-5 border-b border-slate-800/60 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <MapPin size={18} className="text-cyan-400"/> All Areas · Growth Data
                  </h3>
                  <span className="text-xs text-slate-500">{areas.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold">#</th>
                        <th className="px-6 py-4 font-semibold">Area Name</th>
                        <th className="px-6 py-4 font-semibold">Price Growth</th>
                        <th className="px-6 py-4 font-semibold">Listing Density</th>
                        <th className="px-6 py-4 font-semibold">Infra Score</th>
                        <th className="px-6 py-4 font-semibold">G Score</th>
                        <th className="px-6 py-4 font-semibold">Category</th>
                        <th className="px-6 py-4 font-semibold">Undervalued?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {[...areas].sort((a, b) => b.score - a.score).map((area, idx) => {
                        const theme = getCategoryTheme(area.category);
                        return (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors duration-150">
                            <td className="px-6 py-4 text-slate-600 font-bold">{idx + 1}</td>
                            <td className="px-6 py-4 font-semibold text-slate-200 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${theme.dot}`}/>
                              {area.area_name}
                            </td>
                            <td className="px-6 py-4 text-slate-300">{area.price_growth}</td>
                            <td className="px-6 py-4 text-slate-300">{area.listing_density}</td>
                            <td className="px-6 py-4 text-slate-300">{area.infrastructure_score}</td>
                            <td className="px-6 py-4 font-black text-white">{area.score.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${theme.badge}`}>
                                {area.category.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {area.undervalued
                                ? <span className="text-amber-400 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12}/> YES</span>
                                : <span className="text-slate-600 text-xs">—</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Formula note */}
                <div className="px-8 py-4 border-t border-slate-800/60 bg-slate-950/30">
                  <p className="text-slate-500 text-xs">
                    <span className="text-slate-400 font-bold">Formula:</span>&nbsp;
                    G = 0.4 × price_growth + 0.3 × listing_density + 0.3 × infrastructure_score
                    <span className="mx-3 text-slate-700">|</span>
                    <span className="text-red-400">■ High</span> &gt; 7&nbsp;&nbsp;
                    <span className="text-yellow-400">■ Medium</span> 4–7&nbsp;&nbsp;
                    <span className="text-green-400">■ Low</span> &lt; 4
                  </p>
                </div>
              </div>
            )}

            {/* ── MAP TAB ─────────────────────────── */}
            {activeTab === 'map' && (
              <div className="bg-slate-900/60 p-2 rounded-3xl border border-slate-800/60 shadow-2xl">
                <div className="relative h-[580px] rounded-[1.25rem] overflow-hidden">
                  <MapContainer center={[30.7333, 76.7794]} zoom={11} scrollWheelZoom={true} className="h-full w-full">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
                    <UpdateMapCenter areas={areas}/>
                    {areas.map((area, idx) => (
                      <Marker key={idx} position={[area.lat, area.lng]} icon={makeIcon(area.category)}>
                        <Popup>
                          <div className="font-sans text-slate-800 min-w-[170px]">
                            <strong className="text-base text-slate-900 block mb-2">{area.area_name}</strong>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">Score</span><span className="font-black">{area.score.toFixed(2)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Price Growth</span><span>{area.price_growth}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Listing Density</span><span>{area.listing_density}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Infra Score</span><span>{area.infrastructure_score}</span></div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className={`px-2 py-1 rounded text-xs font-black
                                ${area.category === 'High' ? 'bg-red-100 text-red-700' : area.category === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {area.category.toUpperCase()}
                              </span>
                              {area.undervalued && <span className="text-amber-600 font-bold text-xs flex items-center gap-1"><AlertTriangle size={11}/> Undervalued</span>}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* Map legend overlay */}
                  <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur rounded-xl border border-slate-700/60 px-4 py-3 text-xs space-y-1.5">
                    <div className="text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">Legend</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/><span className="text-slate-300">High Growth</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"/><span className="text-slate-300">Medium Growth</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/><span className="text-slate-300">Low Growth</span></div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── FOOTER ──────────────────────────────── */}
        <footer className="text-center text-slate-700 text-xs py-4">
          Urban Matrix AI · Predictive Urban Growth Engine · Built with React + Express
        </footer>
      </div>
    </div>
  );
}

// ── StatCard component ────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  const colors = {
    indigo: { bg: 'from-indigo-950/40 to-slate-900', border: 'border-indigo-900/40 hover:border-indigo-700/50', text: 'text-indigo-400', icon: 'bg-indigo-500/15 text-indigo-400' },
    red:    { bg: 'from-red-950/40 to-slate-900',    border: 'border-red-900/40 hover:border-red-700/50',       text: 'text-red-400',    icon: 'bg-red-500/15 text-red-400' },
    yellow: { bg: 'from-yellow-950/40 to-slate-900', border: 'border-yellow-900/40 hover:border-yellow-700/50', text: 'text-yellow-400', icon: 'bg-yellow-500/15 text-yellow-400' },
    green:  { bg: 'from-green-950/40 to-slate-900',  border: 'border-green-900/40 hover:border-green-700/50',   text: 'text-green-400',  icon: 'bg-green-500/15 text-green-400' },
    amber:  { bg: 'from-amber-950/40 to-slate-900',  border: 'border-amber-900/40 hover:border-amber-700/50',   text: 'text-amber-400',  icon: 'bg-amber-500/15 text-amber-400' },
  };
  const c = colors[color] || colors.indigo;
  return (
    <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 transition-all duration-200 shadow-lg`}>
      <div className={`w-8 h-8 rounded-lg ${c.icon} flex items-center justify-center mb-3`}>{icon}</div>
      <div className={`text-3xl font-black ${c.text} mb-1`}>{value}</div>
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
}
