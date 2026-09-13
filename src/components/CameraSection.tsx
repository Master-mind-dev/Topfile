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
  onSaveCapturedImage: (image: UploadedImageItem) => void;
  onViewGallery: () => void;
}

export const CameraSection: React.FC<CameraSectionProps> = ({
  onSaveCapturedImage,
  onViewGallery,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Camera tools
  const [showGrid, setShowGrid] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  // Captured snapshot state
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Start camera
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
        videoRef.current.play().catch(() => {
          // Quietly ignore auto-play restrictions
        });
      }
    } catch (err: any) {
      // Quietly try standard video fallback without facingMode constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr: any) {
        setIsCameraActive(false);
        if (fallbackErr?.name === 'NotAllowedError' || fallbackErr?.message?.includes('dismissed') || err?.name === 'NotAllowedError') {
          setErrorMsg('Camera permission was dismissed or blocked. You can retry permission or upload / simulate a capture below.');
        } else {
          setErrorMsg('Camera is currently unavailable. You can upload an image or simulate a capture below.');
        }
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Flip camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Sample snapshot fallback generator
  const handleSimulateCapture = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create high-res dark scan graphic
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#121316');
      grad.addColorStop(1, '#050507');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      for (let y = 0; y < 720; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }

      // Draw Target Crosshairs
      ctx.strokeStyle = '#FF2A3A';
      ctx.lineWidth = 3;
      ctx.strokeRect(540, 260, 200, 200);

      // Text watermark
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OWNLY HARDWARE CAPTURE', 640, 350);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText(new Date().toLocaleString(), 640, 390);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const now = new Date();
      const defaultName = `Snapshot_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours()}${now.getMinutes()}.jpg`;

      setCapturedDataUrl(dataUrl);
      setSnapshotName(defaultName);
      setSnapshotNotes('Captured workspace scan frame');
      setSaveSuccess(false);
    }
  };

  // Upload file fallback
  const handleFileUploadFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedDataUrl(dataUrl);
      setSnapshotName(file.name);
      setSnapshotNotes('Imported via file upload fallback');
      setSaveSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  // Trigger snapshot
  const handleShutterClick = () => {
    if (!isCameraActive) {
      handleSimulateCapture();
      return;
    }

    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            captureFrame();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      captureFrame();
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      handleSimulateCapture();
      return;
    }

    // Flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror selfie camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      const now = new Date();
      const defaultName = `Camera_Scan_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.jpg`;
      
      setCapturedDataUrl(dataUrl);
      setSnapshotName(defaultName);
      setSnapshotNotes('Captured on spot via camera scan');
      setSaveSuccess(false);
    }
  };

  // Save to workspace
  const handleSaveToWorkspace = () => {
    if (!capturedDataUrl) return;

    const newImage: UploadedImageItem = {
      id: `cam-${Date.now()}`,
      name: snapshotName.trim() || 'camera_capture.jpg',
      dataUrl: capturedDataUrl,
      fileSize: '750 KB',
      dimensions: `${canvasRef.current?.width || 1280} x ${canvasRef.current?.height || 720}`,
      source: 'camera',
      createdAt: new Date().toISOString(),
      notes: snapshotNotes.trim(),
    };

    onSaveCapturedImage(newImage);
    setSaveSuccess(true);
    setTimeout(() => {
      setCapturedDataUrl(null);
      setSaveSuccess(false);
    }, 1200);
  };

  // Download snapshot
  const handleDownloadSnapshot = () => {
    if (!capturedDataUrl) return;
    const a = document.createElement('a');
    a.href = capturedDataUrl;
    a.download = snapshotName || 'camera_snap.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-16"
      id="camera-scan-view"
    >
      {/* Hidden Canvas and File Input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUploadFallback}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold mb-1">
            HARDWARE SCANNER
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Camera Capture
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
              {isCameraActive ? 'Live Feed Active' : 'Ready'}
            </span>
          </div>
        </div>

        <button
          onClick={onViewGallery}
          className="border border-white/20 bg-[#E2E4E8] text-zinc-950 font-bold px-4 py-2 rounded-full text-xs sm:text-sm hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Eye className="w-4 h-4" />
          View Uploads Gallery
        </button>
      </div>

      {/* Camera Viewfinder Box */}
      <div className="w-full max-w-3xl mx-auto rounded-3xl bg-black border border-white/20 overflow-hidden shadow-2xl relative">
        
        {/* Flash Overlay */}
        {flashActive && (
          <div className="absolute inset-0 z-30 bg-white pointer-events-none transition-opacity duration-200" />
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className="text-8xl font-light text-white animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {/* Viewfinder Display */}
        <div className="aspect-[4/3] sm:aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-8 text-center text-white/40 max-w-md">
              <AlertCircle className="w-12 h-12 text-white/60 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Camera Permission Dismissed / Inactive</h3>
              <p className="text-xs text-white/50 mb-5 leading-relaxed">{errorMsg}</p>
              
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 rounded-full bg-[#E2E4E8] text-zinc-950 hover:bg-[#FF2A3A] hover:text-white font-bold text-xs transition-all duration-200 cursor-pointer shadow-sm"
                >
                  Retry Camera
                </button>
                <button
                  onClick={handleSimulateCapture}
                  className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-[#FF2A3A] hover:border-[#FF2A3A] font-bold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Take Sample Snap
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-[#FF2A3A] hover:border-[#FF2A3A] font-bold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Photo
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Grid Lines Overlay */}
              {showGrid && isCameraActive && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              )}

              {/* Viewfinder Target Framing Center Marks */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 border border-white/20 rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
                </div>
              </div>
            </>
          )}

          {/* Top Quick Settings Bar */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto z-20">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Grid Toggle */}
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-full backdrop-blur-md border transition-all duration-200 cursor-pointer ${
                  showGrid ? 'bg-[#E2E4E8] text-black border-white hover:bg-[#FF2A3A] hover:text-white' : 'bg-black/80 text-white border-white/20 hover:bg-[#FF2A3A]'
                }`}
                title="Toggle Grid Guide"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              {/* Timer Toggle */}
              <button
                type="button"
                onClick={() => setTimerSeconds(timerSeconds === 0 ? 3 : 0)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                  timerSeconds > 0 ? 'bg-[#E2E4E8] text-black border-white hover:bg-[#FF2A3A] hover:text-white' : 'bg-black/80 text-white border-white/20 hover:bg-[#FF2A3A]'
                }`}
                title="Countdown Timer"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timerSeconds === 0 ? 'Off' : '3s'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Viewfinder Bottom Control Bar */}
        <div className="p-4 sm:p-6 bg-black border-t border-white/10 flex items-center justify-around gap-4">
          {/* Flip Camera Button */}
          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/20 text-white/80 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 cursor-pointer flex flex-col items-center gap-1"
            title="Switch Camera (Front/Back)"
            id="btn-flip-camera"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px] font-bold">Flip</span>
          </button>

          {/* Large Shutter Button */}
          <button
            type="button"
            onClick={handleShutterClick}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1.5 bg-black border-2 border-white hover:border-[#FF2A3A] active:scale-90 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-2xl group"
            id="btn-camera-shutter"
            aria-label="Capture Snapshot"
          >
            <div className="w-full h-full rounded-full bg-[#E2E4E8] group-hover:bg-[#FF2A3A] group-hover:text-white transition-colors duration-200 flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-black group-hover:text-white transition-colors duration-200" />
            </div>
          </button>

          {/* Quick Reload / Snap Demo Button */}
          <button
            type="button"
            onClick={() => {
              if (errorMsg) {
                handleSimulateCapture();
              } else {
                startCamera(facingMode);
              }
            }}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/20 text-white/80 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 cursor-pointer flex flex-col items-center gap-1"
            title="Reload Camera / Snap Frame"
            id="btn-reload-camera"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[10px] font-bold">{errorMsg ? 'Demo' : 'Reload'}</span>
          </button>
        </div>
      </div>

      {/* Immediate Snapshot Review Modal */}
      <AnimatePresence>
        {capturedDataUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-black border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto"
              id="snapshot-preview-modal"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-white" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Captured Snapshot
                  </h3>
                </div>
                <button
                  onClick={() => setCapturedDataUrl(null)}
                  className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-[#FF2A3A] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Image */}
              <div className="my-4 rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center max-h-64 sm:max-h-72">
                <img
                  src={capturedDataUrl}
                  alt="Captured snapshot"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              {saveSuccess ? (
                <div className="py-6 text-center text-emerald-400 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-white">Saved to Workspace!</h4>
                  <p className="text-xs text-white/40">Available in your Uploads gallery now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                      Notes / Annotation
                    </label>
                    <input
                      type="text"
                      value={snapshotNotes}
                      onChange={(e) => setSnapshotNotes(e.target.value)}
                      placeholder="Optional notes for this capture..."
                      className="w-full bg-white/5 border border-white/20 text-white font-normal px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setCapturedDataUrl(null)}
                      className="flex-1 py-3 rounded-full bg-white/5 border border-white/20 text-white/60 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] font-bold text-xs cursor-pointer transition-all duration-200"
                    >
                      Retake
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSnapshot}
                      className="p-3 rounded-full bg-white/5 border border-white/20 text-white hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] font-bold text-xs transition-all duration-200 cursor-pointer"
                      title="Download to device"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveToWorkspace}
                      className="flex-[2] py-3 rounded-full bg-[#E2E4E8] text-zinc-950 hover:bg-[#FF2A3A] hover:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-200"
                      id="btn-save-captured-image"
                    >
                      <Check className="w-4 h-4" />
                      Save to Workspace
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
