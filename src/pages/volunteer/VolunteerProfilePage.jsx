import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { User, LogOut, Shield, ChevronLeft, Phone, MapPin } from 'lucide-react';

export const VolunteerProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, zoneAssigned, logout } = useVolunteerAuth();

  const handleLogout = async () => {
    if (window.confirm('End volunteer shift and sign out?')) {
      await logout();
      navigate('/v/login');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-dark text-white font-body pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/v/dashboard')}
          className="p-2 bg-indigo-card rounded-xl border border-white/20 text-gold"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black font-heading text-gold">Volunteer Duty Profile</h1>
      </div>

      <div className="bg-indigo-card p-5 rounded-3xl border border-gold/40 space-y-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gold text-indigo-dark flex items-center justify-center font-black text-xl shadow-goldGlow">
            VS
          </div>
          <div>
            <h2 className="text-base font-black font-heading text-white">
              {currentUser?.full_name || 'Vikram Sharma'}
            </h2>
            <p className="text-xs text-gray-300 font-medium">Volunteer ID: #8841</p>
            <span className="inline-block text-[10px] font-extrabold text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30 mt-1 uppercase">
              SANCTUM QUEUE MARSHAL
            </span>
          </div>
        </div>

        <div className="bg-indigo-dark p-3.5 rounded-2xl border border-white/10 space-y-1.5 text-xs font-mono">
          <p className="text-gray-400">Assigned Zone:</p>
          <p className="text-gold font-bold">{zoneAssigned || 'Gate 2 Swarga Dwar Sanctum Queue'}</p>
          <p className="text-gray-400 pt-1">Shift Hours: <span className="text-white font-bold">06:00 AM - 02:00 PM</span></p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> End Shift & Sign Out
        </button>
      </div>
    </div>
  );
};
