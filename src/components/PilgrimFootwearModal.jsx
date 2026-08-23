import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, CheckCircle, Loader2, User } from 'lucide-react';
import { sendPilgrimNotification } from '../lib/notificationService';

const translations = {
  en: {
    title: 'Footwear Locker',
    freeBadge: '100% FREE',
    devoteeName: 'Devotee Name',
    namePh: 'Enter full name',
    pairCount: 'Shoe Pairs Count',
    station: 'Locker Counter Gate',
    gate1: 'Gate #1 Main Entrance',
    gate2: 'Gate #2 Fast-Track North',
    gateExit: 'Gate #3 Exit Corridor',
    issueBtn: '👟 Generate Free Footwear Pass (₹0)',
    confirmedTitle: '🎉 Locker Pass Issued!',
    confirmedDesc: 'Your shoes are allocated. You can view your pass & QR code anytime in My Bookings.',
    viewMyBookings: '🎫 View in My Bookings →',
    close: 'Close',
    rack: 'Assigned Locker Rack'
  },
  hi: {
    title: 'जूता लॉकर सेवा',
    freeBadge: '100% निःशुल्क',
    devoteeName: 'श्रद्धालु का नाम',
    namePh: 'पूरा नाम दर्ज करें',
    pairCount: 'जूते की जोड़ियों की संख्या',
    station: 'लॉकर काउंटर गेट',
    gate1: 'गेट #1 मुख्य प्रवेश द्वार',
    gate2: 'गेट #2 फास्ट-ट्रैक उत्तर गेट',
    gateExit: 'गेट #3 निकास द्वार लॉकर',
    issueBtn: '👟 निःशुल्क लॉकर पास बनाएं (₹0)',
    confirmedTitle: '🎉 लॉकर पास जारी हो गया!',
    confirmedDesc: 'आपके जूते सुरक्षित लॉकर में दर्ज हैं। आप "मेरी बुकिंग" में अपना QR पास देख सकते हैं।',
    viewMyBookings: '🎫 मेरी बुकिंग में पास देखें →',
    close: 'बंद करें',
    rack: 'आवंटित रैक नंबर'
  },
  gu: {
    title: 'પગરખાં લોકર સેવા',
    freeBadge: '100% મફત',
    devoteeName: 'યાત્રાળુનું નામ',
    namePh: 'પૂરું નામ દાખલ કરો',
    pairCount: 'પગરખાં / જોડીની સંખ્યા',
    station: 'લોકર કાઉન્ટર ગેટ',
    gate1: 'ગેટ #1 મુખ્ય પ્રવેશ દ્વાર',
    gate2: 'ગેટ #2 ફાસ્ટ-ટ્રેક ઉત્તર ગેટ',
    gateExit: 'ગેટ #3 એક્ઝિટ દ્વાર લોકર',
    issueBtn: '👟 મફત લોકર પાસ બનાવો (₹0)',
    confirmedTitle: '🎉 પગરખાં લોકર પાસ બની ગયો!',
    confirmedDesc: 'તમારા પગરખાં સુરક્ષિત લોકરમાં ફાળવાયા છે. તમે "મારી બુકિંગ" પેજ પર જોઈ શકો છો.',
    viewMyBookings: '🎫 મારી બુકિંગમાં પાસ જુઓ →',
    close: 'બંધ કરો',
    rack: 'ફાળવેલ રૅક નંબર'
  }
};

const MASTER_TEMPLES = [
  { id: 'tmp_somnath', icon: '🔱', name: { en: 'Somnath', hi: 'सोमनाथ', gu: 'સોમનાથ' }, full: { en: 'Shri Somnath Jyotirlinga', hi: 'श्री सोमनाथ ज्योतिर्लिंग', gu: 'શ્રી સોમનાથ જ્યોતિર્લિંગ' } },
  { id: 'tmp_dwarka', icon: '🦚', name: { en: 'Dwarka', hi: 'द्वारका', gu: 'દ્વારકા' }, full: { en: 'Shri Dwarkadhish Mandir', hi: 'श्री द्वारकाधीश मंदिर', gu: 'શ્રી દ્વારકાધીશ મંદિર' } },
  { id: 'tmp_ambaji', icon: '🌸', name: { en: 'Ambaji', hi: 'अंबाजी', gu: 'અંબાજી' }, full: { en: 'Shri Arasuri Ambaji Temple', hi: 'श्री अंबाजी माता मंदिर', gu: 'શ્રી આરાસુરી અંબાજી મંદિર' } },
  { id: 'tmp_pavagadh', icon: '🚩', name: { en: 'Pavagadh', hi: 'पावागढ़', gu: 'પાવાગઢ' }, full: { en: 'Shri Kalika Mata Temple, Pavagadh', hi: 'श्री कालिका माता मंदिर, पावागढ़', gu: 'શ્રી કાલિકા માતા મંદિર, પાવાગઢ' } },
];

export const PilgrimFootwearModal = ({ isOpen = true, onClose, templeId = 'tmp_somnath' }) => {
  const navigate = useNavigate();
  const { currentUser, issueFootwearToken } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [activeTempleId, setActiveTempleId] = useState(templeId || 'tmp_somnath');
  const currentTempleObj = MASTER_TEMPLES.find(t => t.id === activeTempleId) || MASTER_TEMPLES[0];
  const shrineName = currentTempleObj.full[currentLanguage] || currentTempleObj.full.en;

  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [pairCount, setPairCount] = useState(2);
  const [selectedStation, setSelectedStation] = useState('gate1');
  const [loading, setLoading] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState(null);

  useEffect(() => {
    if (currentUser?.full_name && pilgrimName === 'Pilgrim Devotee') {
      setPilgrimName(currentUser.full_name);
    }
  }, [currentUser]);

  const handleIssue = async (e) => {
    if (e) e.preventDefault();
    if (!pilgrimName.trim()) return;

    setLoading(true);
    try {
      const shrinePrefix = activeTempleId === 'tmp_dwarka' ? 'DWA' : activeTempleId === 'tmp_ambaji' ? 'AMB' : activeTempleId === 'tmp_pavagadh' ? 'PAV' : 'SOM';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const rackLetter = String.fromCharCode(65 + Math.floor(Math.random() * 4));
      const rackNum = Math.floor(1 + Math.random() * 40);

      const stationNames = {
        gate1: t.gate1,
        gate2: t.gate2,
        exit: t.gateExit
      };

      const tokenObj = {
        token_id: `FW-${shrinePrefix}-${randomNum}`,
        id: `FW-${shrinePrefix}-${randomNum}`,
        type: 'footwear',
        pilgrim_name: pilgrimName.trim(),
        rack_no: `Rack ${rackLetter}-${rackNum}`,
        locker_bin: `${rackLetter}-${rackNum}`,
        temple_id: activeTempleId,
        temple_name: shrineName,
        temples: { name: shrineName, location: stationNames[selectedStation] || t.gate1 },
        counter_station: stationNames[selectedStation] || t.gate1,
        pair_count: pairCount,
        status: 'checked_in',
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      if (issueFootwearToken) {
        issueFootwearToken(tokenObj.pilgrim_name, tokenObj.pair_count);
      }

      const existingLocal = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify([tokenObj, ...existingLocal.filter(tok => tok.token_id !== tokenObj.token_id)]));

      await sendPilgrimNotification({
        type: 'gate_info',
        title: '👟 Footwear Locker Pass Issued',
        message: `Locker Token #${tokenObj.token_id} at ${tokenObj.rack_no} (${shrineName}).`,
        templeId: activeTempleId
      });

      setConfirmedToken(tokenObj);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMyBookings = () => {
    onClose?.();
    navigate('/my-bookings');
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999999] p-4 select-none font-body animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white border-2 border-gold/60 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden text-gray-900 flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header with Big Close Button */}
        <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-[#450F16] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-gold/30">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👟</span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white font-heading tracking-wide">
                {t.title}
              </h3>
              <p className="text-[11px] text-amber-200 truncate max-w-[190px]">
                {shrineName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lang Switcher */}
            <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/20">
              {[{ id: 'hi', label: 'हि' }, { id: 'gu', label: 'ગુ' }, { id: 'en', label: 'EN' }].map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                    currentLanguage === l.id ? 'bg-gold text-indigo-dark font-black' : 'text-white/80'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* HIGH CONTRAST CLOSE BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose && onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-90 shadow-md shrink-0 border border-white/40"
              title={t.close}
            >
              <X className="w-4 h-4 text-white" strokeWidth={3} />
              <span className="font-heading uppercase text-[11px]">{t.close}</span>
            </button>
          </div>
        </div>

        {/* 4 Temple Selector Bar */}
        <div className="bg-[#FAF7F2] px-3 py-2 border-b border-gold/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {MASTER_TEMPLES.map(tmp => (
            <button
              key={tmp.id}
              type="button"
              onClick={() => {
                setActiveTempleId(tmp.id);
                setConfirmedToken(null);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer font-heading ${
                activeTempleId === tmp.id
                  ? 'bg-maroon text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gold'
              }`}
            >
              <span>{tmp.icon}</span>
              <span>{tmp.name[currentLanguage] || tmp.name.en}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Form */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-4 flex-1">
          {confirmedToken ? (
            /* CONFIRMATION CARD */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                ✓
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 font-heading">
                  {t.confirmedTitle}
                </h4>
                <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                  {t.confirmedDesc}
                </p>
              </div>

              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-gold/30 text-left text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-500">{t.rack}:</span>
                  <span className="text-maroon font-mono font-black text-sm">{confirmedToken.rack_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.pairCount}:</span>
                  <span className="font-bold text-gray-900">{confirmedToken.pair_count} Pairs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.station}:</span>
                  <span className="font-bold text-indigo-dark">{confirmedToken.counter_station}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleGoToMyBookings}
                  className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark font-black text-xs uppercase tracking-wider rounded-xl shadow-goldGlow cursor-pointer font-heading active:scale-98 transition-all"
                >
                  {t.viewMyBookings}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer font-heading"
                >
                  {t.close}
                </button>
              </div>
            </div>
          ) : (
            /* SIMPLE DEPOSIT FORM */
            <form onSubmit={handleIssue} className="space-y-3.5">
              
              {/* Devotee Name */}
              <div>
                <label className="text-[11px] font-black uppercase text-maroon font-heading block mb-1">
                  👤 {t.devoteeName} *
                </label>
                <input
                  type="text"
                  required
                  value={pilgrimName}
                  onChange={(e) => setPilgrimName(e.target.value)}
                  placeholder={t.namePh}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-maroon focus:bg-white"
                />
              </div>

              {/* Shoe Pairs Stepper */}
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-gold/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 font-heading block">
                    👟 {t.pairCount}
                  </span>
                  <span className="text-[10px] text-gray-500">Stored in 1 dedicated locker</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPairCount(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-maroon font-black flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-mono text-xs font-black min-w-[40px] text-center bg-white px-2 py-1 rounded border border-gold/30">
                    {pairCount} Pairs
                  </span>
                  <button
                    type="button"
                    onClick={() => setPairCount(q => Math.min(20, q + 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-maroon font-black flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Gate Station Options */}
              <div>
                <label className="text-[11px] font-black uppercase text-maroon font-heading block mb-1.5">
                  🚪 {t.station}
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'gate1', label: t.gate1, icon: '🚪' },
                    { id: 'gate2', label: t.gate2, icon: '⚡' },
                    { id: 'exit', label: t.gateExit, icon: '🚶' }
                  ].map(st => (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStation(st.id)}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        selectedStation === st.id
                          ? 'bg-amber-50 border-gold text-indigo-dark'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gold/50'
                      }`}
                    >
                      <span>{st.icon}</span>
                      <span>{st.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || !pilgrimName.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark font-black text-xs uppercase tracking-wider rounded-xl shadow-goldGlow flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-98 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{t.issueBtn}</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PilgrimFootwearModal;
