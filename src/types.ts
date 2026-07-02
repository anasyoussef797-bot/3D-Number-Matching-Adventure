export type Language = 'en' | 'ar' | 'fr' | 'de';

export type GameMode = 'easy' | 'medium' | 'hard';

export type ObjectType = 'apples' | 'stars' | 'balloons' | 'blocks' | 'fish' | 'cars' | 'trees' | 'cats' | 'dogs' | 'pandas' | 'bunnies' | 'lions';

export interface LevelConfig {
  number: number; // The target number to match
  options: number[]; // The 4 quantities to choose from
  objectType: ObjectType;
}

export interface GameState {
  currentLanguage: Language;
  score: number;
  stars: number;
  levelIndex: number;
  gameMode: GameMode;
  isPlaying: boolean;
  isCorrect: boolean | null; // null = idle, true = success, false = fail
  soundEnabled: boolean;
  showIntro: boolean;
}

export interface TranslationSet {
  title: string;
  subtitle: string;
  developedBy: string;
  playGame: string;
  selectLanguage: string;
  easyMode: string;
  mediumMode: string;
  hardMode: string;
  score: string;
  stars: string;
  level: string;
  correctAnswer: string;
  wrongAnswer: string;
  instructions: string;
  backHome: string;
  restart: string;
  screenshotTaken: string;
  voiceIntro: string;
  arRTL: boolean;
  certTitle: string;
  certAwardedTo: string;
  certDescription: string;
  certNamePlaceholder: string;
  certDownloadBtn: string;
  certPrintBtn: string;
  certPlayAgain: string;
  certSchoolPlatform: string;
  roundLabel: string;
  roundProgress: string;
  iframeAudioTip: string;
  nextLevelBtn: string;
}

export const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: {
    title: "3D Number Matching Adventure",
    subtitle: "Egypt Educational Games Collection • Game #5",
    developedBy: "Developed by Impact Hub Egypt",
    playGame: "Play Adventure",
    selectLanguage: "Select Language / اختر اللغة",
    easyMode: "Numbers 1 - 5",
    mediumMode: "Numbers 1 - 10",
    hardMode: "Numbers 1 - 20",
    score: "Score",
    stars: "Stars",
    level: "Level",
    correctAnswer: "Excellent! You matched the number!",
    wrongAnswer: "Let's count again! You can do it!",
    instructions: "Touch the group that has {count} items",
    backHome: "Home",
    restart: "Restart",
    screenshotTaken: "Screenshot captured successfully!",
    voiceIntro: "Welcome! Count the objects and touch the correct island!",
    arRTL: false,
    certTitle: "CERTIFICATE OF EXCELLENCE",
    certAwardedTo: "Proudly Awarded to the Super Kid Hero:",
    certDescription: "For outstanding brilliance in matching and counting 3D objects with absolute perfection!",
    certNamePlaceholder: "Type your amazing name here...",
    certDownloadBtn: "Download Certificate (PNG Image)",
    certPrintBtn: "Print Certificate / Save PDF",
    certPlayAgain: "Play Again 🎮",
    certSchoolPlatform: "Upload this certificate to your school/foundation platform to prove your home work is done! 🎉",
    roundLabel: "Round",
    roundProgress: "Round {round} of 3 • {left} numbers left",
    iframeAudioTip: "💡 If you do not hear the voice audio speaking, please open the game in a new tab (top right icon with arrow) to fully enable browser Speech Synthesis!",
    nextLevelBtn: "Next Number ➔",
  },
  ar: {
    title: "مغامرة مطابقة الأرقام ثلاثية الأبعاد",
    subtitle: "مجموعة الألعاب التعليمية • اللعبة الخامسة",
    developedBy: "تم التطوير بواسطة إمباكت هب مصر",
    playGame: "ابدأ المغامرة",
    selectLanguage: "اختر اللغة / Select Language",
    easyMode: "الأرقام ١ - ٥",
    mediumMode: "الأرقام ١ - ١٠",
    hardMode: "الأرقام ١ - ٢٠",
    score: "النقاط",
    stars: "النجوم",
    level: "المستوى",
    correctAnswer: "ممتاز! لقد طابقت الرقم بشكل صحيح!",
    wrongAnswer: "لنعد معاً مرة أخرى! يمكنك فعلها!",
    instructions: "المس المجموعة التي تحتوي على {count} من العناصر",
    backHome: "الرئيسية",
    restart: "إعادة اللعب",
    screenshotTaken: "تم التقاط لقطة الشاشة بنجاح!",
    voiceIntro: "مرحباً بك! عُد العناصر والمس الجزيرة الصحيحة!",
    arRTL: true,
    certTitle: "شهادة تفوق وتميز",
    certAwardedTo: "تُمنح هذه الشهادة بكل فخر للبطل المتميز:",
    certDescription: "لتميزه وإبداعه الفائق في عد ومطابقة الأرقام ثلاثية الأبعاد وإنجاز كامل الواجب المدرسي بنجاح باهر!",
    certNamePlaceholder: "اكتب اسمك البطل هنا...",
    certDownloadBtn: "تحميل شهادة التفوق (PNG)",
    certPrintBtn: "طباعة الشهادة وحفظها كـ PDF",
    certPlayAgain: "العب مرة أخرى 🎮",
    certSchoolPlatform: "ارفع هذه الشهادة على منصة المؤسسة كدليل على أنك أنجزت الهوم ورك بنجاح! 🎉",
    roundLabel: "الجولة",
    roundProgress: "الجولة {round} من ٣ • متبقي {left} أرقام",
    iframeAudioTip: "💡 إذا لم تسمع الصوت العربي ينطق الأرقام، يرجى فتح اللعبة في نافذة جديدة مستقلة من زر التبويب الجديد في أعلى اليمين (مربع به سهم) لتفعيل الصوت بالكامل!",
    nextLevelBtn: "الرقم التالي ➔",
  },
  fr: {
    title: "Aventure d'Association 3D",
    subtitle: "Impact Hub Égypte • Jeu #5",
    developedBy: "Développé par Impact Hub Égypte",
    playGame: "Jouer à l'Aventure",
    selectLanguage: "Sélectionner la Langue",
    easyMode: "Chiffres 1 - 5",
    mediumMode: "Chiffres 1 - 10",
    hardMode: "Chiffres 1 - 20",
    score: "Score",
    stars: "Étoiles",
    level: "Niveau",
    correctAnswer: "Excellent! Vous avez trouvé le bon nombre!",
    wrongAnswer: "Comptons encore! Tu peux le faire!",
    instructions: "Touchez le groupe qui contient {count} éléments",
    backHome: "Accueil",
    restart: "Recommencer",
    screenshotTaken: "Capture d'écran réussie!",
    voiceIntro: "Bienvenue! Compte les objets et touche la bonne île!",
    arRTL: false,
    certTitle: "CERTIFICAT D'EXCELLENCE",
    certAwardedTo: "Décerné fièrement au Super Héros:",
    certDescription: "Pour sa réussite exceptionnelle dans le comptage et l'association d'objets 3D avec brio!",
    certNamePlaceholder: "Écris ton nom ici...",
    certDownloadBtn: "Télécharger le Certificat (PNG)",
    certPrintBtn: "Imprimer / Enregistrer en PDF",
    certPlayAgain: "Rejouer 🎮",
    certSchoolPlatform: "Télécharge ce certificat sur la plateforme pour prouver que tes devoirs sont faits! 🎉",
    roundLabel: "Manche",
    roundProgress: "Manche {round} sur 3 • {left} restants",
    iframeAudioTip: "💡 Si vous n'entendez pas la voix, veuillez ouvrir le jeu dans un nouvel onglet (icône en haut à droite) pour activer la synthèse vocale !",
    nextLevelBtn: "Nombre Suivant ➔",
  },
  de: {
    title: "3D Zahlen-Verbindungs Abenteuer",
    subtitle: "Impact Hub Ägypten • Spiel #5",
    developedBy: "Entwickelt von Impact Hub Ägypten",
    playGame: "Abenteuer Starten",
    selectLanguage: "Sprachauswahl",
    easyMode: "Zahlen 1 - 5",
    mediumMode: "Zahlen 1 - 10",
    hardMode: "Zahlen 1 - 20",
    score: "Punkte",
    stars: "Sterne",
    level: "Stufe",
    correctAnswer: "Ausgezeichnet! Das ist die richtige Zahl!",
    wrongAnswer: "Lass uns noch einmal zählen! Du schaffst das!",
    instructions: "Berühre die Gruppe mit genau {count} Dingen",
    backHome: "Startseite",
    restart: "Neustart",
    screenshotTaken: "Screenshot erfolgreich aufgenommen!",
    voiceIntro: "Willkommen! Zähle die Objekte und berühre die richtige Insel!",
    arRTL: false,
    certTitle: "URKUNDE FÜR EXZELLENZ",
    certAwardedTo: "Stolz überreicht an den Super-Helden:",
    certDescription: "Für herausragende Leistungen beim Zählen und Zuordnen von 3D-Zahlen mit Bravour!",
    certNamePlaceholder: "Schreibe deinen Namen hier...",
    certDownloadBtn: "Urkunde herunterladen (PNG)",
    certPrintBtn: "Urkunde drucken / PDF speichern",
    certPlayAgain: "Nochmal spielen 🎮",
    certSchoolPlatform: "Lade diese Urkunde auf deine Schulplattform hoch, um zu beweisen, dass du deine Hausaufgaben gemacht hast! 🎉",
    roundLabel: "Runde",
    roundProgress: "Runde {round} von 3 • {left} übrig",
    iframeAudioTip: "💡 Wenn du die Stimme nicht hörst, öffne das Spiel bitte in einem neuen Tab (Symbol oben rechts), um die Sprachausgabe zu aktivieren!",
    nextLevelBtn: "Nächste Zahl ➔",
  }
};
