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

  const initCamera = async () => {
    try {
      setScanState('initializing');

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

      // 1. Try environment camera constraint
      try {
        await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
        started = true;
      } catch (_) {
        // 2. Try user/front camera constraint
        try {
          await html5QrCode.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
          started = true;
        } catch (_) {
          // 3. Try device ID lookup
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              for (const cam of cameras) {
                try {
                  await html5QrCode.start(cam.id, config, onScanSuccess, () => {});
                  started = true;
                  break;
                } catch (_) {}
              }
            }
          } catch (_) {}
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
        setScanState('camera_in_use');
      }

    } catch (err) {
      const errName = err?.name || err?.toString() || '';
      if (/NotAllowedError|PermissionDenied/i.test(errName)) {
        setScanState('permission_denied');
      } else if (/NotFoundError|DevicesNotFoundError/i.test(errName)) {
        setScanState('no_camera');
      } else {
        setScanState('camera_in_use');
      }
    }
  };

  useEffect(() => {
    initCamera();

    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
          html5QrCodeRef.current.clear();
        } catch (_) {}
      }
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
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body pb-24 pt-3 px-3 max-w-md mx-auto flex flex-col justify-between selection:bg-gold selection:text-indigo-dark space-y-4">
      
      {/* Top Header & Mode Switcher — Pilgrim Temple Style */}
      <div className="bg-white p-4 rounded-3xl border border-gold/30 shadow-warm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/v/dashboard')}
              className="p-2 bg-amber-50 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-maroon font-heading block">
                GATE PASS VERIFIER
              </span>
              <h1 className="text-sm font-black text-indigo-dark font-heading">
                Live Field Scanner
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

        {/* SCAN MODE DROPDOWN SELECTOR */}
        <div className="flex items-center justify-between bg-amber-50/60 p-2.5 rounded-2xl border border-gold/30">
          <span className="text-[10px] font-bold text-amber-900 font-heading uppercase">GATE SELECTION:</span>
          <select
            value={scanMode}
            onChange={(e) => setScanMode(e.target.value)}
            className="bg-white text-indigo-dark text-xs font-black px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer border border-gold/40 font-heading shadow-xs"
          >
            <option value="gate">⛩️ Gate Entry Pass</option>
            <option value="ropeway">🚡 Pavagadh Ropeway Boarding</option>
            <option value="boat">⛵ Bet Dwarka Boat Boarding</option>
          </select>
        </div>

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
      <div className="my-auto py-2">
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

          {/* EXPLICIT PERMISSION & HARDWARE ERROR STATES */}
          {scanState === 'permission_denied' && (
            <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertOctagon className="w-10 h-10 text-rose-400" />
              <h3 className="font-extrabold text-sm text-white font-heading">Camera Access Denied</h3>
              <p className="text-xs text-white/80">Allow camera permission in your browser or use QR image / manual entry.</p>
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
              <p className="text-xs text-white/80">Upload a QR image photo or enter devotee pass code manually.</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <label className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-xl uppercase transition-all shadow-md cursor-pointer text-center font-heading">
                  📁 Upload QR Code Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl uppercase transition-all cursor-pointer font-heading"
                >
                  Enter Code Manually →
                </button>
              </div>
            </div>
          )}

          {scanState === 'camera_in_use' && (
            <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-gold animate-spin" />
              <h3 className="font-extrabold text-sm text-white font-heading">Connecting Camera</h3>
              <p className="text-xs text-white/80">Click below to connect webcam, or upload an image / verify sample pass.</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => initCamera()}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-xl uppercase transition-all shadow-md cursor-pointer font-heading"
                >
                  ⚡ Start Camera Scanner
                </button>
                <label className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl uppercase transition-all cursor-pointer text-center font-heading">
                  📁 Upload QR Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-1.5 text-gold hover:underline font-bold text-xs"
                >
                  Or enter token manually →
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
                INVALID / ALREADY USED!
              </h2>
              <p className="text-xs text-white/90 font-bold">{statusMessage}</p>
              <span className="text-[10px] text-white/70 font-mono mt-2">Resuming scan in 2s...</span>
            </div>
          )}
        </div>

        {/* Quick Test Demo Scan Triggers */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {scanMode === 'ropeway' ? (
            <button
              onClick={() => handleDecodedQR('RPW-PVG-849201', html5QrCodeRef.current)}
              className="px-3.5 py-1.5 bg-white text-emerald-700 text-xs font-bold rounded-xl border border-emerald-300 font-mono shadow-xs cursor-pointer hover:bg-emerald-50"
            >
              + Test Ropeway Pass (RPW-PVG-849201)
            </button>
          ) : scanMode === 'boat' ? (
            <button
              onClick={() => handleDecodedQR('BOAT-DWA-984120', html5QrCodeRef.current)}
              className="px-3.5 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 font-mono shadow-xs cursor-pointer hover:bg-indigo-50"
            >
              + Test Boat Pass (BOAT-DWA-984120)
            </button>
          ) : (
            <button
              onClick={() => handleDecodedQR('KV-8492', html5QrCodeRef.current)}
              className="px-3.5 py-1.5 bg-white text-maroon text-xs font-bold rounded-xl border border-gold/40 font-mono shadow-xs cursor-pointer hover:bg-amber-50"
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
          className="text-xs font-black text-maroon hover:underline uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto font-heading cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-gold" />
          <span>Enter code manually (Damaged / Dim QR)</span>
        </button>
      </div>

      {/* Manual Input Fallback Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl border-2 border-gold/40 max-w-sm w-full space-y-4 shadow-warm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-indigo-dark font-heading uppercase">
                MANUAL TOKEN CODE INPUT
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Enter Token Code ({scanMode.toUpperCase()} mode):
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="KV-8492 / RPW-PVG-102"
                  className="w-full px-4 py-3 bg-amber-50/40 border border-gold/40 rounded-xl text-center text-sm font-mono text-indigo-dark focus:outline-none focus:border-maroon uppercase"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl uppercase font-heading cursor-pointer shadow-goldGlow"
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
