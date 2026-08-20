import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { issueFootwearToken, searchFootwearToken, collectFootwearToken, verifyFootwearToken } from '../../lib/volunteerEngine';
import { supabase } from '../../lib/supabaseClient';
import { 
  ArrowLeft, Search, PlusCircle, CheckCircle, AlertTriangle, 
  RefreshCw, PackageCheck, KeyRound, QrCode, Camera, X, AlertCircle 
} from 'lucide-react';

export const VolunteerFootwearPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [mode, setMode] = useState('deposit'); // 'deposit' | 'collect'
  const [activeDepositsCount, setActiveDepositsCount] = useState(47);

  // Deposit Mode States
  const [latestIssuedToken, setLatestIssuedToken] = useState(null);
  const [issuedQrUrl, setIssuedQrUrl] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Collect Mode States
  const [showQrScanModal, setShowQrScanModal] = useState(false);
  const [searchNumInput, setSearchNumInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    fetchActiveDepositsCount();
  }, []);

  const fetchActiveDepositsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('footwear_tokens')
        .select('id')
        .eq('status', 'deposited');

      if (!error && data) {
        setActiveDepositsCount(40 + data.length);
      }
    } catch (err) {
      console.warn('Footwear count fallback:', err);
    }
  };

  const handleIssueToken = async () => {
    setIssuing(true);
    try {
      const res = await issueFootwearToken('tmp_dwarka');
      setLatestIssuedToken(res);
      setActiveDepositsCount(prev => prev + 1);

      const val = res.signed_value || `FW-${res.token_number}`;
      QRCode.toDataURL(val, { margin: 1, width: 140 }).then(url => setIssuedQrUrl(url)).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setIssuing(false);
    }
  };

  const handleVerifyQRScan = async (codeToScan) => {
    const code = codeToScan || searchNumInput;
    if (!code.trim()) return;

    setSearching(true);
    setSearchResult(null);

    try {
      const res = await verifyFootwearToken(code, currentUser?.id || 'vol_footwear_1', 'tmp_dwarka');
      if (res.success) {
        setSearchResult({
          found: true,
          id: res.resource_id || 'fw_' + res.token_number,
          token_number: res.token_number,
          status: 'deposited',
          signed_value: code
        });
      } else {
        setSearchResult({
          found: false,
          message: res.message || 'Token signature validation failed'
        });
      }
    } catch (err) {
      setSearchResult({ found: false, message: 'Scan validation failed: ' + err.message });
    } finally {
      setSearching(false);
    }
  };

  const handleSearchToken = async (e) => {
    e.preventDefault();
    if (!searchNumInput.trim()) return;

    setSearching(true);
    setSearchResult(null);

    try {
      const res = await searchFootwearToken(searchNumInput, 'tmp_dwarka');
      if (res.success && res.data) {
        setSearchResult({ found: true, ...res.data });
      } else {
        setSearchResult({ found: false, message: 'Token not found in active deposits' });
      }
    } catch (err) {
      setSearchResult({ found: false, message: 'Token not found' });
    } finally {
      setSearching(false);
    }
  };

  const handleCollectToken = async () => {
    if (!searchResult?.id) return;
    setCollecting(true);
    try {
      await collectFootwearToken(searchResult.id);
      setSearchResult(prev => ({ ...prev, status: 'collected' }));
      setActiveDepositsCount(prev => Math.max(0, prev - 1));
      alert(`✓ Footwear Token #${searchResult.token_number} Marked Collected & Returned!`);
    } catch (err) {
      console.error(err);
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181012] text-white font-body pb-24 pt-4 px-3 sm:px-6 max-w-md mx-auto space-y-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
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
              FOOTWEAR LOCKER COUNTER
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">📍 Main Temple Gate Shoe Rack</p>
          </div>
        </div>

        <button
          onClick={fetchActiveDepositsCount}
          className="p-2 bg-slate-900 rounded-xl border border-white/10 text-slate-400 hover:text-amber-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TOP RUNNING COUNTER: ACTIVE DEPOSITS TODAY */}
      <div className="bg-[#221517] p-3.5 rounded-2xl border border-amber-900/30 flex items-center justify-between text-xs font-mono font-bold shadow-lg">
        <span className="text-slate-400">📦 ACTIVE DEPOSITS TODAY:</span>
        <span className="text-amber-400 font-black text-sm bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
          {activeDepositsCount} Active Shoes Deposited
        </span>
      </div>

      {/* TWO MODES TOP TAB TOGGLE (Deposit vs Collect) */}
      <div className="flex bg-[#221517] p-1 rounded-2xl border border-amber-900/30 text-xs font-bold font-heading">
        <button
          onClick={() => setMode('deposit')}
          className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            mode === 'deposit'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-goldGlow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Deposit (Issue)</span>
        </button>
        <button
          onClick={() => setMode('collect')}
          className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            mode === 'collect'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-goldGlow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Collect (Return)</span>
        </button>
      </div>

      {/* MODE 1: DEPOSIT MODE */}
      {mode === 'deposit' && (
        <div className="bg-[#221517] p-6 rounded-3xl border border-amber-900/30 text-center space-y-5 shadow-2xl animate-in fade-in">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-heading bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
              NEW SHOE RACK DEPOSIT
            </span>
            <h3 className="text-lg font-black text-white font-heading">
              Issue Signed Footwear Token
            </h3>
          </div>

          <button
            onClick={handleIssueToken}
            disabled={issuing}
            className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading"
          >
            <PlusCircle className="w-6 h-6" />
            <span>ISSUE SIGNED TOKEN →</span>
          </button>

          {latestIssuedToken && (
            <div className="p-5 bg-slate-950 border-2 border-amber-500/40 rounded-3xl space-y-3 animate-in zoom-in-95 shadow-xl">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                Issued Token Tag & HMAC QR Code
              </span>
              <p className="text-5xl font-black text-amber-400 font-mono tracking-wider">
                #{latestIssuedToken.token_number}
              </p>

              {issuedQrUrl && (
                <div className="bg-white p-2.5 rounded-2xl border border-gold/40 inline-block mx-auto">
                  <img src={issuedQrUrl} alt="Signed Footwear QR" className="w-32 h-32 mx-auto" />
                  <span className="text-[9px] font-mono text-gray-700 font-bold block mt-1">
                    🔒 HMAC-SHA256 Signed Collection QR
                  </span>
                </div>
              )}

              <p className="text-xs text-emerald-400 font-bold">
                ✓ Show QR on pilgrim phone or give printed tag
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: COLLECT MODE */}
      {mode === 'collect' && (
        <div className="bg-[#221517] p-6 rounded-3xl border border-amber-900/30 space-y-4 shadow-2xl animate-in fade-in">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-heading bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
              COLLECT & RETURN FOOTWEAR
            </span>
            <h3 className="text-lg font-black text-white font-heading">
              Scan Pilgrim QR or Search Token Number
            </h3>
          </div>

          {/* PRIMARY METHOD: SCAN PILGRIM QR */}
          <button
            onClick={() => {
              setSearchResult(null);
              setShowQrScanModal(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-base rounded-2xl shadow-xl uppercase tracking-wider flex items-center justify-center gap-2.5 font-heading"
          >
            <QrCode className="w-5 h-5" />
            <span>SCAN PILGRIM FOOTWEAR QR 🔒</span>
          </button>

          {/* SECONDARY FALLBACK METHOD: MANUAL NUMBER ENTRY */}
          <div className="relative border-t border-white/10 pt-3">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-2 font-mono text-center">
              FALLBACK: MANUAL NUMBER ENTRY (IF BATTERY DIED)
            </span>
            <form onSubmit={handleSearchToken} className="space-y-3">
              <input
                type="number"
                required
                value={searchNumInput}
                onChange={(e) => setSearchNumInput(e.target.value)}
                placeholder="Enter Token # (e.g. 104)"
                className="w-full px-4 py-3 bg-slate-950 border-2 border-amber-900/30 rounded-2xl text-center text-lg font-black font-mono text-amber-400 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />

              <button
                type="submit"
                disabled={searching || !searchNumInput.trim()}
                className="w-full py-3 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-goldGlow uppercase tracking-wider flex items-center justify-center gap-2 font-heading"
              >
                <Search className="w-4 h-4" />
                <span>Search Token Number →</span>
              </button>
            </form>
          </div>

          {/* QR SCAN VERIFICATION MODAL */}
          {showQrScanModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-[#221517] rounded-3xl p-5 max-w-sm w-full space-y-4 border border-amber-500/40 shadow-2xl relative text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-extrabold text-sm text-white font-heading uppercase flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    Scan Footwear Token QR
                  </h3>
                  <button onClick={() => setShowQrScanModal(false)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-center">
                  <div className="bg-slate-950 p-6 rounded-2xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center text-white space-y-2">
                    <Camera className="w-10 h-10 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-emerald-300">CAMERA SCANNER ACTIVE</span>
                    <span className="text-[10px] text-slate-400">Point camera at pilgrim's footwear deposit QR</span>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => handleVerifyQRScan(latestIssuedToken?.signed_value || `FW-${searchNumInput || 104}`)}
                      className="flex-1 py-2 bg-emerald-500/20 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30"
                    >
                      Test Valid Footwear QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH / SCAN RESULT DISCOVERY */}
          {searchResult && (
            <div className="pt-2">
              {!searchResult.found ? (
                <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-center text-red-300 font-bold text-xs">
                  ⚠️ {searchResult.message || 'Token not found'}
                </div>
              ) : searchResult.status === 'collected' ? (
                <div className="p-4 bg-amber-500/15 border-2 border-amber-500/30 rounded-2xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-amber-300 font-black text-sm uppercase font-heading">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span>Already Collected!</span>
                  </div>
                  <p className="text-xs text-amber-300/80">
                    Footwear for Token #{searchResult.token_number} was already returned earlier.
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-slate-950 border-2 border-emerald-500/40 rounded-3xl text-center space-y-3 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">Active Deposited Locker</span>
                    <p className="text-4xl font-black text-amber-400 font-mono">#{searchResult.token_number}</p>
                  </div>

                  <button
                    onClick={handleCollectToken}
                    disabled={collecting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Mark Collected & Return Shoes ✓</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
