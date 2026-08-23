import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { prasadQueueEngine } from '../lib/prasadQueueEngine';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Utensils, Clock, CheckCircle, AlertCircle, X, Loader2, Sparkles, 
  MapPin, Plus, ShieldCheck, ArrowRight, User, Phone,
  CreditCard, Banknote, Shield, Check, ChevronRight, RefreshCw, ShoppingBag
} from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';
import { sendPilgrimNotification } from '../lib/notificationService';

const translations = {
  en: {
    title: 'Pavitra Mahaprasad Seva',
    subtitle: 'Sacred Temple Annakshetra & Mahaprasad Counter',
    servingNow: 'Now Serving:',
    devoteeName: 'Devotee / Family Head Name',
    namePlaceholder: 'Enter your full name',
    phoneLabel: 'Mobile Phone Number',
    phonePlaceholder: '10-digit mobile number',
    prasadTypeLabel: 'Choose Mahaprasad Seva',
    freeThali: 'Pavitra Mahaprasad Meal Thali',
    freeThaliSub: '100% Free seated dining at Annakshetra',
    ladduBox: 'Special Kesar Laddu Box (250g)',
    ladduBoxSub: 'Pure Desi Ghee consecrated laddu pack',
    panchamritPack: 'Dry Fruit Panchamrit Bhog Pack',
    panchamritSub: 'Blessed sacred Panchamrit & Dry Fruits',
    premiumBox: 'Shri Mandir Mahaprasad Box (500g)',
    premiumSub: 'Royal bhog gift box with sacred chunri',
    headcountLabel: 'Devotees / Thalis Count',
    quantityLabel: 'Quantity (Boxes / Packs)',
    person: 'Person',
    people: 'Devotees',
    selectHall: 'Select Annakshetra Dining Hall',
    hallMain: 'Hall #1: Main Annakshetra (Ground Floor)',
    hallFamily: 'Hall #2: Family & Senior Citizen Dining',
    freeSeva: '100% Free Seva Facility by Mandir Trust',
    getTokenBtn: '🍲 Get Free Mahaprasad Pass (₹0)',
    payAndBookBtn: '💳 Pay & Confirm Prasad Pass',
    payAtCounterBtn: '🪙 Book Pass • Pay at Counter',
    generatingBtn: 'Generating Secure Token...',
    processingPayment: 'Processing Secure Payment...',
    bookedSuccessTitle: '🎉 Mahaprasad Pass Confirmed!',
    bookedSuccessDesc: 'Your pass is saved. You can view, download, and scan your digital QR pass anytime in My Bookings.',
    viewInMyBookings: '🎫 View in My Bookings →',
    bookAnotherBtn: '+ Book Another Prasad',
    closeBtn: 'Close',
    paymentModeLabel: 'Select Payment Method',
    payOnline: 'Online Payment (Instant UPI / GPay / Card)',
    payAtCounter: 'Pay at Counter (Cash / UPI on Collection)',
    orderSummary: 'Order & Payment Summary',
    itemPrice: 'Price per item',
    totalAmount: 'Total Payable Amount',
    platformFee: 'Mandir Seva Convenience',
    freeBadge: '100% FREE',
    paidBadge: 'PAID ONLINE',
    payCounterBadge: 'PAY AT COUNTER'
  },
  hi: {
    title: 'पवित्र महाप्रसाद सेवा',
    subtitle: 'निःशुल्क मंदिर अन्नक्षेत्र एवं महाप्रसाद काउंटर',
    servingNow: 'वर्तमान चालू टोकन:',
    devoteeName: 'श्रद्धालु / परिवार प्रमुख का नाम',
    namePlaceholder: 'अपना पूरा नाम दर्ज करें',
    phoneLabel: 'मोबाइल नंबर',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    prasadTypeLabel: 'महाप्रसाद सेवा चुनें',
    freeThali: 'पवित्र महाप्रसाद भोजन थाली',
    freeThaliSub: 'अन्नक्षेत्र में बैठकर 100% निःशुल्क भोजन',
    ladduBox: 'विशेष केसर लड्डू डिब्बा (250 ग्राम)',
    ladduBoxSub: 'शुद्ध देशी घी का पवित्र भोग लड्डू पैक',
    panchamritPack: 'पंचामृत एवं मेवा भोग पैक',
    panchamritSub: 'पवित्र पंचामृत एवं सूखे मेवे का प्रसाद',
    premiumBox: 'श्री मंदिर महाप्रसाद डिब्बा (500 ग्राम)',
    premiumSub: 'शाही भोग डिब्बा एवं रक्षा सूत्र',
    headcountLabel: 'श्रद्धालुओं / थालियों की संख्या',
    quantityLabel: 'मात्रा (डिब्बे / पैकेट)',
    person: 'व्यक्ति',
    people: 'श्रद्धालु',
    selectHall: 'अन्नक्षेत्र भोजन हॉल चुनें',
    hallMain: 'हॉल #1: मुख्य अन्नक्षेत्र हॉल (भू-तल)',
    hallFamily: 'हॉल #2: परिवार एवं वरिष्ठ नागरिक हॉल',
    freeSeva: 'श्री मंदिर ट्रस्ट द्वारा 100% निःशुल्क अन्नक्षेत्र सेवा',
    getTokenBtn: '🍲 निःशुल्क महाप्रसाद पास पाएं (₹0)',
    payAndBookBtn: '💳 भुगतान करें एवं पास प्राप्त करें',
    payAtCounterBtn: '🪙 पास बुक करें • काउंटर पर भुगतान करें',
    generatingBtn: 'डिजिटल टोकन तैयार हो रहा है...',
    processingPayment: 'सुरक्षित भुगतान हो रहा है...',
    bookedSuccessTitle: '🎉 महाप्रसाद पास कन्फर्म हो गया!',
    bookedSuccessDesc: 'आपका पास सुरक्षित सेव हो गया है। आप इसे "मेरी बुकिंग" में देख और QR स्कैन करवा सकते हैं।',
    viewInMyBookings: '🎫 मेरी बुकिंग में पास देखें →',
    bookAnotherBtn: '+ दूसरा प्रसाद बुक करें',
    closeBtn: 'बंद करें',
    paymentModeLabel: 'भुगतान का तरीका चुनें',
    payOnline: 'ऑनलाइन भुगतान (तुरंत UPI / गूगल पे / कार्ड)',
    payAtCounter: 'काउंटर पर भुगतान (प्रसाद लेते समय नकद/UPI)',
    orderSummary: 'ऑर्डर एवं भुगतान विवरण',
    itemPrice: 'प्रति डिब्बा मूल्य',
    totalAmount: 'कुल देय राशि',
    platformFee: 'मंदिर सेवा शुल्क',
    freeBadge: '100% निःशुल्क',
    paidBadge: 'ऑनलाइन भुगतान सफल',
    payCounterBadge: 'काउंटर पर देय'
  },
  gu: {
    title: 'પવિત્ર મહાપ્રસાદ સેવા',
    subtitle: 'મફત મંદિર અન્નક્ષેત્ર અને મહાપ્રસાદ કાઉન્ટર',
    servingNow: 'હાલમાં ચાલુ નંબર:',
    devoteeName: 'યાત્રાળુ / મુખીનું નામ',
    namePlaceholder: 'તમારું પૂરું નામ દાખલ કરો',
    phoneLabel: 'મોબાઇલ નંબર',
    phonePlaceholder: '10 આંકડાનો મોબાઇલ નંબર',
    prasadTypeLabel: 'મહાપ્રસાદ સેવા પસંદ કરો',
    freeThali: 'પવિત્ર મહાપ્રસાદ ભોજન થાળી',
    freeThaliSub: 'અન્નક્ષેત્રમાં બેસીને 100% મફત ભોજન',
    ladduBox: 'સ્પેશિયલ કેસર લાડુ બોક્સ (250 ગ્રામ)',
    ladduBoxSub: 'શુદ્ધ દેશી ઘીનો પવિત્ર ભોગ લાડુ પેક',
    panchamritPack: 'પંચામૃત અને સુકા મેવા ભોગ પેક',
    panchamritSub: 'પવિત્ર પંચામૃત અને સુકા મેવાનો પ્રસાદ',
    premiumBox: 'શ્રી મંદિર મહાપ્રસાદ બોક્સ (500 ગ્રામ)',
    premiumSub: 'શાહી ભોગ બોક્સ અને રક્ષા ચૂંદડી',
    headcountLabel: 'યાત્રાળુઓ / થાળીઓની સંખ્યા',
    quantityLabel: 'સંખ્યા (બોક્સ / પેકેટ)',
    person: 'વ્યક્તિ',
    people: 'યાત્રાળુઓ',
    selectHall: 'અન્નક્ષેત્ર ડાઇનિંગ હૉલ પસંદ કરો',
    hallMain: 'હૉલ #1: મુખ્ય અન્નક્ષેત્ર હૉલ (ગ્રાઉન્ડ ફ્લોર)',
    hallFamily: 'હૉલ #2: પરિવાર અને વરિષ્ઠ નાગરિક હૉલ',
    freeSeva: 'શ્રી મંદિર ટ્રસ્ટ તરફથી 100% મફત અન્નક્ષેત્ર સેવા',
    getTokenBtn: '🍲 મફત મહાપ્રસાદ પાસ મેળવો (₹0)',
    payAndBookBtn: '💳 પેમેન્ટ કરો અને પાસ મેળવો',
    payAtCounterBtn: '🪙 પાસ બુક કરો • કાઉન્ટર પર પેમેન્ટ કરો',
    generatingBtn: 'ડિજિટલ ટોકન બની રહ્યું છે...',
    processingPayment: 'સુરક્ષિત પેમેન્ટ પ્રોસેસિંગ...',
    bookedSuccessTitle: '🎉 મહાપ્રસાદ પાસ કન્ફર્મ થઈ ગયો!',
    bookedSuccessDesc: 'તમારો પાસ સેવ થઈ ગયો છે. તમે "મારી બુકિંગ" પેજ પર તમારો QR પાસ જોઈ શકો છો.',
    viewInMyBookings: '🎫 મારી બુકિંગમાં પાસ જુઓ →',
    bookAnotherBtn: '+ બીજો પ્રસાદ બુક કરો',
    closeBtn: 'બંધ કરો',
    paymentModeLabel: 'પેમેન્ટ કરવાની રીત પસંદ કરો',
    payOnline: 'ઓનલાઇન પેમેન્ટ (તાત્કાલિક UPI / GPay / કાર્ડ)',
    payAtCounter: 'કાઉન્ટર પર પેમેન્ટ (પ્રસાદ લેતી વખતે રોકડ/UPI)',
    orderSummary: 'ઓર્ડર અને પેમેન્ટ વિગત',
    itemPrice: 'પ્રતિ બોક્સ કિંમત',
    totalAmount: 'કુલ ચૂકવવાપાત્ર રકમ',
    platformFee: 'મંદિર સેવા શુલ્ક',
    freeBadge: '100% મફત',
    paidBadge: 'ઓનલાઇન ચૂકવણી સફળ',
    payCounterBadge: 'કાઉન્ટર પર ચૂકવવાપાત્ર'
  }
};

const MASTER_TEMPLES = [
  { id: 'tmp_somnath', icon: '🔱', name: { en: 'Somnath', hi: 'सोमनाथ', gu: 'સોમનાથ' }, full: { en: 'Shri Somnath Jyotirlinga', hi: 'श्री सोमनाथ ज्योतिर्लिंग', gu: 'શ્રી સોમનાથ જ્યોતિર્લિંગ' } },
  { id: 'tmp_dwarka', icon: '🦚', name: { en: 'Dwarka', hi: 'द्वारका', gu: 'દ્વારકા' }, full: { en: 'Shri Dwarkadhish Mandir', hi: 'श्री द्वारकाधीश मंदिर', gu: 'શ્રી દ્વારકાધીશ મંદિર' } },
  { id: 'tmp_ambaji', icon: '🌸', name: { en: 'Ambaji', hi: 'अंबाजी', gu: 'અંબાજી' }, full: { en: 'Shri Arasuri Ambaji Temple', hi: 'श्री अंबाजी माता मंदिर', gu: 'શ્રી આરાસુરી અંબાજી મંદિર' } },
  { id: 'tmp_pavagadh', icon: '🚩', name: { en: 'Pavagadh', hi: 'पावागढ़', gu: 'પાવાગઢ' }, full: { en: 'Shri Kalika Mata Temple, Pavagadh', hi: 'श्री कालिका माता मंदिर, पावागढ़', gu: 'શ્રી કાલિકા माता मंदिर, પાવાગઢ' } },
];

const PRASAD_OFFERINGS = [
  {
    id: 'free_thali',
    icon: '🍲',
    price: 0,
    titleKey: 'freeThali',
    subKey: 'freeThaliSub',
    isFree: true,
  },
  {
    id: 'laddu_box',
    icon: '🎁',
    price: 51,
    titleKey: 'ladduBox',
    subKey: 'ladduBoxSub',
    isFree: false,
  },
  {
    id: 'panchamrit_pack',
    icon: '🥥',
    price: 101,
    titleKey: 'panchamritPack',
    subKey: 'panchamritSub',
    isFree: false,
  },
  {
    id: 'premium_box',
    icon: '🍯',
    price: 151,
    titleKey: 'premiumBox',
    subKey: 'premiumSub',
    isFree: false,
  },
];

export const PrasadQueueModal = ({ isOpen = true, templeId = 'tmp_somnath', templeName = 'Somnath Temple', onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  
  const [activeTempleId, setActiveTempleId] = useState(templeId || 'tmp_somnath');
  const currentTempleObj = MASTER_TEMPLES.find(t => t.id === activeTempleId) || MASTER_TEMPLES[0];
  const shrineDisplayName = currentTempleObj.full[currentLanguage] || currentTempleObj.full.en;

  const [counterStatus, setCounterStatus] = useState({ current_serving_token: 142, avg_serve_time_seconds: 60 });
  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [pilgrimPhone, setPilgrimPhone] = useState(currentUser?.phone || '');
  
  const [selectedOfferingId, setSelectedOfferingId] = useState('free_thali');
  const [headcount, setHeadcount] = useState(2);
  const [quantity, setQuantity] = useState(1);
  const [selectedHall, setSelectedHall] = useState('hall1');
  const [paymentMode, setPaymentMode] = useState('online');

  const [lastIssuedToken, setLastIssuedToken] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const scrollContainerRef = useRef(null);

  const selectedOffering = PRASAD_OFFERINGS.find(o => o.id === selectedOfferingId) || PRASAD_OFFERINGS[0];
  const isFree = selectedOffering.isFree;
  const unitPrice = selectedOffering.price;
  const currentCount = isFree ? headcount : quantity;
  const totalPayableAmount = isFree ? 0 : unitPrice * currentCount;

  useEffect(() => {
    fetchStatus();

    if (currentUser?.full_name && pilgrimName === 'Pilgrim Devotee') {
      setPilgrimName(currentUser.full_name);
    }
    if (currentUser?.phone && !pilgrimPhone) {
      setPilgrimPhone(currentUser.phone);
    }

    const handleCounterUpdate = (e) => {
      if (e.detail && (!e.detail.templeId || e.detail.templeId === activeTempleId)) {
        setCounterStatus(e.detail.counter);
      }
    };

    window.addEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);

    return () => {
      window.removeEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
    };
  }, [activeTempleId, currentUser]);

  const fetchStatus = async () => {
    const status = await prasadQueueEngine.fetchCounterStatus(activeTempleId);
    setCounterStatus(status);
  };

  const handleBookPrasad = async (e) => {
    if (e) e.preventDefault();
    if (!pilgrimName.trim()) return;

    if (!isFree && paymentMode === 'online') {
      setPaymentProcessing(true);
      await new Promise(r => setTimeout(r, 1200));
      setPaymentProcessing(false);
    }

    setIssuing(true);
    try {
      const token = await prasadQueueEngine.issuePrasadToken(null, activeTempleId);
      
      const hallNames = {
        hall1: t.hallMain,
        hall2: t.hallFamily
      };

      const enrichedToken = {
        ...token,
        token_id: `PRS-${activeTempleId}-${token.token_number}`,
        id: `PRS-${activeTempleId}-${token.token_number}`,
        type: 'prasad',
        pilgrim_name: pilgrimName.trim() || currentUser?.full_name || 'Pilgrim Devotee',
        pilgrim_phone: pilgrimPhone.trim() || currentUser?.phone || '',
        prasad_type: selectedOffering.id,
        prasad_label: t[selectedOffering.titleKey] || selectedOffering.id,
        prasad_icon: selectedOffering.icon,
        is_free: isFree,
        unit_price: unitPrice,
        quantity: currentCount,
        headcount: currentCount,
        total_amount: totalPayableAmount,
        payment_status: isFree ? 'FREE' : (paymentMode === 'online' ? 'PAID' : 'PAY_AT_COUNTER'),
        payment_mode: isFree ? 'N/A' : (paymentMode === 'online' ? 'UPI / Online' : 'Cash on Collection'),
        dining_hall: isFree ? (hallNames[selectedHall] || t.hallMain) : 'Prasad Express Counter #3',
        temple_id: activeTempleId,
        temple_name: shrineDisplayName,
        temples: {
          name: shrineDisplayName,
          location: isFree ? (hallNames[selectedHall] || t.hallMain) : 'Prasad Express Counter #3'
        },
        created_at: new Date().toISOString(),
        issued_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      // Save token to single key and list in localStorage
      localStorage.setItem(`nirvighna_prasad_token_${activeTempleId}`, JSON.stringify(enrichedToken));
      const existingList = JSON.parse(localStorage.getItem('nirvighna_prasad_tokens_list') || '[]');
      const updatedList = [enrichedToken, ...existingList.filter(t => t.token_id !== enrichedToken.token_id)];
      localStorage.setItem('nirvighna_prasad_tokens_list', JSON.stringify(updatedList));

      // Universal Notification
      await sendPilgrimNotification({
        type: 'gate_info',
        title: '🍲 Mahaprasad Pass Confirmed!',
        message: `Pass #${token.token_number} (${enrichedToken.prasad_label} × ${currentCount}) is ready in My Bookings.`,
        templeId: activeTempleId
      });

      setLastIssuedToken(enrichedToken);
    } catch (err) {
      alert('Could not issue token: ' + err.message);
    } finally {
      setIssuing(false);
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
              🍲
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white font-heading uppercase tracking-wide flex items-center gap-2">
                <span>{t.title}</span>
                <span className="text-[10px] bg-gold/30 text-amber-200 font-mono font-extrabold px-2 py-0.5 rounded-full border border-gold/40">
                  {isFree ? '100% FREE' : 'PRASAD SEVA'}
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

        {/* 4-Temple Interactive Selector Bar & Live Queue Status */}
        <div className="bg-[#FAF7F2] px-3.5 py-2.5 border-b border-gold/25 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-maroon font-heading shrink-0 mr-1">
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

          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-black">
              Serving: #{counterStatus.current_serving_token}
            </span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 pb-8">
          
          {/* SUCCESS CONFIRMATION OVERLAY IF JUST BOOKED */}
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
                  <span className="font-mono text-base font-black text-maroon">#{lastIssuedToken.token_number}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Service:</span>
                  <span className="font-bold text-gray-900">{lastIssuedToken.prasad_label}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Quantity / Devotees:</span>
                  <span className="font-bold text-gray-900">{lastIssuedToken.quantity || lastIssuedToken.headcount} Devotee(s)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Payment Status:</span>
                  <span className={`font-mono font-black px-2 py-0.5 rounded-lg text-[10px] ${
                    lastIssuedToken.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                    lastIssuedToken.payment_status === 'PAY_AT_COUNTER' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {lastIssuedToken.payment_status === 'PAID' ? `PAID: ₹${lastIssuedToken.total_amount}` :
                     lastIssuedToken.payment_status === 'PAY_AT_COUNTER' ? `PAY AT COUNTER: ₹${lastIssuedToken.total_amount}` :
                     '100% FREE SEVA'}
                  </span>
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
                    {t.bookAnotherBtn}
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
            /* BOOKING FORM */
            <form onSubmit={handleBookPrasad} className="space-y-4">
              
              {/* Devotee Information Card */}
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

              {/* Prasad Seva Selection Options */}
              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase text-maroon font-heading block pl-0.5">
                  {t.prasadTypeLabel}
                </label>

                <div className="space-y-2">
                  {PRASAD_OFFERINGS.map((offering) => {
                    const isSelected = selectedOfferingId === offering.id;
                    return (
                      <div
                        key={offering.id}
                        onClick={() => setSelectedOfferingId(offering.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-50/80 border-gold shadow-goldGlow'
                            : 'bg-white border-gray-200 hover:border-gold/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            isSelected ? 'bg-gold/30 border border-gold' : 'bg-gray-100 border border-gray-200'
                          }`}>
                            {offering.icon}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900 font-heading">
                              {t[offering.titleKey]}
                            </p>
                            <p className="text-[11px] text-gray-500 font-medium">
                              {t[offering.subKey]}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {offering.isFree ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                              FREE (₹0)
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-maroon text-white font-mono shadow-xs">
                              ₹{offering.price}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity / Devotee Count Stepper */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-gold/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black uppercase text-gray-800 font-heading block">
                      {isFree ? t.headcountLabel : t.quantityLabel}
                    </label>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {isFree ? 'Seated Dining Thalis' : 'Pre-packed Takeaway Boxes'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isFree) setHeadcount(prev => Math.max(1, prev - 1));
                        else setQuantity(prev => Math.max(1, prev - 1));
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-300 hover:border-maroon text-maroon font-black text-base flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="font-mono text-sm font-black text-maroon min-w-[60px] text-center bg-white px-2 py-1 rounded-lg border border-gold/40">
                      {currentCount} {isFree ? (currentCount === 1 ? t.person : t.people) : 'Units'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isFree) setHeadcount(prev => Math.min(30, prev + 1));
                        else setQuantity(prev => Math.min(20, prev + 1));
                      }}
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
                      onClick={() => {
                        if (isFree) setHeadcount(num);
                        else setQuantity(num);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-extrabold transition-all border text-center cursor-pointer font-heading ${
                        currentCount === num
                          ? 'bg-maroon text-white border-maroon shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gold'
                      }`}
                    >
                      {num} {isFree ? (num === 1 ? 'Solo' : num === 2 ? 'Couple' : num === 4 ? 'Family' : 'Group') : 'Boxes'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Thali Dining Location */}
              {isFree && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2.5">
                  <label className="text-xs font-black uppercase text-gray-800 font-heading block">
                    {t.selectHall}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'hall1', label: t.hallMain, icon: '🏛️' },
                      { id: 'hall2', label: t.hallFamily, icon: '👨‍👩‍👧‍👦' },
                    ].map((hall) => (
                      <button
                        key={hall.id}
                        type="button"
                        onClick={() => setSelectedHall(hall.id)}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          selectedHall === hall.id
                            ? 'bg-amber-50 border-gold text-indigo-dark font-extrabold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gold/50'
                        }`}
                      >
                        <div className="text-sm mb-0.5">{hall.icon}</div>
                        <p className="text-xs leading-snug">{hall.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Paid Prasad Payment Breakdown & Method */}
              {!isFree && (
                <div className="space-y-3 animate-in fade-in">
                  
                  {/* Order & Payment Summary Box */}
                  <div className="bg-gradient-to-br from-[#1C0D29] via-[#2D163F] to-[#1C0D29] text-white p-4 rounded-2xl border-2 border-gold/50 shadow-md space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-gold font-heading border-b border-gold/20 pb-2">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t.orderSummary}</span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-200">
                      <span>{t[selectedOffering.titleKey]} ({quantity}x)</span>
                      <span className="font-mono font-bold">₹{unitPrice} × {quantity} = ₹{totalPayableAmount}</span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-200">
                      <span>{t.platformFee}</span>
                      <span className="font-mono text-emerald-400 font-bold">₹0 (Waived)</span>
                    </div>

                    <div className="flex justify-between text-sm font-black text-gold border-t border-gold/30 pt-2 font-heading">
                      <span>{t.totalAmount}:</span>
                      <span className="font-mono text-base text-amber-300">₹{totalPayableAmount}</span>
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="bg-white p-4 rounded-2xl border border-gold/30 shadow-xs space-y-2.5">
                    <label className="text-xs font-black uppercase text-maroon font-heading block">
                      {t.paymentModeLabel}
                    </label>

                    <div className="space-y-2">
                      <label className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        paymentMode === 'online' ? 'bg-amber-50 border-gold text-indigo-dark font-extrabold' : 'bg-white border-gray-200 text-gray-700'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="prasad_payment_mode"
                            checked={paymentMode === 'online'}
                            onChange={() => setPaymentMode('online')}
                            className="w-4 h-4 text-maroon"
                          />
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs">{t.payOnline}</span>
                        </div>
                        <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          INSTANT
                        </span>
                      </label>

                      <label className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        paymentMode === 'counter' ? 'bg-amber-50 border-gold text-indigo-dark font-extrabold' : 'bg-white border-gray-200 text-gray-700'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="prasad_payment_mode"
                            checked={paymentMode === 'counter'}
                            onChange={() => setPaymentMode('counter')}
                            className="w-4 h-4 text-maroon"
                          />
                          <Banknote className="w-4 h-4 text-amber-600" />
                          <span className="text-xs">{t.payAtCounter}</span>
                        </div>
                        <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          PAY ON PICKUP
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit / Pay Button */}
              <button
                type="submit"
                disabled={issuing || paymentProcessing || !pilgrimName.trim()}
                className="w-full py-4 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-[0.99] disabled:opacity-60"
              >
                {paymentProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.processingPayment}</span>
                  </>
                ) : issuing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t.generatingBtn}</span>
                  </>
                ) : isFree ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-indigo-dark" />
                    <span>{t.getTokenBtn}</span>
                  </>
                ) : paymentMode === 'online' ? (
                  <>
                    <CreditCard className="w-5 h-5 text-indigo-dark" />
                    <span>{t.payAndBookBtn} (₹{totalPayableAmount})</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-5 h-5 text-indigo-dark" />
                    <span>{t.payAtCounterBtn} (₹{totalPayableAmount})</span>
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

export default PrasadQueueModal;
