import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CURRENT_VERSION = '1.0.0';
const GITHUB_REPO = 'harshit25bce10223-eng/Nirvighna';

export const AppUpdateChecker = ({ manualCheck = false, onCheckComplete }) => {
  const { currentLanguage } = useLanguage();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestRelease, setLatestRelease] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const checkForUpdate = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (res.ok) {
        const data = await res.json();
        const latestTag = data.tag_name ? data.tag_name.replace(/^v/, '') : null;
        if (latestTag && latestTag !== CURRENT_VERSION) {
          setLatestRelease(data);
          setUpdateAvailable(true);
          setShowModal(true);
        } else if (manualCheck) {
          alert(
            currentLanguage === 'gu'
              ? 'તમારી પાસે પહેલેથી જ નવીનતમ સંસ્કરણ છે (v' + CURRENT_VERSION + ')'
              : currentLanguage === 'hi'
              ? 'आप पहले से ही नवीनतम संस्करण का उपयोग कर रहे हैं (v' + CURRENT_VERSION + ')'
              : 'You are already on the latest version (v' + CURRENT_VERSION + ')'
          );
        }
      }
    } catch (_) {
      // Silent ignore on offline/network errors
    } finally {
      if (onCheckComplete) onCheckComplete();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    const downloadUrl =
      latestRelease?.assets?.[0]?.browser_download_url ||
      `https://github.com/${GITHUB_REPO}/releases/latest`;
    window.open(downloadUrl, '_system');
  };

  if (!showModal || !updateAvailable) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-page-in">
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl border-2 border-gold/40 overflow-hidden text-center p-6 space-y-4 relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black font-heading text-indigo-dark">
            {currentLanguage === 'gu'
              ? 'નવું અપડેટ ઉપલબ્ધ છે!'
              : currentLanguage === 'hi'
              ? 'नया अपडेट उपलब्ध है!'
              : 'New Update Available!'}
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            {currentLanguage === 'gu'
              ? `નવું વર્ઝન v${latestRelease?.tag_name || '1.0.1'} ઉપલબ્ધ છે`
              : currentLanguage === 'hi'
              ? `नया वर्ज़न v${latestRelease?.tag_name || '1.0.1'} उपलब्ध है`
              : `New version v${latestRelease?.tag_name || '1.0.1'} is ready`}
          </p>
        </div>

        <div className="bg-amber-50/70 border border-gold/30 rounded-2xl p-3 text-left text-xs text-gray-700 space-y-1.5">
          <p className="font-bold text-amber-900 flex items-center gap-1.5">
            <span>✨</span>
            <span>
              {currentLanguage === 'gu' ? 'નવા ફીચર્સ:' : currentLanguage === 'hi' ? 'नई खूबियां:' : "What's New:"}
            </span>
          </p>
          <p className="text-[11px] text-gray-600 line-clamp-3">
            {latestRelease?.body ||
              (currentLanguage === 'gu'
                ? 'ઝડપી દર્શન બુકિંગ, બગ ફિક્સ અને સુધારેલ પ્રદર્શન.'
                : currentLanguage === 'hi'
                ? 'तेज़ दर्शन बुकिंग, बेहतर प्रदर्शन और बग सुधार।'
                : 'Faster darshan booking, bug fixes and performance enhancements.')}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={handleDownload}
            className="btn-warm-primary w-full py-3.5 flex items-center justify-center gap-2 font-heading font-black tracking-wide cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {currentLanguage === 'gu'
                ? 'હમણાં અપડેટ ડાઉનલોડ કરો'
                : currentLanguage === 'hi'
                ? 'अभी अपडेट डाउनलोड करें'
                : 'Download Update Now'}
            </span>
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            {currentLanguage === 'gu' ? 'પછીથી' : currentLanguage === 'hi' ? 'बाद में' : 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
};
