import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { prasadQueueEngine } from '../lib/prasadQueueEngine';
import { supabase } from '../lib/supabaseClient';
import { Utensils, Clock, CheckCircle, AlertCircle, X, Loader2, Sparkles } from 'lucide-react';

export const PrasadQueueModal = ({ templeId = 'tmp_somnath', templeName = 'Somnath Temple', onClose }) => {
  const [counterStatus, setCounterStatus] = useState({ current_serving_token: 142, avg_serve_time_seconds: 60 });
  const [myToken, setMyToken] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    fetchStatus();

    // Check if token exists in localStorage for today
    const saved = localStorage.getItem(`nirvighna_prasad_token_${templeId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMyToken(parsed);
      } catch (e) {}
    }

    // 1. Custom Window Event Listener (Same-Tab sync)
    const handleCounterUpdate = (e) => {
      if (e.detail && (!e.detail.templeId || e.detail.templeId === templeId)) {
        setCounterStatus(e.detail.counter);
      }
    };

    // 2. Token Served Event
    const handleTokenServed = (e) => {
      if (e.detail && e.detail.token) {
        setMyToken(prev => prev && prev.token_number === e.detail.token.token_number ? { ...prev, status: 'served' } : prev);
      }
    };

    // 3. Storage Event Listener (Cross-Tab sync)
    const handleStorage = (e) => {
      if (e.key === `nirvighna_prasad_counter_${templeId}` && e.newValue) {
        try {
          setCounterStatus(JSON.parse(e.newValue));
        } catch (_) {}
      }
      if (e.key === `nirvighna_prasad_token_${templeId}` && e.newValue) {
        try {
          setMyToken(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };

    window.addEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
    window.addEventListener('nirvighna_prasad_token_served', handleTokenServed);
    window.addEventListener('storage', handleStorage);

    // 4. BroadcastChannel Listener (Cross-Tab sync)
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('nirvighna_prasad_sync');
      bc.onmessage = (msg) => {
        if (msg.data && msg.data.counter && (!msg.data.templeId || msg.data.templeId === templeId)) {
          setCounterStatus(msg.data.counter);
        }
      };
    }

    return () => {
      window.removeEventListener('nirvighna_prasad_counter_updated', handleCounterUpdate);
      window.removeEventListener('nirvighna_prasad_token_served', handleTokenServed);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, [templeId]);

  const fetchStatus = async () => {
    const status = await prasadQueueEngine.fetchCounterStatus(templeId);
    setCounterStatus(status);
  };

  const handleGetMyToken = async () => {
    setIssuing(true);
    try {
      const token = await prasadQueueEngine.issuePrasadToken(null, templeId);
      setMyToken(token);
      localStorage.setItem(`nirvighna_prasad_token_${templeId}`, JSON.stringify(token));

      // Trigger instant database notification for the pilgrim portal
      try {
        await supabase.from('notifications').insert({
          type: 'gate_info',
          title: '🍲 Prasad Token Issued!',
          message: `Your Prasad Queue Token #${token.token_number} has been successfully issued for ${templeName}. Average wait time: ~12 minutes.`,
          created_at: new Date().toISOString()
        });
      } catch (notifErr) {
        console.warn('Could not save database notification:', notifErr);
      }
    } catch (e) {
      alert('Could not issue token: ' + e.message);
    } finally {
      setIssuing(false);
    }
  };

  const estimatedWaitMin = myToken
    ? prasadQueueEngine.getEstimatedWait(myToken.token_number, counterStatus.current_serving_token, counterStatus.avg_serve_time_seconds)
    : 0;

  const isNearingTurn = myToken && (myToken.token_number - counterStatus.current_serving_token <= 3) && (myToken.token_number > counterStatus.current_serving_token);
  const isMyTurnServed = myToken && counterStatus.current_serving_token >= myToken.token_number;

  // Progress Bar calculation
  const totalDifference = myToken ? Math.max(1, myToken.token_number - (counterStatus.current_serving_token - 10)) : 1;
  const currentProgress = myToken ? Math.min(100, Math.max(0, ((counterStatus.current_serving_token - (myToken.token_number - 10)) / totalDifference) * 100)) : 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-gold/40 font-body relative overflow-hidden">
        {/* Header */}
        <div className="bg-maroon text-ivory -mx-5 -mt-5 p-5 flex items-center justify-between border-b border-gold/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center font-black text-xl shadow-sm">
              🍲
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white font-heading tracking-wide">
                PAVITRA MAHA PRASAD QUEUE
              </h3>
              <p className="text-xs text-amber-300 font-semibold">{templeName} • Free Annakshetra</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Serving Counter Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-gold/15 to-amber-500/10 p-3.5 rounded-2xl border border-gold/40 flex items-center justify-between text-xs font-bold text-indigo-dark shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Currently Serving:</span>
          </div>
          <span className="text-lg font-black font-mono text-maroon bg-white px-3 py-0.5 rounded-xl border border-gold/50 shadow-2xs">
            Token #{counterStatus.current_serving_token}
          </span>
        </div>

        {/* Nearing Turn Highlight Banner */}
        {isNearingTurn && (
          <div className="bg-gradient-to-r from-amber-600 via-gold to-amber-500 text-indigo-dark p-3.5 rounded-2xl border border-gold shadow-goldGlow animate-bounce text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-dark shrink-0 animate-spin" />
            <div>
              <p className="font-extrabold uppercase tracking-wide">YOUR TURN IS COMING UP!</p>
              <p className="text-[11px] font-semibold text-indigo-dark/90">Please proceed to Annakshetra Counter now.</p>
            </div>
          </div>
        )}

        {/* Turn Active Alert */}
        {isMyTurnServed && myToken?.status !== 'served' && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 rounded-2xl border-2 border-gold shadow-lg text-xs font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="font-extrabold text-gold uppercase tracking-wide">🎉 IT'S YOUR TURN NOW!</p>
              <p className="text-[11px] font-medium text-emerald-100">Show this QR to the Seva Volunteer at Counter #1.</p>
            </div>
          </div>
        )}

        {/* Already Served Alert */}
        {myToken?.status === 'served' && (
          <div className="bg-gradient-to-r from-gold/20 via-amber-500/15 to-gold/20 text-maroon p-3.5 rounded-2xl border-2 border-gold shadow-sm text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gold-dark shrink-0" />
            <div>
              <p className="font-black text-maroon uppercase tracking-wide">✅ PRASAD SERVED & COLLECTED</p>
              <p className="text-[11px] font-semibold text-gray-700">Verified by Seva Volunteer at Counter #1.</p>
            </div>
          </div>
        )}

        {/* TOKEN CARD VIEW OR GET TOKEN BUTTON */}
        {myToken ? (
          <div className="bg-ivory p-5 rounded-3xl border-2 border-gold space-y-3.5 shadow-warm text-center relative overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block font-mono">
              YOUR SIGNED DIGITAL QUEUE TOKEN
            </span>

            {/* Token Number Display */}
            <div className="bg-white py-3 px-6 rounded-2xl border border-gold/40 inline-block shadow-goldGlow">
              <span className="text-4xl font-black font-mono tracking-wider text-indigo-dark">
                #{myToken.token_number}
              </span>
            </div>

            {/* Scannable Signed HMAC QR Code */}
            {qrDataUrl && (
              <div className="bg-white p-2 rounded-2xl border border-gold/30 inline-block mx-auto shadow-sm">
                <img src={qrDataUrl} alt="Signed Prasad Token QR" className="w-28 h-28 mx-auto" />
                <span className="text-[9px] font-mono text-gray-400 font-bold block mt-1">
                  🔒 HMAC-SHA256 Signed QR
                </span>
              </div>
            )}

            {/* Live Progress Bar */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Serving #{counterStatus.current_serving_token}</span>
                <span>Your Token #{myToken.token_number}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden p-0.5 border border-gold/30">
                <div 
                  className="h-full bg-gradient-to-r from-gold via-amber-400 to-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${isMyTurnServed ? 100 : Math.max(10, Math.min(95, 100 - (myToken.token_number - counterStatus.current_serving_token) * 10))}%` }}
                ></div>
              </div>
            </div>

            {/* Estimated Wait Card */}
            <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-4 h-4 text-gold-dark" /> Estimated Wait:
              </span>
              <span className="text-sm font-extrabold text-maroon font-mono">
                {myToken.status === 'served' ? '✅ Completed' : isMyTurnServed ? '0 Mins (Collect Now)' : `${estimatedWaitMin} Mins`}
              </span>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem(`nirvighna_prasad_token_${templeId}`);
                setMyToken(null);
              }}
              className="text-[11px] text-gray-400 hover:text-red-500 font-bold underline"
            >
              Clear Token
            </button>
          </div>
        ) : (
          /* Get My Token Button */
          <div className="text-center space-y-3 pt-2">
            <p className="text-xs text-gray-600 font-medium">
              No long lines! Get your digital virtual token now & proceed to counter when notified.
            </p>
            <button
              onClick={handleGetMyToken}
              disabled={issuing}
              className="w-full py-4 bg-gold hover:bg-gold-dark text-indigo-dark font-black rounded-2xl text-xs uppercase shadow-goldGlow transition-all flex items-center justify-center gap-2 tracking-wide font-heading"
            >
              {issuing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get My Prasad Token →'}
            </button>
          </div>
        )}

        <p className="text-[10px] text-gray-400 text-center font-medium">
          Powered by Nirvighna Live Virtual Queue Engine
        </p>
      </div>
    </div>
  );
};
