import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Server, AlertCircle, Loader2, ShieldCheck, Zap, Radio, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isDemoMode } from '../../lib/runtimeMode';
import { supabase } from '../../lib/supabaseClient';

const HUB_TEMPLE_MAP = {
  'Somnath Mahadev Command Operations': 'tmp_somnath',
  'Dwarkadhish Temple Control Hub': 'tmp_dwarka',
  'Ambaji Shrine Safety Operations': 'tmp_ambaji',
  'Pavagadh Ropeway & Hill Patrol': 'tmp_pavagadh'
};

export const CommandCentreLogin = () => {
  const navigate = useNavigate();
  const { currentLanguage, setLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [selectedHub, setSelectedHub] = useState('Somnath Mahadev Command Operations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSecret = pin.trim();

    if (!cleanEmail || !cleanSecret) {
      setError(isDemoMode ? 'Enter staff email and PIN.' : 'Enter your command staff credentials.');
      return;
    }

    if (isDemoMode && cleanSecret !== '9999') {
      setError('Invalid demo PIN. Use 9999.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!isDemoMode) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanSecret
        });
        if (authError || !data?.user) throw new Error(authError?.message || 'Invalid credentials.');

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profileError || profile?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('This account does not have command centre clearance.');
        }
      }

      const adminSession = {
        email: cleanEmail,
        role: 'admin',
        hub: selectedHub,
        templeId: HUB_TEMPLE_MAP[selectedHub] || 'tmp_somnath',
        authenticatedAt: new Date().toISOString()
      };

      localStorage.setItem('nirvighna_admin_session', JSON.stringify(adminSession));
      localStorage.setItem('nirvighna_admin', 'true');
      setLoading(false);
      navigate('/cc/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to verify command staff clearance.');
      setLoading(false);
    }
  };

  const handleQuickCommandLogin = () => {
    if (!isDemoMode) return;
    setEmail('admin@somnath.gov.in');
    setPin('9999');
    const adminSession = {
      email: 'admin@somnath.gov.in',
      role: 'admin',
      hub: selectedHub,
      templeId: 'tmp_somnath',
      authenticatedAt: new Date().toISOString()
    };
    localStorage.setItem('nirvighna_admin_session', JSON.stringify(adminSession));
    localStorage.setItem('nirvighna_admin', 'true');
    navigate('/cc/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 py-8 px-4 flex flex-col justify-center select-none font-body">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Language Toggle */}
        <div className="flex justify-end">
          <div className="flex bg-slate-800/50 rounded-full p-1 border border-amber-500/30 shadow-lg gap-0.5 backdrop-blur-sm">
            {['en', 'hi', 'gu'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentLanguage === lang
                    ? 'bg-amber-500 text-slate-950 shadow-lg'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Header — Tactical Command Style */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl p-1 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 overflow-hidden flex items-center justify-center bg-slate-900 mx-auto border-2 border-amber-400 shadow-2xl shadow-amber-500/20">
            <img 
              src="/official_logo.png" 
              alt="Nirvighna Command Emblem" 
              className="w-full h-full object-contain p-1" 
            />
          </div>
          <h1 className="text-2xl font-black font-heading tracking-widest text-amber-400 mt-3">
            NIRVIGHNA
          </h1>
          <p className="text-xs text-amber-300/80 font-semibold tracking-widest mt-0.5">
            COMMAND OPERATIONS & SAFETY HUB
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-[9px] font-bold font-mono">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              SECURE
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-full text-[9px] font-bold font-mono">
              <Zap className="w-3 h-3" />
              TACTICAL
            </span>
          </div>
        </div>

        {/* Form Card — Tactical Command Style */}
        <div className="bg-slate-900/80 rounded-3xl shadow-2xl border border-amber-500/30 p-6 space-y-5 backdrop-blur-xl">
          <div className="border-b border-amber-500/20 pb-3 text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-600/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block mb-1 font-heading">
              COMMAND STAFF CLEARANCE REQUIRED
            </span>
            <h2 className="text-base font-bold text-amber-300 font-heading mt-1">
              TACTICAL COMMAND CENTRE
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Authorized Personnel Only • All Access Logged
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-2xl text-xs text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">COMMAND STAFF ID</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@somnath.gov.in"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold text-amber-300"
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">4-DIGIT SECURITY PIN</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN (Demo: 9999)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold text-amber-300 font-mono tracking-widest"
                />
              </div>
            </div>

            {/* Station Selector */}
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">SELECT COMMAND CONTROL STATION</label>
              <div className="relative">
                <Server className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500 font-heading appearance-none"
                >
                  <option value="Somnath Mahadev Command Operations">🛕 SOMNATH MAHADEV COMMAND OPS</option>
                  <option value="Dwarkadhish Temple Control Hub">🏰 DWARKADHISH TEMPLE CONTROL HUB</option>
                  <option value="Ambaji Shrine Safety Operations">🕉️ AMBAJI SHRINE SAFETY OPS</option>
                  <option value="Pavagadh Ropeway & Hill Patrol">🚡 PAVAGADH ROPEWAY & HILL PATROL</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 uppercase transition-all flex items-center justify-center gap-2 font-heading cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>VERIFYING CLEARANCE...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>ACCESS COMMAND OPERATIONS →</span>
                </>
              )}
            </button>

            {isDemoMode && (
              <button
                type="button"
                onClick={handleQuickCommandLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>1-CLICK INSTANT COMMAND ACCESS (DEMO)</span>
              </button>
            )}
          </form>

          {isDemoMode && (
            <div className="pt-3 text-center text-xs text-slate-500 font-medium border-t border-slate-700">
              <span className="text-slate-400">DEMO CREDENTIALS: </span>
              <span className="text-amber-400 font-bold">admin@somnath.gov.in</span>
              <span className="mx-1 text-slate-500">•</span>
              <span className="text-slate-400">PIN: </span>
              <span className="text-amber-400 font-bold font-mono">9999</span>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors underline cursor-pointer"
          >
            ← RETURN TO PILGRIM PORTAL
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandCentreLogin;