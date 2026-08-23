import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUniqueTemples, MASTER_TEMPLES, getLocalizedTempleName, getLocalizedTempleLocation, getShortTempleName, getMicroTempleName } from '../lib/templeRegistry';
import { NirvighnaAIEngine } from '../lib/aiCrowdEngine';
import { crowdPredictionService } from '../lib/crowdPrediction';
import { prasadQueueEngine } from '../lib/prasadQueueEngine';
import { liveNewsService } from '../lib/liveNewsService';
import { melaEngine } from '../lib/melaEngine';
import { PrasadQueueModal } from '../components/PrasadQueueModal';
import { PilgrimFootwearModal } from '../components/PilgrimFootwearModal';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'qrcode';
import { sendPilgrimNotification } from '../lib/notificationService';
import { 
  Calendar, QrCode, Bus, Users, Sparkles, ArrowRight, Loader2, 
  Flame, Clock, MapPin, ShieldCheck, HeartHandshake, Compass, 
  Volume2, AlertCircle, ChevronRight, Sun, PhoneCall, Utensils, Footprints,
  X, Check, Minus, Plus, RefreshCw, CheckCircle, Lock
} from 'lucide-react';

const translations = {
  en: {
    greeting: 'Jai Shree Krishna • Jai Mata Di',
    welcomeBack: 'Welcome to your Yatra',
    subtitle: 'Nirvighna — Easy Darshan & Queue Help',
    aiBanner: 'AI Smart Darshan Guide',
    liveForecast: 'Live Darshan Updates',
    quickActions: 'Quick Actions',
    bookDarshan: 'Book Darshan',
    bookDarshanDesc: 'Pick time slot & skip line',
    myPass: 'My QR Pass',
    myPassDesc: 'Show your QR ticket at gate',
    parking: 'Parking & Bus',
    parkingDesc: 'Find parking & bus to temple',
    family: 'Family & Group',
    familyDesc: 'Add family & get group pass',
    temples: 'Our Temples',
    liveQueue: 'Live Gate Status',
    bookSlot: 'Book Now',
    loading: 'Loading temples...',
    error: 'Could not load temple info',
    todaysTithi: 'Shukla Paksha • Shravan Month',
    aartiTimings: 'Next Aarti Time',
    emergencyHelpline: '24/7 Helpline',
    helplineSub: 'For medical help, call anytime',
    viewDetails: 'See Details',
    facilities: 'Temple Facilities',
    wheelchairAvailable: 'Wheelchair & Priority Seva',
    wheelchairSub: 'Priority Ramp & Assistance',
    prasadCounter: 'Free Prasad Counter',
    ropewayService: 'Ropeway Ticket',
    ropewaySub: 'Quick ride to top',
    boatFerry: 'Bet Dwarka Boat',
    boatSub: 'Okha to Bet Dwarka',
    footwearLocker: 'Footwear Locker',
    freeLocker: 'FREE LOCKER',
    getFreeToken: 'Get Free Token',
    crossTempleCircuit: 'Smart Temple Route',
    circuitDesc: 'See crowd at all 4 temples right now',
    recommended: 'Best Choice',
    visitNow: 'Go Now',
    currentCrowd: 'Crowd Now',
    estimatedWait: 'Wait Time',
    bestTime: 'Best Time',
    lowCrowd: 'Low Rush',
    moderateCrowd: 'Medium Rush',
    highCrowd: 'High Rush',
    bookDarshanAt: 'Book Darshan at',
    fastEntryPass: 'Fast Entry Pass',
    seniorGateOpen: 'Senior & Priority Gate Open',
    tapTemplePrompt: 'Tap any temple to see crowd & book darshan',
    openForDarshan: 'Open for Darshan',
    deityPresiding: 'Presiding Deity',
    nextAarti: 'Next Aarti',
    estWait: 'Est. wait:',
    minutes: 'mins',
    planned: '✓ Planned',
    yatraPlan: '+ Yatra Plan',
    yatraDharmaSubtitle: 'Shows least crowded temple first so you save waiting time',
    selectedYatraPlan: 'Selected Yatra Plan',
    shrines: 'Shrines',
    bestTimeNow: 'Best Time Now',
    crowdLabel: 'Crowd:',
    devotees: 'devotees',
    wait: 'Wait:',
    heavyRush: 'Heavy Rush',
    mediumRush: 'Medium Rush',
    shortestQueue: '✨ Smooth Darshan Flow',
    yatraDharmaTitle: 'YATRA DHARMA AI',
    goToTempleNow: 'GO TO TEMPLE NOW',
    verifiedSeva: 'Verified Seva',
    callHelpline: 'Call 1800-NIRVIGHNA'
  },
  hi: {
    greeting: 'जय श्री कृष्ण • जय माता दी',
    welcomeBack: 'निर्विघ्न में आपका स्वागत है',
    subtitle: 'आसान दर्शन और लाइन से राहत',
    aiBanner: 'AI स्मार्ट दर्शन गाइड',
    liveForecast: 'लाइव दर्शन अपडेट',
    quickActions: 'खास सेवाएं',
    bookDarshan: 'दर्शन बुकिंग',
    bookDarshanDesc: 'समय चुनें और लाइन से बचें',
    myPass: 'मेरा QR पास',
    myPassDesc: 'गेट पर QR कोड दिखाएं',
    parking: 'पार्किंग और बस',
    parkingDesc: 'पार्किंग और मंदिर बस की जानकारी',
    family: 'परिवार और ग्रुप',
    familyDesc: 'परिवार के सदस्यों को जोड़ें',
    temples: 'गुजरात के प्रमुख मंदिर',
    liveQueue: 'लाइव गेट स्थिति',
    bookSlot: 'बुक करें',
    loading: 'मंदिर लोड हो रहे हैं...',
    error: 'मंदिर की जानकारी लोड नहीं हो सकी',
    todaysTithi: 'शुक्ल पक्ष • श्रावण मास',
    aartiTimings: 'अगली आरती का समय',
    emergencyHelpline: '24/7 हेल्पलाइन',
    helplineSub: 'मेडिकल या आपातकालीन सहायता के लिए',
    viewDetails: 'विवरण देखें',
    facilities: 'मंदिर की सुविधाएं',
    wheelchairAvailable: 'व्हीलचेयर और सहायता सेवा',
    wheelchairSub: 'फास्ट रैंप और हेल्पर सुविधा',
    prasadCounter: 'मुफ़्त प्रसाद केंद्र',
    ropewayService: 'रोपवे टिकट',
    ropewaySub: '7 मिनट में ऊपर पहुंचें',
    boatFerry: 'बेट द्वारका नाव',
    boatSub: 'ओखा से बेट द्वारका',
    footwearLocker: 'जूता लॉकर',
    freeLocker: 'मुफ़्त लॉकर',
    getFreeToken: 'मुफ़्त टोकन लें',
    crossTempleCircuit: 'स्मार्ट मंदिर रूट',
    circuitDesc: 'चारों मंदिरों की लाइव भीड़ और इंतज़ार का समय देखें',
    recommended: 'सबसे अच्छा समय',
    visitNow: 'अभी जाएं',
    currentCrowd: 'अभी भीड़',
    estimatedWait: 'इंतज़ार का समय',
    bestTime: 'दर्शन का सबसे अच्छा समय',
    lowCrowd: 'कम भीड़',
    moderateCrowd: 'मध्यम भीड़',
    highCrowd: 'ज़्यादा भीड़',
    bookDarshanAt: 'दर्शन बुक करें -',
    fastEntryPass: 'फास्ट एंट्री पास',
    seniorGateOpen: 'बुजुर्गों और खास लोगों के लिए गेट खुला है',
    tapTemplePrompt: 'भीड़ देखने और दर्शन बुक करने के लिए मंदिर चुनें',
    openForDarshan: 'दर्शन चालू है',
    deityPresiding: 'मुख्य भगवान',
    nextAarti: 'अगली आरती',
    estWait: 'अंदाजन समय:',
    minutes: 'मिनट',
    planned: '✓ प्लान हुआ',
    yatraPlan: '+ यात्रा प्लान',
    yatraDharmaSubtitle: 'कम भीड़ वाला मंदिर पहले दिखाता है जिससे समय बचे',
    selectedYatraPlan: 'चुना हुआ यात्रा प्लान',
    shrines: 'मंदिर',
    bestTimeNow: 'अभी सबसे अच्छा समय',
    crowdLabel: 'भीड़:',
    devotees: 'श्रद्धालु',
    wait: 'इंतज़ार:',
    heavyRush: 'भारी भीड़',
    mediumRush: 'मध्यम भीड़',
    shortestQueue: '✨ आसान दर्शन प्रवाह',
    yatraDharmaTitle: 'धर्म रथ AI',
    goToTempleNow: 'अभी मंदिर जाएं',
    verifiedSeva: 'सत्यापित सेवा',
    callHelpline: 'कॉल करें 1800-निर्विघ्न'
  },
  gu: {
    greeting: 'જય શ્રી કૃષ્ણ • જય માતા દી',
    welcomeBack: 'નિર્વિઘ્નમાં તમારું સ્વાગત છે',
    subtitle: 'સરળ દર્શન અને લાઇનથી મુક્તિ',
    aiBanner: 'AI સ્માર્ટ દર્શન ગાઇડ',
    liveForecast: 'લાઇવ દર્શન અપડેટ',
    quickActions: 'ઝડપી સેવાઓ',
    bookDarshan: 'દર્શન બુકિંગ',
    bookDarshanDesc: 'સમય પસંદ કરો અને લાઇનમાં ઊભા રહેવાથી બચો',
    myPass: 'મારો QR પાસ',
    myPassDesc: 'ગેટ પર QR કોડ બતાવો',
    parking: 'પાર્કિંગ અને બસ',
    parkingDesc: 'પાર્કિંગ અને મંદિર બસની માહિતી',
    family: 'પરિવાર અને ગ્રુપ',
    familyDesc: 'પરિવારના સભ્યો ઉમેરો',
    temples: 'ગુજરાતના મુખ્ય મંદિરો',
    liveQueue: 'લાઇવ ગેટ સ્થિતિ',
    bookSlot: 'બુક કરો',
    loading: 'મંદિરો લોડ થઈ રહ્યા છે...',
    error: 'મંદિરની માહિતી લોડ થઈ શકી નથી',
    todaysTithi: 'શુક્લ પક્ષ • શ્રાવણ માસ',
    aartiTimings: 'આરતીનો સમય',
    emergencyHelpline: '24/7 હેલ્પલાઇન',
    helplineSub: 'ડોક્ટર અથવા તાત્કાલિક મદદ માટે',
    viewDetails: 'વિગતો જુઓ',
    facilities: 'મંદિરની સુવિધાઓ',
    wheelchairAvailable: 'વ્હીલચેેર અને મદદ',
    wheelchairSub: 'ફાસ્ટ રેમ્પ અને સહાયક',
    prasadCounter: 'મફત પ્રસાદ કેન્દ્ર',
    ropewayService: 'રોપવે ટિકિટ',
    ropewaySub: '7 મિનિટમાં ઉપર પહોંચો',
    boatFerry: 'બેટ દ્વારકા બોટ',
    boatSub: 'ઓખાથી બેટ દ્વારકા',
    footwearLocker: 'પગરખાં લોકર',
    freeLocker: 'મફત લોકર',
    getFreeToken: 'મફત ટોકન મેળવો',
    crossTempleCircuit: 'સ્માર્ટ મંદિર રૂટ',
    circuitDesc: 'ચારેય મંદિરોની લાઈવ ભીડ અને રાહ જોવાનો સમય જુઓ',
    recommended: 'સારો સમય',
    visitNow: 'હમણાં જાઓ',
    currentCrowd: 'હાલની ભીડ',
    estimatedWait: 'રાહ જોવાનો સમય',
    bestTime: 'દર્શન માટે સારો સમય',
    lowCrowd: 'ઓછી ભીડ',
    moderateCrowd: 'સામાન્ય ભીડ',
    highCrowd: 'વધુ ભીડ',
    bookDarshanAt: 'દર્શન બુક કરો -',
    fastEntryPass: 'ફાસ્ટ એન્ટ્રી પાસ',
    seniorGateOpen: 'વડીલો માટે અલગ ગેટ ખુલ્લો છે',
    tapTemplePrompt: 'ભીડ જોવા અને દર્શન બુક કરવા મંદિર પસંદ કરો',
    openForDarshan: 'દર્શન ચાલુ છે',
    deityPresiding: 'મુખ્ય ભગવાન',
    nextAarti: 'આરતીનો સમય',
    estWait: 'અંદાજે સમય:',
    minutes: 'મિનિટ',
    planned: '✓ પ્લાન થયેલ',
    yatraPlan: '+ યાત્રા પ્લાન',
    yatraDharmaSubtitle: 'ઓછી ભીડ વાળું મંદિર પહેલા બતાવે છે જેથી સમય બચે',
    selectedYatraPlan: 'પસંદ કરેલ યાત્રા પ્લાન',
    shrines: 'મંદિરો',
    bestTimeNow: 'હમણાં સારો સમય',
    crowdLabel: 'ભીડ:',
    devotees: 'યાત્રાળુઓ',
    wait: 'રાહ:',
    heavyRush: 'વધુ ભીડ',
    mediumRush: 'સામાન્ય ભીડ',
    shortestQueue: '✨ સરળ દર્શન',
    yatraDharmaTitle: 'ધર્મ રથ AI',
    goToTempleNow: 'હમણાં મંદિર જાઓ',
    verifiedSeva: 'ચકાસાયેલ સેવા',
    callHelpline: 'કૉલ કરો 1800-નિર્વિઘ્ન'
  }
};

// Temple images
const DEFAULT_TEMPLE_IMAGES = {
  tmp_somnath: '/images/temples/somnath.png',
  tmp_dwarka: '/images/temples/dwarka.png',
  tmp_ambaji: '/images/temples/ambaji.jpg',
  tmp_pavagadh: '/images/temples/pavagadh.jpg'
};

const AARTI_SCHEDULES = {
  tmp_somnath: [
    { hour: 7, minute: 0, name: { en: 'Pratah Aarti', hi: 'प्रातः आरती', gu: 'સવારની આરતી' }, timeStr: '07:00 AM' },
    { hour: 12, minute: 0, name: { en: 'Madhyahna Aarti', hi: 'मध्याह्न आरती', gu: 'બપોરની આરતી' }, timeStr: '12:00 PM' },
    { hour: 19, minute: 0, name: { en: 'Sandhya Aarti', hi: 'संध्या आरती', gu: 'સંધ્યા આરતી' }, timeStr: '07:00 PM' }
  ],
  tmp_dwarka: [
    { hour: 6, minute: 0, name: { en: 'Mangla Aarti', hi: 'मंगला आरती', gu: 'મંગળા આરતી' }, timeStr: '06:00 AM' },
    { hour: 10, minute: 30, name: { en: 'Shringar Aarti', hi: 'शृंगार आरती', gu: 'શૃંગાર આરતી' }, timeStr: '10:30 AM' },
    { hour: 20, minute: 30, name: { en: 'Sandhya Aarti', hi: 'संध्या आरती', gu: 'સંધ્યા આરતી' }, timeStr: '08:30 PM' }
  ],
  tmp_ambaji: [
    { hour: 7, minute: 30, name: { en: 'Pratah Aarti', hi: 'प्रातः आरती', gu: 'સવારની આરતી' }, timeStr: '07:30 AM' },
    { hour: 12, minute: 0, name: { en: 'Bhog Aarti', hi: 'भोग आरती', gu: 'ભોગ આરતી' }, timeStr: '12:00 PM' },
    { hour: 18, minute: 30, name: { en: 'Sandhya Aarti', hi: 'संध्या आरती', gu: 'સંધ્યા આરતી' }, timeStr: '06:30 PM' }
  ],
  tmp_pavagadh: [
    { hour: 6, minute: 0, name: { en: 'Pratah Aarti', hi: 'प्रातः आरती', gu: 'સવારની આરતી' }, timeStr: '06:00 AM' },
    { hour: 12, minute: 0, name: { en: 'Madhyahna Aarti', hi: 'मध्याह्न आरती', gu: 'બપોરની આરતી' }, timeStr: '12:00 PM' },
    { hour: 18, minute: 30, name: { en: 'Sandhya Aarti', hi: 'संध्या आरती', gu: 'સંધ્યા આરતી' }, timeStr: '06:30 PM' }
  ]
};

export const getRealtimeAartiString = (templeId, lang = 'en', date = new Date()) => {
  const schedule = AARTI_SCHEDULES[templeId] || AARTI_SCHEDULES.tmp_somnath;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  let nextAarti = schedule.find(a => (a.hour * 60 + a.minute) > currentMinutes);
  let isTomorrow = false;

  if (!nextAarti) {
    nextAarti = schedule[0];
    isTomorrow = true;
  }

  const aartiName = nextAarti.name[lang] || nextAarti.name.en;
  
  if (isTomorrow) {
    if (lang === 'hi') return `कल ${nextAarti.timeStr} • ${aartiName}`;
    if (lang === 'gu') return `કાલે ${nextAarti.timeStr} • ${aartiName}`;
    return `Tomorrow ${nextAarti.timeStr} • ${aartiName}`;
  }

  const diffMinutes = (nextAarti.hour * 60 + nextAarti.minute) - currentMinutes;
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  let inTimeStr = '';
  if (diffHours > 0) {
    inTimeStr = lang === 'gu' ? `(${diffHours} કલાક ${remainingMinutes} મિનિટમાં)`
      : lang === 'hi' ? `(${diffHours} घंटे ${remainingMinutes} मिनट में)`
      : `(in ${diffHours}h ${remainingMinutes}m)`;
  } else {
    inTimeStr = lang === 'gu' ? `(${remainingMinutes} મિનિટમાં)`
      : lang === 'hi' ? `(${remainingMinutes} मिनट में)`
      : `(in ${remainingMinutes}m)`;
  }

  return `${nextAarti.timeStr} • ${aartiName} ${inTimeStr}`;
};

const TEMPLE_METADATA = {
  tmp_somnath: {
    tag: { en: '1st Jyotirlinga', hi: 'प्रथम ज्योतिर्लिंग', gu: 'પ્રથમ જ્યોતિર્લિંગ' },
    deity: { en: 'Lord Shiva (Somnath Mahadev)', hi: 'भगवान शिव (सोमनाथ महादेव)', gu: 'ભગવાન શિવ (સોમનાથ મહાદેવ)' },
    significance: { en: 'Eternal Shrine on Arabian Sea Coast', hi: 'अरब सागर तट पर सनातन सिद्ध धाम', gu: 'અરબી સમુદ્ર કિનારે સનાતન સિદ્ધ ધામ' }
  },
  tmp_dwarka: {
    tag: { en: 'Char Dham & Mokshapuri', hi: 'चार धाम एवं मोक्षपुरी', gu: 'ચાર ધામ અને મોક્ષપુરી' },
    deity: { en: 'Lord Krishna (Dwarkadhish)', hi: 'भगवान श्री कृष्ण (द्वारकाधीश)', gu: 'ભગવાન શ્રી કૃષ્ણ (દ્વારકાધીશ)' },
    significance: { en: '5-Storey Jagat Mandir Sanctum', hi: '5-मंजिला जगत मंदिर गर्भगृह', gu: '5-માળનું જગત મંદિર ગર્ભગૃહ' }
  },
  tmp_ambaji: {
    tag: { en: '51 Shakti Peeth Hub', hi: '51 शक्तिपीठ पावन धाम', gu: '51 શક્તિપીઠ પાવન ધામ' },
    deity: { en: 'Goddess Amba (Holy Visa Yantra)', hi: 'माँ अम्बा (पवित्र वीसा यंत्र)', gu: 'મા અંબા (પવિત્ર વિસા યંત્ર)' },
    significance: { en: 'Gabbar Hill Holy Akhand Jyot', hi: 'गब्बर पहाड़ी पवित्र अखंड ज्योत', gu: 'ગબ્બર ટેકરી પવિત્ર અખંડ જ્યોત' }
  },
  tmp_pavagadh: {
    tag: { en: 'UNESCO World Heritage', hi: 'यूनेस्को विश्व धरोहर', gu: 'યુનેસ્કો વર્લ્ડ હેરિટેજ' },
    deity: { en: 'Maa Mahakalika Mandir', hi: 'माँ महाकालिका मंदिर', gu: 'મા મહાકાલિકા મંદિર' },
    significance: { en: 'Ropeway Summit on Pavagadh Peak', hi: 'पावागढ़ शिखर पर रोपवे दर्शन', gu: 'પાવાગઢ શિખર પર રોપવે દર્શન' }
  }
};

const getTempleMeta = (templeId, lang = 'en', date = new Date()) => {
  const meta = TEMPLE_METADATA[templeId] || TEMPLE_METADATA.tmp_somnath;
  return {
    tag: meta.tag[lang] || meta.tag.en,
    aarti: getRealtimeAartiString(templeId, lang, date),
    deity: meta.deity[lang] || meta.deity.en,
    significance: meta.significance[lang] || meta.significance.en
  };
};

// Calculate crowd prediction and recommendation
const getPredictionForSlot = (temple, lang = 'en') => {
  if (!temple) return 'AI ML Crowd Model calculating real-time density...';

  const aiResult = NirvighnaAIEngine.predictCrowdDensity(temple, new Date(), lang);
  if (aiResult) {
    return aiResult.recommendation;
  }

  const locName = lang === 'hi' ? (temple.name_hi || temple.name) : lang === 'gu' ? (temple.name_gu || temple.name) : temple.name;
  return `✨ ${locName} - Optimal Darshan conditions.`;
};

export const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.hi || translations.en;

  const [temples, setTemples] = useState(MASTER_TEMPLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTempleId, setSelectedTempleId] = useState('tmp_somnath');
  const [guideTempleId, setGuideTempleId] = useState('tmp_somnath');
  const [routeViewMode, setRouteViewMode] = useState('reordered_list'); // 'reordered_list' | 'single_shrine'
  const [activeTab, setActiveTab] = useState('all');
  const [crowdPredictions, setCrowdPredictions] = useState({});
  const [crossTempleRecommendations, setCrossTempleRecommendations] = useState([]);
  const [prasadCounterStatus, setPrasadCounterStatus] = useState({});
  const [wishlist, setWishlist] = useState([]);
  const [circuitSuggestion, setCircuitSuggestion] = useState(null);
  const [melaActiveName, setMelaActiveName] = useState(null);
  const [showPrasadModal, setShowPrasadModal] = useState(false);
  const [showFootwearModal, setShowFootwearModal] = useState(false);
  const [activeFootwearToken, setActiveFootwearToken] = useState(null);
  const [activePrasadToken, setActivePrasadToken] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Inline Facility Expansion State
  const [expandedFacility, setExpandedFacility] = useState(null); // 'prasad' | 'footwear' | null
  const [prasadFormName, setPrasadFormName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [prasadFormPhone, setPrasadFormPhone] = useState(currentUser?.phone || '');
  const [prasadType, setPrasadType] = useState('thali'); // 'thali' | 'laddu_box'
  const [diningHall, setDiningHall] = useState('hall1'); // 'hall1' | 'vip'
  const [prasadHeadcount, setPrasadHeadcount] = useState(2);
  const [prasadLoading, setPrasadLoading] = useState(false);
  const [prasadQrUrl, setPrasadQrUrl] = useState('');

  const [footwearFormName, setFootwearFormName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [footwearFormPhone, setFootwearFormPhone] = useState(currentUser?.phone || '');
  const [footwearStation, setFootwearStation] = useState('gate1'); // 'gate1' | 'gate2' | 'exit'
  const [footwearPairs, setFootwearPairs] = useState(2);
  const [footwearLoading, setFootwearLoading] = useState(false);
  const [footwearQrUrl, setFootwearQrUrl] = useState('');

  // Check and sync active footwear & prasad tokens for Facilities cards
  useEffect(() => {
    const checkActiveTokens = () => {
      try {
        const foot = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
        const latestFoot = foot.find(f => f.status === 'checked_in');
        setActiveFootwearToken(latestFoot || null);

        const prasad = JSON.parse(localStorage.getItem(`nirvighna_prasad_token_${selectedTempleId}`) || 'null');
        if (prasad && prasad.status !== 'served') {
          setActivePrasadToken(prasad);
        } else {
          setActivePrasadToken(null);
        }
      } catch (_) {}
    };

    checkActiveTokens();
    window.addEventListener('storage', checkActiveTokens);
    window.addEventListener('nirvighna_notification_alert', checkActiveTokens);
    return () => {
      window.removeEventListener('storage', checkActiveTokens);
      window.removeEventListener('nirvighna_notification_alert', checkActiveTokens);
    };
  }, [selectedTempleId, showFootwearModal, showPrasadModal, expandedFacility]);

  // Sync QR codes for active tokens
  useEffect(() => {
    if (activePrasadToken?.token_number) {
      QRCode.toDataURL(`NIRVIGHNA-PRASAD-${activePrasadToken.token_number}-${activePrasadToken.id || Date.now()}`, { width: 140, margin: 1 })
        .then(url => setPrasadQrUrl(url))
        .catch(() => {});
    } else {
      setPrasadQrUrl('');
    }
  }, [activePrasadToken]);

  useEffect(() => {
    if (activeFootwearToken?.token_id) {
      QRCode.toDataURL(`NIRVIGHNA-LOCKER-${activeFootwearToken.token_id}`, { width: 140, margin: 1 })
        .then(url => setFootwearQrUrl(url))
        .catch(() => {});
    } else {
      setFootwearQrUrl('');
    }
  }, [activeFootwearToken]);

  // Inline Token Generators
  const handleGenerateInlinePrasadToken = async ({ name, phone, prasadType, diningHall, headcount }) => {
    try {
      const shrineName = temples.find(t => t.id === selectedTempleId)?.name || 'Somnath Temple';
      const res = await prasadQueueEngine.joinQueue(
        selectedTempleId,
        currentUser?.id || `anon_${Date.now()}`,
        name.trim() || currentUser?.full_name || 'Pilgrim Devotee',
        phone.trim() || currentUser?.phone || '',
        headcount,
        prasadType,
        diningHall
      );

      if (res && res.token) {
        const fullToken = {
          ...res.token,
          temple_name: shrineName,
          devotee_name: name.trim() || currentUser?.full_name || 'Pilgrim Devotee',
          prasad_type: prasadType,
          dining_hall: diningHall,
          headcount: headcount
        };
        localStorage.setItem(`nirvighna_prasad_token_${selectedTempleId}`, JSON.stringify(fullToken));
        setActivePrasadToken(fullToken);

        await sendPilgrimNotification({
          type: 'gate_info',
          title: '🍲 Mahaprasad Token Issued',
          message: `Token #${fullToken.token_number} confirmed for ${headcount} devotee(s) at ${shrineName}. Estimated wait: ~${res.queueStatus?.estimatedWaitTime || 12} mins.`,
          templeId: selectedTempleId
        });
      }
    } catch (err) {
      console.error('Error generating inline prasad token:', err);
    }
  };

  const handleGenerateInlineFootwearToken = async ({ name, phone, station, pairs }) => {
    try {
      const shrinePrefix = selectedTempleId === 'tmp_dwarka' ? 'DWA' : selectedTempleId === 'tmp_ambaji' ? 'AMB' : selectedTempleId === 'tmp_pavagadh' ? 'PAV' : 'SOM';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const rackLetter = String.fromCharCode(65 + Math.floor(Math.random() * 4));
      const rackNum = Math.floor(1 + Math.random() * 40);
      const shrineName = temples.find(t => t.id === selectedTempleId)?.name || 'Somnath Temple';

      const tokenObj = {
        token_id: `FW-${shrinePrefix}-${randomNum}`,
        id: `FW-${shrinePrefix}-${randomNum}`,
        pilgrim_name: name.trim() || currentUser?.full_name || 'Pilgrim Devotee',
        pilgrim_phone: phone.trim() || currentUser?.phone || '',
        rack_no: `Rack ${rackLetter}-${rackNum}`,
        temple_id: selectedTempleId,
        temple_name: shrineName,
        counter_station: station,
        pair_count: pairs,
        status: 'checked_in',
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      const existingLocal = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      const updatedList = [tokenObj, ...existingLocal];
      localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify(updatedList));
      setActiveFootwearToken(tokenObj);

      await sendPilgrimNotification({
        type: 'gate_info',
        title: '👟 Footwear Locker Token Issued',
        message: `Locker Token #${tokenObj.token_id} issued for ${tokenObj.pair_count} pair(s) at ${tokenObj.rack_no} (${shrineName}).`,
        templeId: selectedTempleId
      });
    } catch (err) {
      console.error('Error generating inline footwear token:', err);
    }
  };

  // Timer to refresh aarti countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkMelaStatus = async () => {
      const activeName = await melaEngine.isMelaModeActive(selectedTempleId);
      setMelaActiveName(activeName);
    };
    checkMelaStatus();
  }, [selectedTempleId]);

  useEffect(() => {
    if (currentUser) {
      loadWishlistAndSuggestions();
    }
  }, [currentUser, currentLanguage]);

  const loadWishlistAndSuggestions = async () => {
    if (!currentUser) return;
    const list = await crowdPredictionService.getWishlist(currentUser.id);
    setWishlist(list);
    if (list.length >= 2) {
      const suggestion = await crowdPredictionService.getCircuitSuggestion(currentUser.id, currentLanguage);
      setCircuitSuggestion(suggestion);
    } else {
      setCircuitSuggestion(null);
    }
  };

  const handleToggleWishlist = async (templeId) => {
    if (!currentUser) return;
    if (wishlist.includes(templeId)) {
      await crowdPredictionService.removeFromWishlist(currentUser.id, templeId);
    } else {
      await crowdPredictionService.addToWishlist(currentUser.id, templeId);
    }
    await loadWishlistAndSuggestions();
  };

  useEffect(() => {
    fetchTemplesWithCrowdDensity();
    fetchCrossTempleRecommendations();
    fetchPrasadCounterStatus();

    // Listen for prasad counter updates
    const handleCounterUpdate = () => {
      fetchPrasadCounterStatus();
    };

    window.addEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
    window.addEventListener('storage', handleCounterUpdate);

    return () => {
      window.removeEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
      window.removeEventListener('storage', handleCounterUpdate);
    };
  }, []);

  const fetchCrossTempleRecommendations = async () => {
    try {
      const recommendations = await crowdPredictionService.getCrossTempleRecommendations();
      setCrossTempleRecommendations(recommendations || []);
    } catch (err) {
      console.error('Error fetching cross-temple recommendations:', err);
    }
  };

  const fetchPrasadCounterStatus = async () => {
    try {
      const temples = ['tmp_somnath', 'tmp_dwarka', 'tmp_ambaji', 'tmp_pavagadh'];
      const status = {};
      
      for (const templeId of temples) {
        const data = await prasadQueueEngine.fetchCounterStatus(templeId);
        status[templeId] = data;
      }
      
      setPrasadCounterStatus(status);
    } catch (err) {
      console.error('Error fetching prasad counter status:', err);
    }
  };

  const fetchTemplesWithCrowdDensity = async () => {
    try {
      const { data: templesData } = await supabase
        .from('temples')
        .select('*');

      const uniqueList = getUniqueTemples(templesData || []);
      setTemples(uniqueList);

      if (uniqueList.length > 0) {
        setSelectedTempleId(uniqueList[0].id);
      }

      // Fetch crowd predictions
      const predictions = {};
      for (const temple of uniqueList) {
        try {
          const prediction = await crowdPredictionService.getCrowdPrediction(temple.id, new Date(), currentLanguage);
          predictions[temple.id] = prediction;
        } catch (err) {
          console.error(`Error fetching prediction for ${temple.id}:`, err);
        }
      }
      setCrowdPredictions(predictions);
    } catch (err) {
      console.error('Error fetching temples:', err);
      setTemples(MASTER_TEMPLES);
    }
  };

  const getPredictionForTemple = (templeId) => {
    const templeObj = temples.find(t => t.id === templeId) || MASTER_TEMPLES.find(t => t.id === templeId) || { id: templeId, name: 'Temple' };
    const aiLive = NirvighnaAIEngine.predictCrowdDensity(templeObj, new Date(), currentLanguage);
    const prediction = crowdPredictions[templeId];
    
    // Compute live capacity percentage
    const capacityPercent = prediction?.densityRatio 
      ? Math.min(99, Math.max(15, Math.round(prediction.densityRatio * 100))) 
      : (aiLive?.densityPercentage || (templeId === 'tmp_pavagadh' ? 28 : templeId === 'tmp_ambaji' ? 48 : templeId === 'tmp_somnath' ? 76 : 92));
      
    const crowdLevel = prediction?.densityLevel || aiLive?.crowdLevel || (capacityPercent >= 80 ? 'high' : capacityPercent >= 45 ? 'medium' : 'low');
    const badge = getCrowdBadge(crowdLevel, capacityPercent);
    const waitTime = aiLive?.estimatedWaitTimeMins || Math.round((capacityPercent / 100) * 35 + 8);
    const maxCap = templeObj?.maxCapacity || (templeId === 'tmp_somnath' ? 2500 : templeId === 'tmp_dwarka' ? 1800 : templeId === 'tmp_ambaji' ? 2000 : 1500);
    const predictedCount = prediction?.predictedCount || Math.round(maxCap * (capacityPercent / 100));
    
    return {
      ...prediction,
      ...aiLive,
      predictedCount,
      capacityPercent,
      crowdLevel,
      badge,
      waitTime
    };
  };

  const handleTempleClick = (templeId) => {
    setSelectedTempleId(templeId);
    navigate(`/book/${templeId}`);
  };

  const quickActions = [
    {
      icon: Calendar,
      emoji: '🛕',
      label: t.bookDarshan,
      desc: t.bookDarshanDesc,
      path: () => navigate(`/book/${selectedTempleId}`),
      accent: 'border-l-4 border-l-gold bg-gradient-to-br from-gold/10 to-amber-500/5 text-gold-dark'
    },
    {
      icon: QrCode,
      emoji: '📛',
      label: t.myPass,
      desc: t.myPassDesc,
      path: () => navigate('/pass', { state: { from: 'home' } }),
      accent: 'border-l-4 border-l-maroon bg-gradient-to-br from-maroon/10 to-red-900/5 text-maroon'
    },
    {
      icon: Bus,
      emoji: '🚌',
      label: t.parking,
      desc: t.parkingDesc,
      path: () => navigate('/travel'),
      accent: 'border-l-4 border-l-indigo-dark bg-gradient-to-br from-indigo-dark/10 to-blue-900/5 text-indigo-dark'
    },
    {
      icon: Users,
      emoji: '👨‍👩‍👧',
      label: t.family,
      desc: t.familyDesc,
      path: () => navigate('/family'),
      accent: 'border-l-4 border-l-gold bg-gradient-to-br from-gold/15 to-amber-500/10 text-maroon'
    }
  ];


  const getCrowdBadge = (level, capacity) => {
    if (capacity >= 80 || level === 'high' || level === 'critical') {
      return { text: t.highCrowd, color: 'bg-maroon/90 text-ivory border-amber-500/40', dot: 'bg-amber-400' };
    } else if (capacity >= 45 || level === 'medium') {
      return { text: t.moderateCrowd, color: 'bg-gold/90 text-indigo-dark border-amber-300 font-black', dot: 'bg-indigo-dark' };
    } else {
      return { text: t.lowCrowd, color: 'bg-amber-950/85 text-amber-200 border-gold/50 font-extrabold', dot: 'bg-gold' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center pb-20">
        <NirvighnaLoader message={t.loading || 'Connecting to Nirvighna Temple Servers...'} />
      </div>
    );
  }

  const currentTemple = temples.find(t => t.id === selectedTempleId) || temples[0];
  const aiPrediction = currentTemple ? getPredictionForSlot(currentTemple, currentLanguage) : '';
  const currentMeta = getTempleMeta(selectedTempleId, currentLanguage, currentTime);

  return (
    <div className="min-h-screen bg-ivory pt-5 pb-10 px-3.5 sm:px-6 animate-page-in">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Devotional Hero Greeting Banner */}
        <div className="relative overflow-hidden rounded-3xl saffron-gradient p-6 sm:p-8 text-white shadow-2xl border border-amber-500/40 om-watermark">
          {/* Ambient Lighting Background Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/50 text-[11px] font-bold text-amber-300 tracking-wider uppercase shadow-sm">
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                {t.todaysTithi}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-white flex items-center gap-2.5 tracking-tight drop-shadow-md">
                  {t.greeting} 🙏
                </h1>
                <p className="text-sm text-amber-200/90 font-semibold mt-1">
                  {t.welcomeBack}, <span className="font-bold text-amber-300 underline decoration-amber-400/60">{currentUser?.full_name || 'Devotee'}</span>
                </p>
              </div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-br from-gold via-amber-300 to-amber-600 animate-logo-aura shrink-0 shadow-2xl overflow-hidden group">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1.5 overflow-hidden">
                  <img 
                    src="/official_logo.png" 
                    alt="Official Nirvighna Emblem" 
                    className="w-full h-full object-contain crisp-img group-hover:scale-105 transition-transform duration-300 select-none drop-shadow-sm" 
                  />
                </div>
              </div>
            </div>

            {/* Quick Holy Stat Ribbon */}
            <div className="pt-3.5 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-amber-500/30 backdrop-blur-md shadow-inner">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-amber-300/80 uppercase font-black tracking-wider">{t.aartiTimings}</p>
                  <p className="font-bold text-white text-xs truncate">{currentMeta.aarti}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-amber-500/30 backdrop-blur-md shadow-inner">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-amber-300/80 uppercase font-black tracking-wider">{t.fastEntryPass}</p>
                  <p className="font-bold text-amber-300 text-xs truncate">{t.seniorGateOpen}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Devotional & Web Intelligence Ticker Banner */}
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-2 overflow-hidden backdrop-blur-md flex items-center gap-2 shadow-xl">
          <span className="shrink-0 bg-amber-400 text-slate-950 font-black text-[8px] uppercase px-1.5 py-0.5 rounded font-heading tracking-wider">
            LIVE TICKER
          </span>
          <div className="overflow-hidden w-full relative">
            <div className="animate-ticker-marquee text-xs font-bold text-slate-100">
              {[...liveNewsService.getMarqueeBulletins(currentLanguage), ...liveNewsService.getMarqueeBulletins(currentLanguage)].map((bulletin, idx) => (
                <span key={idx} className="mr-8 inline-block text-amber-200/90">{bulletin}</span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Prediction & Smart Crowd Guidance Card with Interactive Shrine Switcher */}
        <div className="bg-gradient-to-br from-indigo-dark via-[#13112A] to-indigo-dark text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl border border-gold/30 relative overflow-hidden space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gold font-extrabold tracking-wider text-xs font-heading">
              {circuitSuggestion ? t.yatraDharmaTitle : t.aiBanner}
            </span>
          </div>

          {/* Mela / Festival Mahotsav Active Alert embedded inside Temple Info Card */}
          {melaActiveName && (() => {
            const mTitle = typeof melaActiveName === 'string'
              ? melaActiveName
              : (currentLanguage === 'gu' ? melaActiveName.nameGu : currentLanguage === 'hi' ? melaActiveName.nameHi : melaActiveName.nameEn) || 'Mahotsav';
            return (
              <div className="p-3 sm:p-3.5 bg-gradient-to-br from-amber-950 via-maroon to-amber-900 rounded-xl border border-gold/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-md text-white">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-gold text-indigo-dark font-black flex items-center justify-center text-xs shrink-0 shadow font-heading">
                    🛕
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-gold font-heading uppercase tracking-wide">
                      {mTitle} Active
                    </p>
                    <p className="text-[11px] text-amber-100/90 font-medium leading-tight mt-0.5">
                      {currentLanguage === 'gu' ? 'પદયાત્રીઓ: તમારા સુરક્ષા ચેકપોઇન્ટ ટ્રેક કરો.' : currentLanguage === 'hi' ? 'पदयात्री: अपने सुरक्षा चेकपॉइंट ट्रैक करें।' : 'Walking pilgrims: Track your safety checkpoints.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/mela-route')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-lg shadow-sm transition-all uppercase font-heading shrink-0 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{currentLanguage === 'gu' ? 'પદયાત્રી રૂટ →' : currentLanguage === 'hi' ? 'पदयात्री रूट →' : 'Padyatri Route →'}</span>
                </button>
              </div>
            );
          })()}

          {/* Interactive Shrine Selector Tabs with Responsive Names */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {MASTER_TEMPLES.map((tItem) => {
              const isSelected = (guideTempleId || selectedTempleId) === tItem.id;
              const icons = { tmp_somnath: '🔱', tmp_dwarka: '🛕', tmp_ambaji: '🚩', tmp_pavagadh: '🔱' };
              const microName = getMicroTempleName(tItem.id, currentLanguage);
              const shortName = getShortTempleName(tItem.id, currentLanguage);
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => {
                    setGuideTempleId(tItem.id);
                    setSelectedTempleId(tItem.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer card-press ${
                    isSelected
                      ? 'bg-gold text-indigo-dark font-black shadow-goldGlow ring-1 ring-gold'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  <span>{icons[tItem.id] || '🛕'}</span>
                  <span className="inline sm:hidden">{microName}</span>
                  <span className="hidden sm:inline">{shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Computed Prediction Output */}
          {(() => {
            const activeGuideTemple = MASTER_TEMPLES.find(t => t.id === (guideTempleId || selectedTempleId)) || MASTER_TEMPLES[0];
            const predictionText = getPredictionForSlot(activeGuideTemple, currentLanguage);
            const localizedFullName = getLocalizedTempleName(activeGuideTemple, currentLanguage);
            const shortName = getShortTempleName(activeGuideTemple.id, currentLanguage);
            return (
              <div className="space-y-3">
                <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <p className="font-extrabold text-amber-300 font-heading text-sm sm:text-base flex items-center gap-1.5">
                    <span>{activeGuideTemple.id === 'tmp_somnath' ? '🔱' : activeGuideTemple.id === 'tmp_dwarka' ? '🛕' : activeGuideTemple.id === 'tmp_ambaji' ? '🚩' : '🔱'}</span>
                    <span>{localizedFullName}</span>
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-line">
                    {circuitSuggestion ? circuitSuggestion.message : predictionText}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-200/90 font-medium">
                    <span>{t.aartiTimings}: <strong className="text-white font-mono">{getTempleMeta(activeGuideTemple.id, currentLanguage, currentTime).aarti}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/book/${activeGuideTemple.id}`)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow transition-all flex items-center justify-center gap-1.5 font-heading cursor-pointer shrink-0 card-press"
                  >
                    <span>{t.bookDarshanAt} {shortName}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Quick Actions Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest font-heading flex items-center gap-2">
              <Compass className="w-4 h-4 text-maroon" /> {t.quickActions}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.path}
                  className={`flex flex-col text-left p-4 rounded-3xl bg-white shadow-warm border border-gray-100/80 ${action.accent} hover-warm card-press transition-all duration-300 group cursor-pointer`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-gold/10 transition-all text-base">
                      {action.emoji || <Icon className="w-5 h-5 text-indigo-dark" />}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </div>
                  <span className="text-xs font-black text-gray-900 font-heading leading-tight mb-1">
                    {action.label}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium line-clamp-1">
                    {action.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shrines & Temple Hubs Showcase Section */}
        <div>
          <div className="flex items-center justify-between mb-3.5 px-1">
            <div>
              <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest font-heading flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-dark" /> {t.temples}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{t.tapTemplePrompt}</p>
            </div>
            <span className="text-xs font-extrabold text-amber-900 bg-gradient-to-r from-gold/25 via-amber-100 to-gold/20 px-3 py-1 rounded-full border border-gold/60 shadow-2xs flex items-center gap-1.5 font-heading">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
              {t.openForDarshan}
            </span>
          </div>

          {/* Cards Grid - 2 Column Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {temples.map((temple) => {
              const prediction = getPredictionForTemple(temple.id);
              const capacityPercent = prediction?.capacityPercent || Math.floor(30 + Math.random() * 40);
              const badge = prediction?.badge || getCrowdBadge(temple.crowdLevel, capacityPercent);
              const isSelected = selectedTempleId === temple.id;
              const meta = getTempleMeta(temple.id, currentLanguage);
              const imageUrl = DEFAULT_TEMPLE_IMAGES[temple.id] || temple.image_url || DEFAULT_TEMPLE_IMAGES.tmp_somnath;
              const isRecommended = crossTempleRecommendations.length > 0 && crossTempleRecommendations[0]?.templeId === temple.id;
              const localizedName = getLocalizedTempleName(temple, currentLanguage);
              const localizedLocation = getLocalizedTempleLocation(temple, currentLanguage);

              return (
                <div
                  key={temple.id}
                  onClick={() => handleTempleClick(temple.id)}
                  className={`rounded-2xl bg-white shadow-warm overflow-hidden border transition-all duration-300 cursor-pointer shine-sweep hover-lift ${
                    isSelected ? 'border-2 border-gold ring-2 ring-gold/20' : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  {/* Temple Banner Image Container */}
                  <div className="h-36 relative overflow-hidden bg-indigo-dark">
                    <img 
                      src={imageUrl} 
                      alt={localizedName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = DEFAULT_TEMPLE_IMAGES.tmp_somnath;
                      }}
                    />
                    
                    {/* Dark gradient overlay for text clarity */}
                    <div className="absolute inset-0 temple-card-overlay" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        {isRecommended && (
                          <span className="text-[9px] font-extrabold bg-gradient-to-r from-gold via-amber-400 to-amber-500 text-indigo-dark backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-300 shadow-md flex items-center gap-1 font-heading">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-dark" /> {t.recommended}
                          </span>
                        )}
                        {wishlist.includes(temple.id) && (
                          <span className="text-[9px] font-extrabold bg-maroon/95 text-gold backdrop-blur-md px-2.5 py-0.5 rounded-full border border-gold/40 shadow-md font-heading">
                            {t.planned}
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold bg-maroon/90 text-ivory backdrop-blur-md px-2.5 py-1 rounded-full border border-gold/30 shadow-md">
                          {meta.tag}
                        </span>
                        
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border shadow-md flex items-center gap-1 ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
                          {badge.text} ({capacityPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Bottom Info on Image */}
                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <h4 className="font-extrabold text-base font-heading leading-tight text-white drop-shadow-md">
                        {localizedName}
                      </h4>
                      <p className="text-[11px] text-gray-200 flex items-center gap-1 font-medium drop-shadow">
                        <MapPin className="w-3 h-3 text-gold" /> {localizedLocation}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Details Body */}
                  <div className="p-3.5 bg-white space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-ivory p-2 rounded-xl border border-gray-100">
                        <span className="text-[9px] text-gray-500 uppercase font-bold block">{t.deityPresiding}</span>
                        <span className="font-bold text-gray-800 text-[10px] truncate block">{meta.deity}</span>
                      </div>
                      <div className="bg-ivory p-2 rounded-xl border border-gray-100">
                        <span className="text-[9px] text-gray-500 uppercase font-bold block">{t.nextAarti}</span>
                        <span className="font-bold text-maroon text-[10px] truncate block flex items-center gap-1">
                          <Flame className="w-3 h-3 text-gold shrink-0" /> {meta.aarti.split('•')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3 text-gold-dark" />
                        <span>{t.estWait} <strong className="text-gray-900 font-bold">~{prediction?.waitTime || (capacityPercent > 70 ? '35' : '15')} {t.minutes}</strong></span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(temple.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border ${
                            wishlist.includes(temple.id)
                              ? 'bg-gold/25 border-gold text-indigo-dark font-black'
                              : 'bg-ivory border-gray-200 text-gray-600 hover:border-gold/50'
                          }`}
                        >
                          {wishlist.includes(temple.id) ? t.planned : t.yatraPlan}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTempleClick(temple.id);
                          }}
                          className="px-3.5 py-1.5 bg-gold hover:bg-gold-dark text-indigo-dark font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 font-heading"
                        >
                          {t.bookSlot} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🛕 YATRA DHARMA AI — Sacred Pilgrimage Flow Card */}
        <div className="mt-6 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-maroon uppercase tracking-widest font-heading flex items-center gap-2">
                <Compass className="w-4 h-4 text-gold-dark" /> {t.yatraDharmaTitle}
              </h3>
              <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                {wishlist.length > 0 ? `${t.selectedYatraPlan} (${wishlist.length} ${t.shrines})` : t.yatraDharmaSubtitle}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1C122C] via-[#281338] to-[#160B24] text-white rounded-3xl p-4 sm:p-5 border-2 border-gold/40 shadow-2xl space-y-3.5">
            <div className="space-y-2.5">
              {(() => {
                const targetIds = wishlist.length >= 1 ? wishlist : MASTER_TEMPLES.map(t => t.id);
                const sortedList = [...targetIds].sort((a, b) => {
                  const predA = getPredictionForTemple(a);
                  const predB = getPredictionForTemple(b);
                  return (predA?.capacityPercent || 50) - (predB?.capacityPercent || 50);
                });

                const shrineIcons = { tmp_somnath: '🔱', tmp_dwarka: '🛕', tmp_ambaji: '🚩', tmp_pavagadh: '🔱' };

                return sortedList.map((tId, idx) => {
                  const shrineObj = MASTER_TEMPLES.find(mt => mt.id === tId) || { name: tId };
                  const localizedShrineName = getLocalizedTempleName(shrineObj, currentLanguage);
                  const pred = getPredictionForTemple(tId);
                  const capPct = pred?.capacityPercent || 45;
                  const headCount = pred?.predictedCount || Math.round((shrineObj.maxCapacity || 1500) * (capPct / 100));
                  const waitStr = `${pred?.waitTime || Math.round((capPct / 100) * 35 + 8)} ${t.minutes}`;
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={tId}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 rounded-2xl transition-all ${
                        isFirst 
                          ? 'bg-gradient-to-r from-amber-950/95 via-maroon/80 to-amber-950/90 border-2 border-gold text-white shadow-goldGlow ring-1 ring-gold/40' 
                          : 'bg-gradient-to-r from-amber-950/60 via-[#2A1138]/85 to-amber-950/50 border border-gold/40 text-amber-100/95 shadow-md hover:border-gold/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 font-heading ${
                          isFirst 
                            ? 'bg-gradient-to-br from-gold via-amber-400 to-gold text-indigo-dark shadow-md border border-amber-300' 
                            : 'bg-maroon/80 text-gold-light border border-gold/40 font-black'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-bold text-white font-heading truncate flex items-center gap-1.5">
                              <span>{shrineIcons[tId] || '🛕'}</span>
                              <span>{localizedShrineName}</span>
                            </p>
                            {isFirst && (
                              <span className="text-[10px] font-extrabold text-indigo-dark px-2.5 py-0.5 rounded-full bg-gold border border-amber-300 font-heading uppercase tracking-wider shadow-xs">
                                ✨ {t.bestTimeNow}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-amber-200/90 font-mono mt-0.5 truncate">
                            {t.crowdLabel} <strong className="text-white font-semibold">{headCount} {t.devotees}</strong> • {t.wait} <strong className="text-gold font-semibold">{waitStr}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-auto text-right">
                        <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                          capPct > 75 
                            ? 'bg-maroon/90 text-amber-200 border-red-500/50 shadow-xs' 
                            : capPct > 45 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-xs' 
                            : 'bg-gold/25 text-gold-light border-gold/60 shadow-xs'
                        }`}>
                          <span>{capPct > 75 ? '🚩' : capPct > 45 ? '⏳' : '✨'}</span>
                          <span>{capPct > 75 ? t.heavyRush : capPct > 45 ? t.mediumRush : t.shortestQueue}</span>
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <button
              type="button"
              onClick={() => {
                const targetIds = wishlist.length >= 1 ? wishlist : MASTER_TEMPLES.map(t => t.id);
                const sortedList = [...targetIds].sort((a, b) => {
                  const capA = crowdPredictions[a]?.capacityPercent || 50;
                  const capB = crowdPredictions[b]?.capacityPercent || 50;
                  return capA - capB;
                });
                navigate(`/book/${sortedList[0] || selectedTempleId}`);
              }}
              className="w-full mt-2 py-3 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-amber-400 hover:to-gold-dark text-indigo-dark font-black text-xs sm:text-sm rounded-2xl shadow-goldGlow transition-all flex items-center justify-center gap-2 font-heading uppercase tracking-widest cursor-pointer"
            >
              <span>{t.goToTempleNow}</span>
              <ArrowRight className="w-4 h-4 text-indigo-dark" />
            </button>
          </div>
        </div>

        {/* Dedicated Pavitra Pilgrim Facilities Showcase Card */}
        <div className="bg-white p-5 rounded-3xl shadow-warm border border-gray-100/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest font-heading flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-maroon" /> {t.facilities}
            </h3>
            <span className="text-[11px] font-bold text-maroon bg-maroon/10 px-2.5 py-1 rounded-full border border-maroon/20">
              {t.verifiedSeva}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => navigate('/travel')}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-gold/5 border border-gold/30 hover:border-gold cursor-pointer hover-lift transition-all space-y-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gold/20 text-indigo-dark flex items-center justify-center font-bold">
                🚡
              </div>
              <p className="text-xs font-black text-gray-900 leading-tight">{t.ropewayService}</p>
              <p className="text-[10px] text-gray-500 font-medium">{t.ropewaySub}</p>
            </div>

            <div 
              onClick={() => navigate('/travel')}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-gold/5 border border-gold/30 hover:border-gold cursor-pointer hover-lift transition-all space-y-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gold/20 text-indigo-dark flex items-center justify-center font-bold">
                ⛵
              </div>
              <p className="text-xs font-black text-gray-900 leading-tight">{t.boatFerry}</p>
              <p className="text-[10px] text-gray-500 font-medium">{t.boatSub}</p>
            </div>

            <div 
              onClick={() => setShowPrasadModal(true)}
              className="p-3.5 rounded-2xl border-2 cursor-pointer hover-lift transition-all space-y-1.5 shadow-sm group bg-gradient-to-br from-gold/15 via-amber-500/10 to-amber-100/20 border-gold/50 hover:border-gold"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-gold/20 text-maroon flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  🍲
                </div>
                <span className="text-[10px] font-black text-maroon/80 font-mono">→</span>
              </div>
              <p className="text-xs font-black text-gray-900 leading-tight">{t.prasadCounter}</p>
              <p className="text-[10px] text-maroon font-extrabold flex items-center gap-1">
                <span>✨ {t.getFreeToken}</span> →
              </p>
            </div>

            <div 
              onClick={() => setShowFootwearModal(true)}
              className="p-3.5 rounded-2xl border-2 cursor-pointer hover-lift transition-all space-y-1.5 shadow-sm group bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/40 hover:border-amber-500"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  👟
                </div>
                <span className="text-[10px] font-black text-amber-900/80 font-mono">→</span>
              </div>
              <p className="text-xs font-black text-gray-900 leading-tight">{t.footwearLocker}</p>
              <p className="text-[10px] text-amber-800 font-extrabold flex items-center gap-1">
                <span>🔑 {t.freeLocker}</span> →
              </p>
            </div>

            <div 
              onClick={() => navigate(`/book/${selectedTempleId || 'tmp_somnath'}?service=wheelchair`)}
              className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/50 hover:border-amber-400 cursor-pointer hover-lift transition-all space-y-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                ♿
              </div>
              <p className="text-xs font-black text-gray-900 leading-tight">{t.wheelchairAvailable}</p>
              <p className="text-[10px] text-amber-800 font-semibold">{t.wheelchairSub}</p>
            </div>
          </div>
        </div>

        {/* 24/7 Pilgrim Emergency Helpline Banner */}
        <div className="bg-gradient-to-r from-red-900 to-maroon text-white p-4 rounded-2xl shadow-lg border border-red-400/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <PhoneCall className="w-5 h-5 text-gold animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white font-heading">{t.emergencyHelpline}</h4>
              <p className="text-[10px] text-red-200 font-medium">{t.helplineSub}</p>
            </div>
          </div>
          <a
            href="tel:18002335555"
            className="px-3 py-1.5 bg-white text-maroon font-extrabold text-xs rounded-xl shadow-md hover:bg-ivory transition-colors whitespace-nowrap"
          >
            {t.callHelpline}
          </a>
        </div>

        {/* Free Mahaprasad Token Modal */}
        {showPrasadModal && (
          <PrasadQueueModal
            isOpen={showPrasadModal}
            templeId={selectedTempleId}
            templeName={temples.find(tmp => tmp.id === selectedTempleId)?.name || 'Somnath Temple'}
            onClose={() => setShowPrasadModal(false)}
          />
        )}

        {/* Smart Footwear Locker Modal */}
        {showFootwearModal && (
          <PilgrimFootwearModal
            isOpen={showFootwearModal}
            onClose={() => setShowFootwearModal(false)}
            templeId={selectedTempleId}
          />
        )}
      </div>
    </div>
  );
};

