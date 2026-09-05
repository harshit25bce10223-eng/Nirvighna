/**
 * STEP 6 & STEP 7: Client Integration Module for Nirvighna ML Crowd Prediction Microservice
 * Connects frontend booking engine & crowd dashboards to FastAPI ML Ensemble service (http://localhost:8000/predict)
 * Includes graceful offline fallback & slot availability risk throttling.
 */

import { MASTER_TEMPLES } from './templeRegistry';

const ML_SERVICE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DRISHTI_URL || 'http://localhost:8000') + '/predict';

/**
 * Predicts crowd footfall and risk level using FastAPI ML Ensemble service.
 * @param {string} templeId - Temple ID (e.g. 'tmp_somnath') or name ('Somnath')
 * @param {string} dateStr - Date string 'YYYY-MM-DD'
 * @param {string} timeSlot - Time slot name (e.g. 'Morning 6-9', 'Evening 4-7')
 * @param {number} normalMaxSlots - Standard maximum bookable slots per window (default 100)
 */
export async function predictCrowdML(templeId = 'tmp_somnath', dateStr = new Date().toISOString().split('T')[0], timeSlot = 'Morning 6-9', normalMaxSlots = 100) {
  const shrine = MASTER_TEMPLES.find(t => t.id === templeId || t.name.toLowerCase().includes(templeId.toLowerCase())) || MASTER_TEMPLES[0];
  const templeName = shrine.name.split(' ')[0]; // E.g. 'Somnath', 'Dwarka', 'Ambaji', 'Pavagadh'

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout for fast UI response

    const response = await fetch(ML_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        temple: templeName,
        date: dateStr,
        time_slot: timeSlot
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      
      // STEP 7: Predictions control booking slots
      let max_bookable_slots = normalMaxSlots;
      let is_reduced = false;
      let reduction_notice = null;

      if (data.risk_level === 'HIGH') {
        max_bookable_slots = Math.floor(normalMaxSlots * 0.85);
        is_reduced = true;
        reduction_notice = "This time slot has reduced availability because we're predicting high crowds — this is intentional, for your safety.";
      } else if (data.risk_level === 'CRITICAL') {
        max_bookable_slots = Math.floor(normalMaxSlots * 0.70);
        is_reduced = true;
        reduction_notice = "This time slot has reduced availability because we're predicting high crowds — this is intentional, for your safety.";
      }

      return {
        is_ml_active: true,
        predicted_footfall: data.predicted_footfall,
        risk_level: data.risk_level,
        capacity: data.capacity,
        risk_ratio: data.risk_ratio,
        festival_multiplier: data.festival_multiplier,
        max_bookable_slots,
        is_reduced,
        reduction_notice
      };
    }
  } catch (err) {
    console.warn('ML Prediction Microservice offline/unreachable. Using conservative fallback:', err);
  }

  // STEP 6: Graceful Fallback Engine if ML Service is unreachable
  const fallbackCapacity = shrine.live_capacity_percentage || 50;
  const predicted_footfall = Math.round((fallbackCapacity / 100) * 1200);
  const risk_level = fallbackCapacity > 80 ? 'HIGH' : fallbackCapacity > 60 ? 'MEDIUM' : 'LOW';

  return {
    is_ml_active: false,
    predicted_footfall,
    risk_level,
    capacity: 1200,
    risk_ratio: fallbackCapacity / 100,
    festival_multiplier: 1.0,
    max_bookable_slots: normalMaxSlots,
    is_reduced: false,
    reduction_notice: null
  };
}
