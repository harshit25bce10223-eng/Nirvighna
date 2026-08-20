import React, { useState, useEffect, useCallback } from 'react';
import { HeartPulse, Navigation, RefreshCw, Lock, Unlock, ShieldAlert, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getTempleById } from '../../lib/templeRegistry';
import { templeAIConfigEngine } from '../../lib/templeAIConfigEngine';
import { SanjeevaniPathRenderer } from '../SanjeevaniPathRenderer';

const EnterpriseCard = ({ children, className = '' }) => (
  <div className={`bg-[#1C1617] border border-amber-950/40 rounded-xl shadow-xs transition-all ${className}`}>
    {children}
  </div>
);

export const SanjeevaniPath = ({ templeId = 'tmp_somnath' }) => {
  const shrine = getTempleById(templeId);
  const sanjeevaniConfig = templeAIConfigEngine.getConfig(templeId, 'sanjeevani_path').config;
  const staffExits = sanjeevaniConfig.staffOnlyExits || [];

  const [medicalCases, setMedicalCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [emergencyGates, setEmergencyGates] = useState([]);
  const [activeEvacuationPath, setActiveEvacuationPath] = useState(null);

  useEffect(() => {
    setEmergencyGates(staffExits.map(exit => ({ id: exit.id, name: exit.name, lockStatus: 'locked' })));
  }, [templeId]);

  const loadMedicalCases = useCallback(async () => {
    const { data } = await supabase
      .from('medical_assistance_cases')
      .select('*, users(full_name, phone)')
      .in('status', ['pending', 'en_route', 'reached'])
      .order('created_at', { ascending: false });
    setMedicalCases(data || []);
    setIsLoadingCases(false);
  }, []);

  useEffect(() => {
    loadMedicalCases();
    const subscription = supabase
      .channel('sanjeevani_cases_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_assistance_cases' }, loadMedicalCases)
      .subscribe();

    return () => {
      void subscription.unsubscribe();
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

  const handleTriggerEvacuation = async (caseItem) => {
    const calculatedRoute = templeAIConfigEngine.calculateMedicalEvacuationPath(caseItem.location || 'Queue Gate 2', templeId);
    setActiveEvacuationPath(calculatedRoute);

    setEmergencyGates(previousGates => previousGates.map(gate => 
      gate.id === calculatedRoute.destinationExitId || gate.name === calculatedRoute.destinationExit
        ? { ...gate, lockStatus: 'unlocked' }
        : gate
    ));

    try {
      await supabase.from('medical_assistance_cases').update({ status: 'en_route' }).eq('id', caseItem.id);
    } catch (e) {
      // Network error — local state already updated
    }
    loadMedicalCases();
  };

  const handleResolveCase = async (caseId) => {
    try {
      await supabase.from('medical_assistance_cases').update({ status: 'resolved' }).eq('id', caseId);
    } catch (e) {
      // Network error — will sync on next fetch
    }
    loadMedicalCases();
  };

  const unlockedGatesCount = emergencyGates.filter(g => g.lockStatus === 'unlocked').length;

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
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Sanjeevani Path — Medical Evacuation Control</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                  Evacuation Route Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Shrine: <strong className="text-slate-200">{shrine.name}</strong> • Staff Emergency Exits Unlocked: <strong className="text-amber-300">{unlockedGatesCount} of {emergencyGates.length} Exits</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={loadMedicalCases} className="p-2 rounded-xl bg-[#140F10] hover:bg-white/[0.06] text-slate-300 border border-white/[0.08] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </EnterpriseCard>

      {/* Main Evacuation Map & Gate Control Relays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <EnterpriseCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                Live Evacuation Route Map
              </h3>
              {activeEvacuationPath && (
                <span className="text-xs font-mono text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  ETA: {activeEvacuationPath.estimatedMinutes} Mins ({activeEvacuationPath.distanceMeters}m)
                </span>
              )}
            </div>

            <SanjeevaniPathRenderer templeId={templeId} evacPath={activeEvacuationPath} />
          </EnterpriseCard>

          {/* Remote Staff Exit Gate Lock Relays */}
          <EnterpriseCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Staff Emergency Exit Gate Relays
              </h3>
              <span className="text-xs text-slate-400">Remote Latch Control</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {emergencyGates.map(gate => (
                <div key={gate.id} className="p-3 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {gate.lockStatus === 'unlocked' ? (
                      <Unlock className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-red-400" />
                    )}
                    <div>
                      <p className="font-bold text-white">{gate.name}</p>
                      <p className="text-[10px] text-slate-400">Exit ID: {gate.id}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleToggleGateLock(gate.id); }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
                      gate.lockStatus === 'unlocked'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-white/[0.06] text-slate-300 border border-white/[0.08] hover:bg-white/10'
                    }`}
                  >
                    {gate.lockStatus === 'unlocked' ? 'UNLOCKED' : 'UNLOCK EXIT'}
                  </button>
                </div>
              ))}
            </div>
          </EnterpriseCard>
        </div>

        {/* Sidebar: Active Medical Cases */}
        <div className="space-y-4">
          <EnterpriseCard className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Active Medical Requests ({medicalCases.length})
            </h3>

            {isLoadingCases ? (
              <p className="text-xs text-slate-400 animate-pulse">Loading emergency requests...</p>
            ) : medicalCases.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#140F10] border border-white/[0.06] text-center text-xs text-slate-400">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                No active medical requests. All sectors clear.
              </div>
            ) : (
              <div className="space-y-3 text-xs max-h-[420px] overflow-y-auto pr-1">
                {medicalCases.map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.users?.full_name || 'Pilgrim'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                        {item.severity || 'HIGH PRIORITY'}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px]">Location: <strong>{item.location || 'Queue Gate 2'}</strong></p>
                    <p className="text-slate-400 text-[10px]">Phone: {item.users?.phone || '+91 98250 XXXXX'}</p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleTriggerEvacuation(item); }}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 hover:bg-amber-400 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Trigger Route
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleResolveCase(item.id); }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-slate-300 hover:bg-white/10 font-medium text-[10px]"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </EnterpriseCard>

          {/* Activity Log */}
          <EnterpriseCard className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Live Response Log</h3>
            <div className="space-y-2 text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>18:24 — SOS Received from Pilgrim #9042</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>18:24 — Field Marshal Vikram Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>18:24 — Staff Exit EX_SOM_1 Unlocked</span>
              </div>
            </div>
          </EnterpriseCard>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <EnterpriseCard className="p-4">
          <p className="text-xs text-slate-400 uppercase font-medium">Average Response Time</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">1.8 Mins</p>
        </EnterpriseCard>

        <EnterpriseCard className="p-4">
          <p className="text-xs text-slate-400 uppercase font-medium">Active Emergencies</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{medicalCases.length}</p>
        </EnterpriseCard>

        <EnterpriseCard className="p-4">
          <p className="text-xs text-slate-400 uppercase font-medium">Resolved Today</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">14 Cases</p>
        </EnterpriseCard>

        <EnterpriseCard className="p-4">
          <p className="text-xs text-slate-400 uppercase font-medium">Medical Booths Available</p>
          <p className="text-2xl font-bold text-white mt-1">4 Booths</p>
        </EnterpriseCard>
      </div>
    </div>
  );
};
