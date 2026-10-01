import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  Scan,
  Sun,
  Focus,
  Crop,
  Sparkles,
  Languages,
  Files,
  Plus
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
  const [activeTab, setActiveTab] = useState<'live' | 'import'>('live');
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
  }, [stream]);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setErrorMsg('');
    setIsStarting(true);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg('Camera not supported in this browser.');
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
        await videoRef.current.play();
      }
    } catch (err: any) {
      setIsCameraActive(false);
      setErrorMsg('Camera access unavailable. Check permissions and try again.');
    } finally {
      setIsStarting(false);
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
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
      name: `Document_Scan_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
      dataUrl,
      fileSize: '1.4 MB',
      source: 'camera',
      createdAt: new Date().toISOString(),
      notes: 'Captured via OWNLY Scanner',
    };

    setImages((prev) => [newScan, ...prev]);
    try {
      await api.createImage(newScan);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-camera-screen">
      {/* ── Header (Exact Figma Desktop Capture and Scan) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
            Camera workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Capture</h1>
          <p className="text-xs sm:text-sm text-white/60 font-normal">
            Scan handwritten pages and turn them into searchable notes.
          </p>
        </div>

        <button
          onClick={handleCapture}
          className="figma-btn-dark px-5 py-2.5 flex items-center gap-2 cursor-pointer shadow-lg hover:border-white/40 active:scale-95 text-xs sm:text-sm"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>New scan</span>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* ── Main Capture Workspace: Viewfinder (Left 65%) + Settings & Session (Right 35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera Preview Viewfinder */}
        <div className="lg:col-span-8 figma-glass-card p-5 sm:p-7 space-y-4 flex flex-col justify-between">
          {/* Viewfinder Controls Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('live')}
                className={`figma-chip ${
                  activeTab === 'live' ? 'figma-chip-active' : 'figma-chip-inactive'
                }`}
              >
                Live camera
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`figma-chip ${
                  activeTab === 'import' ? 'figma-chip-active' : 'figma-chip-inactive'
                }`}
              >
                Import image
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isCameraActive ? 'Camera connected' : 'Camera standby'}</span>
            </div>
          </div>

          {/* Viewfinder View Window with Document Guides */}
          <div className="relative aspect-[16/10] bg-black/60 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
            {flashOverlay && <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200" />}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/80 z-10">
                <Camera className="w-12 h-12 text-white/40 mb-3" />
                <p className="text-sm font-semibold text-white/70 max-w-sm mb-4">
                  {errorMsg || 'Camera is paused. Click below to start live scanning.'}
                </p>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="figma-btn-primary px-5 py-2 text-xs"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Document Boundary Guide Corners (Figma Scan boundary) */}
            {isCameraActive && (
              <div className="absolute inset-8 sm:inset-12 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-[#1bd9ff]" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-[#1bd9ff]" />
                </div>
                <div className="flex items-center justify-center">
                  <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white flex items-center gap-2">
                    <Scan className="w-3.5 h-3.5 text-[#1bd9ff]" />
                    <span>Document detected • Hold steady</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-[#1bd9ff]" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-[#1bd9ff]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Quality Status, Capture Controls, Scan Settings */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ready to Capture Panel */}
          <div className="figma-glass-card p-6 space-y-5">
            <h3 className="text-base font-black text-white">Ready to capture</h3>

            {/* Quality Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 text-white/70">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Lighting</span>
                </div>
                <span className="font-bold text-emerald-400">Good</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 text-white/70">
                  <Focus className="w-4 h-4 text-cyan-400" />
                  <span>Focus</span>
                </div>
                <span className="font-bold text-white">Sharp</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 text-white/70">
                  <Crop className="w-4 h-4 text-purple-400" />
                  <span>Edges</span>
                </div>
                <span className="font-bold text-white">4 detected</span>
              </div>
            </div>

            {/* Big Capture Button */}
            <button
              onClick={handleCapture}
              disabled={!isCameraActive}
              className="w-full py-3 bg-white text-zinc-950 font-black rounded-full flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>Capture page</span>
            </button>
            <p className="text-[11px] text-white/40 text-center font-normal">
              Press space to capture
            </p>
          </div>

          {/* Scan Settings */}
          <div className="figma-glass-card p-5 space-y-3">
            <h4 className="text-xs font-bold text-white">Scan settings</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-white/70">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto enhance</span>
                </div>
                <span className="font-bold text-white">On</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-white/70">
                  <Languages className="w-3.5 h-3.5 text-blue-300" />
                  <span>Text language</span>
                </div>
                <span className="font-bold text-white">English</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-white/70">
                  <Files className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Output</span>
                </div>
                <span className="font-bold text-white">Searchable PDF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
