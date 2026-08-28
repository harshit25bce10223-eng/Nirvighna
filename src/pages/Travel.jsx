
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NirvighnaAIEngine } from '../lib/aiCrowdEngine';
import { cctvHeatmapService } from '../lib/cctvHeatmapService';
import { ropewayEngine } from '../lib/ropewayEngine';
import { boatCrossingEngine } from '../lib/boatCrossingEngine';
import { liveWeatherService } from '../lib/liveWeatherService';
import { getTempleById, getUniqueTemples, getLocalizedTempleName, getLocalizedTempleLocation } from '../lib/templeRegistry';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { CalendarModal } from '../components/CalendarModal';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import QRCode from 'qrcode';
import { 
  Bus, Car, MapPin, Clock, ChevronLeft, Loader2, Navigation, 
  AlertTriangle, Shield, CheckCircle, Flame, ArrowRight, RefreshCw, Footprints, Anchor, Calendar as CalendarIcon,
  Users, ChevronDown, ChevronUp, Plus, X, User, Phone, Check
} from 'lucide-react';

const translations = {
  en: {
    back: 'Back',
    pageTitle: 'Pilgrim Travel & Parking Guide',
    pageSubtitle: 'Official Transit & Parking Services',
    parkingShuttle: 'Parking & Shuttles',
    parkingLots: 'Official Parking Grounds',
    shuttleService: 'Electric Transit Shuttles',
    available: 'Available',
    full: 'Full',
    capacity: 'Capacity',
    nextShuttle: 'Next shuttle in',
    minutes: 'min',
    loading: 'Loading travel info...',
    selectTemple: 'Select Temple',
    ropewayTab: '🚠 Cable Car (Ropeway)',
    boatTab: '⛵ Ferry Boat Crossing',
    parkingTab: '🚗 Parking & Shuttles',
    operational: 'Operational',
    weatherSafe: 'Weather Normal',
    bookPass: 'Book Boarding Pass',
    stepClimb: 'Trekking Stairs Route (2,000 Steps)',
    cableCar: 'Udan Khatola Cable Car (7 Mins)',
    officialHubTitle: 'Official Travel Guide',
    nearestRail: 'Nearest Railway Station',
    nearestAirport: 'Nearest Airport',
    localTransit: 'Bus & Local Transit',
    officialParking: 'Official Parking',
    nextElectricShuttle: 'Next Electric Shuttle',
    aiBestParking: 'AI Recommended Best Parking Ground',
    freeSlots: 'Available Spots',
    grounds: 'Grounds',
    selectDirection: 'Select Direction',
    ascentOnly: 'Up Only (Ascent)',
    roundTrip: 'Up + Down (Return)',
    perAdult: '/ Adult',
    travelDate: 'Travel Date',
    calendarPicker: '📅 Calendar Picker',
    selectTimeWindow: 'Select Time Window',
    cabinCap: 'Cabin Capacity: 80 / window',
    yourDetailsHeader: 'Your Details (Primary Pilgrim)',
    mobilePhone: 'Mobile Phone',
    mobilePlaceholder: '10-digit mobile',
    pilgrimName: 'Pilgrim Name',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    govIdType: 'Govt ID Type (Optional)',
    selectIdType: 'Select ID Type (Optional)',
    aadhaar: 'Aadhaar Card',
    voterId: 'Voter ID',
    drivingLicense: 'Driving License',
    passport: 'Passport',
    panCard: 'PAN Card',
    bloodGroup: 'Blood Group (Optional)',
    emergencyContactTitleRopeway: 'Emergency Contact (High-Altitude Hill Transit)',
    emergencyContactTitleBoat: 'Emergency Contact (Sea Crossing Safety)',
    emergencyName: 'Emergency Contact Name',
    emergencyPhone: 'Emergency Phone Number',
    emergencyEmail: 'Emergency Contact Email',
    addFamilyGroup: 'Add Family / Group Members',
    added: 'Added',
    quickSaved: '⚡ Quick 1-Click Select Saved Family Members:',
    savedMemberBadge: 'Family Member',
    memberName: 'Member Name',
    memberAge: 'Age',
    memberPhone: 'Phone',
    addMemberBtn: '+ Add Another Family Member',
    totalPayable: 'Total Payable Fare:',
    passengers: 'Passenger(s)',
    confirmRopeway: 'Confirm & Generate Boarding Pass →',
    confirmBoat: 'Confirm & Generate Boat Boarding Pass →',
    preferTrekking: 'Prefer Trekking Route',
    bookRopewayBtn: 'Book Ropeway Express',
    selectBoatTime: 'Select Departure Time & Tide Status',
    naukaTitle: 'Bet Dwarka Boat Ferry Crossing',
    naukaSubtitle: 'Okha Port Passenger Jetty ↔ Bet Dwarkadhish Mandir Island (~20 mins sea ride)',
    tideRegulated: 'Tide Regulated',
    boatPassHeader: 'BET DWARKA BOAT BOARDING PASS',
    departureTimeLabel: 'Departure Time',
    okhaGate: 'Okha Port Jetty Gate 1',
    crossingDate: 'Crossing Date',
    seats: 'Seats',
    currentlyUnsafe: 'Currently Unsafe',
    idealTide: 'Ideal Tide',
    highTideCaution: 'High Tide Caution',
    lowTideCaution: 'Low Tide Caution',
    readyForStaffScan: 'Ready for Staff Scan',
    bookAnother: 'Book Another Pass',
    cableCarToken: 'OFFICIAL CABLE CAR ENTRY TOKEN',
    ferryToken: 'OFFICIAL FERRY BOAT ENTRY TOKEN'
  },
  hi: {
    back: 'वापस',
    pageTitle: 'तीर्थ यात्रा एवं वाहन पार्किंग',
    pageSubtitle: 'अधिकृत परिवहन एवं पार्किंग सेवा',
    parkingShuttle: 'पार्किंग एवं शटल बस',
    parkingLots: 'अधिकृत वाहन पार्किंग स्थल',
    shuttleService: 'इलेक्ट्रिक तीर्थ शटल सेवा',
    available: 'उपलब्ध',
    full: 'पूर्ण',
    capacity: 'कुल क्षमता',
    nextShuttle: 'अगली शटल बस',
    minutes: 'मिनट',
    loading: 'यात्रा जानकारी लोड हो रही है...',
    selectTemple: 'तीर्थ स्थल चुनें',
    ropewayTab: '🚠 उड़न खटोला (रोपवे)',
    boatTab: '⛵ तीर्थ नौका सेवा',
    parkingTab: '🚗 पार्किंग एवं शटल बस',
    operational: 'सुचारू रूप से चालू',
    weatherSafe: 'मौसम पूर्णतः सुरक्षित',
    bookPass: 'बोर्डिंग पास बुक करें',
    stepClimb: 'पैदल सीढ़ी मार्ग (2,000 सीढ़ियाँ)',
    cableCar: 'उड़न खटोला केबल कार (7 मिनट)',
    officialHubTitle: 'आधिकारिक यात्रा सेवा',
    nearestRail: 'निकटतम रेलवे स्टेशन',
    nearestAirport: 'निकटतम हवाई अड्डा',
    localTransit: 'लोकल बस व टैक्सी स्टैंड',
    officialParking: 'अधिकृत वाहन पार्किंग',
    nextElectricShuttle: 'अगली इलेक्ट्रिक शटल',
    aiBestParking: 'AI अनुशंसित सर्वोत्तम पार्किंग स्थल',
    freeSlots: 'उपलब्ध स्थान',
    grounds: 'पार्किंग स्थल',
    selectDirection: 'दिशा चुनें',
    ascentOnly: 'केवल ऊपर (चढ़ाई)',
    roundTrip: 'ऊपर + नीचे (वापसी)',
    perAdult: '/ व्यक्ति',
    travelDate: 'यात्रा तिथि',
    calendarPicker: '📅 कैलेंडर चुनें',
    selectTimeWindow: 'समय स्लॉट चुनें',
    cabinCap: 'केबिन क्षमता: 80 / स्लॉट',
    yourDetailsHeader: 'आपकी जानकारी (मुख्य तीर्थयात्री)',
    mobilePhone: 'मोबाइल नंबर',
    mobilePlaceholder: '10 अंकों का मोबाइल',
    pilgrimName: 'तीर्थयात्री का नाम',
    fullName: 'पूरा नाम',
    emailAddress: 'ईमेल पता',
    govIdType: 'सरकारी पहचान पत्र (वैकल्पिक)',
    selectIdType: 'आईडी प्रकार चुनें (वैकल्पिक)',
    aadhaar: 'आधार कार्ड',
    voterId: 'मतदाता पहचान पत्र',
    drivingLicense: 'ड्राइविंग लाइसेंस',
    passport: 'पासपोर्ट',
    panCard: 'पैन कार्ड',
    bloodGroup: 'रक्त समूह (वैकल्पिक)',
    emergencyContactTitleRopeway: 'आपातकालीन संपर्क (पहाड़ी सुरक्षा)',
    emergencyContactTitleBoat: 'आपातकालीन संपर्क (समुद्री नौका सुरक्षा)',
    emergencyName: 'आपातकालीन संपर्क नाम',
    emergencyPhone: 'आपातकालीन फोन नंबर',
    emergencyEmail: 'आपातकालीन ईमेल',
    addFamilyGroup: 'परिवार / समूह सदस्य जोड़ें',
    added: 'जोड़े गए',
    quickSaved: '⚡ 1-क्लिक में सहेजे गए परिवार सदस्य चुनें:',
    savedMemberBadge: 'परिवार सदस्य',
    memberName: 'सदस्य का नाम',
    memberAge: 'आयु',
    memberPhone: 'फोन नंबर',
    addMemberBtn: '+ अन्य परिवार सदस्य जोड़ें',
    totalPayable: 'कुल देय शुल्क:',
    passengers: 'यात्री',
    confirmRopeway: 'पुष्टि करें एवं बोर्डिंग पास प्राप्त करें →',
    confirmBoat: 'पुष्टि करें एवं नौका पास प्राप्त करें →',
    preferTrekking: 'पैदल सीढ़ी मार्ग चुनें',
    bookRopewayBtn: 'रोपवे एक्सप्रेस बुक करें',
    selectBoatTime: 'प्रस्थान समय एवं ज्वार-भाटा सुरक्षा स्थिति चुनें',
    naukaTitle: 'बेट द्वारका पवित्र नौका फेरी सेवा',
    naukaSubtitle: 'ओखा पोर्ट यात्री जेट्टी ↔ बेट द्वारकाधीश मंदिर द्वीप (~20 मिनट समुद्री यात्रा)',
    tideRegulated: 'ज्वार-भाटा नियंत्रित',
    boatPassHeader: 'बेट द्वारका नौका बोर्डिंग पास',
    departureTimeLabel: 'प्रस्थान समय',
    okhaGate: 'ओखा पोर्ट नौका घाट गेट 1',
    crossingDate: 'नौका यात्रा तिथि',
    seats: 'सीटें',
    currentlyUnsafe: 'वर्तमान में असुरक्षित',
    idealTide: 'अनुकूल ज्वार',
    highTideCaution: 'उच्च ज्वार सतर्कता',
    lowTideCaution: 'निम्न ज्वार सतर्कता',
    readyForStaffScan: 'कर्मचारी स्कैन हेतु तैयार',
    bookAnother: 'अन्य पास बुक करें',
    cableCarToken: 'आधिकारिक उड़न खटोला प्रवेश टोकन',
    ferryToken: 'आधिकारिक नौका सेवा प्रवेश टोकन'
  },
  gu: {
    back: 'પાછા',
    pageTitle: 'તીર્થ યાત્રા અને વાહન પાર્કિંગ',
    pageSubtitle: 'અધિકૃત પરિવહન અને પાર્કિંગ સેવા',
    parkingShuttle: 'પાર્કિંગ અને શટલ બસ',
    parkingLots: 'અધિકૃત વાહન પાર્કિંગ સ્થળો',
    shuttleService: 'ઇલેક્ટ્રિક યાત્રાળુ શટલ સેવા',
    available: 'ઉપલબ્ધ',
    full: 'ભરેલું',
    capacity: 'કુલ ક્ષમતા',
    nextShuttle: 'આગળની શટલ બસ',
    minutes: 'મિનિટ',
    loading: 'પ્રવાસ માહિતી લોડ થઈ રહી છે...',
    selectTemple: 'યાત્રાધામ પસંદ કરો',
    ropewayTab: '🚠 ઉડન ખટોલા (રોપવે)',
    boatTab: '⛵ યાત્રા બોટ સેવા',
    parkingTab: '🚗 પાર્કિંગ અને શટલ બસ',
    operational: 'ચાલુ / સક્રિય',
    weatherSafe: 'હવામાન સંપૂર્ણ સુરક્ષિત',
    bookPass: 'બોર્ડિંગ પાસ બુક કરો',
    stepClimb: 'પગથિયાં ચઢવાનો માર્ગ (2,000 પગથિયાં)',
    cableCar: 'ઉડન ખટોલા કેબલ કાર (7 મિનિટ)',
    officialHubTitle: 'અધિકૃત યાત્રા સેવા',
    nearestRail: 'નજીકનું રેલવે સ્ટેશન',
    nearestAirport: 'નજીકનું એરપોર્ટ',
    localTransit: 'બસ અને સ્થાનિક પરિવહન',
    officialParking: 'અધિકૃત વાહન પાર્કિંગ',
    nextElectricShuttle: 'આગળની ઇલેક્ટ્રિક શટલ',
    aiBestParking: 'AI ભલામણ કરેલ શ્રેષ્ઠ પાર્કિંગ સ્થળ',
    freeSlots: 'ઉપલબ્ધ જગ્યાઓ',
    grounds: 'પાર્કિંગ સ્થળો',
    selectDirection: 'દિશા પસંદ કરો',
    ascentOnly: 'માત્ર ઉપર (ચઢાણ)',
    roundTrip: 'ઉપર + નીચે (રિટર્ન)',
    perAdult: '/ વ્યક્તિ',
    travelDate: 'પ્રવાસ તારીખ',
    calendarPicker: '📅 કેલેન્ડર પસંદ કરો',
    selectTimeWindow: 'સમય સ્લોટ પસંદ કરો',
    cabinCap: 'કેબિન ક્ષમતા: 80 / સ્લોટ',
    yourDetailsHeader: 'તમારી વિગતો (મુખ્ય યાત્રાળુ)',
    mobilePhone: 'મોબાઇલ નંબર',
    mobilePlaceholder: '10 અંકનો મોબાઇલ',
    pilgrimName: 'યાત્રાળુનું નામ',
    fullName: 'પૂરું નામ',
    emailAddress: 'ઇમેઇલ એડ્રેસ',
    govIdType: 'સરકારી ઓળખપત્ર (વૈકલ્પિક)',
    selectIdType: 'આઈડી પ્રકાર પસંદ કરો (વૈકલ્પિક)',
    aadhaar: 'આધાર કાર્ડ',
    voterId: 'ચૂંટણી કાર્ડ',
    drivingLicense: 'ડ્રાઇવિંગ લાયસન્સ',
    passport: 'પાસપોર્ટ',
    panCard: 'પાન કાર્ડ',
    bloodGroup: 'બ્લડ ગ્રુપ (વૈકલ્પિક)',
    emergencyContactTitleRopeway: 'ઇમરજન્સી સંપર્ક (પર્વતીય સુરક્ષા)',
    emergencyContactTitleBoat: 'ઇમરજન્સી સંપર્ક (દરિયાઈ બોટ સુરક્ષા)',
    emergencyName: 'ઇમરજન્સી સંપર્ક નામ',
    emergencyPhone: 'ઇમરજન્સી ફોન નંબર',
    emergencyEmail: 'ઇમરજન્સી ઇમેઇલ',
    addFamilyGroup: 'પરિવાર / જૂથ સભ્યો ઉમેરો',
    added: 'ઉમેરાયેલ',
    quickSaved: '⚡ 1-ક્લિકમાં સાચવેલા પરિવાર સભ્યો પસંદ કરો:',
    savedMemberBadge: 'પરિવાર સભ્ય',
    memberName: 'સભ્યનું નામ',
    memberAge: 'ઉંમર',
    memberPhone: 'ફોન નંબર',
    addMemberBtn: '+ અન્ય પરિવાર સભ્ય ઉમેરો',
    totalPayable: 'કુલ ચૂકવવાપાત્ર ભાડું:',
    passengers: 'મુસાફરો',
    confirmRopeway: 'પુષ્ટિ કરો અને બોર્ડિંગ પાસ મેળવો →',
    confirmBoat: 'પુષ્ટિ કરો અને બોટ પાસ મેળવો →',
    preferTrekking: 'પગથિયાં ચઢવાનો માર્ગ પસંદ કરો',
    bookRopewayBtn: 'રોપવે એક્સપ્રેસ બુક કરો',
    selectBoatTime: 'પ્રસ્થાન સમય અને ભરતી સુરક્ષા સ્થિતિ પસંદ કરો',
    naukaTitle: 'બેટ દ્વારકા પવિત્ર બોટ ફેરી સેવા',
    naukaSubtitle: 'ઓખા પોર્ટ પેસેન્જર જેટી ↔ બેટ દ્વારકાધીશ મંદિર ટાપુ (~20 મિનિટ દરિયાઈ સફર)',
    tideRegulated: 'ભરતી-ઓટ નિયંત્રિત',
    boatPassHeader: 'બેટ દ્વારકા બોટ બોર્ડિંગ પાસ',
    departureTimeLabel: 'પ્રસ્થાન સમય',
    okhaGate: 'ઓખા પોર્ટ બોટ જેટી ગેટ 1',
    crossingDate: 'બોટ પ્રવાસ તારીખ',
    seats: 'સીટો',
    currentlyUnsafe: 'હાલમાં અસુરક્ષિત',
    idealTide: 'અનુકૂળ ભરતી',
    highTideCaution: 'ઊંચી ભરતી સાવચેતી',
    lowTideCaution: 'ઓછી ભરતી સાવચેતી',
    readyForStaffScan: 'સ્ટાફ સ્કેન માટે તૈયાર',
    bookAnother: 'બીજો પાસ બુક કરો',
    cableCarToken: 'અધિકૃત ઉડન ખટોલા પ્રવેશ ટોકન',
    ferryToken: 'અધિકૃત બોટ સેવા પ્રવેશ ટોકન'
  }
};

export const Travel = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage];

  const [temples, setTemples] = useState([]);
  const [selectedTempleId, setSelectedTempleId] = useState('tmp_pavagadh');
  const [parkingLots, setParkingLots] = useState([]);
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sub-Tab Switcher State: 'ropeway' | 'boat' | 'travel'
  const [activeTravelTab, setActiveTravelTab] = useState('ropeway');

  // Pavagadh Ropeway Specific State
  const [ropewayStatus, setRopewayStatus] = useState({ is_operational: true, halt_reason: '' });
  const [ropewayMode, setRopewayMode] = useState('book'); // 'book' | 'trekking'
  const [ropewayDirection, setRopewayDirection] = useState('up'); // 'up' | 'up_down'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [ropewaySlots, setRopewaySlots] = useState([]);
  const [selectedRopewaySlot, setSelectedRopewaySlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Bet Dwarka Boat Specific State
  const [boatCrossings, setBoatCrossings] = useState([]);
  const [selectedBoatCrossing, setSelectedBoatCrossing] = useState(null);
  const [boatBookingPass, setBoatBookingPass] = useState(null);
  const [boatQrCodeUrl, setBoatQrCodeUrl] = useState('');
  const [loadingBoat, setLoadingBoat] = useState(false);
  const [boatRerouteNotification, setBoatRerouteNotification] = useState(null);
  const [marineWeather, setMarineWeather] = useState(null);

  // Primary Pilgrim Form & Boarding Pass State
  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Apex Coder');
  const [pilgrimPhone, setPilgrimPhone] = useState(currentUser?.phone || '9876543210');
  const [pilgrimEmail, setPilgrimEmail] = useState(currentUser?.email || 'apex.coder@nirvighna.org');
  const [userGovIdType, setUserGovIdType] = useState('');
  const [userBloodGroup, setUserBloodGroup] = useState('');
  const [userMedicalDetails, setUserMedicalDetails] = useState('');

  // Emergency Contact State (Synced with Darshan Booking)
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Family & Group Members State (Synced with all Past Bookings & Darshan)
  const [showMembers, setShowMembers] = useState(false);

  // Helper to load all family members from storage + previous bookings
  const loadMergedFamilyMembers = () => {
    try {
      const existingSaved = JSON.parse(localStorage.getItem('nirvighna_saved_family_members') || localStorage.getItem('nirvighna_local_family_members') || '[]');
      const rpwBookings = JSON.parse(localStorage.getItem('nirvighna_ropeway_bookings') || '[]');
      const boatBookings = JSON.parse(localStorage.getItem('nirvighna_boat_bookings') || '[]');
      const darshanBookings = JSON.parse(localStorage.getItem('nirvighna_darshan_bookings') || '[]');

      const allMembersMap = new Map();

      // Merge valid saved members
      if (Array.isArray(existingSaved)) {
        existingSaved.forEach(m => {
          if (m && m.name && m.name.trim()) {
            allMembersMap.set(m.name.toLowerCase().trim(), m);
          }
        });
      }

      // Extract from all past bookings
      [...rpwBookings, ...boatBookings, ...darshanBookings].forEach(b => {
        const memberList = b.members || b.family_members || [];
        if (Array.isArray(memberList)) {
          memberList.forEach(m => {
            if (m && m.name && m.name.trim()) {
              const key = m.name.toLowerCase().trim();
              allMembersMap.set(key, {
                name: m.name.trim(),
                age: m.age || (allMembersMap.get(key)?.age ?? ''),
                phone: m.phone || (allMembersMap.get(key)?.phone ?? '')
              });
            }
          });
        }
      });

      const merged = Array.from(allMembersMap.values());
      return merged;
    } catch (e) {
      return [];
    }
  };


  const [savedFamilyMembers, setSavedFamilyMembers] = useState(() => loadMergedFamilyMembers());
  const [bookingMembers, setBookingMembers] = useState([]);

  // Auto-save any entered members for future 1-click booking
  const autoSaveBookingMembers = (newMembers = []) => {
    if (!newMembers || newMembers.length === 0) return;
    try {
      const currentList = loadMergedFamilyMembers();
      const map = new Map();
      currentList.forEach(m => {
        if (m.name && m.name.trim()) map.set(m.name.toLowerCase().trim(), m);
      });

      newMembers.forEach(m => {
        if (m.name && m.name.trim()) {
          const key = m.name.toLowerCase().trim();
          map.set(key, {
            name: m.name.trim(),
            age: m.age || (map.get(key)?.age ?? ''),
            phone: m.phone || (map.get(key)?.phone ?? pilgrimPhone)
          });
        }
      });

      const updated = Array.from(map.values());
      setSavedFamilyMembers(updated);
      localStorage.setItem('nirvighna_saved_family_members', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not auto-save family members:', e);
    }
  };

  // 1-Click Toggle Saved Member Selection
  const toggleSavedMemberSelect = (savedMember) => {
    const exists = bookingMembers.some(bm => bm.name === savedMember.name);
    if (exists) {
      setBookingMembers(bookingMembers.filter(bm => bm.name !== savedMember.name));
    } else {
      setBookingMembers([
        ...bookingMembers,
        {
          name: savedMember.name,
          age: savedMember.age || '',
          phone: savedMember.phone || pilgrimPhone,
          email: ''
        }
      ]);
    }
  };

  const addBookingMember = () => {
    setBookingMembers([
      ...bookingMembers,
      { name: '', age: '', phone: '', email: '' }
    ]);
  };

  const updateBookingMember = (index, field, value) => {
    const updated = [...bookingMembers];
    updated[index][field] = value;
    setBookingMembers(updated);
  };

  const removeBookingMember = (index) => {
    setBookingMembers(bookingMembers.filter((_, i) => i !== index));
  };

  const totalPassengers = 1 + bookingMembers.length;

  // Boarding Pass Generation State
  const [bookingPass, setBookingPass] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [weatherAlertNotification, setWeatherAlertNotification] = useState(null);

  useEffect(() => {
    // Pre-populate with master temples immediately so page loads instantly
    const initialTemples = getUniqueTemples([]);
    setTemples(initialTemples);
    setSelectedTempleId('tmp_pavagadh');
    setLoading(false);

    // Non-blocking background fetch
    fetchTemples();
  }, []);

  useEffect(() => {
    if (selectedTempleId) {
      fetchParkingAndShuttle();
      if (selectedTempleId === 'tmp_pavagadh') {
        setActiveTravelTab('ropeway');
        fetchRopewayData();
      } else if (selectedTempleId === 'tmp_dwarka') {
        setActiveTravelTab('boat');
        fetchBoatData();
      } else {
        setActiveTravelTab('travel');
      }
    }
  }, [selectedTempleId, selectedDate, ropewayDirection]);

  // Realtime Notification Listener for Weather Halt & Boat Reroute
  useEffect(() => {
    const channel = supabase
      .channel('realtime_travel_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new?.type === 'ropeway_halt') {
            setWeatherAlertNotification(payload.new);
            setRopewayStatus({ is_operational: false, halt_reason: payload.new.message });
            setRopewayMode('trekking');
          }
          if (payload.new?.type === 'boat_reroute') {
            setBoatRerouteNotification(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTemples = async () => {
    try {
      const { data, error } = await supabase.from('temples').select('*').order('name');
      if (!error && data && data.length > 0) {
        const uniqueList = getUniqueTemples(data);
        setTemples(uniqueList);
      }
    } catch (err) {
      // Gracefully use the centralized master temple registry
      setTemples(getUniqueTemples([]));
    } finally {
      setLoading(false);
    }
  };

  const fetchParkingAndShuttle = async () => {
    try {
      const shrine = getTempleById(selectedTempleId);
      const rawParking = (shrine.parkingLots || []).map(p => ({
        id: p.id,
        name: p.name,
        name_hi: p.name_hi || p.name,
        name_gu: p.name_gu || p.name,
        distance: p.distance,
        distance_hi: p.distance_hi || p.distance,
        distance_gu: p.distance_gu || p.distance,
        capacity: p.total,
        occupied: p.occupied,
        hasShuttle: p.hasShuttle ?? true
      }));

      const aiPredictedParking = NirvighnaAIEngine.predictParkingDensity(rawParking);
      const templeShuttles = (shrine.shuttles || []).map(s => ({
        id: s.id,
        name: s.name,
        name_hi: s.name_hi || s.name,
        name_gu: s.name_gu || s.name,
        route: s.route,
        route_hi: s.route_hi || s.route,
        route_gu: s.route_gu || s.route,
        nextDeparture: s.nextDeparture || 4,
        frequency: s.frequency || 8,
        status: s.status || 'en_route',
        destination: s.destination,
        fare: s.fare || 'Free',
        fare_hi: s.fare_hi || (s.fare === 'Free' ? 'निःशुल्क' : s.fare),
        fare_gu: s.fare_gu || (s.fare === 'Free' ? 'મફત' : s.fare)
      }));

      setParkingLots(aiPredictedParking);
      setShuttles(templeShuttles);
    } catch (err) {
      console.error('Error fetching parking info:', err);
    }
  };

  const fetchRopewayData = async () => {
    setLoadingSlots(true);
    try {
      const statusData = await ropewayEngine.fetchStatus(selectedTempleId);
      setRopewayStatus(statusData);

      if (!statusData.is_operational) {
        setRopewayMode('trekking');
      }

      const slots = await ropewayEngine.fetchSlots(selectedTempleId, selectedDate, ropewayDirection);
      setRopewaySlots(slots);
      if (slots.length > 0) {
        const available = slots.find(s => s.is_available) || slots[0];
        setSelectedRopewaySlot(available);
      }
    } catch (err) {
      console.error('Error fetching ropeway data:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchBoatData = async () => {
    setLoadingBoat(true);
    try {
      const [crossings, marine] = await Promise.all([
        boatCrossingEngine.fetchCrossings(selectedTempleId, selectedDate),
        liveWeatherService.getLiveMarineWeather(selectedTempleId)
      ]);
      setBoatCrossings(crossings);
      setMarineWeather(marine);
      if (crossings.length > 0) {
        const firstSafe = crossings.find(c => c.is_safe && c.booked_count < c.total_capacity) || crossings[0];
        setSelectedBoatCrossing(firstSafe);
      }
    } catch (err) {
      console.error('Error fetching boat data:', err);
    } finally {
      setLoadingBoat(false);
    }
  };

  const handleBookRopeway = async (e) => {
    e.preventDefault();
    if (!selectedRopewaySlot) return;

    setSubmittingBooking(true);
    try {
      const booking = await ropewayEngine.bookRopewaySlot({
        pilgrimId: currentUser?.id || 'demo_user',
        templeId: selectedTempleId,
        slot: selectedRopewaySlot,
        direction: ropewayDirection,
        passengerCount: totalPassengers,
        pilgrimName,
        pilgrimPhone,
        pilgrimEmail,
        govIdType: userGovIdType,
        bloodGroup: userBloodGroup,
        medicalDetails: userMedicalDetails,
        emergencyContact,
        members: bookingMembers
      });

      const qrData = await QRCode.toDataURL(booking.qr_token, { margin: 1, width: 200 });
      setQrCodeDataUrl(qrData);
      setBookingPass(booking);

      // Save to localStorage for My Bookings display
      const localRpwBookings = JSON.parse(localStorage.getItem('nirvighna_ropeway_bookings') || '[]');
      localRpwBookings.unshift(booking);
      localStorage.setItem('nirvighna_ropeway_bookings', JSON.stringify(localRpwBookings));

      // Auto-save any added family members for 1-click future selection
      autoSaveBookingMembers(bookingMembers);

      // Trigger instant database notification for Ropeway slot confirmation
      try {
        await supabase.from('notifications').insert({
          type: 'gate_info',
          title: '🚡 Ropeway Slot Confirmed!',
          message: `Your Ropeway Boarding Slot is confirmed for ${totalPassengers} passenger(s). Token Code: ${booking.qr_token}. Direction: ${ropewayDirection.toUpperCase()}.`,
          created_at: new Date().toISOString()
        });
      } catch (notifErr) {
        console.warn('Could not insert ropeway booking notification:', notifErr);
      }
    } catch (err) {
      alert(err.message || 'Failed to book ropeway slot.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleBookBoatCrossing = async (e) => {
    e.preventDefault();
    if (!selectedBoatCrossing) return;

    setSubmittingBooking(true);
    try {
      const { booking, crossing } = await boatCrossingEngine.bookBoatCrossing({
        bookingId: null,
        crossingId: selectedBoatCrossing.id,
        pilgrimId: currentUser?.id || 'demo_user',
        passengerCount: totalPassengers,
        pilgrimName,
        pilgrimPhone,
        pilgrimEmail,
        emergencyContact,
        members: bookingMembers
      });

      const qrData = await QRCode.toDataURL(booking.qr_token, { margin: 1, width: 200 });
      setBoatQrCodeUrl(qrData);
      setBoatBookingPass({ ...booking, departure_time: crossing.departure_time });

      // Save to localStorage for My Bookings display
      const localBoatBookings = JSON.parse(localStorage.getItem('nirvighna_boat_bookings') || '[]');
      localBoatBookings.unshift({ ...booking, departure_time: crossing.departure_time });
      localStorage.setItem('nirvighna_boat_bookings', JSON.stringify(localBoatBookings));

      // Auto-save any added family members for 1-click future selection
      autoSaveBookingMembers(bookingMembers);

      // Trigger instant database notification for Boat crossing confirmation
      try {
        await supabase.from('notifications').insert({
          type: 'gate_info',
          title: '⛵ Ferry Crossing Confirmed!',
          message: `Your Bet Dwarka Ferry Crossing is confirmed for ${totalPassengers} passenger(s). Token Code: ${booking.qr_token}.`,
          created_at: new Date().toISOString()
        });
      } catch (notifErr) {
        console.warn('Could not insert boat booking notification:', notifErr);
      }
    } catch (err) {
      alert(err.message || 'Failed to book ferry crossing.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const getTideBadge = (tideLevel, isSafe) => {
    if (!isSafe) return { label: t.currentlyUnsafe, color: 'bg-red-500 text-white' };
    if (tideLevel === 'ideal') return { label: t.idealTide, color: 'bg-emerald-600 text-white' };
    if (tideLevel === 'high') return { label: t.highTideCaution, color: 'bg-amber-500 text-indigo-dark font-bold' };
    return { label: t.lowTideCaution, color: 'bg-amber-500 text-indigo-dark font-bold' };
  };

  const getSlotAvailabilityBadge = (slot) => {
    const percent = (slot.booked_count / slot.total_capacity) * 100;
    if (percent >= 100) return { label: t.full, color: 'bg-red-500 text-white cursor-not-allowed' };
    if (percent >= 80) return { label: currentLanguage === 'hi' ? 'शीघ्र भर रहा है' : currentLanguage === 'gu' ? 'ઝડપથી ભરાઈ રહ્યું છે' : 'Filling Fast', color: 'bg-amber-500 text-indigo-dark font-bold' };
    return { label: t.available, color: 'bg-emerald-600 text-white' };
  };

  const getParkingStatus = (occupied, capacity) => {
    const percent = (occupied / capacity) * 100;
    if (percent >= 90) return { status: t.full, color: 'bg-red-500 text-white' };
    if (percent >= 70) return { status: currentLanguage === 'hi' ? 'शीघ्र भर रहा है' : currentLanguage === 'gu' ? 'ઝડપથી ભરાઈ રહ્યું છે' : 'Filling Fast', color: 'bg-amber-500 text-indigo-dark' };
    return { status: t.available, color: 'bg-emerald-600 text-white' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-20">
        <NirvighnaLoader message={t.loading} />
      </div>
    );
  }

  const selectedTemple = temples.find(t => t.id === selectedTempleId) || temples[0];
  const hasRopeway = selectedTemple?.has_ropeway || selectedTempleId === 'tmp_pavagadh';
  const hasBoat = selectedTemple?.has_boat_crossing || selectedTempleId === 'tmp_dwarka';

  return (
    <div className="min-h-screen bg-ivory pt-5 pb-10 px-3.5 sm:px-6 font-body">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 bg-white rounded-xl shadow-warm border border-gray-100 hover:border-maroon transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-maroon" />
            </button>
            <div>
              <h1 className="text-xl font-black font-heading text-maroon flex items-center gap-2">
                <Bus className="w-6 h-6 text-gold-dark" />
                {t.pageTitle}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {getLocalizedTempleName(selectedTemple, currentLanguage)} • {t.pageSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Realtime Weather Halt Notification Alert Banner */}
        {weatherAlertNotification && (
          <div className="bg-gradient-to-r from-red-900 to-maroon text-white p-4 rounded-2xl shadow-lg border-2 border-amber-400 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-300 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs text-amber-200 uppercase tracking-wide">
                  ROPEWAY WEATHER HALT ALERT
                </h4>
                <p className="text-xs font-medium text-white">{weatherAlertNotification.message}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setRopewayMode('trekking');
                setWeatherAlertNotification(null);
              }}
              className="px-3 py-1.5 bg-amber-400 text-indigo-dark font-black text-xs rounded-xl shadow-md shrink-0 uppercase"
            >
              View Trek Map →
            </button>
          </div>
        )}

        {/* Realtime Boat Reroute Notification Alert Banner */}
        {boatRerouteNotification && (
          <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-4 rounded-2xl shadow-lg border-2 border-gold flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <Anchor className="w-6 h-6 text-gold shrink-0 animate-spin" />
              <div>
                <h4 className="font-extrabold text-xs text-gold uppercase tracking-wide">
                  BET DWARKA BOAT REROUTE ALERT
                </h4>
                <p className="text-xs font-medium text-white">{boatRerouteNotification.message}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTravelTab('boat');
                setBoatRerouteNotification(null);
              }}
              className="px-3 py-1.5 bg-gold text-indigo-dark font-black text-xs rounded-xl shadow-md shrink-0 uppercase"
            >
              Rebook Safe Time →
            </button>
          </div>
        )}

        {/* Temple Selector (Localized in English, Hindi, Gujarati) */}
        <select
          value={selectedTempleId}
          onChange={(e) => setSelectedTempleId(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon shadow-warm"
        >
          {temples.map(temple => (
            <option key={temple.id} value={temple.id}>
              {getLocalizedTempleName(temple, currentLanguage)} ({getLocalizedTempleLocation(temple, currentLanguage)})
            </option>
          ))}
        </select>

        {/* Official Shrine Transit Hub Telemetry Banner — Real-World Details for Selected Temple */}
        {(() => {
          const currentShrine = getTempleById(selectedTempleId);
          const tHub = currentShrine.transitHub || {};
          
          // Calculate live parking statistics
          const totalCapacity = (parkingLots || []).reduce((acc, p) => acc + (p.capacity || 0), 0);
          const totalOccupied = (parkingLots || []).reduce((acc, p) => acc + (p.occupied || 0), 0);
          const totalAvailable = Math.max(0, totalCapacity - totalOccupied);

          // Find the best parking lot with highest available spots
          const bestLot = (parkingLots || []).reduce((best, curr) => {
            const currAvail = (curr.capacity || 0) - (curr.occupied || 0);
            const bestAvail = best ? ((best.capacity || 0) - (best.occupied || 0)) : -1;
            return currAvail > bestAvail ? curr : best;
          }, null);

          return (
            <div className="bg-white rounded-3xl shadow-warm border border-gold/40 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-gold/20 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-lg shrink-0 font-heading">
                    {selectedTempleId === 'tmp_somnath' ? '🔱' : selectedTempleId === 'tmp_dwarka' ? '🛕' : selectedTempleId === 'tmp_ambaji' ? '🚩' : '🔱'}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-maroon font-heading leading-tight">
                      {getLocalizedTempleName(currentShrine, currentLanguage)} • {t.officialHubTitle}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {getLocalizedTempleLocation(currentShrine, currentLanguage)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transit Hub Real-World Connectivity Grid (Fully Tri-lingual) */}
              {(() => {
                const getLocalizedTransit = (transitObj) => {
                  if (!transitObj) return { name: '', distance: '', secondary: '' };
                  if (typeof transitObj === 'string') return { name: transitObj, distance: '', secondary: transitObj };
                  if (currentLanguage === 'hi') {
                    return {
                      name: transitObj.name_hi || transitObj.name || '',
                      distance: transitObj.distance_hi || transitObj.distance || '',
                      secondary: transitObj.secondary_hi || transitObj.secondary || ''
                    };
                  }
                  if (currentLanguage === 'gu') {
                    return {
                      name: transitObj.name_gu || transitObj.name || '',
                      distance: transitObj.distance_gu || transitObj.distance || '',
                      secondary: transitObj.secondary_gu || transitObj.secondary || ''
                    };
                  }
                  return {
                    name: transitObj.name || '',
                    distance: transitObj.distance || '',
                    secondary: transitObj.secondary || ''
                  };
                };

                const railInfo = getLocalizedTransit(tHub.nearestRail);
                const airportInfo = getLocalizedTransit(tHub.nearestAirport);
                const transitInfo = getLocalizedTransit(tHub.localTransit);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                    {/* 1. Railway Station */}
                    <div className="bg-ivory/80 hover:bg-white p-3.5 rounded-2xl border border-gold/30 hover:border-gold/60 shadow-xs transition-all flex flex-col justify-between space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-gold/20 text-maroon flex items-center justify-center text-sm font-bold shrink-0">
                            🚆
                          </span>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                              {t.nearestRail}
                            </span>
                            <h4 className="text-xs font-black text-maroon font-heading">
                              {railInfo.name || 'Somnath Station (SMNH)'}
                            </h4>
                          </div>
                        </div>
                        {railInfo.distance && (
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md font-mono shrink-0 shadow-2xs">
                            {railInfo.distance}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug font-medium border-t border-gold/15 pt-2">
                        {railInfo.secondary || 'Connected to Western Railway Network'}
                      </p>
                    </div>

                    {/* 2. Nearest Airport */}
                    <div className="bg-ivory/80 hover:bg-white p-3.5 rounded-2xl border border-gold/30 hover:border-gold/60 shadow-xs transition-all flex flex-col justify-between space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-gold/20 text-maroon flex items-center justify-center text-sm font-bold shrink-0">
                            ✈️
                          </span>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                              {t.nearestAirport}
                            </span>
                            <h4 className="text-xs font-black text-maroon font-heading">
                              {airportInfo.name || 'Diu Airport (DIU)'}
                            </h4>
                          </div>
                        </div>
                        {airportInfo.distance && (
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md font-mono shrink-0 shadow-2xs">
                            {airportInfo.distance}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug font-medium border-t border-gold/15 pt-2">
                        {airportInfo.secondary || 'State & National Flight Connectivity'}
                      </p>
                    </div>

                    {/* 3. Bus & Local Transit */}
                    <div className="bg-ivory/80 hover:bg-white p-3.5 rounded-2xl border border-gold/30 hover:border-gold/60 shadow-xs transition-all flex flex-col justify-between space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-gold/20 text-maroon flex items-center justify-center text-sm font-bold shrink-0">
                            🚌
                          </span>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                              {t.localTransit}
                            </span>
                            <h4 className="text-xs font-black text-maroon font-heading">
                              {transitInfo.name || 'GSRTC Central Stand'}
                            </h4>
                          </div>
                        </div>
                        {transitInfo.distance && (
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md font-mono shrink-0 shadow-2xs">
                            {transitInfo.distance}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug font-medium border-t border-gold/15 pt-2">
                        {transitInfo.secondary || 'GSRTC Express Bus Stand & E-Auto Carts'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Real-World Parking & Shuttle Telemetry Summary */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50/80 via-gold/10 to-amber-50/80 border border-gold/30 rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs text-gray-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-white border border-gold/40 text-maroon flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs font-heading">
                    🅿️
                  </span>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">{t.officialParking}</span>
                    <span className="font-bold text-maroon text-xs">{parkingLots.length} {t.grounds} ({totalAvailable} {t.freeSlots})</span>
                  </div>
                </div>

                <div className="h-6 w-px bg-gold/30 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-white border border-gold/40 text-maroon flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs font-heading">
                    🚌
                  </span>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">{t.nextElectricShuttle}</span>
                    <span className="font-bold text-maroon text-xs">
                      {shuttles.length > 0 ? `${(currentLanguage === 'hi' ? (shuttles[0].name_hi || shuttles[0].name) : currentLanguage === 'gu' ? (shuttles[0].name_gu || shuttles[0].name) : shuttles[0].name).split('(')[0].trim()} (${shuttles[0].nextDeparture || 3} ${t.minutes})` : t.shuttleService}
                    </span>
                  </div>
                </div>

                <div className="h-6 w-px bg-gold/30 hidden sm:block"></div>

                {/* AI Parking Ground Recommendation */}
                <div className="flex items-center gap-2 text-left">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">{t.aiBestParking}</span>
                    <p className="text-[11px] text-gray-800 font-medium">
                      <strong className="text-maroon">
                        {bestLot ? (currentLanguage === 'hi' ? (bestLot.name_hi || bestLot.name) : currentLanguage === 'gu' ? (bestLot.name_gu || bestLot.name) : bestLot.name).split('(')[0].trim() : t.officialParking}
                      </strong> {bestLot ? `(${bestLot.capacity - bestLot.occupied} ${t.freeSlots})` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab Switcher: Ropeway | Boat | Parking */}
        <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-warm flex text-xs font-extrabold font-heading gap-1">
          {hasRopeway && (
            <button
              onClick={() => setActiveTravelTab('ropeway')}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTravelTab === 'ropeway'
                  ? 'bg-gold text-indigo-dark shadow-goldGlow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>🚡</span> {t.ropewayTab}
            </button>
          )}

          {hasBoat && (
            <button
              onClick={() => setActiveTravelTab('boat')}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTravelTab === 'boat'
                  ? 'bg-gold text-indigo-dark shadow-goldGlow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Anchor className="w-4 h-4 text-blue-800" /> {t.boatTab}
            </button>
          )}

          <button
            onClick={() => setActiveTravelTab('travel')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTravelTab === 'travel'
                ? 'bg-gold text-indigo-dark shadow-goldGlow'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Car className="w-4 h-4" /> {t.parkingTab}
          </button>
        </div>

        {/* MAIN TAB 1: PAVAGADH ROPEWAY & TREKKING ROUTE */}
        {activeTravelTab === 'ropeway' && hasRopeway && (
          <div className="space-y-4">
            {/* Weather Halt Warning Banner (If Not Operational) */}
            {!ropewayStatus.is_operational ? (
              <div className="bg-gradient-to-r from-red-950 via-maroon to-red-900 text-white p-5 rounded-3xl border-2 border-red-400 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-300 flex items-center justify-center border border-red-400">
                    <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-amber-300 font-heading">
                      ROPEWAY CURRENTLY HALTED
                    </h3>
                    <p className="text-xs text-gray-200 font-medium mt-0.5">
                      {ropewayStatus.halt_reason || 'Ropeway paused due to high wind speed / weather safety protocol.'}
                    </p>
                  </div>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-white/10 text-xs text-gray-300 flex items-center justify-between">
                  <span>Safety Checkpoint: Trekking Route Open</span>
                  <span className="font-bold text-emerald-400">Padyatri Route Active ✓</span>
                </div>
              </div>
            ) : (
              /* Mode Toggle: Book Ropeway vs Prefer Trekking Route */
              <div className="bg-ivory p-1 rounded-2xl border border-gold/40 flex text-xs font-bold font-heading">
                <button
                  onClick={() => setRopewayMode('book')}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    ropewayMode === 'book'
                      ? 'bg-maroon text-ivory shadow-md font-black'
                      : 'text-gray-600 hover:text-maroon'
                  }`}
                >
                  <span>🚡</span> {t.bookRopewayBtn}
                </button>
                <button
                  onClick={() => setRopewayMode('trekking')}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    ropewayMode === 'trekking'
                      ? 'bg-maroon text-ivory shadow-md font-black'
                      : 'text-gray-600 hover:text-maroon'
                  }`}
                >
                  <Footprints className="w-4 h-4 text-gold" /> {t.preferTrekking}
                </button>
              </div>
            )}

            {/* SUB-VIEW A: ROPEWAY BOOKING PATH */}
            {ropewayMode === 'book' && ropewayStatus.is_operational ? (
              <div className="space-y-4">
                {bookingPass ? (
                  <div className="bg-white rounded-3xl shadow-2xl border-2 border-maroon overflow-hidden animate-in slide-in-from-bottom">
                    <div className="bg-maroon text-ivory p-5 text-center relative">
                      <div className="flex items-center justify-between text-xs text-gold font-bold mb-1">
                        <span>TOKEN: {bookingPass.qr_token}</span>
                        <span className="bg-gold text-indigo-dark px-2 py-0.5 rounded-md uppercase font-black">
                          {bookingPass.direction === 'up' ? t.ascentOnly : t.roundTrip}
                        </span>
                      </div>
                      <h2 className="text-xl font-black font-heading text-white flex items-center justify-center gap-2">
                        <span>🚡</span> PAVAGADH ROPEWAY BOARDING PASS
                      </h2>
                      <p className="text-xs text-ivory/80 mt-1">
                        Time Window: <strong className="text-gold font-mono text-sm">{bookingPass.time_window}</strong>
                      </p>
                    </div>

                    <div className="relative flex items-center justify-between bg-white px-4 py-2 border-y border-dashed border-maroon/30">
                      <div className="w-5 h-5 bg-ivory rounded-full -ml-6 border-r border-maroon/20"></div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 font-mono">
                        {t.cableCarToken}
                      </span>
                      <div className="w-5 h-5 bg-ivory rounded-full -mr-6 border-l border-maroon/20"></div>
                    </div>

                    <div className="p-6 text-center space-y-3 bg-white">
                      {qrCodeDataUrl ? (
                        <div className="inline-block p-3 bg-white rounded-2xl border-2 border-gold shadow-goldGlow">
                          <img src={qrCodeDataUrl} alt="Ropeway QR Pass" className="mx-auto w-48 h-48" />
                        </div>
                      ) : (
                        <div className="w-48 h-48 border-2 border-dashed border-gold/40 rounded-2xl flex items-center justify-center mx-auto bg-amber-50/20">
                          <NirvighnaLoader message="Loading QR Pass..." />
                        </div>
                      )}

                      <div>
                        <h3 className="text-lg font-black text-indigo-dark font-heading">
                          {bookingPass.pilgrim_name}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {bookingPass.passenger_count} {t.passengers} • Machi Base Terminal Gate
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mt-2">
                          <CheckCircle className="w-3.5 h-3.5" /> {t.readyForStaffScan}
                        </span>
                      </div>

                      <button
                        onClick={() => setBookingPass(null)}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                      >
                        {t.bookAnother}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookRopeway} className="bg-white p-5 rounded-3xl shadow-warm border border-gray-100 space-y-4">
                    <div>
                      <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wide block mb-2 font-heading">
                        {t.selectDirection}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRopewayDirection('up')}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            ropewayDirection === 'up'
                              ? 'bg-gold/20 border-gold text-indigo-dark font-black shadow-sm'
                              : 'bg-ivory border-gray-200 text-gray-600 hover:border-gold/50'
                          }`}
                        >
                          <span className="text-base block mb-0.5">⬆️</span>
                          <span className="text-xs font-extrabold">{t.ascentOnly}</span>
                          <span className="text-[10px] text-gray-500 block font-normal">₹125 {t.perAdult}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRopewayDirection('up_down')}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            ropewayDirection === 'up_down'
                              ? 'bg-gold/20 border-gold text-indigo-dark font-black shadow-sm'
                              : 'bg-ivory border-gray-200 text-gray-600 hover:border-gold/50'
                          }`}
                        >
                          <span className="text-base block mb-0.5">🔄</span>
                          <span className="text-xs font-extrabold">{t.roundTrip}</span>
                          <span className="text-[10px] text-gray-500 block font-normal">₹230 {t.perAdult}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wide font-heading">
                          {t.travelDate}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCalendarModal(true)}
                          className="text-[11px] font-extrabold text-maroon hover:text-red-900 bg-gold/20 px-2.5 py-1 rounded-xl border border-gold/40 flex items-center gap-1 shadow-2xs font-heading"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-maroon" />
                          <span>{t.calendarPicker}</span>
                        </button>
                      </div>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-1 focus:ring-gold"
                      />
                    </div>

                    {showCalendarModal && (
                      <CalendarModal
                        selectedDate={new Date(selectedDate)}
                        onSelectDate={(newDate) => {
                          setSelectedDate(newDate.toISOString().split('T')[0]);
                          setShowCalendarModal(false);
                        }}
                        onClose={() => setShowCalendarModal(false)}
                      />
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wide font-heading">
                          {t.selectTimeWindow}
                        </label>
                        <span className="text-[10px] text-gray-500">{t.cabinCap}</span>
                      </div>

                      {loadingSlots ? (
                        <div className="py-8 text-center text-xs text-gray-500">
                          <Loader2 className="w-6 h-6 animate-spin text-maroon mx-auto mb-1" />
                          {t.loading}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ropewaySlots.map((slot) => {
                            const badge = getSlotAvailabilityBadge(slot);
                            const isSelected = selectedRopewaySlot?.id === slot.id;
                            const isFull = slot.booked_count >= slot.total_capacity;

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isFull}
                                onClick={() => setSelectedRopewaySlot(slot)}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  isFull
                                    ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-gold border-gold text-indigo-dark font-black shadow-goldGlow'
                                    : 'bg-ivory border-gray-200 hover:border-gold text-gray-800'
                                }`}
                              >
                                <p className="text-xs font-bold leading-tight mb-1">{slot.time_window}</p>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Your Details Section (Synced with Darshan Booking UI) */}
                    <div className="bg-ivory/50 p-4 rounded-2xl border border-gray-200 space-y-3">
                      <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-maroon" />
                        <span>{t.yourDetailsHeader}</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.mobilePhone}</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="tel"
                              required
                              value={pilgrimPhone}
                              onChange={(e) => setPilgrimPhone(e.target.value.slice(0, 10))}
                              placeholder={t.mobilePlaceholder}
                              maxLength={10}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-maroon"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.pilgrimName}</label>
                          <input
                            type="text"
                            required
                            value={pilgrimName}
                            onChange={(e) => setPilgrimName(e.target.value)}
                            placeholder={t.fullName}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.emailAddress}</label>
                          <input
                            type="email"
                            required
                            value={pilgrimEmail}
                            onChange={(e) => setPilgrimEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.govIdType}</label>
                          <select
                            value={userGovIdType}
                            onChange={(e) => setUserGovIdType(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                          >
                            <option value="">{t.selectIdType}</option>
                            <option value="aadhaar">{t.aadhaar}</option>
                            <option value="voter_id">{t.voterId}</option>
                            <option value="driving_license">{t.drivingLicense}</option>
                            <option value="passport">{t.passport}</option>
                            <option value="pan_card">{t.panCard}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.bloodGroup}</label>
                          <input
                            type="text"
                            value={userBloodGroup}
                            onChange={(e) => setUserBloodGroup(e.target.value)}
                            placeholder="e.g. B+, O+, AB+"
                            maxLength={4}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact Section (Collapsible) */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setShowEmergency(!showEmergency)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-ivory/60 hover:bg-ivory transition-colors"
                      >
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-alertRed" />
                          <span>{t.emergencyContactTitleRopeway}</span>
                        </span>
                        {showEmergency ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                      
                      {showEmergency && (
                        <div className="p-4 space-y-2.5 bg-white animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={emergencyContact.name}
                              onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                              className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                              placeholder={t.emergencyName}
                            />
                            <input
                              type="tel"
                              value={emergencyContact.phone}
                              onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                              className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                              placeholder={t.emergencyPhone}
                            />
                            <input
                              type="email"
                              value={emergencyContact.email || ''}
                              onChange={(e) => setEmergencyContact({ ...emergencyContact, email: e.target.value })}
                              className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                              placeholder={t.emergencyEmail}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Family Members Section with 1-Click Saved Selection */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setShowMembers(!showMembers)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-ivory/60 hover:bg-ivory transition-colors"
                      >
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                          <Users className="w-4 h-4 text-maroon" />
                          <span>{t.addFamilyGroup} ({bookingMembers.length} {t.added})</span>
                        </span>
                        {showMembers ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                      
                      {showMembers && (
                        <div className="p-4 space-y-3.5 bg-white animate-in fade-in">
                          {/* 1-Click Saved Members Checklist */}
                          {savedFamilyMembers.length > 0 && (
                            <div className="bg-ivory p-3 rounded-2xl border border-gold/30 space-y-2">
                              <span className="text-xs font-bold text-indigo-dark block font-heading">
                                {t.quickSaved}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {savedFamilyMembers.map((sm, idx) => {
                                  const isAdded = bookingMembers.some(bm => bm.name === sm.name);
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => toggleSavedMemberSelect(sm)}
                                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                        isAdded
                                          ? 'bg-gold/20 border-gold text-indigo-dark font-bold'
                                          : 'bg-white border-gray-200 hover:border-gold/50 text-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isAdded}
                                          onChange={() => {}}
                                          className="w-4 h-4 text-maroon focus:ring-maroon rounded"
                                        />
                                        <div>
                                          <p className="text-xs font-bold">{sm.name}</p>
                                          <p className="text-[10px] text-gray-500">{sm.age ? `${sm.age} yrs` : t.savedMemberBadge}</p>
                                        </div>
                                      </div>
                                      {isAdded && <Check className="w-4 h-4 text-emerald-600" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Added Members List */}
                          {bookingMembers.map((member, index) => (
                            <div key={index} className="relative p-3 bg-ivory rounded-2xl border border-gray-200 space-y-2">
                              <button
                                type="button"
                                onClick={() => removeBookingMember(index)}
                                className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => updateBookingMember(index, 'name', e.target.value)}
                                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                                  placeholder={t.memberName}
                                />
                                <input
                                  type="number"
                                  value={member.age}
                                  onChange={(e) => updateBookingMember(index, 'age', e.target.value)}
                                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                                  placeholder={t.memberAge}
                                />
                                <input
                                  type="tel"
                                  value={member.phone}
                                  onChange={(e) => updateBookingMember(index, 'phone', e.target.value)}
                                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                                  placeholder={t.memberPhone}
                                />
                              </div>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={addBookingMember}
                            className="w-full py-2.5 border-2 border-dashed border-gold/40 rounded-xl text-xs font-black text-indigo-dark hover:bg-gold/10 transition-colors flex items-center justify-center gap-1 font-heading"
                          >
                            <Plus className="w-4 h-4 text-maroon" />
                            <span>{t.addMemberBtn}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-gold/15 p-3 rounded-2xl border border-gold/30 flex items-center justify-between text-xs font-extrabold">
                      <div>
                        <span>{t.totalPayable}</span>
                        <span className="text-[10px] text-gray-500 block font-normal">
                          {totalPassengers} {t.passengers} ({ropewayDirection === 'up' ? '₹125' : '₹230'} × {totalPassengers})
                        </span>
                      </div>
                      <span className="text-base text-maroon font-black">
                        ₹{(ropewayDirection === 'up' ? 125 : 230) * totalPassengers}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingBooking || !selectedRopewaySlot}
                      className="w-full py-3 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      {submittingBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : t.confirmRopeway}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* SUB-VIEW B: TREKKING ROUTE MAP */
              <div className="bg-white p-5 rounded-3xl shadow-warm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 font-heading flex items-center gap-2">
                      <Footprints className="w-4.5 h-4.5 text-maroon" />
                      Pavagadh Padyatri Trekking Route & Safety Checkpoints
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Walking route from Machi Base to Kalika Mata Summit (3.8 km • ~2000 steps)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Open & Safe
                  </span>
                </div>

                <div className="space-y-3 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gold/40">
                  {[
                    { step: 1, name: 'Machi Plateau Base Station', dist: '0.0 km', desc: 'Medical desk & water station', icon: '🏥' },
                    { step: 2, name: 'Budhiya Darwaza Rest Stop', dist: '1.2° km', desc: 'ORS & juice counter', icon: '🥤' },
                    { step: 3, name: 'Dudhiya Talao Station', dist: '2.5 km', desc: 'Foot massage & rest bench', icon: '⛲' },
                    { step: 4, name: 'Maa Kalika Mata Summit Shrine', dist: '3.8 km (Top)', desc: 'Padyatri fast-track entry', icon: '🚩' }
                  ].map((cp) => (
                    <div key={cp.step} className="flex items-start gap-4 relative z-10 pl-2">
                      <div className="w-7 h-7 rounded-full bg-gold text-indigo-dark font-black text-xs flex items-center justify-center shrink-0 shadow-sm border border-gold/50">
                        {cp.step}
                      </div>
                      <div className="bg-ivory p-3.5 rounded-2xl border border-gray-200/80 flex-1 hover:border-gold transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-extrabold text-xs text-gray-900 font-heading flex items-center gap-1.5">
                            <span>{cp.icon}</span> {cp.name}
                          </h4>
                          <span className="text-[10px] font-bold text-maroon bg-maroon/10 px-2 py-0.5 rounded-full">
                            {cp.dist}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium">{cp.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MAIN TAB 2: BET DWARKA BOAT CROSSING */}
        {activeTravelTab === 'boat' && hasBoat && (
          <div className="space-y-4">
            {boatBookingPass ? (
              /* Boat Boarding Pass Card */
              <div className="bg-white rounded-3xl shadow-2xl border-2 border-indigo-900 overflow-hidden animate-in slide-in-from-bottom">
                <div className="bg-indigo-dark text-white p-5 text-center relative border-b border-gold/30">
                  <div className="flex items-center justify-between text-xs text-gold font-bold mb-1">
                    <span>BOAT PASS: {boatBookingPass.qr_token}</span>
                    <span className="bg-gold text-indigo-dark px-2 py-0.5 rounded-md uppercase font-black">
                      Bet Dwarka Ferry
                    </span>
                  </div>
                  <h2 className="text-xl font-black font-heading text-white flex items-center justify-center gap-2">
                    <Anchor className="w-5 h-5 text-gold" /> {t.boatPassHeader}
                  </h2>
                  <p className="text-xs text-gray-300 mt-1">
                    {t.departureTimeLabel}: <strong className="text-gold font-mono text-sm">{boatBookingPass.departure_time}</strong>
                  </p>
                </div>

                <div className="relative flex items-center justify-between bg-white px-4 py-2 border-y border-dashed border-indigo-900/30">
                  <div className="w-5 h-5 bg-ivory rounded-full -ml-6 border-r border-indigo-900/20"></div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 font-mono">
                    {t.ferryToken}
                  </span>
                  <div className="w-5 h-5 bg-ivory rounded-full -mr-6 border-l border-indigo-900/20"></div>
                </div>

                <div className="p-6 text-center space-y-3 bg-white">
                  {boatQrCodeUrl ? (
                    <div className="inline-block p-3 bg-white rounded-2xl border-2 border-gold shadow-goldGlow">
                      <img src={boatQrCodeUrl} alt="Boat QR Pass" className="mx-auto w-48 h-48" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-dashed border-gold/40 rounded-2xl flex items-center justify-center mx-auto bg-amber-50/20">
                      <NirvighnaLoader message="Loading Boat Pass..." />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-black text-indigo-dark font-heading">
                      {boatBookingPass.pilgrim_name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {boatBookingPass.passenger_count} {t.passengers} • {t.okhaGate}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mt-2">
                      <CheckCircle className="w-3.5 h-3.5" /> {t.readyForStaffScan}
                    </span>
                  </div>

                  <button
                    onClick={() => setBoatBookingPass(null)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                  >
                    {t.bookAnother}
                  </button>
                </div>
              </div>
            ) : (
              /* Boat Crossing Selection Form */
              <form onSubmit={handleBookBoatCrossing} className="bg-white p-5 rounded-3xl shadow-warm border border-gray-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 font-heading flex items-center gap-2">
                      <Anchor className="w-4.5 h-4.5 text-blue-700 shrink-0" />
                      {t.naukaTitle}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      {t.naukaSubtitle}
                    </p>
                  </div>
                  
                  {/* Live Dynamic Marine Weather & Tide Pill */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold shrink-0 shadow-xs ${
                    marineWeather?.isSafe 
                      ? 'bg-blue-50/90 border-blue-200 text-blue-800' 
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      marineWeather?.isSafe ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                    }`}></span>
                    <span>
                      {currentLanguage === 'hi'
                        ? (marineWeather?.status_hi || t.tideRegulated)
                        : currentLanguage === 'gu'
                        ? (marineWeather?.status_gu || t.tideRegulated)
                        : (marineWeather?.status_en || t.tideRegulated)}
                    </span>
                  </div>
                </div>

                {/* Live Real-World Marine Sensor Telemetry Grid */}
                {marineWeather && (
                  <div className="grid grid-cols-3 gap-2.5 p-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/70 rounded-2xl border border-blue-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-white text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                        💨
                      </span>
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">
                          {currentLanguage === 'hi' ? 'हवा की गति' : currentLanguage === 'gu' ? 'પવનની ઝડપ' : 'Live Wind'}
                        </span>
                        <strong className="text-indigo-dark font-mono text-xs">{marineWeather.windspeedKmh} km/h</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-white text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                        🌊
                      </span>
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">
                          {currentLanguage === 'hi' ? 'समुद्री लहरें' : currentLanguage === 'gu' ? 'દરિયાઈ મોજાં' : 'Sea Swell'}
                        </span>
                        <strong className="text-indigo-dark font-mono text-xs">
                          {marineWeather.seaSwellMeters}m ({marineWeather.seaSwellMeters < 1.2 
                            ? (currentLanguage === 'hi' ? 'शांत' : currentLanguage === 'gu' ? 'શાંત' : 'Calm') 
                            : (currentLanguage === 'hi' ? 'मध्यम' : currentLanguage === 'gu' ? 'મધ્યમ' : 'Moderate')})
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-white text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                        🌡️
                      </span>
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">
                          {currentLanguage === 'hi' ? 'समुद्र तापमान' : currentLanguage === 'gu' ? 'દરિયાઈ તાપમાન' : 'Marine Temp'}
                        </span>
                        <strong className="text-indigo-dark font-mono text-xs">{marineWeather.temperatureC}°C</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wide block mb-2 font-heading">
                    {t.crossingDate}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-1 focus:ring-gold"
                  />
                </div>

                {/* Crossing Departure Cards List */}
                <div>
                  <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wide block mb-2 font-heading">
                    {t.selectBoatTime}
                  </label>

                  {loadingBoat ? (
                    <div className="py-8 text-center text-xs text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-800 mx-auto mb-1" />
                      {t.loading}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {boatCrossings.map((crossing) => {
                        const tideBadge = getTideBadge(crossing.tide_level, crossing.is_safe);
                        const isSelected = selectedBoatCrossing?.id === crossing.id;
                        const isFull = crossing.booked_count >= crossing.total_capacity;

                        return (
                          <div
                            key={crossing.id}
                            onClick={() => {
                              if (crossing.is_safe && !isFull) {
                                setSelectedBoatCrossing(crossing);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              !crossing.is_safe
                                ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-gold/20 border-gold shadow-goldGlow text-indigo-dark font-extrabold'
                                : 'bg-ivory border-gray-200 hover:border-gold text-gray-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-black font-mono flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-blue-700" /> {crossing.departure_time}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tideBadge.color}`}>
                                {tideBadge.label}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-500 font-medium">
                                {t.seats}: {crossing.booked_count}/{crossing.total_capacity}
                              </span>
                              <span className="font-bold text-indigo-dark">₹20 {t.perAdult}</span>
                            </div>

                            {!crossing.is_safe && (
                              <p className="text-[10px] text-red-600 font-bold mt-1">
                                ⚠️ {t.currentlyUnsafe} — {crossing.un_safe_reason || 'High Tide Warning'}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Your Details Section (Synced with Darshan Booking UI) */}
                <div className="bg-ivory/50 p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-maroon" />
                    <span>{t.yourDetailsHeader}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.mobilePhone}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={pilgrimPhone}
                          onChange={(e) => setPilgrimPhone(e.target.value.slice(0, 10))}
                          placeholder={t.mobilePlaceholder}
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-maroon"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.pilgrimName}</label>
                      <input
                        type="text"
                        required
                        value={pilgrimName}
                        onChange={(e) => setPilgrimName(e.target.value)}
                        placeholder={t.fullName}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.emailAddress}</label>
                      <input
                        type="email"
                        required
                        value={pilgrimEmail}
                        onChange={(e) => setPilgrimEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section (Collapsible) */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowEmergency(!showEmergency)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-ivory/60 hover:bg-ivory transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-alertRed" />
                      <span>{t.emergencyContactTitleBoat}</span>
                    </span>
                    {showEmergency ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {showEmergency && (
                    <div className="p-4 space-y-2.5 bg-white animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={emergencyContact.name}
                          onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                          className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                          placeholder={t.emergencyName}
                        />
                        <input
                          type="tel"
                          value={emergencyContact.phone}
                          onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                          placeholder={t.emergencyPhone}
                        />
                        <input
                          type="email"
                          value={emergencyContact.email || ''}
                          onChange={(e) => setEmergencyContact({ ...emergencyContact, email: e.target.value })}
                          className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                          placeholder={t.emergencyEmail}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Family Members Section with 1-Click Saved Selection */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowMembers(!showMembers)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-ivory/60 hover:bg-ivory transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-maroon" />
                      <span>{t.addFamilyGroup} ({bookingMembers.length} {t.added})</span>
                    </span>
                    {showMembers ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {showMembers && (
                    <div className="p-4 space-y-3.5 bg-white animate-in fade-in">
                      {/* 1-Click Saved Members Checklist */}
                      {savedFamilyMembers.length > 0 && (
                        <div className="bg-ivory p-3 rounded-2xl border border-gold/30 space-y-2">
                          <span className="text-xs font-bold text-indigo-dark block font-heading">
                            {t.quickSaved}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {savedFamilyMembers.map((sm, idx) => {
                              const isAdded = bookingMembers.some(bm => bm.name === sm.name);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleSavedMemberSelect(sm)}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    isAdded
                                      ? 'bg-gold/20 border-gold text-indigo-dark font-bold'
                                      : 'bg-white border-gray-200 hover:border-gold/50 text-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isAdded}
                                      onChange={() => {}}
                                      className="w-4 h-4 text-maroon focus:ring-maroon rounded"
                                    />
                                    <div>
                                      <p className="text-xs font-bold">{sm.name}</p>
                                      <p className="text-[10px] text-gray-500">{sm.age ? `${sm.age} yrs` : t.savedMemberBadge}</p>
                                    </div>
                                  </div>
                                  {isAdded && <Check className="w-4 h-4 text-emerald-600" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Added Members List */}
                      {bookingMembers.map((member, index) => (
                        <div key={index} className="relative p-3 bg-ivory rounded-2xl border border-gray-200 space-y-2">
                          <button
                            type="button"
                            onClick={() => removeBookingMember(index)}
                            className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => updateBookingMember(index, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                              placeholder={t.memberName}
                            />
                            <input
                              type="number"
                              value={member.age}
                              onChange={(e) => updateBookingMember(index, 'age', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                              placeholder={t.memberAge}
                            />
                            <input
                              type="tel"
                              value={member.phone}
                              onChange={(e) => updateBookingMember(index, 'phone', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-maroon"
                              placeholder={t.memberPhone}
                            />
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addBookingMember}
                        className="w-full py-2.5 border-2 border-dashed border-gold/40 rounded-xl text-xs font-black text-indigo-dark hover:bg-gold/10 transition-colors flex items-center justify-center gap-1 font-heading"
                      >
                        <Plus className="w-4 h-4 text-maroon" />
                        <span>{t.addMemberBtn}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gold/15 p-3 rounded-2xl border border-gold/30 flex items-center justify-between text-xs font-extrabold">
                  <div>
                    <span>{t.totalPayable}</span>
                    <span className="text-[10px] text-gray-500 block font-normal">
                      {totalPassengers} {t.passengers} (₹20 × {totalPassengers})
                    </span>
                  </div>
                  <span className="text-base text-maroon font-black">
                    ₹{20 * totalPassengers}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submittingBooking || !selectedBoatCrossing || !selectedBoatCrossing.is_safe}
                  className="w-full py-3 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  {submittingBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : t.confirmBoat}
                </button>
              </form>
            )}
          </div>
        )}

        {/* MAIN TAB 3: PARKING & SHUTTLES VIEW */}
        {activeTravelTab === 'travel' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-2">
                <Car className="w-4 h-4 text-maroon" />
                {t.parkingLots}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parkingLots.map((lot) => {
                  const status = getParkingStatus(lot.occupied, lot.capacity);
                  const percent = Math.round((lot.occupied / lot.capacity) * 100);
                  const localizedLotName = currentLanguage === 'hi' ? (lot.name_hi || lot.name) : currentLanguage === 'gu' ? (lot.name_gu || lot.name) : lot.name;
                  const localizedLotDist = currentLanguage === 'hi' ? (lot.distance_hi || lot.distance) : currentLanguage === 'gu' ? (lot.distance_gu || lot.distance) : lot.distance;
                  
                  return (
                    <div key={lot.id} className="bg-white p-4 rounded-2xl shadow-warm border border-gray-100/90 hover:border-gold/50 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-maroon" />
                          <h4 className="font-bold text-sm font-heading text-maroon">
                            {localizedLotName} {localizedLotDist ? `(${localizedLotDist})` : ''}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>{lot.occupied}/{lot.capacity} {t.capacity}</span>
                        <span className="font-semibold text-maroon">{percent}%</span>
                      </div>
                      {lot.hasShuttle && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gold-dark bg-gold/15 px-2.5 py-1 rounded-lg w-fit border border-gold/30">
                          <Bus className="w-3.5 h-3.5 text-gold-dark" />
                          {t.shuttleService} {currentLanguage === 'hi' ? 'सक्रिय' : currentLanguage === 'gu' ? 'કાર્યરત' : 'Active'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-2">
                <Bus className="w-4 h-4 text-indigo-dark" />
                {t.shuttleService}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shuttles.map((shuttle) => {
                  const localizedShuttleName = currentLanguage === 'hi' ? (shuttle.name_hi || shuttle.name) : currentLanguage === 'gu' ? (shuttle.name_gu || shuttle.name) : shuttle.name;
                  const localizedShuttleRoute = currentLanguage === 'hi' ? (shuttle.route_hi || shuttle.route) : currentLanguage === 'gu' ? (shuttle.route_gu || shuttle.route) : shuttle.route;
                  const localizedFare = currentLanguage === 'hi' ? (shuttle.fare_hi || (shuttle.fare === 'Free' ? 'निःशुल्क' : shuttle.fare)) : currentLanguage === 'gu' ? (shuttle.fare_gu || (shuttle.fare === 'Free' ? 'મફત' : shuttle.fare)) : shuttle.fare;

                  return (
                    <div key={shuttle.id} className="bg-white p-4 rounded-2xl shadow-warm border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4 text-maroon" />
                          <span className="font-bold text-xs text-gray-900">{localizedShuttleName}</span>
                        </div>
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                          {localizedFare}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <Navigation className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                          <span className="font-medium text-[11px] text-gray-700 truncate">{localizedShuttleRoute}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-maroon">
                            <Clock className="w-3.5 h-3.5" />
                            {shuttle.nextDeparture} {t.minutes}
                          </div>
                          <div className="text-[9px] text-gray-400 font-medium">
                            {currentLanguage === 'hi' ? `हर ${shuttle.frequency} मिनट` : currentLanguage === 'gu' ? `દર ${shuttle.frequency} મિનિટે` : `Every ${shuttle.frequency} mins`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
