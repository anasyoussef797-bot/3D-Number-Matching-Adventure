import { useEffect, useRef } from 'react';
import { Language, TRANSLATIONS } from '../types';
import { motion } from 'motion/react';
import { Award, Download, Printer, RotateCcw, Sparkles, Star } from 'lucide-react';

interface CertificateProps {
  studentName: string;
  setStudentName: (name: string) => void;
  stars: number;
  score: number;
  gameMode: string;
  language: Language;
  onPlayAgain: () => void;
}

export function Certificate({
  studentName,
  setStudentName,
  stars,
  score,
  gameMode,
  language,
  onPlayAgain
}: CertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trans = TRANSLATIONS[language];
  const isRtl = trans.arRTL;

  // Format today's date nicely based on language
  const getFormattedDate = () => {
    try {
      const today = new Date();
      return today.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return new Date().toDateString();
    }
  };

  const formattedDate = getFormattedDate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 1000, 700);

    // 1. Draw luxurious soft cream certificate background
    ctx.fillStyle = '#FFFDF6';
    ctx.fillRect(0, 0, 1000, 700);

    // 2. Draw luxury gradient side panels/curves or background sparkles
    ctx.fillStyle = 'rgba(0, 184, 148, 0.03)';
    ctx.beginPath();
    ctx.arc(0, 0, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1000, 700, 300, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw outer double borders
    // Mint outer border
    ctx.strokeStyle = '#00b894';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 960, 660);

    // Dark charcoal inner thin border
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(34, 34, 932, 632);

    // 4. Draw elegant decorative corner stars / ribbons
    const cornerOffsets = [
      { x: 34, y: 34 },
      { x: 966, y: 34 },
      { x: 34, y: 666 },
      { x: 966, y: 666 }
    ];

    cornerOffsets.forEach(corner => {
      ctx.fillStyle = '#fbc531';
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw mini white star inside
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.direction = 'ltr';
      ctx.fillText('★', corner.x, corner.y);
    });

    // 5. Draw Top Seal & Ribbon
    // Red Ribbons
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.moveTo(500 - 25, 45);
    ctx.lineTo(500 - 35, 120);
    ctx.lineTo(500 - 10, 105);
    ctx.lineTo(500 - 5, 120);
    ctx.lineTo(500, 45);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(500, 45);
    ctx.lineTo(500 + 5, 120);
    ctx.lineTo(500 + 10, 105);
    ctx.lineTo(500 + 35, 120);
    ctx.lineTo(500 + 25, 45);
    ctx.fill();

    // Gold circular seal
    const sealGrad = ctx.createRadialGradient(500, 65, 5, 500, 65, 30);
    sealGrad.addColorStop(0, '#fbc531');
    sealGrad.addColorStop(1, '#e1b12c');
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(500, 65, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Seal details (star)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'ltr';
    ctx.fillText('★', 500, 65);

    // Set text direction properly for Arabic vs others
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    // 6. Impact Hub Egypt Organization Header Text
    ctx.fillStyle = '#57606f';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(trans.developedBy.toUpperCase(), 500, 125);

    // 7. Main Certificate Title
    ctx.fillStyle = '#00b894';
    ctx.font = 'bold 42px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(trans.certTitle, 500, 185);

    // 8. Elegant separator line
    ctx.strokeStyle = 'rgba(0, 184, 148, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, 205);
    ctx.lineTo(650, 205);
    ctx.stroke();

    // 9. Awarded to subtext
    ctx.fillStyle = '#2d3436';
    ctx.font = 'italic 20px "Arial", sans-serif';
    ctx.fillText(trans.certAwardedTo, 500, 245);

    // 10. Draw HERO STUDENT'S NAME in massive gorgeous typography
    const displayName = studentName.trim() || (isRtl ? 'بطل الأرقام الرائع' : 'Amazing Numbers Hero');
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 48px "Arial", sans-serif';
    ctx.fillText(displayName, 500, 315);

    // Elegant underline decoration for the name
    ctx.strokeStyle = '#fbc531';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const nameWidth = ctx.measureText(displayName).width;
    ctx.moveTo(500 - nameWidth / 2 - 15, 335);
    ctx.lineTo(500 + nameWidth / 2 + 15, 335);
    ctx.stroke();

    // Tiny star ornament below name
    ctx.fillStyle = '#fbc531';
    ctx.font = '22px Arial';
    ctx.direction = 'ltr';
    ctx.fillText('★ ★ ★', 500, 365);
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    // 11. Description of Achievement
    ctx.fillStyle = '#2d3436';
    ctx.font = '18px "Arial", sans-serif';
    
    // Wrap description if it is too long
    const descText = trans.certDescription;
    ctx.fillText(descText, 500, 415);

    // 12. Stats Grid Badge at bottom
    const boxX = 300;
    const boxY = 460;
    const boxW = 400;
    const boxH = 95;

    // Draw Stats Box Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect?.(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 184, 148, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Score & Stars inside Box
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 16px "Arial", sans-serif';
    ctx.textAlign = 'center';
    
    const modeLabel = gameMode === 'easy' ? TRANSLATIONS[language].easyMode : gameMode === 'medium' ? TRANSLATIONS[language].mediumMode : TRANSLATIONS[language].hardMode;
    ctx.fillText(`${modeLabel}`, 500, boxY + 30);

    ctx.fillStyle = '#00b894';
    ctx.font = 'bold 20px "Arial", sans-serif';
    ctx.fillText(`⭐ ${stars} ${TRANSLATIONS[language].stars}     •     🏆 ${score} ${TRANSLATIONS[language].score}`, 500, boxY + 65);

    // 13. Left/Right Footer Signature & Date
    // Date Footer (Left-ish for LTR, Right-ish for RTL)
    ctx.fillStyle = '#57606f';
    ctx.font = '14px "Arial", sans-serif';
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(`${isRtl ? 'تاريخ الإنجاز:' : 'Date:'} ${formattedDate}`, isRtl ? 720 : 150, 610);

    // Signature Footer (Right-ish for LTR, Left-ish for RTL)
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold italic 15px "Arial", sans-serif';
    ctx.fillText(isRtl ? 'مؤسسة إمباكت هب مصر' : 'Impact Hub Egypt', isRtl ? 150 : 720, 600);

    // Cute green stamp circle on signature
    ctx.strokeStyle = 'rgba(0, 184, 148, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(isRtl ? 230 : 810, 600, 32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 184, 148, 0.08)';
    ctx.beginPath();
    ctx.arc(isRtl ? 230 : 810, 600, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00b894';
    ctx.font = 'bold 11px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PASSED', isRtl ? 230 : 810, 595);
    ctx.fillText('EGYPT', isRtl ? 230 : 810, 610);

  }, [studentName, stars, score, gameMode, language, isRtl, formattedDate]);

  // Handle Certificate Image Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (studentName.trim() || 'Hero').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
      link.download = `Certificate_Excellence_${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to download canvas certificate:", e);
    }
  };

  // Handle Printing Certificate
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const windowContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${trans.certTitle}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #ffffff;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            @page {
              size: landscape;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(windowContent);
        printWindow.document.close();
      } else {
        // Fallback: Trigger direct printing or download
        handleDownload();
      }
    } catch (e) {
      console.error("Failed to print certificate:", e);
      handleDownload();
    }
  };

  return (
    <div 
      id="certificate-screen"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex flex-col items-center justify-center py-6 px-4 max-w-4xl mx-auto w-full text-[#2d3436]"
    >
      {/* Sparkly Top Message Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-500 font-bold text-xs tracking-wider uppercase mb-3">
          <Star className="w-4 h-4 fill-amber-400 animate-spin" />
          <span>{isRtl ? 'مبارك يا بطل! لقد أنجزت الواجب المدرسي!' : 'HOORAY! YOU COMPLETED YOUR HOMEWORK!'}</span>
          <Star className="w-4 h-4 fill-amber-400 animate-spin" />
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">
          {isRtl ? '🎉 شهادة التفوق والتميز الخاصة بك جاهزة!' : '🎉 Your Certificate of Excellence is Ready!'}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-2 font-medium max-w-2xl">
          {trans.certSchoolPlatform}
        </p>
      </motion.div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start mt-2">
        
        {/* Left Side: Live Editable Certificate Card Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="w-full bg-white rounded-3xl p-3 shadow-xl border border-slate-200/50 overflow-hidden relative"
          >
            {/* Aspect ratio bounding box for fully responsive canvas wrapper */}
            <div className="w-full h-0 pb-[70%] relative">
              <canvas
                id="achievement-certificate-canvas"
                ref={canvasRef}
                width="1000"
                height="700"
                className="absolute inset-0 w-full h-full object-contain rounded-2xl bg-white shadow-inner"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Side: Student Name Input Form & Certificate Download Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          <motion.div
            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-3xl p-5 shadow-lg flex flex-col gap-4"
          >
            {/* Input Name form */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#00b894]" />
                <span>{isRtl ? 'اكتب اسمك الرائع هنا للشهادة:' : 'Write your amazing name here:'}</span>
              </label>
              <input
                id="cert-student-name-input"
                type="text"
                value={studentName}
                maxLength={45}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={trans.certNamePlaceholder}
                className="w-full bg-white border-2 border-slate-200 focus:border-[#00b894] rounded-2xl px-4 py-3 text-sm font-extrabold focus:outline-none transition-all shadow-inner text-slate-800"
                dir={isRtl ? 'rtl' : 'ltr'}
              />
              <p className="text-[10px] text-slate-400 font-bold">
                {isRtl 
                  ? '💡 سيظهر اسمك مباشرة على الشهادة في الجهة المقابلة بالخط العريض.' 
                  : '💡 Your name will update in real-time on the certificate graphic above.'}
              </p>
            </div>

            {/* Print, Save, Download Toolbar Panel */}
            <div className="flex flex-col gap-3.5 mt-2">
              {/* Download PNG Button */}
              <button
                id="cert-download-btn"
                onClick={handleDownload}
                className="w-full py-3.5 px-5 bg-[#00b894] hover:bg-[#00a884] text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                <Download className="w-4.5 h-4.5" />
                <span>{trans.certDownloadBtn}</span>
              </button>

              {/* Print / Save PDF Button */}
              <button
                id="cert-print-btn"
                onClick={handlePrint}
                className="w-full py-3.5 px-5 bg-[#2d3436] hover:bg-black text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                <Printer className="w-4.5 h-4.5" />
                <span>{trans.certPrintBtn}</span>
              </button>

              {/* Decorative spacer line */}
              <div className="border-t border-slate-200/60 my-1" />

              {/* Play Again Reset Button */}
              <button
                id="cert-play-again-btn"
                onClick={onPlayAgain}
                className="w-full py-3.5 px-5 bg-amber-400 hover:bg-amber-500 text-[#2d3436] rounded-2xl font-black text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                <RotateCcw className="w-4.5 h-4.5" />
                <span>{trans.certPlayAgain}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
