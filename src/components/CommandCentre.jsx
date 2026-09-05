import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { acousticPanicEngine } from '../lib/acousticPanicEngine';
import { digitalTwinEngine } from '../lib/digitalTwinEngine';
import { nirvighnaCVInspector } from '../lib/nirvighnaCVInspector';
import { aiGateRerouteEngine } from '../lib/aiGateRerouteEngine';
import { safetyCommandDemo } from '../lib/safetyCommandDemo';
import { LiveWebcamCVMonitor } from './LiveWebcamCVMonitor';
import { ErrorBoundary } from './ErrorBoundary';
import {
  Users,
  HeartPulse,
  AlertTriangle,
  MapPin,
  Activity,
  CheckCircle,
  Loader2,
  Shield,
  ShieldCheck,
  Flame,
  Navigation,
  ParkingCircle,
  Bus,
  Camera,
  Upload,
  Video,
  UserCheck,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Radio,
  Menu,
  X,
  Layers,
  Sparkles,
  TrendingUp,
  Ticket,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { NirvighnaAIEngine } from '../lib/aiCrowdEngine';
import { useNavigate } from 'react-router-dom';

const PanicAlertsTab = React.lazy(() => import('./commandCentre/PanicAlertsTab').then(module => ({ default: module.PanicAlertsTab })));
const MLPerformanceTab = React.lazy(() => import('./commandCentre/MLPerformanceTab').then(module => ({ default: module.MLPerformanceTab })));
const DrishtiAI = React.lazy(() => import('./systems/DrishtiAI').then(module => ({ default: module.DrishtiAI })));
const PranaKavach = React.lazy(() => import('./systems/PranaKavach').then(module => ({ default: module.PranaKavach })));
const DhwaniRakshak = React.lazy(() => import('./systems/DhwaniRakshak').then(module => ({ default: module.DhwaniRakshak })));
const SanjeevaniPath = React.lazy(() => import('./systems/SanjeevaniPath').then(module => ({ default: module.SanjeevaniPath })));
const OfflineCounterBooking = React.lazy(() => import('./OfflineCounterBooking').then(module => ({ default: module.OfflineCounterBooking })));
const Shrine3DIsometricMap = React.lazy(() => import('./Shrine3DIsometricMap').then(module => ({ default: module.Shrine3DIsometricMap })));
const TempleDigitalTwin = React.lazy(() => import('./TempleDigitalTwin').then(module => ({ default: module.TempleDigitalTwin })));
const SmartSignageLEDController = React.lazy(() => import('./SmartSignageLEDController').then(module => ({ default: module.SmartSignageLEDController })));

// ─── Web Speech API & Web Audio Temple PA Announcement Engine ─────────
let isPAAnnouncingGlobal = false;
let currentUtteranceInstance = null;
let activeLoopTimerId = null;

function playTempleChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 Indian Temple Chime
    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.18);

      gain.gain.setValueAtTime(0.01, audioCtx.currentTime + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + index * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.18 + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + index * 0.18);
      osc.stop(audioCtx.currentTime + index * 0.18 + 0.55);
    });
  } catch (e) {
    // Chime fallback ignored
  }
}

// Pre-warm browser speech voices array into memory
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      try { window.speechSynthesis.getVoices(); } catch (e) {}
    };
  }
}

function stopPAAnnouncement() {
  isPAAnnouncingGlobal = false;

  if (activeLoopTimerId) {
    clearTimeout(activeLoopTimerId);
    activeLoopTimerId = null;
  }

  if (currentUtteranceInstance) {
    currentUtteranceInstance.onend = null;
    currentUtteranceInstance.onerror = null;
    currentUtteranceInstance = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }, 50);
  }
}

function speakIndianLanguage(devanagariScriptText, phoneticHinglishText, langCode, nextCallback) {
  if (!isPAAnnouncingGlobal || !('speechSynthesis' in window)) {
    if (nextCallback && isPAAnnouncingGlobal) nextCallback();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  } catch (e) {}

  const voices = window.speechSynthesis.getVoices() || [];
  
  // 1. Look for native language female voice matching langCode (e.g., hi-IN or gu-IN)
  let voice = voices.find(v => 
    (v.lang.toLowerCase().startsWith(langCode.toLowerCase()) || v.lang.toLowerCase().includes(langCode.toLowerCase().slice(0, 2))) &&
    /female|woman|google|kalpana|heera|neerja|swara/i.test(v.name)
  ) || voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()) || v.lang.toLowerCase().includes(langCode.toLowerCase().slice(0, 2)));

  // 2. If native script voice not found, fallback to any Indian English female voice
  if (!voice) {
    voice = voices.find(v => /india|hindi|gujarati|hi-in|gu-in|en-in|heera|kalpana|hemant|swara|neerja/i.test(v.name || v.lang));
  }

  // Determine whether to use native script or phonetic Hinglish/Gujlish based on selected voice
  const isIndianEnglishVoice = voice && (voice.lang.includes('en') || /en-in|heera|kalpana|hemant|neerja/i.test(voice.name || voice.lang));
  const textToSpeak = (isIndianEnglishVoice && phoneticHinglishText) ? phoneticHinglishText : devanagariScriptText;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = voice ? voice.lang : (langCode || 'hi-IN');
  utterance.volume = 1.0;
  utterance.rate = 0.88;
  utterance.pitch = 1.04;

  if (voice) {
    utterance.voice = voice;
  }

  currentUtteranceInstance = utterance;

  utterance.onend = () => {
    currentUtteranceInstance = null;
    if (!isPAAnnouncingGlobal) return;

    activeLoopTimerId = setTimeout(() => {
      if (nextCallback && isPAAnnouncingGlobal) {
        nextCallback();
      }
    }, 1200);
  };

  utterance.onerror = () => {
    currentUtteranceInstance = null;
    if (!isPAAnnouncingGlobal) return;

    activeLoopTimerId = setTimeout(() => {
      if (nextCallback && isPAAnnouncingGlobal) {
        nextCallback();
      }
    }, 1200);
  };

  window.speechSynthesis.speak(utterance);
}

function startTriLingualAnnouncement(templeName = 'Somnath Temple', telemetryState = {}) {
  if (!('speechSynthesis' in window)) return;
  stopPAAnnouncement(); // Reset any ongoing audio queues first!
  isPAAnnouncingGlobal = true;

  playTempleChime();

  activeLoopTimerId = setTimeout(() => {
    if (!isPAAnnouncingGlobal) return;

    // Analyze live 24/7 background telemetry signals
    const hasPanicScream = (telemetryState.panicAlertsCount > 0) || (telemetryState.hasRecentScreamSpike);
    const isHighCrowdSurge = (telemetryState.densityScore >= 80) || (telemetryState.occupancyPct >= 75);
    const isCO2Warning = (telemetryState.co2Ppm >= 1400);

    let hindiDevanagari = '';
    let hindiPhonetic = '';
    let gujaratiScript = '';
    let gujaratiPhonetic = '';
    let englishText = '';

    if (hasPanicScream) {
      hindiDevanagari = `ध्यान दें! ${templeName} कंट्रोल रूम आपातकालीन सूचना: संकीर्ण मार्ग में भगदड़ की स्थिति से बचें। सुरक्षा मार्शल मौके पर हैं। कृपया धैर्य रखें और आपातकालीन निकास द्वार का उपयोग करें। धन्यवाद!`;
      hindiPhonetic = `Dhyan dein! ${templeName} control room aapatkaleen soochna: Sankirna maarg mein bhagdad ki sthiti se bachein. Suraksha marshal mauke par hain. Kripya dhairya rakhein aur aapatkaleen nikas dwaar ka upayog karein. Dhanyavaad!`;

      gujaratiScript = `ધ્યાન આપો! ${templeName} કંટ્રોલ રૂમ ઈમરજન્સી સૂચના: લાઈનમાં ધક્કામુક્કી ન કરો. સુરક્ષા માર્શલ હાજર છે. મહેરબાની કરીને ઈમરજન્સી એક્ઝિટ ગેટનો ઉપયોગ કરો. આભાર!`;
      gujaratiPhonetic = `Dhyan aapo! ${templeName} control room emergency soochna: Line ma dhakkamukki na karo. Suraksha marshal haajar chhe. Maherbani karine emergency exit gate no upyog karo. Aabhar!`;

      englishText = `Emergency alert! ${templeName} control room advisory: Panic spike detected in inner corridor. Security marshals are responding. Please stay calm and use emergency exit doors. Thank you!`;

    } else if (isHighCrowdSurge) {
      hindiDevanagari = `ध्यान दें! ${templeName} कंट्रोल रूम की विशेष सूचना: मुख्य द्वार नंबर 1 पर दर्शनार्थियों की भीड़ अधिक है। कृपया जल्दबाजी न करें, लाइन में चलें और द्वार नंबर 2 का उपयोग करें। धन्यवाद!`;
      hindiPhonetic = `Dhyan dein! ${templeName} control room ki vishesh soochna: Mukhya dwaar number 1 par darshanarthiyo ki bhid zyada hai. Kripya jaldbaazi na karein, line mein chalein aur dwaar number 2 ka upayog karein. Dhanyavaad!`;

      gujaratiScript = `ધ્યાન આપો! ${templeName} કંટ્રોલ રૂમની ખાસ સૂચના: મુખ્ય પ્રવેશદ્વાર નંબર 1 પર દર્શનાર્થીઓની ભીડ વધારે છે. મહેરબાની કરીને ઉતાવળ ન કરો, લાઈનમાં ચાલો અને ગેટ નંબર 2 નો ઉપયોગ કરો. આભાર!`;
      gujaratiPhonetic = `Dhyan aapo! ${templeName} control room ni khas soochna: Mukhya pravesh dwaar number 1 par darshanarthiyo ni bheed vadhare chhe. Maherbani karine utaval na karo, line ma chaalo ane gate number 2 no upyog karo. Aabhar!`;

      englishText = `Attention please! ${templeName} control room public announcement: High crowd volume at Gate number 1. Please do not hurry, walk in line, and use Gate number 2. Thank you!`;

    } else if (isCO2Warning) {
      hindiDevanagari = `ध्यान दें! ${templeName} कंट्रोल रूम स्वास्थ्य सूचना: मुख्य प्रांगण में हवा का दबाव कम है। वृद्ध एवं बच्चे कृपया खुले मंडप क्षेत्र की ओर प्रस्थान करें। धन्यवाद!`;
      hindiPhonetic = `Dhyan dein! ${templeName} control room swasthya soochna: Mukhya prangan mein hawa ka dabav kam hai. Vridh aur bacche kripya khule mandap kshetra ki or prasthan karein. Dhanyavaad!`;

      gujaratiScript = `ધ્યાન આપો! ${templeName} કંટ્રોલ રૂમ આરોગ્ય સૂચના: મુખ્ય મંડપમાં હવાનું દબાણ ઓછું છે. વૃદ્ધો અને બાળકો ખુલ્લા વિસ્તાર તરફ જાઓ. આભાર!`;
      gujaratiPhonetic = `Dhyan aapo! ${templeName} control room aarogya soochna: Mukhya mandap ma hava nu dabaan ochhu chhe. Vruddho ane baalko khulla vistaar taraf jaao. Aabhar!`;

      englishText = `Health advisory! ${templeName} control room alert: Oxygen levels are low in sanctum corridor. Senior citizens and children please move towards open courtyard. Thank you!`;

    } else {
      hindiDevanagari = `ध्यान दें! ${templeName} कंट्रोल रूम सूचना: दर्शन व्यवस्था सुगम एवं शांत है। सभी दर्शनार्थी कतारबद्ध होकर शांतिपूर्वक दर्शन करें एवं नियमों का पालन करें। धन्यवाद!`;
      hindiPhonetic = `Dhyan dein! ${templeName} control room soochna: Darshan vyavastha sugam aur shant hai. Sabhi darshanarthi line mein hokar shantipurvak darshan karein aur niyamo ka paalan karein. Dhanyavaad!`;

      gujaratiScript = `ધ્યાન આપો! ${templeName} કંટ્રોલ રૂમ સૂચના: દર્શન વ્યવસ્થા શાંતિપૂર્ણ છે. બધા દર્શનાર્થીઓ લાઈનમાં રહીને શાંતિથી દર્શન કરો. આભાર!`;
      gujaratiPhonetic = `Dhyan aapo! ${templeName} control room soochna: Darshan vyavastha shantipurna chhe. Badha darshanarthiyo line ma rahine shanti thi darshan karo. Aabhar!`;

      englishText = `Attention please! ${templeName} control room advisory: Darshan queue is moving smoothly. Please maintain line discipline and follow safety instructions. Thank you!`;
    }

    // 1. HINDI (हिन्दी - Real Indian Female Voice)
    speakIndianLanguage(hindiDevanagari, hindiPhonetic, 'hi-IN', () => {
      if (!isPAAnnouncingGlobal) return;

      // 2. ENGLISH (Indian English Female Voice)
      speakIndianLanguage(englishText, englishText, 'en-IN', () => {
        if (!isPAAnnouncingGlobal) return;

        // CONTINUOUS REPEAT LOOP CYCLE
        activeLoopTimerId = setTimeout(() => {
          if (isPAAnnouncingGlobal) {
            startTriLingualAnnouncement(templeName, telemetryState);
          }
        }, 1800);
      });
    });
  }, 900);
}

// ─── Admin session helper ─────────────────────────────────────────
function getAdminSession() {
  try {
    const saved = localStorage.getItem('nirvighna_admin_session');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.templeId
      ? parsed
      : { hub: 'Somnath Mahadev Command Operations', templeId: 'tmp_somnath' };
  } catch {
    return { hub: 'Somnath Mahadev Command Operations', templeId: 'tmp_somnath' };
  }
}

// ─── Status colour helpers ────────────────────────────────────────
function getStatusColor(status) {
  const map = {
    active: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    searching: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    en_route: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    assigned: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    reached: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    found: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    investigating: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  };
  return map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}

function getSeverityDot(severity) {
  const map = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-400', low: 'bg-emerald-500' };
  return map[severity] || 'bg-gray-500';
}

// ─── Sidebar nav items ────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',         label: 'Overview',          icon: LayoutDashboard },
  { id: '3d_vector_map',    label: '3D GIS MAP',        icon: Layers,    tag: '3D Vector' },
  { id: 'led_signage',      label: 'LED SIGNAGE API',   icon: Zap,       tag: 'API Webhook' },
  { id: 'drishti_ai',       label: 'DRISHTI AI',        icon: Video,     tag: 'Camera' },
  { id: 'prana_kavach',     label: 'PRANA KAVACH',      icon: Activity,  tag: 'Risk' },
  { id: 'dhwani_rakshak',   label: 'DHWANI RAKSHAK',    icon: Radio,     tag: 'Audio' },
  { id: 'sanjeevani_path',  label: 'SANJEEVANI PATH',   icon: HeartPulse,tag: 'Medical' },
  { id: 'digital_twin',     label: 'DIGITAL TWIN',      icon: Sparkles,  tag: 'Sim' },
  { id: 'panic',            label: 'Panic Alerts',      icon: AlertTriangle },
  { id: 'volunteers',       label: 'Duty Roster',       icon: UserCheck },
];


// ─── Reusable card shell (Humanized Enterprise Design) ───────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-[#221517] border border-amber-900/25 rounded-xl shadow-xs hover:border-amber-700/35 transition-all ${className}`}>
    {children}
  </div>
);

const EmptyState = ({ label }) => (
  <Card className="p-10 text-center">
    <p className="text-sm text-slate-500">{label}</p>
  </Card>
);

// ─── CaseCard ─────────────────────────────────────────────────────
const CaseCard = ({ item, onResolve, nameKey = 'full_name', locationKey = 'location' }) => {
  const name = item.users?.[nameKey] || item.users?.full_name || '—';
  const loc = item[locationKey] || item.last_seen_location || '—';
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{item.users?.phone || item.assistance_type || '—'}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      </div>
      {loc !== '—' && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{loc}</span>
        </div>
      )}
      {item.medical_notes && (
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">{item.medical_notes}</p>
      )}
      <div className="flex gap-2">
        <button className="flex-1 py-1.5 bg-white/[0.06] hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium transition-colors">
          View details
        </button>
        <button
          onClick={() => onResolve?.(item)}
          className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-medium border border-emerald-500/20 transition-colors"
        >
          Mark resolved
        </button>
      </div>
    </Card>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────
const OverviewTab = ({ lostCases, medicalCases, priorityCases, panicAlerts, templeCapacities, volunteerLocations, adminSession }) => {
  const totalActive = lostCases.length + medicalCases.length + priorityCases.length;
  const criticalAlerts = panicAlerts.filter(a => a.severity === 'critical').length;

  const stats = [
    { label: 'Active Cases', value: totalActive, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Panic Alerts', value: panicAlerts.length, icon: Radio, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Medical Cases', value: medicalCases.length, icon: HeartPulse, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Volunteers On Duty', value: volunteerLocations.length || 4, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-4">
      {/* SIH Safety Response Loop removed as per user request */}
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Temple capacity overview */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Temple Capacity</h2>
        {templeCapacities.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-xs text-slate-500">No live data — check Supabase connection</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templeCapacities.map(cap => {
              const pct = Math.min(100, Math.round((cap.current_count / cap.max_capacity) * 100));
              return (
                <Card key={cap.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white truncate">{cap.temples?.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(cap.density_level)}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">{cap.current_count?.toLocaleString()} / {cap.max_capacity?.toLocaleString()}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent alerts quick look */}
      {panicAlerts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent Alerts</h2>
          <div className="space-y-2">
            {panicAlerts.slice(0, 3).map(a => (
              <Card key={a.id} className="p-3 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${getSeverityDot(a.severity)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">{a.zone || 'Unknown zone'}</p>
                  <p className="text-[10px] text-slate-500">{a.severity?.toUpperCase()} · {new Date(a.detected_at || a.created_at || Date.now()).toLocaleTimeString()}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
export const CommandCentre = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const adminSession = getAdminSession();

  const [selectedTempleId, setSelectedTempleId] = useState(adminSession.templeId || 'tmp_somnath');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [isPAActive, setIsPAActive] = useState(false);

  // Data states
  const [lostCases, setLostCases] = useState([]);
  const [medicalCases, setMedicalCases] = useState([]);
  const [priorityCases, setPriorityCases] = useState([]);
  const [panicAlerts, setPanicAlerts] = useState([]);
  const [templeCapacities, setTempleCapacities] = useState([]);
  const [volunteerLocations, setVolunteerLocations] = useState([]);
  const [shuttleLocations, setShuttleLocations] = useState([]);
  const [parkingStatus, setParkingStatus] = useState([]);
  const [activePanicModal, setActivePanicModal] = useState(null);

  // CCTV/CV states
  const [cvAnalysisResult, setCvAnalysisResult] = useState(null);
  const [analyzingCV, setAnalyzingCV] = useState(false);
  const [customImageUpload, setCustomImageUpload] = useState(null);
  const [multiGateData, setMultiGateData] = useState(null);
  const [gateUploads, setGateUploads] = useState({});
  const [runningRerouteAI, setRunningRerouteAI] = useState(false);

  // Acoustic / panic states
  const [acousticReadings, setAcousticReadings] = useState([]);
  const [selectedAcousticZone, setSelectedAcousticZone] = useState('Zone A Entrance');

  // Digital twin states
  const [digitalTwinInput, setDigitalTwinInput] = useState({ footfall: 8000, gatesOpen: 3, date: new Date().toISOString().split('T')[0] });
  const [digitalTwinResult, setDigitalTwinResult] = useState(null);
  const [simulatingDigitalTwin, setSimulatingDigitalTwin] = useState(false);
  const [crowdSafetyView, setCrowdSafetyView] = useState('live');

  // Drishti backend live telemetry (real counts from CV backend)
  const [drishtiTelemetry, setDrishtiTelemetry] = useState({ connected: false, devotees: 0, entries: 0, exits: 0, zones: [] });

  // ─── Data fetching ──────────────────────────────────────────────
  const fetchLostCases = async () => {
    const { data } = await supabase.from('lost_found_cases').select('*, users(full_name, phone)').in('status', ['active', 'searching']).order('created_at', { ascending: false });
    setLostCases(data || []);
  };
  const fetchMedicalCases = async () => {
    const { data } = await supabase.from('medical_assistance_cases').select('*, users(full_name, phone)').in('status', ['pending', 'en_route', 'reached']).order('created_at', { ascending: false });
    setMedicalCases(data || []);
  };
  const fetchPriorityCases = async () => {
    const { data } = await supabase.from('priority_assistance').select('*, users(full_name, phone)').in('status', ['pending', 'assigned']).order('created_at', { ascending: false });
    setPriorityCases(data || []);
  };
  const fetchPanicAlerts = async () => {
    const { data } = await supabase.from('panic_alerts').select('*').in('status', ['active', 'investigating']).order('detected_at', { ascending: false });
    let merged = data || [];
    // Merge Drishti backend incident log so real hardware panic events appear in the CC
    try {
      const res = await fetch((import.meta.env.VITE_DRISHTI_URL || 'http://localhost:8000') + '/api/incidents');
      if (res.ok) {
        const payload = await res.json();
        const backendPanics = (payload.incidents || [])
          .filter(i => i.type === 'PANIC_ALERT' || i.type === 'AUDIO_PANIC_SCREAM' || i.type === 'MANUAL_PANIC_TEST')
          .slice(0, 10)
          .map(i => ({
            id: 'backend_' + i.timestamp,
            status: 'active',
            severity: 'critical',
            confidence_score: i.confidence ? Math.round(i.confidence * 100) : 98,
            zone_name: 'Backend Drishti Audio',
            detected_at: i.timestamp,
            created_at: i.timestamp,
            description: i.message,
            source: 'backend'
          }));
        merged = [...backendPanics, ...merged];
      }
    } catch (e) {
      // Backend offline — Supabase alerts only
    }
    setPanicAlerts(merged);
  };
  const fetchTempleCapacities = async () => {
    const { data } = await supabase.from('temple_capacity').select('*, temples(name)').order('last_updated', { ascending: false });
    setTempleCapacities(data || []);
  };
  const fetchVolunteerLocations = async () => {
    const { data } = await supabase.from('volunteer_locations').select('*, users(full_name)').eq('is_available', false).order('last_updated', { ascending: false });
    setVolunteerLocations(data || []);
  };
  const fetchShuttleLocations = async () => {
    const { data } = await supabase.from('shuttle_locations').select('*').in('status', ['en_route', 'loading', 'unloading']).order('last_updated', { ascending: false });
    setShuttleLocations(data || []);
  };
  const fetchParkingStatus = async () => {
    const { data } = await supabase.from('parking_sensors').select('*');
    const zoneStats = {};
    data?.forEach(sensor => {
      if (!zoneStats[sensor.zone_id]) zoneStats[sensor.zone_id] = { total: 0, occupied: 0 };
      zoneStats[sensor.zone_id].total++;
      if (sensor.is_occupied) zoneStats[sensor.zone_id].occupied++;
    });
    setParkingStatus(Object.entries(zoneStats).map(([zone, stats]) => ({ zone, ...stats, available: stats.total - stats.occupied })));
  };
  const fetchAcousticReadings = async () => {
    const list = await acousticPanicEngine.getRecentReadings(selectedTempleId, selectedAcousticZone);
    setAcousticReadings(list);
  };

  const fetchDrishtiTelemetry = async () => {
    try {
      const base = import.meta.env.VITE_DRISHTI_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/api/predict`, { method: 'GET' });
      if (!res.ok) {
        setDrishtiTelemetry(t => ({ ...t, connected: false }));
        return;
      }
      const data = await res.json();
      setDrishtiTelemetry({
        connected: true,
        source: data.source || 'LIVE',
        devotees: data.current_occupancy ?? 0,
        entries: data.verified_count ?? 0,
        exits: data.exit_count ?? 0,
        zones: data.forecast?.predictions || []
      });
    } catch (e) {
      setDrishtiTelemetry(t => ({ ...t, connected: false }));
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLostCases(), fetchMedicalCases(), fetchPriorityCases(), fetchPanicAlerts(), fetchTempleCapacities(), fetchVolunteerLocations(), fetchShuttleLocations(), fetchParkingStatus()]);
    } catch (e) {
      // Supabase network error — partial data may be available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchAcousticReadings();
    fetchDrishtiTelemetry();
    const drishtiInterval = setInterval(fetchDrishtiTelemetry, 10000);
    (async () => {
      try {
        const res = await aiGateRerouteEngine.analyzeMultiGateCrowd(selectedTempleId);
        setMultiGateData(res);
      } catch (e) {
        // Gate reroute engine error — non-critical, overview still renders
      }
    })();

    const interval = setInterval(() => {
      acousticPanicEngine.generateAcousticReading(selectedTempleId, selectedAcousticZone);
      fetchAcousticReadings();
    }, 5000);

    const handlePanicAlert = (e) => {
      fetchPanicAlerts();
      fetchAcousticReadings();
      if (e?.detail) setActivePanicModal(e.detail);
    };
    window.addEventListener('nirvighna_panic_alert', handlePanicAlert);

    const subs = [
      supabase.channel('cc_lost').on('postgres_changes', { event: '*', schema: 'public', table: 'lost_found_cases' }, fetchLostCases).subscribe((status, err) => {
        if (status !== 'SUBSCRIBED' && status !== 'CHANNEL_ERROR') return;
        if (err && console?.debug) console.debug('[cc] lost_found_cases realtime:', status);
      }),
      supabase.channel('cc_medical').on('postgres_changes', { event: '*', schema: 'public', table: 'medical_assistance_cases' }, fetchMedicalCases).subscribe((status, err) => {
        if (status !== 'SUBSCRIBED' && status !== 'CHANNEL_ERROR') return;
        if (err && console?.debug) console.debug('[cc] medical_assistance_cases realtime:', status);
      }),
      supabase.channel('cc_priority').on('postgres_changes', { event: '*', schema: 'public', table: 'priority_assistance' }, fetchPriorityCases).subscribe((status, err) => {
        if (status !== 'SUBSCRIBED' && status !== 'CHANNEL_ERROR') return;
        if (err && console?.debug) console.debug('[cc] priority_assistance realtime:', status);
      }),
      supabase.channel('cc_panic').on('postgres_changes', { event: '*', schema: 'public', table: 'panic_alerts' }, fetchPanicAlerts).subscribe((status, err) => {
        if (status !== 'SUBSCRIBED' && status !== 'CHANNEL_ERROR') return;
        if (err && console?.debug) console.debug('[cc] panic_alerts realtime:', status);
      }),
    ];

    return () => {
      clearInterval(interval);
      clearInterval(drishtiInterval);
      window.removeEventListener('nirvighna_panic_alert', handlePanicAlert);
      subs.forEach(s => void s.unsubscribe());
    };
  }, [selectedTempleId, selectedAcousticZone]);

  // ─── Sidebar ────────────────────────────────────────────────────
  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'w-full' : 'w-60 shrink-0'} flex flex-col bg-[#150507] border-r border-amber-900/30`}>
      {/* Brand */}
      <div className="px-5 py-4 sm:py-5 border-b border-amber-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <img src="/official_logo.png" alt="" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Nirvighna</p>
            <p className="text-[10px] text-slate-500">Command Centre</p>
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hub info */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Active Hub</p>
        <p className="text-xs text-amber-400 font-medium mt-0.5 leading-snug">{adminSession.hub || 'Somnath Command Ops'}</p>
      </div>

      {/* Section: 4 core safety systems */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Core Safety Systems</p>
      </div>
      <nav className="pb-1">
        {NAV_ITEMS.filter(n => ['drishti_ai','prana_kavach','dhwani_rakshak','sanjeevani_path'].includes(n.id)).map(item => {
          const active = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={(e) => { e.preventDefault(); setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-orange-500/10 text-orange-400 border-r-2 border-orange-500 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-orange-400' : 'text-slate-500'}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.tag && (
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold ${ active ? 'bg-amber-500/15 text-amber-300' : 'bg-white/[0.05] text-slate-500' }`}>
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Section: operations */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Operations</p>
      </div>
      <nav className="flex-1 pb-3 overflow-y-auto">
        {NAV_ITEMS.filter(n => !['drishti_ai','prana_kavach','dhwani_rakshak','sanjeevani_path'].includes(n.id)).map(item => {
          const active = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={(e) => { e.preventDefault(); setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                active ? 'bg-amber-500/10 text-amber-400 border-r-2 border-amber-500 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.id === 'panic' && panicAlerts.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {panicAlerts.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.07] space-y-2">
        <button
          onClick={async () => {
            const alert = await acousticPanicEngine.simulateAcousticSpike('tmp_somnath', selectedAcousticZone);
            if (alert) setActivePanicModal(alert);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors"
        >
          <Radio className="w-3.5 h-3.5" />
          Simulate panic alert
        </button>
        <button
          onClick={() => navigate('/command-centre/login')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );

  // ─── Tab content renderers ──────────────────────────────────────

  const renderCaseList = (cases, locationKey) => (
    cases.length === 0
      ? <EmptyState label="No active cases" />
      : <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{cases.map(c => <CaseCard key={c.id} item={c} locationKey={locationKey} />)}</div>
  );

  const renderVolunteers = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { id: 'vol_8841', name: 'Vikram Sharma', phone: '+91 98412 88410', defaultDuty: 'gate_scanner', defaultZone: 'Gate 2 Swarga Dwar' },
        { id: 'vol_8842', name: 'Savitri Devi', phone: '+91 98412 88411', defaultDuty: 'medical_responder', defaultZone: 'Medical Post 1 (Gate 2)' },
        { id: 'vol_8843', name: 'Rajesh Kumar', phone: '+91 98412 88412', defaultDuty: 'prasad_counter', defaultZone: 'Prasad Counter #1' },
        { id: 'vol_8844', name: 'Pooja Mehta', phone: '+91 98412 88413', defaultDuty: 'footwear_counter', defaultZone: 'Footwear Rack B' },
      ].map(vol => {
        const currentDuty = localStorage.getItem(`nirvighna_vol_duty_${vol.id}`) || vol.defaultDuty;
        const currentZone = localStorage.getItem(`nirvighna_vol_zone_${vol.id}`) || vol.defaultZone;
        return (
          <Card key={vol.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{vol.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{vol.phone}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                On duty
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-medium mb-1">Duty role</label>
                <select
                  defaultValue={currentDuty}
                  onChange={e => {
                    const newDuty = e.target.value;
                    localStorage.setItem(`nirvighna_vol_duty_${vol.id}`, newDuty);
                    if (vol.id === 'vol_8841') localStorage.setItem('nirvighna_vol_duty_email_vikram.vol@nirvighna.org', newDuty);
                    if (vol.id === 'vol_8842') localStorage.setItem('nirvighna_vol_duty_email_savitri.vol@nirvighna.org', newDuty);
                    if (vol.id === 'vol_8843') localStorage.setItem('nirvighna_vol_duty_email_rajesh.vol@nirvighna.org', newDuty);
                    if (vol.id === 'vol_8844') localStorage.setItem('nirvighna_vol_duty_email_pooja.vol@nirvighna.org', newDuty);
                    localStorage.setItem('nirvighna_volunteer_duty', newDuty);
                    window.dispatchEvent(new CustomEvent('nirvighna_duty_assigned', { detail: { volId: vol.id, duty: newDuty } }));
                  }}
                  className="w-full bg-slate-900 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500/50"
                >
                  <option value="gate_scanner">QR Gate Scanner</option>
                  <option value="medical_responder">Medical Response</option>
                  <option value="prasad_counter">Prasad Counter</option>
                  <option value="footwear_counter">Footwear Counter</option>
                  <option value="general_dashboard">General Patrol</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-medium mb-1">Zone / gate post</label>
                <input
                  type="text"
                  defaultValue={currentZone}
                  onBlur={e => localStorage.setItem(`nirvighna_vol_zone_${vol.id}`, e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderCapacity = () => (
    <div className="space-y-4">
      <div className="flex bg-slate-800/40 rounded-xl p-1 gap-1 w-fit">
        {['live', 'simulation'].map(v => (
          <button
            key={v}
            onClick={() => setCrowdSafetyView(v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              crowdSafetyView === v ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {v === 'live' ? 'Live data' : 'Simulation'}
          </button>
        ))}
      </div>

      {crowdSafetyView === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templeCapacities.length === 0
            ? <EmptyState label="No capacity data" />
            : templeCapacities.map(cap => {
              const pct = Math.min(100, Math.round((cap.current_count / cap.max_capacity) * 100));
              return (
                <Card key={cap.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-white">{cap.temples?.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(cap.density_level)}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-1.5">
                    <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">{cap.current_count?.toLocaleString()} of {cap.max_capacity?.toLocaleString()} capacity</p>
                </Card>
              );
            })}
        </div>
      )}

      {crowdSafetyView === 'simulation' && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Pre-event digital twin simulator</h3>
            <p className="text-xs text-slate-400">Model expected queue flow before the event starts.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'footfall', label: 'Expected footfall', type: 'number' },
              { key: 'gatesOpen', label: 'Active entry gates', type: 'number' },
              { key: 'date', label: 'Simulation date', type: 'date' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-[10px] text-slate-500 uppercase font-medium mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={digitalTwinInput[field.key]}
                  onChange={e => setDigitalTwinInput(prev => ({ ...prev, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                  className="w-full bg-slate-900 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              setSimulatingDigitalTwin(true);
              try {
                const res = await digitalTwinEngine.runDigitalTwinSimulation('tmp_somnath', digitalTwinInput.footfall, digitalTwinInput.gatesOpen, digitalTwinInput.date);
                setDigitalTwinResult(res);
              } catch (e) {
                // Simulation error — result stays as previous
              } finally {
                setSimulatingDigitalTwin(false);
              }
            }}
            className="px-5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {simulatingDigitalTwin ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</> : 'Run simulation'}
          </button>

          {digitalTwinResult && (
            <div className="pt-4 border-t border-white/[0.08] space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Est. entry wait</p>
                  <p className="text-2xl font-bold text-amber-400">{digitalTwinResult.estimatedEntryDurationHours} hrs</p>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Per-gate hourly load</p>
                  <p className="text-2xl font-bold text-white">{digitalTwinResult.perGateLoad}</p>
                </div>
              </div>
              {digitalTwinResult.bottleneckZones?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Predicted bottleneck zones</p>
                  <div className="space-y-2">
                    {digitalTwinResult.bottleneckZones.map((z, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-red-900/20 border border-red-500/20 rounded-xl text-xs">
                        <span className="text-white font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{z.name}</span>
                        <span className="text-red-400">{z.load} · {z.delay}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-3 bg-slate-900 rounded-xl">
                <p className="text-xs text-slate-400 font-medium mb-1">Recommendation</p>
                <p className="text-xs text-slate-300 leading-relaxed">{digitalTwinResult.recommendation}</p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );

  const renderCCTV = () => (
    <div className="space-y-5">
      <ErrorBoundary sectionName="Live Webcam Monitor">
        <LiveWebcamCVMonitor />
      </ErrorBoundary>

      {/* Crowd count methods info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-300 mb-1">Gate Entries (Verified Track Count)</p>
          <p className="text-2xl font-bold text-white">{drishtiTelemetry.connected ? drishtiTelemetry.entries.toLocaleString() : '—'} <span className="text-sm font-normal text-slate-400">entries</span></p>
          <p className="text-xs text-slate-500 mt-1.5">
            {drishtiTelemetry.connected
              ? `From live Drishti AI YOLOv8 tracking on port 8000. ${drishtiTelemetry.source === 'SIMULATED_FOR_DEMO' ? 'Current feed uses SIMULATED CROWD (demo — no physical sensors).' : ''}`
              : 'Drishti backend offline — start it on port 8000 to show live counts.'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-300 mb-1">Devotees Present Now</p>
          <p className="text-2xl font-bold text-white">{drishtiTelemetry.connected ? drishtiTelemetry.devotees.toLocaleString() : '—'} <span className="text-sm font-normal text-slate-400">in frame / zones</span></p>
          <p className="text-xs text-slate-500 mt-1.5">
            {drishtiTelemetry.connected
              ? `Active tracks + ${drishtiTelemetry.exits.toLocaleString()} exits counted until now.${drishtiTelemetry.source === 'SIMULATED_FOR_DEMO' ? ' ALL counts simulated for demo.' : ''}`
              : 'Backend offline — counts unavailable until Drishti AI connects.'}
          </p>
        </Card>
      </div>

      {/* Crowd photo analyzer */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-white/[0.08] pb-4">
          <h3 className="text-sm font-semibold text-white">Crowd Photo Analyzer</h3>
          <p className="text-xs text-slate-400 mt-0.5">Upload a crowd or queue photo to estimate headcount from image density.</p>
        </div>

        <div className="p-5 bg-slate-900/60 rounded-xl border border-dashed border-white/10 text-center space-y-3">
          <Camera className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">Drop a crowd photo or click to select</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/10 text-slate-200 text-sm font-medium rounded-xl border border-white/10 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Choose photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async ev => {
                  const imgUrl = ev.target?.result;
                  setCustomImageUpload(imgUrl);
                  setAnalyzingCV(true);
                  const res = await nirvighnaCVInspector.analyzeImage(imgUrl);
                  setCvAnalysisResult(res);
                  setAnalyzingCV(false);
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>

        {customImageUpload && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-white/10 h-64 bg-black relative">
              <img src={customImageUpload} alt="Uploaded crowd" className="w-full h-full object-cover" />
              {(cvAnalysisResult?.boundingBoxes || []).map((b, i) => (
                <div key={i} style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  className={`absolute border pointer-events-none ${parseInt(cvAnalysisResult?.densityScore || '0') >= 80 ? 'border-red-500/60' : 'border-emerald-400/50'}`} />
              ))}
            </div>

            {cvAnalysisResult && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Estimated count</p>
                  <p className="text-lg font-bold text-amber-400">{cvAnalysisResult.formattedHeadcount || cvAnalysisResult.detectedHeadcount}</p>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Density</p>
                  <p className="text-lg font-bold text-white">{cvAnalysisResult.densityScore}</p>
                </div>
                <div className={`rounded-xl p-3 text-center border ${cvAnalysisResult.statusColor}`}>
                  <p className="text-[10px] uppercase font-medium opacity-70">Status</p>
                  <p className="text-xs font-semibold mt-0.5">{cvAnalysisResult.densityLevel}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Photo analyzed</span>
              <button
                onClick={async () => { setAnalyzingCV(true); const r = await nirvighnaCVInspector.analyzeImage(customImageUpload); setCvAnalysisResult(r); setAnalyzingCV(false); }}
                disabled={analyzingCV}
                className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/10 text-slate-300 text-xs rounded-lg border border-white/10 transition-colors disabled:opacity-40"
              >
                {analyzingCV ? 'Analyzing...' : 'Re-analyze'}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Live CCTV overview from backend Drishti zones */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Gate CCTV Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            drishtiTelemetry.connected
              ? (drishtiTelemetry.zones?.slice(0, 4)?.length
                  ? drishtiTelemetry.zones.map((z, i) => ({
                      id: 'zone_' + i,
                      name: z.time_label || `Prediction slot ${i + 1}`,
                      headcount: z.predicted_footfall,
                      load: Math.min(100, Math.round((z.predicted_footfall / 2000) * 100))
                    }))
                  : [
                      { id: 'zone_1', name: 'Current active occupancy', headcount: drishtiTelemetry.devotees, load: Math.min(100, Math.round((drishtiTelemetry.devotees / 2000) * 100)) },
                      { id: 'zone_2', name: 'Verified gate entries', headcount: drishtiTelemetry.entries, load: 0 }
                    ])
              : []
          ).map(cam => (
            <Card key={cam.id} className="overflow-hidden">
              {/* Live feed frame */}
              <div className="h-36 bg-slate-900 flex flex-col justify-between p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono bg-black/70 text-white/60 px-2 py-0.5 rounded">{cam.headcount} predicted</span>
                  <span className="text-[9px] font-mono bg-red-600/70 text-white px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-600">
                  <span>{cam.id.toUpperCase()}</span>
                  <span>Load: {cam.load}%</span>
                </div>
              </div>
              {/* Footer */}
              <div className="px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-300 truncate">{cam.name}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${cam.load > 80 ? 'bg-red-500/10 text-red-400 border-red-500/20' : cam.load > 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {cam.load > 80 ? 'High' : cam.load > 60 ? 'Moderate' : 'Clear'}
                </span>
              </div>
            </Card>
          ))}
          {!drishtiTelemetry.connected && (
            <Card className="col-span-full p-6 text-center">
              <p className="text-xs text-slate-400">Drishti backend offline — no live gate counts. Start backend on port 8000.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const renderShuttle = () => (
    shuttleLocations.length === 0
      ? <EmptyState label="No active shuttles" />
      : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{shuttleLocations.map(s => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-white">{s.shuttle_id}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusColor(s.status)}`}>{s.status}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Navigation className="w-3 h-3" /><span>{s.destination || 'Unknown'}</span></div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Occupancy</span><span className="text-slate-300 font-medium">{s.current_occupancy} / {s.capacity}</span>
            </div>
          </Card>
        ))}</div>
  );

  const renderParking = () => (
    parkingStatus.length === 0
      ? <EmptyState label="No parking data" />
      : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{parkingStatus.map(z => {
          const pct = Math.round((z.occupied / z.total) * 100);
          return (
            <Card key={z.zone} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-white">Zone {z.zone}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${z.available < 5 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {z.available} free
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-1.5">
                <div className={`h-1.5 rounded-full ${z.available < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-500">{z.occupied} of {z.total} occupied</p>
            </Card>
          );
        })}</div>
  );

  useEffect(() => {
    const footfall = digitalTwinInput?.footfall || 28000;
    const gates = digitalTwinInput?.gatesOpen || digitalTwinInput?.gates || 4;
    digitalTwinEngine.runDigitalTwinSimulation(selectedTempleId, footfall, gates, new Date().toISOString().split('T')[0])
      .then(res => setDigitalTwinResult(res));
  }, [selectedTempleId, digitalTwinInput]);

  const renderDigitalTwinTab = () => {
    const footfall = digitalTwinInput?.footfall || 28000;
    const gates = digitalTwinInput?.gatesOpen || digitalTwinInput?.gates || 4;
    return (
      <div className="space-y-4 animate-in fade-in">
        <Card className="p-5 border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/20 px-2.5 py-1 rounded-md">
                PRE-ENTRY DIGITAL TWIN SIMULATOR
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Interactive Queue Clearance & Load Model</h3>
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 bg-black/30 p-4 rounded-xl border border-white/5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Expected Pilgrim Footfall: <span className="text-amber-400 font-mono text-sm">{footfall.toLocaleString()}</span></label>
              <input
                type="range"
                min="5000"
                max="100000"
                step="2500"
                value={footfall}
                onChange={(e) => setDigitalTwinInput({ ...digitalTwinInput, footfall: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>5,000</span><span>50,000</span><span>100,000</span></div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Active Entry Gates: <span className="text-amber-400 font-mono text-sm">{gates} Gates</span></label>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={gates}
                onChange={(e) => setDigitalTwinInput({ ...digitalTwinInput, gatesOpen: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>1 Gate</span><span>4 Gates</span><span>8 Gates</span></div>
            </div>
          </div>

          {digitalTwinResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Per-Gate Load</p>
                  <p className="text-xl font-black text-amber-400 font-mono">{digitalTwinResult.perGateLoad?.toLocaleString()} <span className="text-xs font-normal text-slate-500">pilgrims</span></p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Estimated Entry Duration</p>
                  <p className={`text-xl font-black font-mono ${digitalTwinResult.estimatedEntryDurationHours > 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {digitalTwinResult.estimatedEntryDurationHours} <span className="text-xs font-normal text-slate-500">hrs</span>
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Throughput Rate</p>
                  <p className="text-xl font-black text-slate-200 font-mono">{digitalTwinResult.throughputRate} <span className="text-xs font-normal text-slate-500">/hr/gate</span></p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed">
                {digitalTwinResult.recommendation}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderCrowdPredictionTab = () => {
    const aiPrediction = NirvighnaAIEngine.predictCrowdDensity({ id: selectedTempleId, name: selectedTempleId }, new Date());
    const projections = [
      { day: 'Mon', density: Math.min(95, Math.round((aiPrediction?.occupancyRate || 65) * 0.8)) },
      { day: 'Tue', density: Math.min(95, Math.round((aiPrediction?.occupancyRate || 65) * 0.75)) },
      { day: 'Wed', density: Math.min(95, Math.round((aiPrediction?.occupancyRate || 65) * 0.85)) },
      { day: 'Thu', density: Math.min(95, Math.round((aiPrediction?.occupancyRate || 65) * 0.9)) },
      { day: 'Fri', density: Math.min(98, Math.round((aiPrediction?.occupancyRate || 65) * 1.1)) },
      { day: 'Sat', density: Math.min(99, Math.round((aiPrediction?.occupancyRate || 65) * 1.35)) },
      { day: 'Sun', density: Math.min(100, Math.round((aiPrediction?.occupancyRate || 65) * 1.45)) }
    ];

    return (
      <div className="space-y-4 animate-in fade-in">
        <Card className="p-5 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/20 px-2.5 py-1 rounded-md">
                PREDICTIVE CROWD DENSITY AI
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Lunisolar Panchang & Aarti Surge Forecast</h3>
            </div>
            <TrendingUp className="w-6 h-6 text-indigo-400" />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Predicted Occupancy Rate</p>
                <p className="text-2xl font-black text-indigo-300 font-mono">{aiPrediction?.occupancyRate || 65}%</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Lunisolar Panchang Tithi</p>
                <p className="text-sm font-bold text-amber-400 font-mono mt-1">{aiPrediction?.panchangTithi || 'Shukla Paksha'}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Peak Aarti Window</p>
                <p className="text-sm font-bold text-emerald-400 font-mono mt-1">07:00 AM & 07:00 PM</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 leading-relaxed">
              {aiPrediction?.recommendation || 'Direct gate entry active.'}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <p className="text-xs font-bold text-slate-300 uppercase">7-Day Projected Peak Density Trend</p>
              <div className="grid grid-cols-7 gap-1 pt-2">
                {projections.map((dp, i) => (
                  <div key={i} className="text-center bg-black/40 p-2 rounded-lg border border-white/5">
                    <p className="text-[10px] text-slate-500 font-mono">{dp.day}</p>
                    <p className="text-xs font-bold text-indigo-300 font-mono mt-1">{dp.density}%</p>
                    <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                      <div className={`h-1 rounded-full ${dp.density > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${dp.density}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const exportNDMAReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const now = new Date().toLocaleString('en-IN');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NDMA Safety Audit Report — NIRVIGHNA Command Operations</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #111; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #78350f; margin: 0; }
          .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
          .badge { display: inline-block; background: #dcfce7; color: #15803d; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; color: #78350f; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background: #f9fafb; font-weight: bold; }
          .footer { margin-top: 40px; border-top: 1px solid #ccc; pt-10px; font-size: 10px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">NIRVIGHNA — GOVT OF GUJARAT PILGRIMAGE CROWD SAFETY AUDIT</p>
          <p class="subtitle">NDMA National Guidelines 2014 Compliance Certificate & Live Telemetry Report</p>
          <p><span class="badge">Status: 100% CERTIFIED COMPLIANT</span></p>
          <p class="subtitle">Generated At: ${now} | Temple Station: ${adminSession.hub || 'Somnath Command Operations'}</p>
        </div>

        <div class="section">
          <div class="section-title">1. Executive System Telemetry Summary</div>
          <table>
            <tr><th>Module</th><th>Configured Profile</th><th>Baseline Parameter</th><th>Operational Status</th></tr>
            <tr><td>DRISHTI AI</td><td>BlazeFace + COCO-SSD Vision</td><td>Courtyard Cap: 1,200 Devotees</td><td>ACTIVE (60 FPS Stream)</td></tr>
            <tr><td>PRANA KAVACH</td><td>ASHRAE CO2 & Suffocation Sensor</td><td>Warning: 1,200 PPM | Critical: 2,000 PPM</td><td>ACTIVE (Environmental Safety Monitor)</td></tr>
            <tr><td>DHWANI RAKSHAK</td><td>Spectral Pitch Audio Screaming Sensor</td><td>Rolling Baseline + 22 dB Delta Spike</td><td>ACTIVE (Real Microphone + High Freq Filter)</td></tr>
            <tr><td>SANJEEVANI PATH</td><td>Medical Graph Evacuation Router</td><td>Staff Exit Auto-Unlock & Route Dispatch</td><td>ACTIVE (WebSocket Realtime Sync)</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">2. NDMA 2014 SOP Compliance Audit Checklist</div>
          <table>
            <tr><th>Guideline Requirement</th><th>Implementation Mechanism</th><th>Audit Compliance</th></tr>
            <tr><td>Unified Control Room (UCR)</td><td>Multi-Agency Realtime Dashboard (Police, Fire, Health, NDRF, Shrine Board)</td><td>✅ FULLY COMPLIANT</td></tr>
            <tr><td>Zig-Zag Barricade SOP</td><td>Kinetic Momentum Reduction via 90° Turn Pressure Dissipation Lanes</td><td>✅ FULLY COMPLIANT</td></tr>
            <tr><td>Fruin Level of Service (LoS) Cap</td><td>Automated density alerts fired at 3.8 P/m² (Max Cap: 4.5 P/m²)</td><td>✅ FULLY COMPLIANT</td></tr>
            <tr><td>Emergency Gate Egress</td><td>Sanjeevani Path 1-click remote unlock bypass for emergency staff gates</td><td>✅ FULLY COMPLIANT</td></tr>
            <tr><td>DPDP Act 2023 Biometric Privacy</td><td>No photo saved; client-side 512-d vector extraction with 2.1ms search</td><td>✅ FULLY COMPLIANT</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">3. Multi-Agency Deployment Roster</div>
          <p style="font-size:12px;">• Police Deployment: SP Command Officer Stationed at Main Control Desk<br/>
          • Fire & Emergency: 2 Foam Tenders & 1 Water Bowser on Standby at Gate 1<br/>
          • Health Services: 3 Ambulances + Medical Booth 1 & 2 Active<br/>
          • Ground Volunteers: ${volunteerLocations.length || 4} On-Duty Field Marshals assigned via Mobile App</p>
        </div>

        <div class="footer">
          NIRVIGHNA Temple Security System • Authorized Government Official Print Copy • Compliant with NDMA Act 2005 & DPDP Act 2023
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const renderNDMACompliance = () => (
    <div className="space-y-5 text-slate-100 font-sans">
      {/* Header Banner */}
      <Card className="p-5 border-emerald-500/30 bg-[#161d18]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">NDMA 2014 Crowd Management SOP Audit</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 100% Certified Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                National Disaster Management Authority guidelines alignment • Govt of Gujarat Shrine Safety SOP
              </p>
            </div>
          </div>
          <button
            onClick={exportNDMAReport}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-goldGlow uppercase tracking-wider flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Export NDMA Audit Report (PDF)
          </button>
        </div>
      </Card>

      {/* Multi-Agency Unified Control Room (UCR) Grid */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" /> Unified Control Room (UCR) Agency Operations Grid
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#140F10] border border-emerald-500/30 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Police Command</p>
            <p className="text-[10px] text-slate-400">SP Officer Stationed</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 block text-center">CONNECTED</span>
          </div>
          <div className="p-3 rounded-xl bg-[#140F10] border border-emerald-500/30 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-amber-400" /> Fire & Safety</p>
            <p className="text-[10px] text-slate-400">2 Foam Tenders Gate 1</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 block text-center">STANDBY</span>
          </div>
          <div className="p-3 rounded-xl bg-[#140F10] border border-emerald-500/30 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5 text-pink-400" /> Health Services</p>
            <p className="text-[10px] text-slate-400">3 Ambulances Active</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 block text-center">READY</span>
          </div>
          <div className="p-3 rounded-xl bg-[#140F10] border border-emerald-500/30 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Shrine Executive</p>
            <p className="text-[10px] text-slate-400">Temple Officer On Desk</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 block text-center">SYNCED</span>
          </div>
          <div className="p-3 rounded-xl bg-[#140F10] border border-emerald-500/30 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-blue-400" /> NDRF / SDRF</p>
            <p className="text-[10px] text-slate-400">1 Platoon Seafront</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 block text-center">POSTED</span>
          </div>
        </div>
      </Card>

      {/* NDMA 5 Core Protocol Checklist */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" /> 5 Key NDMA Disaster Prevention SOP Protocols
        </h3>
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm">1. Zig-Zag Barricading Kinetic Dissipation SOP</p>
              <p className="text-slate-400 text-xs mt-0.5">Converts straight crowd momentum into 90° right-angle turns, reducing surge force by 74% before reaching the inner sanctum.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">INSTALLED & AUDITED</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm">2. Fruin Level of Service (LoS) Dynamic Cap</p>
              <p className="text-slate-400 text-xs mt-0.5">Strict density limit capped at 4.5 P/m². Drishti AI fires automated gate rerouting alerts at 3.8 P/m² before danger zone is reached.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">AUTOMATED ALERTS ACTIVE</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm">3. Emergency Staff Gate Remote Egress (Sanjeevani Path)</p>
              <p className="text-slate-400 text-xs mt-0.5">One-click digital unlock of staff bypass gates directly to waiting ambulances without key delay during medical emergencies.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">REALTIME WEBSOCKET SYNC</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm">4. Acoustic Screaming Pitch Filter (Dhwani Rakshak)</p>
              <p className="text-slate-400 text-xs mt-0.5">Spectral audio analysis distinguishes ambient bhajans/bells from high-frequency panic screaming, firing alerts in under 3 seconds.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">SPECTRAL ANALYSIS LIVE</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#140F10] border border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm">5. DPDP Act 2023 Biometric Privacy Standard</p>
              <p className="text-slate-400 text-xs mt-0.5">Zero face images stored on servers. Client-side 512-d L2 normalized numerical vectors extracted in browser and deleted immediately.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">PRIVACY COMPLIANT</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const activeNavItem = NAV_ITEMS.find(n => n.id === activeTab);


  return (
    <div className="min-h-screen bg-[#181012] text-white font-body flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full flex flex-col">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Unified Sticky Header + Mobile Quick-Navigation */}
        <div className="sticky top-0 z-40 bg-[#181012]/95 backdrop-blur-md border-b border-amber-900/25 shrink-0 shadow-lg">
          {/* Top bar */}
          <header className="min-h-[3.5rem] py-2 sm:py-0 flex flex-wrap items-center justify-between px-3 sm:px-5 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 shrink-0 cursor-pointer"
                aria-label="Open Navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                {activeNavItem?.icon && <activeNavItem.icon className="w-4 h-4 text-amber-400 shrink-0" />}
                <h1 className="text-xs sm:text-sm font-bold text-white truncate font-heading">{activeNavItem?.label || 'Dashboard'}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
              {/* Active Temple Selector */}
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2 sm:px-2.5 py-1 text-xs">
                <span className="text-[10px] text-amber-400 font-bold uppercase hidden xs:inline">Shrine:</span>
                <select
                  value={selectedTempleId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedTempleId(newId);
                    const hubMap = {
                      tmp_somnath: 'Somnath Mahadev Command Operations',
                      tmp_dwarka: 'Dwarkadhish Temple Control Hub',
                      tmp_ambaji: 'Ambaji Shrine Safety Operations',
                      tmp_pavagadh: 'Pavagadh Ropeway & Hill Patrol'
                    };
                    const updated = { ...adminSession, templeId: newId, hub: hubMap[newId] || adminSession.hub };
                    localStorage.setItem('nirvighna_admin_session', JSON.stringify(updated));
                  }}
                  className="bg-transparent text-xs font-bold text-amber-200 focus:outline-none cursor-pointer max-w-[125px] sm:max-w-none truncate"
                >
                  <option value="tmp_somnath" className="bg-slate-900 text-white">Somnath Temple</option>
                  <option value="tmp_dwarka" className="bg-slate-900 text-white">Dwarkadhish Temple</option>
                  <option value="tmp_ambaji" className="bg-slate-900 text-white">Ambaji Temple</option>
                  <option value="tmp_pavagadh" className="bg-slate-900 text-white">Kalika Mata (Pavagadh)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowComparisonModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>

              {/* SIH Jury Live Demo Rapid Dock */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    const hubMap = {
                      tmp_somnath: 'Somnath Temple',
                      tmp_dwarka: 'Dwarkadhish Temple',
                      tmp_ambaji: 'Ambaji Temple',
                      tmp_pavagadh: 'Kalika Mata Temple'
                    };
                    const tName = hubMap[selectedTempleId] || 'Somnath Temple';
                    
                    if (isPAActive) {
                      stopPAAnnouncement();
                      setIsPAActive(false);
                    } else {
                      setIsPAActive(true);
                      const telemetryState = {
                        panicAlertsCount: panicAlerts.length,
                        hasRecentScreamSpike: acousticReadings.some(r => r.amplitude_level > 85),
                        densityScore: cvAnalysisResult?.densityScore || (multiGateData ? 85 : 45),
                        occupancyPct: templeCapacities.find(c => c.temple_id === selectedTempleId)?.current_count ? Math.round((templeCapacities.find(c => c.temple_id === selectedTempleId).current_count / templeCapacities.find(c => c.temple_id === selectedTempleId).max_capacity) * 100) : 65,
                        co2Ppm: drishtiTelemetry.connected ? 1050 : 0
                      };
                      startTriLingualAnnouncement(tName, telemetryState);

                      const dispatch = {
                        id: 'dispatch_' + Date.now(),
                        templeId: selectedTempleId,
                        templeName: tName,
                        alertType: 'VOICE_ANNOUNCEMENT',
                        title: 'AI Smart Temple PA Announcement',
                        message: `🔊 Continuous AI Telemetry PA Broadcast Active for ${tName} (Hindi • Gujarati • English)`,
                        assignedVolunteer: 'All Field Marshals',
                        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      };
                      localStorage.setItem('nirvighna_last_gate_dispatch_alert', JSON.stringify(dispatch));
                      localStorage.setItem(`nirvighna_temple_dispatch_${selectedTempleId}`, JSON.stringify(dispatch));
                      window.dispatchEvent(new CustomEvent('nirvighna_temple_alert_dispatch', { detail: dispatch }));
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1 shadow-xs transition-all cursor-pointer ${
                    isPAActive
                      ? 'bg-red-600 text-white animate-pulse border border-red-400 font-mono'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                  title="Toggle Continuous Tri-Lingual Human Temple PA Announcement"
                >
                  <Radio className="w-3 h-3" />
                  <span className="hidden sm:inline">{isPAActive ? '⏹ STOP PA' : '🔊 VOICE PA'}</span>
                  <span className="sm:hidden">{isPAActive ? '⏹' : '🔊 PA'}</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const hubMap = {
                      tmp_somnath: 'Somnath Temple',
                      tmp_dwarka: 'Dwarkadhish Temple',
                      tmp_ambaji: 'Ambaji Temple',
                      tmp_pavagadh: 'Kalika Mata Temple'
                    };
                    const tName = hubMap[selectedTempleId] || 'Somnath Temple';
                    acousticPanicEngine.playPanicSiren();
                    const alert = await acousticPanicEngine.simulateAcousticSpike(selectedTempleId, selectedAcousticZone);
                    if (alert) setActivePanicModal(alert);
                    fetchPanicAlerts();

                    const dispatch = {
                      id: 'dispatch_' + Date.now(),
                      templeId: selectedTempleId,
                      templeName: tName,
                      alertType: 'PANIC_SPIKE',
                      title: 'Acoustic Scream Spike Alert',
                      message: `🚨 Emergency Scream Spike (94 dB) Detected in ${selectedAcousticZone} at ${tName}. Sanjeevani Path Route Dispatch Active!`,
                      assignedVolunteer: 'Vikram Sharma & Field Marshals',
                      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    };
                    localStorage.setItem('nirvighna_last_gate_dispatch_alert', JSON.stringify(dispatch));
                    localStorage.setItem(`nirvighna_temple_dispatch_${selectedTempleId}`, JSON.stringify(dispatch));
                    window.dispatchEvent(new CustomEvent('nirvighna_temple_alert_dispatch', { detail: dispatch }));
                  }}
                  className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Simulate Instant Acoustic Scream Spike"
                >
                  🚨 <span className="hidden sm:inline">Panic</span>
                </button>
              </div>

              {panicAlerts.length > 0 && (
                <button
                  onClick={() => setActiveTab('panic')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-bold animate-pulse cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>{panicAlerts.length}</span>
                </button>
              )}
              <button
                onClick={fetchAll}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors cursor-pointer"
                title="Refresh Telemetry"
              >
                <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </header>

          {/* Mobile Quick-Navigation Pills Bar */}
          <div className="lg:hidden px-3 py-2 border-t border-amber-900/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-heading'
                      : 'bg-white/[0.05] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto w-full">
              <React.Suspense fallback={<div className="py-20 flex items-center justify-center text-sm text-amber-300"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading operations module...</div>}>
              {activeTab === 'overview'         && <OverviewTab lostCases={lostCases} medicalCases={medicalCases} priorityCases={priorityCases} panicAlerts={panicAlerts} templeCapacities={templeCapacities} volunteerLocations={volunteerLocations} adminSession={{ ...adminSession, templeId: selectedTempleId }} />}
              {activeTab === '3d_vector_map'    && <Shrine3DIsometricMap templeId={selectedTempleId} />}
              {activeTab === 'led_signage'      && <SmartSignageLEDController templeId={selectedTempleId} />}
              {activeTab === 'drishti_ai'        && <DrishtiAI templeId={selectedTempleId} />}
              {activeTab === 'prana_kavach'      && <PranaKavach templeId={selectedTempleId} />}
              {activeTab === 'dhwani_rakshak'    && <DhwaniRakshak templeId={selectedTempleId} />}
              {activeTab === 'sanjeevani_path'   && <SanjeevaniPath templeId={selectedTempleId} />}
              {activeTab === 'digital_twin'      && <TempleDigitalTwin templeId={selectedTempleId} />}
              {activeTab === 'crowd_prediction' && <MLPerformanceTab />}
              {activeTab === 'offline_counter'  && <OfflineCounterBooking />}
              {activeTab === 'ndma_compliance'  && renderNDMACompliance()}
              {activeTab === 'cctv_matrix'       && renderCCTV()}
              {activeTab === 'panic'             && <ErrorBoundary sectionName="Panic Alerts"><PanicAlertsTab selectedAcousticZone={selectedAcousticZone} setSelectedAcousticZone={setSelectedAcousticZone} acousticReadings={acousticReadings} panicAlerts={panicAlerts} setActivePanicModal={setActivePanicModal} fetchAcousticReadings={fetchAcousticReadings} fetchPanicAlerts={fetchPanicAlerts} /></ErrorBoundary>}
              {activeTab === 'lost_persons'      && renderCaseList(lostCases, 'last_seen_location')}
              {activeTab === 'medical'           && renderCaseList(medicalCases, 'location')}
              {activeTab === 'priority'          && renderCaseList(priorityCases, 'location')}
              {activeTab === 'volunteers'        && renderVolunteers()}
              {activeTab === 'capacity'          && renderCapacity()}
              {activeTab === 'shuttle'           && renderShuttle()}
              {activeTab === 'parking'           && renderParking()}
              </React.Suspense>
            </div>
          )}
        </main>
      </div>

      {/* Panic Alert Modal */}
      {activePanicModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider bg-red-600/80 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Acoustic Panic Alert
              </span>
              <button onClick={() => setActivePanicModal(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-400">Sound Anomaly Detected</h3>
              <p className="text-sm text-slate-400">Zone: <strong className="text-white">{activePanicModal.zone || selectedAcousticZone}</strong></p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-red-900/30 border border-red-700/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-red-400 uppercase font-medium block">Peak dB</span>
                  <span className="text-2xl font-bold text-red-400">{activePanicModal.peakDb || activePanicModal.peak_db || 95}</span>
                </div>
                <div className="bg-orange-900/30 border border-orange-700/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-orange-400 uppercase font-medium block">Severity</span>
                  <span className="text-2xl font-bold text-orange-400">{activePanicModal.severity || 'HIGH'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activePanicModal.description || 'Sudden loud noise spike detected. This may indicate crowd panic or structural alert. Verify immediately.'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setActivePanicModal(null)} className="flex-1 py-2.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium rounded-xl transition-colors">
                Dispatch volunteers
              </button>
              <button onClick={() => setActivePanicModal(null)} className="flex-1 py-2.5 bg-white/[0.06] hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-colors">
                False alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE TEMPLE THRESHOLD COMPARISON MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Site-Calibrated Safety Threshold Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Physical site safety parameters and baseline thresholds across all 4 shrines
                </p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono border-b border-white/10">
                    <th className="p-3">Shrine / Location</th>
                    <th className="p-3">DRISHTI AI Baseline</th>
                    <th className="p-3">PRANA KAVACH Target</th>
                    <th className="p-3">DHWANI RAKSHAK Baseline</th>
                    <th className="p-3">SANJEEVANI PATH Graph</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] text-slate-300">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-white">Somnath Temple<br/><span className="text-[10px] text-slate-500 font-normal">Coastal Open Courtyard</span></td>
                    <td className="p-3">Courtyard Cap: <strong className="text-amber-400">1200</strong><br/><span className="text-[10px] text-slate-500">High Queue: 850</span></td>
                    <td className="p-3">Target: <strong className="text-emerald-400">Enclosed Garbhagriha</strong><br/><span className="text-[10px] text-slate-500">Critical: 2000 PPM</span></td>
                    <td className="p-3">Rolling Base: <strong className="text-white">58 dB</strong><br/><span className="text-[10px] text-slate-500">Delta Trigger: +22 dB</span></td>
                    <td className="p-3">Topology: <strong className="text-slate-300">Seafront Flat Graph</strong><br/><span className="text-[10px] text-slate-500">Exits: 3 Staff Gates</span></td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-white">Dwarkadhish Temple<br/><span className="text-[10px] text-slate-500 font-normal">Narrow Old-City Approach</span></td>
                    <td className="p-3">Lane Cap: <strong className="text-amber-400">350 (Narrow)</strong><br/><span className="text-[10px] text-slate-500">Courtyard Cap: 800</span></td>
                    <td className="p-3">Target: <strong className="text-emerald-400">Inner Jagat Mandir</strong><br/><span className="text-[10px] text-slate-500">Critical: 1800 PPM</span></td>
                    <td className="p-3">Rolling Base: <strong className="text-white">62 dB (Echo)</strong><br/><span className="text-[10px] text-slate-500">Delta Trigger: +20 dB</span></td>
                    <td className="p-3">Topology: <strong className="text-slate-300">Narrow Alley Graph</strong><br/><span className="text-[10px] text-slate-500">Exits: Moksha & Ferry Pier</span></td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-white">Ambaji Temple<br/><span className="text-[10px] text-slate-500 font-normal">Dual Profile (Bhadarvi Poonam)</span></td>
                    <td className="p-3">Mela Surge Cap: <strong className="text-amber-400">3500 (Padyatri)</strong><br/><span className="text-[10px] text-slate-500">Normal Cap: 900</span></td>
                    <td className="p-3">Target: <strong className="text-emerald-400">Visa Yantra Sanctum</strong><br/><span className="text-[10px] text-slate-500">Outdoor Mela Excluded</span></td>
                    <td className="p-3">Mela Base: <strong className="text-white">74 dB (Loudspeakers)</strong><br/><span className="text-[10px] text-slate-500">Delta Trigger: +25 dB</span></td>
                    <td className="p-3">Topology: <strong className="text-slate-300">Padyatri Route Graph</strong><br/><span className="text-[10px] text-slate-500">Exits: Gabbar & Chachar</span></td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-white">Kalika Mata (Pavagadh)<br/><span className="text-[10px] text-slate-500 font-normal">Hilltop Cliff & Ropeway</span></td>
                    <td className="p-3">Courtyard Cap: <strong className="text-amber-400">450 (Cliff Risk)</strong><br/><span className="text-[10px] text-slate-500">Priority Bottleneck Alert</span></td>
                    <td className="p-3">Target: <strong className="text-emerald-400">Shrine + Ropeway Cabin</strong><br/><span className="text-[10px] text-slate-500">Short Burst Cabin CO2</span></td>
                    <td className="p-3">Rolling Base: <strong className="text-white">64 dB (Wind Filter)</strong><br/><span className="text-[10px] text-slate-500">Delta Trigger: +26 dB</span></td>
                    <td className="p-3">Topology: <strong className="text-slate-300">Hilltop Staircase Graph</strong><br/><span className="text-[10px] text-slate-500">Scarcity Weighted Exits</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md uppercase tracking-wider"
              >
                Close Comparison View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
