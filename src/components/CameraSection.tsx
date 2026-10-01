import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Trash2 } from 'lucide-react';
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
  const [showGallery, setShowGallery] = useState(false);

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
      setErrorMsg('Camera access denied. Please allow camera permissions.');
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
    setTimeout(() => setFlashOverlay(false), 180);

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
    try { 
      const created = await api.createImage(newScan);
      setImages((prev) => prev.map((i) => i.id === newScan.id ? created : i));
    } catch (e) { 
      console.warn(e); 
    }
  };

  const handleDeleteScan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages((prev) => prev.filter((img) => img.id !== id));
    try { await api.deleteImage(id); } catch (e) { console.warn(e); }
  };

  return (
    <div className="pb-24 md:pb-6" id="figma-camera-screen">
      <canvas ref={canvasRef} className="hidden" />

      {/* Full-height camera viewfinder — Samsung/Apple style */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ minHeight: '75vh' }}>

        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ minHeight: '75vh' }}
        />

        {/* Flash white overlay */}
        {flashOverlay && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none" />
        )}

        {/* Scan guide corners (visible when live) */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-3/4 aspect-[3/4] max-h-[60%]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white/80 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white/80 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white/80 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white/80 rounded-br-md" />
            </div>
          </div>
        )}

        {/* Camera unavailable state */}
        {!isCameraActive && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 z-10">
            <Camera className="w-14 h-14 text-white/30" />
            <p className="text-white/50 text-sm text-center max-w-xs px-4">
              {isStarting ? 'Starting camera…' : (errorMsg || 'Camera not active')}
            </p>
            {!isStarting && (
              <button
                onClick={() => startCamera(facingMode)}
                className="px-6 py-2.5 bg-white text-zinc-950 font-bold rounded-full text-sm"
              >
                Start Camera
              </button>
            )}
          </div>
        )}

        {/* Top bar: status + flip */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-white text-xs font-semibold">
              {isStarting ? 'Starting…' : isCameraActive ? 'Live' : 'Standby'}
            </span>
          </div>
          <button
            onClick={() => startCamera(facingMode === 'environment' ? 'user' : 'environment')}
            className="p-2.5 bg-black/50 backdrop-blur-sm rounded-full text-white border border-white/20 cursor-pointer"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom controls: gallery thumbnail + capture + scan count */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 flex items-center justify-between z-20 bg-gradient-to-t from-black/70 to-transparent">
          {/* Last scan thumbnail */}
          <button
            onClick={() => setShowGallery(!showGallery)}
            className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/40 bg-white/10 flex-shrink-0"
          >
            {scans[0]?.dataUrl ? (
              <img src={scans[0].dataUrl} alt="Last scan" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-white/40" />
              </div>
            )}
          </button>

          {/* Big shutter button */}
          <button
            onClick={handleCapture}
            disabled={!isCameraActive}
            className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer disabled:opacity-40"
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>

          {/* Scan count */}
          <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/20 flex flex-col items-center justify-center">
            <span className="text-white font-black text-lg leading-none">{scans.length}</span>
            <span className="text-white/50 text-[9px] leading-none mt-0.5">scans</span>
          </div>
        </div>
      </div>

      {/* Gallery strip (shows when thumbnail tapped) */}
      {showGallery && scans.length > 0 && (
        <div className="mt-4 figma-glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white">Captured ({scans.length})</h3>
            <button onClick={() => setShowGallery(false)} className="text-xs text-white/40 hover:text-white cursor-pointer">Close</button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {scans.map((scan) => (
              <div key={scan.id} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 group">
                {scan.dataUrl ? (
                  <img src={scan.dataUrl} alt={scan.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white/30" />
                  </div>
                )}
                <button
                  onClick={(e) => handleDeleteScan(scan.id, e)}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                  <span className="text-[8px] text-white/70">
                    {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
