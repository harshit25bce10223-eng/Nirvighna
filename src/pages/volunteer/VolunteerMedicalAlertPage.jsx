import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { 
  verifyMedicalVolunteerArrival, 
  requestSanjeevaniPathEvacuation, 
  updateMedicalAlertStatus 
} from '../../lib/volunteerEngine';
import { 
  HeartPulse, ArrowLeft, CheckCircle, ChevronRight, MapPin, 
  Clock, ShieldAlert, Loader2, Navigation, AlertTriangle, UserCheck, 
  Bell, Sparkles, QrCode, Lock, Unlock, ShieldCheck, PhoneCall, AlertOctagon
} from 'lucide-react';

export const VolunteerMedicalAlertPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { alertId } = useParams();
  const { currentUser, assignedDuty } = useVolunteerAuth();

  const stateData = location.state || {};
  const holderName = stateData.holder_name || 'Ramesh Patel';
  const initialGate = stateData.gate_number || 'Gate #2 Swarga Dwar';
  const initialInfo = stateData.medical_info || { blood_group: 'B+', allergies: 'Severe Heat Exhaustion • Asthmatic' };

  const [alertData, setAlertData] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('open'); // 'open' | 'en_route' | 'reached' | 'resolved'
  const [gateNumber, setGateNumber] = useState(initialGate);
  const [medicalInfo, setMedicalInfo] = useState(initialInfo);
  const [isVerifiedOnSite, setIsVerifiedOnSite] = useState(false);
  const [verifiedSlaText, setVerifiedSlaText] = useState('');

  // Sanjeevani Path Evacuation State
  const [showSanjeevaniModal, setShowSanjeevaniModal] = useState(false);
  const [sanjeevaniReason, setSanjeevaniReason] = useState('Cardiac Distress / Severe Palpitations');
  const [sanjeevaniStatus, setSanjeevaniStatus] = useState('none'); // 'none' | 'pending_admin_approval' | 'approved_unlocked'
  const [evacuationPlan, setEvacuationPlan] = useState(null);
  const [requestingSanjeevani, setRequestingSanjeevani] = useState(false);
  const [verifyingScan, setVerifyingScan] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Audit Log
  const [auditLog, setAuditLog] = useState([
    {
      time: stateData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Step 1: Field Volunteer reported injured devotee at ${initialGate}`
    }
  ]);

  useEffect(() => {
    fetchAlertDetails();

    // Listen to Sanjeevani Path unlock broadcasts from Command Centre
    const handleUnlockedEvent = (ev) => {
      if (ev.detail && (ev.detail.id === alertId || !alertId)) {
        setSanjeevaniStatus('approved_unlocked');
        if (ev.detail.evacuation_plan) {
          setEvacuationPlan(ev.detail.evacuation_plan);
        }
        setAuditLog(prev => [
          ...prev,
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `🟢 Admin Approved Sanjeevani Path! Secret Door "${ev.detail.evacuation_plan?.destinationExit || 'Secret Exit'}" UNLOCKED.`
          }
        ]);
      }
    };

    window.addEventListener('nirvighna_sanjeevani_unlocked', handleUnlockedEvent);
    return () => window.removeEventListener('nirvighna_sanjeevani_unlocked', handleUnlockedEvent);
  }, [alertId]);

  const fetchAlertDetails = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('nirvighna_medical_alerts') || '[]');
      const found = saved.find(a => a.id === alertId);
      if (found) {
        setAlertData(found);
        if (found.status) setCurrentStatus(found.status);
        if (found.location) setGateNumber(found.location);
        if (found.medical_volunteer_verified_at) {
          setIsVerifiedOnSite(true);
          setVerifiedSlaText(found.verified_response_time || '1.4 min response SLA');
        }
        if (found.sanjeevani_status) {
          setSanjeevaniStatus(found.sanjeevani_status);
        }
        if (found.evacuation_plan) {
          setEvacuationPlan(found.evacuation_plan);
        }
      }
    } catch (_) {}
  };

  // Step 2 Handshake: Medical Volunteer verifies physical on-site arrival
  const handleVerifyArrivalScan = async () => {
    setVerifyingScan(true);
    try {
      const res = await verifyMedicalVolunteerArrival({
        alertId,
        scannedCode: alertData?.qr_pass_id || 'pass_KV8492',
        medicalVolunteerId: currentUser?.id || 'vol_med_1',
        medicalVolunteerName: currentUser?.name || 'Dr. Priya Mehta (Quick Medical Response)'
      });

      if (res.success) {
        setIsVerifiedOnSite(true);
        setCurrentStatus('reached');
        setVerifiedSlaText(res.responseTime || '1.2 mins SLA');
        setAuditLog(prev => [
          ...prev,
          {
            time: res.time,
            text: `Step 2: Medical Volunteer Arrival Verified by QR Scan (${res.responseTime})`
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingScan(false);
    }
  };

  // Step 3: Medical Volunteer requests Sanjeevani Path (Hidden Emergency Gate)
  const handleConfirmSanjeevaniRequest = async () => {
    setRequestingSanjeevani(true);
    setShowSanjeevaniModal(false);

    try {
      const res = await requestSanjeevaniPathEvacuation({
        alertId,
        medicalVolunteerId: currentUser?.id || 'vol_med_1',
        severityReason: sanjeevaniReason,
        templeId: alertData?.temple_id || 'tmp_somnath'
      });

      if (res.success) {
        setSanjeevaniStatus('pending_admin_approval');
        setEvacuationPlan(res.evacuation_plan);
        setAuditLog(prev => [
          ...prev,
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `Step 3: Requested Sanjeevani Path Evacuation for "${res.evacuation_plan.destinationExit}". Siren sent to Admin Command Centre.`
          }
        ]);
      }
    } catch (err) {
      console.error('Sanjeevani request error:', err);
    } finally {
      setRequestingSanjeevani(false);
    }
  };

  // Step 4: Resolve Case & Stabilize Patient
  const handleResolveCase = async () => {
    setUpdating(true);
    try {
      const res = await updateMedicalAlertStatus(alertId, 'resolved', currentUser?.id || 'vol_med_1');
      setCurrentStatus('resolved');
      setAuditLog(prev => [
        ...prev,
        {
          time: res.time,
          text: `Step 4: Case Resolved & Patient Stabilized at ${res.time}`
        }
      ]);
      setTimeout(() => {
        navigate('/v/alerts');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/v/alerts')}
          className="p-2 bg-white rounded-2xl border border-gold/30 text-maroon hover:bg-gold/10 transition-colors cursor-pointer shadow-xs flex items-center gap-1 text-xs font-bold font-heading"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Alerts</span>
        </button>
        <span className="text-[10px] font-mono bg-amber-50 px-2.5 py-1 rounded-full text-amber-900 border border-gold/40">
          ALERT ID: {alertId}
        </span>
      </div>

      {/* Main Alert Card */}
      <div className="bg-white p-4.5 rounded-3xl border-2 border-rose-300 space-y-2 shadow-warm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm uppercase tracking-wider font-heading">
            <HeartPulse className="w-5 h-5 text-rose-600 animate-pulse" />
            <span>Active Medical Emergency</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300">
            {currentStatus.toUpperCase()}
          </span>
        </div>

        <p className="text-base font-black text-indigo-dark font-heading">
          Patient: {holderName}
        </p>
        <p className="text-xs text-gray-600 flex items-center gap-1 font-mono">
          <MapPin className="w-3.5 h-3.5 text-maroon" />
          Location: {gateNumber}
        </p>
      </div>

      {/* 🤝 STEP 1 & 2 DUAL VERIFICATION HANDSHAKE STATUS */}
      <div className="bg-white p-4.5 rounded-3xl border-2 border-gold/40 shadow-warm space-y-3">
        <h3 className="text-xs font-black text-indigo-dark uppercase tracking-wider font-heading flex items-center justify-between">
          <span>Volunteer Dual Verification Status</span>
          <span className="text-[9px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
            2-STAGE HANDSHAKE
          </span>
        </h3>

        {/* Step 1: Field Volunteer */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="font-bold text-emerald-950">1. Field Volunteer Reported</p>
              <p className="text-[10px] text-emerald-800">Scanned Pilgrim QR &amp; Created SOS</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
            CONFIRMED
          </span>
        </div>

        {/* Step 2: Medical Volunteer */}
        {isVerifiedOnSite ? (
          <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <p className="font-bold text-emerald-950">2. Medical Volunteer Arrived</p>
                <p className="text-[10px] text-emerald-800">{verifiedSlaText} • Admin SLA Logged</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
              VERIFIED ON-SITE
            </span>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold font-heading">
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>2. Medical Arrival Pending QR Scan</span>
              </div>
              <span className="text-[9px] bg-white text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                REQUIRED
              </span>
            </div>
            <p className="text-[11px] text-gray-700">
              Scan the pilgrim's QR pass upon reaching to confirm physical presence and unlock medical vitals for Admin verification.
            </p>

            <button
              type="button"
              onClick={handleVerifyArrivalScan}
              disabled={verifyingScan}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-gold hover:from-gold hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer shadow-md transition-all"
            >
              {verifyingScan ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              <span>📷 SCAN PILGRIM QR (CONFIRM ON-SITE ARRIVAL)</span>
            </button>
          </div>
        )}
      </div>

      {/* 🩸 PROTECTED MEDICAL VITALS CARD (Unlocked upon verification) */}
      <div className="bg-white p-4.5 rounded-3xl border-2 border-gold/40 space-y-3 shadow-warm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-black text-maroon uppercase tracking-wider font-heading">
            PATIENT EMERGENCY VITALS
          </span>
          <span className="text-[9px] bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300">
            DPDP VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 font-mono">
          <div className="bg-amber-50/60 p-3 rounded-2xl border border-gold/30">
            <span className="text-[10px] text-gray-500 font-sans font-bold uppercase block">Blood Group</span>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{medicalInfo.blood_group}</p>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-2xl border border-gold/30">
            <span className="text-[10px] text-gray-500 font-sans font-bold uppercase block">Known Conditions</span>
            <p className="text-[11px] font-bold text-indigo-dark mt-0.5 leading-tight">{medicalInfo.allergies}</p>
          </div>
        </div>
      </div>

      {/* 🚪 SANJEEVANI PATH — HIDDEN TEMPLE EMERGENCY DOOR EVACUATION PANEL */}
      <div className="bg-white p-4.5 rounded-3xl border-2 border-emerald-400 shadow-warm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-700 animate-pulse" />
            <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider font-heading">
              Sanjeevani Path — Secret Door Evacuation
            </h3>
          </div>
          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full font-mono border ${
            sanjeevaniStatus === 'approved_unlocked'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 animate-pulse'
              : sanjeevaniStatus === 'pending_admin_approval'
              ? 'bg-amber-100 text-amber-900 border-amber-400'
              : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}>
            {sanjeevaniStatus === 'approved_unlocked' && '🟢 DOOR UNLOCKED'}
            {sanjeevaniStatus === 'pending_admin_approval' && '⏳ AWAITING ADMIN'}
            {sanjeevaniStatus === 'none' && '🔒 DOORS LOCKED'}
          </span>
        </div>

        {sanjeevaniStatus === 'approved_unlocked' && evacuationPlan ? (
          <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-2 animate-in zoom-in-95">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950 font-heading">
              <span className="flex items-center gap-1.5">
                <Unlock className="w-4 h-4 text-emerald-700" />
                <span>{evacuationPlan.destinationExit}</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-mono">108 ICU BAY DIRECT</span>
            </div>
            <p className="text-xs text-gray-800 font-medium">
              Passage: <strong className="text-emerald-950">{evacuationPlan.hiddenPassageName}</strong>
            </p>
            <div className="p-2 bg-white rounded-xl border border-emerald-200 text-[11px] font-mono text-emerald-900 space-y-1">
              {evacuationPlan.pathSteps.map((step, idx) => (
                <p key={idx}>{step}</p>
              ))}
            </div>
          </div>
        ) : sanjeevaniStatus === 'pending_admin_approval' ? (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-black font-heading">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>Awaiting Admin Command Approval...</span>
            </div>
            <p className="text-[11px] text-gray-700">
              Siren alert broadcasted to Admin Command Centre for secret door: <strong>{evacuationPlan?.destinationExit || 'Secret Evacuation Gate'}</strong>. Door will electronically unlatch once admin approves.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-600">
              For severe/critical trauma cases, trigger Sanjeevani Path to request Command Centre Admin to electronically unlatch the temple's secret emergency evacuation door bypassing general queues.
            </p>
            <button
              type="button"
              onClick={() => setShowSanjeevaniModal(true)}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer shadow-md transition-all border border-red-400"
            >
              <AlertOctagon className="w-4 h-4 animate-pulse" />
              <span>🚨 REQUEST SANJEEVANI PATH (SECRET DOOR EVACUATION)</span>
            </button>
          </div>
        )}
      </div>

      {/* RESOLVE CASE BUTTON */}
      {currentStatus !== 'resolved' ? (
        <button
          onClick={handleResolveCase}
          disabled={updating}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm rounded-2xl shadow-warm uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading cursor-pointer border border-emerald-400"
        >
          {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          <span>MARK CASE AS RESOLVED &amp; STABILIZED ✓</span>
        </button>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-3xl text-center text-emerald-800 font-black text-xs uppercase tracking-wider space-y-1 shadow-warm">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm">✓ Case Fully Resolved &amp; Patient Stabilized</p>
        </div>
      )}

      {/* LIVE AUDIT LOG TRAIL */}
      <div className="bg-white p-4 rounded-3xl border border-gold/30 space-y-2 shadow-warm">
        <span className="text-[11px] font-black text-indigo-dark uppercase tracking-wider font-heading flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-maroon" />
          Live Audit &amp; Response SLA Trail
        </span>

        <div className="space-y-1.5 font-mono text-[11px] text-gray-600">
          {auditLog.map((log, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-gold/30">
              <span className="text-emerald-700 font-bold">[{log.time}]</span>
              <span>{log.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SANJEEVANI PATH SEVERITY REASON MODAL */}
      {showSanjeevaniModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl border-2 border-rose-300 max-w-sm w-full space-y-4 shadow-warm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-extrabold text-sm text-rose-700 font-heading uppercase flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Select Evacuation Reason
              </h3>
              <button
                onClick={() => setShowSanjeevaniModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Select the severe medical condition to request immediate opening of the temple's secret emergency evacuation door:
            </p>

            <div className="space-y-2 text-xs font-bold font-heading">
              {[
                'Cardiac Distress / Severe Palpitations',
                'Acute Hypoxia / Suffocation in Crowd Surge',
                'Unconsciousness / Deep Syncope',
                'Severe Head Trauma / Fracture'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSanjeevaniReason(reason)}
                  className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    sanjeevaniReason === reason
                      ? 'bg-rose-50 text-rose-800 border-rose-400 shadow-xs ring-2 ring-rose-400/40'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300'
                  }`}
                >
                  <p className="text-xs">{reason}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSanjeevaniModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl border border-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSanjeevaniRequest}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-md font-heading"
              >
                Dispatch Siren 🚨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
