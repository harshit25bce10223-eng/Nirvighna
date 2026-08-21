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
  const { currentUser, isLoggedIn, login, sendOtp, verifyOtp } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [authMode, setAuthMode] = useState('otp'); // 'otp' or 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Countdown timer for resend OTP
  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

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
    setInfoMsg('');

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

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError(t.emailRequired);
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const res = await sendOtp(cleanEmail);
      if (res?.success) {
        setOtpSent(true);
        setCountdown(60);
        setInfoMsg(
          currentLanguage === 'gu'
            ? '૬-અંકનો OTP તમારા ઈમેલ પર મોકલ્યો છે!'
            : currentLanguage === 'hi'
            ? '6-अंकों का OTP आपके ईमेल पर भेज दिया गया है!'
            : '6-digit OTP code sent to your email inbox!'
        );
      } else {
        setError(res?.error || 'Failed to send OTP. Please check your email.');
      }
    } catch (err) {
      setError(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanEmail = email.trim();
    const cleanToken = otpCode.trim();

    if (!cleanToken || cleanToken.length < 6) {
      setError(
        currentLanguage === 'gu'
          ? 'કૃપા કરીને ૬-અંકનો સાચો OTP દાખલ કરો.'
          : currentLanguage === 'hi'
          ? 'कृपया 6-अंकों का सही OTP कोड दर्ज करें।'
          : 'Please enter valid 6-digit OTP code.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtp(cleanEmail, cleanToken);
      if (res?.success) {
        navigate('/home');
      } else {
        setError(res?.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed');
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

            {/* Flipkart-Style Tab Switcher: Email OTP vs Password */}
            <div className="mt-3 grid grid-cols-2 bg-black/25 p-1 rounded-xl border border-gold/20 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMode('otp'); setError(''); setInfoMsg(''); }}
                className={`py-1.5 rounded-lg transition-all ${
                  authMode === 'otp'
                    ? 'bg-gold text-maroon shadow-xs font-black'
                    : 'text-amber-100/80 hover:text-white'
                }`}
              >
                ⚡ {currentLanguage === 'gu' ? 'ઈમેલ OTP' : currentLanguage === 'hi' ? 'ईमेल OTP' : 'Email OTP'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('password'); setError(''); setInfoMsg(''); }}
                className={`py-1.5 rounded-lg transition-all ${
                  authMode === 'password'
                    ? 'bg-gold text-maroon shadow-xs font-black'
                    : 'text-amber-100/80 hover:text-white'
                }`}
              >
                🔑 {currentLanguage === 'gu' ? 'પાસવર્ડ' : currentLanguage === 'hi' ? 'पासवर्ड' : 'Password'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold flex items-center gap-2">
                <span className="text-base">📩</span>
                <span>{infoMsg}</span>
              </div>
            )}

            {/* MODE 1: EMAIL OTP AUTH */}
            {authMode === 'otp' ? (
              <div className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">{t.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      disabled={otpSent && countdown > 0}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      placeholder="devotee@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all disabled:opacity-70 focus:border-maroon focus:bg-white"
                    />
                  </div>
                </div>

                {/* OTP Code Box (if sent) */}
                {otpSent && (
                  <div className="space-y-1 animate-page-in">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-gray-600">
                        {currentLanguage === 'gu' ? '૬-અંકનો OTP કોડ' : currentLanguage === 'hi' ? '6-अंकों का OTP कोड' : '6-Digit OTP Code'}
                      </label>
                      <button
                        type="button"
                        disabled={countdown > 0 || loading}
                        onClick={handleSendOtp}
                        className="text-[11px] font-bold text-maroon hover:text-gold disabled:text-gray-400 cursor-pointer"
                      >
                        {countdown > 0
                          ? `Resend in ${countdown}s`
                          : (currentLanguage === 'gu' ? 'ફરી મોકલો' : currentLanguage === 'hi' ? 'पुनः भेजें' : 'Resend OTP')}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={8}
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gold/60 focus:border-maroon rounded-xl text-center text-lg font-black tracking-widest text-maroon transition-all shadow-inner"
                      />
                    </div>
                  </div>
                )}

                {/* Primary Button */}
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || !email.trim()}
                    className="btn-warm-primary w-full disabled:opacity-60 disabled:cursor-not-allowed font-heading uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    {loading
                      ? (currentLanguage === 'gu' ? 'મોકલી રહ્યું છે...' : currentLanguage === 'hi' ? 'भेज रहे हैं...' : 'Sending OTP...')
                      : (currentLanguage === 'gu' ? 'OTP મોકલો →' : currentLanguage === 'hi' ? 'OTP प्राप्त करें →' : 'Send OTP Code →')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length < 6}
                    className="btn-warm-primary w-full disabled:opacity-60 disabled:cursor-not-allowed font-heading uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    {loading
                      ? (currentLanguage === 'gu' ? 'તપાસી રહ્યું છે...' : currentLanguage === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying...')
                      : (currentLanguage === 'gu' ? 'સત્યાપન કરો અને લૉગિન કરો' : currentLanguage === 'hi' ? 'सत्यापित करें और लॉगिन करें' : 'Verify & Login')}
                  </button>
                )}
              </div>
            ) : (
              /* MODE 2: PASSWORD AUTH */
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
                  className="btn-warm-primary mt-1 disabled:opacity-60 disabled:cursor-not-allowed font-heading uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {loading ? t.loggingIn : t.login}
                </button>
              </form>
            )}

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
