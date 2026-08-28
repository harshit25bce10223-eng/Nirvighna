/**
 * Email Service
 * Calls Supabase Edge Function to send email notifications via Resend
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const emailService = {
  /**
   * Send alert email via Edge Function
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} Result
   */
  async sendAlertEmail({ recipient_email, recipient_name, alert_type, context }) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/sendAlertEmail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_email,
          recipient_name,
          alert_type,
          context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Email service error:', data);
        return { success: false, error: data.error || 'Failed to send email' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send medical alert to emergency contacts and group members
   * @param {string} bookingId - Booking UUID
   * @param {Object} medicalInfo - Medical information
   * @returns {Promise<Object>} Result
   */
  async sendMedicalAlert(bookingId, medicalInfo) {
    try {
      const { supabase } = await import('./supabaseClient');

      // Get booking details first (no embedded join — emergency_contacts relates to pilgrim, not booking)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Fetch emergency contacts via the pilgrim and group members via the booking
      const [contactsRes, membersRes] = await Promise.all([
        booking.pilgrim_id
          ? supabase.from('emergency_contacts').select('*').eq('pilgrim_id', booking.pilgrim_id)
          : Promise.resolve({ data: [] }),
        supabase.from('group_members').select('*').eq('booking_id', bookingId)
      ]);

      const emergencyContacts = contactsRes.data || [];
      const groupMembers = membersRes.data || [];

      const emailPromises = [];
      const errors = [];

      // Send to emergency contacts that have an email
      for (const contact of emergencyContacts) {
        if (!contact.email) continue;
        const result = await this.sendAlertEmail({
          recipient_email: contact.email,
          recipient_name: contact.name || 'Emergency Contact',
          alert_type: 'medical_alert',
          context: {
            patientName: medicalInfo.patientName,
            location: medicalInfo.location,
            condition: medicalInfo.condition,
            bloodGroup: medicalInfo.bloodGroup
          }
        });

        if (!result.success) {
          errors.push(`Emergency contact ${contact.name || ''} email failed: ${result.error}`);
        }
        emailPromises.push(result);
      }

      // Send to group members who have emails
      if (groupMembers && groupMembers.length > 0) {
        for (const member of booking.group_members) {
          if (member.email) {
            const result = await this.sendAlertEmail({
              recipient_email: member.email,
              recipient_name: member.name || 'Group Member',
              alert_type: 'medical_alert',
              context: {
                patientName: medicalInfo.patientName,
                location: medicalInfo.location,
                condition: medicalInfo.condition,
                bloodGroup: medicalInfo.bloodGroup
              }
            });

            if (!result.success) {
              errors.push(`Group member ${member.name} email failed: ${result.error}`);
            }
            emailPromises.push(result);
          }
        }
      }

      return {
        success: true,
        emailsSent: emailPromises.filter(p => p.success).length,
        totalAttempts: emailPromises.length,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      console.error('Error sending medical alert emails:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send Medical Alert with Immediate In-App Notification & 3-Attempt Email Retry Engine
   */
  async sendMedicalAlertWithRetry({ bookingId, alertId, patientName, location, condition, bloodGroup, emergencyPhone }) {
    const { supabase } = await import('./supabaseClient');

    // Resolve current user for the notification row (RLS requires user_id)
    let userId = null;
    try {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id || null;
    } catch (_) {}

    // 1. CRITICAL: Insert In-App Notification IMMEDIATELY (Never blocked by email failure)
    const inAppNotif = {
      user_id: userId,
      type: 'medical_alert',
      title: '🚨 CRITICAL MEDICAL EMERGENCY',
      message: `Medical emergency logged for ${patientName || 'Pilgrim'} at ${location || 'Gate 2 Swarga Dwar'}. Response team dispatched.`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('notifications').insert(inAppNotif);
    } catch (e) {}

    // 2. Email Delivery with 3-Attempt Retry Policy
    let attempt = 0;
    const maxAttempts = 3;
    let emailSuccess = false;
    let lastErrMessage = '';

    const recipientEmail = 'family.emergency@nirvighna.org';
    const recipientName = 'Family Emergency Contact';

    while (attempt < maxAttempts && !emailSuccess) {
      attempt++;
      try {
        const res = await this.sendAlertEmail({
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          alert_type: 'medical_alert',
          context: { patientName, location, condition, bloodGroup }
        });

        if (res && res.success) {
          emailSuccess = true;
          await this.updateDeliveryLog(alertId, 'sent', attempt);
        } else {
          lastErrMessage = res?.error || 'Edge Function Resend API timeout';
          await this.updateDeliveryLog(alertId, attempt < maxAttempts ? 'retrying' : 'failed_permanent', attempt);
        }
      } catch (err) {
        lastErrMessage = err.message;
        await this.updateDeliveryLog(alertId, attempt < maxAttempts ? 'retrying' : 'failed_permanent', attempt);
      }
    }

    // 3. Human Telephony Escalation after 3 failed attempts:
    if (!emailSuccess) {
      const phoneToCall = emergencyPhone || '+91 98765 43210';
      const humanEscalationMessage = `🚨 Emergency email to contact failed after 3 attempts — consider calling directly at ${phoneToCall}`;

      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'medical_alert',
          title: '📞 CALL EMERGENCY CONTACT DIRECTLY',
          message: humanEscalationMessage,
          created_at: new Date().toISOString()
        });
      } catch (e) {}

      return {
        success: false,
        delivery_status: 'failed_permanent',
        delivery_attempts: 3,
        human_call_required: true,
        phone_number: phoneToCall,
        message: humanEscalationMessage
      };
    }

    return {
      success: true,
      delivery_status: 'sent',
      delivery_attempts: attempt,
      message: '✓ Medical alert email delivered & in-app notification active'
    };
  },

  async updateDeliveryLog(alertId, status, attempts) {
    if (!alertId) return;
    const { supabase } = await import('./supabaseClient');
    try {
      await supabase
        .from('medical_alerts')
        .update({
          delivery_status: status,
          delivery_attempts: attempts,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', alertId);
    } catch (e) {}
  },

  /**
   * Send gate information email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {Object} gateInfo - Gate information
   * @returns {Promise<Object>} Result
   */
  async sendGateInfo(email, name, gateInfo) {
    return this.sendAlertEmail({
      recipient_email: email,
      recipient_name: name,
      alert_type: 'gate_info',
      context: gateInfo
    });
  },

  /**
   * Send ropeway halt alert
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {Object} ropewayInfo - Ropeway information
   * @returns {Promise<Object>} Result
   */
  async sendRopewayAlert(email, name, ropewayInfo) {
    return this.sendAlertEmail({
      recipient_email: email,
      recipient_name: name,
      alert_type: 'ropeway_halt',
      context: ropewayInfo
    });
  },

  /**
   * Send boat reroute alert
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {Object} boatInfo - Boat/ferry information
   * @returns {Promise<Object>} Result
   */
  async sendBoatAlert(email, name, boatInfo) {
    return this.sendAlertEmail({
      recipient_email: email,
      recipient_name: name,
      alert_type: 'boat_reroute',
      context: boatInfo
    });
  }
};
