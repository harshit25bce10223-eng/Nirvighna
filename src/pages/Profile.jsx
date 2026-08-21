import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { AppUpdateChecker } from '../components/AppUpdateChecker';
import { 
  User, ChevronLeft, LogOut, Globe, Shield, ChevronRight, 
  Loader2, Edit2, X, Check, Phone, Camera, Upload, Trash, Mail, AlertTriangle, Users, Sparkles
} from 'lucide-react';

const translations = {
  en: {
    profile: 'Pilgrim Profile & Settings',
    fullName: 'Full Name',
    phone: 'Mobile Phone',
    email: 'Email Address',
    role: 'Account Role',
    pilgrim: 'Registered Pilgrim',
    emergencyContact: 'Emergency Contact',
    language: 'Preferred Language',
    logout: 'Sign Out & Logout',
    edit: 'Edit',
    save: 'Save Changes',
    saving: 'Saving...',
    contactName: 'Contact Person Name',
    contactPhone: 'Emergency Phone Number',
    editProfile: 'Edit Personal Details',
    capturePhoto: 'Capture Photo',
    uploadPhoto: 'Upload from Gallery',
    deletePhoto: 'Remove Photo',
    chooseSource: 'Select Photo Source',
    cameraTitle: 'Live Camera Viewfinder',
    takeSnap: 'Take Snapshot',
    close: 'Close',
    cancel: 'Cancel',
    medProfileTitle: 'Medical Profile & Health Info',
    editHealth: 'Edit Health Details',
    bloodGroup: 'Blood Group',
    knownAllergies: 'Known Allergies',
    medConditions: 'Medical Conditions',
    chronicConditions: 'Chronic Illnesses / Conditions',
    chronicPlaceholder: 'e.g. Diabetes, Hypertension, Asthma',
    allergyPlaceholder: 'e.g. Penicillin, Dust, Sulfa',
    doctorContact: 'Family Doctor / Clinic Contact',
    doctorPlaceholder: 'Doctor Name & Phone',
    saveHealth: 'Save Health Info',
    none: 'None',
    noneReported: 'None Reported',
    logoutConfirm: 'Are you sure you want to sign out?',
    useFrontCamera: 'Use live front camera',
    pickFromFolder: 'Pick image from folder',
    resetAvatar: 'Reset profile avatar',
    cameraError: 'Could not access front camera. Please select Gallery instead.'
  },
  hi: {
    profile: 'तीर्थयात्री प्रोफाइल और सेटिंग्स',
    fullName: 'पूरा नाम',
    phone: 'मोबाइल फोन',
    email: 'ईमेल पता',
    role: 'खाता भूमिका',
    pilgrim: 'पंजीकृत तीर्थयात्री',
    emergencyContact: 'आपातकालीन संपर्क',
    language: 'पसंदीदा भाषा',
    logout: 'साइन आउट करें',
    edit: 'बदलें',
    save: 'सहेजें',
    saving: 'सहेज रहा हूँ...',
    contactName: 'संपर्क व्यक्ति का नाम',
    contactPhone: 'आपातकालीन फोन नंबर',
    editProfile: 'व्यक्तिगत विवरण बदलें',
    capturePhoto: 'फोटो खींचे',
    uploadPhoto: 'गैलरी से अपलोड करें',
    deletePhoto: 'फोटो हटाएं',
    chooseSource: 'फोटो का स्रोत चुनें',
    cameraTitle: 'लाइव कैमरा व्यूफाइंडर',
    takeSnap: 'फोटो खींचें',
    close: 'बंद करें',
    cancel: 'रद्द करें',
    medProfileTitle: 'मेडिकल प्रोफाइल और स्वास्थ्य जानकारी',
    editHealth: 'स्वास्थ्य विवरण बदलें',
    bloodGroup: 'ब्लड ग्रुप',
    knownAllergies: 'ज्ञात एलर्जी',
    medConditions: 'स्वास्थ्य स्थितियां',
    chronicConditions: 'पुरानी बीमारियां / स्वास्थ्य स्थितियां',
    chronicPlaceholder: 'जैसे: डायबिटीज, बीपी, दमा',
    allergyPlaceholder: 'जैसे: धूल, पेनिसिलिन, सल्फा',
    doctorContact: 'पारिवारिक डॉक्टर / क्लिनिक संपर्क',
    doctorPlaceholder: 'डॉक्टर का नाम और फोन',
    saveHealth: 'स्वास्थ्य जानकारी सहेजें',
    none: 'कोई नहीं',
    noneReported: 'कोई नहीं',
    logoutConfirm: 'क्या आप वाकई साइन आउट करना चाहते हैं?',
    useFrontCamera: 'लाइव फ्रंट कैमरा उपयोग करें',
    pickFromFolder: 'गैलरी / फोल्डर से चुनें',
    resetAvatar: 'प्रोफाइल फोटो हटाएं',
    cameraError: 'कैमरा चालू नहीं हो सका। कृपया गैलरी चुनें।'
  },
  gu: {
    profile: 'તીર્થયાત્રી પ્રોફાઇલ અને સેટિંગ્સ',
    fullName: 'પૂરું નામ',
    phone: 'મોબાઇલ ફોન',
    email: 'ઈમેલ સરનામું',
    role: 'ખાતાની ભૂમિકા',
    pilgrim: 'નોંધાયેલ યાત્રાળુ',
    emergencyContact: 'કટોકટી સંપર્ક',
    language: 'પસંદગીની ભાષા',
    logout: 'સાઇન આઉટ કરો',
    edit: 'બદલો',
    save: 'સાચવો',
    saving: 'સાચવી રહ્યું છે...',
    contactName: 'સંપર્ક વ્યક્તિનું નામ',
    contactPhone: 'કટોકટીનો ફોન નંબર',
    editProfile: 'વ્યક્તિગત વિગત બદલો',
    capturePhoto: 'ફોટો પાડો',
    uploadPhoto: 'ગેલેરીમાંથી અપલોડ કરો',
    deletePhoto: 'ફોટો દૂર કરો',
    chooseSource: 'ફોટો સ્ત્રોત પસંદ કરો',
    cameraTitle: 'લાઇવ કેમેરા વ્યૂફાઇન્ડર',
    takeSnap: 'સ્નેપશોટ લો',
    close: 'બંધ કરો',
    cancel: 'રદ કરો',
    medProfileTitle: 'મેડિકલ પ્રોફાઇલ અને આરોગ્ય વિગત',
    editHealth: 'આરોગ્ય વિગત સંપાદિત કરો',
    bloodGroup: 'બ્લડ ગ્રૂપ',
    knownAllergies: 'એલર્જી',
    medConditions: 'તબીબી સ્થિતિ',
    chronicConditions: 'ક્રોનિક બીમારીઓ / સ્થિતિઓ',
    chronicPlaceholder: 'દા.ત. ડાયાબિટીસ, બીપી, અસ્થમા',
    allergyPlaceholder: 'દા.ત. પેનિસિલિન, ધૂળ',
    doctorContact: 'ફેમિલી ડૉક્ટર / ક્લિનિક સંપર્ક',
    doctorPlaceholder: 'ડૉક્ટરનું નામ અને ફોન',
    saveHealth: 'આરોગ્ય વિગત સાચવો',
    none: 'કોઈ નહીં',
    noneReported: 'કોઈ નોંધ નથી',
    logoutConfirm: 'શું તમે ખરેખર સાઇન આઉટ કરવા માંગો છો?',
    useFrontCamera: 'લાઇવ કેમેરા વાપરો',
    pickFromFolder: 'ગેલેરીમાંથી ફોટો પસંદ કરો',
    resetAvatar: 'પ્રોફાઇલ ફોટો દૂર કરો',
    cameraError: 'કેમેરા ખૂલી શક્યો નહીં. કૃપા કરીને ગેલેરી પસંદ કરો.'
  }
};

export const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  // Personal Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Emergency Contact State
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '' });
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);

  // Medical Profile State (Blood group, conditions, allergies)
  const [medicalProfile, setMedicalProfile] = useState({
    bloodGroup: 'B+',
    conditions: 'None Reported',
    allergies: 'None',
    doctorContact: 'Dr. R. K. Sharma (+91 98765 12345)'
  });
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);

  const [showPhotoSource, setShowPhotoSource] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showManualUpdateCheck, setShowManualUpdateCheck] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.full_name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileEmail(currentUser.email || '');
      
      // Load custom profile photo from localStorage
      const cachedPhoto = localStorage.getItem(`nirvighna_avatar_${currentUser.id}`);
      if (cachedPhoto) {
        setProfilePhoto(cachedPhoto);
      }

      // Load custom medical profile from localStorage
      const savedMed = localStorage.getItem(`nirvighna_medical_profile_${currentUser.id}`);
      if (savedMed) {
        try { setMedicalProfile(JSON.parse(savedMed)); } catch (e) {}
      }

      fetchEmergencyContact();
    }
  }, [currentUser]);

  const handleSaveMedicalProfile = (e) => {
    e.preventDefault();
    setSavingMedical(true);
    try {
      localStorage.setItem(`nirvighna_medical_profile_${currentUser?.id || 'demo'}`, JSON.stringify(medicalProfile));
      if (currentUser) {
        currentUser.medical_profile = medicalProfile;
      }
      setIsEditingMedical(false);
    } catch (e) {}
    finally { setSavingMedical(false); }
  };

  const isRealDbUser = (user) => {
    return Boolean(user?.id && !user.id.startsWith('demo_') && user.id !== '00000000-0000-4000-a000-000000000077');
  };

  const fetchEmergencyContact = async () => {
    if (!currentUser) return;
    try {
      const savedLocal = localStorage.getItem(`nirvighna_emergency_${currentUser.id}`);
      if (savedLocal) {
        setEmergencyContact(JSON.parse(savedLocal));
      }

      if (isRealDbUser(currentUser)) {
        const { data, error } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('pilgrim_id', currentUser.id)
          .maybeSingle();

        if (!error && data) {
          setEmergencyContact({ name: data.contact_name || data.name || '', phone: data.contact_phone || data.phone || '' });
        }
      }
    } catch (err) {
      console.warn('Fallback to local emergency contact:', err);
    }
  };

  const handleSaveProfileDetails = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingProfile(true);
    try {
      // 1. Force session updates locally
      currentUser.full_name = profileName;
      currentUser.phone = profilePhone;
      currentUser.email = profileEmail;
      setIsEditingProfile(false);

      // 2. Only update users table in Supabase if real authenticated DB user
      if (isRealDbUser(currentUser)) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: profileName,
            phone: profilePhone,
            email: profileEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (error) throw error;
      }
    } catch (err) {
      console.warn('DB update skipped or failed, saved profile edits locally:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmergencyContact = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingEmergency(true);
    try {
      localStorage.setItem(`nirvighna_emergency_${currentUser.id}`, JSON.stringify(emergencyContact));
      setIsEditingEmergency(false);

      if (isRealDbUser(currentUser)) {
        await supabase
          .from('emergency_contacts')
          .upsert({
            pilgrim_id: currentUser.id,
            name: emergencyContact.name,
            phone: emergencyContact.phone,
            updated_at: new Date().toISOString()
          }, { onConflict: 'pilgrim_id' });
      }
    } catch (err) {
      console.warn('Saved emergency contact locally:', err);
    } finally {
      setSavingEmergency(false);
    }
  };

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    if (currentUser) {
      currentUser.language_preference = newLang;
      if (isRealDbUser(currentUser)) {
        try {
          await supabase
            .from('users')
            .update({ language_preference: newLang })
            .eq('id', currentUser.id);
        } catch (err) {
          console.warn('Language updated in session:', err);
        }
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t.logoutConfirm || 'Are you sure you want to sign out?')) {
      await logout();
      navigate('/login');
    }
  };

  // --- Photo Upload Handling ---

  const handleGalleryClick = () => {
    setShowPhotoSource(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        setProfilePhoto(base64Data);
        if (currentUser) {
          localStorage.setItem(`nirvighna_avatar_${currentUser.id}`, base64Data);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- WebRTC Live Camera Capture Handling ---

  const handleStartCamera = async () => {
    setShowPhotoSource(false);
    setShowCameraModal(true);
    setCameraLoading(true);
    setCameraError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 400, height: 400 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera open error:', err);
      setCameraError(t.cameraError || 'Could not access front camera. Please select Gallery instead.');
    } finally {
      setCameraLoading(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const capturedDataUrl = canvas.toDataURL('image/jpeg');
      setProfilePhoto(capturedDataUrl);
      if (currentUser) {
        localStorage.setItem(`nirvighna_avatar_${currentUser.id}`, capturedDataUrl);
      }

      handleCloseCamera();
    }
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const handleDeletePhoto = () => {
    setProfilePhoto('');
    if (currentUser) {
      localStorage.removeItem(`nirvighna_avatar_${currentUser.id}`);
    }
    setShowPhotoSource(false);
  };

  return (
    <div className="min-h-screen bg-ivory pt-5 pb-10 px-3.5 sm:px-6 font-body animate-page-in">
      <div className="max-w-2xl mx-auto space-y-5">
        
        {/* Hidden inputs & reference nodes */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange} 
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Profile Hero Banner */}
        <div className="bg-gradient-to-br from-maroon to-[#4A1017] rounded-3xl overflow-hidden relative">
          {/* Back button */}
          <button
            onClick={() => navigate('/home')}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all cursor-pointer z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="p-5 flex items-center gap-4 relative z-10">
            {/* Avatar with glow ring */}
            <div
              onClick={() => setShowPhotoSource(true)}
              className="relative cursor-pointer group shrink-0"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gold shadow-goldGlow bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-2xl text-white font-heading">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : '🙏'
                )}
              </div>
              {/* Camera overlay */}
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              {/* Edit badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center border-2 border-maroon shadow-xs">
                <Edit2 className="w-2.5 h-2.5 text-indigo-dark" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-white font-heading truncate">
                {currentUser?.full_name || 'Pilgrim'}
              </h2>
              <p className="text-xs text-amber-200/80 font-medium flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {currentUser?.phone || '+91 98765 43210'}
              </p>
              <span className="inline-block text-[10px] font-extrabold text-indigo-dark bg-gold px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
                {currentUser?.user_metadata?.role ? currentUser.user_metadata.role : '🙏 ' + t.pilgrim}
              </span>
            </div>
          </div>

          {/* Language switcher inside banner */}
          <div className="px-5 pb-4 flex gap-2">
            {[
              { code: 'hi', label: '🇮🇳 हिन्दी' },
              { code: 'gu', label: '🔱 ગુજ' },
              { code: 'en', label: '🌍 EN' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex-1 text-center ${
                  currentLanguage === lang.code
                    ? 'bg-gold text-indigo-dark shadow-goldGlow'
                    : 'bg-white/15 text-white/80 hover:bg-white/25'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Edit Personal Details Section */}
        <div className="bg-white p-4 rounded-3xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-2 font-heading">
              <User className="w-4 h-4 text-maroon" />
              {t.editProfile}
            </span>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-xs font-bold text-maroon hover:text-white hover:bg-maroon px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> {t.edit}
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfileDetails} className="space-y-3 pt-1 animate-in fade-in">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.fullName}</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.phone}</label>
                <input
                  type="tel"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.email}</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-bold"
                />
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 py-2 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {savingProfile ? t.saving : t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-ivory p-3 rounded-2xl">
                <p className="text-gray-400 font-semibold mb-0.5">{t.fullName}</p>
                <p className="font-bold text-gray-800">{currentUser?.full_name || 'Pilgrim'}</p>
              </div>
              <div className="bg-ivory p-3 rounded-2xl">
                <p className="text-gray-400 font-semibold mb-0.5">{t.email}</p>
                <p className="font-bold text-gray-800 truncate">{currentUser?.email || 'your@email.com'}</p>
              </div>
            </div>
          )}
        </div>


        {/* Editable Emergency Contact Card */}
        <div className="bg-white p-4 rounded-3xl shadow-warm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-2 font-heading">
              <Shield className="w-4 h-4 text-alertRed" />
              {t.emergencyContact}
            </span>
            {!isEditingEmergency && (
              <button
                onClick={() => setIsEditingEmergency(true)}
                className="text-xs font-bold text-maroon hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> {t.edit}
              </button>
            )}
          </div>

          {isEditingEmergency ? (
            <form onSubmit={handleSaveEmergencyContact} className="space-y-2.5 pt-1 animate-in fade-in">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.contactName}</label>
                <input
                  type="text"
                  required
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                  placeholder={t.contactName}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.contactPhone}</label>
                <input
                  type="tel"
                  required
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                  placeholder={t.contactPhone}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-mono font-bold"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingEmergency}
                  className="flex-1 py-2.5 bg-maroon hover:bg-maroon-dark text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  {savingEmergency ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingEmergency(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-ivory p-3 rounded-2xl">
                <p className="text-gray-400 font-semibold mb-0.5">{t.contactName}</p>
                <p className="font-bold text-gray-800">{emergencyContact.name || 'N/A'}</p>
              </div>
              <div className="bg-ivory p-3 rounded-2xl">
                <p className="text-gray-400 font-semibold mb-0.5">{t.contactPhone}</p>
                <p className="font-bold text-gray-800 font-mono">{emergencyContact.phone || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Editable Medical & Health Profile Card */}
        <div className="bg-white p-4 rounded-3xl shadow-warm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-2 font-heading">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {t.medProfileTitle}
            </span>
            {!isEditingMedical && (
              <button
                onClick={() => setIsEditingMedical(true)}
                className="text-xs font-bold text-maroon hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> {t.editHealth}
              </button>
            )}
          </div>

          {isEditingMedical ? (
            <form onSubmit={handleSaveMedicalProfile} className="space-y-2.5 pt-1 animate-in fade-in">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.bloodGroup}</label>
                <select
                  value={medicalProfile.bloodGroup}
                  onChange={(e) => setMedicalProfile({ ...medicalProfile, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-gold"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.chronicConditions}</label>
                <input
                  type="text"
                  value={medicalProfile.conditions}
                  onChange={(e) => setMedicalProfile({ ...medicalProfile, conditions: e.target.value })}
                  placeholder={t.chronicPlaceholder}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.knownAllergies}</label>
                <input
                  type="text"
                  value={medicalProfile.allergies}
                  onChange={(e) => setMedicalProfile({ ...medicalProfile, allergies: e.target.value })}
                  placeholder={t.allergyPlaceholder}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">{t.doctorContact}</label>
                <input
                  type="text"
                  value={medicalProfile.doctorContact}
                  onChange={(e) => setMedicalProfile({ ...medicalProfile, doctorContact: e.target.value })}
                  placeholder={t.doctorPlaceholder}
                  className="w-full px-3 py-2 bg-ivory border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold font-bold"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingMedical}
                  className="flex-1 py-2.5 bg-gold text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow flex items-center justify-center gap-1 cursor-pointer"
                >
                  {savingMedical ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {t.saveHealth}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMedical(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                <p className="text-gray-500 font-semibold mb-0.5">{t.bloodGroup}</p>
                <p className="font-black text-amber-900 text-sm font-mono">{medicalProfile.bloodGroup || 'B+'}</p>
              </div>
              <div className="bg-ivory p-3 rounded-2xl">
                <p className="text-gray-400 font-semibold mb-0.5">{t.knownAllergies}</p>
                <p className="font-bold text-gray-800">{medicalProfile.allergies || t.none}</p>
              </div>
              <div className="bg-ivory p-3 rounded-2xl col-span-2">
                <p className="text-gray-400 font-semibold mb-0.5">{t.medConditions}</p>
                <p className="font-bold text-gray-800">{medicalProfile.conditions || t.noneReported}</p>
              </div>
            </div>
          )}
        </div>

        {/* App Version & Updates */}
        <div className="bg-white p-4 rounded-3xl border border-gold/20 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-gold/40 flex items-center justify-center p-1 shadow-inner overflow-hidden">
              <img src="/official_logo.png" alt="Nirvighna Emblem" className="w-full h-full object-contain drop-shadow-xs" />
            </div>
            <div>
              <p className="text-xs font-black text-indigo-dark font-heading">Nirvighna Pilgrim</p>
              <p className="text-[10px] font-bold text-gray-500">Version 1.0.3 (Build 4)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowManualUpdateCheck(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-maroon text-[11px] font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <span>{currentLanguage === 'gu' ? 'અપડેટ તપાસો' : currentLanguage === 'hi' ? 'अपडेट जांचें' : 'Check Updates'}</span>
          </button>
        </div>

        {showManualUpdateCheck && (
          <AppUpdateChecker
            manualCheck={true}
            onCheckComplete={() => {}}
          />
        )}

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs rounded-3xl shadow-md uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>

      </div>

      {/* Profile Photo Source Picker Modal Overlay */}
      {showPhotoSource && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xs w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-indigo-dark font-heading">{t.chooseSource}</h4>
                <button onClick={() => setShowPhotoSource(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleStartCamera}
                  className="w-full p-3 bg-ivory hover:bg-gold/10 border border-gray-200 hover:border-gold rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/20 text-maroon flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{t.capturePhoto}</p>
                    <p className="text-[10px] text-gray-500">{t.useFrontCamera}</p>
                  </div>
                </button>

                <button
                  onClick={handleGalleryClick}
                  className="w-full p-3 bg-ivory hover:bg-gold/10 border border-gray-200 hover:border-gold rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50/20 text-emerald-700 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{t.uploadPhoto}</p>
                    <p className="text-[10px] text-gray-500">{t.pickFromFolder}</p>
                  </div>
                </button>

                {profilePhoto && (
                  <button
                    onClick={handleDeletePhoto}
                    className="w-full p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl flex items-center gap-3 text-left transition-all text-red-700 font-bold cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <Trash className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{t.deletePhoto}</p>
                      <p className="text-[10px] text-red-500">{t.resetAvatar}</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WebRTC Live Camera Capture Viewfinder Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-200 font-body">
            <div className="bg-indigo-dark text-white p-4 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-ivory font-heading">{t.cameraTitle}</h4>
              <button onClick={handleCloseCamera} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center gap-4">
              {cameraLoading && (
                <div className="w-72 h-72 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <NirvighnaLoader message={t.cameraTitle} />
                </div>
              )}

              {cameraError && (
                <div className="w-72 h-72 rounded-2xl bg-red-50 border border-red-200 p-4 flex flex-col items-center justify-center text-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <p className="text-xs text-red-700 font-bold">{cameraError}</p>
                </div>
              )}

              {/* Live WebRTC HTML Video Output Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-72 h-72 rounded-2xl object-cover border-2 border-gold ${
                  cameraLoading || cameraError ? 'hidden' : 'block'
                }`}
              />

              <div className="flex gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  disabled={cameraLoading || !!cameraError}
                  className="flex-1 py-3 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow uppercase transition-all cursor-pointer"
                >
                  {t.takeSnap}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
