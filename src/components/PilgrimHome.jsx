import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrasadQueueModal } from './PrasadQueueModal';
import { Sparkles, Calendar, QrCode, Bus, Users, Utensils, Volume2, ShieldAlert, Heart, Anchor, Sun, ArrowRight, Bell, MapPin, Navigation, Clock, Gift, Shield } from 'lucide-react';

export const PilgrimHome = ({ onNavigate }) => {
  const { user, language, isMelaMode, toggleMelaMode, bookings } = useAuth();
  const [showPrasadToken, setShowPrasadToken] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [audioNavActive, setAudioNavActive] = useState(false);
  const [donationAmount, setDonationAmount] = useState('501');

  const latestBooking = bookings?.[0];

  const temples = [
    {
      id: 'tmp_somnath',
      name: 'Somnath Temple',
      location: 'Somnath, Gujarat',
      crowdLevel: 'Medium',
      crowdColor: 'bg-gold text-indigo-dark',
      capacity: '45%',
      tag: 'Jyotirlinga',
      image: '/images/temples/somnath.png'
    },
    {
      id: 'tmp_dwarka',
      name: 'Dwarkadhish Temple',
      location: 'Dwarka, Gujarat',
      crowdLevel: 'High',
      crowdColor: 'bg-alertRed text-white',
      capacity: '90%',
      tag: 'Bet Dwarka Boat Ferry',
      image: '/images/temples/dwarka.png'
    },
    {
      id: 'tmp_ambaji',
      name: 'Ambaji Temple',
      location: 'Banaskantha, Gujarat',
      crowdLevel: isMelaMode ? 'CRITICAL (Mela)' : 'Low',
      crowdColor: isMelaMode ? 'bg-alertRed text-white animate-pulse' : 'bg-successGreen text-white',
      capacity: isMelaMode ? '98%' : '35%',
      tag: 'Shakti Peeth (Gabbar)',
      image: '/images/temples/ambaji.jpg'
    },
    {
      id: 'tmp_pavagadh',
      name: 'Kalika Mata Temple',
      location: 'Pavagadh, Gujarat',
      crowdLevel: 'Medium',
      crowdColor: 'bg-gold text-indigo-dark',
      capacity: '60%',
      tag: 'Pavagadh Ropeway',
      image: '/images/temples/pavagadh.jpg'
    }
  ];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 bg-ivory min-h-screen">
      {/* gate info push banner */}
      {latestBooking && (
        <div className="bg-gradient-to-r from-gold/20 via-amber-50 to-gold/10 border-2 border-gold p-3.5 rounded-2xl shadow-sm text-xs space-y-1.5">
          <div className="flex items-center justify-between text-indigo-dark font-extrabold font-heading">
            <span className="flex items-center gap-1.5 text-maroon">
              <Bell className="w-4 h-4 text-gold-dark animate-bounce" /> 2-Hour Pre-Slot Gate Info Auto-Push
            </span>
            <span className="bg-gold text-indigo-dark text-[9px] px-2 py-0.5 rounded-full uppercase font-mono">
              Live Queue Sync
            </span>
          </div>
          <p className="text-gray-800 font-semibold">
            Proceed to <strong className="text-maroon">Gate #{latestBooking.gate_number || 2}</strong> | Current Queue Wait: <strong className="text-emerald-700">12 Mins</strong>
          </p>
          <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono pt-0.5">
            <span>Nearest Parking: North Gate P1 (40% Full)</span>
            <button
              onClick={() => onNavigate('/travel')}
              className="text-maroon font-bold underline flex items-center gap-0.5"
            >
              Directions <Navigation className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* mela mode toggle */}
      <div className="bg-gradient-to-r from-maroon to-indigo-dark text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between border border-gold/30">
        <div className="flex items-center gap-2 text-xs">
          <Sun className={`w-4 h-4 ${isMelaMode ? 'text-gold animate-spin' : 'text-gray-400'}`} />
          <div>
            <span className="font-bold font-heading text-ivory block">Ambaji Bhadarvi Poonam Mela</span>
            <span className="text-[10px] text-gold font-semibold">
              {isMelaMode ? '🔥 Mela Mode Active (Padyatri Checkpoints On)' : 'Regular Mode'}
            </span>
          </div>
        </div>
        <button
          onClick={toggleMelaMode}
          className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all border ${
            isMelaMode
              ? 'bg-gold text-indigo-dark border-gold shadow-goldGlow'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          }`}
        >
          {isMelaMode ? 'Mela ON' : 'Enable Mela'}
        </button>
      </div>

      {/* greeting header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-warm border border-maroon/10">
        <div>
          <h2 className="text-xl font-extrabold font-heading text-maroon flex items-center gap-1.5">
            Namaste, {user.full_name.split(' ')[0]} 🙏
          </h2>
          <p className="text-xs text-gray-500 font-medium">Safe & Blessed Pilgrimage Portal</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gold/20 text-maroon border-2 border-gold flex items-center justify-center font-black text-sm shadow-sm">
          {user.full_name[0]}
        </div>
      </div>

      {/* crowd warning banner */}
      <div className="bg-indigo-dark text-white p-4 rounded-2xl shadow-md border border-gold/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gold font-bold uppercase tracking-wider text-[10px]">
            <Sparkles className="w-4 h-4 text-gold animate-pulse" /> Cross-Temple Circuit AI
          </span>
          <span className="text-[10px] text-gray-400 font-mono">Live Forecast</span>
        </div>
        <p className="text-xs font-semibold text-ivory leading-snug">
          "Dwarka is expected at <strong className="text-alertRed font-extrabold">90% full</strong> tomorrow. Visit <strong className="text-gold">Somnath first</strong>, Dwarka on Day 2."
        </p>
      </div>

      {/* actions grid */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 px-1">
          Pilgrim Actions & Services
        </h3>
        <div className="grid grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigate('/book/tmp_somnath')}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-warm border border-gray-100 hover:border-gold transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold-dark flex items-center justify-center mb-1.5">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight">
              Book Darshan
            </span>
          </button>

          <button
            onClick={() => onNavigate('/pass')}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-warm border border-gray-100 hover:border-gold transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center mb-1.5">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight">
              My Pass
            </span>
          </button>

          <button
            onClick={() => onNavigate('/travel')}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-warm border border-gray-100 hover:border-gold transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-dark/10 text-indigo-dark flex items-center justify-center mb-1.5">
              <Bus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight">
              Parking & Shuttle
            </span>
          </button>

          <button
            onClick={() => setShowPrasadToken(true)}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-warm border border-gray-100 hover:border-gold transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
              <Utensils className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight">
              Prasad Token
            </span>
          </button>
        </div>
      </div>

      {/* donation card */}
      <div className="bg-white p-4 rounded-2xl shadow-warm border border-gold/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gold/15 text-maroon rounded-xl font-bold">
            <Gift className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-maroon font-heading">Temple Seva & Donations</h4>
            <p className="text-[10px] text-gray-500">Digital receipt & 80G tax exemption</p>
          </div>
        </div>
        <button
          onClick={() => setShowDonationModal(true)}
          className="px-3.5 py-1.5 bg-gold hover:bg-gold-dark text-indigo-dark rounded-xl text-xs font-bold shadow-goldGlow uppercase"
        >
          Donate
        </button>
      </div>

      {/* temple list */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Gujarat Shrines (4)
          </h3>
          <span className="text-[11px] text-maroon font-semibold">Live Queue</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {temples.map((temple) => (
            <div
              key={temple.id}
              onClick={() => onNavigate(`/book/${temple.id}`)}
              className="w-52 shrink-0 bg-white rounded-2xl shadow-warm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="h-28 bg-gray-200 relative overflow-hidden">
                <img
                  src={temple.image}
                  alt={temple.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${temple.crowdColor}`}>
                  {temple.crowdLevel} ({temple.capacity})
                </span>
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-indigo-dark/80 text-white backdrop-blur-sm px-2 py-0.5 rounded-md">
                  {temple.tag}
                </span>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-sm font-heading text-maroon truncate">
                  {temple.name}
                </h4>
                <p className="text-[11px] text-gray-500 truncate">{temple.location}</p>
                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gold-dark flex items-center gap-1">
                    Book Slot <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* prasad modal */}
      {showPrasadToken && (
        <PrasadQueueModal
          templeId="tmp_somnath"
          templeName="Somnath Temple"
          onClose={() => setShowPrasadToken(false)}
        />
      )}

      {/* donation modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-xs w-full space-y-4 shadow-2xl border-2 border-gold text-center">
            <div className="w-12 h-12 bg-maroon/10 text-maroon rounded-full mx-auto flex items-center justify-center font-bold text-xl">
              🙏
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-maroon bg-maroon/10 px-2 py-0.5 rounded-full">
                DIGITAL TEMPLE DONATION
              </span>
              <h3 className="text-lg font-bold font-heading text-indigo-dark mt-1">Somnath Temple Seva</h3>
              <p className="text-xs text-gray-500">Instant digital receipt & 80G tax exemption</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['101', '501', '1100'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setDonationAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    donationAmount === amt ? 'bg-gold border-gold text-indigo-dark' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                alert(`Thank you for your ₹${donationAmount} donation! Tax receipt generated.`);
                setShowDonationModal(false);
              }}
              className="w-full py-3 bg-gold hover:bg-gold-dark text-indigo-dark font-extrabold font-heading text-xs rounded-xl shadow-goldGlow uppercase"
            >
              Donate ₹{donationAmount} Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
