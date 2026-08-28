import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { scanQRPass } from '../../lib/volunteerEngine';
import { scanRopewayQR } from '../../lib/ropewayEngine';
import { scanBoatQR } from '../../lib/boatCrossingEngine';
import { getActiveGateReroutes } from '../../lib/aiGateRerouteEngine';
import { 
  QrCode, ArrowLeft, CheckCircle, AlertCircle, RefreshCw, X, 
  KeyRound, Zap, ZapOff, Camera, AlertOctagon, Radio, ArrowRight
} from 'lucide-react';

export const VolunteerScanPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, assignedDuty, isLoggedIn } = useVolunteerAuth();

  // Temple & Gate scoping via query params or auth state
  const dutyParam = searchParams.get('duty') || assignedDuty;
  const gateParam = searchParams.get('gate');
  const templeParam = searchParams.get('temple');
  const selectedTempleId = templeParam || localStorage.getItem('nirvighna_volunteer_temple_id') || 'tmp_somnath';

  const templeData = {
    tmp_somnath: {
      name: 'Somnath Temple',
      badge: '🔱 SRI SOMNATH MAHADEV',
      gates: [
        { id: 'gate_1', name: '🚪 Gate 1 — Mahapravesh Dwar (Main Entrance)', mode: 'gate' },
        { id: 'gate_2', name: '🚪 Gate 2 — Digvijay Dwar (Fast-Track Queue)', mode: 'gate' },
        { id: 'gate_3', name: '🚪 Gate 3 — Samudra Darshan Dwar (VIP / Elderly)', mode: 'gate' }
      ]
    },
    tmp_dwarka: {
      name: 'Dwarkadhish Temple',
      badge: '🦚 DWARKADHISH JAGAT MANDIR',
      gates: [
        { id: 'gate_1', name: '🚪 Gate 1 — Swarga Dwar (Main Entrance)', mode: 'gate' },
        { id: 'gate_2', name: '🚪 Gate 2 — Moksha Dwar (Exit & VIP Clearance)', mode: 'gate' },
        { id: 'gate_3', name: '🚪 Gate 3 — Sudama Dwar (Priority Pass)', mode: 'gate' },
        { id: 'boat_jetty', name: '⛵ Ferry Gate — Bet Dwarka Boat Jetty', mode: 'boat' }
      ]
    },
    tmp_ambaji: {
      name: 'Ambaji Temple',
      badge: '🦁 SRI AMBAJI SHAKTIPEETH',
      gates: [
        { id: 'gate_1', name: '🚪 Gate 1 — Shakti Dwar (Main Pilgrim Entry)', mode: 'gate' },
        { id: 'gate_2', name: '🚪 Gate 2 — Gabbar Gokh Dwar (Fast-Track)', mode: 'gate' },
        { id: 'gate_3', name: '🚪 Gate 3 — Chachar Chowk Dwar (Elderly & Seva)', mode: 'gate' }
      ]
    },
    tmp_pavagadh: {
      name: 'Kalika Mata (Pavagadh)',
      badge: '⛰️ SRI KALIKA MATA PAVAGADH',
      gates: [
        { id: 'gate_1', name: '🚪 Gate 1 — Machi Base Steps Entrance', mode: 'gate' },
        { id: 'gate_2', name: '🚪 Gate 2 — Dudhiya Talao Gate (Trek Route)', mode: 'gate' },
        { id: 'gate_3', name: '🚪 Gate 3 — Top Hill Cliff Gate', mode: 'gate' },
        { id: 'machi_ropeway', name: '🚡 Ropeway Gate — Machi Cable Car Boarding', mode: 'ropeway' }
      ]
    }
  };

  const currentTemple = templeData[selectedTempleId] || templeData.tmp_somnath;
  const availableGates = currentTemple.gates;

  const [selectedGateId, setSelectedGateId] = useState(() => {
    if (gateParam) return gateParam;
    if (dutyParam === 'ropeway_counter') return 'machi_ropeway';
    if (dutyParam === 'boat_counter') return 'boat_jetty';
    return availableGates[0]?.id || 'gate_1';
  });

  // Inner-gate volunteers belong to the dedicated Sanctum page — never mix scopes
  useEffect(() => {
    if (isLoggedIn && assignedDuty === 'inner_gate_scanner' && !searchParams.get('duty')) {
      navigate('/v/inner-gate', { replace: true });
    }
  }, [isLoggedIn, assignedDuty, navigate, searchParams]);

  // State Machine: 'ready' | 'scanning' | 'processing' | 'success_flash' | 'error_flash' | 'permission_denied' | 'no_camera'
  const [scanState, setScanState] = useState('ready');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeReroutes, setActiveReroutes] = useState(getActiveGateReroutes());

  const currentReroute = activeReroutes[selectedTempleId] || null;

  // Mode: 'gate' | 'ropeway' | 'boat'
  const [scanMode, setScanMode] = useState(() => {
    const chosen = availableGates.find(g => g.id === selectedGateId);
    if (chosen?.mode) return chosen.mode;
    if (assignedDuty === 'ropeway_counter') return 'ropeway';
    if (assignedDuty === 'boat_counter') return 'boat';
    return 'gate';
  });

  const handleGateSelectionChange = (e) => {
    const newGateId = e.target.value;
    setSelectedGateId(newGateId);
    const chosen = availableGates.find(g => g.id === newGateId);
    if (chosen) {
      setScanMode(chosen.mode || 'gate');
    }
  };

  const [ropewayCabin, setRopewayCabin] = useState({ boarded: 6, capacity: 10 });

  // Torch / Flashlight capabilities
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Manual entry modal
  const [manualInput, setManualInput] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  const initCamera = async () => {
    try {
      const el = document.getElementById('reader-viewfinder-div');
      if (!el) {
        setTimeout(initCamera, 120);
        return;
      }

      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (_) {}
      }

      const html5QrCode = new Html5Qrcode('reader-viewfinder-div');
      html5QrCodeRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
      const onScanSuccess = (decodedText) => {
        if (!isProcessingRef.current) {
          handleDecodedQR(decodedText, html5QrCode);
        }
      };

      let started = false;

      // 1. Try Front / User / Webcam camera from getCameras()
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const frontCam = cameras.find(c => /front|user|facetime|integrated|webcam/i.test(c.label)) || cameras[0];
          await html5QrCode.start(frontCam.id, config, onScanSuccess, () => {});
          started = true;
        }
      } catch (e) {
        console.warn('Direct camera ID start failed, trying facingMode user:', e);
      }

      // 2. Try user/front camera constraint
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
          started = true;
        } catch (e) {
          console.warn('facingMode user failed:', e);
        }
      }

      // 3. Fallback to generic facingMode
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
          started = true;
        } catch (e) {
          console.warn('facingMode environment fallback failed:', e);
        }
      }

      if (started) {
        setScanState('scanning');
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        } catch (e) {
          setHasTorch(false);
        }
      } else {
        setScanState('ready');
      }

    } catch (err) {
      const errName = err?.name || err?.toString() || '';
      if (/NotAllowedError|PermissionDenied/i.test(errName)) {
        setScanState('permission_denied');
      } else if (/NotFoundError|DevicesNotFoundError/i.test(errName)) {
        setScanState('no_camera');
      } else {
        setScanState('ready');
      }
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    let timer = setTimeout(() => {
      initCamera();
    }, 100);

    // Cross-tab broadcast listener for gate reroutes
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('nirvighna_interconnected_sync');
        bc.onmessage = (event) => {
          if (event.data?.action === 'GATE_REROUTE_UPDATED' || event.data?.action === 'GATE_REROUTE_CLEARED') {
            setActiveReroutes(getActiveGateReroutes());
          }
        };
      }
    } catch (_) {}

    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
          html5QrCodeRef.current.clear();
        } catch (_) {}
      }
      if (bc) try { bc.close(); } catch (_) {}
    };
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('reader-viewfinder-div');
      }
      const qrCodeMessage = await html5QrCodeRef.current.scanFile(file, true);
      if (qrCodeMessage) {
        handleDecodedQR(qrCodeMessage, html5QrCodeRef.current);
      }
    } catch (err) {
      setScanState('error_flash');
      setStatusMessage('✕ No QR code found in uploaded image');
      setTimeout(() => setScanState('scanning'), 2000);
    }
  };

  const handleDecodedQR = async (decodedText, scannerInstance) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setScanState('processing');

    // DEBOUNCE: Pause scanner frame processing immediately so duplicate frames don't refire
    try {
      if (scannerInstance && scannerInstance.getState() === 2) {
        scannerInstance.pause(true);
      }
    } catch (e) {}

    const cleanCode = decodedText.trim().toUpperCase();

    // 1. ROPEWAY MODE
    if (scanMode === 'ropeway') {
      try {
        const res = await scanRopewayQR(cleanCode);
        if (res.success) {
          setScanState('success_flash');
          setStatusMessage(`✓ Board Cabin #${res.pass?.cabin_number || '4'} Approved`);
          setRopewayCabin(prev => ({ ...prev, boarded: Math.min(prev.boarded + 1, prev.capacity) }));
          
          setTimeout(() => {
            resumeScanner(scannerInstance);
          }, 1000);
        } else {
          setScanState('error_flash');
          setStatusMessage(res.error || '✕ Invalid or Already Boarded Pass');
          setTimeout(() => {
            resumeScanner(scannerInstance);
          }, 2000);
        }
      } catch (err) {
        setScanState('error_flash');
        setStatusMessage('✕ Invalid Ropeway Token');
        setTimeout(() => {
          resumeScanner(scannerInstance);
        }, 2000);
      }
      return;
    }

    // 2. BOAT MODE
    if (scanMode === 'boat') {
      try {
        const res = await scanBoatQR(cleanCode);
        if (res.success) {
          setScanState('success_flash');
          setStatusMessage(`✓ Board Vessel "${res.pass?.vessel_name || 'Dwarka Star'}" Approved`);
          setTimeout(() => {
            resumeScanner(scannerInstance);
          }, 1000);
        } else {
          setScanState('error_flash');
          setStatusMessage(res.error || '✕ Invalid or Already Boarded Boat Pass');
          setTimeout(() => {
            resumeScanner(scannerInstance);
          }, 2000);
        }
      } catch (err) {
        setScanState('error_flash');
        setStatusMessage('✕ Invalid Boat Token');
        setTimeout(() => {
          resumeScanner(scannerInstance);
        }, 2000);
      }
      return;
    }

    // 3. GATE ENTRY MODE (Strict Temple & Gate Reroute Enforcement)
    try {
      const result = await scanQRPass(cleanCode, currentUser?.id || 'vol_8841', selectedTempleId, selectedGateId);

      if (!result.success && result.already_scanned) {
        setScanState('error_flash');
        setStatusMessage(result.message || 'Already Used — Pass was scanned earlier');
        setTimeout(() => {
          resumeScanner(scannerInstance);
        }, 2000);
        return;
      }

      if (!result.success) {
        setScanState('error_flash');
        setStatusMessage(result.message || 'Invalid or Unrecognized Pass');
        setTimeout(() => {
          resumeScanner(scannerInstance);
        }, 2000);
        return;
      }

      // Success: Show 1s flash then navigate
      setScanState('success_flash');
      setStatusMessage(result.reroute_notice ? result.reroute_notice : 'Valid Pass Code Read!');

      setTimeout(() => {
        navigate(`/v/scan-result/${result.qr_pass_id}`, {
          state: {
            qr_pass_id: result.qr_pass_id,
            holder_name: result.holder_name,
            gate_number: result.gate_number,
            is_priority: result.is_priority,
            temple_name: result.temple_name,
            slot_date: result.slot_date,
            slot_time: result.slot_time,
            reroute_notice: result.reroute_notice
          }
        });
      }, 700);

    } catch (err) {
      setScanState('error_flash');
      setStatusMessage('Invalid or Unrecognized Pass');
      setTimeout(() => {
        resumeScanner(scannerInstance);
      }, 2000);
    }
  };

  const resumeScanner = (scannerInstance) => {
    isProcessingRef.current = false;
    setScanState('scanning');
    setStatusMessage('');
    try {
      if (scannerInstance && scannerInstance.getState() === 3) {
        scannerInstance.resume();
      }
    } catch (e) {}
  };

  const handleToggleTorch = async () => {
    if (!hasTorch || !html5QrCodeRef.current) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {}
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setShowManualModal(false);
    handleDecodedQR(manualInput, html5QrCodeRef.current);
    setManualInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body pb-24 pt-3 px-3 max-w-md mx-auto flex flex-col justify-between selection:bg-gold selection:text-indigo-dark space-y-3">
      
      {/* Top Header */}
      <div className="bg-white p-3.5 rounded-3xl border border-gold/30 shadow-warm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/v/gate-alerts')}
              className="p-2 bg-amber-50 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-maroon font-heading block">
                {currentTemple.badge}
              </span>
              <h1 className="text-sm font-black text-indigo-dark font-heading">
                {currentTemple.name} — Gate Scanner
              </h1>
            </div>
          </div>

          {/* Low-Light Torch Toggle */}
          {hasTorch && (
            <button
              onClick={handleToggleTorch}
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                isTorchOn
                  ? 'bg-gold text-indigo-dark border-gold shadow-goldGlow'
                  : 'bg-amber-50 text-gray-600 border-gold/30 hover:bg-amber-100'
              }`}
              title="Toggle Flashlight"
            >
              {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* MANDIR-SPECIFIC GATE SELECTION CARD (NO TRUNCATION, FULL NAME) */}
        <div className="bg-amber-50/70 p-3 rounded-2xl border border-gold/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-maroon font-heading uppercase tracking-wider flex items-center gap-1">
              🚪 ACTIVE GATE CHECKPOINT:
            </span>
            <span className="text-[9px] font-bold bg-white text-indigo-dark border border-gold/40 px-2 py-0.5 rounded-lg shadow-2xs font-mono">
              {availableGates.find(g => g.id === selectedGateId)?.mode === 'ropeway' ? '🚡 Ropeway' : availableGates.find(g => g.id === selectedGateId)?.mode === 'boat' ? '⛵ Boat' : '⛩️ Gate Entry'}
            </span>
          </div>
          <select
            value={selectedGateId}
            onChange={handleGateSelectionChange}
            className="w-full bg-white text-indigo-dark text-xs font-black p-2.5 rounded-xl focus:outline-none cursor-pointer border-2 border-gold/50 font-heading shadow-xs leading-relaxed"
          >
            {availableGates.map(gate => (
              <option key={gate.id} value={gate.id} className="py-1 text-xs font-bold text-gray-900">
                {gate.name}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIVE AI REROUTE ALERT BANNER */}
        {currentReroute && (
          <div className="bg-rose-50 border-2 border-rose-400 p-2.5 rounded-2xl text-xs font-bold text-maroon flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <Radio className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
              <span className="truncate">⚡ AI REROUTE ACTIVE: {currentReroute.alertText}</span>
            </div>
            <button
              onClick={() => navigate('/v/gate-alerts')}
              className="text-[10px] font-mono underline shrink-0 font-black text-rose-800 ml-1 cursor-pointer"
            >
              Details →
            </button>
          </div>
        )}

        {/* ROPEWAY CABIN CAPACITY COUNTER */}
        {scanMode === 'ropeway' && (
          <div className="bg-amber-50 p-2.5 rounded-2xl border border-gold/30 flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-gray-700">🚡 Boarded this trip:</span>
            <span className="text-maroon font-black text-sm bg-white border border-gold/40 px-2.5 py-0.5 rounded-xl shadow-xs">
              {ropewayCabin.boarded} / {ropewayCabin.capacity}
            </span>
          </div>
        )}
      </div>

      {/* VIEWFINDER CONTAINER */}
      <div className="my-auto py-1">
        <div className="relative w-full aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden border-4 border-gold shadow-warm bg-black flex items-center justify-center">
          
          {/* html5-qrcode DOM Container Element */}
          <div id="reader-viewfinder-div" className="w-full h-full object-cover overflow-hidden" />

          {/* Animated Gold Scan Frame Overlay */}
          {(scanState === 'scanning' || scanState === 'processing') && (
            <>
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 animate-bounce z-10" />
              <div className="absolute inset-4 border-2 border-gold/80 rounded-2xl pointer-events-none z-10 flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-6 h-6 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                  <span className="w-6 h-6 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                </div>
                <div className="flex justify-between">
                  <span className="w-6 h-6 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                  <span className="w-6 h-6 border-b-4 border-r-4 border-gold rounded-br-lg" />
                </div>
              </div>
            </>
          )}

          {/* READY / CAMERA PROMPT OVERLAY */}
          {scanState === 'ready' && (
            <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 border border-gold flex items-center justify-center text-gold">
                <Camera className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-sm text-white font-heading">Camera Ready</h3>
              <p className="text-xs text-white/80">Tap to start live scanner and scan devotee pass QR.</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => initCamera()}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-xl uppercase transition-all shadow-md cursor-pointer font-heading"
                >
                  Activate Camera Scanner
                </button>

              </div>
            </div>
          )}

          {/* EXPLICIT PERMISSION & HARDWARE ERROR STATES */}
          {scanState === 'permission_denied' && (
            <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertOctagon className="w-10 h-10 text-rose-400" />
              <h3 className="font-extrabold text-sm text-white font-heading">Camera Access Denied</h3>
              <p className="text-xs text-white/80">Allow camera permission in browser to start scanning.</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => initCamera()}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-xl uppercase transition-all shadow-md cursor-pointer font-heading"
                >
                  Retry Camera Connection
                </button>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl uppercase transition-all cursor-pointer font-heading"
                >
                  Enter Code Manually →
                </button>
              </div>
            </div>
          )}

          {scanState === 'no_camera' && (
            <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Camera className="w-10 h-10 text-gold" />
              <h3 className="font-extrabold text-sm text-white font-heading">No Live Camera Found</h3>
              <p className="text-xs text-white/80">Enter devotee pass code manually.</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => initCamera()}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-xl uppercase transition-all shadow-md cursor-pointer font-heading"
                >
                  Retry Camera
                </button>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl uppercase transition-all cursor-pointer font-heading"
                >
                  Enter Code Manually →
                </button>
              </div>
            </div>
          )}

          {/* OVERLAY: Brief Green Confirmation Flash (<1s) */}
          {scanState === 'success_flash' && (
            <div className="absolute inset-0 bg-emerald-600/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg font-black text-3xl animate-bounce">
                ✓
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-heading">
                CODE VERIFIED!
              </h2>
              <p className="text-xs text-emerald-100 font-bold">{statusMessage}</p>
            </div>
          )}

          {/* OVERLAY: Red Warning Error Flash (~2s) */}
          {scanState === 'error_flash' && (
            <div className="absolute inset-0 bg-rose-700/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-white text-rose-700 flex items-center justify-center shadow-lg font-black text-2xl">
                ✕
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-heading">
                ENTRY DENIED / MISMATCH!
              </h2>
              <p className="text-xs text-white/90 font-bold">{statusMessage}</p>
              <span className="text-[10px] text-white/70 font-mono mt-2">Resuming scan in 2s...</span>
            </div>
          )}
        </div>
      </div>

      {/* Inline Manual Input Form */}
      <div className="bg-white rounded-3xl border-2 border-gold/40 p-4 shadow-sm animate-in fade-in space-y-2 mt-4">
        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block font-heading">
          Lookup Devotee Pass Manually ({scanMode.toUpperCase()})
        </span>
        <form 
          onSubmit={handleManualSubmit}
          className="flex gap-2"
        >
          <input
            type="text"
            required
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={`e.g. KV-8492 or ${scanMode === 'ropeway' ? 'RPW-PVG' : 'BT-DWK'}`}
            className="flex-1 px-4 py-2.5 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-center text-sm font-bold font-mono text-indigo-dark focus:outline-none focus:border-maroon uppercase"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl shadow-xs uppercase font-heading cursor-pointer hover:from-amber-400 hover:to-gold"
          >
            Lookup
          </button>
        </form>
      </div>
    </div>
  );
};
