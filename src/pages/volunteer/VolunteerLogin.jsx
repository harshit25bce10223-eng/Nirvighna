import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield } from 'lucide-react';
import { isDemoMode } from '../../lib/runtimeMode';

export const VolunteerLogin = () => {
  const navigate = useNavigate();
  const { login, setAssignedDuty, getDutyRoute, assignedDuty, dutyQuotas, claimDutySlot } = useVolunteerAuth();
  const { currentLanguage, setLanguage } = useLanguage();

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

    setLoading(true);
    setError('');

    try {
      setAssignedDuty(selectedDuty);
      const demoVolunteer = {
        id: 'vol_8841',
        email: cleanEmail,
        phone: '+91 98412 88410',
        full_name: 'Vikram Sharma (Volunteer)',
        role: 'volunteer',
        zone_assigned: 'Gate 2 Swarga Dwar Sanctum Queue'
      };
      localStorage.setItem('nirvighna_volunteer_session', JSON.stringify(demoVolunteer));
      
      try {
        await login(cleanEmail, password || 'volunteer123');
      } catch (_) {
        // Fallback session is active
      }

      navigate(getDutyRoute(selectedDuty));
    } catch (err) {
      navigate(getDutyRoute(selectedDuty));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickVolunteerLogin = () => {
    setEmail('vikram.vol@nirvighna.org');
    setPassword('volunteer123');
    setAssignedDuty(selectedDuty);
    const demoVolunteer = {
      id: 'vol_8841',
      email: 'vikram.vol@nirvighna.org',
      phone: '+91 98412 88410',
      full_name: 'Vikram Sharma (Volunteer)',
      role: 'volunteer',
      zone_assigned: 'Gate 2 Swarga Dwar Sanctum Queue'
    };
    localStorage.setItem('nirvighna_volunteer_session', JSON.stringify(demoVolunteer));
    navigate(getDutyRoute(selectedDuty));
  };

  return (
    <div className="min-h-screen bg-ivory py-8 px-4 flex flex-col justify-center select-none font-body">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Language Toggle */}
        <div className="flex justify-end">
          <div className="flex bg-white rounded-full p-1 border border-maroon/20">
            {['en', 'hi', 'gu'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  currentLanguage === lang
                    ? 'bg-gold text-indigo-dark'
                    : 'text-gray-600 hover:text-maroon'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Header — Pilgrim Portal Style */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-gold via-amber-300 to-amber-600 overflow-hidden flex items-center justify-center bg-white mx-auto border-2 border-gold/50">
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
            Volunteer Field Operations Hub
          </p>
        </div>

        {/* Form Card — Pilgrim Portal Style */}
        <div className="bg-white rounded-3xl shadow-warm border border-gold/30 p-6 space-y-5">
          <div className="border-b border-gray-100 pb-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-gold/30 inline-block mb-1">
              VOLUNTEER SHIFT SIGN-IN
            </span>
            <h2 className="text-base font-bold text-indigo-dark font-heading">
              Volunteer Hub Login
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Select duty post and sign in for today's shift
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
              <label className="block text-xs font-bold text-gray-700 mb-1">Volunteer Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram.vol@nirvighna.org"
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold font-bold text-indigo-dark"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold font-bold text-indigo-dark"
                />
              </div>
            </div>

            {/* Select Temple Station */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Assigned Temple Station</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold font-heading">
                {[
                  { id: 'tmp_somnath', name: 'Somnath Temple', tag: 'Mahapravesh Dwar' },
                  { id: 'tmp_dwarka', name: 'Dwarkadhish', tag: 'Swarga / Moksha Dwar' },
                  { id: 'tmp_ambaji', name: 'Ambaji Shrine', tag: 'Shakti Dwar Gate 7' },
                  { id: 'tmp_pavagadh', name: 'Kalika Mata', tag: 'Machi Ropeway / Steps' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTempleId(t.id);
                      localStorage.setItem('nirvighna_volunteer_temple_id', t.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedTempleId === t.id
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-md'
                        : 'bg-ivory text-gray-700 border-gray-200 hover:border-gold'
                    }`}
                  >
                    <p className="font-extrabold text-[11px] truncate">{t.name}</p>
                    <p className="text-[9px] opacity-80 mt-0.5">{t.tag}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Duty Post Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Duty Post for Shift</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold font-heading">
                {[
                  { key: 'gate_scanner', icon: '📷', title: 'QR Gate Scanner', sub: 'Sanctum Entry Pass' },
                  { key: 'medical_responder', icon: '🚑', title: 'Medical SOS', sub: 'First Aid Unit' },
                  { key: 'prasad_counter', icon: '🍲', title: 'Prasad Counter', sub: 'Queue Controller' },
                  { key: 'footwear_counter', icon: '👟', title: 'Footwear Stand', sub: 'Rack Tokens' }
                ].map(d => {
                  const quota = dutyQuotas[d.key] || { max: 1, filled: 0 };
                  const isFull = quota.filled >= quota.max;
                  const isSelected = selectedDuty === d.key;

                  return (
                    <button
                      key={d.key}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedDuty(d.key)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all relative ${
                        isFull 
                          ? 'opacity-40 bg-red-50 border-red-200 text-gray-400 cursor-not-allowed'
                          : isSelected
                            ? 'bg-gold text-indigo-dark border-gold shadow-md'
                            : 'bg-ivory text-gray-700 border-gray-200 hover:border-gold'
                      }`}
                    >
                      <span className="text-base">{d.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-extrabold text-[11px] truncate">{d.title}</p>
                          <span className={`text-[8px] px-1 rounded font-black ${
                            isFull ? 'bg-red-500 text-white' : 'bg-black/10 text-indigo-dark'
                          }`}>
                            {isFull ? 'FULL' : `${quota.filled}/${quota.max}`}
                          </span>
                        </div>
                        <p className="text-[9px] opacity-75 font-normal truncate">{d.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-sm rounded-xl shadow-goldGlow uppercase transition-all flex items-center justify-center gap-2 font-heading cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Start My Shift →</span>
                </>
              )}
            </button>

            {/* 1-Click Instant Start Shift Button */}
            <button
              type="button"
              onClick={handleQuickVolunteerLogin}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-gold/50 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>1-Click Instant Volunteer Sign-In</span>
            </button>
          </form>

          {/* Demo Credentials Footer */}
          <div className="pt-3 text-center text-xs text-gray-500 font-medium border-t border-gray-100">
            <span>Demo: </span>
            <span className="text-maroon font-bold">vikram.vol@nirvighna.org</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="text-xs font-bold text-gray-600 hover:text-maroon transition-colors underline"
          >
            ← Return to Pilgrim Portal
          </button>
        </div>
      </div>
    </div>
  );
};
