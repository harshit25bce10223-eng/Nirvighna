import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { prasadQueueEngine } from '../../lib/prasadQueueEngine';
import { verifyPrasadToken } from '../../lib/volunteerEngine';
import { supabase } from '../../lib/supabaseClient';
import { UtensilsCrossed, ArrowLeft, RefreshCw, ChevronRight, CheckCircle, Users, QrCode, AlertCircle, X, Camera } from 'lucide-react';

export const VolunteerPrasadCounterPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [servingToken, setServingToken] = useState(142);
  const [issuedToday, setIssuedToday] = useState(380);
  const [servedToday, setServedToday] = useState(142);
  const [loading, setLoading] = useState(true);

  // QR Scanning States
  const [showScanModal, setShowScanModal] = useState(false);
  const [templeId, setTempleId] = useState(currentUser?.temple_id || 'tmp_somnath');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchCounterState();

    // 1. Same-Tab Custom Window Event
    const handleCounterUpdate = (e) => {
      if (e.detail && (!e.detail.templeId || e.detail.templeId === templeId)) {
        if (e.detail.counter && e.detail.counter.current_serving_token) {
          setServingToken(e.detail.counter.current_serving_token);
          setServedToday(e.detail.counter.current_serving_token);
        }
      }
    };

    // 2. Cross-Tab Storage Event
    const handleStorage = (e) => {
      if (e.key === `nirvighna_prasad_counter_${templeId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.current_serving_token) {
            setServingToken(parsed.current_serving_token);
            setServedToday(parsed.current_serving_token);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
    window.addEventListener('storage', handleStorage);

    // 3. Cross-Tab BroadcastChannel
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('nirvighna_prasad_sync');
      bc.onmessage = (msg) => {
        if (msg.data && msg.data.counter && (!msg.data.templeId || msg.data.templeId === templeId)) {
          setServingToken(msg.data.counter.current_serving_token);
          setServedToday(msg.data.counter.current_serving_token);
        }
      };
    }

    return () => {
      window.removeEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, [templeId]);

  const fetchCounterState = async () => {
    try {
      const data = await prasadQueueEngine.fetchCounterStatus(templeId);
      if (data && data.current_serving_token) {
        setServingToken(data.current_serving_token);
        setServedToday(data.current_serving_token);
      }
    } catch (err) {
      console.warn('Prasad counter fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleServeNext = async () => {
    try {
      const updated = await prasadQueueEngine.serveNextPrasadToken(templeId);
      if (updated && updated.current_serving_token) {
        setServingToken(updated.current_serving_token);
        setServedToday(updated.current_serving_token);
      }
    } catch (err) {
      const nextVal = servingToken + 1;
      setServingToken(nextVal);
      setServedToday(nextVal);
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
        // Advance current serving token on valid QR redemption
        const updated = await prasadQueueEngine.serveNextPrasadToken(templeId);
        if (updated && updated.current_serving_token) {
          setServingToken(updated.current_serving_token);
          setServedToday(updated.current_serving_token);
        }
      }
    } catch (err) {
      setScanResult({ success: false, message: '🚨 Validation Error: ' + err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181012] text-white font-body pb-24 pt-4 px-4 max-w-md mx-auto flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 space-y-4">
      {/* Field Header */}
      <div className="flex items-center justify-between bg-[#221517] p-3 rounded-2xl border border-amber-900/30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/v/dashboard')}
            className="p-2 bg-slate-900 rounded-xl border border-white/10 text-amber-400 hover:border-amber-500/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xs font-black text-white font-heading uppercase tracking-wider">
              PRASAD & BHANDARA COUNTER
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">📍 Annakshetra Hall 1 Queue</p>
          </div>
        </div>

        <button
          onClick={fetchCounterState}
          className="p-2 bg-slate-900 rounded-xl border border-white/10 text-slate-400 hover:text-amber-300 transition-colors"
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              templeId === tItem.id
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            {tItem.label}
          </button>
        ))}
      </div>

      {/* GIANT SERVING TOKEN NUMBER DISPLAY */}
      <div className="bg-[#221517] p-6 rounded-3xl border border-amber-900/30 text-center space-y-4 shadow-2xl my-auto">
        <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 px-3.5 py-1 rounded-full border border-amber-500/30 font-heading">
          CURRENTLY SERVING TOKEN
        </span>

        <div className="py-2">
          <p className="text-6xl sm:text-7xl font-black text-amber-400 tracking-tighter font-mono inline-block drop-shadow-md">
            #{servingToken}
          </p>
        </div>

        {/* DUAL ACTION BUTTONS: SCAN SIGNED QR (PRIMARY) + SERVE NEXT */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              setScanResult(null);
              setShowScanModal(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-lg rounded-2xl shadow-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 font-heading"
          >
            <QrCode className="w-5 h-5" />
            <span>SCAN SIGNED PRASAD QR 🔒</span>
          </button>

          <button
            onClick={handleServeNext}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading"
          >
            <span>Manual Serve Next (#{servingToken + 1}) →</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          QR Scan verifies HMAC signature to prevent multi-meal claim fraud.
        </p>
      </div>

      {/* SCAN TOKEN VERIFICATION MODAL */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#221517] rounded-3xl p-5 max-w-sm w-full space-y-4 border border-amber-500/40 shadow-2xl relative text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white font-heading uppercase flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Scan Prasad Token QR
              </h3>
              <button onClick={() => setShowScanModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCANNER VIEW / MANUAL TEST SIMULATION */}
            <div className="space-y-3 text-center">
              <div className="bg-slate-950 p-6 rounded-2xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center text-white space-y-2">
                <Camera className="w-10 h-10 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-300">CAMERA SCANNER READY</span>
                <span className="text-[10px] text-slate-400">Point phone camera at pilgrim's Prasad QR</span>
              </div>

              {/* DEMO QUICK TEST BUTTONS */}
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => handleVerifyQRToken(`PRASAD-${servingToken + 1}`)}
                  className="flex-1 py-2 bg-emerald-500/20 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  Test Valid QR #{servingToken + 1}
                </button>
                <button
                  onClick={() => handleVerifyQRToken(`PRASAD-${servingToken}`)}
                  className="flex-1 py-2 bg-red-500/20 text-red-300 font-bold rounded-xl border border-red-500/30 hover:bg-red-500/30"
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
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/10 font-mono text-white"
                />
                <button
                  onClick={() => handleVerifyQRToken()}
                  disabled={verifying}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* RESULT CARD */}
            {scanResult && (
              <div className={`p-4 rounded-2xl border ${scanResult.success ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'} space-y-1.5 animate-in fade-in`}>
                <div className="flex items-center gap-2">
                  {scanResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <span className="font-extrabold text-sm font-heading">
                    {scanResult.success ? '✓ PRASAD TOKEN VERIFIED!' : '🚨 SCAN VERIFICATION FAILED'}
                  </span>
                </div>
                <p className="text-xs font-mono font-medium">{scanResult.message}</p>
                {scanResult.success && (
                  <div className="text-xs font-mono bg-slate-950 p-2 rounded-xl border border-emerald-500/30 mt-2">
                    <span>Token Number: <strong>#{scanResult.token_number}</strong></span> • <span>Meal: Free Bhandara</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECONDARY STATS: ISSUED TODAY vs SERVED TODAY */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#221517] p-4 rounded-2xl border border-amber-900/30 text-center space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            TOKENS ISSUED TODAY
          </span>
          <p className="text-2xl font-black text-amber-400 font-mono">{issuedToday}</p>
          <span className="text-[10px] text-amber-400/80 font-bold">Total Virtual Tokens</span>
        </div>

        <div className="bg-[#221517] p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            SERVED TODAY
          </span>
          <p className="text-2xl font-black text-emerald-400 font-mono">{servedToday}</p>
          <span className="text-[10px] text-emerald-400 font-bold">✓ Prasad Served</span>
        </div>
      </div>
    </div>
  );
};
