import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, AlertTriangle, UserX, User, Home, UtensilsCrossed, PackageCheck } from 'lucide-react';
import { useVolunteerAuth } from '../context/VolunteerAuthContext';

export const VolunteerBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { idleWarning } = useVolunteerAuth();

  const navItems = [
    { id: 'scan', label: 'Scan QR', icon: QrCode, path: '/v/scan' },
    { id: 'alerts', label: 'Medical', icon: AlertTriangle, path: '/v/alerts' },
    { id: 'prasad', label: 'Prasad', icon: UtensilsCrossed, path: '/v/prasad' },
    { id: 'footwear', label: 'Footwear', icon: PackageCheck, path: '/v/footwear' },
    { id: 'dashboard', label: 'Hub Home', icon: Home, path: '/v/dashboard' }
  ];

  return (
    <>
      {idleWarning && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-amber-950/95 border-2 border-amber-500 text-amber-200 p-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center justify-between z-[999] animate-bounce font-heading">
          <span>⚠️ Shared Device Session ending in 2 mins due to inactivity</span>
        </div>
      )}
      <nav className="fixed bottom-3 left-3 right-3 bg-[#221517]/95 backdrop-blur-xl border border-amber-500/40 py-2.5 px-3 flex justify-around items-center z-50 max-w-md mx-auto rounded-2xl shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/v/dashboard' && location.pathname === '/v');
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all duration-300 font-heading ${
                isActive 
                  ? 'text-amber-400 scale-105' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-amber-500/20 text-amber-400 shadow-goldGlow border border-amber-500/40' : 'bg-transparent'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-glow" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
