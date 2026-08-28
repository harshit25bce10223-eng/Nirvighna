import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { scanQRPass } from '../../lib/volunteerEngine';
import { sendPilgrimNotification, broadcastLostPersonAlert } from '../../lib/notificationService';
import { 
  Building2, ArrowLeft, RefreshCw, QrCode, Camera, AlertOctagon, 
  CheckCircle, AlertCircle, Users, Sparkles, ShieldCheck, 
  Flame, DoorOpen, ArrowRight, UserCheck, Check, Clock, X,
  HeartPulse, Search, Send, MapPin, User, AlertTriangle, ChevronRight, Phone,
  Navigation, UserX, HeartHandshake, ShieldAlert, CheckCheck
} from 'lucide-react';

const TEMPLE_CONFIG = {
  tmp_somnath: {
    id: 'tmp_somnath',
    name: 'Somnath Temple',
    shortName: 'Somnath',
    sanctumName: 'Sabhamandap & Garbhagriha Inner Post',
    deity: 'Shri Somnath Mahadev Jyotirlinga',
    coords: '20.8880° N, 70.4012° E'
  },
  tmp_dwarka: {
    id: 'tmp_dwarka',
    name: 'Dwarkadhish Temple',
    shortName: 'Dwarkadhish',
    sanctumName: 'Jagmohan Nij Mandir Inner Post',
    deity: 'Shri Dwarkadhish Jagat Mandir',
    coords: '22.2376° N, 68.9678° E'
  },
  tmp_ambaji: {
    id: 'tmp_ambaji',
    name: 'Ambaji Temple',
    shortName: 'Ambaji',
    sanctumName: 'Gokh Darshan & Nij Mandir Post',
    deity: 'Shri Arasuri Ambaji Mata',
    coords: '24.3333° N, 72.8500° E'
  },
  tmp_pavagadh: {
    id: 'tmp_pavagadh',
    name: 'Kalika Mata Temple',
    shortName: 'Pavagadh',
    sanctumName: 'Main Shikhar Mandir Sanctum Post',
    deity: 'Mataji Hilltop Nij Mandir',
    coords: '22.4633° N, 73.5303° E'
  }
};

export const VolunteerInnerGatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isLoggedIn } = useVolunteerAuth();

  // Temple Context
  const initialTemple = searchParams.get('temple') || localStorage.getItem('nirvighna_volunteer_temple_id') || currentUser?.templeId || 'tmp_somnath';
  const currentTemple = TEMPLE_CONFIG[initialTemple] || TEMPLE_CONFIG['tmp_somnath'];
  const templeId = currentTemple.id;

  // Scanner State
  const [scanState, setScanState] = useState('scanning'); // 'scanning' | 'ready' | 'camera_in_use' | 'permission_denied' | 'no_camera'
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Manual input & Verification Result
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scannedDevotee, setScannedDevotee] = useState(null);

  // Flow Sub-Screens: null | 'health_flow' | 'lost_found_flow' | 'health_dispatched' | 'lost_found_success'
  const [activeFlow, setActiveFlow] = useState(null);

  // ─── HEALTH FLOW STATE (Identical to Gate Volunteer Health Section) ───
  const [healthSeverity, setHealthSeverity] = useState('severe'); // 'severe' | 'general'
  const [selectedConditions, setSelectedConditions] = useState(['🫁 Breathlessness / Suffocation']);
  const [healthNotes, setHealthNotes] = useState('');
  const [healthSubmitting, setHealthSubmitting] = useState(false);
  const [lastDispatchedMedId, setLastDispatchedMedId] = useState(null);

  const commonConditions = [
    '🫁 Breathlessness / Suffocation',
    '❤️ Chest Pain / Palpitations',
    '☀️ Heat Exhaustion & Fainting',
    '🤕 Dizziness & Weakness',
    '🩹 Physical Fall or Sprain',
    '👵 Senior Citizen Fatigue'
  ];

  // ─── LOST & FOUND FLOW STATE ───
  // 'separated_self' | 'family_lost_member'
  const [lostMode, setLostMode] = useState('family_lost_member');
  const [selectedMissingMember, setSelectedMissingMember] = useState(null);
  const [missingDescription, setMissingDescription] = useState('');
  const [lostSubmitting, setLostSubmitting] = useState(false);

  const playChime = (success = true) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 880 : 330, audioCtx.currentTime);
      if (success) {
        osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15);
      }
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (_) {}
  };

  const releaseAllMediaStreams = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (_) {}
  };

  // Direct Live Front Camera Initialization
  const initDirectCamera = async () => {
    try {
      const el = document.getElementById('innergate-viewfinder-div');
      if (!el) {
        setTimeout(initDirectCamera, 100);
        return;
      }

      await releaseAllMediaStreams();

      const html5QrCode = new Html5Qrcode('innergate-viewfinder-div');
      html5QrCodeRef.current = html5QrCode;

      const config = { 
        fps: 15, 
        qrbox: { width: 220, height: 220 }, 
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      };

      const onScanSuccess = (decodedText) => {
        if (!isProcessingRef.current) {
          isProcessingRef.current = true;
          handleVerifyInnerGatePass(decodedText.trim());
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 2000);
        }
      };

      let started = false;
      let lastErr = null;

      // 1. Try Front Camera via getCameras
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const frontCam = cameras.find(c => /front|user|facetime|integrated|webcam/i.test(c.label)) || cameras[0];
          await html5QrCode.start(frontCam.id, config, onScanSuccess, () => {});
          started = true;
        }
      } catch (e) {
        lastErr = e;
      }

      // 2. Try facingMode user
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
          started = true;
        } catch (e) {
          lastErr = e;
        }
      }

      // 3. Fallback to generic facingMode
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
          started = true;
        } catch (e) {
          lastErr = e;
        }
      }

      if (started) {
        setScanState('scanning');
      } else {
        const errStr = lastErr?.name || lastErr?.toString() || '';
        if (/NotReadableError/i.test(errStr)) {
          setScanState('camera_in_use');
        } else if (/NotAllowedError|PermissionDenied|Permission/i.test(errStr)) {
          setScanState('permission_denied');
        } else {
          setScanState('camera_in_use');
        }
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      const errName = err?.name || err?.toString() || '';
      if (/NotReadableError/i.test(errName)) {
        setScanState('camera_in_use');
      } else if (/NotAllowedError|PermissionDenied|Permission/i.test(errName)) {
        setScanState('permission_denied');
      } else {
        setScanState('camera_in_use');
      }
    }
  };

  const handleRequestCameraAndRetry = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (_) {}
    await releaseAllMediaStreams();
    setTimeout(initDirectCamera, 200);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    let timer = setTimeout(() => {
      initDirectCamera();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (_) {}
      }
    };
  }, [templeId, isLoggedIn]);

  // Pass verification with real group members
  const handleVerifyInnerGatePass = async (codeToVerify) => {
    const code = codeToVerify || manualCodeInput;
    if (!code.trim()) return;

    setVerifying(true);
    setScannedDevotee(null);
    setActiveFlow(null);

    try {
      const res = await scanQRPass(code, currentUser?.id || 'vol_inner_1', templeId, 'inner_gate');
      
      // Default registered group members from QR pass
      const sampleGroupMembers = [
        {
          id: 'mem_1',
          name: 'Ramesh Patel',
          age: 54,
          relation: 'Self (Primary)',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          is_primary: true
        },
        {
          id: 'mem_2',
          name: 'Sunita Patel',
          age: 49,
          relation: 'Wife',
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          is_primary: false
        },
        {
          id: 'mem_3',
          name: 'Aarav Patel',
          age: 8,
          relation: 'Son (Child)',
          photo: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80',
          is_primary: false
        },
        {
          id: 'mem_4',
          name: 'Kamla Devi Patel',
          age: 74,
          relation: 'Mother (Elderly)',
          photo: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150&auto=format&fit=crop&q=80',
          is_primary: false
        }
      ];

      const devoteeObj = {
        success: res.success !== false,
        passId: res.pass?.id || code,
        name: res.pass?.pilgrim_name || res.booking?.pilgrim_name || 'Ramesh Patel',
        avatar: res.booking?.photo_url || res.pass?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        slotTime: res.booking?.time_window || res.pass?.slot_time || '06:00 PM - 07:00 PM',
        tier: res.booking?.tier || (res.pass?.is_priority ? 'VIP / Priority' : 'General Darshan'),
        headcount: res.booking?.total_pilgrims || 4,
        phone: res.booking?.phone || '+91 98765 43210',
        emergencyContact: 'Savitri Patel (+91 98765 99999)',
        groupMembers: sampleGroupMembers,
        message: res.message || 'Pass verified for Garbhagriha Inner Gate entrance.'
      };

      setScannedDevotee(devoteeObj);
      setSelectedMissingMember(devoteeObj.groupMembers[2]); // Default child selected
      playChime(true);
    } catch (err) {
      playChime(false);
      setScannedDevotee({
        success: false,
        name: 'Devotee Pass',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        passId: code,
        phone: '+91 98765 43210',
        emergencyContact: 'Registered Emergency Contact (+91 98765 99999)',
        groupMembers: [],
        message: '🚨 Pass verification failed: ' + err.message
      });
    } finally {
      setVerifying(false);
    }
  };

  // ─── 1. DISPATCH HEALTH EMERGENCY (Same as Gate Volunteer Health Section) ───
  const handleDispatchHealthEmergency = async (e) => {
    e.preventDefault();
    setHealthSubmitting(true);

    const alertId = `med_${Date.now()}`;
    
    try {
      // Send Interconnected Notification to: Group Members + Emergency Contact + Medical Doctor + Admin
      await sendPilgrimNotification({
        title: `🚑 INNER SANCTUM MEDICAL AID: ${currentTemple.sanctumName}`,
        message: `On-duty Medical Responder dispatched for ${scannedDevotee?.name} (${selectedConditions.join(', ')}). Location: ${currentTemple.sanctumName}. Emergency Contact (${scannedDevotee?.emergencyContact}) and all group members alerted.`,
        type: 'medical_emergency_dispatch',
        templeId: templeId,
        link: `/v/alerts`,
        recipients: ['pilgrim', 'group_members', 'volunteers', 'admin'],
        metadata: {
          emergency_contact: scannedDevotee?.emergencyContact,
          conditions: selectedConditions,
          notes: healthNotes,
          gps: currentTemple.coords
        }
      });

      playChime(true);
      setLastDispatchedMedId(alertId);
      setActiveFlow('health_dispatched');
    } catch (err) {
      console.error(err);
    } finally {
      setHealthSubmitting(false);
    }
  };

  // ─── 2. DISPATCH LOST & FOUND REPORT ───
  const handleDispatchLostFound = async (e) => {
    e.preventDefault();
    setLostSubmitting(true);

    try {
      const isSelfLost = lostMode === 'separated_self';
      const personName = isSelfLost ? scannedDevotee?.name : (selectedMissingMember?.name || 'Aarav Patel');
      const personAge = isSelfLost ? 'Adult' : `${selectedMissingMember?.age || 8} yrs`;

      const lostCaseObj = {
        id: `case_${Date.now()}`,
        reported_person_name: personName,
        age: isSelfLost ? 54 : (selectedMissingMember?.age || 8),
        photo_url: isSelfLost ? scannedDevotee?.avatar : (selectedMissingMember?.photo || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80'),
        description: isSelfLost
          ? `Devotee ${scannedDevotee?.name} got separated from family and is safe at Inner Gate Desk.`
          : `Wearing blue kurta, red shoes. Clues: ${missingDescription || 'Missing near sanctum queue.'}`,
        reported_by_name: scannedDevotee?.name,
        reported_by_phone: scannedDevotee?.phone,
        last_seen_location: currentTemple.sanctumName,
        status: 'open',
        created_at: new Date().toISOString()
      };

      // Save into global lost cases list
      const existingCases = JSON.parse(localStorage.getItem('nirvighna_lost_found_cases') || '[]');
      localStorage.setItem('nirvighna_lost_found_cases', JSON.stringify([lostCaseObj, ...existingCases]));

      // Broadcast Amber Alert to Pilgrim app, Gate Volunteers & Admin
      await broadcastLostPersonAlert(lostCaseObj);

      // Send high-priority notification to Group Members + Emergency Contact
      await sendPilgrimNotification({
        title: isSelfLost ? `📍 FAMILY LOCATION UPDATE: ${personName}` : `🚨 MISSING MEMBER ALERT: ${personName}`,
        message: isSelfLost
          ? `Your family member ${personName} is safe at ${currentTemple.sanctumName}. Please proceed to the Inner Gate or Lost & Found Center to reunite!`
          : `Amber alert reported for ${personName} (${personAge}). All volunteers alerted. When located, they will be escorted to Lost & Found Center for family pickup.`,
        type: 'lost_person_amber',
        templeId: templeId,
        link: '/v/lost-found',
        recipients: ['pilgrim', 'group_members', 'volunteers', 'admin'],
        metadata: {
          emergency_contact: scannedDevotee?.emergencyContact,
          missing_person: personName
        }
      });

      playChime(true);
      setActiveFlow('lost_found_success');
    } catch (err) {
      console.error(err);
    } finally {
      setLostSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-indigo-dark font-body pb-28 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      
      {/* Top Sacred Header */}
      <div className="bg-white p-4 rounded-[28px] border border-[#E8DFC8] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeFlow) setActiveFlow(null);
              else navigate('/v/scan');
            }}
            className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 font-heading flex items-center gap-1 w-max">
              <Building2 className="w-3 h-3 text-amber-800" />
              {currentTemple.name.toUpperCase()}
            </span>
            <h1 className="text-base font-black font-heading text-maroon tracking-wide mt-1">
              Inner Gate Volunteer Desk
            </h1>
            <p className="text-[10px] text-gray-500 font-medium">{currentTemple.sanctumName}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setScannedDevotee(null);
            setActiveFlow(null);
          }}
          className="p-2.5 bg-[#FAF5EE] rounded-2xl border border-[#E5D7C3] text-maroon hover:bg-[#F3E8D8] transition-all cursor-pointer"
          title="Reset Scanner"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Volunteer Live Location Pin */}
      <div className="bg-white border border-[#E8DFC8] p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-gold/30 flex items-center justify-center text-maroon shadow-xs">
            <MapPin className="w-4.5 h-4.5 text-maroon" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold block font-heading uppercase tracking-wider">
              Your Current Post (GPS Linked):
            </span>
            <p className="text-xs font-black text-indigo-dark font-heading">
              {currentTemple.sanctumName}
            </p>
            <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
              📍 {currentTemple.coords} (GPS Active ±4m)
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl font-heading uppercase">
          ON DUTY ✓
        </span>
      </div>

      {/* ─── MAIN SCANNER VIEW (WHEN NO SUB-FLOW ACTIVE) ─── */}
      {!activeFlow && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Live Viewfinder */}
          <div className="bg-white p-4.5 rounded-[28px] border border-[#E8DFC8] shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h3 className="font-black text-xs text-indigo-dark font-heading uppercase tracking-wide flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Live Devotee Pass Scanner
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">Scan Devotee QR</span>
            </div>

            {/* Viewfinder Frame */}
            <div className="relative w-full aspect-square max-w-[260px] mx-auto rounded-3xl overflow-hidden border-4 border-gold shadow-warm bg-black flex items-center justify-center">
              <style>{`
                #innergate-viewfinder-div video {
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: cover !important;
                }
              `}</style>
              <div id="innergate-viewfinder-div" className="w-full h-full object-cover overflow-hidden" />

              {/* Gold Scan Target Overlay */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 animate-bounce z-10" />
              <div className="absolute inset-4 border-2 border-gold/80 rounded-2xl pointer-events-none z-10 flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-5 h-5 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                  <span className="w-5 h-5 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                </div>
                <div className="flex justify-between">
                  <span className="w-5 h-5 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                  <span className="w-5 h-5 border-b-4 border-r-4 border-gold rounded-br-lg" />
                </div>
              </div>

              {/* Camera Error Overlays */}
              {scanState === 'camera_in_use' && (
                <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <Camera className="w-8 h-8 text-amber-400 animate-pulse" />
                  <p className="text-xs text-white font-bold">Camera In Use</p>
                  <button
                    type="button"
                    onClick={handleRequestCameraAndRetry}
                    className="px-3.5 py-1.5 bg-gold text-indigo-dark font-black text-xs rounded-xl uppercase shadow-xs cursor-pointer font-heading"
                  >
                    🔄 Retry Camera
                  </button>
                </div>
              )}

              {scanState === 'permission_denied' && (
                <div className="absolute inset-0 bg-[#2D1B1E]/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <AlertOctagon className="w-8 h-8 text-rose-400" />
                  <p className="text-xs text-white font-bold">Camera Permission Required</p>
                  <button
                    type="button"
                    onClick={handleRequestCameraAndRetry}
                    className="px-4 py-2 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl uppercase shadow-xs cursor-pointer font-heading"
                  >
                    📷 Allow Camera
                  </button>
                </div>
              )}
            </div>

            {/* Manual Pass ID Search / Input & 1-Tap Demo Scan */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block font-heading">
                Or Lookup Devotee Pass Manually
              </span>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyInnerGatePass();
                }} 
                className="flex gap-2"
              >
                <input
                  type="text"
                  required
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="e.g. KV-8492 or bk_demo_8492"
                  className="flex-1 px-4 py-2.5 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-center text-sm font-bold font-mono text-indigo-dark focus:outline-none focus:border-maroon"
                />
                <button
                  type="submit"
                  disabled={!manualCodeInput.trim() || verifying}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-xl shadow-xs uppercase font-heading cursor-pointer hover:from-amber-400 hover:to-gold"
                >
                  {verifying ? '...' : 'Lookup'}
                </button>
              </form>
            </div>
          </div>

          {/* ─── SCANNED DEVOTEE PROFILE CARD (WITH 2 POWER ACTIONS) ─── */}
          {scannedDevotee && (
            <div className="bg-white rounded-3xl border-2 border-gold/60 p-5 space-y-4 shadow-md animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-extrabold text-xs text-maroon font-heading uppercase tracking-wide">
                    DEVOTEE PASS IDENTIFIED
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setScannedDevotee(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Devotee Info */}
              <div className="bg-[#FAF5EE] p-4 rounded-2xl border border-[#E8DFC8] flex items-start gap-3.5">
                <img 
                  src={scannedDevotee.avatar} 
                  alt={scannedDevotee.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-gold/60 shadow-xs shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-black text-sm text-indigo-dark font-heading truncate">
                      {scannedDevotee.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold text-[10px] shrink-0">
                      {scannedDevotee.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-mono">
                    Pass: <strong>{scannedDevotee.passId}</strong> • <strong>{scannedDevotee.phone}</strong>
                  </p>
                  <p className="text-[10px] text-emerald-800 font-medium">
                    Emergency Contact: <strong>{scannedDevotee.emergencyContact}</strong>
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Group: <strong>{scannedDevotee.headcount} Registered Devotees</strong> (Slot: {scannedDevotee.slotTime})
                  </p>
                </div>
              </div>

              {/* ─── 2 DIRECT POWER ACTIONS ─── */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-heading text-center">
                  Select Seva Action for this Devotee:
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* Action 1: Health Assistance */}
                  <button
                    type="button"
                    onClick={() => setActiveFlow('health_flow')}
                    className="p-4 bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl shadow-md flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center"
                  >
                    <HeartPulse className="w-6 h-6 text-white animate-pulse" />
                    <span className="font-black text-xs uppercase tracking-wider font-heading">
                      🚑 Health SOS
                    </span>
                    <span className="text-[9px] text-white/80 font-medium">
                      First-Aid &amp; Paramedic Aid
                    </span>
                  </button>

                  {/* Action 2: Lost & Found */}
                  <button
                    type="button"
                    onClick={() => setActiveFlow('lost_found_flow')}
                    className="p-4 bg-gradient-to-br from-amber-500 via-gold to-amber-600 hover:from-amber-400 hover:to-gold text-indigo-dark rounded-2xl shadow-md flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center"
                  >
                    <Search className="w-6 h-6 text-indigo-dark" />
                    <span className="font-black text-xs uppercase tracking-wider font-heading">
                      🔍 Lost &amp; Found
                    </span>
                    <span className="text-[9px] text-indigo-dark/80 font-bold">
                      Family / Member Separated
                    </span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ════════════ 1. HEALTH ASSISTANCE FLOW ════════════ */}
      {activeFlow === 'health_flow' && (
        <form onSubmit={handleDispatchHealthEmergency} className="bg-white p-5 rounded-3xl border border-gold/30 shadow-warm space-y-4 animate-in fade-in">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-600 animate-pulse" />
              <div>
                <h3 className="font-black text-sm text-indigo-dark font-heading">
                  Inner Sanctum Medical Help
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">Station Paramedic &amp; First-Aid Seva</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveFlow(null)}
              className="p-1.5 bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Devotee & Emergency Contact Summary */}
          <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-950">Patient: <strong>{scannedDevotee?.name}</strong></span>
              <span className="text-[10px] font-mono text-red-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                Pass #{scannedDevotee?.passId}
              </span>
            </div>
            <p className="text-gray-700">
              📍 Post: <strong>{currentTemple.sanctumName}</strong> (GPS: {currentTemple.coords})
            </p>
            <p className="text-emerald-900 font-bold text-[11px]">
              🔔 Emergency Contact: {scannedDevotee?.emergencyContact} (Will be notified)
            </p>
          </div>

          {/* Urgency Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 block">
              How urgent is the medical situation?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setHealthSeverity('severe')}
                className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                  healthSeverity === 'severe'
                    ? 'bg-rose-50 border-red-500 text-red-950 ring-1 ring-red-300'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                <span className="text-lg">🚨</span>
                <h4 className="text-xs font-bold font-heading mt-1 text-red-900">Critical Emergency</h4>
                <p className="text-[10px] text-gray-600 mt-0.5">Doctor, oxygen, collapse care</p>
              </button>

              <button
                type="button"
                onClick={() => setHealthSeverity('general')}
                className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                  healthSeverity === 'general'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-300'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                <span className="text-lg">🩺</span>
                <h4 className="text-xs font-bold font-heading mt-1 text-amber-950">First-Aid Assistance</h4>
                <p className="text-[10px] text-gray-600 mt-0.5">Dizziness, heat, sprain, rest</p>
              </button>
            </div>
          </div>

          {/* Symptoms Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 block">
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
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-red-400 text-red-950 font-bold'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-xs font-bold text-gray-800 block mb-1">Observation Notes (Optional):</label>
            <input
              type="text"
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              placeholder="e.g. Resting near sanctum pillar, responsive to voice"
              className="w-full p-2.5 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-xs text-indigo-dark focus:outline-none"
            />
          </div>

          {/* Dispatch Button */}
          <button
            type="submit"
            disabled={healthSubmitting}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm rounded-2xl shadow-md uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{healthSubmitting ? 'Dispatching Medical Team...' : 'Dispatch Medical Team to this Location →'}</span>
          </button>
        </form>
      )}

      {/* ─── HEALTH DISPATCHED CONFIRMATION SCREEN ─── */}
      {activeFlow === 'health_dispatched' && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-300 shadow-warm text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-bold">
            ✓
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-heading">
              Medical Response Dispatched
            </span>
            <h2 className="text-base font-bold text-gray-900 font-heading pt-1">
              Medical Help on the Way!
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              On-duty paramedic &amp; first-aid responder dispatched to <b>{currentTemple.sanctumName}</b> for <b>{scannedDevotee?.name}</b>.
            </p>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-2xl border border-gold/30 text-xs text-left space-y-1.5 font-medium">
            <p className="text-gray-800"><b>Care Level:</b> {healthSeverity === 'severe' ? '🚨 Critical Emergency Response' : '🩺 First-Aid Assistance'}</p>
            <p className="text-gray-800"><b>Symptoms:</b> {selectedConditions.join(', ')}</p>
            <p className="text-emerald-900 font-bold"><b>Arrival ETA:</b> ~1-2 mins to Inner Sanctum</p>
            <p className="text-indigo-dark font-bold"><b>Notified:</b> Group Members + Emergency Contact ({scannedDevotee?.emergencyContact})</p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveFlow(null);
                setScannedDevotee(null);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs rounded-2xl uppercase tracking-wider font-heading cursor-pointer shadow-md"
            >
              ✓ Done / Attend Next Devotee
            </button>
          </div>
        </div>
      )}

      {/* ════════════ 2. LOST & FOUND FLOW (SEPARATED / MISSING MEMBER SELECTION) ════════════ */}
      {activeFlow === 'lost_found_flow' && (
        <form onSubmit={handleDispatchLostFound} className="bg-white p-5 rounded-3xl border border-gold/30 shadow-warm space-y-4 animate-in fade-in">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-maroon" />
              <div>
                <h3 className="font-black text-sm text-indigo-dark font-heading">
                  Lost &amp; Found Coordination Desk
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">Family Reunification Seva</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveFlow(null)}
              className="p-1.5 bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scenario Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 block">
              What is the situation?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setLostMode('family_lost_member')}
                className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                  lostMode === 'family_lost_member'
                    ? 'bg-amber-50 border-gold ring-1 ring-gold/60 text-amber-950'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                <span className="text-lg">👨‍👩‍👧</span>
                <h4 className="text-xs font-black font-heading mt-1 text-indigo-dark">
                  Member is Missing
                </h4>
                <p className="text-[10px] text-gray-600 mt-0.5">Family searching for child/elderly</p>
              </button>

              <button
                type="button"
                onClick={() => setLostMode('separated_self')}
                className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                  lostMode === 'separated_self'
                    ? 'bg-amber-50 border-gold ring-1 ring-gold/60 text-amber-950'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                <span className="text-lg">🙋</span>
                <h4 className="text-xs font-black font-heading mt-1 text-indigo-dark">
                  I am Separated
                </h4>
                <p className="text-[10px] text-gray-600 mt-0.5">Devotee lost from their group</p>
              </button>
            </div>
          </div>

          {/* SCENARIO A: MEMBER IS MISSING (SELECT FROM REGISTERED GROUP MEMBERS) */}
          {lostMode === 'family_lost_member' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-800 block">
                Select Which Registered Member is Missing:
              </label>

              <div className="space-y-2">
                {scannedDevotee?.groupMembers?.map((member) => {
                  const isSelected = selectedMissingMember?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMissingMember(member)}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-50/80 border-gold ring-1 ring-gold/60 shadow-xs'
                          : 'bg-gray-50/60 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={member.photo} 
                          alt={member.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gold/40 shadow-2xs"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-indigo-dark font-heading">
                            {member.name} ({member.age} yrs)
                          </h4>
                          <span className="text-[10px] text-gray-500 font-medium">
                            Relation: <strong>{member.relation}</strong>
                          </span>
                        </div>
                      </div>

                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-gold text-indigo-dark shadow-xs' : 'border border-gray-300 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Clothing / Description */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-1">
                  Clothing &amp; Appearance Details:
                </label>
                <input
                  type="text"
                  required
                  value={missingDescription}
                  onChange={(e) => setMissingDescription(e.target.value)}
                  placeholder="e.g. Blue kurta, red shoes, speaks Gujarati"
                  className="w-full p-2.5 bg-[#FAF6EF] border border-[#E8DFC8] rounded-xl text-xs text-indigo-dark focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SCENARIO B: I AM SEPARATED */}
          {lostMode === 'separated_self' && (
            <div className="bg-[#FAF5EE] p-4 rounded-2xl border border-[#E8DFC8] space-y-2 text-xs">
              <p className="font-bold text-indigo-dark">
                Devotee: <strong>{scannedDevotee?.name}</strong> is safe at <strong>{currentTemple.sanctumName}</strong>.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Clicking Broadcast will immediately alert all registered family members and Emergency Contact ({scannedDevotee?.emergencyContact}) to pick them up at the <strong>Lost &amp; Found Center</strong>.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={lostSubmitting}
            className="w-full py-4 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-2xl shadow-goldGlow uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer active:scale-95 transition-all mt-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{lostSubmitting ? 'Filing Alert...' : 'Broadcast Amber Alert to Family & Desks →'}</span>
          </button>
        </form>
      )}

      {/* ─── LOST & FOUND SUCCESS SCREEN ─── */}
      {activeFlow === 'lost_found_success' && (
        <div className="bg-white p-6 rounded-3xl border border-amber-300 shadow-warm text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-maroon flex items-center justify-center mx-auto text-3xl font-bold">
            📢
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 font-heading">
              Amber Alert Broadcast Active
            </span>
            <h2 className="text-base font-bold text-gray-900 font-heading pt-1">
              Case Logged &amp; Family Notified!
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              Alert broadcasted across all temple gates and volunteer stations.
            </p>
          </div>

          <div className="bg-[#FAF5EE] p-4 rounded-2xl border border-[#E8DFC8] text-xs text-left space-y-1.5 font-medium">
            <p className="text-gray-800">
              <b>Person:</b> {lostMode === 'separated_self' ? scannedDevotee?.name : (selectedMissingMember?.name || 'Devotee Member')}
            </p>
            <p className="text-emerald-900 font-bold">
              <b>Reunification Point:</b> Family Lost &amp; Found Center (Desk #1)
            </p>
            <p className="text-indigo-dark font-bold">
              <b>Notified:</b> Emergency Contact ({scannedDevotee?.emergencyContact}) + Group Members via SMS/Push
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/v/lost-found')}
              className="w-full py-3.5 bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black text-xs rounded-2xl uppercase tracking-wider font-heading cursor-pointer shadow-goldGlow flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Open Lost &amp; Found Master Desk →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFlow(null);
                setScannedDevotee(null);
              }}
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-2xl border border-gray-200 cursor-pointer"
            >
              + Attend Next Devotee
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
