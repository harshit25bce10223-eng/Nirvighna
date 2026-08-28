/**
 * Sanjeevani Path Visual Evacuation Route Renderer
 * Renders an animated SVG floor-plan graph showing the exact turn-by-turn path 
 * from the patient's location through the temple's secret emergency passage to the waiting ICU Ambulance Bay.
 */

import React from 'react';
import { Navigation, DoorOpen, CheckCircle, MapPin, ArrowRight, ShieldCheck, Unlock } from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';

export const SanjeevaniPathRenderer = ({ evacPlan, templeId = 'tmp_somnath' }) => {
  const temple = getTempleById(templeId) || { name: 'Somnath Temple' };

  if (!evacPlan) return null;

  return (
    <div className="bg-[#1C1617] border border-amber-900/40 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider font-heading">
                SANJEEVANI PATH — SECRET EVACUATION CONDUIT
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                DOOR UNLOCKED 🟢
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Secret Door: <strong className="text-white">{evacPlan.destinationExit}</strong> • Passage: <strong className="text-amber-300">{evacPlan.hiddenPassageName || 'Subterranean Corridor'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
            ETA: {evacPlan.estEvacuationMinutes || '1.8 min'} ({evacPlan.distanceMeters || 140}m)
          </span>
        </div>
      </div>

      {/* SVG FLOOR-PLAN GRAPH WITH ANIMATED ROUTE PATH */}
      <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-white/10 p-4">
        <svg viewBox="0 0 600 200" className="w-full h-44 sm:h-48">
          {/* Background Grid */}
          <pattern id="sanjeevani_grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
          <rect width="600" height="200" fill="url(#sanjeevani_grid)" />

          {/* Temple Hall Silhouette Outlines */}
          <rect x="30" y="20" width="540" height="160" rx="16" fill="none" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="180" y1="20" x2="180" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="380" y1="20" x2="380" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Connected Path Line with Pulsing Gold Dash */}
          <path
            d="M 70 100 L 210 65 L 390 135 L 530 100"
            fill="none"
            stroke="rgba(16, 185, 129, 0.3)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 70 100 L 210 65 L 390 135 L 530 100"
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="8 6"
          />

          {/* START NODE: Patient Location */}
          <g transform="translate(70, 100)">
            <circle r="18" fill="rgba(239, 68, 68, 0.25)" className="animate-ping" />
            <circle r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="26" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
              Patient Location
            </text>
          </g>

          {/* WAYPOINT 1: Secret Staff Bypass Conduit */}
          <g transform="translate(210, 65)">
            <circle r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="-12" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="bold">
              Secret Passage
            </text>
          </g>

          {/* WAYPOINT 2: Paramedic Transit Corridor */}
          <g transform="translate(390, 135)">
            <circle r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="22" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="bold">
              Isolated Corridor
            </text>
          </g>

          {/* DESTINATION NODE: Secret Emergency Exit Door & Ambulance Bay */}
          <g transform="translate(530, 100)">
            <rect x="-16" y="-16" width="32" height="32" rx="8" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="28" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">
              Ambulance Bay
            </text>
          </g>
        </svg>
      </div>

      {/* TURN-BY-TURN STEP-BY-STEP CARDS */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Turn-by-Turn Secret Door Evacuation Guidance
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {evacPlan.pathSteps.map((step, idx) => (
            <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-mono space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block uppercase">Stage {idx + 1}</span>
              <p className="text-white text-[11px] leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
