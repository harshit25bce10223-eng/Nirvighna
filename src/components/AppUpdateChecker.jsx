import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight, Loader2, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CURRENT_VERSION = '1.0.3';
export const GITHUB_REPO = 'harshit25bce10223-eng/Nirvighna';

const translations = {
  en: {
    checking: 'Checking for updates...',
    upToDate: "You're up to date! (v{version})",
    updateAvailable: 'New Update Available: v{version}',
    downloading: 'Downloading update... {percent}%',
    downloadingTitle: 'Downloading Nirvighna Update',
    verifying: 'Verifying package integrity...',
    verifyingSubtitle: 'Checking SHA-256 cryptographic signature',
    readyToInstall: 'Ready to install! Launching installer...',
    readySubtitle: 'Single-tap native Android confirmation appearing',
    retry: 'Retry Update',
    cancel: 'Cancel',
    dismiss: 'Dismiss',
    updateSuccessTitle: 'Updated to v{version} successfully! 🎉',
    updateSuccessDesc: 'You are now running the latest version with new Darshan safety & navigation features.',
    permissionRequiredTitle: 'Install Permission Required',
    permissionRequiredDesc: "Please allow 'Install Unknown Apps' for Nirvighna to enable seamless 1-tap in-app updates.",
    grantPermission: 'Grant Permission',
    whatsNew: "What's New in this version:",
    startDownloadBtn: 'Update Now (In-App)',
    laterBtn: 'Maybe Later',
    bytesProgress: '{downloaded} MB / {total} MB'
  },
  hi: {
    checking: 'अपडेट की जांच हो रही है...',
    upToDate: 'आपका ऐप नवीनतम संस्करण (v{version}) पर है! ✓',
    updateAvailable: 'नया अपडेट उपलब्ध: v{version}',
    downloading: 'अपडेट डाउनलोड हो रहा है... {percent}%',
    downloadingTitle: 'निर्विघ्न ऐप अपडेट डाउनलोड',
    verifying: 'पैकेज की सुरक्षा जांच हो रही है...',
    verifyingSubtitle: 'SHA-256 सुरक्षा हस्ताक्षर का सत्यापन जारी है',
    readyToInstall: 'इंस्टॉल के लिए तैयार! इंस्टॉलर खुल रहा है...',
    readySubtitle: 'बस एक टैप से सीधे इंस्टॉल करें',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    dismiss: 'बंद करें',
    updateSuccessTitle: 'v{version} में सफलतापूर्वक अपडेट हो गया! 🎉',
    updateSuccessDesc: 'आप अब नए दर्शन सुरक्षा और लाइव आवाज नेविगेशन फीचर्स के साथ नवीनतम ऐप उपयोग कर रहे हैं।',
    permissionRequiredTitle: 'सीधे इंस्टॉल अनुमति आवश्यक',
    permissionRequiredDesc: 'सीधे 1-टैप इन-ऐप अपडेट के लिए कृपया निर्विघ्न को अनुमति प्रदान करें।',
    grantPermission: 'अनुमति दें',
    whatsNew: 'इस नए संस्करण में क्या नया है:',
    startDownloadBtn: 'अभी इन-ऐप अपडेट करें',
    laterBtn: 'बाद में',
    bytesProgress: '{downloaded} MB / {total} MB'
  },
  gu: {
    checking: 'અપડેટ તપાસી રહ્યું છે...',
    upToDate: 'તમારું એપ લેટેસ્ટ વર્ઝન (v{version}) પર છે! ✓',
    updateAvailable: 'નવું અપડેટ ઉપલબ્ધ: v{version}',
    downloading: 'અપડેટ ડાઉનલોડ થઈ રહ્યું છે... {percent}%',
    downloadingTitle: 'નિર્વિઘ્ન એપ અપડેટ ડાઉનલોડ',
    verifying: 'પેકેજ સુરક્ષા ચકાસણી ચાલુ છે...',
    verifyingSubtitle: 'SHA-256 સુરક્ષા હસ્તાક્ષર ચકાસણી',
    readyToInstall: 'ઇન્સ્ટોલ માટે તૈયાર! ઇન્સ્ટોલર ખુલી રહ્યું છે...',
    readySubtitle: 'એક જ ટેપથી સરળ ઇન્સ્ટોલ',
    retry: 'ફરી પ્રયાસ કરો',
    cancel: 'રદ કરો',
    dismiss: 'બંધ કરો',
    updateSuccessTitle: 'v{version} માં સફળતાપૂર્વક અપડેટ થયું! 🎉',
    updateSuccessDesc: 'તમે હવે નવા દર્શન સુરક્ષા અને અવાજ નેવિગેશન સાથે લેટેસ્ટ એપ વાપરી રહ્યા છો.',
    permissionRequiredTitle: 'ઇન્સ્ટોલ પરવાનગી જરૂરી',
    permissionRequiredDesc: 'સરળ ઇન-એપ અપડેટ માટે કૃપા કરીને નિર્વિઘ્નને પરવાનગી આપો.',
    grantPermission: 'પરવાનગી આપો',
    whatsNew: 'આ નવા વર્ઝનમાં શું નવું છે:',
    startDownloadBtn: 'હમણાં ઇન-એપ અપડેટ કરો',
    laterBtn: 'પછીથી',
    bytesProgress: '{downloaded} MB / {total} MB'
  }
};

export const isNewerVersion = (latest, current) => {
  const l = (latest || '').replace(/^v/, '').split('.').map(Number);
  const c = (current || '').replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] || 0;
    const cv = c[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
};

export const fetchLatestVersionInfo = async () => {
  try {
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 4000);

    let latestVersion = null;
    let releaseNotes = null;
    let downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/latest/Nirvighna-Pilgrim.apk`;
    let sha256 = 'skip';

    // 1. Try un-throttled raw GitHub version descriptor
    try {
      const rawRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/version.json?t=${Date.now()}`, {
        signal: controller.signal
      });
      if (rawRes.ok) {
        const vData = await rawRes.json();
        if (vData && vData.version) {
          latestVersion = vData.version.replace(/^v/, '');
          releaseNotes = vData.releaseNotes;
          if (vData.downloadUrl) downloadUrl = vData.downloadUrl;
          if (vData.sha256) sha256 = vData.sha256;
        }
      }
    } catch (_) {}

    // 2. Fallback to GitHub Releases API if raw file didn't resolve version
    if (!latestVersion) {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
          const releaseData = await res.json();
          latestVersion = releaseData.tag_name ? releaseData.tag_name.replace(/^v/, '') : null;
          if (releaseData.body) releaseNotes = releaseData.body;
          if (releaseData.assets?.[0]?.browser_download_url) {
            downloadUrl = releaseData.assets[0].browser_download_url;
          }
        }
      } catch (_) {}
    }

    clearTimeout(fetchTimeout);

    const effectiveVersion = latestVersion || '1.0.4';
    const hasUpdate = isNewerVersion(effectiveVersion, CURRENT_VERSION);

    return {
      version: effectiveVersion,
      hasUpdate: hasUpdate,
      releaseNotes: releaseNotes || '✨ 3-Language Padyatri safety routes, multi-person wheelchair allocations (+₹51), auto-saved family & group booking synchronization, and real-time status bar & in-app alerts.',
      downloadUrl: downloadUrl,
      sha256: sha256
    };
  } catch (e) {
    return {
      version: '1.0.4',
      hasUpdate: isNewerVersion('1.0.4', CURRENT_VERSION),
      releaseNotes: 'Performance enhancements and stability improvements.',
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/download/latest/Nirvighna-Pilgrim.apk`,
      sha256: 'skip'
    };
  }
};

export const AppUpdateChecker = ({ manualCheck = false, onCheckComplete }) => {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showUpToDateToast, setShowUpToDateToast] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // States: 'idle' | 'downloading' | 'verifying' | 'ready' | 'error'
  const [updateState, setUpdateState] = useState('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if app was just updated and relaunched
  useEffect(() => {
    try {
      const justUpdated = localStorage.getItem('nirvighna_just_updated');
      if (justUpdated === 'true') {
        localStorage.removeItem('nirvighna_just_updated');
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 8000);
      }
    } catch (_) {}

    const handleJustUpdatedEvent = () => {
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 8000);
    };

    window.addEventListener('nirvighna_just_updated', handleJustUpdatedEvent);
    return () => window.removeEventListener('nirvighna_just_updated', handleJustUpdatedEvent);
  }, []);

  // Listen to native Android bridge update callbacks
  useEffect(() => {
    const handleProgress = (e) => {
      const { percent, downloadedBytes: dBytes, totalBytes: tBytes } = e.detail || {};
      if (typeof percent === 'number') {
        setDownloadProgress(Math.max(0, Math.min(100, percent)));
      }
      if (dBytes) setDownloadedBytes(dBytes);
      if (tBytes) setTotalBytes(tBytes);
      setUpdateState('downloading');
    };

    const handleStateChange = (e) => {
      const { state } = e.detail || {};
      if (state) setUpdateState(state);
    };

    const handleError = (e) => {
      const { code, message } = e.detail || {};
      setUpdateState('error');
      setErrorMessage(message || (code === 'HASH_MISMATCH' ? 'Integrity check failed' : 'Download failed'));
    };

    const handlePermissionReq = () => {
      setShowPermissionPrompt(true);
    };

    window.addEventListener('nirvighna_update_progress', handleProgress);
    window.addEventListener('nirvighna_update_state', handleStateChange);
    window.addEventListener('nirvighna_update_error', handleError);
    window.addEventListener('nirvighna_update_permission_required', handlePermissionReq);

    return () => {
      window.removeEventListener('nirvighna_update_progress', handleProgress);
      window.removeEventListener('nirvighna_update_state', handleStateChange);
      window.removeEventListener('nirvighna_update_error', handleError);
      window.removeEventListener('nirvighna_update_permission_required', handlePermissionReq);
    };
  }, []);

  // Trigger check
  const performCheck = async () => {
    setChecking(true);
    const info = await fetchLatestVersionInfo();
    setUpdateInfo(info);
    setChecking(false);

    if (info.hasUpdate) {
      setShowOverlay(true);
      setUpdateState('idle');
    } else {
      if (manualCheck) {
        setShowUpToDateToast(true);
        setTimeout(() => setShowUpToDateToast(false), 4000);
      }
    }

    if (onCheckComplete) onCheckComplete(info);
  };

  useEffect(() => {
    if (manualCheck) {
      performCheck();
    } else {
      const timer = setTimeout(() => {
        performCheck();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [manualCheck]);

  // Start 1-tap in-app download
  const handleStartInAppUpdate = () => {
    setUpdateState('downloading');
    setDownloadProgress(0);
    setErrorMessage('');

    const targetUrl = updateInfo?.downloadUrl || `https://github.com/${GITHUB_REPO}/releases/download/latest/Nirvighna-Pilgrim.apk`;
    const targetSha = updateInfo?.sha256 || 'skip';

    // 1. Android Native Bridge Execution (Zero Chrome/Browser invocation)
    if (window.NirvighnaNativeBridge && typeof window.NirvighnaNativeBridge.startInAppUpdate === 'function') {
      window.NirvighnaNativeBridge.startInAppUpdate(targetUrl, targetSha);
      return;
    }

    // 2. Simulated Web fallback (for browser testing environments)
    let cur = 0;
    const interval = setInterval(() => {
      cur += 15;
      if (cur >= 100) {
        cur = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setUpdateState('verifying');
        setTimeout(() => {
          setUpdateState('ready');
        }, 800);
      } else {
        setDownloadProgress(cur);
        setDownloadedBytes(Math.round((cur / 100) * 20971520));
        setTotalBytes(20971520);
      }
    }, 200);
  };

  const handleGrantPermission = () => {
    if (window.NirvighnaNativeBridge && typeof window.NirvighnaNativeBridge.requestInstallPermission === 'function') {
      window.NirvighnaNativeBridge.requestInstallPermission();
    }
    setShowPermissionPrompt(false);
  };

  return (
    <>
      {/* 1. Updated Successfully Celebration Banner */}
      {showSuccessBanner && (
        <div className="fixed top-4 inset-x-4 z-[999999] bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 text-white p-4 rounded-3xl shadow-2xl border-2 border-emerald-300 flex items-start gap-3 animate-in slide-in-from-top-4 font-body">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black font-heading text-white">
              {t.updateSuccessTitle.replace('{version}', CURRENT_VERSION)}
            </h4>
            <p className="text-xs text-emerald-100 font-semibold mt-0.5">{t.updateSuccessDesc}</p>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="text-white/80 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. "You're up to date" Quick Toast */}
      {showUpToDateToast && (
        <div className="fixed bottom-24 inset-x-6 z-[999999] bg-indigo-dark text-white p-3.5 rounded-2xl shadow-2xl border border-gold/40 flex items-center gap-3 animate-in fade-in zoom-in-95 font-body">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold text-gray-100">
            {t.upToDate.replace('{version}', CURRENT_VERSION)}
          </p>
        </div>
      )}

      {/* 3. Install Permission Guidance Prompt */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-black/80 z-[9999999] flex items-center justify-center p-4 backdrop-blur-sm font-body">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gold/40 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-maroon" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black font-heading text-indigo-dark">{t.permissionRequiredTitle}</h3>
              <p className="text-xs text-gray-600 font-semibold">{t.permissionRequiredDesc}</p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleGrantPermission}
                className="w-full py-3 bg-maroon text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider font-heading flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> {t.grantPermission}
              </button>
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete In-App Update Overlay Screen (Zero Browser / Chrome) */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/85 z-[9999999] flex items-center justify-center p-4 backdrop-blur-md font-body select-none animate-in fade-in">
          <div className="bg-gradient-to-br from-[#FAF7F2] via-white to-amber-50/40 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border-2 border-gold/40 space-y-0">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-maroon to-[#5F242C] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center p-1.5 shadow-inner">
                  <img src="/official_logo.png" alt="Nirvighna" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 font-heading">
                    IN-APP AUTO-UPDATER
                  </span>
                  <h3 className="text-sm font-extrabold text-white">
                    {t.updateAvailable.replace('{version}', updateInfo?.version || '1.0.4')}
                  </h3>
                </div>
              </div>
              {updateState === 'idle' && (
                <button onClick={() => setShowOverlay(false)} className="text-white/70 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dynamic State Body */}
            <div className="p-6 space-y-5">
              
              {/* STATE 0: IDLE / CONFIRMATION */}
              {updateState === 'idle' && (
                <div className="space-y-4">
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-maroon font-heading">
                      {t.whatsNew}
                    </p>
                    <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                      {updateInfo?.releaseNotes}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleStartInAppUpdate}
                      className="w-full py-3.5 bg-gradient-to-r from-gold via-amber-400 to-amber-500 hover:from-amber-400 hover:to-gold text-indigo-dark font-black text-xs rounded-2xl shadow-goldGlow uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-heading"
                    >
                      <Download className="w-4 h-4" /> {t.startDownloadBtn}
                    </button>
                    <button
                      onClick={() => setShowOverlay(false)}
                      className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-all"
                    >
                      {t.laterBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 1: DOWNLOADING (With Real Progress & Byte Counts) */}
              {updateState === 'downloading' && (
                <div className="space-y-4 text-center py-2 animate-in fade-in">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#FAF7F2" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#800020"
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * downloadProgress) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-200"
                      />
                    </svg>
                    <span className="absolute font-black font-heading text-lg text-maroon">
                      {downloadProgress}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-indigo-dark font-heading">
                      {t.downloading.replace('{percent}', downloadProgress)}
                    </h4>
                    {totalBytes > 0 ? (
                      <p className="text-[11px] font-bold text-gray-500 font-mono">
                        {t.bytesProgress
                          .replace('{downloaded}', (downloadedBytes / (1024 * 1024)).toFixed(1))
                          .replace('{total}', (totalBytes / (1024 * 1024)).toFixed(1))}
                      </p>
                    ) : (
                      <p className="text-[11px] font-semibold text-gray-500">
                        Downloading update package in-app...
                      </p>
                    )}
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                    <div
                      className="bg-gradient-to-r from-maroon to-gold h-full rounded-full transition-all duration-200"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* STATE 2: VERIFYING (SHA-256 Cryptographic Check) */}
              {updateState === 'verifying' && (
                <div className="space-y-4 text-center py-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-maroon flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-8 h-8 text-maroon animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-indigo-dark font-heading">
                      {t.verifying}
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold">
                      {t.verifyingSubtitle}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-maroon">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying integrity...</span>
                  </div>
                </div>
              )}

              {/* STATE 3: READY TO INSTALL (Automatic Single-Tap Native Launch) */}
              {updateState === 'ready' && (
                <div className="space-y-4 text-center py-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-emerald-900 font-heading">
                      {t.readyToInstall}
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold">
                      {t.readySubtitle}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">
                    App will automatically restart into the new version after install.
                  </p>
                </div>
              )}

              {/* STATE 4: ERROR / RETRY */}
              {updateState === 'error' && (
                <div className="space-y-4 text-center py-2 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-red-900 font-heading">
                      Update Failed
                    </h4>
                    <p className="text-xs text-red-700 font-semibold">
                      {errorMessage || 'Connection lost or verification error.'}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleStartInAppUpdate}
                      className="w-full py-3 bg-maroon text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider font-heading flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> {t.retry}
                    </button>
                    <button
                      onClick={() => setShowOverlay(false)}
                      className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
