import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { PrasadQueueModal } from '../components/PrasadQueueModal';
import { issueSignedToken } from '../lib/signedTokenEngine';
import QRCode from 'qrcode';
import { Shield, CheckCircle, ArrowLeft, Loader2, Bell } from 'lucide-react';

const translations = {
  en: {
    back: 'Back to Home',
    backToBookings: 'Back to My Bookings',
    passport: 'PASSPORT NO',
    officialEntry: 'OFFICIAL ENTRY QR PASS',
    pilgrimHolder: 'PILGRIM PASS HOLDER',
    confirmed: 'Confirmed',
    gate: 'Gate',
    groupPasses: 'Group Passes',
    people: 'People',
    tapToSwitch: 'Tap to switch QR',
    securityNotice: 'Entry Security Notice',
    securityText: 'Please present this QR code at the gate scan turnstiles. Keep your mobile brightness high for instant scanning.',
    loading: 'Loading your pass...',
    noPass: 'No active booking pass found.',
    gateUpdate: 'Gate Update',
    queueInfo: 'Queue Info',
    priorityBadge: 'Priority Pass',
    priorityRule: 'Priority Line Rule: Only 1 accompanying family member / attendant is permitted per priority pass holder.',
    prasadStatus: '🍲 Mahaprasad Token Status',
    prasadReserved: 'Prasad Reserved ✓',
    prasadAvailable: 'Available',
    viewLiveQueue: 'View Live Queue →',
    checkLivePrasad: 'Check Live Prasad Token Queue',
    getPrasadToken: '+ Get Prasad Token',
    audioNavTitle: '🔊 Audio-Guided Navigation',
    audioNavDesc: 'Spoken step-by-step temple directions'
  },
  hi: {
    back: 'होम पर वापस',
    backToBookings: 'मेरी बुकिंग पर वापस',
    passport: 'पासपोर्ट नंबर',
    officialEntry: 'आधिकारिक प्रवेश QR पास',
    pilgrimHolder: 'तीर्थयात्री पास धारक',
    confirmed: 'पुष्टि',
    gate: 'गेट',
    groupPasses: 'समूह पास',
    people: 'लोग',
    tapToSwitch: 'QR बदलने के लिए टैप करें',
    securityNotice: 'प्रवेश सुरक्षा नोटिस',
    securityText: 'कृपया गेट स्कैन टर्नस्टाइल पर यह QR कोड प्रस्तुत करें। तत्काल स्कैनिंग के लिए अपने मोबाइल की चमक उच्च रखें।',
    loading: 'आपका पास लोड हो रहा है...',
    noPass: 'कोई सक्रिय बुकिंग पास नहीं मिला।',
    gateUpdate: 'गेट अपडेट',
    queueInfo: 'कतार की जानकारी',
    priorityBadge: 'प्राथमिकता पास',
    priorityRule: 'प्राथमिकता कतार नियम: प्रति प्राथमिकता पास धारक केवल 1 साथ आने वाले परिजन / परिचारक की अनुमति है।',
    prasadStatus: '🍲 महाप्रसाद टोकन स्थिति',
    prasadReserved: 'प्रसाद आरक्षित ✓',
    prasadAvailable: 'उपलब्ध',
    viewLiveQueue: 'लाइव कतार देखें →',
    checkLivePrasad: 'लाइव प्रसाद कतार जांचें',
    getPrasadToken: '+ प्रसाद टोकन प्राप्त करें',
    audioNavTitle: '🔊 ऑडियो-निर्देशित नेविगेशन',
    audioNavDesc: 'मंदिर गर्भगृह तक वॉयस दिशा-निर्देश'
  },
  gu: {
    back: 'હોમ પર પાછા',
    backToBookings: 'મારી બુકિંગ પર પાછા',
    passport: 'પાસપોર્ટ નંબર',
    officialEntry: 'અધિકૃત પ્રવેશ QR પાસ',
    pilgrimHolder: 'તીર્થયાત્રી પાસ ધારક',
    confirmed: 'પુષ્ટિ',
    gate: 'ગેટ',
    groupPasses: 'જૂથ પાસ',
    people: 'લોકો',
    tapToSwitch: 'QR બદલવા માટે ટેપ કરો',
    securityNotice: 'પ્રવેશ સુરક્ષા નોટિસ',
    securityText: 'કૃપા કરીને ગેટ સ્કેન ટર્નસ્ટાઇલ પર આ QR કોડ રજૂ કરો. તાત્કાલિક સ્કેનિંગ માટે તમારા મોબાઇલની ચમક ઊંચી રાખો.',
    loading: 'તમારો પાસ લોડ થઈ રહ્યો છે...',
    noPass: 'કોઈ સક્રિય બુકિંગ પાસ મળ્યું નથી.',
    gateUpdate: 'ગેટ અપડેટ',
    queueInfo: 'કતાર જાણકારી',
    priorityBadge: 'પ્રાથમિકતા પાસ',
    priorityRule: 'પ્રાથમિકતા લાઇન નિયમ: પ્રાથમિકતા પાસ ધારક દીઠ માત્ર 1 સાથે આવનાર પરિવારના સભ્ય / સહાયકને પરવાનગી છે.',
    prasadStatus: '🍲 મહાપ્રસાદ ટોકન સ્થિતિ',
    prasadReserved: 'પ્રસાદ અનામત ✓',
    prasadAvailable: 'ઉપલબ્ધ',
    viewLiveQueue: 'લાઇવ લાઇન જુઓ →',
    checkLivePrasad: 'લાઇવ પ્રસાદ લાઇન તપાસો',
    getPrasadToken: '+ પ્રસાદ ટોકન મેળવો',
    audioNavTitle: '🔊 ઓડિયો-માર્ગદર્શિત નેવિગેશન',
    audioNavDesc: 'મંદિર ગર્ભગૃહ સુધી અવાજ માર્ગદર્શન'
  }
};

export const Pass = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage];

  const fromSource = location.state?.from;
  const isFromBookings = fromSource === 'bookings' || fromSource === 'my-bookings';

  const handleBack = () => {
    if (isFromBookings) {
      navigate('/my-bookings');
    } else {
      navigate('/home');
    }
  };

  const backLabel = isFromBookings ? (t.backToBookings || 'Back to My Bookings') : t.back;

  const [booking, setBooking] = useState(null);
  const [qrPasses, setQrPasses] = useState([]);
  const [activeQrIndex, setActiveQrIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [gateNotification, setGateNotification] = useState(null);
  const [showPrasadModal, setShowPrasadModal] = useState(false);
  const [showLiveQueueModal, setShowLiveQueueModal] = useState(false);
  const [hasBookedPrasad, setHasBookedPrasad] = useState(false);
  const [prasadType, setPrasadType] = useState('free');
  const canvasRef = useRef(null);

  const bookingId = location.state?.bookingId;

  useEffect(() => {
    fetchBookingAndPasses();
  }, [bookingId]);

  useEffect(() => {
    if (qrPasses.length > 0) {
      generateQRCode(qrPasses[activeQrIndex].qr_value);
    }
  }, [qrPasses, activeQrIndex]);

  useEffect(() => {
    // Setup realtime subscription for notifications
    if (!currentUser) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const notification = payload.new;
          if (notification.type === 'gate_info' && booking) {
            setGateNotification(notification);
            // Auto-dismiss after 10 seconds
            setTimeout(() => setGateNotification(null), 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, booking]);

  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'pending_sync'

  useEffect(() => {
    const handleOnline = async () => {
      // Auto-flush pending local bookings to Supabase on regaining connectivity
      try {
        const localBookings = JSON.parse(localStorage.getItem('nirvighna_my_local_bookings') || '[]');
        if (localBookings.length > 0) {
          for (const b of localBookings) {
            await supabase.from('bookings').upsert({
              id: b.id,
              pilgrim_id: b.pilgrim_id,
              temple_id: b.temple_id,
              slot_id: b.slot_id,
              gate_number: b.gate_number,
              is_priority: b.is_priority,
              status: 'confirmed',
              shared_booking_code: b.shared_booking_code
            });
          }
          setSyncStatus('synced');
        }
      } catch (e) {
        console.warn('Auto-sync on online failed:', e);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const fetchBookingAndPasses = async () => {
    try {
      setLoading(true);

      let bookingData = null;

      // 1. Check local storage first (instant, guaranteed availability)
      const localBookings = JSON.parse(localStorage.getItem('nirvighna_my_local_bookings') || '[]');

      if (bookingId) {
        const matched = localBookings.find(b => b.id === bookingId);
        if (matched) {
          let passes = matched.qr_passes;
          if (!passes || passes.length === 0) {
            const defaultPassId = `pass_${matched.id}_1`;
            const { signed_value } = await issueSignedToken({
              token_type: 'gate_entry',
              resource_id: defaultPassId,
              temple_id: matched.temple_id || 'tmp_somnath'
            });
            passes = [
              {
                id: defaultPassId,
                booking_id: matched.id,
                qr_value: signed_value,
                pilgrim_name: currentUser?.full_name || 'Pilgrim',
                scan_status: 'not_scanned',
                is_valid: true
              }
            ];
            matched.qr_passes = passes;
            localStorage.setItem('nirvighna_my_local_bookings', JSON.stringify(localBookings));
          }

          bookingData = {
            ...matched,
            temple: matched.temples,
            qr_passes: passes
          };
          setSyncStatus('synced');
        }
      } else if (localBookings.length > 0) {
        const matched = localBookings[0];
        let passes = matched.qr_passes;
        if (!passes || passes.length === 0) {
          const defaultPassId = `pass_${matched.id}_1`;
          const { signed_value } = await issueSignedToken({
            token_type: 'gate_entry',
            resource_id: defaultPassId,
            temple_id: matched.temple_id || 'tmp_somnath'
          });
          passes = [
            {
              id: defaultPassId,
              booking_id: matched.id,
              qr_value: signed_value,
              pilgrim_name: currentUser?.full_name || 'Pilgrim',
              scan_status: 'not_scanned',
              is_valid: true
            }
          ];
          matched.qr_passes = passes;
          localStorage.setItem('nirvighna_my_local_bookings', JSON.stringify(localBookings));
        }

        bookingData = {
          ...matched,
          temple: matched.temples,
          qr_passes: passes
        };
        setSyncStatus('synced');
      }

      // 2. If not found in local storage, query Supabase safely with maybeSingle
      if (!bookingData) {
        try {
          if (bookingId) {
            const { data } = await supabase
              .from('bookings')
              .select('*, temple:temples(*), qr_passes(*)')
              .eq('id', bookingId)
              .maybeSingle();
            if (data) {
              bookingData = data;
              setSyncStatus('synced');
            }
          } else if (currentUser?.id) {
            const { data } = await supabase
              .from('bookings')
              .select('*, temple:temples(*), qr_passes(*)')
              .eq('pilgrim_id', currentUser.id)
              .eq('status', 'confirmed')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (data) {
              bookingData = data;
              setSyncStatus('synced');
            }
          }
        } catch (dbErr) {
          // Graceful ignore
        }
      }

      if (bookingData) {
        if (!bookingData.qr_passes || bookingData.qr_passes.length === 0) {
          bookingData.qr_passes = [
            {
              id: 'pass_1',
              pilgrim_name: currentUser?.full_name || 'Pilgrim',
              qr_value: `${bookingData.shared_booking_code || 'NIRVIGHNA'}-${(currentUser?.full_name || 'PASS').toUpperCase().replace(/\s+/g, '-')}`,
              scan_status: 'not_scanned',
              is_valid: true
            }
          ];
        }
        setBooking(bookingData);
        setQrPasses(bookingData.qr_passes || []);
        if (bookingData.include_prasad) {
          setHasBookedPrasad(true);
          setPrasadType(bookingData.prasad_type || 'laddu_box');
        }
      } else {

        setBooking(null);
        setQrPasses([]);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setBooking(null);
      setQrPasses([]);
    }
 finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (qrValue) => {
    try {
      const dataUrl = await QRCode.toDataURL(qrValue, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1B2A4A',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const currentPass = qrPasses[activeQrIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-20">
        <NirvighnaLoader message={t.loading} />
      </div>
    );
  }

  if (!booking || qrPasses.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-24 px-4 animate-page-in">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-gold/30 shadow-warm space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-gold/40 flex items-center justify-center mx-auto text-2xl">
            🎟️
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black font-heading text-maroon">{t.noPass}</h2>
            <p className="text-xs text-gray-500 font-semibold">
              {currentLanguage === 'gu'
                ? 'કોઈ સક્રિય દર્શન પાસ મળ્યો નથી. દર્શન સ્લોટ બુક કરો.'
                : currentLanguage === 'hi'
                ? 'कोई सक्रिय दर्शन पास नहीं मिला। दर्शन स्लॉट बुक करें।'
                : 'You currently have no active temple pass. Book a darshan slot to generate your QR ticket.'}
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate('/home')}
              className="btn-warm-primary py-3 font-heading uppercase text-xs tracking-wider"
            >
              🔱 {currentLanguage === 'gu' ? 'દર્શન બુક કરો' : currentLanguage === 'hi' ? 'दर्शन बुक करें' : 'Book Darshan Pass'}
            </button>
            <button
              onClick={handleBack}
              className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-maroon transition-all cursor-pointer"
            >
              {backLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-ivory pt-[max(env(safe-area-inset-top,28px),28px)] pb-12 px-3.5 sm:px-6 animate-page-in">
      <div className="max-w-md sm:max-w-lg mx-auto space-y-5">

        {/* Gate Notification Banner */}
        {gateNotification && (
          <div className="bg-gradient-to-r from-gold/20 via-amber-50 to-gold/10 border-2 border-gold p-3.5 rounded-2xl shadow-sm animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-indigo-dark font-extrabold text-xs mb-1">
              <Bell className="w-4 h-4 text-gold-dark animate-bounce" />
              {t.gateUpdate}
            </div>
            <p className="text-sm text-gray-800 font-semibold">
              {gateNotification.message}
            </p>
          </div>
        )}

        {/* Navigation */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-bold text-maroon hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>

        {/* Ticket Container */}
        <div className="bg-white rounded-3xl shadow-warm border border-maroon/20 overflow-hidden relative">
          {/* Shikhara Top Banner */}
          <div className="bg-maroon text-ivory p-5 text-center relative">
            <div className="flex items-center justify-between text-xs text-gold font-bold mb-1">
              <span>{t.passport}: {booking.shared_booking_code}</span>
              <span className="bg-gold text-indigo-dark px-2 py-0.5 rounded-md uppercase">
                {booking.booking_mode}
              </span>
            </div>
            <h2 className="text-xl font-extrabold font-heading text-white">
              {booking.temple?.name || booking.temples?.name || 'Dwarkadhish Temple'}
            </h2>
            {(() => {
              const rawDate = booking.slot_date || booking.darshan_slots?.slot_date;
              let formattedDate = 'Today';
              if (rawDate) {
                try {
                  const d = new Date(rawDate);
                  formattedDate = d.toLocaleDateString(currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'gu' ? 'gu-IN' : 'en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                } catch (e) {
                  formattedDate = rawDate;
                }
              }
              const startTime = booking.start_time || booking.darshan_slots?.start_time || '08:00 AM';
              const endTime = booking.end_time || booking.darshan_slots?.end_time || '10:00 AM';
              return (
                <p className="text-xs text-gold/90 font-bold mt-1 tracking-wide">
                  {formattedDate} • {startTime} - {endTime}
                </p>
              );
            })()}
          </div>

          {/* Ticket Perforated Divider */}
          <div className="relative flex items-center justify-between bg-white px-4 py-2 border-y border-dashed border-maroon/30">
            <div className="w-5 h-5 bg-ivory rounded-full -ml-6 border-r border-maroon/20"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
              {t.officialEntry}
            </span>
            <div className="w-5 h-5 bg-ivory rounded-full -mr-6 border-l border-maroon/20"></div>
          </div>

          {/* QR Code Center Section */}
          <div className="p-6 text-center space-y-4 bg-white relative">
            <div className="inline-block p-3 bg-white rounded-2xl border-2 border-gold shadow-goldGlow">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="mx-auto" />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100">
                  <Loader2 className="w-8 h-8 text-maroon animate-spin" />
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
                {t.pilgrimHolder}
              </span>
              <h3 className="text-lg font-extrabold text-indigo-dark font-heading">
                {currentPass?.pilgrim_name || 'Pilgrim'}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-successGreen bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" /> {t.confirmed}
                </span>
                <span className="text-[11px] font-bold text-maroon bg-maroon/10 px-2.5 py-0.5 rounded-full">
                  {currentPass?.gate_number || (typeof booking.gate_number === 'string' && booking.gate_number.toLowerCase().includes('gate') ? booking.gate_number : `${t.gate} #${booking.gate_number || '1'}`)}
                </span>
                {(currentPass?.is_priority ?? booking.is_priority) && (
                  <span className="text-[10px] font-bold text-maroon bg-gold/20 border border-gold/40 px-2.5 py-0.5 rounded-full font-heading">
                    {currentPass?.priority_category ? `${t.priorityBadge} (${currentPass.priority_category})` : t.priorityBadge}
                  </span>
                )}
              </div>

              {(currentPass?.is_priority ?? booking.is_priority) && (
                <div className="mt-3 mx-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-medium text-left">
                  <strong>{t.priorityRule}</strong>
                  {currentPass?.attendant_name && (
                    <p className="mt-1 text-emerald-800 font-bold">
                      🤝 Designated Accompanying Attendant: {currentPass.attendant_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Prasad Token Card Section */}
          <div className="p-4 bg-emerald-50/60 border-t border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 font-heading">
                {t.prasadStatus}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {hasBookedPrasad ? t.prasadReserved : t.prasadAvailable}
              </span>
            </div>

            {hasBookedPrasad ? (
              <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-emerald-800">Token ID: PRS-{booking.shared_booking_code}</p>
                  <button
                    onClick={() => setShowLiveQueueModal(true)}
                    className="px-2.5 py-1 bg-gold text-indigo-dark text-[10px] font-black rounded-lg uppercase shadow-2xs"
                  >
                    {t.viewLiveQueue}
                  </button>
                </div>
                <p className="text-gray-600 text-[11px]">Show this QR pass at Annakshetra Counter for instant meal.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setShowLiveQueueModal(true)}
                  className="text-[11px] text-emerald-700 font-bold underline"
                >
                  {t.checkLivePrasad}
                </button>
                <button
                  onClick={() => setShowPrasadModal(false) || setShowLiveQueueModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-all"
                >
                  {t.getPrasadToken}
                </button>
              </div>
            )}

            {showLiveQueueModal && (
              <PrasadQueueModal
                templeId={booking?.temple_id || 'tmp_somnath'}
                templeName={booking?.temple?.name || 'Somnath Temple'}
                onClose={() => setShowLiveQueueModal(false)}
              />
            )}

            {/* Audio Navigation Button — always visible for all pilgrims */}
            <div className="flex items-center justify-between p-4 bg-amber-50/50 border-t border-gray-100 gap-3">
              <div>
                <span className="text-[11px] text-amber-800 font-bold block">{t.audioNavTitle}</span>
                <span className="text-[10px] text-gray-500">{t.audioNavDesc}</span>
              </div>
              <button
                onClick={() => navigate('/priority-nav')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-sm shrink-0 transition-all font-heading flex items-center gap-1"
              >
                🗺️ Start Nav
              </button>
            </div>
          </div>

          {/* Group Member Chips Switcher */}
          {qrPasses.length > 1 && (
            <div className="p-4 bg-ivory/60 border-t border-gray-100">
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2 text-center">
                {t.groupPasses} ({qrPasses.length} {t.people}) - {t.tapToSwitch}
              </label>
              <div className="flex justify-center gap-2 overflow-x-auto">
                {qrPasses.map((pass, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveQrIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      activeQrIndex === idx
                        ? 'bg-gold border-gold text-indigo-dark shadow-sm'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gold/60'
                    }`}
                  >
                    {pass.pilgrim_name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>



        {/* Prasad Booking Modal Overlay */}
        {showPrasadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-gold/40">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-sm text-gray-900 font-heading flex items-center gap-1.5">
                  🍲 Book Temple Prasad Token
                </h3>
                <button onClick={() => setShowPrasadModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-600 font-medium">
                  Prasad tokens can be booked up to <strong>2 hours before</strong> your darshan slot time.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPrasadType('free')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      prasadType === 'free'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900'
                        : 'bg-ivory border-gray-200 text-gray-600'
                    }`}
                  >
                    <p className="font-bold text-xs">Free Meal</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Nishulk Annakshetra</p>
                  </button>

                  <button
                    onClick={() => setPrasadType('laddu_box')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      prasadType === 'laddu_box'
                        ? 'bg-gold/20 border-gold font-bold text-indigo-dark'
                        : 'bg-ivory border-gray-200 text-gray-600'
                    }`}
                  >
                    <p className="font-bold text-xs">Laddu Box</p>
                    <p className="text-[10px] text-maroon font-bold">₹51 Token</p>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setHasBookedPrasad(true);
                    setShowPrasadModal(false);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase shadow-md transition-all"
                >
                  Confirm & Reserve Prasad Token →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nirvighna Official Emblem Watermark */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.07] z-0 select-none">
          <img 
            src="/official_logo.png" 
            alt="Nirvighna Emblem Watermark" 
            className="w-80 h-80 max-w-[75vw] object-contain drop-shadow-sm" 
          />
        </div>
      </div>
    </div>
  );
};
