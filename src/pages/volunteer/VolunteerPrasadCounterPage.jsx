import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { prasadQueueEngine } from '../../lib/prasadQueueEngine';
import { verifyPrasadToken } from '../../lib/volunteerEngine';
import { 
  Utensils, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, 
  QrCode, Camera, AlertCircle, X, ShieldCheck, Sparkles, Building2,
  AlertOctagon, Check, ArrowRight
} from 'lucide-react';

const TEMPLE_CONFIG = {
  tmp_somnath: { id: 'tmp_somnath', name: 'Somnath Temple', shortName: 'Somnath', hallName: 'Shree Somnath Mahaprasad Annakshetra', capacity: 3000 },
  tmp_dwarka: { id: 'tmp_dwarka', name: 'Dwarkadhish Temple', shortName: 'Dwarkadhish', hallName: 'Shreeji Bhog & Prasad Counter', capacity: 2500 },
  tmp_ambaji: { id: 'tmp_ambaji', name: 'Ambaji Temple', shortName: 'Ambaji', hallName: 'Mataji Gabbar Mahaprasad Hall', capacity: 2000 },
  tmp_pavagadh: { id: 'tmp_pavagadh', name: 'Kalika Mata Temple', shortName: 'Pavagadh', hallName: 'Machi Annakshetra & Prasad Desk', capacity: 1800 }
};

export const VolunteerPrasadCounterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isLoggedIn } = useVolunteerAuth();

  // Temple Context
  const initialTemple = searchParams.get('temple') || localStorage.getItem('nirvighna_volunteer_temple_id') || currentUser?.templeId || 'tmp_somnath';
  const [templeId, setTempleId] = useState(initialTemple);
  const currentTemple = TEMPLE_CONFIG[templeId] || TEMPLE_CONFIG['tmp_somnath'];

  // Serving State
  const [servingToken, setServingToken] = useState(140);
  const [issuedToday, setIssuedToday] = useState(195);
  const [servedToday, setServedToday] = useState(140);
  const [loading, setLoading] = useState(false);

  // Live Camera Scanner State
  const [scanState, setScanState] = useState('scanning'); // 'scanning' | 'ready' | 'camera_in_use' | 'permission_denied' | 'no_camera'
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Manual input & Verification feedback
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (_) {}
  };

  const fetchCounterState = () => {
    setLoading(true);
    try {
      const stats = prasadQueueEngine.getCounterStats(templeId);
      setServingToken(stats.currentServingToken);
      setIssuedToday(stats.issuedToday);
      setServedToday(stats.servedToday);
    } catch (_) {
      setServingToken(140);
      setIssuedToday(195);
      setServedToday(140);
    } finally {
      setLoading(false);
    }
  };

  const releaseAllMediaStreams = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (_) {}
  };

  // Direct Live Front Camera Initialization
  const initDirectCamera = async () => {
    try {
      const el = document.getElementById('prasad-viewfinder-div');
      if (!el) {
        setTimeout(initDirectCamera, 100);
        return;
      }

      await releaseAllMediaStreams();

      const html5QrCode = new Html5Qrcode('prasad-viewfinder-div');
      html5QrCodeRef.current = html5QrCode;

      const config = { 
        fps: 15, 
        qrbox: { width: 220, height: 220 }, 
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      };

      const onScanSuccess = (decodedText) => {
        if (!isProcessingRef.current) {
          isProcessingRef.current = true;
          playChime();
          handleVerifyQRToken(decodedText.trim());
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 2000);
        }
      };

      let started = false;
      let lastErr = null;

      // 1. First try facingMode: 'user' directly (triggers browser permission prompt cleanly)
      try {
        await html5QrCode.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
        started = true;
      } catch (e) {
        lastErr = e;
        console.warn('facingMode user start failed, checking getCameras:', e);
      }

      // 2. Try camera list from getCameras()
      if (!started) {
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const frontCam = cameras.find(c => /front|user|facetime|integrated|webcam/i.test(c.label)) || cameras[0];
            await html5QrCode.start(frontCam.id, config, onScanSuccess, () => {});
            started = true;
          }
        } catch (e) {
          lastErr = e;
          console.warn('Direct camera ID start failed:', e);
        }
      }

      // 3. Fallback to facingMode: 'environment'
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
          started = true;
        } catch (e) {
          lastErr = e;
          console.warn('facingMode environment failed:', e);
        }
      }

      if (started) {
        setScanState('scanning');
      } else {
        const errStr = lastErr?.name || lastErr?.toString() || '';
        if (/NotReadableError/i.test(errStr)) {
          setScanState('camera_in_use');
        } else if (/NotAllowedError|PermissionDenied|Permission/i.test(errStr)) {
          setScanState('permission_denied');
        } else if (/NotFoundError|DevicesNotFoundError/i.test(errStr)) {
          setScanState('no_camera');
        } else {
          setScanState('camera_in_use');
        }
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      const errName = err?.name || err?.toString() || '';
      if (/NotReadableError/i.test(errName)) {
        setScanState('camera_in_use');
      } else if (/NotAllowedError|PermissionDenied|Permission/i.test(errName)) {
        setScanState('permission_denied');
      } else if (/NotFoundError|DevicesNotFoundError/i.test(errName)) {
        setScanState('no_camera');
      } else {
        setScanState('camera_in_use');
      }
    }
  };

  const handleRequestCameraAndRetry = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (_) {}
    await releaseAllMediaStreams();
    setTimeout(initDirectCamera, 200);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchCounterState();

    let timer = setTimeout(() => {
      initDirectCamera();
    }, 150);

    // Cross-tab real-time sync
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('nirvighna_prasad_sync');
        bc.onmessage = (e) => {
          if (e.data?.templeId === templeId) {
            fetchCounterState();
          }
        };
      }
    } catch (_) {}

    const handleCustomEvent = (e) => {
      if (e.detail?.templeId === templeId) {
        fetchCounterState();
      }
    };

    const handleStorage = (e) => {
      if (e.key?.includes('nirvighna_prasad') || e.key?.includes('nirvighna_highest_prasad')) {
        fetchCounterState();
      }
    };

    window.addEventListener('nirvighna_prasad_counter_updated', handleCustomEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (_) {}
      }
      if (bc) try { bc.close(); } catch (_) {}
      window.removeEventListener('nirvighna_prasad_counter_updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [templeId]);

  const handleTempleChange = (newTempleId) => {
    setTempleId(newTempleId);
    localStorage.setItem('nirvighna_volunteer_temple_id', newTempleId);
    setScanResult(null);
  };

  const handleServeNext = async () => {
    try {
      playChime();
      await prasadQueueEngine.serveNextPrasadToken(templeId);
      fetchCounterState();
    } catch (_) {
      setServingToken(prev => prev + 1);
      setServedToday(prev => prev + 1);
    }
  };

  const handleVerifyQRToken = async (codeToVerify) => {
    const code = codeToVerify || manualCodeInput;
    if (!code.trim()) return;

    setVerifying(true);
    setScanResult(null);

    try {
      const res = await verifyPrasadToken(code, currentUser?.id || 'vol_prasad_1', templeId);
      setScanResult(res);

      if (res.success) {
        playChime();
        if (res.token_number && res.token_number >= servingToken) {
          await prasadQueueEngine.serveNextPrasadToken(templeId);
        }
        fetchCounterState();
      }
    } catch (err) {
      setScanResult({ success: false, message: '🚨 Validation Error: ' + err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-indigo-dark font-body pb-28 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      
      {/* Top Sacred Header */}
      <div className="bg-white p-4 sm:p-5 rounded-[28px] border border-[#E8DFC8] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/v/scan')}
            className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 font-heading flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-800" />
                {currentTemple.name.toUpperCase()}
              </span>
            </div>
            <h1 className="text-base font-black font-heading text-maroon tracking-wide mt-1">
              Annakshetra Prasad Counter
            </h1>
            <p className="text-[10px] text-gray-500 font-medium">{currentTemple.hallName}</p>
          </div>
        </div>

        <button
          onClick={fetchCounterState}
          className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer"
          title="Refresh Counter"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* LIVE STATS 2-COLUMN BAR */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">TOKENS ISSUED TODAY</span>
          <p className="text-xl font-black text-amber-900 font-mono">{issuedToday}</p>
          <span className="text-[9px] text-gray-400 font-medium">Virtual Prasad Passes</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-emerald-800 uppercase font-heading block">SERVED &amp; COMPLETED</span>
          <p className="text-xl font-black text-emerald-700 font-mono">{servedToday}</p>
          <span className="text-[9px] text-emerald-700 font-medium">✓ Prasad Distributed</span>
        </div>
      </div>

      {/* ─── DIRECT LIVE CAMERA VIEWFINDER (AUTO-OPEN FRONT CAMERA) ─── */}
      <div className="bg-white p-4 rounded-[28px] border border-[#E8DFC8] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-gray-100">
          <h3 className="font-black text-xs text-indigo-dark font-heading uppercase tracking-wide flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-emerald-600" />
            Live Prasad QR Scanner
          </h3>
          <span className="text-[10px] text-gray-400 font-mono">Point at Pilgrim QR</span>
        </div>

        {/* Viewfinder Frame */}
        <div className="relative w-full aspect-square max-w-[260px] mx-auto rounded-3xl overflow-hidden border-4 border-gold shadow-warm bg-black flex items-center justify-center">
          <style>{`
            #prasad-viewfinder-div video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
          `}</style>
          {/* HTML5 QR Camera Container */}
          <div id="prasad-viewfinder-div" className="w-full h-full object-cover overflow-hidden" />

          {/* Animated Gold Scan Target Overlay */}
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 animate-bounce z-10" />
          <div className="absolute inset-4 border-2 border-gold/80 rounded-2xl pointer-events-none z-10 flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <span className="w-5 h-5 border-t-4 border-l-4 border-gold rounded-tl-lg" />
              <span className="w-5 h-5 border-t-4 border-r-4 border-gold rounded-tr-lg" />
            </div>
            <div className="flex justify-between">
              <span className="w-5 h-5 border-b-4 border-l-4 border-gold rounded-bl-lg" />
              <span className="w-5 h-5 border-b-4 border-r-4 border-gold rounded-br-lg" />
            </div>
          </div>

          {/* Camera in Use / Locked by another app */}
          {scanState === 'camera_in_use' && (
            <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2">
              <Camera className="w-8 h-8 text-amber-400 animate-pulse" />
              <p className="text-xs text-white font-bold">Camera In Use / Busy</p>
              <p className="text-[10px] text-amber-200/90 max-w-[200px] leading-tight">
                Another browser tab (e.g. Gate Scanner) has locked the camera.
              </p>
              <button
                type="button"
                onClick={handleRequestCameraAndRetry}
                className="px-3.5 py-1.5 bg-gold hover:bg-amber-400 text-indigo-dark font-black text-xs rounded-xl uppercase shadow-xs cursor-pointer font-heading transition-all"
              >
                🔄 Free &amp; Retry
              </button>
            </div>
          )}

          {/* Permission Denied */}
          {scanState === 'permission_denied' && (
            <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2">
              <AlertOctagon className="w-8 h-8 text-rose-400" />
              <p className="text-xs text-white font-bold">Camera Permission Required</p>
              <p className="text-[10px] text-gray-300">Click below to allow browser camera access</p>
              <button
                type="button"
                onClick={handleRequestCameraAndRetry}
                className="px-4 py-2 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-xl uppercase shadow-xs cursor-pointer font-heading active:scale-95 transition-all"
              >
                📷 Allow Camera &amp; Start
              </button>
            </div>
          )}
        </div>

        {/* VERIFICATION FEEDBACK BANNER (WHEN SCANNED) */}
        {scanResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in zoom-in-95 ${
            scanResult.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {scanResult.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-extrabold text-sm font-heading">
                  {scanResult.success ? '✓ PRASAD TOKEN VERIFIED!' : '🚨 SCAN VERIFICATION FAILED'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-mono font-medium">{scanResult.message || 'Pass checked against Prasad database.'}</p>
            
            {scanResult.success && (
              <div className="text-xs font-mono bg-white p-2.5 rounded-xl border border-emerald-200 mt-2 text-indigo-dark flex items-center justify-between">
                <span>Token Number: <strong className="text-emerald-700">#{scanResult.token_number}</strong></span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Meal Claimed ✓</span>
              </div>
            )}
          </div>
        )}

        {/* Manual Token Number Input */}
        <div className="pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5 font-heading">
            Or Enter Token / Payload Manually
          </span>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyQRToken();
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              required
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              placeholder="e.g. PRASAD-145"
              className="flex-1 px-4 py-2 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-center text-sm font-bold font-mono text-indigo-dark focus:outline-none focus:border-maroon"
            />
            <button
              type="submit"
              disabled={!manualCodeInput.trim() || verifying}
              className="px-4 py-2 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl shadow-xs uppercase font-heading cursor-pointer hover:from-amber-400 hover:to-gold"
            >
              {verifying ? '...' : 'Verify'}
            </button>
          </form>
        </div>

      </div>

      {/* GIANT SERVING TOKEN DISPLAY CARD (MOVED TO BOTTOM) */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E8DFC8] text-center space-y-2 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-maroon bg-[#FFF7ED] px-3.5 py-0.5 rounded-full border border-[#FED7AA] font-heading inline-block">
          CURRENTLY SERVING TOKEN
        </span>

        <div>
          <p className="text-5xl sm:text-6xl font-black text-maroon tracking-tighter font-mono inline-block">
            #{servingToken}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">{currentTemple.hallName}</p>
        </div>
      </div>

    </div>
  );
};
