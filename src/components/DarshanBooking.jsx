import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, Clock, Accessibility, CheckCircle2, AlertCircle } from 'lucide-react';

export const DarshanBooking = ({ templeId, onBookingSuccess }) => {
  const { addBooking, user } = useAuth();

  const [selectedDate, setSelectedDate] = useState('Today (Jul 29)');
  const [slotType, setSlotType] = useState('general'); // 'general' | 'vip'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isPriority, setIsPriority] = useState(false);

  const dates = [
    { label: 'Today (Jul 29)', active: true },
    { label: 'Thu (Jul 30)', active: false },
    { label: 'Fri (Jul 31)', active: false },
    { label: 'Sat (Aug 01)', active: false }
  ];

  const slots = [
    { time: '06:00 AM - 07:00 AM', status: 'Available', color: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
    { time: '07:00 AM - 08:00 AM', status: 'Filling Fast', color: 'bg-amber-50 border-amber-300 text-amber-800' },
    { time: '08:00 AM - 09:00 AM', status: 'Full', color: 'bg-red-50 border-red-200 text-red-400 opacity-60 pointer-events-none' },
    { time: '09:00 AM - 10:00 AM', status: 'Available', color: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
    { time: '04:00 PM - 05:00 PM', status: 'Filling Fast', color: 'bg-amber-50 border-amber-300 text-amber-800' },
    { time: '06:00 PM - 07:00 PM', status: 'Available', color: 'bg-emerald-50 border-emerald-300 text-emerald-800' }
  ];

  const templeNames = {
    tmp_somnath: 'Somnath Temple',
    tmp_dwarka: 'Dwarkadhish Temple',
    tmp_ambaji: 'Ambaji Temple',
    tmp_pavagadh: 'Kalika Mata Temple'
  };

  const currentTemple = templeNames[templeId] || 'Somnath Temple';

  const handleConfirm = () => {
    if (!selectedSlot) return;

    const randomCode = 'KV-' + Math.floor(1000 + Math.random() * 9000);
    const newBooking = {
      id: 'bk_' + Date.now(),
      temple_id: templeId || 'tmp_somnath',
      temple_name: currentTemple,
      slot_date: selectedDate,
      time_slot: selectedSlot,
      booking_mode: 'online',
      gate_number: 2,
      is_priority: isPriority,
      shared_booking_code: randomCode,
      status: 'confirmed',
      total_pilgrims: 1 + user.group_members.length,
      qr_passes: [
        {
          id: 'qr_' + Date.now() + '_1',
          holder_name: user.full_name,
          qr_value: `${randomCode}-PILGRIM-${user.full_name.split(' ')[0].toUpperCase()}`,
          is_scanned: false
        },
        ...user.group_members.map((m, idx) => ({
          id: 'qr_' + Date.now() + '_' + (idx + 2),
          holder_name: m.name,
          qr_value: `${randomCode}-MEMBER-${m.name.split(' ')[0].toUpperCase()}`,
          is_scanned: false
        }))
      ]
    };

    addBooking(newBooking);
    onBookingSuccess(newBooking);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 bg-ivory min-h-screen">
      {/* Hero Header */}
      <div className="bg-white p-4 rounded-2xl shadow-warm border border-maroon/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-gold bg-indigo-dark px-2 py-0.5 rounded-full">
            Temple Booking
          </span>
          <h2 className="text-xl font-bold font-heading text-maroon mt-1">
            {currentTemple}
          </h2>
          <p className="text-xs text-gray-500">Fast-Track Pass Generation</p>
        </div>
        <div className="w-12 h-12 bg-maroon/10 text-maroon rounded-2xl flex items-center justify-center font-bold">
          🏛️
        </div>
      </div>

      {/* Date Picker Strip */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
          Select Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {dates.map((d, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDate(d.label)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedDate === d.label
                  ? 'bg-gold border-gold text-indigo-dark shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gold/50'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slot Type Toggle */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
          Pass Category
        </label>
        <div className="bg-gray-200 p-1 rounded-xl flex text-xs font-bold">
          <button
            onClick={() => setSlotType('general')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              slotType === 'general' ? 'bg-white text-maroon shadow-sm' : 'text-gray-600'
            }`}
          >
            General Entry (Free)
          </button>
          <button
            onClick={() => setSlotType('vip')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              slotType === 'vip' ? 'bg-gold text-indigo-dark shadow-sm font-extrabold' : 'text-gray-600'
            }`}
          >
            VIP Special Entry
          </button>
        </div>
      </div>

      {/* Circuit AI Insight Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Circuit AI Suggestion:</span> Dwarka is at 90% capacity tomorrow — consider booking Somnath morning slot first!
        </div>
      </div>

      {/* Time Slot Grid */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
          Available Time Slots
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              onClick={() => slot.status !== 'Full' && setSelectedSlot(slot.time)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${slot.color} ${
                selectedSlot === slot.time ? 'ring-2 ring-gold border-gold shadow-md font-bold' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{slot.time}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                {slot.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Assistance Checkbox */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Accessibility className="w-5 h-5 text-indigo-dark" />
          <div>
            <h4 className="text-xs font-bold text-gray-800">Priority Assistance Requested</h4>
            <p className="text-[10px] text-gray-500">Elderly / Pregnant / Differently-abled</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isPriority}
          onChange={e => setIsPriority(e.target.checked)}
          className="w-4 h-4 text-gold rounded border-gray-300 focus:ring-gold"
        />
      </div>

      {/* Bottom Sticky Button */}
      <div className="fixed bottom-14 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-30 max-w-md mx-auto">
        <button
          onClick={handleConfirm}
          disabled={!selectedSlot}
          className={`w-full py-3.5 rounded-xl font-bold font-heading text-sm shadow-goldGlow transition-all uppercase tracking-wider ${
            selectedSlot
              ? 'bg-gold hover:bg-gold-dark text-indigo-dark cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedSlot ? `Confirm Booking (${slotType.toUpperCase()})` : 'Select a Time Slot'}
        </button>
      </div>
    </div>
  );
};
