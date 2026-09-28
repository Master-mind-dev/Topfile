import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link as LinkIcon, 
  Play, 
  ExternalLink, 
  Trash2, 
  Copy, 
  Check, 
  X,
  RefreshCw,
  Search,
  Clock,
  Globe,
  Youtube
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
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayItem, setActivePlayItem] = useState<LinkItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const handleParseAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setDuplicateWarning('');
    let trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = 'https://' + trimmedUrl;
    }

    // Duplicate check BEFORE fetching
    const isDuplicate = links.some(
      (l) => l.url === trimmedUrl || l.url.replace(/\/$/, '') === trimmedUrl.replace(/\/$/, '')
    );
    if (isDuplicate) {
      setDuplicateWarning('This URL is already saved in your workspace.');
      setTimeout(() => setDuplicateWarning(''), 3000);
      return;
    }

    setIsParsing(true);
    let createdItem: LinkItem | null = null;
    try {
      const res = await fetch('/api/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.success) {
        createdItem = {
          id: `link-${Date.now()}`,
          url: data.url || trimmedUrl,
          title: data.title || 'Bookmarked Link',
          description: data.description || '',
          embedThumb: data.embedThumb || '',
          linkHost: data.linkHost || 'web',
          embedProvider: data.embedProvider || 'generic',
          embedId: data.embedId || null,
          isPlayable: data.isPlayable || false,
          createdAt: new Date().toISOString(),
        };
        setLinks((prev) => [createdItem!, ...prev]);
        setUrlInput('');
      } else {
        throw new Error(data.error || 'Failed to parse link metadata');
      }
    } catch (err: unknown) {
      // Fallback: parse URL manually client-side
      console.warn('Backend parsing fallback:', err);
      let host = 'web';
      let isPlayable = false;
      let embedId: string | null = null;
      let provider = 'generic';
      let title = 'Bookmarked Link';
      try {
        const parsed = new URL(trimmedUrl);
        host = parsed.hostname.replace(/^www\./, '');
        if (host.includes('youtube.com') || host.includes('youtu.be')) {
          provider = 'youtube';
          isPlayable = true;
          title = 'YouTube Video';
          if (host.includes('youtu.be')) {
            const parts = trimmedUrl.split('/');
            embedId = parts[parts.length - 1].split('?')[0];
          } else {
            const urlParams = new URLSearchParams(parsed.search);
            embedId = urlParams.get('v');
          }
        }
      } catch (e) {
        console.error('URL parsing error', e);
      }
      createdItem = {
        id: `link-${Date.now()}`,
        url: trimmedUrl,
        title,
        description: '',
        embedThumb: embedId ? `https://img.youtube.com/vi/${embedId}/hqdefault.jpg` : '',
        linkHost: host,
        embedProvider: provider,
        embedId: embedId,
        isPlayable: isPlayable,
        createdAt: new Date().toISOString(),
      };
      setLinks((prev) => [createdItem!, ...prev]);
      setUrlInput('');
    } finally {
      setIsParsing(false);
      if (createdItem) {
        try {
          await api.createLink(createdItem);
        } catch (err) {
          console.warn('Sync create link failed:', err);
        }
      }
    }
  };

  const handleDeleteLink = async (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.deleteLink(id);
    } catch (e) {
      console.warn('Sync delete link failed:', e);
    }
  };

  // Sort by most recently saved
  const sortedLinks = [...links].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredLinks = sortedLinks.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.linkHost.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ownly-links space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 pt-2">
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#d9ad52] uppercase font-extrabold mb-1">
            LINK LIBRARY
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Saved Links
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-white/10 text-white border border-white/20">
              {links.length} Total
            </span>
          </div>
          <p className="text-sm text-white/40 mt-1">Save YouTube videos, websites, and web links.</p>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleParseAndAdd} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Paste URL (YouTube, website, etc.)"
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#d9ad52]/60 transition-all text-white placeholder:text-white/30"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              id="input-link-url"
            />
          </div>
          <button
            type="submit"
            disabled={isParsing || !urlInput.trim()}
            className="px-6 py-3.5 bg-[#d9ad52] text-[#20140b] rounded-2xl text-sm font-bold hover:bg-[#f4dfb0] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 min-w-[90px]"
            id="btn-add-link"
          >
            {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Add Link'}
          </button>
        </div>

        {/* Warnings */}
        <AnimatePresence>
          {duplicateWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400 text-xs flex items-center gap-2"
            >
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {duplicateWarning}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Search bar */}
      {links.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search saved links..."
            className="w-full bg-zinc-950/60 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-all text-white placeholder:text-white/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* History section header */}
      {filteredLinks.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/60 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            History — sorted by most recent
          </h2>
          <span className="text-xs text-zinc-600">{filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Empty State */}
      {filteredLinks.length === 0 && (
        <div className="p-12 rounded-3xl border border-white/10 bg-zinc-950/40 text-center text-white/40">
          <LinkIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {searchQuery ? 'No links matched your search' : 'No links saved yet'}
          </h3>
          <p className="text-xs text-white/40 max-w-xs mx-auto">
            {searchQuery ? 'Try a different keyword or URL.' : 'Paste a YouTube URL or any website link above to save it here.'}
          </p>
        </div>
      )}

      {/* Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredLinks.map((link, idx) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="p-4 bg-white/4 border border-white/10 rounded-2xl hover:bg-white/7 hover:border-white/20 transition-all group relative flex flex-col gap-3"
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl" style={{ backgroundColor: link.isPlayable ? 'rgba(217,173,82,0.12)' : 'rgba(255,255,255,0.06)' }}>
                  {link.embedProvider === 'youtube' ? (
                    <Youtube className="w-4 h-4 text-[#d9ad52]" />
                  ) : link.isPlayable ? (
                    <Play className="w-4 h-4 text-[#d9ad52]" />
                  ) : (
                    <Globe className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(link.url);
                      setCopiedId(link.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-zinc-500 hover:text-white cursor-pointer"
                    title="Copy link"
                  >
                    {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-zinc-500 hover:text-white"
                    title="Open link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-zinc-500 hover:text-red-500 cursor-pointer"
                    title="Delete link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Thumbnail (YouTube) */}
              {link.embedThumb && (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black">
                  <img
                    src={link.embedThumb}
                    alt={link.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Info */}
              <div className="space-y-1 flex-1">
                <div className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#d9ad52] transition-colors leading-tight">
                  {link.title}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <Globe className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">{link.linkHost}</span>
                </div>
                <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(link.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Preview / Play in Website button */}
              <button
                type="button"
                onClick={() => setActivePlayItem(link)}
                className="w-full py-2.5 bg-[#d9ad52]/15 text-[#d9ad52] hover:bg-[#d9ad52] hover:text-[#20140b] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {link.embedProvider === 'youtube' ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Watch Video In-App
                  </>
                ) : link.isPlayable ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Play Media In-App
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    Open Website In-App
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* In-App Content / Video / Website Viewer Modal */}
      <AnimatePresence>
        {activePlayItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl">
            <motion.div
              key="video-modal"
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-zinc-950 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="min-w-0 pr-4">
                  <div className="text-[10px] text-[#d9ad52] uppercase tracking-widest font-extrabold mb-0.5 flex items-center gap-1.5">
                    {activePlayItem.embedProvider === 'youtube' ? (
                      <Youtube className="w-3 h-3 text-red-400" />
                    ) : (
                      <Globe className="w-3 h-3 text-[#d9ad52]" />
                    )}
                    {activePlayItem.linkHost}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">{activePlayItem.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={activePlayItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white flex items-center gap-1 text-xs"
                    title="Open in new browser tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setActivePlayItem(null)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full bg-black rounded-2xl overflow-hidden border border-white/10 min-h-[420px] max-h-[75vh]">
                {activePlayItem.embedProvider === 'youtube' && activePlayItem.embedId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activePlayItem.embedId}?autoplay=1&rel=0`}
                    title={activePlayItem.title}
                    className="w-full h-full min-h-[450px] border-none"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : activePlayItem.embedProvider === 'vimeo' && activePlayItem.embedId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${activePlayItem.embedId}?autoplay=1`}
                    title={activePlayItem.title}
                    className="w-full h-full min-h-[450px] border-none"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                ) : activePlayItem.embedProvider === 'dailymotion' && activePlayItem.embedId ? (
                  <iframe
                    src={`https://www.dailymotion.com/embed/video/${activePlayItem.embedId}?autoplay=1`}
                    title={activePlayItem.title}
                    className="w-full h-full min-h-[450px] border-none"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                  />
                ) : activePlayItem.embedProvider === 'native_video' ? (
                  <video
                    src={activePlayItem.url}
                    controls
                    autoPlay
                    className="w-full h-full max-h-[500px] object-contain bg-black"
                  />
                ) : (
                  <iframe
                    src={activePlayItem.url}
                    title={activePlayItem.title}
                    className="w-full h-full min-h-[480px] border-none bg-white rounded-xl"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
