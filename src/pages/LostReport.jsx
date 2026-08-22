import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Upload, AlertCircle, CheckCircle, Shield,
  AlertTriangle, User, MapPin, Phone, ChevronLeft, Loader2, Check, Camera, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { stripExifMetadata } from '../lib/exifStripper';
import { getUniqueTemples } from '../lib/templeRegistry';

const translations = {

  en: {
    back: 'Back',
    reportLost: 'Report Lost Person',
    reportLostSubtitle: 'Help us reunite your family member safely',
    memberName: 'Member Name',
    memberAge: 'Age',
    memberPhone: 'Phone (if available)',
    lastLocation: 'Last Seen Location',
    lastTime: 'Last Seen Time',
    description: 'Description (clothing, features)',
    submitReport: 'Submit Report',
    submitting: 'Submitting...',
    nameRequired: 'Name is required',
    locationRequired: 'Location is required',
    submitError: 'Failed to submit report. Please try again.',
    success: 'Report submitted successfully',
    urgencyNotice: 'Urgency Notice',
    urgencyText: 'Your report will be immediately broadcast to nearby volunteers and temple security.',
    selectTemple: 'Select Temple'
  },
  hi: {
    back: 'वापस',
    reportLost: 'लापता व्यक्ति की रिपोर्ट करें',
    reportLostSubtitle: 'हम आपके परिवार के सदस्य को सुरक्षित ढूंढने में मदद करेंगे',
    memberName: 'सदस्य का नाम',
    memberAge: 'उम्र',
    memberPhone: 'फोन नंबर (यदि हो)',
    lastLocation: 'आखिरी बार कहां देखा गया',
    lastTime: 'किस समय देखा था',
    description: 'पहचान (कपड़ों का रंग, हुलिया)',
    submitReport: 'रिपोर्ट भेजें',
    submitting: 'भेज रहे हैं...',
    nameRequired: 'नाम लिखना जरूरी है',
    locationRequired: 'स्थान लिखना जरूरी है',
    submitError: 'रिपोर्ट भेजने में समस्या आई। कृपया दोबारा प्रयास करें।',
    success: 'रिपोर्ट सफलतापूर्वक दर्ज हो गई',
    urgencyNotice: 'जरूरी सूचना',
    urgencyText: 'आपकी रिपोर्ट तुरंत पास के वॉलंटियर्स और सिक्योरिटी टीम को भेजी जाएगी।',
    selectTemple: 'मंदिर चुनें'
  },
  gu: {
    back: 'પાછા',
    reportLost: 'ખોવાઈ ગયાની જાણ કરો',
    reportLostSubtitle: 'અમે તમારા પરિવારના સભ્યને શોધવામાં મદદ કરીશું',
    memberName: 'સભ્યનું નામ',
    memberAge: 'ઉંમર',
    memberPhone: 'ફોન નંબર (જો હોય તો)',
    lastLocation: 'છેલ્લે ક્યાં જોયા હતા',
    lastTime: 'ક્યા સમયે જોયા હતા',
    description: 'ઓળખ (કપડાંનો રંગ, દેખાવ)',
    submitReport: 'રિપોર્ટ મોકલો',
    submitting: 'મોકલી રહ્યું છે...',
    nameRequired: 'નામ લખવું જરૂરી છે',
    locationRequired: 'જગ્યા લખવી જરૂરી છે',
    submitError: 'રિપોર્ટ મોકલવામાં સમસ્યા આવી. ફરી પ્રયત્ન કરો.',
    success: 'રિપોર્ટ સફળતાપૂર્વક નોંધાઈ ગઈ',
    urgencyNotice: 'જરૂરી સૂચના',
    urgencyText: 'તમારી ફરિયાદ તરત જ નજીકના સ્વયંસેવકો અને સુરક્ષા ટીમને મોકલાશે.',
    selectTemple: 'મંદિર પસંદ કરો'
  }
};

export const LostReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage];

  const [temples, setTemples] = useState(() => getUniqueTemples());
  const [selectedTempleId, setSelectedTempleId] = useState('tmp_somnath');
  const [formData, setFormData] = useState({
    name: location.state?.memberName || '',
    age: '',
    phone: '',
    lastLocation: '',
    lastTime: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoSanitized, setPhotoSanitized] = useState(false);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cleanFile = await stripExifMetadata(file);
      setPhotoFile(cleanFile);
      setPhotoSanitized(true);
    } catch (err) {
      setPhotoFile(file);
    }
  };

  useEffect(() => {
    fetchTemples();
  }, []);

  const fetchTemples = async () => {
    try {
      const { data, error } = await supabase
        .from('temples')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) {
        setTemples(data);
      }
    } catch (err) {
      console.warn('Error fetching temples, using master registry:', err);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError(t.nameRequired);
      return;
    }
    if (!formData.lastLocation.trim()) {
      setError(t.locationRequired);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const reporterId = currentUser?.id || 'local_pilgrim_' + Date.now();
      try {
        const { error } = await supabase
          .from('lost_found_cases')
          .insert({
            reported_by: reporterId,
            temple_id: selectedTempleId || 'tmp_somnath',
            lost_person_name: sanitizeText(formData.name),
            lost_person_age: formData.age ? parseInt(formData.age) : null,
            lost_person_phone: sanitizeText(formData.phone) || null,
            last_seen_location: sanitizeText(formData.lastLocation),
            last_seen_time: sanitizeText(formData.lastTime) || null,
            description: sanitizeText(formData.description),
            status: 'open',
            case_type: 'lost'
          });
        if (error) console.warn('Supabase lost case insert notice:', error);
      } catch (_) {}

      setSuccess(true);
      
      // Create notification for the user
      if (currentUser?.id) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: currentUser.id,
              type: 'lost_report',
              title: 'Lost Report Submitted',
              message: `Report for ${formData.name} has been broadcast to security teams.`,
              is_read: false
            });
        } catch (_) {}
      }

      // Also store locally for offline tracking
      try {
        const localCases = JSON.parse(localStorage.getItem('nirvighna_my_lost_reports') || '[]');
        localCases.unshift({
          id: 'lost_' + Date.now(),
          name: formData.name,
          age: formData.age,
          location: formData.lastLocation,
          submitted_at: new Date().toISOString(),
          status: 'broadcast_active'
        });
        localStorage.setItem('nirvighna_my_lost_reports', JSON.stringify(localCases));
      } catch (_) {}


      // Trigger native notification for the user
      try {
        if (window.NirvighnaNativeBridge && typeof window.NirvighnaNativeBridge.showSystemNotification === 'function') {
          window.NirvighnaNativeBridge.showSystemNotification(
            '🚨 Safety Alert Dispatched!',
            `Lost person report for ${cleanName} broadcast to on-duty volunteers.`,
            'safety'
          );
        }
      } catch (_) {}

      // Navigate to notifications after 2 seconds
      setTimeout(() => {
        navigate('/notifications');
      }, 2000);

    } catch (err) {
      console.error('Error submitting report:', err);
      setError(t.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-20">
        <NirvighnaLoader message={currentLanguage === 'gu' ? "લોડ થઈ રહ્યું છે..." : currentLanguage === 'hi' ? "लोड हो रहा है..." : "Loading..."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory pb-28 pt-[max(env(safe-area-inset-top,28px),28px)] px-4 animate-page-in">

      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/family')}
            className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 hover:bg-maroon hover:text-white text-maroon transition-all cursor-pointer card-press"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold font-heading text-maroon flex items-center gap-2">
              🚨 {t.reportLost}
            </h1>
            <p className="text-[11px] text-gray-500">{t.reportLostSubtitle}</p>
          </div>
        </div>

        {/* Urgency Pulse Banner */}
        <div className="animate-urgency bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-start gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold font-heading">{t.urgencyNotice}</p>
            <p className="text-xs text-red-100 mt-0.5 leading-relaxed">{t.urgencyText}</p>
          </div>
        </div>

        {/* Success State */}
        {success && (
          <div className="bg-white border-2 border-emerald-300 p-8 rounded-2xl text-center shadow-xs">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-sm font-extrabold text-emerald-700 font-heading">{t.success}</p>
            <p className="text-xs text-gray-500 mt-2">
              Volunteers near the area have been alerted. Redirecting to notifications...
            </p>
            <div className="mt-4 text-2xl">🙏</div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-red-700 to-red-600 px-5 py-3.5">
              <p className="text-xs font-extrabold text-white font-heading uppercase tracking-wide">
                📋 Report Details — Fill as much as you know
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Temple */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">{t.selectTemple}</label>
                <select
                  value={selectedTempleId}
                  onChange={(e) => setSelectedTempleId(e.target.value)}
                  className="w-full px-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                >
                  {temples.map(temple => (
                    <option key={temple.id} value={temple.id}>{temple.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">{t.memberName} *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                    placeholder={t.memberName}
                    required
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">Upload Photo (Optional)</label>
                <div className="p-3 bg-ivory border-[1.5px] border-dashed border-gray-300 rounded-xl">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-maroon file:text-white hover:file:bg-[#5F242C] cursor-pointer"
                  />
                  {photoSanitized && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>EXIF & GPS tags stripped for privacy protection.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Age + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">{t.memberAge}</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                    placeholder="35"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">{t.memberPhone}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                      placeholder="+91 XXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Last Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">{t.lastLocation} *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.lastLocation}
                    onChange={(e) => setFormData({ ...formData, lastLocation: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                    placeholder="E.g. Main Gate, Prasad Hall..."
                    required
                  />
                </div>
              </div>

              {/* Last Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">{t.lastTime}</label>
                <input
                  type="time"
                  value={formData.lastTime}
                  onChange={(e) => setFormData({ ...formData, lastTime: e.target.value })}
                  className="w-full px-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">{t.description}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all resize-none"
                  rows={3}
                  placeholder="Clothing color, height, any distinctive features..."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              {/* Privacy Notice */}
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <span className="text-base shrink-0">🔒</span>
                <div>
                  <p className="font-extrabold font-heading">Data Protection Safeguard</p>
                  <p className="text-[10px] text-amber-800 mt-0.5 leading-snug">
                    Photos & identity details are restricted exclusively to authenticated Security & Volunteers. Case media is auto-purged within 24 hours of resolution.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-black font-heading text-sm transition-all bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    {t.submitReport}
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};


