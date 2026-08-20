import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/runtimeMode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // clear loading fallback
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 100);

    // check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        const savedPilgrim = localStorage.getItem('nirvighna_pilgrim_session');
        if (savedPilgrim) {
          try {
            const parsed = JSON.parse(savedPilgrim);
            setCurrentUser(parsed);
            setIsLoggedIn(true);
          } catch (_) {}
        } else if (isDemoMode) {
          const demoUser = {
            id: '00000000-0000-4000-a000-000000000077',
            full_name: 'Apex Coder',
            email: 'apex.coder@nirvighna.org',
            role: 'pilgrim',
            language_preference: 'en'
          };
          setCurrentUser(demoUser);
          setIsLoggedIn(true);
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Session fetch fallback:', err);
      const savedPilgrim = localStorage.getItem('nirvighna_pilgrim_session');
      if (savedPilgrim) {
        try {
          const parsed = JSON.parse(savedPilgrim);
          setCurrentUser(parsed);
          setIsLoggedIn(true);
        } catch (_) {}
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    // listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // create profile if missing
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: userData.user.email,
                full_name: userData.user.user_metadata?.full_name || 'User',
                role: 'pilgrim',
                language_preference: 'en',
              });
            
            if (insertError) {
              console.error('Error creating user profile:', insertError);
              throw insertError;
            }
            
            // fetch again after creating
            const { data: newData, error: newError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (newError) throw newError;
            setCurrentUser(newData);
            setIsLoggedIn(true);
            return newData;
          }
        } else {
          throw error;
        }
      }
      
      setCurrentUser(data);
      setIsLoggedIn(true);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setCurrentUser(null);
      setIsLoggedIn(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      let profile = null;

      // try supabase auth first
      if (email && password) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!error && data?.user) {
            profile = await fetchUserProfile(data.user.id);
          }
        } catch (_) {
          // fallback below
        }
      }

      if (profile) {
        setCurrentUser(profile);
        setIsLoggedIn(true);
        return { success: true, user: profile };
      }

      // fallback to local user
      const cleanEmail = (email || 'apex.coder@nirvighna.org').trim();
      const userName = cleanEmail.includes('@')
        ? cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Apex Coder';

      const userObj = {
        id: 'pilgrim_' + Math.floor(100000 + Math.random() * 900000),
        email: cleanEmail,
        full_name: userName || 'Devotee',
        role: 'pilgrim',
        language_preference: 'en'
      };

      localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(userObj));
      setCurrentUser(userObj);
      setIsLoggedIn(true);
      return { success: true, user: userObj };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
