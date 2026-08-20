import React, { useState } from 'react';
import { Search, MapPin, AlertCircle, Volume2, ShieldAlert, CheckCircle2, RefreshCw, Car, HeartPulse, UserX, Settings, Camera, Video, Sparkles, BarChart3 } from 'lucide-react';
import { ropewayEngine } from '../lib/ropewayEngine';
import { boatCrossingEngine } from '../lib/boatCrossingEngine';

export const AdminDashboard = () => {
  const [selectedTemple, setSelectedTemple] = useState('Kalika Mata Temple (Pavagadh Ropeway)');
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' | 'surveillance' | 'traffic' | 'family' | 'medical' | 'analytics'
  const [showAcousticAlert, setShowAcousticAlert] = useState(false);
  const [showTwinSimulation, setShowTwinSimulation] = useState(false);

  // Ropeway Operational Control State
  const [ropewayOperational, setRopewayOperational] = useState(true);
  const [haltReasonInput, setHaltReasonInput] = useState('High Wind Speed (> 45 km/h)');
  const [triggeringHalt, setTriggeringHalt] = useState(false);

  // Bet Dwarka Boat Tide Control State
  const [boatCrossingSafe, setBoatCrossingSafe] = useState(true);
  const [triggeringBoatReroute, setTriggeringBoatReroute] = useState(false);

  const handleToggleRopewayHalt = async (status) => {
    setTriggeringHalt(true);
    try {
      await ropewayEngine.setStatus('tmp_pavagadh', status, status ? '' : haltReasonInput);
      setRopewayOperational(status);
      alert(status ? '✅ Pavagadh Ropeway Restored to Operational Mode.' : `⚠️ Weather Halt Triggered: ${haltReasonInput}. Pilgrims notified.`);
    } catch (e) {
      alert('Error updating ropeway status: ' + e.message);
    } finally {
      setTriggeringHalt(false);
    }
  };

  const handleToggleBoatSafety = async (isSafe) => {
    setTriggeringBoatReroute(true);
    try {
      await boatCrossingEngine.setCrossingSafety('bc_dwa_4', isSafe, isSafe ? 'ideal' : 'high', 'High Tide & Rough Sea Swell Warning');
      setBoatCrossingSafe(isSafe);
      alert(isSafe ? '✅ Bet Dwarka Crossing Restored to Safe Status.' : '⚠️ High Tide Alert Triggered! 11:00 AM Crossing cancelled & pilgrims rerouted to next safe departure.');
    } catch (e) {
      alert('Error updating boat crossing safety: ' + e.message);
    } finally {
      setTriggeringBoatReroute(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-dark text-white font-body flex flex-col">
      {/* Control Room Top Header */}
      <div className="bg-indigo-card border-b border-gold/30 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-gold via-amber-300 to-amber-600 shadow-goldGlow overflow-hidden flex items-center justify-center bg-white shrink-0">
            <img src="/official_logo.png" alt="Official Nirvighna Emblem" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-black font-heading tracking-wide text-ivory flex items-center gap-2">
              NIRVIGHNA - TEMPLE COMMAND CENTRE
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 px-2 py-0.5 rounded-full font-mono">
                GUJCOST / DST APPROVED SOLUTION
              </span>
            </h1>
            <p className="text-xs text-gray-400 font-mono">SVH26008: Realtime AI Crowd Prediction, IoT CCTV Feed & Drone Surveillance</p>
          </div>
        </div>

        {/* Temple Selector & Time */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTemple}
            onChange={e => setSelectedTemple(e.target.value)}
            className="bg-indigo-dark border border-gold/40 text-gold text-xs font-bold px-3 py-2 rounded-xl focus:outline-none"
          >
            <option>Somnath Temple</option>
            <option>Dwarkadhish Temple (Bet Dwarka Ferry)</option>
            <option>Ambaji Temple (Gabbar Hill Mela)</option>
            <option>Kalika Mata Temple (Pavagadh Ropeway)</option>
          </select>
          <span className="text-xs font-mono text-gray-300 bg-indigo-dark px-3 py-2 rounded-xl border border-white/10">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Main Grid Body */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Control Sidebar */}
        <div className="bg-indigo-card p-4 rounded-2xl border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
            Command Operations (7 Sub-Modules)
          </h3>
          <div className="space-y-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-between transition-all ${
                activeTab === 'heatmap' ? 'bg-gold text-indigo-dark shadow-goldGlow' : 'bg-indigo-dark text-gray-300 hover:bg-white/5'
              }`}
            >
              <span>1. AI Crowd Heatmap</span>
              <span className="text-[10px] font-mono">LIVE</span>
            </button>

            <button
              onClick={() => setActiveTab('surveillance')}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-between transition-all ${
                activeTab === 'surveillance' ? 'bg-gold text-indigo-dark shadow-goldGlow' : 'bg-indigo-dark text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5"><Camera className="w-4 h-4" /> 2. IoT & Drone CCTV Feed</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">4 Streams</span>
            </button>

            <button
              onClick={() => setActiveTab('traffic')}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-between transition-all ${
                activeTab === 'traffic' ? 'bg-gold text-indigo-dark shadow-goldGlow' : 'bg-indigo-dark text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5"><Car className="w-4 h-4" /> 3. Traffic & Shuttle GPS</span>
              <span className="text-[10px] font-mono">Police Link</span>
            </button>

            <button
              onClick={() => setActiveTab('family')}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-between transition-all ${
                activeTab === 'family' ? 'bg-gold text-indigo-dark shadow-goldGlow' : 'bg-indigo-dark text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5"><UserX className="w-4 h-4" /> 4. Family Reunification</span>
              <span className="text-[10px] bg-alertRed/30 text-alertRed px-1.5 py-0.5 rounded font-mono">1 Case</span>
            </button>

            <button
              onClick={() => setActiveTab('medical')}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-between transition-all ${
                activeTab === 'heatmap' ? 'bg-gold text-indigo-dark shadow-goldGlow' : 'bg-indigo-dark text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5"><HeartPulse className="w-4 h-4" /> 5. Medical SOS Response</span>
              <span className="text-[10px] bg-alertRed/30 text-alertRed px-1.5 py-0.5 rounded font-mono">1 Active</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-between transition-all ${
                activeTab === 'analytics' ? 'bg-gold text-indigo-dark shadow-goldGlow' : 'bg-indigo-dark text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> 6. Temple Analytics</span>
              <span className="text-[10px] font-mono">Reports</span>
            </button>

            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                onClick={() => setShowAcousticAlert(true)}
                className="w-full py-2.5 px-3 bg-alertRed/20 hover:bg-alertRed/30 text-alertRed border border-alertRed/40 rounded-xl flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-1.5"><Volume2 className="w-4 h-4" /> Acoustic Panic Monitor</span>
                <span className="w-2 h-2 rounded-full bg-alertRed animate-ping"></span>
              </button>

              {/* Bet Dwarka Boat Tide & Reroute Control Panel */}
              <div className="bg-indigo-dark p-3 rounded-xl border border-blue-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-blue-300 flex items-center gap-1">⛵ Bet Dwarka Boat Tide Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono ${
                    boatCrossingSafe ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  }`}>
                    {boatCrossingSafe ? 'IDEAL TIDE' : 'HIGH TIDE'}
                  </span>
                </div>

                <p className="text-[10px] text-gray-300 font-medium">
                  {boatCrossingSafe ? 'All ferry crossings operating normally.' : '11:00 AM Departure unsafe due to tide swell.'}
                </p>

                {boatCrossingSafe ? (
                  <button
                    onClick={() => handleToggleBoatSafety(false)}
                    disabled={triggeringBoatReroute}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-indigo-dark font-bold rounded-lg text-[11px] uppercase transition-all shadow-md"
                  >
                    {triggeringBoatReroute ? 'Rerouting...' : '⚠️ Trigger High Tide Alert & Reroute'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleBoatSafety(true)}
                    disabled={triggeringBoatReroute}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] uppercase transition-all shadow-md"
                  >
                    {triggeringBoatReroute ? 'Restoring...' : '✓ Restore Crossing Safety'}
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowTwinSimulation(true)}
                className="w-full py-2.5 px-3 bg-indigo-dark hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-gray-300"
              >
                <span>Digital Twin AI Simulator</span>
                <span className="text-gold font-mono">Sim</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Display Workspace */}
        <div className="lg:col-span-2 bg-indigo-card p-5 rounded-2xl border border-gold/20 flex flex-col justify-between space-y-4 relative overflow-hidden">
          {activeTab === 'heatmap' && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-300 font-heading">
                  {selectedTemple} — Live Floor Plan Density (CCTV + IoT Feed)
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Low</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gold"></span> Med</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-alertRed"></span> Critical</span>
                </div>
              </div>

              {/* Heatmap Zones Grid */}
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-emerald-500/10 border-2 border-emerald-400 p-6 rounded-2xl text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-300 block">MAIN GATE 1</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">1,420</span>
                  <span className="text-[10px] text-emerald-200 block">Density: LOW (35%)</span>
                </div>

                <div className="bg-alertRed/20 border-2 border-alertRed p-6 rounded-2xl text-center space-y-1 shadow-alertGlow relative">
                  <span className="text-xs font-bold text-alertRed block flex items-center justify-center gap-1">
                    SANCTUM QUEUE A <span className="w-2 h-2 rounded-full bg-alertRed animate-ping"></span>
                  </span>
                  <span className="text-2xl font-black font-mono text-alertRed">2,850</span>
                  <span className="text-[10px] text-red-300 block">Density: CRITICAL (92%)</span>
                </div>

                <div className="bg-gold/10 border-2 border-gold p-6 rounded-2xl text-center space-y-1">
                  <span className="text-xs font-bold text-gold block">OUTER COURTYARD</span>
                  <span className="text-2xl font-black font-mono text-gold">850</span>
                  <span className="text-[10px] text-gold-light block">Density: MEDIUM (55%)</span>
                </div>

                <div className="bg-emerald-500/10 border-2 border-emerald-400 p-6 rounded-2xl text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-300 block">NORTH PARKING P1</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">310</span>
                  <span className="text-[10px] text-emerald-200 block">Density: LOW (20%)</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'surveillance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4" /> IoT & CCTV AI Surveillance Feed (Live 4 Feeds)
                </span>
                <span className="text-emerald-400 font-mono text-[10px]">AI Object & Density Count Active</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-dark p-3 rounded-xl border border-white/10 relative">
                  <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono mb-2">
                    <span>CAM-01: Gate 1 Entrance</span>
                    <span className="text-emerald-400 font-bold">● REC</span>
                  </div>
                  <div className="h-28 bg-gray-900 rounded-lg flex items-center justify-center border border-white/5 relative">
                    <Video className="w-8 h-8 text-gold/40" />
                    <span className="absolute bottom-2 left-2 bg-indigo-dark/80 px-2 py-0.5 rounded text-[9px] font-mono text-gold">
                      AI Count: 42 People/min
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-dark p-3 rounded-xl border border-alertRed/40 relative">
                  <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono mb-2">
                    <span>CAM-02: Sanctum Queue</span>
                    <span className="text-alertRed font-bold">● HIGH DENSITY</span>
                  </div>
                  <div className="h-28 bg-gray-900 rounded-lg flex items-center justify-center border border-red-500/30 relative">
                    <Video className="w-8 h-8 text-alertRed/60" />
                    <span className="absolute bottom-2 left-2 bg-alertRed/80 px-2 py-0.5 rounded text-[9px] font-mono text-white">
                      Bottleneck Alert
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-dark p-3 rounded-xl border border-white/10 relative">
                  <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono mb-2">
                    <span>DRONE-01: Outer Courtyard Aerial</span>
                    <span className="text-emerald-400 font-bold">● LIVE DRONE</span>
                  </div>
                  <div className="h-28 bg-gray-900 rounded-lg flex items-center justify-center border border-white/5 relative">
                    <Video className="w-8 h-8 text-gold/40" />
                    <span className="absolute bottom-2 left-2 bg-indigo-dark/80 px-2 py-0.5 rounded text-[9px] font-mono text-gold">
                      Altitude: 45m
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-dark p-3 rounded-xl border border-white/10 relative">
                  <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono mb-2">
                    <span>CAM-04: Parking P1 Entrance</span>
                    <span className="text-emerald-400 font-bold">● REC</span>
                  </div>
                  <div className="h-28 bg-gray-900 rounded-lg flex items-center justify-center border border-white/5 relative">
                    <Video className="w-8 h-8 text-gold/40" />
                    <span className="absolute bottom-2 left-2 bg-indigo-dark/80 px-2 py-0.5 rounded text-[9px] font-mono text-gold">
                      ANPR Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'traffic' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
                Approach Road Traffic Density (Police Traffic Control Feed)
              </h3>
              <div className="bg-indigo-dark p-4 rounded-xl border border-white/10 space-y-2 text-xs">
                <p className="text-emerald-400 font-bold">Veraval Highway Approach: CLEAR (Normal Speed)</p>
                <p className="text-gold font-bold">Temple South Approach Road: MODERATE CONGESTION (12 km/h)</p>
                <button
                  onClick={() => alert('Coordinated diversion signal pushed to Traffic Police')}
                  className="mt-2 py-2 px-4 bg-gold text-indigo-dark font-extrabold text-xs rounded-xl shadow-goldGlow"
                >
                  Push Traffic Diversion to Traffic Police
                </button>
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
                Family Assistance & Lost & Found Cases Oversight
              </h3>
              <div className="bg-indigo-dark p-4 rounded-xl border border-alertRed/30 space-y-2 text-xs">
                <div className="flex items-center justify-between text-alertRed font-bold">
                  <span>Case #lost_101: Aarav Patel (14 yrs)</span>
                  <span>OPEN (12 mins)</span>
                </div>
                <p className="text-gray-300">Assigned Volunteer: Vikram Sharma (Gate 2)</p>
                <button
                  onClick={() => alert('Volunteer reassigned')}
                  className="py-1.5 px-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs rounded-lg"
                >
                  Reassign Volunteer
                </button>
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
                Medical Alerts Response Log
              </h3>
              <div className="bg-indigo-dark p-4 rounded-xl border border-alertRed/30 space-y-2 text-xs">
                <div className="flex items-center justify-between text-alertRed font-bold">
                  <span>Case #med_204 - Ramesh P.</span>
                  <span>EN ROUTE (Response Time: 1m 40s)</span>
                </div>
                <p className="text-gray-300">Responding Volunteer: Vikram S.</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
                Temple Analytics & Reporting (General vs VIP Split)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-indigo-dark p-3.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">General Entry Count</span>
                  <span className="text-xl font-bold font-mono text-gold">12,450 (84%)</span>
                </div>
                <div className="bg-indigo-dark p-3.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">VIP Entry Pass Count</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">2,440 (16%)</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Graph Strip */}
          <div className="bg-indigo-dark p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
            <span>Footfall Graph (Today): <span className="text-gold font-bold">14,890 Pilgrims</span></span>
            <span className="text-emerald-400 font-bold">Peak: 6-9 AM (Completed)</span>
          </div>
        </div>

        {/* Right Stat Cards Panel */}
        <div className="bg-indigo-card p-4 rounded-2xl border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
            Live Command Metrics
          </h3>

          <div className="bg-indigo-dark p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Visitors Today</span>
            <span className="text-2xl font-extrabold font-mono text-gold">14,890</span>
          </div>

          <div className="bg-indigo-dark p-3.5 rounded-xl border border-alertRed/30">
            <span className="text-[10px] text-alertRed font-bold uppercase block">Active Medical Alerts</span>
            <span className="text-2xl font-extrabold font-mono text-alertRed">1 Active</span>
          </div>

          <div className="bg-indigo-dark p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Active On-Field Volunteers</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">48 Deployed</span>
          </div>

          <div className="bg-indigo-dark p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Avg Sanctum Queue Wait</span>
            <span className="text-2xl font-extrabold font-mono text-white">18 Mins</span>
          </div>
        </div>
      </div>

      {/* Acoustic Panic Detection Modal */}
      {showAcousticAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-indigo-card border-2 border-alertRed p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-alertGlow text-white">
            <div className="flex items-center gap-3 text-alertRed">
              <Volume2 className="w-8 h-8 animate-bounce" />
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest bg-alertRed/20 px-2 py-0.5 rounded-full">
                  ACOUSTIC ANOMALY DETECTED
                </span>
                <h3 className="text-lg font-bold font-heading text-white mt-1">
                  Zone: Main Sanctum Gate A
                </h3>
              </div>
            </div>

            <div className="bg-indigo-dark p-4 rounded-2xl border border-white/10 space-y-2">
              <span className="text-[10px] font-mono text-gray-400 block">AUDIO WAVEFORM FREQUENCY SPIKE</span>
              <div className="h-16 flex items-center justify-center gap-1">
                {[20, 40, 60, 95, 30, 85, 100, 40, 70, 90, 30, 20].map((h, i) => (
                  <div key={i} className="w-2 bg-alertRed rounded-full animate-pulse" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono bg-indigo-dark p-3 rounded-xl">
              <span>Confidence: <strong className="text-gold">87% Panic Audio Match</strong></span>
              <span>Detected: <strong>7:42:13 PM</strong></span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  alert('Dispatched 4 nearest volunteers to Sanctum Gate A');
                  setShowAcousticAlert(false);
                }}
                className="py-3 bg-gold hover:bg-gold-dark text-indigo-dark font-extrabold font-heading text-xs rounded-xl shadow-goldGlow uppercase"
              >
                Dispatch Nearest Volunteers
              </button>
              <button
                onClick={() => setShowAcousticAlert(false)}
                className="py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs rounded-xl uppercase"
              >
                Mark False Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Entry Digital Twin Simulation Modal */}
      {showTwinSimulation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-indigo-card border-2 border-gold p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-goldGlow text-white">
            <div className="flex items-center justify-between border-b border-gold/30 pb-3">
              <h3 className="text-lg font-bold font-heading text-gold">
                Pre-Event Digital Twin Simulation
              </h3>
              <button onClick={() => setShowTwinSimulation(false)} className="text-gray-400 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-dark p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 font-mono block">EVENT PARAMETERS</span>
                <p className="font-bold text-white">Ambaji Bhadarvi Poonam Festival Forecast</p>
                <p className="text-gold font-mono">Expected Footfall: 250,000 Pilgrims | Active Gates: 4</p>
              </div>

              <div className="bg-alertRed/10 border border-alertRed/30 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-alertRed font-bold block">PREDICTED BOTTLENECK ZONES</span>
                <p className="text-xs text-red-200">Gate 3 Junction expected to exceed 120% capacity at 08:30 AM</p>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Digital Twin simulation plan applied');
                setShowTwinSimulation(false);
              }}
              className="w-full py-3 bg-gold text-indigo-dark font-extrabold font-heading text-xs rounded-xl shadow-goldGlow uppercase"
            >
              Apply Simulation Plan & Deploy Volunteers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
