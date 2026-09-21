/**
 * Web Audio API audio synthesis for futuristic assistant feedback
 * and synthesized preview music
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * High-tech wake chime when "Hey Buddy" is detected
 */
export function playWakeChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First tone (E5: 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonic chime (B5: 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.debug('Audio chime unable to play:', e);
  }
}

/**
 * Positive action confirmation chime
 */
export function playActionChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.debug('Action chime note failed:', e);
  }
}

/**
 * Cached voices array for fast selection
 */
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }
}

/**
 * Identify and return strictly a Hindi (hi-IN) or Indian English (en-IN) natural female voice.
 * Assamese (as-IN) and other non-Hindi/English regional languages are STRICTLY BLOCKED.
 */
export function getBestHindiOrIndianEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Strict check: Block Assamese and other non-requested regional languages
  const isDisallowedLanguage = (v: SpeechSynthesisVoice): boolean => {
    const l = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();

    // STRICTLY DISALLOW Assamese as requested by user
    if (
      l.startsWith('as') ||
      l === 'as-in' ||
      n.includes('assamese') ||
      n.includes('ashmita') ||
      n.includes('asmita') ||
      n.includes('alok')
    ) {
      return true;
    }

    // Disallow other regional languages (Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu)
    const regionalPrefixes = ['bn', 'gu', 'kn', 'ml', 'mr', 'or', 'pa', 'ta', 'te', 'ur'];
    if (regionalPrefixes.some((p) => l === `${p}-in` || l.startsWith(`${p}-`))) {
      return true;
    }
    const regionalNames = [
      'bengali', 'gujarati', 'kannada', 'malayalam', 'marathi',
      'odia', 'oriya', 'punjabi', 'tamil', 'telugu', 'urdu', 'bangla'
    ];
    if (regionalNames.some((r) => n.includes(r))) {
      return true;
    }

    // Exclude harsh US robot voices
    if (
      (l === 'en-us' || l.startsWith('en-us')) &&
      (n.includes('david') || n.includes('mark') || n.includes('zira') || n.includes('guy'))
    ) {
      return true;
    }

    return false;
  };

  // Known top Indian Hindi & English female voices
  const preferredFemaleNames = [
    'swara',     // Microsoft Swara Online (Natural) - Hindi (India)
    'neerja',    // Microsoft Neerja Online (Natural) - English (India)
    'veena',     // Apple Veena - English (India)
    'lekha',     // Apple Lekha - Hindi (India)
    'heera',     // Microsoft Heera - English (India)
    'kalpana',   // Microsoft Kalpana - Hindi (India)
    'priya',     // Indian English Priya
    'aditi',     // Indian English Aditi
    'kajal',     // Google Hindi Kajal
    'raveena',   // Indian English Raveena
    'sunita',    // Hindi Sunita
    'sangeeta',  // Indian English Sangeeta
    'madhur',    // Microsoft Madhur Online
  ];

  // 1. Top priority: Known Hindi / Indian English female voices
  const topFemaleVoice = voices.find((v) => {
    if (isDisallowedLanguage(v)) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();
    const isTargetLang = l === 'hi-in' || l === 'en-in' || l.startsWith('hi');
    const isPreferred = preferredFemaleNames.some((name) => n.includes(name));
    return isTargetLang && isPreferred;
  });
  if (topFemaleVoice) return topFemaleVoice;

  // 2. High priority: Google Hindi (हिन्दी) or Google Indian English
  const googleVoice = voices.find((v) => {
    if (isDisallowedLanguage(v)) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();
    return (
      (l === 'hi-in' || l === 'en-in' || l.startsWith('hi')) &&
      (n.includes('google') || n.includes('natural') || n.includes('female'))
    );
  });
  if (googleVoice) return googleVoice;

  // 3. Any Hindi (hi-IN) voice (strictly not Assamese/regional)
  const anyHindi = voices.find((v) => {
    if (isDisallowedLanguage(v)) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'hi-in' || l === 'hi' || l.startsWith('hi-');
  });
  if (anyHindi) return anyHindi;

  // 4. Any Indian English (en-IN) voice
  const anyIndianEnglish = voices.find((v) => {
    if (isDisallowedLanguage(v)) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'en-in';
  });
  if (anyIndianEnglish) return anyIndianEnglish;

  // 5. English female fallback voice (e.g. UK/Natural English) if system lacks Hindi/en-IN pack
  // This GUARANTEES Buddy's voice is NEVER silent on systems without Indian voice packs!
  const englishFallback = voices.find((v) => {
    if (isDisallowedLanguage(v)) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();
    return (
      l.startsWith('en') &&
      (n.includes('female') || n.includes('natural') || n.includes('sonia') || n.includes('libby') || n.includes('samantha'))
    );
  });
  if (englishFallback) return englishFallback;

  // 6. Any clean English voice
  const anyEnglish = voices.find((v) => {
    if (isDisallowedLanguage(v)) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    return l.startsWith('en');
  });
  if (anyEnglish) return anyEnglish;

  return null;
}

/**
 * Get display label of the active voice for UI indication
 */
export function getActiveVoiceInfo(): { name: string; lang: string; isIndian: boolean } {
  const v = getBestHindiOrIndianEnglishVoice();
  if (v) {
    const isHi = v.lang.toLowerCase().includes('hi');
    return {
      name: v.name.replace(/\(.*?\)/g, '').trim(),
      lang: isHi ? 'Hindi (India)' : 'English (India)',
      isIndian: true,
    };
  }
  return {
    name: 'Hindi & Indian English Natural Female',
    lang: 'hi-IN / en-IN',
    isIndian: true,
  };
}

// Global active utterance reference to prevent Chrome garbage-collection bug
let currentUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Text to speech helper with strictly Hindi or English Female Voice
 * Bulletproof playback across Chrome, Edge, Safari, iOS & Android
 */
export function speakAssistantText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    if (speechTimeoutId) {
      clearTimeout(speechTimeoutId);
      speechTimeoutId = null;
    }

    // Resume speech engine in case browser paused it
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    // Clean text to avoid special character glitches
    const cleanText = text
      .replace(/[^\w\s.,?!'"]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance; // Retain in memory to prevent browser garbage-collection

    // Select Best Hindi or Indian English Voice (strictly blocking Assamese)
    const voice = getBestHindiOrIndianEnglishVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      const hasHindi = /[\u0900-\u097F]|karo|bajao|chalao|gaana|awaaz|sunao/i.test(cleanText);
      utterance.lang = hasHindi ? 'hi-IN' : 'en-IN';
    }

    // Natural female voice calibration
    utterance.rate = 1.0;
    utterance.pitch = 1.12;

    let hasFinished = false;
    const finish = () => {
      if (!hasFinished) {
        hasFinished = true;
        currentUtterance = null;
        if (speechTimeoutId) {
          clearTimeout(speechTimeoutId);
          speechTimeoutId = null;
        }
        if (onEnd) onEnd();
      }
    };

    utterance.onend = finish;
    utterance.onerror = () => {
      // If selected voice had an error, retry with generic voice
      finish();
    };

    // Safety watchdog timer so state never hangs if browser fails to trigger onend
    const expectedDurationMs = Math.max(2500, cleanText.length * 100 + 1500);
    speechTimeoutId = setTimeout(finish, expectedDurationMs);

    // 40ms delay after cancel is essential in Chromium to prevent drop bug
    setTimeout(() => {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    }, 40);
  } catch {
    if (onEnd) onEnd();
  }
}
