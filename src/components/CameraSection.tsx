import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  X, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Grid, 
  Timer, 
  AlertCircle,
  Eye,
  Upload
} from 'lucide-react';
import { UploadedImageItem } from '../types';

interface CameraSectionProps {
  images: UploadedImageItem[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImageItem[]>>;
}

export const CameraSection: React.FC<CameraSectionProps> = ({
  images,
  setImages,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [showGrid, setShowGrid] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const startCamera = async (mode: 'user' | 'environment') => {
    setErrorMsg('');
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg('Camera API is not supported in this browser environment.');
        setIsCameraActive(false);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setIsCameraActive(false);
      setErrorMsg('Camera is currently unavailable. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedDataUrl(dataUrl);
    setSaveSuccess(false);
  };

  const savePhoto = () => {
    if (!capturedDataUrl) return;
    
    const newImage: UploadedImageItem = {
      id: `cam-${Date.now()}`,
      name: `Capture_${new Date().toISOString().slice(0, 10)}.png`,
      dataUrl: capturedDataUrl,
      fileSize: '0.7 MB',
      source: 'camera',
      createdAt: new Date().toISOString(),
      notes: snapshotNotes || 'Camera capture',
    };

    setImages((prev) => [newImage, ...prev]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="ownly-camera space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-500" />
          Live Capture
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => startCamera('user')} 
            className={`p-2 rounded-lg text-xs font-bold transition-all ${facingMode === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            Front
          </button>
          <button 
            onClick={() => startCamera('environment')} 
            className={`p-2 rounded-lg text-xs font-bold transition-all ${facingMode === 'environment' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            Back
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Camera className="w-12 h-12 text-zinc-700 mb-4" />
            <div className="text-white font-bold mb-2">Camera Offline</div>
            <div className="text-zinc-500 text-sm max-w-xs mb-6">Enable your camera to start capturing high-resolution workspace assets.</div>
            <button 
              onClick={() => startCamera('environment')}
              className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-zinc-200 transition-all"
            >
              Initialize Camera
            </button>
          </div>
        )}
        
        <video ref={videoRef} className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`} autoPlay playsInline />
        
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {showGrid && (
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/10" />
                ))}
              </div>
            )}
          </div>
        )}

        {isCameraActive && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
            <button 
              onClick={stopCamera}
              className="p-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-red-500 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full border-4 border-zinc-400 active:scale-90 transition-all shadow-xl"
            />
            <button 
              onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
              className="p-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {capturedDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Review Capture</h3>
              <button onClick={() => setCapturedDataUrl(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={capturedDataUrl} className="w-full aspect-video object-cover rounded-2xl mb-4 border border-white/10" />
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Capture name..." 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
              />
              <textarea 
                placeholder="Add notes..." 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30 h-20"
                value={snapshotNotes}
                onChange={(e) => setSnapshotNotes(e.target.value)}
              />
              <button 
                onClick={savePhoto}
                className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                {saveSuccess ? <Check className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                {saveSuccess ? 'Saved to Workspace' : 'Save to Workspace'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
