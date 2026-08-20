import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { getMedicalInfo, requestPriorityAssistance, reportIssueLog } from '../../lib/volunteerEngine';
import { 
  CheckCircle, HeartPulse, Accessibility, Flag, ArrowLeft, Loader2, 
  ShieldCheck, AlertTriangle, Send, X, Lock
} from 'lucide-react';

export const VolunteerScanResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { qrId } = useParams();
  const { currentUser } = useVolunteerAuth();

  // Read data passed from Scan screen (never fetch full pilgrim profile here)
  const stateData = location.state || {};
  const holderName = stateData.holder_name || 'Ramesh P.';
  const gateNumber = stateData.gate_number || 'Gate #2 Swarga Dwar';
  const isPriority = stateData.is_priority || false;
  const qrPassId = stateData.qr_pass_id || qrId || 'pass_demo';

  const slotDate = stateData.slot_date || null;
  const slotTime = stateData.slot_time || null;

  // Medical Cascade States
  const [triggeringMedical, setTriggeringMedical] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState(null);
  const [medicalStatusText, setMedicalStatusText] = useState('');

  // Priority Assistance State
  const [triggeringPriority, setTriggeringPriority] = useState(false);

  // Issue Report Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueNote, setIssueNote] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // 1. Valid Entry Action (Green) -> Returns back to /v/scan immediately
  const handleValidEntryConfirm = () => {
    navigate('/v/scan');
  };

  // 2. Medical Assist Needed Action (Red) -> Triggers SOS Cascade & Unlocks ONLY blood_group & allergies
  const handleMedicalAssist = async () => {
    if (triggeringMedical) return; // Double-tap guard
    setTriggeringMedical(true);
    setMedicalStatusText('Alerting group members + emergency contact...');

    try {
      // Simulate network drop/offline condition if navigator says offline
      if (!navigator.onLine) {
        throw new Error('TypeError: Failed to fetch (Offline Mode)');
      }

      const res = await getMedicalInfo(qrPassId, currentUser?.id || 'vol_8841');

      setMedicalDetails(res.medical_info);
      setMedicalStatusText(`✓ Notified at ${res.time}`);

      // Auto-navigate to /v/medical/:alertId after ~1.5s
      setTimeout(() => {
        navigate(`/v/medical/${res.alertId}`, {
          state: {
            alertId: res.alertId,
            holder_name: holderName,
            gate_number: gateNumber,
            medical_info: res.medical_info,
            time: res.time
          }
        });
      }, 1500);

    } catch (err) {
      console.warn('Network error, queueing medical alert offline:', err);
      
      // Save alert request to local-storage queue
      const offlineAlert = {
        id: 'offline_alert_' + Date.now(),
        qr_pass_id: qrPassId,
        volunteer_id: currentUser?.id || 'vol_8841',
        timestamp: Date.now()
      };
      
      const existingQueue = JSON.parse(localStorage.getItem('nirvighna_offline_alerts_queue') || '[]');
      existingQueue.push(offlineAlert);
      localStorage.setItem('nirvighna_offline_alerts_queue', JSON.stringify(existingQueue));

      setMedicalStatusText('⚠️ Network drop! Alert queued offline. Re-trying...');
      
      // Setup online auto-flush event listener
      const flushQueue = async () => {
        const queue = JSON.parse(localStorage.getItem('nirvighna_offline_alerts_queue') || '[]');
        if (queue.length === 0) return;
        
        for (const item of queue) {
          try {
            await getMedicalInfo(item.qr_pass_id, item.volunteer_id);
          } catch (e) {
            console.error('Queue flush failed:', e);
          }
        }
        localStorage.removeItem('nirvighna_offline_alerts_queue');
        window.removeEventListener('online', flushQueue);
      };
      
      window.addEventListener('online', flushQueue);

      // Redirect volunteer to alerts list page after 3 seconds
      setTimeout(() => {
        navigate('/v/alerts');
      }, 3000);
    }
  };

  // 3. Priority Assistance Action (Gold)
  const handlePriorityAssistance = async () => {
    setTriggeringPriority(true);
    try {
      await requestPriorityAssistance(qrPassId, currentUser?.id || 'vol_8841');
      alert(`♿ Priority Wheelchair Escort dispatched for ${holderName} at ${gateNumber}!`);
      navigate('/v/scan');
    } catch (err) {
      navigate('/v/scan');
    }
  };

  // 4. Report Issue Action (Grey)
  const handleReportIssueSubmit = async (e) => {
    e.preventDefault();
    setSubmittingIssue(true);
    try {
      await reportIssueLog(qrPassId, issueNote, currentUser?.id || 'vol_8841');
      alert(`📋 Issue Logged: "${issueNote}"`);
      navigate('/v/scan');
    } catch (err) {
      navigate('/v/scan');
    } finally {
      setSubmittingIssue(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-temple-text font-body pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 selection:bg-temple-orange selection:text-white">
      {/* Field Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/v/scan')}
          className="p-2 bg-white rounded-xl border border-temple-peach text-temple-brown hover:bg-temple-peach"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-[10px] font-mono text-temple-textMuted">TOKEN: {qrPassId}</span>
      </div>

      {/* TOP BANNER: White card, green checkmark, Valid Entry text in deep brown */}
      <div className="bg-white p-5 rounded-3xl border border-temple-peach shadow-temple space-y-2 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-2xl border border-emerald-200">
            ✓
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              PASSED GATE VERIFICATION
            </span>
            <h2 className="text-xl font-black text-temple-brown font-heading">
              Valid Entry — {holderName}
            </h2>
            <p className="text-xs text-temple-textMuted font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span>⛩️ Assigned: <strong>{gateNumber}</strong></span>
              {slotDate && <span>• <strong>{slotDate}</strong> ({slotTime || 'Morning Slot'})</span>}
            </p>
          </div>
        </div>

        {/* Priority Badge if is_priority is true */}
        {isPriority && (
          <div className="bg-amber-50 border border-gold p-3 rounded-2xl space-y-1 mt-2">
            <div className="flex items-center gap-2 text-maroon font-extrabold text-xs">
              <Accessibility className="w-5 h-5 shrink-0 text-maroon" />
              <span>Priority Darshan Pass (Senior / Medical / Differently Abled)</span>
            </div>
            <p className="text-[11px] text-amber-900 font-medium pl-7">
              <strong>Priority Line Rule:</strong> Only <strong>1 accompanying family member / attendant</strong> is permitted per priority pass holder.
            </p>
          </div>
        )}
      </div>

      {/* REVEALED MEDICAL SOS PANEL (Only unlocks if Medical Assist Needed tapped) */}
      {medicalDetails && (
        <div className="bg-darkWarm-rust/10 border-2 border-darkWarm-rust p-5 rounded-3xl space-y-3 animate-in zoom-in-95 shadow-temple">
          <div className="flex items-center justify-between border-b border-darkWarm-rust/30 pb-2">
            <span className="text-xs font-black text-darkWarm-rust uppercase tracking-wider flex items-center gap-1 font-heading">
              <HeartPulse className="w-4 h-4 text-darkWarm-rust" />
              UNLOCKED MEDICAL EMERGENCY PROFILE
            </span>
            <span className="text-[10px] bg-darkWarm-rust text-white px-2 py-0.5 rounded-full font-bold">
              SOS Active
            </span>
          </div>

          {/* Displays ONLY blood_group and allergies */}
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="bg-white p-3 rounded-2xl border border-darkWarm-rust/30">
              <span className="text-[10px] text-temple-textMuted uppercase block font-sans font-bold">Blood Group</span>
              <p className="text-2xl font-black text-darkWarm-rust mt-1">{medicalDetails.blood_group}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-darkWarm-rust/30">
              <span className="text-[10px] text-temple-textMuted uppercase block font-sans font-bold">Medical Conditions</span>
              <p className="text-xs font-bold text-temple-brown mt-1 leading-snug">{medicalDetails.allergies}</p>
            </div>
          </div>

          <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>{medicalStatusText}</span>
          </div>
        </div>
      )}

      {/* 2x2 ACTION BUTTON GRID */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* BUTTON 1: Valid Entry (Soft green tint) */}
        <button
          onClick={handleValidEntryConfirm}
          className="p-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-3xl border border-emerald-200 shadow-temple flex flex-col items-center justify-center text-center space-y-2 group transition-all"
        >
          <CheckCircle className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide font-heading">
              Valid Entry
            </h4>
            <p className="text-[10px] text-emerald-600 font-medium">Approve & Next Scan →</p>
          </div>
        </button>

        {/* BUTTON 2: Medical Assist Needed (Warm rust-red tint) */}
        <button
          onClick={handleMedicalAssist}
          disabled={triggeringMedical}
          className="p-5 bg-darkWarm-rust/10 hover:bg-darkWarm-rust/20 text-darkWarm-rust rounded-3xl border border-darkWarm-rust shadow-temple flex flex-col items-center justify-center text-center space-y-2 group transition-all"
        >
          <HeartPulse className="w-8 h-8 text-darkWarm-rust group-hover:scale-110 transition-transform animate-pulse" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide font-heading">
              Medical Assist
            </h4>
            <p className="text-[10px] text-darkWarm-rust font-medium">Unlock SOS & Notify</p>
          </div>
        </button>

        {/* BUTTON 3: Priority Assistance (Burnt orange tint) */}
        <button
          onClick={handlePriorityAssistance}
          disabled={triggeringPriority}
          className={`p-5 rounded-3xl border shadow-temple flex flex-col items-center justify-center text-center space-y-2 group transition-all ${
            isPriority
              ? 'bg-temple-orange text-white border-temple-orange scale-[1.03]'
              : 'bg-temple-orange/10 hover:bg-temple-orange/20 text-temple-brown border-temple-orange'
          }`}
        >
          <Accessibility className={`w-8 h-8 group-hover:scale-110 transition-transform ${isPriority ? 'text-white' : 'text-temple-orange'}`} />
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide font-heading">
              Priority Escort
            </h4>
            <p className={`text-[10px] font-medium ${isPriority ? 'text-white font-bold' : 'text-temple-brown'}`}>
              {isPriority ? '♿ Request Wheelchair' : 'Dispatch Senior Escort'}
            </p>
          </div>
        </button>

        {/* BUTTON 4: Report Issue (Soft grey-peach tint) */}
        <button
          onClick={() => setShowIssueModal(true)}
          className="p-5 bg-temple-peach/30 hover:bg-temple-peach/50 text-temple-brown rounded-3xl border border-temple-peach shadow-temple flex flex-col items-center justify-center text-center space-y-2 group transition-all"
        >
          <Flag className="w-8 h-8 text-temple-textMuted group-hover:scale-110 transition-transform" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide font-heading">
              Report Issue
            </h4>
            <p className="text-[10px] text-temple-textMuted font-medium">Log Gate Incident</p>
          </div>
        </button>
      </div>

      {/* PRIVACY PROTECTION CAPTION TEXT */}
      <div className="bg-white/60 p-3 rounded-2xl border border-temple-peach text-center space-y-1">
        <p className="text-[11px] text-temple-textMuted font-semibold flex items-center justify-center gap-1">
          <Lock className="w-3.5 h-3.5 text-temple-orange" />
          Personal details stay private — only relevant info unlocks when needed
        </p>
      </div>

      {/* Report Issue Free-Text Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl border border-temple-peach max-w-sm w-full space-y-4 shadow-temple">
            <div className="flex items-center justify-between border-b border-temple-peach pb-3">
              <h3 className="font-extrabold text-sm text-temple-brown font-heading">
                LOG GATE INCIDENT NOTE
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-1 text-temple-textMuted hover:text-temple-brown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportIssueSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-temple-text block mb-1">
                  Incident Note / Reason:
                </label>
                <textarea
                  rows={3}
                  required
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  placeholder="e.g. Mismatched family pass count, requested gate transfer..."
                  className="w-full p-3 bg-cream border border-temple-peach rounded-xl text-xs text-temple-brown focus:outline-none focus:border-temple-orange"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-2.5 bg-cream text-temple-textMuted font-bold text-xs rounded-xl border border-temple-peach"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="flex-1 py-2.5 bg-temple-orange text-white font-black text-xs rounded-xl uppercase"
                >
                  Submit & Return →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
