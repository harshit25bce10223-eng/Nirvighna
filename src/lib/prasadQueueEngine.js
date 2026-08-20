import { supabase } from './supabaseClient';
import { issueSignedToken } from './signedTokenEngine';

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

    // Update token status in storage
    try {
      const savedPilgrimToken = localStorage.getItem(`nirvighna_prasad_token_${templeId}`);
      if (savedPilgrimToken) {
        const parsed = JSON.parse(savedPilgrimToken);
        if (parsed.token_number <= nextServingToken) {
          parsed.status = 'served';
          localStorage.setItem(`nirvighna_prasad_token_${templeId}`, JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('nirvighna_prasad_token_served', { detail: { templeId, token: parsed } }));
        }
      }
    } catch (e) {}

    return updatedCounter;
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
