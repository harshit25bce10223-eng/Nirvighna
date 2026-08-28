import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { prasadQueueEngine } from '../lib/prasadQueueEngine';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, CheckCircle, Loader2, User, CreditCard, Banknote } from 'lucide-react';
import { sendPilgrimNotification } from '../lib/notificationService';

const translations = {
  en: {
    title: 'Mahaprasad Seva',
    serving: 'Serving Now:',
    devoteeName: 'Devotee Name',
    namePh: 'Enter full name',
    selectPrasad: 'Select Prasad Offering',
    freeThali: '🍲 Free Annakshetra Meal Thali (₹0)',
    freeThaliDesc: '100% Free seated holy meal',
    ladduBox: '🎁 Special Kesar Laddu Box (₹51)',
    ladduBoxDesc: 'Pure Desi Ghee 250g box',
    panchamrit: '🥥 Dry Fruit Panchamrit (₹101)',
    panchamritDesc: 'Blessed dry fruit pack',
    count: 'Count / Quantity',
    paymentMode: 'Payment Mode',
    payOnline: 'Online (Instant UPI / GPay)',
    payCounter: 'Pay at Counter (Cash on Pickup)',
    getFreePass: '🍲 Get Free Prasad Pass (₹0)',
    payAndBook: '💳 Pay & Confirm Pass',
    payAtCounter: '🪙 Book • Pay at Counter',
    confirmedTitle: '🎉 Prasad Pass Confirmed!',
    confirmedDesc: 'Your pass is ready. You can view, download, and show your QR pass anytime in My Bookings.',
    viewMyBookings: '🎫 View in My Bookings →',
    bookAnother: '+ Book Another',
    close: 'Close',
    token: 'Token Number',
    total: 'Total Amount'
  },
  hi: {
    title: 'महाप्रसाद सेवा',
    serving: 'चालू टोकन:',
    devoteeName: 'श्रद्धालु का नाम',
    namePh: 'पूरा नाम दर्ज करें',
    selectPrasad: 'महाप्रसाद चुनें',
    freeThali: '🍲 निःशुल्क अन्नक्षेत्र भोजन थाली (₹0)',
    freeThaliDesc: '100% निःशुल्क पवित्र भोजन',
    ladduBox: '🎁 विशेष केसर लड्डू डिब्बा (₹51)',
    ladduBoxDesc: 'शुद्ध देशी घी 250 ग्राम',
    panchamrit: '🥥 पंचामृत एवं मेवा भोग (₹101)',
    panchamritDesc: 'पवित्र पंचामृत एवं मेवा',
    count: 'संख्या / मात्रा',
    paymentMode: 'भुगतान का तरीका',
    payOnline: 'ऑनलाइन (UPI / गूगल पे)',
    payCounter: 'काउंटर पर भुगतान (नकद)',
    getFreePass: '🍲 निःशुल्क प्रसाद पास पाएं (₹0)',
    payAndBook: '💳 भुगतान करें एवं पास प्राप्त करें',
    payAtCounter: '🪙 पास बुक करें • काउंटर पर भुगतान',
    confirmedTitle: '🎉 महाप्रसाद पास कन्फर्म हो गया!',
    confirmedDesc: 'आपका पास सुरक्षित सेव हो गया है। आप इसे "मेरी बुकिंग" में देख सकते हैं।',
    viewMyBookings: '🎫 मेरी बुकिंग में पास देखें →',
    bookAnother: '+ नया पास बनाएं',
    close: 'बंद करें',
    token: 'टोकन नंबर',
    total: 'कुल राशि'
  },
  gu: {
    title: 'મહાપ્રસાદ સેવા',
    serving: 'ચાલુ ટોકન:',
    devoteeName: 'યાત્રાળુનું નામ',
    namePh: 'પૂરું નામ દાખલ કરો',
    selectPrasad: 'મહાપ્રસાદ પસંદ કરો',
    freeThali: '🍲 મફત અન્નક્ષેત્ર ભોજન થાળી (₹0)',
    freeThaliDesc: '100% મફત પવિત્ર ભોજન',
    ladduBox: '🎁 સ્પેશિયલ કેસર લાડુ બોક્સ (₹51)',
    ladduBoxDesc: 'શુદ્ધ દેશી ઘી 250 ગ્રામ',
    panchamrit: '🥥 પંચામૃત અને સુકા મેવા (₹101)',
    panchamritDesc: 'પવિત્ર પંચામૃત પેક',
    count: 'સંખ્યા / માત્રા',
    paymentMode: 'પેમેન્ટ કરવાની રીત',
    payOnline: 'ઓનલાઇન (UPI / GPay)',
    payCounter: 'કાઉન્ટર પર પેમેન્ટ (રોકડ)',
    getFreePass: '🍲 મફત પ્રસાદ પાસ મેળવો (₹0)',
    payAndBook: '💳 પેમેન્ટ કરો અને પાસ મેળવો',
    payAtCounter: '🪙 પાસ બુક કરો • કાઉન્ટર પર પેમેન્ટ',
    confirmedTitle: '🎉 મહાપ્રસાદ પાસ કન્ફર્મ થઈ ગયો!',
    confirmedDesc: 'તમારો પાસ સેવ થઈ ગયો છે. તમે "મારી બુકિંગ" પેજ પર જોઈ શકો છો.',
    viewMyBookings: '🎫 મારી બુકિંગમાં પાસ જુઓ →',
    bookAnother: '+ નવો પાસ બનાવો',
    close: 'બંધ કરો',
    token: 'ટોકન નંબર',
    total: 'કુલ રકમ'
  }
};

const MASTER_TEMPLES = [
  { id: 'tmp_somnath', icon: '🔱', name: { en: 'Somnath', hi: 'सोमनाथ', gu: 'સોમનાથ' }, full: { en: 'Shri Somnath Jyotirlinga', hi: 'श्री सोमनाथ ज्योतिर्लिंग', gu: 'શ્રી સોમનાથ જ્યોતિર્લિંગ' } },
  { id: 'tmp_dwarka', icon: '🦚', name: { en: 'Dwarka', hi: 'द्वारका', gu: 'દ્વારકા' }, full: { en: 'Shri Dwarkadhish Mandir', hi: 'श्री द्वारकाधीश मंदिर', gu: 'શ્રી દ્વારકાધીશ મંદિર' } },
  { id: 'tmp_ambaji', icon: '🌸', name: { en: 'Ambaji', hi: 'अंबाजी', gu: 'અંબાજી' }, full: { en: 'Shri Arasuri Ambaji Temple', hi: 'श्री अंबाजी माता मंदिर', gu: 'શ્રી આરાસુરી અંબાજી મંદિર' } },
  { id: 'tmp_pavagadh', icon: '🚩', name: { en: 'Pavagadh', hi: 'पावागढ़', gu: 'પાવાગઢ' }, full: { en: 'Shri Kalika Mata Temple, Pavagadh', hi: 'श्री कालिका माता मंदिर, पावागढ़', gu: 'શ્રી કાલિકા માતા મંદિર, પાવાગઢ' } },
];

export const PrasadQueueModal = ({ isOpen = true, templeId = 'tmp_somnath', templeName = 'Somnath Temple', onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [activeTempleId, setActiveTempleId] = useState(templeId || 'tmp_somnath');
  const currentTempleObj = MASTER_TEMPLES.find(t => t.id === activeTempleId) || MASTER_TEMPLES[0];
  const shrineName = currentTempleObj.full[currentLanguage] || currentTempleObj.full.en;

  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [selectedOffering, setSelectedOffering] = useState('free_thali');
  const [quantity, setQuantity] = useState(2);
  const [paymentMode, setPaymentMode] = useState('online');
  const [loading, setLoading] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState(null);
  const [servingToken, setServingToken] = useState(142);

  const priceMap = { free_thali: 0, laddu: 51, panchamrit: 101 };
  const unitPrice = priceMap[selectedOffering] || 0;
  const isFree = unitPrice === 0;
  const totalAmount = unitPrice * quantity;

  useEffect(() => {
    if (currentUser?.full_name && pilgrimName === 'Pilgrim Devotee') {
      setPilgrimName(currentUser.full_name);
    }
    prasadQueueEngine.fetchCounterStatus(activeTempleId).then(s => {
      if (s?.current_serving_token) setServingToken(s.current_serving_token);
    }).catch(() => {});
  }, [activeTempleId, currentUser]);

  const handleBook = async (e) => {
    if (e) e.preventDefault();
    if (!pilgrimName.trim()) return;

    setLoading(true);
    try {
      if (!isFree && paymentMode === 'online') {
        await new Promise(r => setTimeout(r, 800));
      }

      const token = await prasadQueueEngine.issuePrasadToken(null, activeTempleId);
      const offeringTitles = {
        free_thali: t.freeThali,
        laddu: t.ladduBox,
        panchamrit: t.panchamrit
      };

      const tokenData = {
        ...token,
        token_id: `PRS-${activeTempleId}-${token.token_number}`,
        id: `PRS-${activeTempleId}-${token.token_number}`,
        type: 'prasad',
        pilgrim_name: pilgrimName.trim(),
        prasad_type: selectedOffering,
        prasad_label: offeringTitles[selectedOffering] || 'Pavitra Mahaprasad',
        quantity: quantity,
        headcount: quantity,
        total_amount: totalAmount,
        payment_status: isFree ? 'FREE' : (paymentMode === 'online' ? 'PAID' : 'PAY_AT_COUNTER'),
        payment_mode: isFree ? 'N/A' : (paymentMode === 'online' ? 'Online UPI' : 'Pay on Collection'),
        dining_hall: isFree ? 'Main Annakshetra Hall' : 'Prasad Counter #3',
        temple_id: activeTempleId,
        temple_name: shrineName,
        temples: { name: shrineName, location: isFree ? 'Main Annakshetra Hall' : 'Prasad Counter #3' },
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      localStorage.setItem(`nirvighna_prasad_token_${activeTempleId}`, JSON.stringify(tokenData));
      const list = JSON.parse(localStorage.getItem('nirvighna_prasad_tokens_list') || '[]');
      localStorage.setItem('nirvighna_prasad_tokens_list', JSON.stringify([tokenData, ...list.filter(x => x.token_id !== tokenData.token_id)]));

      await sendPilgrimNotification({
        type: 'gate_info',
        title: '🍲 Mahaprasad Pass Confirmed!',
        message: `Pass #${token.token_number} confirmed at ${shrineName}.`,
        templeId: activeTempleId
      });

      setConfirmedToken(tokenData);
    } catch (err) {
      alert('Error booking prasad: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMyBookings = () => {
    onClose?.();
    navigate('/my-bookings');
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999999] p-4 select-none font-body animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white border-2 border-gold/60 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden text-gray-900 flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-200"
      >
        {/* Responsive Header with Lang Toggle & Close Button */}
        <div className="bg-gradient-to-r from-maroon via-[#6B1B26] to-[#450F16] text-white px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between border-b border-gold/30 shrink-0 gap-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xl sm:text-2xl shrink-0">🍲</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-xs sm:text-sm md:text-base text-white font-heading tracking-wide truncate">
                {t.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-200 truncate">
                {shrineName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Lang Switcher */}
            <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/20">
              {[{ id: 'hi', label: 'हि' }, { id: 'gu', label: 'ગુ' }, { id: 'en', label: 'EN' }].map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold transition-all cursor-pointer ${
                    currentLanguage === l.id ? 'bg-gold text-indigo-dark font-black' : 'text-white/80'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* HIGH CONTRAST CLOSE BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose && onClose();
              }}
              className="p-1 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-90 shadow-md shrink-0 border border-white/40 min-w-[28px] h-7 sm:h-8"
              title={t.close}
            >
              <X className="w-4 h-4 text-white" strokeWidth={3} />
              <span className="hidden sm:inline font-heading uppercase text-[10px]">{t.close}</span>
            </button>
          </div>
        </div>

        {/* 4 Temple Selector Bar */}
        <div className="bg-[#FAF7F2] px-3 py-2 border-b border-gold/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {MASTER_TEMPLES.map(tmp => (
            <button
              key={tmp.id}
              type="button"
              onClick={() => {
                setActiveTempleId(tmp.id);
                setConfirmedToken(null);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer font-heading ${
                activeTempleId === tmp.id
                  ? 'bg-maroon text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gold'
              }`}
            >
              <span>{tmp.icon}</span>
              <span>{tmp.name[currentLanguage] || tmp.name.en}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Form */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-4 flex-1">
          {confirmedToken ? (
            /* CONFIRMATION CARD */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                ✓
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 font-heading">
                  {t.confirmedTitle}
                </h4>
                <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                  {t.confirmedDesc}
                </p>
              </div>

              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-gold/30 text-left text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-500">{t.token}:</span>
                  <span className="text-maroon font-mono font-black text-sm">#{confirmedToken.token_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.total}:</span>
                  <span className="font-black text-emerald-700 font-mono">
                    {confirmedToken.total_amount === 0 ? 'FREE (₹0)' : `₹${confirmedToken.total_amount} (${confirmedToken.payment_status})`}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleGoToMyBookings}
                  className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark font-black text-xs uppercase tracking-wider rounded-xl shadow-goldGlow cursor-pointer font-heading active:scale-98 transition-all"
                >
                  {t.viewMyBookings}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer font-heading"
                >
                  {t.close}
                </button>
              </div>
            </div>
          ) : (
            /* SIMPLE BOOKING FORM */
            <form onSubmit={handleBook} className="space-y-3.5">
              
              {/* Devotee Name */}
              <div>
                <label className="text-[11px] font-black uppercase text-maroon font-heading block mb-1">
                  👤 {t.devoteeName} *
                </label>
                <input
                  type="text"
                  required
                  value={pilgrimName}
                  onChange={(e) => setPilgrimName(e.target.value)}
                  placeholder={t.namePh}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-maroon focus:bg-white"
                />
              </div>

              {/* Offerings Selector */}
              <div>
                <label className="text-[11px] font-black uppercase text-maroon font-heading block mb-1.5">
                  🍲 {t.selectPrasad}
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'free_thali', title: t.freeThali, desc: t.freeThaliDesc, price: 0 },
                    { id: 'laddu', title: t.ladduBox, desc: t.ladduBoxDesc, price: 51 },
                    { id: 'panchamrit', title: t.panchamrit, desc: t.panchamritDesc, price: 101 },
                  ].map(off => (
                    <div
                      key={off.id}
                      onClick={() => setSelectedOffering(off.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        selectedOffering === off.id
                          ? 'bg-amber-50 border-gold shadow-xs'
                          : 'bg-white border-gray-200 hover:border-gold/50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">{off.title}</p>
                        <p className="text-[10px] text-gray-500">{off.desc}</p>
                      </div>
                      <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                        off.price === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-maroon text-white'
                      }`}>
                        {off.price === 0 ? 'FREE' : `₹${off.price}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-gold/20 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 font-heading">
                  🔢 {t.count}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-maroon font-black flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-mono text-xs font-black min-w-[40px] text-center bg-white px-2 py-1 rounded border border-gold/30">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(20, q + 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-maroon font-black flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Payment Mode if Paid */}
              {!isFree && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-maroon font-heading block">
                    💳 {t.paymentMode} (Total: ₹{totalAmount})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('online')}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left ${
                        paymentMode === 'online' ? 'bg-amber-50 border-gold text-indigo-dark' : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1 text-emerald-600" />
                      <span>{t.payOnline}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('counter')}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left ${
                        paymentMode === 'counter' ? 'bg-amber-50 border-gold text-indigo-dark' : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <Banknote className="w-4 h-4 mb-1 text-amber-600" />
                      <span>{t.payCounter}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || !pilgrimName.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold text-indigo-dark font-black text-xs uppercase tracking-wider rounded-xl shadow-goldGlow flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-98 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFree ? (
                  <span>{t.getFreePass}</span>
                ) : paymentMode === 'online' ? (
                  <span>{t.payAndBook} (₹{totalAmount})</span>
                ) : (
                  <span>{t.payAtCounter} (₹{totalAmount})</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PrasadQueueModal;
