import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, HeartPulse, Accessibility, Flag, Lock, ArrowLeft, ShieldAlert, PhoneCall, Users } from 'lucide-react';

export const VolunteerScanResult = ({ onNavigate }) => {
  const { triggerMedicalAssist } = useAuth();
  const [viewState, setViewState] = useState('menu'); // 'menu' | 'medical'
  const [activeAlert, setActiveAlert] = useState(null);

  const pilgrimData = {
    pilgrim_name: 'Ramesh Patel',
    gate_number: 2,
    booking_code: 'KV-8921',
    blood_group: 'B+',
    allergies: 'Penicillin',
    emergency_contact: 'Savitri Patel (+91 98765 99999)'
  };

  const handleMedicalAssistClick = () => {
    // 1. Create case & trigger 3-way alert (Family app push, Emergency SMS, Command Centre dispatch)
    const alertRecord = triggerMedicalAssist(pilgrimData);
    setActiveAlert(alertRecord);
    setViewState('medical');
  };

  return (
    <div className="pb-20 pt-4 px-4 max-w-md mx-auto space-y-4 bg-indigo-dark text-white min-h-screen font-body">
      {/* Top Banner Confirmation */}
      <div className="bg-emerald-500/20 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-400 text-indigo-dark flex items-center justify-center font-black shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">VALIDATED QR ENTRY PASS</span>
          <h3 className="text-lg font-bold font-heading text-white">{pilgrimData.pilgrim_name}</h3>
          <p className="text-xs text-gray-300">Gate #{pilgrimData.gate_number} | Priority: Gate Allotted | Booking: {pilgrimData.booking_code}</p>
        </div>
      </div>

      {viewState === 'menu' ? (
        <>
          {/* 2x2 Grid of Simple Action Menu - Raw Personal Data Hidden */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate && onNavigate('/volunteer')}
              className="p-5 bg-emerald-700 hover:bg-emerald-600 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-emerald-400/30 active:scale-95 transition-all shadow-md"
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
              <span className="text-sm font-bold font-heading">Valid Entry</span>
              <span className="text-[10px] text-emerald-200">Allow Pilgrim Through Gate</span>
            </button>

            <button
              onClick={handleMedicalAssistClick}
              className="p-5 bg-alertRed hover:bg-red-700 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-red-300/30 active:scale-95 transition-all shadow-md shadow-alertGlow"
            >
              <HeartPulse className="w-8 h-8 text-white animate-pulse" />
              <span className="text-sm font-bold font-heading">Medical Assist</span>
              <span className="text-[10px] text-red-200">Unlock Emergency Details</span>
            </button>

            <button
              onClick={() => alert('Priority Wheelchair Escort Pinged to Gate #2 Volunteer Squad')}
              className="p-5 bg-gold hover:bg-gold-dark text-indigo-dark rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-gold-light/30 active:scale-95 transition-all shadow-md"
            >
              <Accessibility className="w-8 h-8" />
              <span className="text-sm font-black font-heading">Priority Assist</span>
              <span className="text-[10px] opacity-90">Elderly / Wheelchair Escort</span>
            </button>

            <button
              onClick={() => alert('Issue Flag Logged to Command Centre Gate Monitor')}
              className="p-5 bg-gray-700 hover:bg-gray-600 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-white/10 active:scale-95 transition-all shadow-md"
            >
              <Flag className="w-8 h-8 text-gray-300" />
              <span className="text-sm font-bold font-heading">Report Issue</span>
              <span className="text-[10px] text-gray-300">Duplicate / Gate Flag</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1 pt-2">
            <Lock className="w-3.5 h-3.5 text-gold" /> Personal Data Protected — Privacy Vault Locks Full Profile
          </p>
        </>
      ) : (
        /* Medical Info Unlocked View — Displays ONLY relevant medical data */
        <div className="bg-indigo-card p-5 rounded-2xl border-2 border-alertRed space-y-4">
          <button
            onClick={() => setViewState('menu')}
            className="flex items-center gap-1 text-xs font-bold text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Actions
          </button>

          <div className="border-b border-alertRed/30 pb-3">
            <span className="text-[10px] uppercase font-bold text-alertRed bg-alertRed/10 px-2 py-0.5 rounded-full">
              MEDICAL PRIVACY VAULT UNLOCKED
            </span>
            <h3 className="text-xl font-bold font-heading text-white mt-1">Patient: {pilgrimData.pilgrim_name}</h3>
            <p className="text-xs text-gray-300">Gate #2 Sanctum Queue</p>
          </div>

          {/* Displays ONLY Medical Data (Blood Group, Allergies) */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-indigo-dark p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Blood Group</span>
              <span className="text-lg font-bold font-mono text-gold">{pilgrimData.blood_group}</span>
            </div>
            <div className="bg-indigo-dark p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Known Allergies</span>
              <span className="text-sm font-bold text-alertRed">{pilgrimData.allergies}</span>
            </div>
          </div>

          {/* 3-Way Instant Automated Alert Banner */}
          <div className="bg-alertRed/15 border border-alertRed/40 p-3.5 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-300">
              <ShieldAlert className="w-4 h-4 text-alertRed animate-pulse" /> 3-Way Medical Alert Dispatched
            </div>
            <ul className="text-[11px] text-gray-200 space-y-1 pl-2">
              <li className="flex items-center gap-1.5"><Users className="w-3 h-3 text-emerald-400" /> Group Members: Pushed to App</li>
              <li className="flex items-center gap-1.5"><PhoneCall className="w-3 h-3 text-gold" /> Emergency Contact: SMS sent to {pilgrimData.emergency_contact}</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-400" /> Command Centre: Case #{activeAlert?.id || 'med_204'} logged & responder dispatched</li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate && onNavigate(`/v/medical/${activeAlert?.id || 'med_204'}`)}
            className="w-full py-3.5 bg-alertRed hover:bg-red-700 text-white font-bold font-heading rounded-xl shadow-alertGlow text-xs uppercase tracking-wider"
          >
            Track Responder & Update Status ({activeAlert?.id || 'med_204'})
          </button>
        </div>
      )}
    </div>
  );
};

