/**
 * demoSeedEngine.js — Nirvighna Demo Mode
 * =========================================
 * ONE demo temple: Dwarkadhish Temple, Dwarka.
 *
 * Covers every pilgrim + volunteer touchpoint:
 *   • Darshan Gate QR Pass (Priority/Wheelchair) → QR: NIRV-DEMO-DWA-QR
 *   • Boat Crossing Pass (Bet Dwarka)             → QR: BOAT-DEMO-DWA-2024
 *   • Prasad Counter Token                        → Token: PRASAD-DEMO-DWA
 *   • Footwear Locker Token                       → Token: FOOTWEAR-DEMO-DWA
 *   • Audio Navigation Pass                       → Token: AUDIO-DEMO-DWA
 *
 * Group of 4 with wheelchair/priority member. Works 100% offline.
 */

// ─── Demo Credentials ─────────────────────────────────────────────────────────

export const DEMO_CREDENTIALS = {
  pilgrim:   { email: 'demo@nirvighna.org',     password: 'Demo@1234' },
  volunteer: { email: 'demo.vol@nirvighna.org', password: 'Demo@1234' },
};

// ─── Demo QR / Token Values ───────────────────────────────────────────────────

export const DEMO_QR_GATE      = 'NIRV-DEMO-DWA-QR';
export const DEMO_QR_BOAT      = 'BOAT-DEMO-DWA-2024';
export const DEMO_TOKEN_PRASAD = 'PRASAD-DEMO-DWA';
export const DEMO_TOKEN_SHOE   = 'FOOTWEAR-DEMO-DWA';
export const DEMO_TOKEN_AUDIO  = 'AUDIO-DEMO-DWA';
export const DEMO_BOOKING_CODE = 'NIRV-DEMO-DWA';

// ─── Demo Family Group (4 members, 1 wheelchair) ─────────────────────────────

export const DEMO_FAMILY = [
  { name: 'Arjun Mehta',    age: 28, relation: 'Self',        is_lead: true,  is_priority: false, needs_wheelchair: false },
  { name: 'Priya Mehta',    age: 25, relation: 'Spouse',      is_lead: false, is_priority: false, needs_wheelchair: false },
  { name: 'Kamla Mehta',    age: 62, relation: 'Mother',      is_lead: false, is_priority: true,  needs_wheelchair: true  },
  { name: 'Rohan Mehta',    age: 9,  relation: 'Son',         is_lead: false, is_priority: false, needs_wheelchair: false },
];

// ─── Demo Profiles ────────────────────────────────────────────────────────────

export const DEMO_PILGRIM = {
  id:                  'demo_pilgrim_001',
  email:               'demo@nirvighna.org',
  full_name:           'Arjun Mehta (Demo)',
  phone:               '+91 99999 00000',
  role:                'pilgrim',
  language_preference: 'hi',
  is_priority:         true,   // group has a wheelchair member
  is_demo:             true,
};

export const DEMO_VOLUNTEER = {
  id:            'vol_demo_001',
  email:         'demo.vol@nirvighna.org',
  full_name:     'Vikram Demo (Dwarka Field Hub)',
  phone:         '+91 99999 11111',
  role:          'volunteer',
  zone_assigned: 'Dwarkadhish Temple – Gate 1 Swarga Dwar',
  temple_id:     'tmp_dwarka',
  is_demo:       true,
};

// ─── Pilgrim Demo Seed ────────────────────────────────────────────────────────

export const seedDemoPilgrim = () => {
  const today = new Date().toISOString().split('T')[0];

  // ── 1. Dwarkadhish Darshan Booking (Gate QR) — Priority/Wheelchair ─────────
  const darshanBooking = {
    id:                  'demo_booking_darshan',
    shared_booking_code: DEMO_BOOKING_CODE,
    pilgrim_id:          DEMO_PILGRIM.id,
    pilgrim_phone:       DEMO_PILGRIM.phone,
    slot_date:           today,
    start_time:          '09:00 AM',
    end_time:            '11:00 AM',
    gate_number:         2,
    is_priority:         true,   // ♿ Priority ramp gate
    status:              'confirmed',
    booking_type:        'darshan',
    special_assistance:  {
      wheelchair:  true,
      audio_guide: true,
      member:      'Kamla Mehta (Mother, 62)',
      note:        'Priority ramp entry via Gate 2 – Moksha Dwar',
    },
    temples: {
      id:   'tmp_dwarka',
      name: 'Dwarkadhish Temple, Dwarka',
    },
    darshan_slots: {
      slot_date:  today,
      start_time: '09:00 AM',
      end_time:   '11:00 AM',
    },
    family_members: DEMO_FAMILY,
    qr_passes: [
      {
        id:            'demo_gate_pass_001',
        pilgrim_name:  'Arjun Mehta (Demo) + Family',
        gate_number:   'Gate 2 – Moksha Dwar (♿ Priority Ramp)',
        is_priority:   true,
        qr_value:      DEMO_QR_GATE,
        temple_name:   'Dwarkadhish Temple, Dwarka',
        slot_date:     today,
        slot_time:     '09:00 AM – 11:00 AM',
        booking_code:  DEMO_BOOKING_CODE,
        issued_at:     new Date().toISOString(),
        member_count:  4,
        is_boat_pass:  false,
      },
    ],
    created_at: new Date().toISOString(),
  };

  // ── 2. Bet Dwarka Boat Crossing (3 adults + 1 child) ──────────────────────
  const boatBooking = {
    id:                  'demo_booking_boat',
    shared_booking_code: DEMO_QR_BOAT,
    pilgrim_id:          DEMO_PILGRIM.id,
    pilgrim_phone:       DEMO_PILGRIM.phone,
    slot_date:           today,
    start_time:          '11:30 AM',
    end_time:            '12:15 PM',
    gate_number:         2,
    is_priority:         true,
    status:              'confirmed',
    booking_type:        'boat_crossing',
    temples: {
      id:   'tmp_dwarka',
      name: 'Dwarkadhish Temple, Dwarka',
    },
    darshan_slots: {
      slot_date:  today,
      start_time: '11:30 AM',
      end_time:   '12:15 PM',
    },
    boat_crossing: {
      crossing_id:     'bc_dwa_demo',
      departure_time:  '11:30 AM',
      jetty:           'Okha Jetty → Bet Dwarka Island',
      passenger_count: 4,
      tide_level:      'ideal',
      vessel_name:     'Sudarshan Ferry',
      qr_token:        DEMO_QR_BOAT,
      wheelchair_deck: true,
      note:            '♿ Wheelchair accessible lower deck reserved',
    },
    family_members: DEMO_FAMILY,
    qr_passes: [
      {
        id:            'demo_boat_pass_001',
        pilgrim_name:  'Arjun Mehta (Demo) + 3',
        gate_number:   '⛵ Okha Jetty – Boarding Gate (♿ Lower Deck)',
        is_priority:   true,
        qr_value:      DEMO_QR_BOAT,
        temple_name:   'Dwarkadhish Temple, Dwarka',
        slot_date:     today,
        slot_time:     '11:30 AM Departure → Bet Dwarka (4 Passengers)',
        booking_code:  DEMO_QR_BOAT,
        issued_at:     new Date().toISOString(),
        member_count:  4,
        is_boat_pass:  true,
        vessel:        'Sudarshan Ferry (♿ Accessible)',
      },
    ],
    created_at: new Date().toISOString(),
  };

  // ── 3. Audio Navigation Pass ───────────────────────────────────────────────
  const audioBooking = {
    id:                  'demo_booking_audio',
    shared_booking_code: DEMO_TOKEN_AUDIO,
    pilgrim_id:          DEMO_PILGRIM.id,
    pilgrim_phone:       DEMO_PILGRIM.phone,
    slot_date:           today,
    status:              'confirmed',
    booking_type:        'audio_nav',
    temples: {
      id:   'tmp_dwarka',
      name: 'Dwarkadhish Temple, Dwarka',
    },
    audio_nav: {
      language:    'Hindi',
      route:       'Swarga Dwar → Garbhagriha → Bet Dwarka Jetty',
      device:      'Device #A-07',
      token_qr:    DEMO_TOKEN_AUDIO,
      waypoints:   [
        '🔊 Gate 1 Swarga Dwar — Entry & Security Check',
        '🔊 Sabha Mandap — Main Congregation Hall',
        '🔊 Garbhagriha — Dwarkadhish Sanctum (Darshan Queue)',
        '🔊 Gomti Ghat — Riverside Aarti Point',
        '🔊 Okha Jetty — Boat Boarding for Bet Dwarka',
        '🔊 Bet Dwarka — Dwarkadhish Nij Mandir Darshan',
      ],
    },
    qr_passes: [
      {
        id:            'demo_audio_pass_001',
        pilgrim_name:  'Arjun Mehta (Demo)',
        gate_number:   '🔊 Audio Nav Device #A-07',
        is_priority:   false,
        qr_value:      DEMO_TOKEN_AUDIO,
        temple_name:   'Dwarkadhish Temple, Dwarka',
        slot_date:     today,
        slot_time:     'Hindi • 6-Waypoint Guided Route',
        booking_code:  DEMO_TOKEN_AUDIO,
        issued_at:     new Date().toISOString(),
        is_audio:      true,
      },
    ],
    created_at: new Date().toISOString(),
  };

  // ── 4. Prasad Counter Token ───────────────────────────────────────────────
  const prasadBooking = {
    id:                  'demo_booking_prasad',
    shared_booking_code: DEMO_TOKEN_PRASAD,
    pilgrim_id:          DEMO_PILGRIM.id,
    pilgrim_phone:       DEMO_PILGRIM.phone,
    slot_date:           today,
    status:              'confirmed',
    booking_type:        'prasad',
    temples: {
      id:   'tmp_dwarka',
      name: 'Dwarkadhish Temple, Dwarka',
    },
    prasad_counter: {
      token_number: 'P-047',
      counter:      'Counter #2 – North Wing',
      items:        ['Panchamrit', 'Mathura Peda', 'Tulsi Mala', 'Charnamrit'],
      quantity:     4,
      token_qr:     DEMO_TOKEN_PRASAD,
    },
    qr_passes: [
      {
        id:            'demo_prasad_pass_001',
        pilgrim_name:  'Arjun Mehta (Demo) – 4 Members',
        gate_number:   'Counter #2 – Mahaprasad Desk',
        is_priority:   false,
        qr_value:      DEMO_TOKEN_PRASAD,
        temple_name:   'Dwarkadhish Temple, Dwarka',
        slot_date:     today,
        slot_time:     'Token #P-047 • Walk-in',
        booking_code:  DEMO_TOKEN_PRASAD,
        issued_at:     new Date().toISOString(),
        is_prasad:     true,
      },
    ],
    created_at: new Date().toISOString(),
  };

  // ── 5. Footwear Locker Token ───────────────────────────────────────────────
  const footwearBooking = {
    id:                  'demo_booking_footwear',
    shared_booking_code: DEMO_TOKEN_SHOE,
    pilgrim_id:          DEMO_PILGRIM.id,
    pilgrim_phone:       DEMO_PILGRIM.phone,
    slot_date:           today,
    status:              'confirmed',
    booking_type:        'footwear',
    temples: {
      id:   'tmp_dwarka',
      name: 'Dwarkadhish Temple, Dwarka',
    },
    footwear_locker: {
      locker_number: 'B-112',
      rack:          'Rack B – East Entrance Stand',
      pairs:         4,
      token_qr:      DEMO_TOKEN_SHOE,
      note:          '4 pairs • Collect token on exit',
    },
    qr_passes: [
      {
        id:            'demo_shoe_pass_001',
        pilgrim_name:  'Arjun Mehta (Demo) – 4 Pairs',
        gate_number:   'Rack B – East Footwear Stand',
        is_priority:   false,
        qr_value:      DEMO_TOKEN_SHOE,
        temple_name:   'Dwarkadhish Temple, Dwarka',
        slot_date:     today,
        slot_time:     'Locker #B-112 • 4 Pairs • Collect on exit',
        booking_code:  DEMO_TOKEN_SHOE,
        issued_at:     new Date().toISOString(),
        is_footwear:   true,
      },
    ],
    created_at: new Date().toISOString(),
  };

  // ── Write session ──
  localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(DEMO_PILGRIM));

  // ── Merge bookings (preserve real bookings, demo ones first) ──
  const DEMO_IDS = [
    'demo_booking_darshan', 'demo_booking_boat',
    'demo_booking_audio',   'demo_booking_prasad', 'demo_booking_footwear',
  ];
  let existing = [];
  try { existing = JSON.parse(localStorage.getItem('nirvighna_my_local_bookings') || '[]'); } catch (_) {}
  existing = existing.filter(b => !DEMO_IDS.includes(b.id));
  existing.unshift(footwearBooking, prasadBooking, audioBooking, boatBooking, darshanBooking);
  localStorage.setItem('nirvighna_my_local_bookings', JSON.stringify(existing));

  // ── Seed boat booking so scanBoatQR resolves demo token ──
  try {
    const boatEntries = [{
      id:              'boat_demo_001',
      booking_id:      'demo_booking_boat',
      crossing_id:     'bc_dwa_demo',
      pilgrim_id:      DEMO_PILGRIM.id,
      departure_time:  '11:30 AM',
      passenger_count: 4,
      pilgrim_name:    'Arjun Mehta (Demo)',
      pilgrim_phone:   DEMO_PILGRIM.phone,
      qr_token:        DEMO_QR_BOAT,
      status:          'booked',
      created_at:      new Date().toISOString(),
    }];
    localStorage.setItem('nirvighna_demo_boat_bookings', JSON.stringify(boatEntries));
  } catch (_) {}

  // ── Family members cache ──
  try {
    localStorage.setItem('nirvighna_family_members', JSON.stringify(
      DEMO_FAMILY.map((m, i) => ({ ...m, id: `demo_member_${i + 1}`, user_id: DEMO_PILGRIM.id }))
    ));
  } catch (_) {}

  sessionStorage.setItem('nirvighna_demo_mode',   'true');
  sessionStorage.setItem('nirvighna_demo_temple', 'tmp_dwarka');
};

// ─── Volunteer Demo Seed ──────────────────────────────────────────────────────

export const seedDemoVolunteer = () => {
  localStorage.setItem('nirvighna_volunteer_session', JSON.stringify(DEMO_VOLUNTEER));
  sessionStorage.setItem('nirvighna_demo_mode',   'true');
  sessionStorage.setItem('nirvighna_demo_temple', 'tmp_dwarka');
};

// ─── QR / Token Check Helpers ─────────────────────────────────────────────────

/** Returns true if the scanned value is any known Dwarka demo pass/token */
export const isDemoQR = (qrValue) => {
  if (!qrValue) return false;
  const v = qrValue.trim().toUpperCase();
  return [
    DEMO_QR_GATE.toUpperCase(),
    DEMO_QR_BOAT.toUpperCase(),
    DEMO_TOKEN_PRASAD.toUpperCase(),
    DEMO_TOKEN_SHOE.toUpperCase(),
    DEMO_TOKEN_AUDIO.toUpperCase(),
    DEMO_BOOKING_CODE.toUpperCase(),
  ].includes(v);
};

/** Returns a pre-built volunteer scan success result for any demo QR */
export const getDemoScanResult = (qrValue = '') => {
  const today = new Date().toISOString().split('T')[0];
  const v = qrValue.trim().toUpperCase();

  if (v.startsWith('BOAT-DEMO')) {
    return {
      success: true, already_scanned: false,
      qr_pass_id:  'demo_boat_pass_001',
      holder_name: 'Arjun Mehta (Demo) + 3',
      gate_number: '⛵ Okha Jetty – Boarding Gate (♿ Lower Deck)',
      is_priority: true,
      temple_name: 'Dwarkadhish Temple, Dwarka',
      slot_date:   today,
      slot_time:   '11:30 AM Departure → Bet Dwarka (4 Passengers)',
      is_demo: true, is_boat_pass: true,
      vessel: 'Sudarshan Ferry (♿ Accessible)',
    };
  }

  if (v.startsWith('PRASAD-DEMO')) {
    return {
      success: true, already_scanned: false,
      qr_pass_id:  'demo_prasad_pass_001',
      holder_name: 'Arjun Mehta (Demo) – 4 Members',
      gate_number: 'Counter #2 – Mahaprasad Desk',
      is_priority: false,
      temple_name: 'Dwarkadhish Temple, Dwarka',
      slot_date:   today,
      slot_time:   'Token #P-047 • Walk-in',
      is_demo: true, is_prasad: true,
    };
  }

  if (v.startsWith('FOOTWEAR-DEMO')) {
    return {
      success: true, already_scanned: false,
      qr_pass_id:  'demo_shoe_pass_001',
      holder_name: 'Arjun Mehta (Demo) – 4 Pairs',
      gate_number: 'Rack B – East Footwear Stand',
      is_priority: false,
      temple_name: 'Dwarkadhish Temple, Dwarka',
      slot_date:   today,
      slot_time:   'Locker #B-112 • 4 Pairs',
      is_demo: true, is_footwear: true,
    };
  }

  if (v.startsWith('AUDIO-DEMO')) {
    return {
      success: true, already_scanned: false,
      qr_pass_id:  'demo_audio_pass_001',
      holder_name: 'Arjun Mehta (Demo)',
      gate_number: '🔊 Audio Nav Device #A-07 – Collected',
      is_priority: false,
      temple_name: 'Dwarkadhish Temple, Dwarka',
      slot_date:   today,
      slot_time:   'Hindi • 6-Waypoint Route Activated',
      is_demo: true, is_audio: true,
    };
  }

  // Default → Darshan Gate QR (with wheelchair priority)
  return {
    success: true, already_scanned: false,
    qr_pass_id:  'demo_gate_pass_001',
    holder_name: 'Arjun Mehta (Demo) + Family (4)',
    gate_number: 'Gate 2 – Moksha Dwar (♿ Priority Ramp)',
    is_priority: true,
    temple_name: 'Dwarkadhish Temple, Dwarka',
    slot_date:   today,
    slot_time:   '09:00 AM – 11:00 AM',
    is_demo: true, is_boat_pass: false,
    member_count: 4,
  };
};
