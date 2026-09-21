
import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, ThemeColor, AppearanceMode, Language } from '../types';
import { Search, User, Cpu, Volume2, Download, ExternalLink, Brain, ThumbsUp, ThumbsDown, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';

interface MessageItemProps {
  message: Message;
  themeColor: ThemeColor;
  appearance: AppearanceMode;
  isStreaming?: boolean;
  onSpeak?: (text: string) => void;
  language?: Language;
  onFeedback?: (messageId: string, feedback: 'useful' | 'wrong' | 'improve') => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message, themeColor, appearance, isStreaming, onSpeak, language = 'tr', onFeedback }) => {
  const t = translations[language] || translations.tr;
  const isUser = message.role === 'user';
  const isDark = appearance === 'dark';
  const [displayText, setDisplayText] = useState('');
  const lastFullTextRef = useRef('');

  // Typewriter effect state management
  useEffect(() => {
    if (isUser || !isStreaming) {
      setDisplayText(message.text || '');
      return;
    }

    if (message.text && message.text.length > lastFullTextRef.current.length) {
      const newChars = message.text.slice(lastFullTextRef.current.length);
      let index = 0;
      
      const interval = setInterval(() => {
        if (index < newChars.length) {
          setDisplayText(prev => prev + (newChars[index] || ''));
          index++;
        } else {
          clearInterval(interval);
          lastFullTextRef.current = message.text;
        }
      }, 15); // Adjust speed here

      return () => clearInterval(interval);
    }
  }, [message.text, isUser, isStreaming]);

  const themeClasses = (() => {
    const base = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-500', border: 'border-blue-500/20', lightBg: 'bg-blue-500/5' },
      indigo: { bg: 'bg-indigo-600', text: 'text-indigo-500', border: 'border-indigo-500/20', lightBg: 'bg-indigo-500/5' },
      rose: { bg: 'bg-rose-600', text: 'text-rose-500', border: 'border-rose-500/20', lightBg: 'bg-rose-500/5' },
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-500', border: 'border-emerald-500/20', lightBg: 'bg-emerald-500/5' },
      amber: { bg: 'bg-amber-600', text: 'text-amber-500', border: 'border-amber-500/20', lightBg: 'bg-amber-500/5' },
      violet: { bg: 'bg-violet-600', text: 'text-violet-500', border: 'border-violet-500/20', lightBg: 'bg-violet-500/5' },
    };
    return (base[themeColor] || base.blue) as any;
  })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`flex w-full mb-3.5 sm:mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[96%] sm:max-w-[88%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {isUser ? (
          <div className={`hidden sm:flex flex-shrink-0 h-9 w-9 rounded-xl items-center justify-center border transition-all ${themeClasses.bg} border-white/10 ml-3`}>
            <User size={18} className="text-white" />
          </div>
        ) : (
          <div className={`flex-shrink-0 h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center border transition-all mr-2 sm:mr-3 mt-0.5 ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <Cpu size={15} className={`sm:hidden ${themeClasses.text}`} />
            <Cpu size={18} className={`hidden sm:inline ${themeClasses.text}`} />
          </div>
        )}
        
        {/* Content */}
        <div className={`flex flex-col max-w-full min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-3.5 py-2.5 sm:px-5 sm:py-4 rounded-2xl sm:rounded-[1.5rem] text-[14px] sm:text-[15px] leading-relaxed transition-all duration-500 ease-[0.23, 1, 0.32, 1] group relative max-w-full overflow-x-auto custom-scrollbar ${
            isUser 
              ? `${themeClasses.bg} text-white rounded-tr-sm border border-white/10 shadow-[0_10px_30px_rgba(37,99,235,0.15)]` 
              : `${isDark ? 'bg-[#111111]/90 backdrop-blur-sm text-zinc-100 border-zinc-800/70 shadow-[0_8px_30px_rgba(0,0,0,0.2)]' : 'bg-white text-zinc-900 border-zinc-200 shadow-xs'} border rounded-tl-sm`
          }`}>
            {!isUser && (message.isDeep || message.grounded === true) && (
              <div className="flex flex-wrap items-center gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2">
                {message.isDeep && (
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-black text-white px-2.5 py-1 rounded-md shadow-lg shadow-purple-500/20 border border-white/10 uppercase tracking-widest">
                    <Brain size={12} className="animate-pulse" />
                    <span>{t.deepMode}</span>
                  </div>
                )}
                {message.grounded === true && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-[10px] font-black text-emerald-500 px-2.5 py-1 rounded-md border border-emerald-500/20 uppercase tracking-widest">
                    <Search size={12} />
                    <span>CNR Search</span>
                  </div>
                )}
              </div>
            )}
            <div className={`markdown-body prose ${isDark ? 'prose-invert' : ''} max-w-none font-medium tracking-tight selection:bg-blue-500/30 break-words`}>
              <Markdown remarkPlugins={[remarkGfm]}>
                {displayText}
              </Markdown>
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className={`inline-block w-1.5 h-4 ml-1.5 align-middle rounded-full ${isUser ? 'bg-white/80' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]'}`}
                />
              )}
            </div>
            
            {message.imageUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 relative group overflow-hidden rounded-2xl border border-zinc-800/40 shadow-2xl"
              >
                <img 
                  src={message.imageUrl} 
                  alt="AI Generated" 
                  className="w-full max-w-lg object-cover hover:scale-[1.05] transition-transform duration-1000 ease-out cursor-zoom-in"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <a 
                    href={message.imageUrl} 
                    download={`chat_cnr_${message.id}.png`}
                    className="bg-white/10 backdrop-blur-2xl hover:bg-white/20 text-white flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    <Download size={14} />
                    <span>{t.downloadHighQuality}</span>
                  </a>
                </div>
              </motion.div>
            )}

            {!isUser && message.sources && message.sources.length > 0 && (
              <div className={`mt-6 pt-5 border-t border-dashed ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="flex items-center gap-2 mb-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] opacity-40">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  <span>{t.sourceResources}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    source.web && (
                      <a
                        key={idx}
                        href={source.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center gap-2 text-[11px] sm:text-[12px] font-bold ${isDark ? 'bg-zinc-800/40 hover:bg-blue-600/10 border-zinc-800 text-blue-400 hover:border-blue-500/30' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-blue-600'} border px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all max-w-[240px] sm:max-w-[280px] shadow-xs`}
                      >
                        <span className="truncate">{source.web?.title || t.sourceResources}</span>
                        <ExternalLink size={11} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Info */}
          <div className={`flex items-center gap-2.5 sm:gap-4 mt-1.5 sm:mt-2 px-1 sm:px-2 transition-opacity duration-300 ${isDark ? 'text-zinc-500 sm:text-zinc-600 sm:group-hover:text-zinc-400' : 'text-zinc-500 sm:text-zinc-400 sm:group-hover:text-zinc-600'}`}>
            <span className="text-[10px] font-bold tracking-wider opacity-60">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && onSpeak && (
              <button 
                onClick={() => onSpeak(message.text)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800/50 active:scale-95 transition-all ${themeClasses.text} group/btn`}
                title="Sesli Yanıtı Oynat"
              >
                <div className="w-1 h-1 bg-current rounded-full group-hover/btn:animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Audio</span>
              </button>
            )}
            
            {!isUser && onFeedback && (
              <div className="flex items-center gap-1 ml-auto">
                <button 
                  onClick={() => onFeedback(message.id, 'useful')}
                  className={`p-1.5 rounded-lg active:scale-90 transition-all ${message.feedback === 'useful' ? 'text-emerald-500 bg-emerald-500/15' : 'hover:bg-zinc-800/60 hover:text-emerald-400'}`}
                  title="Faydalı"
                >
                  <ThumbsUp size={13} />
                </button>
                <button 
                  onClick={() => onFeedback(message.id, 'wrong')}
                  className={`p-1.5 rounded-lg active:scale-90 transition-all ${message.feedback === 'wrong' ? 'text-rose-500 bg-rose-500/15' : 'hover:bg-zinc-800/60 hover:text-rose-400'}`}
                  title="Yanlış"
                >
                  <ThumbsDown size={13} />
                </button>
                <button 
                  onClick={() => onFeedback(message.id, 'improve')}
                  className={`p-1.5 rounded-lg active:scale-90 transition-all ${message.feedback === 'improve' ? 'text-amber-500 bg-amber-500/15' : 'hover:bg-zinc-800/60 hover:text-amber-400'}`}
                  title="İyileştirilebilir"
                >
                  <RefreshCcw size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default MessageItem;
