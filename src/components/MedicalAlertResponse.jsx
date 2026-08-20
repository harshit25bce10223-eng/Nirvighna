import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, CheckCircle2, Phone, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export const MedicalAlertResponse = ({ alertId = 'med_204' }) => {
  const { medicalAlerts, updateAlertStatus } = useAuth();
  const currentAlert = medicalAlerts.find(a => a.id === alertId) || medicalAlerts[0];
  const [status, setStatus] = useState(currentAlert?.status || 'en_route');

  const steps = [
    { key: 'open', label: 'Open' },
    { key: 'en_route', label: 'En Route' },
    { key: 'reached', label: 'Reached' },
    { key: 'resolved', label: 'Resolved' }
  ];

  const handleNextStatus = () => {
    let next = 'en_route';
    if (status === 'open') next = 'en_route';
    else if (status === 'en_route') next = 'reached';
    else if (status === 'reached') next = 'resolved';

    setStatus(next);
    updateAlertStatus(currentAlert.id, next);
  };

  return (
    <div className="pb-20 pt-4 px-4 max-w-md mx-auto space-y-4 bg-indigo-dark text-white min-h-screen">
      {/* Header */}
      <div className="bg-indigo-card p-4 rounded-2xl border border-alertRed/40 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-alertRed bg-alertRed/10 px-2 py-0.5 rounded-full border border-alertRed/30">
            LIVE EMERGENCY RESPONSE
          </span>
          <h2 className="text-xl font-bold font-heading text-white mt-1">
            Medical Case #{currentAlert.id}
          </h2>
          <p className="text-xs text-gray-300">Location: {currentAlert.location}</p>
        </div>
        <HeartPulse className="w-8 h-8 text-alertRed animate-pulse" />
      </div>

      {/* Horizontal Status Stepper */}
      <div className="bg-indigo-card p-4 rounded-2xl border border-white/10">
        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-3">
          Emergency Status Stepper
        </label>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2 z-0"></div>
          {steps.map((s, idx) => {
            const isCompleted = steps.findIndex(x => x.key === status) > idx;
            const isCurrent = status === s.key;
            return (
              <div key={s.key} className="relative z-10 text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mx-auto transition-all ${
                    isCurrent
                      ? 'bg-gold text-indigo-dark ring-4 ring-gold/30 scale-110 font-black'
                      : isCompleted
                      ? 'bg-successGreen text-white'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 block ${
                    isCurrent ? 'text-gold' : isCompleted ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimal Medical Info Card */}
      <div className="bg-indigo-card p-5 rounded-2xl border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
          Patient Minimal Medical File
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-indigo-dark p-3 rounded-xl">
            <span className="text-[10px] text-gray-400 block">BLOOD GROUP</span>
            <span className="text-lg font-bold text-white font-mono">{currentAlert.blood_group}</span>
          </div>
          <div className="bg-indigo-dark p-3 rounded-xl">
            <span className="text-[10px] text-gray-400 block">KNOWN ALLERGIES</span>
            <span className="text-xs font-bold text-alertRed">{currentAlert.allergies}</span>
          </div>
        </div>
      </div>

      {/* Live Action Button */}
      {status !== 'resolved' ? (
        <button
          onClick={handleNextStatus}
          className="w-full py-4 bg-gold hover:bg-gold-dark text-indigo-dark font-extrabold font-heading text-sm rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all"
        >
          {status === 'open' && 'Mark as En Route'}
          {status === 'en_route' && 'Mark as Reached Patient'}
          {status === 'reached' && 'Mark Case as Resolved'}
        </button>
      ) : (
        <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-300 p-4 rounded-2xl text-center text-xs font-bold">
          ✓ Case #204 Resolved by Volunteer Vikram S.
        </div>
      )}

      {/* Live Note */}
      <div className="bg-indigo-card/60 p-3 rounded-xl text-[11px] text-gray-300 flex items-center justify-between border border-white/5">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Group members and emergency contact notified
        </span>
        <span className="font-mono text-gold font-bold">7:42 PM</span>
      </div>
    </div>
  );
};
