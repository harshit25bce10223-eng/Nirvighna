import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { melaEngine } from '../lib/melaEngine';
import { cctvHeatmapService } from '../lib/cctvHeatmapService';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { 
  MapPin, CheckCircle, ChevronLeft, Loader2, Play, 
  AlertTriangle, Shield, Clock, PhoneCall, HelpCircle 
} from 'lucide-react';

const translations = {
  en: {
    title: 'Padyatri Route Tracking',
    subtitle: 'Bhadarvi Poonam Safety Portal',
    activeMela: 'Bhadarvi Poonam Mode Active',
    checkinSuccess: 'Check-in Recorded Successfully!',
    currentStation: 'Current Station',
    nextStation: 'Next Station',
    checkinBtn: 'Check In Here',
    completed: 'Completed',
    emergencyContact: 'Assistance Helpline',
    walkTime: 'Est. walking time',
    mins: 'mins',
    safetyTip: 'Padyatri Safety Advisory: Stay hydrated. Report delays to volunteers.'
  },
  hi: {
    title: 'पदयात्री मार्ग ट्रैकिंग',
    subtitle: 'भादरवी पूनम सुरक्षा पोर्टल',
    activeMela: 'भादरवी पूनम मेला मोड सक्रिय',
    checkinSuccess: 'चेक-इन सफलतापूर्वक दर्ज किया गया!',
    currentStation: 'वर्तमान स्टेशन',
    nextStation: 'अगला स्टेशन',
    checkinBtn: 'यहाँ चेक-इन करें',
    completed: 'पूर्ण',
    emergencyContact: 'सहायता हेल्पलाइन',
    walkTime: 'अनुमानित चलने का समय',
    mins: 'मिनट',
    safetyTip: 'पदयात्री सुरक्षा सलाह: हाइड्रेटेड रहें। स्वयंसेवकों को देरी की रिपोर्ट करें।'
  },
  gu: {
    title: 'પદયાત્રી માર્ગ ટ્રેકિંગ',
    subtitle: 'ભાદરવી પૂનમ સુરક્ષા પોર્ટલ',
    activeMela: 'ભાદરવી પૂનમ મેળો સક્રિય',
    checkinSuccess: 'ચેક-ઇન સફળતાપૂર્વક નોંધાયું!',
    currentStation: 'વર્તમાન સ્ટેશન',
    nextStation: 'આગામી સ્ટેશન',
    checkinBtn: 'અહીં ચેક-ઇન કરો',
    completed: 'પૂર્ણ',
    emergencyContact: 'સહાય હેલ્પલાઇન',
    walkTime: 'અંદાજિત ચાલવાનો સમય',
    mins: 'મિનિટ',
    safetyTip: 'પદયાત્રી સુરક્ષા સલાહ: પાણી પીતા રહો. સ્વયંસેવકોને મોડું થવાની જાણ કરો.'
  }
};

export const MelaRoute = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
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

  // Keep polling for delay flags in demo (runs periodically)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      const delayReport = await melaEngine.flagDelayedPadyatris(currentUser.id);
      if (delayReport && delayReport.delayed) {
        setAlertInfo(delayReport);
      }
    }, 12000); // 12 seconds check loop for faster demo trigger

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
          setLastCheckinTime(new Date(last.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
      setLastCheckinTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    setCheckingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-20">
        <NirvighnaLoader message={t.loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory pb-28 pt-4 px-4 font-body">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 bg-white rounded-xl shadow-warm border border-gray-100 hover:border-amber-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-amber-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-extrabold font-heading text-amber-800 flex items-center justify-between">
              <span>{t.title}</span>
              <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 uppercase">
                Ambaji
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">{t.subtitle}</p>
          </div>
        </div>

        {/* Mela Active Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-3.5 rounded-2xl shadow-md border border-orange-400 flex items-center justify-between text-xs font-bold font-heading">
          <span className="flex items-center gap-2">
            <span className="text-base">🚩</span>
            <span>{t.activeMela}</span>
          </span>
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
            Live Safety Track
          </span>
        </div>

        {/* 📡 300km Highway Solar BLE Corridor Beacons Telemetry Card */}
        {(() => {
          const bleData = cctvHeatmapService.getBLECorridorStatus();
          return (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg border border-gold/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold font-heading text-gold">
                <span>📡 Padyatri Waypoint Checkpoints & BLE Hardware Roadmap</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md text-[9px] font-mono">
                  {bleData.totalActivePadyatris} Padyatris Checked-In
                </span>
              </div>
              <p className="text-[10px] text-gray-300 leading-tight">
                Live Web Check-In active. Continuous passive BLE beacon scanning is scheduled for Native App (Phase 2).
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                {bleData.beacons.map(b => (
                  <div key={b.beaconId} className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="font-bold text-white truncate">{b.location}</p>
                    <p className="text-gold font-semibold">{b.activePadyatris} walkers • {b.densityStatus}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Safety advisory message */}
        <div className="bg-white/80 backdrop-blur-xs border border-orange-200/50 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
          <Shield className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t.safetyTip}</p>
        </div>

        {/* Delay concerned Alert Banner */}
        {alertInfo && (
          <div className="bg-red-50 border-2 border-red-300 p-3.5 rounded-2xl space-y-2.5 animate-bounce">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-xs text-red-900 uppercase">Padyatri Concern Alert</h4>
                <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                  System detected a delay. No check-in recorded for past {alertInfo.duration} mins since last checkpoint ({alertInfo.checkpoint}). Nearest volunteers have been notified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Route List (Trains-like layout) */}
        <div className="bg-white rounded-3xl p-5 shadow-warm border border-gray-100 relative">
          <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-4 font-heading">
            Route Stations Checklist
          </h3>

          <div className="relative pl-8 space-y-6">
            {/* Simple vertical progress-path visual line */}
            <div className="absolute left-[13px] top-2 bottom-2 w-[3px] bg-gray-200 rounded-full">
              <div 
                className="bg-orange-600 transition-all duration-500 rounded-full"
                style={{ 
                  height: `${Math.min(100, ((currentStep - 1) / (checkpoints.length - 1)) * 100)}%`,
                  width: '3px'
                }}
              />
            </div>

            {checkpoints.map((cp, idx) => {
              const isCompleted = cp.sequence_order < currentStep;
              const isCurrent = cp.sequence_order === currentStep;
              const isLocked = cp.sequence_order > currentStep;

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
                    isCompleted ? 'bg-orange-50/30 border-orange-200/50' :
                    isCurrent ? 'bg-amber-50/20 border-gold shadow-xs' :
                    'bg-gray-50/50 border-gray-200/70 opacity-60'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`text-xs font-black font-heading ${
                          isCompleted ? 'text-orange-800 line-through' :
                          isCurrent ? 'text-amber-900' : 'text-gray-700'
                        }`}>
                          {cp.checkpoint_name}
                        </h4>
                        {cp.avg_walk_minutes_to_next > 0 && !isCompleted && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{t.walkTime}: <strong>{cp.avg_walk_minutes_to_next} {t.mins}</strong></span>
                          </p>
                        )}
                        {isCompleted && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Passed ✓
                          </p>
                        )}
                      </div>

                      {isCurrent && (
                        <button
                          onClick={() => handleCheckIn(cp)}
                          disabled={checkingIn}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black rounded-lg shadow-sm tracking-wide uppercase transition-all flex items-center gap-1 shrink-0"
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
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Last station check-in time:</span>
              <strong className="text-orange-700 font-mono">{lastCheckinTime}</strong>
            </div>
          )}
        </div>

        {/* Emergency Assistance card */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white p-4 rounded-2xl shadow-lg border border-amber-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <PhoneCall className="w-4 h-4 text-gold animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white font-heading">{t.emergencyContact}</h4>
              <p className="text-[10px] text-amber-200 font-medium">Talk to checkpoint marshal</p>
            </div>
          </div>
          <a
            href="tel:18002335555"
            className="px-3 py-1.5 bg-white text-amber-800 font-extrabold text-[10px] rounded-lg shadow-md hover:bg-ivory transition-colors whitespace-nowrap"
          >
            Call Helpline
          </a>
        </div>

      </div>
    </div>
  );
};
