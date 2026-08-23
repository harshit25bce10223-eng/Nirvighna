import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { prasadQueueEngine } from '../lib/prasadQueueEngine';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Utensils, Clock, CheckCircle, AlertCircle, X, Loader2, Sparkles, 
  MapPin, Plus, QrCode as QrIcon, ShieldCheck, ArrowRight, User, Phone
} from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';
import { sendPilgrimNotification } from '../lib/notificationService';

const translations = {
  en: {
    title: 'Pavitra Mahaprasad Queue',
    subtitle: 'Free Temple Annakshetra & Prasad Counter',
    tabGetToken: 'Get Prasad Token',
    tabMyTokens: 'My Tokens',
    servingNow: 'Currently Serving:',
    devoteeName: 'Devotee / Family Head Name',
    namePlaceholder: 'Enter your name',
    phoneLabel: 'Contact Phone Number',
    phonePlaceholder: '10-digit mobile number',
    prasadTypeLabel: 'Select Prasad Type',
    freeThali: '🍲 Free Mahaprasad Meal Thali',
    freeThaliSub: '100% Free seated dining at Annakshetra',
    ladduBox: '🎁 Special Laddu Prasad Box',
    ladduBoxSub: 'Takeaway consecrated laddu box',
    headcountLabel: 'Number of Devotees / Meals',
    person: 'Person',
    people: 'People',
    solo: '1 (Solo)',
    duo: '2 (Couple)',
    family: '4 (Family)',
    group: '6 (Group)',
    bus: '10 (Yatra)',
    selectHall: 'Select Annakshetra Dining Hall',
    hallMain: 'Hall #1: Main Annakshetra (Ground Floor)',
    hallFamily: 'Hall #2: Family & Senior Citizen Dining',
    hallTakeaway: 'Counter #3: Express Takeaway Prasad Counter',
    freeSeva: '100% Free Seva Facility by Mandir Trust',
    getTokenBtn: '🍲 Get Free Mahaprasad Token',
    generatingBtn: 'Generating Digital Token...',
    digitalPassTitle: 'SIGNED DIGITAL PRASAD TOKEN',
    tokenNumber: 'Token Number',
    estimatedWait: 'Estimated Wait:',
    minsWait: 'Mins',
    collectNow: '0 Mins (Proceed to Counter Now)',
    completed: '✅ Completed & Served',
    turnComing: 'YOUR TURN IS COMING UP!',
    turnComingDesc: 'Please proceed towards Annakshetra Counter now.',
    turnNow: "🎉 IT'S YOUR TURN NOW!",
    turnNowDesc: 'Show this QR code to the Seva Volunteer at Counter #1.',
    servedTitle: '✅ PRASAD SERVED & COLLECTED',
    servedDesc: 'Verified by Seva Volunteer at Annakshetra Counter.',
    showQrNotice: 'Show this scannable QR code at the Annakshetra Counter entrance to collect your sacred Mahaprasad.',
    markServedBtn: '✅ Mark Prasad Collected / Served',
    confirmCollect: 'Confirm you have received your Mahaprasad?',
    getAnotherBtn: '+ Get Another Token',
    closeBtn: 'Close Pass',
    noTokens: 'No active prasad tokens for today.',
    historyTitle: 'Recent Prasad Tokens',
    statusInQueue: 'In Queue',
    statusServed: 'Served & Collected',
    issuedAt: 'Issued at',
  },
  hi: {
    title: 'पवित्र महाप्रसाद कतार',
    subtitle: 'निःशुल्क मंदिर अन्नक्षेत्र एवं महाप्रसाद सेवा',
    tabGetToken: 'प्रसाद टोकन पाएं',
    tabMyTokens: 'मेरे टोकन',
    servingNow: 'वर्तमान में सेवारत:',
    devoteeName: 'श्रद्धालु / परिवार प्रमुख का नाम',
    namePlaceholder: 'अपना नाम दर्ज करें',
    phoneLabel: 'संपर्क मोबाइल नंबर',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    prasadTypeLabel: 'प्रसाद का प्रकार चुनें',
    freeThali: '🍲 निःशुल्क महाप्रसाद भोजन थाली',
    freeThaliSub: 'अन्नक्षेत्र में बैठकर 100% निःशुल्क भोजन',
    ladduBox: '🎁 विशेष लड्डू प्रसाद डिब्बा',
    ladduBoxSub: 'पवित्र लड्डू प्रसाद टेकअवे बॉक्स',
    headcountLabel: 'श्रद्धालुओं / थालियों की संख्या',
    person: 'व्यक्ति',
    people: 'व्यक्ति',
    solo: '1 (एकल)',
    duo: '2 (युगल)',
    family: '4 (परिवार)',
    group: '6 (समूह)',
    bus: '10 (यात्रा संघ)',
    selectHall: 'अन्नक्षेत्र भोजन हॉल चुनें',
    hallMain: 'हॉल #1: मुख्य अन्नक्षेत्र हॉल (भू-तल)',
    hallFamily: 'हॉल #2: परिवार एवं वरिष्ठ नागरिक हॉल',
    hallTakeaway: 'काउंटर #3: एक्सप्रेस टेकअवे प्रसाद काउंटर',
    freeSeva: 'श्री मंदिर ट्रस्ट द्वारा 100% निःशुल्क अन्नक्षेत्र सेवा',
    getTokenBtn: '🍲 निःशुल्क महाप्रसाद टोकन प्राप्त करें',
    generatingBtn: 'डिजिटल टोकन जनरेट हो रहा है...',
    digitalPassTitle: 'डिजिटल महाप्रसाद टोकन पास',
    tokenNumber: 'टोकन नंबर',
    estimatedWait: 'अनुमानित प्रतीक्षा:',
    minsWait: 'मिनट',
    collectNow: '0 मिनट (अभी काउंटर पर जाएं)',
    completed: '✅ पूर्ण / प्रसाद प्राप्त',
    turnComing: 'आपकी बारी आने वाली है!',
    turnComingDesc: 'कृपया अब अन्नक्षेत्र काउंटर की ओर बढ़ें।',
    turnNow: '🎉 अब आपकी बारी है!',
    turnNowDesc: 'काउंटर #1 पर सेवादार को यह QR कोड दिखाएं।',
    servedTitle: '✅ प्रसाद प्राप्त हो चुका है',
    servedDesc: 'अन्नक्षेत्र काउंटर पर सेवादार द्वारा सत्यापित।',
    showQrNotice: 'अन्नक्षेत्र में प्रवेश करते समय यह QR कोड काउंटर पर दिखाएं और शून्य प्रतीक्षा में ताजा महाप्रसाद प्राप्त करें।',
    markServedBtn: '✅ प्रसाद प्राप्त कर लिया / टोकन समाप्त करें',
    confirmCollect: 'क्या आपको आपका महाप्रसाद प्राप्त हो गया है?',
    getAnotherBtn: '+ नया प्रसाद टोकन बनाएं',
    closeBtn: 'पास बंद करें',
    noTokens: 'आज के लिए कोई सक्रिय प्रसाद टोकन नहीं है।',
    historyTitle: 'हाल के प्रसाद टोकन',
    statusInQueue: 'कतार में',
    statusServed: 'प्राप्त कर लिया',
    issuedAt: 'जारी समय',
  },
  gu: {
    title: 'પવિત્ર મહાપ્રસાદ લાઇન',
    subtitle: 'મફત મંદિર અન્નક્ષેત્ર અને પ્રસાદ કાઉન્ટર',
    tabGetToken: 'પ્રસાદ ટોકન મેળવો',
    tabMyTokens: 'મારા ટોકન',
    servingNow: 'હાલમાં ચાલુ નંબર:',
    devoteeName: 'યાત્રાળુ / મુખીનું નામ',
    namePlaceholder: 'તમારું નામ દાખલ કરો',
    phoneLabel: 'સંપર્ક મોબાઇલ નંબર',
    phonePlaceholder: '10 આંકડાનો મોબાઇલ નંબર',
    prasadTypeLabel: 'પ્રસાદનો પ્રકાર પસંદ કરો',
    freeThali: '🍲 મફત મહાપ્રસાદ ભોજન થાળી',
    freeThaliSub: 'અન્નક્ષેત્રમાં બેસીને 100% મફત ભોજન',
    ladduBox: '🎁 સ્પેશિયલ લાડુ પ્રસાદ બોક્સ',
    ladduBoxSub: 'પવિત્ર લાડુ પ્રસાદ ટેકઅવે બોક્સ',
    headcountLabel: 'યાત્રાળુઓ / થાળીઓની સંખ્યા',
    person: 'વ્યક્તિ',
    people: 'વ્યક્તિઓ',
    solo: '1 (એકલ)',
    duo: '2 (જોડી)',
    family: '4 (પરિવાર)',
    group: '6 (જૂથ)',
    bus: '10 (યાત્રા)',
    selectHall: 'અન્નક્ષેત્ર ડાઇનિંગ હૉલ પસંદ કરો',
    hallMain: 'હૉલ #1: મુખ્ય અન્નક્ષેત્ર હૉલ (ગ્રાઉન્ડ ફ્લોર)',
    hallFamily: 'હૉલ #2: પરિવાર અને વરિષ્ઠ નાગરિક હૉલ',
    hallTakeaway: 'કાઉન્ટર #3: એક્સપ્રેસ ટેકઅવે પ્રસાદ કાઉન્ટર',
    freeSeva: 'શ્રી મંદિર ટ્રસ્ટ તરફથી 100% મફત અન્નક્ષેત્ર સેવા',
    getTokenBtn: '🍲 મફત મહાપ્રસાદ ટોકન મેળવો',
    generatingBtn: 'ડિજિટલ ટોકન બની રહ્યું છે...',
    digitalPassTitle: 'ડિજિટલ મહાપ્રસાદ ટોકન પાસ',
    tokenNumber: 'ટોકન નંબર',
    estimatedWait: 'અંદાજિત પ્રતીક્ષા:',
    minsWait: 'મિનિટ',
    collectNow: '0 મિનિટ (હમણાં કાઉન્ટર પર જાઓ)',
    completed: '✅ પૂર્ણ / પ્રસાદ મળી ગયો',
    turnComing: 'તમારો વારો આવવાની તૈયારી છે!',
    turnComingDesc: 'કૃપા કરીને અન્નક્ષેત્ર કાઉન્ટર તરફ આગળ વધો.',
    turnNow: '🎉 હવે તમારો વારો છે!',
    turnNowDesc: 'કાઉન્ટર #1 પર સ્વયંસેવકને આ QR કોડ બતાવો.',
    servedTitle: '✅ પ્રસાદ મળી ગયો છે',
    servedDesc: 'અન્નક્ષેત્ર કાઉન્ટર પર સ્વયંસેવક દ્વારા ચકાસાયેલ.',
    showQrNotice: 'અન્નક્ષેત્રમાં પ્રવેશ કરતી વખતે આ QR કોડ કાઉન્ટર પર બતાવો અને તાજો મહાપ્રસાદ મેળવો.',
    markServedBtn: '✅ પ્રસાદ મળી ગયો / પૂર્ણ કરો',
    confirmCollect: 'શું તમને તમારો મહાપ્રસાદ મળી ગયો છે?',
    getAnotherBtn: '+ નવું પ્રસાદ ટોકન બનાવો',
    closeBtn: 'પાસ બંધ કરો',
    noTokens: 'આજ માટે કોઈ સક્રિય પ્રસાદ ટોકન નથી.',
    historyTitle: 'હાલના પ્રસાદ ટોકન',
    statusInQueue: 'લાઇનમાં',
    statusServed: 'મેળવી લીધેલ',
    issuedAt: 'ઇશ્યૂ સમય',
  }
};

export const PrasadQueueModal = ({ templeId = 'tmp_somnath', templeName = 'Somnath Temple', onClose }) => {
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const shrine = getTempleById(templeId) || { name: templeName || 'Somnath Temple' };

  const [activeTab, setActiveTab] = useState('get_token'); // 'get_token' | 'tokens'
  const [counterStatus, setCounterStatus] = useState({ current_serving_token: 142, avg_serve_time_seconds: 60 });
  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [pilgrimPhone, setPilgrimPhone] = useState(currentUser?.phone || '');
  const [prasadType, setPrasadType] = useState('free_thali'); // 'free_thali' | 'laddu_box'
  const [headcount, setHeadcount] = useState(2);
  const [selectedHall, setSelectedHall] = useState('hall1');
  const [activeToken, setActiveToken] = useState(null);
  const [tokenList, setTokenList] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const scrollContainerRef = useRef(null);

  // Automatically scroll container to top when switching tabs or issuing token
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, activeToken]);

  useEffect(() => {
    fetchStatus();

    if (currentUser?.full_name && pilgrimName === 'Pilgrim Devotee') {
      setPilgrimName(currentUser.full_name);
    }
    if (currentUser?.phone && !pilgrimPhone) {
      setPilgrimPhone(currentUser.phone);
    }

    loadTokens();

    // 1. Same-Tab sync
    const handleCounterUpdate = (e) => {
      if (e.detail && (!e.detail.templeId || e.detail.templeId === templeId)) {
        setCounterStatus(e.detail.counter);
      }
    };

    const handleTokenServed = (e) => {
      if (e.detail && e.detail.token) {
        setActiveToken(prev => prev && prev.token_number === e.detail.token.token_number ? { ...prev, status: 'served' } : prev);
      }
    };

    window.addEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
    window.addEventListener('nirvighna_prasad_token_served', handleTokenServed);

    return () => {
      window.removeEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
      window.removeEventListener('nirvighna_prasad_token_served', handleTokenServed);
    };
  }, [templeId, currentUser]);

  const loadTokens = () => {
    try {
      const saved = localStorage.getItem(`nirvighna_prasad_token_${templeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveToken(parsed);
        setTokenList([parsed]);
        generateQR(parsed.token_id || `PRASAD-${templeId}-${parsed.token_number}`);
        setActiveTab('tokens');
      } else {
        setActiveToken(null);
        setActiveTab('get_token');
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
      setQrDataUrl(url);
    } catch (_) {}
  };

  const fetchStatus = async () => {
    const status = await prasadQueueEngine.fetchCounterStatus(templeId);
    setCounterStatus(status);
  };

  const handleGetMyToken = async (e) => {
    if (e) e.preventDefault();
    setIssuing(true);
    try {
      const token = await prasadQueueEngine.issuePrasadToken(null, templeId);
      
      const hallNames = {
        hall1: t.hallMain,
        hall2: t.hallFamily,
        hall3: t.hallTakeaway
      };

      const enrichedToken = {
        ...token,
        token_id: `PRS-${templeId}-${token.token_number}`,
        pilgrim_name: pilgrimName.trim() || currentUser?.full_name || 'Pilgrim Devotee',
        pilgrim_phone: pilgrimPhone.trim() || currentUser?.phone || '',
        prasad_type: prasadType,
        prasad_label: prasadType === 'free_thali' ? t.freeThali : t.ladduBox,
        headcount: headcount,
        dining_hall: hallNames[selectedHall] || t.hallMain,
        temple_id: templeId,
        temple_name: shrine.name,
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      setActiveToken(enrichedToken);
      setTokenList([enrichedToken]);
      localStorage.setItem(`nirvighna_prasad_token_${templeId}`, JSON.stringify(enrichedToken));
      await generateQR(enrichedToken.token_id);

      // Universal Notification (System Status Bar & In-App Alert)
      await sendPilgrimNotification({
        type: 'gate_info',
        title: '🍲 Mahaprasad Token Issued!',
        message: `Your Prasad Queue Token #${token.token_number} for ${headcount} Devotee(s) is issued for ${shrine.name}.`,
        templeId: templeId
      });

      setActiveTab('tokens');
      setSuccessToast('🎉 Mahaprasad token issued successfully!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (e) {
      alert('Could not issue token: ' + e.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleMarkServed = () => {
    if (!activeToken) return;
    if (!window.confirm(t.confirmCollect)) return;

    const updated = {
      ...activeToken,
      status: 'served',
      retrieved_at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    setActiveToken(updated);
    localStorage.setItem(`nirvighna_prasad_token_${templeId}`, JSON.stringify(updated));
    setSuccessToast('✅ Mahaprasad collected! May Lord bless your yatra.');
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const estimatedWaitMin = activeToken
    ? prasadQueueEngine.getEstimatedWait(activeToken.token_number, counterStatus.current_serving_token, counterStatus.avg_serve_time_seconds)
    : 0;

  const isNearingTurn = activeToken && (activeToken.token_number - counterStatus.current_serving_token <= 3) && (activeToken.token_number > counterStatus.current_serving_token);
  const isMyTurnServed = activeToken && counterStatus.current_serving_token >= activeToken.token_number;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[999] p-0 sm:p-4 animate-in fade-in select-none font-body">
      <div className="bg-white border-t-2 sm:border-2 border-gold/40 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden text-gray-900 flex flex-col max-h-[88vh] sm:max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-maroon text-white px-4 pt-3 pb-4 sm:p-5 flex flex-col gap-2 border-b border-gold/40 relative">
          <div className="w-12 h-1 bg-white/40 rounded-full mx-auto sm:hidden" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-sm shrink-0 font-bold text-xl">
                🍲
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white font-heading uppercase tracking-wide flex items-center gap-2">
                  <span>{t.title}</span>
                  <span className="text-[10px] bg-gold/30 text-amber-200 font-mono font-bold px-2 py-0.5 rounded-full border border-gold/40">
                    FREE
                  </span>
                </h3>
                <p className="text-[11px] text-amber-200/90 font-medium">
                  {shrine.name} • {t.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#FAF7F2] p-2 border-b border-gold/20 flex gap-2">
          <button
            onClick={() => setActiveTab('get_token')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'get_token'
                ? 'bg-maroon text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gold/50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t.tabGetToken}</span>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'tokens'
                ? 'bg-maroon text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gold/50'
            }`}
          >
            <QrIcon className="w-4 h-4" />
            <span>{t.tabMyTokens}</span>
            {activeToken && activeToken.status !== 'served' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-1.5 right-2" />
            )}
          </button>
        </div>

        {/* Live Serving Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-gold/20 to-amber-500/15 px-4 py-2.5 border-b border-gold/30 flex items-center justify-between text-xs font-bold text-indigo-dark shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>{t.servingNow}</span>
          </div>
          <span className="text-sm font-black font-mono text-maroon bg-white px-3 py-0.5 rounded-xl border border-gold/50 shadow-2xs">
            Token #{counterStatus.current_serving_token}
          </span>
        </div>

        {/* Toast Notification */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-extrabold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div ref={scrollContainerRef} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: GET PRASAD TOKEN FORM */}
          {activeTab === 'get_token' && (
            <form onSubmit={handleGetMyToken} className="space-y-4">
              
              {/* Trust Badge Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-gold/15 to-amber-500/10 p-3 rounded-2xl border border-gold/40 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-maroon shrink-0" />
                <p className="text-xs font-bold text-maroon">
                  {t.freeSeva}
                </p>
              </div>

              {/* Devotee Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block font-heading">
                  {t.devoteeName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pilgrimName}
                  onChange={(e) => setPilgrimName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-maroon focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block font-heading">
                  {t.phoneLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={pilgrimPhone}
                    onChange={(e) => setPilgrimPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF7F2] border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-maroon focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Prasad Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block font-heading">
                  {t.prasadTypeLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrasadType('free_thali')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      prasadType === 'free_thali'
                        ? 'bg-amber-50 border-maroon text-maroon font-bold shadow-xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gold'
                    }`}
                  >
                    <p className="text-xs font-black">{t.freeThali}</p>
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5">100% FREE</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrasadType('laddu_box')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      prasadType === 'laddu_box'
                        ? 'bg-amber-50 border-maroon text-maroon font-bold shadow-xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gold'
                    }`}
                  >
                    <p className="text-xs font-black">{t.ladduBox}</p>
                    <p className="text-[10px] text-amber-800 font-extrabold mt-0.5">Special Box</p>
                  </button>
                </div>
              </div>

              {/* Number of Devotees Stepper */}
              <div className="space-y-2 bg-[#FAF7F2] p-3.5 rounded-2xl border border-gold/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-800 font-heading">
                    {t.headcountLabel}
                  </label>
                  <span className="text-xs font-black text-maroon bg-amber-100 px-3 py-0.5 rounded-full border border-gold/40">
                    {headcount} {headcount === 1 ? t.person : t.people}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHeadcount(prev => Math.max(1, prev - 1))}
                    className="w-11 h-11 rounded-xl bg-white border border-gray-300 text-maroon font-black text-xl hover:bg-gray-100 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center py-2 bg-white border-2 border-gold rounded-xl shadow-xs">
                    <span className="text-xl font-black font-mono text-indigo-dark">
                      {headcount}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">
                      {headcount === 1 ? t.person : t.people}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeadcount(prev => Math.min(50, prev + 1))}
                    className="w-11 h-11 rounded-xl bg-white border border-gray-300 text-maroon font-black text-xl hover:bg-gray-100 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { count: 1, label: t.solo },
                    { count: 2, label: t.duo },
                    { count: 4, label: t.family },
                    { count: 6, label: t.group },
                    { count: 10, label: t.bus },
                  ].map((preset) => (
                    <button
                      key={preset.count}
                      type="button"
                      onClick={() => setHeadcount(preset.count)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border text-center cursor-pointer ${
                        headcount === preset.count
                          ? 'bg-maroon text-white border-maroon shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gold'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hall Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block font-heading">
                  {t.selectHall}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'hall1', label: t.hallMain },
                    { id: 'hall2', label: t.hallFamily },
                    { id: 'hall3', label: t.hallTakeaway },
                  ].map((hall) => (
                    <button
                      key={hall.id}
                      type="button"
                      onClick={() => setSelectedHall(hall.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedHall === hall.id
                          ? 'bg-amber-50 border-maroon text-maroon font-bold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gold'
                      }`}
                    >
                      <span className="text-xs">{hall.label}</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedHall === hall.id ? 'border-maroon bg-maroon' : 'border-gray-300'
                      }`}>
                        {selectedHall === hall.id && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={issuing || !pilgrimName.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-gold-dark hover:to-gold text-indigo-dark font-black text-xs sm:text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-[0.99]"
              >
                {issuing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.generatingBtn}</span>
                  </>
                ) : (
                  <>
                    <span>{t.getTokenBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: ACTIVE TOKENS & DIGITAL PASS CARD */}
          {activeTab === 'tokens' && (
            <div className="space-y-3">
              {activeToken ? (
                <div className="bg-gradient-to-b from-[#FAF7F2] to-white p-3.5 sm:p-4 rounded-3xl border-2 border-gold shadow-warm text-center space-y-2.5 relative overflow-hidden">
                  
                  {/* Status Pill & Token ID */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs ${
                      activeToken.status === 'served'
                        ? 'bg-gray-100 text-gray-700 border border-gray-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeToken.status === 'served' ? 'bg-gray-400' : 'bg-emerald-500 animate-ping'}`} />
                      {activeToken.status === 'served' ? t.statusServed : t.statusInQueue}
                    </span>
                    <span className="font-mono text-[11px] text-maroon font-black bg-maroon/10 px-2 py-0.5 rounded-lg border border-maroon/20">
                      {activeToken.token_id}
                    </span>
                  </div>

                  {/* Token Number & Serving Progress Banner */}
                  <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-maroon text-white p-2.5 sm:p-3 rounded-2xl shadow-md border border-gold/40 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 font-heading">
                        {t.tokenNumber}
                      </p>
                      <p className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-gold drop-shadow-sm leading-tight">
                        #{activeToken.token_number}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-[10px] font-bold text-amber-200">
                        Serving: #{counterStatus.current_serving_token}
                      </p>
                      <p className="text-xs font-black text-white">
                        {activeToken.status === 'served' ? t.completed : isMyTurnServed ? '🌟 ' + t.collectNow : `${estimatedWaitMin} ${t.minsWait}`}
                      </p>
                    </div>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="bg-white p-2 rounded-2xl inline-block shadow-md border-2 border-gold mx-auto">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Signed Prasad Token QR" className="w-32 h-32 sm:w-36 sm:h-36 mx-auto object-contain" />
                    ) : (
                      <div className="w-32 h-32 sm:w-36 sm:h-36 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                        <QrIcon className="w-10 h-10 text-maroon animate-pulse" />
                      </div>
                    )}
                    <p className="text-[9px] font-mono font-black text-maroon mt-0.5 tracking-wider">
                      SHOW AT ANNAKSHETRA COUNTER
                    </p>
                  </div>

                  {/* 2-Column Summary Details */}
                  <div className="grid grid-cols-2 gap-2 bg-amber-50/80 p-2 rounded-xl border border-amber-200 text-[11px] text-gray-800 text-left">
                    <div>
                      <span className="text-gray-500 text-[10px] block">Devotee / Qty:</span>
                      <span className="font-bold text-gray-900 truncate block">
                        {activeToken.pilgrim_name} ({activeToken.headcount || 2} P)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Hall / Prasad:</span>
                      <span className="font-bold text-indigo-dark truncate block">
                        {activeToken.dining_hall || t.hallMain}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-0.5">
                    {activeToken.status !== 'served' && (
                      <button
                        onClick={handleMarkServed}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-heading"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.markServedBtn}</span>
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('get_token')}
                        className="flex-1 py-2 bg-[#FAF7F2] hover:bg-gray-100 text-maroon font-bold text-[11px] rounded-xl border border-maroon/30 transition-colors cursor-pointer font-heading flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t.getAnotherBtn}</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-900 hover:bg-black text-white font-bold text-[11px] rounded-xl transition-colors cursor-pointer font-heading"
                      >
                        {t.closeBtn}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3 bg-[#FAF7F2] p-5 rounded-3xl border border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-maroon flex items-center justify-center mx-auto text-xl">
                    🍲
                  </div>
                  <p className="text-xs font-bold text-gray-700 font-heading">
                    {t.noTokens}
                  </p>
                  <button
                    onClick={() => setActiveTab('get_token')}
                    className="px-4 py-2 bg-maroon text-white font-bold text-xs rounded-xl shadow-md hover:bg-maroon-dark transition-all cursor-pointer font-heading inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.tabGetToken}</span>
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
