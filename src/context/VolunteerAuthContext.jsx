import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/runtimeMode';

const VolunteerAuthContext = createContext();

export const VolunteerAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [zoneAssigned, setZoneAssigned] = useState('Gate 2 Swarga Dwar Sanctum Queue');
  const [loading, setLoading] = useState(true);

  const [idleWarning, setIdleWarning] = useState(false);

  // 15-Minute Shared Device Idle Timeout (with 13-min warning toast)
  useEffect(() => {
    if (!isLoggedIn) return;

    let warningTimer;
    let logoutTimer;

    const resetTimers = () => {
      setIdleWarning(false);
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      // Warning at 13 minutes
      warningTimer = setTimeout(() => {
        setIdleWarning(true);
      }, 13 * 60 * 1000);

      // Auto logout at 15 minutes
      logoutTimer = setTimeout(() => {
        logout();
      }, 15 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimers));

    resetTimers();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      events.forEach(event => window.removeEventListener(event, resetTimers));
    };
  }, [isLoggedIn]);

  useEffect(() => {
    // Check initial auth state
    checkVolunteerAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await verifyVolunteerRole(session.user);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const verifyVolunteerRole = async (authUser) => {
    try {
      const { data: userRow, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const role = userRow?.role || authUser.user_metadata?.role || 'volunteer';

      if (role !== 'volunteer' && role !== 'admin') {
        // Not a volunteer -> sign out
        await supabase.auth.signOut();
        setCurrentUser(null);
        setIsLoggedIn(false);
        throw new Error('This account is not registered as an authorized volunteer.');
      }

      const formattedUser = {
        id: authUser.id,
        email: authUser.email,
        phone: authUser.phone || userRow?.phone || '+91 98412 88410',
        full_name: userRow?.full_name || authUser.user_metadata?.full_name || 'Vikram Sharma (Volunteer)',
        role: role,
        zone_assigned: userRow?.zone_assigned || 'Gate 2 Swarga Dwar Sanctum Queue'
      };

      setCurrentUser(formattedUser);
      setZoneAssigned(formattedUser.zone_assigned);
      setIsLoggedIn(true);
      return formattedUser;
    } catch (err) {
      console.warn('Volunteer verification note:', err.message);
      // Demo fallback is explicitly opt-in and never enabled in production.
      if (isDemoMode && authUser) {
        const demoVolunteer = {
          id: authUser.id || 'vol_8841',
          phone: authUser.phone || '+91 98412 88410',
          full_name: authUser.user_metadata?.full_name || 'Vikram Sharma (Field Hub)',
          role: 'volunteer',
          zone_assigned: 'Gate 2 Swarga Dwar Sanctum Queue'
        };
        setCurrentUser(demoVolunteer);
        setZoneAssigned(demoVolunteer.zone_assigned);
        setIsLoggedIn(true);
      } else {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setIsLoggedIn(false);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const checkVolunteerAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await verifyVolunteerRole(session.user);
      } else {
        // Offline presentation session; unavailable in production.
        const savedVolunteer = localStorage.getItem('nirvighna_volunteer_session');
        if (isDemoMode && savedVolunteer) {
          const parsed = JSON.parse(savedVolunteer);
          setCurrentUser(parsed);
          setZoneAssigned(parsed.zone_assigned || 'Gate 2 Swarga Dwar Sanctum Queue');
          setIsLoggedIn(true);
        }
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const [dutyQuotas, setDutyQuotas] = useState(() => {
    const saved = localStorage.getItem('nirvighna_duty_quotas');
    if (saved) return JSON.parse(saved);
    return {
      gate_scanner: { max: 2, filled: 0 },
      medical_responder: { max: 1, filled: 0 },
      prasad_counter: { max: 1, filled: 0 },
      footwear_counter: { max: 1, filled: 0 }
    };
  });

  const claimDutySlot = (dutyKey) => {
    const current = dutyQuotas[dutyKey] || { max: 1, filled: 0 };
    if (current.filled >= current.max) {
      return false; // Quota Full
    }
    const updated = {
      ...dutyQuotas,
      [dutyKey]: { ...current, filled: current.filled + 1 }
    };
    setDutyQuotas(updated);
    localStorage.setItem('nirvighna_duty_quotas', JSON.stringify(updated));
    return true;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (!isDemoMode) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await verifyVolunteerRole(data.user);
        return { success: true, user: data.user };
      }

      const cleanEmail = (email || '').toLowerCase().trim();

      // Volunteer accounts database mapping
      const volunteerAccounts = {
        'vikram.vol@nirvighna.org': { id: 'vol_8841', name: 'Vikram Sharma', phone: '+91 98412 88410', defaultZone: 'Gate 2 Swarga Dwar Queue' },
        'savitri.vol@nirvighna.org': { id: 'vol_8842', name: 'Savitri Devi', phone: '+91 98412 88411', defaultZone: 'Medical Post 1 (Gate 2)' },
        'rajesh.vol@nirvighna.org': { id: 'vol_8843', name: 'Rajesh Kumar', phone: '+91 98412 88412', defaultZone: 'Prasad Counter #1' },
        'pooja.vol@nirvighna.org': { id: 'vol_8844', name: 'Pooja Mehta', phone: '+91 98412 88413', defaultZone: 'Footwear Rack B' }
      };

      const matched = volunteerAccounts[cleanEmail] || {
        id: 'vol_guest_' + Math.floor(1000 + Math.random() * 9000),
        name: email.split('@')[0].toUpperCase() + ' (Volunteer)',
        phone: '+91 98412 99999',
        defaultZone: 'Gate 1 Main Entrance'
      };

      // Check admin assigned duty from Command Centre Roster
      const adminDuty = localStorage.getItem(`nirvighna_vol_duty_email_${cleanEmail}`) ||
                        localStorage.getItem(`nirvighna_vol_duty_${matched.id}`) ||
                        localStorage.getItem('nirvighna_volunteer_duty') ||
                        'gate_scanner';

      setAssignedDutyState(adminDuty);
      localStorage.setItem('nirvighna_volunteer_duty', adminDuty);

      const demoVolunteerUser = {
        id: matched.id,
        email: email,
        phone: matched.phone,
        full_name: matched.name,
        role: 'volunteer',
        assigned_duty: adminDuty,
        zone_assigned: matched.defaultZone
      };

      localStorage.setItem('nirvighna_volunteer_session', JSON.stringify(demoVolunteerUser));
      setCurrentUser(demoVolunteerUser);
      setZoneAssigned(demoVolunteerUser.zone_assigned);
      setIsLoggedIn(true);
      return { success: true, user: demoVolunteerUser };
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('nirvighna_volunteer_session');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const [assignedDuty, setAssignedDutyState] = useState(() => {
    return localStorage.getItem('nirvighna_volunteer_duty') || 'gate_scanner';
  });

  useEffect(() => {
    const handleDutyChange = (e) => {
      if (e.detail?.duty) {
        setAssignedDutyState(e.detail.duty);
        localStorage.setItem('nirvighna_volunteer_duty', e.detail.duty);
      }
    };
    window.addEventListener('nirvighna_duty_assigned', handleDutyChange);
    return () => window.removeEventListener('nirvighna_duty_assigned', handleDutyChange);
  }, []);

  const setAssignedDuty = (duty) => {
    setAssignedDutyState(duty);
    localStorage.setItem('nirvighna_volunteer_duty', duty);
  };

  const getDutyRoute = (duty = assignedDuty) => {
    switch (duty) {
      case 'gate_scanner': return '/v/scan';
      case 'medical_responder': return '/v/alerts';
      case 'prasad_counter': return '/v/prasad';
      case 'footwear_counter': return '/v/footwear';
      default: return '/v/dashboard';
    }
  };

  return (
    <VolunteerAuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        zoneAssigned,
        assignedDuty,
        setAssignedDuty,
        getDutyRoute,
        dutyQuotas,
        claimDutySlot,
        idleWarning,
        login,
        logout,
        loading
      }}
    >
      {children}
    </VolunteerAuthContext.Provider>
  );
};

export const useVolunteerAuth = () => {
  const context = useContext(VolunteerAuthContext);
  if (!context) {
    throw new Error('useVolunteerAuth must be used within a VolunteerAuthProvider');
  }
  return context;
};
