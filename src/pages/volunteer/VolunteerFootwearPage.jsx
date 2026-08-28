import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { 
  PackageCheck, ArrowLeft, RefreshCw, PlusCircle, Search, 
  CheckCircle, AlertTriangle, QrCode, Camera, X, Clock, MapPin, ArrowRight,
  AlertOctagon, Volume2, ChevronDown, Building2
} from 'lucide-react';

const TEMPLE_CONFIG = {
  tmp_somnath: { id: 'tmp_somnath', name: 'Somnath Temple', shortName: 'Somnath', standName: 'Stand #1 (Mahapravesh Dwar)', capacity: 600 },
  tmp_dwarka: { id: 'tmp_dwarka', name: 'Dwarkadhish Temple', shortName: 'Dwarkadhish', standName: 'Stand #2 (Swarga Dwar)', capacity: 500 },
  tmp_ambaji: { id: 'tmp_ambaji', name: 'Ambaji Temple', shortName: 'Ambaji', standName: 'Stand #1 (Gabbar Gate)', capacity: 450 },
  tmp_pavagadh: { id: 'tmp_pavagadh', name: 'Kalika Mata Temple', shortName: 'Pavagadh', standName: 'Stand #1 (Machi Gate)', capacity: 400 }
};

export const VolunteerFootwearPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isLoggedIn } = useVolunteerAuth();

  // Temple Context
  const initialTemple = searchParams.get('temple') || localStorage.getItem('nirvighna_volunteer_temple_id') || currentUser?.templeId || 'tmp_somnath';
  const [selectedTempleId, setSelectedTempleId] = useState(initialTemple);
  const currentTemple = TEMPLE_CONFIG[selectedTempleId] || TEMPLE_CONFIG['tmp_somnath'];

  // Scanner Camera State
  const [scanState, setScanState] = useState('scanning'); // 'scanning' | 'ready' | 'camera_in_use' | 'permission_denied' | 'no_camera'
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Quick manual Search input
  const [searchNumInput, setSearchNumInput] = useState('');

  // Live Stats & Recent Logs
  const [recentTokens, setRecentTokens] = useState([]);
  const [stats, setStats] = useState({
    inRacks: 40,
    issuedToday: 148,
    returned: 108
  });

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (_) {}
  };

  const formatTimeAgo = (iso) => {
    if (!iso) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const syncFootwearStats = (tId = selectedTempleId) => {
    try {
      let localTokens = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      let templeTokens = localTokens.filter(t => !t.temple_id || t.temple_id === tId);
      
      if (templeTokens.length === 0) {
        const initialSims = [
          { id: `fw_${tId}_142`, temple_id: tId, token_number: 142, pairs: 2, status: 'deposited', deposited_at: new Date(Date.now() - 5 * 60000).toISOString() },
          { id: `fw_${tId}_141`, temple_id: tId, token_number: 141, pairs: 1, status: 'deposited', deposited_at: new Date(Date.now() - 12 * 60000).toISOString() },
          { id: `fw_${tId}_140`, temple_id: tId, token_number: 140, pairs: 4, status: 'collected', deposited_at: new Date(Date.now() - 24 * 60000).toISOString(), collected_at: new Date(Date.now() - 5 * 60000).toISOString() },
          { id: `fw_${tId}_139`, temple_id: tId, token_number: 139, pairs: 1, status: 'collected', deposited_at: new Date(Date.now() - 38 * 60000).toISOString(), collected_at: new Date(Date.now() - 10 * 60000).toISOString() }
        ];
        localTokens = [...localTokens, ...initialSims];
        localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify(localTokens));
        templeTokens = initialSims;
      }

      const depositedList = templeTokens.filter(t => t.status === 'deposited');
      const collectedList = templeTokens.filter(t => t.status === 'collected');
      
      const baseIssued = tId === 'tmp_dwarka' ? 148 : (tId === 'tmp_somnath' ? 220 : 130);
      const baseReturned = tId === 'tmp_dwarka' ? 108 : (tId === 'tmp_somnath' ? 175 : 95);
      
      setStats({
        inRacks: Math.max(0, 35 + depositedList.length),
        issuedToday: baseIssued + templeTokens.length,
        returned: baseReturned + collectedList.length
      });

      // Populate recent list from actual tokens (latest first)
      const mappedRecent = [...templeTokens]
        .reverse()
        .slice(0, 6)
        .map(t => ({
          token_number: t.token_number,
          pairs: t.pairs || 1,
          status: t.status,
          time: formatTimeAgo(t.status === 'collected' ? (t.collected_at || t.deposited_at) : t.deposited_at)
        }));
      setRecentTokens(mappedRecent);
    } catch (_) {
      setStats({ inRacks: 40, issuedToday: 148, returned: 108 });
    }
  };

  const handleTempleChange = (newTempleId) => {
    setSelectedTempleId(newTempleId);
    localStorage.setItem('nirvighna_volunteer_temple_id', newTempleId);
    syncFootwearStats(newTempleId);
  };

  const broadcastFootwearUpdate = () => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nirvighna_interconnected_sync');
        bc.postMessage({ action: 'FOOTWEAR_UPDATED', timestamp: Date.now() });
        bc.close();
      }
    } catch (_) {}
  };

  // Direct Live Front Camera Initialization
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

  const initDirectCamera = async () => {
    try {
      const el = document.getElementById('footwear-viewfinder-div');
      if (!el) {
        setTimeout(initDirectCamera, 100);
        return;
      }

      await releaseAllMediaStreams();

      const html5QrCode = new Html5Qrcode('footwear-viewfinder-div');
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
          const cleanCode = decodedText.trim();
          navigate(`/v/footwear-result/${encodeURIComponent(cleanCode)}?temple=${selectedTempleId}`);
        }
      };

      let started = false;
      let lastErr = null;

      // 1. Try Front / User / Webcam camera from getCameras()
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const frontCam = cameras.find(c => /front|user|facetime|integrated|webcam/i.test(c.label)) || cameras[0];
          await html5QrCode.start(frontCam.id, config, onScanSuccess, () => {});
          started = true;
        }
      } catch (e) {
        lastErr = e;
        console.warn('Direct camera ID start failed, trying facingMode user:', e);
      }

      // 2. Try facingMode: 'user' (Front Camera)
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
          started = true;
        } catch (e) {
          lastErr = e;
          console.warn('facingMode user failed:', e);
        }
      }

      // 3. Fallback to generic facingMode
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
        } else if (/NotAllowedError|PermissionDenied/i.test(errStr)) {
          setScanState('permission_denied');
        } else {
          setScanState('camera_in_use');
        }
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      const errName = err?.name || err?.toString() || '';
      if (/NotReadableError/i.test(errName)) {
        setScanState('camera_in_use');
      } else if (/NotAllowedError|PermissionDenied/i.test(errName)) {
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
    syncFootwearStats();

    let timer = setTimeout(() => {
      initDirectCamera();
    }, 150);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('nirvighna_interconnected_sync');
        bc.onmessage = (event) => {
          if (event.data?.action === 'FOOTWEAR_UPDATED') {
            syncFootwearStats();
          }
        };
      }
    } catch (_) {}

    const handleStorage = (e) => {
      if (e.key === 'nirvighna_footwear_tokens') {
        syncFootwearStats();
      }
    };
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
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchNumInput.trim()) return;
    playChime();
    navigate(`/v/footwear-result/${encodeURIComponent(searchNumInput.trim())}?temple=${selectedTempleId}`);
  };

  return (
    <div className="min-h-screen bg-ivory text-indigo-dark font-body pb-12 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      
      {/* Top Header */}
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
              Footwear Locker Desk
            </h1>
            <p className="text-[10px] text-gray-500 font-medium">{currentTemple.standName}</p>
          </div>
        </div>

        <button
          onClick={() => syncFootwearStats(selectedTempleId)}
          className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer shadow-xs"
          title="Refresh Rack Count"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3 LIVE INTERCONNECTED RACK STATS BAR */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">IN RACKS</span>
          <p className="text-xl font-black text-amber-900 font-mono">{stats.inRacks}</p>
          <span className="text-[9px] text-gray-400 font-medium">/ {currentTemple.capacity} Cap</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">ISSUED TODAY</span>
          <p className="text-xl font-black text-maroon font-mono">{stats.issuedToday}</p>
          <span className="text-[9px] text-amber-800 font-medium">Tokens</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">RETURNED</span>
          <p className="text-xl font-black text-emerald-700 font-mono">{stats.returned}</p>
          <span className="text-[9px] text-emerald-700 font-medium">Safe</span>
        </div>
      </div>

      {/* ─── DIRECT LIVE CAMERA VIEWFINDER (AUTO-OPEN) ─── */}
      <div className="bg-white p-4 rounded-[28px] border border-[#E8DFC8] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-gray-100">
          <h3 className="font-black text-xs text-indigo-dark font-heading uppercase tracking-wide">
            Live Footwear Scanner
          </h3>
          <span className="text-[10px] text-gray-400 font-mono">Point at Pilgrim QR</span>
        </div>

        {/* Viewfinder Frame */}
        <div className="relative w-full aspect-square max-w-[260px] mx-auto rounded-3xl overflow-hidden border-4 border-gold shadow-warm bg-black flex items-center justify-center">
          <style>{`
            #footwear-viewfinder-div video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
          `}</style>
          {/* HTML5 QR Camera Container */}
          <div id="footwear-viewfinder-div" className="w-full h-full object-cover overflow-hidden" />

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
                Another browser tab (e.g. Gate Scanner) or app has locked the webcam.
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

        {/* Manual Token Number Input */}
        <div className="pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5 font-heading">
            Or Search Token Number
          </span>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="number"
              required
              value={searchNumInput}
              onChange={(e) => setSearchNumInput(e.target.value)}
              placeholder="e.g. 142"
              className="flex-1 px-4 py-2 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-center text-base font-black font-mono text-indigo-dark focus:outline-none focus:border-maroon"
            />
            <button
              type="submit"
              disabled={!searchNumInput.trim()}
              className="px-4 py-2 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl shadow-xs uppercase font-heading cursor-pointer hover:from-amber-400 hover:to-gold"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Instant Test Scan Pilgrim Trigger */}
        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              playChime();
              navigate(`/v/footwear-result/140?temple=${selectedTempleId}`);
            }}
            className="w-full py-2 bg-[#FAF7F2] hover:bg-gold/20 text-maroon font-bold text-xs rounded-xl border border-[#E8DFC8] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-heading"
          >
            <span>⚡ Test Scan Pilgrim Pass (Locker #140 • {currentTemple.shortName})</span>
          </button>
        </div>

      </div>

      {/* RECENT DUTY DEPOSITS (LIVE INTERCONNECTED) */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E8DFC8] shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h4 className="font-black text-xs text-indigo-dark font-heading uppercase tracking-wide">
            Recent Duty Deposits
          </h4>
          <span className="text-[10px] text-gray-400 font-mono">Shift Activity</span>
        </div>

        <div className="space-y-2">
          {recentTokens.map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/v/footwear-result/${item.token_number}`)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6EF] border border-[#EFE5D5] text-xs hover:border-gold cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white text-maroon font-black font-mono flex items-center justify-center border border-gold/30 shadow-xs">
                  #{item.token_number}
                </span>
                <div>
                  <p className="font-bold text-indigo-dark">Rack #{item.token_number} ({item.pairs} {item.pairs > 1 ? 'Pairs' : 'Pair'})</p>
                  <p className="text-[10px] text-gray-500">{item.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  item.status === 'deposited'
                    ? 'bg-amber-50 text-amber-900 border-gold/40'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {item.status === 'deposited' ? 'In Rack' : 'Returned'}
                </span>
                <span className="text-gray-400 text-xs">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
