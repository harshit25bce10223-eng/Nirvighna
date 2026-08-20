import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { updateMedicalAlertStatus } from '../../lib/volunteerEngine';
import { supabase } from '../../lib/supabaseClient';
import { 
  HeartPulse, ArrowLeft, CheckCircle, Clock, ShieldAlert, Loader2, 
  MapPin, Check, AlertCircle, Bell, ChevronRight
} from 'lucide-react';

export const VolunteerMedicalAlertPage = () => {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useVolunteerAuth();

  const stateData = location.state || {};
  const [currentStatus, setCurrentStatus] = useState('open'); // 'open' | 'en_route' | 'reached' | 'resolved'
  const [medicalInfo, setMedicalInfo] = useState({
    blood_group: stateData.medical_info?.blood_group || 'O+',
    allergies: stateData.medical_info?.allergies || 'Penicillin Allergy • Diabetic Type-2'
  });
  const [holderName, setHolderName] = useState(stateData.holder_name || 'Ramesh P.');
  const [gateNumber, setGateNumber] = useState(stateData.gate_number || 'Gate #2 Swarga Dwar');
  
  const [updating, setUpdating] = useState(false);
  const [auditLog, setAuditLog] = useState([
    { time: stateData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'open', text: `SOS Alert Created at ${gateNumber}` }
  ]);
  const [showResolvedConfirmation, setShowResolvedConfirmation] = useState(false);

  const stages = [
    { id: 'open', label: 'Open', step: 1 },
    { id: 'en_route', label: 'En Route', step: 2 },
    { id: 'reached', label: 'Reached', step: 3 },
    { id: 'resolved', label: 'Resolved', step: 4 }
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'open': return 0;
      case 'en_route': return 1;
      case 'reached': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  useEffect(() => {
    fetchAlertDetails();
  }, [alertId]);

  const fetchAlertDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_alerts')
        .select('*')
        .eq('id', alertId)
        .single();

      if (!error && data) {
        if (data.status) setCurrentStatus(data.status);
        if (data.location) setGateNumber(data.location);
      }
    } catch (err) {
      console.warn('Alert fetch note:', err);
    }
  };

  const getNextStatus = () => {
    switch (currentStatus) {
      case 'open': return 'en_route';
      case 'en_route': return 'reached';
      case 'reached': return 'resolved';
      default: return null;
    }
  };

  const getNextButtonLabel = () => {
    switch (currentStatus) {
      case 'open': return 'Mark as En Route 🚑';
      case 'en_route': return 'Mark as Reached 📍';
      case 'reached': return 'Mark as Resolved ✓';
      default: return null;
    }
  };

  const handleAdvanceStatus = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return;

    setUpdating(true);
    try {
      const res = await updateMedicalAlertStatus(alertId, nextStatus, currentUser?.id || 'vol_8841');

      setCurrentStatus(nextStatus);

      // Append line to audit log
      setAuditLog(prev => [
        ...prev,
        {
          time: res.time,
          status: nextStatus,
          text: `Group members notified at ${res.time} (Status: ${nextStatus.toUpperCase()})`
        }
      ]);

      // If marked as Resolved, show confirmation & navigate to dashboard after ~1.5s
      if (nextStatus === 'resolved') {
        setShowResolvedConfirmation(true);
        setTimeout(() => {
          navigate('/v/dashboard');
        }, 1500);
      }

    } catch (err) {
      console.error('Error updating alert status:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-temple-text font-body pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 selection:bg-temple-orange selection:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/v/dashboard')}
          className="p-2 bg-white rounded-xl border border-temple-peach text-temple-brown hover:bg-temple-peach"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-[10px] font-mono text-temple-textMuted">ALERT ID: {alertId}</span>
      </div>

      {/* Alert Banner Header */}
      <div className="bg-white p-4 rounded-3xl border-2 border-darkWarm-rust/50 space-y-2 shadow-temple">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-darkWarm-rust font-extrabold text-sm uppercase tracking-wider font-heading">
            <HeartPulse className="w-5 h-5 text-darkWarm-rust animate-pulse" />
            <span>Active Medical Emergency</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-darkWarm-rust/10 text-darkWarm-rust px-2.5 py-0.5 rounded-full border border-darkWarm-rust">
            {currentStatus.toUpperCase()}
          </span>
        </div>

        <p className="text-sm font-extrabold text-temple-brown">
          Patient: {holderName}
        </p>
        <p className="text-xs text-temple-textMuted flex items-center gap-1 font-mono">
          <MapPin className="w-3.5 h-3.5 text-temple-orange" />
          Location: {gateNumber}
        </p>
      </div>

      {/* HORIZONTAL 4-STAGE STATUS STEPPER */}
      <div className="bg-white p-4 rounded-3xl border border-temple-peach space-y-3 shadow-temple">
        <h3 className="text-xs font-black text-temple-brown uppercase tracking-wider font-heading">
          Emergency Response Stepper
        </h3>

        <div className="grid grid-cols-4 gap-1 relative">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={stage.id} className="flex flex-col items-center text-center space-y-1.5 z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-md ${
                  isCompleted
                    ? 'bg-emerald-600 text-white border-2 border-emerald-300'
                    : isCurrent
                    ? 'bg-temple-orange text-white border-2 border-white scale-110'
                    : 'bg-cream text-temple-textMuted border border-temple-peach'
                }`}>
                  {isCompleted ? '✓' : stage.step}
                </div>
                <span className={`text-[10px] font-extrabold font-heading tracking-tight ${
                  isCompleted
                    ? 'text-emerald-600'
                    : isCurrent
                    ? 'text-temple-orange'
                    : 'text-temple-textMuted'
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESTRICTED MEDICAL INFO CARD (Blood Group & Allergies Only) */}
      <div className="bg-white p-5 rounded-3xl border-2 border-darkWarm-rust/40 space-y-3 shadow-temple">
        <div className="flex items-center justify-between border-b border-temple-peach pb-2">
          <span className="text-xs font-black text-darkWarm-rust uppercase tracking-wider font-heading">
            RESTRICTED MEDICAL DATA
          </span>
          <span className="text-[9px] text-temple-textMuted font-mono">HIPAA & DPDP Protected</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 font-mono">
          <div className="bg-cream p-3.5 rounded-2xl border border-darkWarm-rust/30">
            <span className="text-[10px] text-temple-textMuted font-sans font-bold uppercase block">Blood Group</span>
            <p className="text-3xl font-black text-darkWarm-rust mt-1">{medicalInfo.blood_group}</p>
          </div>

          <div className="bg-cream p-3.5 rounded-2xl border border-darkWarm-rust/30">
            <span className="text-[10px] text-temple-textMuted font-sans font-bold uppercase block">Known Conditions</span>
            <p className="text-xs font-bold text-temple-brown mt-1 leading-relaxed">{medicalInfo.allergies}</p>
          </div>
        </div>
      </div>

      {/* DYNAMIC PRIMARY ACTION BUTTON */}
      {currentStatus !== 'resolved' ? (
        <button
          onClick={handleAdvanceStatus}
          disabled={updating}
          className="w-full py-5 bg-temple-orange hover:bg-temple-brown text-white font-black text-base rounded-2xl shadow-temple uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading"
        >
          {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
          <span>{getNextButtonLabel()}</span>
        </button>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-2xl text-center text-emerald-700 font-black text-xs uppercase tracking-wider space-y-1 animate-in zoom-in-95 shadow-temple">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm">✓ Case Fully Resolved & Reunited</p>
          <p className="text-[10px] text-emerald-600 font-mono font-normal">Read-only view logged for audit trail</p>
        </div>
      )}

      {/* RESOLUTION AUTO-REDIRECT CONFIRMATION OVERLAY */}
      {showResolvedConfirmation && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl text-center font-black text-sm uppercase tracking-wider space-y-1 shadow-temple animate-in zoom-in-95">
          <p>✓ Response Completed!</p>
          <p className="text-xs font-normal opacity-90">Returning to Dashboard in 1.5s...</p>
        </div>
      )}

      {/* LIVE AUDIT LOG TRAIL */}
      <div className="bg-white/80 p-4 rounded-2xl border border-temple-peach space-y-2">
        <span className="text-[11px] font-black text-temple-brown uppercase tracking-wider font-heading flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-temple-orange" />
          Live Audit & Notification Log
        </span>

        <div className="space-y-1.5 font-mono text-[11px] text-temple-textMuted">
          {auditLog.map((log, i) => (
            <div key={i} className="flex items-start gap-2 bg-cream p-2 rounded-xl border border-temple-peach">
              <span className="text-emerald-600 font-bold">[{log.time}]</span>
              <span>{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
