import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle, ShieldCheck, Activity, User, Phone, Radio, Siren, WifiOff } from 'lucide-react';
import { templeAIConfigEngine } from '../../lib/templeAIConfigEngine';
import { acousticPanicEngine } from '../../lib/acousticPanicEngine';

const DRISHTI_URL = import.meta.env.VITE_DRISHTI_URL || 'http://localhost:8000';
const WS_URL = (import.meta.env.VITE_DRISHTI_URL || 'http://localhost:8000').replace(/^http/, 'ws');

const EnterpriseCard = ({ children, className = '' }) => (
  <div className={`bg-[#1C1617] border border-amber-950/40 rounded-xl shadow-xs transition-all ${className}`}>
    {children}
  </div>
);

export const DhwaniRakshak = ({ templeId = 'tmp_somnath' }) => {
  const dhwaniConfig = templeAIConfigEngine.getConfig(templeId, 'dhwani_rakshak').config;

  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isLiveMic, setIsLiveMic] = useState(false);
  const [micError, setMicError] = useState(null);
  const [currentDecibels, setCurrentDecibels] = useState(dhwaniConfig.baselineDb || 58);
  const [rollingBaselineDb, setRollingBaselineDb] = useState(dhwaniConfig.baselineDb || 58);
  const [panicScore, setPanicScore] = useState(8);
  const [acousticState, setAcousticState] = useState('NORMAL');
  const [lastPanicEvent, setLastPanicEvent] = useState(null);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const micControllerRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const baselineRef = useRef(dhwaniConfig.baselineDb || 58);
  const simIntervalRef = useRef(null);

  // Backend audio monitoring WS sync
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendAudioStatus, setBackendAudioStatus] = useState('Audio: Normal');

  useEffect(() => {
    let ws = null;
    let mounted = true;
    let retryDelay = 5000;
    let retryTimer = null;

    const connectWS = () => {
      if (!mounted) return;
      try {
        ws = new WebSocket(`${WS_URL}/ws`);
        ws.onopen = () => {
          if (mounted) { setBackendConnected(true); retryDelay = 5000; }
        };
        ws.onmessage = (ev) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(ev.data);
            if (data.audio_status) setBackendAudioStatus(data.audio_status);
          } catch (_) {}
        };
        ws.onclose = () => {
          if (mounted) {
            setBackendConnected(false);
            retryTimer = setTimeout(connectWS, retryDelay);
            retryDelay = Math.min(retryDelay * 1.5, 30000);
          }
        };
        ws.onerror = () => {
          // Suppress — onclose will handle retry; avoid double-close race
          if (mounted) setBackendConnected(false);
        };
      } catch (_) {
        if (mounted) {
          setBackendConnected(false);
          retryTimer = setTimeout(connectWS, retryDelay);
        }
      }
    };

    connectWS();
    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      // Only close if socket is still connecting or open — avoids the
      // "WebSocket is closed before the connection is established" warning
      if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
        try { ws.close(); } catch (_) {}
      }
    };
  }, []);

  // Canvas renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (analyserRef.current && dataArrayRef.current && isLiveMic) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const bw = (canvas.width / dataArrayRef.current.length) * 2;
        let x = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const bh = (dataArrayRef.current[i] / 255) * canvas.height;
          const hue = acousticState === 'CRITICAL' ? 0 : acousticState === 'SUSPICIOUS' ? 30 : 45;
          ctx.fillStyle = `hsla(${hue},90%,60%,0.85)`;
          ctx.fillRect(x, canvas.height - bh, bw - 1, bh);
          x += bw;
          if (x > canvas.width) break;
        }
      } else {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = acousticState === 'CRITICAL' ? '#f87171' : acousticState === 'SUSPICIOUS' ? '#fb923c' : '#fcd34d';
        const wh = isMicEnabled ? 24 : 10;
        for (let x = 0; x < canvas.width; x += 3) {
          const y = canvas.height / 2 + Math.sin(x * 0.05 + phase) * wh * Math.cos(x * 0.01);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        phase += 0.08;
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isMicEnabled, acousticState, isLiveMic]);

  // Simulation ticker • stops when real mic is active
  useEffect(() => {
    if (isLiveMic) { if (simIntervalRef.current) clearInterval(simIntervalRef.current); return; }
    simIntervalRef.current = setInterval(() => {
      const r = Math.random();
      if (r > 0.92) { setCurrentDecibels(84); setPanicScore(78); setAcousticState('SUSPICIOUS'); }
      else {
        const db = Math.floor(Math.random() * 12) + 52;
        setCurrentDecibels(db);
        setPanicScore(Math.max(5, Math.round((db - 40) / 60 * 25)));
        setAcousticState('NORMAL');
      }
    }, 3000);
    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, [isLiveMic]);

  useEffect(() => { return () => { if (micControllerRef.current) micControllerRef.current.stop(); }; }, []);

  const handleMicToggle = async () => {
    if (isLiveMic && micControllerRef.current) {
      micControllerRef.current.stop();
      micControllerRef.current = null; analyserRef.current = null; dataArrayRef.current = null;
      setIsLiveMic(false); setIsMicEnabled(false); setMicError(null); return;
    }
    setIsMicEnabled(true); setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      const delta = dhwaniConfig.spikeDeltaDb || 22;
      let prev = baselineRef.current;
      const iv = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        let total = 0, hi = 0, lo = 0;
        const cut = Math.floor(dataArrayRef.current.length * 0.25);
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          total += dataArrayRef.current[i];
          i < cut ? lo += dataArrayRef.current[i] : hi += dataArrayRef.current[i];
        }
        const avg = total / dataArrayRef.current.length;
        const dB = Math.min(100, Math.round(35 + (avg / 255) * 65));
        const sr = hi / (lo + 1);
        const spike = dB - prev; prev = dB;
        const pct = Math.min(100, Math.round((Math.max(0, dB - baselineRef.current) / delta) * 60 + sr * 35));
        setCurrentDecibels(dB); setPanicScore(pct);
        const panic = (dB >= 86 && sr >= 0.40) || (dB >= 88 && spike >= 18);
        if (panic) {
          setAcousticState('CRITICAL');
          setLastPanicEvent({ time: new Date().toLocaleTimeString('en-IN'), dB, confidence: Math.min(99, Math.round(pct)), screamRatio: sr.toFixed(2) });
          acousticPanicEngine.playPanicSiren();
        } else if (dB >= baselineRef.current + delta) setAcousticState('SUSPICIOUS');
        else setAcousticState('NORMAL');
      }, 500);
      micControllerRef.current = { stop: () => { clearInterval(iv); stream.getTracks().forEach(t => t.stop()); try { audioCtx.close(); } catch {} } };
      setIsLiveMic(true);
    } catch { setMicError('Microphone access denied. Running acoustic simulation instead.'); setIsLiveMic(false); }
  };

  const handleSetBaseline = () => { baselineRef.current = currentDecibels; setRollingBaselineDb(currentDecibels); };

  const handleDemoPanic = async () => {
    if (isLiveMic) { await handleMicToggle(); }
    setCurrentDecibels(93);
    setPanicScore(92);
    setAcousticState('CRITICAL');
    setLastPanicEvent({
      time: new Date().toLocaleTimeString('en-IN'),
      dB: 93,
      confidence: 92,
      screamRatio: '1.42',
    });
    acousticPanicEngine.playPanicSiren();
    try {
      await fetch(`${DRISHTI_URL}/api/panic/simulate`, { method: 'POST' });
    } catch (_) {}
  };

  return (
    <div className="space-y-5 text-slate-100 font-sans">
      <EnterpriseCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">Dhwani Rakshak • Acoustic Monitoring</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border flex items-center gap-1.5 ${
                  backendConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${backendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {backendConnected ? 'Synced to Drishti Audio Backend' : 'Local Acoustic Engine (Backend Offline)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Backend Status: <strong className={backendAudioStatus.includes('Panic') || backendAudioStatus.includes('CRITICAL') ? 'text-red-300' : 'text-emerald-300'}>{backendAudioStatus}</strong>
                • Baseline: <strong className="text-slate-200">{rollingBaselineDb} dB</strong> • Spike Trigger: <strong className="text-slate-200">+{dhwaniConfig.spikeDeltaDb || 22} dB</strong> • Scream Band: <strong className="text-slate-200">1.2°•4.5 kHz</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isLiveMic && (
              <button type="button" onClick={handleSetBaseline} title="Capture current dB as ambient baseline"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-700/60 text-slate-200 border border-slate-600 hover:bg-slate-600 transition-all">
                <Radio className="w-3.5 h-3.5" /> Calibrate Baseline
              </button>
            )}
            <button type="button" onClick={handleDemoPanic}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30 transition-all shadow-sm shadow-red-500/10">
              <Siren className="w-4 h-4 animate-pulse" /> Test Panic Demo
            </button>
            <button type="button" onClick={handleMicToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLiveMic ? 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'}`}>
              {isLiveMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isLiveMic ? 'Stop Live Sensor' : 'Activate Live Mic Sensor'}
            </button>
          </div>
        </div>
        {micError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {micError}
          </div>
        )}
      </EnterpriseCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <EnterpriseCard className="p-5 md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              {isLiveMic ? 'Live Frequency Spectrum (Real Microphone)' : 'Live Acoustic Spectrum Stream'}
            </h3>
            <span className={`text-xs font-mono font-bold ${isLiveMic ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isLiveMic ? '🔴 LIVE INPUT' : 'PCM 48 kHz'}
            </span>
          </div>
          <canvas ref={canvasRef} width={600} height={120} className="w-full h-28 bg-[#140F10] rounded-xl border border-white/[0.06] block" />
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>20 Hz</span>
            <span className="text-amber-300 font-semibold">1.2°•4.5 kHz (Panic Scream Band)</span>
            <span>20 kHz</span>
          </div>
        </EnterpriseCard>

        <EnterpriseCard className="p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase font-medium">Live Decibel Reading</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold tabular-nums transition-colors ${currentDecibels >= 80 ? 'text-red-400' : 'text-amber-300'}`}>{currentDecibels}</span>
              <span className="text-xs text-slate-400 mb-1">dB SPL</span>
            </div>
            <div className="w-full bg-[#140F10] h-2.5 rounded-full overflow-hidden border border-white/[0.06]">
              <div className={`h-full rounded-full transition-all duration-300 ${currentDecibels >= 80 ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (currentDecibels / 120) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-500">Baseline: {rollingBaselineDb} dB | Trigger at: {rollingBaselineDb + (dhwaniConfig.spikeDeltaDb || 22)} dB</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase font-medium">Acoustic Panic Level</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold tabular-nums ${panicScore >= 70 ? 'text-red-400' : 'text-amber-300'}`}>{panicScore}%</span>
            </div>
            <div className="w-full bg-[#140F10] h-2.5 rounded-full overflow-hidden border border-white/[0.06]">
              <div className={`h-full rounded-full transition-all duration-300 ${panicScore >= 70 ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${panicScore}%` }} />
            </div>
          </div>
          <div className={`p-2.5 rounded-lg text-center text-xs font-bold border transition-all ${acousticState === 'CRITICAL' ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse' : acousticState === 'SUSPICIOUS' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            {acousticState === 'CRITICAL' ? '?? PANIC DETECTED' : acousticState === 'SUSPICIOUS' ? '?? SUSPICIOUS SPIKE' : '? NORMAL AMBIENT'}
          </div>
        </EnterpriseCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <EnterpriseCard className="p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Audio Event Log
          </h3>
          <div className="space-y-2.5 text-xs">
            {lastPanicEvent && (
              <div className="p-3 rounded-xl bg-red-900/20 border border-red-500/40 space-y-1">
                <p className="font-bold text-red-300">?? PANIC EVENT • {lastPanicEvent.time}</p>
                <p className="text-[10px] text-slate-400">Peak: {lastPanicEvent.dB} dB | Scream Ratio: {lastPanicEvent.screamRatio} | Confidence: {lastPanicEvent.confidence}%</p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">LIVE DETECTED</span>
              </div>
            )}
            <div className="p-3 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-center justify-between">
              <div><p className="font-medium text-white">Normal Temple Ambient</p><p className="text-[10px] text-slate-400">Bhajans & Bells • Low scream ratio, filtered</p></div>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">NORMAL</span>
            </div>
            <div className="p-3 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-center justify-between">
              <div><p className="font-medium text-amber-300">Loudspeaker Transient</p><p className="text-[10px] text-slate-400">High dB but low scream ratio • Not panic</p></div>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">FILTERED</span>
            </div>
          </div>
        </EnterpriseCard>
        <EnterpriseCard className="p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Duty Staff Notifications
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-amber-400" />
                <div><p className="font-medium text-white">Vikram Sharma (Volunteer #8841)</p><p className="text-[10px] text-slate-400">Gate 1 Concourse • 45m away</p></div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold">NOTIFIED</span>
            </div>
            <div className="p-3 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400" />
                <div><p className="font-medium text-white">Medical Response Booth 2</p><p className="text-[10px] text-slate-400">Standby • ETA 1.5 mins</p></div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">READY</span>
            </div>
          </div>
        </EnterpriseCard>
      </div>
    </div>
  );
};
