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
  Play,
  Flame
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

  const metrics = [
    { label: 'Notes Vault', value: totalNotes, detail: `${pinnedNotes.length} pinned records`, tab: 'notes' as TabType, icon: FileText, tone: 'gold' },
    { label: 'Media Assets', value: images.length, detail: 'Saved gallery uploads', tab: 'upload' as TabType, icon: ImageIcon, tone: 'blue' },
    { label: 'Live Snaps', value: images.filter((img) => img.source === 'camera').length, detail: 'Camera captures', tab: 'scan' as TabType, icon: Camera, tone: 'green' },
    { label: 'Video & Links', value: links.length, detail: 'YouTube & web cards', tab: 'links' as TabType, icon: LinkIcon, tone: 'violet' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="ownly-home space-y-8 pb-16"
      id="home-dashboard-view"
    >
      {/* Top Header Row with High Density Metrics Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#FF2A3A] uppercase font-extrabold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF2A3A] animate-ping" />
            WORKSPACE ENGINE ACTIVE
          </div>
            <h1 className="ownly-home__title text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Personal Space Dashboard
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateNote}
            className="journey-action journey-action--primary bg-[#E2E4E8] text-zinc-950 px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-[#FF2A3A] hover:text-white active:scale-95 transition-all duration-200 cursor-pointer shadow-md"
            id="btn-home-create-note"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <button
            onClick={onOpenCamera}
            className="journey-action border border-white/20 bg-white/5 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
            id="btn-home-open-camera"
          >
            <Camera className="w-4 h-4" />
            Live Scan
          </button>
          <button
            onClick={onOpenAddLink}
            className="journey-action border border-white/20 bg-white/5 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
            id="btn-home-add-link"
          >
            <LinkIcon className="w-4 h-4" />
            Add Media
          </button>
        </div>
      </div>

      {/* High Density Metric Cards Grid with Anime Night Glow */}
      <div className="ownly-home__metrics grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.button
              key={metric.label}
              type="button"
              onClick={() => onNavigateTab(metric.tab)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className={`journey-metric journey-metric--${metric.tone} text-left border border-white/15 p-5 sm:p-6 rounded-3xl bg-zinc-950/60 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer group shadow-xl relative overflow-hidden backdrop-blur-md`}
            >
              <div className="journey-metric__glow absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-all" />
              <div className="flex items-center justify-between text-white/50 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2">
                <span>{metric.label}</span>
                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <motion.div key={metric.value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {metric.value}
              </motion.div>
              <div className="text-[11px] text-white/50 mt-2 flex items-center gap-1">
                <span className="journey-metric__dot w-1.5 h-1.5 rounded-full" />
                {metric.detail}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Grid: Recent Notes & High Density Live Resource Shelf */}
      <div className="ownly-home__lower grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pt-2">
        
        {/* Recent Notes Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-widest uppercase text-white/70 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF2A3A]" />
              Recent Notes
            </h2>
            <button
              onClick={() => onNavigateTab('notes')}
              className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              View All ({totalNotes}) →
            </button>
          </div>

          {recentNotes.length === 0 ? (
            <div className="p-8 rounded-3xl border border-white/10 text-center text-white/40 bg-zinc-950/40">
              <p className="text-xs font-medium">No notes created yet.</p>
              <button
                onClick={onOpenCreateNote}
                className="mt-3 px-4 py-2 rounded-full bg-[#E2E4E8] text-black font-bold text-xs hover:bg-[#FF2A3A] hover:text-white transition-all"
              >
                Create first note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="p-4 sm:p-5 border border-white/10 rounded-2xl hover:border-white/40 transition-all cursor-pointer group bg-zinc-950/50 backdrop-blur-md shadow-lg"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: note.colorTag || '#FF2A3A',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-bold text-sm text-white group-hover:text-white transition-colors truncate">
                      {note.title}
                    </div>
                    {note.isPinned && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                    <span className="font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10">{note.category}</span>
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
            <h2 className="text-xs font-bold tracking-widest uppercase text-white/70 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-purple-400" />
              Featured Media Stream
            </h2>
            <button
              onClick={() => onNavigateTab('links')}
              className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              Open Links Hub →
            </button>
          </div>

          {recentLinks.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('links')}
              className="bg-zinc-950/60 rounded-3xl overflow-hidden border border-white/15 hover:border-[#FF2A3A] transition-all duration-300 cursor-pointer group shadow-2xl backdrop-blur-md"
            >
              <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
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
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#FF2A3A] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-black/80 text-white backdrop-blur-md border border-white/20">
                  {recentLinks[0].linkHost}
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm sm:text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-[#FF2A3A] transition-colors">
                  {recentLinks[0].title}
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="text-[10px] py-1 px-2.5 border border-white/20 rounded-full uppercase font-bold tracking-wider text-white bg-white/5">
                    {recentLinks[0].isPlayable ? '▶ Play Video Stream' : 'Open Link'}
                  </div>
                  <div className="text-[11px] text-white/40">
                    Click to open in theater
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-white/10 text-center text-white/40 bg-zinc-950/40">
              <p className="text-xs">No media bookmarks saved yet.</p>
              <button
                onClick={onOpenAddLink}
                className="mt-3 px-4 py-2 rounded-full bg-[#E2E4E8] text-black font-bold text-xs hover:bg-[#FF2A3A] hover:text-white transition-all"
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
