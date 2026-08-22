import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchLatestVersionInfo, CURRENT_VERSION, GITHUB_REPO } from './AppUpdateChecker';
import { NirvighnaSplash } from './NirvighnaSplash';



export const AppUpdateGatekeeper = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const MIN_SPLASH_TIME = 1600;
    const startTime = Date.now();

    const checkLiveUpdates = async () => {
      try {
        const info = await fetchLatestVersionInfo();
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, MIN_SPLASH_TIME - elapsed);

        setTimeout(() => {
          if (isMounted) {
            if (info.hasUpdate) {
              setUpdateInfo({
                version: info.version,
                notes: info.releaseNotes,
                downloadUrl: info.downloadUrl
              });
              setUpdateRequired(true);
            }
            setChecking(false);
          }
        }, delay);
      } catch (_) {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, MIN_SPLASH_TIME - elapsed);
        setTimeout(() => {
          if (isMounted) setChecking(false);
        }, delay);
      }
    };

    checkLiveUpdates();

    return () => {
      isMounted = false;
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
          const dlUrl = updateInfo?.downloadUrl && updateInfo.downloadUrl.endsWith('.apk')
            ? updateInfo.downloadUrl
            : `https://github.com/${GITHUB_REPO}/releases/download/latest/Nirvighna-Pilgrim.apk`;
          
          // 1. If running in Android native app, trigger in-app direct background downloader & installer
          if (window.NirvighnaNativeUpdater && typeof window.NirvighnaNativeUpdater.downloadAndInstallApk === 'function') {
            try {
              window.NirvighnaNativeUpdater.downloadAndInstallApk(dlUrl);
              setDownloading(false);
              return;
            } catch (e) {
              console.warn('Native updater failed, falling back:', e);
            }
          }

          // 2. Web browser fallback
          try {
            const link = document.createElement('a');
            link.href = dlUrl;
            link.setAttribute('download', 'Nirvighna-Pilgrim.apk');
            link.setAttribute('target', '_system');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (_) {}

          try {
            window.open(dlUrl, '_system');
          } catch (_) {}
          window.location.href = dlUrl;
        }, 300);
      }
      setDownloadProgress(prog);
    }, 120);
  };


  // 1. Initial Launch Screen — "Nirvighna Awakening" Custom Animated Splash Sequence
  if (checking) {
    return (
      <>
        {/* Pre-mount children in background to prevent any blank-screen flash */}
        <div className="opacity-0 pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {children}
        </div>
        <NirvighnaSplash onComplete={() => setChecking(false)} />
      </>
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
