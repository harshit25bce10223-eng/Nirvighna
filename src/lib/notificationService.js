import { supabase } from './supabaseClient';

/**
 * Universal Pilgrim Notification Service
 * Sends system notifications (Android status bar) and in-app alerts (toast + /notifications history)
 */
export const sendPilgrimNotification = async ({
  title,
  message,
  type = 'booking_confirmed',
  templeId = null,
  link = null
}) => {
  const notifObj = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: title || 'Nirvighna Pilgrim Update',
    message: message || '',
    type: type,
    temple_id: templeId,
    link: link,
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

  // 2. Save into localStorage Notification History
  try {
    const existing = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
    const updated = [notifObj, ...existing].slice(0, 60);
    localStorage.setItem('nirvighna_notifications', JSON.stringify(updated));
  } catch (lsErr) {
    console.warn('LocalStorage notification save error:', lsErr);
  }

  // 3. Dispatch in-app top toast alert event
  try {
    window.dispatchEvent(new CustomEvent('nirvighna_notification_alert', { detail: notifObj }));
  } catch (eventErr) {
    console.warn('Event dispatch error:', eventErr);
  }

  // 4. Asynchronously insert to Supabase notifications table
  try {
    supabase.from('notifications').insert([notifObj]).catch?.(() => {});
  } catch (_) {}

  return notifObj;
};
