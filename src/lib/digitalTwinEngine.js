import { supabase } from './supabaseClient';

/**
 * Pre-Entry Digital Twin Simulation Engine
 */
export const digitalTwinEngine = {
  /**
   * Run simulation model
   */
  async runDigitalTwinSimulation(templeId, expectedFootfall, gatesOpenCount, eventDate) {
    try {
      const perGateLoad = Math.round(expectedFootfall / gatesOpenCount);
      
      // Calibrated throughput rate per gate (baseline: 220 pilgrims/hour/gate)
      const templeBaseRates = {
        tmp_somnath: 240,
        tmp_dwarka: 220,
        tmp_ambaji: 260,
        tmp_pavagadh: 200
      };
      const throughputRate = templeBaseRates[templeId] || 220;

      // Calculate estimated entry duration (in hours)
      const estimatedEntryDurationHours = parseFloat((perGateLoad / throughputRate).toFixed(1));

      // Fetch bottleneck zones
      const bottleneckZones = [];
      if (estimatedEntryDurationHours > 4) {
        bottleneckZones.push({ name: 'Temple Outer Plaza Barricade', load: 'Critical', delay: '45 mins' });
        bottleneckZones.push({ name: 'Security Baggage Scanner', load: 'High', delay: '30 mins' });
      } else if (estimatedEntryDurationHours > 2) {
        bottleneckZones.push({ name: 'Temple Outer Plaza Barricade', load: 'High', delay: '15 mins' });
      }

      // Calculate additional gates recommended to bring wait time under 2 hours
      const thresholdHours = 2.0;
      let additionalGates = 0;
      let recommendation = 'Entry flow operates within safe time thresholds. Current gate capacity is sufficient.';

      if (estimatedEntryDurationHours > thresholdHours) {
        const requiredGates = Math.ceil(expectedFootfall / (thresholdHours * throughputRate));
        additionalGates = Math.max(0, requiredGates - gatesOpenCount);
        const newDuration = parseFloat((perGateLoad / throughputRate / (1 + additionalGates / gatesOpenCount)).toFixed(1));
        
        if (additionalGates > 0) {
          recommendation = `⚠️ Estimated entry wait is ${estimatedEntryDurationHours} hours with ${gatesOpenCount} gates (each gate handling ${perGateLoad} pilgrims at ${throughputRate}/hr throughput). Opening ${additionalGates} additional gate(s) (total ${gatesOpenCount + additionalGates}) would bring wait time down to ~${Math.min(newDuration, thresholdHours)} hours. Recommend pre-positioning ${Math.ceil(additionalGates * 3)} extra volunteers at overflow gates.`;
        }
      }

      return {
        success: true,
        perGateLoad,
        throughputRate,
        estimatedEntryDurationHours,
        bottleneckZones,
        additionalGates,
        recommendation
      };

    } catch (err) {
      console.error('Digital Twin simulation execution failed:', err);
      return {
        success: false,
        error: 'Simulation failed'
      };
    }
  }
};
