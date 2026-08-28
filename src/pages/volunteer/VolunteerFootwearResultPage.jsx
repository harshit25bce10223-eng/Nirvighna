import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { issueFootwearToken, collectFootwearToken, verifyFootwearToken } from '../../lib/volunteerEngine';
import { 
  PackageCheck, ArrowLeft, PlusCircle, CheckCircle, AlertTriangle, 
  Clock, MapPin, QrCode, ShieldCheck, Check, ArrowRight, RefreshCw, Building2
} from 'lucide-react';
import QRCode from 'qrcode';

const TEMPLE_CONFIG = {
  tmp_somnath: { id: 'tmp_somnath', name: 'Somnath Temple', shortName: 'Somnath', standName: 'Stand #1 (Mahapravesh Dwar)' },
  tmp_dwarka: { id: 'tmp_dwarka', name: 'Dwarkadhish Temple', shortName: 'Dwarkadhish', standName: 'Stand #2 (Swarga Dwar)' },
  tmp_ambaji: { id: 'tmp_ambaji', name: 'Ambaji Temple', shortName: 'Ambaji', standName: 'Stand #1 (Gabbar Gate)' },
  tmp_pavagadh: { id: 'tmp_pavagadh', name: 'Kalika Mata Temple', shortName: 'Pavagadh', standName: 'Stand #1 (Machi Gate)' }
};

export const VolunteerFootwearResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { qrId } = useParams();
  const { currentUser } = useVolunteerAuth();

  const templeId = searchParams.get('temple') || location.state?.templeId || localStorage.getItem('nirvighna_volunteer_temple_id') || currentUser?.templeId || 'tmp_somnath';
  const currentTemple = TEMPLE_CONFIG[templeId] || TEMPLE_CONFIG['tmp_somnath'];

  const stateData = location.state || {};
  const rawCode = decodeURIComponent(qrId || stateData.code || '142');

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null); // 'deposit' | 'collect' | null

  // Deposit Action States
  const [pairCount, setPairCount] = useState(1);
  const [issuing, setIssuing] = useState(false);
  const [issuedResult, setIssuedResult] = useState(null);
  const [issuedQrUrl, setIssuedQrUrl] = useState('');

  // Collect Action States
  const [collecting, setCollecting] = useState(false);
  const [collectedResult, setCollectedResult] = useState(null);

  const formatTimeAgo = (iso) => {
    if (!iso) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const broadcastFootwearUpdate = () => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nirvighna_interconnected_sync');
        bc.postMessage({ action: 'FOOTWEAR_UPDATED', templeId, timestamp: Date.now() });
        bc.close();
      }
    } catch (_) {}
  };

  useEffect(() => {
    const loadAndVerify = async () => {
      setLoading(true);
      try {
        const res = await verifyFootwearToken(rawCode, currentUser?.id || 'vol_footwear_1', templeId);
        const localTokens = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
        const tokenObj = localTokens.find(t => (!t.temple_id || t.temple_id === templeId) && (t.token_number === res.token_number || t.id === res.resource_id));

        if (res.success || tokenObj) {
          const tokenNum = res.token_number || tokenObj?.token_number || parseInt(rawCode.replace(/\D/g, ''), 10) || 142;
          const loaded = {
            found: true,
            id: tokenObj?.id || res.resource_id || `fw_${tokenNum}`,
            token_number: tokenNum,
            temple_id: templeId,
            pairs: tokenObj?.pairs || 1,
            status: tokenObj?.status || 'deposited',
            deposited_at: tokenObj?.deposited_at || new Date().toISOString()
          };
          setTokenData(loaded);
          // By default do not select anything
          setSelectedAction(null);
        } else {
          setTokenData({
            found: false,
            already_scanned: res.already_scanned,
            message: res.message || 'Footwear pass could not be verified'
          });
        }
      } catch (err) {
        setTokenData({ found: false, message: err.message });
      } finally {
        setLoading(false);
      }
    };

    loadAndVerify();
  }, [rawCode, currentUser, templeId]);

  // Handle Deposit
  const handleConfirmDeposit = async () => {
    setIssuing(true);
    try {
      const res = await issueFootwearToken(templeId, pairCount);
      setIssuedResult({ ...res, pairs: pairCount });
      broadcastFootwearUpdate();

      const val = res.signed_value || `FW-${res.token_number}`;
      QRCode.toDataURL(val, { margin: 1, width: 140 }).then(url => setIssuedQrUrl(url)).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setIssuing(false);
    }
  };

  // Handle Collect
  const handleConfirmCollect = async () => {
    if (!tokenData?.id && !tokenData?.token_number) return;
    setCollecting(true);
    try {
      await collectFootwearToken(tokenData.id || tokenData.token_number, templeId);
      setCollectedResult(tokenData);
      setTokenData(prev => ({ ...prev, status: 'collected' }));
      broadcastFootwearUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory text-indigo-dark flex flex-col items-center justify-center p-6 space-y-3">
        <RefreshCw className="w-8 h-8 text-maroon animate-spin" />
        <p className="text-sm font-bold font-heading text-maroon">Verifying Footwear Locker Token for {currentTemple.shortName}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-indigo-dark font-body pb-12 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-5 selection:bg-gold selection:text-indigo-dark animate-in fade-in">
      
      {/* ─── CLEAN TOP NAVIGATION BAR ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/v/footwear?temple=${templeId}`)}
          className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-[#E8DFC8] text-gray-700 hover:text-maroon font-heading text-xs font-bold shadow-xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentTemple.shortName} Scanner</span>
        </button>

        <span className="text-xs font-bold font-mono text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          TOKEN #{tokenData?.token_number || rawCode}
        </span>
      </div>

      {/* ─── INVALID PASS STATE ─── */}
      {!tokenData?.found ? (
        <div className="bg-white p-7 rounded-3xl border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-rose-900 font-heading">
              {tokenData?.already_scanned ? 'Token Already Collected' : 'Invalid Footwear Pass'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {tokenData?.message || 'The scanned QR code is not recognized in active locker records.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/v/footwear')}
            className="w-full py-3.5 bg-maroon text-white font-bold text-xs rounded-2xl shadow-sm uppercase font-heading cursor-pointer hover:bg-maroon/90 transition-all"
          >
            ← Back to Footwear Scanner
          </button>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ─── SUCCESS OVERLAY: DEPOSIT CONFIRMED ─── */}
          {issuedResult && (
            <div className="bg-white p-6 rounded-3xl border border-emerald-300 shadow-sm text-center space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-300">
                  {currentTemple.shortName} Locker Assigned
                </span>
                <h2 className="text-3xl font-black text-indigo-dark font-mono mt-2">
                  Locker #{issuedResult.token_number}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {issuedResult.pairs} Pair(s) securely deposited in Rack #{issuedResult.token_number} ({currentTemple.standName})
                </p>
              </div>

              {issuedQrUrl && (
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EFE5D5] inline-block mx-auto shadow-inner">
                  <img src={issuedQrUrl} alt="Locker QR Tag" className="w-28 h-28 mx-auto rounded-lg" />
                  <span className="text-[10px] font-mono text-gray-500 block mt-1">Devotee QR Token</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate(`/v/footwear?temple=${templeId}`)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm uppercase font-heading cursor-pointer transition-all"
              >
                ← Scan Next Devotee
              </button>
            </div>
          )}

          {/* ─── SUCCESS OVERLAY: RETURN CONFIRMED ─── */}
          {collectedResult && !issuedResult && (
            <div className="bg-white p-6 rounded-3xl border border-emerald-300 shadow-sm text-center space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-300">
                  Handover Complete • {currentTemple.shortName}
                </span>
                <h2 className="text-2xl font-black text-indigo-dark font-heading mt-2">
                  Shoes Returned Safely
                </h2>
                <p className="text-xs text-gray-500">
                  Footwear from Locker #{collectedResult.token_number} handed back to pilgrim.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/v/footwear?temple=${templeId}`)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm uppercase font-heading cursor-pointer transition-all"
              >
                ← Scan Next Devotee
              </button>
            </div>
          )}

          {/* ─── MAIN CLEAN HERO CARD (AIRY & BREATHABLE) ─── */}
          {!issuedResult && !collectedResult && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC8] shadow-sm space-y-5">
              
              {/* Devotee Locker Status Header */}
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-3xl font-black text-indigo-dark font-mono tracking-tight">
                    Rack #{tokenData.token_number}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {currentTemple.name} • {currentTemple.standName}
                  </p>
                </div>

                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                  tokenData.status === 'deposited'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {tokenData.status === 'deposited' ? '📦 In Locker Rack' : '✓ Returned'}
                </span>
              </div>

              {/* Minimal Info Row */}
              <div className="flex items-center justify-between text-xs text-gray-600 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EFE5D5]">
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Deposited: <strong>{formatTimeAgo(tokenData.deposited_at)}</strong></span>
                </div>
                <div className="font-mono">
                  <span>Holding: <strong className="text-maroon">{tokenData.pairs || 1} Pair(s)</strong></span>
                </div>
              </div>

              {/* ─── CLEAN 2-SEGMENT PILL SWITCHER (NO DEFAULT SELECTION) ─── */}
              <div className="grid grid-cols-2 p-1.5 bg-[#F4EFE6] rounded-2xl text-xs font-bold font-heading gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedAction('deposit')}
                  className={`py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedAction === 'deposit'
                      ? 'bg-gold text-indigo-dark shadow-sm border border-amber-400 font-black'
                      : 'bg-white/50 text-gray-700 hover:bg-white hover:text-maroon'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>1. Deposit Shoes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAction('collect')}
                  className={`py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedAction === 'collect'
                      ? 'bg-emerald-600 text-white shadow-sm font-black'
                      : 'bg-white/50 text-gray-700 hover:bg-white hover:text-emerald-800'
                  }`}
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>2. Return Shoes</span>
                </button>
              </div>

              {/* ─── PROMPT WHEN NOTHING SELECTED YET ─── */}
              {!selectedAction && (
                <div className="py-6 px-4 text-center space-y-1.5 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E8DFC8]">
                  <p className="text-xs font-bold text-gray-600 font-heading uppercase tracking-wide">
                    Select an Action for Devotee
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Choose <strong>1. Deposit Shoes</strong> to allocate a rack bin or <strong>2. Return Shoes</strong> to handover footwear.
                  </p>
                </div>
              )}

              {/* ─── ACTIVE TAB CONTENT: DEPOSIT ─── */}
              {selectedAction === 'deposit' && (
                <div className="space-y-4 pt-1 animate-in fade-in">
                  
                  {/* Stepper */}
                  <div className="flex items-center justify-between bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EFE5D5]">
                    <span className="text-xs font-bold text-gray-700">Footwear Pairs:</span>
                    
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPairCount(prev => Math.max(1, prev - 1))}
                        className="w-9 h-9 rounded-xl bg-white text-maroon font-black text-base flex items-center justify-center border border-[#E8DFC8] shadow-xs cursor-pointer hover:bg-gold/20 active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <span className="text-lg font-black font-mono text-indigo-dark min-w-[36px] text-center">
                        {pairCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPairCount(prev => Math.min(25, prev + 1))}
                        className="w-9 h-9 rounded-xl bg-white text-maroon font-black text-base flex items-center justify-center border border-[#E8DFC8] shadow-xs cursor-pointer hover:bg-gold/20 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Preset Quick Select Chips */}
                  <div className="flex items-center gap-1.5 justify-between">
                    {[1, 2, 3, 4, 5, 6].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setPairCount(cnt)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          pairCount === cnt
                            ? 'bg-gold text-indigo-dark font-black shadow-xs border border-amber-400'
                            : 'bg-[#FAF7F2] text-gray-600 hover:text-maroon border border-[#EFE5D5]'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>

                  {/* Deposit CTA */}
                  <button
                    type="button"
                    onClick={handleConfirmDeposit}
                    disabled={issuing}
                    className="w-full py-4 bg-gradient-to-r from-gold via-amber-400 to-amber-500 hover:from-amber-400 hover:to-gold active:scale-[0.99] text-indigo-dark font-black text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer transition-all mt-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{issuing ? 'Allocating Locker...' : `Confirm Deposit (${pairCount} ${pairCount > 1 ? 'Pairs' : 'Pair'}) →`}</span>
                  </button>
                </div>
              )}

              {/* ─── ACTIVE TAB CONTENT: RETURN ─── */}
              {selectedAction === 'collect' && (
                <div className="space-y-4 pt-1 animate-in fade-in">
                  {tokenData.status === 'collected' ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1">
                      <p className="text-xs font-bold text-amber-900 font-heading">Footwear Already Returned Earlier</p>
                      <p className="text-[11px] text-amber-700">
                        Shoes for Token #{tokenData.token_number} were already collected today at {currentTemple.shortName}.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirmCollect}
                      disabled={collecting}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer transition-all"
                    >
                      <PackageCheck className="w-5 h-5" />
                      <span>{collecting ? 'Processing Handover...' : 'Handover Shoes & Confirm Return →'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Minimal Cancel Link */}
              <div className="pt-2 text-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate(`/v/footwear?temple=${templeId}`)}
                  className="text-xs font-medium text-gray-400 hover:text-maroon underline cursor-pointer"
                >
                  Cancel &amp; Return to {currentTemple.shortName} Scanner
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};