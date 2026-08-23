import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchLatestVersionInfo, CURRENT_VERSION, GITHUB_REPO } from './AppUpdateChecker';
import { NirvighnaSplash } from './NirvighnaSplash';

export const AppUpdateGatekeeper = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [splashFinished, setSplashFinished] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [updateStatusText, setUpdateStatusText] = useState('');

  useEffect(() => {
    let isMounted = true;

    const checkLiveUpdates = async () => {
      try {
        const info = await fetchLatestVersionInfo();
        if (isMounted && info?.hasUpdate) {
          setUpdateInfo({
            version: info.version,
            notes: info.releaseNotes,
            downloadUrl: info.downloadUrl
          });
          setUpdateRequired(true);
        }
      } catch (_) {}
    };

    checkLiveUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to native Android bridge update callbacks
  useEffect(() => {
    const handleProgress = (e) => {
      const { percent } = e.detail || {};
      if (typeof percent === 'number') {
        setDownloadProgress(Math.max(0, Math.min(100, percent)));
      }
      setDownloading(true);
    };

    const handleStateChange = (e) => {
      const { state, message } = e.detail || {};
      if (message) setUpdateStatusText(message);
      if (state === 'ready') {
        setDownloadProgress(100);
        setTimeout(() => {
          setDownloading(false);
          setUpdateRequired(false);
        }, 1500);
      }
    };

    const handleError = (e) => {
      const { message } = e.detail || {};
      setUpdateStatusText(message || 'Download failed. Please retry.');
      setDownloading(false);
    };

    window.addEventListener('nirvighna_update_progress', handleProgress);
    window.addEventListener('nirvighna_update_state', handleStateChange);
    window.addEventListener('nirvighna_update_error', handleError);

    return () => {
      window.removeEventListener('nirvighna_update_progress', handleProgress);
      window.removeEventListener('nirvighna_update_state', handleStateChange);
      window.removeEventListener('nirvighna_update_error', handleError);
    };
  }, []);

  const handleStartUpdate = () => {
    setDownloading(true);
    setDownloadProgress(0);
    setUpdateStatusText(currentLanguage === 'gu' ? 'ડાઉનલોડ શરૂ થઈ રહ્યું છે...' : currentLanguage === 'hi' ? 'डाउनलोड शुरू हो रहा है...' : 'Starting download...');

    const dlUrl = updateInfo?.downloadUrl || `https://github.com/${GITHUB_REPO}/releases/download/latest/Nirvighna-Pilgrim.apk`;

    // 1. Android Native Bridge Execution
    if (window.NirvighnaNativeBridge && typeof window.NirvighnaNativeBridge.startInAppUpdate === 'function') {
      window.NirvighnaNativeBridge.startInAppUpdate(dlUrl, 'skip');
      return;
    }

    if (window.NirvighnaNativeUpdater && typeof window.NirvighnaNativeUpdater.startInAppUpdate === 'function') {
      window.NirvighnaNativeUpdater.startInAppUpdate(dlUrl, 'skip');
      return;
    }

    // 2. Direct browser trigger (opens APK in system download manager or browser)
    try {
      window.location.href = dlUrl;
    } catch (_) {
      window.open(dlUrl, '_system');
    }
    setTimeout(() => {
      setDownloading(false);
      setUpdateRequired(false);
    }, 2000);
  };

  // 1. Initial Launch Screen — "Nirvighna Awakening" Custom Animated Splash Sequence
  if (!splashFinished) {
    return (
      <>
        {/* Pre-mount children in background to prevent any blank-screen flash */}
        <div className="opacity-0 pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {children}
        </div>
        <NirvighnaSplash onComplete={() => setSplashFinished(true)} />
      </>
    );
  }

  // 2. Update Available Screen
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
                ? 'નવું અપડેટ ઉપલબ્ધ છે!'
                : currentLanguage === 'hi'
                ? 'नया अपडेट उपलब्ध है!'
                : 'New Update Available!'}
            </h2>
            <p className="text-xs font-bold text-maroon">
              {currentLanguage === 'gu'
                ? `નવું વર્ઝન v${updateInfo.version} તૈયાર છે`
                : currentLanguage === 'hi'
                ? `नया वर्ज़न v${updateInfo.version} तैयार है`
                : `Version v${updateInfo.version} is ready`}
            </p>
          </div>

          <div className="bg-amber-50/80 border border-gold/30 rounded-2xl p-3.5 text-left text-xs space-y-1">
            <p className="font-extrabold text-amber-900 flex items-center gap-1.5 font-heading">
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
                  {updateStatusText || (currentLanguage === 'gu' ? 'ડાઉનલોડ થઈ રહ્યું છે...' : currentLanguage === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...')}
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
            <div className="space-y-2.5">
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

              <button
                onClick={() => setUpdateRequired(false)}
                className="w-full py-2.5 text-xs font-extrabold text-gray-500 hover:text-indigo-dark flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{currentLanguage === 'gu' ? 'હવે પછી / આગળ વધો' : currentLanguage === 'hi' ? 'बाद में / आगे बढ़ें' : 'Continue to App'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-[10px] text-gray-400 font-semibold">
            {currentLanguage === 'gu'
              ? 'યાત્રાની સરળતા માટે લેટેસ્ટ વર્ઝન વાપરો.'
              : currentLanguage === 'hi'
              ? 'सुचारु यात्रा के लिए नवीनतम वर्ज़न का उपयोग करें।'
              : 'Keep your app up to date for smooth Darshan experience.'}
          </p>
        </div>
      </div>
    );
  }

  // 3. Render children directly
  return <>{children}</>;
};
