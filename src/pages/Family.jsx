import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { Users, Plus, MapPin, AlertTriangle, Loader2, ChevronLeft } from 'lucide-react';

const translations = {
  en: {
    back: 'Back',
    familyGroup: 'Family Group',
    addMember: 'Add Member',
    memberName: 'Member Name',
    memberAge: 'Age',
    memberPhone: 'Phone (Optional)',
    save: 'Save Member',
    saving: 'Saving...',
    lastSeen: 'Last seen',
    ago: 'ago',
    reportLost: 'Report Lost',
    loading: 'Loading family members...',
    noMembers: 'No family members added yet.',
    addFirst: 'Add your first family member',
    error: 'Failed to load family members',
    saveError: 'Failed to save member'
  },
  hi: {
    back: 'वापस',
    familyGroup: 'परिवार और ग्रुप',
    addMember: 'सदस्य जोड़ें',
    memberName: 'सदस्य का नाम',
    memberAge: 'उम्र',
    memberPhone: 'फोन नंबर (वैकल्पिक)',
    save: 'सेव करें',
    saving: 'सेव हो रहा है...',
    lastSeen: 'आखिरी बार यहां देखा',
    ago: 'पहले',
    reportLost: 'लापता रिपोर्ट करें',
    loading: 'परिवार सदस्य लोड हो रहे हैं...',
    noMembers: 'अभी तक कोई सदस्य नहीं जोड़ा गया।',
    addFirst: 'अपने परिवार के सदस्य को जोड़ें',
    error: 'परिवार सदस्य लोड नहीं हो सके',
    saveError: 'सेव करने में समस्या आई'
  },
  gu: {
    back: 'પાછા',
    familyGroup: 'પરિવાર અને ગ્રુપ',
    addMember: 'સભ્ય ઉમેરો',
    memberName: 'સભ્યનું નામ',
    memberAge: 'ઉંમર',
    memberPhone: 'ફોન નંબર (વૈકલ્પિક)',
    save: 'સેવ કરો',
    saving: 'સેવ થઈ રહ્યું છે...',
    lastSeen: 'છેલ્લે અહીં જોયા',
    ago: 'પહેલા',
    reportLost: 'ખોવાઈ ગયાની જાણ કરો',
    loading: 'પરિવાર સભ્યો લોડ થઈ રહ્યા છે...',
    noMembers: 'હજુ સુધી કોઈ સભ્ય ઉમેર્યા નથી.',
    addFirst: 'તમારા પરિવારના સભ્યને ઉમેરો',
    error: 'સભ્યો લોડ થઈ શક્યા નથી',
    saveError: 'સેવ કરવામાં સમસ્યા આવી'
  }
};

// Mock location data for demo (simulating opt-in location tracking)
const mockLocations = [
  { location: 'Main Gate 1', time: '2' },
  { location: 'Sanctum Queue A', time: '5' },
  { location: 'Outer Courtyard', time: '10' },
  { location: 'North Parking', time: '15' },
  { location: 'Prasad Hall', time: '8' },
  { location: 'Near Ropeway', time: '3' }
];

export const Family = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', age: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [memberLocations, setMemberLocations] = useState({});

  useEffect(() => {
    fetchGroupMembers();
    
    // Simulate location updates every 30 seconds
    const interval = setInterval(() => {
      updateMockLocations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      
      // Fetch all group members linked to this pilgrim (both linked and unlinked to bookings)
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .order('created_at', { ascending: false });

      const defaultMembersList = [
        { id: 'gm_1', name: 'Varun Bansal', age: 28, phone: '+91 98765 43211' },
        { id: 'gm_2', name: 'Tanvi Agarwal', age: 26, phone: '+91 98765 43210' },
        { id: 'gm_3', name: 'Harshit Jain', age: 25, phone: '+91 98765 43212' },
        { id: 'gm_4', name: 'Lokesh Kasana', age: 27, phone: '+91 98765 43213' },
        { id: 'gm_5', name: 'Navya Agarwal', age: 24, phone: '+91 98765 43214' }
      ];

      const loaded = data && data.length > 0 ? data : defaultMembersList;
      setMembers(loaded);
      
      // Initialize locations from checkins or mock for each member
      const initialLocations = {};
      const checkpoints = [
        { id: 'cp_1', checkpoint_name: 'Okha Base Camp (Start)' },
        { id: 'cp_2', checkpoint_name: 'Aaram Grah Water Station' },
        { id: 'cp_3', checkpoint_name: 'Mithapur Rest Shelter' },
        { id: 'cp_4', checkpoint_name: 'Bhet Dwarka Gate Checkpoint' },
        { id: 'cp_5', checkpoint_name: 'Ambaji Temple Entry (Sanctum)' }
      ];

      loaded.forEach(member => {
        const checkins = JSON.parse(localStorage.getItem(`nirvighna_padyatri_checkins_${member.id}`) || '[]');
        if (checkins.length > 0) {
          const last = checkins[checkins.length - 1];
          const matched = checkpoints.find(c => c.id === last.checkpoint_id);
          if (matched) {
            initialLocations[member.id] = { location: matched.checkpoint_name, time: '1' };
            return;
          }
        }
        initialLocations[member.id] = mockLocations[Math.floor(Math.random() * mockLocations.length)];
      });
      setMemberLocations(initialLocations);
      
    } catch (err) {
      console.error('Error fetching group members:', err);
      const defaultMembersList = [
        { id: 'gm_1', name: 'Varun Bansal', age: 28, phone: '+91 98765 43211' },
        { id: 'gm_2', name: 'Tanvi Agarwal', age: 26, phone: '+91 98765 43210' },
        { id: 'gm_3', name: 'Harshit Jain', age: 25, phone: '+91 98765 43212' },
        { id: 'gm_4', name: 'Lokesh Kasana', age: 27, phone: '+91 98765 43213' },
        { id: 'gm_5', name: 'Navya Agarwal', age: 24, phone: '+91 98765 43214' }
      ];
      setMembers(defaultMembersList);
    } finally {
      setLoading(false);
    }
  };

  const updateMockLocations = () => {
    const updatedLocations = {};
    const checkpoints = [
      { id: 'cp_1', checkpoint_name: 'Okha Base Camp (Start)' },
      { id: 'cp_2', checkpoint_name: 'Aaram Grah Water Station' },
      { id: 'cp_3', checkpoint_name: 'Mithapur Rest Shelter' },
      { id: 'cp_4', checkpoint_name: 'Bhet Dwarka Gate Checkpoint' },
      { id: 'cp_5', checkpoint_name: 'Ambaji Temple Entry (Sanctum)' }
    ];

    members.forEach(member => {
      const checkins = JSON.parse(localStorage.getItem(`nirvighna_padyatri_checkins_${member.id}`) || '[]');
      if (checkins.length > 0) {
        const last = checkins[checkins.length - 1];
        const matched = checkpoints.find(c => c.id === last.checkpoint_id);
        if (matched) {
          updatedLocations[member.id] = { location: matched.checkpoint_name, time: '1' };
          return;
        }
      }
      updatedLocations[member.id] = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    });
    setMemberLocations(updatedLocations);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;

    setSaving(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('group_members')
        .insert({
          booking_id: null, // Will be linked when booking is created
          name: newMember.name,
          age: newMember.age ? parseInt(newMember.age) : null,
          phone: newMember.phone || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add mock location for new member
      setMemberLocations(prev => ({
        ...prev,
        [data.id]: mockLocations[Math.floor(Math.random() * mockLocations.length)]
      }));

      setMembers([data, ...members]);
      setNewMember({ name: '', age: '', phone: '' });
      setShowAddForm(false);
      
    } catch (err) {
      console.error('Error adding member:', err);
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleReportLost = (member) => {
    navigate('/lost-report', {
      state: {
        memberName: member.name,
        memberId: member.id
      }
    });
  };

  const getInitialsColor = (name) => {
    const colors = [
      'bg-maroon/15 text-maroon',
      'bg-amber-100 text-amber-800',
      'bg-emerald-100 text-emerald-800',
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="min-h-screen bg-ivory pb-28 pt-4 px-4 animate-page-in">
      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 hover:bg-maroon hover:text-white text-maroon transition-all cursor-pointer card-press"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold font-heading text-maroon flex items-center gap-2">
                👨‍👩‍👧‍👦 {t.familyGroup}
              </h1>
              <p className="text-[11px] text-gray-400 font-medium">
                {members.length} member{members.length !== 1 ? 's' : ''} in your group
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer card-press ${
              showAddForm
                ? 'bg-gray-100 text-gray-600'
                : 'bg-maroon text-white shadow-xs'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {t.addMember}
          </button>
        </div>

        {/* Add Member Form — slide down */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-gold/25 shadow-xs overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-maroon to-[#5F242C] px-4 py-3">
              <p className="text-xs font-extrabold text-white font-heading">✨ Add New Group Member</p>
            </div>
            <form onSubmit={handleAddMember} className="p-4 space-y-3">
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full px-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                placeholder={`👤 ${t.memberName}`}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={newMember.age}
                  onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                  className="w-full px-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                  placeholder={`🎂 ${t.memberAge}`}
                />
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-ivory border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold text-indigo-dark transition-all"
                  placeholder={`📞 ${t.memberPhone}`}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-maroon text-white rounded-xl text-xs font-bold hover:bg-[#5F242C] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl font-semibold">
            {error}
          </div>
        )}

        {/* Members List */}
        {members.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center border border-gray-100 shadow-xs">
            <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
            <p className="text-sm font-bold text-gray-700">{t.noMembers}</p>
            <p className="text-xs text-gray-400 mt-1">Your family members will appear here once added.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-maroon text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#5F242C] transition-all"
            >
              {t.addFirst} →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const location = memberLocations[member.id] || { location: 'Unknown', time: '--' };
              const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const colorClass = getInitialsColor(member.name);

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-gray-100 hover-warm overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${colorClass}`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm font-heading text-maroon truncate">{member.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                          {member.age && <span>{member.age} yrs</span>}
                          {member.age && member.phone && <span>•</span>}
                          {member.phone && <span className="font-mono">{member.phone}</span>}
                        </div>
                      </div>
                      {/* Live badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    </div>

                    {/* Last Seen */}
                    <div className="flex items-center gap-2 bg-amber-50/60 border border-amber-100 px-3 py-2 rounded-xl">
                      <MapPin className="w-3.5 h-3.5 text-maroon shrink-0" />
                      <span className="text-[11px] text-gray-600">
                        {t.lastSeen}: <span className="font-bold text-maroon">{location.location}</span>
                        <span className="text-gray-400 ml-1">• {location.time} min {t.ago}</span>
                      </span>
                    </div>

                    {/* Report Lost */}
                    <button
                      onClick={() => handleReportLost(member)}
                      className="w-full py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t.reportLost}
                    </button>
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


