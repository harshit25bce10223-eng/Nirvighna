import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Accessibility, 
  Volume2, 
  ShieldCheck, 
  Heart, 
  User, 
  CheckCircle2, 
  ChevronRight, 
  Mic, 
  VolumeX, 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  MapPin,
  Compass,
  ArrowRight,
  PhoneCall,
  Navigation,
  Clock,
  Sparkles,
  HelpCircle,
  Footprints,
  Users,
  Activity,
  Radio,
  Phone,
  Globe
} from 'lucide-react';
import { MASTER_TEMPLES } from '../lib/templeRegistry';
import { speakNaturalIndianVoice, stopNaturalIndianVoice, getBestIndianFemaleVoice, playDevotionalChime } from '../lib/indianVoiceEngine';

const UI_TEXT = {
  en: {
    backToHome: 'Back to Home',
    portalTag: 'SUGAM DARSHAN • ACCESSIBILITY GUIDE',
    heading: 'Priority Wayfinding & Audio Navigation',
    subheading: 'Compassionate, step-by-step spoken route guidance with real-time crowd status & stationed volunteer tracking for elderly pilgrims, expectant mothers, and wheelchair users.',
    selectRoute: 'Select Temple Shrine',
    assistanceCategory: 'Pilgrim Assistance Category',
    categories: {
      elderly: { title: 'Senior Citizen', icon: '👴', sub: 'Priority ramps & seated sanctum row' },
      pregnant: { title: 'Expecting Mother', icon: '🤰', sub: 'Shortest shaded corridor & rest stops' },
      differently_abled: { title: 'Wheelchair / Divyangjan', icon: '♿', sub: '100% Barrier-free lift & ramp access' }
    },
    templeNames: {
      tmp_somnath: 'Somnath Jyotirlinga',
      tmp_dwarka: 'Dwarkadhish Mandir',
      tmp_ambaji: 'Ambaji Shakti Peeth',
      tmp_pavagadh: 'Pavagadh Kalika Mata'
    },
    locations: {
      tmp_somnath: 'Prabhas Patan, Gir Somnath',
      tmp_dwarka: 'Dwarka, Devbhumi Dwarka',
      tmp_ambaji: 'Ambaji, Banaskantha',
      tmp_pavagadh: 'Pavagadh Hill, Panchmahal'
    },
    voiceBox: {
      title: 'Natural Indian Spoken Wayfinding',
      speaking: 'Speaking guidance in clear Indian voice...',
      ready: 'Tap Play or any step to hear voice navigation',
      replay: 'Replay Voice',
      play: 'Play Spoken Guide',
      next: 'Next Waypoint',
      prev: 'Previous Waypoint',
      soundOn: 'Voice Active',
      soundMuted: 'Muted',
      stepCount: 'Waypoint',
      activeVoiceLabel: 'AI Voice Engine'
    },
    timeline: {
      heading: 'Step-by-Step Route Roadmap & Stationed Sevaks',
      sub: 'Follow the dedicated priority corridor with live volunteer support at each station',
      distanceTag: 'Distance',
      currentStep: 'ACTIVE WAYPOINT',
      volunteerOnDuty: 'Volunteer on Duty',
      liveCrowdTag: 'Corridor Crowd Status',
      callBtn: 'Call Volunteer'
    },
    help: {
      title: 'Need immediate physical escort on route?',
      desc: 'Trained temple sevaks and wheelchairs are stationed along every priority gate.',
      btn: 'Request Immediate Volunteer Escort'
    }
  },
  hi: {
    backToHome: 'होम पर वापस जाएं',
    portalTag: 'सुगम दर्शन • सुलभ तीर्थ मार्गदर्शिका',
    heading: 'प्राथमिकता सहायता एवं लाइव आवाज नेविगेशन',
    subheading: 'वरिष्ठ नागरिकों, गर्भवती माताओं और दिव्यांग श्रद्धालुओं के लिए लाइव स्वयंसेवक स्थिति और भीड़ नियंत्रण के साथ शुद्ध व मधुर भारतीय आवाज में मार्गदर्शन।',
    selectRoute: 'तीर्थ धाम चुनें',
    assistanceCategory: 'श्रद्धालु सहायता श्रेणी',
    categories: {
      elderly: { title: 'वरिष्ठ नागरिक', icon: '👴', sub: 'प्राथमिकता रैंप व गर्भगृह बैठक पंक्ति' },
      pregnant: { title: 'गर्भवती माताएं', icon: '🤰', sub: 'शीतल छायादार गलियारा व विश्राम स्थल' },
      differently_abled: { title: 'व्हीलचेयर / दिव्यांगजन', icon: '♿', sub: '100% बाधारहित लिफ्ट व रैंप सुविधा' }
    },
    templeNames: {
      tmp_somnath: 'सोमनाथ ज्योतिर्लिंग',
      tmp_dwarka: 'द्वारकाधीश मंदिर',
      tmp_ambaji: 'अंबाजी शक्तिपीठ',
      tmp_pavagadh: 'पावागढ़ कालिका माता'
    },
    locations: {
      tmp_somnath: 'प्रभास पाटन, गिर सोमनाथ',
      tmp_dwarka: 'द्वारका, देवभूमि द्वारका',
      tmp_ambaji: 'अंबाजी, बनासकांठा',
      tmp_pavagadh: 'पावागढ़ पर्वत, पंचमहाल'
    },
    voiceBox: {
      title: 'मधुर भारतीय आवाज मार्गदर्शन',
      speaking: 'आवाज निर्देश चल रहा है...',
      ready: 'आवाज सुनने के लिए प्ले या किसी भी चरण पर टैप करें',
      replay: 'पुनः सुनें',
      play: 'आवाज शुरू करें',
      next: 'अगला पड़ाव',
      prev: 'पिछला पड़ाव',
      soundOn: 'आवाज चालू',
      soundMuted: 'मौन (Muted)',
      stepCount: 'पड़ाव',
      activeVoiceLabel: 'एआई वॉयस इंजन'
    },
    timeline: {
      heading: 'चरण-दर-चरण तीर्थ मार्ग एवं तैनात स्वयंसेवक',
      sub: 'प्रवेश द्वार से गर्भगृह तक समर्पित प्राथमिकता मार्ग व हर पड़ाव पर तैनात स्वयंसेवक',
      distanceTag: 'दूरी',
      currentStep: 'वर्तमान पड़ाव',
      volunteerOnDuty: 'तैनात स्वयंसेवक',
      liveCrowdTag: 'गलियारा भीड़ स्थिति',
      callBtn: 'कॉल करें'
    },
    help: {
      title: 'मार्ग में तत्काल स्वयंसेवक सहायता चाहिए?',
      desc: 'प्रशिक्षित स्वयंसेवक व व्हीलचेयर सहायता प्रत्येक प्राथमिकता द्वार पर तैनात हैं।',
      btn: 'तत्काल स्वयंसेवक एस्कॉर्ट बुलाएं'
    }
  },
  gu: {
    backToHome: 'હોમ પર પાછા જાઓ',
    portalTag: 'સુગમ દર્શન • સુલભ યાત્રા માર્ગદર્શિકા',
    heading: 'પ્રાધાન્યતા સહાય અને લાઈવ ઓડિયો નેવિગેશન',
    subheading: 'વરિષ્ઠ નાગરિકો, સગર્ભા બહેનો અને દિવ્યાંગ ભક્તો માટે લાઈવ સ્વયંસેવક સ્થિતિ અને ભીડ માહિતી સાથે શુદ્ધ અને મધુર ગુજરાતી અવાજમાં માર્ગદર્શન.',
    selectRoute: 'તીર્થ ધામ પસંદ કરો',
    assistanceCategory: 'યાત્રાળુ સહાયતા શ્રેણી',
    categories: {
      elderly: { title: 'વરિષ્ઠ નાગરિક', icon: '👴', sub: 'પ્રાયોરિટી રેમ્પ અને ગર્ભગૃહ બેઠક લાઇન' },
      pregnant: { title: 'સગર્ભા બહેનો', icon: '🤰', sub: 'છાયાવાળો ટૂંકો માર્ગ અને આરામ સ્થળ' },
      differently_abled: { title: 'વ્હીલચેેર / દિવ્યાંગજન', icon: '♿', sub: '૧૦૦% અવરોધમુક્ત લિફ્ટ અને રેમ્પ સુવિધા' }
    },
    templeNames: {
      tmp_somnath: 'સોમનાથ જ્યોતિર્લિંગ',
      tmp_dwarka: 'દ્વારકાધીશ મંદિર',
      tmp_ambaji: 'અંબાજી શક્તિપીઠ',
      tmp_pavagadh: 'પાવાગઢ કાલિકા માતા'
    },
    locations: {
      tmp_somnath: 'પ્રભાસ પાટણ, ગીર સોમનાથ',
      tmp_dwarka: 'દ્વારકા, દેવભૂમિ દ્વારકા',
      tmp_ambaji: 'અંબાજી, બનાસકાંઠા',
      tmp_pavagadh: 'પાવાગઢ ડુંગર, પંચમહાલ'
    },
    voiceBox: {
      title: 'મધુર ભારતીય અવાજ માર્ગદર્શન',
      speaking: 'અવાજ નિર્દેશ ચાલી રહ્યો છે...',
      ready: 'અવાજ સાંભળવા માટે પ્લે અથવા કોઈપણ પગલા પર ટેપ કરો',
      replay: 'ફરી સાંભળો',
      play: 'અવાજ શરૂ કરો',
      next: 'આગળનો સ્ટોપ',
      prev: 'પાછળનો સ્ટોપ',
      soundOn: 'અવાજ ચાલુ',
      soundMuted: 'મૌન (Muted)',
      stepCount: 'પગલું',
      activeVoiceLabel: 'એઆઈ વોઇસ એન્જિન'
    },
    timeline: {
      heading: 'પગલે-પગલે યાત્રા માર્ગ અને હાજર સ્વયંસેવકો',
      sub: 'પ્રવેશ દ્વારથી ગર્ભગૃહ દર્શન સુધી દરેક સ્ટેશન પર સ્વયંસેવક સહાય',
      distanceTag: 'અંતર',
      currentStep: 'હાલનું સ્ટોપ',
      volunteerOnDuty: 'હાજર સ્વયંસેવક',
      liveCrowdTag: 'કોરિડોર ભીડ સ્થિતિ',
      callBtn: 'કૉલ કરો'
    },
    help: {
      title: 'માર્ગમાં તાત્કાલિક સહાયની જરૂર છે?',
      desc: 'તાલીમબદ્ધ સ્વયંસેવકો અને વ્હીલચેેર દરેક પ્રાયોરિટી ગેટ પર ઉપસ્થિત છે.',
      btn: 'તાત્કાલિક સ્વયંસેવક બોલાવો'
    }
  }
};

export const PriorityAudioNav = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const ui = UI_TEXT[currentLanguage] || UI_TEXT.en;

  const [selectedTempleId, setSelectedTempleId] = useState('tmp_somnath');
  const [priorityType, setPriorityType] = useState('elderly');
  const [voiceNavActive, setVoiceNavActive] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState('Natural Indian Female');

  const isGujarati = currentLanguage === 'gu';
  const isHindi = currentLanguage === 'hi';

  // Detect active Indian voice name for transparency
  useEffect(() => {
    const v = getBestIndianFemaleVoice(currentLanguage);
    if (v) {
      setActiveVoiceName(v.name.replace('Microsoft ', '').replace('Google ', ''));
    }
  }, [currentLanguage]);

  // Master Temple Routes with live volunteer integration and real-time crowd metrics
  const TEMPLE_ROUTES = {
    tmp_somnath: {
      name: ui.templeNames.tmp_somnath,
      location: ui.locations.tmp_somnath,
      symbol: '🔱',
      steps: [
        {
          step: 1,
          distance: '0 - 20m',
          tag: 'Entrance Gate',
          title: isGujarati ? 'ગેટ ૨ પ્રાયોરિટી સીનિયર રેમ્પ પ્રવેશ' : isHindi ? 'गेट 2 प्रायोरिटी सीनियर रैंप प्रवेश' : 'Gate 2 Priority Senior Ramp Entrance',
          desc: isGujarati ? 'મુખ્ય દિગ્વિજય દ્વારની જમણી બાજુએ ૧૫ મીટર પર આવેલ છે. સમર્પિત વ્હીલચેેર સહાય ઉપલબ્ધ.' : isHindi ? 'मुख्य दिग्विजय द्वार के 15 मीटर दाईं ओर स्थित। समर्पित व्हीलचेयर सहायता उपलब्ध।' : 'Located 15 meters right of main Digvijay Dwar. Dedicated wheelchair escort available.',
          volunteer: {
            name: 'Vikram Patel',
            name_hi: 'विक्रम पटेल',
            name_gu: 'વિક્રમ પટેલ',
            role: 'Wheelchair Support Lead',
            role_hi: 'वरिष्ठ व्हीलचेयर सेवा प्रमुख',
            role_gu: 'વરિષ્ઠ વ્હીલચેેર સહાય પ્રમુખ',
            badge: 'VOL-201',
            phone: '+91 98251 40912',
            station: 'Gate 2 North Ramp',
            station_hi: 'गेट 2 उत्तर रैंप',
            station_gu: 'ગેટ ૨ ઉત્તર રેમ્પ',
            status: 'Active on Duty',
            avatar: '👨‍💼'
          },
          crowd: {
            densityLoad: 24,
            statusText: isGujarati ? 'સંપૂર્ણ સુગમ (૦ મિનિટ પ્રતીક્ષા)' : isHindi ? 'पूर्णतः सुगम (0 मिनट प्रतीक्षा)' : 'Smooth Flow (0 min wait)',
            generalGateLoad: 78,
            timeSaved: '45 mins'
          },
          en: "Jai Somnath! Welcome to Somnath Temple Gate 2 Priority Ramp. General Gate 1 currently has 78% crowd, but your priority ramp is clear at only 24% load. Walk straight 20 paces. Dedicated wheelchair assistance and priority helpers are available at the North Ramp to escort you.",
          hi: "जय श्री सोमनाथ! सोमनाथ मंदिर गेट 2 प्रायोरिटी रैंप पर आपका हार्दिक स्वागत है। मुख्य गेट 1 पर 78% भारी भीड़ है, जबकि आपका प्राथमिकता मार्ग केवल 24% लोड पर एकदम शांत और सुगम है। सीधे 20 कदम आगे बढ़ें। व्हीलचेयर सहायता एवं मंदिर सेवा दल उत्तर रैंप पर आपकी सहायता हेतु उपस्थित हैं।",
          gu: "જય શ્રી સોમનાથ! સોમનાથ મંદિર ગેટ ૨ પ્રાયોરિટી રેમ્પ પર આપનું હાર્દિક સ્વાગત છે. મુખ્ય ગેટ ૧ પર ૭૮% ભીડ છે, પરંતુ આપનો પ્રાયોરિટી રેમ્પ માત્ર ૨૪% પર એકદમ શાંત છે. સીધા ૨૦ ડગલાં આગળ વધો. વ્હીલચેેર સહાય અને સેવા દળ ઉત્તર રેમ્પ પર આપની સેવામાં હાજર છે."
        },
        {
          step: 2,
          distance: '40m Ahead',
          tag: 'Medical & Rest Area',
          title: isGujarati ? 'દિગ્વિજય દ્વાર મેડિકલ બૂથ અને વિશ્રામ સ્થળ' : isHindi ? 'दिग्विजय द्वार मेडिकल बूथ एवं विश्राम क्षेत्र' : 'Digvijay Dwar Medical Booth & Rest Area',
          desc: isGujarati ? 'લાઇનની ડાબી બાજુએ ૪૦ મીટર આગળ. મફત આરઓ શીતળ જળ અને મેડિકલ સેવા.' : isHindi ? 'कतार की बाईं ओर 40 मीटर आगे। निःशुल्क आरओ शीतल जल एवं आपातकालीन चिकित्सा देखभाल।' : '40 meters ahead on the left side of queue line. Free RO drinking water & medical emergency care.',
          volunteer: {
            name: 'Temple Seva Desk',
            name_hi: 'मंदिर सेवा केंद्र',
            name_gu: 'મંદિર સેવા કેન્દ્ર',
            role: 'Medical First-Aid Team',
            role_hi: 'प्राथमिक चिकित्सा एवं जल सेवा टीम',
            role_gu: 'પ્રાથમિક સારવાર અને જળ સેવા ટીમ',
            badge: 'SEVA-SOM',
            phone: '1800-NIRVIGHNA',
            station: 'Booth B (Shaded Zone)',
            station_hi: 'बूथ बी (शीतल विश्राम क्षेत्र)',
            station_gu: 'બૂથ બી (વિશ્રામ સ્થળ)',
            status: 'Active on Duty',
            avatar: '🏥'
          },
          crowd: {
            densityLoad: 18,
            statusText: isGujarati ? 'આરામદાયક વિશ્રામ ઉપલબ્ધ' : isHindi ? 'आरामदायक बैठक उपलब्ध' : 'Seated Rest & RO Water Available',
            generalGateLoad: 75,
            timeSaved: '30 mins'
          },
          en: "Proceeding 40 meters ahead. On your left is Medical Booth B and the chilled drinking water station. Qualified medical staff are available if you need hydration, blood pressure check, or resting chairs.",
          hi: "40 मीटर आगे बढ़ें। दिग्विजय द्वार प्रायोरिटी गलियारे के बाईं ओर मेडिकल बूथ बी एवं शीतल जल सेवा उपलब्ध है। मेडिकल टीम विश्राम कुर्सी, जल व प्राथमिक चिकित्सा हेतु तैयार है।",
          gu: "૪૦ મીટર આગળ વધો. પ્રાયોરિટી કોરિડોરની ડાબી બાજુએ મેડિકલ બૂથ અને શીતળ જળ સેવા ઉપલબ્ધ છે. મેડિકલ ટીમ વિશ્રામ અને પ્રાથમિક સારવાર માટે હાજર છે."
        },
        {
          step: 3,
          distance: 'Sanctum Corridor',
          tag: 'Direct Darshan Window',
          title: isGujarati ? 'ગર્ભગૃહ અંતર્ગત જ્યોતિર્લિંગ દર્શન લાઇન' : isHindi ? 'गर्भगृह मुख्य ज्योतिर्लिंग दर्शन पंक्ति' : 'Garbhagriha Inner Sanctum Darshan Line',
          desc: isGujarati ? 'વરિષ્ઠ નાગરિકો અને સગર્ભા માતાઓ માટે જ્યોતિર્લિંગ સામે સીધી બેઠક લાઇન.' : isHindi ? 'वरिष्ठ नागरिकों एवं गर्भवती माताओं के लिए ज्योतिर्लिंग के सम्मुख समर्पित बैठक पंक्ति।' : 'Priority seating row for seniors & expectant mothers directly facing Jyotirlinga sanctum.',
          volunteer: {
            name: 'Sanctum Seva Staff',
            name_hi: 'गर्भगृह सेवा दल',
            name_gu: 'ગર્ભગૃહ સેવા દળ',
            role: 'Sanctum Queue Coordinator',
            role_hi: 'गर्भगृह व्यवस्थापक',
            role_gu: 'ગર્ભગૃહ વ્યવસ્થાપક',
            badge: 'SEVA-SOM',
            phone: '1800-NIRVIGHNA',
            station: 'Sanctum Seated Row',
            station_hi: 'गर्भगृह बैठक पंक्ति',
            station_gu: 'ગર્ભગૃહ બેઠક લાઇન',
            status: 'Active on Duty',
            avatar: '🕉️'
          },
          crowd: {
            densityLoad: 35,
            statusText: isGujarati ? 'શાંત અને દિવ્ય દર્શન' : isHindi ? 'शांत एवं सुलभ दर्शन' : 'Direct Seated Sanctum View',
            generalGateLoad: 88,
            timeSaved: '60 mins'
          },
          en: "You are now entering the Garbhagriha Inner Sanctum. Follow the dedicated carpeted priority seating row for peaceful, unobstructed darshan of Lord Somnath Mahadev.",
          hi: "अब आप गर्भगृह के मुख्य दर्शन द्वार में प्रवेश कर रहे हैं। कृपया कालीन बिछी समर्पित बैठक पंक्ति में आगे बढ़ें। सोमनाथ महादेव के शांतिपूर्ण व निर्विघ्न दर्शन करें।",
          gu: "હવે આપ ગર્ભગૃહના મુખ્ય દર્શન દ્વારમાં પ્રવેશ કરી રહ્યા છો. કાર્પેટવાળી સમર્પિત બેઠક લાઇનમાં આગળ વધી સોમનાથ મહાદેવના શાંતિપૂર્ણ દર્શન કરો."
        },
        {
          step: 4,
          distance: 'Exit Corridor',
          tag: 'Express Exit & Prasad',
          title: isGujarati ? 'મહાપ્રસાદ કાઉન્ટર અને દક્ષિણ એક્સપ્રેસ એક્ઝિટ' : isHindi ? 'महाप्रसाद काउंटर एवं दक्षिण एक्सप्रेस निकास' : 'Mahaprasad Counter & South Express Exit',
          desc: isGujarati ? 'સામાન્ય ભીડ ટાળવા માટે સમર્પિત પ્રાયોરિટી એક્ઝિટ રેમ્પ.' : isHindi ? 'सामान्य भीड़ से बचने हेतु समर्पित प्रायोरिटी निकास रैंप।' : 'Dedicated priority exit ramp avoiding main crowd exit.',
          volunteer: {
            name: 'Exit Seva Counter',
            name_hi: 'निकास सहायता केंद्र',
            name_gu: 'એક્ઝિટ સહાયતા કેન્દ્ર',
            role: 'Prasad & Mobility Support',
            role_hi: 'प्रसाद एवं ई-कार्ट समन्वयक',
            role_gu: 'પ્રસાદ અને ઈ-કાર્ટ વ્યવસ્થાપક',
            badge: 'SEVA-SOM',
            phone: '1800-NIRVIGHNA',
            station: 'South Priority Exit',
            station_hi: 'दक्षिण प्रायोरिटी निकास',
            station_gu: 'દક્ષિણ પ્રાયોરિટી એક્ઝિટ',
            status: 'Active on Duty',
            avatar: '🛺'
          },
          crowd: {
            densityLoad: 20,
            statusText: isGujarati ? 'ઝડપી નિકાસ ઉપલબ્ધ' : isHindi ? 'त्वरित निकास एवं प्रसाद' : 'Clear Exit & Battery Carts Ready',
            generalGateLoad: 68,
            timeSaved: '20 mins'
          },
          en: "Approaching the Mahaprasad Counter and South Express Exit Ramp. Battery carts are ready at the exit corridor to escort pilgrims to the parking area. May Lord Somnath bless your journey!",
          hi: "महाप्रसाद काउंटर एवं दक्षिण एक्सप्रेस निकास रैंप के पास पहुँच रहे हैं। पार्किंग तक ई-बैटरी कार्ट सेवा उपलब्ध है। भगवान सोमनाथ आपकी यात्रा मंगलमय करें!",
          gu: "મહાપ્રસાદ કાઉન્ટર અને દક્ષિણ એક્સપ્રેસ એક્ઝિટ રેમ્પ નજીક પહોંચી રહ્યા છો. પાર્કિંગ સુધી ઈ-કાર્ટ સહાય તૈયાર છે. ભગવાન સોમનાથ આપનું કલ્યાણ કરે!"
        }
      ]
    },
    tmp_dwarka: {
      name: ui.templeNames.tmp_dwarka,
      location: ui.locations.tmp_dwarka,
      symbol: '🛕',
      steps: [
        {
          step: 1,
          distance: '0 - 15m',
          tag: 'Gomti Ghat Entry',
          title: isGujarati ? 'સ્વર્ગ દ્વાર પ્રાયોરિટી રેમ્પ પ્રવેશ' : isHindi ? 'स्वर्ग द्वार प्रायोरिटी रैंप प्रवेश' : 'Swarga Dwar Priority Ramp Entry',
          desc: isGujarati ? 'જગત મંદિરની ગોમતી નદી બાજુએ સીધો પ્રાયોરિટી રેમ્પ પ્રવેશ.' : isHindi ? 'जगत मंदिर के गोमती नदी किनारे सीधा प्रायोरिटी रैंप प्रवेश।' : 'Direct priority ramp entrance on Gomti River side of Jagat Mandir.',
          volunteer: {
            name: 'Ramesh Dave',
            name_hi: 'रमेश दवे',
            name_gu: 'રમેશ દવે',
            role: 'Gomti Ghat Senior Escort',
            role_hi: 'गोमती घाट वरिष्ठ सहायता प्रमुख',
            role_gu: 'ગોમતી ઘાટ વરિષ્ઠ સહાય પ્રમુખ',
            badge: 'VOL-204',
            phone: '+91 98795 23140',
            station: 'Swarga Dwar Ramp',
            station_hi: 'स्वर्ग द्वार रैंप',
            station_gu: 'સ્વર્ગ દ્વાર રેમ્પ',
            status: 'Active on Duty',
            avatar: '👨‍🦰'
          },
          crowd: {
            densityLoad: 28,
            statusText: isGujarati ? 'સુગમ રેમ્પ (પગથિયાં ચઢવાની જરૂર નથી)' : isHindi ? 'सुगम रैंप (सीढ़ियां चढ़ने से मुक्ति)' : 'Stair-Free Ramp Active',
            generalGateLoad: 85,
            timeSaved: '50 mins'
          },
          en: "Jai Shri Krishna! Welcome to Dwarkadhish Jagat Mandir Swarga Dwar Priority Ramp. General steps have 85% crowd, but your priority ramp bypasses all 56 steps. Wheelchair assistance and temple sevaks are standing at the entrance to escort you.",
          hi: "जय श्री कृष्णा! द्वारकाधीश जगत् मंदिर स्वर्ग द्वार प्रायोरिटी रैंप पर आपका स्वागत है। सामान्य 56 सीढ़ियों पर 85% भारी भीड़ है, लेकिन आपका प्राथमिकता रैंप सीढ़ियां चढ़े बिना सीधा प्रवेश देता है। व्हीलचेयर सहायता एवं मंदिर सेवक द्वार पर उपस्थित हैं।",
          gu: "જય શ્રી કૃષ્ણા! દ્વારકાધીશ જગત મંદિર સ્વર્ગ દ્વાર પ્રાયોરિટી રેમ્પ પર આપનું સ્વાગત છે. સામાન્ય ૫૬ પગથિયાં પર ૮૫% ભીડ છે, પરંતુ આપનો રેમ્પ પગથિયાં ચઢ્યા વિના સરળ પ્રવેશ આપે છે. વ્હીલચેેર સહાય અને મંદિર સેવકો હાજર છે."
        },
        {
          step: 2,
          distance: '35m Straight',
          tag: 'Sudama Setu Shelter',
          title: isGujarati ? 'સુદામા સેતુ આરામ આશ્રય અને શીતળ જળ' : isHindi ? 'सुदामा सेतु विश्राम शेल्टर एवं पेयजल' : 'Sudama Setu Rest Shelter & Drinking Water',
          desc: isGujarati ? 'પ્રાયોરિટી શૌચાલય સુવિધા સાથે ૩૫ મીટર આગળ છાયાવાળો બેઠક વિસ્તાર.' : isHindi ? 'प्रायोरिटी शौचालय सुविधा युक्त 35 मीटर आगे छायादार विश्राम स्थल।' : 'Covered seating area 35 meters straight ahead with priority restroom facilities.',
          volunteer: {
            name: 'Rest Pavilion Staff',
            name_hi: 'विश्राम मंडप सेवा',
            name_gu: 'આરામ મંડપ સેવા',
            role: 'Matru Seva Team',
            role_hi: 'मातृ सेवा एवं विश्राम सहायता',
            role_gu: 'માતૃ સેવા અને આરામ સહાય',
            badge: 'SEVA-DWR',
            phone: '1800-NIRVIGHNA',
            station: 'Sudama Setu Pavilion',
            station_hi: 'सुदामा सेतु मंडप',
            station_gu: 'સુદામા સેતુ મંડપ',
            status: 'Active on Duty',
            avatar: '🪑'
          },
          crowd: {
            densityLoad: 22,
            statusText: isGujarati ? 'છાયાવાળો આરામ કક્ષ' : isHindi ? 'छायादार शीतल विश्राम कक्ष' : 'Covered Rest & Clean Washrooms',
            generalGateLoad: 72,
            timeSaved: '25 mins'
          },
          en: "Walk 35 meters straight to Sudama Setu Covered Pavilion. Clean drinking water, resting chairs, and priority washroom facilities are available for expectant mothers and seniors.",
          hi: "35 मीटर सीधे सुदामा सेतु छायादार विश्राम स्थल की ओर बढ़ें। गर्भवती माताओं और वरिष्ठ श्रद्धालुओं के विश्राम, शीतल जल व स्वच्छ शौचालय व्यवस्था उपलब्ध है।",
          gu: "૩૫ મીટર સીધા સુદામા સેતુ છાયાવાળા આરામ મંડપ તરફ આગળ વધો. સગર્ભા માતાઓ અને વરિષ્ઠોના આરામ અને શીતળ જળની વ્યવસ્થા ઉપલબ્ધ છે."
        },
        {
          step: 3,
          distance: 'Sanctum View',
          tag: 'Shringar Darshan',
          title: isGujarati ? 'જગત મંદિર ગર્ભગૃહ શૃંગાર દર્શન પંક્તિ' : isHindi ? 'जगत मंदिर गर्भगृह शृंगार दर्शन पंक्ति' : 'Jagat Mandir Garbhagriha Special Row',
          desc: isGujarati ? 'ભગવાન શ્રીકૃષ્ણના શૃંગાર દર્શન માટે સીધી બેઠક લાઇન ઍક્સેસ.' : isHindi ? 'भगवान श्री कृष्ण शृंगार दर्शन हेतु सीधी सुलभ बैठक पंक्ति।' : 'Direct eye-level view of Lord Krishna Shringar Darshan with seated row access.',
          volunteer: {
            name: 'Sanctum Darshan Staff',
            name_hi: 'गर्भगृह दर्शन सेवा',
            name_gu: 'ગર્ભગૃહ દર્શન સેવા',
            role: 'Jagat Mandir Seva Staff',
            role_hi: 'जगत् मंदिर दर्शन सेवक',
            role_gu: 'જગત મંદિર દર્શન સેવક',
            badge: 'SEVA-DWR',
            phone: '1800-NIRVIGHNA',
            station: 'Inner Sanctum Seating',
            station_hi: 'गर्भगृह सम्मुख पंक्ति',
            station_gu: 'ગર્ભગૃહ દર્શન લાઇન',
            status: 'Active on Duty',
            avatar: '🛕'
          },
          crowd: {
            densityLoad: 32,
            statusText: isGujarati ? 'ઠાકોરજીના દિવ્ય શૃંગાર દર્શન' : isHindi ? 'ठाकुरजी के दिव्य शृंगार दर्शन' : 'Special Darshan Seating',
            generalGateLoad: 92,
            timeSaved: '75 mins'
          },
          en: "Entering the Garbhagriha Shringar Darshan Row. Follow the seated line for a direct view of Lord Krishna. Enjoy peaceful darshan of Dwarkadhish.",
          hi: "अब जगत् मंदिर गर्भगृह शृंगार दर्शन पंक्ति में प्रवेश कर रहे हैं। भगवान द्वारकाधीश के सम्मुख बैठक पंक्ति में आगे बढ़ें और शांतिपूर्ण दर्शन प्राप्त करें।",
          gu: "હવે જગત મંદિર ગર્ભગૃહ શૃંગાર દર્શન લાઇનમાં પ્રવેશ કરી રહ્યા છો. ભગવાન દ્વારકાધીશના સન્મુખ બેઠક લાઇનમાં આગળ વધી શાંતિપૂર્ણ દર્શન કરો."
        },
        {
          step: 4,
          distance: 'Moksha Gate',
          tag: 'Prasad & Return',
          title: isGujarati ? 'છપ્પન ભોગ પ્રસાદ અને મોક્ષ દ્વાર એક્ઝિટ' : isHindi ? 'छप्पन भोग प्रसाद एवं मोक्ष द्वार निकास' : 'Chhappan Bhog Prasad & Moksha Dwar Exit',
          desc: isGujarati ? 'ગોમતી ઘાટ તરફ ઝડપી અને સુગમ નિકાસ કોરિડોર.' : isHindi ? 'गोमती घाट की ओर त्वरित एवं सुगम निकास गलियारा।' : 'Quick exit corridor towards Gomti Ghat.',
          volunteer: {
            name: 'Prasad & Exit Counter',
            name_hi: 'प्रसाद एवं निकास केंद्र',
            name_gu: 'પ્રસાદ અને એક્ઝિટ કાઉન્ટર',
            role: 'Express Exit & Footwear Lead',
            role_hi: 'निकास एवं फुटवेयर सहायता',
            role_gu: 'એક્ઝિટ અને ફુટવેર સહાય',
            badge: 'SEVA-DWR',
            phone: '1800-NIRVIGHNA',
            station: 'Moksha Dwar Gate 2',
            station_hi: 'मोक्ष द्वार गेट 2',
            station_gu: 'મોક્ષ દ્વાર ગેટ ૨',
            status: 'Active on Duty',
            avatar: '🎁'
          },
          crowd: {
            densityLoad: 25,
            statusText: isGujarati ? 'પ્રસાદ અને ફુટવેર કાઉન્ટર તૈયાર' : isHindi ? 'प्रसाद एवं जूता लॉकर तुरंत उपलब्ध' : 'Prasad & Footwear Ready',
            generalGateLoad: 60,
            timeSaved: '20 mins'
          },
          en: "Approaching Chhappan Bhog Prasad Counter and Moksha Dwar Express Exit. Footwear counters are ready to return your deposited shoes with zero queue. May Dwarkadhish bless you!",
          hi: "छप्पन भोग प्रसाद काउंटर और मोक्ष द्वार एक्सप्रेस निकास के पास पहुँच रहे हैं। स्मार्ट फुटवेयर लॉकर पर आपका सामान बिना लाइन तुरंत प्राप्त कर सकते हैं। भगवान द्वारकाधीश आपका कल्याण करें!",
          gu: "છપ્પન ભોગ પ્રસાદ કાઉન્ટર અને મોક્ષ દ્વાર એક્સપ્રેસ એક્ઝિટ નજીક પહોંચી રહ્યા છો. ફુટવેર લોકર પર આપના જૂતા-ચપ્પલ વિના વિલંબે મેળવી શકો છો. ભગવાન દ્વારકાધીશ આપની રક્ષા કરે!"
        }
      ]
    },
    tmp_ambaji: {
      name: ui.templeNames.tmp_ambaji,
      location: ui.locations.tmp_ambaji,
      symbol: '🚩',
      steps: [
        {
          step: 1,
          distance: 'Gate 1 Ramp',
          tag: 'Shaded Canopy Entry',
          title: isGujarati ? 'ચાચર ચોક ગેટ ૧ સીનિયર રેમ્પ પ્રવેશ' : isHindi ? 'चाचर चौक गेट 1 सीनियर रैंप प्रवेश' : 'Chachar Chowk Gate 1 Senior Ramp',
          desc: isGujarati ? 'મુખ્ય મંદિર પ્રાંગણ તરફ જતો છાયાવાળો સમર્પિત રેમ્પ.' : isHindi ? 'मुख्य मंदिर प्रांगण की ओर जाने वाला छायादार समर्पित रैंप।' : 'Dedicated ramp entrance with shaded canopy leading to main Temple Court.',
          volunteer: {
            name: 'Shakti Peeth Seva Staff',
            name_hi: 'शक्तिपीठ सेवा दल',
            name_gu: 'શક્તિપીઠ સેવા દળ',
            role: 'Priority Ramp Team',
            role_hi: 'प्रायोरिटी रैंप सेवा दल',
            role_gu: 'પ્રાયોરિટી રેમ્પ સેવા દળ',
            badge: 'SEVA-AMB',
            phone: '1800-NIRVIGHNA',
            station: 'Chachar Chowk Gate 1',
            station_hi: 'चाचर चौक गेट 1',
            station_gu: 'ચાચર ચોક ગેટ ૧',
            status: 'Active on Duty',
            avatar: '🚩'
          },
          crowd: {
            densityLoad: 30,
            statusText: isGujarati ? 'છાયાવાળો સુરક્ષિત માર્ગ' : isHindi ? 'छायादार सुरक्षित प्रवेश' : 'Shaded Canopy Active',
            generalGateLoad: 82,
            timeSaved: '40 mins'
          },
          en: "Jai Mata Di! Welcome to Ambaji Shakti Peeth Gate 1 Chachar Chowk Priority Ramp. Chachar Chowk main gate has 82% rush, but your covered ramp is smooth at 30% load. Dedicated priority helpers are standing by to assist you.",
          hi: "जय माता दी! अंबाजी शक्तिपीठ गेट 1 चाचर चौक प्रायोरिटी रैंप पर आपका स्वागत है। मुख्य चाचर चौक पर 82% भारी भीड़ है, लेकिन आपका छायादार रैंप केवल 30% लोड पर सहज है। मंदिर सेवा दल सहायता हेतु द्वार पर उपस्थित है।",
          gu: "જય માતાજી! અંબાજી શક્તિપીઠ ગેટ ૧ ચાચર ચોક પ્રાયોરિટી રેમ્પ પર આપનું સ્વાગત છે. મુખ્ય ચોકમાં ૮૨% ભીડ છે, પરંતુ આપનો છાયાવાળો રેમ્પ માત્ર ૩૦% પર સુગમ છે. મંદિર સેવા દળ સહાય માટે હાજર છે."
        },
        {
          step: 2,
          distance: '50m Inside',
          tag: '24/7 First-Aid Station',
          title: isGujarati ? 'પદયાત્રી મેડિકલ ફર્સ્ટ-એઇડ કેમ્પ' : isHindi ? 'पदयात्री मेडिकल प्राथमिक चिकित्सा शिविर' : 'Padyatri Medical First-Aid Camp',
          desc: isGujarati ? 'ગેટની અંદર ૫૦ મીટર પર ૨૪/૭ ડૉક્ટર અને હાઇડ્રેશન ડેસ્ક.' : isHindi ? 'गेट के अंदर 50 मीटर पर 24/7 डॉक्टर एवं जल सेवा केंद्र।' : '24/7 doctor and hydration desk located 50m inside gate.',
          volunteer: {
            name: 'Padyatri Care Unit',
            name_hi: 'पदयात्री सेवा केंद्र',
            name_gu: 'પદયાત્રી સેવા કેન્દ્ર',
            role: 'Emergency Medical Team',
            role_hi: 'आपातकालीन चिकित्सा टीम',
            role_gu: 'કટોકટી સારવાર ટીમ',
            badge: 'SEVA-AMB',
            phone: '1800-NIRVIGHNA',
            station: 'Rest Station 2',
            station_hi: 'विश्राम केंद्र 2',
            station_gu: 'વિશ્રામ કેન્દ્ર ૨',
            status: 'Active on Duty',
            avatar: '🏥'
          },
          crowd: {
            densityLoad: 20,
            statusText: isGujarati ? '૨૪/૭ ડૉક્ટર અને ઓક્સિજન તૈયાર' : isHindi ? '24/7 डॉक्टर एवं ऑक्सीजन सुविधा' : '24/7 Doctors & Oxygen on Standby',
            generalGateLoad: 70,
            timeSaved: '25 mins'
          },
          en: "Proceeding 50 meters inside to Padyatri Medical Rest Camp. Oxygen support, ORS hydration, and resting cots are available 24/7.",
          hi: "50 मीटर आगे पदयात्री मेडिकल विश्राम शिविर की ओर बढ़ें। पदयात्रियों के लिए ऑक्सीजन, ओआरएस एवं विश्राम स्थल की सुविधा 24/7 उपलब्ध है।",
          gu: "૫૦ મીટર અંદર પદયાત્રી મેડિકલ વિશ્રામ કેન્દ્ર તરફ આગળ વધો. ઓક્સિજન, ઓઆરએસ અને આરામની સુવિધા ૨૪/૭ ઉપલબ્ધ છે."
        },
        {
          step: 3,
          distance: 'Inner Sanctum',
          tag: 'Akhand Jyot Window',
          title: isGujarati ? 'વિશા યંત્ર ગર્ભગૃહ અખંડ જ્યોત દર્શન લાઇન' : isHindi ? 'विश्व यंत्र गर्भगृह अखंड जोत दर्शन पंक्ति' : 'Viswa Yantra Garbhagriha Priority Line',
          desc: isGujarati ? 'અખંડ જ્યોતની બરાબર સામે ઊંચી બેઠક વ્યવસ્થા.' : isHindi ? 'अखंड ज्योति के सम्मुख सुलभ उन्नत बैठक व्यवस्था।' : 'Elevated seating area directly in front of Akhand Jyot.',
          volunteer: {
            name: 'Sanctum Seva Staff',
            name_hi: 'गर्भगृह व्यवस्थापन',
            name_gu: 'ગર્ભગૃહ વ્યવસ્થાપન',
            role: 'Darshan Support Staff',
            role_hi: 'गर्भगृह दर्शन व्यवस्थापक',
            role_gu: 'ગર્ભગૃહ દર્શન વ્યવસ્થાપક',
            badge: 'SEVA-AMB',
            phone: '1800-NIRVIGHNA',
            station: 'Akhand Jyot Deck',
            station_hi: 'अखंड जोत दर्शन मंडप',
            station_gu: 'અખંડ જ્યોત દર્શન ડેક',
            status: 'Active on Duty',
            avatar: '🔱'
          },
          crowd: {
            densityLoad: 35,
            statusText: isGujarati ? 'મા અંબાના દિવ્ય અખંડ જ્યોત દર્શન' : isHindi ? 'माँ अम्बे की अखंड जोत के दर्शन' : 'Clear View of Akhand Jyot',
            generalGateLoad: 88,
            timeSaved: '60 mins'
          },
          en: "Now approaching the Viswa Yantra Garbhagriha Akhand Jyot Darshan Window. Please follow the elevated priority row for peaceful prayer and blessing.",
          hi: "अब विश्व यंत्र गर्भगृह अखंड जोत दर्शन द्वार के पास पहुँच रहे हैं। कृपया उन्नत प्राथमिकता पंक्ति में आगे बढ़ें और सुगम व पवित्र दर्शन प्राप्त करें।",
          gu: "હવે વિશા યંત્ર ગર્ભગૃહ અખંડ જ્યોત દર્શન દ્વાર નજીક પહોંચી રહ્યા છો. પ્રાયોરિટી લાઇનમાં આગળ વધી શાંતિપૂર્ણ દર્શન કરો."
        },
        {
          step: 4,
          distance: 'Terminal Exit',
          tag: 'E-Shuttle Buses',
          title: isGujarati ? 'છાતરિયા ગેટ પ્રસાદ અને શટલ બસ એક્ઝિટ' : isHindi ? 'छतारिया गेट प्रसाद एवं शटल बस निकास' : 'Chhatariya Gate Prasad & Bus Shuttle Exit',
          desc: isGujarati ? 'મફત ઇલેક્ટ્રિક શટલ બસ સાથે સીધું જોડાણ.' : isHindi ? 'निःशुल्क इलेक्ट्रिक शटल बसों से सीधा संपर्क।' : 'Direct connection to free electric shuttle buses.',
          volunteer: {
            name: 'Prasad & Shuttle Desk',
            name_hi: 'प्रसाद एवं बस केंद्र',
            name_gu: 'પ્રસાદ અને બસ કેન્દ્ર',
            role: 'Prasad & Shuttle Staff',
            role_hi: 'मोहनथाल प्रसाद एवं बस सेवा',
            role_gu: 'મોહનથાળ પ્રસાદ અને બસ સેવા',
            badge: 'SEVA-AMB',
            phone: '1800-NIRVIGHNA',
            station: 'Chhatariya Gate Terminal',
            station_hi: 'छतारिया गेट बस स्टैंड',
            station_gu: 'છાતરિયા ગેટ ટર્મિનલ',
            status: 'Active on Duty',
            avatar: '🚌'
          },
          crowd: {
            densityLoad: 24,
            statusText: isGujarati ? 'મોહનથાળ પ્રસાદ અને ઇ-બસ ઉપલબ્ધ' : isHindi ? 'मोहनथाल प्रसाद एवं ई-बसें उपलब्ध' : 'Express Prasad & Electric Bus Ready',
            generalGateLoad: 65,
            timeSaved: '30 mins'
          },
          en: "Approaching the Mohanthal Prasad Counter and Chhatariya Gate Shuttle Terminal. Free electric shuttle buses are available to take pilgrims to parking. Bol Shri Ambe Mat ki Jai!",
          hi: "मोहनथाल प्रसाद काउंटर और छतारिया गेट बस स्टैंड की ओर बढ़ रहे हैं। पार्किंग तक जाने हेतु निःशुल्क इलेक्ट्रिक शटल बसें उपलब्ध हैं। बोलिए श्री अम्बे मात की जय!",
          gu: "મોહનથાળ પ્રસાદ કાઉન્ટર અને છાતરિયા ગેટ શટલ બસ સ્ટેન્ડ નજીક પહોંચી રહ્યા છો. પાર્કિંગ તરફ જવા માટે મફત ઇલેક્ટ્રિક શટલ બસો હાજર છે. બોલ શ્રી અંબે માત કી જય!"
        }
      ]
    },
    tmp_pavagadh: {
      name: ui.templeNames.tmp_pavagadh,
      location: ui.locations.tmp_pavagadh,
      symbol: '🔱',
      steps: [
        {
          step: 1,
          distance: 'Machi Station',
          tag: 'Ropeway Express Lane',
          title: isGujarati ? 'ઉડન ખટોલા રોપવે પ્રાયોરિટી પ્લેટફોર્મ' : isHindi ? 'उड़न खटोला रोपवे प्रायोरिटी प्लेटफॉर्म' : 'Udan Khatola Ropeway Priority Platform',
          desc: isGujarati ? 'વરિષ્ઠ નાગરિકો, સગર્ભા બહેનો અને દિવ્યાંગો માટે એક્સપ્રેસ લાઇન.' : isHindi ? 'वरिष्ठ नागरिकों, गर्भवती महिलाओं एवं दिव्यांगों हेतु एक्सप्रेस बोर्डिंग लेन।' : 'Express board lane for elderly, pregnant women & disabled pilgrims.',
          volunteer: {
            name: 'Ropeway Priority Desk',
            name_hi: 'रोपवे सहायता केंद्र',
            name_gu: 'રોપવે સહાયતા કેન્દ્ર',
            role: 'Ropeway Seva Staff',
            role_hi: 'रोपवे प्रायोरिटी बोर्डिंग सेवा',
            role_gu: 'રોપવે પ્રાયોરિટી બોર્ડિંગ સેવા',
            badge: 'SEVA-PVG',
            phone: '1800-NIRVIGHNA',
            station: 'Machi Station Platform 1',
            station_hi: 'माची स्टेशन प्लेटफॉर्म 1',
            station_gu: 'માચી સ્ટેશન પ્લેટફોર્મ ૧',
            status: 'Active on Duty',
            avatar: '🚡'
          },
          crowd: {
            densityLoad: 32,
            statusText: isGujarati ? 'રોપવે એક્સપ્રેસ બોર્ડિંગ (૦ લાઇન)' : isHindi ? 'रोपवे एक्सप्रेस बोर्डिंग (शून्य कतार)' : 'Express Cable Car Boarding',
            generalGateLoad: 90,
            timeSaved: '90 mins'
          },
          en: "Jai Mahakali! Welcome to Pavagadh Hill Udan Khatola Priority Gate. General ropeway queue has a 90 minute wait, but your priority lane has direct boarding. Temple staff at Platform 1 will assist with direct entry.",
          hi: "जय माँ महाकाली! पावागढ़ पर्वत उड़न खटोला रोपवे प्रायोरिटी गेट पर आपका स्वागत है। सामान्य रोपवे लाइन में 90 मिनट की भारी भीड़ है, लेकिन आपकी प्रायोरिटी लेन में तुरंत बोर्डिंग उपलब्ध है। प्लेटफॉर्म 1 पर उपस्थित सेवा दल आपकी सीधी बोर्डिंग में सहायता करेगा।",
          gu: "જય મા મહાકાળી! પાવાગઢ ડુંગર ઉડન ખટોલા રોપવે પ્રાયોરિટી ગેટ પર આપનું સ્વાગત છે. સામાન્ય રોપવે લાઇન ૯૦ મિનિટ ભરેલી છે, પરંતુ આપની પ્રાયોરિટી લેનમાં તાત્કાલિક પ્રવેશ છે. પ્લેટફોર્મ ૧ પર સેવા દળ આપને સીધા પ્રવેશમાં સહાય કરશે."
        },
        {
          step: 2,
          distance: 'Upper Platform',
          tag: 'Cooling Shelter',
          title: isGujarati ? 'દૂધિયા તળાવ આરામ ગૃહ અને મેડિકલ યુનિટ' : isHindi ? 'दूधिया तालाब विश्राम गृह एवं मेडिकल यूनिट' : 'Dudhiya Talav Rest Shelter & Medical Unit',
          desc: isGujarati ? 'રોપવે અપર સ્ટેશન એક્ઝિટ પર આવેલ શીતળ આરામ આશ્રય.' : isHindi ? 'रोपवे अपर स्टेशन निकास पर स्थित शीतल विश्राम स्थल।' : 'Cooling rest shelter located at ropeway upper station exit.',
          volunteer: {
            name: 'Summit Rest Shelter',
            name_hi: 'शिखर विश्राम सेवा',
            name_gu: 'શિખર આરામ સેવા',
            role: 'Hilltop Care Team',
            role_hi: 'पर्वत शिखर सेवा प्रभारी',
            role_gu: 'પર્વત શિખર સેવા પ્રભારી',
            badge: 'SEVA-PVG',
            phone: '1800-NIRVIGHNA',
            station: 'Dudhiya Talav Shelter',
            station_hi: 'दूधिया तालाब शेल्टर',
            station_gu: 'દૂધિયા તળાવ શેલ્ટર',
            status: 'Active on Duty',
            avatar: '🏕️'
          },
          crowd: {
            densityLoad: 26,
            statusText: isGujarati ? 'હાઇડ્રેશન અને આરામ સ્થળ' : isHindi ? 'शीतल जल एवं विश्राम स्थल' : 'Hydration & Cooling Pavilion',
            generalGateLoad: 75,
            timeSaved: '20 mins'
          },
          en: "Arriving at the Upper Cable Platform. Walk 20 meters to the Dudhiya Talav Rest Station. Chilled water, blood pressure checks, and shaded resting chairs are available.",
          hi: "रोपवे ऊपरी प्लेटफॉर्म पर पहुँच रहे हैं। 20 मीटर आगे दूधिया तालाब विश्राम गृह स्थित है। शीतल जल, बीपी चेक एवं विश्राम कुर्सियों की व्यवस्था उपलब्ध है।",
          gu: "રોપવે ઉપલા પ્લેટફોર્મ પર પહોંચી રહ્યા છો. ૨૦ મીટર આગળ દૂધિયા તળાવ આરામ સ્થળ છે. શીતળ જળ અને આરામની સુવિધા ઉપલબ્ધ છે."
        },
        {
          step: 3,
          distance: 'Hill Summit',
          tag: '54m Hydraulic Lift',
          title: isGujarati ? 'કાલિકા માતા મંદિર ગર્ભગૃહ હાઇડ્રોલિક લિફ્ટ' : isHindi ? 'कालिका माता मंदिर गर्भगृह हाइड्रोलिक लिफ्ट' : 'Kalika Mata Temple Garbhagriha Lift',
          desc: isGujarati ? '૨૫૦ પગથિયાં ચઢવાનું ટાળીને સીધી મંદિર શિખર સુધી જતી લિફ્ટ.' : isHindi ? '250 सीढ़ियों की चढ़ाई से बचाकर सीधे मंदिर तक पहुंचाने वाली हाइड्रोलिक लिफ्ट।' : 'Hydraulic lift avoiding 250 stair climb directly to temple shrine.',
          volunteer: {
            name: 'Hydraulic Lift Seva',
            name_hi: 'हाइड्रोलिक लिफ्ट सेवा',
            name_gu: 'હાઇડ્રોલિક લિફ્ટ સેવા',
            role: 'Lift Operation Team',
            role_hi: 'शिखर लिफ्ट सेवा दल',
            role_gu: 'શિખર લિફ્ટ સેવા દળ',
            badge: 'SEVA-PVG',
            phone: '1800-NIRVIGHNA',
            station: 'Summit Lift Terminal',
            station_hi: 'शिखर लिफ्ट प्रवेश द्वार',
            station_gu: 'શિખર લિફ્ટ પ્રવેશ દ્વાર',
            status: 'Active on Duty',
            avatar: '🛗'
          },
          crowd: {
            densityLoad: 28,
            statusText: isGujarati ? 'લિફ્ટ દ્વારા સીધો શિખર પ્રવેશ' : isHindi ? 'सीढ़ियां चढ़े बिना सीधा शिखर प्रवेश' : 'Direct 54m Lift • Zero Stair Climb',
            generalGateLoad: 88,
            timeSaved: '45 mins'
          },
          en: "Entering the 54-meter Hydraulic Express Lift directly to Maa Kalika Mata Garbhagriha. You do not need to climb 250 steep stairs. The express lift will take you directly to the top shrine.",
          hi: "माँ कालिका माता गर्भगृह तक सीधी 54 मीटर हाइड्रोलिक एक्सप्रेस लिफ्ट में प्रवेश कर रहे हैं। आपको 250 कठिन सीढ़ियां चढ़ने की कोई आवश्यकता नहीं है। एक्सप्रेस लिफ्ट आपको सीधे मंदिर शिखर तक ले जाएगी।",
          gu: "હવે મા કાલિકા માતા ગર્ભગૃહ તરફ જતી ૫૪ મીટર હાઇડ્રોલિક એક્સપ્રેસ લિફ્ટમાં પ્રવેશ કરી રહ્યા છો. ૨૫૦ પગથિયાં ચઢવાની કોઈ જરૂર નથી. એક્સપ્રેસ લિફ્ટ આપને સીધા મંદિર શિખરે પહોંચાડશે."
        },
        {
          step: 4,
          distance: 'Return Gate',
          tag: 'Return Cable Car',
          title: isGujarati ? 'પર્વત શિખર પ્રસાદ કાઉન્ટર અને રિટર્ન રોપવે' : isHindi ? 'पहाड़ शिखर प्रसाद काउंटर एवं रिटर्न रोपवे' : 'Hill Top Prasad Counter & Return Ropeway',
          desc: isGujarati ? 'વાપસી કેબલ કાર રાઇડ માટે એક્સપ્રેસ પ્રાયોરિટી લાઇન.' : isHindi ? 'वापसी केबल कार यात्रा हेतु एक्सप्रेस प्रायोरिटी लेन।' : 'Express priority lane for return cable car ride.',
          volunteer: {
            name: 'Return Ropeway Seva',
            name_hi: 'वापसी रोपवे सेवा',
            name_gu: 'વાપસી રોપવે સેવા',
            role: 'Return Boarding Team',
            role_hi: 'वापसी रोपवे एवं प्रसाद सेवा',
            role_gu: 'વાપસી રોપવે અને પ્રસાદ સેવા',
            badge: 'SEVA-PVG',
            phone: '1800-NIRVIGHNA',
            station: 'Hill Summit Exit',
            station_hi: 'पहाड़ शिखर निकास',
            station_gu: 'પર્વત શિખર એક્ઝિટ',
            status: 'Active on Duty',
            avatar: '🚡'
          },
          crowd: {
            densityLoad: 22,
            statusText: isGujarati ? 'સુખરૂપ દર્શન અને વાપસી રોપવે તૈયાર' : isHindi ? 'सुलभ दर्शन एवं वापसी केबल कार' : 'Prasad Counter & Express Return Cable Car',
            generalGateLoad: 70,
            timeSaved: '35 mins'
          },
          en: "Approaching the Hill Top Prasad Counter and Return Ropeway Priority Gate. Priority boarding is available for your return journey to Machi Station. May Maa Kalika bless you!",
          hi: "पहाड़ शिखर प्रसाद काउंटर और वापसी रोपवे प्रायोरिटी गेट के पास पहुँच रहे हैं। आपकी माची स्टेशन वापसी हेतु सुलभ बोर्डिंग उपलब्ध है। माँ महाकाली की कृपा आप पर बनी रहे!",
          gu: "પર્વત શિખર પ્રસાદ કાઉન્ટર અને રિટર્ન રોપવે પ્રાયોરિટી ગેટ નજીક પહોંચી રહ્યા છો. માચી સ્ટેશન વાપસી માટે સરળ બોર્ડિંગ ઉપલબ્ધ છે. મા કાલિકા આપનું કલ્યાણ કરે!"
        }
      ]
    }
  };

  const currentRoute = TEMPLE_ROUTES[selectedTempleId] || TEMPLE_ROUTES.tmp_somnath;
  const currentStepData = currentRoute.steps.find(s => s.step === activeStep) || currentRoute.steps[0];
  const activePromptText = isGujarati ? (currentStepData.gu || currentStepData.hi || currentStepData.en) : isHindi ? currentStepData.hi : currentStepData.en;

  const speakVoicePrompt = (textToSpeak, withChime = true) => {
    setSpeaking(true);
    setVoiceNavActive(true);

    speakNaturalIndianVoice(textToSpeak || activePromptText, currentLanguage, {
      pitch: 1.0,
      rate: 0.95,
      playChime: withChime,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false)
    });
  };

  const handleTestSound = () => {
    speakVoicePrompt(
      isGujarati
        ? 'જય શ્રી કૃષ્ણ! નિર્વિઘ્ન ઓડિયો નેવિગેશન સંપૂર્ણ રીતે સક્રિય છે.'
        : isHindi
        ? 'जय श्री कृष्ण! निर्विघ्न ऑडियो नेविगेशन पूर्णतः सक्रिय है।'
        : 'Jai Shri Krishna! Nirvighna Audio Navigation is active and ready.',
      true
    );
  };

  useEffect(() => {
    return () => {
      stopNaturalIndianVoice();
    };
  }, []);

  // Auto-center screen on active waypoint card whenever step changes
  useEffect(() => {
    const cardEl = document.getElementById(`waypoint-step-${activeStep}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeStep, selectedTempleId]);

  const handleNextStep = () => {
    if (activeStep < currentRoute.steps.length) {
      const next = activeStep + 1;
      setActiveStep(next);
      const nextData = currentRoute.steps.find(s => s.step === next);
      if (voiceNavActive && nextData) {
        speakVoicePrompt(isGujarati ? (nextData.gu || nextData.hi || nextData.en) : isHindi ? nextData.hi : nextData.en, true);
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      const prev = activeStep - 1;
      setActiveStep(prev);
      const prevData = currentRoute.steps.find(s => s.step === prev);
      if (voiceNavActive && prevData) {
        speakVoicePrompt(isGujarati ? (prevData.gu || prevData.hi || prevData.en) : isHindi ? prevData.hi : prevData.en, true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[max(env(safe-area-inset-top,28px),28px)] pb-12 px-3.5 sm:px-6 lg:px-8 font-body text-gray-800 selection:bg-gold selection:text-indigo-dark">

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Navigation Bar with Tri-Language Voice Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-xs border border-gray-200 hover:border-maroon font-bold text-xs text-maroon hover:bg-maroon hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{ui.backToHome}</span>
          </button>

          {/* Tri-Language Audio Selector Pills */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-gold/40 shadow-xs">
            <span className="text-[11px] font-black uppercase text-maroon font-heading px-2 hidden sm:inline-flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Language:</span>
            </span>
            {[
              { id: 'hi', label: '🇮🇳 हिन्दी' },
              { id: 'gu', label: '🔱 ગુજરાતી' },
              { id: 'en', label: '🌍 English' },
            ].map((langItem) => {
              const isCurrent = currentLanguage === langItem.id;
              return (
                <button
                  key={langItem.id}
                  type="button"
                  onClick={() => {
                    setLanguage(langItem.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isCurrent
                      ? 'bg-maroon text-white border-maroon shadow-xs ring-1 ring-gold scale-[1.02]'
                      : 'bg-ivory text-gray-700 border-gray-200 hover:border-maroon/40 hover:bg-amber-50'
                  }`}
                >
                  <span>{langItem.label}</span>
                  {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-gold" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Devotional Header */}
        <div className="bg-gradient-to-r from-maroon via-[#5F242C] to-maroon text-white p-6 sm:p-7 rounded-2xl shadow-md border-b-4 border-gold relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-[11px] font-bold tracking-wider uppercase font-heading border border-white/15">
                <Accessibility className="w-3.5 h-3.5 text-gold" />
                <span>{ui.portalTag}</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-heading text-white tracking-tight">
                {ui.heading}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 font-normal leading-relaxed">
                {ui.subheading}
              </p>
            </div>

            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-gold/40 text-gold text-2xl shrink-0 shadow-inner">
              🔱
            </div>
          </div>
        </div>

        {/* Temple Shrine Selector Tabs */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider font-heading px-1">
            {ui.selectRoute}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MASTER_TEMPLES.map((tItem) => {
              const isSelected = selectedTempleId === tItem.id;
              const icons = { tmp_somnath: '🔱', tmp_dwarka: '🛕', tmp_ambaji: '🚩', tmp_pavagadh: '🔱' };
              const templeDisplayName = ui.templeNames[tItem.id] || tItem.name;
              const templeLocation = ui.locations[tItem.id] || tItem.location;

              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => {
                    setSelectedTempleId(tItem.id);
                    setActiveStep(1);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-maroon text-white border-maroon shadow-md ring-2 ring-gold/60 scale-[1.01]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-maroon/40 hover:bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{icons[tItem.id]}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-gold shrink-0"></span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-extrabold font-heading leading-tight ${isSelected ? 'text-gold' : 'text-gray-900'}`}>
                      {templeDisplayName}
                    </h3>
                    <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-amber-200' : 'text-gray-500'}`}>
                      {templeLocation}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assistance Category Pills */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-xs space-y-3">
          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider font-heading">
            {ui.assistanceCategory}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(ui.categories).map(([key, cat]) => {
              const isSelected = priorityType === key;
              return (
                <button
                  key={key}
                  onClick={() => setPriorityType(key)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-gold/70 text-maroon shadow-xs ring-1 ring-gold/40'
                      : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black font-heading text-gray-900 leading-tight">
                      {cat.title}
                    </p>
                    <p className="text-[11px] text-gray-600 font-normal mt-0.5 leading-snug">
                      {cat.sub}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-maroon shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Spoken Audio Navigation Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-gold/50 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!voiceNavActive) setVoiceNavActive(true);
                  speakVoicePrompt(activePromptText);
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  speaking 
                    ? 'bg-gold text-indigo-dark shadow-md ring-4 ring-gold/30 animate-pulse' 
                    : 'bg-maroon text-white hover:bg-[#5F242C]'
                }`}
                title="Play Spoken Direction in Indian Female Voice"
              >
                {speaking ? (
                  <div className="flex items-center gap-0.5 h-5">
                    <span className="w-1 bg-indigo-dark h-full animate-bounce rounded-full"></span>
                    <span className="w-1 bg-indigo-dark h-3 animate-bounce [animation-delay:0.15s] rounded-full"></span>
                    <span className="w-1 bg-indigo-dark h-5 animate-bounce [animation-delay:0.3s] rounded-full"></span>
                  </div>
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 font-heading">
                  {ui.voiceBox.title}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  {speaking ? ui.voiceBox.speaking : ui.voiceBox.ready}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* Quick Language Toggle */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                {[
                  { id: 'hi', label: 'हिन्दी' },
                  { id: 'gu', label: 'ગુજરાતી' },
                  { id: 'en', label: 'EN' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                      currentLanguage === l.id
                        ? 'bg-maroon text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleTestSound}
                className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-gold text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🔔</span>
                <span>{isGujarati ? 'અવાજ ટેસ્ટ' : isHindi ? 'ध्वनि टेस्ट' : 'Test Sound'}</span>
              </button>

              <button
                type="button"
                onClick={() => speakVoicePrompt(activePromptText)}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-maroon border border-gold/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{ui.voiceBox.replay}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (voiceNavActive) {
                    stopNaturalIndianVoice();
                    setSpeaking(false);
                    setVoiceNavActive(false);
                  } else {
                    setVoiceNavActive(true);
                    speakVoicePrompt(activePromptText);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  voiceNavActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {voiceNavActive ? '🔊 ' + ui.voiceBox.soundOn : '🔇 ' + ui.voiceBox.soundMuted}
              </button>
            </div>
          </div>

          {/* Current Step Spoken Text Quote */}
          <div className="bg-[#FFFDF8] p-4 rounded-xl border border-amber-200/60 flex items-start gap-3.5 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-maroon text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
              {activeStep}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-900 leading-relaxed">
                "{activePromptText}"
              </p>
            </div>
          </div>

          {/* Step Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              disabled={activeStep <= 1}
              onClick={handlePrevStep}
              className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xs font-bold text-gray-700 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              ← {ui.voiceBox.prev}
            </button>

            <span className="text-xs font-mono font-bold text-gray-600">
              {ui.voiceBox.stepCount} {activeStep} / {currentRoute.steps.length}
            </span>

            <button
              type="button"
              disabled={activeStep >= currentRoute.steps.length}
              onClick={handleNextStep}
              className="px-3.5 py-1.5 rounded-lg bg-maroon hover:bg-[#5F242C] disabled:opacity-40 text-xs font-bold text-white transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {ui.voiceBox.next} →
            </button>
          </div>
        </div>

        {/* Step-by-Step Wayfinding Roadmap with Stationed Volunteers & Live Crowd */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-gray-900 font-heading">
                {ui.timeline.heading}
              </h2>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                {ui.timeline.sub}
              </p>
            </div>
            <span className="text-xs font-bold text-maroon bg-maroon/10 px-3 py-1 rounded-full self-start sm:self-auto font-mono">
              {currentRoute.steps.length} Active Stations
            </span>
          </div>

          {/* Connected Vertical Timeline */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-amber-200">
            {currentRoute.steps.map((s) => {
              const isActive = activeStep === s.step;
              const isDone = activeStep > s.step;

              return (
                <div
                  key={s.step}
                  id={`waypoint-step-${s.step}`}
                  onClick={() => {
                    setActiveStep(s.step);
                    if (voiceNavActive) {
                      speakVoicePrompt(isGujarati ? (s.gu || s.hi || s.en) : isHindi ? s.hi : s.en, true);
                    }
                  }}
                  className={`relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${

                    isActive
                      ? 'bg-amber-50/40 border-gold shadow-md ring-2 ring-gold/40'
                      : isDone
                        ? 'bg-emerald-50/20 border-emerald-200/60 hover:bg-gray-50'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  {/* Step Node Marker on timeline line */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-4 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-xs transition-all ${
                      isActive
                        ? 'bg-maroon text-white border-gold ring-2 ring-gold/40 scale-110'
                        : isDone
                          ? 'bg-emerald-600 text-white border-emerald-300'
                          : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {isDone ? '✓' : s.step}
                  </div>

                  <div className="space-y-3">
                    {/* Header Row: Distance, Tag, Active badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {s.distance}
                        </span>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded">
                          {s.tag}
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-black uppercase text-maroon bg-maroon/10 px-2 py-0.5 rounded font-heading flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-maroon shrink-0" />
                          {ui.timeline.currentStep}
                        </span>
                      )}
                    </div>

                    {/* Step Title & Description */}
                    <div>
                      <h3 className={`text-sm sm:text-base font-black font-heading leading-snug ${isActive ? 'text-maroon' : 'text-gray-900'}`}>
                        {s.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed mt-1">
                        {s.desc}
                      </p>
                    </div>

                    {/* Live Crowd & Savings Card */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 pt-1">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-heading">
                            {ui.timeline.liveCrowdTag}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-emerald-800">
                          {s.crowd.statusText}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 text-xs font-black font-mono">
                          {s.crowd.densityLoad}% Load
                        </div>
                        <p className="text-[9px] font-semibold text-gray-400 mt-0.5">
                          Saves ~{s.crowd.timeSaved}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="pt-2 border-t border-amber-200/40 flex items-center justify-between text-xs text-maroon font-bold">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Tap to replay guidance in Indian female voice</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-maroon" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* On-Demand Support Card */}
        <div className="bg-[#FFFDF9] p-5 sm:p-6 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-maroon flex items-center justify-center font-black text-2xl shrink-0 shadow-inner">
              🛟
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 font-heading">
                {ui.help.title}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {ui.help.desc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              alert(
                isGujarati
                  ? 'મંદિર સહાયતા ટીમ અને વ્હીલચેેર આપની તરફ રવાના કરવામાં આવી છે.'
                  : isHindi
                  ? 'मंदिर सहायता दल एवं व्हीलचेयर आपकी सहायता हेतु रवाना कर दी गई है।'
                  : 'Temple assistance team and wheelchair support have been dispatched to your corridor.'
              );
            }}
            className="w-full sm:w-auto px-5 py-3 bg-maroon hover:bg-[#5F242C] text-white font-bold rounded-xl text-xs transition-all shadow-md shrink-0 cursor-pointer uppercase tracking-wider font-heading"
          >
            {ui.help.btn} 🚨
          </button>
        </div>

      </div>
    </div>
  );
};
