import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { UploadedImageItem } from '../types';
import * as api from '../lib/api';

interface UploadSectionProps {
  images: UploadedImageItem[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImageItem[]>>;
  onOpenCamera?: () => void;
}

interface UploadStatus {
  id: string;
  name: string;
  progress: number; // 0-100
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

function getFileIcon(name: string, dataUrl?: string) {
  if (dataUrl?.startsWith('data:image')) return <ImageIcon className="w-5 h-5 text-cyan-400" />;
  const ext = (name || '').split('.').pop()?.toLowerCase();
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) return <Film className="w-5 h-5 text-purple-400" />;
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music className="w-5 h-5 text-emerald-400" />;
  if (['zip', 'rar', 'gz', 'tar'].includes(ext || '')) return <Archive className="w-5 h-5 text-amber-400" />;
  if (['pdf'].includes(ext || '')) return <FileText className="w-5 h-5 text-red-400" />;
  return <FileText className="w-5 h-5 text-white/70" />;
}

const MAX_FILE_SIZE_MB = 25;

export const UploadSection: React.FC<UploadSectionProps> = ({ images, setImages }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [viewingFile, setViewingFile] = useState<UploadedImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateStatus = useCallback((id: string, patch: Partial<UploadStatus>) => {
    setUploadStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const processFile = useCallback(async (file: File) => {
    const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Size check — show error in the status panel, do NOT throw
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadStatuses((prev) => [
        { id: tempId, name: file.name, progress: 0, status: 'error', error: `File too large (max ${MAX_FILE_SIZE_MB} MB)` },
        ...prev,
      ]);
      return;
    }

    // Add uploading status
    setUploadStatuses((prev) => [
      { id: tempId, name: file.name, progress: 10, status: 'uploading' },
      ...prev,
    ]);

    let dataUrl = '';
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string ?? '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      updateStatus(tempId, { status: 'error', error: 'Could not read file', progress: 0 });
      return;
    }

    updateStatus(tempId, { progress: 40 });

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const item: UploadedImageItem = {
      id: tempId,
      name: file.name || 'Unnamed file',
      dataUrl,
      fileSize: sizeFormatted,
      source: 'upload',
      createdAt: new Date().toISOString(),
      notes: file.type || 'Document asset',
    };

    // Add to list optimistically
    setImages((prev) => [item, ...prev]);
    updateStatus(tempId, { progress: 70 });

    // Sync to backend
    try {
      const created = await api.createImage(item);
      // Swap temp id with real backend id
      setImages((prev) => prev.map((i) => (i.id === tempId ? created : i)));
      updateStatus(tempId, { progress: 100, status: 'done', id: created.id });
    } catch (syncErr) {
      console.warn('[Upload] Backend sync failed, keeping local copy:', syncErr);
      // Don't remove from list, just mark as sync warning
      updateStatus(tempId, { progress: 100, status: 'done' });
    }
  }, [setImages, updateStatus]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(processFile);
  }, [processFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    try { await api.deleteImage(id); } catch (e) { console.warn(e); }
  };

  const dismissStatus = (id: string) => {
    setUploadStatuses((prev) => prev.filter((s) => s.id !== id));
  };

  // Determine how to view a file inline
  const getViewerContent = (img: UploadedImageItem) => {
    const name = img.name || '';
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const dataUrl = img.dataUrl || '';

    // Images — show directly
    if (dataUrl.startsWith('data:image') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) {
      return { type: 'image', src: dataUrl || img.dataUrl };
    }
    // PDF — use browser iframe (works natively)
    if (ext === 'pdf' || dataUrl.startsWith('data:application/pdf')) {
      return { type: 'pdf', src: dataUrl };
    }
    // Word / Excel / PPT — use Google Docs Viewer
    if (['doc','docx','xls','xlsx','ppt','pptx'].includes(ext)) {
      // If we have a dataUrl we can't use Google Docs Viewer, open directly
      return { type: 'download', src: dataUrl, ext };
    }
    return { type: 'download', src: dataUrl, ext };
  };

  const filteredImages = images.filter((img) =>
    (img.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const activeUploads = uploadStatuses.filter((s) => s.status === 'uploading');

  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-uploads-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Uploads</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5">PDFs, images, and documents — all in one place.</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="figma-btn-dark px-5 py-2.5 flex items-center gap-2 cursor-pointer active:scale-95 text-sm self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload files</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        multiple
        accept="*/*"
        className="hidden"
      />

      {/* Upload Progress Toasts */}
      <AnimatePresence>
        {uploadStatuses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {uploadStatuses.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                  s.status === 'error'
                    ? 'bg-red-500/10 border-red-500/20'
                    : s.status === 'done'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {s.status === 'uploading' && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin flex-shrink-0" />
                )}
                {s.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {s.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-white/80 font-medium truncate text-xs">{s.name}</div>
                  {s.status === 'uploading' && (
                    <div className="mt-1.5 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-400 rounded-full"
                        initial={{ width: '10%' }}
                        animate={{ width: `${s.progress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}
                  {s.status === 'error' && <div className="text-red-400 text-[11px]">{s.error}</div>}
                  {s.status === 'done' && <div className="text-emerald-400 text-[11px]">Uploaded successfully</div>}
                </div>
                {s.status !== 'uploading' && (
                  <button onClick={() => dismissStatus(s.id)} className="text-white/30 hover:text-white/80 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Library */}
        <div className="lg:col-span-8 figma-glass-card p-5 sm:p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          {/* Count */}
          <div className="flex items-center justify-between text-xs font-semibold text-white/40 border-b border-white/10 pb-3">
            <span>{filteredImages.length} file{filteredImages.length !== 1 ? 's' : ''}</span>
            {activeUploads.length > 0 && (
              <span className="text-cyan-400 animate-pulse">{activeUploads.length} uploading…</span>
            )}
          </div>

          {/* File list */}
          <AnimatePresence>
            {filteredImages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-white/30 text-sm"
              >
                <UploadCloud className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No files yet — drag &amp; drop or click "Upload files"</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {filteredImages.map((img, i) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/15 flex items-center justify-between gap-4 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/8">
                        {img.dataUrl?.startsWith('data:image') ? (
                          <img src={img.dataUrl} alt={img.name || 'file'} className="w-full h-full object-cover" />
                        ) : (
                          getFileIcon(img.name || '', img.dataUrl)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{img.name || 'Unnamed file'}</div>
                        <div className="text-xs text-white/35 truncate mt-0.5">
                          {img.fileSize || '—'} &bull; {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewingFile(img)}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-cyan-400 cursor-pointer transition-all"
                        title="View file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {img.dataUrl && (
                        <a
                          href={img.dataUrl}
                          download={img.name || 'file'}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(img.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 cursor-pointer transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Drop Zone Sidebar */}
        <div className="lg:col-span-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`figma-glass-card p-8 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[240px] ${
              dragActive
                ? 'border-cyan-400/60 bg-cyan-500/10 scale-[1.02] shadow-lg shadow-cyan-500/10'
                : 'hover:border-white/30 hover:bg-white/8'
            }`}
          >
            <motion.div
              animate={dragActive ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                dragActive ? 'bg-cyan-400/20 border border-cyan-400/30' : 'bg-white/10'
              }`}
            >
              <UploadCloud className={`w-8 h-8 ${dragActive ? 'text-cyan-400' : 'text-white/70'}`} />
            </motion.div>
            <h3 className="text-base font-black text-white">
              {dragActive ? 'Release to upload' : 'Drop files here'}
            </h3>
            <p className="text-xs text-white/40 mt-1.5 max-w-[180px] leading-relaxed">
              PDF, PNG, JPG, DOCX, MP4 &bull; Up to {MAX_FILE_SIZE_MB} MB each
            </p>
            <div className="mt-5 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs font-bold text-white transition-all">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Choose files</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline File Viewer Modal ── */}
      <AnimatePresence>
        {viewingFile && (() => {
          const viewer = getViewerContent(viewingFile);
          return (
            <motion.div
              key="file-viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col"
              onClick={(e) => { if (e.target === e.currentTarget) setViewingFile(null); }}
            >
              {/* Viewer header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/60 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(viewingFile.name || '', viewingFile.dataUrl)}
                  <span className="text-sm font-bold text-white truncate">{viewingFile.name}</span>
                  <span className="text-[11px] text-white/30">{viewingFile.fileSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  {viewingFile.dataUrl && (
                    <a
                      href={viewingFile.dataUrl}
                      download={viewingFile.name || 'file'}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => setViewingFile(null)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white cursor-pointer transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Viewer content */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                {viewer.type === 'image' && (
                  <motion.img
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={viewer.src}
                    alt={viewingFile.name}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  />
                )}
                {viewer.type === 'pdf' && viewer.src && (
                  <iframe
                    src={viewer.src}
                    className="w-full h-full rounded-xl border border-white/10"
                    title={viewingFile.name}
                    style={{ minHeight: '70vh' }}
                  />
                )}
                {viewer.type === 'download' && (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                      {getFileIcon(viewingFile.name || '', viewingFile.dataUrl)}
                    </div>
                    <p className="text-white font-bold">{viewingFile.name}</p>
                    <p className="text-white/40 text-sm max-w-xs">
                      This file type can't be previewed in the browser. You can download it to view it.
                    </p>
                    {viewingFile.dataUrl && (
                      <a
                        href={viewingFile.dataUrl}
                        download={viewingFile.name || 'file'}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0d0608] font-black rounded-full text-sm hover:bg-white/90 active:scale-95 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download file
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};