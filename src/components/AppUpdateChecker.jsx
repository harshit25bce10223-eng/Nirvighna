import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CURRENT_VERSION = '1.0.3';
export const GITHUB_REPO = 'harshit25bce10223-eng/Nirvighna';

const isNewerVersion = (latest, current) => {
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
    const fetchTimeout = setTimeout(() => controller.abort(), 2500);

    let releaseData = null;
    let latestVersion = null;

    // 1. Check GitHub Releases
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github.v3+json' }
      });
      if (res.ok) {
        releaseData = await res.json();
        latestVersion = releaseData.tag_name ? releaseData.tag_name.replace(/^v/, '') : null;
      }
    } catch (_) {}

    // 2. Check GitHub Tags
    if (!latestVersion) {
      try {
        const tagRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/tags`, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github.v3+json' }
        });
        if (tagRes.ok) {
          const tags = await tagRes.json();
          if (tags && tags.length > 0) {
            latestVersion = tags[0].name ? tags[0].name.replace(/^v/, '') : null;
            releaseData = {
              tag_name: tags[0].name,
              body: 'Divine animated startup splash, persistent single-device login, safe-area top margins, and crystal-clear audio navigation.',
              assets: [{ browser_download_url: `https://github.com/${GITHUB_REPO}/releases/download/${tags[0].name}/Nirvighna-Pilgrim.apk` }]
            };
          }
        }
      } catch (_) {}
    }

    clearTimeout(fetchTimeout);

    return {
      version: latestVersion || CURRENT_VERSION,
      hasUpdate: latestVersion ? isNewerVersion(latestVersion, CURRENT_VERSION) : false,
      releaseNotes: releaseData?.body || 'Latest darshan features & performance improvements.',
      downloadUrl:
        releaseData?.assets?.[0]?.browser_download_url ||
        `https://github.com/${GITHUB_REPO}/releases/download/latest/Nirvighna-Pilgrim.apk`
    };
  } catch (e) {
    return {
      version: CURRENT_VERSION,
      hasUpdate: false,
      releaseNotes: 'Performance enhancements and bug fixes.',
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/download/latest/Nirvighna-Pilgrim.apk`
    };
  }
};

export const AppUpdateChecker = ({ manualCheck = false, onCheckComplete }) => {
  const { currentLanguage } = useLanguage();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const performCheck = async () => {
    const info = await fetchLatestVersionInfo();
    setUpdateInfo(info);
    if (info.hasUpdate) {
      setUpdateAvailable(true);
      setShowModal(true);
    } else if (manualCheck) {
      setShowModal(true);
    }
    if (onCheckComplete) onCheckComplete(info);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performCheck();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleStartDownload = () => {
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

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-page-in select-none font-body">
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl border-2 border-gold/40 overflow-hidden text-center p-6 space-y-4 relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
          {updateAvailable ? <Sparkles className="w-8 h-8 animate-pulse" /> : <CheckCircle2 className="w-8 h-8 text-white" />}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black font-heading text-indigo-dark">
            {updateAvailable
              ? (currentLanguage === 'gu' ? 'નવું અપડેટ ઉપલબ્ધ છે!' : currentLanguage === 'hi' ? 'नया अपडेट उपलब्ध है!' : 'New Update Available!')
              : (currentLanguage === 'gu' ? 'તમારું એપ અપ-ટુ-ડેટ છે!' : currentLanguage === 'hi' ? 'आपकी ऐप पूरी तरह अपडेटेड है!' : 'Your App is Up-to-Date!')}
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            {updateAvailable
              ? `v${updateInfo?.version || '1.0.3'} is ready for download`
              : `Current Version: v${CURRENT_VERSION} (Build 4)`}
          </p>
        </div>

        <div className="bg-amber-50/70 border border-gold/30 rounded-2xl p-3.5 text-left text-xs text-gray-700 space-y-1.5">
          <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
            <span>✨</span>
            <span>
              {currentLanguage === 'gu' ? 'રીલીઝ વિગતો:' : currentLanguage === 'hi' ? 'रीलिज़ विवरण:' : 'Release Notes:'}
            </span>
          </p>
          <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">
            {updateInfo?.releaseNotes || 'Latest divine enhancements and performance improvements.'}
          </p>
        </div>

        {downloading ? (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs font-bold text-maroon">
              <span>{currentLanguage === 'gu' ? 'ડાઉનલોડ થઈ રહ્યું છે...' : currentLanguage === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...'}</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-200" style={{ width: `${downloadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleStartDownload}
              className="btn-warm-primary w-full py-3.5 flex items-center justify-center gap-2 font-heading font-black tracking-wide cursor-pointer shadow-md shadow-gold/20 text-xs uppercase"
            >
              <Download className="w-4 h-4" />
              <span>
                {updateAvailable
                  ? (currentLanguage === 'gu' ? 'હમણાં અપડેટ કરો' : currentLanguage === 'hi' ? 'तुरंत अपडेट करें' : 'Update App Now')
                  : (currentLanguage === 'gu' ? 'નવીનતમ APK ફરી ડાઉનલોડ કરો' : currentLanguage === 'hi' ? 'लेटेस्ट APK डाउनलोड करें' : 'Download Latest APK')}
              </span>
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              {currentLanguage === 'gu' ? 'બંધ કરો' : currentLanguage === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
