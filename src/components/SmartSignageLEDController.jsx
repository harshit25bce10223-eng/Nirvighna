import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, Monitor } from 'lucide-react';
import { aiGateRerouteEngine } from '../lib/aiGateRerouteEngine';

const DRISHTI_URL = import.meta.env.VITE_DRISHTI_URL || 'http://localhost:8000';

export const SmartSignageLEDController = ({ templeId = 'tmp_somnath' }) => {
  const [signageDisplays, setSignageDisplays] = useState([
    {
      id: 'led_display_1',
      location: 'Main Entrance Gate #1 (Swarga Dwar)',
      mode: 'STANDBY',
      message: '🔱 WELCOME TO THE SHRINE — REGULAR DARSHAN SLOTS ACTIVE — CHECK LIVE SIGNAGE',
      status: 'NORMAL',
      color: 'bg-slate-900 border-amber-500/40 text-amber-300'
    },
    {
      id: 'led_display_2',
      location: 'Outer Plaza Intersection',
      mode: 'STANDBY',
      message: '✨ FOLLOW THE ILLUMINATED PATH FOR SMOOTHER DARSHAN FLOW',
      status: 'NORMAL',
      color: 'bg-slate-900 border-amber-500/40 text-amber-300'
    },
    {
      id: 'led_display_3',
      location: 'Shuttle Station & Parking Approach',
      mode: 'NORMAL_TIMING',
      message: '✨ WELCOME TO SHRINE — REGULAR DARSHAN SLOTS ACTIVE (WAIT TIME: 10 MINS)',
      status: 'NORMAL',
      color: 'bg-slate-900 border-amber-500/40 text-amber-300'
    }
  ]);

  const [lastWebhookPayload, setLastWebhookPayload] = useState(null);
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    const applyCommand = (command) => {
      if (!command || command.templeId !== templeId) return;
      setSignageDisplays(current => current.map((display, index) => index < 2 ? {
        ...display,
        mode: 'SAFETY_RESPONSE',
        message: index === 0 ? command.message : `GATE 2 OPEN — FOLLOW GREEN SIGNAGE FOR SAFER DARSHAN`,
        status: 'ACTIVE_DIRECTIVE',
        color: index === 0 ? 'bg-red-950 border-red-600 text-red-200' : 'bg-emerald-900/60 border-emerald-500 text-emerald-300'
      } : display));
      setLastWebhookPayload({ ...command, status: 'COMMAND_APPLIED' });
    };
    try { applyCommand(JSON.parse(localStorage.getItem('nirvighna_led_command') || 'null')); } catch (_) {}
    const handleCommand = (event) => applyCommand(event.detail);
    window.addEventListener('nirvighna_led_command', handleCommand);
    return () => window.removeEventListener('nirvighna_led_command', handleCommand);
  }, [templeId]);

  // Dispatch LED Signage update to real Drishti backend
  const dispatchSignageWebhook = async (displayId, customMessage) => {
    setIsBroadcasting(true);
    const payload = {
      timestamp: new Date().toISOString(),
      temple_id: templeId,
      display_id: displayId,
      marquee_text: customMessage
    };

    setLastWebhookPayload(payload);
    setWebhookStatus(null);

    try {
      const res = await fetch(`${DRISHTI_URL}/api/led-signage/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setWebhookStatus({ ok: res.ok, detail: data });
    } catch (e) {
      console.warn('LED Signage backend unreachable:', e);
      setWebhookStatus({ ok: false, detail: { error: 'Drishti backend offline (port 8000)' } });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleManualRerouteTrigger = (gateId) => {
    const updated = signageDisplays.map((disp) => {
      if (disp.id === 'led_display_1') {
        return {
          ...disp,
          mode: 'MANUAL_OVERRIDE',
          message: `🚨 EMERGENCY REROUTE ACTIVE: GATE ${gateId} HIGH DENSITY. USE GATE 2 IMMEDIATELY!`,
          status: 'CRITICAL',
          color: 'bg-red-950 border-red-600 text-red-200'
        };
      }
      return disp;
    });

    setSignageDisplays(updated);
    dispatchSignageWebhook('led_display_1', updated[0].message);
  };

  return (
    <div className="bg-slate-950 border border-indigo-900/30 rounded-2xl p-5 text-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-md">
            AUTOMATED SMART SIGNAGE LED BROADCASTER
          </span>
          <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            Physical LED Signage & Dynamic Reroute Webhooks
          </h3>
        </div>

        <button
          onClick={() => handleManualRerouteTrigger(1)}
          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Force Reroute Broadcast
        </button>
      </div>

      {/* Live Physical LED Displays List with Multilingual Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-300 uppercase">Live Outdoor LED Marquee Displays Status</p>
          <div className="flex bg-slate-900 border border-white/10 rounded-lg p-0.5 text-[10px] font-bold">
            {['all', 'gu', 'hi', 'en'].map(l => (
              <span key={l} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase border border-amber-500/30">
                {l === 'all' ? '🌐 Tri-Lingual' : l.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {signageDisplays.map((disp) => (
            <div
              key={disp.id}
              className={`p-4 rounded-xl border space-y-2 transition-all ${disp.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {disp.location} ({disp.id})
                </span>
                <span className="text-[10px] font-mono bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  {disp.mode}
                </span>
              </div>

              {/* Digital Marquee Ticker Box */}
              <div className="bg-black/90 p-3 rounded-lg border border-white/10 font-mono text-xs space-y-1.5 text-amber-400 tracking-wide font-bold">
                <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                  <span className="bg-emerald-950 px-1.5 py-0.5 rounded text-[9px] border border-emerald-500/40">GUJ</span>
                  <p className="truncate">ગેટ ૧ ભરાયેલ છે — સુરક્ષિત દર્શન માટે ગેટ ૨ તરફ આગળ વધો (પ્રતીક્ષા સમય: ૦ મિનિટ)</p>
                </div>
                <div className="flex items-center gap-2 text-amber-300 text-[11px]">
                  <span className="bg-amber-950 px-1.5 py-0.5 rounded text-[9px] border border-amber-500/40">HI</span>
                  <p className="truncate">गेट 1 भीड़ से भरा है — सुरक्षित दर्शन हेतु गेट 2 की ओर जाएँ (प्रतीक्षा समय: 0 मिनट)</p>
                </div>
                <div className="flex items-center gap-2 text-cyan-300 text-[11px]">
                  <span className="bg-cyan-950 px-1.5 py-0.5 rounded text-[9px] border border-cyan-500/40">EN</span>
                  <p className="truncate">{disp.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Webhook Output Inspector */}
      {lastWebhookPayload && (
        <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              API Webhook Dispatch Log (JSON Payload)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              webhookStatus?.ok
                ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                : webhookStatus
                  ? 'text-red-400 bg-red-500/20 border-red-500/30'
                  : 'text-amber-400 bg-amber-500/20 border-amber-500/30'
            }`}>
              {isBroadcasting ? 'SENDING...' : webhookStatus?.ok ? 'HTTP 200 OK' : webhookStatus ? 'BACKEND OFFLINE' : 'STANDBY'}
            </span>
          </div>

          <pre className="bg-black p-3 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto border border-white/5">
            {JSON.stringify(webhookStatus?.detail || lastWebhookPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
