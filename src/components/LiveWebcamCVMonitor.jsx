import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Play, Pause, RefreshCw, ShieldCheck, VideoOff, Smile, UserCheck, Cpu, CheckCircle2, Users, Cpu as CpuIcon } from 'lucide-react';
import { drishtiPipeline } from '../lib/drishtiVisionPipeline';

const DRISHTI_URL = import.meta.env.VITE_DRISHTI_URL || 'http://localhost:8000';

/**
 * Live Camera & Crowd Vision Monitor
 * PRIMARY: the trained backend model (Ultralytics YOLO drishti_person.pt) processing the
 * real physical webcam frame-by-frame - streamed via /video_feed with real bounding boxes,
 * counts sourced from backend /api/predict (active YOLO tracks = people in camera NOW).
 * SECONDARY: an optional in-browser cross-check (BlazeFace + COCO-SSD) that only starts when
 * the browser can still open a camera (i.e. backend released it).
 */

export const LiveWebcamCVMonitor = () => {
  const streamActiveRef = { active: false };
  const intervalRef = useRef(null);
  const pollRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [autoActive, setAutoActive] = useState(true);

  const [backend, setBackend] = useState({
    connected: false,
    source: 'UNKNOWN',
    demoMode: false,
    counts: 0,
    entries: 0,
    exits: 0,
    modelVersion: 'drishti_person.pt',
    detectionMethod: 'Ultralytics YOLOv8n (Trained drishti_person.pt)',
    timestamp: null,
  });

  const [browserCount, setBrowserCount] = useState(null);
  const [browserChecking, setBrowserChecking] = useState(false);

  const pollBackend = useCallback(async () => {
    try {
      const res = await fetch(`${DRISHTI_URL}/api/predict`, { method: 'GET' });
      if (!res.ok) { setBackend(b => ({ ...b, connected: false })); return; }
      const data = await res.json();
      const isDemo = data.source === 'SIMULATED_FOR_DEMO';
      setBackend(b => ({
        ...b,
        connected: true,
        source: data.source,
        demoMode: isDemo,
        counts: Number(data.current_occupancy) || 0,
        entries: Number(data.verified_count) || 0,
        exits: Number(data.exit_count) || 0,
        timestamp: data.timestamp || null,
      }));
    } catch (e) {
      setBackend(b => ({ ...b, connected: false }));
    }
  }, []);

  useEffect(() => {
    pollBackend();
    pollRef.current = setInterval(pollBackend, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollBackend]);

  // Optional in-browser cross-check - only works if a physical camera is still free.
  const startBrowserDetection = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser camera API unavailable. The trained backend YOLO feed below is the primary source.');
      return;
    }
    setAnalyzing(true);
    setCameraError('');
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
    } catch (err) {
      // Backend usually owns the webcam in this demo, so in-browser cross-check is unavailable.
      const reason = err.name === 'NotReadableError'
        ? 'Backend trained YOLO is already using the webcam - in-browser cross-check disabled. The feed below IS the trained model output.'
        : err.name === 'NotAllowedError'
          ? 'Camera permission denied. Backend YOLO feed below still shows trained-model detections. Allow camera permission in the address bar to unlock the in-browser cross-check.'
          : 'Webcam unavailable to the browser. The backend trained YOLO feed is the primary source.';
      setCameraError(reason);
      if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
      setAnalyzing(false);
      return;
    }
    if (stream && stream.getTracks) setTimeout(() => stream.getTracks().forEach(t => t.stop()), 6000);
    setBrowserChecking(true);
    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => { video.play().then(resolve).catch(resolve); };
        setTimeout(resolve, 4000);
      });
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      const faceRes = await drishtiPipeline.detectFacesInVideo(video, canvas);
      const cocoRes = await drishtiPipeline.processVideoFrameCOCOSSD(video);
      const persons = cocoRes.activeTracksCount || 0;
      const faces = faceRes.count || 0;
      setBrowserCount({ faces, persons, method: persons > 0 ? 'COCO-SSD (in-browser)' : (faces > 0 ? 'BlazeFace (in-browser)' : 'No detection yet') });
    } catch (e) {
      setBrowserCount(null);
    } finally {
      if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
      setBrowserChecking(false);
      setAnalyzing(false);
    }
  }, []);

  const stopBrowserDetection = useCallback(() => {
    setBrowserChecking(false);
    setBrowserCount(null);
  }, []);

  // For non-browser users give an explicit "Scan" too.
  const manualScan = useCallback(async () => {
    await pollBackend();
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 900);
  }, [pollBackend]);

  const totalCount = backend.connected ? backend.counts : 0;
  const isReal = backend.connected && !backend.demoMode;
  const isDemo = backend.connected && backend.demoMode;

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/10 gap-2">
        <div className="flex items-center gap-2.5">
          {backend.connected ? (
            <span className={`flex items-center gap-1.5 text-xs font-bold ${isReal ? 'text-emerald-300' : 'text-amber-300'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isReal ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isReal ? 'TRAINED YOLO MODEL — REAL WEBCAM DETECTIONS' : 'VIDEO FEED — SIMULATED CROWD DEMO'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <VideoOff className="w-3.5 h-3.5" />
              Backend offline — start it on port 8000
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isReal
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isDemo
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}
          >
            <CpuIcon className="w-3.5 h-3.5" />
            <span>{isReal ? 'REAL MODEL ACTIVE' : isDemo ? 'DEMO CROWD (NO SENSORS)' : 'OFFLINE'}</span>
          </div>

          <button
            type="button"
            onClick={manualScan}
            disabled={analyzing || !backend.connected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-3 h-3" />
            {analyzing ? 'Scanning...' : 'Re-Scan'}
          </button>
          {!browserChecking ? (
            <button
              type="button"
              onClick={browserCount ? stopBrowserDetection : startBrowserDetection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
            >
              <Camera className="w-3 h-3" />
              {browserCount ? 'Clear Cross-Check' : 'In-Browser Cross-Check'}
            </button>
          ) : (
            <button type="button" disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700 opacity-70">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Cross-checking...
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 relative bg-black flex items-center justify-center" style={{ minHeight: 300 }}>
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden" style={{ minHeight: 300 }}>
            {/* Backend trained-YOLO MJPEG feed (REAL boxes drawn by the model) */}
            <img
              src={`${DRISHTI_URL}/video_feed`}
              className="w-full h-auto max-h-[360px] object-contain mx-auto block rounded-lg border border-amber-900/40"
              alt="Trained YOLO model - real webcam detection feed"
            />

            {/* HUD Header */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="text-[10px] font-mono font-bold bg-black/80 text-emerald-300 px-2.5 py-1 rounded border border-emerald-500/40 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-emerald-300" />
                {isReal ? 'MODEL: YOLOv8n (drishti_person.pt) • REAL FRAME' : backend.connected ? 'SIMULATED FRAME (DEMO)' : 'MODEL STANDBY'}
              </span>
              {backend.connected && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${isReal ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {isReal ? 'LIVE' : 'DEMO'}
                </span>
              )}
            </div>

            {cameraError && (
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                <div className="bg-black/85 backdrop-blur-sm rounded-lg px-3 py-2 border border-amber-500/30 text-[11px] text-amber-200">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> In-browser check info:
                  </span>{' '}
                  {cameraError}
                </div>
              </div>
            )}

            {backend.timestamp && (
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center justify-between border border-white/10 text-xs">
                  <span className="text-[10px] text-gray-300">Trained model feed · last frame <strong className="text-emerald-300">{backend.timestamp}</strong></span>
                  <span className="text-[10px] text-emerald-300 font-mono">YOLOv8n · Webcam0</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TELEMETRY PANEL */}
        <div className="p-4 flex flex-col justify-between gap-4 border-l border-white/10 bg-slate-900">
          <div className="space-y-4">
            {/* PEOPLE IN CAMERA NOW (active YOLO tracks) */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 space-y-1">
              <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                People in Camera (Trained Model)
              </p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-emerald-300 tabular-nums">
                  {backend.connected ? totalCount.toLocaleString() : '—'}
                </span>
                <span className="text-xs text-slate-400 mb-1">active YOLO track{totalCount !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isReal ? 'Real-time detections from the physical webcam via backend model.' : isDemo ? 'Simulated demo crowd — no physical sensors connected.' : ''}
              </p>
            </div>

            {/* Model Runtime Stats */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Detector Runtime</p>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Model</span>
                <span className="text-white font-mono">{backend.modelVersion}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Gate Entries</span>
                <span className="text-white font-mono">{backend.connected ? backend.entries.toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Exits</span>
                <span className="text-white font-mono">{backend.connected ? backend.exits.toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Method</span>
                <span className="text-amber-300 font-mono text-[10px] text-right">{backend.detectionMethod}</span>
              </div>
            </div>

            {/* STATUS BADGE */}
            <div className={`text-xs font-semibold p-2.5 rounded-xl border ${isReal ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : isDemo ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-800/80 border-slate-700 text-slate-400'}`}>
              {isReal
                ? `✓ Trained model predicting ${totalCount} devotee${totalCount !== 1 ? 's' : ''} in camera.`
                : isDemo
                  ? '⚠ Simulated crowd — physical sensor data unavailable.'
                  : 'Backend offline.'}
            </div>
          </div>

          <div className="space-y-2">
            {browserCount && (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 space-y-1 font-mono text-[10px] text-slate-400">
                <p className="text-amber-300 font-bold">In-browser cross-check: {browserCount.method}</p>
                <p className="text-emerald-400 font-bold">Faces: {browserCount.faces} | Persons: {browserCount.persons}</p>
              </div>
            )}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10 space-y-1 font-mono text-[10px] text-slate-400">
              <p className="text-amber-300 font-bold">Privacy-First</p>
              <p>Real frames processed by trained model for counting. No footage is stored or uploaded.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};