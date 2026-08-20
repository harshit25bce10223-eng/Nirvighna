import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  AlertTriangle, ArrowLeft, HeartPulse, ShieldAlert, CheckCircle, 
  Clock, MapPin, ChevronRight, Activity, Filter, RefreshCw
} from 'lucide-react';

export const VolunteerAlertsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [filterMode, setFilterMode] = useState('active'); // 'active' | 'all'
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemHighlightId, setNewItemHighlightId] = useState(null);
  const [gateDispatchAlert, setGateDispatchAlert] = useState(() => {
    try {
      const saved = localStorage.getItem('nirvighna_last_gate_dispatch_alert');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // Play for 150ms
    } catch (e) {
      console.warn('Web Audio beep ignored:', e);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to Supabase Realtime for medical_alerts INSERT and UPDATE
    const channel = supabase
      .channel('volunteer_alerts_list_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'medical_alerts' },
        (payload) => {
          const newAlert = payload.new;
          setNewItemHighlightId(newAlert.id);
          setAlerts(prev => [newAlert, ...prev]);

          // Play Web Audio sound cue on INSERT event only
          playBeep();

          setTimeout(() => {
            setNewItemHighlightId(null);
          }, 3000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'medical_alerts' },
        (payload) => {
          const updated = payload.new;
          setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setAlerts(data);
      } else {
        // Fallback demo alerts
        setAlerts([
          {
            id: 'alt_dwarka_1',
            qr_pass_id: 'pass_KV8492',
            holder_name: 'Ramesh P.',
            location: 'Gate 2 Swarga Dwar',
            status: 'open',
            details: 'Heat dizziness. Oxygen kit requested.',
            created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString()
          },
          {
            id: 'alt_dwarka_2',
            qr_pass_id: 'pass_KV9999',
            holder_name: 'Sita D.',
            location: 'Sanctum Inner Queue',
            status: 'en_route',
            details: 'Asthma flare-up. First responder assigned.',
            created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString()
          },
          {
            id: 'alt_dwarka_3',
            qr_pass_id: 'pass_KV1002',
            holder_name: 'Amit V.',
            location: 'Annakshetra Dining Hall',
            status: 'resolved',
            details: 'Minor abrasion. Bandaged on site.',
            created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('Alert list fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return { color: 'bg-red-100 text-red-700 border-red-300', label: 'OPEN' };
      case 'en_route':
        return { color: 'bg-temple-peach text-temple-brown border-temple-orange', label: 'EN ROUTE' };
      case 'reached':
        return { color: 'bg-temple-peach text-temple-brown border-temple-orange', label: 'REACHED' };
      case 'resolved':
        return { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: 'RESOLVED' };
      default:
        return { color: 'bg-red-100 text-red-700 border-red-300', label: 'OPEN' };
    }
  };

  // Sort: open/en_route/reached first, resolved last. Order by created_at desc within group.
  const sortedAlerts = [...alerts].sort((a, b) => {
    const isAResolved = a.status === 'resolved' ? 1 : 0;
    const isBResolved = b.status === 'resolved' ? 1 : 0;
    if (isAResolved !== isBResolved) return isAResolved - isBResolved;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const filteredAlerts = sortedAlerts.filter(a => {
    if (filterMode === 'active') return a.status !== 'resolved';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#181012] text-white font-body pb-24 pt-4 px-3 sm:px-6 max-w-md mx-auto space-y-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/v/dashboard')}
            className="p-2 bg-[#221517] rounded-xl border border-amber-900/30 text-amber-400 hover:border-amber-500/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black font-heading text-white uppercase tracking-wider">
              FIELD EMERGENCY ALERTS
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Realtime Command Sync Active</p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 bg-[#221517] rounded-xl border border-amber-900/30 text-slate-400 hover:text-amber-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TOP FILTER TOGGLE (Active vs All) */}
      <div className="flex bg-[#221517] p-1 rounded-2xl border border-amber-900/30 text-xs font-bold font-heading">
        <button
          onClick={() => setFilterMode('active')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filterMode === 'active'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-goldGlow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Alerts ({sortedAlerts.filter(a => a.status !== 'resolved').length})
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filterMode === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-goldGlow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Cases ({sortedAlerts.length})
        </button>
      </div>

      {/* 🚨 TARGETED VOLUNTEER GATE DISPATCH NOTIFICATION BANNER */}
      {gateDispatchAlert && (
        <div className="bg-red-950/90 text-red-100 p-4 rounded-2xl border-2 border-red-500 shadow-2xl space-y-2 animate-bounce font-body">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5 font-heading">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              🚨 COMMAND CENTRE GATE DISPATCH ACTIVE
            </span>
            <span className="text-[9px] text-slate-400 font-mono">{gateDispatchAlert.timestamp}</span>
          </div>

          <p className="text-xs font-bold leading-relaxed text-white">
            {gateDispatchAlert.message}
          </p>

          <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 bg-black/50 p-2 rounded-xl border border-red-500/30">
            <span>Target Volunteer: <strong>{gateDispatchAlert.assignedVolunteer}</strong></span>
            <span className="text-emerald-400 font-bold">ACTION REQUIRED</span>
          </div>
        </div>
      )}

      {/* ALERTS LIST CARDS */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-[#221517] p-8 rounded-3xl border border-amber-900/30 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Active Alerts</h3>
            <p className="text-xs text-slate-400">All emergency medical cases in this zone are resolved.</p>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const isHighlight = item.id === newItemHighlightId;

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/v/medical/${item.id}`, {
                  state: {
                    alertId: item.id,
                    holder_name: item.holder_name || 'Ramesh P.',
                    gate_number: item.location || 'Gate #2 Swarga Dwar',
                    medical_info: { blood_group: 'O+', allergies: item.details || 'Heat dizziness' }
                  }
                })}
                className={`bg-[#221517] p-4 rounded-3xl border cursor-pointer transition-all hover:border-amber-500/50 space-y-2.5 shadow-lg ${
                  isHighlight
                    ? 'border-amber-400 bg-amber-500/10 scale-[1.02] animate-bounce'
                    : item.status === 'open'
                    ? 'border-l-4 border-l-red-500 border-amber-900/30'
                    : item.status === 'resolved'
                    ? 'border-emerald-500/30 opacity-75'
                    : 'border-amber-900/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className={`w-4 h-4 ${item.status === 'open' ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                    <h3 className="font-extrabold text-sm text-white font-heading">
                      {item.holder_name || 'Ramesh P.'}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    item.status === 'open'
                      ? 'bg-red-500/15 text-red-300 border-red-500/30'
                      : item.status === 'resolved'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {item.status?.toUpperCase() || 'OPEN'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {item.location || 'Gate #2 Swarga Dwar'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Raised {getRelativeTime(item.created_at)}
                  </span>
                </div>

                {item.details && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.06] line-clamp-1">
                    {item.details}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
