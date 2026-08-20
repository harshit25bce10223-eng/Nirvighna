import { supabase } from './supabaseClient';

// In-memory state for demo mode
let inMemoryRopewayStatus = {
  tmp_pavagadh: {
    temple_id: 'tmp_pavagadh',
    is_operational: true,
    halt_reason: '',
    updated_at: new Date().toISOString()
  }
};

let inMemoryBookings = [];

// Generate time slots for a given date and direction
export const generateRopewaySlots = (dateStr, direction = 'up') => {
  const timeWindows = [
    '06:00 - 06:30 AM',
    '06:30 - 07:00 AM',
    '07:00 - 07:30 AM',
    '07:30 - 08:00 AM',
    '08:00 - 08:30 AM',
    '08:30 - 09:00 AM',
    '09:00 - 09:30 AM',
    '09:30 - 10:00 AM',
    '10:00 - 10:30 AM',
    '10:30 - 11:00 AM',
    '11:00 - 11:30 AM',
    '11:30 - 12:00 PM',
    '02:00 - 02:30 PM',
    '02:30 - 03:00 PM',
    '03:00 - 03:30 PM',
    '03:30 - 04:00 PM',
    '04:00 - 04:30 PM',
    '04:30 - 05:00 PM',
    '05:00 - 05:30 PM',
    '05:30 - 06:00 PM'
  ];

  return timeWindows.map((tw, idx) => {
    // Generate deterministic values
    const seed = (idx + direction.length + (dateStr ? dateStr.length : 5)) % 10;
    const total_capacity = 80;
    let booked_count = 20 + seed * 6;
    if (idx === 3 || idx === 7) booked_count = 78;
    if (idx === 4) booked_count = 80;

    return {
      id: `rpw_slot_${dateStr}_${direction}_${idx}`,
      temple_id: 'tmp_pavagadh',
      date: dateStr,
      time_window: tw,
      direction: direction,
      total_capacity,
      booked_count,
      is_available: booked_count < total_capacity
    };
  });
};

export const ropewayEngine = {
  // Get operational status
  async fetchStatus(templeId = 'tmp_pavagadh') {
    return inMemoryRopewayStatus[templeId] || {
      temple_id: templeId,
      is_operational: true,
      halt_reason: '',
      updated_at: new Date().toISOString()
    };
  },

  // Update operational status
  async setStatus(templeId = 'tmp_pavagadh', isOperational = true, haltReason = '') {
    const updatedStatus = {
      temple_id: templeId,
      is_operational: isOperational,
      halt_reason: haltReason,
      updated_at: new Date().toISOString()
    };

    inMemoryRopewayStatus[templeId] = updatedStatus;

    // Trigger notifications if halted
    if (!isOperational) {
      const haltMessage = haltReason || 'Ropeway currently halted due to high wind speed.';
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: 'all',
            type: 'ropeway_halt',
            title: '⚠️ Ropeway Service Halted',
            message: `${haltMessage} Trekking route with rest checkpoints is suggested.`,
            temple_id: templeId,
            created_at: new Date().toISOString()
          });
      } catch (e) {
        console.warn('Realtime notify trigger simulated in memory:', e);
      }
    }

    return updatedStatus;
  },

  // Get available slots
  async fetchSlots(templeId = 'tmp_pavagadh', dateStr = new Date().toISOString().split('T')[0], direction = 'up') {
    return generateRopewaySlots(dateStr, direction);
  },

  // Book slot
  async bookRopewaySlot({ pilgrimId, bookingId, templeId = 'tmp_pavagadh', slot, direction = 'up', passengerCount = 1, pilgrimName = '', pilgrimPhone = '' }) {
    const currentStatus = await this.fetchStatus(templeId);
    if (!currentStatus.is_operational) {
      throw new Error(`Ropeway is currently halted: ${currentStatus.halt_reason || 'High wind weather conditions'}. Please use the Trekking Route.`);
    }

    if (slot.booked_count >= slot.total_capacity) {
      throw new Error('This time window is fully booked. Please select another time window.');
    }

    // Generate unique QR token
    const qrToken = `RPW-${templeId.toUpperCase().slice(-3)}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRopewayBooking = {
      id: `rpw_b_${Date.now()}`,
      booking_id: bookingId || `b_${Date.now()}`,
      pilgrim_id: pilgrimId,
      temple_id: templeId,
      slot_id: slot.id,
      time_window: slot.time_window,
      date: slot.date,
      direction: direction,
      passenger_count: passengerCount,
      pilgrim_name: pilgrimName,
      pilgrim_phone: pilgrimPhone,
      qr_token: qrToken,
      status: 'booked',
      created_at: new Date().toISOString()
    };

    inMemoryBookings.push(newRopewayBooking);

    try {
      await supabase.from('ropeway_bookings').insert(newRopewayBooking);
    } catch (e) {
      console.warn('Booking stored in local state:', e);
    }

    return newRopewayBooking;
  },

  // Scan QR code
  async scanRopewayQR(qrToken) {
    const existing = inMemoryBookings.find(b => b.qr_token === qrToken);

    if (existing) {
      if (existing.status === 'boarded') {
        return {
          success: false,
          code: 'ALREADY_BOARDED',
          message: 'This pass has ALREADY been scanned and boarded.',
          booking: existing
        };
      }
      if (existing.status === 'cancelled') {
        return {
          success: false,
          code: 'CANCELLED',
          message: 'This ropeway ticket was CANCELLED.',
          booking: existing
        };
      }

      existing.status = 'boarded';
      existing.boarded_at = new Date().toISOString();

      return {
        success: true,
        code: 'BOARDING_APPROVED',
        message: `VALID BOARDING PASS — ${existing.passenger_count} Passenger(s)`,
        booking: existing
      };
    }

    // Database check
    try {
      const { data, error } = await supabase
        .from('ropeway_bookings')
        .select('*')
        .eq('qr_token', qrToken)
        .single();

      if (!error && data) {
        if (data.status === 'boarded') {
          return { success: false, code: 'ALREADY_BOARDED', message: 'Pass ALREADY scanned and boarded.', booking: data };
        }
        if (data.status === 'cancelled') {
          return { success: false, code: 'CANCELLED', message: 'Ticket was cancelled.', booking: data };
        }

        await supabase
          .from('ropeway_bookings')
          .update({ status: 'boarded', boarded_at: new Date().toISOString() })
          .eq('qr_token', qrToken);

        return {
          success: true,
          code: 'BOARDING_APPROVED',
          message: `VALID BOARDING PASS — ${data.passenger_count || 1} Passenger(s)`,
          booking: { ...data, status: 'boarded' }
        };
      }
    } catch (e) {
      console.warn('Database scan fallback:', e);
    }

    // Simulated fallback
    if (qrToken && qrToken.startsWith('RPW-')) {
      return {
        success: true,
        code: 'BOARDING_APPROVED',
        message: 'VALID BOARDING PASS — 1 Passenger',
        booking: {
          qr_token: qrToken,
          pilgrim_name: 'Apex Coder',
          passenger_count: 1,
          time_window: '09:00 - 09:30 AM',
          status: 'boarded'
        }
      };
    }

    return {
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid Ropeway Pass Token'
    };
  }
};

export const scanRopewayQR = (qrToken) => ropewayEngine.scanRopewayQR(qrToken);
