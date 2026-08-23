import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Footprints, Clock, CheckCircle, AlertCircle, X, Loader2, Sparkles, 
  MapPin, Plus, ShieldCheck, ArrowRight, User, Phone,
  Shield, Check, ChevronRight, RefreshCw, KeyRound
} from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';
import { sendPilgrimNotification } from '../lib/notificationService';
import { broadcastBookingToVolunteers } from '../lib/volunteerEngine';

const translations = {
  en: {
    title: 'Smart Footwear Locker',
    subtitle: 'Free & Secure Electronic Shoe Depositing Facility',
    devoteeName: 'Devotee / Family Head Name',
    namePlaceholder: 'Enter your full name',
    phoneLabel: 'Mobile Phone Number',
    phonePlaceholder: '10-digit mobile number',
    pairCountLabel: 'Number of Footwear Pairs',
    counterStationLabel: 'Select Locker Counter Gate',
    counterGate1: 'Counter #1: Main Entrance Gate (East)',
    counterGate2: 'Counter #2: Fast-Track North Corridor Gate',
    counterExit: 'Counter #3: Exit Corridor Locker Bin',
    pairs: 'Pairs',
    pair: 'Pair',
    freeSeva: '100% Free Seva by Mandir Trust',
    issuePassBtn: '👟 Generate Free Footwear Pass (₹0)',
    generatingBtn: 'Allocating Secure Rack...',
    bookedSuccessTitle: '🎉 Footwear Locker Pass Issued!',
    bookedSuccessDesc: 'Your shoes are securely allocated. You can view your locker pass & QR code anytime in My Bookings.',
    viewInMyBookings: '🎫 View in My Bookings →',
    depositAnotherBtn: '+ Deposit Another Pair',
    closeBtn: 'Close',
    freeBadge: '100% FREE SEVA'
  },
  hi: {
    title: 'डिजिटल जूता लॉकर',
    subtitle: 'निःशुल्क एवं सुरक्षित इलेक्ट्रॉनिक जूता जमा केंद्र',
    devoteeName: 'श्रद्धालु / परिवार प्रमुख का नाम',
    namePlaceholder: 'अपना पूरा नाम दर्ज करें',
    phoneLabel: 'मोबाइल नंबर',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    pairCountLabel: 'जूते/चप्पल की जोड़ियों की संख्या',
    counterStationLabel: 'लॉकर काउंटर गेट चुनें',
    counterGate1: 'काउंटर #1: मुख्य प्रवेश द्वार (पूर्व)',
    counterGate2: 'काउंटर #2: फास्ट-ट्रैक उत्तरी कॉरिडोर गेट',
    counterExit: 'काउंटर #3: निकास द्वार लॉकर रैक',
    pairs: 'जोड़ी',
    pair: 'जोड़ी',
    freeSeva: 'श्री मंदिर ट्रस्ट द्वारा 100% निःशुल्क सेवा',
    issuePassBtn: '👟 निःशुल्क लॉकर पास प्राप्त करें (₹0)',
    generatingBtn: 'सुरक्षित रैक आवंटित हो रहा है...',
    bookedSuccessTitle: '🎉 जूता लॉकर पास जारी हो गया!',
    bookedSuccessDesc: 'आपके जूते सुरक्षित लॉकर में दर्ज हैं। आप "मेरी बुकिंग" में अपना डिजिटल QR पास देख सकते हैं।',
    viewInMyBookings: '🎫 मेरी बुकिंग में पास देखें →',
    depositAnotherBtn: '+ नए जूते जमा करें',
    closeBtn: 'बंद करें',
    freeBadge: '100% निःशुल्क सेवा'
  },
  gu: {
    title: 'ડિજિટલ પગરખાં લોકર',
    subtitle: 'મફત અને સુરક્ષિત ઈલેક્ટ્રોનિક પગરખાં જમા કેન્દ્ર',
    devoteeName: 'યાત્રાળુ / મુખીનું નામ',
    namePlaceholder: 'તમારું પૂરું નામ દાખલ કરો',
    phoneLabel: 'મોબાઇલ નંબર',
    phonePlaceholder: '10 આંકડાનો મોબાઇલ નંબર',
    pairCountLabel: 'પગરખાં / જોડીની સંખ્યા',
    counterStationLabel: 'લોકર કાઉન્ટર ગેટ પસંદ કરો',
    counterGate1: 'કાઉન્ટર #1: મુખ્ય પ્રવેશ દ્વાર (પૂર્વ)',
    counterGate2: 'કાઉન્ટર #2: ફાસ્ટ-ટ્રેક ઉત્તર કોરિડોર ગેટ',
    counterExit: 'કાઉન્ટર #3: એક્ઝિટ દ્વાર લોકર રૅક',
    pairs: 'જોડી',
    pair: 'જોડી',
    freeSeva: 'શ્રી મંદિર ટ્રસ્ટ તરફથી 100% મફત સેવા',
    issuePassBtn: '👟 મફત લોકર પાસ મેળવો (₹0)',
    generatingBtn: 'સુરક્ષિત રૅક ફાળવાઈ રહી છે...',
    bookedSuccessTitle: '🎉 પગરખાં લોકર પાસ બની ગયો!',
    bookedSuccessDesc: 'તમારા પગરખાં સુરક્ષિત લોકરમાં ફાળવાયા છે. તમે "મારી બુકિંગ" પેજ પર તમારો QR પાસ જોઈ શકો છો.',
    viewInMyBookings: '🎫 મારી બુકિંગમાં પાસ જુઓ →',
    depositAnotherBtn: '+ નવા પગરખાં જમા કરો',
    closeBtn: 'બંધ કરો',
    freeBadge: '100% મફત સેવા'
  }
};

const MASTER_TEMPLES = [
  { id: 'tmp_somnath', icon: '🔱', name: { en: 'Somnath', hi: 'सोमनाथ', gu: 'સોમનાથ' }, full: { en: 'Shri Somnath Jyotirlinga', hi: 'श्री सोमनाथ ज्योतिर्लिंग', gu: 'શ્રી સોમનાથ જ્યોતિર્લિંગ' } },
  { id: 'tmp_dwarka', icon: '🦚', name: { en: 'Dwarka', hi: 'द्वारका', gu: 'દ્વારકા' }, full: { en: 'Shri Dwarkadhish Mandir', hi: 'श्री द्वारकाधीश मंदिर', gu: 'શ્રી દ્વારકાધીશ મંદિર' } },
  { id: 'tmp_ambaji', icon: '🌸', name: { en: 'Ambaji', hi: 'अंबाजी', gu: 'અંબાજી' }, full: { en: 'Shri Arasuri Ambaji Temple', hi: 'श्री अंबाजी माता मंदिर', gu: 'શ્રી આરાસુરી અંબાજી મંદિર' } },
  { id: 'tmp_pavagadh', icon: '🚩', name: { en: 'Pavagadh', hi: 'पावागढ़', gu: 'પાવાગઢ' }, full: { en: 'Shri Kalika Mata Temple, Pavagadh', hi: 'श्री कालिका माता मंदिर, पावागढ़', gu: 'શ્રી કાલિકા माता मंदिर, પાવાગઢ' } },
];

export const PilgrimFootwearModal = ({ isOpen = true, onClose, templeId = 'tmp_somnath' }) => {
  const navigate = useNavigate();
  const { currentUser, issueFootwearToken } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  
  const [activeTempleId, setActiveTempleId] = useState(templeId || 'tmp_somnath');
  const currentTempleObj = MASTER_TEMPLES.find(t => t.id === activeTempleId) || MASTER_TEMPLES[0];
  const shrineDisplayName = currentTempleObj.full[currentLanguage] || currentTempleObj.full.en;

  const [pairCount, setPairCount] = useState(2);
  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [pilgrimPhone, setPilgrimPhone] = useState(currentUser?.phone || '');
  const [selectedStation, setSelectedStation] = useState('gate1');
  const [lastIssuedToken, setLastIssuedToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (currentUser?.full_name && pilgrimName === 'Pilgrim Devotee') {
      setPilgrimName(currentUser.full_name);
    }
    if (currentUser?.phone && !pilgrimPhone) {
      setPilgrimPhone(currentUser.phone);
    }
  }, [isOpen, activeTempleId, currentUser]);

  const handleIssueToken = async (e) => {
    if (e) e.preventDefault();
    if (!pilgrimName.trim()) return;

    setLoading(true);
    try {
      const shrinePrefix = activeTempleId === 'tmp_dwarka' ? 'DWA' : activeTempleId === 'tmp_ambaji' ? 'AMB' : activeTempleId === 'tmp_pavagadh' ? 'PAV' : 'SOM';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const rackLetter = String.fromCharCode(65 + Math.floor(Math.random() * 4));
      const rackNum = Math.floor(1 + Math.random() * 40);

      const stationNames = {
        gate1: t.counterGate1,
        gate2: t.counterGate2,
        exit: t.counterExit
      };

      const tokenObj = {
        token_id: `FW-${shrinePrefix}-${randomNum}`,
        id: `FW-${shrinePrefix}-${randomNum}`,
        type: 'footwear',
        pilgrim_name: pilgrimName.trim() || currentUser?.full_name || 'Pilgrim Devotee',
        pilgrim_phone: pilgrimPhone.trim() || currentUser?.phone || '',
        rack_no: `Rack ${rackLetter}-${rackNum}`,
        locker_bin: `${rackLetter}-${rackNum}`,
        temple_id: activeTempleId,
        temple_name: shrineDisplayName,
        temples: {
          name: shrineDisplayName,
          location: stationNames[selectedStation] || t.counterGate1
        },
        counter_station: stationNames[selectedStation] || t.counterGate1,
        pair_count: pairCount,
        status: 'checked_in',
        created_at: new Date().toISOString(),
        issued_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      if (issueFootwearToken) {
        issueFootwearToken(tokenObj.pilgrim_name, tokenObj.pair_count);
      }

      const existingLocal = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      const updatedList = [tokenObj, ...existingLocal.filter(tok => tok.token_id !== tokenObj.token_id)];
      localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify(updatedList));

      // Universal Notification
      await sendPilgrimNotification({
        type: 'gate_info',
        title: '👟 Footwear Locker Pass Issued',
        message: `Locker Pass #${tokenObj.token_id} issued for ${tokenObj.pair_count} pair(s) at ${tokenObj.rack_no} (${shrineDisplayName}). Ready in My Bookings.`,
        templeId: activeTempleId
      });

      // Broadcast to volunteers
      broadcastBookingToVolunteers({
        id: tokenObj.token_id,
        temple_id: activeTempleId,
        temples: { name: shrineDisplayName },
        total_pilgrims: tokenObj.pair_count,
        is_priority: selectedStation === 'gate2',
        gate_number: tokenObj.rack_no,
        pilgrim_phone: tokenObj.pilgrim_phone
      });

      setLastIssuedToken(tokenObj);
    } catch (e) {
      console.error('Error generating footwear token:', e);
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
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:items-center sm:justify-center z-[999999] p-0 sm:p-4 select-none font-body animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-t-2 sm:border-2 border-gold/60 rounded-t-[32px] sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-gray-900 flex flex-col max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
      >
        {/* Mobile Grab Pill */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-[#450F16] text-white p-4 flex items-center justify-between border-b border-gold/40 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-inner shrink-0 text-xl font-bold">
              👟
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white font-heading uppercase tracking-wide flex items-center gap-2">
                <span>{t.title}</span>
                <span className="text-[10px] bg-gold/30 text-amber-200 font-mono font-extrabold px-2 py-0.5 rounded-full border border-gold/40">
                  {t.freeBadge}
                </span>
              </h3>
              <p className="text-[11px] text-amber-200/90 font-medium truncate max-w-[190px] sm:max-w-[260px]">
                {shrineDisplayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tri-Language Switcher */}
            <div className="flex items-center gap-0.5 bg-white/10 rounded-xl p-0.5 border border-white/20">
              {[{ id: 'hi', label: 'हि' }, { id: 'gu', label: 'ગુ' }, { id: 'en', label: 'EN' }].map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    currentLanguage === l.id ? 'bg-gold text-indigo-dark font-black shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-Temple Interactive Selector Bar */}
        <div className="bg-[#FAF7F2] px-3.5 py-2.5 border-b border-gold/25 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-maroon font-heading shrink-0">
            📍 {currentLanguage === 'gu' ? 'મંદિર:' : currentLanguage === 'hi' ? 'मंदिर:' : 'Temple:'}
          </span>
          {MASTER_TEMPLES.map(tmp => (
            <button
              key={tmp.id}
              type="button"
              onClick={() => {
                setActiveTempleId(tmp.id);
                setLastIssuedToken(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-heading ${
                activeTempleId === tmp.id
                  ? 'bg-maroon text-white shadow-xs border border-maroon scale-102'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gold shadow-2xs'
              }`}
            >
              <span>{tmp.icon}</span>
              <span>{tmp.name[currentLanguage] || tmp.name.en}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Form Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 pb-8">
          
          {/* SUCCESS CONFIRMATION OVERLAY IF JUST ISSUED */}
          {lastIssuedToken ? (
            <div className="bg-gradient-to-b from-[#FAF7F2] via-white to-amber-50/40 p-6 rounded-3xl border-2 border-gold shadow-warm text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center mx-auto text-3xl shadow-sm">
                🎉
              </div>

              <div>
                <h4 className="text-base font-black text-gray-900 font-heading">
                  {t.bookedSuccessTitle}
                </h4>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  {t.bookedSuccessDesc}
                </p>
              </div>

              {/* Pass Specs Card */}
              <div className="bg-white p-4 rounded-2xl border-2 border-gold/40 text-left space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">{t.tokenNumber}:</span>
                  <span className="font-mono text-base font-black text-maroon">{lastIssuedToken.rack_no}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Devotee:</span>
                  <span className="font-bold text-gray-900">{lastIssuedToken.pilgrim_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Footwear Pairs:</span>
                  <span className="font-bold text-gray-900">{lastIssuedToken.pair_count} Pair(s)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Counter Station:</span>
                  <span className="font-bold text-indigo-dark">{lastIssuedToken.counter_station}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleGoToMyBookings}
                  className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs uppercase tracking-wider rounded-2xl shadow-goldGlow transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
                >
                  <span>{t.viewInMyBookings}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setLastIssuedToken(null)}
                    className="flex-1 py-2.5 bg-[#FAF7F2] hover:bg-gray-100 text-maroon font-bold text-xs rounded-xl border border-maroon/30 transition-colors cursor-pointer font-heading"
                  >
                    {t.depositAnotherBtn}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors cursor-pointer font-heading"
                  >
                    {t.closeBtn}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* DEPOSIT FORM */
            <form onSubmit={handleIssueToken} className="space-y-4">
              
              {/* Devotee Info Card */}
              <div className="bg-white p-4 rounded-2xl border border-gold/30 shadow-xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-maroon font-heading">
                  <User className="w-3.5 h-3.5 text-gold-dark" />
                  <span>Devotee Details</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      {t.devoteeName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={pilgrimName}
                      onChange={(e) => setPilgrimName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-maroon focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      {t.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      value={pilgrimPhone}
                      onChange={(e) => setPilgrimPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-maroon focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Shoe Pairs Stepper Card */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-gold/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black uppercase text-gray-800 font-heading block">
                      {t.pairCountLabel}
                    </label>
                    <p className="text-[11px] text-gray-500 font-medium">
                      All pairs stored together in one dedicated locker
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPairCount(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-300 hover:border-maroon text-maroon font-black text-base flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="font-mono text-sm font-black text-maroon min-w-[60px] text-center bg-white px-2 py-1 rounded-lg border border-gold/40">
                      {pairCount} {pairCount === 1 ? t.pair : t.pairs}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPairCount(prev => Math.min(20, prev + 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-300 hover:border-maroon text-maroon font-black text-base flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[1, 2, 4, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPairCount(num)}
                      className={`py-1.5 rounded-xl text-xs font-extrabold transition-all border text-center cursor-pointer font-heading ${
                        pairCount === num
                          ? 'bg-maroon text-white border-maroon shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gold'
                      }`}
                    >
                      {num} {num === 1 ? 'Solo' : num === 2 ? 'Couple' : num === 4 ? 'Family' : 'Group'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locker Counter Location Selection */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2.5">
                <label className="text-xs font-black uppercase text-gray-800 font-heading block">
                  {t.counterStationLabel}
                </label>
                
                <div className="space-y-2">
                  {[
                    { id: 'gate1', label: t.counterGate1, icon: '🚪' },
                    { id: 'gate2', label: t.counterGate2, icon: '⚡' },
                    { id: 'exit', label: t.counterExit, icon: '🚶' }
                  ].map((station) => (
                    <div
                      key={station.id}
                      onClick={() => setSelectedStation(station.id)}
                      className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                        selectedStation === station.id
                          ? 'bg-amber-50 border-gold text-indigo-dark font-extrabold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gold/50'
                      }`}
                    >
                      <span className="text-base">{station.icon}</span>
                      <p className="text-xs">{station.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !pilgrimName.trim()}
                className="w-full py-4 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.generatingBtn}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-indigo-dark" />
                    <span>{t.issuePassBtn}</span>
                  </>
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
