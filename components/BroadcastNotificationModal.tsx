import React, { useState } from 'react';
import {
  X,
  Bell,
  Send,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Volume2
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { Language } from '../types';

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  language?: Language;
  userCount: number;
}

export const BroadcastNotificationModal: React.FC<BroadcastNotificationModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  language = 'tr',
  userCount,
}) => {
  const isTr = language === 'tr';
  const defaultTitle = isTr ? 'Chat_CNR Aylık Hatırlatıcı 🌟' : 'Chat_CNR Monthly Reminder 🌟';
  const defaultMsg = isTr
    ? 'Yeni yapay zeka güncellemeleri, sesli "Hey CNR" özellikleri ve akıllı araçlar sizi bekliyor! Sohbete katılmak için tıklayın.'
    : 'New AI model updates, "Hey CNR" voice features, and intelligent tools are waiting for you! Tap to chat.';

  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMsg);
  const [notifType, setNotifType] = useState<'monthly' | 'announcement'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      label: isTr ? '📅 Standart Aylık Hatırlatıcı' : '📅 Standard Monthly Reminder',
      type: 'monthly' as const,
      title: isTr ? 'Chat_CNR Aylık Hatırlatıcı 🌟' : 'Chat_CNR Monthly Reminder 🌟',
      msg: isTr
        ? 'Yeni yapay zeka modelleri, sesli "Hey CNR" özellikleri ve aylık geliştirmeler sizi bekliyor! Sohbete dönmek için tıklayın.'
        : 'New AI models, voice "Hey CNR" features, and monthly upgrades are here! Tap to start chatting.',
    },
    {
      label: isTr ? '🚀 Yeni Sürüm & Özellik Duyurusu' : '🚀 Release & Feature Announcement',
      type: 'announcement' as const,
      title: isTr ? 'Chat_CNR Yeni Özellikler Yayında! 🚀' : 'Chat_CNR New Features Released! 🚀',
      msg: isTr
        ? 'Uygulamamıza sesli uyandırma (Hey CNR), gelişmiş profil analizi ve yeni araçlar eklendi.'
        : 'Voice wake word (Hey CNR), advanced profile analysis, and new tools have been added to Chat_CNR.',
    },
    {
      label: isTr ? '👑 PRO Üyelik & Ayrıcalıklar' : '👑 PRO Membership & Privileges',
      type: 'monthly' as const,
      title: isTr ? 'Chat_CNR PRO ile Sınırsız Güç 👑' : 'Unlimited Power with Chat_CNR PRO 👑',
      msg: isTr
        ? 'Sınırsız mesajlaşma ve en güncel yapay zeka zekası için PRO avantajlarını inceleyin.'
        : 'Explore PRO privileges for unlimited messages and the fastest, smartest AI models.',
    },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await notificationService.sendBroadcastNotification(
        title.trim(),
        message.trim(),
        notifType,
        'dorukaliarslan20@gmail.com',
        'all'
      );
      setSuccessMsg(
        isTr
          ? `Bildirim ${userCount} kayıtlı kullanıcıya başarıyla yayınlandı ve cihazlara iletildi!`
          : `Notification successfully broadcasted to ${userCount} registered users!`
      );
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      alert((isTr ? 'Bildirim gönderilirken bir hata oluştu: ' : 'Error sending notification: ') + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestLocal = () => {
    notificationService.requestPermission().then((granted) => {
      if (granted) {
        notificationService.showLocalNotification(title, {
          body: message,
        });
      } else {
        alert(
          isTr
            ? 'Tarayıcı bildirim izni verilmedi. Lütfen tarayıcınızın site ayarlarından bildirim iznini açın.'
            : 'Notification permission not granted. Please enable notifications in your browser settings.'
        );
      }
    });
  };

  return (
    <div
      id="broadcast-notif-modal-backdrop"
      className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="broadcast-notif-modal-container"
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar border rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col transition-all ${
          theme === 'dark'
            ? 'bg-[#121212] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isTr ? 'Kullanıcılara Aylık / Genel Bildirim Gönder' : 'Broadcast Monthly / General Notification'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isTr
                  ? `Kayıtlı ${userCount} kullanıcıya web push & bildirim yayını`
                  : `Web push & broadcast notification to ${userCount} registered users`}
              </p>
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

        {/* Informative Explanation */}
        <div className="py-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-start gap-2.5">
            <Clock size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {isTr ? 'Aylık Bildirim Döngüsü Nasıl Çalışır?' : 'How Does the Monthly Notification Cycle Work?'}
              </p>
              <p className="leading-relaxed opacity-90 text-[11px]">
                {isTr
                  ? 'Kullanıcılar uygulamayı açtıklarında 30 gün (1 ay) geçmişse sistem otomatik olarak aylık hatırlatıcı bildirimini tetikler. Ayrıca siz buradan dilediğiniz an tek tıkla tüm kullanıcılara aylık veya özel bildirim yayınlayabilirsiniz.'
                  : 'When users open the app after 30 days (1 month), the system automatically triggers a monthly reminder. You can also broadcast custom or monthly notifications to all users anytime from here.'}
              </p>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2 mb-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            {isTr ? 'Hızlı Şablon Seç' : 'Quick Template Presets'}
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setMessage(p.msg);
                  setNotifType(p.type);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  title === p.title
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                    : theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400">
              {isTr ? 'Bildirim Başlığı' : 'Notification Title'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isTr ? 'Örn: Chat_CNR Aylık Hatırlatıcı' : 'e.g. Chat_CNR Monthly Reminder'}
              className={`w-full px-4 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-white'
                  : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400">
              {isTr ? 'Bildirim İçeriği (Mesaj)' : 'Notification Content (Message)'}
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isTr
                  ? 'Kullanıcılara iletilecek mesajınızı buraya yazın...'
                  : 'Write your broadcast message to users here...'
              }
              className={`w-full px-4 py-2.5 rounded-xl text-sm border transition-all resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-white'
                  : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            />
          </div>

          {/* Test Button & Send Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestLocal}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                theme === 'dark'
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Volume2 size={14} />
              <span>{isTr ? 'Kendi Cihazımda Test Et' : 'Test on My Device'}</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !message.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-40"
            >
              <Send size={14} />
              <span>
                {isSubmitting
                  ? (isTr ? 'Yayınlanıyor...' : 'Broadcasting...')
                  : (isTr ? 'Tüm Kullanıcılara Gönder' : 'Send to All Users')}
              </span>
            </button>
          </div>
        </form>

        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
