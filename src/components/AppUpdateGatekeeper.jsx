import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchLatestVersionInfo, CURRENT_VERSION, GITHUB_REPO } from './AppUpdateChecker';

export const AppUpdateGatekeeper = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Hard safety timeout: After 1 second max, smoothly let user into app unconditionally
    const safetyTimer = setTimeout(() => {
      if (isMounted && !updateRequired) {
        setChecking(false);
      }
    }, 1000);

    const checkLiveUpdates = async () => {
      try {
        const info = await fetchLatestVersionInfo();
        if (isMounted) {
          if (info.hasUpdate) {
            setUpdateInfo({
              version: info.version,
              notes: info.releaseNotes,
              downloadUrl: info.downloadUrl
            });
            setUpdateRequired(true);
            setChecking(false);
          } else {
            setTimeout(() => {
              if (isMounted) setChecking(false);
            }, 500);
          }
        }
      } catch (_) {
        if (isMounted) setChecking(false);
      }
    };

    checkLiveUpdates();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleStartUpdate = () => {
    setDownloading(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setTimeout(() => {
          if (updateInfo?.downloadUrl) {
            window.open(updateInfo.downloadUrl, '_system');
          }
        }, 300);
      }
      setDownloadProgress(prog);
    }, 120);
  };

  // 1. Initial Launch Sync Screen — Beautiful Animated Devotional Splash
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-amber-50/70 to-[#F5EFE6] flex flex-col items-center justify-center p-6 text-center select-none font-body relative overflow-hidden">
        {/* Soft Golden Background Halo */}
        <div className="absolute w-80 h-80 rounded-full bg-amber-400/15 blur-3xl -top-10 pointer-events-none animate-pulse" />
        <div className="absolute w-96 h-96 rounded-full bg-gold/10 blur-3xl -bottom-10 pointer-events-none" />

        <div className="max-w-xs w-full space-y-6 animate-page-in relative z-10">
          {/* Official Glowing Emblem */}
          <div className="relative inline-flex mx-auto">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold via-amber-300 to-amber-600 animate-logo-aura flex items-center justify-center p-1.5 shadow-[0_0_35px_rgba(245,158,11,0.4)] border-2 border-gold">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-2.5 overflow-hidden shadow-inner">
                <img
                  src="./official_logo.png"
                  alt="Nirvighna Official Emblem"
                  className="w-full h-full object-contain drop-shadow-md select-none crisp-img animate-in zoom-in-75 duration-500"
                  onError={(e) => { e.target.src = '/official_logo.png'; }}
                />
              </div>
            </div>
          </div>

          {/* Devotional Branding */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black font-heading tracking-wider text-indigo-dark drop-shadow-xs">
              {currentLanguage === 'gu' ? 'નિર્વિઘ્ન' : currentLanguage === 'hi' ? 'निर्विघ्न' : 'NIRVIGHNA'}
            </h1>
            <p className="text-xs font-black text-maroon tracking-wide">
              {currentLanguage === 'gu'
                ? 'યાત્રા વિના વિઘ્ને • સરળ દર્શન'
                : currentLanguage === 'hi'
                ? 'यात्रा बिना विघ्न के • सुगम दर्शन'
                : 'Yatra Without Obstacles • Easy Darshan'}
            </p>
            <p className="text-[11px] text-amber-800/80 font-bold mt-1">
              {currentLanguage === 'gu'
                ? 'ॐ નમઃ શિવાય • જય શ્રી કૃષ્ણ • જય માતાજી'
                : currentLanguage === 'hi'
                ? 'ॐ नमः शिवाय • जय श्री कृष्ण • जय माता दी'
                : 'Jai Shri Krishna • Jai Mata Di • Har Har Mahadev'}
            </p>
          </div>

          {/* Animated Gold Progress Bar */}
          <div className="w-full bg-amber-100/80 rounded-full h-2 overflow-hidden border border-amber-300/60 shadow-inner">
            <div className="bg-gradient-to-r from-maroon via-gold to-amber-500 h-full w-full animate-pulse rounded-full" />
          </div>

          {/* Sync Status Badge */}
          <div className="inline-flex items-center justify-center gap-2 text-xs font-bold text-amber-900 bg-white/90 backdrop-blur-xs py-2 px-4 rounded-full border border-gold/30 shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-maroon shrink-0" />
            <span>
              {currentLanguage === 'gu'
                ? 'મંદિર સર્વર સાથે સિંક થઈ રહ્યું છે...'
                : currentLanguage === 'hi'
                ? 'मंदिर सर्वर से सिंक हो रहा है...'
                : 'Connecting to Temple Cloud...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mandatory Update Required Screen
  if (updateRequired && updateInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50 to-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center select-none font-body">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl border-2 border-gold/40 p-6 space-y-5 animate-page-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gold via-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <Sparkles className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black font-heading text-indigo-dark">
              {currentLanguage === 'gu'
                ? 'નવું અપડેટ આવશ્યક છે!'
                : currentLanguage === 'hi'
                ? 'नया अपडेट आवश्यक है!'
                : 'Mandatory Update Required!'}
            </h2>
            <p className="text-xs font-bold text-maroon">
              {currentLanguage === 'gu'
                ? `નવું વર્ઝન v${updateInfo.version} ઉપલબ્ધ છે`
                : currentLanguage === 'hi'
                ? `नया वर्ज़न v${updateInfo.version} उपलब्ध है`
                : `New Version v${updateInfo.version} is ready`}
            </p>
          </div>

          <div className="bg-amber-50/80 border border-gold/30 rounded-2xl p-3.5 text-left text-xs space-y-1">
            <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
              <span>✨</span>
              <span>
                {currentLanguage === 'gu' ? 'નવા ફીચર્સ:' : currentLanguage === 'hi' ? 'नई खूबियां:' : "What's New:"}
              </span>
            </p>
            <p className="text-[11px] text-gray-700 font-semibold leading-relaxed">
              {updateInfo.notes}
            </p>
          </div>

          {downloading ? (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold text-maroon">
                <span>
                  {currentLanguage === 'gu' ? 'ડાઉનલોડ થઈ રહ્યું છે...' : currentLanguage === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...'}
                </span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartUpdate}
              className="btn-warm-primary w-full py-4 text-sm font-black font-heading uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-gold/30 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>
                {currentLanguage === 'gu'
                  ? 'હમણાં અપડેટ કરો (૧-ટેપ)'
                  : currentLanguage === 'hi'
                  ? 'तुरंत अपडेट करें (1-टैप)'
                  : 'Update App Now'}
              </span>
            </button>
          )}

          <p className="text-[10px] text-gray-400 font-semibold">
            {currentLanguage === 'gu'
              ? 'યાત્રાની સરળતા માટે અપડેટ કરવું જરૂરી છે.'
              : currentLanguage === 'hi'
              ? 'सुचारु यात्रा के लिए ऐप को अपडेट करना आवश्यक है।'
              : 'Update required for seamless darshan booking.'}
          </p>
        </div>
      </div>
    );
  }

  // 3. Render children directly
  return <>{children}</>;
};
