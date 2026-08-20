import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

const FESTIVALS_2026 = {
  '2026-03-15': 'Mahashivratri 🔱',
  '2026-08-15': 'Independence Day 🇮🇳',
  '2026-09-04': 'Janmashtami 🛕',
  '2026-10-10': 'Navratri Starts 🌺',
  '2026-10-19': 'Dussehra 🏹',
  '2026-11-08': 'Diwali ✨'
};

export const CalendarModal = ({ selectedDate, onSelectDate, onClose }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate || new Date()));

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in current month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (d) => {
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isSelected = (d) => {
    if (!selectedDate) return false;
    const s = new Date(selectedDate);
    return d.getDate() === s.getDate() &&
      d.getMonth() === s.getMonth() &&
      d.getFullYear() === s.getFullYear();
  };

  const isPastDate = (d) => {
    return d < today;
  };

  const daysGrid = [];
  // Empty slots before first day
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    daysGrid.push(new Date(year, month, day));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gold max-w-sm w-full p-5 space-y-4 font-body text-gray-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-maroon" />
            <h3 className="font-extrabold text-sm text-maroon uppercase tracking-wide font-heading">
              Select Yatra Date
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-ivory rounded-xl border border-gray-200 hover:border-gold transition-colors text-maroon"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-black text-sm font-heading text-indigo-dark">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 bg-ivory rounded-xl border border-gray-200 hover:border-gold transition-colors text-maroon"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day Names Row */}
        <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[11px] text-gray-400 font-mono">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {daysGrid.map((dateObj, idx) => {
            if (!dateObj) {
              return <div key={`empty-${idx}`} className="h-9" />;
            }

            const past = isPastDate(dateObj);
            const active = isSelected(dateObj);
            const todayFlag = isToday(dateObj);
            const dateISO = dateObj.toISOString().split('T')[0];
            const festival = FESTIVALS_2026[dateISO];

            return (
              <button
                key={dateISO}
                disabled={past}
                onClick={() => {
                  onSelectDate(dateObj);
                  onClose();
                }}
                className={`h-10 rounded-xl font-bold flex flex-col items-center justify-center relative transition-all ${
                  past
                    ? 'text-gray-300 opacity-40 cursor-not-allowed'
                    : active
                    ? 'bg-gradient-to-br from-maroon to-red-900 text-ivory font-black shadow-md scale-[1.05]'
                    : todayFlag
                    ? 'bg-gold/30 border border-gold text-indigo-dark font-black'
                    : 'bg-ivory hover:bg-gold/20 text-gray-800'
                }`}
              >
                <span>{dateObj.getDate()}</span>
                {festival && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gold absolute bottom-1 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Festival Legend & Info */}
        <div className="bg-ivory p-3 rounded-2xl border border-gray-200 text-[11px] space-y-1">
          <p className="font-extrabold text-maroon flex items-center gap-1 font-heading">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Tip: Festival & Peak Days
          </p>
          <p className="text-gray-600 text-[10px]">
            Dates marked with gold indicators have special Mahapooja or Aarti arrangements.
          </p>
        </div>

        {/* Native Native HTML Date Input Option */}
        <div className="pt-1">
          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">
            Or Pick Exact Date Input:
          </label>
          <input
            type="date"
            min={today.toISOString().split('T')[0]}
            value={selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              if (e.target.value) {
                onSelectDate(new Date(e.target.value));
                onClose();
              }
            }}
            className="w-full px-3 py-2 bg-ivory border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-maroon"
          />
        </div>
      </div>
    </div>
  );
};
