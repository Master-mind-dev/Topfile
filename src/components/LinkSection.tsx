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
  Tv, 
  Film,
  AlertCircle,
  RefreshCw
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
  const [searchQuery, setSearchQuery] = useState('');
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
        }
      } catch (e) {
        console.error('URL parsing error', e);
      }
      const newItem: LinkItem = {
        id: `link-${Date.now()}`,
        url: trimmedUrl,
        title: 'Bookmarked Link',
        description: '',
        embedThumb: '',
        linkHost: host,
        embedProvider: provider,
        embedId: embedId,
        isPlayable: isPlayable,
        createdAt: new Date().toISOString(),
      };
      setLinks((prev) => [newItem, ...prev]);
      setUrlInput('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const filteredLinks = links.filter((l) => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ownly-links space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-violet-500" />
          Saved Links
        </h2>
      </div>

      <form onSubmit={handleParseAndAdd} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <LinkIcon className="w-4 h-4 text-zinc-500 group-focus-within:text-violet-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Paste URL (YouTube, Web, etc...)" 
          className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-11 pr-24 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={isParsing}
          className="absolute right-2 top-2 bottom-2 px-4 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {isParsing ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Add'}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.map((link) => (
          <div key={link.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-white/10 rounded-lg">
                {link.isPlayable ? <Play className="w-4 h-4 text-violet-400" /> : <ExternalLink className="w-4 h-4 text-zinc-400" />}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(link.url);
                    setCopiedId(link.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-all text-zinc-500 hover:text-white"
                >
                  {copiedId === link.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
                <button 
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-1.5 hover:bg-red-500/20 rounded-md transition-all text-zinc-500 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-white line-clamp-1 group-hover:text-violet-400 transition-colors">{link.title}</div>
              <div className="text-[10px] text-zinc-500 line-clamp-1">{link.url}</div>
            </div>
            {link.isPlayable && (
              <button 
                onClick={() => setActivePlayItem(link)}
                className="mt-3 w-full py-2 bg-violet-500/20 text-violet-400 rounded-lg text-[10px] font-bold hover:bg-violet-500/30 transition-all flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3" />
                Play Now
              </button>
            )}
          </div>
        ))}
      </div>

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
                <button onClick={() => setActivePlayItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white/10">
                {activePlayItem.embedProvider === 'youtube' ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${activePlayItem.embedId}`} 
                    className="w-full h-full" 
                    allowFullScreen 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
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
