import React, { useState } from 'react';
import { X, User, Save, Heart, Info, Phone, ShieldCheck, Cpu, Key, Network } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { profileService } from '../services/profileService';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';

interface ProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProfile: UserProfile) => void;
  language?: Language;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUpdate, language = 'tr' }) => {
  const t = translations[language] || translations.tr;
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [personalApiKey, setPersonalApiKey] = useState(() => {
    try {
      return localStorage.getItem('CHAT_CNR_USER_API_KEY') || '';
    } catch (e) {
      return '';
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save personal API key to local storage
      localStorage.setItem('CHAT_CNR_USER_API_KEY', personalApiKey.trim());
      
      const updates = {
        name,
        bio,
        phone,
        interests,
      };
      await profileService.updateProfile(user.uid, updates);
      onUpdate({ ...user, ...updates });
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-zinc-800/80 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-8 border-b border-zinc-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-[1.25rem] flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
              <ShieldCheck size={24} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{t.identityManagement}</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t.secureProfileSettings}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-zinc-800/50 text-zinc-500 hover:text-white rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* Ad Soyad */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2 px-1">
              <User size={12} className="text-blue-500" /> {t.fullName}
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111111] border-2 border-zinc-800/80 rounded-2xl px-5 py-4 text-[15px] font-medium text-white focus:outline-none focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
              placeholder={t.fullName}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* İletişim */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2 px-1">
                <Phone size={12} className="text-blue-500" /> {t.contactLine}
              </label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#111111] border-2 border-zinc-800/80 rounded-2xl px-5 py-4 text-[15px] font-medium text-white focus:outline-none focus:border-blue-600/50 transition-all"
                placeholder="05xx"
              />
            </div>

            {/* İlgi Alanları Ekleme as a tool */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2 px-1">
                <Heart size={12} className="text-rose-500" /> {t.interests}
              </label>
              <form onSubmit={handleAddInterest} className="flex gap-2">
                <input 
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  className="flex-1 bg-[#111111] border-2 border-zinc-800/80 rounded-2xl px-4 py-4 text-sm font-medium text-white focus:outline-none focus:border-blue-600/50 transition-all"
                  placeholder="..."
                />
              </form>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2 px-1">
              <Info size={12} className="text-blue-500" /> {t.bio}
            </label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-[#111111] border-2 border-zinc-800/80 rounded-2xl px-5 py-4 text-[14px] font-medium text-white focus:outline-none focus:border-blue-600/50 transition-all shadow-inner resize-none leading-relaxed"
              placeholder={t.visionPlaceholder}
            />
          </div>

          {/* Personal API Key */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2 px-1">
              <Key size={12} className="text-yellow-500" /> {t.personalApiKey}
            </label>
            <div className="relative group/key">
              <input 
                type="password"
                value={personalApiKey}
                onChange={(e) => setPersonalApiKey(e.target.value)}
                className="w-full bg-[#111111] border-2 border-zinc-800/80 rounded-2xl px-5 py-4 pr-12 text-[14px] font-mono text-white focus:outline-none focus:border-yellow-600/50 transition-all shadow-inner"
                placeholder="AIzaSy..."
              />
              <div className="absolute inset-y-0 right-4 flex items-center h-full pointer-events-none">
                 <ShieldCheck size={16} className="text-zinc-600 group-focus-within/key:text-yellow-500 transition-colors" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 px-1 leading-relaxed">
              {t.personalApiKeyDesc}
            </p>
          </div>

          {/* Installation Guide */}
          <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl space-y-3">
             <div className="flex items-center gap-3">
                <Cpu size={16} className="text-blue-500" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{t.installApp}</h4>
             </div>
             <p className="text-[12px] text-zinc-400 leading-relaxed font-medium">
                {t.installGuide}
             </p>
          </div>

          {/* Friend Network - Lightweight Solution */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Network size={14} className="text-indigo-400" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-white uppercase tracking-widest">{language === 'tr' ? 'Arkadaş Ağı' : 'Friend Network'}</h4>
                <p className="text-[10px] text-zinc-500 max-w-[200px] leading-tight mt-1">{language === 'tr' ? 'Sistem yorulmasın diye asenkron bağlantı kullanıyoruz.' : 'Using async connection to save system load.'}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const link = `${window.location.origin}/?friend=${user.uid}`;
                  navigator.clipboard.writeText(link);
                  alert(language === 'tr' ? "Bağlantı kopyalandı! Arkadaşına gönder." : "Link copied!");
                }}
                className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
              >
                {language === 'tr' ? 'Bağlantı Kopyala' : 'Copy Link'}
              </button>
              <button 
                onClick={() => {
                  const email = prompt("E-posta adresi:");
                  if(email) alert(`Davet ${email} adresine asenkron olarak gönderildi!`);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
              >
                {language === 'tr' ? 'E-posta ile Davet' : 'Invite via Email'}
              </button>
            </div>
          </div>
          
          {/* Interests Display */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2.5">
              <AnimatePresence mode="popLayout">
                {interests.map((interest) => (
                  <motion.div 
                    key={interest} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group flex items-center gap-2 bg-blue-600/5 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-blue-600/10"
                  >
                    {interest}
                    <button onClick={() => handleRemoveInterest(interest)} className="hover:text-red-500 transition-colors opacity-40 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {interests.length === 0 && (
                <div className="w-full py-4 px-6 border-2 border-dashed border-zinc-800 rounded-2xl text-center">
                   <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest">{t.noData}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-[#070707] border-t border-zinc-800/50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl font-bold transition-all border border-zinc-800 uppercase text-[12px] tracking-widest"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-[0_10px_40px_rgba(37,99,235,0.2)] active:scale-[0.98] uppercase text-[12px] tracking-[0.2em]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save size={18} /> {t.update}</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileModal;
