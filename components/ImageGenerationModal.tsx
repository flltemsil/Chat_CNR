import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Sparkles, 
  Download, 
  Send, 
  RefreshCw, 
  Layers, 
  Check, 
  AlertCircle,
  Maximize2
} from "lucide-react";
import { ThemeColor, AppearanceMode, Language } from "../types";
import { chatCNRService } from "../services/chatCNRService";

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (imageUrl: string, promptText: string) => void;
  themeColor: ThemeColor;
  appearance: AppearanceMode;
  language: Language;
}

const PRESET_PROMPTS = {
  tr: [
    "Siberpunk İstanbul Boğazı, neon ışıklar, holografik köprü, 8k gerçekçi",
    "Göz alıcı minimalist yapay zeka logosu, fütüristik vektörel tasarım",
    "Karanlık ve derin uzayda parlayan renkli nebula ve spiral galaksi",
    "Piksel sanat (pixel art) tarzında sevimli bir RPG savaşçı kedisi",
    "Ultra detaylı fütüristik spor elektrikli araba, stüdyo aydınlatması"
  ],
  en: [
    "Cyberpunk city skyline at night with holographic signs, ultra detailed 8k",
    "Sleek minimalist AI logo emblem, modern vector art, dark mode",
    "Vibrant colorful nebula with cosmic dust and bright stars, cinematic",
    "Cute pixel-art RPG warrior cat with sword, retro gaming aesthetic",
    "Futuristic concept electric sports car in a modern showroom, photorealistic"
  ]
};

export const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  themeColor,
  appearance,
  language = "tr",
}) => {
  const isDark = appearance === "dark";
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pictureAiStatus, setPictureAiStatus] = useState<{ connected: boolean; keyMasked?: string | null }>({ connected: true });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      chatCNRService.getPictureAIStatus().then((status) => {
        setPictureAiStatus({
          connected: status.connected,
          keyMasked: status.keyMasked
        });
      });
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await chatCNRService.generateImage(prompt.trim(), aspectRatio);
      if (res && res.imageUrl) {
        setGeneratedImage(res.imageUrl);
        setGeneratedText(res.text || prompt.trim());
      } else {
        throw new Error("Görsel yanıtı alınamadı.");
      }
    } catch (err: any) {
      setError(err.message || "Görsel üretilirken bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!generatedImage) return;
    if (onInsertToChat) {
      onInsertToChat(generatedImage, prompt.trim() || "PİCTURE_AI ile oluşturulan görsel");
    }
    onClose();
  };

  if (!isOpen) return null;

  const ratios: { id: "1:1" | "16:9" | "9:16" | "4:3" | "3:4"; label: string; sub: string }[] = [
    { id: "1:1", label: "1:1", sub: "Kare" },
    { id: "16:9", label: "16:9", sub: "Geniş" },
    { id: "9:16", label: "9:16", sub: "Mobil" },
    { id: "4:3", label: "4:3", sub: "Klasik" },
    { id: "3:4", label: "3:4", sub: "Portre" },
  ];

  const presets = PRESET_PROMPTS[language === "tr" ? "tr" : "en"] || PRESET_PROMPTS.tr;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl flex flex-col ${
            isDark
              ? "bg-[#0c0c0e] border-zinc-800 text-zinc-100"
              : "bg-white border-zinc-200 text-zinc-900"
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-800/40 flex items-center justify-between sticky top-0 bg-inherit/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight">
                    {language === "tr" ? "Görsel Üretim Stüdyosu" : "Image Generation Studio"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    PİCTURE_AI
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {language === "tr" 
                    ? "Yalnızca görüntü üretimine ayrılmış özel PİCTURE_AI motoru"
                    : "Dedicated PİCTURE_AI engine exclusively for image generation"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-5">
            {/* Engine Status Banner */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              pictureAiStatus.connected
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-500"
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">
                  {pictureAiStatus.connected 
                    ? (language === "tr" ? "PİCTURE_AI Motoru Bağlı & Aktif (Sadece Görsel)" : "PİCTURE_AI Engine Connected (Images Only)")
                    : (language === "tr" ? "PİCTURE_AI Secret Kontrol Ediliyor..." : "Checking PİCTURE_AI Secret...")}
                </span>
              </div>
              {pictureAiStatus.keyMasked && (
                <span className="font-mono text-[10px] opacity-75 bg-black/20 px-2 py-0.5 rounded-md">
                  {pictureAiStatus.keyMasked}
                </span>
              )}
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                {language === "tr" ? "Görsel Açıklaması (Prompt)" : "Image Description (Prompt)"}
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={language === "tr" ? "Oluşturmak istediğiniz görseli detaylıca tarif edin (örn: neon ışıklı siberpunk sokak, 8k)..." : "Describe the image you want to generate in detail..."}
                  rows={3}
                  className={`w-full p-3.5 rounded-2xl border text-sm outline-hidden transition-all resize-none ${
                    isDark
                      ? "bg-zinc-900/80 border-zinc-800 focus:border-amber-500/60 text-zinc-100 placeholder:text-zinc-600"
                      : "bg-zinc-50 border-zinc-200 focus:border-amber-500/60 text-zinc-900 placeholder:text-zinc-400"
                  }`}
                />
                {prompt && (
                  <button
                    onClick={() => setPrompt("")}
                    className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 p-1 rounded-md"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                {language === "tr" ? "En / Boy Oranı (Aspect Ratio)" : "Aspect Ratio"}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ratios.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      aspectRatio === r.id
                        ? "bg-amber-500/15 border-amber-500 text-amber-500 font-bold shadow-xs scale-102"
                        : isDark
                          ? "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] opacity-60">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inspiration presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
                <Layers size={12} />
                {language === "tr" ? "Hızlı İlham Örnekleri:" : "Inspiration Presets:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all truncate max-w-full text-left ${
                      isDark
                        ? "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-800 hover:border-zinc-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">{language === "tr" ? "Görsel Üretim Bildirimi" : "Image Generation Notice"}</div>
                  <div className="text-[11px] leading-relaxed opacity-90">{error}</div>
                </div>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{language === "tr" ? "PİCTURE_AI ile Görsel Çiziliyor..." : "Generating with PİCTURE_AI..."}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{language === "tr" ? "Görseli Üret (PİCTURE_AI)" : "Generate Image (PİCTURE_AI)"}</span>
                </>
              )}
            </button>

            {/* Generated Image Result Card */}
            {generatedImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-3xl border overflow-hidden space-y-3 ${
                  isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Check size={14} />
                    {language === "tr" ? "Görsel Başarıyla Oluşturuldu" : "Image Successfully Created"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">PİCTURE_AI • {aspectRatio}</span>
                </div>

                <div className="relative group rounded-2xl overflow-hidden border border-zinc-800/40 bg-black/40">
                  <img
                    src={generatedImage}
                    alt={prompt}
                    className="w-full h-auto max-h-[360px] object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <a
                    href={generatedImage}
                    download={`chat_cnr_${Date.now()}.png`}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-xl transition-all shadow-md"
                    title={language === "tr" ? "İndir" : "Download"}
                  >
                    <Download size={16} />
                  </a>
                </div>

                {generatedText && (
                  <p className="text-xs text-zinc-400 italic">
                    "{generatedText}"
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleInsert}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Send size={13} />
                    <span>{language === "tr" ? "Sohbete Ekle" : "Insert into Chat"}</span>
                  </button>
                  <a
                    href={generatedImage}
                    download={`chat_cnr_${Date.now()}.png`}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isDark 
                        ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200" 
                        : "border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    <Download size={13} />
                    <span>{language === "tr" ? "İndir" : "Download"}</span>
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
