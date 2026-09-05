import React, { useState, useEffect, useCallback } from 'react';
import { Thermometer, Droplets, Wind, AlertTriangle, ShieldCheck, Activity, Zap, ArrowUpRight, Sun, WifiOff } from 'lucide-react';
import { getTempleById } from '../../lib/templeRegistry';
import { templeAIConfigEngine } from '../../lib/templeAIConfigEngine';

const DRISHTI_URL = import.meta.env.VITE_DRISHTI_URL || 'http://localhost:8000';

const EnterpriseCard = ({ children, className = '' }) => (
  <div className={`bg-[#1C1617] border border-amber-950/40 rounded-xl shadow-xs transition-all ${className}`}>
    {children}
  </div>
);

function resolveInitialOccupancy(shrineId) {
  if (shrineId === 'tmp_dwarka') return 310;
  if (shrineId === 'tmp_ambaji') return 2450;
  if (shrineId === 'tmp_pavagadh') return 410;
  return 890;
}

export const PranaKavach = ({ templeId = 'tmp_somnath' }) => {
  const shrine = getTempleById(templeId);
  const pranaConfig = templeAIConfigEngine.getConfig(templeId, 'prana_kavach').config;

  const [compositeRiskScore, setCompositeRiskScore] = useState(68);
  const [liveOccupancy, setLiveOccupancy] = useState(resolveInitialOccupancy(templeId));
  const [forecastOccupancy30Min, setForecastOccupancy30Min] = useState(0);
  const [backendConnected, setBackendConnected] = useState(false);
  const [dataSource, setDataSource] = useState('LIVE_CV_DETECTOR');
  const [forecastPct, setForecastPct] = useState(18);
  const safeCapacity = pranaConfig.safeThreshold || 1200;

  // Dynamic CO2 based on occupancy • uses ASHRAE formula from templeAIConfigEngine
  const co2Data = templeAIConfigEngine.calculateCO2SuffocationRisk(
    Math.round((liveOccupancy / safeCapacity) * 100),
    templeId
  );

  // Dynamic temp & humidity (realistic variation with occupancy)
  const temp = (28.5 + (liveOccupancy / safeCapacity) * 6.5).toFixed(1);
  const humidity = Math.round(55 + (liveOccupancy / safeCapacity) * 20);

  // Poll the REAL Drishti backend occupancy every 10s (demo crowd source or live webcam)
  const pollBackend = useCallback(async () => {
    try {
      const res = await fetch(`${DRISHTI_URL}/api/predict`, { method: 'GET' });
      if (!res.ok) {
        setBackendConnected(false);
        return;
      }
      const data = await res.json();
      const occ = Number(data.current_occupancy) || 0;
      if (occ > 0) {
        setLiveOccupancy(Math.round(occ));
        setDataSource(data.source === 'SIMULATED_FOR_DEMO' ? 'SIMULATED_CROWD_DEMO' : 'LIVE_CV_DETECTOR');
        const preds = data.forecast?.predictions || [];
        if (preds.length >= 2) {
          const nowVal = preds[0];
          const nextVal = preds[1];
          const pct = nowVal > 0 ? Math.round(((nextVal - nowVal) / nowVal) * 100) : 0;
          setForecastPct(pct);
          setForecastOccupancy30Min(nextVal);
        } else {
          setForecastOccupancy30Min(Math.round(occ * 1.18));
        }
      }
      setBackendConnected(true);
    } catch (e) {
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    pollBackend();
    const iv = setInterval(pollBackend, 10000);
    return () => clearInterval(iv);
  }, [pollBackend]);

  // Risk score derives from occupancy/CO2 (not random) — small drift for live feel
  useEffect(() => {
    const riskInterval = setInterval(() => {
      const occPct = Math.min(100, (liveOccupancy / safeCapacity) * 100);
      let base = Math.round(occPct * 0.55 + (co2Data.co2Ppm >= pranaConfig.criticalPpm ? 30 : co2Data.co2Ppm >= pranaConfig.warningPpm ? 22 : 12));
      const delta = (Math.random() - 0.5) * 5;
      setCompositeRiskScore(prev => Math.max(15, Math.min(98, Math.round(base + delta))));
      if (!backendConnected) {
        setLiveOccupancy(prev => {
          const d = Math.floor(Math.random() * 15) - 5;
          return Math.max(50, prev + d);
        });
      }
    }, 5000);
    return () => clearInterval(riskInterval);
  }, [liveOccupancy, co2Data, backendConnected, pranaConfig.warningPpm, pranaConfig.criticalPpm, safeCapacity]);

  const gaugeDashOffset = 440 - (440 * compositeRiskScore) / 100;
  const riskTextColor = compositeRiskScore >= 80 ? 'text-red-400' : compositeRiskScore >= 60 ? 'text-amber-300' : 'text-emerald-400';
  const riskStrokeColor = compositeRiskScore >= 80 ? '#f87171' : compositeRiskScore >= 60 ? '#fcd34d' : '#34d399';
  const co2Color = co2Data.alertLevel === 'CRITICAL' ? 'text-red-400' : co2Data.alertLevel === 'HIGH' ? 'text-amber-300' : 'text-emerald-400';

  return (
    <div className="space-y-5 text-slate-100 font-sans">
      {/* Module Header */}
      <EnterpriseCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">Prana Kavach • Environmental & Risk Monitor</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                  {shrine.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                CO2 monitoring: <strong className="text-slate-200">{pranaConfig.co2Monitoring}</strong> • ASHRAE Warning: <strong className="text-amber-300">{pranaConfig.warningPpm || 1200} PPM</strong> • Critical: <strong className="text-red-400">{pranaConfig.criticalPpm || 2000} PPM</strong>
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#140F10] border border-white/[0.08] text-xs flex items-center gap-2">
            {backendConnected ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">
                  {dataSource === 'SIMULATED_CROWD_DEMO' ? 'Synced to Drishti AI (Demo Crowd)' : 'Synced to Live Drishti AI Detector'}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500 font-medium">Drishti backend offline — local estimate</span>
              </>
            )}
          </div>
        </div>
      </EnterpriseCard>

      {/* Main Meter & Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <EnterpriseCard className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Overall Crowd Risk Score</h3>
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" className="text-slate-800/60" fill="transparent" />
              <circle cx="80" cy="80" r="70" stroke={riskStrokeColor} strokeWidth="10" strokeDasharray="440" strokeDashoffset={gaugeDashOffset} strokeLinecap="round" fill="transparent" className="transition-all duration-700 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold tabular-nums ${riskTextColor}`}>{compositeRiskScore}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Risk Index (0•100)</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="text-emerald-400">0•39 Safe</span>
            <span className="text-amber-300">40•74 Elevated</span>
            <span className="text-red-400">75+ Danger</span>
          </div>
        </EnterpriseCard>

        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3.5">
            <EnterpriseCard className="p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Live Occupancy</p>
              <p className="text-2xl font-bold text-white mt-1 tabular-nums">{liveOccupancy}</p>
              <p className="text-[11px] text-slate-400 mt-1">Devotees Inside</p>
            </EnterpriseCard>
            <EnterpriseCard className="p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Safe Capacity</p>
              <p className="text-2xl font-bold text-amber-300 mt-1 tabular-nums">{safeCapacity}</p>
              <p className="text-[11px] text-slate-400 mt-1">Recommended Max</p>
            </EnterpriseCard>
            <EnterpriseCard className="p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">30-Min Forecast</p>
              <p className="text-2xl font-bold text-amber-300 mt-1 tabular-nums">{forecastOccupancy30Min.toLocaleString()}</p>
              <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> {forecastPct > 0 ? `+${forecastPct}` : forecastPct}% Inflow
              </p>
            </EnterpriseCard>
          </div>

          {/* Environmental Sensors • dynamic values from occupancy */}
          <EnterpriseCard className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Environmental Sensor Telemetry</h3>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#140F10] flex items-center gap-2.5 border border-white/[0.06]">
                <Sun className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-400">Temperature</p>
                  <p className="font-bold text-white">{temp} •C</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#140F10] flex items-center gap-2.5 border border-white/[0.06]">
                <Droplets className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-400">Humidity</p>
                  <p className="font-bold text-white">{humidity} %</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#140F10] flex items-center gap-2.5 border border-white/[0.06]">
                <Wind className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-400">CO2 Reading</p>
                  <p className={`font-bold ${co2Color}`}>{co2Data.co2Ppm?.toLocaleString() || '1,120'} PPM</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#140F10] flex items-center gap-2.5 border border-white/[0.06]">
                <Activity className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-400">CO2 Status</p>
                  <p className={`font-bold text-[10px] ${co2Color}`}>{co2Data.alertLevel || 'LOW'}</p>
                </div>
              </div>
            </div>
            {co2Data.alertLevel !== 'LOW' && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${co2Data.alertLevel === 'CRITICAL' ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-amber-900/20 border-amber-500/30 text-amber-300'}`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span><strong>ASHRAE Alert:</strong> {co2Data.status} • Increase ventilation or pause entry at {pranaConfig.co2Monitoring}</span>
              </div>
            )}
          </EnterpriseCard>
        </div>
      </div>

      {/* Recommended Actions */}
      <EnterpriseCard className="p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Recommended Operational Safety Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] space-y-1">
            <p className="font-bold text-amber-300">1. Divert Inflow</p>
            <p className="text-slate-400 text-[11px]">Reroute 350 devotees from Gate 1 to Gate 3 to balance queue density.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] space-y-1">
            <p className="font-bold text-slate-200">2. Open Auxiliary Corridor</p>
            <p className="text-slate-400 text-[11px]">Activate Queue Lane B at Main Concourse for faster clearance.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] space-y-1">
            <p className="font-bold text-amber-300">3. Position Marshals</p>
            <p className="text-slate-400 text-[11px]">Assign 6 Field Marshals to Moksha Gate for queue flow management.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] space-y-1">
            <p className="font-bold text-red-400">4. Medical Standby</p>
            <p className="text-slate-400 text-[11px]">Keep Medical Unit 2 ready at inner sanctum bypass corridor.</p>
          </div>
        </div>
      </EnterpriseCard>
    </div>
  );
};
