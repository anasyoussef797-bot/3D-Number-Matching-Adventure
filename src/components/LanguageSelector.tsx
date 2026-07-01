import React from 'react';
import { Language, GameMode, TRANSLATIONS } from '../types';
import { Sparkles, Play, Award, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onSelectModeAndStart: (mode: GameMode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  onSelectModeAndStart
}) => {
  const trans = TRANSLATIONS[currentLanguage];
  const isRtl = trans.arRTL;

  // Language buttons details
  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇪🇬' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ];

  // Difficulty modes
  const modes: { code: GameMode; label: string; color: string; desc: string; badge: string }[] = [
    { 
      code: 'easy', 
      label: trans.easyMode, 
      color: 'from-green-400 to-emerald-500 shadow-green-200', 
      desc: currentLanguage === 'ar' ? 'مناسب للأطفال من سن ٣ إلى ٤ سنوات' : 'Perfect for ages 3-4',
      badge: '★'
    },
    { 
      code: 'medium', 
      label: trans.mediumMode, 
      color: 'from-amber-400 to-orange-500 shadow-orange-200', 
      desc: currentLanguage === 'ar' ? 'مناسب للأطفال من سن ٤ إلى ٥ سنوات' : 'Perfect for ages 4-5',
      badge: '★★'
    },
    { 
      code: 'hard', 
      label: trans.hardMode, 
      color: 'from-pink-400 to-rose-500 shadow-rose-200', 
      desc: currentLanguage === 'ar' ? 'مناسب للأطفال من سن ٥ إلى ٦ سنوات' : 'Perfect for ages 5-6',
      badge: '★★★'
    }
  ];

  return (
    <div 
      id="intro-language-screen"
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="flex flex-col items-center justify-center min-h-[90vh] py-6 px-4 text-[#2d3436] relative overflow-hidden"
    >
      {/* Decorative Rotating Smiley Sun */}
      <motion.div
        className="absolute top-6 right-6 md:top-12 md:right-12 text-amber-400 pointer-events-none hidden sm:block z-0"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
      >
        <svg width="70" height="70" viewBox="0 0 100 100" className="drop-shadow-sm opacity-90">
          <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <line x1="50" y1="10" x2="50" y2="20" />
            <line x1="50" y1="80" x2="50" y2="90" />
            <line x1="10" y1="50" x2="20" y2="50" />
            <line x1="80" y1="50" x2="90" y2="50" />
            <line x1="21" y1="21" x2="29" y2="29" />
            <line x1="71" y1="71" x2="79" y2="79" />
            <line x1="21" y1="79" x2="29" y2="71" />
            <line x1="71" y1="29" x2="79" y2="21" />
          </g>
          <circle cx="50" cy="50" r="22" fill="currentColor" />
          <circle cx="43" cy="46" r="3" fill="#2d3436" />
          <circle cx="57" cy="46" r="3" fill="#2d3436" />
          <path d="M 40 54 Q 50 64 60 54" stroke="#2d3436" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </svg>
      </motion.div>

      {/* Decorative Floating Balloon Left */}
      <motion.div
        className="absolute left-6 md:left-12 bottom-1/4 pointer-events-none hidden md:block z-0"
        animate={{ y: [0, -25, 0], rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
      >
        <svg width="55" height="85" viewBox="0 0 60 90" className="drop-shadow-sm opacity-90">
          <ellipse cx="30" cy="35" rx="20" ry="25" fill="#ff7675" />
          <polygon points="30,60 26,65 34,65" fill="#ff7675" />
          <path d="M 30 65 Q 25 75 32 85" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        </svg>
      </motion.div>

      {/* Decorative Floating Balloon Right */}
      <motion.div
        className="absolute right-6 md:right-12 bottom-1/3 pointer-events-none hidden md:block z-0"
        animate={{ y: [0, -35, 0], rotate: [6, -6, 6] }}
        transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut", delay: 0.8 }}
      >
        <svg width="55" height="85" viewBox="0 0 60 90" className="drop-shadow-sm opacity-90">
          <ellipse cx="30" cy="35" rx="18" ry="23" fill="#0984e3" />
          <polygon points="30,58 27,62 33,62" fill="#0984e3" />
          <path d="M 30 62 Q 35 72 28 82" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        </svg>
      </motion.div>

      {/* Decorative Bouncy Smiling Apple Left */}
      <motion.div
        className="absolute left-8 md:left-20 top-20 pointer-events-none hidden sm:block z-0"
        animate={{ y: [0, -12, 0], scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
      >
        <svg width="45" height="45" viewBox="0 0 50 50" className="drop-shadow-sm text-red-500 opacity-90">
          <path d="M 25 15 C 20 8, 10 12, 10 24 C 10 36, 20 40, 25 36 C 30 40, 40 36, 40 24 C 40 12, 30 8, 25 15" fill="currentColor" />
          <path d="M 25 15 Q 27 10 32 8" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 28 10 Q 34 10 32 14 Q 26 14 28 10" fill="#22c55e" />
          <circle cx="18" cy="23" r="2.5" fill="white" />
          <circle cx="32" cy="23" r="2.5" fill="white" />
          <path d="M 20 28 Q 25 32 30 28" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </motion.div>

      {/* Clean Minimalism Egypt Educational Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#00b894]/10 border border-[#00b894]/20 text-[#00b894] font-medium text-xs tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Impact Hub Egypt</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#2d3436] pb-1 font-display">
          {trans.title}
        </h1>
        <p className="text-sm md:text-base font-medium text-slate-500 mt-2 max-w-lg mx-auto">
          {trans.subtitle}
        </p>
      </motion.div>

      {/* Main Glassmorphic Panel */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-xl glass-panel rounded-3xl p-6 md:p-8"
      >
        {/* Language Selection Bar */}
        <div className="mb-8">
          <h2 className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            {trans.selectLanguage}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {languages.map((lang) => {
              const active = currentLanguage === lang.code;
              return (
                <button
                  id={`lang-btn-${lang.code}`}
                  key={lang.code}
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`relative overflow-hidden py-3.5 px-4 rounded-2xl font-bold transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0.5 border ${
                    active 
                      ? 'bg-[#2d3436] text-white border-[#2d3436] shadow-sm' 
                      : 'bg-white/50 hover:bg-white border-slate-200/60 text-[#2d3436]'
                  }`}
                >
                  <span className="text-xl block mb-1">{lang.flag}</span>
                  <span className="text-xs tracking-wide">{lang.label}</span>
                  {active && (
                    <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#00b894] animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selection Column */}
        <div>
          <div className="space-y-3">
            {modes.map((m) => (
              <button
                id={`difficulty-btn-${m.code}`}
                key={m.code}
                onClick={() => onSelectModeAndStart(m.code)}
                className="w-full relative overflow-hidden group flex items-center justify-between p-4.5 rounded-2xl border border-slate-200/50 bg-white/60 hover:bg-white/95 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Minimalist left color indicator */}
                <div className={`absolute top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-1.5 bg-gradient-to-b ${m.color}`} />

                <div className={`flex flex-col text-left ${isRtl ? 'pr-4 text-right' : 'pl-4 text-left'}`}>
                  <span className="text-[10px] font-bold tracking-widest text-[#00b894] mb-0.5 uppercase flex items-center gap-1">
                    <span>{m.badge}</span>
                  </span>
                  <span className="text-base font-bold text-[#2d3436] tracking-wide group-hover:text-[#0984e3] transition-colors">
                    {m.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5">
                    {m.desc}
                  </span>
                </div>

                <div className={`flex items-center gap-2 ${isRtl ? 'mr-auto pl-2' : 'ml-auto pr-2'}`}>
                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-[#2d3436] text-[#2d3436] group-hover:text-white flex items-center justify-center transition-all duration-200">
                    <Play className={`w-3.5 h-3.5 fill-current ${isRtl ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Developer footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 text-center"
      >
        <p className="text-[11px] font-bold text-slate-400 tracking-widest flex items-center justify-center gap-1">
          <Award className="w-3.5 h-3.5 text-[#00b894]" />
          {trans.developedBy.toUpperCase()}
        </p>
      </motion.div>
    </div>
  );
};
