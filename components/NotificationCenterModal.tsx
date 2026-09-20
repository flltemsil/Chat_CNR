import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  Volume2,
  ShieldCheck
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { AppNotification, Language, UserProfile } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  notifications: AppNotification[];
  theme?: 'dark' | 'light';
  language?: Language;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  user,
  notifications,
  theme = 'dark',
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    notificationService.getPermissionStatus()
  );
  const [monthlyReminderEnabled, setMonthlyReminderEnabled] = useState(() => {
    try {
      return localStorage.getItem('chat_cnr_monthly_reminders') !== 'false';
    } catch {
      return true;
    }
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(notificationService.getPermissionStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermissionStatus());
    if (granted) {
      setFeedback('Tarayıcı bildirimleri başarıyla etkinleştirildi! 🎉');
      notificationService.showLocalNotification('Chat_CNR Bildirimleri Aktif! 🎉', {
        body: 'Artık aylık hatırlatıcıları ve yeni yapay zeka duyurularını anında alacaksınız.',
      });
    } else {
      setFeedback('Bildirim izni reddedildi. Tarayıcı ayarlarınızdan izin verebilirsiniz.');
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const toggleMonthlyReminder = (checked: boolean) => {
    setMonthlyReminderEnabled(checked);
    try {
      localStorage.setItem('chat_cnr_monthly_reminders', checked.toString());
    } catch {}
    if (checked && permission !== 'granted') {
      handleEnableNotifications();
    }
  };

  return (
    <div
      id="notification-center-modal-backdrop"
      className="fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="notification-center-modal-container"
        className={`w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar border rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col transition-all ${
          theme === 'dark'
            ? 'bg-[#121212] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bildirim Merkezi</h2>
              <p className="text-xs text-zinc-500">Aylık güncellemeler ve duyurular</p>
            </div>
          </div>
          <button
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

        {/* Permission Status Box */}
        <div className="py-4 space-y-3">
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              permission === 'granted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {permission === 'granted' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {permission === 'granted' ? 'Bildirimler Etkin' : 'Bildirim İzni Gerekli'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {permission === 'granted'
                    ? 'Tarayıcı bildirimleri açık, aylık bildirimleri alabilirsiniz.'
                    : 'Aylık bildirimler için tarayıcı izni vermeniz önerilir.'}
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shrink-0 active:scale-95"
              >
                İzin Ver
              </button>
            )}
          </div>

          {/* Monthly reminder toggle */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-[#181818] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Calendar size={15} className="text-blue-400" />
                <span className="text-xs font-bold">Aylık Hatırlatma Bildirimleri</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Her ay 1 kez yeni modeller ve özellikler hakkında bildirim gönder.
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleMonthlyReminder(!monthlyReminderEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                monthlyReminderEnabled ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  monthlyReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {feedback && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Recent Notifications List */}
        <div className="flex-1 space-y-2.5 pb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Son Bildirimler ({notifications.length})
          </span>

          {notifications.length > 0 ? (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    n.type === 'monthly'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : theme === 'dark'
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-white border-zinc-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      {n.type === 'monthly' ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('tr-TR') : ''}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800/60">
              <Bell size={28} className="mx-auto text-zinc-600 mb-2 opacity-60" />
              <p className="text-xs font-medium text-zinc-400">Henüz yeni bir bildirim yok</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Aylık duyurular ve hatırlatıcılar burada görüntülenecektir.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800/40 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
            }`}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
