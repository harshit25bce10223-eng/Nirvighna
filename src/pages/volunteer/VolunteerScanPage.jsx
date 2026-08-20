import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { scanQRPass } from '../../lib/volunteerEngine';
import { scanRopewayQR } from '../../lib/ropewayEngine';
import { scanBoatQR } from '../../lib/boatCrossingEngine';
import { 
  QrCode, ArrowLeft, CheckCircle, AlertCircle, RefreshCw, X, 
  KeyRound, Zap, ZapOff, Camera, AlertOctagon
} from 'lucide-react';

export const VolunteerScanPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  // State Machine: 'initializing' | 'scanning' | 'processing' | 'success_flash' | 'error_flash' | 'permission_denied' | 'no_camera' | 'camera_in_use'
  const [scanState, setScanState] = useState('initializing');
  const [statusMessage, setStatusMessage] = useState('');

  // Mode: 'gate' | 'ropeway' | 'boat'
  const [scanMode, setScanMode] = useState('gate');
  const [ropewayCabin, setRopewayCabin] = useState({ boarded: 6, capacity: 10 });

  // Torch / Flashlight capabilities
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Manual entry modal
  const [manualInput, setManualInput] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initCamera = async () => {
      try {
        setScanState('initializing');

        // 1. Get available cameras
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
          if (isMounted) setScanState('no_camera');
          return;
        }

        // Prefer camera whose label contains 'back' or 'environment', else fall back to last camera in array
        let chosenCamera = cameras.find(c => /back|environment/i.test(c.label));
        if (!chosenCamera) {
          chosenCamera = cameras[cameras.length - 1];
        }

        const cameraId = chosenCamera.id;

        // 2. Instantiate Html5Qrcode on existing DOM div
        const html5QrCode = new Html5Qrcode('reader-viewfinder-div');
        html5QrCodeRef.current = html5QrCode;

        // 3. Start scanning with fps: 10 (deliberate choice for battery & performance)
        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

        await html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            if (!isProcessingRef.current && isMounted) {
              handleDecodedQR(decodedText, html5QrCode);
            }
          },
          () => {
            // Frame scan failure ignored
          }
        );

        if (isMounted) {
          setScanState('scanning');

          // Check low-light torch capability
          try {
            const capabilities = html5QrCode.getRunningTrackCapabilities();
            if (capabilities && capabilities.torch) {
              setHasTorch(true);
            }
          } catch (e) {
            setHasTorch(false);
          }
        }

      } catch (err) {
        if (!isMounted) return;
        const errName = err?.name || err?.toString() || '';

        if (/NotAllowedError|PermissionDenied/i.test(errName)) {
          setScanState('permission_denied');
        } else if (/NotFoundError|DevicesNotFoundError/i.test(errName)) {
          setScanState('no_camera');
        } else if (/NotReadableError|TrackStartError/i.test(errName)) {
          setScanState('camera_in_use');
        } else {
          setScanState('permission_denied');
        }
      }
    };

    initCamera();

    // CLEANUP: Component unmount releases camera hardware
    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
          })
          .catch(() => {});
      }
    };
  }, []);

  const handleDecodedQR = async (decodedText, scannerInstance) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setScanState('processing');

    // DEBOUNCE: Pause scanner frame processing immediately so duplicate frames don't refire
    try {
      if (scannerInstance && scannerInstance.getState() === 2) {
        scannerInstance.pause(true); // true keeps last frame visible
      }
    } catch (e) {
      // Pause fallback
    }

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
          setStatusMessage(res.error || '✕ Invalid or Already Boarded Cable Car Pass');
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

    // 3. GATE ENTRY MODE
    try {
      const result = await scanQRPass(cleanCode, currentUser?.id || 'vol_8841');

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
      setStatusMessage('Valid Pass Code Read!');

      setTimeout(() => {
        navigate(`/v/scan-result/${result.qr_pass_id}`, {
          state: {
            qr_pass_id: result.qr_pass_id,
            holder_name: result.holder_name,
            gate_number: result.gate_number,
            is_priority: result.is_priority,
            temple_name: result.temple_name,
            slot_date: result.slot_date,
            slot_time: result.slot_time
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
      if (scannerInstance && scannerInstance.getState() === 3) { // 3 is PAUSED state
        scannerInstance.resume();
      }
    } catch (e) {
      // Resume fallback
    }
  };

  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    const nextState = !isTorchOn;
    try {
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {
      // Torch fallback
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setShowManualModal(false);
    handleDecodedQR(manualInput, html5QrCodeRef.current);
    setManualInput('');
  };

  return (
    <div className="min-h-screen bg-[#181012] text-white font-body pb-24 pt-3 px-3 max-w-md mx-auto flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header & Mode Switcher — Command Centre Enterprise Style */}
      <div className="bg-[#221517] p-3.5 rounded-2xl border border-amber-900/30 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/v/dashboard')}
              className="p-1.5 bg-slate-900 rounded-xl border border-white/10 text-amber-400 hover:border-amber-500/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xs font-black text-white font-heading uppercase tracking-wider">
              FIELD PASS SCANNER
            </h1>
          </div>

          {/* Low-Light Torch Toggle Button (Only rendered if hardware supports torch) */}
          {hasTorch && (
            <button
              onClick={handleToggleTorch}
              className={`p-2 rounded-full border transition-all ${
                isTorchOn
                  ? 'bg-amber-500 text-slate-950 border-gold shadow-goldGlow'
                  : 'bg-slate-900 text-white border-white/20'
              }`}
              title="Toggle Flashlight"
            >
              {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* SCAN MODE DROPDOWN SELECTOR */}
        <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-amber-900/30">
          <span className="text-[10px] font-bold text-amber-400 font-mono">SCAN MODE:</span>
          <select
            value={scanMode}
            onChange={(e) => setScanMode(e.target.value)}
            className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-lg focus:outline-none cursor-pointer border border-amber-500/30 font-heading"
          >
            <option value="gate" className="bg-slate-900 text-white">⛩️ Gate Entry Pass</option>
            <option value="ropeway" className="bg-slate-900 text-white">🚡 Pavagadh Ropeway Boarding</option>
            <option value="boat" className="bg-slate-900 text-white">⛵ Bet Dwarka Boat Boarding</option>
          </select>
        </div>

        {/* ROPEWAY CABIN CAPACITY COUNTER */}
        {scanMode === 'ropeway' && (
          <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-300">🚡 Boarded this trip:</span>
            <span className="text-amber-400 font-black text-sm bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
              {ropewayCabin.boarded} / {ropewayCabin.capacity}
            </span>
          </div>
        )}
      </div>

      {/* VIEWFINDER CONTAINER */}
      <div className="my-auto py-2">
        <div className="relative w-full aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden border-4 border-temple-orange shadow-temple bg-black flex items-center justify-center">
          
          {/* html5-qrcode DOM Container Element */}
          <div id="reader-viewfinder-div" className="w-full h-full object-cover overflow-hidden" />

          {/* Animated Burnt Orange Scan Frame Overlay */}
          {(scanState === 'scanning' || scanState === 'processing') && (
            <>
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-temple-orange to-transparent absolute top-1/2 animate-bounce z-10" />
              <div className="absolute inset-4 border-2 border-temple-orange rounded-2xl pointer-events-none z-10 flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-6 h-6 border-t-4 border-l-4 border-temple-orange rounded-tl-lg" />
                  <span className="w-6 h-6 border-t-4 border-r-4 border-temple-orange rounded-tr-lg" />
                </div>
                <div className="flex justify-between">
                  <span className="w-6 h-6 border-b-4 border-l-4 border-temple-orange rounded-bl-lg" />
                  <span className="w-6 h-6 border-b-4 border-r-4 border-temple-orange rounded-br-br-lg" />
                </div>
              </div>
            </>
          )}

          {/* EXPLICIT PERMISSION & HARDWARE ERROR STATES */}
          {scanState === 'permission_denied' && (
            <div className="absolute inset-0 bg-temple-brown/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertOctagon className="w-12 h-12 text-red-400" />
              <h3 className="font-extrabold text-sm text-red-300 font-heading">Camera Access Denied</h3>
              <p className="text-xs text-white/80">Enable camera access in your browser or device settings.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-temple-orange text-white font-black text-xs rounded-xl uppercase"
              >
                Re-trigger Permission Prompt
              </button>
            </div>
          )}

          {scanState === 'no_camera' && (
            <div className="absolute inset-0 bg-temple-brown/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Camera className="w-12 h-12 text-temple-orange" />
              <h3 className="font-extrabold text-sm text-white font-heading">No Camera Detected</h3>
              <p className="text-xs text-white/80">Camera hardware not found on this device.</p>
              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2 bg-temple-orange text-white font-black text-xs rounded-xl uppercase"
              >
                Use Manual Code Entry →
              </button>
            </div>
          )}

          {scanState === 'camera_in_use' && (
            <div className="absolute inset-0 bg-temple-brown/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="w-12 h-12 text-temple-orange animate-spin" />
              <h3 className="font-extrabold text-sm text-white font-heading">Camera in Use</h3>
              <p className="text-xs text-white/80">Camera is open in another app or tab. Close it and retry.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-temple-orange text-white font-black text-xs rounded-xl uppercase"
              >
                Retry Camera Connection
              </button>
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

          {/* OVERLAY: Warm Rust Red Warning Error Flash (~2s) */}
          {scanState === 'error_flash' && (
            <div className="absolute inset-0 bg-darkWarm-rust/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-white text-darkWarm-rust flex items-center justify-center shadow-lg font-black text-2xl">
                ✕
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-heading">
                INVALID / ALREADY USED!
              </h2>
              <p className="text-xs text-white/90 font-bold">{statusMessage}</p>
              <span className="text-[10px] text-white/70 font-mono mt-2">Resuming scan in 2s...</span>
            </div>
          )}
        </div>

        {/* Quick Demo Scan Triggers */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {scanMode === 'ropeway' ? (
            <button
              onClick={() => handleDecodedQR('RPW-PVG-849201', html5QrCodeRef.current)}
              className="px-3 py-1.5 bg-white text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200 font-mono"
            >
              + Test Ropeway Pass (RPW-PVG-849201)
            </button>
          ) : scanMode === 'boat' ? (
            <button
              onClick={() => handleDecodedQR('BOAT-DWA-984120', html5QrCodeRef.current)}
              className="px-3 py-1.5 bg-white text-blue-600 text-xs font-bold rounded-xl border border-blue-200 font-mono"
            >
              + Test Boat Pass (BOAT-DWA-984120)
            </button>
          ) : (
            <button
              onClick={() => handleDecodedQR('KV-8492', html5QrCodeRef.current)}
              className="px-3 py-1.5 bg-white text-temple-orange text-xs font-bold rounded-xl border border-temple-peach font-mono"
            >
              + Test Gate Pass (KV-8492)
            </button>
          )}
        </div>
      </div>

      {/* Manual Entry Fallback Link */}
      <div className="text-center space-y-1">
        <button
          onClick={() => setShowManualModal(true)}
          className="text-xs font-black text-temple-brown hover:underline uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto font-heading"
        >
          <KeyRound className="w-4 h-4 text-temple-orange" />
          <span>Enter code manually (Damaged / Dim QR)</span>
        </button>
      </div>

      {/* Manual Input Fallback Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl border border-temple-peach max-w-sm w-full space-y-4 shadow-temple">
            <div className="flex items-center justify-between border-b border-temple-peach pb-3">
              <h3 className="font-extrabold text-sm text-temple-brown font-heading">
                MANUAL TOKEN CODE INPUT
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 text-temple-textMuted hover:text-temple-brown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-temple-text block mb-1">
                  Enter Token Code ({scanMode.toUpperCase()} mode):
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="KV-8492 / RPW-PVG-102"
                  className="w-full px-4 py-3 bg-cream border border-temple-peach rounded-xl text-center text-sm font-mono text-temple-brown focus:outline-none focus:border-temple-orange uppercase"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 bg-cream text-temple-textMuted font-bold text-xs rounded-xl border border-temple-peach"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-temple-orange text-white font-black text-xs rounded-xl uppercase"
                >
                  Verify Token →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
