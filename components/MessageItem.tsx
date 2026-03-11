
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, ThemeColor, AppearanceMode } from '../types';
import { Search, User, Cpu, Volume2, Download, ExternalLink } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  themeColor: ThemeColor;
  appearance: AppearanceMode;
  onSpeak?: (text: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, themeColor, appearance, onSpeak }) => {
  const isUser = message.role === 'user';
  const isDark = appearance === 'dark';

  const themeClasses = (() => {
    const base = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500/30' },
      indigo: { bg: 'bg-indigo-600', text: 'text-indigo-400', border: 'border-indigo-500/30' },
      rose: { bg: 'bg-rose-600', text: 'text-rose-400', border: 'border-rose-500/30' },
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      amber: { bg: 'bg-amber-600', text: 'text-amber-400', border: 'border-amber-500/30' },
      violet: { bg: 'bg-violet-600', text: 'text-violet-400', border: 'border-violet-500/30' },
    };
    return base[themeColor] || base.blue;
  })();

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg ${
          isUser 
            ? `${themeClasses.bg} ml-3 rotate-3` 
            : `${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'} mr-3 -rotate-3 border`
        }`}>
          {isUser ? <User size={20} className="text-white" /> : <Cpu size={20} className={themeClasses.text} />}
        </div>
        
        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-xl transition-all ${
            isUser 
              ? `${themeClasses.bg} text-white rounded-tr-none` 
              : `${isDark ? 'bg-[#1a1a1a] text-zinc-100 border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'} border rounded-tl-none`
          }`}>
            <div className={`markdown-body prose ${isDark ? 'prose-invert' : ''} max-w-none`}>
              <Markdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </Markdown>
            </div>
            
            {message.imageUrl && (
              <div className="mt-4 relative group overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl">
                <img 
                  src={message.imageUrl} 
                  alt="Görsel" 
                  className="w-full max-w-md object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a 
                    href={message.imageUrl} 
                    download={`chat_cnr_${message.id}.png`}
                    className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-3 rounded-xl transition-all"
                    title="İndir"
                  >
                    <Download size={20} />
                  </a>
                </div>
              </div>
            )}

            {!isUser && message.sources && message.sources.length > 0 && (
              <div className={`mt-5 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                  <Search size={12} />
                  <span>Bilgi Kaynakları</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    source.web && (
                      <a
                        key={idx}
                        href={source.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center gap-2 text-xs ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'} ${themeClasses.text} border px-3 py-2 rounded-xl transition-all max-w-[240px]`}
                      >
                        <span className="truncate">{source.web?.title || "Kaynak"}</span>
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Info */}
          <div className={`flex items-center gap-3 mt-2 px-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <span className="text-[10px] font-medium">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && onSpeak && (
              <button 
                onClick={() => onSpeak(message.text)}
                className={`p-1.5 rounded-lg hover:bg-zinc-800 transition-colors ${themeClasses.text}`}
                title="Seslendir"
              >
                <Volume2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
