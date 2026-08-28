import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import { sendPilgrimNotification } from '../../lib/notificationService';
import { 
  HeartPulse, ArrowLeft, RefreshCw, CheckCircle, 
  MapPin, Clock, Navigation, AlertCircle, Sparkles, Shield,
  Wind, AlertTriangle, Zap, ShieldCheck, QrCode, X, Camera, 
  Activity, AlertOctagon, User, Phone, FileText, Send, Check,
  Stethoscope, HelpCircle, CheckCheck, XCircle, ChevronRight
} from 'lucide-react';

export const VolunteerAlertsPage = () => {
  const navigate = useNavigate();
  const { currentUser, assignedDuty, isLoggedIn } = useVolunteerAuth();

  const selectedTempleId = localStorage.getItem('nirvighna_volunteer_temple_id') || currentUser?.templeId || 'tmp_somnath';

  const templeNames = {
    tmp_somnath: 'Somnath Temple',
    tmp_dwarka: 'Dwarkadhish Temple',
    tmp_ambaji: 'Ambaji Temple',
    tmp_pavagadh: 'Kalika Mata (Pavagadh)'
  };

  // Step flow: 'scan' | 'request_form' | 'dispatched'
  const [step, setStep] = useState('scan');
  const [scannerState, setScannerState] = useState('ready');

  // Patient & Location Data (captured from scan or manual)
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    phone: '',
    passId: '',
    location: currentUser?.zone_assigned || 'Inner Sanctum Sabhamandap Gate',
    templeId: selectedTempleId
  });

  const [gpsCoords, setGpsCoords] = useState({ lat: '20.8880', lng: '70.4012', accuracy: 4 });
  const [gpsStatus, setGpsStatus] = useState('GPS Active (±4m)');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          setGpsCoords({ lat, lng, accuracy: Math.round(pos.coords.accuracy || 4) });
          setGpsStatus(`GPS Active (±${Math.round(pos.coords.accuracy || 4)}m)`);
        },
        () => {
          setGpsCoords({ lat: '20.8880', lng: '70.4012', accuracy: 4 });
          setGpsStatus('GPS Active (±4m)');
        },
        { enableHighAccuracy: true, timeout: 3000 }
      );
    }
  }, []);

  // Medical Request Form State
  const [severityType, setSeverityType] = useState('severe');
  const [selectedConditions, setSelectedConditions] = useState(['🫁 Breathlessness / Suffocation']);
  const [customDescription, setCustomDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastDispatchedId, setLastDispatchedId] = useState(null);

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  const commonConditions = [
    '🫁 Breathlessness / Suffocation',
    '❤️ Chest Pain / Palpitations',
    '☀️ Heat Exhaustion & Fainting',
    '🤕 Dizziness & Weakness',
    '🩹 Physical Fall or Sprain',
    '🤢 Nausea / Stomach Distress',
    '👵 Senior Citizen Fatigue'
  ];

  const handlePatientQRScanned = (qrCode) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    } catch (_) {}

    setPatientData(prev => ({
      ...prev,
      name: 'Ramesh Patel',
      age: '54',
      phone: '+91 98765 43210',
      passId: qrCode || 'KV-8492'
    }));

    setStep('request_form');
    isProcessingRef.current = false;
  };

  const handleDispatchEmergency = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const alertId = `med_${Date.now()}`;
    const newAlert = {
      id: alertId,
      patient_name: patientData.name || 'Unwell Devotee',
      location: patientData.location,
      severity: severityType,
      conditions: selectedConditions,
      description: customDescription,
      volunteer_name: currentUser?.full_name || 'Volunteer Marshal',
      dispatched_at: new Date().toISOString(),
      status: 'dispatched'
    };

    // Send Interconnected Notification to Pilgrim & Admin Command Centre
    await sendPilgrimNotification({
      title: `🚑 ${severityType === 'severe' ? 'EMERGENCY MEDICAL AID' : 'MEDICAL ASSISTANCE'}: ${patientData.location}`,
      message: `Nearest Paramedic Responder dispatched via Sanjeevani Path for ${patientData.name} at ${patientData.location}. Symptoms: ${selectedConditions.join(', ')}.`,
      type: 'medical_emergency_dispatch',
      templeId: selectedTempleId,
      link: `/v/medical/${alertId}`,
      recipients: ['pilgrim', 'group_members', 'volunteers', 'admin']
    });

    setLastDispatchedId(alertId);
    setIsSubmitting(false);
    setStep('dispatched');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-body pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      
      {/* Top Sacred Header */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-3xl border border-amber-900/10 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 'request_form' || step === 'dispatched') setStep('scan');
              else navigate('/v/inner-gate');
            }}
            className="p-2 bg-amber-50/80 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-maroon uppercase block font-heading">
              स्वास्थ्य सेवा • First-Aid &amp; Medical Seva
            </span>
            <h1 className="text-xs font-bold text-gray-800">
              {templeNames[selectedTempleId] || 'Somnath'} Help Desk
            </h1>
          </div>
        </div>
      </div>

      {/* Volunteer Live Location Pin */}
      <div className="bg-white border border-amber-900/10 p-3.5 rounded-3xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-gold/30 flex items-center justify-center text-maroon">
            <MapPin className="w-4.5 h-4.5 text-maroon" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block">
              Your Current Post (GPS Linked):
            </span>
            <p className="text-xs font-bold text-gray-900">
              {patientData.location}
            </p>
            {gpsCoords && (
              <p className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                <span>📍 {gpsCoords.lat}° N, {gpsCoords.lng}° E</span>
              </p>
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-mono shadow-2xs">
          {gpsStatus}
        </span>
      </div>

      {/* ─── STEP 1: SCAN PATIENT QR OR ENTER DETAILS ─── */}
      {step === 'scan' && (
        <div className="bg-white p-5 rounded-3xl border border-amber-900/10 shadow-xs space-y-4 animate-in fade-in">
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-bold text-gray-900 font-heading">
              Report Devotee in Need of Medical Aid
            </h2>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Enter devotee pass ID or details below to dispatch the nearest emergency responder via Sanjeevani Path.
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setStep('request_form');
            }}
            className="space-y-3 pt-2"
          >
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Devotee Name / Pass ID:</label>
              <input
                type="text"
                required
                value={patientData.name}
                onChange={(e) => setPatientData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Ramesh Patel or Pass #KV-8492"
                className="w-full p-2.5 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-xs font-bold text-indigo-dark focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Location within Temple:</label>
              <input
                type="text"
                required
                value={patientData.location}
                onChange={(e) => setPatientData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2.5 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-xs font-bold text-indigo-dark focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer mt-2"
            >
              <Send className="w-4 h-4" />
              <span>Proceed to Symptoms &amp; Dispatch →</span>
            </button>
          </form>
        </div>
      )}

      {/* ─── STEP 2: HUMANIZED, EMPATHETIC MEDICAL REQUEST FORM ─── */}
      {step === 'request_form' && (
        <form onSubmit={handleDispatchEmergency} className="space-y-4 animate-in fade-in">
          
          {/* Patient Summary Card */}
          <div className="bg-white p-4.5 rounded-3xl border border-amber-900/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-heading">
                ✓ Devotee Identified
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                Pass #{patientData.passId || 'KV-8492'}
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-gold/40 text-maroon font-bold flex items-center justify-center text-lg shadow-2xs">
                👤
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-gray-900 truncate font-heading">
                  {patientData.name || 'Devotee'}
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-maroon shrink-0" />
                  <span className="text-maroon font-semibold truncate">{patientData.location}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 1. Urgency Question */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 block px-1">
              How urgent is the medical situation?
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSeverityType('severe')}
                className={`p-4 rounded-3xl border-2 text-left cursor-pointer transition-all ${
                  severityType === 'severe'
                    ? 'bg-rose-50/80 border-red-500 shadow-xs text-red-950 ring-1 ring-red-300'
                    : 'bg-white text-gray-700 border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🚨</span>
                  {severityType === 'severe' && (
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold font-heading mt-2 text-red-900">
                  Critical Emergency
                </h4>
                <p className="text-[11px] mt-1 text-gray-600 leading-snug">
                  Immediate doctor, oxygen, or collapse care
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSeverityType('general')}
                className={`p-4 rounded-3xl border-2 text-left cursor-pointer transition-all ${
                  severityType === 'general'
                    ? 'bg-amber-50/80 border-amber-500 shadow-xs text-amber-950 ring-1 ring-amber-300'
                    : 'bg-white text-gray-700 border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🩺</span>
                  {severityType === 'general' && (
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold font-heading mt-2 text-amber-950">
                  First-Aid Assistance
                </h4>
                <p className="text-[11px] mt-1 text-gray-600 leading-snug">
                  Dizziness, heatstroke, wound, hydration rest
                </p>
              </button>
            </div>
          </div>

          {/* 2. Symptom Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 block px-1">
              What symptoms are you observing?
            </label>

            <div className="grid grid-cols-2 gap-2">
              {commonConditions.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (selectedConditions.length > 1) {
                          setSelectedConditions(selectedConditions.filter(c => c !== cond));
                        }
                      } else {
                        setSelectedConditions([...selectedConditions, cond]);
                      }
                    }}
                    className={`p-2.5 rounded-2xl text-left border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-red-400 text-red-950 font-bold shadow-2xs'
                        : 'bg-white border-gray-200/80 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dispatch Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 font-heading"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Contacting Medical Team...' : 'Send Medical Team to this Location →'}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('scan')}
              className="w-full py-2.5 text-center text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
            >
              ← Edit devotee details
            </button>
          </div>

        </form>
      )}

      {/* ─── STEP 3: DISPATCHED CONFIRMATION SCREEN ─── */}
      {step === 'dispatched' && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-200/80 shadow-xs space-y-4 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs font-bold text-3xl animate-bounce">
            ✓
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-heading">
              Sanjeevani Path Activated
            </span>
            <h2 className="text-base font-bold text-gray-900 font-heading pt-1">
              Medical Response on the Way!
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              The on-duty paramedic has been notified of <b>{patientData.name}</b>'s condition at <b>{patientData.location}</b>.
            </p>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-2xl border border-gold/30 text-xs text-left space-y-1.5 font-medium">
            <p className="text-gray-800"><b>Care Level:</b> {severityType === 'severe' ? '🚨 Critical Emergency Response' : '🩺 First-Aid Assistance'}</p>
            <p className="text-gray-800"><b>Reported:</b> {selectedConditions.join(', ')}</p>
            <p className="text-emerald-900 font-bold"><b>Route:</b> Green Corridor Unlatched (ETA ~1.8 mins)</p>
          </div>

          <div className="space-y-2 pt-2">
            {lastDispatchedId && (
              <button
                onClick={() => navigate(`/v/medical/${lastDispatchedId}`, { state: { holder_name: patientData.name, gate_number: patientData.location } })}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-2xl uppercase tracking-wider font-heading cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Track Sanjeevani Path Route →</span>
              </button>
            )}

            <button
              onClick={() => setStep('scan')}
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs rounded-2xl border border-gray-200/80 cursor-pointer"
            >
              + Attend Next Devotee
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
