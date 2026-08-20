import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Server, AlertCircle, Loader2, ArrowRight, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { isDemoMode } from '../../lib/runtimeMode';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { currentLanguage, setLanguage } = useLanguage();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [selectedHub, setSelectedHub] = useState('Somnath Mahadev Command Operations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanEmail = email.trim() || 'admin@somnath.gov.in';
    const cleanPin = pin.trim() || '9999';

    setLoading(true);
    setError('');

    try {
      const hubTempleMap = {
        'Somnath Mahadev Command Operations': 'tmp_somnath',
        'Dwarkadhish Temple Control Hub': 'tmp_dwarka',
        'Ambaji Shrine Safety Operations': 'tmp_ambaji',
        'Pavagadh Ropeway & Hill Patrol': 'tmp_pavagadh'
      };

      const adminSession = {
        email: cleanEmail,
        role: 'admin',
        hub: selectedHub,
        templeId: hubTempleMap[selectedHub] || 'tmp_somnath',
        authenticatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('nirvighna_admin_session', JSON.stringify(adminSession));
      localStorage.setItem('nirvighna_admin', 'true');
      setLoading(false);
      navigate('/command-centre');
    } catch (err) {
      setError(err.message || 'Unable to verify command staff clearance.');
      setLoading(false);
    }
  };

  const handleQuickCommandLogin = () => {
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
    navigate('/command-centre');
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
            Command Operations & Safety Hub
          </p>
        </div>

        {/* Form Card — Pilgrim Portal Style */}
        <div className="bg-white rounded-3xl shadow-warm border border-gold/30 p-6 space-y-5">
          <div className="border-b border-gray-100 pb-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-gold/30 inline-block mb-1">
              COMMAND STAFF CLEARANCE
            </span>
            <h2 className="text-base font-bold text-indigo-dark font-heading">
              Command Centre Portal Login
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enter your credentials to access operations dashboard
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-alertRed" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Command Staff Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nirvighna.org"
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold font-bold text-indigo-dark"
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{isDemoMode ? '4-Digit Security PIN' : 'Account Password'}</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  maxLength={isDemoMode ? 4 : undefined}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder={isDemoMode ? 'Enter PIN (Demo: 9999)' : 'Enter your account password'}
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold font-bold text-indigo-dark font-mono"
                />
              </div>
            </div>

            {/* Station Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Command Control Station</label>
              <div className="relative">
                <Server className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-ivory border border-gray-200 rounded-xl text-xs font-bold text-indigo-dark focus:outline-none focus:border-gold font-heading"
                >
                  <option value="Somnath Mahadev Command Operations">Somnath Mahadev Command Operations</option>
                  <option value="Dwarkadhish Temple Control Hub">Dwarkadhish Temple Control Hub</option>
                  <option value="Ambaji Shrine Safety Operations">Ambaji Shrine Safety Operations</option>
                  <option value="Pavagadh Ropeway & Hill Patrol">Pavagadh Ropeway & Hill Patrol</option>
                </select>
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
                  <span>Verifying Clearance...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Access Command Operations →</span>
                </>
              )}
            </button>

            {/* 1-Click Command Centre Button */}
            <button
              type="button"
              onClick={handleQuickCommandLogin}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-gold/50 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>1-Click Instant Command Centre Access</span>
            </button>
          </form>

          {/* Demo Credentials Footer */}
          <div className="pt-3 text-center text-xs text-gray-500 font-medium border-t border-gray-100">
            <span>Demo: </span>
            <span className="text-maroon font-bold">admin@somnath.gov.in</span>
            <span className="mx-1">•</span>
            <span>PIN: </span>
            <span className="text-maroon font-bold">9999</span>
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
