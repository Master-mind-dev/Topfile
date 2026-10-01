import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { UploadedImageItem } from '../types';
import * as api from '../lib/api';

interface CameraSectionProps {
  images: UploadedImageItem[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImageItem[]>>;
}

export const CameraSection: React.FC<CameraSectionProps> = ({ images, setImages }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [flashOverlay, setFlashOverlay] = useState(false);

  // Camera scans (source === 'camera')
  const scans = images.filter((img) => img.source === 'camera');

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }, [stream]);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setErrorMsg('');
    setIsStarting(true);
    if (stream) { stream.getTracks().forEach((t) => t.stop()); setStream(null); }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg('Camera not supported in this browser.');
        setIsStarting(false);
        return;
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(newStream);
      setFacingMode(mode);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch {
      setIsCameraActive(false);
      setErrorMsg('Camera access denied. Please allow camera permissions and try again.');
    } finally {
      setIsStarting(false);
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => { stopCamera(); };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setFlashOverlay(true);
    setTimeout(() => setFlashOverlay(false), 200);

    const newScan: UploadedImageItem = {
      id: `scan-${Date.now()}`,
      name: `Scan_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
      dataUrl,
      fileSize: '1.4 MB',
      source: 'camera',
      createdAt: new Date().toISOString(),
      notes: '',
    };

    setImages((prev) => [newScan, ...prev]);
    try { await api.createImage(newScan); } catch (e) { console.warn(e); }
  };

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(next);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-camera-screen">
      {/* Header */}
      <div className="pt-2">
        <span className="text-xs font-bold text-white/50 tracking-wider uppercase">Camera</span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Scan</h1>
        <p className="text-xs sm:text-sm text-white/50 mt-1">
          Capture documents and add them to your workspace.
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Viewfinder */}
        <div className="lg:col-span-8 figma-glass-card p-4 sm:p-5 flex flex-col gap-4">
          {/* Status bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isStarting ? 'Starting…' : isCameraActive ? 'Live' : 'Standby'}</span>
            </div>
            <button
              onClick={flipCamera}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all"
              title="Flip camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Video viewfinder */}
          <div className="relative aspect-[16/10] bg-black/60 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
            {flashOverlay && <div className="absolute inset-0 bg-white z-30" />}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {/* Scan guide corners */}
            {isCameraActive && (
              <div className="absolute inset-8 sm:inset-12 pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#1bd9ff] rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#1bd9ff] rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#1bd9ff] rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#1bd9ff] rounded-br-sm" />
              </div>
            )}

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/80 z-10">
                <Camera className="w-10 h-10 text-white/40 mb-3" />
                <p className="text-sm font-semibold text-white/60 mb-4 max-w-xs">
                  {errorMsg || 'Camera not started.'}
                </p>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="figma-btn-primary px-5 py-2 text-xs"
                >
                  Start Camera
                </button>
              </div>
            )}
          </div>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={!isCameraActive}
            className="w-full py-3.5 bg-white text-zinc-950 font-black rounded-full flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-40"
          >
            <Camera className="w-5 h-5" />
            <span>Capture</span>
          </button>
        </div>

        {/* Right: recent scans */}
        <div className="lg:col-span-4 figma-glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Recent Scans</h3>
            <span className="text-xs text-white/40">{scans.length}</span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {scans.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <Camera className="w-8 h-8 text-white/20" />
                <p className="text-xs text-white/30">No scans yet</p>
              </div>
            ) : (
              scans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                  <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
                    {scan.dataUrl ? (
                      <img src={scan.dataUrl} alt={scan.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{scan.name}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
