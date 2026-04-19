import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { UploadCloud, Building2, TrendingUp, AlertTriangle, Layers, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE = 'https://urbandev-qtph.onrender.com/api';

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

export default function App() {
  const [areas, setAreas] = useState([]);
  const [topAreas, setTopAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [{ data: all }, { data: top }] = await Promise.all([
        axios.get(`${API_BASE}/areas`),
        axios.get(`${API_BASE}/top`)
      ]);
      setAreas(all);
      setTopAreas(top);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    try {
      await axios.post(`${API_BASE}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadData();
    } catch (error) { alert('Failed to upload. Ensure server is running.'); } 
    finally { setLoading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] } });

  const getCategoryTheme = (category) => {
    switch(category) {
      case 'High': return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', fill: '#10b981' };
      case 'Medium': return { badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', fill: '#f59e0b' };
      case 'Low': return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', fill: '#f43f5e' };
      default: return { badge: 'bg-slate-800 text-slate-300 border border-slate-700', fill: '#94a3b8' };
    }
  };

  const highGrowthCount = areas.filter(a => a.category === 'High').length;
  const undervaluedCount = areas.filter(a => a.undervalued).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header - Glassmorphism */}
        <header className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-800/60 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
          
          <div className="mb-6 md:mb-0 relative z-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-3 tracking-tight">
              <Layers className="text-indigo-400" size={36} strokeWidth={2.5} />
              Urban Matrix AI
            </h1>
            <p className="text-slate-400 mt-2 font-medium tracking-wide">Predictive Real Estate Intelligence</p>
          </div>
          
          <div {...getRootProps()} className={`relative z-10 border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-300 w-full md:w-80 ${isDragActive ? 'border-indigo-400 bg-indigo-500/10 scale-105' : 'border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-800/50 hover:-translate-y-1'}`}>
            <input {...getInputProps()} />
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 p-3 rounded-xl text-indigo-400 shadow-inner">
                 <UploadCloud size={28} strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-slate-200">{loading ? 'Processing...' : 'Drop Intelligence Node'}</p>
                <p className="text-xs text-slate-400 font-medium">Accepts .CSV and .JSON</p>
              </div>
            </div>
          </div>
        </header>

        {areas.length === 0 ? (
          <div className="text-center py-32 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-2xl relative overflow-hidden">
            <TrendingUp size={72} strokeWidth={1} className="mx-auto text-slate-700 mb-6 drop-shadow-md" />
            <h2 className="text-3xl font-black text-slate-300 tracking-tight">System Awaiting Telemetry</h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto font-medium">Upload geospatial datasets to initialize predictive modeling algorithms and map infrastructure scores.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 p-8 rounded-3xl shadow-xl border border-slate-800/60 flex flex-col justify-center relative overflow-hidden hover:border-slate-700 transition-colors">
                <div className="text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Nodes Analyzed</div>
                <div className="text-5xl font-black text-white">{areas.length}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900/80 p-8 rounded-3xl shadow-xl border border-emerald-900/30 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-700/50 transition-colors">
                 <div className="absolute top-0 right-0 p-6 opacity-5 flex text-emerald-500 transform group-hover:scale-110 transition-transform duration-500"><TrendingUp size={80} /></div>
                <div className="text-xs font-bold text-emerald-500/70 mb-2 tracking-widest uppercase">High Growth Zones</div>
                <div className="text-5xl font-black text-emerald-400">{highGrowthCount}</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/80 p-8 rounded-3xl shadow-xl border border-indigo-900/30 flex flex-col justify-center relative overflow-hidden group hover:border-indigo-700/50 transition-colors">
                <div className="text-xs font-bold text-indigo-400/70 mb-2 tracking-widest uppercase">Undervalued Targets</div>
                <div className="text-5xl font-black text-indigo-400 flex items-center gap-3">
                  {undervaluedCount}
                  {undervaluedCount > 0 && <AlertTriangle size={32} strokeWidth={2.5} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Chart */}
              <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-slate-800/60 flex flex-col h-[480px]">
                <h3 className="text-xl font-bold mb-8 text-slate-200 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-400"/> Top Growth Profiles</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topAreas} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                      <XAxis type="number" hide={true} />
                      <YAxis dataKey="area_name" type="category" width={120} tick={{ fontSize: 13, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} />
                      <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={28}>
                        {topAreas.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={getCategoryTheme(entry.category).fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Map */}
              <div className="lg:col-span-7 bg-slate-900/50 p-2 rounded-3xl shadow-2xl border border-slate-800/60 flex flex-col h-[480px] relative z-0">
                <div className="flex-1 rounded-[1.25rem] overflow-hidden relative z-0 bg-slate-950">
                  <MapContainer center={[30.7333, 76.7794]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <UpdateMapCenter areas={areas} />
                    {areas.map((area, idx) => (
                      <Marker key={idx} position={[area.lat, area.lng]}>
                        <Popup className="rounded-xl custom-popup">
                          <div className="font-sans text-slate-800 min-w-[150px]">
                            <strong className="text-lg text-slate-900 mb-1 block">{area.area_name}</strong>
                            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                                <span className="text-gray-500">Growth Index</span>
                                <span className="font-bold">{area.score.toFixed(2)}</span>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-xs font-black ${area.category === 'High' ? 'bg-emerald-100 text-emerald-700' : area.category === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{area.category.toUpperCase()}</span>
                                {area.undervalued && <span className="text-indigo-600 font-bold text-xs flex items-center gap-1"><AlertTriangle size={12}/> Undervalued</span>}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-800/60 overflow-hidden">
              <div className="p-8 border-b border-slate-800/60 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2"><MapPin size={20} className="text-cyan-400"/> Regional Matrix Data</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/50 text-slate-400 font-semibold border-b border-slate-800/80">
                    <tr>
                      <th className="px-8 py-5">Node Identity</th>
                      <th className="px-8 py-5">Price Vector</th>
                      <th className="px-8 py-5">Density Matrix</th>
                      <th className="px-8 py-5">Infra Capacity</th>
                      <th className="px-8 py-5">AI Score</th>
                      <th className="px-8 py-5">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {areas.map((area, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors duration-200">
                        <td className="px-8 py-5 font-bold text-slate-200 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: getCategoryTheme(area.category).fill}}></span>
                            {area.area_name}
                            {area.undervalued && (
                                <span className="ml-2 font-black flex items-center gap-1 text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                    <AlertTriangle size={10} /> OP
                                </span>
                            )}
                        </td>
                        <td className="px-8 py-5 font-medium">{area.price_growth}</td>
                        <td className="px-8 py-5 font-medium">{area.listing_density}</td>
                        <td className="px-8 py-5 font-medium">{area.infrastructure_score}</td>
                        <td className="px-8 py-5 font-black text-slate-100">{area.score.toFixed(2)}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none ${getCategoryTheme(area.category).badge}`}>
                            {area.category.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
