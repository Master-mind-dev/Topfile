import React, { useState, useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";

// ── TYPES ──────────────────────────────────────────────────────────────────────
export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uri: string;
  addedAt: string;
}

export interface NoteBlock {
  id: string;
  type: "text" | "image" | "video" | "attachment";
  html?: string;
  src?: string;
  attachment?: NoteAttachment;
}

export interface Note {
  id: string;
  title: string;
  tags: string[];
  blocks: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}

// ── TINY SVG ICON ─────────────────────────────────────────────────────────────
function Ic({ d, size = 18, sw = 1.8 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const IC = {
  back: "M15 18l-6-6 6-6",
  bold: "M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z",
  italic: "M19 4h-9M14 20H5M15 4 9 20",
  under: "M6 3v7a6 6 0 0 0 12 0V3M4 21h16",
  strike: "M18 6C18 3.8 16.2 2 14 2h-1.5a3.5 3.5 0 0 0 0 7h3a3.5 3.5 0 0 1 0 7H10c-2.2 0-4-1.8-4-4M5 12h14",
  h1: "M4 12h8M4 6v12M12 6v12M17 12l3-3v9",
  h2: "M4 12h8M4 6v12M12 6v12M21 18h-4c0-4 4-3 4-6 0-1.5-1-2.5-2.5-2.5S16 8.5 16 10",
  ul: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  ol: "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2",
  check: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  quote: "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  undo: "M3 7v6h6M3 13A9 9 0 1 0 5.27 5.27",
  redo: "M21 7v6h-6M21 13A9 9 0 1 1 18.73 5.27",
  img: "M15 8h.01M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM3 16l5-5 5 5 4-4 4 4",
  vid: "M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.89L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  cam: "M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3zM9 13a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  x: "M18 6 6 18M6 6l12 12",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  copy: "M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2zM4 16V4a2 2 0 0 1 2-2h8",
  replace: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  up: "M18 15l-6-6-6 6",
  down: "M6 9l6 6 6-6",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  ocr: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
  checkFilled: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3"
};

function TBtn({
  d,
  label,
  active,
  onMD,
  title,
  style: s,
}: {
  d?: string;
  label?: string;
  active?: boolean;
  onMD: (e: React.MouseEvent) => void;
  title?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      title={title || label}
      onMouseDown={onMD}
      style={{
        minWidth: label ? "auto" : 34,
        height: 34,
        padding: label ? "0 10px" : 0,
        border: `1px solid ${active ? "#e11d48" : "var(--border-color, rgba(255,255,255,0.12))"}`,
        borderRadius: 9,
        flexShrink: 0,
        background: active ? "rgba(225,29,72,0.15)" : "var(--bg-card, rgba(255,255,255,0.06))",
        color: active ? "#fb7185" : "var(--text-primary, #ffffff)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "Manrope, sans-serif",
        transition: "all 0.12s ease",
        ...s,
      }}
    >
      {label ? label : d ? <Ic d={d} size={16} /> : null}
    </button>
  );
}

async function doOCR(uri: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const w = await createWorker("eng");
    const { data } = await w.recognize(uri);
    await w.terminate();
    return data.text.trim();
  } catch (err) {
    console.warn("OCR failed:", err);
    return "";
  }
}

// ── LINK DIALOG ───────────────────────────────────────────────────────────────
function LinkDialog({ onOK, onCancel }: { onOK(url: string, txt: string): void; onCancel(): void }) {
  const [url, setUrl] = useState("https://");
  const [txt, setTxt] = useState("");
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--bg-card, #1a1a1f)",
          borderRadius: 20,
          padding: 24,
          width: "90%",
          maxWidth: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
        }}
      >
        <strong style={{ display: "block", fontFamily: "Manrope,sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 14, color: "var(--text-primary, #fff)" }}>
          Insert Link
        </strong>
        {[
          { ph: "Display text (optional)", v: txt, set: setTxt },
          { ph: "https://…", v: url, set: setUrl },
        ].map((f, i) => (
          <input
            key={i}
            value={f.v}
            onChange={(e) => f.set(e.target.value)}
            placeholder={f.ph}
            style={{
              width: "100%",
              border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              outline: "none",
              marginBottom: 10,
              boxSizing: "border-box" as const,
              background: "var(--bg-input, rgba(255,255,255,0.06))",
              color: "var(--text-primary, #fff)",
              fontFamily: "inherit",
            }}
          />
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 12,
              border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
              borderRadius: 12,
              background: "transparent",
              color: "var(--text-primary, #fff)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onOK(url, txt)}
            style={{
              flex: 1,
              padding: 12,
              border: "none",
              borderRadius: 12,
              background: "#e11d48",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN NOTE EDITOR ──────────────────────────────────────────────────────────
export default function NoteEditor({
  note,
  onSave,
  onBack,
  onOpenScanner,
  onOpenViewer,
}: {
  note: Note;
  onSave(n: Note): void;
  onBack(): void;
  onOpenScanner(): void;
  onOpenViewer(a: NoteAttachment): void;
}) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(true);
  const [showLink, setShowLink] = useState(false);
  const [ocrLoad, setOcrLoad] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ text: string } | null>(null);
  const [fmts, setFmts] = useState<Record<string, boolean>>({});

  // Contextual Image Selection State (Samsung Notes style)
  const [selectedImgEl, setSelectedImgEl] = useState<HTMLImageElement | null>(null);
  const [imgToolbarPos, setImgToolbarPos] = useState<{ top: number; left: number } | null>(null);

  const edRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSelectionRange = useRef<Range | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize editor HTML on note load
  useEffect(() => {
    if (!edRef.current) return;

    // Combine any existing text block or legacy blocks into the unified canvas
    let initialHtml = "";
    if (note.blocks && note.blocks.length > 0) {
      initialHtml = note.blocks
        .map((b) => {
          if (b.type === "text") return b.html || "";
          if (b.type === "image" && b.src) {
            return `<div class="note-img-block" contenteditable="false" style="text-align:center;margin:16px 0;"><img src="${b.src}" class="samsung-note-img" style="max-width:100%;border-radius:12px;cursor:pointer;display:inline-block;" alt="" /></div><p><br></p>`;
          }
          return "";
        })
        .join("");
    }

    if (!initialHtml.trim()) {
      initialHtml = "<p><br></p>";
    }

    edRef.current.innerHTML = initialHtml;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  // Keep track of cursor position so inserting image/links puts it right at caret
  const saveCaretSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && edRef.current?.contains(sel.anchorNode)) {
      savedSelectionRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreCaretSelection = () => {
    if (savedSelectionRange.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelectionRange.current);
    }
  };

  // Auto-save logic
  const touch = useCallback((newTitle = title, newTags = tags) => {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const html = edRef.current?.innerHTML || "";
      const updatedBlocks: NoteBlock[] = [{ id: "b-unified", type: "text", html }];
      onSave({
        ...note,
        title: newTitle,
        tags: newTags,
        blocks: updatedBlocks,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
    }, 600);
  }, [note, onSave, tags, title]);

  // Sync active format states
  function syncFmts() {
    setFmts({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strike: document.queryCommandState("strikeThrough"),
    });
    saveCaretSelection();
  }

  // Formatting commands
  const exec = useCallback(
    (cmd: string, val?: string) => {
      const el = edRef.current;
      if (!el) return;
      el.focus();
      restoreCaretSelection();

      const sel = window.getSelection();
      if (!sel?.rangeCount || !el.contains(sel.anchorNode)) {
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(r);
      }

      switch (cmd) {
        case "formatBlock":
          document.execCommand("formatBlock", false, val || "p");
          break;
        case "insertHTML":
          document.execCommand("insertHTML", false, val);
          break;
        case "insertChecklist":
          document.execCommand(
            "insertHTML",
            false,
            `<ul style="list-style:none;padding-left:4px;margin:.6em 0"><li style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><input type="checkbox" style="width:18px;height:18px;cursor:pointer;accent-color:#e11d48;" /><span>Task item</span></li></ul><p><br></p>`
          );
          break;
        default:
          document.execCommand(cmd, false, val);
      }
      syncFmts();
      touch();
    },
    [touch]
  );

  // Position contextual toolbar over selected image
  const updateToolbarPosition = (img: HTMLImageElement) => {
    const rect = img.getBoundingClientRect();
    setImgToolbarPos({
      top: Math.max(70, rect.top - 54),
      left: Math.max(12, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 160)),
    });
  };

  // Image Selection Click Handler
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === "img") {
      const img = target as HTMLImageElement;
      setSelectedImgEl(img);
      updateToolbarPosition(img);
    } else {
      setSelectedImgEl(null);
      setImgToolbarPos(null);
    }
  };

  // Reposition toolbar on scroll
  useEffect(() => {
    const onScroll = () => {
      if (selectedImgEl) {
        updateToolbarPosition(selectedImgEl);
      }
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [selectedImgEl]);

  // CORE: Insert image directly at current cursor position (Samsung Notes Style)
  const insertImageAtCursor = (imageUrl: string) => {
    const el = edRef.current;
    if (!el) return;
    el.focus();
    restoreCaretSelection();

    const imgBlockHtml = `
      <div class="note-img-block" contenteditable="false" style="text-align:center;margin:18px 0;position:relative;">
        <img src="${imageUrl}" class="samsung-note-img" style="max-width:100%;width:auto;border-radius:12px;cursor:pointer;display:inline-block;box-shadow:0 6px 24px rgba(0,0,0,0.25);" alt="" />
      </div>
      <p><br></p>
    `;

    document.execCommand("insertHTML", false, imgBlockHtml);
    touch();

    // Automatically focus on the paragraph below the image
    const sel = window.getSelection();
    if (sel && sel.focusNode) {
      saveCaretSelection();
    }
  };

  // Image Upload from File
  const handleFileUpload = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          insertImageAtCursor(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Clipboard Paste (paste images directly into text)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleFileUpload(file);
        return;
      }
    }
  };

  // Drag and Drop (drop images directly onto text location)
  const handleDrop = (e: React.DragEvent) => {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      e.preventDefault();
      // Position caret at drop location
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range) {
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          savedSelectionRange.current = range;
        }
      }
      handleFileUpload(files[0]);
    }
  };

  // Contextual Toolbar Actions
  const handleResize = (percentage: string) => {
    if (!selectedImgEl) return;
    selectedImgEl.style.width = percentage;
    touch();
  };

  const handleMoveUp = () => {
    if (!selectedImgEl) return;
    const block = selectedImgEl.closest(".note-img-block");
    if (block && block.previousElementSibling) {
      block.parentNode?.insertBefore(block, block.previousElementSibling);
      touch();
      setTimeout(() => updateToolbarPosition(selectedImgEl), 50);
    }
  };

  const handleMoveDown = () => {
    if (!selectedImgEl) return;
    const block = selectedImgEl.closest(".note-img-block");
    if (block && block.nextElementSibling) {
      block.parentNode?.insertBefore(block.nextElementSibling, block);
      touch();
      setTimeout(() => updateToolbarPosition(selectedImgEl), 50);
    }
  };

  const handleDuplicate = () => {
    if (!selectedImgEl) return;
    const block = selectedImgEl.closest(".note-img-block");
    if (block && block.parentNode) {
      const clone = block.cloneNode(true) as HTMLElement;
      block.parentNode.insertBefore(clone, block.nextSibling);
      touch();
    }
  };

  const handleDeleteImage = () => {
    if (!selectedImgEl) return;
    const block = selectedImgEl.closest(".note-img-block");
    if (block) {
      block.remove();
    } else {
      selectedImgEl.remove();
    }
    setSelectedImgEl(null);
    setImgToolbarPos(null);
    touch();
  };

  const handleReplaceClick = () => {
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedImgEl) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result && selectedImgEl) {
          selectedImgEl.src = ev.target.result as string;
          touch();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOCRFromSelected = async () => {
    if (!selectedImgEl) return;
    setOcrLoad("ocr");
    const text = await doOCR(selectedImgEl.src);
    setOcrLoad(null);
    if (text) {
      setOcrResult({ text });
    } else {
      alert("No readable text detected in this image.");
    }
  };

  const insertOCRText = () => {
    if (!ocrResult || !edRef.current) return;
    edRef.current.focus();
    restoreCaretSelection();
    document.execCommand("insertHTML", false, `<p>${ocrResult.text.replace(/\n/g, "<br>")}</p>`);
    setOcrResult(null);
    touch();
  };

  // Tags
  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, "");
      if (t && !tags.includes(t)) {
        const nt = [...tags, t];
        setTags(nt);
        touch(title, nt);
      }
      setTagInput("");
    }
  }

  function rmTag(t: string) {
    const nt = tags.filter((x) => x !== t);
    setTags(nt);
    touch(title, nt);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        background: "var(--bg-page, #ffffff)",
        color: "var(--text-primary, #0f172a)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ─ TOP HEADER ─ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.08))",
          background: "var(--bg-header, rgba(255,255,255,0.95))",
          backdropFilter: "blur(14px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-primary, #0f172a)",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              borderRadius: 8,
            }}
          >
            <Ic d={IC.back} size={22} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: saved ? "#10b981" : "#f59e0b",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: saved ? "#10b981" : "#f59e0b",
                  display: "inline-block",
                }}
              />
              {saved ? "Saved" : "Saving…"}
            </span>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onOpenScanner}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(225,29,72,0.12)",
              color: "#fb7185",
              border: "1px solid rgba(225,29,72,0.3)",
              borderRadius: 10,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Ic d={IC.cam} size={15} />
            <span>Scan doc</span>
          </button>
          <button
            onClick={() => touch()}
            style={{
              background: "#e11d48",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* ─ RICH FORMATTING TOOLBAR (SAMSUNG NOTES STYLE) ─ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.08))",
          background: "var(--bg-card, #ffffff)",
          overflowX: "auto",
          scrollbarWidth: "none",
          flexShrink: 0,
        }}
      >
        <TBtn d={IC.undo} onMD={(e) => { e.preventDefault(); exec("undo"); }} title="Undo" />
        <TBtn d={IC.redo} onMD={(e) => { e.preventDefault(); exec("redo"); }} title="Redo" />
        <div style={{ width: 1, height: 20, background: "var(--border-color, rgba(0,0,0,0.1))", margin: "0 2px" }} />

        <TBtn label="H1" onMD={(e) => { e.preventDefault(); exec("formatBlock", "h1"); }} title="Heading 1" />
        <TBtn label="H2" onMD={(e) => { e.preventDefault(); exec("formatBlock", "h2"); }} title="Heading 2" />
        <TBtn label="P" onMD={(e) => { e.preventDefault(); exec("formatBlock", "p"); }} title="Paragraph" />
        <div style={{ width: 1, height: 20, background: "var(--border-color, rgba(0,0,0,0.1))", margin: "0 2px" }} />

        <TBtn d={IC.bold} active={fmts.bold} onMD={(e) => { e.preventDefault(); exec("bold"); }} title="Bold" />
        <TBtn d={IC.italic} active={fmts.italic} onMD={(e) => { e.preventDefault(); exec("italic"); }} title="Italic" />
        <TBtn d={IC.under} active={fmts.underline} onMD={(e) => { e.preventDefault(); exec("underline"); }} title="Underline" />
        <TBtn d={IC.strike} active={fmts.strike} onMD={(e) => { e.preventDefault(); exec("strikeThrough"); }} title="Strikethrough" />
        <div style={{ width: 1, height: 20, background: "var(--border-color, rgba(0,0,0,0.1))", margin: "0 2px" }} />

        <TBtn d={IC.ul} onMD={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} title="Bullet list" />
        <TBtn d={IC.ol} onMD={(e) => { e.preventDefault(); exec("insertOrderedList"); }} title="Numbered list" />
        <TBtn d={IC.check} onMD={(e) => { e.preventDefault(); exec("insertChecklist"); }} title="To-do checklist" />
        <TBtn d={IC.quote} onMD={(e) => { e.preventDefault(); exec("formatBlock", "blockquote"); }} title="Quote" />
        <TBtn d={IC.link} onMD={(e) => { e.preventDefault(); saveCaretSelection(); setShowLink(true); }} title="Add link" />
        <div style={{ width: 1, height: 20, background: "var(--border-color, rgba(0,0,0,0.1))", margin: "0 2px" }} />

        {/* Inline Photo Insert button */}
        <label
          onMouseDown={() => saveCaretSelection()}
          style={{
            minWidth: 34,
            height: 34,
            padding: "0 10px",
            border: "1px solid rgba(16,185,129,0.35)",
            borderRadius: 9,
            background: "rgba(16,185,129,0.12)",
            color: "#059669",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
          }}
          title="Insert image at cursor"
        >
          <Ic d={IC.img} size={16} />
          <span>Image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </label>
      </div>

      {/* ─ FLOATING IMAGE CONTEXTUAL TOOLBAR (ON CLICK) ─ */}
      {selectedImgEl && imgToolbarPos && (
        <div
          style={{
            position: "fixed",
            top: imgToolbarPos.top,
            left: imgToolbarPos.left,
            zIndex: 400,
            background: "var(--bg-card, #1e1e24)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-color, rgba(0,0,0,0.15))",
            borderRadius: 14,
            padding: "4px 8px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <button
            onClick={() => handleResize("35%")}
            style={{ background: "none", border: "none", color: "var(--text-primary, inherit)", fontSize: 11, fontWeight: 700, padding: "4px 6px", cursor: "pointer" }}
            title="Small"
          >
            25%
          </button>
          <button
            onClick={() => handleResize("60%")}
            style={{ background: "none", border: "none", color: "var(--text-primary, inherit)", fontSize: 11, fontWeight: 700, padding: "4px 6px", cursor: "pointer" }}
            title="Medium"
          >
            50%
          </button>
          <button
            onClick={() => handleResize("100%")}
            style={{ background: "none", border: "none", color: "var(--text-primary, inherit)", fontSize: 11, fontWeight: 700, padding: "4px 6px", cursor: "pointer" }}
            title="Full width"
          >
            100%
          </button>

          <div style={{ width: 1, height: 16, background: "var(--border-color, rgba(0,0,0,0.15))" }} />

          <button onClick={handleMoveUp} style={{ background: "none", border: "none", color: "var(--text-primary, inherit)", padding: 4, cursor: "pointer" }} title="Move up">
            <Ic d={IC.up} size={15} />
          </button>
          <button onClick={handleMoveDown} style={{ background: "none", border: "none", color: "var(--text-primary, inherit)", padding: 4, cursor: "pointer" }} title="Move down">
            <Ic d={IC.down} size={15} />
          </button>
          <button onClick={handleDuplicate} style={{ background: "none", border: "none", color: "var(--text-primary, inherit)", padding: 4, cursor: "pointer" }} title="Duplicate">
            <Ic d={IC.copy} size={15} />
          </button>
          <button onClick={handleReplaceClick} style={{ background: "none", border: "none", color: "#0284c7", padding: 4, cursor: "pointer" }} title="Replace image">
            <Ic d={IC.replace} size={15} />
          </button>
          <button onClick={handleOCRFromSelected} style={{ background: "none", border: "none", color: "#d97706", padding: 4, cursor: "pointer" }} title="Extract text (OCR)">
            <Ic d={IC.ocr} size={15} />
          </button>
          <button onClick={handleDeleteImage} style={{ background: "none", border: "none", color: "#e11d48", padding: 4, cursor: "pointer" }} title="Delete">
            <Ic d={IC.trash} size={15} />
          </button>
        </div>
      )}

      {/* Hidden input for image replace */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleReplaceFile}
      />

      {/* ─ MAIN EDITABLE CANVAS ─ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px 100px",
          maxWidth: 820,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
        onClick={handleEditorClick}
      >
        {/* Title Input */}
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); touch(e.target.value, tags); }}
          placeholder="Note title…"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "clamp(24px, 4vw, 34px)",
            fontWeight: 800,
            fontFamily: "Manrope, sans-serif",
            color: "var(--text-primary, #0f172a)",
            marginBottom: 14,
            padding: 0,
          }}
        />

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 20 }}>
          {tags.map((t) => (
            <span
              key={t}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(225,29,72,0.12)",
                color: "#be123c",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              #{t}
              <button
                onClick={() => rmTag(t)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
              >
                <Ic d={IC.x} size={11} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKey}
            placeholder="+ tag…"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-secondary, #334155)",
              fontSize: 12,
              width: 80,
            }}
          />
        </div>

        {/* ─ CONTENTEDITABLE CANVASS (MIXED TEXT & INLINE IMAGES) ─ */}
        <div
          ref={edRef}
          contentEditable
          suppressContentEditableWarning
          dir="ltr"
          onInput={() => { syncFmts(); touch(); }}
          onKeyUp={syncFmts}
          onMouseUp={syncFmts}
          onPaste={handlePaste}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          data-ph="Start typing paragraphs, paste images, or drag and drop photos anywhere…"
          className="samsung-note-content"
          style={{
            minHeight: "60vh",
            outline: "none",
            fontSize: 16,
            lineHeight: 1.7,
            color: "var(--text-primary, #0f172a)",
            wordBreak: "break-word",
          }}
        />
      </div>

      {/* ─ OCR EXTRACT MODAL ─ */}
      {ocrResult && (
        <div
          style={{
            position: "fixed",
            bottom: 70,
            left: 20,
            right: 20,
            maxWidth: 600,
            margin: "0 auto",
            zIndex: 500,
            background: "var(--bg-card, #1a1a24)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Detected Text (OCR)</span>
            <button onClick={() => setOcrResult(null)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer" }}>
              <Ic d={IC.x} size={15} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", maxHeight: 120, overflowY: "auto", margin: "0 0 12px" }}>
            {ocrResult.text}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={insertOCRText}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "#e11d48",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Insert into Note
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(ocrResult.text); alert("Copied!"); }}
              style={{
                padding: "8px 14px",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* ─ LINK MODAL ─ */}
      {showLink && (
        <LinkDialog
          onOK={(url, txt) => {
            setShowLink(false);
            edRef.current?.focus();
            restoreCaretSelection();
            const display = txt || url;
            document.execCommand(
              "insertHTML",
              false,
              `<a href="${url}" target="_blank" style="color:#38bdf8;text-decoration:underline;">${display}</a>`
            );
            touch();
          }}
          onCancel={() => setShowLink(false)}
        />
      )}

      {/* ─ STYLES ─ */}
      <style>{`
        .samsung-note-content {
          color: var(--text-primary, #0f172a) !important;
        }
        html.dark-mode .samsung-note-content {
          color: #ffffff !important;
        }
        .samsung-note-content:empty:before {
          content: attr(data-ph);
          color: var(--text-muted, #64748b) !important;
          pointer-events: none;
        }
        html.dark-mode .samsung-note-content:empty:before {
          color: #9ca3af !important;
        }
        .samsung-note-content h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 1.2em 0 0.4em;
          font-family: Manrope, sans-serif;
          color: var(--text-primary, #0f172a);
        }
        html.dark-mode .samsung-note-content h1 {
          color: #ffffff;
        }
        .samsung-note-content h2 {
          font-size: 21px;
          font-weight: 700;
          margin: 1em 0 0.3em;
          font-family: Manrope, sans-serif;
          color: var(--text-primary, #0f172a);
        }
        html.dark-mode .samsung-note-content h2 {
          color: #ffffff;
        }
        .samsung-note-content p {
          margin: 0.5em 0;
          min-height: 1.2em;
          color: inherit;
        }
        .samsung-note-content blockquote {
          border-left: 3px solid #e11d48;
          padding-left: 14px;
          margin: 1em 0;
          color: var(--text-secondary, #334155);
          font-style: italic;
        }
        html.dark-mode .samsung-note-content blockquote {
          color: #d1d5db;
        }
        .samsung-note-content ul {
          padding-left: 24px;
          margin: 0.5em 0;
          color: inherit;
        }
        .samsung-note-content ol {
          padding-left: 24px;
          margin: 0.5em 0;
          color: inherit;
        }
        .samsung-note-img:hover {
          outline: 2px solid #e11d48;
          outline-offset: 3px;
        }
        .note-img-block {
          user-select: none;
        }
      `}</style>
    </div>
  );
}
