import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, CheckCircle, Clock, MapPin, Footprints, ShieldCheck, 
  QrCode as QrIcon, Sparkles, RefreshCw, Plus, ArrowRight,
  Check, Lock, Layers, AlertCircle, Phone
} from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';
import { broadcastBookingToVolunteers } from '../lib/volunteerEngine';

const translations = {
  en: {
    title: 'Smart Footwear Locker',
    subtitle: 'Free & Secure Temple Shoe Depository',
    tabDeposit: 'Deposit Footwear',
    tabMyTokens: 'My Tokens',
    devoteeName: 'Devotee / Family Head Name',
    namePlaceholder: 'Enter your name',
    phoneLabel: 'Contact Phone Number',
    phonePlaceholder: '10-digit mobile number',
    selectCounter: 'Select Shoe Counter Station',
    counterGate1: 'Gate #1 Main Entrance',
    counterGate2: 'Gate #2 Priority / East Ramp',
    counterExit: 'South Express Exit Gate',
    pairCountLabel: 'Number of Footwear Pairs',
    pair: 'Pair',
    pairs: 'Pairs',
    solo: '1 (Solo)',
    duo: '2 (Couple)',
    family: '4 (Family)',
    group: '6 (Group)',
    bus: '8+ (Yatra)',
    freeService: '100% Free Seva Facility by Mandir Trust',
    generateBtn: '🔑 Secure Deposit & Generate QR Token',
    generatingBtn: 'Assigning Locker Rack...',
    tokenActiveTitle: 'FOOTWEAR SECURED & CHECKED-IN',
    rackNumber: 'Assigned Locker Rack',
    showQrNotice: 'Show this scannable QR token to the Seva Volunteer at the shoe counter when returning to retrieve your footwear instantly.',
    retrieveBtn: '✅ Mark Retrieved / Take Shoes',
    retrievingConfirm: 'Confirm you have safely collected your footwear?',
    depositNewBtn: '+ Deposit Another Pair',
    closeBtn: 'Close Pass',
    noTokens: 'No active footwear tokens for today.',
    historyTitle: 'Recent Footwear Receipts',
    statusSecured: 'Deposited & Secured',
    statusRetrieved: 'Retrieved & Cleared',
    depositedAt: 'Deposited at',
    retrievedAt: 'Collected at',
  },
  hi: {
    title: 'स्मार्ट जूता-चप्पल लॉकर',
    subtitle: 'निःशुल्क एवं सुरक्षित जूता डिपॉजिट सेवा',
    tabDeposit: 'जूते जमा करें',
    tabMyTokens: 'मेरे टोकन',
    devoteeName: 'श्रद्धालु / परिवार प्रमुख का नाम',
    namePlaceholder: 'अपना नाम दर्ज करें',
    phoneLabel: 'संपर्क मोबाइल नंबर',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    selectCounter: 'जूता काउंटर स्टेशन चुनें',
    counterGate1: 'गेट #1 मुख्य प्रवेश द्वार',
    counterGate2: 'गेट #2 प्राथमिकता / पूर्व रैंप',
    counterExit: 'दक्षिण एक्सप्रेस निकास द्वार',
    pairCountLabel: 'जूता-चप्पल जोड़ियों की संख्या',
    pair: 'जोड़ी',
    pairs: 'जोड़ियां',
    solo: '1 (एकल)',
    duo: '2 (युगल)',
    family: '4 (परिवार)',
    group: '6 (समूह)',
    bus: '8+ (यात्रा संघ)',
    freeService: 'श्री मंदिर ट्रस्ट द्वारा 100% निःशुल्क सेवा',
    generateBtn: '🔑 जूते सुरक्षित जमा करें और QR टोकन पाएं',
    generatingBtn: 'लॉकर रैक आवंटित हो रहा है...',
    tokenActiveTitle: 'जूते सुरक्षित रूप से जमा हो चुके हैं',
    rackNumber: 'आवंटित लॉकर रैक नंबर',
    showQrNotice: 'दर्शन के उपरांत जूते वापस प्राप्त करते समय काउंटर पर सेवादार को यह QR कोड दिखाएं। शून्य प्रतीक्षा में जूते प्राप्त होंगे।',
    retrieveBtn: '✅ जूते वापस मिल गए / टोकन समाप्त करें',
    retrievingConfirm: 'क्या आपको अपने जूते सही सलामत प्राप्त हो गए हैं?',
    depositNewBtn: '+ नया जूता टोकन बनाएं',
    closeBtn: 'पास बंद करें',
    noTokens: 'आज के लिए कोई सक्रिय जूता टोकन नहीं है।',
    historyTitle: 'हाल की जूता लॉकर रसीदें',
    statusSecured: 'सुरक्षित जमा',
    statusRetrieved: 'वापस प्राप्त',
    depositedAt: 'जमा समय',
    retrievedAt: 'प्राप्त समय',
  },
  gu: {
    title: 'સ્માર્ટ પગરખાં / શૂઝ લૉકર',
    subtitle: 'મફત અને સુરક્ષિત પગરખાં ડિપોઝિટ સુવિધા',
    tabDeposit: 'પગરખાં જમા કરો',
    tabMyTokens: 'મારા ટોકન',
    devoteeName: 'યાત્રાળુ / મુખીનું નામ',
    namePlaceholder: 'તમારું નામ દાખલ કરો',
    phoneLabel: 'સંપર્ક મોબાઇલ નંબર',
    phonePlaceholder: '10 આંકડાનો મોબાઇલ નંબર',
    selectCounter: 'પગરખાં કાઉન્ટર પસંદ કરો',
    counterGate1: 'ગેટ #1 મુખ્ય પ્રવેશ દ્વાર',
    counterGate2: 'ગેટ #2 પ્રાથમિકતા / પૂર્વ રૅમ્પ',
    counterExit: 'દક્ષિણ એક્સપ્રેસ એક્ઝિટ ગેટ',
    pairCountLabel: 'પગરખાં જોડીઓની સંખ્યા',
    pair: 'જોડી',
    pairs: 'જોડીઓ',
    solo: '1 (એકલ)',
    duo: '2 (જોડી)',
    family: '4 (પરિવાર)',
    group: '6 (જૂથ)',
    bus: '8+ (યાત્રા)',
    freeService: 'શ્રી મંદિર ટ્રસ્ટ તરફથી 100% મફત સેવા',
    generateBtn: '🔑 પગરખાં જમા કરો અને QR ટોકન મેળવો',
    generatingBtn: 'લૉકર રૅક ફાળવાઈ રહી છે...',
    tokenActiveTitle: 'પગરખાં સુરક્ષિત જમા થયેલ છે',
    rackNumber: 'ફાળવેલ લૉકર રૅક નંબર',
    showQrNotice: 'દર્શન પછી પગરખાં પરત લેતી વખતે કાઉન્ટર પર સ્વયંસેવકને આ QR કોડ બતાવો. ઝડપથી પગરખાં મળી જશે.',
    retrieveBtn: '✅ પગરખાં મળી ગયા / પૂર્ણ કરો',
    retrievingConfirm: 'શું તમને તમારા પગરખાં સુરક્ષિત મળી ગયા છે?',
    depositNewBtn: '+ નવું પગરખાં ટોકન બનાવો',
    closeBtn: 'પાસ બંધ કરો',
    noTokens: 'આજ માટે કોઈ સક્રિય ટોકન નથી.',
    historyTitle: 'હાલની પગરખાં લૉકર રસીદો',
    statusSecured: 'સુરક્ષિત જમા',
    statusRetrieved: 'પરત મેળવેલ',
    depositedAt: 'જમા સમય',
    retrievedAt: 'મેળવેલ સમય',
  }
};

export const PilgrimFootwearModal = ({ isOpen, onClose, templeId = 'tmp_somnath' }) => {
  const { currentUser, issueFootwearToken } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const shrine = getTempleById(templeId) || { name: 'Somnath Temple' };

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
  }, [isOpen, currentUser]);

  const loadTokens = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      setTokenList(existing);
      const latestActive = existing.find(tok => tok.status === 'checked_in');
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
    setLoading(true);
    try {
      const shrinePrefix = templeId === 'tmp_dwarka' ? 'DWA' : templeId === 'tmp_ambaji' ? 'AMB' : templeId === 'tmp_pavagadh' ? 'PAV' : 'SOM';
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
        temple_id: templeId,
        temple_name: shrine.name,
        counter_station: stationNames[selectedStation] || t.counterGate1,
        pair_count: pairCount,
        status: 'checked_in',
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      // Save to AuthContext if available
      if (issueFootwearToken) {
        issueFootwearToken(tokenObj.pilgrim_name, tokenObj.pair_count);
      }

      const existingLocal = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      const updatedList = [tokenObj, ...existingLocal];
      localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify(updatedList));
      setTokenList(updatedList);

      // Create notification
      const footwearNotif = {
        id: `notif_fw_${Date.now()}`,
        user_id: currentUser?.id || '00000000-0000-4000-a000-000000000077',
        title: '👟 Footwear Locker Token Issued',
        message: `Locker Token #${tokenObj.token_id} issued for ${tokenObj.pair_count} pair(s) at ${tokenObj.rack_no} (${shrine.name}).`,
        type: 'footwear',
        is_read: false,
        created_at: new Date().toISOString()
      };

      const localNotifs = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
      localNotifs.unshift(footwearNotif);
      localStorage.setItem('nirvighna_notifications', JSON.stringify(localNotifs));
      window.dispatchEvent(new CustomEvent('nirvighna_notification_alert', { detail: footwearNotif }));

      // Broadcast to volunteers
      broadcastBookingToVolunteers({
        id: tokenObj.token_id,
        temple_id: templeId,
        temples: { name: shrine.name },
        total_pilgrims: tokenObj.pair_count,
        is_priority: selectedStation === 'gate2',
        gate_number: tokenObj.rack_no,
        pilgrim_phone: tokenObj.pilgrim_phone
      });

      setActiveToken(tokenObj);
      await generateQR(tokenObj.token_id);
      setActiveTab('tokens');
      setSuccessToast('🎉 Footwear token generated successfully!');
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
        if (tok.token_id === tokenToRetrieve.token_id) {
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

      const nextActive = updated.find(tok => tok.status === 'checked_in');
      if (nextActive) {
        setActiveToken(nextActive);
        generateQR(nextActive.token_id);
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999] p-3 sm:p-4 animate-in fade-in select-none font-body">
      <div className="bg-white border-2 border-gold/40 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden text-gray-900 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-maroon text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold/40 relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-sm shrink-0">
              <Footprints className="w-6 h-6" />
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

        {/* Tab Switcher */}
        <div className="bg-[#FAF7F2] p-2 border-b border-gold/20 flex gap-2">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'deposit'
                ? 'bg-maroon text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gold/50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t.tabDeposit}</span>
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
            {tokenList.filter(t => t.status === 'checked_in').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-1.5 right-2" />
            )}
          </button>
        </div>

        {/* Toast Notification */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-extrabold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: DEPOSIT FOOTWEAR FORM */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleIssueToken} className="space-y-4">
              
              {/* Trust Badge Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-gold/15 to-amber-500/10 p-3 rounded-2xl border border-gold/40 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-maroon shrink-0" />
                <p className="text-xs font-bold text-maroon">
                  {t.freeService}
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

              {/* Shoe Counter Location Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block font-heading">
                  {t.selectCounter}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'gate1', label: t.counterGate1, desc: 'Main Rajgopuram Entry' },
                    { id: 'gate2', label: t.counterGate2, desc: 'Priority / Accessible Gate' },
                    { id: 'exit', label: t.counterExit, desc: 'Express Exit Corridor' },
                  ].map((station) => (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => setSelectedStation(station.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedStation === station.id
                          ? 'bg-amber-50 border-maroon text-maroon font-bold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${selectedStation === station.id ? 'text-maroon' : 'text-gray-400'}`} />
                        <div>
                          <p className="text-xs font-bold">{station.label}</p>
                          <p className="text-[10px] text-gray-500 font-normal">{station.desc}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedStation === station.id ? 'border-maroon bg-maroon' : 'border-gray-300'
                      }`}>
                        {selectedStation === station.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Footwear Pairs Stepper */}
              <div className="space-y-2 bg-[#FAF7F2] p-3.5 rounded-2xl border border-gold/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-800 font-heading">
                    {t.pairCountLabel}
                  </label>
                  <span className="text-xs font-black text-maroon bg-amber-100 px-3 py-0.5 rounded-full border border-gold/40">
                    {pairCount} {pairCount === 1 ? t.pair : t.pairs}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPairCount(prev => Math.max(1, prev - 1))}
                    className="w-11 h-11 rounded-xl bg-white border border-gray-300 text-maroon font-black text-xl hover:bg-gray-100 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center py-2 bg-white border-2 border-gold rounded-xl shadow-xs">
                    <span className="text-xl font-black font-mono text-indigo-dark">
                      {pairCount}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">
                      {pairCount === 1 ? t.pair : t.pairs}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPairCount(prev => Math.min(50, prev + 1))}
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
                    { count: 8, label: t.bus },
                  ].map((preset) => (
                    <button
                      key={preset.count}
                      type="button"
                      onClick={() => setPairCount(preset.count)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border text-center cursor-pointer ${
                        pairCount === preset.count
                          ? 'bg-maroon text-white border-maroon shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gold'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !pilgrimName.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-gold-dark hover:to-gold text-indigo-dark font-black text-xs sm:text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.generatingBtn}</span>
                  </>
                ) : (
                  <>
                    <span>{t.generateBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: ACTIVE TOKENS & DIGITAL PASS CARD */}
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              
              {activeToken ? (
                <div className="space-y-4">
                  {/* Digital Locker Card */}
                  <div className="bg-gradient-to-b from-[#FAF7F2] to-white p-5 rounded-3xl border-2 border-gold shadow-warm text-center space-y-4 relative overflow-hidden">
                    
                    {/* Status Pill */}
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        {t.tokenActiveTitle}
                      </span>
                      <span className="font-mono text-xs text-maroon font-extrabold bg-maroon/10 px-2 py-0.5 rounded-lg border border-maroon/20">
                        #{activeToken.token_id}
                      </span>
                    </div>

                    {/* Assigned Rack Banner */}
                    <div className="bg-gradient-to-r from-maroon to-[#5A141E] text-white py-3 px-4 rounded-2xl shadow-md border border-gold/40 space-y-0.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 font-heading">
                        {t.rackNumber}
                      </p>
                      <p className="text-3xl font-black font-mono tracking-widest text-gold drop-shadow-sm">
                        {activeToken.rack_no}
                      </p>
                    </div>

                    {/* Crisp Scannable QR Code */}
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-md border-2 border-gold mx-auto">
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="Footwear QR Token" className="w-48 h-48 mx-auto object-contain" />
                      ) : (
                        <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                          <QrIcon className="w-12 h-12 text-maroon animate-pulse" />
                        </div>
                      )}
                      <p className="text-[10px] font-mono font-bold text-gray-500 mt-1">
                        SCAN AT SHOE COUNTER
                      </p>
                    </div>

                    {/* Devotee Summary Details */}
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-gray-800 space-y-1.5 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Devotee:</span>
                        <span className="font-bold text-gray-900">{activeToken.pilgrim_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Quantity:</span>
                        <span className="font-extrabold text-maroon">{activeToken.pair_count} {activeToken.pair_count === 1 ? t.pair : t.pairs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Counter:</span>
                        <span className="font-bold text-indigo-dark">{activeToken.counter_station || t.counterGate1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">{t.depositedAt}:</span>
                        <span className="font-mono text-gray-700 font-semibold">{activeToken.time_formatted || 'Today'}</span>
                      </div>
                    </div>

                    {/* Notice */}
                    <p className="text-xs text-amber-900 bg-amber-100/70 p-3 rounded-xl border border-amber-300 font-medium text-left leading-relaxed">
                      💡 {t.showQrNotice}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => handleRetrieveToken(activeToken)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.retrieveBtn}</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveTab('deposit')}
                          className="flex-1 py-2.5 bg-[#FAF7F2] hover:bg-gray-100 text-maroon font-bold text-xs rounded-xl border border-maroon/30 transition-colors cursor-pointer font-heading flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.depositNewBtn}</span>
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
                </div>
              ) : (
                <div className="text-center py-8 space-y-3 bg-[#FAF7F2] p-6 rounded-3xl border border-gray-200">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-maroon flex items-center justify-center mx-auto">
                    <Footprints className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 font-heading">
                    {t.noTokens}
                  </p>
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="px-5 py-2.5 bg-maroon text-white font-bold text-xs rounded-xl shadow-md hover:bg-maroon-dark transition-all cursor-pointer font-heading inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.tabDeposit}</span>
                  </button>
                </div>
              )}

              {/* Recent History List */}
              {tokenList.length > 1 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-gray-600 font-heading uppercase tracking-wider px-1">
                    {t.historyTitle}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tokenList.map((tok, idx) => (
                      <div
                        key={tok.token_id || idx}
                        onClick={() => {
                          setActiveToken(tok);
                          generateQR(tok.token_id || tok.id);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          tok.token_id === activeToken?.token_id
                            ? 'bg-amber-50 border-maroon shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gold/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            tok.status === 'checked_in' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            👟
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-gray-900">{tok.rack_no}</span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                tok.status === 'checked_in'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {tok.status === 'checked_in' ? t.statusSecured : t.statusRetrieved}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {tok.pair_count} {tok.pair_count === 1 ? t.pair : t.pairs} • {tok.time_formatted || 'Today'}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
