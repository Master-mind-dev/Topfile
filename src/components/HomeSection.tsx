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
  Pin,
  Sparkles,
  ExternalLink,
  Play,
  Flame
} from 'lucide-react';
import { NoteItem, UploadedImageItem, LinkItem, TabType, UserProfile } from '../types';

interface HomeSectionProps {
  user: UserProfile;
}

export const HomeSection: React.FC<HomeSectionProps> = ({ user }) => {
  // Mock data for the dashboard summary since we are simplifying
  const notes: NoteItem[] = [];
  const images: UploadedImageItem[] = [];
  const links: LinkItem[] = [];

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#FF2A3A] uppercase font-extrabold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF2A3A] animate-ping" />
            WORKSPACE ENGINE ACTIVE
          </div>
          <h1 className="ownly-home__title text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Welcome, {user.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="journey-action journey-action--primary bg-[#E2E4E8] text-zinc-950 px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-[#FF2A3A] hover:text-white active:scale-95 transition-all duration-200 cursor-pointer shadow-md">
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <button className="journey-action border border-white/20 bg-white/5 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md">
            <Camera className="w-4 h-4" />
            Live Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <metric.icon className="w-4 h-4 text-white" />
              </div>
              <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />
            </div>
            <div className="text-2xl font-extrabold text-white mb-1">{metric.value}</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{metric.label}</div>
            <div className="text-[10px] text-zinc-600 mt-1">{metric.detail}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d9ad52]" />
              Recent Activity
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recentNotes.length === 0 && (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-zinc-500 text-sm">
                No recent notes. Start capturing your thoughts!
              </div>
            )}
            {recentNotes.map((note) => (
              <div key={note.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: note.colorTag }} />
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#d9ad52] transition-colors">{note.title}</div>
                    <div className="text-[10px] text-zinc-500">{new Date(note.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Quick Access
          </h2>
          <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-all group">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white">All Notes</span>
              </div>
              <ArrowUpRight className="w-3 h-3 text-zinc-600" />
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-all group">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white">Media Gallery</span>
              </div>
              <ArrowUpRight className="w-3 h-3 text-zinc-600" />
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-all group">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white">Saved Links</span>
              </div>
              <ArrowUpRight className="w-3 h-3 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
