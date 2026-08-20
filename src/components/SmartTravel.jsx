import React, { useState } from 'react';
import { Bus, Car, Navigation, ShieldAlert, Anchor, CheckCircle2, Clock, Radio, Compass, Shield } from 'lucide-react';

export const SmartTravel = ({ templeId = 'tmp_somnath' }) => {
  const [activeTab, setActiveTab] = useState(templeId);
  const [preferTrek, setPreferTrek] = useState(false);

  const parkingSlots = [
    { name: 'North Gate Parking (P1)', slots: '120/300 slots', percentage: 40, status: 'Available', color: 'bg-emerald-500' },
    { name: 'VIP South Gate (P2)', slots: '280/300 slots', percentage: 93, status: 'Nearly Full', color: 'bg-red-500' },
    { name: 'East Bus Stand (P3)', slots: '180/400 slots', percentage: 45, status: 'Available', color: 'bg-emerald-500' }
  ];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 bg-ivory min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-warm border border-maroon/10">
        <h2 className="text-xl font-bold font-heading text-maroon flex items-center gap-2">
          <Bus className="w-5 h-5 text-gold-dark" /> Smart Parking & Mobility Hub
        </h2>
        <p className="text-xs text-gray-500">Integrated GPS tracking, police traffic link & shuttle availability</p>
      </div>

      {/* Temple Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('tmp_somnath')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'tmp_somnath' ? 'bg-gold text-indigo-dark' : 'bg-white text-gray-600'
          }`}
        >
          Somnath
        </button>
        <button
          onClick={() => setActiveTab('tmp_dwarka')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'tmp_dwarka' ? 'bg-gold text-indigo-dark' : 'bg-white text-gray-600'
          }`}
        >
          Dwarka (Boat)
        </button>
        <button
          onClick={() => setActiveTab('tmp_ambaji')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'tmp_ambaji' ? 'bg-gold text-indigo-dark font-black shadow-goldGlow' : 'bg-white text-gray-600'
          }`}
        >
          Ambaji
        </button>
        <button
          onClick={() => setActiveTab('tmp_pavagadh')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'tmp_pavagadh' ? 'bg-gold text-indigo-dark font-black shadow-goldGlow' : 'bg-white text-gray-600'
          }`}
        >
          Pavagadh (Ropeway)
        </button>
      </div>

      {/* Transit Hub & Connectivity Details Card */}
      {(() => {
        const transitInfo = {
          tmp_somnath: {
            rail: 'Somnath Station (SMNH - 1.2 km) / Veraval Junction (VRL - 5.8 km)',
            air: 'Diu Airport (DIU - 82 km)',
            bus: 'Multi-Modal Bus Port & Veneshwar E-Train Terminal'
          },
          tmp_ambaji: {
            rail: 'Abu Road Station (ABR - 21 km) / Palanpur Junction (PNU - 62 km)',
            air: 'Ahmedabad International Airport (AMD - 180 km)',
            bus: 'Ambaji GSRTC Bus Stand (800m Roofed Walkway) & Gabbar Ropeway'
          },
          tmp_dwarka: {
            rail: 'Dwarka Station (DWK - 2.5 km) / Okha Station (30 km)',
            air: 'Jamnagar Airport (JGA - 135 km)',
            bus: 'Dwarka Bus Stand (800m) & Okha Boat Ferry Pier'
          },
          tmp_pavagadh: {
            rail: 'Halol Junction (12 km) / Vadodara Station (BRC - 48 km)',
            air: 'Vadodara Airport (BDQ - 45 km)',
            bus: 'Machi Base Ropeway Terminal Bus Stand'
          }
        }[activeTab || 'tmp_somnath'];

        return (
          <div className="bg-gradient-to-r from-amber-950 via-maroon to-amber-900 text-white p-4 rounded-2xl border-2 border-gold/70 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-gold text-indigo-dark px-2.5 py-0.5 rounded-md font-heading">
                🚆 TRANSIT HUB CONNECTIVITY
              </span>
              <span className="text-[10px] text-amber-300 font-mono">Live Station Link</span>
            </div>
            <div className="space-y-1 text-xs pt-1">
              <p><strong className="text-amber-300">Railway:</strong> {transitInfo.rail}</p>
              <p><strong className="text-amber-300">Airport:</strong> {transitInfo.air}</p>
              <p><strong className="text-amber-300">Shuttle/Bus:</strong> {transitInfo.bus}</p>
            </div>
          </div>
        );
      })()}

      {/* Simplified Stylized Map Display */}
      <div className="bg-indigo-dark rounded-2xl p-4 text-white shadow-md relative overflow-hidden h-44 flex flex-col justify-between border border-gold/30">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#E3A32A_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider bg-gold text-indigo-dark px-2 py-0.5 rounded-md">
            GPS Live Map
          </span>
          <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Tracking
          </span>
        </div>

        {/* Map Dots Visual */}
        <div className="relative z-10 my-auto flex items-center justify-around">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400 mx-auto flex items-center justify-center font-bold text-xs">
              P1
            </div>
            <span className="text-[10px] text-gray-300 mt-1 block">Gate 1</span>
          </div>

          <div className="w-16 h-0.5 bg-dashed border-b border-gold/50 relative">
            <Bus className="w-4 h-4 text-gold absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse" />
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-gold/20 text-gold border border-gold mx-auto flex items-center justify-center font-bold text-xs shadow-goldGlow">
              🏛️
            </div>
            <span className="text-[10px] text-gold font-bold mt-1 block">Sanctum</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] text-gray-300">
          <span>Route: Electric Shuttle #4 En-route</span>
          <span className="text-gold font-bold">ETA: 6 mins</span>
        </div>
      </div>

      {/* Parking Availability Card */}
      <div className="bg-white p-4 rounded-2xl shadow-warm border border-gray-100 space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Car className="w-4 h-4 text-maroon" /> Intelligent Parking Availability
        </h3>
        {parkingSlots.map((p, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{p.name}</span>
              <span className="text-gray-500">{p.slots}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${p.color}`} style={{ width: `${p.percentage}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Conditional Card: Dwarka Boat Crossing */}
      {activeTab === 'tmp_dwarka' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-dark text-white p-4 rounded-2xl shadow-md space-y-2 border border-blue-400/30">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
            <Anchor className="w-4 h-4" /> Bet Dwarka Boat Ferry Status
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-bold text-white">Next Boat Departure: 02:30 PM</p>
              <p className="text-[11px] text-blue-200">Adjusted for High Tide window</p>
            </div>
            <span className="bg-blue-500/20 border border-blue-400 text-blue-200 text-xs px-2.5 py-1 rounded-lg font-mono font-bold">
              Tide Normal
            </span>
          </div>
        </div>
      )}

      {/* Conditional Card: Pavagadh Ropeway */}
      {activeTab === 'tmp_pavagadh' && (
        <div className="bg-gradient-to-r from-amber-900 to-maroon text-white p-4 rounded-2xl shadow-md space-y-3 border border-gold/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gold uppercase tracking-wider">
              Udanchhatroo Ropeway Pass
            </span>
            <span className="text-[10px] bg-gold text-indigo-dark font-bold px-2 py-0.5 rounded-full">
              Wait: 15 mins
            </span>
          </div>
          <p className="text-xs text-gray-200">Next batch boarding at Station 2</p>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span>Prefer Trekking Staircase Route?</span>
            <button
              onClick={() => setPreferTrek(!preferTrek)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                preferTrek ? 'bg-gold text-indigo-dark' : 'bg-white/20 text-white'
              }`}
            >
              {preferTrek ? 'Trek Active (Checkpoints)' : 'Enable Trek Mode'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
