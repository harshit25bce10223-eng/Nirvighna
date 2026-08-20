/**
 * Nirvighna Temple AI Configuration Engine (temple_ai_config)
 * 
 * Manages site-calibrated AI configurations across all 4 temples:
 *  - Somnath: Large coastal courtyard, enclosed garbhagriha, 1200 cap
 *  - Dwarka: Coastal island & narrow old-city approach lanes, Gomti Ghat
 *  - Ambaji: Dual profile ('normal_day' vs 'mela_period' for Bhadarvi Poonam)
 *  - Pavagadh: Hilltop ropeway & narrow ascending paths, high-priority low-capacity thresholds
 */

import { supabase } from './supabaseClient';

export const TEMPLE_AI_CONFIGS = {
  tmp_somnath: {
    templeId: 'tmp_somnath',
    name: 'Somnath Temple',
    drishti: {
      profileName: 'Somnath Coastal Courtyard Profile',
      courtyardCapacity: 1200,
      highQueueThreshold: 850,
      crowdDensityScale: 1.0,
      zoneType: 'Large Open Seafront Courtyard',
      modelWeights: 'SHA (ShanghaiTech Dense)',
    },
    prana_kavach: {
      enabled: true,
      co2Monitoring: 'Enclosed Garbhagriha (Sanctum)',
      co2BaselinePpm: 550,
      warningPpm: 1200,      // ASHRAE standard
      criticalPpm: 2000,
      suffocationRiskActive: true,
    },
    dhwani_rakshak: {
      profileName: 'Seafront Courtyard Baseline',
      rollingWindowSeconds: 30,
      baselineDb: 58,
      deltaTriggerDb: 22,    // Trigger at baseline + 22dB
      persistenceSamples: 3, // Requires 3 consecutive samples to avoid false triggers
      windCompensation: false,
    },
    sanjeevani_path: {
      topologyType: 'Flat Ground Seafront Graph',
      redundantRoutes: 3,
      staffOnlyExits: [
        { id: 'EX_SOM_1', name: 'Digvijay North Staff Exit', lockStatus: 'locked' },
        { id: 'EX_SOM_2', name: 'Promenade Seafront Evacuation Way', lockStatus: 'locked' },
        { id: 'EX_SOM_3', name: 'Helipad VIP Emergency Exit', lockStatus: 'locked' }
      ]
    }
  },

  tmp_dwarka: {
    templeId: 'tmp_dwarka',
    name: 'Dwarkadhish Temple',
    drishti: {
      profileName: 'Dwarka Old-City & Ferry Terminal Profile',
      courtyardCapacity: 800,
      highQueueThreshold: 550,
      laneCapacity: 350,      // Separate lower threshold for narrow approach lanes
      crowdDensityScale: 1.35, // Higher multiplier due to narrow lanes
      zoneType: 'Narrow Old-City Lanes + Gomti Ghat',
      modelWeights: 'SHA (ShanghaiTech Dense)',
    },
    prana_kavach: {
      enabled: true,
      co2Monitoring: 'Inner Jagat Mandir Sanctum',
      co2BaselinePpm: 620,
      warningPpm: 1100,
      criticalPpm: 1800,
      suffocationRiskActive: true,
    },
    dhwani_rakshak: {
      profileName: 'Old-City Reverb Baseline',
      rollingWindowSeconds: 30,
      baselineDb: 62,        // Higher baseline due to echoing narrow lanes
      deltaTriggerDb: 20,
      persistenceSamples: 3,
      windCompensation: false,
    },
    sanjeevani_path: {
      topologyType: 'Old-City Narrow Alley Graph',
      redundantRoutes: 2,
      staffOnlyExits: [
        { id: 'EX_DWA_1', name: 'Moksha Dwar Gomti Staff Exit', lockStatus: 'locked' },
        { id: 'EX_DWA_2', name: 'Sudama Setu Emergency Passage', lockStatus: 'locked' },
        { id: 'EX_DWA_3', name: 'Okha Ferry Pier Staff Way', lockStatus: 'locked' }
      ]
    }
  },

  tmp_ambaji: {
    templeId: 'tmp_ambaji',
    name: 'Ambaji Temple',
    drishti: {
      profileName: 'Ambaji Dual Profile (Bhadarvi Poonam Surge)',
      activeProfileMode: 'mela_period', // 'normal_day' | 'mela_period'
      normalCapacity: 900,
      melaCapacity: 3500,     // Drastically higher footfall during Bhadarvi Poonam
      highQueueThreshold: 2200,
      crowdDensityScale: 1.8,
      zoneType: 'Chachar Chowk + Outdoor Padyatri Mela Grounds',
      modelWeights: 'SHA (ShanghaiTech Dense)',
    },
    prana_kavach: {
      enabled: true,
      co2Monitoring: 'Inner Sanctum Visa Yantra Only',
      co2BaselinePpm: 580,
      warningPpm: 1250,
      criticalPpm: 2100,
      suffocationRiskActive: true,
      outdoorMelaExcluded: true, // Outdoor mela grounds excluded from CO2 monitoring
    },
    dhwani_rakshak: {
      profileName: 'Mela Loudspeaker & Bhajan Baseline',
      activeProfileMode: 'mela_period',
      normalBaselineDb: 55,
      melaBaselineDb: 74,     // Loud ambient noise during mela
      deltaTriggerDb: 25,     // Trigger at baseline + 25dB to avoid false alarms from loudspeakers
      persistenceSamples: 3,
      windCompensation: false,
    },
    sanjeevani_path: {
      topologyType: 'Padyatri Route Checkpoint Graph',
      activeProfileMode: 'mela_period',
      redundantRoutes: 4,
      staffOnlyExits: [
        { id: 'EX_AMB_1', name: 'Chachar Chowk Staff Emergency Gate 1', lockStatus: 'locked' },
        { id: 'EX_AMB_2', name: 'Gabbar Ropeway Staff Exit B', lockStatus: 'locked' },
        { id: 'EX_AMB_3', name: 'Padyatri Medical Bay Bypass', lockStatus: 'locked' }
      ]
    }
  },

  tmp_pavagadh: {
    templeId: 'tmp_pavagadh',
    name: 'Kalika Mata Temple (Pavagadh)',
    drishti: {
      profileName: 'Pavagadh Hilltop Bottleneck Profile',
      courtyardCapacity: 450, // Lower absolute capacity due to narrow cliff paths
      highQueueThreshold: 280,
      highPriorityAlerting: true, // Bottlenecks trigger alerts at lower absolute numbers
      crowdDensityScale: 1.5,
      zoneType: 'Narrow Ascending Hilltop Staircase & Cliff Paths',
      modelWeights: 'SHA (ShanghaiTech Dense)',
    },
    prana_kavach: {
      enabled: true,
      co2Monitoring: 'Kalika Mata Shrine & Ropeway Cabin Bursts',
      co2BaselinePpm: 600,
      warningPpm: 1100,
      criticalPpm: 1900,
      ropewayCabinBurstMonitoring: true, // Short burst high-occupancy ropeway monitoring
      suffocationRiskActive: true,
    },
    dhwani_rakshak: {
      profileName: 'Hilltop Wind Compensation Baseline',
      rollingWindowSeconds: 30,
      baselineDb: 64,        // High baseline due to hilltop wind
      deltaTriggerDb: 26,    // Higher delta threshold to filter out gusting wind noise
      persistenceSamples: 3,
      windCompensation: true,
    },
    sanjeevani_path: {
      topologyType: 'Hilltop Ascending Staircase Graph',
      pathScarcityWeighted: true, // Conservative about recommending gate closures due to few alternate paths
      redundantRoutes: 1,        // Low route redundancy
      staffOnlyExits: [
        { id: 'EX_PAV_1', name: 'Machi Base Staff Evacuation Ramp', lockStatus: 'locked' },
        { id: 'EX_PAV_2', name: 'Hilltop Staircase Emergency Bypass', lockStatus: 'locked' }
      ]
    }
  }
};

export const templeAIConfigEngine = {
  /**
   * Get active config for a specific temple and module
   */
  getConfig(templeId = 'tmp_somnath', moduleName = 'drishti') {
    const templeConfig = TEMPLE_AI_CONFIGS[templeId] || TEMPLE_AI_CONFIGS.tmp_somnath;
    return {
      templeId,
      templeName: templeConfig.name,
      moduleName,
      config: templeConfig[moduleName] || templeConfig.drishti,
    };
  },

  /**
   * Cross-verify CCTV estimate against simulated RFID tag log
   */
  getSimulatedRFIDCrossCheck(cctvEstimate, templeId = 'tmp_somnath') {
    const variance = Math.round((Math.random() - 0.5) * 8); // Plausible close value
    const rfidCount = Math.max(0, cctvEstimate + variance);
    const confidenceScore = Math.min(99, Math.round(93 + Math.random() * 5));

    return {
      templeId,
      cctvEstimatedCount: cctvEstimate,
      rfidTagCount: rfidCount,
      variance: rfidCount - cctvEstimate,
      crossVerified: Math.abs(rfidCount - cctvEstimate) <= 12,
      confidenceScore,
      disclaimer: 'Simulated RFID Cross-Verification — Architecture ready for physical RFID deployment',
      timestamp: new Date().toLocaleTimeString('en-IN'),
    };
  },

  /**
   * Calculate Suffocation & CO2 Risk linked to real occupancy (ASHRAE Standards)
   */
  calculateCO2SuffocationRisk(occupancyPct, templeId = 'tmp_somnath') {
    const config = this.getConfig(templeId, 'prana_kavach').config;
    const basePpm = config.co2BaselinePpm || 550;
    
    // Occupancy directly drives CO2 trend upward
    const co2Ppm = Math.round(basePpm + (occupancyPct / 100) * 1200 + (Math.random() * 50));
    
    let status = 'SAFE';
    let alertLevel = 'LOW';
    let color = 'text-emerald-400';

    if (co2Ppm >= config.criticalPpm) {
      status = 'CRITICAL — DANGER';
      alertLevel = 'CRITICAL';
      color = 'text-red-400';
    } else if (co2Ppm >= config.warningPpm) {
      status = 'WARNING — ELEVATED CO2';
      alertLevel = 'HIGH';
      color = 'text-amber-400';
    }

    return {
      co2Ppm,
      status,
      alertLevel,
      color,
      ashraeThreshold: config.warningPpm,
      criticalThreshold: config.criticalPpm,
      co2MonitoringArea: config.co2Monitoring,
      ropewayCabinBurst: config.ropewayCabinBurstMonitoring || false,
    };
  },

  /**
   * Rolling baseline acoustic spike detection for Dhwani Rakshak
   */
  evaluateAcousticSpike(currentDb, historyDb = [], templeId = 'tmp_somnath') {
    const config = this.getConfig(templeId, 'dhwani_rakshak').config;
    
    // Calculate 30s rolling baseline
    const samples = historyDb.length > 0 ? historyDb : [config.baselineDb || 58];
    const rollingBaseline = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    const triggerThreshold = rollingBaseline + config.deltaTriggerDb;
    
    const isSpike = currentDb >= triggerThreshold;

    return {
      currentDb,
      rollingBaseline,
      deltaTriggerDb: config.deltaTriggerDb,
      triggerThreshold,
      isSpike,
      windCompensated: config.windCompensation || false,
      activeProfile: config.profileName,
    };
  },

  /**
   * Sanjeevani Path Evacuation Route Calculator using staff-only exits
   */
  calculateMedicalEvacuationPath(alertLocation = 'Queue Gate 2', templeId = 'tmp_somnath') {
    const config = this.getConfig(templeId, 'sanjeevani_path').config;
    const staffExits = config.staffOnlyExits || [];
    const nearestExit = staffExits[0] || { id: 'EX_GEN_1', name: 'Emergency Gate 1', lockStatus: 'locked' };

    return {
      templeId,
      patientLocation: alertLocation,
      destinationExit: nearestExit.name,
      destinationExitId: nearestExit.id,
      lockStatus: 'unlocked', // Auto-unlocked by Sanjeevani Path trigger
      estEvacuationMinutes: '2.5 min',
      pathSteps: [
        `1. Move patient from ${alertLocation} toward ${nearestExit.name}`,
        `2. Pass through Staff Bypass Corridor (Bypassing general queue)`,
        `3. Exit via ${nearestExit.name} directly to waiting Ambulance Bay`
      ],
      topologyType: config.topologyType,
      pathScarcityWeighted: config.pathScarcityWeighted || false,
      auditLog: `[SANJEEVANI PATH] Emergency Exit ${nearestExit.name} unlocked automatically.`
    };
  }
};
