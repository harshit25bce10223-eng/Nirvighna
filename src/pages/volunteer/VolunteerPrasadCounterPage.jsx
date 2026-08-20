import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { prasadQueueEngine } from '../../lib/prasadQueueEngine';
import { verifyPrasadToken } from '../../lib/volunteerEngine';
import { 
  Utensils, ArrowLeft, RefreshCw, ChevronRight, CheckCircle, 
  QrCode, Camera, AlertCircle, X, ShieldCheck, Sparkles 
} from 'lucide-react';

export const VolunteerPrasadCounterPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [templeId, setTempleId] = useState('tmp_somnath');
  const [servingToken, setServingToken] = useState(140);
  const [issuedToday, setIssuedToday] = useState(195);
  const [servedToday, setServedToday] = useState(140);
  const [loading, setLoading] = useState(false);

  // Scan modal & manual verification
  const [showScanModal, setShowScanModal] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    fetchCounterState();
  }, [templeId]);

  const fetchCounterState = () => {
    setLoading(true);
    try {
      const state = prasadQueueEngine.getQueueState(templeId);
      setServingToken(state.currentServingToken || 140);
      setIssuedToday(state.lastIssuedToken || 195);
      setServedToday(state.currentServingToken || 140);
    } catch (_) {
      setServingToken(140);
    } finally {
      setLoading(false);
    }
  };

  const handleServeNext = () => {
    try {
      const nextToken = servingToken + 1;
      prasadQueueEngine.advanceServingToken(templeId);
      setServingToken(nextToken);
      setServedToday(prev => prev + 1);
    } catch (_) {
      setServingToken(prev => prev + 1);
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
        if (res.token_number && res.token_number >= servingToken) {
          setServingToken(res.token_number);
          setServedToday(prev => Math.max(prev, res.token_number));
        }
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
            onClick={() => navigate('/v/dashboard')}
            className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-800 bg-[#FFF7ED] px-2.5 py-0.5 rounded-full border border-[#FED7AA] font-heading">
                🕉️ महाप्रसाद सेवा • PRASAD DESK
              </span>
            </div>
            <h1 className="text-base font-black font-heading text-maroon tracking-wide mt-0.5">
              Annakshetra Prasad Counter
            </h1>
          </div>
        </div>

        <button
          onClick={fetchCounterState}
          className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer"
          title="Refresh Counter"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Temple Counter Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'tmp_somnath', label: '🔱 Somnath' },
          { id: 'tmp_dwarka', label: '🛕 Dwarka' },
          { id: 'tmp_ambaji', label: '🚩 Ambaji' },
          { id: 'tmp_pavagadh', label: '🔱 Pavagadh' }
        ].map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => setTempleId(tItem.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              templeId === tItem.id
                ? 'bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black shadow-xs'
                : 'bg-white text-gray-600 border border-[#E8DFC8] hover:text-maroon'
            }`}
          >
            {tItem.label}
          </button>
        ))}
      </div>

      {/* LIVE STATS 2-COLUMN BAR */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">TOKENS ISSUED TODAY</span>
          <p className="text-xl font-black text-amber-900 font-mono">{issuedToday}</p>
          <span className="text-[9px] text-gray-400 font-medium">Virtual Prasad Passes</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-emerald-800 uppercase font-heading block">SERVED & COMPLETED</span>
          <p className="text-xl font-black text-emerald-700 font-mono">{servedToday}</p>
          <span className="text-[9px] text-emerald-700 font-medium">✓ Prasad Distributed</span>
        </div>
      </div>

      {/* GIANT SERVING TOKEN DISPLAY CARD */}
      <div className="bg-white p-6 rounded-[28px] border border-[#E8DFC8] text-center space-y-4 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-maroon bg-[#FFF7ED] px-3.5 py-1 rounded-full border border-[#FED7AA] font-heading inline-block">
          CURRENTLY SERVING TOKEN
        </span>

        <div className="py-2">
          <p className="text-6xl sm:text-7xl font-black text-maroon tracking-tighter font-mono inline-block">
            #{servingToken}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Annakshetra Hall 1 Serving Line</p>
        </div>

        {/* PRIMARY & SECONDARY ACTIONS */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              setScanResult(null);
              setShowScanModal(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm rounded-2xl shadow-md uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 font-heading cursor-pointer border border-emerald-400"
          >
            <QrCode className="w-5 h-5" />
            <span>SCAN SIGNED PRASAD QR 🔒</span>
          </button>

          <button
            onClick={handleServeNext}
            className="w-full py-3 bg-gradient-to-r from-gold via-amber-400 to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading cursor-pointer"
          >
            <span>Manual Serve Next (#{servingToken + 1}) →</span>
          </button>
        </div>
      </div>

      {/* SCAN TOKEN VERIFICATION MODAL */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-5 max-w-sm w-full space-y-4 border border-[#E8DFC8] shadow-warm relative text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-sm text-indigo-dark font-heading uppercase flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Scan Prasad Token QR
              </h3>
              <button onClick={() => setShowScanModal(false)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-center">
              <div className="bg-[#FAF6EF] p-6 rounded-2xl border-2 border-dashed border-gold flex flex-col items-center justify-center space-y-2">
                <Camera className="w-10 h-10 text-maroon animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-900">CAMERA SCANNER READY</span>
                <span className="text-[10px] text-gray-500">Point device camera at pilgrim's Prasad QR</span>
              </div>

              {/* DEMO QUICK TEST BUTTONS */}
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => handleVerifyQRToken(`PRASAD-${servingToken + 1}`)}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                >
                  Test Valid QR #{servingToken + 1}
                </button>
                <button
                  onClick={() => handleVerifyQRToken(`PRASAD-${servingToken}`)}
                  className="flex-1 py-2 bg-rose-50 text-rose-800 font-bold rounded-xl border border-rose-300 hover:bg-rose-100 cursor-pointer"
                >
                  Test Duplicate QR
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste QR payload..."
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FAF6EF] border border-[#E8DFC8] font-mono text-indigo-dark focus:outline-none focus:border-maroon"
                />
                <button
                  onClick={() => handleVerifyQRToken()}
                  disabled={verifying}
                  className="px-4 py-2 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl uppercase font-heading cursor-pointer shadow-xs"
                >
                  {verifying ? '...' : 'Verify'}
                </button>
              </div>
            </div>

            {/* VERIFICATION FEEDBACK BANNER */}
            {scanResult && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                scanResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
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
                <p className="text-xs font-mono font-medium">{scanResult.message}</p>
                {scanResult.success && (
                  <div className="text-xs font-mono bg-white p-2 rounded-xl border border-emerald-300 mt-2 text-indigo-dark">
                    <span>Token Number: <strong>#{scanResult.token_number}</strong></span> • <span>Meal: Free Bhandara</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
