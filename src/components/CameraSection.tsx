import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  X, 
  Sparkles, 
  Grid, 
  AlertCircle,
  FlipHorizontal
} from 'lucide-react';
import { UploadedImageItem } from '../types';
import * as api from '../lib/api';

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

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [flashOverlay, setFlashOverlay] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsReady(false);
  }, [stream]);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setErrorMsg('');
    setIsReady(false);
    setIsStarting(true);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg('Camera API is not supported in this browser environment.');
        setIsCameraActive(false);
        setIsStarting(false);
        return;
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      setFacingMode(mode);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
    } catch (err: any) {
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera access denied. Please allow camera permission in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found. Please connect a camera and try again.');
      } else {
        setErrorMsg('Camera is currently unavailable. Please check permissions and try again.');
      }
    } finally {
      setIsStarting(false);
    }
  }, [stream]);

  const handleFlipCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(newMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMsg('Camera is still initializing. Please wait a moment and try again.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    
    // Flash effect
    setFlashOverlay(true);
    setTimeout(() => setFlashOverlay(false), 250);

    setCapturedDataUrl(dataUrl);
    setSaveSuccess(false);
    const ts = new Date().toISOString().slice(0, 10);
    setSnapshotName(`Capture_${ts}`);
    setSnapshotNotes('');
  };

  const savePhoto = async () => {
    if (!capturedDataUrl) return;

    const newImage: UploadedImageItem = {
      id: `cam-${Date.now()}`,
      name: `${snapshotName || `Capture_${new Date().toISOString().slice(0, 10)}`}.png`,
      dataUrl: capturedDataUrl,
      fileSize: '0.7 MB',
      source: 'camera',
      createdAt: new Date().toISOString(),
      notes: snapshotNotes || 'Camera capture',
    };

    setImages((prev) => [newImage, ...prev]);
    setSaveSuccess(true);
    try {
      await api.createImage(newImage);
    } catch (e) {
      console.warn('Sync camera capture failed:', e);
    }
    setTimeout(() => {
      setSaveSuccess(false);
      setCapturedDataUrl(null);
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="ownly-camera space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 pt-2">
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#d9ad52] uppercase font-extrabold mb-1">
            CAMERA STUDIO
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#d9ad52]" />
            Live Capture
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${showGrid ? 'bg-[#d9ad52] text-[#20140b]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title="Toggle grid overlay"
          >
            <Grid className="w-4 h-4" />
            Grid
          </button>
          {isCameraActive && (
            <button
              onClick={handleFlipCamera}
              className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Flip camera"
            >
              <FlipHorizontal className="w-4 h-4" />
              Flip
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewfinder — large size */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950" style={{ aspectRatio: '16/9', minHeight: 260 }}>
        {/* Inactive state */}
        {!isCameraActive && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                <Camera className="w-9 h-9 text-zinc-600" />
              </div>
              <div>
                <div className="text-white font-bold text-lg mb-1">Camera Offline</div>
                <div className="text-zinc-500 text-sm max-w-xs">
                  Enable your camera to start capturing high-resolution workspace images.
                </div>
              </div>
              {errorMsg && (
                <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 px-4 py-2.5 rounded-xl border border-amber-400/20 max-w-sm text-center">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startCamera('environment')}
                  className="px-6 py-2.5 bg-[#d9ad52] text-[#20140b] rounded-full text-sm font-bold hover:bg-[#f4dfb0] transition-all shadow-lg active:scale-95"
                  id="btn-start-camera"
                >
                  Start Camera
                </button>
                <button
                  onClick={() => startCamera('user')}
                  className="px-5 py-2.5 bg-white/10 text-white rounded-full text-sm font-bold hover:bg-white/20 transition-all active:scale-95"
                >
                  Front Camera
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Loading state */}
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#d9ad52]/30 border-t-[#d9ad52] rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Starting camera…</p>
            </div>
          </div>
        )}

        {/* Video element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setIsReady(true)}
          onCanPlay={() => setIsReady(true)}
          style={{ display: isCameraActive ? 'block' : 'none' }}
        />

        {/* Grid overlay */}
        {isCameraActive && showGrid && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/10" />
              ))}
            </div>
          </div>
        )}

        {/* Flash overlay on capture */}
        <AnimatePresence>
          {flashOverlay && (
            <motion.div
              key="flash"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Camera controls — bottom overlay */}
        {isCameraActive && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-6 pb-6 pt-4 bg-gradient-to-t from-black/60 to-transparent">
            {/* Stop camera */}
            <button
              onClick={stopCamera}
              className="p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-[#d9ad52]/20 hover:text-[#d9ad52] transition-all"
              title="Stop camera"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Shutter button */}
            <button
              onClick={capturePhoto}
              disabled={!isReady}
              className={`w-18 h-18 rounded-full border-4 border-white/80 active:scale-90 transition-all shadow-2xl flex items-center justify-center relative group ${
                isReady ? 'cursor-pointer bg-white/10 hover:bg-white/20' : 'cursor-not-allowed opacity-50 bg-white/5'
              }`}
              style={{ width: 68, height: 68 }}
              title="Capture photo"
              id="btn-capture-photo"
            >
              <div className={`w-12 h-12 rounded-full bg-white group-active:scale-90 transition-transform ${!isReady ? 'opacity-50' : ''}`} />
            </button>

            {/* Flip camera */}
            <button
              onClick={handleFlipCamera}
              className="p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
              title="Flip camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Error outside viewfinder (when camera is active) */}
      {errorMsg && isCameraActive && (
        <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 px-4 py-2.5 rounded-xl border border-amber-400/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-zinc-600">
        <span>{images.filter((i) => i.source === 'camera').length} captures in workspace</span>
        {isCameraActive && (
          <span className="flex items-center gap-1.5 text-[#34d399]">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
            Camera active — {facingMode === 'user' ? 'Front' : 'Back'}
          </span>
        )}
      </div>

      {/* Capture Review Modal */}
      <AnimatePresence>
        {capturedDataUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-zinc-950 border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] tracking-widest text-[#d9ad52] uppercase font-bold">REVIEW CAPTURE</div>
                  <h3 className="text-lg font-bold text-white mt-0.5">Save to Workspace</h3>
                </div>
                <button
                  onClick={() => setCapturedDataUrl(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img
                src={capturedDataUrl}
                className="w-full aspect-video object-cover rounded-2xl mb-4 border border-white/10 shadow-xl"
                alt="Captured photo"
              />
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 font-bold mb-1.5">Image Name</label>
                  <input
                    type="text"
                    placeholder="Capture name..."
                    className="w-full bg-black/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d9ad52] transition-colors"
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 font-bold mb-1.5">Notes (optional)</label>
                  <textarea
                    placeholder="Add notes about this capture..."
                    className="w-full bg-black/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d9ad52] h-20 resize-none transition-colors"
                    value={snapshotNotes}
                    onChange={(e) => setSnapshotNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCapturedDataUrl(null)}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold text-white/60 bg-white/5 border border-white/10 hover:text-white transition-all"
                  >
                    Retake
                  </button>
                  <button
                    onClick={savePhoto}
                    className="flex-1 py-2.5 bg-[#d9ad52] text-[#20140b] rounded-full font-bold text-sm hover:bg-[#f4dfb0] transition-all flex items-center justify-center gap-2 active:scale-95"
                    id="btn-save-capture"
                  >
                    {saveSuccess ? <Check className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    {saveSuccess ? 'Saved!' : 'Save to Workspace'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
