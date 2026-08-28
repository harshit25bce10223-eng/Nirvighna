import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { speakNaturalIndianVoice, stopNaturalIndianVoice } from '../lib/indianVoiceEngine';

const KNOWLEDGE_BASE = {
  en: [
    {
      keywords: ['footwear', 'shoe', 'locker', 'chappal', 'joota'],
      answer: 'Smart Footwear Lockers are located at Main Entrance Gate #2 near the Cloak Room. Token issuance is free of cost via your Pilgrim Portal.',
      speech: 'Smart Footwear Lockers are located at Main Entrance Gate 2 near the Cloak Room.'
    },
    {
      keywords: ['boat', 'dwarka', 'ferry', 'crossing', 'okha'],
      answer: 'Bet Dwarka Boat Crossings operate from Okha Port Jetty every 15 minutes between 06:00 AM and 07:00 PM. Priority queue passes are available under Smart Travel.',
      speech: 'Bet Dwarka Boat Crossings operate from Okha Port Jetty every 15 minutes.'
    },
    {
      keywords: ['ropeway', 'cable car', 'pavagadh', 'ambaji', 'machi'],
      answer: 'Cable Car Ropeway terminals operate at Pavagadh (Machi Station) and Ambaji (Gabbar Hill). Express digital passes can be booked in advance.',
      speech: 'Cable Car Ropeway operates at Pavagadh Machi Station and Ambaji Gabbar Hill.'
    },
    {
      keywords: ['darshan', 'time', 'timing', 'slot', 'booking', 'aarti'],
      answer: 'General Darshan runs daily from 06:00 AM to 09:00 PM. Morning Mangla Aarti is at 07:00 AM and Evening Sandhya Aarti is at 07:00 PM.',
      speech: 'General Darshan runs daily from 6 AM to 9 PM. Aarti takes place at 7 AM and 7 PM.'
    },
    {
      keywords: ['doctor', 'medical', 'emergency', 'help', 'ambulance', 'sick'],
      answer: 'Emergency First Aid Booths are stationed at Gate #1 and Gate #3. Press the Red SOS button on your portal to dispatch a medical response team immediately.',
      speech: 'Emergency First Aid Booths are stationed at Gate 1 and Gate 3. Press the Red SOS button for immediate medical assistance.'
    },
    {
      keywords: ['prasad', 'bhandara', 'food', 'laddu'],
      answer: 'Prasad counters are active near the exit corridor. Live digital queue tokens can be claimed under Temple Facilities on Home.',
      speech: 'Prasad counters are active near the exit corridor. Claim your digital token under Temple Facilities.'
    }
  ],
  hi: [
    {
      keywords: ['जूता', 'चप्पल', 'फुटवेयर', 'लॉकर', 'joota', 'footwear'],
      answer: 'स्मार्ट फुटवेयर लॉकर मुख्य प्रवेश द्वार नंबर 2 क्लॉक रूम के पास स्थित है। डिजिटल टोकन मुफ़्त उपलब्ध है।',
      speech: 'स्मार्ट फुटवेयर लॉकर मुख्य प्रवेश द्वार नंबर 2 के पास स्थित है।'
    },
    {
      keywords: ['नाव', 'बोट', 'द्वारका', 'फेरी', 'boat', 'dwarka'],
      answer: 'बेट द्वारका बोट सेवा ओखा पोर्ट जेटी से हर 15 मिनट में सुबह 6 से शाम 7 बजे तक चलती है।',
      speech: 'बेट द्वारका बोट सेवा ओखा पोर्ट से हर 15 मिनट में चलती है।'
    },
    {
      keywords: ['रोपवे', 'पावागढ़', 'अंबाजी', 'ropeway'],
      answer: 'रोपवे सेवा पावागढ़ (माची स्टेशन) और अंबाजी (गब्बर पहाड़ी) पर चालू है।',
      speech: 'रोपवे सेवा पावागढ़ माची स्टेशन और अंबाजी गब्बर पहाड़ी पर चालू है।'
    },
    {
      keywords: ['दर्शन', 'समय', 'आरती', 'बुकिंग', 'darshan'],
      answer: 'सामान्य दर्शन सुबह 6:00 बजे से रात 9:00 बजे तक चालू रहता है। मंगला आरती सुबह 7 बजे और संध्या आरती शाम 7 बजे होती है।',
      speech: 'सामान्य दर्शन सुबह 6 बजे से रात 9 बजे तक खुला है।'
    },
    {
      keywords: ['डॉक्टर', 'मेडिकल', 'इमरजेंसी', 'अस्पताल', 'medical'],
      answer: 'आपातकालीन प्राथमिक चिकित्सा बूथ गेट नंबर 1 और 3 पर उपलब्ध है। तुरंत मदद के लिए लाल एसओएस बटन दबाएं।',
      speech: 'प्राथमिक चिकित्सा बूथ गेट नंबर 1 और 3 पर उपलब्ध है।'
    }
  ],
  gu: [
    {
      keywords: ['ચપ્પલ', 'બૂટ', 'લૉકર', 'footwear', 'joota'],
      answer: 'સ્માર્ટ ફુટવેર લોકર મુખ્ય પ્રવેશદ્વાર ગેટ નંબર 2 નજીક ક્લોક રૂમ પાસે ઉપલબ્ધ છે.',
      speech: 'સ્માર્ટ ફુટવેર લોકર મુખ્ય ગેટ નંબર 2 પાસે ઉપલબ્ધ છે.'
    },
    {
      keywords: ['બોટ', 'બોર્ડિંગ', 'દ્વારકા', 'ઓખા', 'boat'],
      answer: 'બેટ દ્વારકા બોટ સેવા ઓખા પોર્ટ જેટ્ટીથી દર 15 મિનિટે સવારે 6 થી સાંજે 7 વાગ્યા સુધી ચાલે છે.',
      speech: 'બેટ દ્વારકા બોટ સેવા ઓખા પોર્ટથી દર 15 મિનિટે ચાલે છે.'
    },
    {
      keywords: ['રોપવે', 'પાવાગઢ', 'અંબાજી', 'ropeway'],
      answer: 'કેબલ કાર રોપવે સેવા પાવાગઢ માચી સ્ટેશન અને અંબાજી ગબ્બર ટેકરી પર ચાલુ છે.',
      speech: 'રોપવે સેવા પાવાગઢ માચી સ્ટેશન અને અંબાજી પર ચાલુ છે.'
    },
    {
      keywords: ['દર્શન', 'સમય', 'આરતી', 'darshan'],
      answer: 'સામાન્ય દર્શન સવારે 6 થી રાત્રે 9 વાગ્યા સુધી ખુલ્લું રહે છે. મંગળા આરતી સવારે 7 વાગ્યે થાય છે.',
      speech: 'સામાન્ય દર્શન સવારે 6 થી રાત્રે 9 વાગ્યા સુધી ખુલ્લું રહે છે.'
    }
  ]
};

export const NirvighnaVoiceAssistant = () => {
  const { currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'assistant',
      text: '🙏 Jai Jinendra / Radhe Radhe! Ask me anything about Temple Darshan, Footwear Lockers, Boat Crossings, or Ropeway timing.'
    }
  ]);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech Recognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'gu' ? 'gu-IN' : 'en-IN';

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript) {
        handleUserQuery(transcript);
      }
    } else {
      setTranscript('');
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'gu' ? 'gu-IN' : 'en-IN';
          recognitionRef.current.start();
          setIsListening(true);
        } else {
          alert('Speech Recognition is not supported on this browser. You can type your query below!');
        }
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  };

  const speakText = (text) => {
    speakNaturalIndianVoice(text, currentLanguage, {
      pitch: 1.08,
      rate: 0.88,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleUserQuery = (userQuery) => {
    if (!userQuery.trim()) return;

    const lowerQuery = userQuery.toLowerCase();
    setChatHistory((prev) => [...prev, { sender: 'user', text: userQuery }]);

    const kb = KNOWLEDGE_BASE[currentLanguage] || KNOWLEDGE_BASE.en;
    let matched = kb.find((item) => item.keywords.some((kw) => lowerQuery.includes(kw)));

    if (!matched) {
      matched = {
        answer: '✨ All Shrine gates, footwear lockers, and darshan lines are operating smoothly. Check the pilgrim dashboard for live gate queue status.',
        speech: 'All Shrine gates and darshan lines are operating smoothly.'
      };
    }

    setTimeout(() => {
      setAiResponse(matched.answer);
      setChatHistory((prev) => [...prev, { sender: 'assistant', text: matched.answer }]);
      speakText(matched.speech || matched.answer);
    }, 400);

    setTranscript('');
  };

  return (
    <>
      {/* Floating Voice Assistant Trigger Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[990] flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-indigo-dark font-extrabold rounded-full shadow-goldGlow border border-gold hover:scale-105 active:scale-95 transition-all font-heading"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-indigo-dark" />
        <span className="text-xs uppercase tracking-wider">Voice AI Help</span>
      </button>

      {/* Interactive Voice Assistant Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-gold/40 rounded-3xl max-w-md w-full p-5 shadow-2xl flex flex-col h-[520px] justify-between animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Nirvighna Voice Assistant</h3>
                  <p className="text-[10px] text-slate-400">Multi-Lingual Devotee Guidance (EN / HI / GU)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopNaturalIndianVoice();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History Box */}
            <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-xs">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-gold text-indigo-dark font-bold rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-white/10 rounded-bl-none leading-relaxed'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {transcript && (
                <div className="flex justify-end">
                  <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 p-2.5 rounded-2xl text-xs font-mono animate-pulse">
                    🎤 Listening: "{transcript}"
                  </div>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="space-y-3 border-t border-white/10 pt-3">
              {/* Mic & Wave Indicator */}
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleListening}
                    className={`p-3 rounded-full transition-all ${
                      isListening
                        ? 'bg-red-600 text-white animate-bounce shadow-lg shadow-red-600/50'
                        : 'bg-gold hover:bg-gold-dark text-indigo-dark font-bold shadow-goldGlow'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <div>
                    <p className="text-xs font-bold text-white">
                      {isListening ? 'Listening now... Speak your question' : 'Tap Mic to speak in Hindi/Gujarati/English'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isSpeaking ? '🔊 Speaking answer aloud...' : 'Supports voice queries & auto audio reply'}
                    </p>
                  </div>
                </div>

                {isSpeaking && (
                  <button
                    onClick={() => stopNaturalIndianVoice()}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Text Input Fallback */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = e.target.elements.txtQuery.value;
                  if (val) {
                    handleUserQuery(val);
                    e.target.reset();
                  }
                }}
                className="flex gap-2"
              >
                <input
                  name="txtQuery"
                  type="text"
                  placeholder="Or type query (e.g. Footwear locker timing)..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gold text-indigo-dark font-black text-xs rounded-xl hover:bg-gold-dark"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
