import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link as LinkIcon,
  Plus,
  Play,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Search,
  X,
   Bookmark,
  RefreshCw,
  Clock,
  Film
} from 'lucide-react';
import { LinkItem } from '../types';

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
  const [searchQuery, setSearchQuery] =
    useState('');
  const [activePlayItem, setActivePlayItem] =
    useState<LinkItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Auto-save all existing links as "saved" on mount
  React.useEffect(() => {
    const newSaved = new Set<string>();
    links.forEach((l) => newSaved.add(l.id));
    setSavedIds(newSaved);
  }, [links]);

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleParseAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    let trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = 'https://' + trimmedUrl;
    }
    setIsParsing(true);
    try {
      const res = await fetch('/api/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.success) {
        const newItem: LinkItem = {
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
        const newSaved = new Set(savedIds);
        newSaved.add(newItem.id);
        setSavedIds(newSaved);
        setLinks((prev) => [newItem, ...prev]);
        setUrlInput('');
      } else {
        throw new Error(data.error || 'Failed to parse link metadata');
      }
    } catch (err: any) {
      console.warn('Backend parsing fallback:', err);
      let host = 'web';
      let isPlayable = false;
      let embedId: string | null = null;
      let provider = 'generic';
      let embedThumb = '';
      try {
        const parsed = new URL(trimmedUrl);
        host = parsed.hostname.replace(/^www\./, '');
        if (host.includes('youtube.com') || host.includes('youtu.be')) {
          provider = 'youtube';
          isPlayable = true;
          if (host.includes('youtu.be')) {
            const parts = trimmedUrl.split('/');
            embedId = parts[parts.length - 1];
          } else {
            const urlParams = new URLSearchParams(parsed.search);
            embedId = urlParams.get('v');
          }
          embedThumb = embedId
            ? `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`
            : '';
        }
      } catch (e) {
        console.error('URL parsing error', e);
      }
      const newItem: LinkItem = {
        id: `link-${Date.now()}`,
        url: trimmedUrl,
        title:
          provider === 'youtube'
            ? 'YouTube Video'
            : host === 'web'
              ? 'Bookmarked Link'
              : host,
        description: '',
        embedThumb,
        linkHost: host,
        embedProvider: provider,
        embedId: embedId,
        isPlayable: isPlayable,
        createdAt: new Date().toISOString(),
      };
      const newSaved = new Set(savedIds);
      newSaved.add(newItem.id);
      setSavedIds(newSaved);
      setLinks((prev) => [newItem, ...prev]);
      setUrlInput('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteLink = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const filteredLinks = [...links]
    .filter((l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div className="ownly-links space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#d9ad52] uppercase font-extrabold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d9ad52]" />
            WEB LINK VAULT
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#d9ad52]" />
              Saved Links
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-[#d9ad52]/12 text-[#f4dfb0] border border-[#d9ad52]/30">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {(copiedId || savedIds.size > 0) && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-white/50">
              {copiedId && <Check className="w-3 h-3 text-green-400" />}
              Saved: {savedIds.size}
            </div>
          )}
        </div>
      </div>

      {/* URL Input Bar — YouTube-style */}
      <form onSubmit={handleParseAndAdd} className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <LinkIcon className="w-4 h-4 text-zinc-500 group-focus-within:text-[#d9ad52] transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Paste YouTube, web, or video URL…"
          className="w-full bg-zinc-900 border border-white/10 rounded-3xl pl-11 pr-28 py-3 text-sm focus:outline-none focus:border-[#d9ad52]/50 transition-all text-white placeholder:text-white/40 font-medium shadow-inner"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          aria-label="Paste link URL"
          id="input-link-url"
        />
        <button
          type="submit"
          disabled={isParsing || !urlInput.trim()}
          className="absolute right-2 top-2 bottom-2 px-5 bg-[#d9ad52] text-[#20140b] rounded-2xl text-xs font-bold hover:bg-[#f4dfb0] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md"
          id="btn-add-link"
        >
          {isParsing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Plus className="w-3 h-3" />
              Save
            </>
          )}
        </button>
      </form>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#d9ad52]/10 border border-[#d9ad52]/30 text-[#d4b87c] text-xs">
          {errorMsg}
        </div>
      )}

      {/* Search */}
      {links.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved links…"
            className="w-full bg-black/70 border border-white/10 text-white placeholder:text-white/40 pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm outline-none focus:border-[#d9ad52] font-medium transition-colors"
            id="input-search-links"
          />
        </div>
      )}

      {/* YouTube-style grid of link cards */}
      {filteredLinks.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-zinc-950/40 text-center text-white/40">
          <Film className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No saved links yet</h3>
          <p className="text-xs text-white/40 max-w-xs mx-auto mb-4">
            Paste a YouTube URL or web link above and tap Save. Each link is
            bookmarked and instantly available on reload.
          </p>
          <button
            onClick={() =>
              document.getElementById('input-link-url')?.focus()
            }
            className="px-5 py-2.5 rounded-full bg-[#d9ad52] text-[#20140b] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#f4dfb0] transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Your First Link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              isSaved={savedIds.has(link.id)}
              hasCopied={copiedId === link.id}
              onToggleSave={() => handleToggleSave(link.id)}
              onCopy={() => {
                navigator.clipboard.writeText(link.url);
                setCopiedId(link.id);
                setTimeout(() => setCopiedId(null), 2000);
              }}
              onDelete={() => handleDeleteLink(link.id)}
              onPlay={() => setActivePlayItem(link)}
            />
          ))}
        </div>
      )}

      {/* YouTube-style video player modal */}
      <AnimatePresence>
        {activePlayItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/20 rounded-3xl p-4 max-w-4xl w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-bold">{activePlayItem.title}</h3>
                <button
                  onClick={() => setActivePlayItem(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white/10">
                {activePlayItem.embedProvider === 'youtube' &&
                activePlayItem.embedId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activePlayItem.embedId}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    title={activePlayItem.title}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                    <ExternalLink className="w-6 h-6 mr-2" />
                    External content cannot be embedded.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// YouTube-style link card sub-component
const LinkCard: React.FC<{
  link: LinkItem;
  isSaved: boolean;
  hasCopied: boolean;
  onToggleSave: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onPlay: () => void;
}> = ({ link, isSaved, hasCopied, onToggleSave, onCopy, onDelete, onPlay }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-zinc-950/60 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer group relative shadow-xl flex flex-col">
      {/* Thumbnail row (YouTube-style) */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {link.embedThumb && !imgError ? (
          <img
            src={link.embedThumb}
            alt={link.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <Film className="w-10 h-10 text-zinc-600" />
          </div>
        )}

        {/* Play overlay for playable links */}
        {link.isPlayable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="p-3 bg-[#d9ad52] rounded-full text-black hover:bg-[#f4dfb0] transition-colors shadow-xl"
              title="Play"
            >
              <Play className="w-5 h-5 fill-current" />
            </button>
          </div>
        )}

        {/* Bookmark save button — YouTube-style */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
            isSaved
              ? 'bg-[#d9ad52] text-black'
              : 'bg-black/30 text-white/70 hover:text-white'
          }`}
          title={isSaved ? 'Saved' : 'Save link'}
        >
          <Bookmark
            className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
          />
        </button>

        {/* Host badge */}
        {link.linkHost && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-black/50 text-white/90 border border-white/10 backdrop-blur-sm">
            {link.linkHost}
          </span>
        )}
      </div>

      {/* Content below thumbnail — Samsung One UI style */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#d9ad52] transition-colors mb-1 leading-snug">
          {link.title}
        </h3>

        <p className="text-[10px] text-white/40 line-clamp-1 mb-2">{link.url}</p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-1 text-[10px] text-white/40">
            <Clock className="w-2.5 h-2.5" />
            {new Date(link.createdAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="p-1 hover:bg-white/10 rounded-md transition-all text-zinc-400 hover:text-white"
              title="Copy link"
            >
              {hasCopied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-[#d9ad52]/20 rounded-md transition-all text-zinc-400 hover:text-[#d9ad52]"
              title="Remove link"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
