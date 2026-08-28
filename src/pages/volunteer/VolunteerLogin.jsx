import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { isDemoMode } from '../../lib/runtimeMode';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

const translations = {
  en: {
    hubTitle: 'Volunteer Field Operations Hub',
    shiftSignIn: 'VOLUNTEER SHIFT SIGN-IN',
    loginTitle: 'Volunteer Hub Login',
    loginSubtitle: 'Choose your shift post: Gate Security or Inner Temple Services',
    emailLabel: 'Volunteer Email Address',
    emailPlaceholder: 'vikram.vol@nirvighna.org',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    stationLabel: '1. Select Assigned Temple Station',
    dutyLabel: '2. Select Shift Duty Post',
    openBadge: 'OPEN',
    lockedBadge: 'LOCKED',
    unlockedBadge: 'CERTIFIED',
    startShift: 'Start My Shift →',
    signingIn: 'Signing In...',
    returnHome: '← Return to Pilgrim Portal',
    temples: [
      { id: 'tmp_somnath', name: 'Somnath Temple' },
      { id: 'tmp_dwarka', name: 'Dwarkadhish Temple' },
      { id: 'tmp_ambaji', name: 'Ambaji Temple' },
      { id: 'tmp_pavagadh', name: 'Kalika Mata (Pavagadh)' }
    ],
    gateDuties: [
      { key: 'gate_scanner', icon: '📷', title: 'Main Gate', sub: 'Temple Entry & Security Scanner' }
    ],
    stationServices: {
      tmp_pavagadh: [
        { key: 'ropeway_counter', icon: '🚡', title: 'Ropeway Gate', sub: 'Cable Car Pass Scanner' }
      ],
      tmp_dwarka: [
        { key: 'boat_counter', icon: '🛥️', title: 'Boat Ferry Gate', sub: 'Bet Dwarka Tide Crossing' }
      ]
    },
    innerDuties: [
      { key: 'inner_gate_scanner', icon: '⛩️', title: 'Inner Gate', sub: 'Garbhagriha & Darshan Queue' },
      { key: 'prasad_counter', icon: '🍲', title: 'Prasad Counter', sub: 'Prasad Line & Distribution' },
      { key: 'footwear_counter', icon: '👟', title: 'Footwear Stand', sub: 'Shoe Deposit & Return' },
      { key: 'medical_responder', icon: '🚑', title: 'Medical SOS', sub: 'Emergency First Aid' }
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
    dutyLabel: '2. ड्यूटी पोस्ट / सेवा का चयन करें',
    openBadge: 'खुला है',
    lockedBadge: 'लॉक्ड',
    unlockedBadge: 'प्रमाणित',
    startShift: 'मेरी शिफ्ट शुरू करें →',
    signingIn: 'साइन इन हो रहा है...',
    returnHome: '← श्रद्धालु पोर्टल पर लौटें',
    temples: [
      { id: 'tmp_somnath', name: 'श्री सोमनाथ मंदिर' },
      { id: 'tmp_dwarka', name: 'द्वारकाधीश मंदिर' },
      { id: 'tmp_ambaji', name: 'अंबाजी मंदिर' },
      { id: 'tmp_pavagadh', name: 'कालिका माता (पावागढ़)' }
    ],
    gateDuties: [
      { key: 'gate_scanner', icon: '📷', title: 'मुख्य द्वार', sub: 'मंदिर प्रवेश व सुरक्षा स्कैनर' }
    ],
    stationServices: {
      tmp_pavagadh: [
        { key: 'ropeway_counter', icon: '🚡', title: 'रोपवे गेट', sub: 'उड़न खटोला पास स्कैनर' }
      ],
      tmp_dwarka: [
        { key: 'boat_counter', icon: '🛥️', title: 'बोट फेरी गेट', sub: 'बेट द्वारका नाव पास स्कैनर' }
      ]
    },
    innerDuties: [
      { key: 'inner_gate_scanner', icon: '⛩️', title: 'भीतरी द्वार स्वयंसेवक', sub: 'गर्भगृह व दर्शन कतार' },
      { key: 'prasad_counter', icon: '🍲', title: 'प्रसाद काउंटर', sub: 'प्रसाद वितरण व कतार' },
      { key: 'footwear_counter', icon: '👟', title: 'जूता स्टैंड', sub: 'जूता जमा व वापसी' },
      { key: 'medical_responder', icon: '🚑', title: 'मेडिकल एसओएस', sub: 'इमरजेंसी प्राथमिक उपचार' }
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
    dutyLabel: '2. શિફ્ટ ડ્યુટી પોસ્ટ પસંદ કરો',
    openBadge: 'ખુલ્લું છે',
    lockedBadge: 'લૉક્ડ',
    unlockedBadge: 'પ્રમાણિત',
    startShift: 'મારી શિફ્ટ શરૂ કરો →',
    signingIn: 'સાઇન ઇન થઈ રહ્યું છે...',
    returnHome: '← યાત્રાળુ પોર્ટલ પર પાછા જાઓ',
    temples: [
      { id: 'tmp_somnath', name: 'શ્રી સોમનાથ મંદિર' },
      { id: 'tmp_dwarka', name: 'દ્વારકાધીશ મંદિર' },
      { id: 'tmp_ambaji', name: 'અંબાજી મંદિર' },
      { id: 'tmp_pavagadh', name: 'કાલિકા માતા (પાવાગઢ)' }
    ],
    gateDuties: [
      { key: 'gate_scanner', icon: '📷', title: 'મુખ્ય દ્વાર', sub: 'મંદિર પ્રવેશ અને સુરક્ષા સ્કેનર' }
    ],
    stationServices: {
      tmp_pavagadh: [
        { key: 'ropeway_counter', icon: '🚡', title: 'રોપવે ગેટ', sub: 'ઉડન ખટોલા પાસ સ્કેનર' }
      ],
      tmp_dwarka: [
        { key: 'boat_counter', icon: '🛥️', title: 'બોટ ફેરી ગેટ', sub: 'બેટ દ્વારકા હોડી પાસ સ્કેનર' }
      ]
    },
    innerDuties: [
      { key: 'inner_gate_scanner', icon: '⛩️', title: 'આંતરિક દ્વાર સ્વયંસેવક', sub: 'ગર્ભગૃહ અને દર્શન લાઇન' },
      { key: 'prasad_counter', icon: '🍲', title: 'પ્રસાદ કાઉન્ટર', sub: 'પ્રસાદ વિતરણ અને કતાર' },
      { key: 'footwear_counter', icon: '👟', title: 'પગરખાં સ્ટેન્ડ', sub: 'પગરખાં જમા અને પરત' },
      { key: 'medical_responder', icon: '🚑', title: 'મેડિકલ એસઓએસ', sub: 'ઇમરજન્સી પ્રાથમિક સારવાર' }
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

  const cleanEmail = email.toLowerCase().trim();
  const isMedicalAuthorized = cleanEmail === 'savitri.vol@nirvighna.org' ||
                              cleanEmail.includes('medical') ||
                              cleanEmail.includes('doctor') ||
                              cleanEmail.includes('paramedic') ||
                              cleanEmail.includes('nurse');

  // Auto switch duty if station changes and current duty is station specific
  React.useEffect(() => {
    if (selectedTempleId !== 'tmp_pavagadh' && selectedDuty === 'ropeway_counter') {
      setSelectedDuty('gate_scanner');
    }
    if (selectedTempleId !== 'tmp_dwarka' && selectedDuty === 'boat_counter') {
      setSelectedDuty('gate_scanner');
    }
  }, [selectedTempleId, selectedDuty]);

  React.useEffect(() => {
    if (cleanEmail) {
      const savedDuty = localStorage.getItem(`nirvighna_vol_duty_email_${cleanEmail}`) ||
                        (cleanEmail.includes('vikram') ? 'gate_scanner' : null) ||
                        (cleanEmail.includes('anand') || cleanEmail.includes('inner') ? 'inner_gate_scanner' : null) ||
                        (cleanEmail.includes('savitri') ? 'medical_responder' : null) ||
                        (cleanEmail.includes('rajesh') ? 'prasad_counter' : null) ||
                        (cleanEmail.includes('pooja') ? 'footwear_counter' : null) ||
                        (cleanEmail.includes('karan') || cleanEmail.includes('lost') ? 'lost_found' : null);
      if (savedDuty) {
        setSelectedDuty(savedDuty);
      }
    }
  }, [cleanEmail]);

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const finalEmail = email.trim() || (isDemoMode ? (selectedDuty === 'medical_responder' ? 'savitri.vol@nirvighna.org' : 'vikram.vol@nirvighna.org') : '');
    const cleanPassword = password.trim() || (isDemoMode ? 'volunteer123' : '');

    if (!finalEmail || !cleanPassword) {
      setError('Enter your volunteer email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('nirvighna_volunteer_temple_id', selectedTempleId);
      setAssignedDuty(selectedDuty);
      const result = await login(finalEmail, cleanPassword);
      if (!result?.success) {
        setError(result?.error || 'Sign-in failed. Check your credentials and try again.');
        return;
      }
      navigate(getDutyRoute(selectedDuty));
    } catch (err) {
      setError(err?.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Combine universal inner services with station-specific services (Pavagadh ropeway, Dwarka boat)
  const stationSpecificServices = t.stationServices?.[selectedTempleId] || [];
  const activeInnerDuties = [...t.innerDuties, ...stationSpecificServices];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 py-8 px-4 flex flex-col justify-center select-none font-body">
      <div className="max-w-lg w-full mx-auto space-y-6">
        
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
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 overflow-hidden flex items-center justify-center bg-white mx-auto border-2 border-amber-600/80 shadow-md">
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
        <div className="bg-white rounded-3xl shadow-warm border border-gold/30 p-5 sm:p-6 space-y-5">
          <div className="border-b border-gray-100 pb-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-gold/30 inline-block mb-1 font-heading">
              {t.shiftSignIn}
            </span>
            <h2 className="text-base font-bold text-indigo-dark font-heading">
              {t.loginTitle}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium leading-snug">
              {t.loginSubtitle}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-alertRed mt-0.5" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">{t.emailLabel}</label>
                {isMedicalAuthorized && (
                  <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-heading">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Medical Clearance Active
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold font-bold text-indigo-dark"
                />
              </div>
            </div>

            {/* 1. Select Temple Station */}
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
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center min-h-[46px] ${
                      selectedTempleId === temple.id
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-md ring-2 ring-amber-400/50'
                        : 'bg-ivory text-gray-700 border-gray-200 hover:border-gold hover:bg-amber-50/50'
                    }`}
                  >
                    <p className="font-extrabold text-[12px] sm:text-xs leading-tight break-words">{temple.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Select Shift Duty Post */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.dutyLabel}</label>
              
              {/* 🚪 2 Universal Gate Verifiers (Main Gate & Inner Gate) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold font-heading">
                {t.gateDuties.map(d => {
                  const isSelected = selectedDuty === d.key;

                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedDuty(d.key)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all relative cursor-pointer min-h-[76px] ${
                        isSelected
                          ? 'bg-gold text-indigo-dark border-gold shadow-md ring-2 ring-gold/50'
                          : 'bg-ivory text-gray-700 border-gray-200 hover:border-gold hover:bg-amber-50/50'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{d.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 flex-wrap">
                          <p className="font-extrabold text-xs leading-tight text-indigo-dark">{d.title}</p>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wide shrink-0 ${
                            isSelected ? 'bg-indigo-dark text-gold' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {t.openBadge}
                          </span>
                        </div>
                        <p className="text-[10.5px] opacity-90 font-medium leading-snug mt-1 break-words">{d.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 🛕 Inner & Station Services Grid (Prasad, Footwear, Medical SOS [RED BORDER ON SELECT], Lost&Found, + Ropeway/Boat) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold font-heading">
                {activeInnerDuties.map(d => {
                  const isSelected = selectedDuty === d.key;
                  const isMedical = d.key === 'medical_responder';

                  let cardClasses = '';
                  if (isMedical) {
                    if (isSelected) {
                      cardClasses = 'bg-red-600 text-white border-2 border-red-700 shadow-lg ring-2 ring-red-400';
                    } else {
                      cardClasses = isMedicalAuthorized
                        ? 'bg-rose-50 text-red-900 border-2 border-red-300 hover:border-red-500 hover:bg-rose-100/60'
                        : 'bg-red-50/60 text-gray-700 border-2 border-red-200 hover:border-red-400 hover:bg-red-50';
                    }
                  } else {
                    if (isSelected) {
                      cardClasses = 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-md ring-2 ring-emerald-400';
                    } else {
                      cardClasses = 'bg-ivory text-gray-700 border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30';
                    }
                  }

                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        setSelectedDuty(d.key);
                        if (error) setError('');
                      }}
                      className={`p-3 rounded-2xl text-left flex items-start gap-2.5 transition-all relative cursor-pointer min-h-[76px] ${cardClasses}`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <span className="text-lg">{d.icon}</span>
                        {isMedical && !isMedicalAuthorized && !isSelected && (
                          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5 text-[8px] shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 flex-wrap">
                          <p className="font-extrabold text-[11.5px] leading-tight break-words">{d.title}</p>
                          <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                            isSelected
                              ? 'bg-white ' + (isMedical ? 'text-red-800' : 'text-emerald-800')
                              : isMedical
                                ? isMedicalAuthorized
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-100 text-red-800 border border-red-300 flex items-center gap-0.5'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isMedical
                              ? isSelected
                                ? 'ACTIVE'
                                : isMedicalAuthorized
                                  ? '🔓 ' + t.unlockedBadge
                                  : <><Lock className="w-2 h-2" />{t.lockedBadge}</>
                              : t.openBadge}
                          </span>
                        </div>
                        <p className={`text-[9.5px] font-medium leading-snug mt-1 break-words ${
                          isSelected
                            ? 'text-white/90'
                            : isMedical
                              ? 'text-red-700/80'
                              : 'text-gray-600'
                        }`}>
                          {d.sub}
                        </p>
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
              className="w-full py-3.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-xl shadow-goldGlow uppercase transition-all flex items-center justify-center gap-2 font-heading cursor-pointer mt-2"
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
