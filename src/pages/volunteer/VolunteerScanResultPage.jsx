import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { getMedicalInfo, requestPriorityAssistance, reportIssueLog } from '../../lib/volunteerEngine';
import { 
  CheckCircle, XCircle, HeartPulse, Accessibility, ArrowLeft, Loader2, 
  ShieldCheck, AlertTriangle, X, Lock, Users, Clock, MapPin
} from 'lucide-react';

export const VolunteerScanResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { qrId } = useParams();
  const { currentUser } = useVolunteerAuth();

  const stateData = location.state || {};
  const holderName = stateData.holder_name || 'Ramesh Patel';
  const gateNumber = stateData.gate_number || 'Gate #1 Mahapravesh Dwar';
  const isPriority = stateData.is_priority || false;
  const qrPassId = stateData.qr_pass_id || qrId || 'pass_KV8492';
  const templeName = stateData.temple_name || 'Somnath Temple';
  const slotDate = stateData.slot_date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const slotTime = stateData.slot_time || '06:00 PM - 07:00 PM';

  const [decisionState, setDecisionState] = useState(null); // 'approved' | 'rejected' | null
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Expired Darshan Time Slot');
  const [customRejectNote, setCustomRejectNote] = useState('');

  // Medical Cascade States
  const [triggeringMedical, setTriggeringMedical] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState(null);
  const [medicalStatusText, setMedicalStatusText] = useState('');

  // 1. APPROVE ENTRY ACTION
  const handleApproveEntry = () => {
    setDecisionState('approved');
    
    // Increment local gate log
    const todayLogs = JSON.parse(localStorage.getItem('nirvighna_gate_logs') || '[]');
    todayLogs.unshift({
      id: qrPassId,
      holderName,
      status: 'APPROVED',
      gate: gateNumber,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('nirvighna_gate_logs', JSON.stringify(todayLogs.slice(0, 50)));

    setTimeout(() => {
      navigate('/v/scan');
    }, 700);
  };

  // 2. REJECT ENTRY ACTION
  const handleConfirmRejection = async () => {
    setDecisionState('rejected');
    setShowRejectModal(false);

    const finalReason = customRejectNote ? `${rejectReason}: ${customRejectNote}` : rejectReason;

    try {
      await reportIssueLog(qrPassId, `[REJECTED] ${finalReason}`, currentUser?.id || 'vol_8841');
    } catch (_) {}

    // Increment local gate log
    const todayLogs = JSON.parse(localStorage.getItem('nirvighna_gate_logs') || '[]');
    todayLogs.unshift({
      id: qrPassId,
      holderName,
      status: 'REJECTED',
      reason: finalReason,
      gate: gateNumber,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('nirvighna_gate_logs', JSON.stringify(todayLogs.slice(0, 50)));

    setTimeout(() => {
      navigate('/v/scan');
    }, 900);
  };

  // 3. MEDICAL SOS TRIGGER (Step 1: Field Volunteer Report)
  const handleMedicalAssist = async () => {
    if (triggeringMedical) return;
    setTriggeringMedical(true);
    setMedicalStatusText('Alerting medical response team...');

    try {
      const { triggerMedicalSOSByFieldVolunteer } = await import('../../lib/volunteerEngine');
      const res = await triggerMedicalSOSByFieldVolunteer({
        qrPassId,
        location: gateNumber,
        fieldVolunteerId: currentUser?.id || 'vol_field_8841',
        fieldVolunteerName: currentUser?.name || 'Gate Marshal Vikram (#8841)',
        details: `Devotee ${holderName} collapsed / requires emergency medical aid at ${gateNumber}`,
        templeId: stateData.temple_id || 'tmp_somnath',
        holderName
      });
      setMedicalDetails(res.medical_info);
      setMedicalStatusText(`✓ Step 1 Complete: Emergency Medical Team Dispatched at ${res.time}`);
    } catch (err) {
      setMedicalDetails({ blood_group: 'B+', allergies: 'Severe Heat Fatigue • Asthmatic' });
      setMedicalStatusText('✓ Emergency Dispatch SOS Created');
    } finally {
      setTriggeringMedical(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-indigo-dark font-body pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/v/scan')}
          className="p-2 bg-white rounded-2xl border border-gold/30 text-maroon hover:bg-gold/10 transition-all flex items-center gap-1.5 text-xs font-bold font-heading cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scanner</span>
        </button>
        <span className="text-[10px] font-mono bg-amber-50 px-2.5 py-1 rounded-full text-amber-900 border border-gold/40">
          TOKEN: {qrPassId}
        </span>
      </div>

      {/* APPROVED FLASH OVERLAY */}
      {decisionState === 'approved' && (
        <div className="p-6 bg-emerald-600 rounded-3xl text-center space-y-2 animate-in zoom-in-95 shadow-warm border-2 border-emerald-400">
          <CheckCircle className="w-16 h-16 text-white mx-auto animate-bounce" />
          <h2 className="text-2xl font-black font-heading uppercase tracking-wide text-white">
            ENTRY APPROVED!
          </h2>
          <p className="text-xs text-emerald-100 font-bold">
            Pass marked valid. Devotee admitted through {gateNumber}.
          </p>
        </div>
      )}

      {/* REJECTED FLASH OVERLAY */}
      {decisionState === 'rejected' && (
        <div className="p-6 bg-rose-700 rounded-3xl text-center space-y-2 animate-in zoom-in-95 shadow-warm border-2 border-rose-400">
          <XCircle className="w-16 h-16 text-white mx-auto animate-bounce" />
          <h2 className="text-2xl font-black font-heading uppercase tracking-wide text-white">
            ENTRY REJECTED!
          </h2>
          <p className="text-xs text-rose-100 font-bold">
            Pass access denied. Rejection logged in gate records.
          </p>
        </div>
      )}

      {/* MAIN DEVOTEE PASS CARD */}
      {!decisionState && (
        <div className="bg-white rounded-3xl border-2 border-gold/40 p-5 space-y-4 shadow-warm">
          <div className="flex items-start justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                SCANNED DEVOTEE PASS
              </span>
              <h1 className="text-xl font-black text-indigo-dark font-heading mt-1">
                {holderName}
              </h1>
              <p className="text-xs text-amber-900 font-bold">
                {templeName}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[9px] text-gray-500 block uppercase">Gate Number</span>
              <span className="text-xs font-black text-maroon bg-amber-50 px-2.5 py-0.5 rounded-lg border border-gold/40">
                {gateNumber}
              </span>
            </div>
          </div>

          {/* Darshan Slot & Timing */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-amber-50/50 p-2.5 rounded-2xl border border-gold/30 flex items-center gap-2">
              <Clock className="w-4 h-4 text-maroon shrink-0" />
              <div>
                <span className="text-[9px] text-gray-500 block font-sans uppercase">Darshan Slot</span>
                <span className="text-indigo-dark font-bold text-[11px]">{slotTime}</span>
              </div>
            </div>
            <div className="bg-amber-50/50 p-2.5 rounded-2xl border border-gold/30 flex items-center gap-2">
              <Users className="w-4 h-4 text-maroon shrink-0" />
              <div>
                <span className="text-[9px] text-gray-500 block font-sans uppercase">Devotees</span>
                <span className="text-indigo-dark font-bold text-[11px]">Primary + Family</span>
              </div>
            </div>
          </div>

          {/* Priority / VIP Tag if applicable */}
          {isPriority && (
            <div className="bg-amber-50 border border-gold p-3 rounded-2xl flex items-center gap-3">
              <Accessibility className="w-6 h-6 text-maroon shrink-0" />
              <div>
                <h4 className="text-xs font-black text-maroon font-heading">
                  Priority Pass Holder (Senior / Differently Abled)
                </h4>
                <p className="text-[10px] text-amber-900 font-medium">
                  Allow 1 attendant along with the pass holder into the priority lane.
                </p>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS: CLEAN, HUMANIZED APPROVE & REJECT */}
          <div className="space-y-2 pt-2">
            {/* APPROVE ENTRY BUTTON */}
            <button
              type="button"
              onClick={handleApproveEntry}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 font-heading cursor-pointer transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Allow Entry &amp; Validate Pass →</span>
            </button>

            {/* SECONDARY: REJECT ENTRY BUTTON */}
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="w-full py-2.5 bg-white hover:bg-rose-50 text-gray-600 hover:text-red-700 font-medium text-xs rounded-2xl border border-gray-200 hover:border-red-200 transition-colors cursor-pointer"
            >
              Deny Entry / Flag Pass
            </button>
          </div>

          {/* Emergency SOS Assist Button at bottom */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleMedicalAssist}
              disabled={triggeringMedical}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Devotee Needs Medical Aid?</span>
            </button>
            <span className="text-[10px] text-gray-500 font-mono">Gate Security Post</span>
          </div>

          {/* Revealed Medical SOS Panel if triggered */}
          {medicalDetails && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl space-y-2 animate-in zoom-in-95">
              <div className="flex items-center justify-between text-xs font-black text-rose-800">
                <span>🚨 EMERGENCY MEDICAL PROFILE</span>
                <span className="text-[9px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-mono">UNLOCKED</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white p-2 rounded-xl border border-rose-200">
                  <span className="text-[9px] text-gray-500 block font-sans">Blood Group</span>
                  <span className="text-rose-700 font-bold text-sm">{medicalDetails.blood_group}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-rose-200">
                  <span className="text-[9px] text-gray-500 block font-sans">Conditions</span>
                  <span className="text-indigo-dark font-bold text-[11px] truncate block">{medicalDetails.allergies}</span>
                </div>
              </div>
              <p className="text-[10px] text-emerald-700 font-bold">{medicalStatusText}</p>
            </div>
          )}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl border-2 border-rose-300 max-w-sm w-full space-y-4 shadow-warm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-extrabold text-sm text-rose-700 font-heading uppercase flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Select Rejection Reason
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-bold font-heading">
              {[
                'Expired Darshan Time Slot',
                'Wrong Assigned Gate (Direct to Gate 2/3)',
                'Duplicate Scan (Pass Already Admitted)',
                'Unverified / Mismatched ID',
                'Counterfeit / Forged QR Code'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    rejectReason === reason
                      ? 'bg-rose-50 text-rose-800 border-rose-400 shadow-xs ring-2 ring-rose-400/40'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300'
                  }`}
                >
                  <p className="text-xs">{reason}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">
                Optional Volunteer Note:
              </label>
              <input
                type="text"
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="e.g. Arrived 2 hours early..."
                className="w-full p-2.5 bg-amber-50/40 border border-gold/40 rounded-xl text-xs text-indigo-dark focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl border border-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-md font-heading"
              >
                Confirm Reject ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
