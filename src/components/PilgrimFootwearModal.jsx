import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Footprints, Clock, CheckCircle, AlertCircle, X, Loader2, Sparkles, 
  MapPin, Plus, QrCode as QrIcon, ShieldCheck, ArrowRight, User, Phone,
  Shield, Check, ChevronRight, RefreshCw, KeyRound
} from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';
import { sendPilgrimNotification } from '../lib/notificationService';
import { broadcastBookingToVolunteers } from '../lib/volunteerEngine';

const translations = {
  en: {
    title: 'Smart Footwear Locker',
    subtitle: 'Free & Secure Electronic Shoe Depositing Facility',
    tabDeposit: 'Deposit Shoes',
    tabMyTokens: 'My Locker Pass',
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
    digitalPassTitle: 'DIGITAL FOOTWEAR PASS',
    tokenNumber: 'Assigned Locker Rack',
    pairsCount: 'Total Footwear Pairs',
    depositStation: 'Locker Counter Station',
    retrieveBtn: '✅ Retrieve Footwear & Clear Locker',
    retrievingConfirm: 'Confirm you are collecting your shoes from the locker attendant?',
    getAnotherBtn: '+ Deposit Another Pair',
    closeBtn: 'Close Pass',
    noTokens: 'No active footwear tokens currently deposited.',
    showQrNotice: 'Show this QR code at the locker counter when retrieving your shoes.',
    statusInLocker: 'Secured in Locker',
    statusRetrieved: 'Retrieved & Cleared',
    freeBadge: '100% FREE SEVA'
  },
  hi: {
    title: 'डिजिटल जूता लॉकर',
    subtitle: 'निःशुल्क एवं सुरक्षित इलेक्ट्रॉनिक जूता जमा केंद्र',
    tabDeposit: 'जूते जमा करें',
    tabMyTokens: 'मेरा लॉकर पास',
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
    digitalPassTitle: 'डिजिटल जूता लॉकर पास',
    tokenNumber: 'आवंटित रैक नंबर',
    pairsCount: 'कुल जूते की जोड़ियां',
    depositStation: 'जमा काउंटर गेट',
    retrieveBtn: '✅ जूते प्राप्त करें एवं लॉकर खाली करें',
    retrievingConfirm: 'क्या आप काउंटर से अपने जूते वापस ले रहे हैं?',
    getAnotherBtn: '+ नए जूते जमा करें',
    closeBtn: 'पास बंद करें',
    noTokens: 'वर्तमान में कोई जूते लॉकर में जमा नहीं हैं।',
    showQrNotice: 'जूते वापस लेते समय यह QR कोड काउंटर पर सेवादार को दिखाएं।',
    statusInLocker: 'लॉकर में सुरक्षित',
    statusRetrieved: 'वापस प्राप्त कर लिया',
    freeBadge: '100% निःशुल्क सेवा'
  },
  gu: {
    title: 'ડિજિટલ પગરખાં લોકર',
    subtitle: 'મફત અને સુરક્ષિત ઈલેક્ટ્રોનિક પગરખાં જમા કેન્દ્ર',
    tabDeposit: 'પગરખાં જમા કરો',
    tabMyTokens: 'મારો લોકર પાસ',
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
    digitalPassTitle: 'ડિજિટલ પગરખાં લોકર પાસ',
    tokenNumber: 'ફાળવેલ રૅક નંબર',
    pairsCount: 'કુલ પગરખાંની જોડી',
    depositStation: 'જમા કાઉન્ટર ગેટ',
    retrieveBtn: '✅ પગરખાં મેળવો અને લોકર ખાલી કરો',
    retrievingConfirm: 'શું તમે કાઉન્ટર પરથી તમારા પગરખાં પાછા મેળવી રહ્યા છો?',
    getAnotherBtn: '+ નવા પગરખાં જમા કરો',
    closeBtn: 'પાસ બંધ કરો',
    noTokens: 'હાલમાં કોઈ પગરખાં લોકરમાં જમા નથી.',
    showQrNotice: 'પગરખાં પરત લેતી વખતે આ QR કોડ કાઉન્ટર પર સ્વયંસેવકને બતાવો.',
    statusInLocker: 'લોકરમાં સુરક્ષિત',
    statusRetrieved: 'પરત મેળવી લીધેલ',
    freeBadge: '100% મફત સેવા'
  }
};

const MASTER_TEMPLES = [
  { id: 'tmp_somnath', icon: '🔱', name: { en: 'Somnath', hi: 'सोमनाथ', gu: 'સોમનાથ' }, full: { en: 'Shri Somnath Jyotirlinga', hi: 'श्री सोमनाथ ज्योतिर्लिंग', gu: 'શ્રી સોમનાથ જ્યોતિર્લિંગ' } },
  { id: 'tmp_dwarka', icon: '🦚', name: { en: 'Dwarka', hi: 'द्वारका', gu: 'દ્વારકા' }, full: { en: 'Shri Dwarkadhish Mandir', hi: 'श्री द्वारकाधीश मंदिर', gu: 'શ્રી દ્વારકાધીશ મંદિર' } },
  { id: 'tmp_ambaji', icon: '🌸', name: { en: 'Ambaji', hi: 'अंबाजी', gu: 'અંબાજી' }, full: { en: 'Shri Arasuri Ambaji Temple', hi: 'श्री अंबाजी माता मंदिर', gu: 'શ્રી આરાસુરી અંબાજી મંદિર' } },
  { id: 'tmp_pavagadh', icon: '🚩', name: { en: 'Pavagadh', hi: 'पावागढ़', gu: 'પાવાગઢ' }, full: { en: 'Shri Kalika Mata Temple, Pavagadh', hi: 'श्री कालिका माता मंदिर, पावागढ़', gu: 'શ્રી કાલિકા માતા મંદિર, પાવાગઢ' } },
];

export const PilgrimFootwearModal = ({ isOpen = true, onClose, templeId = 'tmp_somnath' }) => {
  const { currentUser, issueFootwearToken } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  
  const [activeTempleId, setActiveTempleId] = useState(templeId || 'tmp_somnath');
  const currentTempleObj = MASTER_TEMPLES.find(t => t.id === activeTempleId) || MASTER_TEMPLES[0];
  const shrineDisplayName = currentTempleObj.full[currentLanguage] || currentTempleObj.full.en;

  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'tokens'
  const [pairCount, setPairCount] = useState(2);
  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [pilgrimPhone, setPilgrimPhone] = useState(currentUser?.phone || '');
  const [selectedStation, setSelectedStation] = useState('gate1');
  const [activeToken, setActiveToken] = useState(null);
  const [tokenList, setTokenList] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const scrollContainerRef = useRef(null);

  // Automatically scroll container to top when switching tabs or issuing token
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, activeToken]);

  // Load existing tokens
  useEffect(() => {
    if (!isOpen) return;

    if (currentUser?.full_name && pilgrimName === 'Pilgrim Devotee') {
      setPilgrimName(currentUser.full_name);
    }
    if (currentUser?.phone && !pilgrimPhone) {
      setPilgrimPhone(currentUser.phone);
    }

    loadTokens();
  }, [isOpen, activeTempleId, currentUser]);

  const loadTokens = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      setTokenList(existing);
      const latestActive = existing.find(tok => tok.status === 'checked_in' && (!tok.temple_id || tok.temple_id === activeTempleId));
      if (latestActive) {
        setActiveToken(latestActive);
        generateQR(latestActive.token_id || latestActive.id);
        setActiveTab('tokens');
      } else {
        setActiveToken(null);
        setActiveTab('deposit');
      }
    } catch (_) {}
  };

  const generateQR = async (val) => {
    try {
      const url = await QRCode.toDataURL(val, { 
        margin: 1, 
        width: 260, 
        color: { dark: '#4A151C', light: '#FFFFFF' } 
      });
      setQrCodeUrl(url);
    } catch (_) {}
  };

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
        pilgrim_name: pilgrimName.trim() || currentUser?.full_name || 'Pilgrim Devotee',
        pilgrim_phone: pilgrimPhone.trim() || currentUser?.phone || '',
        rack_no: `Rack ${rackLetter}-${rackNum}`,
        locker_bin: `${rackLetter}-${rackNum}`,
        temple_id: activeTempleId,
        temple_name: shrineDisplayName,
        counter_station: stationNames[selectedStation] || t.counterGate1,
        pair_count: pairCount,
        status: 'checked_in',
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      if (issueFootwearToken) {
        issueFootwearToken(tokenObj.pilgrim_name, tokenObj.pair_count);
      }

      const existingLocal = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      const updatedList = [tokenObj, ...existingLocal];
      localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify(updatedList));
      setTokenList(updatedList);

      // Universal Notification
      await sendPilgrimNotification({
        type: 'gate_info',
        title: '👟 Footwear Locker Pass Issued',
        message: `Locker Token #${tokenObj.token_id} issued for ${tokenObj.pair_count} pair(s) at ${tokenObj.rack_no} (${shrineDisplayName}).`,
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

      setActiveToken(tokenObj);
      await generateQR(tokenObj.token_id);
      setActiveTab('tokens');
      setSuccessToast('🎉 Footwear Locker Pass Generated Successfully!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (e) {
      console.error('Error generating footwear token:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieveToken = (tokenToRetrieve) => {
    if (!tokenToRetrieve) return;
    if (!window.confirm(t.retrievingConfirm)) return;

    try {
      const existing = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      const updated = existing.map(tok => {
        if (tok.token_id === tokenToRetrieve.token_id || tok.id === tokenToRetrieve.id) {
          return {
            ...tok,
            status: 'retrieved',
            retrieved_at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          };
        }
        return tok;
      });

      localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify(updated));
      setTokenList(updated);

      const nextActive = updated.find(tok => tok.status === 'checked_in' && (!tok.temple_id || tok.temple_id === activeTempleId));
      if (nextActive) {
        setActiveToken(nextActive);
        generateQR(nextActive.token_id || nextActive.id);
      } else {
        setActiveToken(null);
      }

      setSuccessToast('✅ Footwear collected & locker cleared!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (e) {
      console.error('Error retrieving footwear:', e);
    }
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
              onClick={() => setActiveTempleId(tmp.id)}
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

        {/* Main Segmented Switcher */}
        <div className="bg-white p-2.5 border-b border-gray-100 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-extrabold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-amber-50/50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.tabDeposit}</span>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-extrabold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'tokens'
                ? 'bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-amber-50/50'
            }`}
          >
            <QrIcon className="w-3.5 h-3.5" />
            <span>{t.tabMyTokens}</span>
            {tokenList.filter(tok => tok.status === 'checked_in' && (!tok.temple_id || tok.temple_id === activeTempleId)).length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute top-2 right-3" />
            )}
          </button>
        </div>

        {/* Toast Message */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-extrabold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 pb-8">
          
          {/* TAB 1: DEPOSIT FOOTWEAR FORM */}
          {activeTab === 'deposit' && (
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

          {/* TAB 2: ACTIVE FOOTWEAR PASS CARD */}
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {activeToken ? (
                <div className="bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2] p-5 rounded-3xl border-2 border-gold shadow-warm text-center space-y-4 relative overflow-hidden">
                  
                  {/* Status Pill & Token ID */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${
                      activeToken.status === 'retrieved'
                        ? 'bg-gray-100 text-gray-700 border border-gray-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${activeToken.status === 'retrieved' ? 'bg-gray-400' : 'bg-emerald-500 animate-ping'}`} />
                      {activeToken.status === 'retrieved' ? t.statusRetrieved : t.statusInLocker}
                    </span>
                    
                    <span className="font-mono text-xs font-black text-maroon bg-maroon/10 px-2.5 py-1 rounded-xl border border-maroon/20">
                      {activeToken.token_id || activeToken.id}
                    </span>
                  </div>

                  {/* Allocated Rack Number Banner */}
                  <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-maroon text-white p-4 rounded-2xl shadow-md border border-gold/40 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300 font-heading">
                        {t.tokenNumber}
                      </p>
                      <p className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-gold drop-shadow-sm leading-tight">
                        {activeToken.rack_no || 'Rack A-12'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs font-bold text-amber-200">
                        {activeToken.pair_count || 2} Pairs Deposited
                      </p>
                      <p className="text-xs font-black text-white">
                        {activeToken.status === 'retrieved' ? '✅ Cleared' : '🔒 Secure Locked'}
                      </p>
                    </div>
                  </div>

                  {/* Scannable QR Code Plinth */}
                  <div className="bg-white p-3 rounded-3xl inline-block shadow-md border-2 border-gold mx-auto">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="Footwear Locker QR" className="w-36 h-36 sm:w-44 sm:h-44 mx-auto object-contain" />
                    ) : (
                      <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                        <QrIcon className="w-12 h-12 text-maroon animate-pulse" />
                      </div>
                    )}
                    <p className="text-[10px] font-mono font-black text-maroon mt-1 tracking-wider">
                      SHOW AT LOCKER COUNTER TO RETRIEVE
                    </p>
                  </div>

                  {/* Detailed Specs Card */}
                  <div className="bg-white p-3.5 rounded-2xl border border-gold/30 text-xs text-gray-800 text-left space-y-2 shadow-2xs">
                    <div className="flex justify-between py-0.5 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Devotee:</span>
                      <span className="font-bold text-gray-900">{activeToken.pilgrim_name}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Locker Counter:</span>
                      <span className="font-bold text-maroon">{activeToken.counter_station || t.counterGate1}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-500 font-medium">Deposited At:</span>
                      <span className="font-bold text-indigo-dark">{activeToken.time_formatted || 'Just Now'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    {activeToken.status === 'checked_in' && (
                      <button
                        onClick={() => handleRetrieveToken(activeToken)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.retrieveBtn}</span>
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('deposit')}
                        className="flex-1 py-2.5 bg-[#FAF7F2] hover:bg-gray-100 text-maroon font-bold text-xs rounded-xl border border-maroon/30 transition-colors cursor-pointer font-heading flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.getAnotherBtn}</span>
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
                <div className="text-center py-8 space-y-4 bg-[#FAF7F2] p-6 rounded-3xl border border-gray-200">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-maroon flex items-center justify-center mx-auto text-2xl shadow-xs">
                    👟
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-gray-800 font-heading">
                      {t.noTokens}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Deposit your shoes safely at any temple gate locker.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="px-5 py-2.5 bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark font-black text-xs rounded-2xl shadow-goldGlow hover:opacity-95 transition-all cursor-pointer font-heading inline-flex items-center gap-2 uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.tabDeposit}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PilgrimFootwearModal;
