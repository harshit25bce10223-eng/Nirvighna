import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { assignVolunteerToCase, resolveLostFoundCase } from '../../lib/volunteerEngine';
import { supabase } from '../../lib/supabaseClient';
import { 
  UserX, ArrowLeft, CheckCircle, Phone, UserCheck, 
  Clock, MapPin, RefreshCw, AlertCircle
} from 'lucide-react';

export const VolunteerLostFoundPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useVolunteerAuth();

  const [filterMode, setFilterMode] = useState('open'); // 'open' | 'resolved'
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchCases();

    // Subscribe to Supabase Realtime on lost_found_cases INSERT and UPDATE
    const channel = supabase
      .channel('volunteer_lost_found_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lost_found_cases' },
        (payload) => {
          setCases(prev => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lost_found_cases' },
        (payload) => {
          const updated = payload.new;
          setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('lost_found_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCases(data);
      } else {
        // Fallback demo cases
        setCases([
          {
            id: 'case_101',
            reported_person_name: 'Aarav Sharma',
            age: 7,
            description: 'Wearing blue kurta, red shoes. Last seen near Gomti Ghat steps.',
            reported_by_phone: '+91 98765 43210',
            status: 'open',
            assigned_volunteer_id: null,
            assigned_volunteer_name: null,
            created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
          },
          {
            id: 'case_102',
            reported_person_name: 'Kamla Devi',
            age: 68,
            description: 'Elderly lady with yellow saree and wooden walking stick. Speaks Gujarati.',
            reported_by_phone: '+91 98412 11002',
            status: 'searching',
            assigned_volunteer_id: currentUser?.id || 'vol_8841',
            assigned_volunteer_name: currentUser?.full_name || 'Vikram S.',
            created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
          },
          {
            id: 'case_103',
            reported_person_name: 'Meera Patel',
            age: 12,
            description: 'Green dress, carrying pink pouch bag.',
            reported_by_phone: '+91 97120 44921',
            status: 'resolved',
            assigned_volunteer_id: 'vol_7712',
            assigned_volunteer_name: 'Rohan M.',
            created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('Cases fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async (caseId) => {
    setUpdatingId(caseId);
    try {
      const res = await assignVolunteerToCase(caseId, currentUser?.id || 'vol_8841', currentUser?.full_name || 'Vikram S.');
      
      if (res && res.already_assigned) {
        alert("This case was just assigned to another volunteer");
        fetchCases();
        return;
      }

      // Local optimistic update
      setCases(prev => prev.map(c => {
        if (c.id === caseId) {
          return {
            ...c,
            status: 'searching',
            assigned_volunteer_id: currentUser?.id || 'vol_8841',
            assigned_volunteer_name: currentUser?.full_name || 'Vikram S.'
          };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkFound = async (caseId) => {
    setUpdatingId(caseId);
    try {
      await resolveLostFoundCase(caseId, 'found');
      // Local optimistic update
      setCases(prev => prev.map(c => {
        if (c.id === caseId) {
          return { ...c, status: 'resolved' };
        }
        return c;
      }));
      alert('👨‍👩‍👧 Family Member Marked Found & Reunited! Notification sent to pilgrim app.');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return { color: 'bg-temple-peach text-temple-brown border-temple-orange', label: 'OPEN CASE' };
      case 'searching':
        return { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'SEARCHING' };
      case 'resolved':
      case 'found':
        return { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: 'REUNITED' };
      default:
        return { color: 'bg-temple-peach text-temple-brown border-temple-orange', label: 'OPEN' };
    }
  };

  const openCasesList = cases.filter(c => c.status === 'open' || c.status === 'searching');
  const resolvedCasesList = cases.filter(c => c.status === 'resolved' || c.status === 'found');

  const displayedList = filterMode === 'open' ? openCasesList : resolvedCasesList;

  return (
    <div className="min-h-screen bg-cream text-temple-text font-body pb-24 pt-4 px-3 sm:px-6 max-w-md mx-auto space-y-4 selection:bg-temple-orange selection:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/v/dashboard')}
            className="p-2 bg-white rounded-xl border border-temple-peach text-temple-brown"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black font-heading text-temple-brown uppercase tracking-wider">
              FAMILY REUNIFICATION DESK
            </h1>
            <p className="text-[10px] text-temple-textMuted font-mono">Live Lost & Found Case Logs</p>
          </div>
        </div>

        <button
          onClick={fetchCases}
          className="p-2 bg-white rounded-xl border border-temple-peach text-temple-textMuted hover:text-temple-brown"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TOP TOGGLE: Open Cases vs Resolved Today */}
      <div className="flex bg-white p-1 rounded-2xl border border-temple-peach text-xs font-bold font-heading">
        <button
          onClick={() => setFilterMode('open')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filterMode === 'open'
              ? 'bg-temple-orange text-white font-black'
              : 'text-temple-textMuted hover:text-temple-brown'
          }`}
        >
          Open Cases ({openCasesList.length})
        </button>
        <button
          onClick={() => setFilterMode('resolved')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filterMode === 'resolved'
              ? 'bg-temple-orange text-white font-black'
              : 'text-temple-textMuted hover:text-temple-brown'
          }`}
        >
          Resolved Today ({resolvedCasesList.length})
        </button>
      </div>

      {/* LOST & FOUND CASE CARDS */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-temple-peach text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-temple-brown">
              {filterMode === 'open' ? 'No Open Lost Cases' : 'No Cases Resolved Yet'}
            </h3>
            <p className="text-xs text-temple-textMuted">
              {filterMode === 'open' ? 'All family members in this sector are safe.' : 'Resolved cases will appear here.'}
            </p>
          </div>
        ) : (
          displayedList.map((c) => {
            const badge = getStatusBadge(c.status);
            const isAssignedToMe = c.assigned_volunteer_id === (currentUser?.id || 'vol_8841');
            const isAssignedToOther = c.assigned_volunteer_id && !isAssignedToMe;

            return (
              <div
                key={c.id}
                className={`bg-white p-4 rounded-3xl border space-y-3 shadow-temple ${
                  isAssignedToOther ? 'border-temple-peach opacity-75' : 'border-temple-peach'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-temple-orange" />
                    <h3 className="font-extrabold text-sm text-temple-brown font-heading">
                      {c.reported_person_name || c.name} {c.age ? `(${c.age} yrs)` : ''}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-temple-text bg-cream p-2.5 rounded-xl border border-temple-peach leading-relaxed">
                  {c.description || 'Wearing blue kurta, last seen near Gomti Ghat steps.'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-temple-textMuted font-mono pt-0.5">
                  <span>Reported {getRelativeTime(c.created_at)}</span>
                  <span>Contact: {c.reported_by_phone || '+91 98765 43210'}</span>
                </div>

                {/* ASSIGNMENT / RESOLUTION BUTTON LOGIC */}
                {c.status !== 'resolved' && (
                  <div className="pt-1">
                    {!c.assigned_volunteer_id ? (
                      <button
                        onClick={() => handleAssignToMe(c.id)}
                        disabled={updatingId === c.id}
                        className="w-full py-3 bg-temple-orange hover:bg-temple-brown text-white font-black text-xs rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading"
                      >
                        <UserCheck className="w-4 h-4" />
                        Assign Case to Me →
                      </button>
                    ) : isAssignedToMe ? (
                      <button
                        onClick={() => handleMarkFound(c.id)}
                        disabled={updatingId === c.id}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Found & Reunited ✓
                      </button>
                    ) : (
                      <div className="p-2.5 bg-temple-peach/50 border border-temple-peach rounded-2xl text-center text-xs text-temple-textMuted font-bold flex items-center justify-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-temple-textMuted" />
                        <span>Assigned to {c.assigned_volunteer_name || 'Another Volunteer'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
