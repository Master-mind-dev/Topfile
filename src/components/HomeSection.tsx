import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Image as ImageIcon, 
  Camera, 
  Link as LinkIcon, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Pin,
  Sparkles,
  ExternalLink,
  Play
} from 'lucide-react';
import { NoteItem, UploadedImageItem, LinkItem, TabType } from '../types';

interface HomeSectionProps {
  notes: NoteItem[];
  images: UploadedImageItem[];
  links: LinkItem[];
  onNavigateTab: (tab: TabType) => void;
  onOpenCreateNote: () => void;
  onOpenUpload: () => void;
  onOpenCamera: () => void;
  onOpenAddLink: () => void;
  onSelectNote: (note: NoteItem) => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  notes,
  images,
  links,
  onNavigateTab,
  onOpenCreateNote,
  onOpenUpload,
  onOpenCamera,
  onOpenAddLink,
  onSelectNote,
}) => {
  const totalNotes = notes.length;
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const recentNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
  const recentImages = [...images].slice(0, 4);
  const recentLinks = [...links].slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 pb-16"
      id="home-dashboard-view"
    >
      {/* Top Header Row with High Density Metrics Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold mb-1">
            SPACE ENGINE OVERVIEW
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Workspace Dashboard
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenCreateNote}
            className="bg-[#E2E4E8] text-zinc-950 px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-[#FF2A3A] hover:text-white active:scale-95 transition-all duration-200 cursor-pointer shadow-sm"
            id="btn-home-create-note"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <button
            onClick={onOpenCamera}
            className="border border-white/20 bg-white/5 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 cursor-pointer"
            id="btn-home-open-camera"
          >
            <Camera className="w-4 h-4" />
            Capture
          </button>
        </div>
      </div>

      {/* High Density Metric Cards Grid (Matching Theme: 3-4 columns with border-white/20, text-5xl font-light) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div 
          onClick={() => onNavigateTab('notes')}
          className="border border-white/20 p-5 sm:p-6 rounded-2xl bg-white/5 hover:border-white/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
            <span>Total Notes</span>
            <FileText className="w-4 h-4 group-hover:text-white transition-colors" />
          </div>
          <div className="text-4xl sm:text-5xl font-light tracking-tight text-white">{totalNotes}</div>
          <div className="text-[11px] text-white/40 mt-2">{pinnedNotes.length} pinned records</div>
        </div>

        <div 
          onClick={() => onNavigateTab('upload')}
          className="border border-white/20 p-5 sm:p-6 rounded-2xl bg-black hover:border-white/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
            <span>Media Assets</span>
            <ImageIcon className="w-4 h-4 group-hover:text-white transition-colors" />
          </div>
          <div className="text-4xl sm:text-5xl font-light tracking-tight text-white">{images.length}</div>
          <div className="text-[11px] text-white/40 mt-2">Saved gallery uploads</div>
        </div>

        <div 
          onClick={() => onNavigateTab('scan')}
          className="border border-white/20 p-5 sm:p-6 rounded-2xl bg-white/5 hover:border-white/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
            <span>Camera Snaps</span>
            <Camera className="w-4 h-4 group-hover:text-white transition-colors" />
          </div>
          <div className="text-4xl sm:text-5xl font-light tracking-tight text-white">
            {images.filter((img) => img.source === 'camera').length}
          </div>
          <div className="text-[11px] text-white/40 mt-2">Live instant captures</div>
        </div>

        <div 
          onClick={() => onNavigateTab('links')}
          className="border border-white/20 p-5 sm:p-6 rounded-2xl bg-black hover:border-white/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
            <span>Saved Links</span>
            <LinkIcon className="w-4 h-4 group-hover:text-white transition-colors" />
          </div>
          <div className="text-4xl sm:text-5xl font-light tracking-tight text-white">{links.length}</div>
          <div className="text-[11px] text-white/40 mt-2">Videos & web bookmarks</div>
        </div>
      </div>

      {/* Grid: Recent Notes & High Density Live Resource Shelf */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        
        {/* Recent Notes Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest uppercase text-white/60 flex items-center gap-2">
              <FileText className="w-4 h-4 text-white" />
              Recent Notes
            </h2>
            <button
              onClick={() => onNavigateTab('notes')}
              className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              View All ({totalNotes})
            </button>
          </div>

          {recentNotes.length === 0 ? (
            <div className="p-8 rounded-xl border border-white/10 text-center text-white/40">
              <p className="text-xs font-medium">No notes created yet.</p>
              <button
                onClick={onOpenCreateNote}
                className="mt-3 px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs"
              >
                Create note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="p-4 border border-white/10 rounded-xl hover:border-white/40 transition-colors cursor-pointer group bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm text-white group-hover:text-white transition-colors truncate">
                      {note.title}
                    </div>
                    {note.isPinned && <Pin className="w-3 h-3 text-white/70 flex-shrink-0 ml-2" />}
                  </div>
                  <p className="text-xs text-white/40 line-clamp-1 leading-relaxed">
                    {note.content}
                  </p>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
                    <span>{note.category}</span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Resource & Saved Video Shelf */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest uppercase text-white/60 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-white" />
              Live Resource & Media
            </h2>
            <button
              onClick={() => onNavigateTab('links')}
              className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              Open Links Hub
            </button>
          </div>

          {recentLinks.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('links')}
              className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-white/40 transition-colors cursor-pointer group"
            >
              <div className="aspect-video bg-white/10 relative flex items-center justify-center overflow-hidden">
                {recentLinks[0].embedThumb ? (
                  <img
                    src={recentLinks[0].embedThumb}
                    alt={recentLinks[0].title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-lg">
                    <div className="border-l-8 border-l-white border-y-4 border-y-transparent ml-1" />
                  </div>
                )}
                {recentLinks[0].isPlayable && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-14 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-white transition-colors">
                  {recentLinks[0].title}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] py-1 px-2 border border-white/20 rounded uppercase font-bold tracking-wider text-white">
                    {recentLinks[0].isPlayable ? 'Play Video' : 'View Link'}
                  </div>
                  <div className="text-[10px] text-white/40">
                    {recentLinks[0].linkHost}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-white/10 text-center text-white/40 bg-white/5">
              <p className="text-xs">No media bookmarks saved yet.</p>
              <button
                onClick={onOpenAddLink}
                className="mt-3 px-4 py-2 rounded-full bg-white text-black font-bold text-xs"
              >
                Add first video
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
