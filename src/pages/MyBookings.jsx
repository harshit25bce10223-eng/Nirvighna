import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { prasadQueueEngine } from '../lib/prasadQueueEngine';
import { getTempleDisplayName, getMicroTempleName } from '../lib/templeRegistry';
import QRCode from 'qrcode';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { 
  Calendar, Clock, MapPin, Users, QrCode, ChevronRight, Loader2, 
  UtensilsCrossed, Footprints, Cable, Anchor, Sparkles, CheckCircle, 
  ArrowLeft, RefreshCw, X, ShieldCheck
} from 'lucide-react';

const translations = {
  en: {
    title: 'My Bookings',
    subtitle: 'All your darshan passes, prasad tokens & transit tickets',
    noBookings: 'No Bookings Found',
    bookFirst: 'Book your first darshan, prasad or transit service to get started',
    goHome: 'Explore Shrines & Services',
    tabs: {
      all: 'All Services',
      darshan: 'Darshan Passes',
      prasad: 'Maha Prasad',
      footwear: 'Footwear Lockers',
      ropeway: 'Ropeway Transit',
      boat: 'Ferry Crossing'
    },
    labels: {
      date: 'Date',
      time: 'Time Slot',
      issued: 'Issued At',
      token: 'Token No.',
      locker: 'Locker Bin',
      timeSlot: 'Time Slot',
      departure: 'Departure',
      pilgrims: 'Pilgrim',
      pairs: 'Pair',
      ticket: 'Ticket',
      details: 'View Ticket Pass',
      close: 'Close',
      detailsTitle: 'Pass & Token Details',
      allottedGate: 'Allotted Gate',
      priorityAccess: 'Priority Access',
      status: 'Status',
      mode: 'Booking Mode',
      servingNow: 'Counter Serving',
      estWait: 'Estimated Wait',
      activeValid: 'Active & Verified',
      scanAtCounter: 'Scan at the verification counter / gate',
      passengers: 'Total Passengers',
      holder: 'Primary Pilgrim',
      direction: 'Transit Direction'
    },
    statusMap: {
      confirmed: 'Confirmed',
      booked: 'Booked',
      waiting: 'In Queue',
      served: 'Claimed',
      active: 'Active',
      completed: 'Completed',
      checked_in: 'In Locker'
    }
  },
  hi: {
    title: 'मेरी बुकिंग',
    subtitle: 'आपके सभी दर्शन पास, प्रसाद टोकन और यात्रा टिकट',
    noBookings: 'कोई बुकिंग नहीं मिली',
    bookFirst: 'दर्शन, प्रसाद या यात्रा सेवा बुक करके शुरुआत करें',
    goHome: 'मंदिर और सेवाएं देखें',
    tabs: {
      all: 'सभी सेवाएं',
      darshan: 'दर्शन पास',
      prasad: 'प्रसाद',
      footwear: 'जूता लॉकर',
      ropeway: 'रोपवे',
      boat: 'नाव सेवा'
    },
    labels: {
      date: 'तारीख',
      time: 'समय',
      issued: 'जारी समय',
      token: 'टोकन नं.',
      locker: 'लॉकर नं.',
      timeSlot: 'समय',
      departure: 'शुरू होने का समय',
      pilgrims: 'श्रद्धालु',
      pairs: 'जोड़ी जूते',
      ticket: 'टिकट',
      details: 'पास / टिकट देखें',
      close: 'बंद करें',
      detailsTitle: 'पास और टोकन की जानकारी',
      allottedGate: 'एंट्री गेट',
      priorityAccess: 'फास्ट एंट्री',
      status: 'स्टेटस',
      mode: 'बुकिंग प्रकार',
      servingNow: 'काउंटर पर चालू टोकन',
      estWait: 'अंदाजन समय',
      activeValid: 'वैलिड पास',
      scanAtCounter: 'काउंटर / गेट पर QR कोड दिखाएं',
      passengers: 'कुल लोग',
      holder: 'नाम',
      direction: 'दिशा'
    },
    statusMap: {
      confirmed: 'कन्फर्म',
      booked: 'बुक हो गया',
      waiting: 'कतार में',
      served: 'प्रसाद मिल गया',
      active: 'चालू',
      completed: 'पूरा हुआ',
      checked_in: 'लॉकर में जमा'
    }
  },
  gu: {
    title: 'મારી બુકિંગ',
    subtitle: 'તમારા દર્શન પાસ, પ્રસાદ ટોકન અને મુસાફરી ટિકિટ',
    noBookings: 'હજુ કોઈ બુકિંગ નથી',
    bookFirst: 'દર્શન, પ્રસાદ અથવા મુસાફરી સેવા બુક કરીને શરૂ કરો',
    goHome: 'મંદિર અને સેવાઓ જુઓ',
    tabs: {
      all: 'બધી સેવાઓ',
      darshan: 'દર્શન પાસ',
      prasad: 'પ્રસાદ',
      footwear: 'પગરખાં લોકર',
      ropeway: 'રોપવે',
      boat: 'બોટ સેવા'
    },
    labels: {
      date: 'તારીખ',
      time: 'સમય',
      issued: 'ઇસ્યુ સમય',
      token: 'ટોકન નં.',
      locker: 'લોકર નં.',
      timeSlot: 'સમય',
      departure: 'ઉપડવાનો સમય',
      pilgrims: 'યાત્રાળુ',
      pairs: 'જોડી',
      ticket: 'ટિકિટ',
      details: 'પાસ જુઓ',
      close: 'બંધ કરો',
      detailsTitle: 'પાસ અને ટોકનની વિગત',
      allottedGate: 'એન્ટ્રી ગેટ',
      priorityAccess: 'ફાસ્ટ એન્ટ્રી',
      status: 'સ્થિતિ',
      mode: 'પ્રકાર',
      servingNow: 'કાઉન્ટર પર ચાલતો ટોકન',
      estWait: 'અંદાજે રાહ',
      activeValid: 'માન્ય પાસ',
      scanAtCounter: 'કાઉન્ટર / ગેટ પર QR સ્કેન કરો',
      passengers: 'કુલ લોકો',
      holder: 'નામ',
      direction: 'દિશા'
    },
    statusMap: {
      confirmed: 'કન્ફર્મ',
      booked: 'બુક થઈ ગયું',
      waiting: 'લાઇનમાં',
      served: 'પ્રસાદ મળી ગયો',
      active: 'ચાલુ',
      completed: 'પૂરું થયું',
      checked_in: 'લોકરમાં જમા'
    }
  }
};

export const MyBookings = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [bookings, setBookings] = useState([]);
  const [prasadBookings, setPrasadBookings] = useState([]);
  const [footwearBookings, setFootwearBookings] = useState([]);
  const [ropewayBookings, setRopewayBookings] = useState([]);
  const [boatBookings, setBoatBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [livePrasadCounter, setLivePrasadCounter] = useState(142);
  const [modalQrDataUrl, setModalQrDataUrl] = useState('');

  useEffect(() => {
    fetchBookings();
    loadLivePrasadCounter();

    // Listen to live Prasad counter updates
    const handleCounterUpdate = (e) => {
      if (e.detail?.counter?.current_serving_token) {
        setLivePrasadCounter(e.detail.counter.current_serving_token);
      }
    };
    window.addEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);

    return () => {
      window.removeEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
    };
  }, [currentUser]);

  const loadLivePrasadCounter = async () => {
    try {
      const status = await prasadQueueEngine.fetchCounterStatus('tmp_somnath');
      if (status?.current_serving_token) {
        setLivePrasadCounter(status.current_serving_token);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (selectedBooking) {
      const qrValue = selectedBooking.type === 'darshan' && selectedBooking.qr_passes && selectedBooking.qr_passes.length > 0
        ? selectedBooking.qr_passes[0].qr_value
        : (selectedBooking.type === 'ropeway' || selectedBooking.type === 'boat')
          ? selectedBooking.qr_token
          : selectedBooking.type === 'prasad'
            ? (selectedBooking.signed_value || `PRASAD-${selectedBooking.token_number}`)
            : selectedBooking.type === 'footwear'
              ? (selectedBooking.signed_value || `FW-${selectedBooking.locker_bin || selectedBooking.token_id || '104'}`)
              : `NIRVIGHNA-${selectedBooking.id}`;

      if (qrValue) {
        QRCode.toDataURL(qrValue, { width: 200, margin: 2 })
          .then(url => setModalQrDataUrl(url))
          .catch(err => console.error('QR generation in modal failed:', err));
      } else {
        setModalQrDataUrl('');
      }
    } else {
      setModalQrDataUrl('');
    }
  }, [selectedBooking]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // 1. Local storage bookings for instant 0ms offline and multi-service sync
      const localBookings = JSON.parse(localStorage.getItem('nirvighna_my_local_bookings') || '[]');
      
      const localRpw = JSON.parse(localStorage.getItem('nirvighna_ropeway_bookings') || '[]').map(r => ({
        ...r,
        type: 'ropeway',
        temples: { name: 'Pavagadh Ropeway Transit', location: 'Machi Base Station, Pavagadh' }
      }));

      const localBoat = JSON.parse(localStorage.getItem('nirvighna_boat_bookings') || '[]').map(b => ({
        ...b,
        type: 'boat',
        temples: { name: 'Bet Dwarka Ferry Crossing', location: 'Okha Jetty Pier #2, Dwarka' }
      }));

      const localFootwear = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]').map(f => {
        const tId = f.temple_id || 'tmp_somnath';
        return {
          ...f,
          id: f.token_id || f.id,
          type: 'footwear',
          temple_id: tId,
          temples: { 
            name: f.temple_name || (tId === 'tmp_dwarka' ? 'Shri Dwarkadhish Mandir' : tId === 'tmp_ambaji' ? 'Shri Arasuri Ambaji Temple' : tId === 'tmp_pavagadh' ? 'Shri Kalika Mata Temple, Pavagadh' : 'Shri Somnath Jyotirlinga'), 
            location: f.counter_station || 'Main Entrance Footwear Counter' 
          }
        };
      });

      const localPrasad = [];
      const savedPrasadList = JSON.parse(localStorage.getItem('nirvighna_prasad_tokens_list') || '[]');
      savedPrasadList.forEach(t => {
        const tId = t.temple_id || 'tmp_somnath';
        localPrasad.push({
          ...t,
          id: t.token_id || t.id,
          type: 'prasad',
          temple_id: tId,
          temples: {
            name: t.temple_name || (tId === 'tmp_somnath' ? 'Shri Somnath Jyotirlinga' : 
                  tId === 'tmp_dwarka' ? 'Shri Dwarkadhish Mandir' :
                  tId === 'tmp_ambaji' ? 'Shri Arasuri Ambaji Temple' : 'Shri Mahakalika Temple, Pavagadh'),
            location: t.dining_hall || 'Annakshetra Hall #1'
          }
        });
      });

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nirvighna_prasad_token_')) {
          try {
            const token = JSON.parse(localStorage.getItem(key));
            if (token && !localPrasad.some(p => p.token_id === (token.token_id || token.id) || p.id === (token.token_id || token.id))) {
              const templeId = token.temple_id || key.replace('nirvighna_prasad_token_', '') || 'tmp_somnath';
              localPrasad.push({
                id: token.token_id || token.id || `local_prasad_${token.token_number}`,
                type: 'prasad',
                temple_id: templeId,
                token_number: token.token_number,
                signed_value: token.signed_value || `PRASAD-${templeId}-${token.token_number}`,
                status: token.status || 'waiting',
                created_at: token.issued_at || token.created_at || new Date().toISOString(),
                issued_at: token.issued_at || token.created_at || new Date().toISOString(),
                headcount: token.headcount || token.quantity || 1,
                prasad_type: token.prasad_type || 'free_thali',
                dining_hall: token.dining_hall || 'Main Annakshetra Hall #1',
                temples: {
                  name: token.temple_name || (templeId === 'tmp_somnath' ? 'Shri Somnath Jyotirlinga' : 
                        templeId === 'tmp_dwarka' ? 'Shri Dwarkadhish Mandir' :
                        templeId === 'tmp_ambaji' ? 'Shri Arasuri Ambaji Temple' : 'Shri Mahakalika Temple, Pavagadh'),
                  location: token.dining_hall || 'Annakshetra Hall #1'
                }
              });
            }
          } catch (e) {}
        }
      }

      setBookings(localBookings);
      setPrasadBookings(localPrasad);
      setFootwearBookings(localFootwear);
      setRopewayBookings(localRpw);
      setBoatBookings(localBoat);

      // Optional remote Supabase DB fetch if user is logged in
      if (currentUser && !currentUser.id?.startsWith('demo_') && currentUser.id !== '00000000-0000-4000-a000-000000000077') {
        try {
          const { data } = await supabase
            .from('bookings')
            .select(`
              *,
              temples (name, location, image_url),
              darshan_slots (slot_date, start_time, end_time, slot_type),
              qr_passes (qr_value, pilgrim_name, pilgrim_phone, scan_status)
            `)
            .eq('pilgrim_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            const merged = [...localBookings, ...data];
            const unique = Array.from(new Map(merged.map(b => [b.id, b])).values());
            setBookings(unique);
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    if (booking.type === 'darshan') {
      navigate('/pass', { state: { bookingId: booking.id, from: 'bookings' } });
      return;
    }
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') {
      return new Date().toLocaleDateString(currentLanguage === 'gu' ? 'gu-IN' : currentLanguage === 'hi' ? 'hi-IN' : 'en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString(currentLanguage === 'gu' ? 'gu-IN' : currentLanguage === 'hi' ? 'hi-IN' : 'en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    } catch (_) {
      return dateStr;
    }
  };

  const cleanTimeString = (timeStr) => {
    if (!timeStr) return '08:00 AM - 10:00 AM';
    // Fix double "AM AM" or "PM PM" bug
    let cleaned = timeStr.replace(/([AP]M)\s*\1/gi, '$1').trim();
    if (cleaned.includes('AM') || cleaned.includes('PM')) {
      return cleaned;
    }
    const parts = cleaned.split(':');
    if (parts.length < 2) return cleaned;
    const hour = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const raw = (status || 'confirmed').toLowerCase();
    let label = t.statusMap[raw];
    if (!label) {
      label = raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    if (raw === 'served' || raw === 'completed') {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-gold/25 to-amber-200/40 text-amber-950 border border-gold/50 flex items-center gap-1 shadow-2xs">
          <CheckCircle className="w-3.5 h-3.5 text-gold-dark" />
          {label}
        </span>
      );
    }
    if (raw === 'waiting' || raw === 'pending') {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
          {label}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-maroon/10 text-maroon border border-maroon/30">
        {label}
      </span>
    );
  };

  const getBookingIcon = (type) => {
    switch (type) {
      case 'darshan': return <Calendar className="w-4 h-4 text-maroon" />;
      case 'prasad': return <UtensilsCrossed className="w-4 h-4 text-amber-700" />;
      case 'footwear': return <Footprints className="w-4 h-4 text-amber-900" />;
      case 'ropeway': return <Cable className="w-4 h-4 text-indigo-dark" />;
      case 'boat': return <Anchor className="w-4 h-4 text-indigo-dark" />;
      default: return <Calendar className="w-4 h-4 text-maroon" />;
    }
  };

  const getBookingServiceInfo = (booking) => {
    const templeId = booking.temple_id || (booking.temples?.name?.toLowerCase().includes('dwarka') ? 'tmp_dwarka' : booking.temples?.name?.toLowerCase().includes('ambaji') ? 'tmp_ambaji' : booking.temples?.name?.toLowerCase().includes('pavagadh') ? 'tmp_pavagadh' : 'tmp_somnath');
    const shrineObj = getTempleDisplayName(templeId, currentLanguage);
    const microName = getMicroTempleName(templeId, currentLanguage);

    if (booking.type === 'darshan') {
      return {
        title: shrineObj?.name || (currentLanguage === 'gu' ? 'શ્રી સોમનાથ જ્યોતિર્લિંગ મંદિર' : currentLanguage === 'hi' ? 'श्री सोमनाथ ज्योतिर्लिंग मंदिर' : 'Shri Somnath Jyotirlinga Temple'),
        location: shrineObj?.location || (currentLanguage === 'gu' ? 'પ્રભાસ પાટણ, ગીર સોમનાથ' : currentLanguage === 'hi' ? 'प्रभास पाटन, गिर सोमनाथ' : 'Prabhas Patan, Gir Somnath')
      };
    }

    if (booking.type === 'prasad') {
      const titles = {
        en: `${microName} • Pavitra Maha Prasad`,
        hi: `${microName} • पवित्र महाप्रसाद केंद्र`,
        gu: `${microName} • પવિત્ર મહાપ્રસાદ કેન્દ્ર`
      };
      const locations = {
        en: 'Annakshetra Dining Hall #1',
        hi: 'अन्नक्षेत्र भोजन कक्ष #1',
        gu: 'અન્નક્ષેત્ર ભોજન હોલ #1'
      };
      return {
        title: titles[currentLanguage] || titles.en,
        location: locations[currentLanguage] || locations.en
      };
    }

    if (booking.type === 'footwear') {
      const titles = {
        en: `${microName} • Free Shoe Locker`,
        hi: `${microName} • निःशुल्क जूता लॉकर`,
        gu: `${microName} • મફત પગરખાં લોકર`
      };
      const locations = {
        en: 'Main Entrance Footwear Counter',
        hi: 'मुख्य प्रवेश द्वार जूता काउंटर',
        gu: 'મુખ્ય પ્રવેશ દ્વાર પગરખાં કાઉન્ટર'
      };
      return {
        title: titles[currentLanguage] || titles.en,
        location: locations[currentLanguage] || locations.en
      };
    }

    if (booking.type === 'ropeway') {
      const titles = {
        en: 'Machi to Pavagadh Temple Ropeway',
        hi: 'माची से पावागढ़ मंदिर रोपवे सेवा',
        gu: 'માચી થી પાવાગઢ મંદિર રોપવે સેવા'
      };
      const locations = {
        en: 'Machi Base Boarding Station, Pavagadh',
        hi: 'माची बेस बोर्डिंग स्टेशन, पावागढ़',
        gu: 'માચી બેઝ બોર્ડિંગ સ્ટેશન, પાવાગઢ'
      };
      return {
        title: titles[currentLanguage] || titles.en,
        location: locations[currentLanguage] || locations.en
      };
    }

    if (booking.type === 'boat') {
      const titles = {
        en: 'Okha to Bet Dwarka Ferry Crossing',
        hi: 'ओखा से बेट द्वारका नौका फेरी',
        gu: 'ઓખા થી બેટ દ્વારકા બોટ ફેરી'
      };
      const locations = {
        en: 'Okha Jetty Pier #2, Dwarka',
        hi: 'ओखा जेटी पियर #2, द्वारका',
        gu: 'ઓખા જેટી પિયર #2, દ્વારકા'
      };
      return {
        title: titles[currentLanguage] || titles.en,
        location: locations[currentLanguage] || locations.en
      };
    }

    return {
      title: booking.temples?.name || 'Nirvighna Pilgrimage Ticket',
      location: booking.temples?.location || 'Gujarat Pilgrimage Circuit'
    };
  };

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'darshan': return bookings.map(b => ({ ...b, type: 'darshan' }));
      case 'prasad': return prasadBookings.map(b => ({ ...b, type: 'prasad' }));
      case 'footwear': return footwearBookings.map(b => ({ ...b, type: 'footwear' }));
      case 'ropeway': return ropewayBookings.map(b => ({ ...b, type: 'ropeway' }));
      case 'boat': return boatBookings.map(b => ({ ...b, type: 'boat' }));
      default:
        return [
          ...bookings.map(b => ({ ...b, type: 'darshan' })),
          ...prasadBookings.map(b => ({ ...b, type: 'prasad' })),
          ...footwearBookings.map(b => ({ ...b, type: 'footwear' })),
          ...ropewayBookings.map(b => ({ ...b, type: 'ropeway' })),
          ...boatBookings.map(b => ({ ...b, type: 'boat' }))
        ].sort((a, b) => {
          const dateA = new Date(a.created_at || a.issued_at || a.date || 0);
          const dateB = new Date(b.created_at || b.issued_at || b.date || 0);
          return dateB - dateA;
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-amber-50/40 flex items-center justify-center pb-20">
        <NirvighnaLoader message="Loading your passes" />
      </div>
    );
  }

  const filteredList = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-[#FFFDF8] to-amber-50/30 pb-28 font-body selection:bg-gold selection:text-indigo-dark animate-page-in">
      {/* Devotional Hero Header */}
      <div className="relative bg-gradient-to-br from-[#4A1017] via-[#6B1B25] to-[#3B0A10] text-white px-4 sm:px-6 pt-[max(env(safe-area-inset-top,28px),28px)] pb-7 border-b border-gold/30 shadow-[0_10px_35px_rgba(0,0,0,0.25)] overflow-hidden">

        {/* Ambient Top Light & Golden Radial Flares */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/80 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-amber-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-inner backdrop-blur-md shrink-0">
                <span className="text-base sm:text-lg">🔱</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-heading tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-gold drop-shadow-sm leading-tight">
                  {t.title}
                </h1>
              </div>
            </div>
            <p className="text-amber-200/85 text-xs sm:text-[13px] font-medium leading-relaxed pl-0.5">
              {t.subtitle}
            </p>
          </div>

          {/* Right Action Controls & Total Count */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-gold/30 text-xs font-bold text-amber-200 backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span>{filteredList.length} {currentLanguage === 'gu' ? 'પાસ' : currentLanguage === 'hi' ? 'पास' : 'Passes'}</span>
            </span>

            <button
              onClick={fetchBookings}
              className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-gold hover:text-indigo-dark border border-gold/40 hover:border-gold text-amber-200 transition-all duration-300 shadow-sm cursor-pointer card-press active:scale-95 group backdrop-blur-md"
              title={currentLanguage === 'gu' ? 'રીફ્રેશ કરો' : currentLanguage === 'hi' ? 'रिफ्रेश करें' : 'Refresh passes'}
            >
              <RefreshCw className="w-4 h-4 text-gold group-hover:text-indigo-dark transition-transform duration-500 group-hover:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {[
            { id: 'all', label: t.tabs.all, icon: '📜' },
            { id: 'darshan', label: t.tabs.darshan, icon: '🕉️' },
            { id: 'prasad', label: t.tabs.prasad, icon: '🍲' },
            { id: 'footwear', label: t.tabs.footwear, icon: '👟' },
            { id: 'ropeway', label: t.tabs.ropeway, icon: '🚡' },
            { id: 'boat', label: t.tabs.boat, icon: '⛵' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer font-heading card-press ${
                  isActive
                    ? 'bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark shadow-goldGlow border border-amber-300 scale-102'
                    : 'bg-white text-gray-700 border border-gold/25 hover:border-gold/50 shadow-2xs hover:bg-amber-50/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking Cards List */}
      <div className="px-4 mt-3 space-y-3.5">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-warm border-2 border-dashed border-gold/40 space-y-3 animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-gold/15 text-gold-dark flex items-center justify-center mx-auto text-2xl shadow-xs">
              📜
            </div>
            <h3 className="text-base font-extrabold text-gray-800 font-heading">{t.noBookings}</h3>
            <p className="text-gray-500 text-xs max-w-xs mx-auto">{t.bookFirst}</p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-amber-400 hover:to-gold text-indigo-dark font-black rounded-2xl text-xs uppercase shadow-goldGlow transition-all tracking-wider font-heading cursor-pointer card-press"
            >
              {t.goHome} →
            </button>
          </div>
        ) : (
          filteredList.map((booking) => {
            const isPrasad = booking.type === 'prasad';
            const isRopeway = booking.type === 'ropeway';
            const isBoat = booking.type === 'boat';
            const isFootwear = booking.type === 'footwear';
            const isConfirmed = (booking.status || 'confirmed').toLowerCase() === 'confirmed';

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-3xl shadow-warm border-2 transition-all overflow-hidden relative group hover-warm ${
                  isConfirmed ? 'border-amber-400 shadow-goldGlow' : 'border-gold/30 hover:border-gold'
                }`}
              >
                {/* Top Service Badge & Status */}
                <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-gray-100/90 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 relative overflow-hidden">
                  {isConfirmed && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-gold-shimmer pointer-events-none" />}
                  <span className="px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 bg-gold/15 text-indigo-dark border border-gold/40 font-heading">
                    {getBookingIcon(booking.type)}
                    <span>{t.tabs[booking.type] || booking.type}</span>
                  </span>
                  {getStatusBadge(booking.status || 'confirmed')}
                </div>


                <div className="p-4 space-y-3">
                  {/* Shrine & Service Title with Icon */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-100 flex items-center justify-center font-black text-lg border border-gold/40 shrink-0 text-indigo-dark shadow-2xs">
                      {isPrasad ? '🍲' : isRopeway ? '🚡' : isBoat ? '⛵' : isFootwear ? '👟' : '🔱'}
                    </div>

                    {(() => {
                      const serviceInfo = getBookingServiceInfo(booking);
                      return (
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-sm sm:text-base text-gray-900 font-heading leading-snug break-words">
                            {serviceInfo.title}
                          </h3>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                            <MapPin className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                            <span className="leading-tight break-words">{serviceInfo.location}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Grid Metrics */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Column 1: Date or Issued */}
                    <div className="bg-ivory/80 rounded-2xl p-2.5 border border-gold/20">
                      <div className="flex items-center gap-1 text-gray-500 text-[11px] font-bold mb-0.5">
                        <Calendar className="w-3 h-3 text-gold-dark" />
                        <span>{isPrasad ? t.labels.issued : t.labels.date}</span>
                      </div>
                      <p className="font-extrabold text-xs text-gray-900 font-mono">
                        {booking.type === 'darshan' && booking.darshan_slots
                          ? formatDate(booking.darshan_slots.slot_date)
                          : booking.slot_date
                            ? formatDate(booking.slot_date)
                            : isPrasad && booking.issued_at
                              ? formatDate(booking.issued_at)
                              : booking.date
                                ? formatDate(booking.date)
                                : formatDate(new Date().toISOString())}
                      </p>
                    </div>

                    {/* Column 2: Time Slot / Token / Locker */}
                    <div className="bg-ivory/80 rounded-2xl p-2.5 border border-gold/20">
                      <div className="flex items-center gap-1 text-gray-500 text-[11px] font-bold mb-0.5">
                        <Clock className="w-3 h-3 text-gold-dark" />
                        <span>
                          {isPrasad ? t.labels.token : isFootwear ? t.labels.locker : isBoat ? t.labels.departure : t.labels.time}
                        </span>
                      </div>
                      <p className="font-black text-xs text-maroon font-mono truncate">
                        {booking.type === 'darshan'
                          ? cleanTimeString(
                              booking.darshan_slots
                                ? `${booking.darshan_slots.start_time} - ${booking.darshan_slots.end_time || ''}`
                                : booking.start_time || '08:00 AM - 10:00 AM'
                            )
                          : isPrasad
                            ? `#${booking.token_number}`
                            : isFootwear
                              ? `#${booking.footwear_lockers?.locker_number || booking.locker_bin || '104'}`
                              : isRopeway
                                ? (booking.time_window || '10:00 AM - 11:00 AM')
                                : isBoat
                                  ? (booking.departure_time || '02:30 PM')
                                  : 'Active'}
                      </p>
                    </div>
                  </div>

                  {/* Prasad Live Serving Mini Ticker */}
                  {isPrasad && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-gold/15 p-2 rounded-xl border border-gold/40 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        {t.labels.servingNow}: <strong className="text-indigo-dark font-mono font-black">#{livePrasadCounter}</strong>
                      </span>
                      <span className="text-maroon font-extrabold font-mono">
                        {livePrasadCounter >= booking.token_number
                          ? '🎉 Turn Active'
                          : `${Math.max(1, (booking.token_number - livePrasadCounter))} Mins`}
                      </span>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs font-bold font-mono">
                      <Users className="w-3.5 h-3.5 text-gold-dark" />
                      <span>
                        {booking.type === 'darshan'
                          ? `${booking.total_pilgrims || 1} ${t.labels.pilgrims}`
                          : isFootwear
                            ? `${booking.footwear_count || 1} ${t.labels.pairs}`
                            : isRopeway || isBoat
                              ? `${booking.passenger_count || 1} ${t.labels.passengers}`
                              : `1 ${t.labels.ticket}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleViewDetails(booking)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-xl shadow-xs hover:shadow-goldGlow transition-all flex items-center gap-1 cursor-pointer font-heading card-press"
                    >
                      <span>{t.labels.details}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Details & QR Pass Modal (Rendered to document.body via Portal) */}
      {showDetails && selectedBooking && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999999] p-4 sm:p-6 backdrop-blur-md animate-in fade-in"
          onClick={() => {
            setShowDetails(false);
            setSelectedBooking(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full max-h-[85vh] shadow-2xl border-2 border-gold/60 font-body relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Top Modal Header */}
            <div className="bg-gradient-to-r from-maroon via-[#541E26] to-maroon text-white px-5 py-4 flex items-center justify-between border-b-2 border-gold/40 shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-inner">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-white font-heading tracking-wide">
                  {t.labels.detailsTitle}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedBooking(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
              {/* Service Headline */}
              {(() => {
                const modalInfo = getBookingServiceInfo(selectedBooking);
                return (
                  <div className="bg-gradient-to-b from-ivory to-amber-50/50 p-4 rounded-2xl border border-gold/35 text-center space-y-1.5 shadow-2xs">
                    <h4 className="font-black text-sm sm:text-base text-maroon font-heading leading-snug break-words">
                      {modalInfo.title}
                    </h4>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                      <span className="truncate max-w-[280px]">{modalInfo.location}</span>
                    </div>
                  </div>
                );
              })()}

              {/* QR Code Plinth */}
              <div className="bg-gradient-to-br from-ivory via-amber-50/30 to-amber-100/20 p-4 sm:p-5 rounded-3xl border-2 border-gold/50 text-center space-y-3 shadow-sm flex flex-col items-center">
                <p className="text-[10px] uppercase font-mono font-black text-gold-dark tracking-widest">
                  {t.labels.scanAtCounter}
                </p>

                {modalQrDataUrl ? (
                  <div className="bg-white p-3 rounded-2xl border-2 border-gold/40 inline-flex flex-col items-center shadow-goldGlow mx-auto">
                    <img 
                      src={modalQrDataUrl} 
                      alt="Signed Booking QR" 
                      className="w-36 h-36 sm:w-40 sm:h-40 mx-auto object-contain" 
                    />
                    <span className="text-[9px] font-mono text-gray-400 font-bold block mt-1.5">
                      🔒 HMAC-SHA256 Signed Security
                    </span>
                  </div>
                ) : (
                  <div className="w-36 h-36 sm:w-40 sm:h-40 border-2 border-dashed border-gold/50 rounded-2xl flex items-center justify-center mx-auto bg-white/60">
                    <Loader2 className="w-6 h-6 text-maroon animate-spin" />
                  </div>
                )}

                <div className="font-mono text-xs sm:text-sm font-black text-indigo-dark bg-white px-4 py-1.5 rounded-xl border border-gold/40 inline-block shadow-xs">
                  {selectedBooking.type === 'prasad' ? `TOKEN #${selectedBooking.token_number}` :
                   selectedBooking.type === 'footwear' ? `LOCKER #${selectedBooking.footwear_lockers?.locker_number || selectedBooking.locker_bin || '104'}` :
                   selectedBooking.shared_booking_code || selectedBooking.qr_token || selectedBooking.id}
                </div>

                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-[11px] font-extrabold text-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t.labels.activeValid}</span>
                </div>
              </div>

              {/* Additional Meta Specs */}
              <div className="bg-gray-50/90 p-3.5 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-700 space-y-2">
                <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{t.labels.date}:</span>
                  <span className="font-bold text-gray-900">
                    {selectedBooking.date ? formatDate(selectedBooking.date) : formatDate(selectedBooking.issued_at || new Date().toISOString())}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{t.labels.time}:</span>
                  <span className="font-bold text-maroon font-mono text-xs sm:text-[13px]">
                    {selectedBooking.type === 'prasad' ? `#${selectedBooking.token_number}` :
                     selectedBooking.type === 'footwear' ? `Locker #${selectedBooking.locker_bin || '104'}` :
                     selectedBooking.time_window || selectedBooking.departure_time || '08:00 AM - 10:00 AM'}
                  </span>
                </div>
                {selectedBooking.direction && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-gray-500 font-medium">{t.labels.direction}:</span>
                    <span className="font-bold text-indigo-dark uppercase">{selectedBooking.direction}</span>
                  </div>
                )}
              </div>

              {/* Close Action Button */}
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedBooking(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark font-black rounded-2xl text-xs uppercase shadow-goldGlow font-heading cursor-pointer tracking-wider hover:opacity-95 active:scale-[0.98] transition-all"
              >
                {t.labels.close}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyBookings;
