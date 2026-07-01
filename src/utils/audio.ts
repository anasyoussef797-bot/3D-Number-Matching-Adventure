import { Language } from '../types';

// Convert numbers 1-20 to spoken word strings for speech synthesis in each language
const NUMBER_WORDS: Record<Language, Record<number, string>> = {
  en: {
    1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
    6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
    11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen",
    16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty"
  },
  ar: {
    1: "واحد", 2: "اثنان", 3: "ثلاثة", 4: "أربعة", 5: "خمسة",
    6: "ستة", 7: "سبعة", 8: "ثمانية", 9: "تسعة", 10: "عشرة",
    11: "أحد عشر", 12: "إثنا عشر", 13: "ثلاثة عشر", 14: "أربعة عشر", 15: "خمسة عشر",
    16: "ستة عشر", 17: "سبعة عشر", 18: "ثمانية عشر", 19: "تسعة عشر", 20: "عشرون"
  },
  fr: {
    1: "un", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq",
    6: "six", 7: "sept", 8: "huit", 9: "neuf", 10: "dix",
    11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze",
    16: "seize", 17: "dix-sept", 18: "dix-huit", 19: "dix-neuf", 20: "vingt"
  },
  de: {
    1: "eins", 2: "zwei", 3: "drei", 4: "vier", 5: "fünf",
    6: "sechs", 7: "sieben", 8: "acht", 9: "neun", 10: "zehn",
    11: "elf", 12: "zwölf", 13: "dreizehn", 14: "vierzehn", 15: "fünfzehn",
    16: "sechzehn", 17: "siebzehn", 18: "achtzehn", 19: "neunzehn", 20: "zwanzig"
  }
};

const INSTRUCTION_TEMPLATES: Record<Language, (wordNum: string) => string> = {
  en: (wordNum) => `Touch the island that has ${wordNum} objects!`,
  ar: (wordNum) => `المس الجزيرة التي تحتوي على ${wordNum} من العناصر!`,
  fr: (wordNum) => `Touchez l'île qui contient ${wordNum} objets!`,
  de: (wordNum) => `Berühre die Insel mit genau ${wordNum} Objekten!`
};

const FEEDBACK_PHRASES: Record<Language, { correct: string[]; wrong: string[] }> = {
  en: {
    correct: ["Amazing!", "Excellent!", "Wonderful!", "Great job!", "You did it!"],
    wrong: ["Let's try again!", "Count slowly, you can do it!", "Keep trying, you're close!"]
  },
  ar: {
    correct: ["أحسنت!", "ممتاز!", "رائع جداً!", "إجابة صحيحة!", "عبقري!"],
    wrong: ["حاول مرة أخرى!", "عُد ببطء، يمكنك فعلها!", "استمر في المحاولة، أنت قريب جداً!"]
  },
  fr: {
    correct: ["Excellent !", "Génial !", "Magnifique !", "Bravo !", "Tu as réussi !"],
    wrong: ["Essaie encore !", "Compte lentement, tu peux le faire !", "Continue, tu y es presque !"]
  },
  de: {
    correct: ["Großartig!", "Ausgezeichnet!", "Wunderbar!", "Gut gemacht!", "Du hast es geschafft!"],
    wrong: ["Versuch es noch einmal!", "Zähle langsam, du schaffst das!", "Mach weiter, du bist fast da!"]
  }
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmIntervalId: any = null;
  private currentStep = 0;
  private isBgmPlaying = false;
  public enabled = true;
  private activeUtterances = new Set<SpeechSynthesisUtterance>();

  // Cheerful, upbeat arpeggiating lead pattern
  private melodyPattern = [
    261.63, 293.66, 329.63, 392.00, // C4, D4, E4, G4
    329.63, 392.00, 440.00, 523.25, // E4, G4, A4, C5
    440.00, 523.25, 587.33, 659.25, // A4, C5, D5, E5
    587.33, 523.25, 440.00, 392.00  // D5, C5, A4, G4
  ];

  // Upbeat happy baseline notes
  private bassPattern = [
    130.81, 130.81, 164.81, 164.81, // C3, C3, E3, E3
    174.61, 174.61, 196.00, 196.00  // F3, F3, G3, G3
  ];

  // Paths mapping for eventual physical audio replacements
  // Allows absolute modular path management as requested
  public static paths = {
    audioRoot: '/assets/audio',
    languages: {
      en: '/assets/audio/en',
      ar: '/assets/audio/ar',
      fr: '/assets/audio/fr',
      de: '/assets/audio/de'
    }
  };

  constructor() {
    // AudioContext will be initialized on first user interaction
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft synth click sound
  public playClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Failed to play click SFX:", e);
    }
  }

  // Children cheering sound effect
  public playChildrenCheering() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Synthesize 12 happy high-pitched kids voices yelling "Woohoo!" in a cute chorus
      const kidPitches = [340, 380, 410, 440, 480, 520, 560, 600, 640, 680, 720, 760];
      kidPitches.forEach((baseFreq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        // Slightly random delays to sound natural, wide and crowded
        const delay = Math.random() * 0.18;
        const startTime = now + delay;
        const dur = 0.65 + Math.random() * 0.45;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, startTime);
        // Upward frequency sweep simulating laughter or cheerfulness
        osc.frequency.exponentialRampToValueAtTime(baseFreq * (1.65 + Math.random() * 0.35), startTime + dur * 0.3);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, startTime + dur);

        // Childlike frequency flutter (giggle / vibrato effect)
        const vibrato = this.ctx!.createOscillator();
        const vibratoGain = this.ctx!.createGain();
        vibrato.frequency.value = 13 + Math.random() * 6;
        vibratoGain.gain.value = 12 + Math.random() * 12;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(startTime);
        vibrato.stop(startTime + dur);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.08); // Louder cheering
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + dur + 0.05);
      });

      // Cheering handclaps / applause white noise
      const noiseOsc = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      noiseOsc.type = 'sawtooth';
      noiseOsc.frequency.setValueAtTime(140, now);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 45; // 45Hz handclap frequency
      lfoGain.gain.value = 950;
      lfo.connect(lfoGain);
      lfoGain.connect(noiseOsc.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.Q.setValueAtTime(3.0, now);

      noiseOsc.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.07, now + 0.15); // Louder claps
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      lfo.start(now);
      noiseOsc.start(now);
      lfo.stop(now + 1.2);
      noiseOsc.stop(now + 1.2);
    } catch (e) {
      console.warn("Failed to play kids cheering:", e);
    }
  }

  // Happy success sound (ascending chord arpeggio) + Children cheering
  public playCorrect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });

      // Play the beautiful custom synthesized children celebration sound
      this.playChildrenCheering();
    } catch (e) {
      console.warn("Failed to play correct SFX:", e);
    }
  }

  // Cute encouraging non-punishing slide
  public playWrong() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.25); // E3

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Failed to play wrong SFX:", e);
    }
  }

  // Sparkling level completion / star celebration chime
  public playCelebration() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const chimeFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 to G6

      chimeFreqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.5);
      });

      // Play children cheering as well
      this.playChildrenCheering();
    } catch (e) {
      console.warn("Failed to play celebration SFX:", e);
    }
  }

  // Procedural background calming synth pads
  public toggleBgm() {
    this.initCtx();
    if (!this.ctx) return;

    if (this.isBgmPlaying) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  // Fast-paced, extremely cheerful and exciting background music arpeggiator
  public startBgm() {
    if (this.isBgmPlaying || !this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      this.isBgmPlaying = true;
      this.currentStep = 0;

      // Super upbeat scheduler interval running every 135ms (enthusiastic driving tempo!)
      this.bgmIntervalId = setInterval(() => {
        if (!this.enabled || !this.isBgmPlaying) {
          this.stopBgm();
          return;
        }

        const now = this.ctx!.currentTime;
        const stepTime = 0.135; // 135ms per step (Much faster!)

        // Play driving happy bass tone every 4 steps (Louder & richer bass!)
        if (this.currentStep % 4 === 0) {
          const bassFreq = this.bassPattern[Math.floor(this.currentStep / 4) % this.bassPattern.length];
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(bassFreq, now);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.065, now + 0.02); // Louder!
          gain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.6);
          
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now);
          osc.stop(now + stepTime * 1.6 + 0.05);
        }

        // Play cheerful, driving hi-hat/shaker beat on alternate steps for massive enthusiasm
        if (this.currentStep % 2 === 1) {
          const oscHat = this.ctx!.createOscillator();
          const gainHat = this.ctx!.createGain();
          oscHat.type = 'sine';
          oscHat.frequency.setValueAtTime(1400, now);
          gainHat.gain.setValueAtTime(0.015, now);
          gainHat.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
          oscHat.connect(gainHat);
          gainHat.connect(this.ctx!.destination);
          oscHat.start(now);
          oscHat.stop(now + 0.04);
        }

        // Play rapid arpeggiating lead melody note with warm retro triangle waves (louder, retro console feel!)
        const leadFreq = this.melodyPattern[this.currentStep % this.melodyPattern.length];
        const oscLead = this.ctx!.createOscillator();
        const gainLead = this.ctx!.createGain();
        oscLead.type = 'triangle'; // Richer, happier NES/retro synth sound!
        oscLead.frequency.setValueAtTime(leadFreq, now);

        gainLead.gain.setValueAtTime(0, now);
        gainLead.gain.linearRampToValueAtTime(0.038, now + 0.01); // Louder & more punchy!
        gainLead.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.85);

        oscLead.connect(gainLead);
        gainLead.connect(this.ctx!.destination);
        oscLead.start(now);
        oscLead.stop(now + stepTime * 0.85 + 0.05);

        this.currentStep++;
      }, 135);

    } catch (e) {
      console.warn("Could not start background synthesis:", e);
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  // Localized high-quality text-to-speech for instructions & number reading
  public speak(text: string, langCode: Language) {
    if (!this.enabled) return;
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      // Force resume to unblock any browser-stalled SpeechSynthesis state (Chrome/Safari bug)
      window.speechSynthesis.resume();
      
      // CRITICAL: Only cancel if active speaking state exists.
      // Calling cancel() on idle iOS/Safari completely locks speech synthesis permanently!
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterances.add(utterance);

      utterance.onend = () => {
        this.activeUtterances.delete(utterance);
      };
      utterance.onerror = (event) => {
        console.warn("SpeechSynthesisUtterance error:", event);
        this.activeUtterances.delete(utterance);
      };

      const voices = window.speechSynthesis.getVoices();
      let targetVoice = null;
      
      if (langCode === 'ar') {
        // Extremely robust Arabic voice matching (looking for Arabic Eg, Saudi, general Arabic, or any ar voice)
        targetVoice = voices.find(v => v.lang.toLowerCase() === 'ar-eg') ||
                      voices.find(v => v.lang.toLowerCase() === 'ar-sa') ||
                      voices.find(v => v.lang.toLowerCase().startsWith('ar-eg')) || 
                      voices.find(v => v.lang.toLowerCase().startsWith('ar-sa')) || 
                      voices.find(v => v.lang.toLowerCase().startsWith('ar-')) || 
                      voices.find(v => v.lang.toLowerCase().startsWith('ar')) ||
                      voices.find(v => v.name.toLowerCase().includes('arabic')) ||
                      voices.find(v => v.name.toLowerCase().includes('maged')) ||
                      voices.find(v => v.name.toLowerCase().includes('tarik'));
        
        // Use 'ar-EG' or 'ar-SA' as fallback which are universally recognized BCP-47 codes (raw 'ar' can fail on some devices!)
        utterance.lang = targetVoice ? targetVoice.lang : 'ar-EG';
        utterance.rate = 0.82; // Speak slowly & clearly for preschoolers
        utterance.pitch = 1.15; // Cheerful friendly pitch
      } else if (langCode === 'fr') {
        targetVoice = voices.find(v => v.lang.toLowerCase().startsWith('fr-')) || 
                      voices.find(v => v.lang.toLowerCase().startsWith('fr'));
        utterance.lang = targetVoice ? targetVoice.lang : 'fr-FR';
        utterance.rate = 0.85;
        utterance.pitch = 1.05;
      } else if (langCode === 'de') {
        targetVoice = voices.find(v => v.lang.toLowerCase().startsWith('de-')) || 
                      voices.find(v => v.lang.toLowerCase().startsWith('de'));
        utterance.lang = targetVoice ? targetVoice.lang : 'de-DE';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
      } else {
        targetVoice = voices.find(v => v.lang.toLowerCase().startsWith('en-')) || 
                      voices.find(v => v.lang.toLowerCase().startsWith('en'));
        utterance.lang = targetVoice ? targetVoice.lang : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.15;
      }

      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      // Speak after small micro-delay to let the browser cancel process settle
      setTimeout(() => {
        try {
          if (window.speechSynthesis) {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          }
        } catch (err) {
          console.warn("Error triggering speak inside timeout:", err);
        }
      }, 120);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  }

  // Explicitly unlock speech synthesis on first click gesture (iOS Safari requirement)
  public unlock() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        const silentUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(silentUtterance);
      } catch (e) {
        console.warn("Could not auto-unlock SpeechSynthesis:", e);
      }
    }
  }

  // Voice greeting upon starting game
  public speakGreeting(lang: Language, text: string) {
    this.speak(text, lang);
  }

  // Voice instruction: "Touch the island that has five elements!"
  public speakInstruction(lang: Language, count: number) {
    const word = NUMBER_WORDS[lang]?.[count] || count.toString();
    const instructionText = INSTRUCTION_TEMPLATES[lang](word);
    this.speak(instructionText, lang);
  }

  // Pronounce just the floating target number (e.g., "Five!")
  public speakNumberOnly(lang: Language, num: number) {
    const word = NUMBER_WORDS[lang]?.[num] || num.toString();
    this.speak(word, lang);
  }

  // Speak a random positive correct answer phrase
  public speakCorrect(lang: Language) {
    const phrases = FEEDBACK_PHRASES[lang].correct;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(randomPhrase, lang);
  }

  // Speak a random positive wrong answer encouragement phrase
  public speakWrong(lang: Language) {
    const phrases = FEEDBACK_PHRASES[lang].wrong;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(randomPhrase, lang);
  }
}

export const audioEngine = new AudioEngine();
