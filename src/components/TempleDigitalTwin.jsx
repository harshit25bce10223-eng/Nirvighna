import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw, Users, Clock, Zap, TrendingUp, MapPin, Trophy, Layers, Box, Home, Maximize2, Minimize2, Navigation, MousePointer } from 'lucide-react';
import { getTempleById, getLocalizedTempleName } from '../lib/templeRegistry';
import { digitalTwinEngine } from '../lib/digitalTwinEngine';

const TAU = Math.PI * 2;
const LIGHT = [-0.5, 0.8, 0.34];
const STARFIELD = Array.from({ length: 70 }, () => [Math.random() * 640, Math.random() * 440, Math.random() * TAU, 0.4 + Math.random() * 0.6]);

const VIEW_MODES = {
  dollhouse: { label: 'Dollhouse', icon: Box, desc: '3D isometric orbit — rotate, zoom, overview' },
  inside: { label: 'Inside View', icon: Home, desc: 'First-person walkthrough — WASD + mouse look' },
  floorplan: { label: 'Floor Plan', icon: Maximize2, desc: 'Top-down blueprint — orthographic layout' }
};

const shade = (hex, k) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

const shadeK = (n) => 0.35 + 0.65 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);

function face(pts, wanted, color, raw) {
  const [a, b, d] = pts;
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len; ny /= len; nz /= len;
  if (nx * wanted[0] + ny * wanted[1] + nz * wanted[2] < 0) {
    const p0 = pts[0];
    pts = [p0, ...pts.slice(1).reverse()];
    const a2 = pts[0], b2 = pts[1], d2 = pts[2];
    const ux2 = b2[0] - a2[0], uy2 = b2[1] - a2[1], uz2 = b2[2] - a2[2];
    const vx2 = d2[0] - a2[0], vy2 = d2[1] - a2[1], vz2 = d2[2] - a2[2];
    nx = uy2 * vz2 - uz2 * vy2; ny = uz2 * vx2 - ux2 * vz2; nz = ux2 * vy2 - uy2 * vx2;
    const l2 = Math.hypot(nx, ny, nz) || 1;
    nx /= l2; ny /= l2; nz /= l2;
  }
  return { pts, fill: raw ? color : shade(color, shadeK([nx, ny, nz])), id: null };
}

const Q = (x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3) => [
  [x0, y0, z0], [x1, y1, z1], [x2, y2, z2], [x3, y3, z3]
];

const cube = (cx, cy, cz, hx, hy, hz, c) => {
  const x0 = cx - hx, x1 = cx + hx, y0 = cy - hy, y1 = cy + hy, z0 = cz - hz, z1 = cz + hz;
  return [
    face(Q(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1), [0, 0, 1], c),
    face(Q(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0), [0, 0, -1], c),
    face(Q(x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0), [0, 1, 0], c),
    face(Q(x1, y0, z0, x0, y0, z0, x0, y0, z1, x1, y0, z1), [0, -1, 0], c),
    face(Q(x1, y0, z0, x1, y0, z1, x1, y1, z1, x1, y1, z0), [1, 0, 0], c),
    face(Q(x0, y0, z1, x0, y0, z0, x0, y1, z0, x0, y1, z1), [-1, 0, 0], c)
  ];
};

const column = (cx, cz, y0, y1, r0, r1, c, segs = 8) => {
  const ring = (y, r) => {
    const pts = [];
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * TAU;
      pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
    }
    return pts;
  };
  const top = ring(y1, r1);
  const bot = ring(y0, r0);
  const out = [];
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % segs;
    const mid = [(top[i][0] + top[j][0]) / 2, 0, (top[i][2] + top[j][2]) / 2];
    const nx = mid[0] - cx, nz = mid[2] - cz;
    const nl = Math.hypot(nx, nz) || 1;
    out.push(face(Q(bot[i][0], bot[i][1], bot[i][2], bot[j][0], bot[j][1], bot[j][2], top[j][0], top[j][1], top[j][2], top[i][0], top[i][1], top[i][2]), [nx / nl, 0, nz / nl], c));
  }
  for (let i = 1; i < segs - 1; i++) {
    out.push(face([top[0], top[i], top[i + 1]], [0, 1, 0], c));
  }
  return out;
};

const frustum = (cx, cz, y0, y1, r0, r1, c) => {
  const corners = (y, r) => [
    [cx - r, y, cz - r], [cx + r, y, cz - r], [cx + r, y, cz + r], [cx - r, y, cz + r]
  ];
  const top = corners(y1, r1);
  const bot = corners(y0, r0);
  return [
    face(Q(...bot[0], ...bot[1], ...top[1], ...top[0]), [0, 0, -1], c),
    face(Q(...bot[1], ...bot[2], ...top[2], ...top[1]), [1, 0, 0], c),
    face(Q(...bot[2], ...bot[3], ...top[3], ...top[2]), [0, 0, 1], c),
    face(Q(...bot[3], ...bot[0], ...top[0], ...top[3]), [-1, 0, 0], c),
    face(Q(...top[0], ...top[1], ...top[2], ...top[3]), [0, 1, 0], c)
  ];
};

const disc = (cx, cz, r, c, segs = 14, raw = false) => {
  const out = [];
  const center = [cx, 0, cz];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * TAU;
    const a1 = ((i + 1) / segs) * TAU;
    out.push(face([
      [cx + Math.cos(a0) * r, 0, cz + Math.sin(a0) * r],
      [cx + Math.cos(a1) * r, 0, cz + Math.sin(a1) * r],
      center
    ], [0, 1, 0], c, raw));
  }
  return out;
};

const CORE_CFG = {
  tmp_somnath: {
    label: 'Somnath Mahameru Shikhara',
    stone: '#d9b582', stoneTop: '#efd9b2', stoneA: '#c9a06c', stoneB: '#a67f52', spire: '#d9b582', kalash: '#c9852d',
    storeys: 2, height: 8.6, baseT: 2.3,
    scene: [
      { id: 'nandi', type: 'pavilion', x: -1.5, z: 1.4, label: 'Nandi Mandap', short: 'Nandi' },
      { id: 'baan', type: 'baan', x: 1.7, z: 2.6, label: 'Baan-Stambh', short: 'Arrow Pillar' },
      { id: 'maha_gate', type: 'gate', x: -2.5, z: 2.8, label: 'Mahapravesh Dwar', short: 'Main Gate', gateId: 'som_g1', zoneId: 'zone_som_1', size: 1 },
      { id: 'wheel_gate', type: 'gate', x: 2.6, z: 2.4, label: 'Wheelchair Gate', short: 'Priority', gateId: 'som_g2', zoneId: 'zone_som_2', size: 0.8 },
      { id: 'triveni', type: 'ghat', x: 0, z: 3.7, label: 'Triveni Sangam Ghat', short: 'Ghat + Sea' },
      { id: 'prasad', type: 'pavilion', x: -2.3, z: -1.8, label: 'Prasad Counter', short: 'Prasad', zoneId: 'zone_som_4' },
      { id: 'museum', type: 'pavilion', x: 2.7, z: -2.2, label: 'Prabhas Patan Museum', short: 'Museum' },
      { id: 'las', type: 'plaza', x: -3.6, z: -0.4, label: 'Light & Sound Ground', short: 'Show Ground', zoneId: 'zone_som_5' },
      { id: 'helipad', type: 'slab', x: 3.4, z: 1.2, label: 'Helipad + P2', short: 'Helipad' }
    ],
    water: { kind: 'sea', z0: 4.3, width: 8, r: 6 },
    facts: [
      { label: 'Architecture', value: 'Chalukya / Kailash Mahameru Prasad (Māru-Gurjara)' },
      { label: 'Rebuilt', value: '1951 by Sardar Patel — destroyed repeatedly since 1026 CE' },
      { label: 'Shikhara', value: '~155 ft · 10-ton kalash · 37 ft dhwajadand' },
      { label: 'Orientation', value: 'Faces west over the Arabian Sea' },
      { label: 'Triveni Sangam', value: 'Hiran + Kapila + Saraswati meet the sea (1.5 km south)' },
      { label: 'Landmark', value: 'Baan-Stambh Arrow Pillar — no land between here & Antarctica' }
    ]
  },
  tmp_dwarka: {
    label: 'Jagat Mandir — 72 Pillar Shrine',
    stoneTop: '#eadfc2', stone: '#eadfc2', stoneA: '#cdb98a', stoneB: '#a99461', spire: '#d9c48d', kalash: '#d4a017',
    storeys: 5, height: 7.6, baseT: 2.1,
    scene: [
      { id: 'swarga', type: 'gate', x: -2.1, z: 2.6, label: 'Swarg Dwar (56 Steps)', short: 'Entry', gateId: 'dwa_g1', zoneId: 'zone_dwa_1', size: 1 },
      { id: 'moksha', type: 'gate', x: 2.6, z: -1.8, label: 'Moksha Dwar', short: 'Exit', gateId: 'dwa_g2', zoneId: 'zone_dwa_2', size: 1 },
      { id: 'gomti', type: 'ghat', x: -0.9, z: 3.4, label: 'Gomti Ghat Steps', short: '56 kunds', zoneId: 'zone_dwa_3' },
      { id: 'setu', type: 'bridge', x: 1.9, z: 2.9, label: 'Sudama Setu (230 m)', short: 'Suspension' },
      { id: 'lockers', type: 'pavilion', x: 2.8, z: -2.9, label: 'Lockers & Footwear', short: 'Lockers' },
      { id: 'rukmini', type: 'pavilion', x: 4.4, z: -3.6, label: 'Rukmini Devi Mandir', short: '~2 km' },
      { id: 'bazaar', type: 'plaza', x: 0.8, z: -3.5, label: 'Market Bazaar', short: 'Bazaar' },
      { id: 'nageshwar', type: 'slab', x: -4.4, z: -2.4, label: 'Nageshwar Jyotirlinga', short: '17 km' }
    ],
    water: { kind: 'river', z0: 4.0, width: 6, r: 5.6 },
    facts: [
      { label: 'Temple', value: 'Jagat Mandir — Lord Krishna (Dwarkadhish), Char Dham' },
      { label: 'Structure', value: 'Five storeys (Panch Bhumi) · 72 carved pillars · limestone & sandstone' },
      { label: 'Shikhara', value: '43 m (141 ft) · Nishan flag (sun & moon) changed 2×/day' },
      { label: 'Gates', value: 'Swarg Dwar entry via 56 steps · Moksha Dwar exit near market' },
      { label: 'Sudama Setu', value: '230 m suspension bridge (2016) over the Gomti river' },
      { label: 'Bet Dwarka', value: 'Ancient Krishna palace site — ferry from Okha ghat' }
    ]
  },
  tmp_ambaji: {
    label: 'Ambaji Mata — White Marble Shrine',
    stoneTop: '#f8f4e6', stone: '#f8f4e6', stoneA: '#e4dcc0', stoneB: '#c7bb96', spire: '#f5c542', kalash: '#e9b200',
    storeys: 2, height: 5.6, baseT: 1.9,
    scene: [
      { id: 'central', type: 'gate', x: -2.8, z: 1.9, label: 'Shakti Dwar Central', short: 'Largest', gateId: 'amb_g1', zoneId: 'zone_amb_1', size: 1.1 },
      { id: 'gate7', type: 'gate', x: -4.0, z: 0.6, label: 'Shakti Dwar Gate 7', short: 'VIP', gateId: 'amb_g2', zoneId: 'zone_amb_2', size: 0.9 },
      { id: 'side', type: 'gate', x: -1.8, z: 2.6, label: 'Shakti Dwar Side', short: 'Side', gateId: 'amb_g3', size: 0.7 },
      { id: 'chowk', type: 'flame', x: 1.7, z: 1.1, label: 'Chachar Chowk', short: 'Akhand Jyot', zoneId: 'zone_amb_3' },
      { id: 'havan', type: 'pavilion', x: 0.4, z: 3.4, label: 'Havan Shala', short: 'Ritual Hall' },
      { id: 'gabbar', type: 'hill', x: 3.7, z: -1.9, label: 'Gabbar Hill', short: 'Summit Shrine' },
      { id: 'ropeway', type: 'ropeway', x: 3.7, z: -1.9, base: [2.3, 1.7], top: [4.2, -2.1], label: 'Udan Khatola', short: 'Ropeway' },
      { id: 'mansarovar', type: 'kund', x: -2.0, z: -2.8, label: 'Mansarovar Kund', short: 'Sacred Tank' },
      { id: 'parking', type: 'slab', x: -4.6, z: -0.8, label: 'Highway Parking', short: 'P1-P3' }
    ],
    water: null,
    facts: [
      { label: 'Shakti Peeth', value: '51st Peeth — heart of Sati; Shree Visa Yantra (51 bij letters), no idol (veiled)' },
      { label: 'Material', value: 'White marble · silver-plated doors · single central entrance' },
      { label: 'Kalash', value: '3-ton gold-plated marble kalash at 103 ft + sacred Trishul' },
      { label: 'Chachar Chowk', value: 'Open courtyard with eternal Akhand Jyot flame & havans' },
      { label: 'Gabbar Hill', value: '999 steps or Udan Khatola ropeway · light & sound on hillside' },
      { label: 'Fairs', value: 'Bhadarvi Poonam (Sep) mass fair · Navratri garba & bhavai' }
    ]
  },
  tmp_pavagadh: {
    label: 'Kalika Mata — Hilltop Shrine',
    stoneTop: '#c1704f', stone: '#c1704f', stoneA: '#a0503a', stoneB: '#7a3827', spire: '#a65a3c', kalash: '#8b3a2a',
    storeys: 2, height: 4.4, baseT: 1.7,
    scene: [
      { id: 'shrine_hill', type: 'hill', x: 0, z: 0.6, label: 'Pavagadh Hill', short: 'Summit' },
      { id: 'dargah', type: 'pavilion', x: 1.9, z: 1.0, label: 'Sadan Shah Pir Dargah', short: 'Dargah' },
      { id: 'machi', type: 'gate', x: -2.7, z: -2.0, label: 'Machi Haveli Ropeway', short: 'Boarding', gateId: 'pav_g1', zoneId: 'zone_pav_1', size: 1.1 },
      { id: 'ropeway', type: 'ropeway', x: 0, z: 0.4, base: [-2.7, -2.0], top: [0.2, 0.3], label: 'Pavagadh Ropeway', short: 'Since 1986' },
      { id: 'trek', type: 'gate', x: 3.0, z: -2.6, label: 'Trekking Base (2000 Steps)', short: 'Trek', gateId: 'pav_g2', zoneId: 'zone_pav_2', size: 0.9 },
      { id: 'patai', type: 'waterfall', x: -3.7, z: 1.4, label: 'Patai Waterfall', short: 'Falls' },
      { id: 'fort', type: 'slab', x: 3.8, z: -3.8, label: 'Pavagadh Fort Walls', short: 'UNESCO 2004' },
      { id: 'champaner', type: 'plaza', x: 4.6, z: -1.2, label: 'Champaner Heritage', short: 'Jami Masjid' }
    ],
    water: null,
    facts: [
      { label: 'Shakti Peeth', value: 'Sati\u2019s foot; 3 goddesses — Kalika (red), Kali & Bahuchara Mata' },
      { label: 'Age', value: '10th\u201311th century · domed 2-storey shrine on the summit' },
      { label: 'Dargah', value: 'Sadan Shah Pir Sufi dargah stands beside the temple' },
      { label: 'Ascent', value: '2,000 steps (~800 m) or ropeway (1986) from Machi Haveli · 400 pax/hr' },
      { label: 'UNESCO', value: 'Champaner-Pavagadh WHS (2004) · plateaus: Kalika, Bhadrakali, Machi, Atak' },
      { label: 'Waterfall', value: 'Patai waterfall cascades at the hill base in monsoon' }
    ]
  }
};

const GATE_COLORS = {
  entry: '#22d3ee',
  exit: '#f472b6',
  entry_and_exit: '#38bdf8'
};

export const TempleDigitalTwin = ({ templeId = 'tmp_somnath' }) => {
  const canvasRef = useRef(null);
  const pulseRef = useRef({ angle: 0, yaw: -0.55, pitch: 0.42, dragging: false, lastX: 0, lastY: 0 });
  const liveRef = useRef({ hovered: null, selected: null, result: null, footfall: 28000 });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [footfall, setFootfall] = useState(28000);
  const [gatesOpen, setGatesOpen] = useState(4);
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState('dollhouse');
  
  const insideRef = useRef({
    pos: [0, 1.6, 5],
    yaw: 0,
    pitch: 0,
    moving: { forward: false, backward: false, left: false, right: false },
    pointerLocked: false
  });

  const temple = useMemo(() => getTempleById(templeId), [templeId]);
  const cfg = CORE_CFG[templeId] || CORE_CFG.tmp_somnath;

  if (!liveRef.current) liveRef.current = {};
  Object.assign(liveRef.current, { hovered, selected, result, footfall });

  const densityOf = (zoneId) => {
    if (!zoneId) return 0.4;
    const zone = temple.zones.find((z) => z.id === zoneId);
    return zone ? zone.baseDensity : 0.4;
  };

  const mesh = useMemo(() => {
    const C = CORE_CFG[templeId] || CORE_CFG.tmp_somnath;
    const faces = [];
    const bounds = 6.5;
    faces.push(...disc(0, 0, bounds, '#111a2e'));
    if (C.water) {
      const segs = 14;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * TAU;
        const a1 = ((i + 1) / segs) * TAU;
        const z0f = C.water.z0;
        faces.push(face([
          [C.water.width, 0, z0f], [-C.water.width, 0, z0f],
          [Math.cos(a1) * C.water.r, 0, Math.sin(a1) * C.water.r],
          [Math.cos(a0) * C.water.r, 0, Math.sin(a0) * C.water.r]
        ], [0, 1, 0], 'rgba(37,99,235,0.32)', true));
      }
    }
    faces.push(...disc(0, 0, 3.4, '#1a2440'));
    faces.push(...disc(0, 0, C.baseT * 1.45, 'rgba(0,0,0,0.3)', 14, true));
    faces.push(...cube(1.9, 0, 0.9, 1.8, 0.06, 1.6, '#223052'));

    const spireHeight = C.height;
    faces.push(...cube(0, 0, 0, C.baseT + 0.35, 0.4, C.baseT * 0.62, C.stoneB));
    faces.push(...cube(0, 0.4, 0, C.baseT, 0.5, C.baseT * 0.6, C.stone));
    let yTop = 0.9;
    for (let s = 0; s < C.storeys; s++) {
      const rr = C.baseT * (1 - s * 0.12);
      faces.push(...cube(0, yTop, 0, rr, 0.85, rr * 0.6, s % 2 ? C.stoneA : C.stoneTop));
      yTop += 0.85;
    }
    faces.push(...cube(0, yTop, 0, C.baseT * 0.78, 0.5, C.baseT * 0.47, C.stoneTop));
    yTop += 0.5;
    const spireTiers = [
      [C.baseT * 1.05, 0.62], [C.baseT * 0.55, 1.05], [C.baseT * 0.16, 1.5]
    ];
    let maybeY = yTop;
    const topFrac = (spireHeight - maybeY) / 100;
    const shrInc = (spireHeight - maybeY) / 3;
    for (let i = 0; i < 3; i++) {
      const rR = C.baseT * (i === 0 ? 0.85 : 0.55 - i * 0.08);
      const segH = shrInc * (i === 0 ? 0.9 : 0.85);
      faces.push(...frustum(0, 0, maybeY, maybeY + segH, rR, rR * (i === 2 ? 0.18 : 0.62), i === 2 ? C.spire : (i === 0 ? C.stoneA : C.stoneTop)));
      maybeY += segH;
    }
    faces.push(...cube(0, maybeY, 0, 0.24, 0.12, 0.24, C.kalash));
    faces.push(...column(0, 0, maybeY, maybeY + 0.55, 0.08, 0.015, C.kalash, 6));

    if (C.storeys === 5) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        faces.push(...column(Math.cos(a) * C.baseT * 0.95, 0, Math.sin(a) * C.baseT * 0.95, 0, 1.25, 0.13, 0.11, '#efe6c8', 6));
      }
    }

    const flagInfo = {
      tmp_somnath: '#e2572c',
      tmp_dwarka: 'sunmoon',
      tmp_ambaji: '#f59e0b',
      tmp_pavagadh: '#b45309'
    }[templeId];

    (C.scene || []).forEach((f) => {
      if (f.type === 'gate') {
        const col = GATE_COLORS[(temple.gates||[]).find((g) => g.id === f.gateId)?.type] || '#22d3ee';
        faces.push(...cube(f.x, 0, f.z, 0.16, 2.1, 0.16, '#e2e8f0'));
        faces.push(...cube(f.x + (f.size || 1) * 0.7, 0, f.z, 0.16, 2.1, 0.16, '#e2e8f0'));
        faces.push(...cube(f.x + (f.size || 1) * 0.35, 2.1, f.z, (f.size || 1) * 0.62, 0.3, 0.22, col));
        faces.push(...disc(f.x, f.z, 1.1, '#1a2440'));
      } else if (f.type === 'pavilion') {
        faces.push(...cube(f.x, 0, f.z, 0.7, 0.55, 0.7, '#c8a24a'));
        faces.push(...cube(f.x, 0.55, f.z, 0.5, 0.4, 0.5, '#a5802f'));
      } else if (f.type === 'slab') {
        faces.push(...cube(f.x, 0, f.z, 0.95, 0.12, 0.8, '#475569'));
      } else if (f.type === 'baan') {
        faces.push(...column(f.x, 0, f.z, 0, 2.6, 0.12, '#e7c99e', 6));
        faces.push(...column(f.x, 0, f.z + 0.3, 2.6, 2.9, 0.22, 0.015, '#d9b582', 4));
      } else if (f.type === 'ghat') {
        const dir = C.water ? 1 : -1;
        for (let s = 0; s < 4; s++) {
          faces.push(...cube(f.x, s * 0.14, f.z + dir * (0.35 + s * 0.5), 1.3, 0.14, 0.55, ['#64748b', '#7d8ea3', '#95a7bc', '#aabdd1'][s]));
        }
      } else if (f.type === 'flame') {
        faces.push(...disc(f.x, f.z, 0.7, '#3b3420'));
        faces.push(...column(f.x, 0, f.z, 0, 0.5, 0.34, '#8a6d1f', 6));
      } else if (f.type === 'kund') {
        faces.push(...disc(f.x, f.z, 0.95, 'rgba(30,64,175,0.35)', 14, true));
        faces.push(...cube(f.x, 0, f.z, 0.95, 0.1, 0.95, '#4b5b78'));
      } else if (f.type === 'bridge') {
        const ax = f.x - 1.3, bx = f.x + 1.3;
        faces.push(...cube(f.x, 0.25, f.z, 1.4, 0.2, 0.35, '#cbd5e1'));
        faces.push(...cube(ax, 0, f.z, 0.14, 1.4, 0.14, '#64748b'));
        faces.push(...cube(bx, 0, f.z, 0.14, 1.4, 0.14, '#64748b'));
      } else if (f.type === 'hill') {
        faces.push(...column(f.x, 0, f.z, 0, 2.2, 1.9, 0.9, '#14532d', 8));
        faces.push(...column(f.x, 0.05, f.z, 1.6, 2.6, 1.1, 0.5, '#166534', 8));
        faces.push(...column(f.x, 0.1, f.z, 2.6, 3.1, 0.6, 0.3, '#1a7a44', 8));
      } else if (f.type === 'waterfall') {
        faces.push(...disc(f.x, f.z, 0.7, 'rgba(30,64,175,0.3)', 14, true));
      }
    });

    return { faces, flag: { templeId, color: flagInfo } };
  }, [templeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const makeOrbitCam = (yaw, pitch, f) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const focal = 680 * f;
    return (x, y, z) => {
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = z1 * cp - y * sp;
      const z2 = z1 * sp + y * cp;
      const depth = 11.5 - z2;
      if (depth < 0.6) return null;
      const s = focal / depth;
      return { x: 320 + x1 * s, y: 252 - y2 * s, d: depth, s };
    };
  };

  const makeFirstPersonCam = (pos, yaw, pitch) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const focal = 680;
    return (x, y, z) => {
      const dx = x - pos[0];
      const dy = y - pos[1];
      const dz = z - pos[2];
      const x1 = dx * cy - dz * sy;
      const z1 = dx * sy + dz * cy;
      const y2 = z1 * cp - dy * sp;
      const z2 = z1 * sp + dy * cp;
      if (z2 < 0.1) return null;
      const s = focal / z2;
      return { x: 320 + x1 * s, y: 252 - y2 * s, d: z2, s };
    };
  };

  const makeOrthoCam = (scale) => {
    return (x, y, z) => {
      const s = scale;
      return { x: 320 + x * s, y: 252 - z * s, d: -y, s };
    };
  };

  const getCollisionBounds = (C) => {
    const bounds = [];
    const shrineWall = C.baseT + 0.35;
    const shrineDepth = C.baseT * 0.62;
    bounds.push({ min: [-shrineWall, -10, -shrineDepth], max: [-shrineWall + 0.3, 10, shrineDepth] });
    bounds.push({ min: [shrineWall - 0.3, -10, -shrineDepth], max: [shrineWall, 10, shrineDepth] });
    bounds.push({ min: [-shrineWall, -10, -shrineDepth], max: [shrineWall, 10, -shrineDepth + 0.3] });
    bounds.push({ min: [-shrineWall, -10, shrineDepth - 0.3], max: [shrineWall, 10, shrineDepth] });
    (C.scene || []).forEach(f => {
      if (f.type === 'gate') {
        const sz = f.size || 1;
        bounds.push({ min: [f.x - 0.8 * sz, -1, f.z - 0.16], max: [f.x + 0.8 * sz, 3, f.z + 0.16] });
      } else if (f.type === 'pavilion') {
        bounds.push({ min: [f.x - 0.7, -1, f.z - 0.7], max: [f.x + 0.7, 2, f.z + 0.7] });
      } else if (f.type === 'slab') {
        bounds.push({ min: [f.x - 0.95, -1, f.z - 0.8], max: [f.x + 0.95, 1, f.z + 0.8] });
      } else if (f.type === 'hill') {
        const r = 1.9;
        bounds.push({ min: [f.x - r, -10, f.z - r], max: [f.x + r, 10, f.z + r] });
      }
    });
    return bounds;
  };

  const checkCollision = (pos, bounds, radius = 0.35) => {
    for (const b of bounds) {
      const cx = Math.max(b.min[0], Math.min(pos[0], b.max[0]));
      const cz = Math.max(b.min[2], Math.min(pos[2], b.max[2]));
      const dx = pos[0] - cx;
      const dz = pos[2] - cz;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;
    digitalTwinEngine
      .runDigitalTwinSimulation(templeId, footfall || 28000, gatesOpen || 4, new Date().toISOString().split('T')[0])
      .then((res) => { if (mounted) setResult(res); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [templeId, footfall, gatesOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    const C = CORE_CFG[templeId] || CORE_CFG.tmp_somnath;
    const collisionBounds = getCollisionBounds(C);
    const keys = { w: false, a: false, s: false, d: false };

    const handleKeyDown = (e) => {
      if (viewMode !== 'inside') return;
      if (e.code === 'KeyW') keys.w = true;
      if (e.code === 'KeyA') keys.a = true;
      if (e.code === 'KeyS') keys.s = true;
      if (e.code === 'KeyD') keys.d = true;
    };
    const handleKeyUp = (e) => {
      if (viewMode !== 'inside') return;
      if (e.code === 'KeyW') keys.w = false;
      if (e.code === 'KeyA') keys.a = false;
      if (e.code === 'KeyS') keys.s = false;
      if (e.code === 'KeyD') keys.d = false;
    };
    const handlePointerLockChange = () => {
      insideRef.current.pointerLocked = document.pointerLockElement === canvas;
    };
    const handleMouseMoveFP = (e) => {
      if (!insideRef.current.pointerLocked) return;
      const sens = 0.002;
      insideRef.current.yaw -= e.movementX * sens;
      insideRef.current.pitch = Math.max(-1.4, Math.min(1.4, insideRef.current.pitch - e.movementY * sens));
    };
    const handleWheel = (e) => {
      e.preventDefault();
      if (viewMode === 'dollhouse') {
        setZoom(z => Math.max(0.65, Math.min(1.8, z - e.deltaY * 0.001)));
      } else if (viewMode === 'floorplan') {
        setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.002)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    canvas.addEventListener('mousemove', handleMouseMoveFP);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    const render = () => {
      const pulse = (pulseRef.current.angle += 0.05);
      ctx.fillStyle = '#0a1120';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let P;
      let camInfo = '';
      let modeHint = '';

      if (viewMode === 'dollhouse') {
        if (!pulseRef.current.dragging) {
          pulseRef.current.yaw += 0.0018;
          if (pulseRef.current.yaw > TAU) pulseRef.current.yaw -= TAU;
        }
        P = makeOrbitCam(pulseRef.current.yaw, pulseRef.current.pitch, zoom);
        camInfo = `${Math.round(pulseRef.current.yaw * 57.3) % 360}° orbit`;
        modeHint = 'Drag to orbit · Scroll to zoom';
      } else if (viewMode === 'inside') {
        const spd = 0.08;
        const nextPos = [...insideRef.current.pos];
        if (keys.w) { nextPos[0] -= Math.sin(insideRef.current.yaw) * spd; nextPos[2] -= Math.cos(insideRef.current.yaw) * spd; }
        if (keys.s) { nextPos[0] += Math.sin(insideRef.current.yaw) * spd; nextPos[2] += Math.cos(insideRef.current.yaw) * spd; }
        if (keys.a) { nextPos[0] -= Math.cos(insideRef.current.yaw) * spd; nextPos[2] += Math.sin(insideRef.current.yaw) * spd; }
        if (keys.d) { nextPos[0] += Math.cos(insideRef.current.yaw) * spd; nextPos[2] -= Math.sin(insideRef.current.yaw) * spd; }
        if (!checkCollision(nextPos, collisionBounds)) insideRef.current.pos = nextPos;
        
        P = makeFirstPersonCam(insideRef.current.pos, insideRef.current.yaw, insideRef.current.pitch);
        camInfo = `FP: ${Math.round(insideRef.current.yaw * 57.3) % 360}°`;
        modeHint = insideRef.current.pointerLocked ? 'WASD move · Mouse look · Esc to release' : 'Click to lock mouse · WASD + Mouse';
      } else {
        P = makeOrthoCam(zoom * 45);
        camInfo = `Scale: ${(zoom * 100).toFixed(0)}%`;
        modeHint = 'Drag to pan · Scroll to zoom';
      }

      ctx.fillStyle = viewMode === 'floorplan' ? '#0d1a2b' : '#0b1424';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (viewMode !== 'floorplan') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, viewMode === 'inside' ? '#0b1424' : '#0b1424');
        grad.addColorStop(1, viewMode === 'inside' ? '#0a1120' : '#0a1120');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(203,213,225,0.35)';
        for (let i = 0; i < STARFIELD.length; i++) {
          const st = STARFIELD[i];
          ctx.globalAlpha = st[3] * (0.5 + 0.5 * Math.sin(pulse * 0.4 + st[2]));
          ctx.fillRect(st[0], st[1], 1.5, 1.5);
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = 'rgba(56,189,248,0.08)';
        ctx.lineWidth = 1;
        for (let gx = -8; gx <= 8; gx += 0.5) {
          const px = 320 + gx * zoom * 45;
          ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); ctx.stroke();
        }
        for (let gz = -8; gz <= 8; gz += 0.5) {
          const py = 252 - gz * zoom * 45;
          ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke();
        }
      }

      const drawn = [];
      (mesh.faces || []).forEach((fc) => {
        if (viewMode === 'floorplan' && fc.pts[0][1] > 0.5) return;
        const projPts = [];
        let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, depth = 0;
        for (let i = 0; i < fc.pts.length; i++) {
          const p = P(fc.pts[i][0], fc.pts[i][1], fc.pts[i][2]);
          if (!p) return;
          projPts.push([p.x, p.y]);
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
          depth += p.d;
        }
        depth /= fc.pts.length;
        drawn.push({ pts: projPts, fill: viewMode === 'floorplan' ? fc.fill.replace(/rgba?\([^)]+\)/, (m) => m.replace(/[^,)]+\)$/, '0.6)')) : fc.fill, depth, id: fc.id, minX, maxX, minY, maxY });
      });

      drawn.sort((a, b) => viewMode === 'floorplan' ? a.d - b.d : b.depth - a.depth);
      
      const drawFace = (pts, fill) => {
        if (pts.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (viewMode !== 'floorplan') {
          ctx.strokeStyle = fill;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      };
      
      drawn.forEach((fc) => {
        drawFace(fc.pts, fc.fill);
        if (viewMode === 'inside') {
          const rev = [...fc.pts].reverse();
          drawFace(rev, fc.fill);
        }
      });

      if (viewMode === 'floorplan') {
        ctx.strokeStyle = 'rgba(56,189,248,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        const water = C.water;
        if (water) {
          const p1 = P(water.width, 0, water.z0);
          const p2 = P(-water.width, 0, water.z0);
          const p3 = P(-water.width, 0, water.z0 + water.r);
          const p4 = P(water.width, 0, water.z0 + water.r);
          if (p1 && p2 && p3 && p4) {
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath(); ctx.stroke();
          }
        }
        ctx.setLineDash([]);
      }

      const projectFeature = (P, x, z, h) => P(x, h, z);

      const flagColor = mesh.flag && mesh.flag.color;
      const shrineTop = viewMode !== 'floorplan' ? P(0, C.height + 0.4, 0) : P(0, 0, 0);
      if (shrineTop && flagColor && viewMode !== 'floorplan') {
        ctx.strokeStyle = '#cbb488';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(shrineTop.x, shrineTop.y); ctx.lineTo(shrineTop.x, shrineTop.y - 30); ctx.stroke();
        if (flagColor === 'sunmoon') {
          ctx.fillStyle = '#f87171'; ctx.fillRect(shrineTop.x, shrineTop.y - 28, 16, 11);
          ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(shrineTop.x + 4, shrineTop.y - 23, 2.6, 0, TAU); ctx.fill();
          ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.arc(shrineTop.x + 10, shrineTop.y - 23, 2.6, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = flagColor; ctx.beginPath(); ctx.moveTo(shrineTop.x, shrineTop.y - 28); ctx.lineTo(shrineTop.x + 20, shrineTop.y - 22); ctx.lineTo(shrineTop.x, shrineTop.y - 16); ctx.closePath(); ctx.fill();
        }
        ctx.font = "bold 10px 'Segoe UI', system-ui, sans-serif"; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(2,6,23,0.88)'; ctx.strokeText(C.label, shrineTop.x, shrineTop.y - 42);
        ctx.fillStyle = '#fde047'; ctx.fillText(C.label, shrineTop.x, shrineTop.y - 42);
      }

      const overlays = [];
      (C.scene || []).forEach((f) => {
        const p = projectFeature(P, f.x, 0, f.z);
        if (!p) return;
        overlays.push({ f, x: p.x, y: p.y, s: p.s });
      });
      const shrineP = projectFeature(P, 0, 0, 0);
      liveRef.current.liveProj = overlays.map((o) => ({ id: o.f.id, x: o.x, y: o.y }));
      const live = liveRef.current;
      const hours = live.result?.estimatedEntryDurationHours || 0;
      const loadPct = live.result ? Math.min(100, Math.round((live.result.perGateLoad / 6000) * 100)) : 0;

      overlays.filter((o) => o.f.zoneId && o.f.type !== 'gate').forEach((o) => {
        const dens = densityOf(o.f.zoneId);
        const col = dens > 0.72 ? '239,68,68' : dens > 0.44 ? '245,158,11' : '16,185,129';
        const baseR = o.s * (o.f.type === 'flame' ? 0.5 : 0.42);
        const r = Math.max(4, baseR + Math.sin(pulse + o.f.x) * 6);
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
        g.addColorStop(0, `rgba(${col},0.25)`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, TAU); ctx.fill();
      });

      const flow = (o, t, col) => {
        const fx = (1 - t) * o.f.x; const fz = (1 - t) * o.f.z;
        const p = projectFeature(P, fx, 0, fz); if (!p) return;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.6, 3.2 * p.s * 0.12 + 0.8), 0, TAU); ctx.fill();
      };
      overlays.filter((o) => o.f.type === 'gate').forEach((o) => {
        const t = (pulse * 0.06 + o.f.x * 0.07) % 1;
        const cols = ['rgba(56,189,248,0.9)', 'rgba(125,211,252,0.75)'];
        for (let k = 0; k < 3; k++) flow(o, (t + k / 3) % 1, cols[k % 2]);
      });

      overlays.filter((o) => o.f.type === 'gate').forEach((o) => {
        const barH = Math.max(7, (loadPct / 100) * 46);
        const bx = o.x, by = o.y - 66;
        ctx.fillStyle = 'rgba(2,6,23,0.82)'; ctx.fillRect(bx - 6, by - barH, 12, barH + 6);
        ctx.fillStyle = loadPct > 80 ? '#ef4444' : loadPct > 55 ? '#f59e0b' : '#10b981'; ctx.fillRect(bx - 4, by - barH + 3, 8, barH);
        if (hours > 2.5 && (hours > 4 || Math.sin(pulse * 1.2 + o.f.x) > 0.1)) {
          ctx.strokeStyle = 'rgba(239,68,68,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.arc(o.x, o.y - 40, 22 + Math.sin(pulse) * 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        }
      });

      overlays.forEach((o) => {
        const isHover = live.hovered === o.f.id;
        ctx.font = "bold 8px 'Segoe UI', system-ui, sans-serif"; ctx.textAlign = 'center';
        const labelY = o.y + 26; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(2,6,23,0.85)';
        ctx.strokeText(o.f.short || o.f.label, o.x, labelY);
        ctx.fillStyle = isHover ? '#fde047' : '#cbd5e1'; ctx.fillText(o.f.short || o.f.label, o.x, labelY);
        if (isHover) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(o.x, o.y + 6, 26 * o.s * 0.1 + 14, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      });

      const live2 = liveRef.current;
      if (live2.result?.additionalGates > 0 && shrineP) {
        ctx.fillStyle = 'rgba(234,88,12,0.92)'; ctx.beginPath(); ctx.moveTo(shrineP.x - 58, shrineP.y - 92); ctx.lineTo(shrineP.x + 58, shrineP.y - 92); ctx.lineTo(shrineP.x + 58, shrineP.y - 74); ctx.lineTo(shrineP.x - 58, shrineP.y - 74); ctx.closePath(); ctx.fill();
        ctx.font = "bold 9px 'Segoe UI', sans-serif"; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`+${live2.result.additionalGates} gates needed`, shrineP.x, shrineP.y - 80);
      }

      if (viewMode === 'inside' && insideRef.current.pointerLocked) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        ctx.strokeStyle = 'rgba(56,189,248,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 4, cy); ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 12, cy); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 4); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 12); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU); ctx.stroke();
      }

      ctx.font = "10px 'Segoe UI', system-ui, sans-serif"; ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(148,163,184,0.75)'; ctx.fillText(`${camInfo} · ${modeHint}`, canvas.width - 10, canvas.height - 10);

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      canvas.removeEventListener('mousemove', handleMouseMoveFP);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [templeId, zoom, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDown = (e) => {
    if (viewMode === 'dollhouse') {
      pulseRef.current.dragging = true;
      pulseRef.current.lastX = e.clientX;
      pulseRef.current.lastY = e.clientY;
    } else if (viewMode === 'floorplan') {
      pulseRef.current.dragging = true;
      pulseRef.current.lastX = e.clientX;
      pulseRef.current.lastY = e.clientY;
    } else if (viewMode === 'inside') {
      canvasRef.current?.requestPointerLock();
    }
  };
  const handleMove = (e) => {
    if (viewMode === 'dollhouse') {
      const cam = pulseRef.current;
      if (cam.dragging) {
        cam.yaw -= (e.clientX - cam.lastX) * 0.01;
        cam.pitch = Math.max(0.15, Math.min(1.15, cam.pitch + (e.clientY - cam.lastY) * 0.01));
        cam.lastX = e.clientX;
        cam.lastY = e.clientY;
      }
    } else if (viewMode === 'floorplan') {
      if (pulseRef.current.dragging) {
        const dx = (e.clientX - pulseRef.current.lastX) / (zoom * 45);
        const dy = (e.clientY - pulseRef.current.lastY) / (zoom * 45);
        insideRef.current.pos[0] -= dx;
        insideRef.current.pos[2] += dy;
        pulseRef.current.lastX = e.clientX;
        pulseRef.current.lastY = e.clientY;
      }
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left);
    const py = (e.clientY - rect.top);
    const live = liveRef.current;
    setHovered(live.hoverAt && live.hoverAt(px, py) || null);
  };
  const handleUp = () => { pulseRef.current.dragging = false; };
  const handleClick = (e) => {
    if (viewMode === 'inside' && !insideRef.current.pointerLocked) {
      canvasRef.current?.requestPointerLock();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left);
    const py = (e.clientY - rect.top);
    const live = liveRef.current;
    const hit = live.hoverAt && live.hoverAt(px, py);
    if (hit) {
      const f = (CORE_CFG[templeId] || CORE_CFG.tmp_somnath).scene.find((x) => x.id === hit);
      if (f) setSelected(f);
    } else {
      setSelected(null);
    }
  };

  liveRef.current.hoverAt = (px, py) => {
    const proj = liveRef.current.liveProj || [];
    let best = null;
    let bestD = 30;
    for (let i = proj.length - 1; i >= 0; i--) {
      const d = Math.hypot(px - proj[i].x, py - proj[i].y);
      if (d < bestD) { best = proj[i].id; bestD = d; }
    }
    return best;
  };

  const gates = (temple.gates || []).map((g) => {
    const linked = (cfg.scene || []).find((f) => f.gateId === g.id);
    const dens = densityOf(linked?.zoneId);
    const load = result ? Math.round((result.perGateLoad / 6000) * 100) : 0;
    const loadLabel = load > 80 ? 'HIGH' : load > 55 ? 'MODERATE' : 'CLEAR';
    return { ...g, density: dens, linked, load, loadLabel };
  });

  const liveCap = temple.live_capacity_percentage ?? 62;
  const crowdColor = liveCap > 75 ? '#ef4444' : liveCap > 45 ? '#f59e0b' : '#10b981';
  const hrs = result?.estimatedEntryDurationHours || 0;
  const simStatus = hrs > 3 ? 'OVERLOAD' : hrs > 1.8 ? 'STRESSED' : 'HEALTHY';
  const simColor = simStatus === 'OVERLOAD' ? '#ef4444' : simStatus === 'STRESSED' ? '#f59e0b' : '#10b981';
  const selectedFeature = selected ? (cfg.scene || []).find((f) => f.id === selected.id) : null;

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-slate-950 border border-violet-900/40 rounded-2xl p-4 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 w-max">
              <Sparkles className="w-3 h-3" /> 3D STRUCTURE DIGITAL TWIN
            </span>
            <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              {getLocalizedTempleName(temple)} — {cfg.label}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900/50 border border-white/10 rounded-lg p-1">
              {Object.entries(VIEW_MODES).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setViewMode(key); if (key === 'inside') { insideRef.current.pos = [0, 1.6, 2.5]; insideRef.current.yaw = 0; insideRef.current.pitch = 0; } else if (key === 'floorplan') { insideRef.current.pos = [0, 1.6, 2.5]; } }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded-md transition-all ${viewMode === key ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  title={meta.desc}
                >
                  <meta.icon className="w-3.5 h-3.5" />
                  {meta.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: crowdColor }} />
              <span className="text-slate-300">Live {liveCap}%</span>
              <span className="text-slate-500">· {temple.crowdLevel}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-300 border border-white/10 rounded-lg px-2 py-1.5 flex items-center gap-1.5" style={{ background: simColor + '22', borderColor: simColor + '55', color: simColor }}>
              <Zap className="w-3 h-3" /> TWIN {simStatus}
            </span>
          </div>
        </div>

        <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-white/10">
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
            {[['+', 0.18], ['-', -0.18]].map(([sym, delta]) => (
              <button
                key={sym}
                type="button"
                onClick={() => setZoom((z) => {
                  if (viewMode === 'floorplan') return Math.max(0.3, Math.min(3, z + delta * 2));
                  return Math.max(0.65, Math.min(1.8, z + delta));
                })}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 cursor-pointer"
                aria-label={`Zoom ${sym}`}
              >
                {sym === '+' ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setZoom(viewMode === 'floorplan' ? 1 : 1);
                if (viewMode === 'dollhouse') { pulseRef.current.yaw = -0.55; pulseRef.current.pitch = 0.42; }
                if (viewMode === 'inside') { insideRef.current.pos = [0, 1.6, 2.5]; insideRef.current.yaw = 0; insideRef.current.pitch = 0; }
                if (viewMode === 'floorplan') { insideRef.current.pos = [0, 1.6, 5]; }
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 cursor-pointer"
              aria-label="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1.5 text-[9px] font-mono text-slate-300 justify-end pointer-events-none">
            {viewMode === 'dollhouse' && (
              <>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: cfg.stoneTop }} /> Shikhara</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-cyan-400" /> Gates</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-white" /> Drag = orbit</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> pilgrims</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-red-400" /> overload</span>
              </>
            )}
            {viewMode === 'inside' && (
              <>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-emerald-500" /> Ground</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-amber-500" /> Walls</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><MousePointer className="w-2.5 h-2.5 text-cyan-400" /> Click to lock</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> pilgrims</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-red-400" /> bottleneck</span>
              </>
            )}
            {viewMode === 'floorplan' && (
              <>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: cfg.stoneTop }} /> Shrine</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-cyan-400" /> Gates</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-amber-500" /> Pavilions</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> flow</span>
                <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1">Drag pan · Scroll zoom</span>
              </>
            )}
          </div>

          <canvas
            ref={canvasRef}
            width={640}
            height={470}
            className="cursor-grab active:cursor-grabbing max-w-full w-full h-auto"
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={() => { handleUp(); setHovered(null); }}
            onClick={handleClick}
          />

          {!selectedFeature && (
            <div className="absolute bottom-2 left-2 bg-slate-950/70 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 font-mono pointer-events-none">
              {viewMode === 'dollhouse' && '▾ Click feature to inspect · drag = orbit · scroll = zoom'}
              {viewMode === 'inside' && '▾ Click to lock mouse · WASD = walk · Mouse = look · Esc = release'}
              {viewMode === 'floorplan' && '▾ Click feature to inspect · drag = pan · scroll = zoom'}
            </div>
          )}

          {selectedFeature && (
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/95 backdrop-blur-md border border-violet-500/40 p-3 rounded-xl text-xs animate-in slide-in-from-bottom">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-violet-300">{selectedFeature.label}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {(() => {
                      const gate = selectedFeature.gateId ? gates.find((g) => g.id === selectedFeature.gateId) : null;
                      if (gate) return `${gate.name} · ${gate.type.toUpperCase().replace('_', ' ')}${gate.desc ? ' · ' + gate.desc : ''}`;
                      if (selectedFeature.zoneId) {
                        const zone = temple.zones.find((z) => z.id === selectedFeature.zoneId);
                        if (zone) return `${zone.label} · real-time density ${densityOf(zone.id).toFixed(2)}/m²`;
                      }
                      return 'Real 3D structure of the temple';
                    })()}
                  </p>
                  {selectedFeature.gateId && (() => {
                    const g = gates.find((x) => x.id === selectedFeature.gateId);
                    return (
                      <p className="text-[10px] mt-1 font-bold" style={{ color: g.load > 80 ? '#ef4444' : g.load > 55 ? '#f59e0b' : '#10b981' }}>
                        Twin load {g.load}% · {hrs || '—'} hrs entry wait
                      </p>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-lg font-bold hover:bg-violet-500/30 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3 bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Twin Simulation Controls</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                  Expected Footfall: <span className="text-amber-400 font-mono text-sm">{(footfall || 0).toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="2500"
                  value={footfall}
                  onChange={(e) => setFootfall(parseInt(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>5,000</span><span>50,000</span><span>100,000</span></div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                  Active Entry Gates: <span className="text-amber-400 font-mono text-sm">{gatesOpen} Gates</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={gatesOpen}
                  onChange={(e) => setGatesOpen(parseInt(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>1 Gate</span><span>4 Gates</span><span>8 Gates</span></div>
              </div>
            </div>
            {result && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/70 border border-slate-700 p-2.5 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-medium flex items-center gap-1"><Users className="w-3 h-3" /> Per-Gate Load</p>
                  <p className="text-lg font-black text-amber-400 font-mono">{result.perGateLoad?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/70 border border-slate-700 p-2.5 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Entry Wait</p>
                  <p className={`text-lg font-black font-mono ${hrs > 3 ? 'text-red-400' : hrs > 1.8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {hrs} <span className="text-[10px] text-slate-500 font-normal">hrs</span>
                  </p>
                </div>
                <div className="bg-slate-800/70 border border-slate-700 p-2.5 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-medium flex items-center gap-1"><Zap className="w-3 h-3" /> Throughput</p>
                  <p className="text-lg font-black text-slate-200 font-mono">{result.throughputRate}<span className="text-[10px] text-slate-500 font-normal">/hr</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Real Temple Fact Sheet</p>
            <div className="space-y-1.5">
              {(cfg.facts || []).map((fact, i) => (
                <div key={i} className="grid grid-cols-[86px_1fr] gap-2 text-[11px] leading-snug">
                  <span className="text-violet-300 font-bold uppercase tracking-wide">{fact.label}</span>
                  <span className="text-slate-300">{fact.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};