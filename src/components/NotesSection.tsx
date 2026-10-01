import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Plus, Search, Pin, Trash2, Check, X, ArrowLeft, Share2,
  Bold, Italic, Underline, Heading2, List, ListOrdered, Quote, ChevronDown
} from 'lucide-react';
import { NoteItem } from '../types';
import * as api from '../lib/api';

interface NotesSectionProps {
  notes: NoteItem[];
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  selectedNoteToEdit: NoteItem | null;
  setSelectedNoteToEdit: React.Dispatch<React.SetStateAction<NoteItem | null>>;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  setNotes,
  selectedNoteToEdit,
  setSelectedNoteToEdit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCategory, setEditorCategory] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving…' | 'Saved locally'>('Saved');
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (selectedNoteToEdit) {
      openEditor(selectedNoteToEdit);
      setSelectedNoteToEdit(null);
    }
  }, [selectedNoteToEdit]);

  const openEditor = (note: NoteItem) => {
    setActiveNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorCategory(note.category || '');
    setIsPinned(note.isPinned || false);
    setSaveStatus('Saved');
  };

  const saveNote = useCallback(async (updates: Partial<NoteItem>, noteId: string) => {
    setSaveStatus('Saving…');
    
    let updatedNote: NoteItem | null = null;
    
    setNotes((prev) => {
      return prev.map((n) => {
        if (n.id === noteId) {
          updatedNote = { ...n, ...updates, updatedAt: new Date().toISOString() };
          return updatedNote;
        }
        return n;
      });
    });

    setActiveNote((prev) => prev && prev.id === noteId ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev);

    try {
      await api.updateNote(noteId, updates);
      setSaveStatus('Saved');
    } catch {
      setSaveStatus('Saved locally');
    }
  }, [setNotes]);

  const createNewNote = async () => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      category: '',
      colorTag: '#ffffff',
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    openEditor(newNote);
    try { await api.createNote(newNote); } catch (e) { console.warn(e); }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNote(null);
    try { await api.deleteNote(id); } catch (e) { console.warn(e); }
  };

  const togglePin = async (note: NoteItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updates = { isPinned: !note.isPinned };
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, ...updates } : n));
    if (activeNote?.id === note.id) setIsPinned(!note.isPinned);
    try { await api.updateNote(note.id, updates); } catch (e) { console.warn(e); }
  };

  // Toolbar actions for textarea
  const insertFormat = (before: string, after = '') => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const newText = ta.value.substring(0, start) + before + selected + after + ta.value.substring(end);
    setEditorContent(newText);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' ||
      (selectedCategory === 'Pinned' ? n.isPinned : n.category === selectedCategory);
    return matchesSearch && matchesCat;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const userCategories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));
  const categories = ['All', 'Pinned', ...userCategories];

  const wordsCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordsCount / 200));

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ── EDITOR VIEW ──
  if (activeNote) {
    return (
      <div className="space-y-4 pb-24 md:pb-12" id="note-editor">
        {/* Editor header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">{saveStatus}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Notes</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Pin toggle */}
            <button
              onClick={() => {
                const updates = { isPinned: !isPinned };
                setIsPinned(!isPinned);
                setNotes((prev) => prev.map((n) => n.id === activeNote.id ? { ...n, ...updates } : n));
                setActiveNote((p) => p ? { ...p, ...updates } : p);
                api.updateNote(activeNote.id, updates).catch(console.warn);
              }}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isPinned
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-white' : ''}`} />
            </button>
            {/* Delete */}
            <button
              onClick={() => deleteNote(activeNote.id)}
              className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 cursor-pointer transition-all"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {/* Share */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${editorTitle}\n\n${editorContent}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sidebar */}
          <div className="hidden lg:flex lg:col-span-3 figma-glass-card p-5 flex-col gap-5">
            <button
              onClick={() => setActiveNote(null)}
              className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All notes</span>
            </button>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">NOTE DETAILS</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Words</span>
                  <span className="font-bold text-white">{wordsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Read time</span>
                  <span className="font-bold text-white">{readTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Last edited</span>
                  <span className="font-bold text-white">{relativeTime(activeNote.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">TOPIC</div>
              <input
                type="text"
                value={editorCategory}
                onChange={(e) => {
                  setEditorCategory(e.target.value);
                  if (activeNote) saveNote({ category: e.target.value }, activeNote.id);
                }}
                placeholder="e.g. Biology, Physics…"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>

            <div className="border-t border-white/10 pt-4 mt-auto">
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete note</span>
              </button>
            </div>
          </div>

          {/* Editor area */}
          <div className="lg:col-span-9 figma-glass-card p-5 sm:p-6 flex flex-col min-h-[65vh]">
            {/* Mobile back + delete */}
            <div className="lg:hidden flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <button
                onClick={() => setActiveNote(null)}
                className="flex items-center gap-2 text-xs font-bold text-white/60 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Formatting toolbar */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-0.5">
                {[
                  { icon: Bold, action: () => insertFormat('**', '**'), title: 'Bold' },
                  { icon: Italic, action: () => insertFormat('_', '_'), title: 'Italic' },
                  { icon: Underline, action: () => insertFormat('<u>', '</u>'), title: 'Underline' },
                ].map(({ icon: Icon, action, title }) => (
                  <button
                    key={title}
                    onMouseDown={(e) => { e.preventDefault(); action(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-colors"
                    title={title}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
                <div className="w-px h-4 bg-white/15 mx-1" />
                {[
                  { icon: Heading2, action: () => insertFormat('\n## ', ''), title: 'Heading' },
                  { icon: List, action: () => insertFormat('\n• ', ''), title: 'Bullet' },
                  { icon: ListOrdered, action: () => insertFormat('\n1. ', ''), title: 'Numbered' },
                  { icon: Quote, action: () => insertFormat('\n> ', ''), title: 'Quote' },
                ].map(({ icon: Icon, action, title }) => (
                  <button
                    key={title}
                    onMouseDown={(e) => { e.preventDefault(); action(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-colors"
                    title={title}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-white/30 font-medium">{saveStatus}</span>
            </div>

            {/* Mobile topic */}
            <div className="lg:hidden mb-4">
              <input
                type="text"
                value={editorCategory}
                onChange={(e) => {
                  setEditorCategory(e.target.value);
                  if (activeNote) saveNote({ category: e.target.value }, activeNote.id);
                }}
                placeholder="Topic (e.g. Biology)…"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Title */}
            <input
              type="text"
              value={editorTitle}
              onChange={(e) => {
                setEditorTitle(e.target.value);
                if (activeNote) saveNote({ title: e.target.value }, activeNote.id);
              }}
              placeholder="Note title…"
              className="w-full bg-transparent text-2xl sm:text-3xl font-black text-white focus:outline-none placeholder-white/20 mb-3"
            />

            {/* Content */}
            <textarea
              ref={contentRef}
              value={editorContent}
              onChange={(e) => {
                setEditorContent(e.target.value);
                if (activeNote) saveNote({ content: e.target.value }, activeNote.id);
              }}
              placeholder="Start writing…"
              className="flex-1 w-full bg-transparent text-sm sm:text-base text-white/85 focus:outline-none placeholder-white/20 resize-none font-normal leading-relaxed"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── NOTES LIST VIEW ──
  return (
    <div className="space-y-5 pb-24 md:pb-12" id="notes-library">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Notes</h1>
        </div>
        <button
          onClick={createNewNote}
          className="figma-btn-dark px-5 py-2.5 flex items-center gap-2 cursor-pointer active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New note</span>
        </button>
      </div>

      <div className="figma-glass-card p-4 sm:p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const count =
              cat === 'All' ? notes.length
              : cat === 'Pinned' ? notes.filter((n) => n.isPinned).length
              : notes.filter((n) => n.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`figma-chip flex-shrink-0 ${isActive ? 'figma-chip-active' : 'figma-chip-inactive'}`}
              >
                <span>{cat === 'All' ? 'All notes' : cat}</span>
                <span className={isActive ? 'text-white font-bold' : 'text-white/40'}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* List header */}
        <div className="flex items-center justify-between text-xs text-white/50 border-b border-white/10 pb-3">
          <span>{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
          >
            <span>{sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOrder === 'oldest' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Note rows */}
        <div className="space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 text-center">
              <FileText className="w-10 h-10 text-white/15" />
              <p className="text-sm text-white/30">
                {searchQuery ? 'No notes match your search' : 'No notes yet. Create your first one!'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => openEditor(note)}
                  className="figma-note-row flex items-stretch cursor-pointer group"
                >
                  {/* Color accent bar */}
                  <div
                    className="w-1.5 flex-shrink-0 rounded-l-md"
                    style={{ backgroundColor: note.colorTag || 'rgba(255,255,255,0.2)' }}
                  />

                  <div className="flex-1 px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-white line-clamp-1 flex items-center gap-1.5">
                        {note.isPinned && <Pin className="w-3 h-3 text-white/60 fill-white/60 flex-shrink-0" />}
                        {note.title || 'Untitled Note'}
                      </div>
                      <span className="text-[10px] text-white/35 flex-shrink-0">{relativeTime(note.updatedAt)}</span>
                    </div>

                    <p className="text-xs text-white/50 line-clamp-1">
                      {note.content.replace(/<[^>]+>/g, '') || 'No content yet'}
                    </p>

                    <div className="flex items-center justify-between mt-0.5">
                      {note.category ? (
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">
                          {note.category}
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/20">No topic</span>
                      )}

                      {/* Action buttons — always visible on mobile, hover on desktop */}
                      <div
                        className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => togglePin(note, e)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            note.isPinned
                              ? 'text-white bg-white/15'
                              : 'text-white/30 hover:text-white hover:bg-white/10'
                          }`}
                          title={note.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-white' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
