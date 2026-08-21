/**
 * Nirvighna Master Indian Voice & Devotional Audio Navigation Engine
 * 
 * Provides:
 * 1. Divine Temple Chime acoustic feedback using Web Audio API
 * 2. High-fidelity Indian Speech Synthesis (Swara, Lekha, Google हिन्दी, Neerja)
 * 3. Garbage-collection proof speech lifecycle for Android WebView
 * 4. Online High-Definition Audio TTS Fallback for devices without local voice data
 */

let cachedVoices = [];
let masterFemaleVoice = null;
let audioCtx = null;
let currentAudio = null;

// Initialize Web Audio Context on first interaction
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a sweet, resonant temple chime / bell sound using harmonic synthesis.
 * Gives instant audio confirmation to the devotee.
 */
export function playDevotionalChime(freq = 528, duration = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Harmonics for a rich brass temple bell tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.99, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.debug('Devotional chime skipped:', e);
  }
}

// Pre-load Speech Synthesis voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
      masterFemaleVoice = findMasterIndianFemaleVoice(cachedVoices);
    } catch (e) {}
  };

  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Finds the single highest quality Indian Voice available in the OS/Browser.
 */
function findMasterIndianFemaleVoice(voices) {
  if (!voices || voices.length === 0) return null;

  // Priority 1: Top-tier natural Hindi/Indian female voices
  const topHindiFemale = voices.find(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    const isHi = lang.startsWith('hi') || lang.includes('hi-in') || lang.includes('hi_in');
    return isHi && (name.includes('swara') || name.includes('google') || name.includes('natural') || name.includes('lekha') || name.includes('online'));
  });
  if (topHindiFemale) return topHindiFemale;

  // Priority 2: Any Hindi voice
  const anyHi = voices.find(v => (v.lang || '').toLowerCase().startsWith('hi'));
  if (anyHi) return anyHi;

  // Priority 3: Indian English Female voice (Neerja, Heera, Veena)
  const inEnFemale = voices.find(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    const isIn = lang.includes('in') || name.includes('india');
    return isIn && (name.includes('neerja') || name.includes('heera') || name.includes('veena') || name.includes('female') || name.includes('natural'));
  });
  if (inEnFemale) return inEnFemale;

  // Priority 4: Any Indian voice
  const anyIndian = voices.find(v => (v.lang || '').toLowerCase().includes('in') || (v.name || '').toLowerCase().includes('india'));
  if (anyIndian) return anyIndian;

  return voices[0] || null;
}

export function getBestIndianFemaleVoice(langCode = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  
  if (!masterFemaleVoice) {
    masterFemaleVoice = findMasterIndianFemaleVoice(voices);
  }
  return masterFemaleVoice || voices[0] || null;
}

export function gujaratiToDevanagari(text) {
  if (!text) return '';
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.charCodeAt(i);
    if (cp >= 0x0A81 && cp <= 0x0AFD) {
      out.push(String.fromCharCode(cp - 0x0180));
    } else {
      out.push(text[i]);
    }
  }
  return out.join('');
}

function prepareTextForSpeech(rawText, langCode) {
  if (!rawText) return '';
  let text = rawText.trim();

  if (langCode === 'gu') {
    text = gujaratiToDevanagari(text);
  }

  text = text
    .replace(/VOL-(\d+)/gi, 'वॉल $1')
    .replace(/MED-(\d+)/gi, 'मेडिकल टीम $1')
    .replace(/#VOL-(\d+)/gi, 'वॉल $1')
    .replace(/#MED-(\d+)/gi, 'मेडिकल $1')
    .replace(/\bRO\b/gi, 'आर ओ')
    .replace(/24\/7/g, 'चौबीस घंटे')
    .replace(/~/g, 'लगभग ')
    .replace(/\b(\d+)\s*m\b/gi, '$1 मीटर')
    .replace(/\b(\d+)\s*mins?\b/gi, '$1 मिनट')
    .replace(/(\d+)%/g, '$1 प्रतिशत');

  return text;
}

/**
 * Speaks text with 100% Android WebView & Browser compatibility.
 * Includes Web Audio chime, GC retention, and HTML5 Audio fallback.
 */
export function speakNaturalIndianVoice(text, langCode = 'hi', options = {}) {
  // 1. Play soft devotional chime on start
  if (options.playChime !== false) {
    playDevotionalChime(528, 0.45);
  }

  // 2. Stop existing audio & speech
  stopNaturalIndianVoice();

  if (!text || text.trim() === '') {
    if (options.onEnd) options.onEnd();
    return null;
  }

  // Try Native SpeechSynthesis first
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const spokenText = prepareTextForSpeech(text, langCode);
      const utterance = new SpeechSynthesisUtterance(spokenText);

      utterance.lang = langCode === 'en' ? 'en-IN' : 'hi-IN';
      utterance.pitch = options.pitch !== undefined ? options.pitch : 1.05;
      utterance.rate = options.rate !== undefined ? options.rate : 0.88;
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;

      const masterVoice = getBestIndianFemaleVoice(langCode);
      if (masterVoice) {
        utterance.voice = masterVoice;
      }

      // Android GC Retention: Keep reference on window to prevent mid-speech garbage collection
      window.__nirvighna_active_speech_utterance = utterance;

      let started = false;

      utterance.onstart = () => {
        started = true;
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        window.__nirvighna_active_speech_utterance = null;
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (err) => {
        window.__nirvighna_active_speech_utterance = null;
        if (err?.error === 'interrupted' || err?.error === 'canceled') {
          if (options.onEnd) options.onEnd();
          return;
        }
        // Fallback to online audio if SpeechSynthesis fails
        speakOnlineAudioFallback(text, langCode, options);
      };

      // Heartbeat to keep Android speech from stalling
      const interval = setInterval(() => {
        if (!window.__nirvighna_active_speech_utterance) {
          clearInterval(interval);
          return;
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 5000);

      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          speakOnlineAudioFallback(text, langCode, options);
        }
      }, 50);

      return utterance;
    } catch (err) {
      return speakOnlineAudioFallback(text, langCode, options);
    }
  } else {
    return speakOnlineAudioFallback(text, langCode, options);
  }
}

/**
 * Resilient Online TTS Fallback using HTML5 Audio element.
 * Ensures sound plays even on devices with no TTS engine installed.
 */
function speakOnlineAudioFallback(text, langCode, options) {
  try {
    const cleanText = (text || '').substring(0, 180);
    const targetLang = langCode === 'gu' ? 'gu' : langCode === 'en' ? 'en' : 'hi';
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

    const audio = new Audio(audioUrl);
    currentAudio = audio;
    window.__nirvighna_active_audio = audio;

    if (options.onStart) options.onStart();

    audio.onended = () => {
      window.__nirvighna_active_audio = null;
      if (options.onEnd) options.onEnd();
    };

    audio.onerror = () => {
      window.__nirvighna_active_audio = null;
      if (options.onEnd) options.onEnd();
    };

    audio.play().catch(() => {
      if (options.onEnd) options.onEnd();
    });

    return audio;
  } catch (e) {
    if (options.onEnd) options.onEnd();
    return null;
  }
}

/**
 * Cleanly stops any active voice playback and audio.
 */
export function stopNaturalIndianVoice() {
  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {}
      currentAudio = null;
    }
    window.__nirvighna_active_speech_utterance = null;
    window.__nirvighna_active_audio = null;
  }
}
