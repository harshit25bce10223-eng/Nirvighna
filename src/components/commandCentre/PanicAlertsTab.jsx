import React, { useState, useEffect } from 'react';
import { Bell, Mic, MicOff, Volume2, ShieldAlert } from 'lucide-react';
import { acousticPanicEngine } from '../../lib/acousticPanicEngine';

export const PanicAlertsTab = ({
  selectedAcousticZone,
  setSelectedAcousticZone,
  acousticReadings,
  panicAlerts,
  setActivePanicModal,
  fetchAcousticReadings,
  fetchPanicAlerts
}) => {
  const [micActive, setMicActive] = useState(false);
  const [micController, setMicController] = useState(null);

  const toggleMicSensor = async () => {
    if (micActive && micController) {
      micController.stop();
      setMicController(null);
      setMicActive(false);
    } else {
      const controller = await acousticPanicEngine.startLiveMicSensor(
        'tmp_somnath',
        selectedAcousticZone,
        () => fetchAcousticReadings(),
        (alertObj) => {
          setActivePanicModal(alertObj);
          fetchPanicAlerts();
        }
      );
      if (controller) {
        setMicController(controller);
        setMicActive(true);
      }
    }
  };

  let localAlerts = [];
  try {
    localAlerts = JSON.parse(localStorage.getItem('nirvighna_acoustic_alerts_local') || '[]');
  } catch {
    localAlerts = [];
  }
  const allPanicAlerts = [...localAlerts, ...(panicAlerts || [])];

  return (
    <div className="space-y-4 font-body">
      {/* Waveform Realtime Visualizer Panel */}
      <div className="bg-darkWarm-card rounded-2xl p-4 shadow-temple space-y-3 border border-gold/30">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div>
              <h3 className="text-sm font-bold text-gold font-heading flex items-center gap-2">
                Live Acoustic & Panic Audio Sensor
              </h3>
              <p className="text-xs text-gray-400">Listens to ambient decibel spikes (&gt;85dB) & scream frequencies</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMicSensor}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                micActive
                  ? 'bg-red-600 text-white border border-red-400 animate-pulse'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:text-white'
              }`}
            >
              {micActive ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5 text-gray-400" />}
              <span>{micActive ? 'Live Mic Sensor Active' : 'Enable Live Mic Sensor'}</span>
            </button>

            <select
              value={selectedAcousticZone}
              onChange={(e) => setSelectedAcousticZone(e.target.value)}
              className="bg-black/60 text-white border border-gold/40 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none font-heading"
            >
              <option value="Zone A Entrance">Zone A Entrance</option>
              <option value="Zone B Courtyard">Zone B Courtyard</option>
              <option value="Zone C Prasad Hall">Zone C Prasad Hall</option>
            </select>
          </div>
        </div>

        {/* Equalizer Waveform Bars Grid */}
        <div className="flex items-end gap-1.5 h-24 bg-black/60 rounded-xl p-3 border border-white/10 justify-center">
          {(acousticReadings || []).map((r, i) => (
            <div 
              key={i} 
              className={`w-3.5 rounded-t-sm transition-all duration-300 ${
                r.amplitude_level > 82 ? 'bg-red-500 animate-bounce shadow-lg shadow-red-500/50' : 'bg-gold'
              }`}
              style={{ height: `${Math.max(12, Math.min(100, r.amplitude_level))}%` }}
              title={`Time: ${new Date(r.recorded_at).toLocaleTimeString()} | Amp: ${r.amplitude_level}dB`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span className="font-mono">Baseline: 40dB - 60dB | Panic Spike Threshold: &gt;82dB</span>
          <button
            onClick={async () => {
              acousticPanicEngine.playPanicSiren();
              const alert = await acousticPanicEngine.simulateAcousticSpike('tmp_somnath', selectedAcousticZone);
              if (alert) setActivePanicModal(alert);
              fetchAcousticReadings();
              fetchPanicAlerts();
            }}
            className="px-3 py-1.5 bg-red-600 border border-red-400 text-white hover:bg-red-500 transition-all font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md uppercase font-heading"
          >
            Simulate Acoustic Alarm Spike
          </button>
        </div>
      </div>

      {/* Active Acoustic Alerts Checklist */}
      <div className="space-y-3">
        {allPanicAlerts.length === 0 ? (
          <div className="bg-darkWarm-card rounded-xl p-6 text-center shadow-temple">
            <p className="text-gray-400 text-sm">All decibel levels operational. No panic spikes detected.</p>
          </div>
        ) : (
          allPanicAlerts.map((alert) => (
            <div key={alert.id || alert.detected_at || alert.created_at || i} className="bg-darkWarm-card rounded-xl p-4 shadow-temple border-2 border-darkWarm-rust animate-in fade-in">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-darkWarm-rust flex items-center gap-2 text-xs">
                    <Bell className="w-4 h-4 text-red-500 animate-bounce" />
                    Panic Acoustic Alarm Triggered
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(alert.created_at || alert.detected_at).toLocaleString()}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-red-650 text-white">
                  {alert.confidence_score}% CONFIDENCE
                </span>
              </div>
              <div className="text-xs text-gray-300 space-y-1 mb-3">
                <p>📍 Location Zone: <strong className="text-white">{alert.zone_name || alert.location}</strong></p>
                <p>⚠️ Audio Analysis: High Amplitude Screaming Spike Detected</p>
                <p>Status: <span className="font-extrabold text-gold uppercase">{alert.status}</span></p>
              </div>
              {alert.status === 'active' && (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      alert.status = 'dispatched';
                      const updated = [...allPanicAlerts];
                      localStorage.setItem('nirvighna_acoustic_alerts_local', JSON.stringify(updated.filter(a => a.id?.startsWith?.('local_'))));
                      fetchPanicAlerts();
                    }}
                    className="flex-1 py-1.5 bg-darkWarm-rust text-white rounded-lg text-xs font-black"
                  >
                    Dispatch Nearest Volunteers
                  </button>
                  <button 
                    onClick={() => {
                      alert.status = 'false_alarm';
                      const updated = [...allPanicAlerts];
                      localStorage.setItem('nirvighna_acoustic_alerts_local', JSON.stringify(updated.filter(a => a.id?.startsWith?.('local_'))));
                      fetchPanicAlerts();
                    }}
                    className="px-4 py-1.5 bg-gray-650 text-gray-300 hover:text-white rounded-lg text-xs font-bold"
                  >
                    False Alarm
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
