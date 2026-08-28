import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, UserPlus, Phone, Heart, Users } from 'lucide-react';

export const SignupLogin = ({ onAuthSuccess }) => {
  const { language } = useAuth();
  const [showEmergency, setShowEmergency] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    emergencyName: '',
    emergencyPhone: '',
    members: []
  });

  const [memberInput, setMemberInput] = useState({ name: '', age: '', relation: '' });

  const handleAddMember = () => {
    if (memberInput.name) {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, memberInput]
      }));
      setMemberInput({ name: '', age: '', relation: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuthSuccess(formData);
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center p-4 bg-ivory">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-warm border border-maroon/10 overflow-hidden">
        {/* Shikhara Header Accent */}
        <div className="bg-maroon text-ivory p-6 text-center relative">
          <div className="w-12 h-12 mx-auto mb-3 bg-gold rounded-full flex items-center justify-center text-indigo-dark shadow-goldGlow">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold font-heading tracking-tight text-white">
            {language === 'hi' ? 'निर्विघ्न' : language === 'gu' ? 'નિર્વિઘ્ન' : 'Nirvighna'}
          </h2>
          <p className="text-gold text-xs mt-1 font-medium">
            {language === 'hi' ? 'सुरक्षित मंदिर दर्शन एवं भीड़ प्रबंधन' : 'Safe Pilgrimage & Queue Pass Portal'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Main User Fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Patel"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Mobile Number *
            </label>
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
            />
          </div>

          {/* Collapsible Section: Emergency Contact */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-ivory/50">
            <button
              type="button"
              onClick={() => setShowEmergency(!showEmergency)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-maroon hover:bg-ivory transition-all"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-alertRed" />
                Emergency Contact (Optional)
              </span>
              {showEmergency ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showEmergency && (
              <div className="p-4 space-y-3 bg-white border-t border-gray-200">
                <input
                  type="text"
                  placeholder="Emergency Contact Name"
                  value={formData.emergencyName}
                  onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-gold"
                />
                <input
                  type="tel"
                  placeholder="Emergency Phone Number"
                  value={formData.emergencyPhone}
                  onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-gold"
                />
              </div>
            )}
          </div>

          {/* Collapsible Section: Group Members */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-ivory/50">
            <button
              type="button"
              onClick={() => setShowMembers(!showMembers)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-maroon hover:bg-ivory transition-all"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" />
                Add Family / Group Members ({formData.members.length})
              </span>
              {showMembers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showMembers && (
              <div className="p-4 space-y-3 bg-white border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Member Name"
                    value={memberInput.name}
                    onChange={e => setMemberInput({ ...memberInput, name: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={memberInput.age}
                    onChange={e => setMemberInput({ ...memberInput, age: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-1.5 bg-gray-100 text-maroon font-semibold text-xs rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Add Member
                </button>

                {/* Member Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {formData.members.map((m, idx) => (
                    <span key={idx} className="bg-ivory text-maroon border border-gold/40 text-[11px] px-2.5 py-1 rounded-full font-medium">
                      {m.name} ({m.age || 'N/A'} yrs)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gold hover:bg-gold-dark text-indigo-dark font-bold font-heading rounded-xl shadow-goldGlow transition-all text-sm uppercase tracking-wider mt-2"
          >
            Create Account & Access Pass
          </button>
        </form>
      </div>
    </div>
  );
};
