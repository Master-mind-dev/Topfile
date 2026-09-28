import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  ImageIcon, 
  Camera, 
  LinkIcon, 
  Plus, 
  ArrowUpRight, 
  Clock,
  Sparkles,
  Flame,
  Play
} from 'lucide-react';
import { NoteItem, UploadedImageItem, LinkItem, TabType, UserProfile } from '../types';

interface HomeSectionProps {
  user: UserProfile;
  notes: NoteItem[];
  images: UploadedImageItem[];
  links: LinkItem[];
  setActiveTab: (tab: TabType) => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({ user, notes, images, links, setActiveTab }) => {

  const totalNotes = notes.length;
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const recentNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);
  const recentLinks = [...links].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  const metrics = [
    { label: 'Notes Vault', value: totalNotes, detail: `${pinnedNotes.length} pinned`, tab: 'notes' as TabType, icon: FileText, color: '#d9ad52' },
    { label: 'Media Assets', value: images.length, detail: 'Gallery uploads', tab: 'upload' as TabType, icon: ImageIcon, color: '#38bdf8' },
    { label: 'Live Snaps', value: images.filter((img) => img.source === 'camera').length, detail: 'Camera captures', tab: 'scan' as TabType, icon: Camera, color: '#34d399' },
    { label: 'Links', value: links.length, detail: 'YouTube & web', tab: 'links' as TabType, icon: LinkIcon, color: '#a78bfa' },
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
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 pt-2">
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#d9ad52] uppercase font-extrabold mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d9ad52] animate-pulse" />
            WORKSPACE ENGINE ACTIVE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="text-[#d9ad52]">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">Your private workspace is ready.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('notes')}
            className="journey-action bg-[#d9ad52] text-[#20140b] px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-[#f4dfb0] active:scale-95 transition-all duration-200 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className="journey-action border border-white/20 bg-white/5 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-[#d9ad52] hover:text-[#20140b] hover:border-[#d9ad52] active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
          >
            <Camera className="w-4 h-4" />
            Live Scan
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.06 }}
            onClick={() => setActiveTab(metric.tab)}
            className="p-4 sm:p-5 bg-white/4 border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/8 transition-all cursor-pointer group hover:-translate-y-1 duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="p-2 rounded-xl transition-colors"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white/60 transition-colors" />
            </div>
            <div className="text-2xl font-extrabold text-white mb-0.5">{metric.value}</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{metric.label}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">{metric.detail}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Notes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d9ad52]" />
              Recent Notes
            </h2>
            <button
              onClick={() => setActiveTab('notes')}
              className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recentNotes.length === 0 && (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-zinc-500 text-sm">
                No notes yet. Start capturing your thoughts!
              </div>
            )}
            {recentNotes.map((note, idx) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveTab('notes')}
                className="p-4 bg-white/4 border border-white/8 rounded-2xl flex items-center justify-between hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer group"
                style={{ borderLeftWidth: '3px', borderLeftColor: note.colorTag }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#d9ad52] transition-colors truncate">{note.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 bg-white/5 rounded">{note.category}</span>
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Access */}
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-[#d9ad52]" />
              Quick Access
            </h2>
            <div className="p-3 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-1">
              {[
                { label: 'All Notes', icon: FileText, tab: 'notes' as TabType },
                { label: 'Media Gallery', icon: ImageIcon, tab: 'upload' as TabType },
                { label: 'Camera Capture', icon: Camera, tab: 'scan' as TabType },
                { label: 'Saved Links', icon: LinkIcon, tab: 'links' as TabType },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-zinc-400 group-hover:text-[#d9ad52] transition-colors" />
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-white/60 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Links */}
          {recentLinks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold flex items-center gap-2 text-white/80">
                  <LinkIcon className="w-3.5 h-3.5 text-[#a78bfa]" />
                  Recent Links
                </h2>
                <button
                  onClick={() => setActiveTab('links')}
                  className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {recentLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-3 bg-white/4 border border-white/8 rounded-xl group hover:bg-white/8 transition-all cursor-pointer"
                    onClick={() => setActiveTab('links')}
                  >
                    <div className="flex items-center gap-2">
                      {link.isPlayable ? (
                        <Play className="w-3 h-3 text-[#a78bfa] flex-shrink-0" />
                      ) : (
                        <LinkIcon className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                      )}
                      <p className="text-xs font-semibold text-white/80 truncate group-hover:text-white transition-colors">{link.title}</p>
                    </div>
                    <p className="text-[10px] text-zinc-600 truncate mt-0.5 pl-5">{link.linkHost}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
