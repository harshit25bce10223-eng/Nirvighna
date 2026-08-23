import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/runtimeMode';
import { App as CapApp } from '@capacitor/app';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Universal handler for incoming deep links / email verification redirects
  const handleIncomingAuthUrl = useCallback(async (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    try {
      console.log('🔗 [Nirvighna DeepLink] Received URL:', rawUrl);

      // Parse hash fragment and search query params
      const params = new URLSearchParams();
      if (rawUrl.includes('#')) {
        const hashPart = rawUrl.substring(rawUrl.indexOf('#') + 1);
        const cleanHash = hashPart.replace(/^\/?/, '');
        new URLSearchParams(cleanHash).forEach((val, key) => params.set(key, val));
      }
      if (rawUrl.includes('?')) {
        const queryPart = rawUrl.substring(rawUrl.indexOf('?') + 1).split('#')[0];
        new URLSearchParams(queryPart).forEach((val, key) => {
          if (!params.has(key)) params.set(key, val);
        });
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const code = params.get('code');
      const tokenHash = params.get('token_hash');
      const type = params.get('type') || 'signup';

      let authUser = null;

      // 1. Implicit / Token redirect (access_token + refresh_token)
      if (accessToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });
        if (data?.session?.user) {
          authUser = data.session.user;
        }
      } 
      // 2. PKCE authorization code exchange
      else if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (data?.session?.user) {
          authUser = data.session.user;
        }
      } 
      // 3. Token hash verification (OTP / email verification token)
      else if (tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type
        });
        if (data?.session?.user) {
          authUser = data.session.user;
        }
      }

      if (authUser) {
        await fetchUserProfile(authUser.id, authUser);
        window.location.hash = '#/home';
        return true;
      }
    } catch (e) {
      console.warn('⚠️ [Nirvighna DeepLink] Verification processing error:', e);
    }
    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Register global and Capacitor deep link handlers
    window.handleNirvighnaDeepLink = (url) => {
      handleIncomingAuthUrl(url);
    };

    const handleCustomDeepLink = (e) => {
      if (e.detail?.url) {
        handleIncomingAuthUrl(e.detail.url);
      }
    };
    window.addEventListener('nirvighna_deep_link', handleCustomDeepLink);

    let appUrlListener = null;
    try {
      appUrlListener = CapApp.addListener('appUrlOpen', (event) => {
        if (event?.url) {
          handleIncomingAuthUrl(event.url);
        }
      });
    } catch (e) {
      console.warn('Capacitor App listener not available in web context:', e);
    }

    const initAuthSession = async () => {
      try {
        // Check incoming stored deep link first
        const storedDeepLink = sessionStorage.getItem('nirvighna_incoming_deep_link');
        if (storedDeepLink) {
          sessionStorage.removeItem('nirvighna_incoming_deep_link');
          const handled = await handleIncomingAuthUrl(storedDeepLink);
          if (handled && isMounted) {
            setLoading(false);
            return;
          }
        }

        // Check window.location for tokens/codes
        const fullHref = window.location.href;
        if (fullHref.includes('access_token=') || fullHref.includes('code=') || fullHref.includes('token_hash=')) {
          const handled = await handleIncomingAuthUrl(fullHref);
          if (handled && isMounted) {
            setLoading(false);
            return;
          }
        }

        // Normal getSession check
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await fetchUserProfile(session.user.id, session.user);
        } else if (isMounted) {
          const savedPilgrim = localStorage.getItem('nirvighna_pilgrim_session');
          if (savedPilgrim) {
            try {
              const parsed = JSON.parse(savedPilgrim);
              if (parsed && parsed.id) {
                setCurrentUser(parsed);
                setIsLoggedIn(true);
              } else {
                setCurrentUser(null);
                setIsLoggedIn(false);
              }
            } catch (_) {
              setCurrentUser(null);
              setIsLoggedIn(false);
            }
          } else {
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        }
      } catch (err) {
        console.warn('Session fetch fallback:', err);
        const savedPilgrim = localStorage.getItem('nirvighna_pilgrim_session');
        if (savedPilgrim && isMounted) {
          try {
            const parsed = JSON.parse(savedPilgrim);
            if (parsed && parsed.id) {
              setCurrentUser(parsed);
              setIsLoggedIn(true);
            }
          } catch (_) {}
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuthSession();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && isMounted) {
          await fetchUserProfile(session.user.id, session.user);
          if (window.location.hash.includes('access_token') || window.location.hash.includes('code=')) {
            window.location.hash = '#/home';
          }
        } else if (!session && isMounted) {
          const savedPilgrim = localStorage.getItem('nirvighna_pilgrim_session');
          if (!savedPilgrim) {
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      window.removeEventListener('nirvighna_deep_link', handleCustomDeepLink);
      if (appUrlListener && typeof appUrlListener.remove === 'function') {
        appUrlListener.remove();
      }
      subscription.unsubscribe();
    };
  }, [handleIncomingAuthUrl]);


  const fetchUserProfile = async (userId, fallbackUser = null) => {
    try {
      // 1. Sync any pending emergency contacts from signup
      try {
        const pendingRaw = localStorage.getItem('nirvighna_pending_profile') || sessionStorage.getItem('nirvighna_pending_profile');
        const u = fallbackUser || (await supabase.auth.getUser())?.data?.user;
        const meta = u?.user_metadata || {};
        let emName = meta.emergency_name || null;
        let emPhone = meta.emergency_phone || null;

        if (pendingRaw) {
          const pp = JSON.parse(pendingRaw);
          if (pp && (pp.id === userId || pp.email === u?.email)) {
            emName = emName || pp.emergency_name;
            emPhone = emPhone || pp.emergency_phone;
            const { emergency_name, emergency_phone, emergency_email, ...profileFields } = pp;
            try {
              await supabase.from('users').upsert({ id: userId, ...profileFields });
            } catch (_) {}
          }
        }

        if (!emName && u?.email) {
          const emailPending = localStorage.getItem(`nirvighna_pending_emergency_${u.email.toLowerCase()}`);
          if (emailPending) {
            const ep = JSON.parse(emailPending);
            emName = ep.name;
            emPhone = ep.phone;
          }
        }

        if (emName || emPhone) {
          const emObj = { name: emName || '', phone: emPhone || '' };
          localStorage.setItem(`nirvighna_emergency_${userId}`, JSON.stringify(emObj));
          try {
            await supabase.from('emergency_contacts').upsert({
              pilgrim_id: userId,
              name: emName || 'Emergency Contact',
              phone: emPhone || '',
              relationship: 'Family Contact',
              is_primary: true
            });
          } catch (_) {}
        }
      } catch (_) {}

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback to user metadata if DB record is missing or restricted
        const u = fallbackUser || (await supabase.auth.getUser())?.data?.user;
        const profile = {
          id: userId,
          email: u?.email || 'devotee@nirvighna.org',
          full_name: u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Devotee',
          phone: u?.user_metadata?.phone || '',
          role: 'pilgrim',
          language_preference: 'hi'
        };
        try {
          await supabase.from('users').upsert(profile);
        } catch (_) {}

        setCurrentUser(profile);
        setIsLoggedIn(true);
        localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(profile));
        return profile;
      }

      setCurrentUser(data);
      setIsLoggedIn(true);
      localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Using metadata profile fallback:', error);
      const u = fallbackUser || (await supabase.auth.getUser())?.data?.user;
      if (u) {
        const profile = {
          id: userId,
          email: u.email,
          full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Devotee',
          phone: u.user_metadata?.phone || '',
          role: 'pilgrim',
          language_preference: 'hi'
        };
        setCurrentUser(profile);
        setIsLoggedIn(true);
        localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(profile));
        return profile;
      }
      return null;
    } finally {
      setLoading(false);
    }
  };


  const login = async (email, password) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        const msg = error.message?.toLowerCase() || '';
        const isUnconfirmed = msg.includes('email not confirmed') || msg.includes('not confirmed') || msg.includes('unconfirmed');
        const isNotFound = msg.includes('invalid login credentials') || msg.includes('user not found');
        
        if (isUnconfirmed) {
          return {
            success: false,
            error: 'ईमेल अभी सत्यापित (Verify) नहीं हुआ है। कृपया अपने इनबॉक्स में जाकर वेरिफिकेशन लिंक पर क्लिक करें!'
          };
        }

        return {
          success: false,
          error: isNotFound
            ? 'गलत ईमेल अथवा पासवर्ड। यदि आपने अभी रजिस्टर किया है, तो पहले ईमेल लिंक से वेरिफाई करें या नया खाता बनाएं।'
            : error.message
        };
      }


      if (data?.user) {
        const profile = await fetchUserProfile(data.user.id, data.user);
        if (profile) {
          setCurrentUser(profile);
          setIsLoggedIn(true);
          return { success: true, user: profile };
        }
      }

      return {
        success: false,
        error: 'खाता नहीं मिला। कृपया पहले साइन अप (Sign Up) करें।'
      };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (email) => {
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false, // Strictly disallow OTP login for unregistered users
          emailRedirectTo: 'nirvighna://login'
        }
      });

      if (error) {
        const isNotSignedUp = error.message?.toLowerCase().includes('signups not allowed') ||
                              error.message?.toLowerCase().includes('user not found') ||
                              error.status === 400 ||
                              error.status === 422;
        return {
          success: false,
          error: isNotSignedUp
            ? 'इस ईमेल से कोई खाता नहीं मिला। कृपया पहले नीचे "साइन अप करें" (Sign Up) पर जाएं!'
            : error.message
        };
      }
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.message?.includes('Signups not allowed')
          ? 'इस ईमेल से कोई खाता नहीं मिला। कृपया पहले नीचे "साइन अप करें" (Sign Up) पर जाएं!'
          : err.message || 'Failed to send OTP'
      };
    }
  };

  const verifyOtp = async (email, token) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: 'email'
      });
      if (error) throw error;
      if (data?.user) {
        let profile = await fetchUserProfile(data.user.id);
        if (!profile) {
          const defaultName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const newProfile = {
            id: data.user.id,
            email: cleanEmail,
            full_name: data.user.user_metadata?.full_name || defaultName || 'Devotee',
            role: 'pilgrim',
            language_preference: 'en'
          };
          try {
            await supabase.from('users').upsert(newProfile);
          } catch (_) {}
          profile = newProfile;
        }
        localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(profile));
        setCurrentUser(profile);
        setIsLoggedIn(true);
        return { success: true, user: profile };
      }
      return { success: true, user: data?.user };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid or expired OTP' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    localStorage.removeItem('nirvighna_pilgrim_session');
    localStorage.removeItem('nirvighna_admin_session');
    sessionStorage.removeItem('nirvighna_pending_profile');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  // volunteer states
  const [medicalAlerts, setMedicalAlerts] = useState([
    { id: 'med_204', patient_name: 'Ramesh Patel', location: 'Somnath Gate #2 Line', blood_group: 'B+', allergies: 'Penicillin', condition: 'Severe Dizziness & Heat Fatigue', status: 'en_route', emergency_contact: 'Savitri Patel (+91 98765 99999)', group_members: ['Sunita P.', 'Amit P.'] }
  ]);
  const [lostCases, setLostCases] = useState([
    { id: 'lost_101', name: 'Aarav Sharma', age: 7, photo: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=300&q=80', description: 'Wearing blue kurta, last seen at Gomti Ghat Dwarka', reportedBy: 'Sunil Sharma (+91 98765 11111)', status: 'open' }
  ]);
  const [footwearTokens, setFootwearTokens] = useState([
    { token_id: 'FW-809', pilgrim_name: 'Harish Mehta', rack_no: 'Rack B-14', pair_count: 2, status: 'checked_in' }
  ]);

  const triggerMedicalAssist = (bookingInfo) => {
    const newAlert = {
      id: `med_${Math.floor(100 + Math.random() * 900)}`,
      patient_name: bookingInfo?.pilgrim_name || 'Pilgrim',
      location: `Gate #${bookingInfo?.gate_number || 2} Queue`,
      blood_group: bookingInfo?.blood_group || 'O+',
      allergies: bookingInfo?.allergies || 'None Reported',
      condition: 'Acute Distress / Heat Exhaustion',
      status: 'open',
      emergency_contact: bookingInfo?.emergency_contact || 'Registered Family Contact (+91 98765 43210)',
      group_members: ['Accompanying Family Member']
    };
    setMedicalAlerts(prev => [newAlert, ...prev]);
    return newAlert;
  };

  const updateAlertStatus = (alertId, newStatus) => {
    setMedicalAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
  };

  const updateLostCaseStatus = (caseId, newStatus) => {
    setLostCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
  };

  const issueFootwearToken = (pilgrimName, pairCount) => {
    const newToken = {
      token_id: `FW-${Math.floor(100 + Math.random() * 900)}`,
      pilgrim_name: pilgrimName || 'Pilgrim',
      rack_no: `Rack ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}-${Math.floor(1 + Math.random() * 30)}`,
      pair_count: pairCount || 1,
      status: 'checked_in'
    };
    setFootwearTokens(prev => [newToken, ...prev]);
    return newToken;
  };

  const checkoutFootwear = (tokenId) => {
    setFootwearTokens(prev => prev.map(f => f.token_id === tokenId ? { ...f, status: 'retrieved' } : f));
  };

  // booking states
  const [bookings, setBookings] = useState([]);


  const [isMelaMode, setIsMelaMode] = useState(false);
  const toggleMelaMode = () => setIsMelaMode(prev => !prev);

  const addBooking = (newBooking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        isLoggedIn,
        loading,
        login,
        sendOtp,
        verifyOtp,
        logout,
        fetchUserProfile,
        setCurrentUser,
        updateProfilePhoto: (photoUrl) => {
          setCurrentUser(prev => prev ? { ...prev, profile_photo: photoUrl } : prev);
        },
        medicalAlerts,
        lostCases,
        footwearTokens,
        triggerMedicalAssist,
        updateAlertStatus,
        updateLostCaseStatus,
        issueFootwearToken,
        checkoutFootwear,
        bookings,
        setBookings,
        addBooking,
        isMelaMode,
        toggleMelaMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
