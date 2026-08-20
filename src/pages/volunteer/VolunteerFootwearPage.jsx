import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { issueFootwearToken, searchFootwearToken, collectFootwearToken, verifyFootwearToken } from '../../lib/volunteerEngine';
import { 
  PackageCheck, ArrowLeft, RefreshCw, PlusCircle, Search, 
  CheckCircle, AlertTriangle, QrCode, Camera, X, Lock, Users, Sparkles, Clock, MapPin
} from 'lucide-react';
import QRCode from 'qrcode';

export const VolunteerFootwearPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [mode, setMode] = useState('deposit'); // 'deposit' | 'collect'
  const [activeDepositsCount, setActiveDepositsCount] = useState(42);
  const [pairCount, setPairCount] = useState(1);
  const [latestIssuedToken, setLatestIssuedToken] = useState(null);
  const [issuedQrUrl, setIssuedQrUrl] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Collect Mode Search States
  const [searchNumInput, setSearchNumInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [collecting, setCollecting] = useState(false);

  // QR Scan Modal
  const [showQrScanModal, setShowQrScanModal] = useState(false);

  // Recent logs
  const [recentTokens, setRecentTokens] = useState([
    { token_number: 142, pairs: 2, status: 'deposited', time: '5 mins ago' },
    { token_number: 141, pairs: 1, status: 'deposited', time: '12 mins ago' },
    { token_number: 140, pairs: 4, status: 'collected', time: '24 mins ago' },
    { token_number: 139, pairs: 1, status: 'collected', time: '38 mins ago' }
  ]);

  useEffect(() => {
    fetchActiveDepositsCount();
  }, []);

  const fetchActiveDepositsCount = () => {
    try {
      const localTokens = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      const activeLocal = localTokens.filter(t => t.status === 'deposited').length;
      setActiveDepositsCount(40 + activeLocal);
    } catch (_) {
      setActiveDepositsCount(42);
    }
  };

  const handleIssueToken = async () => {
    setIssuing(true);
    try {
      const res = await issueFootwearToken('tmp_dwarka');
      setLatestIssuedToken({ ...res, pairs: pairCount });
      setActiveDepositsCount(prev => prev + 1);

      // Add to recent list
      setRecentTokens(prev => [
        { token_number: res.token_number, pairs: pairCount, status: 'deposited', time: 'Just now' },
        ...prev.slice(0, 5)
      ]);

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
          deposited_at: new Date().toISOString()
        });
      } else {
        setSearchResult({ found: false, message: res.message || 'Invalid or Tampered Footwear Token' });
      }
    } catch (err) {
      setSearchResult({ found: false, message: err.message });
    } finally {
      setSearching(false);
      setShowQrScanModal(false);
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
        setSearchResult({
          found: true,
          id: res.data.id,
          token_number: res.data.token_number,
          status: res.data.status,
          deposited_at: res.data.deposited_at
        });
      } else {
        setSearchResult({ found: false, message: 'Token number not found' });
      }
    } catch (err) {
      setSearchResult({ found: false, message: err.message });
    } finally {
      setSearching(false);
    }
  };

  const handleCollectToken = async () => {
    if (!searchResult?.id && !searchResult?.token_number) return;
    setCollecting(true);
    try {
      await collectFootwearToken(searchResult.id || searchResult.token_number);
      setSearchResult(prev => ({ ...prev, status: 'collected' }));
      setActiveDepositsCount(prev => Math.max(0, prev - 1));

      setRecentTokens(prev => prev.map(t => t.token_number === searchResult.token_number ? { ...t, status: 'collected' } : t));
    } catch (err) {
      console.error(err);
    } finally {
      setCollecting(false);
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
                🕉️ पादुका सेवा • FOOTWEAR STAND
              </span>
            </div>
            <h1 className="text-base font-black font-heading text-maroon tracking-wide mt-0.5">
              Footwear Locker Desk
            </h1>
          </div>
        </div>

        <button
          onClick={fetchActiveDepositsCount}
          className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer"
          title="Refresh Rack Count"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3 LIVE RACK STATS BAR */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">IN RACKS</span>
          <p className="text-xl font-black text-amber-900 font-mono">{activeDepositsCount}</p>
          <span className="text-[9px] text-gray-400 font-medium">/ 500 Capacity</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">ISSUED TODAY</span>
          <p className="text-xl font-black text-maroon font-mono">148</p>
          <span className="text-[9px] text-amber-800 font-medium">Tokens</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] text-center space-y-0.5 shadow-xs">
          <span className="text-[9px] font-bold text-gray-500 uppercase font-heading block">RETURNED</span>
          <p className="text-xl font-black text-emerald-700 font-mono">106</p>
          <span className="text-[9px] text-emerald-700 font-medium">✓ Safe</span>
        </div>
      </div>

      {/* MODE SELECTOR PILL TABS */}
      <div className="flex bg-[#FAF5EE] p-1.5 rounded-2xl border border-[#E8DFC8] text-xs font-bold font-heading">
        <button
          onClick={() => setMode('deposit')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'deposit'
              ? 'bg-gradient-to-r from-gold via-amber-400 to-amber-500 text-indigo-dark font-black shadow-xs'
              : 'text-gray-600 hover:text-maroon'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Deposit (Issue)</span>
        </button>
        <button
          onClick={() => setMode('collect')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'collect'
              ? 'bg-gradient-to-r from-gold via-amber-400 to-amber-500 text-indigo-dark font-black shadow-xs'
              : 'text-gray-600 hover:text-maroon'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Collect (Return)</span>
        </button>
      </div>

      {/* MODE 1: DEPOSIT MODE CONTENT */}
      {mode === 'deposit' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Main Action Box */}
          <div className="bg-white p-5 rounded-[28px] border border-[#E8DFC8] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-indigo-dark font-heading">
                  Quick Shoe Deposit
                </h3>
                <p className="text-[11px] text-gray-500">Allocate next available shoe locker bin</p>
              </div>

              {/* Flexible Stepper & Group Counter */}
              <div className="flex items-center gap-1.5 bg-[#FAF5EE] p-1 rounded-2xl border border-[#E8DFC8]">
                <button
                  type="button"
                  onClick={() => setPairCount(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-xl bg-white text-maroon hover:bg-gold/20 font-black text-sm flex items-center justify-center border border-[#E8DFC8] shadow-xs cursor-pointer"
                  title="Decrease"
                >
                  -
                </button>
                <div className="px-2 text-center min-w-[64px]">
                  <span className="text-sm font-black font-mono text-indigo-dark block">{pairCount}</span>
                  <span className="text-[9px] text-gray-500 font-bold block leading-none">{pairCount === 1 ? 'Pair' : 'Pairs'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPairCount(prev => Math.min(25, prev + 1))}
                  className="w-8 h-8 rounded-xl bg-white text-maroon hover:bg-gold/20 font-black text-sm flex items-center justify-center border border-[#E8DFC8] shadow-xs cursor-pointer"
                  title="Increase"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Preset Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold font-heading">
              <span className="text-[10px] text-gray-400 font-mono uppercase shrink-0">Quick:</span>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setPairCount(cnt)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    pairCount === cnt
                      ? 'bg-gold text-indigo-dark shadow-xs border border-amber-500/50'
                      : 'bg-[#FAF5EE] text-gray-600 hover:text-maroon border border-[#E8DFC8]'
                  }`}
                >
                  {cnt === 1 ? '1' : cnt === 2 ? '2' : cnt === 4 ? '4 (Fam)' : cnt === 10 ? '10+ (Bus)' : cnt}
                </button>
              ))}
            </div>

            {/* 1-Tap Issue Button */}
            <button
              onClick={handleIssueToken}
              disabled={issuing}
              className="w-full py-4 bg-gradient-to-r from-gold via-amber-400 to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 font-heading cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-indigo-dark" />
              <span>{issuing ? 'Allocating Rack...' : `⚡ Issue Token (${pairCount} ${pairCount > 1 ? 'Pairs' : 'Pair'}) →`}</span>
            </button>

            {/* Issued Token Card if just issued */}
            {latestIssuedToken && (
              <div className="p-4 bg-[#FAF5EE] border-2 border-gold/50 rounded-2xl space-y-3 animate-in zoom-in-95 text-center shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-900 bg-white px-2.5 py-0.5 rounded-full border border-gold/40">
                    Locker Bin Ready
                  </span>
                  <span className="text-xs text-emerald-700 font-bold">✓ Tag Generated</span>
                </div>

                <div className="py-1">
                  <span className="text-[10px] text-gray-500 font-sans block">ASSIGNED LOCKER</span>
                  <p className="text-4xl font-black text-maroon font-mono">
                    #{latestIssuedToken.token_number}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Rack Bin #{latestIssuedToken.token_number} • {latestIssuedToken.pairs || 1} Pair(s)</p>
                </div>

                {issuedQrUrl && (
                  <div className="bg-white p-2 rounded-xl border border-[#E8DFC8] inline-block mx-auto shadow-xs">
                    <img src={issuedQrUrl} alt="Signed Footwear QR" className="w-24 h-24 mx-auto" />
                    <span className="text-[8px] font-mono text-gray-500 block mt-1">HMAC-SHA256 Token</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Deposits List */}
          <div className="bg-white p-5 rounded-[28px] border border-[#E8DFC8] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-black text-xs text-indigo-dark font-heading uppercase tracking-wide">
                Recent Duty Deposits
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">Shift Activity</span>
            </div>

            <div className="space-y-2">
              {recentTokens.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6EF] border border-[#EFE5D5] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-white text-maroon font-black font-mono flex items-center justify-center border border-gold/30 shadow-xs">
                      #{item.token_number}
                    </span>
                    <div>
                      <p className="font-bold text-indigo-dark">Rack #{item.token_number} ({item.pairs} {item.pairs > 1 ? 'Pairs' : 'Pair'})</p>
                      <p className="text-[10px] text-gray-500">{item.time}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    item.status === 'deposited'
                      ? 'bg-amber-50 text-amber-900 border-gold/40'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {item.status === 'deposited' ? '📦 In Rack' : '✓ Returned'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: COLLECT MODE CONTENT */}
      {mode === 'collect' && (
        <div className="space-y-4 animate-in fade-in">
          
          <div className="bg-white p-5 rounded-[28px] border border-[#E8DFC8] shadow-sm space-y-4">
            <div>
              <h3 className="font-black text-sm text-indigo-dark font-heading">
                Retrieve & Return Footwear
              </h3>
              <p className="text-[11px] text-gray-500">Scan devotee token QR code or search token number</p>
            </div>

            {/* Primary Action: QR Scanner */}
            <button
              onClick={() => {
                setSearchResult(null);
                setShowQrScanModal(true);
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm rounded-2xl shadow-md uppercase tracking-wider flex items-center justify-center gap-2.5 font-heading cursor-pointer border border-emerald-400"
            >
              <QrCode className="w-5 h-5" />
              <span>SCAN PILGRIM FOOTWEAR QR 🔒</span>
            </button>

            {/* Manual Token Number Search */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5 font-heading">
                Or Search by Token Number
              </span>
              <form onSubmit={handleSearchToken} className="flex gap-2">
                <input
                  type="number"
                  required
                  value={searchNumInput}
                  onChange={(e) => setSearchNumInput(e.target.value)}
                  placeholder="e.g. 142"
                  className="flex-1 px-4 py-2.5 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-center text-base font-black font-mono text-indigo-dark focus:outline-none focus:border-maroon"
                />
                <button
                  type="submit"
                  disabled={searching || !searchNumInput.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl shadow-xs uppercase font-heading cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Search Result Banner */}
            {searchResult && (
              <div className="pt-2">
                {!searchResult.found ? (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-center text-rose-800 font-bold text-xs">
                    ⚠️ {searchResult.message || 'Token not found'}
                  </div>
                ) : searchResult.status === 'collected' ? (
                  <div className="p-3.5 bg-amber-50 border border-gold/40 rounded-2xl text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-maroon font-black text-xs uppercase font-heading">
                      <AlertTriangle className="w-4 h-4 text-maroon" />
                      <span>Already Collected</span>
                    </div>
                    <p className="text-[11px] text-amber-900">
                      Footwear for Token #{searchResult.token_number} was already collected earlier.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF6EF] border-2 border-emerald-300 rounded-2xl text-center space-y-3 shadow-xs">
                    <div>
                      <span className="text-[10px] text-emerald-800 uppercase font-mono font-bold">Locker Ready for Checkout</span>
                      <p className="text-3xl font-black text-maroon font-mono">Rack #{searchResult.token_number}</p>
                    </div>

                    <button
                      onClick={handleCollectToken}
                      disabled={collecting}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer border border-emerald-400"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Collected & Return Shoes ✓</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR SCAN VERIFICATION MODAL */}
      {showQrScanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-5 max-w-sm w-full space-y-4 border border-[#E8DFC8] shadow-warm relative text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-sm text-indigo-dark font-heading uppercase flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Scan Footwear Token QR
              </h3>
              <button onClick={() => setShowQrScanModal(false)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-center">
              <div className="bg-[#FAF6EF] p-6 rounded-2xl border-2 border-dashed border-gold flex flex-col items-center justify-center space-y-2">
                <Camera className="w-10 h-10 text-maroon animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-900">CAMERA SCANNER ACTIVE</span>
                <span className="text-[10px] text-gray-500">Point camera at pilgrim's footwear QR</span>
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => handleVerifyQRScan(latestIssuedToken?.signed_value || `FW-${searchNumInput || 142}`)}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                >
                  Test Valid Token #{searchNumInput || 142}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
