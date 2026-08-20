import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, AlertTriangle, Home, UtensilsCrossed, PackageCheck, Search, ShieldCheck } from 'lucide-react';
import { useVolunteerAuth } from '../context/VolunteerAuthContext';

export const VolunteerBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { idleWarning, assignedDuty } = useVolunteerAuth();

  const isGateVolunteer = assignedDuty === 'gate_scanner';

  const navItems = isGateVolunteer
    ? [
        { id: 'scan', label: 'Gate Scanner', icon: QrCode, path: '/v/scan' },
        { id: 'dashboard', label: 'Gate Shift Hub', icon: Home, path: '/v/dashboard' }
      ]
    : [
        { id: 'prasad', label: 'Prasad', icon: UtensilsCrossed, path: '/v/prasad' },
        { id: 'footwear', label: 'Footwear', icon: PackageCheck, path: '/v/footwear' },
        { id: 'alerts', label: 'Medical SOS', icon: AlertTriangle, path: '/v/alerts' },
        { id: 'lostfound', label: 'Lost & Found', icon: Search, path: '/v/lost-found' },
        { id: 'dashboard', label: 'Services Hub', icon: Home, path: '/v/dashboard' }
      ];

  return (
    <>
      {idleWarning && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-amber-50 border-2 border-amber-500 text-amber-900 p-3 rounded-2xl shadow-warm text-xs font-bold flex items-center justify-between z-[999] font-heading">
          <span>⚠️ Shared Device Session ending in 2 mins due to inactivity</span>
        </div>
      )}
      <nav className="fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xl border border-gold/40 py-2 px-3 flex justify-around items-center z-50 max-w-md mx-auto rounded-3xl shadow-warm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/v/dashboard' && location.pathname === '/v');
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all duration-300 font-heading cursor-pointer ${
                isActive 
                  ? 'text-maroon scale-105' 
                  : 'text-gray-500 hover:text-maroon'
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-all ${
                isActive ? 'bg-gold/20 text-maroon shadow-xs border border-gold/50' : 'bg-transparent'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
