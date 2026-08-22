import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, CheckCircle, Ticket, AlertTriangle, ArrowLeft } from 'lucide-react';

export const DigitalPass = ({ booking, onBack }) => {
  const { bookings, user } = useAuth();
  const currentBooking = booking || bookings[0];
  const [activeQrIndex, setActiveQrIndex] = useState(0);
  const canvasRef = useRef(null);

  const defaultPasses = [
    {
      holder_name: user?.full_name || 'Pilgrim',
      qr_value: `${currentBooking?.shared_booking_code || 'NIRVIGHNA'}-${(user?.full_name || 'PASS').toUpperCase().replace(/\s+/g, '-')}`
    }
  ];

  const passes = currentBooking?.qr_passes && currentBooking.qr_passes.length > 0 
    ? currentBooking.qr_passes.map(p => ({
        ...p,
        holder_name: p.holder_name || p.pilgrim_name || user?.full_name || 'Pilgrim'
      }))
    : defaultPasses;

  const currentPass = passes[activeQrIndex] || defaultPasses[0];


  useEffect(() => {
    if (canvasRef.current && currentPass.qr_value) {
      QRCode.toCanvas(canvasRef.current, currentPass.qr_value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1B2A4A',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('QR Render Error', error);
      });
    }
  }, [currentPass]);

  if (!currentBooking) {
    return (
      <div className="p-8 text-center bg-ivory min-h-screen">
        <p className="text-gray-500 text-sm">No active booking pass found.</p>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-4 px-4 max-w-md mx-auto space-y-4 bg-ivory min-h-screen">
      {/* Navigation Header */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-maroon hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      )}

      {/* Ticket Container */}
      <div className="bg-white rounded-3xl shadow-warm border border-maroon/20 overflow-hidden relative">
        {/* Shikhara Top Banner */}
        <div className="bg-maroon text-ivory p-5 text-center relative">
          <div className="flex items-center justify-between text-xs text-gold font-bold mb-1">
            <span>PASSPORT NO: {currentBooking.shared_booking_code}</span>
            <span className="bg-gold text-indigo-dark px-2 py-0.5 rounded-md uppercase">
              {currentBooking.booking_mode}
            </span>
          </div>
          <h2 className="text-xl font-extrabold font-heading text-white">
            {currentBooking.temple_name || currentBooking.temples?.name || 'Dwarkadhish Temple'}
          </h2>
          {(() => {
            const rawDate = currentBooking.slot_date || currentBooking.darshan_slots?.slot_date;
            let formattedDate = 'Today';
            if (rawDate) {
              try {
                const d = new Date(rawDate);
                formattedDate = d.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
              } catch (e) {
                formattedDate = rawDate;
              }
            }
            const startTime = currentBooking.start_time || currentBooking.darshan_slots?.start_time || (currentBooking.time_slot ? currentBooking.time_slot.split('-')[0]?.trim() : '08:00 AM');
            const endTime = currentBooking.end_time || currentBooking.darshan_slots?.end_time || (currentBooking.time_slot ? currentBooking.time_slot.split('-')[1]?.trim() : '10:00 AM');
            return (
              <p className="text-xs text-gold/90 font-bold mt-1 tracking-wide">
                {formattedDate} • {startTime} - {endTime}
              </p>
            );
          })()}
        </div>

        {/* Ticket Perforated Divider */}
        <div className="relative flex items-center justify-between bg-white px-4 py-2 border-y border-dashed border-maroon/30">
          <div className="w-5 h-5 bg-ivory rounded-full -ml-6 border-r border-maroon/20"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
            OFFICIAL ENTRY QR PASS
          </span>
          <div className="w-5 h-5 bg-ivory rounded-full -mr-6 border-l border-maroon/20"></div>
        </div>

        {/* QR Code Center Section */}
        <div className="p-6 text-center space-y-4 bg-white relative">
          <div className="inline-block p-3 bg-white rounded-2xl border-2 border-gold shadow-goldGlow">
            <canvas ref={canvasRef} className="mx-auto"></canvas>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
              PILGRIM PASS HOLDER
            </span>
            <h3 className="text-lg font-extrabold text-indigo-dark font-heading">
              {currentPass.holder_name}
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-successGreen bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Confirmed
              </span>
              <span className="text-[11px] font-bold text-maroon bg-maroon/10 px-2.5 py-0.5 rounded-full">
                {currentPass?.gate_number || (typeof currentBooking.gate_number === 'string' && currentBooking.gate_number.toLowerCase().includes('gate') ? currentBooking.gate_number : `Gate #${currentBooking.gate_number || '1'}`)}
              </span>
              {(currentPass?.is_priority ?? currentBooking.is_priority) && (
                <span className="text-[10px] font-bold text-maroon bg-gold/20 border border-gold/40 px-2.5 py-0.5 rounded-full font-heading">
                  Priority Pass
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Group Member Chips Switcher */}
        {passes.length > 1 && (
          <div className="p-4 bg-ivory/60 border-t border-gray-100">
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2 text-center">
              Group Passes ({passes.length} People) - Tap to switch QR
            </label>
            <div className="flex justify-center gap-2 overflow-x-auto">
              {passes.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveQrIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    activeQrIndex === idx
                      ? 'bg-gold border-gold text-indigo-dark shadow-sm'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gold/60'
                  }`}
                >
                  {p.holder_name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-indigo-dark text-white p-4 rounded-2xl text-xs space-y-1.5 shadow-md">
        <div className="flex items-center gap-2 text-gold font-bold">
          <Shield className="w-4 h-4" /> Entry Security Notice
        </div>
        <p className="text-gray-300 text-[11px] leading-relaxed">
          Please present this QR code at Gate #{currentBooking.gate_number || 2} scan turnstiles. Keep your mobile brightness high for instant scanning.
        </p>
      </div>

      {/* Nirvighna Official Emblem Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.07] z-0 select-none">
        <img 
          src="/official_logo.png" 
          alt="Nirvighna Emblem Watermark" 
          className="w-80 h-80 max-w-[75vw] object-contain drop-shadow-sm" 
        />
      </div>
    </div>
  );
};
