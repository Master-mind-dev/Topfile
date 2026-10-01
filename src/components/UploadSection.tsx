import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Download, 
  Search, 
  SlidersHorizontal,
  FolderOpen,
  Check,
  File
} from 'lucide-react';
import { UploadedImageItem } from '../types';
import * as api from '../lib/api';

interface UploadSectionProps {
  images: UploadedImageItem[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImageItem[]>>;
  onOpenCamera?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  images,
  setImages,
  onOpenCamera,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems: UploadedImageItem[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const sizeFormatted =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        const item: UploadedImageItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          dataUrl,
          fileSize: sizeFormatted,
          source: 'upload',
          createdAt: new Date().toISOString(),
          notes: file.type || 'Document asset',
        };

        newItems.push(item);
        if (newItems.length === fileList.length) {
          setImages((prev) => [...newItems, ...prev]);
          for (const img of newItems) {
            try {
              await api.createImage(img);
            } catch (err) {
              console.warn('Sync image create failed:', err);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    try {
      await api.deleteImage(id);
    } catch (e) {
      console.warn(e);
    }
  };

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-uploads-screen">
      {/* ── Header (Exact Figma Desktop Uploads) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
            Files and sources
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Uploads</h1>
          <p className="text-xs sm:text-sm text-white/60 font-normal">
            Bring PDFs, images, and documents into your study workspace.
          </p>
        </div>

      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        className="hidden"
      />

      {/* ── Main Uploads Workspace: Library (Left 65%) + Drop Zone & Storage Sidebar (Right 35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Files Library */}
        <div className="lg:col-span-8 figma-glass-card p-5 sm:p-7 space-y-5">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search uploaded files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-14 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
                ⌘ K
              </span>
            </div>

            <button className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-white/70 flex items-center gap-2 cursor-pointer">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All types</span>
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {['Recent', 'PDF', 'Images', 'Documents'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`figma-chip flex-shrink-0 ${
                  activeFilter === f ? 'figma-chip-active' : 'figma-chip-inactive'
                }`}
              >
                <span>{f}</span>
              </button>
            ))}
          </div>

          {/* Files count header */}
          <div className="flex items-center justify-between text-xs font-semibold text-white/60 border-b border-white/10 pb-3">
            <span>{filteredImages.length} files</span>
            <span className="text-white/40 text-[11px]">Newest first</span>
          </div>

          {/* File list items (Figma File Item cards) */}
          <div className="space-y-2.5">
            {filteredImages.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm">
                No uploaded files yet. Drag & drop files here or click "Choose files".
              </div>
            ) : (
              filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-4 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white overflow-hidden">
                      {img.dataUrl?.startsWith('data:image') ? (
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-white/80" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{img.name}</div>
                      <div className="text-xs text-white/40 truncate mt-0.5">
                        {img.fileSize || '1.2 MB'} • {new Date(img.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {img.dataUrl && (
                      <a
                        href={img.dataUrl}
                        download={img.name}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 cursor-pointer transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Drop Zone + Storage (Figma Frame 73:266) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Drop Zone only */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`figma-glass-card p-8 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive ? 'border-white bg-white/15 scale-[1.02]' : 'hover:border-white/40'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-white">Drop files here</h3>
            <p className="text-xs text-white/45 mt-1.5 max-w-[200px]">
              PDF, PNG, JPG, DOCX • Up to 25 MB each
            </p>
            <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Choose files</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};