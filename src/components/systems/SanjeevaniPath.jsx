import React, { useState, useEffect, useCallback } from 'react';
import { 
  HeartPulse, Navigation, RefreshCw, Lock, Unlock, ShieldAlert, 
  CheckCircle, AlertOctagon, UserCheck, Clock, MapPin, Sparkles, BellRing, DoorOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getTempleById } from '../../lib/templeRegistry';
import { templeAIConfigEngine } from '../../lib/templeAIConfigEngine';
import { approveSanjeevaniPathAdmin } from '../../lib/volunteerEngine';
import { SanjeevaniPathRenderer } from '../SanjeevaniPathRenderer';

const EnterpriseCard = ({ children, className = '' }) => (
  <div className={`bg-[#1C1617] border border-amber-950/40 rounded-xl shadow-xs transition-all ${className}`}>
    {children}
  </div>
);

export const SanjeevaniPath = ({ templeId = 'tmp_somnath' }) => {
  const shrine = getTempleById(templeId) || { name: 'Somnath Temple', id: 'tmp_somnath' };
  const sanjeevaniConfig = templeAIConfigEngine.getConfig(templeId, 'sanjeevani_path').config;
  const staffExits = sanjeevaniConfig.staffOnlyExits || [];

  const [medicalCases, setMedicalCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [emergencyGates, setEmergencyGates] = useState([]);
  const [activeEvacuationPath, setActiveEvacuationPath] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');

  // Initialize emergency secret doors for selected temple
  useEffect(() => {
    setEmergencyGates(staffExits.map(exit => ({
      id: exit.id,
      name: exit.name,
      zone: exit.zone || 'Temple Complex',
      hiddenPassageName: exit.hiddenPassageName || 'Staff Medical Bypass Conduit',
      ambulanceBay: exit.ambulanceBay || 'ICU Ambulance Bay',
      lockStatus: exit.lockStatus || 'locked'
    })));
  }, [templeId]);

  const loadMedicalCases = useCallback(() => {
    try {
      const savedAlerts = JSON.parse(localStorage.getItem('nirvighna_medical_alerts') || '[]');
      
      // Default initial demo cases if empty
      if (savedAlerts.length === 0) {
        const initialDemoAlerts = [
          {
            id: 'med_alert_som_1',
            qr_pass_id: 'pass_SOM9421',
            temple_id: templeId,
            holder_name: 'Ramesh Patel (Senior Devotee)',
            location: 'Gate 2 Swarga Dwar Ramp',
            status: 'reached',
            stage: 'medical_treatment_in_progress',
            field_volunteer_name: 'Vikram S. (Gate Marshal #8841)',
            field_volunteer_scanned_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
            medical_volunteer_name: 'Dr. Priya Mehta (Quick Response Team)',
            medical_volunteer_verified_at: new Date(Date.now() - 1.5 * 60 * 1000).toISOString(),
            verified_response_time: '1.5 mins SLA (Within 3m Target)',
            sanjeevani_requested: true,
            sanjeevani_status: 'pending_admin_approval',
            severity_reason: 'Acute Cardiac Distress & Syncope — Needs Immediate 108 ICU Transit',
            evacuation_plan: templeAIConfigEngine.calculateMedicalEvacuationPath('Gate 2 Swarga Dwar Ramp', templeId),
            medical_info: { blood_group: 'O+', allergies: 'Cardiac Pacemaker • Diabetic' },
            created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
          },
          {
            id: 'med_alert_som_2',
            qr_pass_id: 'pass_SOM8102',
            temple_id: templeId,
            holder_name: 'Sita Devi',
            location: 'Parikrama Sea-Face Walkway',
            status: 'reached',
            stage: 'medical_treatment_in_progress',
            field_volunteer_name: 'Aarav G. (Crowd Seva #4120)',
            field_volunteer_scanned_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
            medical_volunteer_name: 'Nurse Rekha B. (Paramedic Station 2)',
            medical_volunteer_verified_at: new Date(Date.now() - 6.5 * 60 * 1000).toISOString(),
            verified_response_time: '1.5 mins SLA',
            sanjeevani_requested: false,
            sanjeevani_status: 'none',
            medical_info: { blood_group: 'B+', allergies: 'Mild Dehydration • Asthmatic' },
            created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem('nirvighna_medical_alerts', JSON.stringify(initialDemoAlerts));
        setMedicalCases(initialDemoAlerts);
      } else {
        setMedicalCases(savedAlerts.filter(c => c.status !== 'resolved'));
      }
    } catch (_) {}
    setIsLoadingCases(false);
  }, [templeId]);

  useEffect(() => {
    loadMedicalCases();

    // Listen to local events
    const handleSosAlert = () => loadMedicalCases();
    const handleSanjeevaniRequest = () => loadMedicalCases();

    window.addEventListener('nirvighna_medical_sos_alert', handleSosAlert);
    window.addEventListener('nirvighna_sanjeevani_request', handleSanjeevaniRequest);

    return () => {
      window.removeEventListener('nirvighna_medical_sos_alert', handleSosAlert);
      window.removeEventListener('nirvighna_sanjeevani_request', handleSanjeevaniRequest);
    };
  }, [loadMedicalCases]);

  const handleToggleGateLock = (gateId) => {
    setEmergencyGates(previousGates => previousGates.map(gate => {
      if (gate.id === gateId) {
        const updatedStatus = gate.lockStatus === 'locked' ? 'unlocked' : 'locked';
        return { ...gate, lockStatus: updatedStatus };
      }
      return gate;
    }));
  };

  // Admin approves Sanjeevani Path and unlocks the target secret door
  const handleApproveSanjeevaniEvacuation = async (caseItem) => {
    const calculatedRoute = templeAIConfigEngine.calculateMedicalEvacuationPath(caseItem.location || 'Gate 2 Swarga Dwar', templeId);
    setActiveEvacuationPath(calculatedRoute);

    // Electronically unlock the secret door
    setEmergencyGates(previousGates => previousGates.map(gate => 
      gate.id === calculatedRoute.destinationExitId || gate.name === calculatedRoute.destinationExit
        ? { ...gate, lockStatus: 'unlocked' }
        : gate
    ));

    await approveSanjeevaniPathAdmin({
      alertId: caseItem.id,
      adminId: 'admin_command_centre',
      templeId
    });

    setActionFeedback(`🟢 SANJEEVANI PATH UNLOCKED! Secret Door "${calculatedRoute.destinationExit}" opened for Ambulance Bay transfer.`);
    setTimeout(() => setActionFeedback(''), 6000);
    loadMedicalCases();
  };

  const handleResolveCase = (caseId) => {
    const saved = JSON.parse(localStorage.getItem('nirvighna_medical_alerts') || '[]');
    const updated = saved.map(c => c.id === caseId ? { ...c, status: 'resolved', resolved_at: new Date().toISOString() } : c);
    localStorage.setItem('nirvighna_medical_alerts', JSON.stringify(updated));
    loadMedicalCases();
  };

  const unlockedGatesCount = emergencyGates.filter(g => g.lockStatus === 'unlocked').length;
  const pendingSanjeevaniCases = medicalCases.filter(c => c.sanjeevani_status === 'pending_admin_approval');

  return (
    <div className="space-y-5 text-slate-100 font-sans">
      {/* Module Header */}
      <EnterpriseCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Sanjeevani Path — Secret Door Evacuation &amp; Dual-Verification Command</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/20">
                  {shrine.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  2-Stage Volunteer Audit Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real Temple Secret Emergency Conduits • Field-to-Medical Handshake Tracking • <strong className="text-amber-300">Secret Doors Unlocked: {unlockedGatesCount} of {emergencyGates.length}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={loadMedicalCases} className="p-2 rounded-xl bg-[#140F10] hover:bg-white/[0.06] text-slate-300 border border-white/[0.08] transition-colors cursor-pointer" title="Refresh Medical Pipeline">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </EnterpriseCard>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {actionFeedback}
          </span>
          <span className="text-slate-400 font-mono text-[10px]">Just now</span>
        </div>
      )}

      {/* 🚨 CRITICAL SANJEEVANI PATH APPROVAL POPUP BANNER (WHEN MEDICAL VOLUNTEER REQUESTS SECRET DOOR UNLOCK) */}
      {pendingSanjeevaniCases.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950/90 via-rose-950/80 to-amber-950/90 border-2 border-red-500 rounded-2xl shadow-xl space-y-3 animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/40 pb-2.5">
            <div className="flex items-center gap-2 text-red-300 font-black text-sm uppercase tracking-wider">
              <AlertOctagon className="w-5 h-5 text-red-400 animate-bounce" />
              <span>🚨 HIGH-PRIORITY SANJEEVANI PATH EVACUATION REQUESTED!</span>
            </div>
            <span className="text-xs bg-red-600 text-white font-black px-3 py-1 rounded-full uppercase tracking-wider">
              ADMIN APPROVAL REQUIRED
            </span>
          </div>

          {pendingSanjeevaniCases.map(item => (
            <div key={item.id} className="bg-black/60 p-4 rounded-xl border border-red-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-white">{item.holder_name}</h4>
                  <p className="text-xs text-slate-300">
                    Location: <strong className="text-amber-300">{item.location}</strong> • Condition: <strong className="text-red-300">{item.severity_reason || 'Severe Trauma'}</strong>
                  </p>
                </div>
                <div className="text-right text-xs font-mono">
                  <span className="text-slate-400 block text-[10px]">Dual-Verification Audit:</span>
                  <span className="text-emerald-400 font-bold">✓ Field + Medical QR Verified ({item.verified_response_time || '1.4m SLA'})</span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs space-y-1 text-slate-200 font-mono">
                <p className="text-amber-300 font-bold">Target Secret Emergency Exit: {item.evacuation_plan?.destinationExit || 'Digvijay North Secret Door'}</p>
                <p className="text-[11px]">Passage: {item.evacuation_plan?.hiddenPassageName || 'Subterranean Corridor Bypassing Queue'} ➔ Direct to {item.evacuation_plan?.ambulanceBay || '108 Ambulance Bay'}</p>
              </div>

              <button
                type="button"
                onClick={() => handleApproveSanjeevaniEvacuation(item)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2 font-heading border border-emerald-400"
              >
                <Unlock className="w-4 h-4" />
                <span>✅ APPROVE SANJEEVANI PATH (ELECTRONICALLY UNLOCK SECRET EMERGENCY DOOR)</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Evacuation Map & Gate Control Relays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <EnterpriseCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                Live Evacuation Route Map — {shrine.name}
              </h3>
              {activeEvacuationPath && (
                <span className="text-xs font-mono text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  ETA: {activeEvacuationPath.estEvacuationMinutes} ({activeEvacuationPath.distanceMeters}m)
                </span>
              )}
            </div>

            <SanjeevaniPathRenderer templeId={templeId} evacPlan={activeEvacuationPath || templeAIConfigEngine.calculateMedicalEvacuationPath('Gate 2 Swarga Dwar', templeId)} />
          </EnterpriseCard>

          {/* Remote Staff Secret Exit Gate Lock Relays */}
          <EnterpriseCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Secret Temple Emergency Door Relays ({emergencyGates.length})
              </h3>
              <span className="text-xs text-slate-400">Electronic Latch Relays</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {emergencyGates.map(gate => (
                <div key={gate.id} className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {gate.lockStatus === 'unlocked' ? (
                      <Unlock className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{gate.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{gate.zone}</p>
                      <p className="text-[9px] text-emerald-400 truncate mt-0.5">{gate.ambulanceBay}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleToggleGateLock(gate.id); }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all shrink-0 cursor-pointer ${
                      gate.lockStatus === 'unlocked'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-white/[0.06] text-slate-300 border border-white/[0.08] hover:bg-white/10'
                    }`}
                  >
                    {gate.lockStatus === 'unlocked' ? 'UNLOCKED 🟢' : 'UNLOCK DOOR 🔒'}
                  </button>
                </div>
              ))}
            </div>
          </EnterpriseCard>
        </div>

        {/* Sidebar: Active Medical Cases with 2-Stage Verification Audit */}
        <div className="space-y-4">
          <EnterpriseCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Active Medical Cases ({medicalCases.length})
              </h3>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                LIVE AUDIT
              </span>
            </div>

            {isLoadingCases ? (
              <p className="text-xs text-slate-400 animate-pulse">Loading emergency requests...</p>
            ) : medicalCases.length === 0 ? (
              <div className="p-5 rounded-xl bg-[#140F10] border border-white/[0.06] text-center text-xs text-slate-400 space-y-1">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="font-bold text-white">All Temple Sectors Clear</p>
                <p className="text-[10px]">No active medical emergencies.</p>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs max-h-[460px] overflow-y-auto pr-1">
                {medicalCases.map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.holder_name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${
                        item.sanjeevani_status === 'pending_admin_approval'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.sanjeevani_status === 'pending_admin_approval' ? 'SANJEEVANI REQ' : item.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px]">Location: <strong className="text-amber-300">{item.location}</strong></p>

                    {/* Dual Verification Audit Badges */}
                    <div className="space-y-1 pt-1 border-t border-white/5 text-[10px] font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>1. Field Volunteer:</span>
                        <span className="text-emerald-400 font-bold">✓ {item.field_volunteer_name || 'Marshal #8841'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>2. Medical QR Verified:</span>
                        <span className={item.medical_volunteer_verified_at ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {item.medical_volunteer_verified_at ? `✓ Verified (${item.verified_response_time || '1.4m SLA'})` : '⏳ En Route'}
                        </span>
                      </div>
                    </div>

                    {/* Patient Medical Vitals */}
                    <div className="p-2 bg-black/40 rounded-lg border border-white/5 flex justify-between text-[10px] font-mono text-slate-300">
                      <span>Blood: <strong className="text-rose-400">{item.medical_info?.blood_group || 'O+'}</strong></span>
                      <span className="truncate max-w-[140px]">{item.medical_info?.allergies || 'Asthma'}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApproveSanjeevaniEvacuation(item)}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Sanjeevani Route</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveCase(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 font-medium text-[10px] cursor-pointer"
                      >
                        Resolve ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </EnterpriseCard>

          {/* SLA Performance Statistics Bar */}
          <EnterpriseCard className="p-4 space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Response SLA Telemetry</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Avg Verification Time</span>
                <span className="text-emerald-400 font-bold text-sm">1.4 mins</span>
              </div>
              <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Handshake Accuracy</span>
                <span className="text-amber-300 font-bold text-sm">100% Verified</span>
              </div>
            </div>
          </EnterpriseCard>
        </div>
      </div>
    </div>
  );
};
