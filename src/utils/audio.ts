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

  private currentAudio: HTMLAudioElement | null = null;
  private fileExistsCache = new Map<string, boolean>();

  // Efficiently check if a local MP3 file exists using HEAD method
  private async checkFileExists(url: string): Promise<boolean> {
    if (this.fileExistsCache.has(url)) {
      return this.fileExistsCache.get(url)!;
    }
    try {
      const response = await fetch(url, { method: "HEAD" });
      const exists = response.ok;
      this.fileExistsCache.set(url, exists);
      return exists;
    } catch (e) {
      this.fileExistsCache.set(url, false);
      return false;
    }
  }

  // Play an audio stream/file URL and handle potential browser constraints smoothly
  private playAudioUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch (_) {}
        this.currentAudio = null;
      }

      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        resolve();
      };

      audio.onerror = (err) => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        reject(err);
      };

      audio.play().catch((err) => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        reject(err);
      });
    });
  }

  // Localized high-quality text-to-speech with a highly robust three-tier fallback architecture
  public async speak(text: string, langCode: Language) {
    if (!this.enabled) return;

    // Reset SpeechSynthesis if active
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      } catch (_) {}
    }

    // Reset current audio playback
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }

    let localPath: string | null = null;

    // Detect and resolve local file paths if they exist
    if (langCode === "ar") {
      const trimmed = text.trim();

      // Check if correct feedback phrase
      const isCorrectText =
        trimmed.includes("أحسنت") ||
        trimmed.includes("ممتاز") ||
        trimmed.includes("رائع") ||
        trimmed.includes("صحيح") ||
        trimmed.includes("عبقري");

      // Check if wrong feedback phrase
      const isWrongText =
        trimmed.includes("مرة أخرى") ||
        trimmed.includes("عد ببطء") ||
        trimmed.includes("المحاولة") ||
        trimmed.includes("لنعد");

      // Arabic Alphabet mapping just in case letter audio is requested
      const letterMap: Record<string, string> = {
        "ألف": "alef", "ا": "alef",
        "باء": "baa", "ب": "baa",
        "تاء": "taa", "ت": "taa",
        "ثاء": "thaa", "ث": "thaa",
        "جيم": "jeem", "ج": "jeem",
        "حاء": "haa", "ح": "haa",
        "خاء": "khaa", "خ": "khaa",
        "دال": "daal", "د": "daal",
        "ذال": "thaal", "ذ": "thaal",
        "راء": "raa", "ر": "raa",
        "زاي": "zay", "ز": "zay",
        "سين": "seen", "س": "seen",
        "شين": "sheen", "ش": "sheen",
        "صاد": "saad", "ص": "saad",
        "ضاد": "daad", "ض": "daad",
        "طاء": "taa_heavy", "ط": "taa_heavy",
        "ظاء": "zaa_heavy", "ظ": "zaa_heavy",
        "عين": "ayn", "ع": "ayn",
        "غين": "ghayn", "غ": "ghayn",
        "فاء": "faa", "ف": "faa",
        "قاف": "qaaf", "ق": "qaaf",
        "كاف": "kaaf", "ك": "kaaf",
        "لام": "laam", "ل": "laam",
        "ميم": "meem", "م": "meem",
        "نون": "noon", "ن": "noon",
        "هاء": "haa_soft", "ه": "haa_soft",
        "واو": "waw", "و": "waw",
        "ياء": "yaa", "ي": "yaa"
      };

      // Try to extract a numeric value
      let resolvedNumber: number | null = null;
      const numberWordsMap = NUMBER_WORDS["ar"];
      for (const [num, word] of Object.entries(numberWordsMap)) {
        if (trimmed === word) {
          resolvedNumber = parseInt(num);
          break;
        }
      }
      const digitMatch = trimmed.match(/\d+/);
      if (digitMatch) {
        resolvedNumber = parseInt(digitMatch[0]);
      }

      if (isCorrectText) {
        localPath = "/audio/arabic/ui/correct.mp3";
      } else if (isWrongText) {
        localPath = "/audio/arabic/ui/try-again.mp3";
      } else if (resolvedNumber !== null) {
        localPath = `/audio/arabic/numbers/${resolvedNumber}.mp3`;
      } else if (letterMap[trimmed]) {
        localPath = `/audio/arabic/letters/${letterMap[trimmed]}.mp3`;
      }
    }

    // Tier 1: Local MP3 file check (Immediate play without network synthesis if file exists)
    if (localPath) {
      console.log(`[AudioEngine] Checking for local file: ${localPath}`);
      const fileExists = await this.checkFileExists(localPath);
      if (fileExists) {
        try {
          console.log(`[AudioEngine] Priority 1: Local file found! Playing: ${localPath}`);
          await this.playAudioUrl(localPath);
          return;
        } catch (err) {
          console.warn(`[AudioEngine] Local MP3 play failed for ${localPath}:`, err);
        }
      } else {
        console.log(`[AudioEngine] Local file not found: ${localPath}`);
      }
    }

    // Tier 2: Secure Server Proxy TTS (Streams MP3 from server to avoid browser limits and CORS blocks)
    try {
      const proxyUrl = `/api/tts?lang=${langCode}&text=${encodeURIComponent(text)}`;
      console.log(`[AudioEngine] Priority 2: Streaming from Secure Server Proxy: "${text}"`);
      await this.playAudioUrl(proxyUrl);
      return;
    } catch (err) {
      console.warn(`[AudioEngine] Secure server proxy TTS stream failed for "${text}":`, err);
    }

    // Tier 3: SpeechSynthesis native browser API (Last-resort fallback)
    console.log(`[AudioEngine] Priority 3: Falling back to browser SpeechSynthesis for "${text}"`);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterances.add(utterance);

      utterance.onend = () => {
        this.activeUtterances.delete(utterance);
      };
      utterance.onerror = (event) => {
        console.warn("SpeechSynthesisUtterance error:", event);
        this.activeUtterances.delete(utterance);
      };

      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        let targetVoice = null;

        if (langCode === "ar") {
          targetVoice = voices.find(v => v.lang.toLowerCase().startsWith("ar"));
          utterance.lang = targetVoice ? targetVoice.lang : "ar-EG";
          utterance.rate = 0.82;
          utterance.pitch = 1.15;
        } else if (langCode === "fr") {
          targetVoice = voices.find(v => v.lang.toLowerCase().startsWith("fr"));
          utterance.lang = targetVoice ? targetVoice.lang : "fr-FR";
          utterance.rate = 0.85;
          utterance.pitch = 1.05;
        } else if (langCode === "de") {
          targetVoice = voices.find(v => v.lang.toLowerCase().startsWith("de"));
          utterance.lang = targetVoice ? targetVoice.lang : "de-DE";
          utterance.rate = 0.85;
          utterance.pitch = 1.0;
        } else {
          targetVoice = voices.find(v => v.lang.toLowerCase().startsWith("en"));
          utterance.lang = targetVoice ? targetVoice.lang : "en-US";
          utterance.rate = 0.9;
          utterance.pitch = 1.15;
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (synthErr) {
      console.error("[AudioEngine] Native speech synthesis last-resort fallback failed:", synthErr);
    }
  }

  // Explicitly unlock speech synthesis on first click gesture (iOS Safari requirement)
  public unlock() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
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
