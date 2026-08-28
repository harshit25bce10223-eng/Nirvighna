// Nirvighna Temple AI Configuration Engine (temple_ai_config)

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
    prana_nirvighna: {
      enabled: true,
      co2Monitoring: 'Enclosed Garbhagriha (Sanctum)',
      co2BaselinePpm: 550,
      warningPpm: 1200,
      criticalPpm: 2000,
      suffocationRiskActive: true,
    },
    dhwani_rakshak: {
      profileName: 'Seafront Courtyard Baseline',
      rollingWindowSeconds: 30,
      baselineDb: 58,
      deltaTriggerDb: 22,
      persistenceSamples: 3,
      windCompensation: false,
    },
    sanjeevani_path: {
      topologyType: 'Flat Ground Seafront Graph',
      redundantRoutes: 3,
      staffOnlyExits: [
        {
          id: 'EX_SOM_1',
          name: 'Digvijay North Secret Door',
          zone: 'North Holding Ramp / Digvijay Gate',
          hiddenPassageName: 'Ancient Digvijay Seafront Subterranean Conduit',
          ambulanceBay: 'North Helipad Emergency Bay #1',
          lockStatus: 'locked',
          totalDistanceMeters: 460,
          etaMinutes: 7,
          pathWaypoints: [
            { name: 'Garbhagriha / Patient pickup point', segM: 0 },
            { name: 'Sabhamandap North Corridor (behind pillar row C)', segM: 45 },
            { name: 'Triveni Sangam Ghat service road', segM: 110 },
            { name: 'Gita Mandir Chowk (turn left at Hanuman statue)', segM: 130 },
            { name: 'Digvijay Dwar inner ramp (staff lane)', segM: 95 },
            { name: 'Digvijay North Secret Door', segM: 55 },
            { name: 'North Helipad Emergency Bay #1', segM: 25 }
          ]
        },
        {
          id: 'EX_SOM_2',
          name: 'Sea-Wall Promenade Hidden Gate',
          zone: 'Parikrama Sea-Face Walkway',
          hiddenPassageName: 'Sea-Wall Fortification Medical Bypass Way',
          ambulanceBay: 'South Coastal Ambulance Station #2',
          lockStatus: 'locked',
          totalDistanceMeters: 390,
          etaMinutes: 6,
          pathWaypoints: [
            { name: 'Parikrama Sea-Face walkway (patient position)', segM: 0 },
            { name: 'Sea-Wall bastion #4 bypass opening', segM: 90 },
            { name: 'Fortification medical bypass way (flat concrete)', segM: 150 },
            { name: 'Sea-Wall Promenade Hidden Gate', segM: 80 },
            { name: 'South Coastal Ambulance Station #2', segM: 70 }
          ]
        },
        {
          id: 'EX_SOM_3',
          name: 'VIP Sanctum Secret Tunnel',
          zone: 'Inner Sanctum (Garbhagriha)',
          hiddenPassageName: 'Garbhagriha Sub-Level VIP Medical Evacuation Corridor',
          ambulanceBay: 'Main Temple Executive Emergency Bay',
          lockStatus: 'locked',
          totalDistanceMeters: 145,
          etaMinutes: 2,
          pathWaypoints: [
            { name: 'Garbhagriha threshold (patient here)', segM: 0 },
            { name: 'Sub-level VIP descent (8 steps, handrail left)', segM: 30 },
            { name: 'VIP Medical Evacuation Corridor straight stretch', segM: 85 },
            { name: 'Executive Emergency Bay doors', segM: 30 }
          ]
        }
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
      laneCapacity: 350,
      crowdDensityScale: 1.35,
      zoneType: 'Narrow Old-City Lanes + Gomti Ghat',
      modelWeights: 'SHA (ShanghaiTech Dense)',
    },
    prana_nirvighna: {
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
      baselineDb: 62,
      deltaTriggerDb: 20,
      persistenceSamples: 3,
      windCompensation: false,
    },
    sanjeevani_path: {
      topologyType: 'Old-City Narrow Alley Graph',
      redundantRoutes: 2,
      staffOnlyExits: [
        {
          id: 'EX_DWA_1',
          name: 'Moksha Dwar 56-Steps Secret Door',
          zone: 'Moksha Dwar / Swarga Dwar Ramp',
          hiddenPassageName: 'Ancient 56-Steps Subterranean Riverbank Bypass',
          ambulanceBay: 'Gomti Ghat Emergency Medical Pier',
          lockStatus: 'locked',
          totalDistanceMeters: 280,
          etaMinutes: 5,
          pathWaypoints: [
            { name: 'Jagat Mandir sanctum (patient pickup)', segM: 0 },
            { name: 'Moksha Dwar south door (staff unlock)', segM: 40 },
            { name: '56-Steps descent (count 28 for midpoint, hold rail right)', segM: 70 },
            { name: 'Riverbank subterranean bypass entrance', segM: 60 },
            { name: 'Gomti Ghat promenade final stretch', segM: 80 },
            { name: 'Gomti Ghat Emergency Medical Pier', segM: 30 }
          ]
        },
        {
          id: 'EX_DWA_2',
          name: 'Sudama Setu Hidden Rescue Conduit',
          zone: 'Gomti River Crossing / Sudama Setu',
          hiddenPassageName: 'Sudama Setu Emergency Float Ramp',
          ambulanceBay: 'Okha Island Fast-Track Marine Bay',
          lockStatus: 'locked',
          totalDistanceMeters: 620,
          etaMinutes: 9,
          pathWaypoints: [
            { name: 'Gomti Ghat west landing (patient here)', segM: 0 },
            { name: 'Sudama Setu north ramp', segM: 140 },
            { name: 'Setu mid-span (clear pedestrian lane via marshal)', segM: 180 },
            { name: 'South ramp float-ramp entry', segM: 150 },
            { name: 'Hidden rescue conduit lane', segM: 100 },
            { name: 'Okha Island Fast-Track Marine Bay', segM: 50 }
          ]
        },
        {
          id: 'EX_DWA_3',
          name: 'Chhapan Bhog Secret Staff Exit',
          zone: 'Inner Jagat Mandir Sanctum',
          hiddenPassageName: 'Chhapan Bhog Hidden Priests Corridor',
          ambulanceBay: 'North City Gate ICU Mobilizer',
          lockStatus: 'locked',
          totalDistanceMeters: 220,
          etaMinutes: 4,
          pathWaypoints: [
            { name: 'Inner sanctum side niche (patient here)', segM: 0 },
            { name: 'Priests corridor behind Chhapan Bhog prep room', segM: 80 },
            { name: 'Hidden staff stairwell up', segM: 45 },
            { name: 'North City Gate ICU Mobilizer van point', segM: 95 }
          ]
        }
      ]
    }
  },

  tmp_ambaji: {
    templeId: 'tmp_ambaji',
    name: 'Ambaji Temple',
    drishti: {
      profileName: 'Ambaji Dual Profile (Bhadarvi Poonam Surge)',
      activeProfileMode: 'mela_period',
      normalCapacity: 900,
      melaCapacity: 3500,
      highQueueThreshold: 2200,
      crowdDensityScale: 1.8,
      zoneType: 'Chachar Chowk + Outdoor Padyatri Mela Grounds',
      modelWeights: 'SHA (ShanghaiTech Dense)',
    },
    prana_nirvighna: {
      enabled: true,
      co2Monitoring: 'Inner Sanctum Visa Yantra Only',
      co2BaselinePpm: 580,
      warningPpm: 1250,
      criticalPpm: 2100,
      suffocationRiskActive: true,
      outdoorMelaExcluded: true,
    },
    dhwani_rakshak: {
      profileName: 'Mela Loudspeaker & Bhajan Baseline',
      activeProfileMode: 'mela_period',
      normalBaselineDb: 55,
      melaBaselineDb: 74,
      deltaTriggerDb: 25,
      persistenceSamples: 3,
      windCompensation: false,
    },
    sanjeevani_path: {
      topologyType: 'Padyatri Route Checkpoint Graph',
      activeProfileMode: 'mela_period',
      redundantRoutes: 4,
      staffOnlyExits: [
        {
          id: 'EX_AMB_1',
          name: 'Chachar Chowk Secret Evacuation Arch',
          zone: 'Chachar Chowk Main Courtyard',
          hiddenPassageName: 'Ancient Chachar Sub-Level Conduit (Bypasses Padyatri Mela)',
          ambulanceBay: 'West Gate Red Cross Emergency Base',
          lockStatus: 'locked',
          totalDistanceMeters: 360,
          etaMinutes: 6,
          pathWaypoints: [
            { name: 'Chachar Chowk centre flagpole (patient here)', segM: 0 },
            { name: 'West colonnade behind annakshetra stalls', segM: 95 },
            { name: 'Chachar sub-level conduit entry arch', segM: 85 },
            { name: 'Conduit straight run (mela bypass)', segM: 120 },
            { name: 'Secret Evacuation Arch exit', segM: 30 },
            { name: 'West Gate Red Cross Emergency Base', segM: 30 }
          ]
        },
        {
          id: 'EX_AMB_2',
          name: 'Gabbar Cliffside Emergency Shaft',
          zone: 'Gabbar Hill Ascent / Ropeway',
          hiddenPassageName: 'Gabbar Ropeway Station Sub-Shaft Way',
          ambulanceBay: 'Gabbar Foothill Trauma Ambulance Point',
          lockStatus: 'locked',
          totalDistanceMeters: 310,
          etaMinutes: 8,
          pathWaypoints: [
            { name: 'Gabbar hilltop near Kalika shrine (patient here)', segM: 0 },
            { name: 'Ropeway upper station staff gate', segM: 70 },
            { name: 'Sub-shaft descent (stretcher-locked trolley)', segM: 90 },
            { name: 'Cliffside landing platform', segM: 80 },
            { name: 'Foothill trauma point access track', segM: 70 }
          ]
        },
        {
          id: 'EX_AMB_3',
          name: 'Visa Yantra Inner Secret Ramp',
          zone: 'Inner Sanctum (Visa Yantra)',
          hiddenPassageName: 'Sanctuary Priest Bypass Passage',
          ambulanceBay: 'Temple Hospital Critical Access Bay',
          lockStatus: 'locked',
          totalDistanceMeters: 130,
          etaMinutes: 2,
          pathWaypoints: [
            { name: 'Visa Yantra sanctum edge (patient here)', segM: 0 },
            { name: 'Priest bypass passage door (left of yantra chamber)', segM: 45 },
            { name: 'Inner secret ramp down', segM: 55 },
            { name: 'Temple Hospital Critical Access Bay', segM: 30 }
          ]
        }
      ]
    }
  },

  tmp_pavagadh: {
    templeId: 'tmp_pavagadh',
    name: 'Kalika Mata Temple (Pavagadh)',
    drishti: {
      profileName: 'Pavagadh Hilltop Bottleneck Profile',
      courtyardCapacity: 450,
      highQueueThreshold: 280,
      highPriorityAlerting: true,
      crowdDensityScale: 1.5,
      zoneType: 'Narrow Ascending Hilltop Staircase & Cliff Paths',
      modelWeights: 'SHA (ShanghaiTech Dense)',
    },
    prana_nirvighna: {
      enabled: true,
      co2Monitoring: 'Kalika Mata Shrine & Ropeway Cabin Bursts',
      co2BaselinePpm: 600,
      warningPpm: 1100,
      criticalPpm: 1900,
      ropewayCabinBurstMonitoring: true,
      suffocationRiskActive: true,
    },
    dhwani_rakshak: {
      profileName: 'Hilltop Wind Compensation Baseline',
      rollingWindowSeconds: 30,
      baselineDb: 64,
      deltaTriggerDb: 26,
      persistenceSamples: 3,
      windCompensation: true,
    },
    sanjeevani_path: {
      topologyType: 'Hilltop Ascending Staircase Graph',
      pathScarcityWeighted: true,
      redundantRoutes: 1,
      staffOnlyExits: [
        {
          id: 'EX_PAV_1',
          name: 'Machi Plateau Cliffside Secret Egress',
          zone: 'Machi Base & Ropeway Terminal',
          hiddenPassageName: 'Machi Cliffside Paramedic Shaft Corridor',
          ambulanceBay: 'Machi Plateau 108 Ambulance Heli-Pad',
          lockStatus: 'locked',
          totalDistanceMeters: 190,
          etaMinutes: 5,
          pathWaypoints: [
            { name: 'Machi ropeway terminal (patient here)', segM: 0 },
            { name: 'Terminal staff gate (left of ticket booth)', segM: 35 },
            { name: 'Cliffside paramedic shaft corridor', segM: 85 },
            { name: 'Heli-pad clearing final ascent', segM: 70 }
          ]
        },
        {
          id: 'EX_PAV_2',
          name: 'Hilltop 2000-Step Hidden Tunnel Bypass',
          zone: 'Hilltop Stairs / Kalika Mata Peak',
          hiddenPassageName: 'Fort Bastion Subterranean Rescue Shaft',
          ambulanceBay: 'Mid-Mountain Rescue Lift Station',
          lockStatus: 'locked',
          totalDistanceMeters: 420,
          etaMinutes: 10,
          pathWaypoints: [
            { name: 'Kalika Mata peak gate (patient here)', segM: 0 },
            { name: 'Fort bastion #2 rescue shaft entry', segM: 120 },
            { name: 'Subterranean shaft descent (trolley assist)', segM: 160 },
            { name: 'Mid-mountain tunnel junction', segM: 80 },
            { name: 'Rescue Lift Station platform', segM: 60 }
          ]
        }
      ]
    }
  }
};

export const templeAIConfigEngine = {
  getConfig(templeId = 'tmp_somnath', moduleName = 'drishti') {
    const templeConfig = TEMPLE_AI_CONFIGS[templeId] || TEMPLE_AI_CONFIGS.tmp_somnath;
    return {
      templeId,
      templeName: templeConfig.name,
      moduleName,
      config: templeConfig[moduleName] || templeConfig.drishti,
    };
  },

  getSimulatedRFIDCrossCheck(cctvEstimate, templeId = 'tmp_somnath') {
    const variance = Math.round((Math.random() - 0.5) * 8);
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

  calculateCO2SuffocationRisk(occupancyPct, templeId = 'tmp_somnath') {
    const config = this.getConfig(templeId, 'prana_nirvighna').config;
    const basePpm = config.co2BaselinePpm || 550;
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

  evaluateAcousticSpike(currentDb, historyDb = [], templeId = 'tmp_somnath') {
    const config = this.getConfig(templeId, 'dhwani_rakshak').config;
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

  // Sanjeevani Path Evacuation Route Calculator
  calculateMedicalEvacuationPath(alertLocation = 'Queue Gate 2', templeId = 'tmp_somnath') {
    const templeConfig = TEMPLE_AI_CONFIGS[templeId] || TEMPLE_AI_CONFIGS.tmp_somnath;
    const config = templeConfig.sanjeevani_path;
    const staffExits = config.staffOnlyExits || [];

    // Find closest exit matching location
    let targetExit = staffExits[0];
    const locLower = alertLocation.toLowerCase();

    if (locLower.includes('sanctum') || locLower.includes('garbhagriha') || locLower.includes('jagat') || locLower.includes('yantra')) {
      targetExit = staffExits.find(e => e.id.endsWith('_3')) || staffExits[0];
    } else if (locLower.includes('sea') || locLower.includes('parikrama') || locLower.includes('promenade') || locLower.includes('setu') || locLower.includes('ropeway') || locLower.includes('gabbar') || locLower.includes('hilltop') || locLower.includes('peak') || locLower.includes('machi')) {
      targetExit = staffExits.find(e => e.id.endsWith('_2')) || staffExits[0];
    } else if (locLower.includes('inner gate') || locLower.includes('inner-gate')) {
      targetExit = staffExits[staffExits.length - 1] || staffExits[0];
    } else {
      targetExit = staffExits[0];
    }

    // Real waypoint route (falls back to generic steps for legacy configs)
    const waypoints = targetExit.pathWaypoints || [];
    const totalMeters = waypoints.reduce((sum, wp) => sum + (wp.segM || 0), 0) || targetExit.totalDistanceMeters || 140;
    const etaMin = targetExit.etaMinutes || Math.max(2, Math.round(totalMeters / 70));

    let cum = 0;
    const pathSteps = waypoints.length > 0
      ? waypoints.map((wp, i) => {
          cum += wp.segM || 0;
          return `${i + 1}. ${wp.name} — ${cum} m cumulative`;
        })
      : [
          `1. Escort patient from "${alertLocation}" into ${targetExit.hiddenPassageName}`,
          `2. Pass through isolated Staff Medical Corridor (Completely bypassing main devotee queues)`,
          `3. Admin unlocks ${targetExit.name} electronically`,
          `4. Transfer patient directly into ${targetExit.ambulanceBay}`
        ];

    return {
      templeId,
      templeName: templeConfig.name,
      patientLocation: alertLocation,
      destinationExit: targetExit.name,
      destinationExitId: targetExit.id,
      hiddenPassageName: targetExit.hiddenPassageName,
      ambulanceBay: targetExit.ambulanceBay,
      lockStatus: 'unlocked',
      estEvacuationMinutes: `${etaMin} min`,
      distanceMeters: totalMeters,
      pathWaypoints: waypoints,
      pathSteps,
      topologyType: config.topologyType,
      pathScarcityWeighted: config.pathScarcityWeighted || false,
      auditLog: `[SANJEEVANI PATH UNLOCK] Secret Emergency Door "${targetExit.name}" (${targetExit.id}) approved & opened by Command Centre.`
    };
  }
};
