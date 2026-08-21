import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/runtimeMode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuthSession = async () => {
      try {
        // 1. Check for incoming Supabase Auth redirect tokens in URL hash or search
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        let accessToken = null;
        let refreshToken = null;

        if (hash.includes('access_token=') || search.includes('access_token=')) {
          const rawParams = hash.includes('access_token=')
            ? hash.replace(/^#\/?/, '')
            : search.replace(/^\?/, '');
          const params = new URLSearchParams(rawParams);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
        } else {
          accessToken = sessionStorage.getItem('sb_incoming_access_token');
          refreshToken = sessionStorage.getItem('sb_incoming_refresh_token');
          sessionStorage.removeItem('sb_incoming_access_token');
          sessionStorage.removeItem('sb_incoming_refresh_token');
        }

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (data?.session?.user && isMounted) {
            const u = data.session.user;
            await fetchUserProfile(u.id, u);
            // Clean redirect to home
            if (window.location.hash.includes('access_token') || !window.location.hash.includes('#/')) {
              window.location.hash = '#/home';
            }
            setLoading(false);
            return;
          }
        }

        // 2. Normal getSession check
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

    // 3. Listen for Supabase auth state changes (e.g. Magic Link click)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && isMounted) {
          await fetchUserProfile(session.user.id, session.user);
          if (window.location.hash.includes('access_token')) {
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
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId, fallbackUser = null) => {
    try {
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
        const isNotFound = error.message?.toLowerCase().includes('invalid login credentials') ||
                           error.message?.toLowerCase().includes('user not found');
        return {
          success: false,
          error: isNotFound
            ? 'खाता नहीं मिला या गलत पासवर्ड। कृपया पहले "साइन अप करें" (Sign Up) पर जाकर नया खाता बनाएं।'
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
          shouldCreateUser: false // Strictly disallow OTP login for unregistered users
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
  const [bookings, setBookings] = useState([
    {
      id: 'bk_somnath_9042',
      temple_id: 'tmp_somnath',
      temple_name: 'Shri Somnath Jyotirlinga',
      gate_number: 2,
      slot_time: '04:00 PM - 05:00 PM',
      date: '2026-08-20',
      qr_code: 'NIRVIGHNA-SOM-9042',
      status: 'confirmed',
      is_priority: false,
      shared_booking_code: 'KV-8921',
      qr_passes: [
        {
          id: 'pass_1',
          pilgrim_name: 'Apex Coder',
          qr_value: 'KV-8921-APEX-CODER',
          scan_status: 'not_scanned',
          is_valid: true
        },
        {
          id: 'pass_2',
          pilgrim_name: 'Varun Bansal',
          qr_value: 'KV-8921-VARUN-BANSAL',
          scan_status: 'not_scanned',
          is_valid: true
        },
        {
          id: 'pass_3',
          pilgrim_name: 'Tanvi Agarwal',
          qr_value: 'KV-8921-TANVI-AGARWAL',
          scan_status: 'not_scanned',
          is_valid: true
        },
        {
          id: 'pass_4',
          pilgrim_name: 'Harshit Jain',
          qr_value: 'KV-8921-HARSHIT-JAIN',
          scan_status: 'not_scanned',
          is_valid: true
        },
        {
          id: 'pass_5',
          pilgrim_name: 'Lokesh Kasana',
          qr_value: 'KV-8921-LOKESH-KASANA',
          scan_status: 'not_scanned',
          is_valid: true
        },
        {
          id: 'pass_6',
          pilgrim_name: 'Navya Agarwal',
          qr_value: 'KV-8921-NAVYA-AGARWAL',
          scan_status: 'not_scanned',
          is_valid: true
        }
      ]
    }
  ]);

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
