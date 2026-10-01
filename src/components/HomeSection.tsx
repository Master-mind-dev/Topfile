import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  UploadCloud, 
  Camera, 
  Link as LinkIcon, 
  Plus, 
  Search,
  ChevronRight,
  Image as ImageIcon,
  Youtube,
  Globe,
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
  const totalUploads = images.filter((img) => img.source === 'upload').length;
  const totalScans = images.filter((img) => img.source === 'camera').length;
  const totalLinks = links.length;

  const firstName = user.name ? user.name.split(' ')[0] : 'there';
  const greeting = getGreeting();

  // Weekly activity: count items created in the last 7 days per day of week
  const weeklyActivity = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    const week = 7 * 86400000;
    [...notes, ...images, ...links].forEach((item) => {
      const created = new Date((item as any).createdAt).getTime();
      if (now - created <= week) {
        const dayIndex = new Date((item as any).createdAt).getDay();
        counts[dayIndex]++;
      }
    });
    const max = Math.max(...counts, 1);
    return days.map((day, i) => ({ day, count: counts[i], pct: Math.round((counts[i] / max) * 100) }));
  }, [notes, images, links]);

  const weeklyTotal = weeklyActivity.reduce((s, d) => s + d.count, 0);

  // Filter notes based on quick search
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-dashboard-view">
      {/* ── Greeting Header ── */}
      <div className="pt-2 md:pt-4">
        <p className="text-xs md:text-sm font-semibold text-white/60 tracking-tight mb-1">
          {greeting}
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
          Welcome back{firstName !== 'there' ? `, ${firstName}` : ''} <span className="text-xl sm:text-2xl">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-white/50 mt-1 font-normal">
          Here's a summary of your OWNLY workspace
        </p>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Notes */}
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
            </div>
          </div>
        </div>

        {/* Uploads */}
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
            </div>
          </div>
        </div>

        {/* Scans */}
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
            </div>
          </div>
        </div>

        {/* Links */}
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
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column: Recent Notes ── */}
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

            {/* Search */}
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

            {/* Note list */}
            <div className="space-y-2.5">
              {filteredNotes.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-xs">
                  No notes yet. Create your first note!
                </div>
              ) : (
                filteredNotes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      if (onOpenNote) onOpenNote(note);
                      else setActiveTab('notes');
                    }}
                    className="figma-note-row flex items-stretch cursor-pointer group"
                  >
                    <div
                      className="w-1.5 flex-shrink-0 rounded-l-md"
                      style={{ backgroundColor: note.colorTag || '#ffffff33' }}
                    />
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs sm:text-sm text-white line-clamp-1">
                          {note.title}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-[11px] sm:text-xs text-white/60 line-clamp-1 mt-0.5 font-normal">
                        {note.content.replace(/<[^>]+>/g, '') || 'No content yet'}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-white/40">
                          {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {note.category && (
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${note.colorTag || '#fff'}22`,
                              color: note.colorTag || '#fff',
                            }}
                          >
                            {note.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('notes')}
            className="mt-4 w-full py-2.5 bg-white/5 hover:bg-white/12 border border-white/10 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-white/20 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* ── Middle Column: Recent Uploads + Saved Links ── */}
        <div className="lg:col-span-3 space-y-5 flex flex-col">
          {/* Recent Uploads */}
          <div className="figma-glass-card p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Uploads</h2>
                <button onClick={() => setActiveTab('upload')} className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {images.length === 0 ? (
                  <div className="py-4 text-center text-white/30 text-xs">No uploads yet</div>
                ) : (
                  images.slice(0, 3).map((img) => (
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
                        <div className="text-[10px] text-white/40">{img.fileSize || 'File'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Saved Links */}
          <div className="figma-glass-card p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Links</h2>
                <button onClick={() => setActiveTab('links')} className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {links.length === 0 ? (
                  <div className="py-4 text-center text-white/30 text-xs">No links saved yet</div>
                ) : (
                  links.slice(0, 3).map((link) => (
                    <div
                      key={link.id}
                      onClick={() => window.open(link.url, '_blank')}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        {link.embedProvider === 'youtube' ? (
                          <Youtube className="w-4 h-4 text-red-400" />
                        ) : (
                          <Globe className="w-4 h-4 text-white/70" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{link.title}</div>
                        <div className="text-[10px] text-white/40 truncate">{link.linkHost || 'web'}</div>
                      </div>
                    </div>
                  ))
                )}
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

        {/* ── Right Column: Weekly Activity ── */}
        <div className="lg:col-span-3">
          <div className="figma-glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-white tracking-tight">Weekly Activity</h2>
              {weeklyTotal > 0 && (
                <span className="text-[10px] text-white/50">{weeklyTotal} items</span>
              )}
            </div>
            <div className="flex items-end justify-between gap-2 h-28 px-1">
              {weeklyActivity.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <motion.div
                    className="w-full rounded-t-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(bar.pct, bar.count > 0 ? 8 : 3)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                    style={{
                      backgroundColor: bar.count > 0 ? '#ffffff' : 'rgba(255,255,255,0.1)',
                    }}
                  />
                  <span className="text-[10px] text-white/35 font-medium">{bar.day}</span>
                </div>
              ))}
            </div>
            {weeklyTotal === 0 ? (
              <p className="text-[11px] text-white/25 text-center mt-3">
                No activity this week
              </p>
            ) : (
              <p className="text-[11px] text-white/40 text-center mt-3">
                {weeklyTotal} item{weeklyTotal !== 1 ? 's' : ''} added this week
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
