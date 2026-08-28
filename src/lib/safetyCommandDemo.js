const TEMPLE_NAMES = {
  tmp_somnath: 'Somnath Temple',
  tmp_dwarka: 'Dwarkadhish Temple',
  tmp_ambaji: 'Ambaji Temple',
  tmp_pavagadh: 'Kalika Mata Temple'
};

const INCIDENT_KEY = 'nirvighna_active_safety_incident';

function publish(incident) {
  localStorage.setItem(INCIDENT_KEY, JSON.stringify(incident));
  window.dispatchEvent(new CustomEvent('nirvighna_safety_incident_update', { detail: incident }));
}

export const safetyCommandDemo = {
  getActive() {
    try {
      return JSON.parse(localStorage.getItem(INCIDENT_KEY) || 'null');
    } catch (_) {
      return null;
    }
  },

  startSurgeResponse(templeId = 'tmp_somnath') {
    const templeName = TEMPLE_NAMES[templeId] || TEMPLE_NAMES.tmp_somnath;
    const incident = {
      id: `surge_${Date.now()}`,
      templeId,
      templeName,
      status: 'response_active',
      createdAt: new Date().toISOString(),
      sourceGate: 'Gate 1 Main Entry',
      targetGate: 'Gate 2 Priority Plaza',
      beforeDensity: 94,
      targetDensity: 28,
      divertedShare: 45,
      volunteersAssigned: 4,
      predictedWaitSavedMins: 22,
      timeline: [
        { label: 'Surge forecast raised', detail: 'Gate 1 expected to exceed safe operating threshold in 15 min.', state: 'complete' },
        { label: 'Response deployed', detail: 'Gate 2 opened; LED, pilgrim advisory and volunteer dispatch issued.', state: 'complete' },
        { label: 'Outcome verification', detail: 'Awaiting post-reroute density observation.', state: 'active' }
      ]
    };

    const dispatch = {
      id: `dispatch_${Date.now()}`,
      templeId,
      templeName,
      alertType: 'CROWD_REROUTE',
      title: 'Gate 1 surge: reroute activated',
      message: `Move 45% of incoming pilgrims from ${incident.sourceGate} to ${incident.targetGate}. Four field volunteers dispatched.`,
      assignedVolunteer: 'Vikram Sharma & 3 field marshals',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    const pilgrimNotification = {
      id: `reroute_${Date.now()}`,
      type: 'safety_reroute',
      title: `${templeName}: safer entry route available`,
      title_hi: `${templeName}: आसान और सुरक्षित एंट्री रूट उपलब्ध है`,
      title_gu: `${templeName}: સરળ અને સુરક્ષિત એન્ટ્રી રૂટ ઉપલબ્ધ છે`,
      message: `Gate 1 is busy. Please follow the green signage to Gate 2. Estimated wait saved: ${incident.predictedWaitSavedMins} minutes.`,
      message_hi: `गेट 1 पर भीड़ है। कृपया गेट 2 की तरफ जाएं। आपके लगभग ${incident.predictedWaitSavedMins} मिनट बचेंगे।`,
      message_gu: `ગેટ 1 પર ભીડ છે. કૃપા કરીને ગેટ 2 તરફ જાઓ. તમારા આશરે ${incident.predictedWaitSavedMins} મિનિટ બચશે.`,
      created_at: new Date().toISOString(),
      read: false
    };
    const ledCommand = {
      templeId,
      sourceGate: incident.sourceGate,
      targetGate: incident.targetGate,
      message: `GATE 1 BUSY — USE GATE 2 FOR FASTER, SAFER DARSHAN`,
      issuedAt: new Date().toISOString()
    };

    const notifications = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
    localStorage.setItem('nirvighna_notifications', JSON.stringify([pilgrimNotification, ...notifications].slice(0, 50)));
    localStorage.setItem('nirvighna_last_gate_dispatch_alert', JSON.stringify(dispatch));
    localStorage.setItem(`nirvighna_temple_dispatch_${templeId}`, JSON.stringify(dispatch));
    localStorage.setItem('nirvighna_led_command', JSON.stringify(ledCommand));
    window.dispatchEvent(new CustomEvent('nirvighna_temple_alert_dispatch', { detail: dispatch }));
    window.dispatchEvent(new CustomEvent('nirvighna_led_command', { detail: ledCommand }));
    publish(incident);
    return incident;
  },

  verifyOutcome() {
    const active = this.getActive();
    if (!active || active.status !== 'response_active') return active;
    const resolved = {
      ...active,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      afterDensity: 61,
      waitSavedMins: 18,
      timeline: active.timeline.map(item => item.state === 'active'
        ? { ...item, detail: 'Post-reroute observation: Gate 1 reduced from 94% to 61%; safe flow restored.', state: 'complete' }
        : item)
    };
    publish(resolved);
    return resolved;
  },

  reset() {
    localStorage.removeItem(INCIDENT_KEY);
    window.dispatchEvent(new CustomEvent('nirvighna_safety_incident_update', { detail: null }));
  }
};
