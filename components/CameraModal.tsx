import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  theme: 'light' | 'dark';
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, theme }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      setError(err.message || "Kameraya erişilemedi.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          // Mirror image for front camera
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(base64Data);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-lg rounded-3xl overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#121212] border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h2 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            <Camera size={20} />
            Kamera
          </h2>
          <button onClick={onClose} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}>
            <X size={20} />
          </button>
        </div>
        
        <div className="relative aspect-[4/3] bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm text-center p-4">
              {error}
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className={`p-4 flex items-center justify-center gap-4 ${theme === 'dark' ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
          <button 
            type="button"
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            className={`p-4 rounded-full transition-all ${theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'}`}
          >
            <RefreshCw size={24} />
          </button>
          
          <button 
            type="button"
            onClick={handleCapture}
            disabled={!!error || !stream}
            className="w-20 h-20 rounded-full border-4 border-zinc-400 flex items-center justify-center p-1 cursor-pointer disabled:opacity-50"
          >
            <div className="w-full h-full bg-white rounded-full hover:scale-95 transition-transform" />
          </button>
          
          <div className="w-[56px]" />
        </div>
      </div>
    </div>
  );
};
