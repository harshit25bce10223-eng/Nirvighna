import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, CheckCircle, Ticket, User, Phone, Calendar, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export const OfflineCounterBooking = ({ onBookingSuccess }) => {
  const { addBooking } = useAuth();
  const [formData, setFormData] = useState({
    pilgrimName: '',
    phone: '',
    templeId: 'tmp_somnath',
    slotDate: 'Today (Jul 29)',
    timeSlot: '07:00 AM - 08:00 AM',
    totalPilgrims: 1,
    isPriority: false,
  });

  const [printedPass, setPrintedPass] = useState(null);

  const templeNames = {
    tmp_somnath: 'Somnath Temple',
    tmp_dwarka: 'Dwarkadhish Temple',
    tmp_ambaji: 'Ambaji Temple',
    tmp_pavagadh: 'Kalika Mata Temple'
  };

  const handleCreateOfflineBooking = (e) => {
    e.preventDefault();
    if (!formData.pilgrimName) return;

    const randomCode = 'KV-OFF-' + Math.floor(1000 + Math.random() * 9000);
    const assignedGate = Math.floor(Math.random() * 4) + 1; // Round-robin gate assignment

    const newBooking = {
      id: 'bk_off_' + Date.now(),
      temple_id: formData.templeId,
      temple_name: templeNames[formData.templeId],
      slot_date: formData.slotDate,
      time_slot: formData.timeSlot,
      booking_mode: 'offline',
      gate_number: assignedGate,
      is_priority: formData.isPriority,
      shared_booking_code: randomCode,
      status: 'confirmed',
      total_pilgrims: formData.totalPilgrims,
      qr_passes: [
        {
          id: 'qr_off_' + Date.now(),
          holder_name: formData.pilgrimName,
          qr_value: `${randomCode}-OFFLINE-PILGRIM`,
          is_scanned: false
        }
      ]
    };

    addBooking(newBooking);
    setPrintedPass(newBooking);
  };

  return (
    <div className="pb-20 pt-4 px-4 max-w-md mx-auto space-y-4 bg-ivory min-h-screen">
      {/* Counter Header */}
      <div className="bg-indigo-dark text-white p-4 rounded-2xl shadow-md border border-gold/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-gold bg-gold/20 border border-gold/40 px-2 py-0.5 rounded-full">
            PHYSICAL COUNTER STAFF KIOSK
          </span>
          <h2 className="text-xl font-bold font-heading text-white mt-1">
            Offline Darshan Booking
          </h2>
          <p className="text-xs text-gray-300">For pilgrims without smartphones / internet</p>
        </div>
        <Printer className="w-8 h-8 text-gold" />
      </div>

      {!printedPass ? (
        <form onSubmit={handleCreateOfflineBooking} className="bg-white p-5 rounded-2xl shadow-warm border border-gray-200 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Pilgrim Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Harishbhai Parmar"
              value={formData.pilgrimName}
              onChange={e => setFormData({ ...formData, pilgrimName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Mobile Number (Optional)</label>
            <input
              type="tel"
              placeholder="+91 98765 00000"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">Temple</label>
              <select
                value={formData.templeId}
                onChange={e => setFormData({ ...formData, templeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-semibold"
              >
                <option value="tmp_somnath">Somnath</option>
                <option value="tmp_dwarka">Dwarka</option>
                <option value="tmp_ambaji">Ambaji</option>
                <option value="tmp_pavagadh">Pavagadh</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">Total Devotees</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.totalPilgrims}
                onChange={e => setFormData({ ...formData, totalPilgrims: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gold hover:bg-gold-dark text-indigo-dark font-extrabold font-heading text-xs rounded-xl shadow-goldGlow uppercase tracking-wider mt-2"
          >
            Issue & Print Counter QR Pass
          </button>
        </form>
      ) : (
        /* Printed Paper Slip Preview */
        <div className="bg-white p-5 rounded-3xl border-2 border-dashed border-maroon space-y-4 shadow-xl text-center relative">
          <div className="bg-maroon text-white p-3 rounded-xl">
            <span className="text-[10px] text-gold font-bold uppercase block">PHYSICAL PRINTED PASS</span>
            <h3 className="text-lg font-black font-heading text-white">{printedPass.temple_name}</h3>
            <p className="text-xs text-gold font-bold mt-0.5">ASSIGNED GATE #{printedPass.gate_number}</p>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-xs">
            <p className="font-bold text-indigo-dark">Pilgrim: {printedPass.qr_passes[0].holder_name}</p>
            <p className="text-gray-500 font-mono text-[11px]">Pass Code: {printedPass.shared_booking_code}</p>
            <p className="text-xs font-semibold text-maroon">{printedPass.slot_date} | {printedPass.time_slot}</p>
          </div>

          <div className="p-3 border-2 border-gold rounded-2xl bg-white inline-block shadow-goldGlow">
            <div className="w-32 h-32 bg-indigo-dark rounded-lg flex flex-col items-center justify-center text-gold p-2">
              <Ticket className="w-8 h-8 mb-1" />
              <span className="text-[9px] font-mono text-center break-all text-white">
                {printedPass.qr_passes[0].qr_value}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 font-mono bg-ivory p-2.5 rounded-lg border border-gray-200">
            ✓ Same QR format as online pass. Proceed directly to Gate #{printedPass.gate_number} turnstiles.
          </div>

          <button
            onClick={() => setPrintedPass(null)}
            className="w-full py-2.5 bg-indigo-dark text-gold font-bold text-xs rounded-xl uppercase"
          >
            Issue Another Counter Booking
          </button>
        </div>
      )}
    </div>
  );
};
