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
  Sparkles, 
  Search, 
  X, 
  Tv, 
  Film,
  AlertCircle
} from 'lucide-react';
import { LinkItem } from '../types';

interface LinkSectionProps {
  links: LinkItem[];
  onAddLink: (link: LinkItem) => void;
  onDeleteLink: (id: string) => void;
}

export const LinkSection: React.FC<LinkSectionProps> = ({
  links,
  onAddLink,
  onDeleteLink,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Video player modal
  const [activePlayItem, setActivePlayItem] = useState<LinkItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

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

        onAddLink(newItem);
        setUrlInput('');
      } else {
        throw new Error(data.error || 'Failed to parse link metadata');
      }
    } catch (err: any) {
      console.warn('Backend parsing error, creating client parsed fallback:', err);
      // Client fallback parsing
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
            embedId = parsed.pathname.slice(1);
          } else if (parsed.searchParams.get('v')) {
            embedId = parsed.searchParams.get('v');
          } else if (parsed.pathname.startsWith('/shorts/')) {
            embedId = parsed.pathname.split('/')[2];
          }
          if (embedId) {
            embedThumb = `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`;
          }
        }
      } catch (e) {}

      const fallbackItem: LinkItem = {
        id: `link-${Date.now()}`,
        url: trimmedUrl,
        title: embedId ? `${provider.toUpperCase()} Video Link` : host,
        description: 'Saved link bookmark in workspace',
        embedThumb: embedThumb,
        linkHost: host,
        embedProvider: provider,
        embedId: embedId,
        isPlayable: isPlayable,
        createdAt: new Date().toISOString(),
      };

      onAddLink(fallbackItem);
      setUrlInput('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyLink = (item: LinkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.linkHost.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-16"
      id="links-exclusive-view"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold mb-1">
            INTELLIGENT MEDIA DISPATCH
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Media & Video Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
              {links.length} Links
            </span>
          </div>
        </div>
      </div>

      {/* URL Parser Input Card - High Density Style */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/20 shadow-2xl">
        <form onSubmit={handleParseAndAdd} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste any YouTube URL, video stream, or website link..."
              required
              className="w-full bg-black/70 text-white font-medium placeholder:text-white/40 pl-11 pr-4 py-3 rounded-2xl outline-none border border-white/15 focus:border-white text-xs sm:text-sm transition-colors"
              id="input-paste-url"
            />
          </div>
          <button
            type="submit"
            disabled={isParsing}
            className="px-6 py-3 rounded-full bg-[#E2E4E8] text-zinc-950 font-bold text-xs sm:text-sm hover:bg-[#FF2A3A] hover:text-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
            id="btn-parse-link"
          >
            {isParsing ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                <span>Parsing Link...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Video / Link</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Demo Suggestions */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Try sample:</span>
          <button
            type="button"
            onClick={() => setUrlInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
            className="px-3 py-1 rounded-full bg-white/5 text-white/80 hover:bg-[#FF2A3A] hover:text-white border border-white/10 hover:border-[#FF2A3A] text-[11px] font-medium transition-all duration-200 cursor-pointer"
          >
            YouTube Video
          </button>
          <button
            type="button"
            onClick={() => setUrlInput('https://www.youtube.com/watch?v=LXb3EKWsInQ')}
            className="px-3 py-1 rounded-full bg-white/5 text-white/80 hover:bg-[#FF2A3A] hover:text-white border border-white/10 hover:border-[#FF2A3A] text-[11px] font-medium transition-all duration-200 cursor-pointer"
          >
            4K Nature Video
          </button>
          <button
            type="button"
            onClick={() => setUrlInput('https://news.ycombinator.com')}
            className="px-3 py-1 rounded-full bg-white/5 text-white/80 hover:bg-[#FF2A3A] hover:text-white border border-white/10 hover:border-[#FF2A3A] text-[11px] font-medium transition-all duration-200 cursor-pointer"
          >
            Web Article
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {links.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/20 p-2.5 rounded-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved videos and links..."
              className="w-full bg-black/60 border border-white/10 text-white placeholder:text-white/40 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm outline-none focus:border-white/40 font-medium transition-colors"
            />
          </div>
          <span className="text-xs font-semibold text-white/40 pr-2">
            {filteredLinks.length} Items
          </span>
        </div>
      )}

      {/* YouTube / Media Shelf Grid - Banner Next-to-Next Format */}
      {filteredLinks.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/10 bg-white/5 text-center text-white/40">
          <Tv className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No links added yet</h3>
          <p className="text-xs text-white/40 max-w-xs mx-auto mb-4">
            Paste a YouTube video link or website address above to generate video shelf cards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLinks.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={() => {
                if (item.isPlayable) {
                  setActivePlayItem(item);
                } else {
                  window.open(item.url, '_blank', 'noopener,noreferrer');
                }
              }}
              className="rounded-2xl bg-white/[0.03] border border-white/15 hover:border-[#FF2A3A] overflow-hidden group transition-all duration-200 cursor-pointer flex flex-col sm:flex-row shadow-lg relative"
            >
              {/* Left / Top Banner Thumbnail styled like compact YouTube banner card */}
              <div className="w-full sm:w-48 md:w-52 sm:min-w-[190px] aspect-video sm:aspect-auto bg-white/5 relative overflow-hidden flex-shrink-0">
                {item.embedThumb ? (
                  <img
                    src={item.embedThumb}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full min-h-[120px] flex flex-col items-center justify-center bg-white/5 text-white/40 gap-1.5 p-3">
                    <Film className="w-8 h-8 text-white/20" />
                    <span className="text-[10px] font-bold text-white/40 uppercase">{item.linkHost}</span>
                  </div>
                )}

                {/* Center Play Button for YouTube/Videos */}
                {item.isPlayable && (
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#E2E4E8] text-zinc-950 flex items-center justify-center group-hover:bg-[#FF2A3A] group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-xl">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Host badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/85 text-white backdrop-blur-md border border-white/10">
                  {item.linkHost}
                </div>

                {item.isPlayable && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-[#FF2A3A] text-white">
                    Video
                  </div>
                )}
              </div>

              {/* Card Meta Content Next to Thumbnail */}
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF2A3A] transition-colors line-clamp-2 mb-1 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed font-normal">
                    {item.description || item.url}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                  <span className="text-[10px] text-white/40 font-medium truncate max-w-[120px]">
                    {item.linkHost}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(item, e)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, '_blank', 'noopener,noreferrer');
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this bookmark?')) {
                          onDeleteLink(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#FF2A3A]/20 text-white/40 hover:text-[#FF2A3A] transition-colors"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Embedded Video Theater Player Modal */}
      <AnimatePresence>
        {activePlayItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-black border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              id="video-player-modal"
            >
              {/* Player Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {activePlayItem.title}
                  </h3>
                  <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
                    <span className="text-white font-bold uppercase">{activePlayItem.embedProvider}</span>
                    <span>•</span>
                    <span className="truncate">{activePlayItem.url}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(activePlayItem.url, '_blank', 'noopener,noreferrer')}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white"
                    title="Open on official website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActivePlayItem(null)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Video Player Embed Body */}
              <div className="w-full aspect-video bg-black flex items-center justify-center">
                {activePlayItem.embedProvider === 'youtube' && activePlayItem.embedId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activePlayItem.embedId}?autoplay=1&rel=0`}
                    title={activePlayItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : activePlayItem.embedProvider === 'vimeo' && activePlayItem.embedId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${activePlayItem.embedId}?autoplay=1`}
                    title={activePlayItem.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : activePlayItem.embedProvider === 'dailymotion' && activePlayItem.embedId ? (
                  <iframe
                    src={`https://www.dailymotion.com/embed/video/${activePlayItem.embedId}?autoplay=1`}
                    title={activePlayItem.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : activePlayItem.embedProvider === 'native_video' ? (
                  <video
                    src={activePlayItem.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-8 text-white/40">
                    <p className="mb-4">This link does not have an inline video stream player.</p>
                    <button
                      onClick={() => window.open(activePlayItem.url, '_blank')}
                      className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs"
                    >
                      Open Link in New Tab
                    </button>
                  </div>
                )}
              </div>

              {/* Player Footer */}
              <div className="p-4 bg-black border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                <span className="truncate max-w-md">{activePlayItem.description || activePlayItem.url}</span>
                <span className="text-white/40 font-bold uppercase">{activePlayItem.linkHost}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
