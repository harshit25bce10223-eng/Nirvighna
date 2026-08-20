import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';

const translations = {
  en: {
    hubTitle: 'Volunteer Field Operations Hub',
    shiftSignIn: 'VOLUNTEER SHIFT SIGN-IN',
    loginTitle: 'Volunteer Hub Login',
    loginSubtitle: 'Choose your shift post: Gate Security or Inner Shrine Services',
    emailLabel: 'Volunteer Email Address',
    emailPlaceholder: 'vikram.vol@nirvighna.org',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    stationLabel: '1. Select Assigned Temple Station',
    gateCategoryLabel: '🚪 GATE ENTRY & VERIFICATION (Gate Scanner)',
    gateCategoryDesc: 'Scan entry passes, approve & reject pilgrim gate entries',
    innerCategoryLabel: '🛕 INNER SHRINE SERVICES (After Gate Pass)',
    innerCategoryDesc: 'Prasad counters, footwear rack tokens, medical SOS, lost & found',
    allPostsOpen: 'ALL DUTY POSTS OPEN',
    openBadge: 'OPEN',
    startShift: 'Start My Shift →',
    signingIn: 'Signing In...',
    returnHome: '← Return to Pilgrim Portal',
    demoLabel: 'Demo: ',
    temples: [
      { id: 'tmp_somnath', name: 'Somnath Temple', tag: 'Mahapravesh Dwar' },
      { id: 'tmp_dwarka', name: 'Dwarkadhish', tag: 'Swarga / Moksha Dwar' },
      { id: 'tmp_ambaji', name: 'Ambaji Shrine', tag: 'Shakti Dwar Gate 7' },
      { id: 'tmp_pavagadh', name: 'Kalika Mata', tag: 'Machi Ropeway / Steps' }
    ],
    gateDuties: [
      { key: 'gate_scanner', icon: '📷', title: 'QR Gate Scanner', sub: 'Approve & Reject Gate Passes' }
    ],
    innerDuties: [
      { key: 'prasad_counter', icon: '🍲', title: 'Prasad Counter', sub: 'Queue & Distribution Desk' },
      { key: 'footwear_counter', icon: '👟', title: 'Footwear Stand', sub: 'Rack Tokens & Retrieval' },
      { key: 'medical_responder', icon: '🚑', title: 'Medical SOS', sub: 'First Aid Emergency Unit' },
      { key: 'lost_found', icon: '🔍', title: 'Lost & Found', sub: 'Pilgrim Belongings Desk' }
    ]
  },
  hi: {
    hubTitle: 'स्वयंसेवक फील्ड संचालन केंद्र',
    shiftSignIn: 'स्वयंसेवक शिफ्ट साइन-इन',
    loginTitle: 'स्वयंसेवक हब लॉगिन',
    loginSubtitle: 'अपनी शिफ्ट चुनें: प्रवेश द्वार सुरक्षा अथवा आंतरिक मंदिर सेवाएँ',
    emailLabel: 'स्वयंसेवक ईमेल पता',
    emailPlaceholder: 'vikram.vol@nirvighna.org',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    stationLabel: '1. निर्धारित मंदिर स्टेशन चुनें',
    gateCategoryLabel: '🚪 मुख्य द्वार प्रवेश सत्यापन (गेट स्कैनर)',
    gateCategoryDesc: 'पास स्कैन करें, प्रवेश स्वीकृत (Approve) अथवा अस्वीकृत (Reject) करें',
    innerCategoryLabel: '🛕 आंतरिक मंदिर सेवाएँ (प्रवेश उपरांत सेवा दल)',
    innerCategoryDesc: 'प्रसाद वितरण, जूता स्टैंड टोकन, मेडिकल एसओएस, खोया-पाया',
    allPostsOpen: 'सभी पोस्ट खुली हैं',
    openBadge: 'खुला है',
    startShift: 'मेरी शिफ्ट शुरू करें →',
    signingIn: 'साइन इन हो रहा है...',
    returnHome: '← श्रद्धालु पोर्टल पर लौटें',
    demoLabel: 'डेमो: ',
    temples: [
      { id: 'tmp_somnath', name: 'श्री सोमनाथ मंदिर', tag: 'महाप्रवेश द्वार' },
      { id: 'tmp_dwarka', name: 'द्वारकाधीश मंदिर', tag: 'स्वर्ग / मोक्ष द्वार' },
      { id: 'tmp_ambaji', name: 'अंबाजी शक्तिपीठ', tag: 'शक्ति द्वार गेट 7' },
      { id: 'tmp_pavagadh', name: 'कालिका माता मंदिर', tag: 'माची रोपवे / सीढ़ियां' }
    ],
    gateDuties: [
      { key: 'gate_scanner', icon: '📷', title: 'क्यूआर गेट स्कैनर', sub: 'प्रवेश स्वीकृत / अस्वीकृत करें' }
    ],
    innerDuties: [
      { key: 'prasad_counter', icon: '🍲', title: 'प्रसाद वितरण केंद्र', sub: 'कतार एवं वितरण नियंत्रक' },
      { key: 'footwear_counter', icon: '👟', title: 'जूता स्टैंड काउंटर', sub: 'रैक टोकन प्रबंधन' },
      { key: 'medical_responder', icon: '🚑', title: 'मेडिकल एसओएस', sub: 'प्राथमिक चिकित्सा यूनिट' },
      { key: 'lost_found', icon: '🔍', title: 'खोया-पाया सहायता', sub: 'श्रद्धालु सहायता केंद्र' }
    ]
  },
  gu: {
    hubTitle: 'સ્વયંસેવક ફિલ્ડ ઓપરેશન્સ હબ',
    shiftSignIn: 'સ્વયંસેવક શિફ્ટ સાઇન-ઇન',
    loginTitle: 'સ્વયંસેવક હબ લૉગિન',
    loginSubtitle: 'તમારી શિફ્ટ પસંદ કરો: પ્રવેશ દ્વાર સુરક્ષા અથવા આંતરિક મંદિર સેવાઓ',
    emailLabel: 'સ્વયંસેવક ઈમેલ સરનામું',
    emailPlaceholder: 'vikram.vol@nirvighna.org',
    passwordLabel: 'પાસવર્ડ',
    passwordPlaceholder: '••••••••',
    stationLabel: '1. નિયુક્ત મંદિર સ્ટેશન પસંદ કરો',
    gateCategoryLabel: '🚪 મુખ્ય દ્વાર પ્રવેશ ચકાસણી (ગેટ સ્કેનર)',
    gateCategoryDesc: 'પાસ સ્કેન કરો, પ્રવેશ સ્વીકારો (Approve) અથવા અસ્વીકાર (Reject) કરો',
    innerCategoryLabel: '🛕 આંતરિક મંદિર સેવાઓ (પ્રવેશ પછીની સેવાઓ)',
    innerCategoryDesc: 'પ્રસાદ વિતરણ, પગરખાં સ્ટેન્ડ, મેડિકલ એસઓએસ, ખોવાયેલ સામાન',
    allPostsOpen: 'બધી પોસ્ટ ખુલ્લી છે',
    openBadge: 'ખુલ્લું છે',
    startShift: 'મારી શિફ્ટ શરૂ કરો →',
    signingIn: 'સાઇન ઇન થઈ રહ્યું છે...',
    returnHome: '← યાત્રાળુ પોર્ટલ પર પાછા જાઓ',
    demoLabel: 'ડેમો: ',
    temples: [
      { id: 'tmp_somnath', name: 'શ્રી સોમનાથ મંદિર', tag: 'મહાપ્રવેશ દ્વાર' },
      { id: 'tmp_dwarka', name: 'દ્વારકાધીશ મંદિર', tag: 'સ્વર્ગ / મોક્ષ દ્વાર' },
      { id: 'tmp_ambaji', name: 'અંબાજી શક્તિપીઠ', tag: 'શક્તિ દ્વાર ગેટ 7' },
      { id: 'tmp_pavagadh', name: 'કાલિકા માતા મંદિર', tag: 'માચી રોપવે / પગથિયાં' }
    ],
    gateDuties: [
      { key: 'gate_scanner', icon: '📷', title: 'ક્યુઆર ગેટ સ્કેનર', sub: 'પ્રવેશ મંજૂર / અસ્વીકાર કરો' }
    ],
    innerDuties: [
      { key: 'prasad_counter', icon: '🍲', title: 'પ્રસાદ વિતરણ કેન્દ્ર', sub: 'કતાર અને વિતરણ કાઉન્ટર' },
      { key: 'footwear_counter', icon: '👟', title: 'પગરખાં સ્ટેન્ડ કાઉન્ટર', sub: 'રેક ટોકન વ્યવસ્થા' },
      { key: 'medical_responder', icon: '🚑', title: 'મેડિકલ એસઓએસ', sub: 'પ્રાથમિક સારવાર યુનિટ' },
      { key: 'lost_found', icon: '🔍', title: 'ખોવાયેલ સામાન સહાય', sub: 'યાત્રાળુ સહાયતા ડેસ્ક' }
    ]
  }
};

export const VolunteerLogin = () => {
  const navigate = useNavigate();
  const { login, setAssignedDuty, getDutyRoute, assignedDuty } = useVolunteerAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDuty, setSelectedDuty] = useState(assignedDuty || 'gate_scanner');
  const [selectedTempleId, setSelectedTempleId] = useState(localStorage.getItem('nirvighna_volunteer_temple_id') || 'tmp_somnath');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail) {
      const savedDuty = localStorage.getItem(`nirvighna_vol_duty_email_${cleanEmail}`) ||
                        (cleanEmail.includes('vikram') ? localStorage.getItem('nirvighna_vol_duty_vol_8841') : null) ||
                        (cleanEmail.includes('savitri') ? localStorage.getItem('nirvighna_vol_duty_vol_8842') : null) ||
                        (cleanEmail.includes('rajesh') ? localStorage.getItem('nirvighna_vol_duty_vol_8843') : null) ||
                        (cleanEmail.includes('pooja') ? localStorage.getItem('nirvighna_vol_duty_vol_8844') : null);
      if (savedDuty) {
        setSelectedDuty(savedDuty);
      }
    }
  }, [email]);

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanEmail = email.trim() || 'vikram.vol@nirvighna.org';
    const cleanPassword = password.trim() || 'volunteer123';

    setLoading(true);
    setError('');

    try {
      setAssignedDuty(selectedDuty);
      await login(cleanEmail, cleanPassword);
      
      // If gate scanner, navigate directly to scanner terminal
      if (selectedDuty === 'gate_scanner') {
        navigate('/v/scan');
      } else {
        navigate(getDutyRoute(selectedDuty));
      }
    } catch (err) {
      if (selectedDuty === 'gate_scanner') {
        navigate('/v/scan');
      } else {
        navigate(getDutyRoute(selectedDuty));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 py-8 px-4 flex flex-col justify-center select-none font-body">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Tri-Lingual Language Switcher Toggle */}
        <div className="flex justify-end">
          <div className="flex bg-white rounded-2xl p-1 border border-gold/30 shadow-xs gap-0.5">
            {[
              { id: 'hi', label: '🇮🇳 हिन्दी' },
              { id: 'gu', label: '🔱 ગુજરાતી' },
              { id: 'en', label: '🌍 EN' }
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentLanguage === lang.id
                    ? 'bg-gold text-indigo-dark shadow-sm'
                    : 'text-gray-600 hover:text-maroon'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-gold via-amber-300 to-amber-600 overflow-hidden flex items-center justify-center bg-white mx-auto border-2 border-gold/50 shadow-md">
            <img 
              src="/official_logo.png" 
              alt="Nirvighna Emblem" 
              className="w-full h-full object-contain p-0.5" 
            />
          </div>
          <h1 className="text-2xl font-black font-heading tracking-wide text-indigo-dark mt-3">
            NIRVIGHNA
          </h1>
          <p className="text-xs text-gray-500 font-semibold tracking-wider">
            {t.hubTitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-warm border border-gold/30 p-6 space-y-5">
          <div className="border-b border-gray-100 pb-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-gold/30 inline-block mb-1 font-heading">
              {t.shiftSignIn}
            </span>
            <h2 className="text-base font-bold text-indigo-dark font-heading">
              {t.loginTitle}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              {t.loginSubtitle}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-alertRed" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold font-bold text-indigo-dark"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.passwordLabel}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold font-bold text-indigo-dark"
                />
              </div>
            </div>

            {/* Select Temple Station */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.stationLabel}</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold font-heading">
                {t.temples.map(temple => (
                  <button
                    key={temple.id}
                    type="button"
                    onClick={() => {
                      setSelectedTempleId(temple.id);
                      localStorage.setItem('nirvighna_volunteer_temple_id', temple.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTempleId === temple.id
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-md'
                        : 'bg-ivory text-gray-700 border-gray-200 hover:border-gold'
                    }`}
                  >
                    <p className="font-extrabold text-[11px] truncate">{temple.name}</p>
                    <p className="text-[9px] opacity-80 mt-0.5">{temple.tag}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 🚪 ROLE 1: GATE ENTRY & VERIFICATION CONTROLLER */}
            <div className="space-y-1.5 pt-1">
              <div className="bg-amber-50/80 p-2 rounded-xl border border-gold/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-amber-950 font-heading">
                    {t.gateCategoryLabel}
                  </h3>
                  <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    GATE POST
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 mt-0.5 font-medium">
                  {t.gateCategoryDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs font-bold font-heading">
                {t.gateDuties.map(d => {
                  const isSelected = selectedDuty === d.key;

                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedDuty(d.key)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-gold text-indigo-dark border-gold shadow-md ring-2 ring-gold/50'
                          : 'bg-ivory text-gray-700 border-gray-200 hover:border-gold hover:bg-amber-50/50'
                      }`}
                    >
                      <span className="text-2xl">{d.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-extrabold text-xs truncate">{d.title}</p>
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-emerald-100 text-emerald-800">
                            {t.openBadge}
                          </span>
                        </div>
                        <p className="text-[10px] opacity-80 font-normal truncate">{d.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🛕 ROLE 2: INNER SHRINE & POST-GATE SERVICES */}
            <div className="space-y-1.5 pt-2">
              <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-emerald-950 font-heading">
                    {t.innerCategoryLabel}
                  </h3>
                  <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    POST-GATE
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800 mt-0.5 font-medium">
                  {t.innerCategoryDesc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold font-heading">
                {t.innerDuties.map(d => {
                  const isSelected = selectedDuty === d.key;

                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedDuty(d.key)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
                          : 'bg-ivory text-gray-700 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                      }`}
                    >
                      <span className="text-base">{d.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-extrabold text-[11px] truncate">{d.title}</p>
                          <span className={`text-[8px] px-1 rounded font-black ${
                            isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {t.openBadge}
                          </span>
                        </div>
                        <p className={`text-[9px] font-normal truncate ${isSelected ? 'text-white/80' : 'opacity-75'}`}>{d.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-xl shadow-goldGlow uppercase transition-all flex items-center justify-center gap-2 font-heading cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.signingIn}</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>{t.startShift}</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Footer */}
          <div className="pt-3 text-center text-xs text-gray-500 font-medium border-t border-gray-100">
            <span>{t.demoLabel}</span>
            <span className="text-maroon font-bold">vikram.vol@nirvighna.org</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="text-xs font-bold text-gray-600 hover:text-maroon transition-colors underline cursor-pointer"
          >
            {t.returnHome}
          </button>
        </div>
      </div>
    </div>
  );
};
