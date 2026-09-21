import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Clock,
  Crown,
  Activity,
  Bell,
  Shield,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { notificationService } from '../services/notificationService';
import { translations } from '../translations';

interface UserDetailModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onTogglePro: (user: UserProfile) => Promise<void>;
  theme?: 'dark' | 'light';
  language?: Language;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onTogglePro,
  theme = 'dark',
  language = 'tr',
}) => {
  const t = translations[language] || translations.tr;
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSentSuccess, setNotifSentSuccess] = useState(false);
  const [isProLoading, setIsProLoading] = useState(false);

  if (!isOpen || !user) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits =
    user.dailyVisits && typeof user.dailyVisits[todayStr] === 'number'
      ? user.dailyVisits[todayStr]
      : user.lastVisitDate === todayStr
      ? user.todayVisits || 1
      : 0;

  // Calculate online status (< 3 minutes)
  let isOnline = false;
  if (user.isOnline && user.lastActive) {
    const lastActiveTime = (user.lastActive as any).toDate
      ? (user.lastActive as any).toDate().getTime()
      : new Date(user.lastActive).getTime();
    isOnline = Date.now() - lastActiveTime < 3 * 60 * 1000;
  }

  // Format last active date
  const formatDateTime = (d: any) => {
    if (!d) return language === 'tr' ? 'Henüz kaydedilmedi' : 'Not recorded yet';
    const dateObj = d.toDate ? d.toDate() : new Date(d);
    return dateObj.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Recent 5 days visit history
  const recentDays = Array.from({ length: 5 }, (_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const dateKey = dt.toISOString().split('T')[0];
    const dayLabel =
      i === 0
        ? (language === 'tr' ? 'Bugün' : 'Today')
        : i === 1
        ? (language === 'tr' ? 'Dün' : 'Yesterday')
        : dt.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'numeric' });
    const count = user.dailyVisits?.[dateKey] || (dateKey === todayStr ? todayVisits : 0);
    return { dateKey, dayLabel, count };
  });

  const handleSendDirectNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;
    setIsSendingNotif(true);
    try {
      await notificationService.sendBroadcastNotification(
        `Chat_CNR: ${user.name}`,
        notifMessage.trim(),
        'monthly',
        'dorukaliarslan20@gmail.com',
        user.uid
      );
      setNotifSentSuccess(true);
      setNotifMessage('');
      setTimeout(() => setNotifSentSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to send notification to user:', err);
      alert(language === 'tr' ? 'Bildirim gönderilirken bir sorun oluştu.' : 'Failed to send notification.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleProClick = async () => {
    setIsProLoading(true);
    try {
      await onTogglePro(user);
    } finally {
      setIsProLoading(false);
    }
  };

  return (
    <div
      id="user-detail-modal-backdrop"
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="user-detail-modal-container"
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar border rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col transition-all ${
          theme === 'dark'
            ? 'bg-[#121212] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {language === 'tr' ? 'Kullanıcı Profili & İstatistikleri' : 'User Profile & Statistics'}
              </h2>
              <p className="text-xs text-zinc-500">ID: {user.uid.slice(0, 10)}...</p>
            </div>
          </div>
          <button
            id="user-detail-close-btn"
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              theme === 'dark'
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="py-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                theme === 'dark' ? 'border-[#121212]' : 'border-white'
              } ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-500'}`}
              title={isOnline ? (language === 'tr' ? 'Çevrimiçi' : 'Online') : (language === 'tr' ? 'Çevrimdışı' : 'Offline')}
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold">{user.name}</h3>
              {user.role === 'admin' ? (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-black">
                  {t.adminKurucu}
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {t.adminMember}
                </span>
              )}
              {user.isPro && (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Crown size={11} /> PRO
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail size={13} className="text-zinc-500" />
              <span>{user.email || (language === 'tr' ? 'E-posta bulunmuyor' : 'No email available')}</span>
            </p>

            <p className="text-[11px] text-zinc-500 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
              <Clock size={12} />
              <span>
                {language === 'tr' ? 'Son Aktiflik:' : 'Last Active:'} {formatDateTime(user.lastActive || user.lastLogin)}
              </span>
            </p>
          </div>
        </div>

        {/* PRIMARY HIGHLIGHT: Today's Visits Stat Card */}
        <div
          className={`p-4 rounded-2xl border mb-4 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-blue-950/30 via-zinc-900 to-indigo-950/30 border-blue-500/30'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Activity size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {language === 'tr' ? 'Bugünkü Giriş Raporu' : "Today's Visit Report"}
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-400">
              {new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl font-black text-blue-500 tracking-tight">
              {todayVisits}
            </span>
            <span className="text-sm font-semibold text-zinc-400">
              {language === 'tr' ? 'kez bugün giriş yaptı / sayfayı açtı' : 'visits / opens today'}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {todayVisits === 0
              ? (language === 'tr' ? 'Kullanıcı bugün henüz uygulamayı açmadı veya oturum açmadı.' : 'User has not opened the app today yet.')
              : todayVisits === 1
              ? (language === 'tr' ? 'Kullanıcı bugün uygulamayı 1 kez açıp kullandı.' : 'User opened and used the app 1 time today.')
              : (language === 'tr' ? `Kullanıcı bugün Chat_CNR'ı tam ${todayVisits} kez ziyaret edip oturum açtı.` : `User visited and opened Chat_CNR ${todayVisits} times today.`)}
          </p>

          {/* Mini 5-Day Activity Visualizer */}
          <div className="mt-4 pt-3 border-t border-zinc-800/40">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              {language === 'tr' ? 'Son Günlerin Giriş Geçmişi' : 'Recent Visit History'}
            </span>
            <div className="grid grid-cols-5 gap-2 text-center">
              {recentDays.map((d, i) => (
                <div
                  key={d.dateKey}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center ${
                    i === 0
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-400'
                      : theme === 'dark'
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                      : 'bg-white border-zinc-200 text-zinc-600'
                  }`}
                >
                  <span className="text-[10px] font-semibold">{d.dayLabel}</span>
                  <span className="text-base font-black mt-0.5">{d.count}</span>
                  <span className="text-[9px] opacity-70">
                    {language === 'tr' ? 'giriş' : 'visits'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PRO Subscription Management Section */}
        <div
          className={`p-4 rounded-2xl border mb-4 space-y-3 ${
            theme === 'dark' ? 'bg-[#181818] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-amber-400" />
              <span className="text-sm font-bold">
                {language === 'tr' ? 'PRO Üyelik Durumu' : 'PRO Status'}
              </span>
            </div>
            {user.isPro ? (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                {(() => {
                  if (!user.proExpiresAt) return language === 'tr' ? 'Aktif PRO' : 'Active PRO';
                  const exp = (user.proExpiresAt as any).toDate
                    ? (user.proExpiresAt as any).toDate()
                    : new Date(user.proExpiresAt);
                  const diffDays = Math.max(0, Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  return `PRO (${diffDays} ${t.proDaysLeft})`;
                })()}
              </span>
            ) : (
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-800/40 px-2.5 py-1 rounded-full">
                {language === 'tr' ? 'Standart Üye (Ücretsiz)' : 'Standard Member (Free)'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-zinc-400 leading-relaxed">
              {user.isPro
                ? (language === 'tr' ? 'Bu kullanıcı şu anda PRO avantajlarından (sınırsız kota, derin düşünme, hızlı yanıt) yararlanıyor.' : 'This user is currently enjoying PRO privileges (unlimited quota, deep reasoning, rapid response).')
                : (language === 'tr' ? '1 Aylığına PRO yapabilir veya istediğiniz zaman kapatabilirsiniz.' : 'Activate PRO for 1 month or turn it off anytime.')}
            </p>
            <button
              id="user-detail-toggle-pro-btn"
              type="button"
              disabled={isProLoading}
              onClick={handleProClick}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                user.isPro
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-amber-500 hover:bg-amber-600 text-black font-extrabold shadow-md shadow-amber-500/20'
              }`}
            >
              {isProLoading ? (language === 'tr' ? 'İşleniyor...' : 'Processing...') : user.isPro ? t.proTurnOff : t.proTurnOn}
            </button>
          </div>
        </div>

        {/* Send Direct / Monthly Notification to this User */}
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            theme === 'dark' ? 'bg-[#181818] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-blue-400" />
              <span className="text-sm font-bold">
                {language === 'tr' ? 'Kullanıcıya Özel Bildirim Gönder' : 'Send Custom Notification'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/40 px-2 py-0.5 rounded">
              Web Push / In-App
            </span>
          </div>

          <form onSubmit={handleSendDirectNotification} className="space-y-2.5">
            <input
              type="text"
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder={language === 'tr' ? "Örn: Merhaba, yeni yapay zeka güncellemeleri hazır!" : "e.g., Hello, new AI features are ready!"}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600'
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setNotifMessage(
                    language === 'tr'
                      ? `Chat_CNR Aylık Hatırlatıcı: Yeni yapay zeka özellikleri ve sesli Hey CNR asistanı sizi bekliyor! 🚀`
                      : `Chat_CNR Monthly Reminder: New AI capabilities and voice Hey CNR assistant await you! 🚀`
                  )
                }
                className="text-[11px] text-blue-400 hover:underline font-medium"
              >
                + {language === 'tr' ? 'Aylık Şablonu Ekle' : 'Insert Monthly Template'}
              </button>

              <button
                id="user-detail-send-notif-btn"
                type="submit"
                disabled={isSendingNotif || !notifMessage.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-40"
              >
                <Send size={12} />
                <span>{isSendingNotif ? (language === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (language === 'tr' ? 'Bildirimi Gönder' : 'Send Notification')}</span>
              </button>
            </div>
          </form>

          {notifSentSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{language === 'tr' ? 'Bildirim başarıyla kaydedildi ve kullanıcıya iletildi!' : 'Notification saved and delivered successfully!'}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-5 mt-2 flex items-center justify-between border-t border-zinc-800/40">
          <a
            href={`mailto:${user.email}?subject=Chat_CNR%20Info`}
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Mail size={13} />
            <span>{language === 'tr' ? 'Doğrudan E-posta Yaz' : 'Email Directly'}</span>
          </a>

          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
            }`}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
