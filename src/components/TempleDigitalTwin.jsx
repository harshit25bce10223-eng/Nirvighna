import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, MapPin, ZoomIn, ZoomOut, RotateCcw, Users, Clock, Zap, TrendingUp, Mountain, Cable, Waves, Activity } from 'lucide-react';
import { getTempleById, getLocalizedTempleName } from '../lib/templeRegistry';
import { digitalTwinEngine } from '../lib/digitalTwinEngine';

const TAU = Math.PI * 2;

const CORE_CFG = {
  tmp_somnath: {
    label: 'Somnath Shikhara',
    storeys: 2,
    spireTiers: 7,
    top: '#e7c99e',
    a: '#c9a06c',
    b: '#a67f52',
    spire: '#d9b582',
    kalash: '#c9852d',
    flag: true,
    pillarDots: 0,
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
    label: 'Jagat Mandir Shikhara',
    storeys: 5,
    spireTiers: 5,
    top: '#eadfc2',
    a: '#cdb98a',
    b: '#a99461',
    spire: '#d9c48d',
    kalash: '#d4a017',
    flag: 'sunmoon',
    pillarDots: 14,
    facts: [
      { label: 'Temple', value: 'Jagat Mandir — Lord Krishna (Dwarkadhish), Char Dham' },
      { label: 'Structure', value: 'Five storeys (Panch Bhumi) · 72 carved pillars · limestone & sandstone' },
      { label: 'Shikhara', value: '43 m (141 ft) · sacred Nishan flag (sun & moon) changed 2×/day' },
      { label: 'Gates', value: 'Swarg Dwar entry via 56 steps · Moksha Dwar exit near market' },
      { label: 'Sudama Setu', value: '230 m suspension bridge (2016) over the Gomti river' },
      { label: 'Bet Dwarka', value: 'Ancient Krishna palace site — ferry from Okha ghat' }
    ]
  },
  tmp_ambaji: {
    label: 'Ambaji Shikhara',
    storeys: 2,
    spireTiers: 4,
    top: '#f8f4e6',
    a: '#e4dcc0',
    b: '#c7bb96',
    spire: '#f5c542',
    kalash: '#e9b200',
    flag: 'trishul',
    pillarDots: 0,
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
    label: 'Kalika Mata Shikhara',
    storeys: 2,
    spireTiers: 3,
    top: '#c1704f',
    a: '#a0503a',
    b: '#7a3827',
    spire: '#a65a3c',
    kalash: '#8b3a2a',
    flag: 'chunri',
    pillarDots: 0,
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

const LAYOUTS = {
  tmp_somnath: {
    terrain: 'seafront',
    sea: { x: 0.5, y: 5.0, w: 9.5, d: 3.0 },
    features: [
      { id: 'shrine', type: 'temple', x: 0.4, y: -0.1, label: 'Somnath Jyotirlinga', short: 'Shrine' },
      { id: 'baan', type: 'baan', x: 0.9, y: 3.1, label: 'Baan-Stambh (Arrow Pillar)', short: 'Arrow Pillar' },
      { id: 'maha_gate', type: 'gate', x: -2.3, y: 2.2, label: 'Mahapravesh Dwar', short: 'Main Gate', gateId: 'som_g1', zoneId: 'zone_som_1', size: 1.0 },
      { id: 'wheel_gate', type: 'gate', x: 2.7, y: 1.7, label: 'Wheelchair Accessible Gate', short: 'Priority', gateId: 'som_g2', zoneId: 'zone_som_2', size: 0.8 },
      { id: 'triveni', type: 'ghat', x: -1.5, y: 3.9, label: 'Triveni Sangam Ghat', short: 'River Confluence + Sea' },
      { id: 'promenade', type: 'sea', x: 0.5, y: 4.4, label: 'Sea-Facing Promenade', short: 'Arabian Sea', zoneId: 'zone_som_3' },
      { id: 'nandi', type: 'pavilion', x: -0.6, y: 0.9, label: 'Nandi Mandap', short: 'Nandi' },
      { id: 'prasad', type: 'pavilion', x: 2.6, y: -2.4, label: 'Prasad Counter', short: 'Prasad', zoneId: 'zone_som_4' },
      { id: 'museum', type: 'pavilion', x: -2.8, y: -3.1, label: 'Prabhas Patan Museum', short: 'Museum' },
      { id: 'las', type: 'plaza', x: -3.1, y: -1.4, label: 'Light & Sound Show', short: 'Show Ground', zoneId: 'zone_som_5' },
      { id: 'helipad', type: 'parking', x: 3.7, y: -1.2, label: 'Helipad + P2 Parking', short: 'Helipad' },
      { id: 'parking', type: 'parking', x: -4.4, y: 0.8, label: 'P1 Veneshwar Parking', short: 'Parking' }
    ]
  },
  tmp_dwarka: {
    terrain: 'river',
    sea: { x: 0.6, y: 3.4, w: 11.0, d: 2.0 },
    features: [
      { id: 'shrine', type: 'temple', x: 0.3, y: -0.7, label: 'Dwarkadhish Jagat Mandir', short: '5-Storey Shrine' },
      { id: 'swarga', type: 'gate', x: -2.5, y: 0.9, label: 'Swarg Dwar (56 Steps)', short: 'Entry · South', gateId: 'dwa_g1', zoneId: 'zone_dwa_1', size: 1.0 },
      { id: 'moksha', type: 'gate', x: 3.0, y: -1.9, label: 'Moksha Dwar', short: 'Exit · Market', gateId: 'dwa_g2', zoneId: 'zone_dwa_2', size: 1.0 },
      { id: 'gomti', type: 'ghat', x: -1.3, y: 2.5, label: 'Gomti Ghat Steps', short: '56 kunds', zoneId: 'zone_dwa_3' },
      { id: 'setu', type: 'bridge', x: 1.5, y: 2.5, label: 'Sudama Setu (230 m)', short: 'Suspension Bridge' },
      { id: 'panchnad', type: 'marker', x: 3.3, y: 2.6, label: 'Panchnad Tirth', short: 'Island Side' },
      { id: 'ferry', type: 'ferry', x: 4.0, y: 3.3, label: 'Okha Ferry → Bet Dwarka', short: 'Boat Crossing' },
      { id: 'lockers', type: 'pavilion', x: 3.0, y: -3.0, label: 'Lockers & Footwear', short: 'Lockers' },
      { id: 'rukmini', type: 'pavilion', x: 4.6, y: -3.7, label: 'Rukmini Devi Mandir', short: '~2 km' },
      { id: 'nageshwar', type: 'marker', x: -4.3, y: -2.4, label: 'Nageshwar Jyotirlinga', short: '17 km' },
      { id: 'bazaar', type: 'plaza', x: 0.6, y: -3.6, label: 'Market Bazaar', short: 'Bazaar' }
    ]
  },
  tmp_ambaji: {
    terrain: 'hillwest',
    sea: null,
    features: [
      { id: 'shrine', type: 'temple', x: -0.4, y: 0.6, label: 'Ambaji Mata Temple', short: 'Visa Yantra' },
      { id: 'central', type: 'gate', x: -3.0, y: -0.5, label: 'Shakti Dwar - Central', short: 'Largest', gateId: 'amb_g1', zoneId: 'zone_amb_1', size: 1.1 },
      { id: 'gate7', type: 'gate', x: -3.0, y: 1.5, label: 'Shakti Dwar Gate 7', short: 'VIP / Senior', gateId: 'amb_g2', zoneId: 'zone_amb_2', size: 0.9 },
      { id: 'side', type: 'gate', x: -3.0, y: -2.3, label: 'Shakti Dwar - Side', short: 'Side Opening', gateId: 'amb_g3', size: 0.7 },
      { id: 'chowk', type: 'flame', x: 1.0, y: 1.4, label: 'Chachar Chowk', short: 'Akhand Jyot', zoneId: 'zone_amb_3' },
      { id: 'gabbar', type: 'hill', x: 4.5, y: -0.7, label: 'Gabbar Hill', short: '999 steps / Ropeway' },
      { id: 'ropeway', type: 'ropeway', x: 4.5, y: -0.7, base: [3.3, 0.7], top: [5.7, -2.1], label: 'Udan Khatola Ropeway', short: 'Cable Car' },
      { id: 'gabbar_shrine', type: 'marker', x: 5.7, y: -2.2, label: 'Gabbar Mata Shrine', short: 'Summit', zoneId: 'zone_amb_4' },
      { id: 'mansarovar', type: 'kund', x: 2.6, y: 2.9, label: 'Mansarovar Kund', short: 'Sacred Tank' },
      { id: 'havan', type: 'pavilion', x: -0.4, y: 3.3, label: 'Havan Shala', short: 'Ritual Hall' },
      { id: 'parking', type: 'parking', x: -4.6, y: -1.1, label: 'Highway Parking (P1-P3)', short: 'Parking' }
    ]
  },
  tmp_pavagadh: {
    terrain: 'hillfort',
    sea: null,
    features: [
      { id: 'hill', type: 'hill', x: 0.1, y: 0.7, label: 'Pavagadh Hill', short: '5 Plateaus' },
      { id: 'shrine', type: 'temple', x: -0.2, y: 1.2, label: 'Kalika Mata Temple', short: 'Summit Shrine', zoneId: 'zone_pav_4' },
      { id: 'dargah', type: 'pavilion', x: 0.8, y: 1.1, label: 'Sadan Shah Pir Dargah', short: 'Sufi Shrine' },
      { id: 'summit_q', type: 'plaza', x: -1.2, y: 1.5, label: 'Summit Stairs Queue', short: '250 steps up', zoneId: 'zone_pav_3' },
      { id: 'machi', type: 'gate', x: -3.4, y: -2.7, label: 'Machi Haveli Ropeway', short: 'Boarding', gateId: 'pav_g1', zoneId: 'zone_pav_1', size: 1.1 },
      { id: 'ropeway', type: 'ropeway', x: -0.2, y: 1.2, base: [-3.4, -2.7], top: [-0.2, 1.2], label: 'Pavagadh Ropeway', short: 'Since 1986' },
      { id: 'trek', type: 'gate', x: 3.1, y: -2.8, label: 'Trekking Base (2000 Steps)', short: 'Jungle Trail', gateId: 'pav_g2', zoneId: 'zone_pav_2', size: 0.9 },
      { id: 'trek_path', type: 'steps', x: 1.5, y: -0.9, label: 'Kalika Stairway', short: 'To Summit', zoneId: 'zone_pav_2' },
      { id: 'patai', type: 'waterfall', x: -4.5, y: -1.3, label: 'Patai Waterfall', short: 'Monsoon Falls' },
      { id: 'fort', type: 'fort', x: 3.9, y: -3.9, label: 'Pavagadh Fort Walls', short: 'UNESCO 2004' },
      { id: 'champaner', type: 'plaza', x: 4.7, y: -2.4, label: 'Champaner Heritage', short: 'Jami Masjid etc.' }
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
  const pulseRef = useRef({ angle: 0 });
  const posRef = useRef([]);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [footfall, setFootfall] = useState(28000);
  const [gatesOpen, setGatesOpen] = useState(4);
  const [result, setResult] = useState(null);

  const temple = useMemo(() => getTempleById(templeId), [templeId]);
  const layout = LAYOUTS[templeId] || LAYOUTS.tmp_somnath;
  const core = CORE_CFG[templeId] || CORE_CFG.tmp_somnath;

  const densityOf = (zoneId) => {
    if (!zoneId) return 0.4;
    const zone = temple.zones.find((z) => z.id === zoneId);
    return zone ? zone.baseDensity : 0.4;
  };

  useEffect(() => {
    let mounted = true;
    digitalTwinEngine
      .runDigitalTwinSimulation(templeId, footfall || 28000, gatesOpen || 4, new Date().toISOString().split('T')[0])
      .then((res) => {
        if (mounted) setResult(res);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [templeId, footfall, gatesOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    posRef.current = [];

    const T = 31 * zoom;
    const OX = 320;
    const OY = 252;
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
      ctx.strokeStyle = 'rgba(2,6,23,0.88)';
      ctx.strokeText(text, sx, sy);
      ctx.fillStyle = color;
      ctx.fillText(text, sx, sy);
    };

    const heatRing = (sx, sy, r, dens, pulse) => {
      const ring = r + Math.sin(pulse) * r * 0.2;
      const col = dens > 0.72 ? '#ef4444' : dens > 0.44 ? '#f59e0b' : '#10b981';
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(sx, sy, ring + 6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, ring, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawShikhara = (f, cfg) => {
      const [sx, sy] = proj(f.x, f.y, 0);
      isoBox(f.x, f.y, 2.3, 1.25, 7, '#8b8174', '#6f665c', '#554d45');
      let hw = 1.7;
      let hd = 0.92;
      for (let s = 0; s < cfg.storeys; s++) {
        isoBox(f.x, f.y - 0.12 * s, hw, hd, 16 + s * 9, cfg.top, cfg.a, cfg.b);
        hw *= 0.92;
        hd *= 0.92;
      }
      if (cfg.storeys === 5) {
        for (let i = 0; i < cfg.pillarDots; i++) {
          const ang = (i / cfg.pillarDots) * TAU;
          const px = f.x + Math.cos(ang) * 1.15;
          const py = f.y + Math.sin(ang) * 1.15;
          ctx.fillStyle = '#efe6c8';
          ctx.beginPath();
          ctx.arc(proj(px, py, 8)[0], proj(px, py, 8)[1], 2.6, 0, TAU);
          ctx.fill();
        }
      }
      let zh = 24 + cfg.storeys * 9;
      let tw = hw;
      for (let i = 0; i < cfg.spireTiers; i++) {
        isoBox(f.x, f.y - 0.16 * cfg.storeys, tw, tw * 0.54, zh, cfg.spire, cfg.a, cfg.b);
        tw *= 0.82;
        zh += 16;
      }
      const topZ = zh + 2;
      isoBox(f.x, f.y - 0.16 * cfg.storeys, tw * 0.6, tw * 0.4, topZ, cfg.kalash, '#7a4a14', '#5a360e');
      isoBox(f.x, f.y - 0.16 * cfg.storeys, 0.1, 0.07, topZ + 7, '#fde047', '#d4a017', '#a67f0e');
      const poleTop = proj(f.x, f.y - 0.16 * cfg.storeys, topZ + 7);
      if (cfg.flag === true) {
        ctx.strokeStyle = '#e2c08d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(poleTop[0], poleTop[1]);
        ctx.lineTo(poleTop[0], poleTop[1] - 34);
        ctx.stroke();
        ctx.fillStyle = '#e2572c';
        ctx.beginPath();
        ctx.moveTo(poleTop[0], poleTop[1] - 34);
        ctx.lineTo(poleTop[0] + 22, poleTop[1] - 27);
        ctx.lineTo(poleTop[0], poleTop[1] - 19);
        ctx.closePath();
        ctx.fill();
      } else if (cfg.flag === 'sunmoon') {
        ctx.strokeStyle = '#d9c48d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(poleTop[0], poleTop[1]);
        ctx.lineTo(poleTop[0], poleTop[1] - 38);
        ctx.stroke();
        ctx.fillStyle = '#f87171';
        ctx.fillRect(poleTop[0], poleTop[1] - 36, 18, 12);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(poleTop[0] + 5, poleTop[1] - 30, 3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.arc(poleTop[0] + 12, poleTop[1] - 30, 3, 0, TAU);
        ctx.fill();
      } else if (cfg.flag === 'trishul' || cfg.flag === 'chunri') {
        ctx.strokeStyle = cfg.flag === 'trishul' ? '#f5c542' : '#c9b7a4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(poleTop[0], poleTop[1]);
        ctx.lineTo(poleTop[0], poleTop[1] - 36);
        ctx.stroke();
        ctx.fillStyle = cfg.flag === 'trishul' ? '#f59e0b' : '#b45309';
        if (cfg.flag === 'trishul') {
          for (let i = -1; i <= 1; i++) {
            ctx.fillRect(poleTop[0] + i * 6 - 1.5, poleTop[1] - 40, 3, 8);
          }
          ctx.beginPath();
          ctx.moveTo(poleTop[0], poleTop[1] - 50);
          ctx.lineTo(poleTop[0] + 5, poleTop[1] - 42);
          ctx.lineTo(poleTop[0] - 5, poleTop[1] - 42);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(poleTop[0], poleTop[1] - 36, 16, 10);
        }
      }
      label(sx, sy - zh - 46, cfg.label, '#fde047', 10, 'bold');
    };

    const renderMap = () => {
      const pulse = (pulseRef.current.angle += 0.05);
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

      const corners = [-5.5, 5.5];
      const pts = [proj(corners[0], corners[0], 0), proj(corners[1], corners[0], 0), proj(corners[1], corners[1], 0), proj(corners[0], corners[1], 0)];
      ctx.fillStyle = 'rgba(30,41,59,0.62)';
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.lineTo(pts[3][0], pts[3][1]);
      ctx.closePath();
      ctx.fill();

      if (layout.sea) {
        const [nw, ne] = [proj(layout.sea.x - 5.4, layout.sea.y - layout.sea.d, 0), proj(layout.sea.x + 5.4, layout.sea.y - layout.sea.d, 0)];
        const [sw, se] = [proj(layout.sea.x - 5.4, layout.sea.y, 0), proj(layout.sea.x + 5.4, layout.sea.y, 0)];
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
          for (let xx = layout.sea.x - 5.2; xx <= layout.sea.x + 5.2; xx += 0.3) {
            const [px, py] = proj(xx, yy, 0);
            const wave = Math.sin(xx * 1.6 + pulse * (1 + i * 0.25)) * 2.4;
            if (xx === layout.sea.x - 5.2) ctx.moveTo(px, py + wave);
            else ctx.lineTo(px, py + wave);
          }
          ctx.strokeStyle = `rgba(103,232,249,${0.35 - i * 0.08})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      const features = [...layout.features];
      const hillTop = features.find((f) => f.id === 'hill');

      if (hillTop) {
        const [sx, sy] = proj(hillTop.x, hillTop.y, 0);
        ellipse(sx, sy, 1.05 * T, 0.5 * T, 'rgba(42,68,58,0.9)');
        ellipse(sx, sy, 0.85 * T, 0.4 * T, 'rgba(16,90,66,0.95)');
        ellipse(sx, sy, 0.62 * T, 0.3 * T, 'rgba(13,72,53,0.98)');
        ellipse(sx, sy, 0.4 * T, 0.19 * T, 'rgba(10,58,43,1)');
        const [tsx, tsy] = proj(hillTop.x, hillTop.y, -4);
        ellipse(tsx - 0.05 * T, tsy, 0.3 * T, 0.14 * T, 'rgba(6,40,30,1)');
      }

      features
        .filter((f) => f.type === 'gabbar')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          ellipse(sx, sy, 1.15 * T, 0.55 * T, 'rgba(30,60,45,0.9)');
          ellipse(sx, sy, 0.92 * T, 0.44 * T, 'rgba(19,82,57,0.95)');
          ellipse(sx, sy, 0.66 * T, 0.32 * T, 'rgba(13,70,50,1)');
          const [tsx, tsy] = proj(f.x, f.y, -6);
          ellipse(tsx, tsy, 0.42 * T, 0.2 * T, 'rgba(8,50,36,1)');
        });

      features
        .filter((f) => f.type === 'ghat')
        .forEach((f) => {
          isoBox(f.x, f.y, 1.2, 0.55, 6, 'rgba(148,163,184,0.5)', 'rgba(100,116,139,0.55)', 'rgba(71,85,105,0.55)');
          for (let i = 0; i < 4; i++) {
            const yr = f.y + 0.28 - i * 0.18;
            const [ax, ay] = proj(f.x - 0.9, yr, 0);
            const [bx, by] = proj(f.x + 0.9, yr, 0);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = 'rgba(226,232,240,0.4)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        });

      features
        .filter((f) => f.type === 'steps' || f.type === 'marker')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          if (f.type === 'marker') {
            ctx.fillStyle = f.id === 'gabbar_shrine' ? '#f59e0b' : '#f472b6';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 10);
            ctx.lineTo(sx + 7, sy);
            ctx.lineTo(sx, sy + 10);
            ctx.lineTo(sx - 7, sy);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(226,232,240,0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            const start = proj(f.x - 1.4, f.y - 1.2, 0);
            const endPt = proj(f.x + 1.4, f.y + 1.2, 0);
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(endPt[0], endPt[1]);
            ctx.stroke();
            ctx.setLineDash([]);
            const dotT = ((pulse * 0.05) % 1 + 1) % 1;
            const dx = endPt[0] - start[0];
            const dy = endPt[1] - start[1];
            ctx.fillStyle = '#c4b5fd';
            ctx.beginPath();
            ctx.arc(start[0] + dx * dotT, start[1] + dy * dotT, 3.5, 0, TAU);
            ctx.fill();
          }
        });

      features
        .filter((f) => f.type === 'kund')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          ellipse(sx, sy, 0.5 * T, 0.26 * T, 'rgba(56,130,246,0.2)');
          ellipse(sx, sy, 0.4 * T, 0.2 * T, 'rgba(96,165,250,0.22)');
          ctx.strokeStyle = 'rgba(147,197,253,0.55)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 0.45 * T, 0.23 * T, 0, 0, TAU);
          ctx.stroke();
        });

      features
        .filter((f) => f.type === 'waterfall')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          const fall = 22 + Math.sin(pulse * 2.2) * 3;
          ctx.fillStyle = 'rgba(186,230,253,0.75)';
          ctx.beginPath();
          ctx.moveTo(sx - 12, sy - fall);
          ctx.lineTo(sx + 12, sy - fall);
          ctx.lineTo(sx + 8, sy);
          ctx.lineTo(sx - 8, sy);
          ctx.closePath();
          ctx.fill();
        });

      features
        .filter((f) => f.type === 'fort')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          ctx.strokeStyle = 'rgba(180,170,150,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx - 30, sy);
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(sx - 22 + i * 12, sy - 9);
            ctx.lineTo(sx - 16 + i * 12, sy);
          }
          ctx.stroke();
        });

      features
        .filter((f) => ['plaza', 'parking', 'flame'].includes(f.type))
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          ctx.fillStyle = f.type === 'flame' ? 'rgba(120,95,25,0.55)' : f.type === 'plaza' ? 'rgba(100,116,139,0.3)' : 'rgba(71,85,105,0.28)';
          ctx.beginPath();
          ctx.arc(sx, sy, (f.type === 'plaza' ? 0.6 : 0.42) * T, 0, TAU);
          ctx.fill();
          if (f.type === 'flame') {
            const flameY = Math.sin(pulse * 3) * 3;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 18 - flameY);
            ctx.quadraticCurveTo(sx + 9, sy - 6, sx + 5, sy);
            ctx.quadraticCurveTo(sx, sy + 6, sx - 5, sy);
            ctx.quadraticCurveTo(sx - 9, sy - 6, sx, sy - 18 - flameY);
            ctx.fill();
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(sx, sy - 8 - flameY * 0.5, 4, 0, TAU);
            ctx.fill();
          }
        });

      features
        .filter((f) => f.type === 'bridge')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          isoBox(f.x, f.y, 1.7, 0.4, 14, 'rgba(226,232,240,0.92)', 'rgba(148,163,184,0.95)', 'rgba(100,116,139,0.95)');
          const [p0, p1] = [proj(f.x - 1.6, f.y, 0), proj(f.x + 1.6, f.y, 0)];
          const [a0, a1] = [proj(f.x - 1.6, f.y, 40), proj(f.x + 1.6, f.y, 40)];
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(a0[0], a0[1]);
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(a1[0], a1[1]);
          ctx.stroke();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(a0[0], a0[1]);
          ctx.quadraticCurveTo((a0[0] + a1[0]) / 2, Math.min(a0[1], a1[1]) - 16, a1[0], a1[1]);
          ctx.stroke();
          ctx.setLineDash([]);
        });

      features
        .filter((f) => f.type === 'ferry')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          isoBox(f.x, f.y, 0.7, 0.4, 10, '#94a3b8', '#64748b', '#475569');
          const bob = Math.sin(pulse * 1.4) * 3;
          ctx.fillStyle = '#0ea5e9';
          ctx.beginPath();
          ctx.moveTo(sx - 15, sy - bob);
          ctx.lineTo(sx - 7, sy - 13 - bob);
          ctx.lineTo(sx + 13, sy - 13 - bob);
          ctx.lineTo(sx + 17, sy - bob);
          ctx.closePath();
          ctx.fill();
          label(sx, sy - 25 - bob, '⛴ Bet Dwarka', '#7dd3fc', 8, 'bold');
        });

      features
        .filter((f) => f.type === 'ropeway')
        .forEach((f) => {
          const [bx, by] = proj(f.base[0], f.base[1], -30);
          const [tx, ty] = proj(f.top[0], f.top[1], -60);
          ctx.strokeStyle = 'rgba(167,139,250,0.65)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(bx[0], bx[1]);
          ctx.lineTo(tx[0], tx[1]);
          ctx.stroke();
          ctx.setLineDash([]);
          for (let i = 0; i < 3; i++) {
            const t = ((pulse * 0.07 + i / 3) % 1 + 1) % 1;
            const cx = bx[0] + (tx[0] - bx[0]) * t;
            const cy = bx[1] + (tx[1] - bx[1]) * t;
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(cx, cy, 4.5, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          isoBox(f.base[0], f.base[1], 0.5, 0.35, 24, '#c4b5fd', '#8b5cf6', '#6d28d9');
        });

      features
        .filter((f) => f.type === 'baan')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          isoBox(f.x, f.y, 0.16, 0.12, 46, '#e7c99e', '#b08a5d', '#8a6742');
          const tip = proj(f.x, f.y, 44);
          ctx.fillStyle = '#d9b582';
          ctx.beginPath();
          ctx.moveTo(tip[0], tip[1] - 20);
          ctx.lineTo(tip[0] + 7, tip[1]);
          ctx.lineTo(tip[0] - 7, tip[1]);
          ctx.closePath();
          ctx.fill();
        });

      const drawOrder = features
        .filter((f) => f.type === 'temple' || f.type === 'gate' || f.type === 'pavilion')
        .sort((a, b) => proj(a.x, a.y, 0)[1] - proj(b.x, b.y, 0)[1]);

      drawOrder.forEach((f) => {
        if (f.type === 'temple') {
          drawShikhara(f, core);
          const [sx, sy] = proj(f.x, f.y, 0);
          if (core.facts) {
            heatRing(sx, sy, 28, densityOf(f.zoneId) || 0.62, pulse);
          }
        } else if (f.type === 'pavilion') {
          isoBox(f.x, f.y, 0.7, 0.42, 20, '#c8a24a', '#a5802f', '#7c5f1e');
        } else if (f.type === 'gate') {
          const color = GATE_COLORS[f.gateId ? (gates.find((g) => g.id === f.gateId) || {}).type : 'entry_and_exit'] || '#22d3ee';
          isoBox(f.x - 0.2, f.y + 0.08, 0.14, 0.12, 26, '#e2e8f0', '#94a3b8', '#64748b');
          isoBox(f.x + 0.2, f.y - 0.08, 0.14, 0.12, 26, '#e2e8f0', '#94a3b8', '#64748b');
          isoBox(f.x, f.y, 0.62 * (f.size || 1), 0.26 * (f.size || 1), 32, color, '#0e7490', '#155e75');
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(proj(f.x, f.y, 0)[0], proj(f.x, f.y, 0)[1] - 34);
          ctx.lineTo(proj(f.x, f.y, 0)[0] + (f.size || 1) * 10, proj(f.x, f.y, 0)[1] - 28);
          ctx.lineTo(proj(f.x, f.y, 0)[0], proj(f.x, f.y, 0)[1] - 22);
          ctx.lineTo(proj(f.x, f.y, 0)[0] - (f.size || 1) * 10, proj(f.x, f.y, 0)[1] - 28);
          ctx.closePath();
          ctx.fill();
          const dens = densityOf(f.zoneId);
          heatRing(proj(f.x, f.y, 0)[0], proj(f.x, f.y, 0)[1], 16 + (f.size || 1) * 8, dens, pulse);
          const [sx, sy] = proj(f.x, f.y, 0);
          label(sx, sy - 46, f.label, '#f0f9ff', 9, 'bold');
        }
      });

      const shrine = features.find((f) => f.type === 'temple');
      const shrinePos = shrine ? proj(shrine.x, shrine.y, 0) : [320, 240];
      const flowScale = 0.6 + Math.min(2, (footfall || 28000) / 16000);

      features
        .filter((f) => f.type === 'gate')
        .forEach((f) => {
          const from = proj(f.x, f.y, 0);
          const dx = shrinePos[0] - from[0];
          const dy = shrinePos[1] - from[1];
          const len = Math.hypot(dx, dy) * flowScale;
          const nx = dx / Math.hypot(dx, dy);
          const ny = dy / Math.hypot(dx, dy);
          const startT = (pulse * 0.06) % 1;
          ctx.strokeStyle = 'rgba(56,189,248,0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const sSeg = from[0] + nx * startT * len;
          const eSeg = from[0] + nx * Math.min(1, startT + 0.3) * len;
          ctx.moveTo(sSeg, from[1] + ny * startT * len);
          ctx.lineTo(eSeg, from[1] + ny * Math.min(1, startT + 0.3) * len);
          ctx.stroke();
        });

      const hours = result?.estimatedEntryDurationHours || 0;
      const loadPct = result ? Math.min(100, Math.round((result.perGateLoad / 6000) * 100)) : 0;
      features
        .filter((f) => f.type === 'gate')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          if (result) {
            const barH = Math.max(6, (loadPct / 100) * 40);
            ctx.fillStyle = 'rgba(2,6,23,0.8)';
            ctx.fillRect(sx - 5, sy - 92 - barH, 10, barH + 6);
            ctx.fillStyle = loadPct > 80 ? '#ef4444' : loadPct > 55 ? '#f59e0b' : '#10b981';
            ctx.fillRect(sx - 4, sy - 88 - barH, 8, barH);
          }
          if (hours > 2.5 && (hours > 4 || Math.sin(pulse * 1.2 + f.x) > 0.1)) {
            ctx.strokeStyle = 'rgba(239,68,68,0.85)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(sx, sy - 34, 24 + Math.sin(pulse) * 3, 0, TAU);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });

      features
        .filter((f) => f.zoneId && f.type !== 'gate' && f.type !== 'temple')
        .forEach((f) => {
          const [sx, sy] = proj(f.x, f.y, 0);
          heatRing(sx, sy, 18, densityOf(f.zoneId), pulse);
        });

      if (result?.additionalGates > 0) {
        const [sx, sy] = shrinePos;
        ctx.fillStyle = 'rgba(234,88,12,0.92)';
        ctx.beginPath();
        ctx.moveTo(sx + 18, sy - 148);
        ctx.lineTo(sx + 116, sy - 148);
        ctx.lineTo(sx + 116, sy - 129);
        ctx.lineTo(sx + 18, sy - 129);
        ctx.closePath();
        ctx.fill();
        label(sx + 67, sy - 136, `+${result.additionalGates} gates needed`, '#fff', 9, 'bold');
      }

      features.forEach((f) => {
        if (f.id === 'shrine' || f.id === 'hill') return;
        const [sx, sy] = proj(f.x, f.y, 0);
        posRef.current.push({ id: f.id, sx, sy, radius: 20 + (f.size || 0) * 14 });
        if (hovered === f.id) {
          ctx.beginPath();
          ctx.arc(sx, sy, 24 + (f.size || 0) * 14, 0, TAU);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (f.type !== 'sea') {
          label(sx, sy + 20, f.short || f.label, '#cbd5e1', 8, 'normal');
        }
      });

      const [tsx, tsy] = shrinePos;
      ctx.fillStyle = 'rgba(251,191,36,0.16)';
      ctx.beginPath();
      ctx.arc(tsx, tsy, 30 + Math.sin(pulse) * 4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251,191,36,0.45)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      animFrame = requestAnimationFrame(renderMap);
    };

    renderMap();
    return () => cancelAnimationFrame(animFrame);
  }); // eslint-disable-line react-hooks/exhaustive-deps

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

  const gates = (temple.gates || []).map((g) => {
    const linked = layout.features.find((f) => f.gateId === g.id);
    const dens = densityOf(linked?.zoneId);
    const load = result ? Math.round((result.perGateLoad / 6000) * 100) : 0;
    const loadLabel = load > 80 ? 'HIGH' : load > 55 ? 'MODERATE' : 'CLEAR';
    return { ...g, density: dens, linked, load, loadLabel };
  });

  const liveCap = temple.live_capacity_percentage ?? 62;
  const crowdColor = liveCap > 75 ? '#ef4444' : liveCap > 45 ? '#f59e0b' : '#10b981';
  const simStatus = (result?.estimatedEntryDurationHours || 0) > 3 ? 'OVERLOAD' : (result?.estimatedEntryDurationHours || 0) > 1.8 ? 'STRESSED' : 'HEALTHY';
  const simColor = simStatus === 'OVERLOAD' ? '#ef4444' : simStatus === 'STRESSED' ? '#f59e0b' : '#10b981';
  const selectedFeature = selected ? layout.features.find((f) => f.id === selected.id) : null;

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-slate-950 border border-amber-900/30 rounded-2xl p-4 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 w-max">
              <Sparkles className="w-3 h-3" /> REAL TEMPLE DIGITAL TWIN
            </span>
            <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              {getLocalizedTempleName(temple)} — {core.label}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{core.style || core.facts[0].value}</p>
          </div>
          <div className="flex items-center gap-2">
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
            {[['+', 0.15], ['-', -0.15]].map(([sym, delta]) => (
              <button
                key={sym}
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, Math.min(1.6, z + delta)))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 cursor-pointer"
                aria-label={`Zoom ${sym}`}
              >
                {sym === '+' ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
              </button>
            ))}
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
            <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: core.top }} /> Shrine</span>
            <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-cyan-400" /> Gates</span>
            {layout.sea && <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Waves className="w-2.5 h-2.5 text-blue-400" /> {layout.terrain === 'seafront' ? 'Sea' : 'River'}</span>}
            {featuresSome(layout, 'ropeway') && <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Cable className="w-2.5 h-2.5 text-violet-400" /> Ropeway</span>}
            {featuresSome(layout, 'hill') && <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><Mountain className="w-2.5 h-2.5 text-emerald-400" /> Hill</span>}
            {featuresSome(layout, 'bridge') && <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-slate-300" /> Suspension</span>}
          </div>

          <canvas
            ref={canvasRef}
            width={640}
            height={470}
            className="cursor-pointer max-w-full w-full h-auto"
            onClick={(e) => {
              const hit = hitTest(e.clientX, e.clientY);
              setSelected(hit ? layout.features.find((f) => f.id === hit) : null);
            }}
            onMouseMove={(e) => setHovered(hitTest(e.clientX, e.clientY))}
            onMouseLeave={() => setHovered(null)}
          />

          {selectedFeature && (
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/95 backdrop-blur-md border border-violet-500/40 p-3 rounded-xl text-xs animate-in slide-in-from-bottom">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-violet-300">{selectedFeature.label}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {(() => {
                      const gate = selectedFeature.gateId ? gates.find((g) => g.id === selectedFeature.gateId) : null;
                      const fact = (core.facts || []).find((fc) => fc.label === selectedFeature.label);
                      if (gate) return `${gate.name} · ${gate.type.toUpperCase().replace('_', ' ')}${gate.desc ? ' · ' + gate.desc : ''}`;
                      if (selectedFeature.zoneId) {
                        const zone = temple.zones.find((z) => z.id === selectedFeature.zoneId);
                        if (zone) return `${zone.label} · real-time density ${densityOf(zone.id).toFixed(2)}/m²`;
                      }
                      if (fact) return fact.value;
                      return null;
                    })()}
                  </p>
                  {selectedFeature.gateId && (() => {
                    const g = gates.find((x) => x.id === selectedFeature.gateId);
                    return (
                      <p className="text-[10px] mt-1 font-bold" style={{ color: g.load > 80 ? '#ef4444' : g.load > 55 ? '#f59e0b' : '#10b981' }}>
                        Twin load {g.load}% · gives {result?.estimatedEntryDurationHours || '—'} hrs entry wait
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
                  <p className={`text-lg font-black font-mono ${result.estimatedEntryDurationHours > 3 ? 'text-red-400' : result.estimatedEntryDurationHours > 1.8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {result.estimatedEntryDurationHours} <span className="text-[10px] text-slate-500 font-normal">hrs</span>
                  </p>
                </div>
                <div className="bg-slate-800/70 border border-slate-700 p-2.5 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-medium flex items-center gap-1"><Zap className="w-3 h-3" /> Throughput</p>
                  <p className="text-lg font-black text-slate-200 font-mono">{result.throughputRate}<span className="text-[10px] text-slate-500 font-normal">/hr</span></p>
                </div>
              </div>
            )}
            {result && (
              <p className="text-xs leading-relaxed px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                {result.recommendation}
              </p>
            )}
          </div>

          <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Real Temple Fact Sheet</p>
            <div className="space-y-1.5">
              {(core.facts || []).map((fact, i) => (
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

function featuresSome(layout, type) {
  return (layout.features || []).some((f) => f.type === type || (type === 'hill' && f.id === 'hill'));
}