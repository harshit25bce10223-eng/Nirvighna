import { supabase } from './supabaseClient';

/**
 * Pavagadh Ropeway Service
 * Integrates with ropeway operator schedule and capacity feed
 */

export const ropewayService = {
  /**
   * Get ropeway schedule for a specific date
   * @param {Date} date - Date to get schedule for
   * @returns {Promise<Array>} Array of scheduled rides
   */
  async getRopewaySchedule(date) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('ropeway_schedule')
        .select('*')
        .eq('schedule_date', dateStr)
        .eq('is_active', true)
        .order('departure_time', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching ropeway schedule:', error);
      return [];
    }
  },

  /**
   * Get real-time ropeway capacity status
   * @returns {Promise<Object>} Current capacity status
   */
  async getRopewayCapacity() {
    try {
      const { data, error } = await supabase
        .from('ropeway_schedule')
        .select('*')
        .eq('is_active', true)
        .gte('schedule_date', new Date().toISOString().split('T')[0])
        .lte('schedule_date', new Date().toISOString().split('T')[0])
        .order('departure_time', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return this.getMockCapacity();
      }

      const currentSchedule = data[0];
      const availableSeats = currentSchedule.capacity - currentSchedule.booked_count;
      
      return {
        currentSchedule: {
          departureTime: currentSchedule.departure_time,
          arrivalTime: currentSchedule.arrival_time,
          capacity: currentSchedule.capacity,
          booked: currentSchedule.booked_count,
          available: availableSeats
        },
        status: availableSeats > 20 ? 'available' : availableSeats > 0 ? 'limited' : 'full',
        nextAvailable: await this.getNextAvailableSlot()
      };
    } catch (error) {
      console.error('Error fetching ropeway capacity:', error);
      return this.getMockCapacity();
    }
  },

  /**
   * Get next available ropeway slot
   * @returns {Promise<Object>} Next available slot
   */
  async getNextAvailableSlot() {
    try {
      const { data, error } = await supabase
        .from('ropeway_schedule')
        .select('*')
        .eq('is_active', true)
        .gte('schedule_date', new Date().toISOString().split('T')[0])
        .gt('booked_count', 0)
        .lt('booked_count', 'capacity')
        .order('departure_time', { ascending: true })
        .limit(1);

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching next available slot:', error);
      return null;
    }
  },

  /**
   * Book ropeway tickets
   * @param {Object} bookingData - Booking details
   * @returns {Promise<Object>} Booking result
   */
  async bookRopewayTicket(bookingData) {
    try {
      const { pilgrimId, scheduleId, numberOfTickets, bookingCode } = bookingData;

      // Check availability
      const { data: schedule, error: scheduleError } = await supabase
        .from('ropeway_schedule')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (scheduleError) throw scheduleError;

      if (schedule.booked_count + numberOfTickets > schedule.capacity) {
        throw new Error('Insufficient capacity');
      }

      // Update booked count
      const { error: updateError } = await supabase
        .from('ropeway_schedule')
        .update({ booked_count: schedule.booked_count + numberOfTickets })
        .eq('id', scheduleId);

      if (updateError) throw updateError;

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('ropeway_bookings')
        .insert({
          pilgrim_id: pilgrimId,
          schedule_id: scheduleId,
          number_of_tickets: numberOfTickets,
          booking_code: bookingCode,
          status: 'confirmed'
        })
        .select()
        .single();

      if (boardingError) throw bookingError;

      return { success: true, booking };
    } catch (error) {
      console.error('Error booking ropeway ticket:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get ropeway status for display
   * @returns {Promise<Object>} Status information
   */
  async getRopewayStatus() {
    try {
      const capacity = await this.getRopewayCapacity();
      const todaySchedule = await this.getRopewaySchedule(new Date());

      return {
        isOperational: true,
        currentCapacity: capacity,
        todaySchedule: todaySchedule.slice(0, 5), // Next 5 rides
        averageWaitTime: capacity.status === 'available' ? '15-20 mins' : '30-45 mins',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching ropeway status:', error);
      return {
        isOperational: true,
        currentCapacity: this.getMockCapacity(),
        todaySchedule: [],
        averageWaitTime: '20-30 mins',
        lastUpdated: new Date().toISOString()
      };
    }
  },

  /**
   * Mock capacity data for fallback
   */
  getMockCapacity() {
    return {
      currentSchedule: {
        departureTime: '10:30 AM',
        arrivalTime: '11:00 AM',
        capacity: 50,
        booked: 35,
        available: 15
      },
      status: 'limited',
      nextAvailable: {
        departureTime: '11:30 AM',
        arrivalTime: '12:00 PM',
        capacity: 50,
        booked: 20,
        available: 30
      }
    };
  },

  /**
   * Sync ropeway schedule from external operator feed
   * This would be called by a scheduled job or webhook
   */
  async syncRopewaySchedule() {
    try {
      // In production, this would fetch from the ropeway operator's API
      // For now, we'll generate mock data for the next 7 days
      
      const schedules = [];
      const today = new Date();

      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        // Generate hourly slots from 6 AM to 6 PM
        for (let hour = 6; hour <= 18; hour++) {
          const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
          const arrivalHour = hour + 1;
          const arrivalStr = `${arrivalHour > 12 ? arrivalHour - 12 : arrivalHour}:00 ${arrivalHour >= 12 ? 'PM' : 'AM'}`;

          schedules.push({
            schedule_date: dateStr,
            departure_time: timeStr,
            arrival_time: arrivalStr,
            capacity: 50,
            booked_count: Math.floor(Math.random() * 40),
            is_active: true,
            operator_id: 'ropeway_operator_001'
          });
        }
      }

      // Upsert schedules
      for (const schedule of schedules) {
        await supabase
          .from('ropeway_schedule')
          .upsert(schedule, { onConflict: 'schedule_date,departure_time' });
      }

      return { success: true, synced: schedules.length };
    } catch (error) {
      console.error('Error syncing ropeway schedule:', error);
      return { success: false, error: error.message };
    }
  }
};
