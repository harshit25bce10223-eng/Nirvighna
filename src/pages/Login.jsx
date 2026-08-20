import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

const translations = {
  en: {
    title: 'Welcome Back',
    subtitle: 'Nirvighna — Yatra bina vighna ke',
    email: 'Email Address',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging In...',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    loginError: 'Login failed. Please verify your credentials.',
    noAccount: "Don't have an account?",
    signup: 'Sign Up'
  },
  hi: {
    title: 'वापसी पर स्वागत है',
    subtitle: 'निर्विघ्न — यात्रा बिना विघ्न के',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    login: 'लॉगिन',
    loggingIn: 'लॉगिन हो रहा है...',
    emailRequired: 'ईमेल आवश्यक है',
    passwordRequired: 'पासवर्ड आवश्यक है',
    loginError: 'लॉगिन विफल। कृपया अपने क्रेडेंशियल्स की जांच करें।',
    noAccount: 'खाता नहीं है?',
    signup: 'साइन अप करें'
  },
  gu: {
    title: 'પાછા આવવાનું સ્વાગત છે',
    subtitle: 'નિર્વિઘ્ન — યાત્રા વિના વિઘ્ન કે',
    email: 'ઈમેલ સરનામું',
    password: 'પાસવર્ડ',
    login: 'લૉગિન',
    loggingIn: 'લૉગિન થઈ રહ્યું છે...',
    emailRequired: 'ઈમેલ જરૂરી છે',
    passwordRequired: 'પાસવર્ડ જરૂરી છે',
    loginError: 'લૉગિન નિષ્ફળ. કૃપા કરીને તમારી ક્રેડેન્શિયલ્સ તપાસો.',
    noAccount: 'ખાતું નથી?',
    signup: 'સાઇન અપ કરો'
  }
};

export const Login = () => {
  const navigate = useNavigate();
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

  const handleLogin = async (e) => {
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
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] py-8 px-4 flex flex-col justify-center select-none font-body animate-page-in">
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
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="apex.coder@nirvighna.org"
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
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
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                  />
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="btn-warm-primary mt-1 disabled:opacity-60 disabled:cursor-not-allowed font-heading uppercase tracking-wider"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {loading ? t.loggingIn : t.login}
              </button>
            </form>

            {/* Footer */}
            <div className="pt-3 text-center text-xs text-gray-500 font-semibold border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <span>
                {t.noAccount}{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-maroon hover:text-gold underline font-extrabold font-heading cursor-pointer"
                >
                  {t.signup}
                </button>
              </span>
              <button
                onClick={() => navigate('/home')}
                className="text-amber-700 hover:text-maroon font-bold hover:underline cursor-pointer"
              >
                {currentLanguage === 'gu' ? 'ગેસ્ટ મોડ →' : currentLanguage === 'hi' ? 'गेस्ट मोड →' : 'Guest Mode →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
