import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { melaEngine } from '../lib/melaEngine';
import { cctvHeatmapService } from '../lib/cctvHeatmapService';
import { sendPilgrimNotification } from '../lib/notificationService';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { 
  MapPin, CheckCircle, ChevronLeft, Loader2, Play, 
  AlertTriangle, Shield, Clock, PhoneCall, HelpCircle,
  Globe, Radio, Footprints
} from 'lucide-react';

const translations = {
  en: {
    title: 'Padyatri Route Tracking',
    subtitle: 'Bhadarvi Poonam Safety Portal',
    activeMela: 'Bhadarvi Poonam Mode Active',
    liveSafetyTrack: 'Live Safety Track',
    bleCardTitle: '📡 Padyatri Waypoint Checkpoints & BLE Hardware Roadmap',
    bleCheckedIn: 'Padyatris Checked-In',
    bleNote: 'Live Web Check-In active. Continuous passive BLE beacon scanning is scheduled for Native App (Phase 2).',
    checkinSuccess: 'Check-in Recorded Successfully!',
    currentStation: 'Current Station',
    nextStation: 'Next Station',
    checkinBtn: 'Check In Here',
    passed: 'Passed ✓',
    completed: 'Completed',
    emergencyContact: 'Assistance Helpline',
    talkToMarshal: 'Talk to checkpoint marshal',
    callHelpline: 'Call Helpline',
    walkTime: 'Est. walking time',
    mins: 'mins',
    loading: 'Loading padyatri route...',
    safetyTip: 'Padyatri Safety Advisory: Stay hydrated with ORS. Rest camps and medical tents available at every checkpoint.',
    delayAlertTitle: 'Padyatri Concern Alert',
    delayAlertDesc: 'System detected a delay. No check-in recorded for past {duration} mins since last checkpoint ({checkpoint}). Nearest volunteers have been notified.',
    routeStationsTitle: 'Route Stations Checklist',
    lastCheckin: 'Last station check-in time:',
    walkers: 'walkers',
    densityNormal: 'Normal flow',
    densityHigh: 'High Walking Volume',
    densityEntry: 'Normal Entry',
  },
  hi: {
    title: 'पदयात्री मार्ग सुरक्षा ट्रैकिंग',
    subtitle: 'भादरवी पूनम महाकुंभ सुरक्षा पोर्टल',
    activeMela: 'भादरवी पूनम पदयात्रा मेला सक्रिय',
    liveSafetyTrack: 'लाइव सुरक्षा ट्रैकिंग',
    bleCardTitle: '📡 पदयात्री चेकपॉइंट एवं BLE हार्डवेयर ट्रैकिंग',
    bleCheckedIn: 'पदयात्री चेक-इन दर्ज',
    bleNote: 'लाइव वेब चेक-इन सक्रिय है। निरंतर पैसिव BLE बीकन स्कैनिंग मोबाइल ऐप में सक्रिय है।',
    checkinSuccess: 'चेक-इन सफलतापूर्वक दर्ज किया गया!',
    currentStation: 'वर्तमान स्टेशन',
    nextStation: 'अगला स्टेशन',
    checkinBtn: 'यहाँ चेक-इन करें',
    passed: 'पार किया ✓',
    completed: 'पूर्ण',
    emergencyContact: 'सहायता हेल्पलाइन',
    talkToMarshal: 'चेकपॉइंट सुरक्षा मार्शल से बात करें',
    callHelpline: 'हेल्पलाइन कॉल करें',
    walkTime: 'अनुमानित चलने का समय',
    mins: 'मिनट',
    loading: 'पदयात्री मार्ग लोड हो रहा है...',
    safetyTip: 'पदयात्री सुरक्षा सलाह: ओआरएस (ORS) जल का सेवन करते रहें। प्रत्येक चेकपॉइंट पर प्राथमिक उपचार व विश्राम शिविर उपलब्ध हैं।',
    delayAlertTitle: 'पदयात्री सुरक्षा चेतावनी',
    delayAlertDesc: 'सिस्टम द्वारा विलंब पाया गया। पिछले {checkpoint} चेकपॉइंट से {duration} मिनट तक चेक-इन नहीं हुआ। नजदीकी स्वयंसेवकों को सतर्क कर दिया गया है।',
    routeStationsTitle: 'पदयात्रा मार्ग स्टेशन चेकलिस्ट',
    lastCheckin: 'अंतिम स्टेशन चेक-इन समय:',
    walkers: 'पदयात्री',
    densityNormal: 'सामान्य प्रवाह',
    densityHigh: 'उच्च पदयात्री भीड़',
    densityEntry: 'सामान्य प्रवेश',
  },
  gu: {
    title: 'પદયાત્રી માર્ગ સુરક્ષા ટ્રેકિંગ',
    subtitle: 'ભાદરવી પૂનમ મહાકુંભ સુરક્ષા પોર્ટલ',
    activeMela: 'ભાદરવી પૂનમ પદયાત્રા મેળો સક્રિય',
    liveSafetyTrack: 'લાઈવ સુરક્ષા ટ્રેક',
    bleCardTitle: '📡 પદયાત્રી ચેકપોઇન્ટ અને BLE હાર્ડવેર ટ્રેકિંગ',
    bleCheckedIn: 'પદયાત્રી ચેક-ઇન નોંધાયા',
    bleNote: 'લાઈવ વેબ ચેક-ઇન સક્રિય છે. સતત પેસિવ BLE બીકન સ્કેનિંગ મોબાઇલ એપમાં ચાલુ છે.',
    checkinSuccess: 'ચેક-ઇન સફળતાપૂર્વક નોંધાયું!',
    currentStation: 'વર્તમાન સ્ટેશન',
    nextStation: 'આગામી સ્ટેશન',
    checkinBtn: 'અહીં ચેક-ઇન કરો',
    passed: 'પસાર કર્યું ✓',
    completed: 'પૂર્ણ',
    emergencyContact: 'સહાય હેલ્પલાઇન',
    talkToMarshal: 'ચેકપોઇન્ટ સુરક્ષા માર્શલ સાથે વાત કરો',
    callHelpline: 'હેલ્પલાઇન કૉલ કરો',
    walkTime: 'અંદાજિત ચાલવાનો સમય',
    mins: 'મિનિટ',
    loading: 'પદયાત્રી માર્ગ લોડ થઈ રહ્યો છે...',
    safetyTip: 'પદયાત્રી સુરક્ષા સલાહ: ORS પાણી પીતા રહો. દરેક ચેકપોઇન્ટ પર પ્રાથમિક સારવાર અને આરામ કેમ્પ ઉપલબ્ધ છે.',
    delayAlertTitle: 'પદયાત્રી સુરક્ષા ચેતવણી',
    delayAlertDesc: 'સિસ્ટમ દ્વારા વિલંબ જણાયો. છેલ્લા {checkpoint} ચેકપોઇન્ટથી {duration} મિનિટ સુધી ચેક-ઇન નથી થયું. નજીકના સ્વયંસેવકોને જાણ કરવામાં આવી છે.',
    routeStationsTitle: 'પદયાત્રા માર્ગ સ્ટેશન ચેકલિસ્ટ',
    lastCheckin: 'છેલ્લા સ્ટેશન ચેક-ઇન સમય:',
    walkers: 'પદયાત્રીઓ',
    densityNormal: 'સામાન્ય પ્રવાહ',
    densityHigh: 'વધારે પદયાત્રી ભીડ',
    densityEntry: 'સામાન્ય પ્રવેશ',
  }
};

export const MelaRoute = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1); // sequence_order
  const [lastCheckinTime, setLastCheckinTime] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  useEffect(() => {
    loadCheckpoints();
  }, [currentUser]);

  // Keep polling for delay flags in demo
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      const delayReport = await melaEngine.flagDelayedPadyatris(currentUser.id);
      if (delayReport && delayReport.delayed) {
        setAlertInfo(delayReport);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const loadCheckpoints = async () => {
    setLoading(true);
    const list = await melaEngine.getCheckpoints('tmp_ambaji');
    setCheckpoints(list);

    // Read last check-in from localStorage to restore pilgrim state
    if (currentUser) {
      const savedCheckins = JSON.parse(localStorage.getItem(`nirvighna_padyatri_checkins_${currentUser.id}`) || '[]');
      if (savedCheckins.length > 0) {
        const last = savedCheckins[savedCheckins.length - 1];
        const matched = list.find(c => c.id === last.checkpoint_id);
        if (matched) {
          setCurrentStep(matched.sequence_order + 1);
          setLastCheckinTime(new Date(last.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
        }
      }
    }
    setLoading(false);
  };

  const handleCheckIn = async (cp) => {
    if (!currentUser || checkingIn) return;
    setCheckingIn(true);
    
    const success = await melaEngine.checkInAtCheckpoint(currentUser.id, cp.id);
    if (success) {
      setCurrentStep(cp.sequence_order + 1);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      setLastCheckinTime(timeStr);

      const cpName = getCheckpointDisplayName(cp);
      await sendPilgrimNotification({
        type: 'gate_info',
        title: '🚩 Padyatri Check-In Saved',
        message: `Safety milestone check-in at "${cpName}" verified at ${timeStr}. Family tracking updated.`,
        link: '/mela'
      });
    }
    setCheckingIn(false);
  };

  const getCheckpointDisplayName = (cp) => {
    if (currentLanguage === 'gu' && cp.name_gu) return cp.name_gu;
    if (currentLanguage === 'hi' && cp.name_hi) return cp.name_hi;
    return cp.checkpoint_name;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-20">
        <NirvighnaLoader message={t.loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory pb-28 pt-[max(env(safe-area-inset-top,28px),28px)] px-4 font-body select-none">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header with Language Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/home')}
              className="p-2 bg-white rounded-xl shadow-warm border border-gray-200 hover:border-amber-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-amber-700" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold font-heading text-amber-900 leading-tight">
                {t.title}
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">{t.subtitle}</p>
            </div>
          </div>

          {/* Tri-Language Toggle */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-gold/40 shadow-xs gap-0.5 shrink-0">
            {[
              { id: 'hi', label: 'हि' },
              { id: 'gu', label: 'ગુ' },
              { id: 'en', label: 'EN' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`px-2 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  currentLanguage === lang.id
                    ? 'bg-maroon text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mela Active Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-3.5 rounded-2xl shadow-md border border-orange-400 flex items-center justify-between text-xs font-bold font-heading">
          <span className="flex items-center gap-2">
            <span className="text-base">🚩</span>
            <span>{t.activeMela}</span>
          </span>
          <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
            {t.liveSafetyTrack}
          </span>
        </div>

        {/* 📡 300km Highway Solar BLE Corridor Beacons Telemetry Card */}
        {(() => {
          const bleData = cctvHeatmapService.getBLECorridorStatus();
          return (
            <div className="bg-gradient-to-br from-indigo-950 via-[#1a142e] to-slate-950 text-white p-4 rounded-2xl shadow-lg border border-gold/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-extrabold font-heading text-gold">
                <span>{t.bleCardTitle}</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[9px] font-mono border border-emerald-500/30">
                  {bleData.totalActivePadyatris} {t.bleCheckedIn}
                </span>
              </div>
              <p className="text-[10px] text-gray-300 leading-tight">
                {t.bleNote}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                {bleData.beacons.map(b => {
                  const locName = currentLanguage === 'gu' ? (b.location_gu || b.location) : currentLanguage === 'hi' ? (b.location_hi || b.location) : b.location;
                  const densityName = currentLanguage === 'gu' ? (b.density_gu || b.densityStatus) : currentLanguage === 'hi' ? (b.density_hi || b.densityStatus) : b.densityStatus;
                  return (
                    <div key={b.beaconId} className="bg-white/5 p-2 rounded-xl border border-white/10 space-y-0.5">
                      <p className="font-bold text-white truncate">{locName}</p>
                      <p className="text-gold font-semibold truncate">{b.activePadyatris} {t.walkers} • {densityName}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Safety advisory message */}
        <div className="bg-white/90 backdrop-blur-xs border border-orange-200 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 font-medium shadow-2xs">
          <Shield className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t.safetyTip}</p>
        </div>

        {/* Delay concerned Alert Banner */}
        {alertInfo && (
          <div className="bg-red-50 border-2 border-red-300 p-3.5 rounded-2xl space-y-2 animate-bounce">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-xs text-red-900 uppercase font-heading">{t.delayAlertTitle}</h4>
                <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                  {t.delayAlertDesc
                    .replace('{duration}', alertInfo.duration)
                    .replace('{checkpoint}', alertInfo.checkpoint)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Route List */}
        <div className="bg-white rounded-3xl p-5 shadow-warm border border-gold/30 relative">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest font-heading">
              {t.routeStationsTitle}
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full font-mono">
              {checkpoints.length} Stations
            </span>
          </div>

          <div className="relative pl-8 space-y-6">
            {/* Vertical progress line */}
            <div className="absolute left-[13px] top-2 bottom-2 w-[3px] bg-gray-200 rounded-full">
              <div 
                className="bg-orange-600 transition-all duration-500 rounded-full"
                style={{ 
                  height: `${Math.min(100, ((currentStep - 1) / Math.max(1, checkpoints.length - 1)) * 100)}%`,
                  width: '3px'
                }}
              />
            </div>

            {checkpoints.map((cp) => {
              const isCompleted = cp.sequence_order < currentStep;
              const isCurrent = cp.sequence_order === currentStep;

              return (
                <div key={cp.id} className="relative flex flex-col gap-2">
                  
                  {/* Marker Node icon */}
                  <div className={`absolute -left-[28px] w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${
                    isCompleted ? 'bg-orange-600 border-orange-600 text-white shadow-xs' :
                    isCurrent ? 'bg-white border-amber-600 text-amber-800 scale-110 shadow-sm animate-pulse' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <span className="text-[9px] font-bold">✓</span>
                    ) : (
                      <span className="text-[8px] font-bold">{cp.sequence_order}</span>
                    )}
                  </div>

                  {/* Checkpoint Details card */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    isCompleted ? 'bg-orange-50/40 border-orange-200/60' :
                    isCurrent ? 'bg-amber-50/30 border-gold shadow-xs' :
                    'bg-gray-50/50 border-gray-200/70 opacity-60'
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className={`text-xs font-black font-heading ${
                          isCompleted ? 'text-orange-900 line-through opacity-80' :
                          isCurrent ? 'text-amber-950 font-black' : 'text-gray-700'
                        }`}>
                          {getCheckpointDisplayName(cp)}
                        </h4>
                        {cp.avg_walk_minutes_to_next > 0 && !isCompleted && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{t.walkTime}: <strong>{cp.avg_walk_minutes_to_next} {t.mins}</strong></span>
                          </p>
                        )}
                        {isCompleted && (
                          <p className="text-[10px] text-emerald-700 font-extrabold mt-0.5">
                            {t.passed}
                          </p>
                        )}
                      </div>

                      {isCurrent && (
                        <button
                          onClick={() => handleCheckIn(cp)}
                          disabled={checkingIn}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black rounded-xl shadow-sm tracking-wide uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                        >
                          {checkingIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                          <span>{t.checkinBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {lastCheckinTime && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
              <span>{t.lastCheckin}</span>
              <strong className="text-orange-700 font-mono font-black">{lastCheckinTime}</strong>
            </div>
          )}
        </div>

        {/* Emergency Assistance card */}
        <div className="bg-gradient-to-r from-amber-900 via-maroon to-amber-900 text-white p-4 rounded-2xl shadow-lg border border-amber-600/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <PhoneCall className="w-5 h-5 text-gold animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white font-heading">{t.emergencyContact}</h4>
              <p className="text-[10px] text-amber-200 font-medium">{t.talkToMarshal}</p>
            </div>
          </div>
          <a
            href="tel:18002335555"
            className="px-3.5 py-2 bg-white text-maroon font-black text-xs rounded-xl shadow-md hover:bg-ivory transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.callHelpline}
          </a>
        </div>

      </div>
    </div>
  );
};
