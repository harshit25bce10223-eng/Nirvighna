import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/runtimeMode';
import { User, Mail, Phone, Lock, Loader2, ArrowRight, AlertCircle, CheckCircle, MailOpen, RefreshCw } from 'lucide-react';

const translations = {
  en: {
    title: 'Create Your Pilgrim Account',
    subtitle: 'Nirvighna — Yatra bina vighna ke',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number (Optional)',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    createAccount: 'Create Account',
    creating: 'Creating Account...',
    fullNameRequired: 'Full name is required',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    passwordMismatch: 'Passwords do not match',
    signupError: 'Account creation failed. Please try again.',
    alreadyHaveAccount: 'Already have an account?',
    login: 'Login',
    verifyEmail: 'Verify Your Email',
    verifySubtitle: 'OTP code sent to your email'
  },
  hi: {
    title: 'अपना तीर्थयात्री खाता बनाएं',
    subtitle: 'निर्विघ्न — यात्रा बिना विघ्न के',
    fullName: 'पूरा नाम',
    email: 'ईमेल पता',
    phone: 'फ़ोन नंबर (वैकल्पिक)',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    createAccount: 'खाता बनाएं',
    creating: 'खाता बनाया जा रहा है...',
    fullNameRequired: 'पूरा नाम आवश्यक है',
    emailRequired: 'ईमेल आवश्यक है',
    passwordRequired: 'पासवर्ड आवश्यक है',
    passwordMismatch: 'पासवर्ड मेल नहीं खाते',
    signupError: 'खाता निर्माण विफल। कृपया पुनः प्रयास करें।',
    alreadyHaveAccount: 'पहले से खाता है?',
    login: 'लॉगिन',
    verifyEmail: 'अपना ईमेल सत्यापित करें',
    verifySubtitle: 'आपके ईमेल पर भेजा गया OTP'
  },
  gu: {
    title: 'તમારુ તીર્થયાત્રી ખાતું બનાવો',
    subtitle: 'નિર્વિઘ્ન — યાત્રા વિના વિઘ્ન કે',
    fullName: 'પૂરું નામ',
    email: 'ઈમેલ સરનામું',
    phone: 'ફોન નંબર (વૈકલ્પિક)',
    password: 'પાસવર્ડ',
    confirmPassword: 'પાસવર્ડ પુષ્ટિ કરો',
    createAccount: 'ખાતું બનાવો',
    creating: 'ખાતું બનાવી રહ્યું છે...',
    fullNameRequired: 'પૂરું નામ જરૂરી છે',
    emailRequired: 'ઈમેલ જરૂરી છે',
    passwordRequired: 'પાસવર્ડ જરૂરી છે',
    passwordMismatch: 'પાસવર્ડ બંધબેસતા નથી',
    signupError: 'ખાતું નિર્માણ નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.',
    alreadyHaveAccount: 'પહેલેથી જ ખાતું છે?',
    login: 'લૉગિન',
    verifyEmail: 'તમારું ઈમેલ સત્યાપિત કરો',
    verifySubtitle: 'તમારા ઈમેલ પર મોકલેલ OTP'
  }
};

export const Signup = () => {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isLoggedIn && currentUser) {
      navigate('/home');
    }
  }, [isLoggedIn, currentUser, navigate]);

  const [dpdpMedicalConsent, setDpdpMedicalConsent] = useState(false);
  const [dpdpContactConsent, setDpdpContactConsent] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    if (!dpdpMedicalConsent || !dpdpContactConsent) {
      setError('DPDP Act 2023 Consent required: Please accept both checkboxes.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();
      const cleanPhone = phone.trim();
      const cleanEmergencyName = emergencyName?.trim() || null;
      const cleanEmergencyPhone = emergencyPhone?.trim() || null;
      const cleanEmergencyEmail = emergencyEmail?.trim() || null;

      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          emailRedirectTo: 'nirvighna://login',
          data: {
            full_name: cleanName,
            phone: cleanPhone || null,
            role: 'pilgrim',
            emergency_name: cleanEmergencyName,
            emergency_phone: cleanEmergencyPhone,
            emergency_email: cleanEmergencyEmail
          }
        }
      });


      if (signupError) {
        const msg = signupError.message?.toLowerCase() || '';
        if (msg.includes('already registered')) {
          setError('This email is already registered. Please use Login instead.');
        } else if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
          setError('⚠️ Email Rate Limit Exceeded: Supabase allows only 3–4 emails/hour on default SMTP. Please wait a few minutes or check your inbox for the previous email.');
        } else {
          throw signupError;
        }
        return;
      }

      // Store pending profile and emergency contact data
      if (data?.user) {
        const pendingProfile = {
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone || null,
          role: 'pilgrim',
          language_preference: currentLanguage,
          medical_data_consent: dpdpMedicalConsent,
          consent_given_at: new Date().toISOString(),
          emergency_name: cleanEmergencyName,
          emergency_phone: cleanEmergencyPhone,
          emergency_email: cleanEmergencyEmail,
        };
        sessionStorage.setItem('nirvighna_pending_profile', JSON.stringify(pendingProfile));
        localStorage.setItem('nirvighna_pending_profile', JSON.stringify(pendingProfile));
        
        if (cleanEmergencyName || cleanEmergencyPhone) {
          const emObj = { name: cleanEmergencyName || '', phone: cleanEmergencyPhone || '' };
          localStorage.setItem(`nirvighna_emergency_${data.user.id}`, JSON.stringify(emObj));
          localStorage.setItem(`nirvighna_pending_emergency_${cleanEmail}`, JSON.stringify(emObj));
        }
      }

      // Always show verification screen — never skip it
      setPendingEmail(cleanEmail);
      setVerificationPending(true);


    } catch (err) {
      console.error('Signup error:', err);
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        setError('⚠️ Email Rate Limit Exceeded: Supabase allows only 3–4 emails/hour on default SMTP. Please wait a few minutes or check your inbox for the previous verification link.');
      } else {
        setError(err.message || t.signupError || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResentMsg('');
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: 'nirvighna://login'
        }
      });
      if (resendErr) throw resendErr;
      setResentMsg('Verification email sent! Please check your inbox.');
    } catch (err) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        setResentMsg('⚠️ Email rate limit reached. Please wait a few minutes before resending, or check your spam/inbox.');
      } else {
        setResentMsg('Could not resend. Please wait a moment and try again.');
      }
    } finally {
      setResending(false);
    }
  };




  // ── Open Email App Helper ──
  const handleOpenEmailApp = () => {
    try {
      const clean = (pendingEmail || '').toLowerCase();
      if (clean.includes('@gmail.com')) {
        window.open('https://mail.google.com/mail/u/0/#inbox', '_system');
      } else if (clean.includes('@yahoo.')) {
        window.open('https://mail.yahoo.com/', '_system');
      } else if (clean.includes('@outlook.') || clean.includes('@hotmail.')) {
        window.open('https://outlook.live.com/', '_system');
      } else {
        window.location.href = 'mailto:';
      }
    } catch (_) {
      window.location.href = 'mailto:';
    }
  };

  // ── Verification Pending Screen (Clean Email Link Flow — Zero OTP) ──
  if (verificationPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/30 to-[#FAF7F2] flex flex-col items-center justify-center px-5 py-8 select-none font-body animate-page-in">
        <div className="max-w-sm w-full space-y-5 text-center">
          
          {/* Glowing Mail Icon */}
          <div className="w-22 h-22 mx-auto rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 border-4 border-white p-4">
            <MailOpen className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black font-heading text-indigo-dark tracking-wide">
              {currentLanguage === 'gu' ? 'ઈમેલ તપાસો ✉️' : currentLanguage === 'hi' ? 'अपना ईमेल जांचें ✉️' : 'Check Your Email ✉️'}
            </h1>
            <p className="text-xs text-gray-600 font-semibold">
              {currentLanguage === 'gu' ? 'અમે વેરિફિકેશન લિંક મોકલી છે:' : currentLanguage === 'hi' ? 'हमने वेरिफिकेशन लिंक भेजा है:' : 'Verification link sent to:'}
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-1.5 text-xs font-extrabold text-emerald-800 mt-1 shadow-2xs">
              <Mail className="w-3.5 h-3.5" />
              <span>{pendingEmail}</span>
            </div>
          </div>

          {/* Verification Notice Box */}
          <div className="bg-white rounded-3xl border-2 border-gold/40 shadow-warm p-5 space-y-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-base">📬</span>
              <span className="text-xs font-black font-heading text-maroon uppercase tracking-wide">
                {currentLanguage === 'gu' ? 'વેરિફિકેશન સૂચના' : currentLanguage === 'hi' ? 'वेरिफिकेशन सूचना' : 'Verification Notice'}
              </span>
            </div>

            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              {currentLanguage === 'gu'
                ? 'તમારા ઈમેલ સરનામાં પર વેરિફિકેશન લિંક મોકલી દેવામાં આવી છે. કૃપા કરીને તમારું એકાઉન્ટ સક્રિય કરવા માટે ઈમેલમાં આવેલ "Confirm your email" લિંક પર ક્લિક કરો.'
                : currentLanguage === 'hi'
                ? 'आपके ईमेल पते पर वेरिफिकेशन लिंक भेज दिया गया है। कृपया अपना खाता सक्रिय करने के लिए ईमेल में दिए गए "Confirm your email" लिंक पर क्लिक करें।'
                : 'A verification link has been sent to your email address. Please open your mail and click the "Confirm your email" link to activate your account.'}
            </p>
          </div>

          {resentMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-semibold flex items-center gap-2 text-left">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{resentMsg}</span>
            </div>
          )}

          {/* Action CTA Buttons */}
          <div className="space-y-2.5 pt-1">
            
            {/* Open Email / Gmail App Button */}
            <button
              type="button"
              onClick={handleOpenEmailApp}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-98"
            >
              <Mail className="w-4 h-4" />
              <span>
                {currentLanguage === 'gu' ? 'ઈમેલ / Gmail ઍપ ખોલો' : currentLanguage === 'hi' ? 'ईमेल / Gmail ऐप खोलें' : 'Open Email / Gmail App'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Already Verified? Go to Login Button */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-gold-dark hover:to-gold text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-98"
            >
              <span>
                {currentLanguage === 'gu' ? 'વેરિફાય થઈ ગયું? લૉગિન કરો' : currentLanguage === 'hi' ? 'सत्यापित हो गया? लॉगिन करें' : 'Already Verified? Go to Login'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Resend Link Button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-extrabold text-maroon hover:text-gold border-2 border-maroon/20 hover:border-gold rounded-2xl transition-all cursor-pointer disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {resending 
                ? (currentLanguage === 'gu' ? 'મોકલી રહ્યા છીએ...' : currentLanguage === 'hi' ? 'भेजा जा रहा है...' : 'Resending...') 
                : (currentLanguage === 'gu' ? 'વેરિફિકેશન ઈમેલ ફરીથી મોકલો' : currentLanguage === 'hi' ? 'वेरिफिकेशन ईमेल दोबारा भेजें' : 'Resend Verification Email')}
            </button>
          </div>

        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] pt-[max(env(safe-area-inset-top,0px),2.5rem)] pb-[max(env(safe-area-inset-bottom,0px),2.5rem)] px-4 flex flex-col justify-center select-none font-body animate-page-in">
      <div className="max-w-sm w-full mx-auto space-y-5">

        {/* Language Switcher */}
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

        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold via-amber-300 to-amber-600 animate-logo-aura flex items-center justify-center overflow-hidden border-2 border-gold shadow-2xl mx-auto p-1">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1.5 overflow-hidden">
              <img src="/official_logo.png" alt="Nirvighna" className="w-full h-full object-contain crisp-img select-none drop-shadow-xs" />
            </div>
          </div>
          <h1 className="text-xl font-black font-heading tracking-wide text-indigo-dark">
            {currentLanguage === 'gu' ? 'નિર્વિઘ્ન' : currentLanguage === 'hi' ? 'निर्विघ्न' : 'NIRVIGHNA'}
          </h1>
          <p className="text-[11px] text-gray-500 font-semibold">{t.subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-warm border border-gold/20 overflow-hidden">
          {/* Maroon Header */}
          <div className="bg-gradient-to-r from-maroon to-[#5F242C] px-6 py-4 text-center">
            <h2 className="text-base font-extrabold text-white font-heading">{t.title}</h2>
            <p className="text-[11px] text-amber-200/80 mt-0.5">{t.subtitle}</p>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Section: Your Identity */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-maroon/70 font-heading flex items-center gap-1.5">
                  <span>👤</span> Your Identity
                </p>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder={t.fullName}
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all focus:border-maroon focus:bg-white"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder={t.email}
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all focus:border-maroon focus:bg-white"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="Mobile Number (Mandatory *)" required
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all focus:border-maroon focus:bg-white"
                  />
                </div>
              </div>

              {/* Section: Emergency Contact */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900 font-heading flex items-center gap-1.5">
                  <span>🛡️</span> Emergency Contact
                </p>
                <input type="text" required value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder="Emergency Contact Name *"
                  className="w-full px-3 py-2.5 bg-white border-[1.5px] border-amber-200 rounded-xl text-xs font-semibold text-indigo-dark transition-all focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input type="tel" required value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="Emergency Phone *"
                    className="w-full px-3 py-2.5 bg-white border-[1.5px] border-amber-200 rounded-xl text-xs font-semibold text-indigo-dark transition-all focus:border-maroon focus:ring-1 focus:ring-maroon"
                  />
                  <input
                    type="email" value={emergencyEmail}
                    onChange={(e) => setEmergencyEmail(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="Email"
                    className="w-full px-3 py-2.5 bg-white border-[1.5px] border-amber-200 rounded-xl text-xs font-semibold text-indigo-dark transition-all focus:border-maroon focus:ring-1 focus:ring-maroon"
                  />
                </div>
              </div>

              {/* Section: Password */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-maroon/70 font-heading flex items-center gap-1.5">
                  <span>🔒</span> Secure Password
                </p>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder={t.password}
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all focus:border-maroon focus:bg-white"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="password" required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder={t.confirmPassword}
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all focus:border-maroon focus:bg-white"
                  />
                </div>
              </div>

              {/* DPDP Consent */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5 text-xs text-blue-950 font-medium">
                <span className="font-black uppercase text-[10px] text-blue-900 tracking-wider block font-heading">
                  🇮🇳 DPDP Act 2023 Consent
                </span>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input type="checkbox" required checked={dpdpMedicalConsent}
                    onChange={(e) => setDpdpMedicalConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold shrink-0"
                  />
                  <span className="text-[11px] leading-snug">
                    I consent to Nirvighna processing my medical profile only during emergency dispatch.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input type="checkbox" required checked={dpdpContactConsent}
                    onChange={(e) => setDpdpContactConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold shrink-0"
                  />
                  <span className="text-[11px] leading-snug">
                    I have permission from my emergency contacts to share their details for safety dispatch.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0}
                className="btn-warm-primary disabled:opacity-60 disabled:cursor-not-allowed font-heading uppercase tracking-wider"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {cooldownSeconds > 0 ? `⏳ Wait ${cooldownSeconds}s` : loading ? t.creating : t.createAccount}
              </button>
            </form>

            <div className="pt-3 text-center text-xs text-gray-500 font-semibold border-t border-gray-100">
              {t.alreadyHaveAccount}{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-maroon hover:text-gold underline font-extrabold font-heading cursor-pointer"
              >
                {t.login}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


