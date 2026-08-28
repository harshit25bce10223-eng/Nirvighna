import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, AlertTriangle, Home, UtensilsCrossed, PackageCheck, Search, ShieldCheck, User } from 'lucide-react';
import { useVolunteerAuth } from '../context/VolunteerAuthContext';

export const VolunteerBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { idleWarning, assignedDuty } = useVolunteerAuth();

  let navItems = [];

  if (assignedDuty === 'inner_gate_scanner' || location.pathname === '/v/inner-gate') {
    navItems = [
      { id: 'inner_gate', label: 'Sanctum Scan', icon: QrCode, path: '/v/inner-gate' },
      { id: 'lostfound', label: 'Lost & Found', icon: Search, path: '/v/lost-found' },
      { id: 'gate_alerts', label: 'Panic Alerts', icon: ShieldCheck, path: '/v/gate-alerts' }
    ];
  } else if (
    assignedDuty === 'gate_scanner' ||
    assignedDuty === 'ropeway_counter' ||
    assignedDuty === 'boat_counter' ||
    location.pathname === '/v/scan'
  ) {
    const gateLabel = assignedDuty === 'ropeway_counter' 
      ? 'Ropeway Scan' 
      : assignedDuty === 'boat_counter' 
        ? 'Boat Scan' 
        : 'Gate Scanner';

    navItems = [
      { id: 'scan', label: gateLabel, icon: QrCode, path: '/v/scan' },
      { id: 'lostfound', label: 'Lost & Found', icon: Search, path: '/v/lost-found' },
      { id: 'gate_alerts', label: 'Panic Alerts', icon: ShieldCheck, path: '/v/gate-alerts' }
    ];
  } else if (assignedDuty === 'medical_responder' || location.pathname === '/v/alerts') {
    navItems = [
      { id: 'alerts', label: 'Medical Help', icon: AlertTriangle, path: '/v/alerts' },
      { id: 'gate_alerts', label: 'Panic Alerts', icon: ShieldCheck, path: '/v/gate-alerts' },
      { id: 'dashboard', label: 'Shift Hub', icon: Home, path: '/v/dashboard' }
    ];
  } else if (assignedDuty === 'prasad_counter' || location.pathname === '/v/prasad') {
    navItems = [
      { id: 'prasad', label: 'Prasad Counter', icon: UtensilsCrossed, path: '/v/prasad' },
      { id: 'dashboard', label: 'Prasad Shift Hub', icon: Home, path: '/v/dashboard' }
    ];
  } else if (assignedDuty === 'footwear_counter' || location.pathname === '/v/footwear') {
    navItems = [
      { id: 'footwear', label: 'Footwear Stand', icon: PackageCheck, path: '/v/footwear' },
      { id: 'dashboard', label: 'Locker Shift Hub', icon: Home, path: '/v/dashboard' }
    ];
  } else if (assignedDuty === 'lost_found' || location.pathname === '/v/lost-found') {
    navItems = [
      { id: 'lostfound', label: 'Lost & Found', icon: Search, path: '/v/lost-found' },
      { id: 'dashboard', label: 'Seva Shift Hub', icon: Home, path: '/v/dashboard' }
    ];
  } else {
    navItems = [
      { id: 'dashboard', label: 'Shift Hub', icon: Home, path: '/v/dashboard' }
    ];
  }

  // Always append the Profile tab at the end
  navItems.push({ id: 'profile', label: 'Profile', icon: User, path: '/v/profile' });

  return (
    <>
      {idleWarning && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-cream.light border-2 border-gold text-maroon p-3 rounded-2xl shadow-warm text-xs font-bold flex items-center justify-between z-[999] font-heading">
          <span>⚠️ Shared Device Session ending in 2 mins due to inactivity</span>
        </div>
      )}
      <nav className="fixed bottom-[max(env(safe-area-inset-bottom,0px),0.75rem)] left-3 right-3 bg-ivory/95 backdrop-blur-xl border border-gold/40 py-2 px-3 flex justify-around items-center z-50 max-w-md mx-auto rounded-3xl shadow-warm">
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
                  : 'text-temple.textMuted hover:text-maroon'
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
