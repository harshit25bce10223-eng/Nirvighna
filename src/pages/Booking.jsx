import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAllottedGate, getUniqueTemples, MASTER_TEMPLES, getLocalizedTemple } from '../lib/templeRegistry';
import { NirvighnaAIEngine } from '../lib/aiCrowdEngine';
import { melaEngine } from '../lib/melaEngine';
import { panchangCalendarEngine } from '../lib/panchangCalendarEngine';
import { cctvHeatmapService } from '../lib/cctvHeatmapService';
import { broadcastBookingToVolunteers } from '../lib/volunteerEngine';
import { issueSignedToken } from '../lib/signedTokenEngine';
import { sendPilgrimNotification } from '../lib/notificationService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { CalendarModal } from '../components/CalendarModal';
import { NirvighnaLoader } from '../components/NirvighnaLoader';
import { Calendar, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Check, X, Phone, User, Plus, Shield, ChevronDown, ChevronUp, Users, HeartHandshake } from 'lucide-react';

const translations = {
  en: {
    back: 'Back',
    selectDate: 'Select Date',
    general: 'General',
    vip: 'VIP',
    available: 'Available',
    fillingFast: 'Filling Fast',
    full: 'Full',
    priorityAssist: 'Request Priority Fast-Track Access',
    priorityAssistDesc: 'Fast-Track line for Seniors, Expecting Mothers & Differently Abled',
    priorityRule: 'Priority Line Rule: Only 1 accompanying family member / attendant is permitted per priority pass holder.',
    priorityCategoryLabel: 'Priority Category',
    seniorCitizen: 'Senior Citizen',
    pregnantWoman: 'Pregnant Woman',
    differentlyAbled: 'Differently Abled',
    whoNeedsPriority: 'Select member(s) requesting Priority Darshan:',
    whoNeedsPriorityDesc: 'You can select multiple members. Each priority holder can have 1 accompanying attendant.',
    priorityPassHolderBadge: 'Priority Pass Holder',
    accompanyingQuestion: 'Who will accompany {name} in the Priority Lane?',
    accompanyingDesc: 'Choose 1 person to assist {name} (or select Solo if proceeding alone):',
    soloOption: 'Solo (Will proceed alone in Priority Lane)',
    attendantForBadge: 'Attendant for {name}',
    generalLaneNote: 'Pilgrims not in Priority or Attendant roles will proceed via General Darshan Queue.',
    free: 'Free (₹0)',
    wheelchairAssist: 'Add Dedicated Wheelchair Assist',
    wheelchairAssistDesc: 'Includes Dedicated Sevak escort at Gate',
    wheelchairFeeText: '+₹51',
    wheelchairDetails: 'Wheelchair Recipient Details',
    recipientName: 'Recipient Full Name',
    age: 'Age',
    assistanceReason: 'Assistance Reason',
    reasonSenior: 'Senior Citizen (65+)',
    reasonDisabled: 'Locomotor Disability',
    reasonInjury: 'Temporary Leg Injury / Illness',
    reasonPregnant: 'Expecting Mother',
    audioNavigation: 'Enable Audio Navigation',
    audioNavigationDesc: 'Get step-by-step spoken guidance to the temple sanctum',
    confirmBooking: 'Confirm Booking',
    confirming: 'Confirming...',
    selectSlot: 'Please select a time slot',
    bookingError: 'Booking failed. Please try again.',
    success: 'Booking confirmed!',
    insightTitle: 'Crowd Insight',
    insightSuggestion: 'Consider visiting another temple with lower crowd density.',
    loadingTemple: 'Loading temple details...',
    loadingSlots: 'Loading available slots...',
    noSlots: 'No slots available for this date',
    yourDetails: 'Your Details',
    yourPhone: 'Your Phone Number',
    yourPhonePlaceholder: '+91 XXXXX XXXXX',
    emergencyContact: 'Emergency Contact',
    emergencyName: 'Contact Name',
    emergencyPhone: 'Contact Phone',
    addMembers: 'Add Family Members',
    savedMembersHeader: '1-Click Add Saved Members',
    memberName: 'Member Name',
    memberAge: 'Age',
    memberPhone: 'Member Phone',
    memberEmail: 'Member Email',
    addMember: 'Add Member',
    bloodGroup: 'Blood Group',
    medicalDetails: 'Medical Details',
    bloodGroupPlaceholder: 'A+, B+, O+, etc.',
    medicalDetailsPlaceholder: 'Any medical conditions or allergies',
    bloodGroupRequired: 'Blood group is required',
    medicalDetailsRequired: 'Medical details are required',
    verifyEmail: 'Verify Email',
    emailVerified: 'Email Verified',
    sendOtp: 'Send OTP',
    verifyOtp: 'Verify OTP',
    otpSent: 'OTP sent to email',
    otpVerified: 'OTP verified successfully',
    otpError: 'OTP verification failed',
    enterOtp: 'Enter OTP',
    resendOtp: 'Resend OTP',
    bookingSummary: 'Booking Summary',
    totalPayable: 'Total Amount Payable',
    payAndConfirm: 'Pay & Confirm Booking',
    selectedDateLabel: 'Selected Date',
    changeDate: 'Change Date →',
    timeSlots: 'Time Slots',
    booked: 'booked',
    darshanForecast: 'Darshan Forecast',
    sacredEvent: 'Aarti / Special Event',
    expectedRush: 'Expected Rush',
    adviceLabel: '💡 Advice:',
    aiSmartGate: 'AI Smart Gate Optimization',
    savesMins: 'Saves',
    mins: 'Mins',
    rushLabel: 'Rush',
    fastCorridor: 'Fast Corridor:',
    loadLabel: 'load',
    autoAssignedPass: 'Your digital pass is auto-assigned to the fastest corridor for seamless entry.',
    selectTempleLabel: 'Select Temple to Book Darshan',
    aartiGateInfo: 'Aarti & Gate Schedule',
    liveGateAllotment: 'Live Gate Allotment',
    officialAartiSchedule: 'Official Aarti Schedule',
    assignedEntryGate: 'Assigned Entry Gate',
    openCalendar: '📅 Open Full Calendar',
    govIdType: 'Government ID Type (Optional)',
    selectIdType: 'Select ID type shown at counter',
    govIdNotice: 'For offline counter verification only. ID number is never stored.',
    voterId: 'Voter ID Card',
    drivingLicense: 'Driving License',
    passport: 'Passport',
    panCard: 'PAN Card',
    familyGroupTitle: 'Family & Group Members',
    membersAdded: 'Added',
    addNewMemberBtn: 'Add New Family Member',
    addMahaprasad: '🍲 Add Temple Mahaprasad Token (Optional)',
    mahaprasadDesc: 'Collect free or laddu prasad box up to 2 hrs before slot',
    selectedBadge: 'Selected',
    optionalBadge: 'Optional',
    nishulkAnnakshetra: 'Nishulk Annakshetra',
    freePrasad: 'FREE',
    specialLadduBox: 'Special Laddu Box',
    ladduBoxPrice: '+₹51 / box',
    slotTypeLabel: 'Slot Type',
    passesLabel: 'Passes',
    pilgrimsLabel: 'Pilgrim',
    priorityFastTrackLine: 'Priority Fast-Track Line',
    dedicatedWheelchairEscort: 'Dedicated Wheelchair Escort (Gate 2)',
    primaryPilgrimSelf: 'Primary Pilgrim (You)',
    melaModeActive: 'Mode Active',
    safetyTrackOpen: 'Safety Track Open',
    melaPadyatriDesc: 'Walking pilgrims do not need a slot booking pass. Track your walking safety checkpoints instead.',
    viewPadyatriRoute: 'View Padyatri Route Instead →'
  },
  hi: {
    back: 'वापस',
    selectDate: 'दर्शन तिथि चुनें',
    general: 'सामान्य दर्शन',
    vip: 'वीआईपी (VIP)',
    available: 'उपलब्ध',
    fillingFast: 'तेजी से भर रहा है',
    full: 'स्लॉट भरा हुआ',
    priorityAssist: 'प्राथमिकता फास्ट-ट्रैक पहुंच का अनुरोध करें',
    priorityAssistDesc: 'वरिष्ठ नागरिकों, गर्भवती महिलाओं एवं दिव्यांगों हेतु फास्ट-ट्रैक कतार',
    priorityRule: 'प्राथमिकता कतार नियम: प्रति प्राथमिकता पास धारक केवल 1 साथ आने वाले परिजन / परिचारक की अनुमति है।',
    priorityCategoryLabel: 'प्राथमिकता श्रेणी',
    seniorCitizen: 'वरिष्ठ नागरिक',
    pregnantWoman: 'गर्भवती महिला',
    differentlyAbled: 'दिव्यांग',
    whoNeedsPriority: 'उन सदस्यों का चयन करें जिन्हें प्राथमिकता दर्शन चाहिए:',
    whoNeedsPriorityDesc: 'आप एक से अधिक सदस्य चुन सकते हैं। प्रत्येक प्राथमिकता धारक के साथ 1 परिचारक जा सकता है।',
    priorityPassHolderBadge: 'प्राथमिकता पास धारक',
    accompanyingQuestion: '{name} के साथ प्राथमिकता कतार में कौन जाएगा?',
    accompanyingDesc: '{name} की सहायता हेतु 1 व्यक्ति चुनें (या अकेले प्रवेश हेतु सोलो चुनें):',
    soloOption: 'अकेले (प्राथमिकता कतार में अकेले प्रवेश करेंगे)',
    attendantForBadge: '{name} के परिचारक',
    generalLaneNote: 'प्राथमिकता या परिचारक के अलावा अन्य सदस्य सामान्य दर्शन कतार से प्रवेश करेंगे।',
    free: 'निःशुल्क (₹0)',
    wheelchairAssist: 'समर्पित व्हीलचेयर सेवा जोड़ें',
    wheelchairAssistDesc: 'गेट पर समर्पित सेवक / स्वयंसेवक सहायता शामिल है',
    wheelchairFeeText: '+₹51 सेवा शुल्क',
    wheelchairDetails: 'व्हीलचेयर लाभार्थी का विवरण',
    recipientName: 'लाभार्थी का पूरा नाम',
    age: 'आयु',
    assistanceReason: 'सहायता का कारण',
    reasonSenior: 'वरिष्ठ नागरिक (65+)',
    reasonDisabled: 'शारीरिक दिव्यांगता',
    reasonInjury: 'अस्थायी पैर की चोट / अस्वस्थता',
    reasonPregnant: 'गर्भवती महिला',
    audioNavigation: 'ऑडियो नेविगेशन सक्षम करें',
    audioNavigationDesc: 'मंदिर गर्भगृह तक चरण-दर-चरण वॉयस मार्गदर्शन प्राप्त करें',
    confirmBooking: 'बुकिंग की पुष्टि करें',
    confirming: 'पुष्टि हो रही है...',
    selectSlot: 'कृपया एक समय स्लॉट चुनें',
    bookingError: 'बुकिंग विफल। कृपया पुनः प्रयास करें।',
    success: 'बुकिंग की पुष्टि हो गई!',
    insightTitle: 'भीड़ अंतर्दृष्टि एवं सुझाव',
    insightSuggestion: 'कम भीड़ वाले अन्य मंदिर की यात्रा पर विचार करें।',
    loadingTemple: 'मंदिर विवरण लोड हो रहा है...',
    loadingSlots: 'उपलब्ध स्लॉट लोड हो रहे हैं...',
    noSlots: 'इस तारीख के लिए कोई स्लॉट उपलब्ध नहीं',
    yourDetails: 'श्रद्धालु विवरण',
    yourPhone: 'आपका मोबाइल नंबर',
    yourPhonePlaceholder: '+91 XXXXX XXXXX',
    emergencyContact: 'आपातकालीन संपर्क',
    emergencyName: 'संपर्क व्यक्ति का नाम',
    emergencyPhone: 'आपातकालीन फोन नंबर',
    addMembers: 'परिवार के सदस्य जोड़ें',
    savedMembersHeader: '1-क्लिक में सहेजे गए सदस्य जोड़ें',
    memberName: 'सदस्य का नाम',
    memberAge: 'आयु (वर्ष)',
    memberPhone: 'सदस्य का फोन',
    memberEmail: 'सदस्य का ईमेल',
    addMember: 'सदस्य जोड़ें',
    removeMember: 'हटाएं',
    phoneRequired: 'फोन नंबर आवश्यक है',
    emergencyNameRequired: 'आपातकालीन संपर्क नाम आवश्यक है',
    emergencyPhoneRequired: 'आपातकालीन संपर्क फोन आवश्यक है',
    memberNameRequired: 'सदस्य का नाम आवश्यक है',
    memberPhoneRequired: 'सदस्य का फोन आवश्यक है',
    memberEmailRequired: 'सदस्य का ईमेल आवश्यक है',
    bloodGroup: 'रक्त समूह',
    medicalDetails: 'चिकित्सा विवरण / स्वास्थ्य स्थिति',
    bloodGroupPlaceholder: 'A+, B+, O+, आदि',
    medicalDetailsPlaceholder: 'कोई चिकित्सा स्थिति या एलर्जी',
    bloodGroupRequired: 'रक्त समूह आवश्यक है',
    medicalDetailsRequired: 'चिकित्सा विवरण आवश्यक है',
    verifyEmail: 'ईमेल सत्यापित करें',
    emailVerified: 'ईमेल सत्यापित',
    sendOtp: 'OTP भेजें',
    verifyOtp: 'OTP सत्यापित करें',
    otpSent: 'OTP ईमेल पर भेजा गया',
    otpVerified: 'OTP सफलतापूर्वक सत्यापित',
    otpError: 'OTP सत्यापन विफल',
    enterOtp: 'OTP दर्ज करें',
    resendOtp: 'OTP पुनः भेजें',
    bookingSummary: 'दर्शन बुकिंग सारांश',
    totalPayable: 'कुल देय राशि',
    payAndConfirm: 'भुगतान करें और बुकिंग पक्की करें',
    selectedDateLabel: 'चयनित तिथि',
    changeDate: 'तारीख बदलें →',
    timeSlots: 'समय स्लॉट',
    booked: 'बुक किए गए',
    darshanForecast: 'दर्शन पूर्वानुमान',
    sacredEvent: 'आरती / पावन पर्व',
    expectedRush: 'अपेक्षित भीड़',
    adviceLabel: '💡 दिव्य सुझाव:',
    aiSmartGate: 'AI स्मार्ट गेट अनुकूलन',
    savesMins: 'बचत',
    mins: 'मिनट',
    rushLabel: 'भीड़',
    fastCorridor: 'तीव्र कॉरिडोर:',
    loadLabel: 'लोड',
    autoAssignedPass: 'सुगम प्रवेश के लिए आपका डिजिटल पास स्वचालित रूप से सबसे तेज कॉरिडोर को सौंपा गया है।',
    selectTempleLabel: 'दर्शन हेतु मंदिर चुनें',
    aartiGateInfo: 'पावन आरती एवं गेट जानकारी',
    liveGateAllotment: 'लाइव गेट आवंटन',
    officialAartiSchedule: 'आधिकारिक आरती समय',
    assignedEntryGate: 'आवंटित प्रवेश द्वार',
    openCalendar: '📅 पूरा कैलेंडर खोलें',
    govIdType: 'सरकारी पहचान पत्र का प्रकार (वैकल्पिक)',
    selectIdType: 'काउंटर पर दिखाया जाने वाला ID प्रकार चुनें',
    govIdNotice: 'केवल ऑफलाइन काउंटर सत्यापन के लिए। ID नंबर कभी संग्रहीत नहीं किया जाता है।',
    voterId: 'मतदाता पहचान पत्र (Voter ID)',
    drivingLicense: 'ड्राइविंग लाइसेंस',
    passport: 'पासपोर्ट',
    panCard: 'पैन कार्ड (PAN Card)',
    familyGroupTitle: 'परिवार एवं समूह के सदस्य',
    membersAdded: 'जोड़े गए',
    addNewMemberBtn: 'नया परिवार सदस्य जोड़ें',
    addMahaprasad: '🍲 मंदिर महाप्रसाद टोकन जोड़ें (वैकल्पिक)',
    mahaprasadDesc: 'स्लॉट से 2 घंटे पहले तक निःशुल्क या लड्डू प्रसाद बॉक्स प्राप्त करें',
    selectedBadge: 'चयनित',
    optionalBadge: 'वैकल्पिक',
    nishulkAnnakshetra: 'निःशुल्क अन्नक्षेत्र',
    freePrasad: 'मुफ़्त',
    specialLadduBox: 'विशेष लड्डू प्रसाद बॉक्स',
    ladduBoxPrice: '+₹51 / बॉक्स',
    slotTypeLabel: 'स्लॉट का प्रकार',
    passesLabel: 'दर्शन पास',
    pilgrimsLabel: 'श्रद्धालु',
    priorityFastTrackLine: 'प्राथमिकता फास्ट-ट्रैक कतार',
    dedicatedWheelchairEscort: 'समर्पित व्हीलचेयर सेवा (गेट 2)',
    primaryPilgrimSelf: 'मुख्य श्रद्धालु (आप)',
    melaModeActive: 'मोड सक्रिय',
    safetyTrackOpen: 'सुरक्षा ट्रैक खुला है',
    melaPadyatriDesc: 'पैदल (पदयात्री) श्रद्धालुओं को स्लॉट बुकिंग पास की आवश्यकता नहीं है। इसके बजाय अपने सुरक्षा चेकपॉइंट ट्रैक करें।',
    viewPadyatriRoute: 'पदयात्री रूट देखें →'
  },
  gu: {
    back: 'પાછા જાઓ',
    selectDate: 'દર્શન તારીખ પસંદ કરો',
    general: 'સામાન્ય દર્શન',
    vip: 'VIP દર્શન',
    available: 'ઉપલબ્ધ',
    fillingFast: 'ઝડપથી ભરાઈ રહ્યું છે',
    full: 'સ્લોટ પૂર્ણ ભરાયેલ',
    priorityAssist: 'પ્રાથમિકતા ફાસ્ટ-ટ્રેક સુવિધા મેળવો',
    priorityAssistDesc: 'વરિષ્ઠ નાગરિકો, સગર્ભા મહિલાઓ અને દિવ્યાંગો માટે ફાસ્ટ-ટ્રેક લાઇન',
    priorityRule: 'પ્રાથમિકતા લાઇન નિયમ: પ્રાથમિકતા પાસ ધારક દીઠ માત્ર 1 સાથે આવનાર પરિવારના સભ્ય / સહાયકને પરવાનગી છે.',
    priorityCategoryLabel: 'પ્રાથમિકતા શ્રેણી',
    seniorCitizen: 'વરિષ્ઠ નાગરિક',
    pregnantWoman: 'સગર્ભા મહિલા',
    differentlyAbled: 'દિવ્યાંગ',
    whoNeedsPriority: 'પ્રાથમિકતા દર્શનની જરૂર હોય તેવા સભ્યો પસંદ કરો:',
    whoNeedsPriorityDesc: 'તમે એકથી વધુ સભ્યો પસંદ કરી શકો છો. દરેક પ્રાથમિકતા ધારક સાથે ૧ સહાયક જઈ શકે છે.',
    priorityPassHolderBadge: 'પ્રાથમિકતા પાસ ધારક',
    accompanyingQuestion: '{name} સાથે પ્રાથમિકતા લાઇનમાં કોણ જશે?',
    accompanyingDesc: '{name}ની મદદ માટે ૧ વ્યક્તિ પસંદ કરો (અથવા એકલા જવા સોલો પસંદ કરો):',
    soloOption: 'એકલા (પ્રાથમિકતા લાઇનમાં એકલા પ્રવેશ કરશે)',
    attendantForBadge: '{name}ના સહાયક',
    generalLaneNote: 'પ્રાથમિકતા અથવા સહાયક સિવાયના અન્ય સભ્યો સામાન્ય દર્શન લાઇનથી પ્રવેશ કરશે.',
    free: 'મફત (₹0)',
    wheelchairAssist: 'સમર્પિત વ્હીલચેેર સહાય ઉમેરો',
    wheelchairAssistDesc: 'ગેટ પર સમર્પિત સેવક / સ્વયંસેવક સહાય શામેલ છે',
    wheelchairFeeText: '+₹51 સેવા ફી',
    wheelchairDetails: 'વ્હીલચેેર મેળવનારની વિગત',
    recipientName: 'મેળવનારનું પૂરું નામ',
    age: 'ઉંમર',
    assistanceReason: 'સહાયનું કારણ',
    reasonSenior: 'વરિષ્ઠ નાગરિક (65+)',
    reasonDisabled: 'શારીરિક દિવ્યાંગતા',
    reasonInjury: 'અસ્થાયી ઈજા / બીમારી',
    reasonPregnant: 'સગર્ભા મહિલા',
    audioNavigation: 'ઓડિયો નેવિગેશન સક્ષમ કરો',
    audioNavigationDesc: 'મંદિર ગર્ભગૃહ સુધી સ્ટેપ-બાય-સ્ટેપ વૉઇસ માર્ગદર્શન મેળવો',
    confirmBooking: 'બુકિંગની પુષ્ટિ કરો',
    confirming: 'પુષ્ટિ થઈ રહી છે...',
    selectSlot: 'કૃપા કરીને સમય સ્લોટ પસંદ કરો',
    bookingError: 'બુકિંગ નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.',
    success: 'બુકિંગ પુષ્ટિ થઈ ગઈ!',
    insightTitle: 'ભીડ અંતર્દૃષ્ટિ',
    insightSuggestion: 'ઓછી ભીડ વાળા અન્ય મંદિરની મુલાકાત પર વિચાર કરો.',
    loadingTemple: 'મંદિર વિગતો લોડ થઈ રહી છે...',
    loadingSlots: 'ઉપલબ્ધ સ્લોટ લોડ થઈ રહ્યા છે...',
    noSlots: 'આ તારીખ માટે કોઈ સ્લોટ ઉપલબ્ધ નથી',
    yourDetails: 'તમારી વિગતો',
    yourPhone: 'તમારો મોબાઇલ નંબર',
    yourPhonePlaceholder: '+91 XXXXX XXXXX',
    emergencyContact: 'કટોકટી સંપર્ક',
    emergencyName: 'સંપર્ક વ્યક્તિનું નામ',
    emergencyPhone: 'કટોકટી ફોન નંબર',
    addMembers: 'પરિવારના સભ્યો ઉમેરો',
    savedMembersHeader: '1-ક્લિકમાં સંગ્રહિત સભ્યો ઉમેરો',
    memberName: 'સભ્યનું નામ',
    memberAge: 'ઉંમર',
    memberPhone: 'સભ્યનો ફોન',
    memberEmail: 'સભ્યનો ઇમેઇલ',
    addMember: 'સભ્ય ઉમેરો',
    removeMember: 'દૂર કરો',
    phoneRequired: 'ફોન નંબર જરૂરી છે',
    emergencyNameRequired: 'કટોકટી સંપર્ક નામ જરૂરી છે',
    emergencyPhoneRequired: 'કટોકટી સંપર્ક ફોન જરૂરી છે',
    memberNameRequired: 'સભ્યનું નામ જરૂરી છે',
    memberPhoneRequired: 'સભ્યનો ફોન જરૂરી છે',
    memberEmailRequired: 'સભ્યનો ઇમેઇલ જરૂરી છે',
    bloodGroup: 'બ્લડ ગ્રુપ',
    medicalDetails: 'તબીબી વિગતો / સ્વાસ્થ્ય સ્થિતિ',
    bloodGroupPlaceholder: 'A+, B+, O+, વગેરે',
    medicalDetailsPlaceholder: 'કોઈ તબીબી સ્થિતિ અથવા એલર્જી',
    bloodGroupRequired: 'બ્લડ ગ્રુપ જરૂરી છે',
    medicalDetailsRequired: 'તબીબી વિગતો જરૂરી છે',
    verifyEmail: 'ઇમેઇલ ચકાસો',
    emailVerified: 'ઇમેઇલ ચકાસાયેલ',
    sendOtp: 'OTP મોકલો',
    verifyOtp: 'OTP ચકાસો',
    otpSent: 'OTP ઇમેઇલ પર મોકલવામાં આવ્યો',
    otpVerified: 'OTP સફળતાપૂર્વક ચકાસાયેલ',
    otpError: 'OTP ચકાસણી નિષ્ફળ',
    enterOtp: 'OTP દાખલ કરો',
    resendOtp: 'OTP ફરીથી મોકલો',
    bookingSummary: 'દર્શન બુકિંગ સારાંશ',
    totalPayable: 'કુલ ચૂકવવાપાત્ર રકમ',
    payAndConfirm: 'ચૂકવણી કરો અને બુકિંગ કન્ફર્મ કરો',
    selectedDateLabel: 'પસંદ કરેલ તારીખ',
    changeDate: 'તારીખ બદલો →',
    timeSlots: 'સમય સ્લોટ',
    booked: 'બુક થયેલ',
    darshanForecast: 'દર્શન પૂર્વાનુમાન',
    sacredEvent: 'આરતી / પાવન પર્વ',
    expectedRush: 'અપેક્ષિત ભીડ',
    adviceLabel: '💡 દિવ્ય સલાહ:',
    aiSmartGate: 'AI સ્માર્ટ ગેટ ઑપ્ટિમાઇઝેશન',
    savesMins: 'બચત',
    mins: 'મિનિટ',
    rushLabel: 'ભીડ',
    fastCorridor: 'ઝડપી કોરિડોર:',
    loadLabel: 'ભાર',
    autoAssignedPass: 'સરળ પ્રવેશ માટે તમારો ડિજિટલ પાસ આપમેળે સૌથી ઝડપી કોરિડોર પર ફાળવવામાં આવ્યો છે.',
    selectTempleLabel: 'દર્શન માટે મંદિર પસંદ કરો',
    aartiGateInfo: 'પાવન આરતી અને ગેટ જાણકારી',
    liveGateAllotment: 'લાઇવ ગેટ ફાળવણી',
    officialAartiSchedule: 'અધિકૃત આરતી સમય',
    assignedEntryGate: 'ફાળવેલ પ્રવેશ દ્વાર',
    openCalendar: '📅 પૂરું કેલેન્ડર ખોલો',
    govIdType: 'સરકારી ઓળખપત્રનો પ્રકાર (વૈકલ્પિક)',
    selectIdType: 'કાઉન્ટર પર દર્શાવવામાં આવનાર ID પસંદ કરો',
    govIdNotice: 'માત્ર ઑફલાઇન કાઉન્ટર ચકાસણી માટે. ID નંબર ક્યારેય સંગ્રહિત થતો નથી.',
    voterId: 'ચૂંટણી ઓળખકાર્ડ',
    drivingLicense: 'ડ્રાઇવિંગ લાયસન્સ',
    passport: 'પાસપોર્ટ',
    panCard: 'પાન કાર્ડ',
    familyGroupTitle: 'પરિવાર અને સમૂહના સભ્યો',
    membersAdded: 'ઉમેરેલ',
    addNewMemberBtn: 'નવો પરિવાર સભ્ય ઉમેરો',
    addMahaprasad: '🍲 મંદિર મહાપ્રસાદ ટોકન ઉમેરો (વૈકલ્પિક)',
    mahaprasadDesc: 'સ્લોટથી 2 કલાક પહેલાં મફત અથવા લાડુ પ્રસાદ બોક્સ મેળવો',
    selectedBadge: 'પસંદ કરેલ',
    optionalBadge: 'વૈકલ્પિક',
    nishulkAnnakshetra: 'નિઃશુલ્ક અન્નક્ષેત્ર',
    freePrasad: 'મફત',
    specialLadduBox: 'સ્પેશિયલ લાડુ પ્રસાદ બોક્સ',
    ladduBoxPrice: '+₹51 / બોક્સ',
    slotTypeLabel: 'સ્લોટ પ્રકાર',
    passesLabel: 'દર્શન પાસ',
    pilgrimsLabel: 'યાત્રાળુ',
    priorityFastTrackLine: 'પ્રાથમિકતા ફાસ્ટ-ટ્રેક લાઇન',
    dedicatedWheelchairEscort: 'સમર્પિત વ્હીલચેેર સેવા (ગેટ ૨)',
    primaryPilgrimSelf: 'મુખ્ય યાત્રાળુ (તમે)',
    melaModeActive: 'મોડ સક્રિય',
    safetyTrackOpen: 'સુરક્ષા ટ્રેક ચાલુ છે',
    melaPadyatriDesc: 'પગપાળા (પદયાત્રી) યાત્રાળુઓને સ્લોટ બુકિંગ પાસની જરૂર નથી. તેના બદલે તમારા સુરક્ષા ચેકપોઇન્ટ ટ્રેક કરો.',
    viewPadyatriRoute: 'પદયાત્રી રૂટ જુઓ →'
  }
};

export const Booking = () => {
  const { templeId: routeTempleId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const location = useLocation();
  const [currentTempleId, setCurrentTempleId] = useState(routeTempleId || 'tmp_somnath');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('service') === 'wheelchair') {
      setNeedsWheelchair(true);
    }
  }, [location]);

  const [temple, setTemple] = useState(null);
  const [temples, setTemples] = useState(() => getUniqueTemples([]));
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [slotType, setSlotType] = useState('general');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Multi-Beneficiary Priority Assignment Map:
  // { [pilgrimId]: { enabled: boolean, category: 'senior' | 'pregnant' | 'disabled', attendantId: string | null } }
  const [isPriority, setIsPriority] = useState(false);
  const [priorityAllocations, setPriorityAllocations] = useState({});
  const [enableAudioNav, setEnableAudioNav] = useState(false); // Audio navigation

  const [needsWheelchair, setNeedsWheelchair] = useState(false);
  const [wheelchairAllocations, setWheelchairAllocations] = useState({});

  const togglePilgrimWheelchair = (pilgrimId) => {
    setWheelchairAllocations((prev) => {
      const current = prev[pilgrimId];
      if (current?.enabled) {
        const next = { ...prev };
        delete next[pilgrimId];
        return next;
      }
      return {
        ...prev,
        [pilgrimId]: {
          enabled: true,
          category: 'senior'
        }
      };
    });
  };

  const setPilgrimWheelchairCategory = (pilgrimId, category) => {
    setWheelchairAllocations((prev) => ({
      ...prev,
      [pilgrimId]: {
        ...(prev[pilgrimId] || { enabled: true }),
        category
      }
    }));
  };

  const totalWheelchairs = Object.values(wheelchairAllocations).filter(w => w?.enabled).length;
  const wheelchairFee = totalWheelchairs * 51;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [crowdInsight, setCrowdInsight] = useState('');
  const [melaData, setMelaData] = useState(null);

  // Booking-time details
  const [userPhone, setUserPhone] = useState('');
  const [userGovIdType, setUserGovIdType] = useState('');
  const [userBloodGroup, setUserBloodGroup] = useState('');
  const [userMedicalDetails, setUserMedicalDetails] = useState('');
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', email: '' });
  const [showEmergency, setShowEmergency] = useState(false);
  const [bookingMembers, setBookingMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Saved Family Members state (1-click selection)
  const [savedFamilyMembers, setSavedFamilyMembers] = useState([]);
  const [selectedSavedMemberIds, setSelectedSavedMemberIds] = useState([]);

  // Prasad Booking State
  const [includePrasad, setIncludePrasad] = useState(false);
  const [prasadType, setPrasadType] = useState('free'); // 'free' | 'laddu_box'
  const [prasadQuantity, setPrasadQuantity] = useState(1);

  // Sync route parameter changes
  useEffect(() => {
    if (routeTempleId && routeTempleId !== currentTempleId) {
      setCurrentTempleId(routeTempleId);
    }
  }, [routeTempleId]);

  // Handle manual temple change by pilgrim
  const handleSelectTemple = (newId) => {
    setCurrentTempleId(newId);
    setSelectedSlot(null);
    navigate(`/book/${newId}`, { replace: true });
  };

  useEffect(() => {
    if (currentUser?.phone) {
      setUserPhone(currentUser.phone);
    }
    // Load user's actual saved family members
    try {
      const saved = localStorage.getItem('nirvighna_saved_family_members') || localStorage.getItem('nirvighna_local_family_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(m => m && m.name && typeof m.name === 'string' && m.name.trim().length > 0);
          setSavedFamilyMembers(valid);
        } else {
          setSavedFamilyMembers([]);
        }
      } else {
        setSavedFamilyMembers([]);
      }
    } catch (e) {
      setSavedFamilyMembers([]);
    }
  }, [currentUser]);


  // Combined list of all pilgrims in this booking
  const combinedPilgrims = [
    {
      id: 'self',
      name: currentUser?.full_name || t.primaryPilgrimSelf,
      age: null,
      isSelf: true
    },
    ...bookingMembers.map((m, idx) => ({
      id: `member-${idx}`,
      name: m.name || `${t.familyGroupTitle} #${idx + 1}`,
      age: m.age,
      isSelf: false
    }))
  ];

  // Toggle Priority for a specific pilgrim
  const togglePilgrimPriority = (pilgrimId) => {
    setPriorityAllocations((prev) => {
      const current = prev[pilgrimId];
      if (current?.enabled) {
        const next = { ...prev };
        delete next[pilgrimId];
        return next;
      }
      return {
        ...prev,
        [pilgrimId]: {
          enabled: true,
          category: 'senior',
          attendantId: null
        }
      };
    });
  };

  // Set category for a specific pilgrim
  const setPilgrimCategory = (pilgrimId, category) => {
    setPriorityAllocations((prev) => ({
      ...prev,
      [pilgrimId]: {
        ...(prev[pilgrimId] || { enabled: true, attendantId: null }),
        category
      }
    }));
  };

  // Set attendant for a specific pilgrim
  const setPilgrimAttendant = (pilgrimId, attendantId) => {
    setPriorityAllocations((prev) => ({
      ...prev,
      [pilgrimId]: {
        ...(prev[pilgrimId] || { enabled: true, category: 'senior' }),
        attendantId
      }
    }));
  };

  const activePriorityBeneficiaries = combinedPilgrims.filter(
    (p) => priorityAllocations[p.id]?.enabled
  );

  // 1-Click Toggle Saved Member Add/Remove
  const toggleSavedMemberSelect = (savedMember) => {
    const exists = bookingMembers.some(bm => bm.name === savedMember.name);
    if (exists) {
      setBookingMembers(bookingMembers.filter(bm => bm.name !== savedMember.name));
    } else {
      setBookingMembers([
        ...bookingMembers,
        {
          name: savedMember.name,
          age: savedMember.age || '',
          phone: savedMember.phone || userPhone,
          email: ''
        }
      ]);
    }
  };

  const syncBookingMembersToFamily = (membersList, phone, bId) => {
    try {
      const existingFamily = JSON.parse(localStorage.getItem('nirvighna_local_family_members') || localStorage.getItem('nirvighna_saved_family_members') || '[]');
      const updatedFamilyMap = new Map();

      existingFamily.forEach(m => {
        if (m && m.name) updatedFamilyMap.set(m.name.trim().toLowerCase(), m);
      });

      membersList.forEach((bm, i) => {
        if (bm && bm.name && bm.name.trim()) {
          const cleanName = bm.name.trim();
          const key = cleanName.toLowerCase();
          const existing = updatedFamilyMap.get(key);
          const memberObj = {
            id: existing?.id || `gm_${Date.now()}_${i + 1}`,
            name: cleanName,
            age: bm.age ? parseInt(bm.age) : (existing?.age || null),
            phone: bm.phone?.trim() || phone || (existing?.phone || null),
            email: bm.email?.trim() || (existing?.email || null),
            blood_group: bm.blood_group || (existing?.blood_group || null),
            medical_details: bm.medical_details || (existing?.medical_details || null),
            created_at: existing?.created_at || new Date().toISOString()
          };
          updatedFamilyMap.set(key, memberObj);

          try {
            supabase.from('group_members').upsert({
              id: memberObj.id,
              name: memberObj.name,
              age: memberObj.age,
              phone: memberObj.phone,
              booking_id: bId || null
            }).catch?.(() => {});
          } catch (_) {}
        }
      });

      const syncedFamilyList = Array.from(updatedFamilyMap.values());
      localStorage.setItem('nirvighna_local_family_members', JSON.stringify(syncedFamilyList));
      localStorage.setItem('nirvighna_saved_family_members', JSON.stringify(syncedFamilyList));
      setSavedFamilyMembers(syncedFamilyList);
    } catch (famErr) {
      console.warn('Could not auto-sync family members from booking:', famErr);
    }
  };

  const groupMembers = [];

  const addBookingMember = () => {
    setBookingMembers([
      ...bookingMembers,
      { name: '', age: '', phone: '', email: '' }
    ]);
  };

  const updateBookingMember = (index, field, value) => {
    const updated = [...bookingMembers];
    updated[index][field] = value;
    setBookingMembers(updated);
  };

  const removeBookingMember = (index) => {
    setBookingMembers(bookingMembers.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchTemple();
    fetchSlots();
    checkCrowdInsight();
  }, [currentTempleId, selectedDate]);

  // Dynamic Mela Detection based on selectedDate & currentTempleId
  useEffect(() => {
    const checkMela = async () => {
      try {
        const mela = await melaEngine.isMelaModeActive(currentTempleId, selectedDate);
        setMelaData(mela);
      } catch (melaErr) {
        setMelaData(null);
      }
    };
    checkMela();
  }, [currentTempleId, selectedDate]);

  const fetchTemple = async () => {
    setLoading(true);
    const fallbackTemple = MASTER_TEMPLES.find(t => t.id === currentTempleId) || MASTER_TEMPLES[0];
    setTemple(fallbackTemple);

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(currentTempleId);
    if (isUuid) {
      try {
        const { data, error } = await supabase
          .from('temples')
          .select('*')
          .eq('id', currentTempleId)
          .maybeSingle();

        if (!error && data) {
          setTemple(data);
        }
      } catch (err) {}
    }
    setLoading(false);
  };

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const availableDates = getNext7Days();

  const generateFallbackSlots = (dateStr) => {
    return [
      { id: `slot_${dateStr}_1`, temple_id: currentTempleId, slot_date: dateStr, start_time: '06:00 AM', end_time: '08:00 AM', slot_type: 'general', capacity: 200, booked_count: 85, is_active: true },
      { id: `slot_${dateStr}_2`, temple_id: currentTempleId, slot_date: dateStr, start_time: '08:00 AM', end_time: '10:00 AM', slot_type: 'general', capacity: 200, booked_count: 140, is_active: true },
      { id: `slot_${dateStr}_3`, temple_id: currentTempleId, slot_date: dateStr, start_time: '10:00 AM', end_time: '12:00 PM', slot_type: 'general', capacity: 200, booked_count: 195, is_active: true },
      { id: `slot_${dateStr}_4`, temple_id: currentTempleId, slot_date: dateStr, start_time: '04:00 PM', end_time: '06:00 PM', slot_type: 'general', capacity: 200, booked_count: 90, is_active: true },
      { id: `slot_${dateStr}_5`, temple_id: currentTempleId, slot_date: dateStr, start_time: '06:00 PM', end_time: '08:00 PM', slot_type: 'general', capacity: 200, booked_count: 110, is_active: true },
      { id: `slot_${dateStr}_vip1`, temple_id: currentTempleId, slot_date: dateStr, start_time: '07:00 AM', end_time: '09:00 AM', slot_type: 'vip', capacity: 50, booked_count: 22, is_active: true },
      { id: `slot_${dateStr}_vip2`, temple_id: currentTempleId, slot_date: dateStr, start_time: '11:00 AM', end_time: '01:00 PM', slot_type: 'vip', capacity: 50, booked_count: 38, is_active: true },
      { id: `slot_${dateStr}_vip3`, temple_id: currentTempleId, slot_date: dateStr, start_time: '05:00 PM', end_time: '07:00 PM', slot_type: 'vip', capacity: 50, booked_count: 15, is_active: true }
    ];
  };

  const fetchSlots = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    setSlots(generateFallbackSlots(dateStr));
    setSelectedSlot(null);

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(currentTempleId);
    if (isUuid) {
      try {
        const { data, error } = await supabase
          .from('darshan_slots')
          .select('*')
          .eq('temple_id', currentTempleId)
          .eq('slot_date', dateStr)
          .eq('is_active', true)
          .order('start_time');

        if (!error && data && data.length > 0) {
          setSlots(data);
        }
      } catch (err) {}
    }
  };

  const checkCrowdInsight = async () => {
    try {
      const { data: liveTemples } = await supabase
        .from('temples')
        .select('id, name, live_capacity_percentage')
        .neq('id', currentTempleId);

      if (liveTemples && liveTemples.length > 0) {
        const mergedTemples = getUniqueTemples(liveTemples);
        const insight = NirvighnaAIEngine.suggestAlternativeTemple(currentTempleId, mergedTemples);
        if (insight && insight.shouldReroute) {
          setCrowdInsight(insight.reason);
        }
      }
    } catch (err) {}
  };

  const getSlotAvailability = (slot) => {
    const percentage = (slot.booked_count / slot.capacity) * 100;
    if (percentage >= 100) {
      return { status: 'full', label: t.full, color: 'text-red-600 bg-red-50', disabled: true };
    }
    if (percentage >= 80) {
      return { status: 'filling_fast', label: t.fillingFast, color: 'text-orange-600 bg-orange-50', disabled: false };
    }
    return { status: 'available', label: t.available, color: 'text-emerald-600 bg-emerald-50', disabled: false };
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setError(t.selectSlot);
      return;
    }

    if (!userPhone || userPhone.trim().length < 10) {
      setError(t.phoneRequired);
      return;
    }

    setSubmitting(true);
    setError('');

    const allottedGate = getAllottedGate(currentTempleId, isPriority && activePriorityBeneficiaries.length > 0);
    const sharedCode = 'NIRV-' + Math.floor(100000 + Math.random() * 900000);

    const activePriorityList = Object.entries(priorityAllocations)
      .filter(([_, alloc]) => alloc.enabled)
      .map(([id, alloc]) => {
        const person = combinedPilgrims.find(p => p.id === id);
        const attendant = alloc.attendantId ? combinedPilgrims.find(p => p.id === alloc.attendantId) : null;
        return {
          beneficiary_id: id,
          beneficiary_name: person?.name || 'Pilgrim',
          category: alloc.category,
          attendant_id: alloc.attendantId || null,
          attendant_name: attendant?.name || null
        };
      });

    // Prepare all group members (Primary + family)
    const allMembers = [
      { id: 'primary_' + (currentUser?.id || 'demo_user'), name: currentUser?.full_name || 'Primary Pilgrim', phone: userPhone },
      ...bookingMembers.filter(m => m.name.trim()).map((m, idx) => ({ id: m.id || `member_${idx + 1}`, name: m.name, phone: m.phone || userPhone }))
    ];

    try {
      const { data: bookingData, error: bookingErr } = await supabase
        .from('darshan_bookings')
        .insert([
          {
            pilgrim_id: currentUser?.id || 'demo_user',
            temple_id: currentTempleId,
            slot_id: selectedSlot.id,
            booking_mode: 'online',
            gate_number: allottedGate.id,
            is_priority: isPriority && activePriorityList.length > 0,
            priority_allocations: activePriorityList,
            shared_booking_code: sharedCode,
            status: 'confirmed'
          }
        ])
        .select()
        .single();

      if (bookingErr) throw bookingErr;

      const bookingIdentifier = bookingData.id;
      const bookedDate = selectedSlot.slot_date || new Date().toISOString().split('T')[0];
      const validFromDate = `${bookedDate}T00:00:00.000Z`;
      const validUntilDate = `${bookedDate}T23:59:59.999Z`;

      // Create Individual persistent signed QR passes
      const generatedQrPasses = await Promise.all(allMembers.map(async (member, idx) => {
        const passId = `pass_${bookingIdentifier}_${idx + 1}`;
        const isMemberPri = priorityAllocations[member.id]?.enabled || false;
        const memberCat = isMemberPri ? priorityAllocations[member.id]?.category : null;
        const attendantId = isMemberPri ? priorityAllocations[member.id]?.attendantId : null;
        const attendantObj = attendantId ? allMembers.find(m => m.id === attendantId) : null;
        const isWheelchair = wheelchairAllocations[member.id]?.enabled || false;
        const wheelchairCat = isWheelchair ? wheelchairAllocations[member.id]?.category : null;

        const { signed_value } = await issueSignedToken({
          token_type: 'gate_entry',
          resource_id: passId,
          temple_id: currentTempleId,
          valid_from: validFromDate,
          valid_until: validUntilDate
        });

        return {
          id: passId,
          booking_id: bookingIdentifier,
          qr_value: signed_value, // Stable HMAC-signed token
          pilgrim_name: member.name,
          pilgrim_phone: member.phone || userPhone,
          is_priority: isMemberPri,
          priority_category: memberCat,
          attendant_name: attendantObj?.name || null,
          is_wheelchair: isWheelchair,
          wheelchair_category: wheelchairCat,
          gate_number: allottedGate?.name || (isMemberPri || isWheelchair ? 'Gate 2 Priority Ramp' : 'Gate 1 Main Gate'),
          scan_status: 'not_scanned',
          is_valid: true
        };
      }));

      for (const qrPass of generatedQrPasses) {
        try {
          await supabase.from('qr_passes').insert(qrPass);
        } catch (e) {}
      }

      // Universal Notification (System Status Bar & In-App Alert)
      await sendPilgrimNotification({
        type: 'booking_confirmed',
        title: '⛩️ Darshan Booking Confirmed!',
        message: `Your Darshan Pass (${sharedCode}) for ${currentTemple.name} is confirmed for ${selectedSlot.slot_date} at ${selectedSlot.start_time}.${totalWheelchairs > 0 ? ` Includes ${totalWheelchairs}x Wheelchair Escorts.` : ''}`,
        templeId: currentTempleId,
        link: '/pass'
      });

      // Automatically sync all newly added booking members into Family & Group storage
      syncBookingMembersToFamily(bookingMembers, userPhone, bookingIdentifier);

      // Save local backup with exact permanent qr_passes
      const localBookingObj = {
        id: bookingData.id,
        pilgrim_id: currentUser?.id || 'demo_user',
        temple_id: currentTempleId,
        slot_id: selectedSlot.id,
        booking_mode: 'online',
        gate_number: allottedGate.id,
        gate_name: allottedGate.name,
        slot_date: selectedSlot.slot_date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        is_priority: isPriority && activePriorityList.length > 0,
        priority_allocations: activePriorityList,
        total_wheelchairs: totalWheelchairs,
        wheelchair_fee: wheelchairFee,
        wheelchair_allocations: wheelchairAllocations,
        shared_booking_code: sharedCode,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        total_pilgrims: allMembers.length,
        pilgrim_phone: userPhone,
        qr_passes: generatedQrPasses,
        temples: {
          name: currentTemple.name,
          location: currentTemple.location,
          image_url: currentTemple.image_url || null
        },
        darshan_slots: {
          slot_date: selectedSlot.slot_date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          slot_type: selectedSlot.slot_type
        },
        include_prasad: includePrasad,
        prasad_type: includePrasad ? prasadType : null,
        prasad_fee: (includePrasad && prasadType === 'laddu_box') ? 51 : 0
      };


      const existingLocalBookings = JSON.parse(localStorage.getItem('nirvighna_my_local_bookings') || '[]');
      existingLocalBookings.unshift(localBookingObj);
      localStorage.setItem('nirvighna_my_local_bookings', JSON.stringify(existingLocalBookings));

      broadcastBookingToVolunteers(localBookingObj);
      navigate('/pass', { state: { bookingId: bookingData.id } });

    } catch (err) {
      console.warn('Booking database call failed/timed out, using optimistic fallback:', err);

      const fallbackBookingId = 'bk_' + Math.floor(100000 + Math.random() * 900000);
      const bookedDate = selectedSlot?.slot_date || new Date().toISOString().split('T')[0];
      const validFromDate = `${bookedDate}T00:00:00.000Z`;
      const validUntilDate = `${bookedDate}T23:59:59.999Z`;

      // Create Individual persistent signed QR passes for offline fallback
      const generatedQrPasses = await Promise.all(allMembers.map(async (member, idx) => {
        const passId = `pass_${fallbackBookingId}_${idx + 1}`;
        const isMemberPri = priorityAllocations[member.id]?.enabled || false;
        const memberCat = isMemberPri ? priorityAllocations[member.id]?.category : null;
        const attendantId = isMemberPri ? priorityAllocations[member.id]?.attendantId : null;
        const attendantObj = attendantId ? allMembers.find(m => m.id === attendantId) : null;
        const isWheelchair = wheelchairAllocations[member.id]?.enabled || false;
        const wheelchairCat = isWheelchair ? wheelchairAllocations[member.id]?.category : null;

        const { signed_value } = await issueSignedToken({
          token_type: 'gate_entry',
          resource_id: passId,
          temple_id: currentTempleId,
          valid_from: validFromDate,
          valid_until: validUntilDate
        });

        return {
          id: passId,
          booking_id: fallbackBookingId,
          qr_value: signed_value, // Stable HMAC-signed token
          pilgrim_name: member.name,
          pilgrim_phone: member.phone || userPhone,
          is_priority: isMemberPri,
          priority_category: memberCat,
          attendant_name: attendantObj?.name || null,
          is_wheelchair: isWheelchair,
          wheelchair_category: wheelchairCat,
          gate_number: allottedGate?.name || (isMemberPri || isWheelchair ? 'Gate 2 Priority Ramp' : 'Gate 1 Main Gate'),
          scan_status: 'not_scanned',
          is_valid: true
        };
      }));

      // Automatically sync all newly added booking members into Family & Group storage
      syncBookingMembersToFamily(bookingMembers, userPhone, fallbackBookingId);

      const localBookingObj = {
        id: fallbackBookingId,
        pilgrim_id: currentUser?.id || 'demo_user',
        temple_id: currentTempleId,
        slot_id: selectedSlot?.id || 'slot_1',
        booking_mode: 'online',
        gate_number: allottedGate?.id || 'G2',
        gate_name: allottedGate?.name,
        slot_date: selectedSlot?.slot_date || bookedDate,
        start_time: selectedSlot?.start_time || '08:00 AM',
        end_time: selectedSlot?.end_time || '10:00 AM',
        is_priority: isPriority && activePriorityList.length > 0,
        priority_allocations: activePriorityList,
        total_wheelchairs: totalWheelchairs,
        wheelchair_fee: wheelchairFee,
        wheelchair_allocations: wheelchairAllocations,
        shared_booking_code: sharedCode,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        total_pilgrims: allMembers.length,
        pilgrim_phone: userPhone,
        qr_passes: generatedQrPasses,
        temples: {
          name: currentTemple.name,
          location: currentTemple.location,
          image_url: currentTemple.image_url || null
        },
        darshan_slots: {
          slot_date: selectedSlot?.slot_date || bookedDate,
          start_time: selectedSlot?.start_time || '08:00 AM',
          end_time: selectedSlot?.end_time || '10:00 AM',
          slot_type: selectedSlot?.slot_type || 'general'
        },
        include_prasad: includePrasad,
        prasad_type: includePrasad ? prasadType : null,
        prasad_fee: (includePrasad && prasadType === 'laddu_box') ? 51 : 0
      };


      const existingLocalBookings = JSON.parse(localStorage.getItem('nirvighna_my_local_bookings') || '[]');
      existingLocalBookings.unshift(localBookingObj);
      localStorage.setItem('nirvighna_my_local_bookings', JSON.stringify(existingLocalBookings));

      // Universal Notification (System Status Bar & In-App Alert)
      sendPilgrimNotification({
        type: 'booking_confirmed',
        title: '⛩️ Darshan Booking Confirmed (Offline)',
        message: `Your Darshan Pass (${sharedCode}) for ${currentTemple.name} is confirmed for ${selectedSlot?.slot_date || bookedDate} at ${selectedSlot?.start_time || '08:00 AM'}.${totalWheelchairs > 0 ? ` Includes ${totalWheelchairs}x Wheelchair Escorts.` : ''}`,
        templeId: currentTempleId,
        link: '/pass'
      });

      broadcastBookingToVolunteers(localBookingObj);
      navigate('/pass', { state: { bookingId: fallbackBookingId } });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center pb-20">
        <NirvighnaLoader message={t.loadingTemple} />
      </div>
    );
  }

  const currentTemple = getLocalizedTemple(temple || currentTempleId, currentLanguage);
  const filteredSlots = slots.filter(slot => slot.slot_type === slotType);

  return (
    <div className="min-h-screen bg-ivory pt-5 pb-10 px-3.5 sm:px-6 animate-page-in">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 bg-white rounded-xl shadow-warm border border-gray-100 hover:border-maroon transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-maroon" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black font-heading text-maroon">
                {currentTemple.name}
              </h1>
              <span className="text-[10px] font-bold bg-gold/25 text-maroon px-2 py-0.5 rounded-full border border-gold/40 shrink-0 font-heading">
                {currentTemple.deity || 'Temple Shrine'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{currentTemple.location}</p>
          </div>
        </div>

        {new URLSearchParams(location.search).get('service') === 'wheelchair' && (
          <div className="bg-[#400000] text-amber-100 p-4 rounded-xl border border-amber-500/30 shadow-md flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <span className="text-base">♿</span>
              </div>
              <div>
                <p className="text-amber-200 font-bold text-xs">
                  {currentLanguage === 'gu' ? 'પ્રાથમિકતા વ્હીલચેેર સહાય આરક્ષિત' : currentLanguage === 'hi' ? 'प्राथमिकता व्हीलचेयर सहायता आरक्षित' : 'Priority Wheelchair Assistance Reserved'}
                </p>
                <p className="text-[11px] text-amber-300/80 font-normal">
                  {currentLanguage === 'gu' ? 'ગેટ ૨ પ્રાયોરિટી રેમ્પ પર સમર્પિત સ્વયંસેવક સહાય ફાળવેલ છે' : currentLanguage === 'hi' ? 'गेट 2 प्रायोरिटी रैंप पर समर्पित स्वयंसेवक सहायता सौंपी गई है' : 'Dedicated volunteer escort assigned at Gate 2 Priority Ramp'}
                </p>
              </div>
            </div>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shrink-0">
              {currentLanguage === 'gu' ? 'ગેટ ૨ સેવક' : currentLanguage === 'hi' ? 'गेट 2 सेवक' : 'Gate 2 Escort'}
            </span>
          </div>
        )}

        {/* Live Panchang Astrological Multiplier & Rush Forecast Card */}
        {(() => {
          const panchang = panchangCalendarEngine.getTithiMultipliers(currentTempleId, selectedDate);
          
          const TEMPLE_PANCHANG_META = {
            tmp_somnath: {
              deityGu: 'સોમનાથ મહાદેવ જ્યોતિર્લિંગ',
              deityHi: 'सोमनाथ महादेव ज्योतिर्लिंग',
              deityEn: 'Somnath Mahadev Jyotirlinga',
              tithiGu: 'શ્રાવણ માસ સાવન તિથિ',
              tithiHi: 'श्रावण मास सावन तिथि',
              tithiEn: 'Shravan Maas Sawan Tithi',
              eventGu: 'સાવન અમૃત પર્વ',
              eventHi: 'सावन अमृत पर्व',
              eventEn: 'Sawan Amrit Parv',
              tipGu: 'શ્રેષ્ઠ સ્લોટ: સવારે ૦૭:૩૦ અથવા બપોરે ૦૨:૩૦ (~૩૮-મિનિટ દર્શન).',
              tipHi: 'सर्वोत्तम स्लॉट: सुबह 07:30 या दोपहर 02:30 (~38-मिनट दर्शन)।',
              tipEn: 'Best Slot: Early Morning (07:30 AM) or Afternoon (02:30 PM) for ~38-min Darshan.',
              multiplierText: '1.65x Peak Rush Expected',
              multiplierTextHi: '1.65x भारी भीड़ अपेक्षित',
              multiplierTextGu: '1.65x ભારે ભીડ અપેક્ષિત'
            },
            tmp_dwarka: {
              deityGu: 'દ્વારકાધીશ જગત મંદિર',
              deityHi: 'द्वारकाधीश जगत मंदिर',
              deityEn: 'Dwarkadhish Jagat Mandir',
              tithiGu: 'પવિત્ર એકાદશી તિથિ',
              tithiHi: 'पवित्र एकादशी तिथि',
              tithiEn: 'Pavitra Ekadashi Tithi',
              eventGu: 'મહા એકાદશી દર્શન',
              eventHi: 'महा एकादशी दर्शन',
              eventEn: 'Maha Ekadashi Darshan',
              tipGu: 'શ્રેષ્ઠ સ્લોટ: સાંજની આરતી પહેલાં (૦૪:૦૦ PM) ઓછી રાહ જોવા માટે.',
              tipHi: 'सर्वोत्तम स्लॉट: संध्या आरती से पूर्व (04:00 PM) कम प्रतीक्षा हेतु।',
              tipEn: 'Best Slot: Pre-Sandhya Aarti (04:00 PM) for faster queue entry.',
              multiplierText: '1.85x High Pilgrimage Density',
              multiplierTextHi: '1.85x उच्च श्रद्धालु घनत्व',
              multiplierTextGu: '1.85x ઉચ્ચ શ્રદ્ધાળુ ઘનતા'
            },
            tmp_ambaji: {
              deityGu: 'મા અંબા આરાસુરી શક્તિપીઠ',
              deityHi: 'माँ अम्बा अरासुरी शक्तिपीठ',
              deityEn: 'Maa Ambe Arasuri Shaktipeeth',
              tithiGu: 'શુક્લ પક્ષ પંચમી',
              tithiHi: 'शुक्ल पक्ष पंचमी',
              tithiEn: 'Shukla Paksha Panchami',
              eventGu: 'દિવ્ય જ્યોત દર્શન',
              eventHi: 'दिव्य ज्योत दर्शन',
              eventEn: 'Divya Jyot Darshan',
              tipGu: 'શ્રેષ્ઠ સ્લોટ: સવારના સમયમાં (૦૮:૦૦ AM) શક્તિ દ્વાર ગેટ ૭ થી.',
              tipHi: 'सर्वोत्तम स्लॉट: प्रातः कालीन समय (08:00 AM) शक्ति द्वार गेट 7 से।',
              tipEn: 'Best Slot: Morning hours (08:00 AM) via Shakti Dwar Gate 7.',
              multiplierText: 'Normal Moderate Flow (1.1x)',
              multiplierTextHi: 'सामान्य मध्यम प्रवाह (1.1x)',
              multiplierTextGu: 'સામાન્ય મધ્યમ પ્રવાહ (1.1x)'
            },
            tmp_pavagadh: {
              deityGu: 'મા કાલિકા શિખર તીર્થ',
              deityHi: 'माँ कालिका शिखर तीर्थ',
              deityEn: 'Maa Kalika Summit Shrine',
              tithiGu: 'શુક્લ પક્ષ સપ્તમી',
              tithiHi: 'शुक्ल पक्ष सप्तमी',
              tithiEn: 'Shukla Paksha Saptami',
              eventGu: 'મહાકાળી પાટોત્સવ',
              eventHi: 'महाकाली पाटोत्सव',
              eventEn: 'Mahakali Patotsav',
              tipGu: 'શ્રેષ્ઠ સ્લોટ: રોપવે માચી બેઝ પર સવારે ૦૬:૩૦ AM થી.',
              tipHi: 'सर्वोत्तम स्लॉट: रोपवे माची बेस पर सुबह 06:30 AM से।',
              tipEn: 'Best Slot: Ropeway Machi base before 06:30 AM.',
              multiplierText: '1.4x Mountain Route Load',
              multiplierTextHi: '1.4x पर्वत मार्ग भार',
              multiplierTextGu: '1.4x પર્વત માર્ગ ભાર'
            }
          };

          const pMeta = TEMPLE_PANCHANG_META[currentTempleId] || TEMPLE_PANCHANG_META.tmp_somnath;
          const localizedDeity = currentLanguage === 'gu' ? pMeta.deityGu : currentLanguage === 'hi' ? pMeta.deityHi : pMeta.deityEn;
          const localizedTithi = currentLanguage === 'gu' ? pMeta.tithiGu : currentLanguage === 'hi' ? pMeta.tithiHi : pMeta.tithiEn;
          const localizedEvent = currentLanguage === 'gu' ? pMeta.eventGu : currentLanguage === 'hi' ? pMeta.eventHi : pMeta.eventEn;
          const localizedTip = currentLanguage === 'gu' ? pMeta.tipGu : currentLanguage === 'hi' ? pMeta.tipHi : pMeta.tipEn;
          const localizedSurge = currentLanguage === 'gu' ? pMeta.multiplierTextGu : currentLanguage === 'hi' ? pMeta.multiplierTextHi : pMeta.multiplierText;

          return (
            <div className="bg-gradient-to-br from-indigo-dark via-slate-900 to-maroon text-white p-4 rounded-3xl border border-gold/40 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/30 flex items-center gap-1 font-heading">
                  <span>🔱</span>
                  <span>{localizedDeity}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                  {localizedTithi}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-gold font-heading">{t.darshanForecast}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{t.sacredEvent}</p>
                    <p className="text-xs font-extrabold text-amber-300 font-heading">{localizedEvent}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{t.expectedRush}</p>
                    <span className="text-xs font-extrabold text-red-300 font-mono">
                      {localizedSurge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-black/40 rounded-xl border border-gold/20 flex items-start gap-2 text-[11px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-gold font-heading">{t.adviceLabel}</span>
                  <p className="text-gray-200 leading-tight">
                    {localizedTip}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* AI Smart Gate Optimization Card */}
        {(() => {
          const reroute = cctvHeatmapService.calculateAutoBalancingReroute(currentTempleId);
          return (
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-dark text-white p-3.5 rounded-2xl border border-amber-400/40 shadow-warm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 font-heading">
                  {t.aiSmartGate}
                </span>
                <span className="text-[10px] font-extrabold text-gold bg-gold/20 px-2.5 py-0.5 rounded-full border border-gold/40">
                  {t.savesMins} ~{reroute.estTimeSavedMins} {t.mins}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-black/35 p-2.5 rounded-xl border border-amber-400/20">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-slate-300">{reroute.overcrowdedGate}:</span>
                    <span className="text-red-300 font-bold font-mono">{reroute.overcrowdedDensity}% {t.rushLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-amber-300 font-bold">{t.fastCorridor} {reroute.recommendedGate}</span>
                    <span className="text-amber-200/90 font-mono font-bold">({reroute.recommendedDensity}% {t.loadLabel})</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-100/90 font-medium px-1">
                  {t.autoAssignedPass}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Temple Selector Bar */}
        <div>
          <label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider block mb-1.5 px-1 font-heading">
            {t.selectTempleLabel}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MASTER_TEMPLES.map((tItem) => {
              const isSelected = tItem.id === currentTempleId;
              const locT = getLocalizedTemple(tItem.id, currentLanguage);
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => handleSelectTemple(tItem.id)}
                  className={`shrink-0 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-maroon to-red-900 text-ivory border-gold shadow-md scale-[1.02]'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gold/50 shadow-2xs'
                  }`}
                >
                  <span className="text-base">{tItem.icon || '🛕'}</span>
                  <span>{locT.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-gold" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Temple Aarti Timings & Gate Allotment Info Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-gold/40 shadow-warm space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-extrabold text-maroon font-heading flex items-center gap-1">
              {t.aartiGateInfo}
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {t.liveGateAllotment}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-ivory p-2 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">{t.officialAartiSchedule}</span>
              <p className="font-bold text-gray-900 mt-0.5">
                {currentTempleId === 'tmp_somnath' && '07:00 AM • 12:00 PM • 07:00 PM'}
                {currentTempleId === 'tmp_dwarka' && '06:30 AM • 10:30 AM • 07:30 PM'}
                {currentTempleId === 'tmp_ambaji' && '07:30 AM • 12:30 PM • 06:30 PM'}
                {currentTempleId === 'tmp_pavagadh' && '06:00 AM • 12:00 PM • 06:30 PM'}
              </p>
            </div>

            <div className="bg-ivory p-2 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">{t.assignedEntryGate}</span>
              <p className="font-bold text-maroon mt-0.5">
                {(() => {
                  const isPri = isPriority && activePriorityBeneficiaries.length > 0;
                  const reroute = cctvHeatmapService.calculateAutoBalancingReroute(currentTempleId);
                  
                  if (isPri) {
                    if (currentTempleId === 'tmp_somnath') return currentLanguage === 'gu' ? 'ગેટ ૨ પ્રાયોરિટી રેમ્પ' : currentLanguage === 'hi' ? 'गेट 2 प्रायोरिटी रैंप' : 'Gate 2 Priority Ramp';
                    if (currentTempleId === 'tmp_dwarka') return currentLanguage === 'gu' ? 'ગેટ ૨ સુદામા સેતુ કોરિડોર' : currentLanguage === 'hi' ? 'गेट 2 सुदामा सेतु कॉरिडोर' : 'Gate 2 Sudama Setu Express';
                    if (currentTempleId === 'tmp_ambaji') return currentLanguage === 'gu' ? 'ગેટ ૭ શક્તિ દ્વાર VIP' : currentLanguage === 'hi' ? 'गेट 7 शक्ति द्वार VIP' : 'Gate 7 Shakti Dwar VIP';
                    if (currentTempleId === 'tmp_pavagadh') return currentLanguage === 'gu' ? 'દૂધિયા તળાવ બાયપાસ પ્રાયોરિટી' : currentLanguage === 'hi' ? 'दूधिया तालाब बाईपास प्रायोरिटी' : 'Dudhiya Talav Priority Ramp';
                  }

                  if (currentTempleId === 'tmp_somnath') {
                    return reroute.requiresReroute
                      ? (currentLanguage === 'gu' ? 'ગેટ ૨ સાઉથ કોરિડોર (ઝડપી પ્રવેશ)' : currentLanguage === 'hi' ? 'गेट 2 साउथ कॉरिडोर (फास्ट एंट्री)' : 'Gate 2 South Priority Corridor')
                      : (currentLanguage === 'gu' ? 'ગેટ ૧ મહાપ્રવેશ દ્વાર' : currentLanguage === 'hi' ? 'गेट 1 महाप्रवेश द्वार' : 'Gate 1 Mahapravesh Dwar');
                  }
                  if (currentTempleId === 'tmp_dwarka') {
                    return reroute.requiresReroute
                      ? (currentLanguage === 'gu' ? 'સુદામા સેતુ એક્સપ્રેસ કોરિડોર' : currentLanguage === 'hi' ? 'सुदामा सेतु एक्सप्रेस कॉरिडोर' : 'Sudama Setu Express Corridor')
                      : (currentLanguage === 'gu' ? 'ગેટ ૧ સ્વર્ગ દ્વાર' : currentLanguage === 'hi' ? 'गेट 1 स्वर्ग द्वार' : 'Gate 1 Swarga Dwar');
                  }
                  if (currentTempleId === 'tmp_ambaji') {
                    return reroute.requiresReroute
                      ? (currentLanguage === 'gu' ? 'ટેમ્પલ કોર્ટ એક્સપ્રેસ પ્રવેશ' : currentLanguage === 'hi' ? 'टेम्पल कोर्ट एक्सप्रेस प्रवेश' : 'Temple Court Express Entrance')
                      : (currentLanguage === 'gu' ? 'છતરીયા ગેટ પ્રવેશ રેમ્પ' : currentLanguage === 'hi' ? 'छतरिया गेट प्रवेश रैंप' : 'Chhatariya Gate Entry Ramp');
                  }
                  if (currentTempleId === 'tmp_pavagadh') {
                    return reroute.requiresReroute
                      ? (currentLanguage === 'gu' ? 'દૂધિયા તળાવ બાયપાસ સીડી' : currentLanguage === 'hi' ? 'दूधिया तालाब बाईपास सीढ़ी' : 'Dudhiya Talav Bypass Stairs')
                      : (currentLanguage === 'gu' ? 'રોપવે અપર સ્ટેશન રેમ્પ' : currentLanguage === 'hi' ? 'रोपवे अपर स्टेशन रैंप' : 'Ropeway Upper Station Ramp');
                  }
                  return 'Gate #1 Main Gate';
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Calendar-Connected Mela Mode Active Banner (Dynamic & Tri-Lingual) */}
        {melaData && (
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-700 text-white p-4 rounded-3xl border-2 border-gold shadow-md space-y-2 animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/25 px-2.5 py-1 rounded-lg">
                {currentLanguage === 'gu' ? melaData.nameGu : currentLanguage === 'hi' ? melaData.nameHi : melaData.nameEn} {t.melaModeActive}
              </span>
              <span className="text-[10px] font-extrabold text-gold bg-black/30 px-2 py-0.5 rounded-full border border-gold/40 animate-pulse">
                {t.safetyTrackOpen}
              </span>
            </div>
            <p className="text-xs text-gray-100 leading-normal">
              {t.melaPadyatriDesc}
            </p>
            <button
              type="button"
              onClick={() => navigate('/mela-route')}
              className="w-full py-2.5 bg-white text-maroon hover:bg-gold hover:text-indigo-dark font-black text-xs rounded-xl shadow-md transition-all uppercase font-heading flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>{t.viewPadyatriRoute}</span>
            </button>
          </div>
        )}

        {/* Interactive Calendar Date Picker */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {t.selectDate}
            </h3>
            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="text-xs font-extrabold text-maroon hover:text-red-900 bg-gold/20 hover:bg-gold/30 px-3 py-1 rounded-xl border border-gold/40 transition-all flex items-center gap-1.5 shadow-2xs font-heading"
            >
              <Calendar className="w-3.5 h-3.5 text-maroon" />
              <span>{t.openCalendar}</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {availableDates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`shrink-0 px-4 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-maroon text-white border-maroon shadow-md scale-[1.02]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gold'
                  }`}
                >
                  <div className="text-xs font-semibold">{formatDate(date)}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Date Summary & Calendar Modal */}
          <div className="bg-ivory p-2.5 rounded-xl border border-gold/30 flex items-center justify-between text-xs text-gray-700 mt-1">
            <span>{t.selectedDateLabel}: <strong className="text-maroon font-bold font-mono">{selectedDate.toDateString()}</strong></span>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="text-[11px] text-maroon underline font-bold"
            >
              {t.changeDate}
            </button>
          </div>
        </div>

        {showCalendarModal && (
          <CalendarModal
            selectedDate={selectedDate}
            onSelectDate={(newDate) => setSelectedDate(newDate)}
            onClose={() => setShowCalendarModal(false)}
          />
        )}

        {/* Slot Type Toggle */}
        <div className="flex bg-white rounded-xl p-1 border border-gray-200">
          <button
            onClick={() => setSlotType('general')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              slotType === 'general'
                ? 'bg-gold text-indigo-dark'
                : 'text-gray-600 hover:text-maroon'
            }`}
          >
            {t.general}
          </button>
          <button
            onClick={() => setSlotType('vip')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              slotType === 'vip'
                ? 'bg-gold text-indigo-dark'
                : 'text-gray-600 hover:text-maroon'
            }`}
          >
            {t.vip}
          </button>
        </div>

        {/* Crowd Insight Card */}
        {crowdInsight && (
          <div className="bg-indigo-dark/10 border border-indigo-dark/20 p-3 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-indigo-dark flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-indigo-dark">{t.insightTitle}</p>
              <p className="text-[11px] text-gray-700 mt-0.5">{crowdInsight}</p>
            </div>
          </div>
        )}

        {/* Slots Grid */}
        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 px-1 font-heading">
            {t.timeSlots}
          </h3>
          
          {filteredSlots.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center">
              <p className="text-sm text-gray-500">{t.noSlots}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredSlots.map((slot) => {
                const availability = getSlotAvailability(slot);
                const isSelected = selectedSlot?.id === slot.id;
                
                return (
                  <button
                    key={slot.id}
                    onClick={() => !availability.disabled && setSelectedSlot(slot)}
                    disabled={availability.disabled}
                    className={`p-3 rounded-xl border transition-all ${
                      availability.disabled
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-gold border-gold text-indigo-dark shadow-goldGlow'
                        : 'bg-white border-gray-200 hover:border-gold'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${availability.color}`}>
                      {availability.label}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {slot.booked_count}/{slot.capacity} {t.booked}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Your Details Section */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-maroon" />
            {t.yourDetails}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t.yourPhone}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                  placeholder={t.yourPhonePlaceholder}
                  inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t.govIdType}</label>
              <select
                value={userGovIdType}
                onChange={(e) => setUserGovIdType(e.target.value)}
                className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
              >
                <option value="">{t.selectIdType}</option>
                <option value="voter_id">{t.voterId}</option>
                <option value="driving_license">{t.drivingLicense}</option>
                <option value="passport">{t.passport}</option>
                <option value="pan_card">{t.panCard}</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.govIdNotice}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t.bloodGroup}</label>
              <input
                type="text"
                value={userBloodGroup}
                onChange={(e) => setUserBloodGroup(e.target.value)}
                className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                placeholder={t.bloodGroupPlaceholder}
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t.medicalDetails}</label>
              <textarea
                value={userMedicalDetails}
                onChange={(e) => setUserMedicalDetails(e.target.value)}
                className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                placeholder={t.medicalDetailsPlaceholder}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowEmergency(!showEmergency)}
            className="w-full px-4 py-3 flex items-center justify-between bg-ivory/50 hover:bg-ivory transition-colors cursor-pointer"
          >
            <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-alertRed" />
              {t.emergencyContact}
            </span>
            {showEmergency ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          
          {showEmergency && (
            <div className="p-4 space-y-3 bg-white">
              <input
                type="text"
                value={emergencyContact.name}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                placeholder={t.emergencyName}
              />
              <input
                type="tel"
                value={emergencyContact.phone}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                placeholder={t.emergencyPhone}
                inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
              />
              <input
                type="email"
                value={emergencyContact.email || ''}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-ivory border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                placeholder="Emergency Contact Email"
              />
            </div>
          )}
        </div>

        {/* Add Family & Group Members Section with 1-Click Saved Selection */}
        <div className="bg-white rounded-xl border border-gold/30 overflow-hidden shadow-warm">
          <button
            type="button"
            onClick={() => setShowMembers(!showMembers)}
            className="w-full px-4 py-3 flex items-center justify-between bg-ivory/60 hover:bg-ivory transition-colors cursor-pointer"
          >
            <span className="text-xs font-extrabold text-indigo-dark flex items-center gap-2 font-heading">
              <Users className="w-4 h-4 text-maroon" />
              {t.familyGroupTitle}
            </span>
            <div className="flex items-center gap-2">
              {bookingMembers.length > 0 ? (
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-heading">
                  {bookingMembers.length} {t.membersAdded}
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase text-maroon bg-maroon/10 px-2.5 py-0.5 rounded-full font-heading">
                  {savedFamilyMembers.length || 5} {currentLanguage === 'hi' ? 'सदस्य' : currentLanguage === 'gu' ? 'સભ્યો' : 'Members'}
                </span>
              )}
              {showMembers ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </button>
          
          {showMembers && (
            <div className="p-4 space-y-4 bg-white">
              {/* 1-Click Saved Members Checklist */}
              {savedFamilyMembers.length > 0 && (
                <div className="bg-ivory p-3 rounded-xl border border-gold/30 space-y-2">
                  <span className="text-xs font-bold text-indigo-dark block font-heading">
                    {t.savedMembersHeader}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedFamilyMembers.map((sm, idx) => {
                      const isAdded = bookingMembers.some(bm => bm.name === sm.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSavedMemberSelect(sm)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isAdded
                              ? 'bg-gold/20 border-gold text-indigo-dark font-bold'
                              : 'bg-white border-gray-200 hover:border-gold/50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isAdded}
                              onChange={() => {}}
                              className="w-4 h-4 text-maroon focus:ring-maroon rounded"
                            />
                            <div>
                              <p className="text-xs font-bold">{sm.name}</p>
                              <p className="text-[10px] text-gray-500">{sm.age ? `${sm.age} yrs` : 'Saved Member'}</p>
                            </div>
                          </div>
                          {isAdded && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Added Members List */}
              {bookingMembers.map((member, index) => (
                <div key={index} className="relative p-3 bg-ivory rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => removeBookingMember(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateBookingMember(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-maroon font-semibold"
                    placeholder={t.memberName}
                  />
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      value={member.age}
                      onChange={(e) => updateBookingMember(index, 'age', e.target.value)}
                      className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                      placeholder={t.memberAge}
                    />
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => updateBookingMember(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-maroon"
                      placeholder={t.memberPhone}
                      inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
                    />
                  </div>
                  <input
                    type="email"
                    value={member.email || ''}
                    onChange={(e) => updateBookingMember(index, 'email', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm mt-2 focus:outline-none focus:border-maroon"
                    placeholder="Member Email Address"
                  />
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  addBookingMember();
                  const namePrompt = prompt("Enter New Family Member Name:");
                  if (namePrompt && namePrompt.trim()) {
                    const newSavedObj = { name: namePrompt.trim(), age: '', phone: '' };
                    const updatedSaved = [...savedFamilyMembers, newSavedObj];
                    setSavedFamilyMembers(updatedSaved);
                    localStorage.setItem('nirvighna_saved_family_members', JSON.stringify(updatedSaved));
                    toggleSavedMemberSelect(newSavedObj);
                  }
                }}
                className="w-full py-2.5 border-2 border-dashed border-gold/40 rounded-xl text-xs font-black text-indigo-dark hover:bg-gold/10 transition-colors flex items-center justify-center gap-1 font-heading cursor-pointer"
              >
                <Plus className="w-4 h-4 text-maroon" />
                {t.addNewMemberBtn}
              </button>
            </div>
          )}
        </div>

        {/* Priority Access & Dedicated Accessibility Services */}
        <div className="bg-white p-4 rounded-xl border border-gold/30 shadow-warm space-y-4">
          
          {/* Priority Line Toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => {
                  setIsPriority(e.target.checked);
                  if (!e.target.checked) {
                    setPriorityAllocations({});
                  } else {
                    setPriorityAllocations({
                      self: { enabled: true, category: 'senior', attendantId: null }
                    });
                  }
                }}
                className="w-5 h-5 rounded border-gray-300 text-maroon focus:ring-maroon cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-maroon flex items-center gap-1 font-heading">
                  <Shield className="w-4 h-4 text-gold-dark" /> {t.priorityAssist}
                </span>
                <p className="text-[10px] text-gray-500">{t.priorityAssistDesc}</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
              {t.free}
            </span>
          </label>

          {/* Audio Navigation Toggle */}
          <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableAudioNav}
                onChange={(e) => setEnableAudioNav(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-maroon focus:ring-maroon cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-maroon flex items-center gap-1 font-heading">
                  🎧 {t.audioNavigation}
                </span>
                <p className="text-[10px] text-gray-500">{t.audioNavigationDesc}</p>
              </div>
            </div>
          </label>

          {/* Multi-Person Priority Allocation Breakdown */}
          {isPriority && (
            <div className="pt-2 border-t border-gray-100 space-y-3 animate-in fade-in">
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-800 font-medium">
                ⚠️ <strong>{t.priorityRule}</strong>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700">
                  {t.whoNeedsPriority}
                </label>
                <p className="text-[10px] text-gray-500">{t.whoNeedsPriorityDesc}</p>
              </div>

              <div className="space-y-3">
                {combinedPilgrims.map((person) => {
                  const alloc = priorityAllocations[person.id];
                  const isBeneficiary = !!alloc?.enabled;

                  return (
                    <div
                      key={person.id}
                      className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                        isBeneficiary
                          ? 'bg-gold/15 border-gold shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {/* Checkbox Header for Pilgrim */}
                      <div
                        onClick={() => togglePilgrimPriority(person.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isBeneficiary}
                            onChange={() => {}}
                            className="w-4 h-4 text-maroon focus:ring-maroon rounded"
                          />
                          <div>
                            <span className="text-xs font-bold text-gray-900">{person.name}</span>
                            {person.age && <span className="text-[10px] text-gray-500 ml-1.5">({person.age} yrs)</span>}
                          </div>
                        </div>
                        {isBeneficiary && (
                          <span className="text-[10px] bg-maroon text-white px-2 py-0.5 rounded-full font-bold">
                            {t.priorityPassHolderBadge}
                          </span>
                        )}
                      </div>

                      {/* If this person has opted for Priority */}
                      {isBeneficiary && (
                        <div className="pl-6 pt-1 space-y-2.5 border-t border-gold/30 animate-in fade-in">
                          {/* 1. Category Selection */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
                              {t.priorityCategoryLabel}
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { id: 'senior', label: t.seniorCitizen, icon: '👴' },
                                { id: 'pregnant', label: t.pregnantWoman, icon: '🤰' },
                                { id: 'disabled', label: t.differentlyAbled, icon: '♿' }
                              ].map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setPilgrimCategory(person.id, cat.id)}
                                  className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                    alloc.category === cat.id
                                      ? 'bg-gold/30 border-gold text-indigo-dark font-bold'
                                      : 'bg-white border-gray-200 text-gray-600'
                                  }`}
                                >
                                  <div className="text-sm">{cat.icon}</div>
                                  <div className="text-[9px] font-semibold leading-tight mt-0.5">{cat.label}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Accompanying Attendant Selection */}
                          {combinedPilgrims.length > 1 ? (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
                                {t.accompanyingQuestion.replace('{name}', person.name)}
                              </label>
                              <p className="text-[9px] text-gray-500 mb-1.5">{t.accompanyingDesc.replace('{name}', person.name)}</p>

                              <div className="space-y-1.5">
                                <div
                                  onClick={() => setPilgrimAttendant(person.id, null)}
                                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all ${
                                    alloc.attendantId === null
                                      ? 'bg-white border-gold text-indigo-dark font-bold shadow-2xs'
                                      : 'bg-ivory border-gray-200 text-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`attendant_${person.id}`}
                                      checked={alloc.attendantId === null}
                                      onChange={() => {}}
                                      className="w-3.5 h-3.5 text-maroon"
                                    />
                                    <span>{t.soloOption}</span>
                                  </div>
                                </div>

                                {combinedPilgrims
                                  .filter((other) => other.id !== person.id && !priorityAllocations[other.id]?.enabled)
                                  .map((other) => {
                                    const isSelectedAttendant = alloc.attendantId === other.id;
                                    return (
                                      <div
                                        key={other.id}
                                        onClick={() => setPilgrimAttendant(person.id, other.id)}
                                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all ${
                                          isSelectedAttendant
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                                            : 'bg-white border-gray-200 text-gray-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name={`attendant_${person.id}`}
                                            checked={isSelectedAttendant}
                                            onChange={() => {}}
                                            className="w-3.5 h-3.5 text-emerald-600"
                                          />
                                          <span>{other.name}</span>
                                          {other.age && <span className="text-[10px] text-gray-400">({other.age} yrs)</span>}
                                        </div>
                                        {isSelectedAttendant && (
                                          <span className="text-[9px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                                            🤝 {t.attendantForBadge.replace('{name}', person.name.split(' ')[0])}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                              ✓ Solo Pilgrim: Accessing directly via Priority Gate.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-500 italic px-1">
                ℹ️ {t.generalLaneNote}
              </p>
            </div>
          )}

          {/* Multi-Person Dedicated Wheelchair Assistance */}
          <div className="space-y-2.5 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5 font-heading">
                  <span className="text-base">♿</span>
                  <span>{t.wheelchairAssist}</span>
                </p>
                <p className="text-[10px] text-gray-500">{t.wheelchairAssistDesc}</p>
              </div>
              <span className="text-xs font-extrabold text-maroon bg-maroon/10 px-2.5 py-0.5 rounded-full border border-maroon/20 font-mono">
                +₹51 {currentLanguage === 'gu' ? 'પ્રતિ વ્હીલચેેર' : currentLanguage === 'hi' ? 'प्रति व्हीलचेयर' : 'each'}
              </span>
            </div>

            <p className="text-[11px] font-semibold text-gray-600">
              {currentLanguage === 'gu'
                ? 'કોને વ્હીલચેેર સહાયની જરૂર છે તે સભ્યો પસંદ કરો:'
                : currentLanguage === 'hi'
                ? 'चुनें किन्हें समर्पित व्हीलचेयर सेवा की आवश्यकता है:'
                : 'Select pilgrims who need dedicated wheelchair assist:'}
            </p>

            <div className="space-y-2">
              {combinedPilgrims.map((person) => {
                const isWheelchair = !!wheelchairAllocations[person.id]?.enabled;
                const allocCat = wheelchairAllocations[person.id]?.category || 'senior';

                return (
                  <div
                    key={`wc_${person.id}`}
                    className={`p-3 rounded-2xl border transition-all space-y-2 ${
                      isWheelchair
                        ? 'bg-amber-50/70 border-gold shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gold/40'
                    }`}
                  >
                    <div
                      onClick={() => togglePilgrimWheelchair(person.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isWheelchair}
                          onChange={() => {}}
                          className="w-4 h-4 text-maroon focus:ring-maroon rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-gray-900">{person.name}</span>
                          {person.age && <span className="text-[10px] text-gray-500 ml-1.5">({person.age} yrs)</span>}
                        </div>
                      </div>
                      {isWheelchair && (
                        <span className="text-[10px] font-black text-maroon bg-gold/20 border border-gold/40 px-2 py-0.5 rounded-full font-mono">
                          ♿ +₹51 Reserved
                        </span>
                      )}
                    </div>

                    {isWheelchair && (
                      <div className="pl-6 pt-1 border-t border-gold/30 flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 font-bold uppercase">{t.assistanceReason}:</span>
                        <select
                          value={allocCat}
                          onChange={(e) => setPilgrimWheelchairCategory(person.id, e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-maroon cursor-pointer"
                        >
                          <option value="senior">{t.reasonSenior}</option>
                          <option value="disabled">{t.reasonDisabled}</option>
                          <option value="injury">{t.reasonInjury}</option>
                          <option value="pregnant">{t.reasonPregnant}</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Optional Prasad Booking Section */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-warm space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePrasad}
                onChange={(e) => setIncludePrasad(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1 font-heading">
                  {t.addMahaprasad}
                </span>
                <p className="text-[10px] text-gray-500">{t.mahaprasadDesc}</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {includePrasad ? t.selectedBadge : t.optionalBadge}
            </span>
          </label>

          {includePrasad && (
            <div className="pt-2 border-t border-gray-100 space-y-2 animate-in fade-in">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrasadType('free')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    prasadType === 'free'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-ivory border-gray-200 text-gray-600'
                  }`}
                >
                  <p className="text-xs font-bold">{t.nishulkAnnakshetra}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{t.freePrasad}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrasadType('laddu_box')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    prasadType === 'laddu_box'
                      ? 'bg-gold/20 border-gold text-indigo-dark font-bold'
                      : 'bg-ivory border-gray-200 text-gray-600'
                  }`}
                >
                  <p className="text-xs font-bold">{t.specialLadduBox}</p>
                  <p className="text-[10px] text-maroon font-bold">{t.ladduBoxPrice}</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Summary Box */}
        {selectedSlot && (() => {
          const totalPilgrims = 1 + bookingMembers.length;
          const basePrice = slotType === 'vip' ? 501 : 21;
          const priorityFee = 0; // Priority Line is 100% Free
          const wheelchairFee = totalWheelchairs * 51;
          const prasadFee = (includePrasad && prasadType === 'laddu_box') ? 51 : 0;
          const totalAmount = (basePrice * totalPilgrims) + priorityFee + wheelchairFee + prasadFee;

          const activeBeneficiaries = Object.entries(priorityAllocations).filter(([_, a]) => a.enabled);

          return (
            <div className="bg-indigo-dark text-white p-4 rounded-xl border border-gold/40 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">{t.slotTypeLabel}</span>
                <span className="font-bold text-gold uppercase">{slotType === 'vip' ? t.vip : t.general}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">{t.passesLabel} ({totalPilgrims} {t.pilgrimsLabel})</span>
                <span className="font-mono">₹{basePrice} × {totalPilgrims} = ₹{basePrice * totalPilgrims}</span>
              </div>
              
              {/* Priority Allocations Breakdown */}
              {isPriority && activeBeneficiaries.length > 0 && (
                <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/40 text-xs text-emerald-200 space-y-1.5">
                  <div className="flex justify-between font-bold text-emerald-300">
                    <span>{t.priorityFastTrackLine} ({activeBeneficiaries.length} Pass{activeBeneficiaries.length > 1 ? 'es' : ''})</span>
                    <span className="font-mono">{t.free}</span>
                  </div>
                  {activeBeneficiaries.map(([beneId, alloc]) => {
                    const bene = combinedPilgrims.find(p => p.id === beneId);
                    const att = alloc.attendantId ? combinedPilgrims.find(p => p.id === alloc.attendantId) : null;
                    return (
                      <div key={beneId} className="text-[11px] bg-black/25 p-1.5 rounded-lg border border-emerald-500/20">
                        <div className="flex justify-between font-semibold">
                          <span>🌟 {bene?.name}:</span>
                          <span className="uppercase text-gold font-bold">
                            {alloc.category === 'senior' ? t.seniorCitizen : alloc.category === 'pregnant' ? t.pregnantWoman : t.differentlyAbled}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-300 text-[10px] mt-0.5">
                          <span>Attendant:</span>
                          <span className="text-emerald-300 font-medium">
                            {att ? `🤝 ${att.name}` : `Solo`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {totalWheelchairs > 0 && (
                <div className="flex justify-between text-xs text-amber-300 font-semibold">
                  <span>♿ {t.dedicatedWheelchairEscort} ({totalWheelchairs}x)</span>
                  <span className="font-mono font-bold text-gold">+₹{wheelchairFee}</span>
                </div>
              )}

              {includePrasad && (
                <div className="flex justify-between text-xs text-amber-300">
                  <span>🍲 {prasadType === 'laddu_box' ? t.specialLadduBox : t.nishulkAnnakshetra}</span>
                  <span className="font-mono">{prasadType === 'laddu_box' ? '+₹51' : t.free}</span>
                </div>
              )}

              <div className="border-t border-gold/20 pt-2 flex justify-between items-center">
                <span className="text-xs font-bold">{t.totalPayable}</span>
                <span className="text-base font-extrabold text-gold font-mono">
                  ₹{totalAmount}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
            {error}
          </div>
        )}

        {/* Confirm Button */}
        {(() => {
          const totalPilgrims = 1 + bookingMembers.length;
          const basePrice = slotType === 'vip' ? 501 : 21;
          const priorityFee = 0; // Priority Line is Free
          const wheelchairFee = totalWheelchairs * 51;
          const prasadFee = (includePrasad && prasadType === 'laddu_box') ? 51 : 0;
          const totalAmount = (basePrice * totalPilgrims) + priorityFee + wheelchairFee + prasadFee;

          return (
            <button
              onClick={handleConfirmBooking}
              disabled={!selectedSlot || submitting}
              className={`w-full py-3.5 rounded-xl font-bold font-heading text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !selectedSlot || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gold hover:bg-gold-dark text-indigo-dark shadow-goldGlow'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.confirming}
                </>
              ) : (
                `₹${totalAmount} • ${t.confirmBooking}`
              )}
            </button>
          );
        })()}


        {!selectedSlot && (
          <p className="text-xs text-center text-gray-500">{t.selectSlot}</p>
        )}
      </div>
    </div>
  );
};
