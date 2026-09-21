import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { UpdateInfo, updateService } from '../services/updateService';
import { APP_VERSION } from '../version';

interface UpdateModalProps {
  isOpen: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
  theme?: 'dark' | 'light';
  language?: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  updateInfo,
  onClose,
  theme = 'dark',
  language = 'tr'
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const isTr = language === 'tr';

  if (!isOpen || !updateInfo) return null;

  const isDark = theme === 'dark';
  const targetVersion = updateInfo.version || APP_VERSION;
  const notes = updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 
    ? updateInfo.releaseNotes 
    : [
        isTr ? 'Arayüz ve dokunmatik kontroller güncellendi.' : 'UI and touch controls updated.',
        isTr ? 'Tüm kullanıcılar için performans ve kararlılık artırıldı.' : 'Enhanced performance and stability for all users.',
        isTr ? 'Önbellek optimizasyonu yapıldı.' : 'Cache and offline handling optimized.'
      ];

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateService.applyUpdate();
    } catch (e) {
      console.error('Update apply error:', e);
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden ${
          isDark ? 'bg-[#121212] border-blue-500/30 text-white' : 'bg-white border-blue-500/20 text-zinc-900'
        }`}
      >
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {isTr ? 'Canlı Güncelleme' : 'Live Update'}
                </span>
                <span className="text-xs font-bold text-zinc-400">
                  v{APP_VERSION} → <strong className="text-white">v{targetVersion}</strong>
                </span>
              </div>
              <h2 className="text-lg font-black mt-1">
                {isTr ? 'Yeni Sürüm Yayınlandı!' : 'New Version Released!'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all ${
              isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {isTr 
            ? 'Chat_CNR en son sürümüyle yenilendi. Bu güncelleme web, mobil ve APK kullanıcılarının tamamına (Ücretsiz & PRO) yöneliktir.' 
            : 'Chat_CNR has been updated with the latest release. This update is for all users (Free & PRO) across web, mobile, and APK.'}
        </p>

        {/* Release notes */}
        <div
          className={`border rounded-2xl p-4 mb-5 space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar ${
            isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            {isTr ? 'Öne Çıkan Değişiklikler' : 'Highlights & Changes'}
          </div>
          {notes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
              <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{note}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 relative z-10">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>{isTr ? 'Önbellek Temizleniyor...' : 'Updating Caches...'}</span>
              </>
            ) : (
              <>
                <span>{isTr ? 'Şimdi Güncelle ve Yenile' : 'Update & Refresh Now'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
              isDark 
                ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
            }`}
          >
            {isTr ? 'Daha Sonra' : 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
};
