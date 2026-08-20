/**
 * Sanjeevani Path Visual Evacuation Route Renderer
 * Renders an animated SVG floor-plan graph showing the exact turn-by-turn path 
 * from the patient's location to the nearest staff-only emergency exit gate.
 */

import React from 'react';
import { Navigation, DoorOpen, CheckCircle, MapPin, ArrowRight } from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';

export const SanjeevaniPathRenderer = ({ evacPlan, templeId = 'tmp_somnath' }) => {
  const temple = getTempleById(templeId);

  if (!evacPlan) return null;

  return (
    <div className="bg-[#250d12] border border-amber-900/40 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              SANJEEVANI PATH — LIVE EVACUATION ROUTE
            </h4>
            <p className="text-xs text-slate-400">Target: <strong className="text-white">{evacPlan.destinationExit}</strong> (Unlocked Staff Gate)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
            Est: {evacPlan.estEvacuationMinutes}
          </span>
        </div>
      </div>

      {/* SVG FLOOR-PLAN GRAPH WITH ANIMATED ROUTE PATH */}
      <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-white/10 p-3">
        <svg viewBox="0 0 500 200" className="w-full h-44">
          {/* Background Grid */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
          <rect width="500" height="200" fill="url(#grid)" />

          {/* Connected Path Edges */}
          <path
            d="M 60 100 L 190 60 L 330 140 L 440 100"
            fill="none"
            stroke="rgba(245, 158, 11, 0.3)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 60 100 L 190 60 L 330 140 L 440 100"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="8 4"
          />

          {/* START NODE: Patient Location */}
          <g transform="translate(60, 100)">
            <circle r="16" fill="rgba(239, 68, 68, 0.2)" className="animate-ping" />
            <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="24" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
              Patient
            </text>
          </g>

          {/* WAYPOINT 1: Staff Bypass Corridor */}
          <g transform="translate(190, 60)">
            <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            <text x="0" y="-12" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="bold">
              Bypass Ramp
            </text>
          </g>

          {/* WAYPOINT 2: Queue Corridor 2 */}
          <g transform="translate(330, 140)">
            <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            <text x="0" y="20" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="bold">
              Med Checkpoint
            </text>
          </g>

          {/* DESTINATION NODE: Staff Emergency Exit Gate */}
          <g transform="translate(440, 100)">
            <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="26" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
              {evacPlan.destinationExitId || 'Staff Gate'}
            </text>
          </g>
        </svg>
      </div>

      {/* TURN-BY-TURN STEP-BY-STEP CARDS */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-300">Turn-by-Turn Medical Route Guidance</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {evacPlan.pathSteps.map((step, idx) => (
            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-mono space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block uppercase">Step {idx + 1}</span>
              <p className="text-white text-[11px] leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
