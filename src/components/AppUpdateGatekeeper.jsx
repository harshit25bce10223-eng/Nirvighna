import React, { useState, useEffect } from 'react';
import { Sparkles, Download, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';

const CURRENT_VERSION = '1.0.1';
const GITHUB_REPO = 'harshit25bce10223-eng/Nirvighna';

export const AppUpdateGatekeeper = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('checking'); // 'checking' | 'uptodate' | 'update_available' | 'error'

  useEffect(() => {
    let isMounted = true;

    const checkLiveUpdates = async () => {
      try {
        setSyncStatus('checking');

        // 1. Check GitHub latest release or Supabase remote config
        let latestVersion = null;
        let releaseData = null;

        try {
          const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
            headers: { Accept: 'application/vnd.github.v3+json' }
          });
          if (res.ok) {
            releaseData = await res.json();
            latestVersion = releaseData.tag_name ? releaseData.tag_name.replace(/^v/, '') : null;
          }
        } catch (_) {}

        // Fallback: Check Supabase app_versions table if GitHub fails
        if (!latestVersion) {
          try {
            const { data } = await supabase
              .from('app_versions')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            if (data?.version) {
              latestVersion = data.version.replace(/^v/, '');
              releaseData = {
                tag_name: data.version,
                body: data.release_notes || 'New performance updates and bug fixes.',
                assets: [{ browser_download_url: data.apk_url }]
              };
            }
          } catch (_) {}
        }

        if (isMounted) {
          // Compare versions: if remote version is strictly greater than CURRENT_VERSION
          if (latestVersion && isNewerVersion(latestVersion, CURRENT_VERSION)) {
            setUpdateInfo({
              version: latestVersion,
              notes: releaseData?.body || 'Latest darshan features & performance improvements.',
              downloadUrl:
                releaseData?.assets?.[0]?.browser_download_url ||
                `https://github.com/${GITHUB_REPO}/releases/latest`
            });
            setUpdateRequired(true);
            setSyncStatus('update_available');
            setChecking(false);
          } else {
            // Already on latest version
            setSyncStatus('uptodate');
            setTimeout(() => {
              if (isMounted) setChecking(false);
            }, 600);
          }
        }
      } catch (err) {
        // In case of offline/network failure, allow user to continue
        if (isMounted) {
          setSyncStatus('uptodate');
          setChecking(false);
        }
      }
    };

    // Helper function to compare semver versions
    const isNewerVersion = (latest, current) => {
      const l = latest.split('.').map(Number);
      const c = current.split('.').map(Number);
      for (let i = 0; i < Math.max(l.length, c.length); i++) {
        const lv = l[i] || 0;
        const cv = c[i] || 0;
        if (lv > cv) return true;
        if (lv < cv) return false;
      }
      return false;
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
      prog += 15;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setTimeout(() => {
          if (updateInfo?.downloadUrl) {
            window.open(updateInfo.downloadUrl, '_system');
          }
        }, 400);
      }
      setDownloadProgress(prog);
    }, 150);
  };

  // 1. Initial Launch Sync Screen
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50 to-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center select-none font-body">
        <div className="max-w-xs w-full space-y-6 animate-page-in">
          {/* Logo with Devotional Aura */}
          <div className="relative inline-flex mx-auto">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold via-amber-400 to-amber-600 animate-logo-aura flex items-center justify-center p-1.5 shadow-2xl border-2 border-gold">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-2 overflow-hidden">
                <img
                  src="./official_logo.png"
                  alt="Nirvighna Emblem"
                  className="w-full h-full object-contain crisp-img"
                  onError={(e) => { e.target.src = '/official_logo.png'; }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black font-heading tracking-wide text-indigo-dark">
              {currentLanguage === 'gu' ? 'નિર્વિઘ્ન' : currentLanguage === 'hi' ? 'निर्विघ्न' : 'NIRVIGHNA'}
            </h1>
            <p className="text-xs text-gray-500 font-bold">
              {currentLanguage === 'gu'
                ? 'લાઇવ અપડેટ્સ તપાસી રહ્યું છે...'
                : currentLanguage === 'hi'
                ? 'लाइव अपडेट्स चेक कर रहे हैं...'
                : 'Checking for live updates...'}
            </p>
          </div>

          {/* Syncing Progress Indicator */}
          <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-maroon via-gold to-amber-600 h-full w-2/3 animate-pulse rounded-full" />
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-amber-900 bg-amber-50 py-2 px-3 rounded-xl border border-amber-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-maroon" />
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

  // 2. Mandatory Update Required Screen (Blocks access until updated)
  if (updateRequired && updateInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50 to-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center select-none font-body">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl border-2 border-gold/40 p-6 space-y-5 animate-page-in">
          {/* Animated Update Icon */}
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

  // 3. Render the application smoothly when up to date
  return children;
};
