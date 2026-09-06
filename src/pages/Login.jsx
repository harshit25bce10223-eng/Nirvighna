import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { DEMO_CREDENTIALS } from '../lib/demoSeedEngine';

const translations = {
  en: {
    title: 'Welcome Back',
    subtitle: 'Nirvighna — Yatra bina vighna ke',
    email: 'Email Address',
    password: 'Password',
    login: 'Login to Darshan Portal',
    loggingIn: 'Verifying & Logging In...',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    loginError: 'Login failed. Please check your email and password, or verify your email link.',
    noAccount: "Don't have an account?",
    signup: 'Create Account'
  },
  hi: {
    title: 'वापसी पर स्वागत है',
    subtitle: 'निर्विघ्न — यात्रा बिना विघ्न के',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    login: 'दर्शन पोर्टल में लॉगिन करें',
    loggingIn: 'सत्यापित और लॉगिन हो रहा है...',
    emailRequired: 'ईमेल आवश्यक है',
    passwordRequired: 'पासवर्ड आवश्यक है',
    loginError: 'लॉगिन विफल। कृपया ईमेल और पासवर्ड जांचें, अथवा ईमेल वेरिफिकेशन लिंक चेक करें।',
    noAccount: 'खाता नहीं है?',
    signup: 'खाता बनाएं'
  },
  gu: {
    title: 'પાછા આવવાનું સ્વાગત છે',
    subtitle: 'નિર્વિઘ્ન — યાત્રા વિના વિઘ્ન કે',
    email: 'ઈમેલ સરનામું',
    password: 'પાસવર્ડ',
    login: 'દર્શન પોર્ટલમાં લૉગિન કરો',
    loggingIn: 'લૉગિન થઈ રહ્યું છે...',
    emailRequired: 'ઈમેલ જરૂરી છે',
    passwordRequired: 'પાસવર્ડ જરૂરી છે',
    loginError: 'લૉગિન નિષ્ફળ. કૃપા કરીને ઈમેલ અને પાસવર્ડ તપાસો અથવા ઈમેલ વેરિફિકેશન લિંક ચકાસો.',
    noAccount: 'ખાતું નથી?',
    signup: 'ખાતું બનાવો'
  }
};

export const Login = () => {
  const navigate = useNavigate();
  
  // Redirect to command centre login if pathname contains command-centre
  React.useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.includes('/command-centre')) {
      window.location.hash = '#/command-centre/login';
    }
  }, []);
  const { currentUser, isLoggedIn, login } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (isLoggedIn && currentUser) {
      navigate('/home');
    }
  }, [isLoggedIn, currentUser, navigate]);

  const handlePasswordLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError(t.emailRequired);
      return;
    }
    if (!cleanPassword) {
      setError(t.passwordRequired);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(cleanEmail, cleanPassword);
      if (res?.success) {
        navigate('/home');
      } else {
        setError(res?.error || t.loginError);
      }
    } catch (err) {
      setError(err.message || t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] pt-[max(env(safe-area-inset-top,0px),2.5rem)] pb-[max(env(safe-area-inset-bottom,0px),2.5rem)] px-4 flex flex-col justify-center select-none font-body animate-page-in">
      <div className="max-w-sm w-full mx-auto space-y-5">

        {/* Language Switcher — Top Right */}
        <div className="flex justify-end">
          <div className="flex bg-white rounded-2xl p-1 border border-gold/25 shadow-xs gap-0.5">
            {[
              { id: 'hi', label: '🇮🇳 हिन्दी' },
              { id: 'gu', label: '🔱 ગુજ' },
              { id: 'en', label: '🌍 EN' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                  currentLanguage === lang.id
                    ? 'bg-maroon text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo & Devotional Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold via-amber-300 to-amber-600 animate-logo-aura flex items-center justify-center overflow-hidden border-2 border-gold shadow-2xl p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src="/official_logo.png"
                  alt="Nirvighna Emblem"
                  className="w-full h-full object-contain crisp-img select-none drop-shadow-xs"
                />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading tracking-wide text-indigo-dark">
              {currentLanguage === 'gu' ? 'નિર્વિઘ્ન' : currentLanguage === 'hi' ? 'निर्विघ्न' : 'NIRVIGHNA'}
            </h1>
            <p className="text-[11px] text-gray-500 font-semibold tracking-wider mt-0.5">
              {currentLanguage === 'gu' ? 'યાત્રા વિના વિઘ્ને • સરળ દર્શન' : currentLanguage === 'hi' ? 'यात्रा बिना विघ्न के • आसान दर्शन' : 'Yatra without obstacles • Easy Darshan'}
            </p>
          </div>
          {/* Devotional Greeting */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
            <span className="animate-flicker">🪔</span>
            <span>{currentLanguage === 'gu' ? 'જય શ્રી કૃષ્ણ • જય માતાજી' : currentLanguage === 'hi' ? 'जय श्री कृष्ण • जय माता दी' : 'Jai Shri Krishna • Jai Mata Di'}</span>
            <span className="animate-flicker">🙏</span>
          </div>
        </div>

        {/* ── DEMO BANNER ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300/60 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">🎯 Try Demo — Dwarkadhish Temple, Dwarka</p>
              <p className="text-[10px] text-amber-700 mt-0.5 leading-tight">
                Family of 4 • ♿ Wheelchair • 🔊 Audio Nav • ⛵ Boat Crossing • Prasad • Footwear
              </p>
            </div>
          </div>

          <div className="bg-white/70 rounded-xl px-3 py-2 border border-amber-200/50 space-y-1">
            <div className="flex items-center gap-2 text-[11px]">
              <Mail className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="font-bold text-gray-700">Email:</span>
              <span className="font-mono text-amber-800 select-all">{DEMO_CREDENTIALS.pilgrim.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Lock className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="font-bold text-gray-700">Password:</span>
              <span className="font-mono text-amber-800 select-all">{DEMO_CREDENTIALS.pilgrim.password}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_CREDENTIALS.pilgrim.email);
              setPassword(DEMO_CREDENTIALS.pilgrim.password);
              setTimeout(() => handlePasswordLogin(), 80);
            }}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            One-Click Demo Login →
          </button>
        </div>
        {/* ──────────────────────────────────────────────────────────────── */}

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-warm border border-gold/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-maroon to-[#5F242C] px-6 py-4 text-center">
            <h2 className="text-base font-extrabold text-white font-heading">
              {t.title}
            </h2>
            <p className="text-[11px] text-amber-200/80 mt-0.5">{t.subtitle}</p>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">{t.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="devotee@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all focus:border-maroon focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">{t.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all focus:border-maroon focus:bg-white"
                  />
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="btn-warm-primary mt-2 disabled:opacity-60 disabled:cursor-not-allowed font-heading uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {loading ? t.loggingIn : t.login}
              </button>
            </form>

            {/* Footer */}
            <div className="pt-3 text-center text-xs text-gray-500 font-semibold border-t border-gray-100 flex items-center justify-center">
              <span>
                {t.noAccount}{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-maroon hover:text-gold underline font-extrabold font-heading cursor-pointer ml-1"
                >
                  {t.signup}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

