import React, { useState } from 'react';
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
  Clock, 
  Filter,
  Sparkles
} from 'lucide-react';
import { NoteItem } from '../types';

interface NotesSectionProps {
  notes: NoteItem[];
  onAddNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<NoteItem>) => void;
  onDeleteNote: (id: string) => void;
  selectedNoteToEdit?: NoteItem | null;
  onClearSelectedNote?: () => void;
}

const CATEGORIES: ('All' | 'General' | 'Work' | 'Personal' | 'Ideas' | 'Urgent')[] = [
  'All',
  'Work',
  'Personal',
  'Ideas',
  'Urgent',
  'General',
];

const COLOR_TAGS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
];

export const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  selectedNoteToEdit,
  onClearSelectedNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'General' | 'Work' | 'Personal' | 'Ideas' | 'Urgent'>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'General' | 'Work' | 'Personal' | 'Ideas' | 'Urgent'>('General');
  const [noteColor, setNoteColor] = useState('#ef4444');
  const [noteIsPinned, setNoteIsPinned] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // If selectedNoteToEdit is passed from outside (e.g., Home)
  React.useEffect(() => {
    if (selectedNoteToEdit) {
      setEditingNoteId(selectedNoteToEdit.id);
      setNoteTitle(selectedNoteToEdit.title);
      setNoteContent(selectedNoteToEdit.content);
      setNoteCategory(selectedNoteToEdit.category);
      setNoteColor(selectedNoteToEdit.colorTag);
      setNoteIsPinned(selectedNoteToEdit.isPinned || false);
      setIsEditorOpen(true);
      if (onClearSelectedNote) onClearSelectedNote();
    }
  }, [selectedNoteToEdit, onClearSelectedNote]);

  const openNewNoteModal = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('General');
    setNoteColor('#ef4444');
    setNoteIsPinned(false);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNoteColor(note.colorTag);
    setNoteIsPinned(note.isPinned || false);
    setIsEditorOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    if (editingNoteId) {
      onUpdateNote(editingNoteId, {
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        category: noteCategory,
        colorTag: noteColor,
        isPinned: noteIsPinned,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddNote({
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        category: noteCategory,
        colorTag: noteColor,
        isPinned: noteIsPinned,
      });
    }

    setIsEditorOpen(false);
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter notes
  const filteredNotes = notes
    .filter((n) => {
      const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      // Pinned notes first, then latest updated
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-16"
      id="notes-exclusive-view"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold mb-1">
            DOCUMENTATION & THOUGHTS
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Notes Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
              {notes.length} Total
            </span>
          </div>
        </div>

        <button
          onClick={openNewNoteModal}
          className="bg-[#E2E4E8] text-zinc-950 font-bold px-4 py-2 rounded-full text-xs sm:text-sm hover:bg-[#FF2A3A] hover:text-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
          id="btn-create-new-note"
        >
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/5 border border-white/20 p-2.5 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by keyword, title, or category..."
            className="w-full bg-black/60 border border-white/10 text-white placeholder:text-white/40 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm outline-none focus:border-white/40 font-medium transition-colors"
            id="input-search-notes"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-black/40 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/10 bg-white/5 text-center text-white/40">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No notes found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No notes matched your search "${searchQuery}". Try different keywords.`
              : 'Your workspace notes are empty. Tap below to write your first note!'}
          </p>
          <button
            onClick={openNewNoteModal}
            className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs inline-flex items-center gap-1.5 hover:bg-zinc-200"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={() => handleEditNote(note)}
              className="p-5 rounded-2xl border border-white/10 hover:border-white/40 bg-white/[0.02] transition-colors flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              style={{
                borderLeftWidth: '3px',
                borderLeftColor: note.colorTag || '#ffffff',
              }}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                      {note.category}
                    </span>
                    {note.isPinned && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-black">
                        <Pin className="w-2.5 h-2.5" />
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Actions on Card Header */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateNote(note.id, { isPinned: !note.isPinned });
                      }}
                      className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title={note.isPinned ? 'Unpin' : 'Pin note'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'text-white fill-white' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(note.id, `${note.title}\n\n${note.content}`, e)}
                      className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Copy note content"
                    >
                      {copiedId === note.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this note?')) {
                          onDeleteNote(note.id);
                        }
                      }}
                      className="p-1 rounded-md hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-white transition-colors mb-2 leading-snug">
                  {note.title}
                </h3>

                <p className="text-xs text-white/50 whitespace-pre-line line-clamp-4 leading-relaxed font-normal">
                  {note.content}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/30" />
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <span className="text-white/60 group-hover:text-white font-semibold flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-white" />
                  Edit
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="w-full max-w-xl bg-black border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col"
              id="note-editor-modal"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold">
                    NOTE EDITOR
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    {editingNoteId ? 'Edit Workspace Note' : 'Create New Note'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4 pt-4 flex-1 flex flex-col overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter note title..."
                    required
                    className="w-full bg-white text-black font-semibold px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-white text-sm"
                    id="input-note-title"
                  />
                </div>

                {/* Category & Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Category
                    </label>
                    <select
                      value={noteCategory}
                      onChange={(e) => setNoteCategory(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/20 text-white font-semibold px-3 py-2 rounded-xl outline-none focus:border-white text-xs"
                    >
                      <option value="General" className="bg-black text-white">General</option>
                      <option value="Work" className="bg-black text-white">Work</option>
                      <option value="Personal" className="bg-black text-white">Personal</option>
                      <option value="Ideas" className="bg-black text-white">Ideas</option>
                      <option value="Urgent" className="bg-black text-white">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2 py-1">
                      {COLOR_TAGS.map((col) => (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setNoteColor(col.value)}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                            noteColor === col.value ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.value }}
                          title={col.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Content & Details
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your note, instructions, tasks or ideas here..."
                    rows={6}
                    className="w-full flex-1 bg-white/5 border border-white/20 text-white font-normal placeholder:text-white/40 p-4 rounded-xl outline-none focus:border-white text-sm leading-relaxed resize-none"
                    id="textarea-note-content"
                  />
                  <div className="text-right text-[11px] text-white/40 mt-1">
                    {noteContent.split(/\s+/).filter(Boolean).length} words • {noteContent.length} characters
                  </div>
                </div>

                {/* Pin toggle */}
                <label className="flex items-center gap-2 text-xs font-semibold text-white/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={noteIsPinned}
                    onChange={(e) => setNoteIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded accent-white"
                  />
                  Pin this note to the top of the workspace
                </label>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="flex-1 py-2.5 rounded-full bg-white/5 border border-white/20 text-white/60 hover:bg-[#FF2A3A] hover:text-white hover:border-[#FF2A3A] font-bold text-xs cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-[#E2E4E8] text-zinc-950 hover:bg-[#FF2A3A] hover:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-200"
                    id="btn-save-note"
                  >
                    <Check className="w-4 h-4" />
                    {editingNoteId ? 'Update Note' : 'Save Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
