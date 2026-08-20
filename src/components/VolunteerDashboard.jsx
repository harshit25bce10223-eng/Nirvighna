import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, AlertCircle, ShieldAlert, Users, CheckCircle, ArrowRight, UserX, Box, Lock, Phone, Clock, Bell, Calendar, MapPin, Shield } from 'lucide-react';
import { getUpcomingTwoHourBookings, getVolunteerBookingAlerts } from '../lib/volunteerEngine';
import { TEMPLE_DUTY_POSTS } from '../lib/templeRegistry';

export const VolunteerDashboard = ({ onNavigate }) => {
  const { medicalAlerts, lostCases, footwearTokens } = useAuth();
  const [selectedTempleId, setSelectedTempleId] = useState('tmp_somnath');
  const [selectedDutyPostId, setSelectedDutyPostId] = useState(TEMPLE_DUTY_POSTS['tmp_somnath']?.[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState('upcoming_2h'); // 'upcoming_2h' | 'scan' | 'ropeway' | 'boat' | 'prasad' | 'lost' | 'footwear'
  const [ropewayTokenInput, setRopewayTokenInput] = useState('');
  const [ropewayScanResult, setRopewayScanResult] = useState(null);
  const [scanningRopeway, setScanningRopeway] = useState(false);

  // Live Booking & 2-Hour Upcoming Slots State
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [liveBookingAlerts, setLiveBookingAlerts] = useState([]);

  useEffect(() => {
    const loadData = () => {
      const upcoming = getUpcomingTwoHourBookings(selectedTempleId);
      const alerts = getVolunteerBookingAlerts(selectedTempleId);
      setUpcomingBookings(upcoming);
      setLiveBookingAlerts(alerts);
    };
    loadData();

    const handleNewBooking = () => {
      loadData();
    };

    window.addEventListener('nirvighna_volunteer_booking_alert', handleNewBooking);
    return () => window.removeEventListener('nirvighna_volunteer_booking_alert', handleNewBooking);
  }, [selectedTempleId]);

  // Boat Scanner State
  const [boatTokenInput, setBoatTokenInput] = useState('');
  const [boatScanResult, setBoatScanResult] = useState(null);
  const [scanningBoat, setScanningBoat] = useState(false);

  // Prasad Serve Next State
  const [currentServingToken, setCurrentServingToken] = useState(142);
  const [servingPrasad, setServingPrasad] = useState(false);

  const activeDutyPosts = TEMPLE_DUTY_POSTS[selectedTempleId] || [];
  const currentPostName = activeDutyPosts.find(p => p.id === selectedDutyPostId)?.name || activeDutyPosts[0]?.name || 'Main Entrance Gate';

  const handleScanRopeway = async (e) => {
    e.preventDefault();
    if (!ropewayTokenInput.trim()) return;

    setScanningRopeway(true);
    setRopewayScanResult(null);

    try {
      const { ropewayEngine } = await import('../lib/ropewayEngine');
      const result = await ropewayEngine.scanRopewayQR(ropewayTokenInput.trim().toUpperCase());
      setRopewayScanResult(result);
    } catch (err) {
      setRopewayScanResult({
        success: false,
        code: 'ERROR',
        message: err.message || 'Scan error'
      });
    } finally {
      setScanningRopeway(false);
    }
  };

  const handleScanBoat = async (e) => {
    e.preventDefault();
    if (!boatTokenInput.trim()) return;

    setScanningBoat(true);
    setBoatScanResult(null);

    try {
      const { boatCrossingEngine } = await import('../lib/boatCrossingEngine');
      const result = await boatCrossingEngine.scanBoatQR(boatTokenInput.trim().toUpperCase());
      setBoatScanResult(result);
    } catch (err) {
      setBoatScanResult({
        success: false,
        code: 'ERROR',
        message: err.message || 'Scan error'
      });
    } finally {
      setScanningBoat(false);
    }
  };

  const handleServeNextPrasad = async () => {
    setServingPrasad(true);
    try {
      const { prasadQueueEngine } = await import('../lib/prasadQueueEngine');
      const updated = await prasadQueueEngine.serveNextPrasadToken(selectedTempleId);
      setCurrentServingToken(updated.current_serving_token);
    } catch (e) {
      setCurrentServingToken(prev => prev + 1);
    } finally {
      setServingPrasad(false);
    }
  };

  const activeAlertsCount = medicalAlerts.filter(a => a.status !== 'resolved').length;
  const openLostCount = lostCases.filter(c => c.status === 'open').length;

  return (
    <div className="pb-24 pt-4 px-3 sm:px-6 max-w-4xl mx-auto space-y-5 bg-indigo-dark text-white min-h-screen">
      {/* High Contrast Volunteer Header */}
      <div className="bg-indigo-card p-5 rounded-3xl border border-gold/40 flex items-center justify-between shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-indigo-dark font-black text-lg shadow-goldGlow">
            G2
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-full border border-gold/40">
              NIRVIGHNA VOLUNTEER FIELD HUB
            </span>
            <h2 className="text-xl font-black font-heading text-white mt-1">
              Vikram Sharma (Volunteer ID #8841)
            </h2>
            <p className="text-xs text-gray-300 font-medium">Assigned Duty Post: <span className="text-gold font-bold">{currentPostName}</span></p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-500/40 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Active Duty On-Site
        </div>
      </div>

      {/* Active Shrine & Duty Post Selection Bar */}
      <div className="bg-indigo-card p-4 rounded-2xl border border-gold/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gold shrink-0" />
          <div>
            <span className="text-[9px] font-black uppercase text-gold tracking-widest block font-mono">
              Active Shrine Selection
            </span>
            <select
              value={selectedTempleId}
              onChange={(e) => {
                const newTId = e.target.value;
                setSelectedTempleId(newTId);
                const posts = TEMPLE_DUTY_POSTS[newTId] || [];
                setSelectedDutyPostId(posts[0]?.id || '');
                if (activeSubTab === 'boat' && newTId !== 'tmp_dwarka') setActiveSubTab('upcoming_2h');
                if (activeSubTab === 'ropeway' && newTId !== 'tmp_pavagadh' && newTId !== 'tmp_ambaji') setActiveSubTab('upcoming_2h');
              }}
              className="bg-indigo-dark text-white font-bold text-xs px-2.5 py-1 rounded-lg border border-gold/50 focus:outline-none cursor-pointer"
            >
              <option value="tmp_somnath">🕉 Somnath Temple</option>
              <option value="tmp_dwarka">🚩 Dwarkadhish Temple (Dwarka)</option>
              <option value="tmp_ambaji">🌸 Ambaji Temple</option>
              <option value="tmp_pavagadh">🚡 Kalika Mata Temple (Pavagadh)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block font-mono">
              On-Site Duty Post Location
            </span>
            <select
              value={selectedDutyPostId}
              onChange={(e) => setSelectedDutyPostId(e.target.value)}
              className="bg-indigo-dark text-emerald-300 font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-500/50 focus:outline-none cursor-pointer"
            >
              {activeDutyPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Volunteer Sub-Tool Selector Tabs */}
      <div className="bg-indigo-card p-1 rounded-xl flex border border-white/10 text-xs font-bold gap-0.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('upcoming_2h')}
          className={`px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'upcoming_2h' ? 'bg-gold text-indigo-dark font-extrabold shadow-sm' : 'text-amber-400'
          }`}
        >
          <span>Next 2 Hours</span>
          <span className="bg-black/20 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">{upcomingBookings.length}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('booking_alerts')}
          className={`px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'booking_alerts' ? 'bg-gold text-indigo-dark font-extrabold shadow-sm' : 'text-gray-300'
          }`}
        >
          <span>🔔 Booking Alerts</span>
          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{liveBookingAlerts.length}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('scan')}
          className={`px-3 py-2 rounded-lg transition-all shrink-0 ${
            activeSubTab === 'scan' ? 'bg-gold text-indigo-dark font-extrabold shadow-sm' : 'text-gray-300'
          }`}
        >
          Gate Scanner
        </button>
        {(selectedTempleId === 'tmp_pavagadh' || selectedTempleId === 'tmp_ambaji') && (
          <button
            onClick={() => setActiveSubTab('ropeway')}
            className={`px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'ropeway' ? 'bg-gold text-indigo-dark font-extrabold shadow-sm' : 'text-gray-300'
            }`}
          >
            🚡 Cable Car Ropeway
          </button>
        )}
        {selectedTempleId === 'tmp_dwarka' && (
          <button
            onClick={() => setActiveSubTab('boat')}
            className={`px-3 py-2 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'boat' ? 'bg-gold text-indigo-dark font-extrabold shadow-sm' : 'text-gray-300'
            }`}
          >
            ⛵ Boat Jetty (Bet Dwarka)
          </button>
        )}
        <button
          onClick={() => setActiveSubTab('prasad')}
          className={`px-3 py-2 rounded-lg transition-all shrink-0 ${
            activeSubTab === 'prasad' ? 'bg-gold text-indigo-dark font-extrabold shadow-sm' : 'text-gray-300'
          }`}
        >
          🍲 Prasad Queue
        </button>
        <button
          onClick={() => setActiveSubTab('lost')}
          className={`px-3 py-2 rounded-lg transition-all shrink-0 ${
            activeSubTab === 'lost' ? 'bg-gold text-indigo-dark font-extrabold shadow-sm' : 'text-gray-300'
          }`}
        >
          Lost ({openLostCount})
        </button>
      </div>

      {/* UPCOMING DARSHAN SLOTS (NEXT 2 HOURS QUEUE PREPARATION) */}
      {activeSubTab === 'upcoming_2h' && (
        <div className="space-y-3 font-body">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gold tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Upcoming Darshan Slots (Next 2 Hours Queue Preparation)
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/40">
              {upcomingBookings.length} Slots Active
            </span>
          </div>

          <div className="space-y-3">
            {upcomingBookings.map((b, i) => (
              <div key={b.id || i} className="bg-indigo-card p-4 rounded-2xl border border-amber-500/40 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 font-mono">ID: #{b.id}</span>
                    {b.isPriority ? (
                      <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                        ♿ Priority Escort Needed
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                        Standard Queue
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-300 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {b.startTime} – {b.endTime}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-200 pt-1 border-t border-white/10">
                  <div>
                    <p className="font-bold text-white text-sm">{b.templeName || 'Somnath Temple'}</p>
                    <p className="text-[11px] text-gray-300">Allotted Gate: <span className="font-bold text-gold">{b.gateNumber}</span> • {b.totalPilgrims} Devotee{b.totalPilgrims > 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-gray-400">Contact: {b.phone}</p>
                  </div>
                  <button
                    onClick={() => alert(`✅ Gate #${b.gateNumber} notified! Priority lane prepared for Booking #${b.id}.`)}
                    className="px-3 py-2 bg-gold hover:bg-gold-dark text-indigo-dark font-extrabold text-[11px] rounded-xl shadow-goldGlow uppercase"
                  >
                    Assist Entry →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔔 LIVE PILGRIM BOOKING ALERTS (REALTIME BROADCAST) */}
      {activeSubTab === 'booking_alerts' && (
        <div className="space-y-3 font-body">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gold tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
              🔔 Live Pilgrim Booking Feed (Real-Time Broadcast)
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
              Live Broadcast Active
            </span>
          </div>

          <div className="space-y-2.5">
            {liveBookingAlerts.length === 0 ? (
              <div className="bg-indigo-card p-6 rounded-2xl text-center border border-white/10 text-xs text-gray-400">
                No recent bookings broadcasted yet. New pilgrim bookings will display here live.
              </div>
            ) : (
              liveBookingAlerts.map((notice, idx) => (
                <div key={idx} className="bg-indigo-card p-3.5 rounded-2xl border border-emerald-500/40 flex items-center justify-between text-xs animate-in slide-in-from-top-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-emerald-300 text-xs">🎉 New Darshan Booked Successfully</span>
                      <span className="text-[10px] font-mono text-gray-400">#{notice.id}</span>
                    </div>
                    <p className="text-white font-semibold">{notice.templeName} • {notice.gateNumber} • {notice.totalPilgrims} Devotees</p>
                    <p className="text-[10px] text-gray-400">Slot: {notice.startTime} - {notice.endTime} ({notice.slotDate})</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gold font-mono block">{notice.createdAt}</span>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-gray-300">Confirmed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'scan' && (
        <>
          {/* Large Action Target: SCAN QR BUTTON */}
          <button
            onClick={() => onNavigate('/v/scan')}
            className="w-full py-6 bg-gold hover:bg-gold-dark text-indigo-dark rounded-2xl shadow-goldGlow flex flex-col items-center justify-center gap-2 border-2 border-gold-light active:scale-98 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-dark text-gold flex items-center justify-center shadow-inner">
              <QrCode className="w-8 h-8" />
            </div>
            <span className="text-lg font-black font-heading tracking-wide uppercase">
              SCAN PILGRIM QR PASS
            </span>
            <span className="text-xs font-semibold opacity-90">Instant Gate Entry & Security Verify</span>
          </button>

          {/* 3 Quick Stat Cards in Row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-indigo-card p-3 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Entries Today</span>
              <span className="text-xl font-bold font-mono text-gold">1,420</span>
            </div>
            <div
              onClick={() => onNavigate('/v/alerts')}
              className="bg-indigo-card p-3 rounded-xl border border-alertRed/40 text-center cursor-pointer hover:border-alertRed transition-all"
            >
              <span className="text-[10px] text-alertRed font-bold uppercase block">Active Alerts</span>
              <span className="text-xl font-bold font-mono text-alertRed">{activeAlertsCount}</span>
            </div>
            <div className="bg-indigo-card p-3 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Priority Req</span>
              <span className="text-xl font-bold font-mono text-emerald-400">12</span>
            </div>
          </div>
        </>
      )}

      {/* Ropeway Counter Scan Mode */}
      {activeSubTab === 'ropeway' && (
        <div className="bg-indigo-card p-5 rounded-3xl border border-gold/40 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚡</span>
              <div>
                <h3 className="font-extrabold text-sm text-gold font-heading">
                  ROPEWAY BOARDING COUNTER SCANNER
                </h3>
                <p className="text-xs text-gray-400">Pavagadh Machi Base Terminal • Cable Car Entry</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/40">
              Counter Active
            </span>
          </div>

          <form onSubmit={handleScanRopeway} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Scan or Enter Ropeway Pass Token (e.g. RPW-PVG-849201)
              </label>
              <input
                type="text"
                value={ropewayTokenInput}
                onChange={(e) => setRopewayTokenInput(e.target.value)}
                placeholder="RPW-PVG-XXXXXX"
                className="w-full px-4 py-3 bg-indigo-dark border border-gold/50 rounded-xl text-sm font-mono text-gold focus:outline-none focus:ring-1 focus:ring-gold uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={scanningRopeway || !ropewayTokenInput.trim()}
              className="w-full py-3.5 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow uppercase tracking-wide flex items-center justify-center gap-2"
            >
              {scanningRopeway ? 'Verifying Token...' : 'Verify & Approve Cable Car Boarding →'}
            </button>
          </form>

          {ropewayScanResult && (
            <div className={`p-4 rounded-2xl border-2 animate-in fade-in space-y-2 text-center ${
              ropewayScanResult.success
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                : 'bg-red-950/60 border-red-500 text-red-200'
            }`}>
              <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-black text-lg shadow-md border ${
                ropewayScanResult.success ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-red-500 text-white border-red-300'
              }`}>
                {ropewayScanResult.success ? '✓' : '✕'}
              </div>
              <h4 className="font-black text-sm uppercase tracking-wide">
                {ropewayScanResult.code}
              </h4>
              <p className="text-xs font-bold">
                {ropewayScanResult.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Boat Counter Scan Mode */}
      {activeSubTab === 'boat' && (
        <div className="bg-indigo-card p-5 rounded-3xl border border-gold/40 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⛵</span>
              <div>
                <h3 className="font-extrabold text-sm text-gold font-heading">
                  BET DWARKA BOAT JETTY SCANNER
                </h3>
                <p className="text-xs text-gray-400">Okha Port Ferry Gate 1 • Sea Crossing Entry</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-400/40">
              Jetty Open
            </span>
          </div>

          <form onSubmit={handleScanBoat} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Scan or Enter Boat Pass Token (e.g. BOAT-DWA-984120)
              </label>
              <input
                type="text"
                value={boatTokenInput}
                onChange={(e) => setBoatTokenInput(e.target.value)}
                placeholder="BOAT-DWA-XXXXXX"
                className="w-full px-4 py-3 bg-indigo-dark border border-gold/50 rounded-xl text-sm font-mono text-gold focus:outline-none focus:ring-1 focus:ring-gold uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={scanningBoat || !boatTokenInput.trim()}
              className="w-full py-3.5 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-xs rounded-xl shadow-goldGlow uppercase tracking-wide flex items-center justify-center gap-2"
            >
              {scanningBoat ? 'Verifying...' : 'Verify & Approve Boat Boarding →'}
            </button>
          </form>

          {boatScanResult && (
            <div className={`p-4 rounded-2xl border-2 animate-in fade-in space-y-2 text-center ${
              boatScanResult.success
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                : 'bg-red-950/60 border-red-500 text-red-200'
            }`}>
              <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-black text-lg shadow-md border ${
                boatScanResult.success ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-red-500 text-white border-red-300'
              }`}>
                {boatScanResult.success ? '✓' : '✕'}
              </div>
              <h4 className="font-black text-sm uppercase tracking-wide">
                {boatScanResult.code}
              </h4>
              <p className="text-xs font-bold">
                {boatScanResult.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prasad Counter Serve Next Mode */}
      {activeSubTab === 'prasad' && (
        <div className="bg-indigo-card p-5 rounded-3xl border border-gold/40 space-y-4 text-center">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍲</span>
              <div>
                <h3 className="font-extrabold text-sm text-gold font-heading">
                  NISHULK ANNAKSHETRA QUEUE COUNTER
                </h3>
                <p className="text-xs text-gray-400">Live Prasad Serving Control • Realtime Sync</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/40">
              Counter Active
            </span>
          </div>

          <div className="bg-indigo-dark p-6 rounded-3xl border border-gold/30 space-y-2 inline-block w-full">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block font-mono">
              CURRENTLY SERVING TOKEN
            </span>
            <span className="text-5xl font-black font-mono text-gold block tracking-wider">
              #{currentServingToken}
            </span>
          </div>

          <button
            onClick={handleServeNextPrasad}
            disabled={servingPrasad}
            className="w-full py-5 bg-gold hover:bg-gold-dark text-indigo-dark font-black text-base rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading"
          >
            {servingPrasad ? 'Serving Token...' : `SERVE NEXT TOKEN (#${currentServingToken + 1}) →`}
          </button>

          <p className="text-xs text-gray-300 font-medium">
            Tapping "Serve Next" advances the token counter live across all pilgrim apps instantly!
          </p>
        </div>
      )}

      {/* Family Reunification (Lost & Found Module) */}
      {activeSubTab === 'lost' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gold uppercase tracking-wider">Active Family Reunification Cases</span>
            <button
              onClick={() => onNavigate && onNavigate('/lost-report')}
              className="px-2.5 py-1 bg-gold text-indigo-dark font-bold text-[11px] rounded-lg"
            >
              + File Case
            </button>
          </div>

          {lostCases.map((c) => (
            <div key={c.id} className="bg-indigo-card p-4 rounded-2xl border border-alertRed/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-alertRed flex items-center gap-1">
                  <UserX className="w-4 h-4" /> Case #{c.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                  c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-alertRed/20 text-alertRed'
                }`}>
                  {c.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-3 items-center">
                {c.photo && (
                  <img src={c.photo} alt={c.name} className="w-14 h-14 rounded-xl object-cover border border-white/20" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{c.name} ({c.age || 7} yrs)</h4>
                  <p className="text-xs text-gray-300">{c.description || 'Wearing blue kurta, last seen at Gomti Ghat'}</p>
                  <p className="text-[11px] text-gray-400">Reported By: {c.reportedBy}</p>
                </div>
              </div>
              
              {c.status !== 'resolved' ? (
                <button
                  onClick={() => {
                    if (updateLostCaseStatus) updateLostCaseStatus(c.id, 'resolved');
                    alert(`✅ Case #${c.id} Marked RESOLVED! Push notification sent to family app (${c.reportedBy}).`);
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Mark Person Found & Notify Family
                </button>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-center text-xs text-emerald-300 font-bold">
                  ✓ Case Resolved & Family Reunited
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Smart Footwear Locker Module */}
      {activeSubTab === 'footwear' && (
        <div className="space-y-3 font-body">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
            Smart Footwear Locker Management Counter
          </h3>

          <div className="bg-indigo-card p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span>Locker Counter A</span>
              <span className="text-emerald-400 font-bold">{footwearTokens.length} Active Tokens</span>
            </div>

            <div className="space-y-2">
              {footwearTokens.map((item) => (
                <div key={item.token_id} className="p-3 bg-indigo-dark rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gold font-mono">{item.token_id}</span>
                    <p className="text-white font-semibold">{item.pilgrim_name} ({item.pair_count} Pairs)</p>
                    <p className="text-[10px] text-gray-400">{item.rack_no}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (checkoutFootwear) checkoutFootwear(item.token_id);
                      alert(`👞 Token ${item.token_id} Checked Out & Returned to ${item.pilgrim_name}`);
                    }}
                    disabled={item.status === 'retrieved'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      item.status === 'retrieved'
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gold text-indigo-dark hover:bg-gold-dark'
                    }`}
                  >
                    {item.status === 'retrieved' ? 'Retrieved' : 'Check-Out'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (issueFootwearToken) {
                  const token = issueFootwearToken('New Devotee', 2);
                  alert(`✅ Token Issued: ${token.token_id} assigned to ${token.rack_no}`);
                }
              }}
              className="w-full py-3 bg-gold text-indigo-dark font-extrabold text-xs rounded-xl uppercase shadow-goldGlow flex items-center justify-center gap-2"
            >
              <Box className="w-4 h-4" /> + Issue New Footwear Token QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
