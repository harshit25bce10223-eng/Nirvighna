import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layers, MapPin, ZoomIn, ZoomOut, RotateCcw, Waves, Mountain, Cable } from 'lucide-react';
import { getTempleById, getLocalizedTempleName } from '../lib/templeRegistry';

const TAU = Math.PI * 2;

const TEMPLE_LAYOUTS = {
  tmp_somnath: {
    terrain: 'seafront',
    features: [
      { id: 'shrine', type: 'shrine', x: 0.4, y: -0.1, label: 'Somnath Shikhara', short: 'Shrine', zoneId: null },
      { id: 'plinth', type: 'plinth', x: 0.4, y: -0.1 },
      { id: 'maha_gate', type: 'gate', x: -2.3, y: 2.1, label: 'Mahapravesh Dwar', short: 'Main Gate', gateId: 'som_g1', zoneId: 'zone_som_1', size: 1.0 },
      { id: 'wheel_gate', type: 'gate', x: 2.7, y: 1.7, label: 'Wheelchair Gate', short: 'Priority', gateId: 'som_g2', zoneId: 'zone_som_2', size: 0.8 },
      { id: 'promenade', type: 'sea', x: 0.5, y: 4.4, label: 'Seafront Promenade', short: 'Arabian Sea', zoneId: 'zone_som_3' },
      { id: 'triveni', type: 'ghat', x: -1.5, y: 3.9, label: 'Triveni Sangam Ghat', short: 'Ghat', zoneId: null },
      { id: 'prasad', type: 'pavilion', x: 2.6, y: -2.4, label: 'Prasad Counter', short: 'Prasad', zoneId: 'zone_som_4' },
      { id: 'las_ground', type: 'plaza', x: -2.9, y: -1.9, label: 'Light & Sound Show Ground', short: 'Show Ground', zoneId: 'zone_som_5' },
      { id: 'annakshetra', type: 'pavilion', x: 0.1, y: -3.3, label: 'Annakshetra Kitchen', short: 'Kitchen', zoneId: null },
      { id: 'parking', type: 'parking', x: 3.5, y: -3.5, label: 'Pilgrim Parking Lots', short: 'Parking' }
    ],
    sea: { x: 0.5, y: 5.0, w: 9.5, d: 3.0 }
  },
  tmp_dwarka: {
    terrain: 'river',
    features: [
      { id: 'shrine', type: 'shrine', x: 0.3, y: -0.6, label: 'Jagat Mandir Shikhara', short: 'Shrine', zoneId: null },
      { id: 'plinth', type: 'plinth', x: 0.3, y: -0.6 },
      { id: 'swarga', type: 'gate', x: -2.5, y: 0.9, label: 'Swarga Dwar', short: 'Entry 56 Steps', gateId: 'dwa_g1', zoneId: 'zone_dwa_1', size: 1.0 },
      { id: 'moksha', type: 'gate', x: 3.0, y: -1.8, label: 'Moksha Dwar', short: 'Exit Market Side', gateId: 'dwa_g2', zoneId: 'zone_dwa_2', size: 1.0 },
      { id: 'gomti', type: 'ghat', x: -1.5, y: 2.6, label: 'Gomti Ghat Steps', short: 'Ghat', zoneId: 'zone_dwa_3' },
      { id: 'setu', type: 'bridge', x: 1.4, y: 2.6, label: 'Sudama Setu', short: 'Footbridge', zoneId: 'zone_dwa_4' },
      { id: 'ferry', type: 'ferry', x: 3.6, y: 3.1, label: 'Okha Ferry Pier', short: 'Bet Dwarka Boat', zoneId: 'zone_dwa_5' },
      { id: 'lockers', type: 'pavilion', x: 3.0, y: -2.9, label: 'Lockers & Footwear', short: 'Lockers', zoneId: null },
      { id: 'rukmini', type: 'pavilion', x: 4.7, y: -3.6, label: 'Rukmini Devi Mandir', short: '~2 km', zoneId: null },
      { id: 'bazaar', type: 'plaza', x: 0.6, y: -3.4, label: 'Market Bazaar', short: 'Bazaar', zoneId: null }
    ],
    sea: { x: 0.6, y: 3.3, w: 10.5, d: 2.2 }
  },
  tmp_ambaji: {
    terrain: 'hillwest',
    features: [
      { id: 'shrine', type: 'shrine', x: -0.3, y: 0.5, label: 'Ambaji Temple', short: 'Visa Yantra', zoneId: null },
      { id: 'plinth', type: 'plinth', x: -0.3, y: 0.5 },
      { id: 'central', type: 'gate', x: -3.1, y: -0.5, label: 'Shakti Dwar - Central', short: 'Largest Gate', gateId: 'amb_g1', zoneId: 'zone_amb_1', size: 1.1 },
      { id: 'gate7', type: 'gate', x: -3.1, y: 1.5, label: 'Shakti Dwar Gate 7', short: 'VIP / Priority', gateId: 'amb_g2', zoneId: 'zone_amb_2', size: 0.9 },
      { id: 'side', type: 'gate', x: -3.1, y: -2.3, label: 'Shakti Dwar - Side Opening', short: 'Side Gate', gateId: 'amb_g3', zoneId: null, size: 0.7 },
      { id: 'chowk', type: 'plaza', x: 0.9, y: 1.2, label: 'Chachar Chowk', short: 'Courtyard', zoneId: 'zone_amb_3' },
      { id: 'gabbar', type: 'hill', x: 4.4, y: -0.8, label: 'Gabbar Hill', short: 'Udan Khatola', zoneId: 'zone_amb_4' },
      { id: 'ropeway', type: 'ropeway', x: 4.4, y: -0.8, base: [3.2, 0.6], top: [5.6, -2.2], label: 'Gabbar Ropeway', short: 'Cable Car' },
      { id: 'gabbar_top', type: 'marker', x: 5.6, y: -2.3, label: 'Gabbar Mata Shrine', short: 'Summit' },
      { id: 'parking', type: 'parking', x: -4.6, y: -0.4, label: 'Highway Parking (P1-P3)', short: 'Parking' }
    ]
  },
  tmp_pavagadh: {
    terrain: 'hill',
    features: [
      { id: 'hill', type: 'hill', x: 0.2, y: 0.6, label: 'Pavagadh Hill', short: 'Summit', zoneId: null },
      { id: 'shrine', type: 'shrine', x: -0.1, y: 1.1, label: 'Kalika Mata Shikhara', short: 'Hilltop Temple', zoneId: 'zone_pav_4' },
      { id: 'plinth', type: 'plinth', x: -0.1, y: 1.1 },
      { id: 'summit_q', type: 'plaza', x: -1.0, y: 1.3, label: 'Summit Stairs Queue', short: 'Queue', zoneId: 'zone_pav_3' },
      { id: 'machi', type: 'gate', x: -3.3, y: -2.6, label: 'Machi Haveli Ropeway', short: 'Boarding Station', gateId: 'pav_g1', zoneId: 'zone_pav_1', size: 1.1 },
      { id: 'ropeway', type: 'ropeway', x: -0.1, y: 1.1, base: [-3.3, -2.6], top: [-0.1, 1.1], label: 'Hill Ropeway', short: 'Cable Car' },
      { id: 'trek', type: 'gate', x: 3.2, y: -2.7, label: 'Trekking Base Entry', short: '~1800 Steps', gateId: 'pav_g2', zoneId: 'zone_pav_2', size: 0.9 },
      { id: 'trek_path', type: 'steps', x: 1.6, y: -0.8, label: 'Trekking Stairway', short: 'Stairs to Summit', zoneId: 'zone_pav_2' },
      { id: 'champaner', type: 'pavilion', x: 4.5, y: -3.7, label: 'Champaner Heritage (UNESCO)', short: 'Heritage City', zoneId: null },
      { id: 'patai', type: 'marker', x: -4.6, y: -1.5, label: 'Patai Waterfall Base', short: 'Waterfall', zoneId: null }
    ]
  }
};

const GATE_COLORS = {
  entry: '#22d3ee',
  exit: '#f472b6',
  entry_and_exit: '#38bdf8'
};

const DENSITY_META = (d) => {
  if (d > 0.72) return { pct: Math.min(96, Math.round(d * 100)), label: 'HIGH', color: '#ef4444' };
  if (d > 0.44) return { pct: Math.round(d * 100), label: 'MODERATE', color: '#f59e0b' };
  return { pct: Math.max(12, Math.round(d * 100)), label: 'CLEAR', color: '#10b981' };
};

const targetHints = {
  tmp_somnath: 'Shri Somnath Jyotirlinga · Veraval · Arabian Sea Coast',
  tmp_dwarka: 'Shri Dwarkadhish Jagat Mandir · Gomti Ghat · 56 Steps',
  tmp_ambaji: 'Shri Arasuri Ambaji Shakti Peeth · Gabbar Udan Khatola',
  tmp_pavagadh: 'Maa Kalika Mata · Pavagadh Hill · Machi Ropeway & Trek'
};

export const Shrine3DIsometricMap = ({ templeId = 'tmp_somnath' }) => {
  const canvasRef = useRef(null);
  const pulseRef = useRef({ angle: 0 });
  const posRef = useRef([]);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  const temple = useMemo(() => getTempleById(templeId), [templeId]);
  const layout = TEMPLE_LAYOUTS[templeId] || TEMPLE_LAYOUTS.tmp_somnath;

  const densityOf = (zoneId) => {
    const zone = temple.zones.find((z) => z.id === zoneId);
    return zone ? zone.baseDensity : 0.4;
  };

  const gates = useMemo(
    () => (temple.gates || []).map((g) => {
      const linked = layout.features.find((f) => f.gateId === g.id);
      const dens = densityOf(linked?.zoneId);
      return { ...g, density: dens, ...DENSITY_META(dens), linked };
    }),
    [temple, layout]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    posRef.current = [];

    const T = 32 * zoom;
    const OX = 320;
    const OY = 250;
    const proj = (x, y, h) => [OX + (x - y) * T, OY + (x + y) * T * 0.5 - h];

    const isoBox = (cx, cy, hw, hd, h, top, sideA, sideB) => {
      const n = proj(cx, cy - hd, h);
      const e = proj(cx + hw, cy, h);
      const s = proj(cx, cy + hd, h);
      const w = proj(cx - hw, cy, h);
      const n0 = proj(cx, cy - hd, 0);
      const e0 = proj(cx + hw, cy, 0);
      const w0 = proj(cx - hw, cy, 0);
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(n[0], n[1]);
      ctx.lineTo(e[0], e[1]);
      ctx.lineTo(s[0], s[1]);
      ctx.lineTo(w[0], w[1]);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = sideA;
      ctx.beginPath();
      ctx.moveTo(n[0], n[1]);
      ctx.lineTo(e[0], e[1]);
      ctx.lineTo(e0[0], e0[1]);
      ctx.lineTo(n0[0], n0[1]);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = sideB;
      ctx.beginPath();
      ctx.moveTo(w[0], w[1]);
      ctx.lineTo(n[0], n[1]);
      ctx.lineTo(n0[0], n0[1]);
      ctx.lineTo(w0[0], w0[1]);
      ctx.closePath();
      ctx.fill();
    };

    const ellipse = (cx, cy, rx, ry, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      ctx.fill();
    };

    const label = (sx, sy, text, color = '#f8fafc', size = 10, weight = 'bold') => {
      ctx.font = `${weight} ${size}px 'Segoe UI', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(2,6,23,0.85)';
      ctx.strokeText(text, sx, sy);
      ctx.fillStyle = color;
      ctx.fillText(text, sx, sy);
    };

    const heatRing = (sx, sy, r, dens, pulse) => {
      const ring = r + Math.sin(pulse) * r * 0.22;
      const meta = DENSITY_META(dens);
      ctx.beginPath();
      ctx.arc(sx, sy, ring, 0, TAU);
      ctx.fillStyle = meta.color + '30';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, ring, 0, TAU);
      ctx.strokeStyle = meta.color + 'aa';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const flowArrow = (from, to, pulse, color = 'rgba(56,189,248,0.85)') => {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const len = Math.hypot(dx, dy);
      if (len < 10) return;
      const nx = dx / len;
      const ny = dy / len;
      const startT = (pulse * 0.05) % 1;
      const drawSeg = (s, e) => {
        ctx.beginPath();
        ctx.moveTo(from[0] + nx * s * len, from[1] + ny * s * len);
        ctx.lineTo(from[0] + nx * e * len, from[1] + ny * e * len);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      if (startT < 0.5) drawSeg(startT, startT + 0.28);
      else drawSeg(startT - 0.5, (startT - 0.5) + 0.28);
      const hx = from[0] + nx * (len - 14);
      const hy = from[1] + ny * (len - 14);
      ctx.beginPath();
      ctx.moveTo(hx + ny * 7, hy - nx * 7);
      ctx.lineTo(hx, hy);
      ctx.lineTo(hx - ny * 7, hy + nx * 7);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const renderMap = () => {
      const pulse = (pulseRef.current.angle += 0.045);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gw = Math.round((canvas.width / 22) / zoom);
      ctx.strokeStyle = 'rgba(148,163,184,0.07)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= canvas.width; gx += gw) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
      }
      for (let gy = 0; gy <= canvas.height; gy += gw) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
        ctx.stroke();
      }

      const corners = [-5.4, 5.4];
      const pts = [
        proj(corners[0], corners[0], 0),
        proj(corners[1], corners[0], 0),
        proj(corners[1], corners[1], 0),
        proj(corners[0], corners[1], 0)
      ];
      const gGrad = ctx.createLinearGradient(0, pts[0][1], 0, pts[2][1]);
      gGrad.addColorStop(0, 'rgba(71,85,105,0.5)');
      gGrad.addColorStop(0.5, 'rgba(30,41,59,0.6)');
      gGrad.addColorStop(1, 'rgba(15,23,42,0.66)');
      ctx.fillStyle = gGrad;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.lineTo(pts[3][0], pts[3][1]);
      ctx.closePath();
      ctx.fill();

      if (layout.sea) {
        const [sw, se] = [proj(layout.sea.x - 5.2, layout.sea.y, 0), proj(layout.sea.x + 5.2, layout.sea.y, 0)];
        const [nw, ne] = [proj(layout.sea.x - 5.2, layout.sea.y - layout.sea.d, 0), proj(layout.sea.x + 5.2, layout.sea.y - layout.sea.d, 0)];
        ctx.fillStyle = 'rgba(56,130,246,0.16)';
        ctx.beginPath();
        ctx.moveTo(nw[0], nw[1]);
        ctx.lineTo(ne[0], ne[1]);
        ctx.lineTo(se[0], se[1]);
        ctx.lineTo(sw[0], sw[1]);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          const yy = layout.sea.y - 0.6 - i * 0.85;
          ctx.beginPath();
          for (let xx = layout.sea.x - 5; xx <= layout.sea.x + 5; xx += 0.3) {
            const [px, py] = proj(xx, yy, 0);
            const wave = Math.sin(xx * 1.6 + pulse * (1 + i * 0.25)) * 2.4;
            if (xx === layout.sea.x - 5) ctx.moveTo(px, py + wave);
            else ctx.lineTo(px, py + wave);
          }
          ctx.strokeStyle = `rgba(103,232,249,${0.35 - i * 0.08})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      const features = [...layout.features];

      const shadowEl = (f, rw, rd) => {
        const [sx, sy] = proj(f.x, f.y, 0);
        const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, rw);
        g.addColorStop(0, 'rgba(0,0,0,0.36)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rw, rd, 0, 0, TAU);
        ctx.fill();
      };
      const plinth = features.find((f) => f.type === 'plinth');
      if (plinth) shadowEl(plinth, 2.25 * T, 1.2 * T);
      features
        .filter((f) => ['pavilion', 'gate', 'bridge'].includes(f.type))
        .forEach((f) => shadowEl(f, (1.05 * T) * (f.size || 1), 0.55 * T));

      features
        .filter((f) => f.type === 'hill' && f.id !== 'gabbar')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          ellipse(sx, sy, 0.6 * T, 0.34 * T, 'rgba(16,185,129,0.18)');
          ellipse(sx, sy, 0.42 * T, 0.24 * T, 'rgba(16,185,129,0.26)');
          ellipse(sx, sy, 0.26 * T, 0.15 * T, 'rgba(52,211,153,0.4)');
          ctx.fillStyle = 'rgba(16,185,129,0.5)';
          ctx.beginPath();
          ctx.arc(sx, sy, 0.13 * T, 0, TAU);
          ctx.fill();
        });

      features
        .filter((f) => f.type === 'ghat')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          isoBox(f.x, f.y, 1.2, 0.55, 6, 'rgba(148,163,184,0.5)', 'rgba(100,116,139,0.55)', 'rgba(71,85,105,0.55)');
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const yr = f.y + 0.28 - i * 0.18;
            const [ax, ay] = proj(f.x - 0.9, yr, 0);
            const [bx, by] = proj(f.x + 0.9, yr, 0);
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = 'rgba(226,232,240,0.4)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        });

      features
        .filter((f) => f.type === 'plaza' || f.type === 'parking' || f.type === 'marker')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          ctx.fillStyle = f.type === 'plaza' ? 'rgba(100,116,139,0.3)' : 'rgba(71,85,105,0.28)';
          ctx.beginPath();
          ctx.arc(sx, sy, (f.type === 'plaza' ? 0.55 : 0.4) * T, 0, TAU);
          ctx.fill();
          const mark = f.type === 'marker' && f.id === 'gabbar_top';
          if (mark) ctx.strokeStyle = '#a78bfa';
          if (f.type === 'marker') {
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, TAU);
            ctx.fillStyle = '#c4b5fd';
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });

      features
        .filter((f) => f.type === 'bridge')
        .forEach((f) => {
          const [px, py] = proj(f.x, f.y, 0);
          isoBox(f.x, f.y, 1.6, 0.4, 18, 'rgba(241,245,249,0.9)', 'rgba(148,163,184,0.95)', 'rgba(100,116,139,0.95)');
          ctx.strokeStyle = 'rgba(253,224,71,0.8)';
          ctx.lineWidth = 1.6;
          for (let i = -1; i <= 1; i++) {
            const [rx0, ry0] = proj(f.x - 1.5, f.y + i * 0.22, 0);
            const [rx1, ry1] = proj(f.x + 1.5, f.y + i * 0.22, 0);
            ctx.beginPath();
            ctx.moveTo(rx0, ry0);
            ctx.lineTo(rx1, ry1);
            ctx.stroke();
          }
        });

      features
        .filter((f) => f.type === 'ferry')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          isoBox(f.x, f.y, 0.7, 0.4, 10, '#94a3b8', '#64748b', '#475569');
          const bob = Math.sin(pulse * 1.4) * 3;
          ctx.fillStyle = '#0ea5e9';
          ctx.beginPath();
          ctx.moveTo(sx - 14, sy - bob);
          ctx.lineTo(sx - 6, sy - 12 - bob);
          ctx.lineTo(sx + 12, sy - 12 - bob);
          ctx.lineTo(sx + 16, sy - bob);
          ctx.closePath();
          ctx.fill();
          label(sx, sy - 24 - bob, '⛴ Bet Dwarka', '#7dd3fc', 8, 'bold');
        });

      features
        .filter((f) => f.type === 'ropeway')
        .forEach((f) => {
          const [bx0, by0] = proj(f.base[0], f.base[1], 0);
          const [tx0, ty0] = proj(f.top[0], f.top[1], 0);
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(167,139,250,0.7)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(bx0, by0 - 30);
          ctx.lineTo(tx0, ty0 - 60);
          ctx.stroke();
          ctx.setLineDash([]);
          const [bx1, by1] = proj(f.base[0], f.base[1], -30);
          const [tx1, ty1] = proj(f.top[0], f.top[1], -60);
          for (let i = 0; i < 3; i++) {
            const t = ((pulse * 0.06 + i / 3) % 1 + 1) % 1;
            const cx = bx1[0] + (tx1[0] - bx1[0]) * t;
            const cy = bx1[1] + (tx1[1] - bx1[1]) * t;
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(cx, cy, 4.5, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          isoBox(f.base[0], f.base[1], 0.5, 0.35, 26, '#c4b5fd', '#8b5cf6', '#6d28d9');
        });

      const drawOrder = features
        .filter((f) => ['pavilion', 'gate', 'plinth', 'shrine'].includes(f.type))
        .sort((a, b) => proj(a.x, a.y, 0)[1] - proj(b.x, b.y, 0)[1]);

      drawOrder.forEach((f) => {
        if (f.type === 'pavilion') {
          isoBox(f.x, f.y, 0.7, 0.42, 22, '#eab308', '#ca8a04', '#854d0e');
        } else if (f.type === 'plinth') {
          isoBox(f.x, f.y, 2.2, 1.2, 6, 'rgba(120,113,108,0.85)', 'rgba(87,83,78,0.9)', 'rgba(68,64,60,0.95)');
        } else if (f.type === 'shrine') {
          isoBox(f.x, f.y, 1.5, 0.8, 22, '#d97706', '#92400e', '#78350f');
          isoBox(f.x, f.y - 0.35, 1.1, 0.6, 18, '#f59e0b', '#b45309', '#92400e');
          let hw = 0.85;
          let hd = 0.46;
          let zh = 30;
          for (let i = 0; i < 5; i++) {
            isoBox(f.x, f.y - 0.42, hw, hd, zh, '#fbbf24', '#b45309', '#92400e');
            hw *= 0.84;
            hd *= 0.84;
            zh += 15;
          }
          isoBox(f.x, f.y - 0.44, 0.12, 0.1, zh - 8, '#fde047', '#ca8a04', '#a16207');
          const [sx, sy] = proj(f.x, f.y, 0);
          label(sx, sy - 128, f.label, '#fde047', 10, 'bold');
        } else if (f.type === 'gate') {
          const color = GATE_COLORS[f.gateId ? (gates.find((g) => g.id === f.gateId) || {}).type : 'entry_and_exit'] || '#22d3ee';
          isoBox(f.x - 0.2, f.y + 0.08, 0.14, 0.12, 26, '#e2e8f0', '#94a3b8', '#64748b');
          isoBox(f.x + 0.2, f.y - 0.08, 0.14, 0.12, 26, '#e2e8f0', '#94a3b8', '#64748b');
          isoBox(f.x, f.y, 0.62 * (f.size || 1), 0.26 * (f.size || 1), 32, color, '#0e7490', '#155e75');
          ctx.fillStyle = color;
          ctx.fillRect(proj(f.x, f.y, 0)[0] - (f.size || 1) * 10, proj(f.x, f.y, 0)[1] - 34, (f.size || 1) * 20, 3);
          const dens = densityOf(f.zoneId);
          const meta = DENSITY_META(dens);
          const [sx, sy] = proj(f.x, f.y, 0);
          heatRing(sx, sy, 16 + (f.size || 1) * 8, dens, pulse);
          const chip = `${meta.pct}% ${meta.label}`;
          ctx.font = "bold 8px 'Segoe UI', system-ui, sans-serif";
          ctx.textAlign = 'center';
          const cw = ctx.measureText(chip).width + 10;
          ctx.fillStyle = 'rgba(2,6,23,0.8)';
          ctx.fillRect(sx - cw / 2, sy - 68, cw, 14);
          ctx.fillStyle = meta.color;
          ctx.fillText(chip, sx, sy - 57);
          label(sx, sy - 46, f.label, meta.label === 'HIGH' ? '#fca5a5' : '#f0f9ff', 9, 'bold');
        }
      });

      const shrine = features.find((f) => f.type === 'shrine');
      const shrinePos = shrine ? proj(shrine.x, shrine.y, 0) : [320, 240];

      features
        .filter((f) => f.type === 'gate')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          flowArrow([sx, sy + 18], [shrinePos[0], shrinePos[1] - 30], pulse);
        });

      features
        .filter((f) => f.zoneId && ['promenade', 'triveni', 'setu', 'chowk'].includes(f.type))
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          heatRing(sx, sy, 22, densityOf(f.zoneId), pulse);
        });

      features.forEach((f) => {
        if (f.id === 'shrine') return;
        const isHovered = hovered === f.id;
        const [sx, sy] = proj(f.x, f.y, 0);
        posRef.current.push({ id: f.id, sx, sy, radius: 20 + (f.size || 0) * 14 });
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(sx, sy, 22 + (f.size || 0) * 14, 0, TAU);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (f.type !== 'sea' && f.id !== 'plinth') {
          label(sx, sy + 20, f.short || f.label, '#cbd5e1', 8, 'normal');
        }
      });

      const [tsx, tsy] = proj(shrine?.x ?? 0, shrine?.y ?? 0, 0);
      const glow = ctx.createRadialGradient(tsx, tsy, 4, tsx, tsy, 74 + Math.sin(pulse) * 7);
      glow.addColorStop(0, 'rgba(251,191,36,0.13)');
      glow.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(tsx, tsy, 74, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(251,191,36,0.18)';
      ctx.beginPath();
      ctx.arc(tsx, tsy, 34 + Math.sin(pulse) * 5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251,191,36,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const barW = 46 * zoom;
      const bx2 = canvas.width - 22;
      const by2 = canvas.height - 14;
      ctx.font = "8px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.fillText('200 m', bx2, by2);
      ctx.fillText('0 m', bx2 - barW - 26, by2);
      ctx.strokeStyle = 'rgba(148,163,184,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx2 - barW, by2 - 4);
      ctx.lineTo(bx2, by2 - 4);
      ctx.moveTo(bx2 - barW, by2 - 7);
      ctx.lineTo(bx2 - barW, by2 - 1);
      ctx.moveTo(bx2, by2 - 7);
      ctx.lineTo(bx2, by2 - 1);
      ctx.stroke();

      const cpx = 26;
      const cpy = canvas.height - 20;
      ctx.fillStyle = 'rgba(148,163,184,0.85)';
      ctx.font = "bold 9px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('N', cpx, cpy - 14);
      ctx.beginPath();
      ctx.moveTo(cpx, cpy - 9);
      ctx.lineTo(cpx - 5, cpy + 5);
      ctx.lineTo(cpx + 5, cpy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = "7px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText('SE', cpx, cpy + 14);

      animFrame = requestAnimationFrame(renderMap);
    };

    renderMap();
    return () => cancelAnimationFrame(animFrame);
  }, [zoom, templeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hitTest = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);
    let best = null;
    let bestD = Infinity;
    posRef.current.forEach((p) => {
      if (!p) return;
      const d = Math.hypot(px - p.sx, py - p.sy);
      if (d < p.radius && d < bestD) {
        best = p.id;
        bestD = d;
      }
    });
    return best;
  };

  const liveCap = temple.live_capacity_percentage ?? 62;
  const crowdColor = liveCap > 75 ? '#ef4444' : liveCap > 45 ? '#f59e0b' : '#10b981';
  const terrainBadge = layout.terrain === 'seafront' ? 'Seafront' : layout.terrain === 'river' ? 'River & Ghat' : layout.terrain === 'hillwest' ? 'Hill & Ropeway' : 'Hill Summit';

  return (
    <div className="bg-slate-950 border border-amber-900/30 rounded-2xl p-4 text-white space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-md">
            REAL TEMPLE 3D GIS LAYOUT
          </span>
          <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            {getLocalizedTempleName(temple)}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: crowdColor }} />
            <span className="text-slate-300">Live {liveCap}%</span>
            <span className="text-slate-500">· {temple.crowdLevel}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 border border-white/10 rounded-lg px-2 py-1.5 hidden sm:inline">{terrainBadge}</span>
        </div>
      </div>

      <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-white/10">
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 cursor-pointer"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1.5 text-[9px] font-mono text-slate-300 justify-end pointer-events-none">
          <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Shrine</span>
          <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-cyan-400" /> Gates</span>
          {layout.sea && <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Waves className="w-2.5 h-2.5 text-blue-400" /> {layout.terrain === 'seafront' ? 'Sea' : 'River'}</span>}
          {layout.features.some((f) => f.type === 'hill') && <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Mountain className="w-2.5 h-2.5 text-emerald-400" /> Hill</span>}
          {layout.features.some((f) => f.type === 'ropeway') && <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Cable className="w-2.5 h-2.5 text-violet-400" /> Ropeway</span>}
          <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5">heat = crowd</span>
        </div>

        <canvas
          ref={canvasRef}
          width={640}
          height={460}
          className="cursor-pointer max-w-full w-full h-auto"
          onClick={(e) => {
            const hit = hitTest(e.clientX, e.clientY);
            setSelected(hit ? layout.features.find((f) => f.id === hit) : null);
          }}
          onMouseMove={(e) => setHovered(hitTest(e.clientX, e.clientY))}
          onMouseLeave={() => setHovered(null)}
        />

        {!selected && (
          <div className="absolute bottom-2 left-2 bg-slate-950/70 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 font-mono pointer-events-none">
            ▾ Tap any gate · zone · landmark to inspect live load
          </div>
        )}

        {selected && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/95 backdrop-blur-md border border-amber-500/40 p-3 rounded-xl text-xs animate-in slide-in-from-bottom">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-amber-400">{selected.label}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {(() => {
                    const gate = selected.gateId ? gates.find((g) => g.id === selected.gateId) : null;
                    const zone = selected.zoneId ? temple.zones.find((z) => z.id === selected.zoneId) : null;
                    if (gate) return `${gate.name} · ${gate.type.toUpperCase().replace('_', ' ')}${gate.desc ? ' · ' + gate.desc : ''}`;
                    if (zone) return `${zone.label} · density ${densityOf(selected.zoneId).toFixed(2)}/m²`;
                    return 'Real GIS structure of the temple compound';
                  })()}
                </p>
                {selected.gateId && (() => {
                  const g = gates.find((x) => x.id === selected.gateId);
                  return (
                    <p className="text-[10px] mt-1 font-bold" style={{ color: g?.color }}>
                      Load {g?.pct}% · Queue {g?.label} {g?.is_priority_lane ? '· PRIORITY LANE' : ''}
                    </p>
                  );
                })()}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-bold hover:bg-amber-500/30 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {gates.map((g) => (
          <div
            key={g.id}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              g.label === 'HIGH'
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                : g.label === 'MODERATE'
                ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
            onClick={() => setSelected(g.linked)}
          >
            <p className="text-[10px] text-slate-400 font-mono truncate">{g.name}</p>
            <p className="font-extrabold text-sm text-white mt-0.5">{g.density.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">p/m²</span></p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: g.color }}>
              {g.label} LOAD ({g.pct}%){g.is_priority_lane ? ' · PRIORITY' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};