import React, { useState, useRef } from 'react';
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
  Sparkles,
  Paperclip,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileCode,
  File,
  Eye
} from 'lucide-react';
import { NoteItem, NoteAttachment } from '../types';
import * as api from '../lib/api';

interface NotesSectionProps {
  notes: NoteItem[];
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  selectedNoteToEdit: NoteItem | null;
  setSelectedNoteToEdit: React.Dispatch<React.SetStateAction<NoteItem | null>>;
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
  { name: 'Red', value: '#d9ad52' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
];

function getFileIcon(type?: string, name?: string) {
  const ext = (name?.split('.').pop() || type || '').toLowerCase();
  if (ext.includes('pdf')) return <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-extrabold text-[9px]">PDF</span>;
  if (ext.includes('doc') || ext.includes('docx')) return <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-extrabold text-[9px]">DOC</span>;
  if (ext.includes('ppt') || ext.includes('pptx')) return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-extrabold text-[9px]">PPT</span>;
  if (ext.includes('xls') || ext.includes('xlsx') || ext.includes('csv')) return <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[9px]">XLS</span>;
  if (ext.includes('txt') || ext.includes('md')) return <span className="px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-300 font-extrabold text-[9px]">TXT</span>;
  return <Paperclip className="w-3.5 h-3.5 text-[#d9ad52]" />;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  setNotes,
  selectedNoteToEdit,
  setSelectedNoteToEdit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'General' | 'Work' | 'Personal' | 'Ideas' | 'Urgent'>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'General' | 'Work' | 'Personal' | 'Ideas' | 'Urgent'>('General');
  const [noteColor, setNoteColor] = useState('#d9ad52');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<NoteAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // If selectedNoteToEdit is passed from outside
  React.useEffect(() => {
    if (selectedNoteToEdit) {
      setEditingNoteId(selectedNoteToEdit.id);
      setNoteTitle(selectedNoteToEdit.title);
      setNoteContent(selectedNoteToEdit.content);
      setNoteCategory(selectedNoteToEdit.category);
      setNoteColor(selectedNoteToEdit.colorTag);
      setNoteIsPinned(selectedNoteToEdit.isPinned || false);
      setNoteAttachments(selectedNoteToEdit.attachments || []);
      setIsEditorOpen(true);
      setSelectedNoteToEdit(null);
    }
  }, [selectedNoteToEdit, setSelectedNoteToEdit]);

  const onUpdateNote = async (id: string, updates: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    );
    try {
      await api.updateNote(id, updates);
    } catch (e) {
      console.warn('Sync note update failed:', e);
    }
  };

  const onDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.deleteNote(id);
    } catch (e) {
      console.warn('Sync note delete failed:', e);
    }
  };

  const openNewNoteModal = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('General');
    setNoteColor('#d9ad52');
    setNoteIsPinned(false);
    setNoteAttachments([]);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNoteColor(note.colorTag);
    setNoteIsPinned(note.isPinned || false);
    setNoteAttachments(note.attachments || []);
    setIsEditorOpen(true);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    const fileList = Array.from(files);
    let processed = 0;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType: NoteAttachment['type'] = 'other';
        if (ext === 'pdf') fileType = 'pdf';
        else if (['doc', 'docx'].includes(ext)) fileType = 'doc';
        else if (['ppt', 'pptx'].includes(ext)) fileType = 'ppt';
        else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'xls';
        else if (['txt', 'md'].includes(ext)) fileType = 'txt';

        const sizeFormatted = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        const newAttachment: NoteAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          url: dataUrl,
          size: sizeFormatted,
          type: fileType,
        };

        setNoteAttachments((prev) => [...prev, newAttachment]);
        processed++;
        if (processed === fileList.length) {
          setIsUploadingAttachment(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setNoteAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim() && noteAttachments.length === 0) return;

    if (editingNoteId) {
      const updates = {
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        category: noteCategory,
        colorTag: noteColor,
        isPinned: noteIsPinned,
        attachments: noteAttachments,
      };
      onUpdateNote(editingNoteId, updates);
    } else {
      const newNote: NoteItem = {
        id: `note-${Date.now()}`,
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        category: noteCategory,
        colorTag: noteColor,
        isPinned: noteIsPinned,
        attachments: noteAttachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      try {
        await api.createNote(newNote);
      } catch (err) {
        console.warn('Sync note create failed:', err);
      }
    }

    setIsEditorOpen(false);
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadAttachment = (att: NoteAttachment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = att.url;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter notes
  const filteredNotes = notes
    .filter((n) => {
      const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.attachments && n.attachments.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
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
      className="notes-studio space-y-6 pb-16"
      id="notes-exclusive-view"
    >
      {/* Header Bar */}
      <div className="notes-studio__header flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#d9ad52] uppercase font-extrabold mb-2">
            THE PRIVATE ARCHIVE
          </div>
          <div className="flex items-center gap-3">
            <h1 className="notes-studio__title text-3xl sm:text-4xl font-extrabold tracking-tight text-[#fff8e8]">
              Notes & Docs
            </h1>
            <span className="notes-studio__count px-3 py-1 rounded-full text-xs font-extrabold bg-[#d9ad52]/12 text-[#f4dfb0] border border-[#d9ad52]/30">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>
          <p className="text-sm text-white/50 mt-2">Write notes and attach documents (PDF, Word, PPT, Excel, Text) securely synced across all devices.</p>
        </div>

        <button
          onClick={openNewNoteModal}
          className="bg-[#d9ad52] text-[#20140b] font-bold px-5 py-3 rounded-xl text-xs sm:text-sm hover:bg-[#f4dfb0] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
          id="btn-create-new-note"
        >
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="notes-studio__toolbar flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-950/60 border border-white/15 p-3 rounded-2xl backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes & documents (PDF, Word, PPT, etc.)..."
            className="w-full bg-[#14100c]/80 border border-[#d9ad52]/15 text-white placeholder:text-white/35 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm outline-none focus:border-[#d9ad52] font-medium transition-colors"
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#f4dfb0] text-[#20140b] shadow-md'
                  : 'bg-black/50 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-zinc-950/40 text-center text-white/40">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No notes or documents found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No notes matched your search "${searchQuery}". Try different keywords.`
              : 'Your workspace notes are empty. Tap below to create your first note or upload documents!'}
          </p>
          <button
            onClick={openNewNoteModal}
            className="px-5 py-2.5 rounded-full bg-[#d9ad52] text-[#20140b] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#f4dfb0] transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      ) : (
        <div className="notes-studio__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={() => handleEditNote(note)}
              className="notes-studio__card p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-[#d9ad52]/60 bg-[#17120f]/80 backdrop-blur-md transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden shadow-xl"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: note.colorTag || '#d9ad52',
              }}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-white/90 border border-white/10">
                      {note.category}
                    </span>
                    {note.isPinned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white text-black">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        Pinned
                      </span>
                    )}
                    {note.attachments && note.attachments.length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#d9ad52]/15 text-[#f4dfb0] border border-[#d9ad52]/30">
                        <Paperclip className="w-2.5 h-2.5" />
                        {note.attachments.length} {note.attachments.length === 1 ? 'doc' : 'docs'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateNote(note.id, { isPinned: !note.isPinned });
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title={note.isPinned ? 'Unpin' : 'Pin note'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'text-[#d9ad52] fill-[#d9ad52]' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(note.id, `${note.title}\n\n${note.content}`, e)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
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
                      className="p-1.5 rounded-lg hover:bg-[#d9ad52]/20 text-white/40 hover:text-[#d9ad52] transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#fff8e8] group-hover:text-[#f4dfb0] transition-colors mb-2 leading-snug">
                  {note.title}
                </h3>

                {note.content && (
                  <p className="text-xs text-white/55 whitespace-pre-line line-clamp-3 leading-relaxed font-normal mb-3">
                    {note.content}
                  </p>
                )}

                {/* Attached Document Pills */}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="flex flex-col gap-1.5 my-2">
                    {note.attachments.map((att) => (
                      <div
                        key={att.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewAttachment(att);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-white/10 hover:border-[#d9ad52]/50 transition-colors group/att"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {getFileIcon(att.type, att.name)}
                          <span className="text-xs text-white/90 truncate font-medium max-w-[180px]">
                            {att.name}
                          </span>
                          {att.size && (
                            <span className="text-[10px] text-white/35 font-mono">
                              {att.size}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => downloadAttachment(att, e)}
                            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
                            title="Download document"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/30" />
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <span className="text-white/60 group-hover:text-white font-bold flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-white" />
                  Edit / View
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
              className="w-full max-w-xl bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col"
              id="note-editor-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="note-editor-title"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-[#d9ad52] uppercase font-bold">
                    NOTE & DOCUMENT STUDIO
                  </div>
                  <h3 id="note-editor-title" className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    {editingNoteId ? 'Edit Note & Documents' : 'Create Note / Attach Docs'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"
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
                    className="w-full bg-black/80 border border-white/20 text-white font-semibold px-4 py-2.5 rounded-xl outline-none focus:border-[#d9ad52] text-sm transition-colors"
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
                      className="w-full bg-black/80 border border-white/20 text-white font-semibold px-3 py-2 rounded-xl outline-none focus:border-white text-xs"
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
                    Content & Notes
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write note contents, takeaways, or meeting points..."
                    rows={4}
                    className="w-full bg-black/80 border border-white/20 text-white font-normal placeholder:text-white/40 p-4 rounded-xl outline-none focus:border-white text-sm leading-relaxed resize-none"
                    id="textarea-note-content"
                  />
                  <div className="text-right text-[11px] text-white/40 mt-1">
                    {noteContent.split(/\s+/).filter(Boolean).length} words • {noteContent.length} characters
                  </div>
                </div>

                {/* Attach Documents Section (PDF, DOC, PPT, XLS, TXT) */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-[#d9ad52]" />
                        Attached Documents & Presentations
                      </div>
                      <p className="text-[11px] text-white/40">Upload PDF, Word (.doc/docx), PowerPoint (.ppt/pptx), Excel (.xls/xlsx/csv), or Text files</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[#d9ad52]/15 text-[#f4dfb0] border border-[#d9ad52]/40 text-xs font-bold hover:bg-[#d9ad52]/25 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Document
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                      onChange={handleFileAttach}
                      className="hidden"
                    />
                  </div>

                  {isUploadingAttachment && (
                    <div className="text-xs text-[#d9ad52] flex items-center gap-2 py-1">
                      <div className="w-3.5 h-3.5 border-2 border-[#d9ad52] border-t-transparent rounded-full animate-spin" />
                      Encoding document attachment...
                    </div>
                  )}

                  {noteAttachments.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {noteAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-white/10"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {getFileIcon(att.type, att.name)}
                            <span className="text-xs text-white truncate max-w-[220px]">
                              {att.name}
                            </span>
                            {att.size && (
                              <span className="text-[10px] text-white/40 font-mono">
                                {att.size}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => downloadAttachment(att)}
                              className="p-1 text-white/50 hover:text-white"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="p-1 text-red-400/60 hover:text-red-400"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-white/30 text-xs border border-dashed border-white/10 rounded-xl">
                      No documents attached yet. Click "Add Document" above.
                    </div>
                  )}
                </div>

                {/* Pin toggle */}
                <label className="flex items-center gap-2 text-xs font-semibold text-white/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={noteIsPinned}
                    onChange={(e) => setNoteIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#d9ad52]"
                  />
                  Pin this note to the top of the workspace
                </label>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="flex-1 py-2.5 rounded-full bg-white/5 border border-white/20 text-white/60 hover:bg-[#d9ad52]/10 hover:text-[#d9ad52] hover:border-[#d9ad52]/40 font-bold text-xs cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-[#d9ad52] text-[#20140b] hover:bg-[#f4dfb0] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-200"
                    id="btn-save-note"
                  >
                    <Check className="w-4 h-4" />
                    {editingNoteId ? 'Update Note & Docs' : 'Save Note & Docs'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Quick Preview Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-zinc-950 border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  {getFileIcon(previewAttachment.type, previewAttachment.name)}
                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                    {previewAttachment.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadAttachment(previewAttachment)}
                    className="px-3 py-1.5 rounded-xl bg-[#d9ad52] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#f4dfb0]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden rounded-2xl bg-black border border-white/10 flex flex-col items-center justify-center min-h-[350px]">
                {previewAttachment.type === 'pdf' ? (
                  <iframe
                    src={previewAttachment.url}
                    title={previewAttachment.name}
                    className="w-full h-full min-h-[450px] border-none rounded-xl"
                  />
                ) : (
                  <div className="p-8 text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#d9ad52]">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">{previewAttachment.name}</h4>
                    <p className="text-xs text-white/50 mb-5">
                      This format ({previewAttachment.type?.toUpperCase() || 'DOCUMENT'}) is saved and synced across all your devices. Click below to download or open it with your native app.
                    </p>
                    <button
                      onClick={() => downloadAttachment(previewAttachment)}
                      className="px-6 py-2.5 rounded-full bg-[#d9ad52] text-black font-bold text-xs inline-flex items-center gap-2 hover:bg-[#f4dfb0]"
                    >
                      <Download className="w-4 h-4" />
                      Download & Open
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
