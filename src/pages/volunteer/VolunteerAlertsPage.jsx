import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { 
  HeartPulse, ArrowLeft, RefreshCw, ChevronRight, CheckCircle, 
  MapPin, Clock, Navigation, AlertCircle, Sparkles, Shield,
  Wind, Droplets, AlertTriangle, Zap, ShieldCheck
} from 'lucide-react';
import { templeAIConfigEngine } from '../../lib/templeAIConfigEngine';

export const VolunteerAlertsPage = () => {
  const navigate = useNavigate();
  const { currentUser, assignedDuty } = useVolunteerAuth();
  const isMedicalResponder = assignedDuty === 'medical_responder';

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('active'); // 'active' | 'suffocation' | 'all'
  const [sanctumCO2, setSanctumCO2] = useState(1380);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    const defaultAlerts = [
      {
        id: 'alt_dwarka_1',
        qr_pass_id: 'pass_KV8492',
        temple_id: 'tmp_somnath',
        holder_name: 'Ramesh Patel',
        location: 'Gate 2 Swarga Dwar',
        status: 'open',
        category: 'general_medical',
        details: 'Heat exhaustion & dizziness. Devotee resting near shade tent, hydration & oxygen requested.',
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString()
      },
      {
        id: 'alt_dwarka_suffocate_1',
        qr_pass_id: 'pass_KV7741',
        temple_id: 'tmp_somnath',
        holder_name: 'Kamlesh Trivedi (64 yrs)',
        location: 'Inner Sanctum Holding Queue',
        status: 'open',
        category: 'suffocation',
        details: '🫁 SUFFOCATION & BREATHING DISTRESS: High CO2 surge in enclosed sanctum. Pilgrim experiencing acute breathlessness, portable O2 canister required.',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 'alt_dwarka_2',
        qr_pass_id: 'pass_KV9999',
        temple_id: 'tmp_somnath',
        holder_name: 'Sita Devi',
        location: 'Sanctum Inner Queue',
        status: 'en_route',
        category: 'suffocation',
        details: 'Asthma flare-up in crowded line. Volunteer escort assigned with inhaler kit.',
        created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString()
      },
      {
        id: 'alt_dwarka_3',
        qr_pass_id: 'pass_KV1002',
        temple_id: 'tmp_somnath',
        holder_name: 'Amit Verma',
        location: 'Annakshetra Dining Hall',
        status: 'resolved',
        category: 'general_medical',
        details: 'Minor abrasion. Bandaged on site by first responder.',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];

    try {
      const saved = localStorage.getItem('nirvighna_medical_alerts');
      if (saved) {
        setAlerts(JSON.parse(saved));
      } else {
        localStorage.setItem('nirvighna_medical_alerts', JSON.stringify(defaultAlerts));
        setAlerts(defaultAlerts);
      }
    } catch (_) {
      setAlerts(defaultAlerts);
    } finally {
      setLoading(false);
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { open: 0, en_route: 1, reached: 2, resolved: 3 };
    return (order[a.status] || 0) - (order[b.status] || 0);
  });

  const filteredAlerts = sortedAlerts.filter(a => {
    if (filterMode === 'active') return a.status !== 'resolved';
    if (filterMode === 'suffocation') return a.category === 'suffocation' || a.details?.toLowerCase().includes('suffocat') || a.details?.toLowerCase().includes('breath') || a.details?.toLowerCase().includes('asthma');
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body pb-28 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      
      {/* Top Sacred Header */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-3xl border border-gold/30 shadow-warm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/v/dashboard')}
            className="p-2 bg-amber-50 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-maroon font-heading block">
              🕉️ स्वास्थ्य सेवा • MEDICAL SEVA
            </span>
            <h1 className="text-xs font-black font-heading text-indigo-dark uppercase tracking-wider">
              Emergency Medical Unit
            </h1>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 bg-amber-50 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 🫁 PRANA KAVACH SUFFOCATION & SANCTUM CO2 LIVE TELEMETRY WIDGET */}
      <div className="bg-white p-4.5 rounded-3xl border-2 border-rose-300 shadow-warm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-300 flex items-center justify-center">
              <Wind className="w-4 h-4 text-rose-600 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full font-heading">
                PRANA KAVACH • AIR & SUFFOCATION MONITOR
              </span>
              <h3 className="text-xs font-black text-indigo-dark font-heading mt-0.5">
                Inner Sanctum Breathing Safety
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl border border-gold/40">
            CO2: {sanctumCO2} PPM
          </span>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed font-medium bg-amber-50/50 p-2.5 rounded-xl border border-gold/30">
          Enclosed Garbhagriha occupancy is high. Paramedics equipped with <strong>Portable O2 Inhalers &amp; Nebulizer Kits</strong> are positioned along the Sanjeevani Path corridor.
        </p>
      </div>

      {/* Filter Tabs: Active vs Suffocation/Oxygen vs All */}
      <div className="flex bg-white p-1 rounded-2xl border border-gold/30 text-xs font-bold font-heading shadow-xs">
        <button
          onClick={() => setFilterMode('active')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            filterMode === 'active'
              ? 'bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black shadow-xs'
              : 'text-gray-500 hover:text-maroon'
          }`}
        >
          Active ({sortedAlerts.filter(a => a.status !== 'resolved').length})
        </button>
        <button
          onClick={() => setFilterMode('suffocation')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            filterMode === 'suffocation'
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black shadow-xs'
              : 'text-gray-500 hover:text-maroon'
          }`}
        >
          🫁 Suffocation
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            filterMode === 'all'
              ? 'bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black shadow-xs'
              : 'text-gray-500 hover:text-maroon'
          }`}
        >
          All ({sortedAlerts.length})
        </button>
      </div>

      {/* 🚨 SANJEEVANI PATH MEDICAL GREEN CORRIDOR BANNER */}
      {isMedicalResponder && (
        <div className="bg-white p-4 rounded-3xl border-2 border-emerald-400 shadow-warm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="text-xs font-black text-emerald-950 font-heading">
                Sanjeevani Path — Secret Door Ready
              </h3>
            </div>
            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 font-mono">
              2-STEP AUDIT ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-gray-600">
            For critical respiratory/cardiac distress, request Sanjeevani Path in patient detail to electronically unlatch the temple's secret emergency evacuation door.
          </p>
        </div>
      )}

      {/* ALERTS LIST */}
      <div className="space-y-3 pt-1">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gold/30 text-center space-y-2 shadow-warm">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-indigo-dark font-heading">All Devotees Safe</h3>
            <p className="text-xs text-gray-500">No pending emergency alerts in this category.</p>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const isOpen = item.status === 'open';
            const isEnRoute = item.status === 'en_route';
            const isResolved = item.status === 'resolved';
            const isSuffocation = item.category === 'suffocation' || item.details?.toLowerCase().includes('suffocat') || item.details?.toLowerCase().includes('breath');

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/v/medical/${item.id}`, {
                  state: {
                    alertId: item.id,
                    holder_name: item.holder_name || 'Ramesh Patel',
                    gate_number: item.location || 'Gate #2 Swarga Dwar',
                    medical_info: { blood_group: 'O+', allergies: item.details || 'Heat fatigue' }
                  }
                })}
                className={`bg-white p-4.5 rounded-3xl border space-y-3 shadow-warm transition-all cursor-pointer ${
                  isSuffocation 
                    ? 'border-rose-300 hover:border-rose-500' 
                    : isOpen
                    ? 'border-gold/30 hover:border-gold'
                    : isResolved
                    ? 'border-gray-200 opacity-75'
                    : 'border-gold/30 hover:border-gold'
                }`}
              >
                {/* Card Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                      isSuffocation
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : isOpen 
                        ? 'bg-amber-50 text-maroon border-gold/40'
                        : isResolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {isSuffocation ? <Wind className="w-4 h-4 animate-pulse" /> : <HeartPulse className={`w-4 h-4 ${isOpen ? 'animate-pulse' : ''}`} />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-indigo-dark font-heading">
                        {item.holder_name || 'Ramesh Patel'}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-maroon" />
                        {item.location || 'Gate 2 Swarga Dwar'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isSuffocation
                      ? 'bg-rose-50 text-rose-800 border-rose-300 font-mono'
                      : isOpen
                      ? 'bg-amber-50 text-amber-900 border-gold/40 font-mono'
                      : isEnRoute
                      ? 'bg-blue-50 text-blue-800 border-blue-200 font-mono'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 font-mono'
                  }`}>
                    {isSuffocation && isOpen ? '🫁 SUFFOCATION SOS' : item.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Details Box */}
                <p className="text-xs text-gray-700 bg-amber-50/40 p-2.5 rounded-xl border border-gold/30 leading-relaxed font-medium">
                  {item.details || 'Emergency assistance requested by temple volunteer'}
                </p>

                {/* Card Bottom Row */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                  <span className="text-[11px] text-gray-400 font-mono">
                    Logged {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <span className="font-black text-maroon flex items-center gap-1 font-heading hover:underline">
                    <span>Attend Case &amp; QR Verify</span>
                    <ChevronRight className="w-4 h-4 text-maroon" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
