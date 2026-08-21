import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { Bell, Check, ChevronLeft, Loader2, AlertTriangle, Calendar, MapPin, Shield } from 'lucide-react';

const translations = {
  en: {
    back: 'Back',
    notifications: 'Notifications',
    markAllRead: 'Mark All as Read',
    loading: 'Loading notifications...',
    noNotifications: 'No notifications yet',
    emptyState: "You're all caught up! New notifications will appear here.",
    lostReport: 'Lost Report',
    gateInfo: 'Gate Information',
    bookingConfirm: 'Booking Confirmed',
    crowdAlert: 'Crowd Alert',
    medicalAlert: 'Medical Alert',
    priorityAssist: 'Priority Assistance',
    timeAgo: 'ago',
    justNow: 'Just now',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days'
  },
  hi: {
    back: 'वापस',
    notifications: 'सूचनाएं',
    markAllRead: 'सब पढ़ लिया',
    loading: 'सूचनाएं लोड हो रही हैं...',
    noNotifications: 'कोई नई सूचना नहीं है',
    emptyState: 'अभी कोई नई सूचना नहीं है। नया अपडेट यहीं दिखेगा।',
    lostReport: 'लापता रिपोर्ट',
    gateInfo: 'गेट की जानकारी',
    bookingConfirm: 'बुकिंग कन्फर्म',
    crowdAlert: 'भीड़ का अलर्ट',
    medicalAlert: 'मेडिकल अलर्ट',
    priorityAssist: 'फास्ट सहायता',
    timeAgo: 'पहले',
    justNow: 'अभी',
    minutes: 'मिनट',
    hours: 'घंटे',
    days: 'दिन'
  },
  gu: {
    back: 'પાછા',
    notifications: 'સૂચનાઓ',
    markAllRead: 'બધું વાંચી લીધું',
    loading: 'સૂચનાઓ લોડ થઈ રહી છે...',
    noNotifications: 'કોઈ નવી સૂચના નથી',
    emptyState: 'હાલ કોઈ નવી સૂચના નથી. નવું અપડેટ અહીં દેખાશે.',
    lostReport: 'ખોવાઈ ગયાની જાણ',
    gateInfo: 'ગેટની માહિતી',
    bookingConfirm: 'બુકિંગ કન્ફર્મ',
    crowdAlert: 'ભીડ એલર્ટ',
    medicalAlert: 'મેડિકલ એલર્ટ',
    priorityAssist: 'મદદ સેવા',
    timeAgo: 'પહેલા',
    justNow: 'હમણાં',
    minutes: 'મિનિટ',
    hours: 'કલાક',
    days: 'દિવસ'
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'lost_report':
      return { icon: AlertTriangle, color: 'text-alertRed', bg: 'bg-alertRed/10' };
    case 'gate_info':
      return { icon: MapPin, color: 'text-gold-dark', bg: 'bg-gold/15' };
    case 'booking_confirmed':
      return { icon: Calendar, color: 'text-successGreen', bg: 'bg-successGreen/10' };
    case 'crowd_alert':
      return { icon: AlertTriangle, color: 'text-alertRed', bg: 'bg-alertRed/10' };
    case 'medical_alert':
      return { icon: Shield, color: 'text-indigo-dark', bg: 'bg-indigo-dark/10' };
    case 'priority_assist':
      return { icon: Shield, color: 'text-maroon', bg: 'bg-maroon/10' };
    default:
      return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

const formatTimeAgo = (timestamp, t) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return `${diffMins} ${t.minutes} ${t.timeAgo}`;
  if (diffHours < 24) return `${diffHours} ${t.hours} ${t.timeAgo}`;
  return `${diffDays} ${t.days} ${t.timeAgo}`;
};

const getLocalizedNotification = (notification, lang) => {
  if (!notification) return { title: '', message: '' };

  let title = notification.title || '';
  let message = notification.message || '';

  if (lang === 'gu') {
    if (notification.title_gu) title = notification.title_gu;
    else if (title.includes('safer entry route available')) {
      const templeName = title.split(':')[0] || 'સોમનાથ મંદિર';
      title = `${templeName}: સરળ અને સુરક્ષિત એન્ટ્રી રૂટ ઉપલબ્ધ છે`;
    }

    if (notification.message_gu) message = notification.message_gu;
    else if (message.includes('Gate 1 is busy') || message.includes('Estimated wait saved')) {
      const minsMatch = message.match(/(\d+)\s*minutes/i);
      const mins = minsMatch ? minsMatch[1] : '22';
      message = `ગેટ 1 પર ભીડ છે. કૃપા કરીને ગેટ 2 તરફ જાઓ. તમારા આશરે ${mins} મિનિટ બચશે.`;
    }
  } else if (lang === 'hi') {
    if (notification.title_hi) title = notification.title_hi;
    else if (title.includes('safer entry route available')) {
      const templeName = title.split(':')[0] || 'सोमनाथ मंदिर';
      title = `${templeName}: आसान और सुरक्षित एंट्री रूट उपलब्ध है`;
    }

    if (notification.message_hi) message = notification.message_hi;
    else if (message.includes('Gate 1 is busy') || message.includes('Estimated wait saved')) {
      const minsMatch = message.match(/(\d+)\s*minutes/i);
      const mins = minsMatch ? minsMatch[1] : '22';
      message = `गेट 1 पर भीड़ है। कृपया गेट 2 की तरफ जाएं। आपके लगभग ${mins} मिनट बचेंगे।`;
    }
  }

  return { title, message };
};

export const Notifications = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage];

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const isValidUUID = (id) => {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  useEffect(() => {
    fetchNotifications();

    const handleLiveNotif = (e) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev.filter(n => n.id !== e.detail.id)]);
      }
    };
    window.addEventListener('nirvighna_notification_alert', handleLiveNotif);

    // Setup realtime subscription for DB notifications if user ID is a valid UUID
    let channel;
    if (currentUser?.id && isValidUUID(currentUser.id)) {
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('nirvighna_notification_alert', handleLiveNotif);
      if (channel) supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const localNotifs = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
      let dbNotifs = [];

      if (currentUser?.id && isValidUUID(currentUser.id)) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (!error && data) dbNotifs = data;
        } catch (err) {}
      }

      const combined = [...localNotifs, ...dbNotifs];
      const uniqueNotifs = Array.from(new Map(combined.map(n => [n.id, n])).values());
      uniqueNotifs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setNotifications(uniqueNotifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // 1. Immediate UI state update
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      // 2. Update local storage for non-db notifications
      try {
        const localNotifs = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
        const updatedLocal = localNotifs.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
        localStorage.setItem('nirvighna_notifications', JSON.stringify(updatedLocal));
      } catch (e) {}

      // 3. Only invoke Supabase if the ID is a valid database UUID
      if (isValidUUID(notificationId)) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // 1. Immediate UI state update
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      // 2. Update local storage
      try {
        const localNotifs = JSON.parse(localStorage.getItem('nirvighna_notifications') || '[]');
        const updatedLocal = localNotifs.map(n => ({ ...n, is_read: true }));
        localStorage.setItem('nirvighna_notifications', JSON.stringify(updatedLocal));
      } catch (e) {}

      // 3. Only invoke Supabase if the user ID is a valid database UUID
      if (currentUser?.id && isValidUUID(currentUser.id)) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', currentUser.id)
          .eq('is_read', false);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-20">
        <NirvighnaLoader message={t.loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory pt-5 pb-10 px-3.5 sm:px-6 animate-page-in">
      <div className="max-w-md sm:max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 hover:border-maroon hover:bg-maroon hover:text-white text-maroon transition-all cursor-pointer card-press"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold font-heading text-maroon flex items-center gap-2">
                {t.notifications}
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-maroon text-white text-[10px] font-black rounded-full badge-pop">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-gray-400 font-medium">
                {unreadCount > 0 ? `${unreadCount} unread — tap to dismiss` : 'All caught up ✓'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-maroon bg-maroon/8 hover:bg-maroon hover:text-white px-3 py-1.5 rounded-xl border border-maroon/20 transition-all cursor-pointer"
            >
              {t.markAllRead}
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center shadow-xs border border-gray-100">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-100">
              <Bell className="w-7 h-7 text-amber-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">{t.noNotifications}</p>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{t.emptyState}</p>
            <div className="mt-4 text-2xl">🙏</div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
              const timeAgo = formatTimeAgo(notification.created_at, t);
              const isUnread = !notification.is_read;
              const localized = getLocalizedNotification(notification, currentLanguage);

              return (
                <div
                  key={notification.id}
                  onClick={() => isUnread && markAsRead(notification.id)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer hover-warm overflow-hidden ${
                    isUnread
                      ? 'border-gold/30 shadow-xs'
                      : 'border-gray-100 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Unread left accent bar */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold rounded-l-2xl" />
                    )}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} ${color} flex-shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-bold text-sm font-heading ${isUnread ? 'text-maroon' : 'text-gray-600'} leading-tight`}>
                          {localized.title}
                        </h3>
                        {isUnread && (
                          <span className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-1.5 animate-pulse-glow" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {localized.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


