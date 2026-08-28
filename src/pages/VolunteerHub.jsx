import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { emailService } from '../lib/emailService';
import { 
  CheckCircle, 
  HeartPulse, 
  AlertTriangle, 
  MessageSquareWarning,
  MapPin,
  Users,
  Clock,
  Loader2,
  ChevronRight,
  X,
  Phone,
  Lock,
  Unlock
} from 'lucide-react';

const translations = {
  en: {
    title: 'Volunteer Hub',
    subtitle: 'Quick actions for temple assistance',
    validEntry: 'Valid Entry',
    medicalAssist: 'Medical Assist Needed',
    priorityAssist: 'Priority Assistance',
    reportIssue: 'Report Issue',
    activeCases: 'Active Cases',
    noCases: 'No active cases',
    location: 'Location',
    status: 'Status',
    pending: 'Pending',
    enRoute: 'En Route',
    reached: 'Reached',
    resolved: 'Resolved',
    cancelled: 'Cancelled',
    assigned: 'Assigned',
    completed: 'Completed',
    medicalInfo: 'Medical Information',
    bloodGroup: 'Blood Group',
    allergies: 'Allergies',
    conditions: 'Conditions',
    showMedical: 'Show Medical Info',
    hideMedical: 'Hide Medical Info',
    alertSent: 'Alert sent to group members and emergency contacts',
    volunteerDispatched: 'Medical volunteer dispatched',
    updateStatus: 'Update Status',
    caseDetails: 'Case Details',
    pilgrimName: 'Pilgrim Name',
    bookingCode: 'Booking Code',
    groupMembers: 'Group Members',
    emergencyContact: 'Emergency Contact',
    callEmergency: 'Call Emergency Contact',
    notifyGroup: 'Notify Group Members',
    caseLogged: 'Case logged in Command Centre',
    cancel: 'Cancel',
    confirm: 'Confirm',
    footwearManagement: 'Footwear Management',
    lockerNumber: 'Locker Number',
    capacity: 'Capacity',
    currentCount: 'Current Count',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    tokenNumber: 'Token Number',
    scanToken: 'Scan Token',
    footwearCount: 'Footwear Count'
  },
  hi: {
    title: 'वॉलंटियर हब',
    subtitle: 'मंदिर सहायता के लिए त्वरित कार्य',
    validEntry: 'वैध प्रवेश',
    medicalAssist: 'चिकित्सा सहायता आवश्यक',
    priorityAssist: 'प्राथमिकता सहायता',
    reportIssue: 'समस्या रिपोर्ट करें',
    activeCases: 'सक्रिय मामले',
    noCases: 'कोई सक्रिय मामले नहीं',
    location: 'स्थान',
    status: 'स्थिति',
    pending: 'लंबित',
    enRoute: 'रास्ते में',
    reached: 'पहुंच गए',
    resolved: 'हल हो गया',
    cancelled: 'रद्द',
    assigned: 'सौंपा गया',
    completed: 'पूरा हो गया',
    medicalInfo: 'चिकित्सा जानकारी',
    bloodGroup: 'रक्त समूह',
    allergies: 'एलर्जी',
    conditions: 'स्थितियां',
    showMedical: 'चिकित्सा जानकारी दिखाएं',
    hideMedical: 'चिकित्सा जानकारी छिपाएं',
    alertSent: 'समूह सदस्यों और आपातकालीन संपर्कों को अलर्ट भेजा गया',
    volunteerDispatched: 'चिकित्सा स्वयंसेवक भेजा गया',
    updateStatus: 'स्थिति अपडेट करें',
    caseDetails: 'मामले का विवरण',
    pilgrimName: 'तीर्थयात्री का नाम',
    bookingCode: 'बुकिंग कोड',
    groupMembers: 'समूह सदस्य',
    emergencyContact: 'आपातकालीन संपर्क',
    callEmergency: 'आपातकालीन संपर्क करें',
    notifyGroup: 'समूह सदस्यों को सूचित करें',
    caseLogged: 'कमांड सेंटर में मामला लॉग किया गया',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    footwearManagement: 'जूता प्रबंधन',
    lockerNumber: 'लॉकर नंबर',
    capacity: 'क्षमता',
    currentCount: 'वर्तमान गणना',
    deposit: 'जमा',
    withdraw: 'निकासी',
    tokenNumber: 'टोकन नंबर',
    scanToken: 'टोकन स्कैन करें',
    footwearCount: 'जूते की संख्या'
  },
  gu: {
    title: 'વોલન્ટિયર હબ',
    subtitle: 'મંદિર સહાયતા માટે ઝડપી ક્રિયાઓ',
    validEntry: 'માન્ય પ્રવેશ',
    medicalAssist: 'તબીબી સહાયતા જરૂરી',
    priorityAssist: 'પ્રાથમિકતા સહાયતા',
    reportIssue: 'સમસ્યા રિપોર્ટ કરો',
    activeCases: 'સક્રિય કેસ',
    noCases: 'કોઈ સક્રિય કેસ નથી',
    location: 'સ્થાન',
    status: 'સ્થિતિ',
    pending: 'બાકી',
    enRoute: 'રસ્તામાં',
    reached: 'પહોંચ્યા',
    resolved: 'ઉકેલાયું',
    cancelled: 'રદ થયું',
    assigned: 'સોંપવામાં આવ્યું',
    completed: 'પૂર્ણ',
    medicalInfo: 'તબીબી માહિતી',
    bloodGroup: 'લોહી જૂથ',
    allergies: 'એલર્જી',
    conditions: 'સ્થિતિઓ',
    showMedical: 'તબીબી માહિતી બતાવો',
    hideMedical: 'તબીબી માહિતી છુપાવો',
    alertSent: 'જૂથ સભ્યો અને કટાવ સંપર્કોને ચેતવણી મોકલવામાં આવી',
    volunteerDispatched: 'તબીબી સ્વયંસેવક મોકલવામાં આવ્યા',
    updateStatus: 'સ્થિતિ અપડેટ કરો',
    caseDetails: 'કેસ વિગત',
    pilgrimName: 'તીર્થયાત્રીનું નામ',
    bookingCode: 'બુકિંગ કોડ',
    groupMembers: 'જૂથ સભ્યો',
    emergencyContact: 'કટાવ સંપર્ક',
    callEmergency: 'કટાવ સંપર્ક કરો',
    notifyGroup: 'જૂથ સભ્યોને સૂચિત કરો',
    caseLogged: 'કમાન્ડ સેન્ટરમાં કેસ લોગ થયો',
    cancel: 'રદ કરો',
    confirm: 'પુષ્ટિ કરો',
    footwearManagement: 'પગરખું મેનેજમેન્ટ',
    lockerNumber: 'લોકર નંબર',
    capacity: 'ક્ષમતા',
    currentCount: 'વર્તમાન ગણતરી',
    deposit: 'જમા',
    withdraw: 'ઉપાડવું',
    tokenNumber: 'ટોકન નંબર',
    scanToken: 'ટોકન સ્કેન કરો',
    footwearCount: 'પગરખું ગણતરી'
  }
};

export const VolunteerHub = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage];

  const [activeCases, setActiveCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);
  const [showActionModal, setShowActionModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [footwearLockers, setFootwearLockers] = useState([]);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [transactionType, setTransactionType] = useState('deposit');
  const [footwearCount, setFootwearCount] = useState(1);

  useEffect(() => {
    fetchActiveCases();
    fetchFootwearLockers();
    
    // Subscribe to real-time updates for medical cases
    const subscription = supabase
      .channel('medical_assistance_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_assistance_cases' }, payload => {
        fetchActiveCases();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  const fetchActiveCases = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_assistance_cases')
        .select(`
          *,
          bookings (shared_booking_code),
          users (full_name, phone)
        `)
        .in('status', ['pending', 'en_route', 'reached'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveCases(data || []);
    } catch (err) {
      console.error('Error fetching active cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFootwearLockers = async () => {
    try {
      const { data, error } = await supabase
        .from('footwear_lockers')
        .select('*')
        .eq('status', 'active')
        .order('locker_number');

      if (error) throw error;
      setFootwearLockers(data || []);
    } catch (err) {
      console.error('Error fetching lockers:', err);
    }
  };

  const handleMedicalAssist = async (bookingId, pilgrimId) => {
    setActionLoading(true);
    try {
      // Fetch pilgrim's medical info from users table
      const { data: pilgrimData, error: pilgrimError } = await supabase
        .from('users')
        .select('blood_group, medical_details')
        .eq('id', pilgrimId)
        .single();

      if (pilgrimError && pilgrimError.code !== 'PGRST116') throw pilgrimError;

      // Create medical assistance case with medical info
      const { data: caseData, error: caseError } = await supabase
        .from('medical_assistance_cases')
        .insert({
          booking_id: bookingId,
          pilgrim_id: pilgrimId,
          volunteer_id: currentUser.id,
          assistance_type: 'medical',
          status: 'en_route',
          location: 'Temple Premises',
          blood_group: pilgrimData?.blood_group,
          medical_notes: pilgrimData?.medical_details
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Fetch group members for this booking
      const { data: groupMembers, error: groupError } = await supabase
        .from('group_members')
        .select('user_id, name, phone, blood_group, medical_details')
        .eq('booking_id', bookingId);

      if (groupError) throw groupError;

      // Create notifications for group members with user accounts
      if (groupMembers && groupMembers.length > 0) {
        for (const member of groupMembers) {
          if (member.user_id) {
            await supabase.from('notifications').insert({
              user_id: member.user_id,
              type: 'emergency',
              title: 'Medical Assistance Alert',
              message: `Medical assistance has been requested for your group. Volunteer ${currentUser.full_name} is en route. Status: En Route`
            });
          }
        }
      }

      // Fetch emergency contact
      const { data: emergencyContact, error: emergencyError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('pilgrim_id', pilgrimId)
        .eq('is_primary', true)
        .single();

      // Create notification for pilgrim
      await supabase.from('notifications').insert({
        user_id: pilgrimId,
        type: 'emergency',
        title: 'Medical Assistance Dispatched',
        message: `Volunteer ${currentUser.full_name} has been dispatched to your location. Status: En Route`
      });

      // Send email notifications to emergency contact and group members
      if (emergencyContact || (groupMembers && groupMembers.length > 0)) {
        const emailResult = await emailService.sendMedicalAlert(bookingId, {
          patientName: pilgrimData?.full_name || 'Pilgrim',
          location: 'Temple Premises',
          condition: pilgrimData?.medical_details || 'Medical assistance requested',
          bloodGroup: pilgrimData?.blood_group || 'N/A'
        });

        if (emailResult.success) {
          console.log(`Email notifications sent: ${emailResult.emailsSent}/${emailResult.totalAttempts}`);
          if (emailResult.errors) {
            console.warn('Email errors:', emailResult.errors);
          }
        } else {
          console.error('Failed to send email notifications:', emailResult.error);
        }
      }

      // Also create in-app notification for emergency contact
      if (emergencyContact) {
        await supabase.from('notifications').insert({
          user_id: pilgrimId,
          type: 'emergency',
          title: 'Emergency Contact Alerted',
          message: `Your emergency contact ${emergencyContact.name} (${emergencyContact.phone}) has been notified via email`
        });
      }

      // Find and dispatch nearest medical-trained volunteer
      const { data: medicalVolunteers, error: volunteerError } = await supabase
        .from('volunteer_locations')
        .select('*')
        .eq('is_medical_trained', true)
        .eq('is_available', true)
        .limit(1);

      if (!volunteerError && medicalVolunteers && medicalVolunteers.length > 0) {
        const nearestVolunteer = medicalVolunteers[0];
        await supabase.from('notifications').insert({
          user_id: nearestVolunteer.volunteer_id,
          type: 'emergency',
          title: 'Medical Assistance Required',
          message: `Medical assistance needed at Temple Premises. Case ID: ${caseData.id}`
        });
        
        // Update case with dispatched volunteer
        await supabase
          .from('medical_assistance_cases')
          .update({ volunteer_id: nearestVolunteer.volunteer_id })
          .eq('id', caseData.id);
      }

      alert(`${t.alertSent}\n${t.volunteerDispatched}`);
      setShowActionModal(null);
      fetchActiveCases();
    } catch (err) {
      console.error('Error handling medical assist:', err);
      alert('Failed to process medical assistance request');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityAssist = async (bookingId, pilgrimId, assistanceType) => {
    setActionLoading(true);
    try {
      // Create priority assistance request
      const { data: caseData, error: caseError } = await supabase
        .from('priority_assistance')
        .insert({
          booking_id: bookingId,
          pilgrim_id: pilgrimId,
          assistance_type: assistanceType,
          status: 'pending',
          location: 'Temple Entrance'
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Find nearest available volunteer (any volunteer, not just medical-trained)
      const { data: availableVolunteers, error: volunteerError } = await supabase
        .from('volunteer_locations')
        .select('*')
        .eq('is_available', true)
        .order('last_updated', { ascending: false })
        .limit(1);

      if (!volunteerError && availableVolunteers && availableVolunteers.length > 0) {
        const nearestVolunteer = availableVolunteers[0];
        
        // Update request with assigned volunteer
        await supabase
          .from('priority_assistance')
          .update({ 
            volunteer_id: nearestVolunteer.volunteer_id,
            status: 'assigned'
          })
          .eq('id', caseData.id);

        // Notify volunteer with location
        await supabase.from('notifications').insert({
          user_id: nearestVolunteer.volunteer_id,
          type: 'emergency',
          title: `${assistanceType.charAt(0).toUpperCase() + assistanceType.slice(1)} Request`,
          message: `Priority ${assistanceType} requested at Temple Entrance. Case ID: ${caseData.id}. Please respond.`
        });

        // Update volunteer status
        await supabase
          .from('volunteer_locations')
          .update({ 
            is_available: false,
            current_status: 'responding'
          })
          .eq('volunteer_id', nearestVolunteer.volunteer_id);

        // Notify pilgrim
        await supabase.from('notifications').insert({
          user_id: pilgrimId,
          type: 'general',
          title: 'Volunteer Dispatched',
          message: `A volunteer has been assigned for your ${assistanceType} request. They are on their way.`
        });
      } else {
        // No volunteers available
        await supabase.from('notifications').insert({
          user_id: pilgrimId,
          type: 'general',
          title: 'No Volunteers Available',
          message: 'All volunteers are currently busy. Please wait or contact temple staff directly.'
        });
      }

      alert('Priority assistance request created. Nearest volunteer has been notified.');
      setShowActionModal(null);
    } catch (err) {
      console.error('Error handling priority assist:', err);
      alert('Failed to process priority assistance request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencyMedicalAssist = async (location, description) => {
    setActionLoading(true);
    try {
      // Create emergency medical case
      const { data: caseData, error: caseError } = await supabase
        .from('medical_assistance_cases')
        .insert({
          assistance_type: 'emergency',
          status: 'pending',
          location: location,
          medical_notes: description
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Find nearest medical-trained volunteer
      const { data: medicalVolunteers, error: volunteerError } = await supabase
        .from('volunteer_locations')
        .select('*')
        .eq('is_medical_trained', true)
        .eq('is_available', true)
        .order('last_updated', { ascending: false })
        .limit(1);

      if (!volunteerError && medicalVolunteers && medicalVolunteers.length > 0) {
        const nearestVolunteer = medicalVolunteers[0];
        
        // Update case with assigned volunteer
        await supabase
          .from('medical_assistance_cases')
          .update({ 
            volunteer_id: nearestVolunteer.volunteer_id,
            status: 'en_route'
          })
          .eq('id', caseData.id);

        // Notify volunteer with exact location
        await supabase.from('notifications').insert({
          user_id: nearestVolunteer.volunteer_id,
          type: 'emergency',
          title: 'EMERGENCY: Medical SOS',
          message: `Emergency medical assistance needed at ${location}. Description: ${description}. Case ID: ${caseData.id}. Respond immediately!`
        });

        // Update volunteer status
        await supabase
          .from('volunteer_locations')
          .update({ 
            is_available: false,
            current_status: 'responding'
          })
          .eq('volunteer_id', nearestVolunteer.volunteer_id);

        // Log to Command Centre (via notification to admin)
        const { data: adminUsers } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin');

        if (adminUsers) {
          for (const admin of adminUsers) {
            await supabase.from('notifications').insert({
              user_id: admin.id,
              type: 'emergency',
              title: 'Emergency Medical Case Logged',
              message: `Emergency medical case ${caseData.id} logged at ${location}. Volunteer ${nearestVolunteer.volunteer_id} dispatched.`
            });
          }
        }
      } else {
        // No medical volunteers available, alert all volunteers
        const { data: allVolunteers } = await supabase
          .from('volunteer_locations')
          .select('volunteer_id')
          .eq('is_available', true);

        if (allVolunteers) {
          for (const volunteer of allVolunteers) {
            await supabase.from('notifications').insert({
              user_id: volunteer.volunteer_id,
              type: 'emergency',
              title: 'EMERGENCY: Medical SOS',
              message: `Emergency medical assistance needed at ${location}. All available volunteers please respond!`
            });
          }
        }
      }

      alert('Emergency medical case logged. Nearest medical-trained volunteer has been auto-notified.');
      setShowActionModal(null);
      fetchActiveCases();
    } catch (err) {
      console.error('Error handling emergency medical assist:', err);
      alert('Failed to process emergency medical assistance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLostPersonSearch = async (caseId) => {
    setActionLoading(true);
    try {
      // Update case status to show volunteer is searching
      const { error: updateError } = await supabase
        .from('lost_found_cases')
        .update({ 
          status: 'searching',
          last_seen_time: new Date().toISOString()
        })
        .eq('id', caseId);

      if (updateError) throw updateError;

      // Notify nearby volunteers (in real implementation, this would be location-based)
      const { data: nearbyVolunteers } = await supabase
        .from('volunteer_locations')
        .select('volunteer_id')
        .eq('is_available', true)
        .limit(5);

      if (nearbyVolunteers) {
        for (const volunteer of nearbyVolunteers) {
          await supabase.from('notifications').insert({
            user_id: volunteer.volunteer_id,
            type: 'emergency',
            title: 'Lost Person Alert',
            message: `Lost person case ${caseId}. Please assist in search. Check notifications for details.`
          });
        }
      }

      alert('Search initiated. Nearby volunteers have been notified.');
    } catch (err) {
      console.error('Error handling lost person search:', err);
      alert('Failed to initiate search');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLostPersonFound = async (caseId, pilgrimId) => {
    setActionLoading(true);
    try {
      // Update case status to found
      const { error: updateError } = await supabase
        .from('lost_found_cases')
        .update({ status: 'found' })
        .eq('id', caseId);

      if (updateError) throw updateError;

      // Notify pilgrim
      await supabase.from('notifications').insert({
        user_id: pilgrimId,
        type: 'general',
        title: 'Family Reunified',
        message: 'Good news! The lost person has been found and reunited with family.'
      });

      // Notify all volunteers who were searching
      const { data: volunteers } = await supabase
        .from('volunteer_locations')
        .select('volunteer_id')
        .eq('current_status', 'assisting');

      if (volunteers) {
        for (const volunteer of volunteers) {
          await supabase.from('notifications').insert({
            user_id: volunteer.volunteer_id,
            type: 'general',
            title: 'Lost Person Found',
            message: `Case ${caseId} resolved. Person found and reunited. Thank you for your assistance.`
          });
        }
      }

      alert('Case marked as resolved. Pilgrim has been notified.');
    } catch (err) {
      console.error('Error handling lost person found:', err);
      alert('Failed to update case status');
    } finally {
      setActionLoading(false);
    }
  };

  const updateCaseStatus = async (caseId, newStatus) => {
    try {
      const { error } = await supabase
        .from('medical_assistance_cases')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) throw error;
      fetchActiveCases();
    } catch (err) {
      console.error('Error updating case status:', err);
      alert('Failed to update status');
    }
  };

  const handleFootwearTransaction = async () => {
    if (!selectedLocker || !tokenInput) {
      alert('Please select a locker and enter token number');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('footwear_transactions')
        .insert({
          locker_id: selectedLocker.id,
          pilgrim_id: currentUser?.id,
          token_number: tokenInput,
          transaction_type: transactionType,
          footwear_count: footwearCount,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update locker count
      const countChange = transactionType === 'deposit' ? footwearCount : -footwearCount;
      const { error: lockerError } = await supabase
        .from('footwear_lockers')
        .update({
          current_count: selectedLocker.current_count + countChange,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLocker.id);

      if (lockerError) throw lockerError;

      alert('Transaction completed successfully');
      setSelectedLocker(null);
      setTokenInput('');
      setFootwearCount(1);
      fetchFootwearLockers();
    } catch (err) {
      console.error('Error processing transaction:', err);
      alert('Failed to process transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'en_route': return 'bg-blue-100 text-blue-700';
      case 'reached': return 'bg-purple-100 text-purple-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-ivory/50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-maroon/90 text-white px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold font-heading">{t.title}</h1>
        <p className="text-white/80 text-sm mt-1">{t.subtitle}</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Action Menu */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowActionModal('valid_entry')}
            className="bg-white rounded-2xl p-4 shadow-warm hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-sm text-gray-800">{t.validEntry}</h3>
          </button>

          <button
            onClick={() => setShowActionModal('medical_assist')}
            className="bg-white rounded-2xl p-4 shadow-warm hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
              <HeartPulse className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-sm text-gray-800">{t.medicalAssist}</h3>
          </button>

          <button
            onClick={() => setShowActionModal('priority_assist')}
            className="bg-white rounded-2xl p-4 shadow-warm hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-sm text-gray-800">{t.priorityAssist}</h3>
          </button>

          <button
            onClick={() => setShowActionModal('emergency_medical')}
            className="bg-white rounded-2xl p-4 shadow-warm hover:shadow-lg transition-shadow border-2 border-red-300"
          >
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-3">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-sm text-red-600">Emergency SOS</h3>
          </button>

          <button
            onClick={() => setShowActionModal('lost_person')}
            className="bg-white rounded-2xl p-4 shadow-warm hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-sm text-gray-800">Lost Person</h3>
          </button>

          <button
            onClick={() => setShowActionModal('report_issue')}
            className="bg-white rounded-2xl p-4 shadow-warm hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <MessageSquareWarning className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="font-bold text-sm text-gray-800">{t.reportIssue}</h3>
          </button>
        </div>

        {/* Active Cases */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t.activeCases}</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-maroon" />
            </div>
          ) : activeCases.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-warm">
              <p className="text-gray-500 text-sm">{t.noCases}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="bg-white rounded-2xl p-4 shadow-warm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-maroon">{caseItem.users?.full_name || 'Unknown'}</h3>
                      {caseItem.bookings && (
                        <p className="text-xs text-gray-500">{t.bookingCode}: {caseItem.bookings.shared_booking_code}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(caseItem.status)}`}>
                      {t[caseItem.status] || caseItem.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{caseItem.location || 'Temple Premises'}</span>
                  </div>

                  {/* Medical Info - Privacy Protected */}
                  <div className="bg-ivory rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">{t.medicalInfo}</span>
                      <button
                        onClick={() => setShowMedicalInfo(!showMedicalInfo)}
                        className="text-maroon text-xs flex items-center gap-1"
                      >
                        {showMedicalInfo ? (
                          <>
                            <Lock className="w-3 h-3" />
                            {t.hideMedical}
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            {t.showMedical}
                          </>
                        )}
                      </button>
                    </div>

                    {showMedicalInfo && (
                      <div className="space-y-1 text-xs">
                        {caseItem.blood_group && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.bloodGroup}:</span>
                            <span className="font-semibold">{caseItem.blood_group}</span>
                          </div>
                        )}
                        {caseItem.allergies && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.allergies}:</span>
                            <span className="font-semibold">{caseItem.allergies}</span>
                          </div>
                        )}
                        {caseItem.conditions && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.conditions}:</span>
                            <span className="font-semibold">{caseItem.conditions}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  <div className="flex gap-2">
                    <select
                      value={caseItem.status}
                      onChange={(e) => updateCaseStatus(caseItem.id, e.target.value)}
                      className="flex-1 px-3 py-2 bg-ivory border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-maroon"
                    >
                      <option value="pending">{t.pending}</option>
                      <option value="en_route">{t.enRoute}</option>
                      <option value="reached">{t.reached}</option>
                      <option value="resolved">{t.resolved}</option>
                      <option value="cancelled">{t.cancelled}</option>
                    </select>
                    <button
                      onClick={() => setSelectedCase(caseItem)}
                      className="px-3 py-2 bg-maroon text-white rounded-lg text-xs font-bold hover:bg-maroon/90"
                    >
                      {t.caseDetails}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footwear Management */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t.footwearManagement}</h2>
          <div className="grid grid-cols-2 gap-3">
            {footwearLockers.map((locker) => (
              <button
                key={locker.id}
                onClick={() => setSelectedLocker(locker)}
                className={`bg-white rounded-2xl p-4 shadow-warm hover:shadow-lg transition-shadow ${
                  selectedLocker?.id === locker.id ? 'ring-2 ring-maroon' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-maroon">{locker.locker_number}</span>
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>{t.capacity}:</span>
                    <span className="font-semibold">{locker.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.currentCount}:</span>
                    <span className="font-semibold">{locker.current_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedLocker && (
            <div className="mt-4 bg-white rounded-2xl p-4 shadow-warm">
              <h3 className="font-bold text-maroon mb-3">{t.lockerNumber}: {selectedLocker.locker_number}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.tokenNumber}</label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full px-4 py-2 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                    placeholder="Enter token"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.footwearCount}</label>
                  <input
                    type="number"
                    value={footwearCount}
                    onChange={(e) => setFootwearCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max={selectedLocker.capacity - selectedLocker.current_count}
                    className="w-full px-4 py-2 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransactionType('deposit')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      transactionType === 'deposit' 
                        ? 'bg-maroon text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {t.deposit}
                  </button>
                  <button
                    onClick={() => setTransactionType('withdraw')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      transactionType === 'withdraw' 
                        ? 'bg-maroon text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {t.withdraw}
                  </button>
                </div>
                <button
                  onClick={handleFootwearTransaction}
                  disabled={actionLoading}
                  className="w-full py-2 bg-gold text-indigo-dark rounded-lg font-bold text-sm hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                      Processing...
                    </>
                  ) : (
                    t.scanToken
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-maroon">
                {showActionModal === 'medical_assist' ? t.medicalAssist :
                 showActionModal === 'priority_assist' ? t.priorityAssist :
                 showActionModal === 'valid_entry' ? t.validEntry :
                 showActionModal === 'emergency_medical' ? 'Emergency Medical SOS' :
                 showActionModal === 'lost_person' ? 'Lost Person Search' :
                 t.reportIssue}
              </h3>
              <button
                onClick={() => setShowActionModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showActionModal === 'medical_assist' && (
              <>
                <p className="text-sm text-gray-600">
                  Scan QR code or enter booking code to request medical assistance
                </p>
                <input
                  type="text"
                  placeholder="Enter booking code or scan QR"
                  className="w-full px-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-maroon"
                />
              </>
            )}

            {showActionModal === 'priority_assist' && (
              <>
                <p className="text-sm text-gray-600">
                  Select assistance type and enter booking code
                </p>
                <select
                  className="w-full px-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-maroon"
                >
                  <option value="wheelchair">Wheelchair</option>
                  <option value="escort">Escort</option>
                  <option value="priority_entry">Priority Entry</option>
                </select>
                <input
                  type="text"
                  placeholder="Enter booking code or scan QR"
                  className="w-full px-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-maroon"
                />
              </>
            )}

            {showActionModal === 'emergency_medical' && (
              <>
                <p className="text-sm text-red-600 font-semibold">
                  ⚠️ EMERGENCY: This will auto-notify nearest medical-trained volunteer
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Exact location (e.g., Main Gate, Temple Entrance)"
                    className="w-full px-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-maroon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Describe the emergency situation"
                    className="w-full px-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-maroon"
                    rows={3}
                  />
                </div>
              </>
            )}

            {showActionModal === 'lost_person' && (
              <>
                <p className="text-sm text-gray-600">
                  Enter lost person case ID to initiate search
                </p>
                <input
                  type="text"
                  placeholder="Enter case ID"
                  className="w-full px-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-maroon"
                />
              </>
            )}

            {(showActionModal === 'valid_entry' || showActionModal === 'report_issue') && (
              <>
                <p className="text-sm text-gray-600">
                  Scan QR code or enter booking code to proceed
                </p>
                <input
                  type="text"
                  placeholder="Enter booking code or scan QR"
                  className="w-full px-4 py-3 bg-ivory border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-maroon"
                />
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowActionModal(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  // In real implementation, this would process the input
                  setShowActionModal(null);
                }}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-gold text-indigo-dark rounded-xl text-xs font-bold hover:bg-gold-dark transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                    Processing...
                  </>
                ) : (
                  t.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-maroon">{t.caseDetails}</h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500">{t.pilgrimName}</span>
                <p className="font-semibold">{selectedCase.users?.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t.bookingCode}</span>
                <p className="font-semibold">{selectedCase.bookings?.shared_booking_code}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t.location}</span>
                <p className="font-semibold">{selectedCase.location}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t.status}</span>
                <p className="font-semibold">{t[selectedCase.status]}</p>
              </div>

              {selectedCase.medical_notes && (
                <div>
                  <span className="text-xs text-gray-500">Medical Notes</span>
                  <p className="font-semibold">{selectedCase.medical_notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCase(null)}
              className="w-full py-2.5 bg-maroon text-white rounded-xl text-xs font-bold hover:bg-maroon/90 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
