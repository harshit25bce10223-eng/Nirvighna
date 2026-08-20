/**
 * Nirvighna Master Indian Female Voice & Devotional Speech Engine
 * Uses the highest-fidelity, natural human-like Indian female voice (e.g., Microsoft Swara, Google हिन्दी, Neerja)
 * uniformly across Hindi, Gujarati, and English with flawless pronunciation, smooth cadence, and phonetic enhancements.
 */

let cachedVoices = [];
let masterFemaleVoice = null;

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
 * Finds the single highest quality Indian Female Voice available in the OS/Browser.
 * (Prioritizes Microsoft Swara Natural, Google हिन्दी, Microsoft Neerja, Lekha, Veena)
 */
function findMasterIndianFemaleVoice(voices) {
  if (!voices || voices.length === 0) return null;

  // Priority 1: Top-tier natural Hindi/Indian female voices (Microsoft Swara, Google हिन्दी, Lekha)
  const topHindiFemale = voices.find(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    const isHi = lang.startsWith('hi') || lang.includes('hi-in') || lang.includes('hi_in');
    return isHi && (name.includes('swara') || name.includes('google') || name.includes('natural') || name.includes('lekha') || name.includes('online'));
  });
  if (topHindiFemale) return topHindiFemale;

  // Priority 2: Any Hindi female voice
  const anyHiFemale = voices.find(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    const isHi = lang.startsWith('hi');
    return isHi && (name.includes('female') || name.includes('kalpana') || name.includes('swara') || name.includes('geeta'));
  });
  if (anyHiFemale) return anyHiFemale;

  // Priority 3: Any Hindi voice
  const anyHi = voices.find(v => (v.lang || '').toLowerCase().startsWith('hi'));
  if (anyHi) return anyHi;

  // Priority 4: Indian English Female voice (Neerja, Heera, Veena)
  const inEnFemale = voices.find(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    const isIn = lang.includes('in') || name.includes('india');
    return isIn && (name.includes('neerja') || name.includes('heera') || name.includes('veena') || name.includes('female') || name.includes('natural'));
  });
  if (inEnFemale) return inEnFemale;

  // Priority 5: Any Indian voice
  const anyIndian = voices.find(v => (v.lang || '').toLowerCase().includes('in') || (v.name || '').toLowerCase().includes('india'));
  if (anyIndian) return anyIndian;

  return voices[0] || null;
}

/**
 * Gets the active Master Indian Female voice.
 */
export function getBestIndianFemaleVoice(langCode = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  
  if (!masterFemaleVoice) {
    masterFemaleVoice = findMasterIndianFemaleVoice(voices);
  }
  return masterFemaleVoice || voices[0] || null;
}

/**
 * Phonetically translates Gujarati Unicode characters to Devanagari script
 * so the Master Hindi/Indian Female voice pronounces Gujarati seamlessly with human warmth.
 */
export function gujaratiToDevanagari(text) {
  if (!text) return '';
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.charCodeAt(i);
    // Gujarati Unicode block (0x0A81 to 0x0AFD) maps to Devanagari by subtracting 0x0180
    if (cp >= 0x0A81 && cp <= 0x0AFD) {
      out.push(String.fromCharCode(cp - 0x0180));
    } else {
      out.push(text[i]);
    }
  }
  return out.join('');
}

/**
 * Cleans and softens text for clear, natural, human Indian speech pronunciation.
 */
function prepareTextForSpeech(rawText, langCode) {
  if (!rawText) return '';
  let text = rawText.trim();

  // If language is Gujarati, convert to phonetic Devanagari for the Hindi female voice
  if (langCode === 'gu') {
    text = gujaratiToDevanagari(text);
  }

  // Common pronunciation smoothing for Indian devotional context
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
 * Speaks text using the unified Master Indian Female voice across Hindi, Gujarati, and English.
 * @param {string} text - The speech text
 * @param {'hi' | 'gu' | 'en'} langCode - Target language
 * @param {object} options - Callbacks & settings { onStart, onEnd, onError, rate, pitch }
 */
export function speakNaturalIndianVoice(text, langCode = 'hi', options = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options.onEnd) options.onEnd();
    return null;
  }

  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (e) {}

  if (!text || text.trim() === '') {
    if (options.onEnd) options.onEnd();
    return null;
  }

  const spokenText = prepareTextForSpeech(text, langCode);
  const utterance = new SpeechSynthesisUtterance(spokenText);

  // Set language code
  utterance.lang = langCode === 'en' ? 'en-IN' : 'hi-IN';

  // Sweet, natural female pitch and clear, unhurried cadence
  utterance.pitch = options.pitch !== undefined ? options.pitch : 1.08;
  utterance.rate = options.rate !== undefined ? options.rate : 0.88;
  utterance.volume = options.volume !== undefined ? options.volume : 1.0;

  const masterVoice = getBestIndianFemaleVoice(langCode);
  if (masterVoice) {
    utterance.voice = masterVoice;
  }

  utterance.onstart = () => {
    if (options.onStart) options.onStart();
  };

  utterance.onend = () => {
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (err) => {
    // 'interrupted' and 'canceled' are standard browser lifecycle events when switching or stopping audio
    if (err?.error === 'interrupted' || err?.error === 'canceled') {
      if (options.onEnd) options.onEnd();
      return;
    }
    if (options.onError) options.onError(err);
    if (options.onEnd) options.onEnd();
  };

  // Small delay ensures clean reset in Chromium speech queue
  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (options.onEnd) options.onEnd();
    }
  }, 25);

  return utterance;
}

/**
 * Cleanly stops any active voice playback.
 */
export function stopNaturalIndianVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}
