/**
 * PRANA KAVACH Engine
 * AI-based Suffocation & Crowd Risk Detection
 *
 * Tracks temperature, humidity, crowd density, and movement
 * to compute a Dynamic Crowd Risk Score for real temple-specific zones.
 */

import { getTempleById } from './templeRegistry';

function jitter(base, range) {
  return +(base + (Math.random() - 0.5) * range * 2).toFixed(1);
}

function computeRiskScore({ temp, humidity, density, movementSpeed }) {
  const tempRisk     = Math.max(0, Math.min(1, (temp - 28) / 14));
  const humidityRisk = Math.max(0, Math.min(1, (humidity - 40) / 45));
  const densityRisk  = Math.max(0, Math.min(1, density));
  const movementRisk = Math.max(0, Math.min(1, 1 - movementSpeed));

  return Math.round(
    tempRisk * 25 + humidityRisk * 25 + densityRisk * 35 + movementRisk * 15
  );
}

function getRiskLevel(score) {
  if (score >= 80) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', badge: 'bg-red-600 text-white' };
  if (score >= 60) return { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500 text-white' };
  if (score >= 40) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', badge: 'bg-amber-500 text-black' };
  return             { label: 'Safe',          color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', badge: 'bg-emerald-500 text-black' };
}

function getDynamicCapacity(staticCapacity, riskScore) {
  if (riskScore >= 80) return Math.round(staticCapacity * 0.40);
  if (riskScore >= 60) return Math.round(staticCapacity * 0.60);
  if (riskScore >= 40) return Math.round(staticCapacity * 0.75);
  return staticCapacity;
}

export const pranaKavachEngine = {
  /**
   * Get live readings for real zones of a specific temple
   */
  getLiveReadings(templeId = 'tmp_somnath') {
    const temple = getTempleById(templeId);
    const zones = temple.zones || [];

    return zones.map(zone => {
      const temp         = jitter(zone.baseTemp, 2.5);
      const humidity     = jitter(zone.baseHumidity, 6);
      const density      = Math.max(0, Math.min(1, jitter(zone.baseDensity, 0.12)));
      const movementSpeed = Math.max(0, Math.min(1, jitter(0.5, 0.25)));
      const riskScore    = computeRiskScore({ temp, humidity, density, movementSpeed });
      const riskLevel    = getRiskLevel(riskScore);
      const staticCap    = 400;
      const dynamicCap   = getDynamicCapacity(staticCap, riskScore);
      const currentCount = Math.round(density * staticCap);
      const exceedsDynamic = currentCount > dynamicCap;

      return {
        id: zone.id,
        label: zone.label,
        templeName: temple.name,
        temp,
        humidity,
        density: Math.round(density * 100),
        movementSpeed: Math.round(movementSpeed * 100),
        riskScore,
        riskLevel,
        staticCapacity: staticCap,
        dynamicCapacity: dynamicCap,
        currentCount,
        exceedsDynamic,
        capacityMode: riskScore >= 40 ? 'dynamic' : 'static',
        alert: exceedsDynamic
          ? `Zone over dynamic safe limit (${currentCount} > ${dynamicCap}). Restrict entry at ${zone.label}.`
          : null,
      };
    });
  },

  getAggregateSummary(readings) {
    if (!readings || readings.length === 0) return { overallScore: 0, criticalZones: 0, dynamicCapacityActive: false };
    const overallScore     = Math.round(readings.reduce((s, r) => s + r.riskScore, 0) / readings.length);
    const criticalZones    = readings.filter(r => r.riskScore >= 60).length;
    const dynamicCapacityActive = readings.some(r => r.capacityMode === 'dynamic');
    return { overallScore, criticalZones, dynamicCapacityActive, riskLevel: getRiskLevel(overallScore) };
  },
};
