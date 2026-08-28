import React, { useState, useEffect, useRef } from 'react';
import { Layers, MapPin, Users, Activity, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { templeAIConfigEngine } from '../lib/templeAIConfigEngine';

export const Shrine3DIsometricMap = ({ templeId = 'tmp_somnath' }) => {
  const [selectedGate, setSelectedGate] = useState(null);
  const [liveDensityScore, setLiveDensityScore] = useState(78);
  const canvasRef = useRef(null);

  const gates = [
    { id: 'gate_1', name: 'Swarga Dwar (Main Gate 1)', x: 120, y: 160, load: 88, density: 4.8, status: 'HIGH', flowRate: 140 },
    { id: 'gate_2', name: 'Moksha Dwar (Gate 2)', x: 380, y: 140, load: 42, density: 2.1, status: 'NORMAL', flowRate: 90 },
    { id: 'gate_3', name: 'VIP & Senior Gate 3', x: 250, y: 280, load: 25, density: 1.2, status: 'CLEAR', flowRate: 35 },
    { id: 'gate_4', name: 'North Sea Corridor Gate 4', x: 150, y: 320, load: 64, density: 3.2, status: 'MODERATE', flowRate: 110 }
  ];

  const volunteers = [
    { id: 'v1', name: 'Insp. V. Patel', gate: 'Gate 1 Plaza', x: 140, y: 180 },
    { id: 'v2', name: 'Marshal R. Sharma', gate: 'Sanctum Queue', x: 260, y: 200 },
    { id: 'v3', name: 'Vol. A. Desai', gate: 'Gate 2 Exit', x: 360, y: 160 }
  ];

  // Render 3D Isometric Map onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    let pulse = 0;

    const renderMap = () => {
      pulse += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Grid Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Isometric Shrine Courtyard Base Polygon
      ctx.beginPath();
      ctx.moveTo(250, 60);
      ctx.lineTo(440, 180);
      ctx.lineTo(250, 360);
      ctx.lineTo(60, 240);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Sanctum Sanctorum (Garbhagriha 3D Box)
      const cx = 250, cy = 200, sz = 40;
      ctx.fillStyle = 'rgba(217, 119, 6, 0.8)';
      ctx.fillRect(cx - sz, cy - sz, sz * 2, sz * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(cx - sz, cy - sz, sz * 2, sz * 2);

      // Label Sanctum
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SANCTUM SANCTORUM', cx, cy + 4);

      // Draw Live Crowd Density Heat Pulsing Rings & Flow Arrows for Gates
      gates.forEach((g) => {
        const ringRadius = 18 + Math.sin(pulse) * 4;
        const color = g.load > 80 ? 'rgba(239, 68, 68, ' : g.load > 50 ? 'rgba(245, 158, 11, ' : 'rgba(16, 185, 129, ';

        // Heat ring
        ctx.beginPath();
        ctx.arc(g.x, g.y, ringRadius, 0, Math.PI * 2);
        ctx.fillStyle = color + '0.25)';
        ctx.fill();
        ctx.strokeStyle = color + '0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Vector Flow Direction Arrow to Sanctum
        const dx = cx - g.x;
        const dy = cy - g.y;
        const angle = Math.atan2(dy, dx);
        const arrowX = g.x + Math.cos(angle) * 35;
        const arrowY = g.y + Math.sin(angle) * 35;

        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(arrowX, arrowY);
        ctx.strokeStyle = color + '0.9)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Gate Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(g.name.split(' ')[0], g.x, g.y - 24);
        ctx.fillStyle = color + '1.0)';
        ctx.fillText(`${g.density} p/m²`, g.x, g.y + 30);
      });

      // Draw Volunteer Location Pins
      volunteers.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animFrame = requestAnimationFrame(renderMap);
    };

    renderMap();
    return () => cancelAnimationFrame(animFrame);
  }, [templeId]);

  return (
    <div className="bg-slate-950 border border-amber-900/30 rounded-2xl p-4 text-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-md">
            GIS 3D ISOMETRIC SHRINE VECTOR MAP
          </span>
          <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Live Crowd Density & Vector Flow Overlay
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-400">Critical (&gt;4.5/m²)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Clear (&lt;2.0/m²)</span>
          </div>
        </div>
      </div>

      {/* Canvas Map Container */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-white/10 flex justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={380}
          className="cursor-pointer max-w-full"
          onClick={(e) => {
            const rect = e.target.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const clicked = gates.find((g) => Math.hypot(g.x - clickX, g.y - clickY) < 30);
            if (clicked) setSelectedGate(clicked);
          }}
        />

        {/* Selected Gate Inspection Overlay Card */}
        {selectedGate && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-bottom">
            <div>
              <p className="font-bold text-amber-400">{selectedGate.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Density: {selectedGate.density} p/m² | Flow Rate: {selectedGate.flowRate} pilgrims/min
              </p>
            </div>
            <button
              onClick={() => setSelectedGate(null)}
              className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-bold hover:bg-amber-500/30"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Gate Load Summary Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {gates.map((g) => (
          <div
            key={g.id}
            onClick={() => setSelectedGate(g)}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              g.load > 80
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                : g.load > 50
                ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <p className="text-[10px] text-slate-400 font-mono truncate">{g.name}</p>
            <p className="font-extrabold text-sm text-white mt-0.5">{g.density} <span className="text-[10px] text-slate-400 font-normal">p/m²</span></p>
            <p className={`text-[10px] font-bold mt-0.5 ${g.load > 80 ? 'text-red-400' : 'text-emerald-400'}`}>
              {g.status} LOAD ({g.load}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
