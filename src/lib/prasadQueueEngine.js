import { supabase } from './supabaseClient';
import { issueSignedToken } from './signedTokenEngine';
import { sendPilgrimNotification } from './notificationService';

// Default counter status per temple
const DEFAULT_COUNTERS = {
  tmp_somnath: { temple_id: 'tmp_somnath', current_serving_token: 142, avg_serve_time_seconds: 60, updated_at: new Date().toISOString() },
  tmp_dwarka: { temple_id: 'tmp_dwarka', current_serving_token: 98, avg_serve_time_seconds: 45, updated_at: new Date().toISOString() },
  tmp_ambaji: { temple_id: 'tmp_ambaji', current_serving_token: 215, avg_serve_time_seconds: 60, updated_at: new Date().toISOString() },
  tmp_pavagadh: { temple_id: 'tmp_pavagadh', current_serving_token: 64, avg_serve_time_seconds: 50, updated_at: new Date().toISOString() }
};

const getStoredCounter = (templeId) => {
  try {
    const saved = localStorage.getItem(`nirvighna_prasad_counter_${templeId}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_COUNTERS[templeId] || DEFAULT_COUNTERS.tmp_somnath;
};

const setStoredCounter = (templeId, counterObj) => {
  try {
    localStorage.setItem(`nirvighna_prasad_counter_${templeId}`, JSON.stringify(counterObj));
    window.dispatchEvent(new CustomEvent('nirvighna_prasad_counter_updated', { detail: { templeId, counter: counterObj } }));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nirvighna_prasad_sync');
      bc.postMessage({ templeId, counter: counterObj });
      bc.close();
    }
  } catch (e) {}
};

let inMemoryPrasadTokens = {};

export const prasadQueueEngine = {
  // Fetch current counter status
  async fetchCounterStatus(templeId = 'tmp_somnath') {
    return getStoredCounter(templeId);
  },

  // Issue a new signed prasad token
  async issuePrasadToken(bookingId = null, templeId = 'tmp_somnath', pilgrimName = 'Apex Coder') {
    const counter = await this.fetchCounterStatus(templeId);
    
    // Get highest token issued so far
    const storedIssued = localStorage.getItem(`nirvighna_highest_prasad_token_${templeId}`);
    let maxExisting = storedIssued ? parseInt(storedIssued, 10) : (counter.current_serving_token + 6);
    
    if (maxExisting <= counter.current_serving_token) {
      maxExisting = counter.current_serving_token + 6;
    }

    const newTokenNumber = maxExisting + 1;
    localStorage.setItem(`nirvighna_highest_prasad_token_${templeId}`, newTokenNumber.toString());

    // Generate signed token
    let signedTokenValue = `PRASAD-${newTokenNumber}`;
    try {
      const signedRes = await issueSignedToken({
        token_type: 'prasad',
        resource_id: `prs_${newTokenNumber}`,
        temple_id: templeId,
        valid_until: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
      });
      if (signedRes && signedRes.signed_value) {
        signedTokenValue = signedRes.signed_value;
      }
    } catch (err) {
      console.warn('HMAC signing fallback:', err);
    }

    const newTokenObj = {
      id: `prs_t_${Date.now()}`,
      booking_id: bookingId || `b_${Date.now()}`,
      temple_id: templeId,
      pilgrim_name: pilgrimName,
      token_number: newTokenNumber,
      signed_value: signedTokenValue,
      status: 'waiting',
      issued_at: new Date().toISOString()
    };

    if (!inMemoryPrasadTokens[templeId]) {
      inMemoryPrasadTokens[templeId] = [];
    }
    inMemoryPrasadTokens[templeId].push(newTokenObj);

    return newTokenObj;
  },

  // Serve next token and broadcast update
  async serveNextPrasadToken(templeId = 'tmp_somnath') {
    const current = await this.fetchCounterStatus(templeId);
    const nextServingToken = current.current_serving_token + 1;

    const updatedCounter = {
      ...current,
      current_serving_token: nextServingToken,
      updated_at: new Date().toISOString()
    };

    // Store and broadcast
    setStoredCounter(templeId, updatedCounter);

    // Check pilgrim pass notifications
    try {
      const checkAndNotifyPilgrim = (token) => {
        if (!token) return;
        if (token.token_number === nextServingToken) {
          sendPilgrimNotification({
            title: '🍲 Your Mahaprasad Turn is Here!',
            message: `Token #${nextServingToken} is now being served at the Prasad Counter. Please proceed to the serving line with your QR pass.`,
            type: 'prasad_turn',
            templeId: templeId,
            link: '/my-bookings'
          });
        } else if (token.token_number === nextServingToken + 2) {
          sendPilgrimNotification({
            title: '🔔 2 Tokens Remaining for Prasad',
            message: `Currently serving Token #${nextServingToken}. Your Token #${token.token_number} is next up!`,
            type: 'prasad_turn',
            templeId: templeId,
            link: '/my-bookings'
          });
        }
      };

      const savedSingle = localStorage.getItem(`nirvighna_prasad_token_${templeId}`);
      if (savedSingle) {
        const parsed = JSON.parse(savedSingle);
        checkAndNotifyPilgrim(parsed);
        if (parsed.token_number <= nextServingToken && parsed.status !== 'served') {
          parsed.status = 'ready';
          localStorage.setItem(`nirvighna_prasad_token_${templeId}`, JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('nirvighna_prasad_token_ready', { detail: { templeId, token: parsed } }));
        }
      }

      const list = JSON.parse(localStorage.getItem('nirvighna_prasad_tokens_list') || '[]');
      list.forEach(t => {
        if (t.temple_id === templeId) {
          checkAndNotifyPilgrim(t);
        }
      });
    } catch (e) {}

    return updatedCounter;
  },

  // Get live real-time statistics
  getCounterStats(templeId = 'tmp_somnath') {
    const counter = getStoredCounter(templeId);
    const storedHighest = localStorage.getItem(`nirvighna_highest_prasad_token_${templeId}`);
    const currentServing = counter.current_serving_token || (templeId === 'tmp_somnath' ? 142 : 98);
    const highestIssued = storedHighest ? parseInt(storedHighest, 10) : (currentServing + 53);
    return {
      currentServingToken: currentServing,
      issuedToday: highestIssued,
      servedToday: currentServing,
      waitingCount: Math.max(0, highestIssued - currentServing)
    };
  },

  // Get estimated wait time in minutes
  getEstimatedWait(myTokenNumber, currentServingToken, avgServeTimeSeconds = 60) {
    if (!myTokenNumber || myTokenNumber <= currentServingToken) {
      return 0;
    }
    const tokensAhead = myTokenNumber - currentServingToken;
    const totalSeconds = tokensAhead * avgServeTimeSeconds;
    return Math.ceil(totalSeconds / 60);
  }
};
