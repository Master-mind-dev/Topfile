import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  Maximize2, 
  X, 
  Camera, 
  Search,
  Plus
} from 'lucide-react';
import { UploadedImageItem } from '../types';

interface UploadSectionProps {
  images: UploadedImageItem[];
  onUploadImages: (newImages: UploadedImageItem[]) => void;
  onDeleteImage: (id: string) => void;
  onOpenCamera: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  images,
  onUploadImages,
  onDeleteImage,
  onOpenCamera,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedImageItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems: UploadedImageItem[] = [];

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const sizeFormatted = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        const item: UploadedImageItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          dataUrl,
          fileSize: sizeFormatted,
          source: 'upload',
          createdAt: new Date().toISOString(),
          notes: 'Uploaded image asset',
        };

        newItems.push(item);
        if (newItems.length === fileList.filter((f) => f.type.startsWith('image/')).length) {
          onUploadImages(newItems);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDownload = (img: UploadedImageItem) => {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = img.name || 'image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredImages = images.filter((img) => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (img.notes && img.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-16"
      id="uploads-exclusive-view"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#FF2A3A] uppercase font-extrabold mb-1">
            MEDIA ASSET VAULT
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Image Gallery & Uploads
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-white/10 text-white border border-white/20">
              {images.length} Total
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#E2E4E8] text-zinc-950 font-bold px-4 py-2 rounded-full text-xs sm:text-sm hover:bg-[#FF2A3A] hover:text-white active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md"
            id="btn-upload-picker"
          >
            <Upload className="w-4 h-4" />
            Upload Images
          </button>
          <button
            onClick={onOpenCamera}
            className="border border-white/20 bg-white/5 text-white font-semibold px-4 py-2 rounded-full text-xs sm:text-sm hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer backdrop-blur-md"
            id="btn-open-camera-from-uploads"
          >
            <Camera className="w-4 h-4" />
            Capture Photo
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-8 sm:p-10 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden backdrop-blur-md ${
          dragActive
            ? 'border-[#FF2A3A] bg-[#FF2A3A]/10 scale-[0.99]'
            : 'border-white/20 bg-zinc-950/40 hover:border-white/50'
        }`}
        id="drag-drop-zone"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3 shadow-lg">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-white mb-1">
          Drop image files here, or <span className="text-[#FF2A3A] underline underline-offset-4">browse device</span>
        </h3>
        <p className="text-xs text-white/40 max-w-sm">
          Supports PNG, JPG, JPEG, SVG, WebP and animated GIF format files.
        </p>
      </div>

      {/* Search and filter */}
      {images.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-zinc-950/60 border border-white/15 p-2.5 rounded-2xl backdrop-blur-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search uploaded images by name..."
              className="w-full bg-black/70 border border-white/10 text-white placeholder:text-white/40 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm outline-none focus:border-[#FF2A3A] font-medium transition-colors"
            />
          </div>
          <span className="text-xs font-semibold text-white/40 pr-2">
            Showing {filteredImages.length} of {images.length}
          </span>
        </div>
      )}

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-zinc-950/40 text-center text-white/40">
          <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No images in gallery</h3>
          <p className="text-xs text-white/40 max-w-xs mx-auto mb-4">
            Upload pictures from your computer or switch to the camera section to take real-time snapshots.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-full bg-[#E2E4E8] text-black font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#FF2A3A] hover:text-white transition-all shadow-md"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="rounded-3xl border border-white/10 hover:border-white/40 bg-zinc-950/60 backdrop-blur-md overflow-hidden group transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-xl"
            >
              {/* Image Thumbnail */}
              <div className="aspect-square w-full bg-black relative overflow-hidden">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Source Badge */}
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md border border-white/10 ${
                  img.source === 'camera' 
                    ? 'bg-[#FF2A3A] text-white' 
                    : 'bg-black/80 text-white'
                }`}>
                  {img.source === 'camera' ? 'Camera Snap' : 'Uploaded'}
                </span>

                {/* Hover overlay with quick actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(img);
                    }}
                    className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg"
                    title="Fullscreen Preview"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(img);
                    }}
                    className="p-2.5 rounded-xl bg-white/20 text-white hover:bg-white hover:text-black transition-colors shadow-lg"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this image?')) {
                        onDeleteImage(img.id);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-red-600/80 text-white hover:bg-red-500 transition-colors shadow-lg"
                    title="Delete Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-4 border-t border-white/5">
                <p className="text-xs font-bold text-white truncate mb-1">
                  {img.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>{img.fileSize || 'N/A'}</span>
                  <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Top */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {selectedImage.name}
                  </h3>
                  <p className="text-xs text-white/40">
                    {selectedImage.source === 'camera' ? 'Live Camera Capture' : 'User Upload'} • {selectedImage.fileSize}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Image display */}
              <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-black/70 min-h-[300px]">
                <img
                  src={selectedImage.dataUrl}
                  alt={selectedImage.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-black flex items-center justify-between text-xs text-white/40">
                <span>Added: {new Date(selectedImage.createdAt).toLocaleString()}</span>
                <button
                  onClick={() => {
                    if (confirm('Delete this image from workspace?')) {
                      onDeleteImage(selectedImage.id);
                      setSelectedImage(null);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Image
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
