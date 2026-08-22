import React, { useState, useEffect, useRef } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { useLanguage } from '../context/LanguageContext';

export const NirvighnaSplash = ({ onComplete, isPreview = false }) => {
  const { currentLanguage } = useLanguage();
  const [isExiting, setIsExiting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hasFinishedRef = useRef(false);

  // Hide native capacitor splash immediately when React mounts
  useEffect(() => {
    try {
      SplashScreen.hide();
    } catch (_) {}
  }, []);

  // Check accessibility reduced-motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Main lifecycle timing controller
  useEffect(() => {
    // Phase 4 Exit Transition begins at 2800ms, completed at 3100ms
    const exitDuration = prefersReducedMotion ? 1200 : 2800;
    const finishDuration = prefersReducedMotion ? 1500 : 3100;
    const safetyTimeout = 3500; // Hard max cap to prevent any user block

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, exitDuration);

    const finishTimer = setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        if (onComplete) onComplete();
      }
    }, finishDuration);

    const maxCapTimer = setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        if (onComplete) onComplete();
      }
    }, safetyTimeout);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      clearTimeout(maxCapTimer);
    };
  }, [onComplete, prefersReducedMotion]);

  // Tap-to-skip interruptibility
  const handleTapToSkip = () => {
    if (!hasFinishedRef.current) {
      setIsExiting(true);
      setTimeout(() => {
        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true;
          if (onComplete) onComplete();
        }
      }, 200);
    }
  };

  const letters = ['N', 'I', 'R', 'V', 'I', 'G', 'H', 'N', 'A'];

  const taglines = {
    en: 'Yatra bina vighna ke',
    hi: 'यात्रा बिना विघ्न के',
    gu: 'યાત્રા વિના વિઘ્ને'
  };

  const subTaglines = {
    en: 'Divine Path • Safe Darshan',
    hi: 'दिव्य पथ • सुगम दर्शन',
    gu: 'દિવ્ય પથ • સુગમ દર્શન'
  };

  const activeTagline = taglines[currentLanguage] || taglines.en;
  const activeSubTagline = subTaglines[currentLanguage] || subTaglines.en;

  return (
    <div
      onClick={handleTapToSkip}
      className={`fixed inset-0 z-[9999999] bg-[#0F0D0E] text-white flex flex-col items-center justify-center select-none overflow-hidden font-body cursor-pointer ${
        isExiting ? 'splash-exiting' : ''
      }`}
      aria-label="Nirvighna Awakening Splash Screen"
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════════════
           NIRVIGHNA AWAKENING — HIGH-PERFORMANCE GPU ANIMATION ENGINE
           ═══════════════════════════════════════════════════════════════════ */

        /* Container Exit Transition (2800ms - 3100ms) */
        .splash-exiting {
          animation: splashContainerExit 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        }
        @keyframes splashContainerExit {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.95);
            pointer-events: none;
          }
        }

        /* ── PHASE 1: THE SPARK (0ms - 500ms) ── */
        .splash-spark {
          animation: sparkIgnite 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
        @keyframes sparkIgnite {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          50% {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(1.15);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .splash-spark-pulse {
          animation: sparkPulseAura 2s ease-in-out 0.5s infinite alternate;
        }
        @keyframes sparkPulseAura {
          0% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        /* ── PHASE 2: THE SHIKHARA DRAWS ITSELF (500ms - 1500ms) ── */
        .shikhara-path {
          stroke-dasharray: 1400;
          stroke-dashoffset: 1400;
          animation: drawShikhara 1.0s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
          will-change: stroke-dashoffset;
        }
        @keyframes drawShikhara {
          0% {
            stroke-dashoffset: 1400;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Secondary subtle inner glow reveal */
        .shikhara-glow-fill {
          opacity: 0;
          animation: shikharaGlowIn 0.6s ease-out 1.4s forwards;
        }
        @keyframes shikharaGlowIn {
          0% {
            opacity: 0;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.15;
            transform: scale(1);
          }
        }

        /* ── PHASE 3: THE NAME EMERGES (1500ms - 2300ms) ── */
        .letter-emerge {
          opacity: 0;
          transform: translateY(20px) scale(0.8);
          animation: letterLand 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, opacity;
        }
        @keyframes letterLand {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          70% {
            opacity: 1;
            transform: translateY(-3px) scale(1.06);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── PHASE 4: THE PURPOSE (2300ms - 3000ms) ── */
        .tagline-emerge {
          opacity: 0;
          transform: translateY(8px);
          animation: taglineFadeIn 0.45s ease-out 2.3s forwards;
          will-change: transform, opacity;
        }
        @keyframes taglineFadeIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .subtagline-emerge {
          opacity: 0;
          animation: subtaglineFadeIn 0.4s ease-out 2.45s forwards;
        }
        @keyframes subtaglineFadeIn {
          0% { opacity: 0; }
          100% { opacity: 0.7; }
        }

        /* Gold ambient subtle beam */
        .ambient-beam {
          background: radial-gradient(circle at 50% 35%, rgba(227, 163, 42, 0.14) 0%, rgba(140, 47, 57, 0.06) 45%, transparent 70%);
          opacity: 0;
          animation: beamWarmUp 1.2s ease-out 0.4s forwards;
        }
        @keyframes beamWarmUp {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── ACCESSIBILITY: REDUCED MOTION PROFILE ── */
        @media (prefers-reduced-motion: reduce) {
          .splash-spark,
          .shikhara-path,
          .letter-emerge,
          .tagline-emerge,
          .subtagline-emerge,
          .ambient-beam,
          .shikhara-glow-fill {
            animation: staticFadeIn 0.8s ease-out forwards !important;
            stroke-dashoffset: 0 !important;
            opacity: 1 !important;
            transform: none !important;
          }
          @keyframes staticFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        }
      `}</style>

      {/* Ambient Celestial Glow Background */}
      <div className="absolute inset-0 ambient-beam pointer-events-none" />

      {/* Main Centered Brand Composition */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-sm w-full px-6 text-center">

        {/* ── TEMPLE SHIKHARA ICON CONTAINER ── */}
        <div className="relative w-44 h-44 mb-2 flex items-center justify-center">

          {/* PHASE 1: The Spark (Placed precisely at the Shikhara pinnacle kalash) */}
          <div
            className="absolute top-[18px] left-[50%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full splash-spark z-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #FFE082 0%, #E3A32A 50%, rgba(227, 163, 42, 0) 100%)',
              filter: 'drop-shadow(0 0 12px #E3A32A) drop-shadow(0 0 24px rgba(227, 163, 42, 0.8))'
            }}
          >
            <div className="w-full h-full rounded-full splash-spark-pulse" />
          </div>

          {/* PHASE 2: The Temple Shikhara Line-Art Drawing (SVG stroke-dasharray) */}
          <svg
            viewBox="0 0 240 240"
            className="w-full h-full drop-shadow-[0_0_10px_rgba(227,163,42,0.55)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Shikhara Inner Warm Glow Mesh */}
            <path
              d="M120,44 C104,75 88,115 76,165 L164,165 C152,115 136,75 120,44 Z"
              fill="url(#goldGradient)"
              className="shikhara-glow-fill"
            />

            {/* Sacred Shikhara Master Stroke Geometry */}
            <g
              stroke="#E3A32A"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shikhara-path"
            >
              {/* 1. Dhwaja Banner (Sacred Flag) */}
              <path d="M120,18 Q136,12 128,24 Q120,20 120,30" />

              {/* 2. Kalash & Spire Pinnacle */}
              <path d="M120,18 L120,32" />
              <path d="M112,33 C112,28 128,28 128,33 C128,38 112,38 112,33 Z" />

              {/* 3. Amalaka (Fluted Sacred Disc) */}
              <path d="M102,42 C102,37 138,37 138,42 C138,47 102,47 102,42 Z" />
              <path d="M108,42 L132,42" />

              {/* 4. Main Shikhara Tower Curves (Left & Right Flanks) */}
              <path d="M120,44 C106,66 94,104 84,146 C78,168 70,184 56,192" />
              <path d="M120,44 C134,66 146,104 156,146 C162,168 170,184 184,192" />

              {/* 5. Horizontal Stepped Urushringa Tier Ribs */}
              <path d="M102,80 C114,86 126,86 138,80" />
              <path d="M94,112 C110,120 130,120 146,112" />
              <path d="M86,144 C106,154 134,154 154,144" />
              <path d="M78,172 C102,182 138,182 162,172" />

              {/* 6. Central Urushringa Spire Ridge */}
              <path d="M120,46 L120,178" />

              {/* 7. Mandapa Sanctum Pillars & Base Arch */}
              <path d="M56,192 L56,214 L184,214 L184,192" />
              <path d="M46,214 L194,214 L194,222 L46,222 Z" />
              <path d="M34,222 L206,222 L206,228 L34,228 Z" />

              {/* 8. Garbhagriha Inner Sanctum Jyotish Archway */}
              <path d="M98,214 L98,188 C98,174 142,174 142,188 L142,214" />

              {/* 9. Jyotish Deep Diya Flame in Sanctum */}
              <path d="M120,182 C115,194 120,200 120,200 C120,200 125,194 120,182 Z" />
            </g>

            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE082" />
                <stop offset="50%" stopColor="#E3A32A" />
                <stop offset="100%" stopColor="#8C2F39" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── PHASE 3: THE NAME EMERGES ("NIRVIGHNA") ── */}
        <div
          className="flex items-center justify-center my-3 text-center"
          aria-label="NIRVIGHNA"
        >
          <div className="flex tracking-[0.22em] font-heading font-black text-2xl sm:text-3xl select-none">
            {letters.map((char, index) => {
              // 1500ms base + 60ms stagger per letter
              const delaySeconds = prefersReducedMotion ? 0 : (1.5 + index * 0.06).toFixed(2);
              return (
                <span
                  key={index}
                  className="letter-emerge inline-block text-transparent bg-clip-text bg-gradient-to-b from-[#FFF3D6] via-[#E3A32A] to-[#B24350]"
                  style={{
                    animationDelay: `${delaySeconds}s`,
                    textShadow: '0 0 16px rgba(227, 163, 42, 0.4), 0 2px 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── PHASE 4: THE PURPOSE ("Yatra bina vighna ke") ── */}
        <div className="space-y-1.5 mt-1">
          <p
            className="tagline-emerge text-xs sm:text-sm font-semibold tracking-wider text-[#FAF7F0] select-none"
            style={{
              textShadow: '0 0 10px rgba(227, 163, 42, 0.3)'
            }}
          >
            {activeTagline}
          </p>

          <p className="subtagline-emerge text-[10px] font-mono tracking-widest text-[#E3A32A]/80 uppercase">
            {activeSubTagline}
          </p>
        </div>

        {/* Skip hint pill */}
        <div className="mt-8 opacity-40 hover:opacity-80 transition-opacity">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full bg-white/5">
            {isPreview ? 'Preview Mode • Tap to Exit' : 'Tap to Skip'}
          </span>
        </div>

      </div>
    </div>
  );
};
