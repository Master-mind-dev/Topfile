import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link as LinkIcon, 
  Play, 
  ExternalLink, 
  Trash2, 
  Search,
  SlidersHorizontal,
  Plus,
  Globe,
  Youtube,
  List,
  Grid2X2,
  ChevronDown
} from 'lucide-react';
import { LinkItem } from '../types';
import * as api from '../lib/api';

interface LinkSectionProps {
  links: LinkItem[];
  setLinks: React.Dispatch<React.SetStateAction<LinkItem[]>>;
}

export const LinkSection: React.FC<LinkSectionProps> = ({
  links,
  setLinks,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All links');
  const [isParsing, setIsParsing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    let trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }

    setIsParsing(true);
    let title = 'Bookmarked Reference';
    let host = 'web';
    let isYoutube = false;
    let embedThumb = '';

    let embedId = null;

    try {
      const parsed = new URL(trimmed);
      host = parsed.hostname.replace(/^www\./, '');
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        isYoutube = true;
        title = 'YouTube Video';
        if (host.includes('youtu.be')) {
          embedId = parsed.pathname.slice(1);
        } else {
          embedId = parsed.searchParams.get('v');
        }
        if (embedId) {
          embedThumb = `https://img.youtube.com/vi/${embedId}/mqdefault.jpg`;
        }
      } else if (host.includes('khanacademy.org')) {
        title = 'Khan Academy Resource';
      } else if (host.includes('wikipedia.org')) {
        title = 'Wikipedia Reference';
      } else {
        title = host.charAt(0).toUpperCase() + host.slice(1);
      }
    } catch {}

    const newItem: LinkItem = {
      id: `link-${Date.now()}`,
      url: trimmed,
      title: title,
      topic: topicInput.trim() || undefined,
      description: '',
      embedThumb: embedThumb,
      linkHost: host,
      embedProvider: isYoutube ? 'youtube' : 'generic',
      embedId: embedId,
      isPlayable: isYoutube,
      createdAt: new Date().toISOString(),
    };

    setLinks((prev) => [newItem, ...prev]);
    setUrlInput('');
    setTopicInput('');
    setIsParsing(false);

    try {
      const created = await api.createLink(newItem);
      setLinks((prev) => prev.map((l) => l.id === newItem.id ? created : l));
    } catch (err) {
      console.warn('Sync link failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.deleteLink(id);
    } catch (e) {
      console.warn(e);
    }
  };

  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-saved-links-screen">
      {/* ── Header (Exact Figma Desktop Saved Links) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
            Reading list
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Links</h1>
          <p className="text-xs sm:text-sm text-white/60 font-normal">
            Save useful webpages, videos, and references for later.
          </p>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('figma-link-url-input');
            el?.focus();
          }}
          className="figma-btn-dark px-5 py-2.5 flex items-center gap-2 cursor-pointer shadow-lg hover:border-white/40 active:scale-95 text-xs sm:text-sm"
        >
          <LinkIcon className="w-4 h-4 text-white" />
          <span>Add link</span>
        </button>
      </div>

      {/* ── Main Workspace: Saved links library (Left 65%) + Sidebar (Right 35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Saved Links Library */}
        <div className="lg:col-span-8 figma-glass-card p-5 sm:p-7 space-y-5">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search titles, domains, or topics…"
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
              <span className="hidden sm:inline">Newest</span>
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All links', 'Articles', 'Videos', 'References'].map((f) => {
              const count =
                f === 'All links'
                  ? links.length
                  : f === 'Videos'
                  ? links.filter((l) => l.embedProvider === 'youtube').length
                  : f === 'Articles'
                  ? Math.max(1, Math.floor(links.length * 0.5))
                  : Math.max(1, Math.floor(links.length * 0.3));

              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`figma-chip flex-shrink-0 ${
                    activeFilter === f ? 'figma-chip-active' : 'figma-chip-inactive'
                  }`}
                >
                  <span>{f}</span>
                  <span className={activeFilter === f ? 'text-[#1bd9ff] font-bold' : 'text-white/40 font-normal'}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List Header */}
          <div className="flex items-center justify-between text-xs font-semibold text-white/60 border-b border-white/10 pb-3">
            <span>{filteredLinks.length} saved links</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Saved Link Items */}
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3"}>
            {filteredLinks.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm">
                No links saved yet. Paste a link on the right to start building your reading list.
              </div>
            ) : (
              filteredLinks.map((link) => {
                const isYoutube = link.embedProvider === 'youtube' || link.url.includes('youtube');

                return (
                  <div
                    key={link.id}
                    className={`p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex ${(viewMode === 'grid' || isYoutube) ? 'flex-col gap-3' : 'items-start gap-4'} transition-all group`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                      {isYoutube ? (
                        <Youtube className="w-5 h-5 text-red-400" />
                      ) : (
                        <Globe className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-cyan-400/80 font-bold truncate">
                            {link.topic || 'General'}
                          </span>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-white hover:text-cyan-300 transition-colors truncate flex items-center gap-1.5"
                          >
                            <span>{link.title}</span>
                            <ExternalLink className="w-3 h-3 text-white/40 flex-shrink-0" />
                          </a>
                        </div>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs text-cyan-400/80 font-medium mt-0.5">
                        {link.linkHost || 'web'}
                      </div>

                      <div className="flex items-center mt-2">
                        <span className="text-[10px] text-white/35">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {(() => {
                        const isYt = link.url.includes('youtube.com') || link.url.includes('youtu.be') || link.embedProvider === 'youtube';
                        let yId = link.embedId;
                        if (isYt && !yId) {
                          try {
                            const p = new URL(link.url);
                            if (link.url.includes('youtu.be')) yId = p.pathname.slice(1);
                            else yId = p.searchParams.get('v');
                          } catch {}
                        }
                        if (isYt && yId) {
                          return (
                            <div className="mt-4 w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${yId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          );
                        }
                        if (link.embedThumb) {
                          return (
                            <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-white/10 bg-zinc-900 relative group/thumb w-full">
                              <img 
                                src={link.embedThumb} 
                                alt={link.title} 
                                className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity" 
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl">
                                  <Play className="w-6 h-6 fill-white ml-1" />
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar: Quick Add Link + Topics + Weekly Reading */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Add Form - no topic dropdown */}
          <form onSubmit={handleAddLink} className="figma-glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <LinkIcon className="w-4 h-4 text-[#1bd9ff]" />
              <span>Save a link</span>
            </div>

            <div className="relative">
              <Globe className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="figma-link-url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste a URL…"
                required
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Topic (e.g. Biology)…"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={isParsing || !urlInput.trim()}
              className="w-full py-2.5 bg-white text-zinc-950 font-bold rounded-full text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isParsing ? 'Saving…' : 'Save link'}</span>
            </button>
          </form>

          {/* Topic Collections - dynamic from actual links */}
          <div className="figma-glass-card p-5 space-y-3">
            <div className="text-xs font-bold text-white">Topics</div>
            <div className="space-y-2 text-xs">
              {(() => {
                const topicMap: Record<string, number> = {};
                links.forEach((l) => {
                  const topic = (l as any).topic || '';
                  if (topic) topicMap[topic] = (topicMap[topic] || 0) + 1;
                });
                const entries = Object.entries(topicMap);
                if (entries.length === 0) {
                  return (
                    <p className="text-[11px] text-white/30">
                      No topics yet. Assign topics when you save links.
                    </p>
                  );
                }
                return entries.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-white font-semibold">{name}</span>
                    <span className="text-white/40 font-medium">{count}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
