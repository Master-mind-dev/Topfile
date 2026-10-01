import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  X, 
  ArrowLeft,
  Share2,
  Bold,
  Italic,
  Underline,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown
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

  // Editor fields
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCategory, setEditorCategory] = useState('');
  const [editorColor, setEditorColor] = useState('#ffffff');
  const [isPinned, setIsPinned] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [copied, setCopied] = useState(false);

  // Handle outside edit request
  useEffect(() => {
    if (selectedNoteToEdit) {
      openEditor(selectedNoteToEdit);
      setSelectedNoteToEdit(null);
    }
  }, [selectedNoteToEdit, setSelectedNoteToEdit]);

  const openEditor = (note: NoteItem) => {
    setActiveNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorCategory(note.category || '');
    setEditorColor(note.colorTag || '#ffffff');
    setIsPinned(note.isPinned || false);
    setSaveStatus('Saved');
  };

  const createNewNote = () => {
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
    api.createNote(newNote).catch(console.warn);
  };

  const saveActiveNote = async (updates: Partial<NoteItem>) => {
    if (!activeNote) return;
    setSaveStatus('Saving…');
    const updated = { ...activeNote, ...updates, updatedAt: new Date().toISOString() };
    setActiveNote(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));

    try {
      await api.updateNote(updated.id, updates);
      setSaveStatus('Saved just now');
    } catch {
      setSaveStatus('Saved locally');
    }
  };

  const deleteActiveNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNote(null);
    try {
      await api.deleteNote(id);
    } catch (e) {
      console.warn(e);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' ||
      (selectedCategory === 'Pinned' ? n.isPinned : n.category === selectedCategory);
    return matchesSearch && matchesCat;
  });

  // Dynamic categories built from actual user notes
  const userCategories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));
  const categories = ['All', 'Pinned', ...userCategories];

  // Word count & read time calculation
  const wordsCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordsCount / 200));

  // ════════════════════════════════════════════════════════════════
  // 1. NOTE EDITOR VIEW (Figma: "Desktop note editor" & "Mobile note editor")
  // ════════════════════════════════════════════════════════════════
  if (activeNote) {
    return (
      <div className="space-y-6 pb-20 md:pb-12" id="figma-note-editor-screen">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
              {saveStatus}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Notes</h1>
            <p className="text-xs sm:text-sm text-white/60 font-normal">
              Editing <span className="font-semibold text-white">{editorTitle || 'Untitled'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${editorTitle}\n\n${editorContent}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share note'}</span>
            </button>
          </div>
        </div>

        {/* Editor Workspace: Outline (Desktop Left 320px) + Editor Area (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Outline Sidebar (Hidden on small screens) */}
          <div className="hidden lg:block lg:col-span-4 figma-glass-card p-6 space-y-6">
            <button
              onClick={() => setActiveNote(null)}
              className="flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All notes</span>
            </button>

            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white/60">
                <FileText className="w-3.5 h-3.5" />
                <span>{editorCategory ? `${editorCategory.toUpperCase()} NOTE` : 'UNTITLED NOTE'}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">{editorTitle || 'Untitled Note'}</h2>
            </div>

            {/* Note details */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                NOTE DETAILS
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Words</span>
                <span className="font-bold text-white">{wordsCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Reading time</span>
                <span className="font-bold text-white">{readTime} min</span>
              </div>
            </div>

            {/* Subject / Topic assignment — user types their own topic */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
                TOPIC
              </div>
              <input
                type="text"
                value={editorCategory}
                onChange={(e) => {
                  setEditorCategory(e.target.value);
                  saveActiveNote({ category: e.target.value });
                }}
                placeholder="e.g. Biology, History…"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
              />
              <p className="text-[10px] text-white/30 mt-1.5">Assign any topic name you like</p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => deleteActiveNote(activeNote.id)}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete note</span>
              </button>
            </div>
          </div>

          {/* Main Note Content Area (Figma Document Body) */}
          <div className="lg:col-span-8 figma-glass-card p-6 flex flex-col justify-between min-h-[600px]">
            <div>
              {/* Back to list button for mobile */}
              <div className="lg:hidden flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <button
                  onClick={() => setActiveNote(null)}
                  className="flex items-center gap-2 text-xs font-bold text-white/70 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to notes</span>
                </button>
                <button
                  onClick={() => deleteActiveNote(activeNote.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Formatting Toolbar (Figma Toolbar) */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Bold">
                    <Bold className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Italic">
                    <Italic className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Underline">
                    <Underline className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-white/15 mx-1" />
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Heading">
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Bullet list">
                    <List className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Numbered list">
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Quote">
                    <Quote className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[11px] font-semibold text-white/40">{saveStatus}</div>
              </div>

              {/* Note Title Input */}
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => {
                  setEditorTitle(e.target.value);
                  saveActiveNote({ title: e.target.value });
                }}
                placeholder="Note title…"
                className="w-full bg-transparent text-xl sm:text-2xl font-black text-white focus:outline-none placeholder-white/30 mb-4"
              />

              {/* Note Content Textarea */}
              <textarea
                value={editorContent}
                onChange={(e) => {
                  setEditorContent(e.target.value);
                  saveActiveNote({ content: e.target.value });
                }}
                placeholder="Start writing your thoughts, notes, and study guides…"
                className="w-full h-[400px] bg-transparent text-sm sm:text-base text-white/90 focus:outline-none placeholder-white/30 resize-none font-normal leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // 2. NOTES LIBRARY VIEW (Figma: "Desktop notes library" & "Mobile notes library")
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-20 md:pb-12" id="figma-notes-library-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
            Workspace Vault
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Notes</h1>
          <p className="text-xs sm:text-sm text-white/60 font-normal">
            Write, organize, and revisit everything you are learning.
          </p>
        </div>

        <button
          onClick={createNewNote}
          className="figma-btn-dark px-5 py-2.5 flex items-center gap-2 cursor-pointer shadow-lg hover:border-white/40 active:scale-95 text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New note</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="figma-glass-card p-5 sm:p-7 space-y-6">
        {/* Search Field (Figma Search Input: 770x42) */}
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes, subjects, or keywords…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-14 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
            ⌘ K
          </span>
        </div>

        {/* Filter Chips (Figma filter bar: All notes, Pinned, Biology, History, etc.) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const count =
              cat === 'All'
                ? notes.length
                : cat === 'Pinned'
                ? notes.filter((n) => n.isPinned).length
                : notes.filter((n) => n.category === cat).length;
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`figma-chip flex-shrink-0 ${isActive ? 'figma-chip-active' : 'figma-chip-inactive'}`}
              >
                <span>{cat === 'All' ? 'All notes' : cat}</span>
                <span className={isActive ? 'text-[#1bd9ff] font-bold' : 'text-white/40 font-normal'}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notes List Header */}
        <div className="flex items-center justify-between text-xs font-semibold text-white/60 border-b border-white/10 pb-3">
          <span>{filteredNotes.length} notes</span>
          <div className="flex items-center gap-1 text-white/40 text-[11px]">
            <span>Last edited</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Notes List (Figma Note Item rows) */}
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-sm">
              No notes found. Click "New note" to create one.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const accentColor = note.colorTag || 'rgba(255,255,255,0.4)';

              return (
                <div
                  key={note.id}
                  onClick={() => openEditor(note)}
                  className="figma-note-row flex items-stretch cursor-pointer group"
                >
                  {/* Left Color Accent Rectangle */}
                  <div
                    className="w-1.5 flex-shrink-0 rounded-l-md"
                    style={{ backgroundColor: note.colorTag || accentColor }}
                  />

                  <div className="flex-1 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white group-hover:text-white line-clamp-1 flex items-center gap-2">
                        <span>{note.title || 'Untitled Note'}</span>
                        {note.isPinned && <Pin className="w-3 h-3 text-[#1bd9ff] fill-[#1bd9ff]" />}
                      </div>
                      <span className="text-[10px] text-white/40 flex-shrink-0 ml-2">
                        {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-white/60 line-clamp-1 mt-1 font-normal">
                      {note.content.replace(/<[^>]+>/g, '') || 'No content written yet'}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="text-[10px] text-white/40">
                        Edited {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                      <span
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${note.colorTag || accentColor}25`,
                          color: note.colorTag || accentColor,
                        }}
                      >
                        {note.category || 'General'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
