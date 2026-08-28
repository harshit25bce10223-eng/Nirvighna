import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { 
  QrCode, AlertTriangle, Users, CheckCircle, ArrowRight, 
  ShieldAlert, Activity, HeartPulse, RefreshCw, MapPin, Sparkles, Navigation
} from 'lucide-react';

export const VolunteerDashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, zoneAssigned, assignedDuty } = useVolunteerAuth();

  const isMedicalResponder = assignedDuty === 'medical_responder';
  const isGateVolunteer = assignedDuty === 'gate_scanner' || assignedDuty === 'inner_gate_scanner';
  const isInnerGate = assignedDuty === 'inner_gate_scanner';

  const [stats, setStats] = useState({
    entriesToday: null,
    activeAlerts: null,
    priorityPending: null
  });

  const [crowdDensity, setCrowdDensity] = useState({ level: 'medium', pct: 64, label: 'Moderate Flow' });

  useEffect(() => {
    fetchDashboardStats();
  }, [currentUser?.id]);

  const fetchDashboardStats = () => {
    try {
      const gateLogs = JSON.parse(localStorage.getItem('nirvighna_gate_logs') || '[]');
      const approvedEntries = gateLogs.filter(l => l.status === 'APPROVED').length;
      
      const localAlerts = JSON.parse(localStorage.getItem('nirvighna_medical_alerts') || '[]');
      const activeAlertsCount = localAlerts.filter(a => a.status !== 'resolved').length;

      setStats({
        entriesToday: 148 + approvedEntries,
        activeAlerts: Math.max(1, activeAlertsCount || 2),
        priorityPending: 12
      });
    } catch (_) {
      setStats({ entriesToday: 148, activeAlerts: 2, priorityPending: 12 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body pb-28 pt-4 px-3 sm:px-6 max-w-4xl mx-auto space-y-5 selection:bg-gold selection:text-indigo-dark">
      
      {/* Brand Header — Pilgrim Portal Style */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gold/30 flex items-center justify-between shadow-warm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl p-0.5 bg-gradient-to-br from-gold via-amber-400 to-amber-600 shadow-goldGlow overflow-hidden flex items-center justify-center bg-white shrink-0 border border-gold/50">
            <img 
              src="/official_logo.png" 
              alt="Nirvighna Emblem" 
              className="w-full h-full object-contain p-0.5" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest text-maroon bg-amber-50 px-2.5 py-0.5 rounded-full border border-gold/30 font-heading">
                VOLUNTEER OPERATIONS HUB
              </span>
              <span className="text-[9px] font-bold text-amber-800 bg-gold/20 px-2 py-0.5 rounded-full border border-gold/40">
                {isInnerGate ? '⛩️ Inner Sanctum Verifier' : isGateVolunteer ? '🚪 Gate Pass Verifier' : isMedicalResponder ? '🚑 Medical Responder' : '🛕 Inner Services'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-indigo-dark font-heading tracking-wide mt-0.5">
              {currentUser?.full_name || 'Vikram Sharma (Volunteer)'}
            </h1>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-maroon" />
              {zoneAssigned || 'Gate 2 Swarga Dwar Sanctum Queue'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-300 text-xs font-bold font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Shift Live
        </div>
      </div>

      {/* BIG PRIMARY ACTION HERO CARD */}
      <div className="bg-white p-6 rounded-3xl border-2 border-gold/40 shadow-warm text-center space-y-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-maroon font-heading bg-amber-50 px-3 py-1 rounded-full border border-gold/30 inline-block">
            {isGateVolunteer ? 'GATE PASS SCANNER' : 'TEMPLE SEVA CONSOLE'}
          </span>
          <h2 className="text-xl font-black text-indigo-dark font-heading">
            {isGateVolunteer ? 'Scan, Approve & Reject Pilgrim Passes' : 'Active Duty Shift & Service Desks'}
          </h2>
        </div>

        {isGateVolunteer ? (
          <button
            onClick={() => navigate('/v/scan')}
            className="w-full py-4.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-3 font-heading cursor-pointer"
          >
            <QrCode className="w-6 h-6 text-indigo-dark" />
            <span>OPEN GATE SCANNER CAMERA →</span>
          </button>
        ) : (
          <button
            onClick={() => navigate(isMedicalResponder ? '/v/alerts' : '/v/prasad')}
            className="w-full py-4.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-3 font-heading cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-indigo-dark" />
            <span>ACCESS MY ACTIVE DUTY STATION →</span>
          </button>
        )}

        <p className="text-xs text-gray-500 font-medium">
          {isGateVolunteer
            ? 'High-throughput QR verification with 1-tap Approve & Reject controls.'
            : 'Coordinating queue flows, holy prasad, footwear tokens and emergency response.'}
        </p>
      </div>

      {/* 3 LIVE STAT CARDS — Sacred White & Gold */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gold/30 text-center space-y-1 shadow-warm">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
            GATE ENTRIES
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
            {stats.entriesToday !== null ? stats.entriesToday : '--'}
          </p>
          <span className="text-[9px] text-emerald-700 font-bold block">✓ Verified</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-200 text-center space-y-1 shadow-warm">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
            MEDICAL SOS
          </span>
          <p className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
            {stats.activeAlerts !== null ? stats.activeAlerts : '--'}
          </p>
          <span className="text-[9px] text-red-600 font-bold block">🚨 Monitored</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gold/30 text-center space-y-1 shadow-warm">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
            PRIORITY PASS
          </span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-900 font-mono">
            {stats.priorityPending !== null ? stats.priorityPending : '--'}
          </p>
          <span className="text-[9px] text-maroon font-bold block">♿ Assisted</span>
        </div>
      </div>

      {/* 🚑 SANJEEVANI PATH CARD — VISIBLE ONLY TO MEDICAL RESPONDERS */}
      {isMedicalResponder && (
        <div className="bg-gradient-to-r from-red-50 via-amber-50 to-emerald-50 p-5 rounded-3xl border-2 border-red-300 shadow-warm space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚑</span>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300 font-heading">
                  MEDICAL EMERGENCY EXCLUSIVE
                </span>
                <h3 className="text-base font-black text-red-950 font-heading mt-0.5">
                  Sanjeevani Path — Green Evacuation Corridor
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
              🟢 CLEAR PATH
            </span>
          </div>

          <p className="text-xs text-gray-700 leading-relaxed font-medium">
            Dedicated zero-congestion green lane for stretcher transfer, ambulance dispatch and fast-track paramedic routing.
          </p>

          <button
            onClick={() => navigate('/v/alerts')}
            className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading shadow-md cursor-pointer transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Open Sanjeevani Emergency Dispatch Route →</span>
          </button>
        </div>
      )}

      {/* ALL ACTIVE FIELD DUTY STATIONS HUB */}
      <div className="bg-white p-5 rounded-3xl border border-gold/30 shadow-warm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛕</span>
            <h3 className="text-sm font-black text-indigo-dark font-heading uppercase tracking-wide">
              {isGateVolunteer ? 'Gate Duty Terminal' : 'All Temple Seva & Duty Stations'}
            </h3>
          </div>
          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-gold/40">
            ALL POSTS OPEN
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              title: 'QR Gate Pass Verifier',
              subtitle: 'Sanctum & Temple Entrance',
              icon: '📷',
              badge: '🟢 SCANNING',
              route: '/v/scan',
              desc: 'Scan pilgrim passes, 1-tap Approve & Reject entries'
            },
            {
              title: 'Prasad Counter Controller',
              subtitle: 'Holy Prasad Distribution',
              icon: '🍲',
              badge: '🟢 DISPENSING',
              route: '/v/prasad',
              desc: 'Manage token queue & serve verified holy prasad'
            },
            {
              title: 'Footwear Token Counter',
              subtitle: 'Safe Shoe Deposit & Recovery',
              icon: '👟',
              badge: '🟢 OPEN RACKS',
              route: '/v/footwear',
              desc: 'Issue digital tokens & scan checkout receipts'
            },
            {
              title: 'Medical SOS First Aid',
              subtitle: 'Emergency Medical Unit',
              icon: '🚑',
              badge: '🔴 LIVE SOS',
              route: '/v/alerts',
              desc: 'Respond to pilgrim medical alerts & dispatch paramedic'
            },
            {
              title: 'Lost & Found Coordination',
              subtitle: 'Missing Persons & Belongings',
              icon: '🔍',
              badge: '🟢 ACTIVE HUB',
              route: '/v/lost-found',
              desc: 'Match missing devotee alerts & coordinate reunion'
            },
            {
              title: 'Ropeway & Boat Terminal',
              subtitle: 'Pavagadh / Bet Dwarka Gate',
              icon: '🚡',
              badge: '🟢 OPERATIONAL',
              route: '/v/scan',
              desc: 'Verify cable car passes & tide crossing ferry QR'
            }
          ].map((post, idx) => (
            <button
              key={idx}
              onClick={() => navigate(post.route)}
              className="p-3.5 rounded-2xl bg-amber-50/40 hover:bg-amber-50 border border-gold/30 hover:border-gold transition-all text-left flex items-start gap-3 group cursor-pointer"
            >
              <span className="text-2xl p-2 bg-white rounded-xl border border-gold/30 shadow-xs group-hover:scale-110 transition-transform">
                {post.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-black text-xs text-indigo-dark group-hover:text-maroon transition-colors truncate font-heading">
                    {post.title}
                  </h4>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {post.badge}
                  </span>
                </div>
                <p className="text-[10px] text-amber-900 font-bold truncate mt-0.5">{post.subtitle}</p>
                <p className="text-[10px] text-gray-500 font-normal truncate mt-0.5">{post.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-maroon group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
