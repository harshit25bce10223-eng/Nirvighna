import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { broadcastLostPersonAlert, broadcastReunificationAlert, sendPilgrimNotification } from '../../lib/notificationService';
import { 
  UserX, ArrowLeft, CheckCircle, UserCheck, 
  Clock, MapPin, Search, Megaphone, CheckCheck, Plus, X, 
  User, ShieldAlert
} from 'lucide-react';

const INITIAL_LOST_FOUND_CASES = [
  {
    id: 'case_101',
    reported_person_name: 'Aarav Sharma',
    age: 7,
    gender: 'Boy',
    category: 'child',
    photo_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80',
    description: 'Wearing blue kurta, red shoes. Last seen near Sabhamandap / Gomti Ghat steps.',
    reported_by_name: 'Rohit Sharma (Father)',
    reported_by_phone: '+91 98765 43210',
    last_seen_location: 'Sabhamandap Pillar #8',
    status: 'open',
    assigned_volunteer_id: null,
    assigned_volunteer_name: null,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'case_102',
    reported_person_name: 'Kamla Devi',
    age: 68,
    gender: 'Female',
    category: 'elderly',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    description: 'Elderly lady with yellow saree and wooden walking stick. Speaks Gujarati.',
    reported_by_name: 'Mukesh Patel (Son)',
    reported_by_phone: '+91 98412 11002',
    last_seen_location: 'Swarga Dwar Inner Corridor',
    status: 'searching',
    assigned_volunteer_id: 'vol_8841',
    assigned_volunteer_name: 'Vikram S. (Marshal)',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'case_103',
    reported_person_name: 'Meera Patel',
    age: 12,
    gender: 'Girl',
    category: 'child',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    description: 'Green dress, carrying pink pouch bag with darshan slip.',
    reported_by_name: 'Geeta Patel (Mother)',
    reported_by_phone: '+91 97120 44921',
    last_seen_location: 'Annakshetra Prasad Gate',
    status: 'resolved',
    assigned_volunteer_id: 'vol_7712',
    assigned_volunteer_name: 'Rohan M.',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  }
];

export const VolunteerLostFoundPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [filterMode, setFilterMode] = useState('open'); // 'open' | 'resolved'
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [broadcastedId, setBroadcastedId] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = () => {
    try {
      const saved = localStorage.getItem('nirvighna_lost_found_cases');
      if (saved) {
        setCases(JSON.parse(saved));
      } else {
        localStorage.setItem('nirvighna_lost_found_cases', JSON.stringify(INITIAL_LOST_FOUND_CASES));
        setCases(INITIAL_LOST_FOUND_CASES);
      }
    } catch (_) {
      setCases(INITIAL_LOST_FOUND_CASES);
    }
  };

  const saveCases = (updated) => {
    setCases(updated);
    try {
      localStorage.setItem('nirvighna_lost_found_cases', JSON.stringify(updated));
    } catch (_) {}
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / (60 * 1000)));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return 'Earlier today';
    } catch (_) {
      return 'Recently';
    }
  };

  const handleBroadcastAlert = async (c) => {
    setBroadcastedId(c.id);
    await broadcastLostPersonAlert(c);
    setTimeout(() => setBroadcastedId(null), 3000);
  };

  const handleMarkFoundAndEscort = async (caseId) => {
    setUpdatingId(caseId);
    try {
      let targetCase = null;
      const updated = cases.map(c => {
        if (c.id === caseId) {
          targetCase = { 
            ...c, 
            status: 'resolved',
            resolved_at: new Date().toISOString() 
          };
          return targetCase;
        }
        return c;
      });
      saveCases(updated);

      if (targetCase) {
        await broadcastReunificationAlert(targetCase);
        await sendPilgrimNotification({
          title: `🎉 REUNITED AT DESK: ${targetCase.reported_person_name}`,
          message: `Devotee ${targetCase.reported_person_name} has arrived safely at Family Lost & Found Center for guardian handover.`,
          type: 'lost_found_resolved',
          recipients: ['pilgrim', 'group_members', 'volunteers', 'admin']
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    if (filterMode === 'open') return c.status === 'open' || c.status === 'searching';
    if (filterMode === 'resolved') return c.status === 'resolved';
    return true;
  }).filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.reported_person_name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.last_seen_location?.toLowerCase().includes(q) ||
      c.reported_by_phone?.includes(q)
    );
  });

  const openCount = cases.filter(c => c.status === 'open' || c.status === 'searching').length;
  const resolvedCount = cases.filter(c => c.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-body pb-28 pt-4 px-4 max-w-md mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      
      {/* ─── CLEAN HEADER ─── */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-3xl border border-amber-900/10 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/v/inner-gate')}
            className="p-2 bg-amber-50/80 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-maroon uppercase block font-heading">
              Family Reunification Seva
            </span>
            <h1 className="text-xs font-bold text-gray-800">
              Lost &amp; Found Coordination
            </h1>
          </div>
        </div>

        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 font-heading">
          Desk #1 Active
        </span>
      </div>

      {/* ─── SIMPLE SEARCH BAR ─── */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, clues or location..."
          className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs text-gray-800 shadow-2xs focus:outline-none focus:border-gold"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ─── MINIMAL 2-TAB SWITCHER ─── */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs gap-1">
        <button
          type="button"
          onClick={() => setFilterMode('open')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filterMode === 'open'
              ? 'bg-gradient-to-r from-gold to-amber-500 text-indigo-dark shadow-xs'
              : 'text-gray-500 hover:text-maroon'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Active Missing ({openCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('resolved')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filterMode === 'resolved'
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-xs'
              : 'text-gray-500 hover:text-emerald-700'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Reunited ({resolvedCount})</span>
        </button>
      </div>

      {/* ─── CLEAN, SPACIOUS CARDS (NO SUFFOCATED NESTED BOXES) ─── */}
      <div className="space-y-3.5">
        {filteredCases.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-2 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="font-bold text-sm text-gray-800 font-heading">
              {filterMode === 'open' ? 'All Devotees Accounted For!' : 'No Resolved Cases in Archive'}
            </h3>
            <p className="text-xs text-gray-500">
              No active missing reports in the temple right now.
            </p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const isResolved = c.status === 'resolved';

            return (
              <div
                key={c.id}
                className={`bg-white rounded-3xl border p-4.5 space-y-3 shadow-xs transition-all ${
                  isResolved 
                    ? 'border-emerald-200 bg-emerald-50/15' 
                    : 'border-amber-900/10 hover:border-gold/60'
                }`}
              >
                {/* Person Header with Picture */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={c.photo_url || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80'}
                    alt={c.reported_person_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-gold/40 shadow-2xs shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-sm text-gray-900 font-heading truncate">
                        {c.reported_person_name} ({c.age} yrs)
                      </h3>

                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isResolved ? '✓ Reunited' : '🚨 Missing'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-maroon shrink-0" />
                      <span className="truncate">{c.last_seen_location || 'Sanctum Queue'}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-mono text-[10px] shrink-0">{formatRelativeTime(c.created_at)}</span>
                    </p>
                  </div>
                </div>

                {/* Clear Clues Text */}
                <p className="text-xs text-gray-700 leading-relaxed font-medium pl-1">
                  <strong>Appearance:</strong> {c.description}
                </p>

                {/* Destination Banner */}
                <div className="text-[11px] text-gray-500 bg-[#FAF7F2] px-3 py-1.5 rounded-xl flex items-center justify-between">
                  <span>Guardian: <b>{c.reported_by_name || 'Family Member'}</b></span>
                  <span className="text-emerald-800 font-semibold">📍 Pickup: Lost &amp; Found Desk</span>
                </div>

                {/* 2 Clean Action Buttons */}
                {!isResolved && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleMarkFoundAndEscort(c.id)}
                      disabled={updatingId === c.id}
                      className="py-3 px-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-xs uppercase font-heading flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Send to Center ✓</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBroadcastAlert(c)}
                      disabled={broadcastedId === c.id}
                      className="py-3 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl uppercase font-heading flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center"
                    >
                      <Megaphone className="w-4 h-4 text-rose-600" />
                      <span>{broadcastedId === c.id ? 'Broadcasted!' : 'PA Alert'}</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
