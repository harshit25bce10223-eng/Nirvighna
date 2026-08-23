import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { prasadQueueEngine } from '../lib/prasadQueueEngine';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Utensils, Clock, CheckCircle, AlertCircle, X, Loader2, Sparkles, 
  MapPin, Plus, QrCode as QrIcon, ShieldCheck, ArrowRight, User, Phone,
  CreditCard, Banknote, Shield, Check, ChevronRight, RefreshCw, ShoppingBag
} from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';
import { sendPilgrimNotification } from '../lib/notificationService';

const translations = {
  en: {
    title: 'Pavitra Mahaprasad Seva',
    subtitle: 'Sacred Temple Annakshetra & Mahaprasad Counter',
    tabGetToken: 'Book Mahaprasad',
    tabMyTokens: 'My Digital Pass',
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
    digitalPassTitle: 'DIGITAL MAHA PRASAD PASS',
    tokenNumber: 'Queue Token Number',
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
    getAnotherBtn: '+ Book Another Prasad',
    closeBtn: 'Close Pass',
    noTokens: 'No active prasad passes found for today.',
    historyTitle: 'Recent Prasad Passes',
    statusInQueue: 'In Queue',
    statusServed: 'Served & Collected',
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
    tabGetToken: 'महाप्रसाद बुक करें',
    tabMyTokens: 'मेरा डिजिटल पास',
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
    digitalPassTitle: 'डिजिटल महाप्रसाद टोकन पास',
    tokenNumber: 'कतार टोकन नंबर',
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
    showQrNotice: 'अन्नक्षेत्र में प्रवेश करते समय यह QR कोड काउंटर पर दिखाएं और ताजा महाप्रसाद प्राप्त करें।',
    markServedBtn: '✅ प्रसाद प्राप्त कर लिया / पूर्ण करें',
    confirmCollect: 'क्या आपको आपका महाप्रसाद प्राप्त हो गया है?',
    getAnotherBtn: '+ नया प्रसाद पास बनाएं',
    closeBtn: 'पास बंद करें',
    noTokens: 'आज के लिए कोई सक्रिय प्रसाद पास नहीं है।',
    historyTitle: 'हाल के प्रसाद पास',
    statusInQueue: 'कतार में',
    statusServed: 'प्राप्त कर लिया',
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
    tabGetToken: 'મહાપ્રસાદ બુક કરો',
    tabMyTokens: 'મારો ડિજિટલ પાસ',
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
    digitalPassTitle: 'ડિજિટલ મહાપ્રસાદ ટોકન પાસ',
    tokenNumber: 'લાઇન ટોકન નંબર',
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
    getAnotherBtn: '+ નવો પ્રસાદ પાસ બનાવો',
    closeBtn: 'પાસ બંધ કરો',
    noTokens: 'આજ માટે કોઈ સક્રિય પ્રસાદ પાસ નથી.',
    historyTitle: 'હાલના પ્રસાદ પાસ',
    statusInQueue: 'લાઇનમાં',
    statusServed: 'મેળવી લીધેલ',
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
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  
  const [activeTempleId, setActiveTempleId] = useState(templeId || 'tmp_somnath');
  const currentTempleObj = MASTER_TEMPLES.find(t => t.id === activeTempleId) || MASTER_TEMPLES[0];
  const shrineDisplayName = currentTempleObj.full[currentLanguage] || currentTempleObj.full.en;

  const [activeTab, setActiveTab] = useState('get_token'); // 'get_token' | 'tokens'
  const [counterStatus, setCounterStatus] = useState({ current_serving_token: 142, avg_serve_time_seconds: 60 });
  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [pilgrimPhone, setPilgrimPhone] = useState(currentUser?.phone || '');
  
  const [selectedOfferingId, setSelectedOfferingId] = useState('free_thali');
  const [headcount, setHeadcount] = useState(2);
  const [quantity, setQuantity] = useState(1);
  const [selectedHall, setSelectedHall] = useState('hall1');
  const [paymentMode, setPaymentMode] = useState('online'); // 'online' | 'counter'

  const [activeToken, setActiveToken] = useState(null);
  const [tokenList, setTokenList] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const scrollContainerRef = useRef(null);

  const selectedOffering = PRASAD_OFFERINGS.find(o => o.id === selectedOfferingId) || PRASAD_OFFERINGS[0];
  const isFree = selectedOffering.isFree;
  const unitPrice = selectedOffering.price;
  const currentCount = isFree ? headcount : quantity;
  const totalPayableAmount = isFree ? 0 : unitPrice * currentCount;

  // Auto-scroll on tab change
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

    const handleCounterUpdate = (e) => {
      if (e.detail && (!e.detail.templeId || e.detail.templeId === activeTempleId)) {
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
  }, [activeTempleId, currentUser]);

  const loadTokens = () => {
    try {
      const saved = localStorage.getItem(`nirvighna_prasad_token_${activeTempleId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveToken(parsed);
        setTokenList([parsed]);
        generateQR(parsed.token_id || `PRASAD-${activeTempleId}-${parsed.token_number}`);
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
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      setActiveToken(enrichedToken);
      setTokenList([enrichedToken]);
      localStorage.setItem(`nirvighna_prasad_token_${activeTempleId}`, JSON.stringify(enrichedToken));
      await generateQR(enrichedToken.token_id);

      // Universal Notification
      await sendPilgrimNotification({
        type: 'gate_info',
        title: '🍲 Mahaprasad Pass Generated!',
        message: `Token #${token.token_number} (${enrichedToken.prasad_label} × ${currentCount}) confirmed at ${shrineDisplayName}.`,
        templeId: activeTempleId
      });

      setActiveTab('tokens');
      setSuccessToast('🎉 Mahaprasad pass generated successfully!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err) {
      alert('Could not issue token: ' + err.message);
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
    localStorage.setItem(`nirvighna_prasad_token_${activeTempleId}`, JSON.stringify(updated));
    setSuccessToast('✅ Mahaprasad collected! May Lord bless your yatra.');
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const estimatedWaitMin = activeToken
    ? prasadQueueEngine.getEstimatedWait(activeToken.token_number, counterStatus.current_serving_token, counterStatus.avg_serve_time_seconds)
    : 0;

  const isMyTurnServed = activeToken && counterStatus.current_serving_token >= activeToken.token_number;

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

        {/* Main Segmented Switcher & Live Serving Counter */}
        <div className="bg-white p-2.5 border-b border-gray-100 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('get_token')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-extrabold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'get_token'
                ? 'bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark shadow-xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-amber-50/50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.tabGetToken}</span>
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
            {activeToken && activeToken.status !== 'served' && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute top-2 right-3" />
            )}
          </button>
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-black">
              Serving: #{counterStatus.current_serving_token}
            </span>
          </div>
        </div>

        {/* Dynamic Toast Message */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-extrabold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Scrollable Form Body (Spacious & Clean) */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 pb-8">
          
          {/* TAB 1: BOOK PRASAD FORM */}
          {activeTab === 'get_token' && (
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

          {/* TAB 2: ACTIVE TOKENS & DIGITAL PASS CARD */}
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {activeToken ? (
                <div className="bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2] p-5 rounded-3xl border-2 border-gold shadow-warm text-center space-y-4 relative overflow-hidden">
                  
                  {/* Status Pill & Token ID */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${
                      activeToken.status === 'served'
                        ? 'bg-gray-100 text-gray-700 border border-gray-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${activeToken.status === 'served' ? 'bg-gray-400' : 'bg-emerald-500 animate-ping'}`} />
                      {activeToken.status === 'served' ? t.statusServed : t.statusInQueue}
                    </span>
                    
                    <span className={`text-[11px] font-mono font-black px-2.5 py-1 rounded-xl border ${
                      activeToken.payment_status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : activeToken.payment_status === 'PAY_AT_COUNTER'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}>
                      {activeToken.payment_status === 'PAID' ? `PAID: ₹${activeToken.total_amount || activeToken.amount || 0}` :
                       activeToken.payment_status === 'PAY_AT_COUNTER' ? `PAY AT COUNTER: ₹${activeToken.total_amount || activeToken.amount || 0}` :
                       'FREE SEVA (₹0)'}
                    </span>
                  </div>

                  {/* Token Number & Serving Progress Banner */}
                  <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-maroon text-white p-4 rounded-2xl shadow-md border border-gold/40 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300 font-heading">
                        {t.tokenNumber}
                      </p>
                      <p className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-gold drop-shadow-sm leading-tight">
                        #{activeToken.token_number}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs font-bold text-amber-200">
                        Serving: #{counterStatus.current_serving_token}
                      </p>
                      <p className="text-xs font-black text-white">
                        {activeToken.status === 'served' ? t.completed : isMyTurnServed ? '🌟 ' + t.collectNow : `${estimatedWaitMin} ${t.minsWait}`}
                      </p>
                    </div>
                  </div>

                  {/* Scannable QR Code Plinth */}
                  <div className="bg-white p-3 rounded-3xl inline-block shadow-md border-2 border-gold mx-auto">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Signed Prasad Token QR" className="w-36 h-36 sm:w-44 sm:h-44 mx-auto object-contain" />
                    ) : (
                      <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                        <QrIcon className="w-12 h-12 text-maroon animate-pulse" />
                      </div>
                    )}
                    <p className="text-[10px] font-mono font-black text-maroon mt-1 tracking-wider">
                      🔒 HMAC-SHA256 SIGNED QR PASS
                    </p>
                  </div>

                  {/* Detailed Specs Card */}
                  <div className="bg-white p-3.5 rounded-2xl border border-gold/30 text-xs text-gray-800 text-left space-y-2 shadow-2xs">
                    <div className="flex justify-between py-0.5 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Devotee / Head:</span>
                      <span className="font-bold text-gray-900">{activeToken.pilgrim_name}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Prasad Service:</span>
                      <span className="font-bold text-maroon">{activeToken.prasad_label || 'Pavitra Mahaprasad'}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Quantity / Devotees:</span>
                      <span className="font-bold text-gray-900">{activeToken.quantity || activeToken.headcount || 2} Devotee(s)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-500 font-medium">Collection Counter / Hall:</span>
                      <span className="font-bold text-indigo-dark">{activeToken.dining_hall || t.hallMain}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    {activeToken.status !== 'served' && (
                      <button
                        onClick={handleMarkServed}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.markServedBtn}</span>
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('get_token')}
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
                    🍲
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-gray-800 font-heading">
                      {t.noTokens}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Book a free Annakshetra thali or special laddu box now.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('get_token')}
                    className="px-5 py-2.5 bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark font-black text-xs rounded-2xl shadow-goldGlow hover:opacity-95 transition-all cursor-pointer font-heading inline-flex items-center gap-2 uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
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

export default PrasadQueueModal;
