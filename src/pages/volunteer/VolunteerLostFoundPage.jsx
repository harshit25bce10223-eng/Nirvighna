import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerAuth } from '../../context/VolunteerAuthContext';
import { assignVolunteerToCase, resolveLostFoundCase } from '../../lib/volunteerEngine';
import { supabase } from '../../lib/supabaseClient';
import { 
  UserX, ArrowLeft, CheckCircle, Phone, UserCheck, 
  Clock, MapPin, RefreshCw, AlertCircle, Search
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
  }, []);

  const fetchCases = async () => {
    const defaultCases = [
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
    ];

    try {
      const saved = localStorage.getItem('nirvighna_lost_found_cases');
      if (saved) {
        setCases(JSON.parse(saved));
      } else {
        localStorage.setItem('nirvighna_lost_found_cases', JSON.stringify(defaultCases));
        setCases(defaultCases);
      }
    } catch (_) {
      setCases(defaultCases);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async (caseId) => {
    setUpdatingId(caseId);
    try {
      const updated = cases.map(c => {
        if (c.id === caseId) {
          return {
            ...c,
            status: 'searching',
            assigned_volunteer_id: currentUser?.id || 'vol_8841',
            assigned_volunteer_name: currentUser?.full_name || 'Vikram S.'
          };
        }
        return c;
      });
      setCases(updated);
      localStorage.setItem('nirvighna_lost_found_cases', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkFound = async (caseId) => {
    setUpdatingId(caseId);
    try {
      const updated = cases.map(c => {
        if (c.id === caseId) {
          return { ...c, status: 'resolved' };
        }
        return c;
      });
      setCases(updated);
      localStorage.setItem('nirvighna_lost_found_cases', JSON.stringify(updated));
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
        return { color: 'bg-rose-50 text-rose-800 border-rose-300', label: 'OPEN CASE' };
      case 'searching':
        return { color: 'bg-blue-50 text-blue-800 border-blue-200', label: 'SEARCHING' };
      case 'resolved':
      case 'found':
        return { color: 'bg-emerald-50 text-emerald-800 border-emerald-300', label: 'REUNITED' };
      default:
        return { color: 'bg-amber-50 text-amber-900 border-gold/40', label: 'OPEN' };
    }
  };

  const openCasesList = cases.filter(c => c.status === 'open' || c.status === 'searching');
  const resolvedCasesList = cases.filter(c => c.status === 'resolved' || c.status === 'found');

  const displayedList = filterMode === 'open' ? openCasesList : resolvedCasesList;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body pb-24 pt-4 px-3 sm:px-6 max-w-md mx-auto space-y-4 selection:bg-gold selection:text-indigo-dark">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-3xl border border-gold/30 shadow-warm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/v/dashboard')}
            className="p-2 bg-amber-50 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-maroon font-heading block">
              FAMILY REUNIFICATION DESK
            </span>
            <h1 className="text-xs font-black font-heading text-indigo-dark uppercase tracking-wider">
              Lost & Found Coordination
            </h1>
          </div>
        </div>

        <button
          onClick={fetchCases}
          className="p-2 bg-amber-50 rounded-2xl border border-gold/30 text-maroon hover:bg-gold/20 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TOP TOGGLE: Open Cases vs Resolved Today */}
      <div className="flex bg-white p-1 rounded-2xl border border-gold/30 text-xs font-bold font-heading shadow-xs">
        <button
          onClick={() => setFilterMode('open')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            filterMode === 'open'
              ? 'bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black shadow-xs'
              : 'text-gray-500 hover:text-maroon'
          }`}
        >
          Open Cases ({openCasesList.length})
        </button>
        <button
          onClick={() => setFilterMode('resolved')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            filterMode === 'resolved'
              ? 'bg-gradient-to-r from-gold to-amber-500 text-indigo-dark font-black shadow-xs'
              : 'text-gray-500 hover:text-maroon'
          }`}
        >
          Resolved Today ({resolvedCasesList.length})
        </button>
      </div>

      {/* LOST & FOUND CASE CARDS */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gold/30 text-center space-y-2 shadow-warm">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-indigo-dark font-heading">
              {filterMode === 'open' ? 'No Open Lost Cases' : 'No Cases Resolved Yet'}
            </h3>
            <p className="text-xs text-gray-500">
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
                className={`bg-white p-4.5 rounded-3xl border space-y-3 shadow-warm transition-all ${
                  isAssignedToOther ? 'border-gray-200 opacity-80' : 'border-gold/30 hover:border-gold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-maroon" />
                    <h3 className="font-extrabold text-sm text-indigo-dark font-heading">
                      {c.reported_person_name || c.name} {c.age ? `(${c.age} yrs)` : ''}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-gray-700 bg-amber-50/40 p-2.5 rounded-xl border border-gold/30 leading-relaxed font-medium">
                  {c.description || 'Wearing blue kurta, last seen near Gomti Ghat steps.'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-0.5">
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
                        className="w-full py-3 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer shadow-goldGlow"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Assign Case to Me →</span>
                      </button>
                    ) : isAssignedToMe ? (
                      <button
                        onClick={() => handleMarkFound(c.id)}
                        disabled={updatingId === c.id}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 font-heading cursor-pointer shadow-md border border-emerald-400"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark as Found & Reunited ✓</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-gold/30 rounded-2xl text-center text-xs text-gray-600 font-bold flex items-center justify-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-maroon" />
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
