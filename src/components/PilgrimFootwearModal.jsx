import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle, Box, Clock, MapPin, Footprints, ShieldCheck, QrCode as QrIcon } from 'lucide-react';
import { getTempleById } from '../lib/templeRegistry';
import { broadcastBookingToVolunteers } from '../lib/volunteerEngine';

export const PilgrimFootwearModal = ({ isOpen, onClose, templeId = 'tmp_somnath' }) => {
  const { currentUser, issueFootwearToken } = useAuth();
  const shrine = getTempleById(templeId);

  const [pairCount, setPairCount] = useState(2);
  const [pilgrimName, setPilgrimName] = useState(currentUser?.full_name || 'Pilgrim Devotee');
  const [activeToken, setActiveToken] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if pilgrim already has an active footwear token for today
    const existing = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
    if (existing && existing.length > 0) {
      const latest = existing[0];
      if (latest.status !== 'retrieved') {
        setActiveToken(latest);
        generateQR(latest.token_id || latest.id);
      }
    }
  }, [isOpen]);

  const generateQR = async (val) => {
    try {
      const url = await QRCode.toDataURL(val, { margin: 1, width: 220, color: { dark: '#150507', light: '#ffffff' } });
      setQrCodeUrl(url);
    } catch (_) {}
  };

  const handleIssueToken = async () => {
    setLoading(true);
    try {
      const shrinePrefix = templeId === 'tmp_dwarka' ? 'DWA' : templeId === 'tmp_ambaji' ? 'AMB' : templeId === 'tmp_pavagadh' ? 'PAV' : 'SOM';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const rackLetter = String.fromCharCode(65 + Math.floor(Math.random() * 4));
      const rackNum = Math.floor(1 + Math.random() * 40);

      const tokenObj = {
        token_id: `FW-${shrinePrefix}-${randomNum}`,
        id: `FW-${shrinePrefix}-${randomNum}`,
        pilgrim_name: pilgrimName.trim() || 'Pilgrim Devotee',
        rack_no: `Rack ${rackLetter}-${rackNum}`,
        temple_id: templeId,
        temple_name: shrine.name,
        counter_location: `${shrine.name} Smart Shoe Counter #1`,
        pair_count: pairCount,
        status: 'checked_in',
        created_at: new Date().toISOString(),
        time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      // Save to AuthContext & localStorage
      if (issueFootwearToken) {
        issueFootwearToken(tokenObj.pilgrim_name, tokenObj.pair_count);
      }

      const existingLocal = JSON.parse(localStorage.getItem('nirvighna_footwear_tokens') || '[]');
      existingLocal.unshift(tokenObj);
      localStorage.setItem('nirvighna_footwear_tokens', JSON.stringify(existingLocal));

      // Create Pilgrim App Notification Record
      const footwearNotif = {
        id: `notif_fw_${Date.now()}`,
        user_id: currentUser?.id || '00000000-0000-4000-a000-000000000077',
        title: '👟 Footwear Locker Token Issued',
        message: `Footwear Locker Token #${tokenObj.token_id} issued for ${tokenObj.pair_count} pair(s). Assigned to ${tokenObj.rack_no} at ${shrine.name} Shoe Counter.`,
        type: 'footwear',
        is_read: false,
        created_at: new Date().toISOString()
      };

      const localNotifs = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
      localNotifs.unshift(footwearNotif);
      localStorage.setItem('nirvighna_notifications', JSON.stringify(localNotifs));

      // Broadcast event to active Notification page views
      window.dispatchEvent(new CustomEvent('nirvighna_notification_alert', { detail: footwearNotif }));

      // Broadcast live alert to Volunteer Hub
      broadcastBookingToVolunteers({
        id: tokenObj.token_id,
        temple_id: templeId,
        temples: { name: shrine.name },
        total_pilgrims: tokenObj.pair_count,
        is_priority: false,
        gate_number: tokenObj.rack_no,
        pilgrim_phone: currentUser?.phone || '9876543210'
      });

      setActiveToken(tokenObj);
      await generateQR(tokenObj.token_id);
    } catch (e) {
      console.error('Error generating footwear token:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in">
      <div className="bg-[#1a080a] border border-amber-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden font-body text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gold font-heading uppercase tracking-wide">
                Smart Footwear Locker Token
              </h3>
              <p className="text-[11px] text-gray-300">{shrine.name} • Shoe Locker Counter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Token Active View */}
        {activeToken ? (
          <div className="space-y-4 text-center">
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SHOES CHECKED-IN
                </span>
                <span className="font-mono text-gold font-bold">{activeToken.token_id}</span>
              </div>

              {/* QR Code */}
              {qrCodeUrl ? (
                <div className="p-3 bg-white rounded-xl inline-block shadow-md border-2 border-gold">
                  <img src={qrCodeUrl} alt="Footwear QR Token" className="w-44 h-44 mx-auto object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 mx-auto bg-slate-900 rounded-xl flex items-center justify-center">
                  <QrIcon className="w-12 h-12 text-gold animate-pulse" />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xl font-black text-gold font-mono tracking-wider">{activeToken.rack_no}</p>
                <p className="text-xs text-gray-300 font-semibold">{activeToken.pilgrim_name} • {activeToken.pair_count} Pair{activeToken.pair_count > 1 ? 's' : ''} Deposited</p>
                <p className="text-[10px] text-gray-400 font-mono">Deposited at {activeToken.time_formatted || 'Today'}</p>
              </div>
            </div>

            <p className="text-xs text-amber-200/90 leading-normal bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              💡 Show this QR code to the volunteer counter staff when returning to retrieve your footwear instantly.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveToken(null);
                  setQrCodeUrl('');
                }}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors"
              >
                + Deposit New Pair
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gold text-slate-950 font-black text-xs rounded-xl shadow-goldGlow"
              >
                Done / Close
              </button>
            </div>
          </div>
        ) : (
          /* Generate Token Form */
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 block">Devotee Name</label>
              <input
                type="text"
                value={pilgrimName}
                onChange={(e) => setPilgrimName(e.target.value)}
                placeholder="Enter pilgrim name"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-amber-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-gold font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 block">Number of Footwear Pairs</label>
                <span className="text-[11px] font-extrabold text-gold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {pairCount} {pairCount === 1 ? 'Pair' : 'Pairs'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPairCount(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-950 border border-amber-900/50 text-gold font-black text-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={pairCount}
                  onChange={(e) => setPairCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-base font-black text-white focus:outline-none focus:border-gold font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPairCount(prev => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-950 border border-amber-900/50 text-gold font-black text-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Quick Presets for Large Family / Yatra Bus Groups */}
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                {[1, 2, 4, 6, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPairCount(num)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      pairCount === num
                        ? 'bg-gold text-slate-950 border-gold font-black shadow-sm'
                        : 'bg-slate-950 text-gray-300 border-white/10 hover:border-gold/40'
                    }`}
                  >
                    {num} P
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-white/10 space-y-1 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Counter Station:</span>
                <span className="font-bold text-gold">{shrine.name} Main Gate</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee:</span>
                <span className="font-bold text-emerald-400">FREE (Mandir Trust Facility)</span>
              </div>
            </div>

            <button
              onClick={handleIssueToken}
              disabled={loading || !pilgrimName.trim()}
              className="w-full py-3.5 bg-gold hover:bg-gold-dark text-slate-950 font-black text-xs rounded-xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading"
            >
              {loading ? 'Assigning Locker Rack...' : '🔑 Deposit Shoes & Generate Locker QR Token →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
