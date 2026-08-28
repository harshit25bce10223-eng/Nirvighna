import { supabase } from './supabaseClient';

/**
 * Universal Interconnected Notification Service
 * Synchronizes notifications in real-time across:
 * 1. Pilgrim Portal (In-App Toasts, Notification Inbox, Android System Status Bar)
 * 2. Group Members / Family Emergency Contacts
 * 3. Volunteer Field Desks (Gate Pass Scanner, Lost & Found, Medical SOS)
 * 4. Admin Command Centre (Live Incident Panel & PA Announcements)
 */

// Shared Cross-Tab Broadcast Channel
let broadcastChannelInstance = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannelInstance = new BroadcastChannel('nirvighna_interconnected_sync');
  } catch (_) {}
}

export const sendPilgrimNotification = async ({
  title,
  message,
  type = 'booking_confirmed',
  templeId = null,
  link = null,
  recipients = ['pilgrim', 'group_members', 'volunteers', 'admin'],
  metadata = {}
}) => {
  const notifObj = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: title || 'Nirvighna System Alert',
    message: message || '',
    type: type,
    temple_id: templeId,
    link: link,
    recipients: recipients,
    metadata: metadata,
    created_at: new Date().toISOString(),
    is_read: false
  };

  // 1. Trigger Native Android System Status Bar Notification
  try {
    if (window.NirvighnaNativeBridge && typeof window.NirvighnaNativeBridge.showSystemNotification === 'function') {
      window.NirvighnaNativeBridge.showSystemNotification(notifObj.title, notifObj.message, notifObj.type);
    }
  } catch (nativeErr) {
    console.warn('Native notification bridge error:', nativeErr);
  }

  // 2. Save into localStorage Pilgrim Notification Inbox
  try {
    const existing = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
    const updated = [notifObj, ...existing].slice(0, 60);
    localStorage.setItem('nirvighna_notifications', JSON.stringify(updated));
  } catch (lsErr) {
    console.warn('LocalStorage notification save error:', lsErr);
  }

  // 3. Dispatch in-app top toast alert event in current window
  try {
    window.dispatchEvent(new CustomEvent('nirvighna_notification_alert', { detail: notifObj }));
    window.dispatchEvent(new CustomEvent('nirvighna_interconnected_alert', { detail: notifObj }));
  } catch (eventErr) {
    console.warn('Event dispatch error:', eventErr);
  }

  // 4. Real-time Cross-Tab Broadcast (Pilgrim ⟷ Volunteer ⟷ Admin)
  try {
    if (broadcastChannelInstance) {
      broadcastChannelInstance.postMessage({
        action: 'BROADCAST_NOTIFICATION',
        notification: notifObj
      });
    }
  } catch (bcErr) {
    console.warn('BroadcastChannel sync error:', bcErr);
  }

  // 5. Asynchronously insert to Supabase notifications table
  try {
    supabase.from('notifications').insert([notifObj]).catch?.(() => {});
  } catch (_) {}

  return notifObj;
};

/**
 * Broadcast Lost Person Amber Alert across Pilgrim, Gate Volunteers, and Admin
 */
export const broadcastLostPersonAlert = async (caseData) => {
  return await sendPilgrimNotification({
    title: `🚨 MISSING PERSON ALERT: ${caseData.reported_person_name || caseData.name}`,
    message: `${caseData.description || 'Reported missing near temple premises.'} | Contact: ${caseData.reported_by_phone || '+91 98765 43210'}. Security & Gate Checkpoints on high alert.`,
    type: 'lost_person_alert',
    templeId: caseData.temple_id || null,
    link: '/v/lost-found',
    recipients: ['pilgrim', 'group_members', 'gate_volunteers', 'admin'],
    metadata: {
      case_id: caseData.id,
      age: caseData.age,
      status: 'searching'
    }
  });
};

/**
 * Broadcast Family Reunification Celebratory Alert
 */
export const broadcastReunificationAlert = async (caseData) => {
  return await sendPilgrimNotification({
    title: `🎉 PILGRIM REUNITED: ${caseData.reported_person_name || caseData.name}`,
    message: `${caseData.reported_person_name || caseData.name} has been safely located and reunited with family at the Lost & Found Seva Desk!`,
    type: 'reunification_success',
    templeId: caseData.temple_id || null,
    link: '/v/lost-found',
    recipients: ['pilgrim', 'group_members', 'gate_volunteers', 'admin'],
    metadata: {
      case_id: caseData.id,
      status: 'resolved'
    }
  });
};
