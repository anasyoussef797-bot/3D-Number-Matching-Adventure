import { useState, useEffect } from 'react';
import { Language, GameMode, ObjectType, LevelConfig, TRANSLATIONS, GameState } from './types';
import { audioEngine } from './utils/audio';
import { ThreeGame } from './components/ThreeGame';
import { LanguageSelector } from './components/LanguageSelector';
import { Certificate } from './components/Certificate';
import { 
  Volume2, 
  VolumeX, 
  Home, 
  RotateCcw, 
  Camera, 
  Sparkles, 
  Star, 
  ChevronRight, 
  Globe, 
  Heart, 
  CheckCircle, 
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Help helper to get a random item from array
const chooseRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate 5 distinct numbers for a round (shuffled)
const generateRoundNumbers = (mode: GameMode): number[] => {
  let numbers: number[] = [];
  if (mode === 'easy') {
    numbers = [1, 2, 3, 4, 5];
  } else if (mode === 'medium') {
    while (numbers.length < 5) {
      const num = 1 + Math.floor(Math.random() * 10);
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
  } else {
    while (numbers.length < 5) {
      const num = 1 + Math.floor(Math.random() * 20);
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
  }
  return numbers.sort(() => Math.random() - 0.5);
};

// Generate a random level configuration based on difficulty mode
const generateLevel = (mode: GameMode, previousNumbers: number[] = [], forcedTarget?: number): LevelConfig => {
  let min = 1;
  let max = 5;

  if (mode === 'medium') {
    max = 10;
  } else if (mode === 'hard') {
    max = 20;
  }

  // Choose a target number
  let target = forcedTarget !== undefined ? forcedTarget : (min + Math.floor(Math.random() * (max - min + 1)));
  if (forcedTarget === undefined) {
    let attempts = 0;
    while (previousNumbers.includes(target) && attempts < 10) {
      target = min + Math.floor(Math.random() * (max - min + 1));
      attempts++;
    }
  }

  // Generate 4 distinct options, including the target number
  const optionsSet = new Set<number>();
  optionsSet.add(target);

  while (optionsSet.size < 4) {
    const randomOpt = min + Math.floor(Math.random() * (max - min + 1));
    optionsSet.add(randomOpt);
  }

  // Convert set to array and shuffle
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  // Pick a random object categories
  const objectCategories: ObjectType[] = ['apples', 'stars', 'balloons', 'blocks', 'fish', 'cars', 'trees', 'cats', 'dogs', 'pandas', 'bunnies', 'lions'];
  const objectType = chooseRandom(objectCategories);

  return {
    number: target,
    options,
    objectType
  };
};

export default function App() {
  // Game state engine
  const [state, setState] = useState<GameState>({
    currentLanguage: 'ar', // Default to Arabic (Impact Hub Egypt primary locale)
    score: 0,
    stars: 0,
    levelIndex: 1,
    gameMode: 'easy',
    isPlaying: false,
    isCorrect: null,
    soundEnabled: true,
    showIntro: true
  });

  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [previousNumbers, setPreviousNumbers] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false);
  const [correctCountInSession, setCorrectCountInSession] = useState<number>(0);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>("");
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundNumbersLeft, setRoundNumbersLeft] = useState<number[]>([]);

  // Initialize and load historical highscores from browser local storage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('hub_egypt_matching_lang') as Language;
      const savedStars = localStorage.getItem('hub_egypt_matching_stars');
      const savedScore = localStorage.getItem('hub_egypt_matching_score');
      
      setState(prev => ({
        ...prev,
        currentLanguage: savedLang || 'ar',
        stars: savedStars ? parseInt(savedStars) : 0,
        score: savedScore ? parseInt(savedScore) : 0
      }));
    } catch (e) {
      console.warn("Could not load localStorage progress:", e);
    }
  }, []);

  // Sync state values with audio engine configuration
  useEffect(() => {
    audioEngine.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  // Read instructions aloud automatically upon level loading or language change
  useEffect(() => {
    if (state.isPlaying && currentLevel) {
      // Small timeout to allow the 3D scene to render first and avoid voice stutter
      const timer = setTimeout(() => {
        audioEngine.speakInstruction(state.currentLanguage, currentLevel.number);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.isPlaying, currentLevel?.number, state.currentLanguage]);

  // Handle language change on the fly
  const handleSelectLanguage = (lang: Language) => {
    // Robustly unlock Web Speech API / synthesis context on user interaction gesture
    audioEngine.unlock();

    try {
      localStorage.setItem('hub_egypt_matching_lang', lang);
    } catch (e) {}
    
    setState(prev => ({ ...prev, currentLanguage: lang }));
    audioEngine.playClick();
    
    // Announce the language shift with a small cheerful tone
    setTimeout(() => {
      if (state.isPlaying && currentLevel) {
        audioEngine.speakInstruction(lang, currentLevel.number);
      } else {
        audioEngine.speakGreeting(lang, TRANSLATIONS[lang].voiceIntro);
      }
    }, 200);
  };

  // Launch the game adventure
  const handleStartGame = (mode: GameMode) => {
    // Robustly unlock Web Speech API / synthesis context on user interaction gesture
    audioEngine.unlock();

    // Generate round 1 numbers (5 unique shuffled numbers)
    const initialRoundNums = generateRoundNumbers(mode);
    const firstTarget = initialRoundNums[0];
    const remaining = initialRoundNums.slice(1);

    const firstLevel = generateLevel(mode, [], firstTarget);
    setCurrentLevel(firstLevel);
    setPreviousNumbers([firstLevel.number]);
    setCorrectCountInSession(0);
    setShowCertificate(false);
    setCurrentRound(1);
    setRoundNumbersLeft(remaining);
    
    setState(prev => ({
      ...prev,
      gameMode: mode,
      isPlaying: true,
      levelIndex: 1,
      isCorrect: null,
      showIntro: false
    }));

    audioEngine.playClick();
    audioEngine.startBgm(); // Turn on gentle synth pads
    
    // Cheer the child
    setTimeout(() => {
      audioEngine.speakGreeting(state.currentLanguage, TRANSLATIONS[state.currentLanguage].voiceIntro);
    }, 400);
  };

  // Select an option island
  const handleSelectOption = (selectedValue: number) => {
    // Robustly unlock Web Speech API / synthesis context on user interaction gesture
    audioEngine.unlock();

    if (state.isCorrect === true) return; // Prevent double taps during success flow

    if (selectedValue === currentLevel?.number) {
      // CORRECT ANSWER
      audioEngine.playCorrect();
      audioEngine.speakCorrect(state.currentLanguage);

      setState(prev => {
        const newStars = prev.stars + 1;
        const newScore = prev.score + 10;
        try {
          localStorage.setItem('hub_egypt_matching_stars', newStars.toString());
          localStorage.setItem('hub_egypt_matching_score', newScore.toString());
        } catch (e) {}
        return {
          ...prev,
          stars: newStars,
          score: newScore,
          isCorrect: true
        };
      });

      // Track session counts. Game ends and releases Certificate of Excellence on exactly 15 correct choices (3 rounds * 5 questions)
      const nextCorrectCount = correctCountInSession + 1;
      setCorrectCountInSession(nextCorrectCount);

      if (nextCorrectCount >= 15) {
        // High-fidelity kids cheering and sparkles SFX
        setTimeout(() => {
          audioEngine.playCelebration();
        }, 600);

        // Transition to Certificate of Excellence screen after success animation settles
        setTimeout(() => {
          setShowCertificate(true);
        }, 3200);
      } else {
        // Advance automatically to the next level after celebration animation completes
        setTimeout(() => {
          advanceLevel();
        }, 3200);
      }
    } else {
      // WRONG ANSWER
      audioEngine.playWrong();
      audioEngine.speakWrong(state.currentLanguage);

      setState(prev => ({ ...prev, isCorrect: false }));

      // Reset error state after shake animation to allow re-selection
      setTimeout(() => {
        setState(prev => ({ ...prev, isCorrect: null }));
      }, 1500);
    }
  };

  // Move to the next random level
  const advanceLevel = () => {
    setRoundNumbersLeft(prevRemaining => {
      let nextRound = currentRound;
      let nextRemaining = [...prevRemaining];
      let nextTarget = 0;

      if (nextRemaining.length === 0) {
        // Round complete! Advance to next round!
        nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        const nextRoundNums = generateRoundNumbers(state.gameMode);
        nextTarget = nextRoundNums[0];
        nextRemaining = nextRoundNums.slice(1);
      } else {
        // Take the next target number from the current round list
        nextTarget = nextRemaining[0];
        nextRemaining = nextRemaining.slice(1);
      }

      const nextLevel = generateLevel(state.gameMode, previousNumbers, nextTarget);
      
      setCurrentLevel(nextLevel);
      setPreviousNumbers(prevNums => {
        const updated = [...prevNums, nextLevel.number];
        if (updated.length > 5) updated.shift(); // Keep history compact
        return updated;
      });

      setState(prev => ({
        ...prev,
        levelIndex: prev.levelIndex + 1,
        isCorrect: null
      }));

      return nextRemaining;
    });
  };

  // Reset progress and level indexes
  const handleRestart = () => {
    audioEngine.playClick();
    setCorrectCountInSession(0);
    setShowCertificate(false);
    if (state.isPlaying && state.gameMode) {
      const mode = state.gameMode;
      const initialRoundNums = generateRoundNumbers(mode);
      const firstTarget = initialRoundNums[0];
      const remaining = initialRoundNums.slice(1);

      const firstLevel = generateLevel(mode, [], firstTarget);
      setCurrentLevel(firstLevel);
      setPreviousNumbers([firstLevel.number]);
      setCurrentRound(1);
      setRoundNumbersLeft(remaining);

      setState(prev => ({
        ...prev,
        levelIndex: 1,
        isCorrect: null
      }));
    }
  };

  // Back to Landing page
  const handleBackHome = () => {
    audioEngine.playClick();
    audioEngine.stopBgm();
    setCorrectCountInSession(0);
    setShowCertificate(false);
    setCurrentRound(1);
    setRoundNumbersLeft([]);
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isCorrect: null,
      showIntro: true
    }));
  };

  // Trigger screenshot and stitch custom achievement postcard card
  const handleScreenshot = () => {
    audioEngine.playClick();
    const gameStage = document.getElementById('3d-game-stage');
    const glCanvas = gameStage?.querySelector('canvas') as HTMLCanvasElement | null;

    if (!glCanvas) {
      setToastMessage("Error capturing game canvas.");
      return;
    }

    try {
      // Create off-screen compositing canvas
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = 1200;
      compositeCanvas.height = 800;
      const ctx = compositeCanvas.getContext('2d');
      if (!ctx) return;

      // Draw premium gradient brand background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
      bgGrad.addColorStop(0, '#1e3a8a'); // Rich royal blue
      bgGrad.addColorStop(0.5, '#1e293b'); // Dark slate
      bgGrad.addColorStop(1, '#0f172a'); // Midnight black
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 800);

      // Draw golden circular brand elements representing sun rays
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(600, 400, 350, 0, Math.PI * 2);
      ctx.stroke();

      // Draw WebGL scene in the center of our composite canvas
      ctx.drawImage(glCanvas, 100, 120, 1000, 560);

      // Gold border framing the captured 3D gameplay
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.strokeRect(100, 120, 1000, 560);

      // Brand headers and labels
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.fillText("3D NUMBER MATCHING ADVENTURE", 600, 60);

      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText("Impact Hub Egypt • Game #5 Collection", 600, 95);

      // Child achievement text footer
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Space Grotesk", sans-serif';
      ctx.fillText(`Level: ${state.levelIndex}`, 110, 740);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`⭐ Stars: ${state.stars}`, 1090, 740);

      // Save postcard link download trigger
      const dataUrl = compositeCanvas.toDataURL('image/jpeg', 0.9);
      const downloadLink = document.createElement('a');
      downloadLink.download = `Egypt_Games_Match_Level_${state.levelIndex}.jpg`;
      downloadLink.href = dataUrl;
      downloadLink.click();

      // Show temporary successful toast message
      setToastMessage(TRANSLATIONS[state.currentLanguage].screenshotTaken);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.warn("Screenshot stitch failed:", err);
      // Fallback to direct raw canvas download if composite canvas gets blocked by security sandboxing
      try {
        const dataUrl = glCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Egypt_Games_Match_Level_${state.levelIndex}.png`;
        link.href = dataUrl;
        link.click();
        setToastMessage(TRANSLATIONS[state.currentLanguage].screenshotTaken);
        setTimeout(() => setToastMessage(null), 3000);
      } catch (innerErr) {
        setToastMessage("Permission blocked raw capture.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const trans = TRANSLATIONS[state.currentLanguage];
  const isRtl = trans.arRTL;

  return (
    <div className="min-h-screen flex flex-col font-sans select-none antialiased relative">
      {/* Background ambient lighting effects to create clean minimal atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[5%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[#00b894]/4 blur-[100px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#0984e3]/4 blur-[100px]" />
      </div>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-4 flex flex-col relative z-10 justify-between">
        {/* Brand/Branding Navigation Bar */}
        <header className="w-full flex items-center justify-between mb-3">
          {/* Brand/Developer Logo */}
          <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-[#2d3436] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              E5
            </div>
            <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-xs font-extrabold tracking-wide text-[#2d3436]">
                IMPACT HUB EGYPT
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Educational Collection
              </p>
            </div>
          </div>

          {/* Controller & HUD Toggles */}
          <div className="flex items-center gap-2">
            {/* Soft Help Info Toggle */}
            <button
              id="help-info-toggle"
              onClick={() => { audioEngine.playClick(); setShowInfoPanel(!showInfoPanel); }}
              className="w-9 h-9 rounded-xl glass-button flex items-center justify-center text-slate-500 hover:text-[#0984e3] transition-colors"
            >
              <Info className="w-4.5 h-4.5" />
            </button>

            {/* Language Quick Dropdown */}
            <div className="relative group">
              <button
                id="hud-lang-cycle"
                className="w-9 h-9 rounded-xl glass-button flex items-center justify-center text-slate-600 hover:text-[#00b894] transition-colors"
              >
                <Globe className="w-4.5 h-4.5" />
              </button>
              <div className="absolute right-0 mt-1 w-28 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 hidden group-hover:block z-50 overflow-hidden">
                {(['ar', 'en', 'fr', 'de'] as Language[]).map(l => (
                  <button
                    id={`quick-lang-${l}`}
                    key={l}
                    onClick={() => handleSelectLanguage(l)}
                    className={`w-full py-2.5 text-center text-xs font-bold hover:bg-slate-50 block transition-colors border-b border-slate-100/50 ${
                      state.currentLanguage === l ? 'text-[#00b894] bg-[#00b894]/5' : 'text-slate-700'
                    }`}
                  >
                    {l === 'ar' ? 'العربية' : l === 'en' ? 'English' : l === 'fr' ? 'Français' : 'Deutsch'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Synthesizer Toggle */}
            <button
              id="sound-synth-mute"
              onClick={() => setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center shadow-sm ${
                state.soundEnabled 
                  ? 'bg-[#00b894]/10 border-[#00b894]/30 text-[#00b894]' 
                  : 'bg-white/80 border-slate-200/60 text-slate-400'
              }`}
            >
              {state.soundEnabled ? <Volume2 className="w-4.5 h-4.5 animate-pulse" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Elegant browser iframe text-to-speech tip banner */}
        <div 
          className="mb-3 w-full bg-gradient-to-r from-teal-50/70 via-indigo-50/70 to-emerald-50/70 border border-slate-200/60 rounded-2xl p-3 px-4 flex items-start gap-2.5 text-xs text-slate-700 shadow-sm leading-relaxed" 
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <span className="text-base select-none">💡</span>
          <p className="font-semibold text-slate-700">
            {trans.iframeAudioTip}
          </p>
        </div>

        {/* Dynamic Game screen rendering */}
        <AnimatePresence mode="wait">
          {state.showIntro ? (
            <motion.div
              key="intro-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <LanguageSelector 
                currentLanguage={state.currentLanguage}
                onSelectLanguage={handleSelectLanguage}
                onSelectModeAndStart={handleStartGame}
              />
            </motion.div>
          ) : showCertificate ? (
            <motion.div
              key="certificate-screen-parent"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <Certificate 
                studentName={studentName}
                setStudentName={setStudentName}
                stars={state.stars}
                score={state.score}
                gameMode={state.gameMode}
                language={state.currentLanguage}
                onPlayAgain={() => {
                  setCorrectCountInSession(0);
                  setShowCertificate(false);
                  handleStartGame(state.gameMode);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="active-adventure-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-between gap-3 w-full"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Score HUD & Instructions bar */}
              <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 px-1.5">
                {/* Level Details & Stars */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                  <div className="flex items-center gap-1.5 bg-white/85 py-1.5 px-3.5 rounded-xl border border-slate-200/40 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trans.level}</span>
                    <span className="text-sm font-black text-[#2d3436]">{state.levelIndex}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#00b894]/5 py-1.5 px-3.5 rounded-xl border border-[#00b894]/20 shadow-sm">
                    <Star className="w-4 h-4 text-[#00b894] fill-[#00b894] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#00b894] uppercase tracking-widest">{trans.stars}</span>
                    <span className="text-sm font-black text-[#00b894]">{state.stars}</span>
                  </div>
                </div>

                {/* Localized Instructions Bar */}
                <div className="w-full md:flex-1 max-w-lg bg-white border border-slate-200/60 rounded-2xl py-2.5 px-5 shadow-sm text-center flex items-center justify-center gap-3 relative overflow-hidden">
                  <div className="absolute top-[-30%] left-[-10%] w-24 h-24 rounded-full bg-[#00b894]/5 blur-md" />
                  <p className="text-sm md:text-base font-extrabold tracking-wide text-[#2d3436]">
                    {currentLevel && trans.instructions.replace('{count}', currentLevel.number.toString())}
                  </p>
                  
                  {/* Read Instruction voice trigger button */}
                  <button
                    id="speak-instructions-repeat"
                    onClick={() => currentLevel && audioEngine.speakInstruction(state.currentLanguage, currentLevel.number)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                    title="Repeat Voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Adventure actions toolbar */}
                <div className="flex items-center gap-1.5 justify-end w-full md:w-auto">
                  {/* Take Screenshot */}
                  <button
                    id="hud-take-screenshot"
                    onClick={handleScreenshot}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0984e3] border border-slate-200/60 shadow-sm transition-all"
                    title="Take Postcard Screenshot"
                  >
                    <Camera className="w-4.5 h-4.5" />
                  </button>

                  {/* Level Restart */}
                  <button
                    id="hud-level-restart"
                    onClick={handleRestart}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-[#00b894] border border-slate-200/60 shadow-sm transition-all"
                    title={trans.restart}
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                  </button>

                  {/* Back Home */}
                  <button
                    id="hud-back-home"
                    onClick={handleBackHome}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-[#ff7675] border border-slate-200/60 shadow-sm transition-all"
                    title={trans.backHome}
                  >
                    <Home className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Kid-friendly Round & Question Progress Tracker */}
              <div className="w-full bg-white/90 border border-slate-200/50 rounded-2xl p-3 px-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-800 font-black text-xs">
                    {currentRound}
                  </span>
                  <div className="text-sm font-extrabold text-slate-700">
                    {trans.roundProgress
                      .replace('{round}', currentRound.toString())
                      .replace('{left}', roundNumbersLeft.length.toString())}
                  </div>
                </div>
                <div className="flex-1 max-w-md w-full bg-slate-100 h-4 rounded-full overflow-hidden relative border border-slate-200/40">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-[#00b894] h-full rounded-full transition-all duration-500"
                    style={{ width: `${((5 - roundNumbersLeft.length) / 5) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-600 leading-none">
                    {5 - roundNumbersLeft.length} / 5
                  </span>
                </div>
              </div>

              {/* Central Three.js 3D matching environment */}
              <div className="w-full relative min-h-[460px] lg:min-h-[520px] rounded-3xl border border-slate-200/40 overflow-hidden bg-slate-50/50 shadow-inner">
                {currentLevel && (
                  <ThreeGame 
                    targetNumber={currentLevel.number}
                    options={currentLevel.options}
                    objectType={currentLevel.objectType}
                    currentLanguage={state.currentLanguage}
                    onSelectOption={handleSelectOption}
                    isCorrect={state.isCorrect}
                    soundEnabled={state.soundEnabled}
                  />
                )}

                {/* Floating success screen overlay with responsive entry animations */}
                <AnimatePresence>
                  {state.isCorrect === true && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-40 p-6 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-md bg-white p-8 rounded-3xl border border-slate-200/60 shadow-xl flex flex-col items-center relative overflow-hidden"
                      >
                        {/* Decorative background subtle glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,184,148,0.04)_0%,rgba(255,255,255,0)_70%)] pointer-events-none" />

                        {/* Minimalist icon container */}
                        <div className="relative mb-6">
                          <div className="w-20 h-20 rounded-full bg-[#00b894]/10 flex items-center justify-center border border-[#00b894]/20">
                            <Star className="w-10 h-10 text-[#00b894] fill-[#00b894]" />
                          </div>
                          <Sparkles className="w-5 h-5 text-[#00b894] absolute -top-1 -right-1 animate-pulse" />
                        </div>

                        <h2 className="text-2xl md:text-3xl font-extrabold text-[#2d3436] tracking-tight">
                          {trans.correctAnswer}
                        </h2>

                        <p className="text-xs font-semibold text-slate-400 tracking-widest mt-2 flex items-center gap-1.5 uppercase">
                          <CheckCircle className="w-4 h-4 text-[#00b894]" />
                          <span>+10 EXP & 1 STAR</span>
                        </p>

                        <div className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-xl text-[#2d3436] font-bold text-xs">
                          <span>LEVEL UP</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Friendly encouragement warning flash overlay (does not lock screen) */}
                <AnimatePresence>
                  {state.isCorrect === false && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-4 left-4 right-4 bg-[#ff7675] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg z-50 max-w-md mx-auto"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
                        <span className="text-sm font-extrabold tracking-wide">
                          {trans.wrongAnswer}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Temporary toast messages for system operations */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2d3436] text-white font-bold text-xs px-4 py-2.5 rounded-full z-50 flex items-center gap-2 shadow-lg"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00b894] animate-ping" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Educational Info Backdrop details panel */}
        <AnimatePresence>
          {showInfoPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white max-w-md w-full rounded-3xl border border-slate-200/60 shadow-xl p-6 relative overflow-hidden text-[#2d3436]"
              >
                <h3 className="text-base font-extrabold mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00b894]" />
                  <span>3D Number Matching Adventure</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  This game is part of the <strong>Egypt Educational Games Collection</strong>, designed specifically for toddlers and preschool kids aged 3–6. It fosters counting proficiency, digit-to-quantity mapping, and spatial perception by allowing children to touch floating low-poly islands carrying different item counts.
                </p>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4 text-[11px] text-slate-600 leading-relaxed space-y-1.5">
                  <p><strong>🇪🇬 MULTI-LANGUAGE</strong>: Fully spoken voices in Arabic, English, French, and German.</p>
                  <p><strong>🎨 NO PUNISHMENTS</strong>: Preschoolers are greeted with friendly shakes, encouraging reminders, and endless trials with 100% positive feedback.</p>
                  <p><strong>🎯 OFFLINE READY</strong>: Complete offline operation using high-fidelity Web Synthesis & Web Audio.</p>
                </div>
                <button
                  id="close-info-panel"
                  onClick={() => { audioEngine.playClick(); setShowInfoPanel(false); }}
                  className="w-full py-2.5 bg-[#2d3436] hover:bg-black text-white rounded-xl font-bold text-xs tracking-wider transition-colors"
                >
                  Close Info
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
