import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/runtimeMode';
import { DEMO_CREDENTIALS, DEMO_VOLUNTEER, seedDemoVolunteer } from '../lib/demoSeedEngine';


const VolunteerAuthContext = createContext();

export const VolunteerAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [zoneAssigned, setZoneAssigned] = useState('Gate 2 Swarga Dwar Sanctum Queue');
  const [loading, setLoading] = useState(true);

  const [idleWarning, setIdleWarning] = useState(false);

  // shared device idle timeout
  useEffect(() => {
    if (!isLoggedIn) return;

    let warningTimer;
    let logoutTimer;

    const resetTimers = () => {
      setIdleWarning(false);
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      // warning after 13 mins
      warningTimer = setTimeout(() => {
        setIdleWarning(true);
      }, 13 * 60 * 1000);

      // auto logout after 15 mins
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
    // check initial auth state
    checkVolunteerAuth();

    // listen for auth state changes
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
        // sign out non-volunteers
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
      // demo fallback check
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
        const savedVolunteer = localStorage.getItem('nirvighna_volunteer_session');
        if (savedVolunteer) {
          try {
            const parsed = JSON.parse(savedVolunteer);
            setCurrentUser(parsed);
            setZoneAssigned(parsed.zone_assigned || 'Gate 2 Swarga Dwar Sanctum Queue');
            setIsLoggedIn(true);
          } catch (_) {}
        }
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const [dutyQuotas, setDutyQuotas] = useState(() => {
    return {
      gate_scanner: { max: 99, filled: 0 },
      medical_responder: { max: 99, filled: 0 },
      prasad_counter: { max: 99, filled: 0 },
      footwear_counter: { max: 99, filled: 0 }
    };
  });

  const claimDutySlot = (dutyKey) => {
    const current = dutyQuotas[dutyKey] || { max: 99, filled: 0 };
    const updated = {
      ...dutyQuotas,
      [dutyKey]: { ...current, filled: (current.filled || 0) + 1 }
    };
    setDutyQuotas(updated);
    localStorage.setItem('nirvighna_duty_quotas', JSON.stringify(updated));
    return true;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const cleanEmailCheck = (email || '').trim().toLowerCase();

      // ── Demo Volunteer Fast-Path (no Supabase) ────────────────────────────
      if (
        cleanEmailCheck === DEMO_CREDENTIALS.volunteer.email &&
        (password || '').trim() === DEMO_CREDENTIALS.volunteer.password
      ) {
        seedDemoVolunteer();
        setCurrentUser(DEMO_VOLUNTEER);
        setZoneAssigned(DEMO_VOLUNTEER.zone_assigned);
        setIsLoggedIn(true);
        setLoading(false);
        return { success: true, user: DEMO_VOLUNTEER, is_demo: true };
      }
      // ──────────────────────────────────────────────────────────────────────

      let loggedUser = null;

      // try supabase auth first
      if (!isDemoMode && email && password) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error && data?.user) {
            loggedUser = data.user;
          }
        } catch (_) {
          // fallback to local profile
        }
      }

      const cleanEmail = (email || '').toLowerCase().trim();

      // volunteer accounts map
      const volunteerAccounts = {
        'vikram.vol@nirvighna.org': { id: 'vol_8841', name: 'Vikram Sharma', phone: '+91 98412 88410', defaultZone: 'Gate 2 Swarga Dwar Queue' },
        'savitri.vol@nirvighna.org': { id: 'vol_8842', name: 'Savitri Devi', phone: '+91 98412 88411', defaultZone: 'Medical Post 1 (Gate 2)' },
        'rajesh.vol@nirvighna.org': { id: 'vol_8843', name: 'Rajesh Kumar', phone: '+91 98412 88412', defaultZone: 'Prasad Counter #1' },
        'pooja.vol@nirvighna.org': { id: 'vol_8844', name: 'Pooja Mehta', phone: '+91 98412 88413', defaultZone: 'Footwear Rack B' }
      };

      const matched = volunteerAccounts[cleanEmail] || {
        id: loggedUser?.id || 'vol_guest_' + Math.floor(1000 + Math.random() * 9000),
        name: cleanEmail.includes('@') ? cleanEmail.split('@')[0].toUpperCase() + ' (Volunteer)' : 'Vikram Sharma (Volunteer)',
        phone: '+91 98412 99999',
        defaultZone: 'Gate 1 Main Entrance'
      };

      // check assigned duty
      const adminDuty = localStorage.getItem(`nirvighna_vol_duty_email_${cleanEmail}`) ||
                        localStorage.getItem(`nirvighna_vol_duty_${matched.id}`) ||
                        localStorage.getItem('nirvighna_volunteer_duty') ||
                        'gate_scanner';

      setAssignedDutyState(adminDuty);
      localStorage.setItem('nirvighna_volunteer_duty', adminDuty);

      const demoVolunteerUser = {
        id: matched.id,
        email: cleanEmail || 'vikram.vol@nirvighna.org',
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
      const fallbackUser = {
        id: 'vol_8841',
        email: email || 'vikram.vol@nirvighna.org',
        phone: '+91 98412 88410',
        full_name: 'Vikram Sharma (Volunteer)',
        role: 'volunteer',
        assigned_duty: 'gate_scanner',
        zone_assigned: 'Gate 2 Swarga Dwar Sanctum Queue'
      };
      localStorage.setItem('nirvighna_volunteer_session', JSON.stringify(fallbackUser));
      setCurrentUser(fallbackUser);
      setZoneAssigned(fallbackUser.zone_assigned);
      setIsLoggedIn(true);
      return { success: true, user: fallbackUser };
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
