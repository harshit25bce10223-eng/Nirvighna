import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { sendPilgrimNotification } from '../../lib/notificationService';
import { 
  ArrowLeft, AlertTriangle, ShieldCheck, RefreshCw, 
  MapPin, Clock, HeartPulse, XCircle, CheckCircle2, Siren
} from 'lucide-react';

export const VolunteerGateAlertsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Initial Panic SOS incidents (simulated from Nirvighna Engine & Pilgrims)
  const [panicIncidents, setPanicIncidents] = useState([
    {
      id: 'sos_1054',
      source: 'Prana Nirvighna AI Engine',
      type: 'medical',
      title: 'Sudden Fall / Fainting Detected',
      location: 'Gate 2 Digvijay Dwar (Camera 4)',
      timestamp: 'Just now',
      severity: 'critical',
      description: 'AI vision detected a devotee collapsing in the queue. Immediate medical response requested.',
      status: 'pending'
    },
    {
      id: 'sos_1055',
      source: 'Pilgrim App SOS (Devotee: Ramesh P.)',
      type: 'stampede_risk',
      title: 'Suffocation / Crowd Crush Panic',
      location: 'Inner Sanctum Corridor (Sector B)',
      timestamp: '2 mins ago',
      severity: 'high',
      description: 'Pilgrim triggered SOS button citing severe breathlessness and excessive crowding.',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    // Listen for real-time SOS broadcasts from Pilgrim app or Admin
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('nirvighna_interconnected_sync');
        bc.onmessage = (event) => {
          if (event.data?.action === 'BROADCAST_NOTIFICATION' && event.data?.notification) {
            const notif = event.data.notification;
            if (notif.type === 'panic_sos' || notif.type === 'medical_sos') {
              setPanicIncidents(prev => [
                {
                  id: notif.id || `sos_${Date.now()}`,
                  source: 'Pilgrim SOS Direct',
                  type: notif.type,
                  title: notif.title || 'Emergency SOS Triggered',
                  location: notif.metadata?.location || 'Unknown Area',
                  timestamp: 'Just now',
                  severity: 'high',
                  description: notif.message,
                  status: 'pending'
                },
                ...prev
              ]);
            }
          }
        };
      }
    } catch (_) {}

    return () => {
      if (bc) try { bc.close(); } catch (_) {}
    };
  }, []);

  const handleValidatePanic = async (incident) => {
    // Mark as active/validated
    setPanicIncidents(prev => prev.map(inc => 
      inc.id === incident.id ? { ...inc, status: 'validated' } : inc
    ));
    
    // Broadcast to Admin Command Centre & Medical Team
    await sendPilgrimNotification({
      title: `🚨 VERIFIED EMERGENCY: ${incident.title}`,
      message: `Volunteer ${currentUser?.name || 'on duty'} validated SOS at ${incident.location}. Dispatching Quick Response Team immediately!`,
      type: 'verified_panic_alert',
      recipients: ['admin', 'volunteers', 'pilgrim']
    });

    setActionSuccess(`✓ SOS Validated: Rescue Team dispatched to ${incident.location}.`);
    setTimeout(() => setActionSuccess(''), 5000);
  };

  const handleRejectFalseAlarm = async (incidentId) => {
    // Mark as rejected/false alarm
    setPanicIncidents(prev => prev.map(inc => 
      inc.id === incidentId ? { ...inc, status: 'rejected' } : inc
    ));

    setActionSuccess(`✕ Marked as False Alarm / Accidental SOS.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const refreshFeed = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const activeIncidents = panicIncidents.filter(inc => inc.status === 'pending');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-body pb-28 pt-4 px-4 max-w-md mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      
      {/* ─── CLEAN HEADER ─── */}
      <div className="bg-white p-3.5 rounded-3xl border border-amber-900/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-amber-50/80 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-maroon uppercase block font-heading">
              INCIDENT VERIFICATION
            </span>
            <h1 className="text-xs font-bold text-gray-800">
              Live Panic Alerts Hub
            </h1>
          </div>
        </div>

        <button
          onClick={refreshFeed}
          disabled={loading}
          className="p-2 bg-amber-50/80 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── SUCCESS TOAST ─── */}
      {actionSuccess && (
        <div className="bg-slate-800 text-white p-3 rounded-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="flex-1">{actionSuccess}</span>
        </div>
      )}

      {/* ─── PENDING SOS INCIDENTS ─── */}
      <div className="bg-white p-4 rounded-3xl border border-amber-900/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-indigo-dark uppercase tracking-wide flex items-center gap-2 font-heading">
            <Siren className="w-4 h-4 text-red-600 animate-pulse" />
            Unverified Panic Alerts
          </h2>
          {activeIncidents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-black text-[10px] animate-pulse">
              {activeIncidents.length} Active
            </span>
          )}
        </div>

        {activeIncidents.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-1">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-gray-800">All Clear</p>
            <p className="text-xs text-gray-500">No active panic incidents at your sector.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeIncidents.map((incident) => (
              <div 
                key={incident.id} 
                className="p-4 rounded-3xl border-2 border-red-100 bg-red-50/30 relative overflow-hidden"
              >
                {/* Red warning border overlay effect */}
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded-md mb-1.5 font-mono">
                        {incident.source}
                      </span>
                      <h3 className="text-sm font-black text-gray-900 font-heading leading-tight">
                        {incident.title}
                      </h3>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 shrink-0 whitespace-nowrap bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-2xs">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {incident.timestamp}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-red-50 space-y-1.5 shadow-2xs">
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                      {incident.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-dark mt-1 bg-indigo-50/50 w-fit px-2 py-1 rounded-md">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {incident.location}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleValidatePanic(incident)}
                      className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validate &amp; Dispatch</span>
                    </button>
                    
                    <button
                      onClick={() => handleRejectFalseAlarm(incident.id)}
                      className="py-2.5 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>False Alarm</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
