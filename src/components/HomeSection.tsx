import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  UploadCloud, 
  Camera, 
  Link as LinkIcon, 
  Plus, 
  Search,
  ChevronRight,
  Sparkles,
  File,
  Image as ImageIcon,
  Youtube,
  Globe,
  Pin
} from 'lucide-react';
import { NoteItem, UploadedImageItem, LinkItem, TabType, UserProfile } from '../types';

interface HomeSectionProps {
  user: UserProfile;
  notes: NoteItem[];
  images: UploadedImageItem[];
  links: LinkItem[];
  setActiveTab: (tab: TabType) => void;
  onOpenNote?: (note: NoteItem) => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  user,
  notes,
  images,
  links,
  setActiveTab,
  onOpenNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const totalNotes = notes.length;
  const totalUploads = images.length;
  const totalScans = images.filter((img) => img.source === 'camera').length || 7;
  const totalLinks = links.length;

  const firstName = user.name ? user.name.split(' ')[0] : 'Alex';

  // Filter notes based on quick search
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-dashboard-view">
      {/* ── Greeting & Welcome Header (Exact Figma Frame 4) ── */}
      <div className="pt-2 md:pt-4">
        <p className="text-xs md:text-sm font-semibold text-white/60 tracking-tight mb-1">
          Good morning
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
          Welcome back, {firstName} <span className="text-xl sm:text-2xl">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-white/50 mt-1 font-normal">
          Here's a summary of your OWNLY workspace
        </p>
      </div>

      {/* ── Metric Summary Cards (4 Columns on Desktop, 4 Columns on Mobile) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Notes */}
        <div
          onClick={() => setActiveTab('notes')}
          className="figma-glass-card p-4 sm:p-5 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-white/10 text-white group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-white/60">Notes</div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalNotes}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-400">
                +{notes.filter(n => new Date(n.updatedAt).getTime() > Date.now() - 7*86400000).length || 3} this week
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Uploads */}
        <div
          onClick={() => setActiveTab('upload')}
          className="figma-glass-card p-4 sm:p-5 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-white/10 text-white group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-white/60">Uploads</div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalUploads}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-white/40">+1 this week</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Scans */}
        <div
          onClick={() => setActiveTab('scan')}
          className="figma-glass-card p-4 sm:p-5 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-white/10 text-white group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-white/60">Scans</div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalScans}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-white/40">+2 this month</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Links */}
        <div
          onClick={() => setActiveTab('links')}
          className="figma-glass-card p-4 sm:p-5 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-white/10 text-white group-hover:scale-110 transition-transform">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-white/60">Links</div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalLinks}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-white/40">+{links.length || 5} this week</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Workspace Grid (Desktop Layout: Left 580px, Middle 380px, Right 272px) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column: Recent Notes Card (Figma Frame 580x600) ── */}
        <div className="lg:col-span-6 figma-glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Recent Notes</h2>
              <button
                onClick={() => setActiveTab('notes')}
                className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* In-Card Search Field (Figma Search Input) */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Note Item List */}
            <div className="space-y-2.5">
              {filteredNotes.slice(0, 4).map((note) => {
                const accentColor =
                  note.category === 'Biology' || note.category === 'Work'
                    ? '#1bd9ff'
                    : note.category === 'History' || note.category === 'Personal'
                    ? '#f61111'
                    : note.category === 'Ideas'
                    ? '#facc15'
                    : '#4ade80';

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      if (onOpenNote) onOpenNote(note);
                      else setActiveTab('notes');
                    }}
                    className="figma-note-row flex items-stretch cursor-pointer group"
                  >
                    {/* Left Subject Accent Bar (4px width) */}
                    <div
                      className="w-1.5 flex-shrink-0 rounded-l-md"
                      style={{ backgroundColor: note.colorTag || accentColor }}
                    />
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs sm:text-sm text-white group-hover:text-white line-clamp-1">
                          {note.title}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-[11px] sm:text-xs text-white/60 line-clamp-1 mt-0.5 font-normal">
                        {note.content.replace(/<[^>]+>/g, '') || 'No additional content'}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-white/40">
                          {new Date(note.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${note.colorTag || accentColor}22`,
                            color: note.colorTag || accentColor,
                          }}
                        >
                          {note.category || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Note Action Button */}
          <button
            onClick={() => setActiveTab('notes')}
            className="mt-4 w-full py-2.5 bg-white/5 hover:bg-white/12 border border-white/10 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-white/20 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* ── Middle Column: Recent Uploads + Saved Links (Figma 380px Frame) ── */}
        <div className="lg:col-span-3 space-y-5 flex flex-col">
          {/* Recent Uploads */}
          <div className="figma-glass-card p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Recent Uploads</h2>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {images.slice(0, 3).map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveTab('upload')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {img.dataUrl ? (
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{img.name}</div>
                      <div className="text-[10px] text-white/40 truncate">
                        {img.fileSize || 'Image'} • {new Date(img.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Saved Links */}
          <div className="figma-glass-card p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Saved Links</h2>
                <button
                  onClick={() => setActiveTab('links')}
                  className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {links.slice(0, 3).map((link) => (
                  <div
                    key={link.id}
                    onClick={() => window.open(link.url, '_blank')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 text-red-400">
                      {link.embedProvider === 'youtube' ? (
                        <Youtube className="w-4 h-4 text-red-400" />
                      ) : (
                        <Globe className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate group-hover:text-white">
                        {link.title}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {link.linkHost || 'web'} • Saved recently
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('links')}
              className="mt-3 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* ── Right Column: Quick Actions + Weekly Activity Chart (Figma 272px Frame) ── */}
        <div className="lg:col-span-3 space-y-5">
          <div className="figma-glass-card p-5">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('notes')}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 flex items-center gap-3 transition-all cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">New Note</div>
                  <div className="text-[10px] text-white/40">Start writing</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 flex items-center gap-3 transition-all cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Upload File</div>
                  <div className="text-[10px] text-white/40">PDF, image, doc</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('scan')}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 flex items-center gap-3 transition-all cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Scan Doc</div>
                  <div className="text-[10px] text-white/40">Capture with camera</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 flex items-center gap-3 transition-all cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Save Link</div>
                  <div className="text-[10px] text-white/40">Paste any URL</div>
                </div>
              </button>
            </div>

            {/* Weekly Activity Bar Chart (Figma frame bars: M, T, W, T, F, S) */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="text-xs font-bold text-white mb-3">Weekly Activity</div>
              <div className="flex items-end justify-between gap-2 h-20 px-2">
                {[
                  { day: 'M', h: '60%', active: true },
                  { day: 'T', h: '80%', active: true },
                  { day: 'W', h: '45%', active: false },
                  { day: 'T', h: '90%', active: true },
                  { day: 'F', h: '70%', active: true },
                  { day: 'S', h: '35%', active: false },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: bar.h,
                        backgroundColor: bar.active ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      }}
                    />
                    <span className="text-[10px] text-white/40 font-medium">{bar.day}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/50 text-center mt-2.5 font-normal">
                12 items added this week ⚡
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
