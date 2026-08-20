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
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body pb-28 pt-4 px-4 max-w-md mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/v/dashboard')}
          className="p-2 bg-white rounded-2xl border border-gold/30 text-maroon hover:bg-gold/10 transition-colors shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black font-heading text-maroon">Volunteer Duty Profile</h1>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-gold/30 space-y-4 shadow-warm">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-amber-500 text-indigo-dark flex items-center justify-center font-black text-xl shadow-goldGlow border border-gold/50">
            VS
          </div>
          <div>
            <h2 className="text-base font-black font-heading text-indigo-dark">
              {currentUser?.full_name || 'Vikram Sharma'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Volunteer ID: #8841</p>
            <span className="inline-block text-[10px] font-extrabold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-gold/40 mt-1 uppercase">
              SANCTUM QUEUE MARSHAL
            </span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-gold/30 space-y-1.5 text-xs font-mono">
          <p className="text-gray-500 font-sans">Assigned Zone:</p>
          <p className="text-maroon font-bold font-sans">{zoneAssigned || 'Gate 2 Swarga Dwar Sanctum Queue'}</p>
          <p className="text-gray-500 pt-1 font-sans">Shift Hours: <span className="text-indigo-dark font-bold">06:00 AM - 02:00 PM</span></p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4" /> End Shift & Sign Out
        </button>
      </div>
    </div>
  );
};
