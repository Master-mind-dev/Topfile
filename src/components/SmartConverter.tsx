import React, { useState, useRef, ChangeEvent } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  Camera,
  Image as ImageIcon,
  Check,
  Trash2,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  Save,
  Eye,
  X,
  FileUp
} from "lucide-react";
import { imagesToPdf, textToWord, exportToExcel, parseTableFromText, triggerDownload } from "../lib/documentConverter";

export interface ConvertedDocItem {
  id: string;
  name: string;
  type: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  size: string;
  uri: string;
  addedAt: string;
}

interface SmartConverterProps {
  onBack: () => void;
  onSaveToFiles?: (file: ConvertedDocItem) => void;
  onSaveToNotes?: (text: string, title: string) => void;
}

interface ImagePage {
  id: string;
  name: string;
  uri: string;
  text?: string;
  ocrRunning?: boolean;
}

export const SmartConverter: React.FC<SmartConverterProps> = ({
  onBack,
  onSaveToFiles,
  onSaveToNotes,
}) => {
  const [pages, setPages] = useState<ImagePage[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "preview" | "export">("upload");
  const [exportFormat, setExportFormat] = useState<"pdf" | "word" | "excel">("pdf");
  const [docTitle, setDocTitle] = useState("OWNLY_Document");
  const [extractedText, setExtractedText] = useState("");
  const [editableRows, setEditableRows] = useState<(string | number)[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [successSaved, setSuccessSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Upload
  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newPages: ImagePage[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/") || file.name.endsWith(".png") || file.name.endsWith(".jpg") || file.name.endsWith(".jpeg")) {
        const uri = URL.createObjectURL(file);
        newPages.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          uri,
        });
      }
    });

    if (newPages.length > 0) {
      setPages((prev) => [...prev, ...newPages]);
      setActiveTab("preview");
    }
  };

  // Run OCR on page
  const runOcrOnAllPages = async () => {
    setIsProcessing(true);
    setStatusMessage("Extracting text and recognizing layout with OCR…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");

      let combinedText = "";
      const updatedPages = [...pages];

      for (let i = 0; i < updatedPages.length; i++) {
        setStatusMessage(`Processing page ${i + 1} of ${updatedPages.length}…`);
        const { data } = await worker.recognize(updatedPages[i].uri);
        updatedPages[i].text = data.text;
        combinedText += (combinedText ? "\n\n" : "") + data.text;
      }

      await worker.terminate();
      setPages(updatedPages);
      setExtractedText(combinedText);
      const parsed = parseTableFromText(combinedText);
      setEditableRows(parsed);
      setStatusMessage("Layout recognized successfully!");
    } catch (err) {
      console.warn("OCR Error:", err);
      setStatusMessage("OCR failed. Basic text extraction used.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Export / Download
  const handleExport = async () => {
    if (pages.length === 0) {
      alert("Please upload at least one image or scanned page.");
      return;
    }

    setIsProcessing(true);
    try {
      if (exportFormat === "pdf") {
        setStatusMessage("Building high-resolution PDF…");
        const { blob, url, sizeFormatted } = await imagesToPdf(pages, docTitle);
        const fileName = `${docTitle || "OWNLY-Scan"}.pdf`;
        triggerDownload(url, fileName);

        if (onSaveToFiles) {
          onSaveToFiles({
            id: `conv-${Date.now()}`,
            name: fileName,
            type: "application/pdf",
            size: sizeFormatted,
            uri: url,
            addedAt: new Date().toISOString(),
          });
          setSuccessSaved(true);
        }
      } else if (exportFormat === "word") {
        setStatusMessage("Generating editable Word document (.docx)…");
        // Ensure OCR text exists
        let textToUse = extractedText;
        if (!textToUse) {
          await runOcrOnAllPages();
          textToUse = extractedText || "No text could be extracted.";
        }

        const { url, sizeFormatted } = await textToWord(docTitle, textToUse, editableRows as string[][]);
        const fileName = `${docTitle || "OWNLY-Document"}.docx`;
        triggerDownload(url, fileName);

        if (onSaveToFiles) {
          onSaveToFiles({
            id: `conv-${Date.now()}`,
            name: fileName,
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: sizeFormatted,
            uri: url,
            addedAt: new Date().toISOString(),
          });
          setSuccessSaved(true);
        }
      } else if (exportFormat === "excel") {
        setStatusMessage("Reconstructing table and generating Excel (.xlsx)…");
        let rowsToUse = editableRows;
        if (rowsToUse.length === 0) {
          await runOcrOnAllPages();
          rowsToUse = parseTableFromText(extractedText || "");
        }

        const fileName = `${docTitle || "OWNLY-Table"}.xlsx`;
        const { url, sizeFormatted } = exportToExcel(rowsToUse, fileName);
        triggerDownload(url, fileName);

        if (onSaveToFiles) {
          onSaveToFiles({
            id: `conv-${Date.now()}`,
            name: fileName,
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size: sizeFormatted,
            uri: url,
            addedAt: new Date().toISOString(),
          });
          setSuccessSaved(true);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Conversion error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 350,
        background: "var(--bg-page, #ffffff)",
        color: "var(--text-primary, #0f172a)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ─ HEADER ─ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.1))",
          background: "var(--bg-header, rgba(255,255,255,0.98))",
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
              color: "var(--text-primary, inherit)",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              borderRadius: 8,
            }}
          >
            <X size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              Smart Document Converter
              <span
                style={{
                  fontSize: 10,
                  background: "rgba(225,29,72,0.12)",
                  color: "#e11d48",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                PDF · Word · Excel
              </span>
            </h2>
            <small style={{ color: "var(--text-secondary, #64748b)", fontSize: 12 }}>
              Convert camera photos, scans & gallery images into editable files
            </small>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-chip, #f1f3f5)", padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "upload" ? "var(--bg-card, #fff)" : "transparent",
              color: activeTab === "upload" ? "var(--text-primary, #0f172a)" : "var(--text-secondary, #64748b)",
              boxShadow: activeTab === "upload" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "preview" ? "var(--bg-card, #fff)" : "transparent",
              color: activeTab === "preview" ? "var(--text-primary, #0f172a)" : "var(--text-secondary, #64748b)",
              boxShadow: activeTab === "preview" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Pages ({pages.length})
          </button>
          <button
            onClick={() => setActiveTab("export")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "export" ? "var(--bg-card, #fff)" : "transparent",
              color: activeTab === "export" ? "var(--text-primary, #0f172a)" : "var(--text-secondary, #64748b)",
              boxShadow: activeTab === "export" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Convert & Export
          </button>
        </div>
      </div>

      {/* ─ CONTENT BODY ─ */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24, maxWidth: 960, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {/* TAB 1: UPLOAD & CAPTURE */}
        {activeTab === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                border: "2px dashed var(--border-color, rgba(0,0,0,0.15))",
                borderRadius: 20,
                padding: "48px 24px",
                textAlign: "center",
                background: "var(--bg-card, rgba(255,255,255,0.02))",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleAddFiles(e.dataTransfer.files);
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: "rgba(225,29,72,0.1)",
                  color: "#e11d48",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <FileUp size={32} />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>
                Drop image files here or browse
              </h3>
              <p style={{ margin: "0 0 20px", color: "var(--text-secondary, #64748b)", fontSize: 13 }}>
                Supports JPG, PNG, Screenshots & Scanned Document Pages
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 12,
                    background: "#e11d48",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ImageIcon size={16} /> Choose Images
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 12,
                    background: "var(--bg-chip, #f1f3f5)",
                    color: "var(--text-primary, #0f172a)",
                    border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Camera size={16} /> Take Photo
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleAddFiles(e.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleAddFiles(e.target.files)}
            />

            {/* Features callout */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              <div style={{ padding: 16, borderRadius: 16, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, rgba(0,0,0,0.08))" }}>
                <FileText size={24} color="#e11d48" style={{ marginBottom: 10 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800 }}>Convert to PDF</h4>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
                  Multi-page A4 PDF embedding full resolution scans and clean layout preservation.
                </p>
              </div>
              <div style={{ padding: 16, borderRadius: 16, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, rgba(0,0,0,0.08))" }}>
                <FileCode size={24} color="#0284c7" style={{ marginBottom: 10 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800 }}>Convert to Word (.docx)</h4>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
                  Reconstructs headings, paragraphs, and text lines into fully editable DOCX files.
                </p>
              </div>
              <div style={{ padding: 16, borderRadius: 16, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, rgba(0,0,0,0.08))" }}>
                <FileSpreadsheet size={24} color="#059669" style={{ marginBottom: 10 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800 }}>Convert to Excel (.xlsx)</h4>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
                  Detects rows, columns, numbers, and data grids into workbook spreadsheets.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAGE PREVIEW & REORDER */}
        {activeTab === "preview" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>
                {pages.length} Page{pages.length !== 1 ? "s" : ""} in queue
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 10,
                    background: "var(--bg-chip, #f1f3f5)",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Plus size={14} /> Add More
                </button>
                <button
                  onClick={() => setActiveTab("export")}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 10,
                    background: "#e11d48",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Proceed to Export <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {pages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted, #94a3b8)" }}>
                <p>No pages added yet.</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  style={{ padding: "8px 16px", borderRadius: 10, background: "#e11d48", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                >
                  Upload Images
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      position: "relative",
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                      background: "var(--bg-card, #fff)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ aspectRatio: "3/4", width: "100%", overflow: "hidden", background: "#000" }}>
                      <img src={p.uri} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>Page {idx + 1}</span>
                      <button
                        onClick={() => removePage(p.id)}
                        style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONVERT & EXPORT */}
        {activeTab === "export" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title setting */}
            <div style={{ background: "var(--bg-card, #fff)", padding: 20, borderRadius: 16, border: "1px solid var(--border-color, rgba(0,0,0,0.08))" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text-secondary, #64748b)" }}>
                Document Title
              </label>
              <input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document name…"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color, rgba(0,0,0,0.12))",
                  fontSize: 15,
                  fontWeight: 700,
                  background: "var(--bg-input, transparent)",
                  color: "var(--text-primary, inherit)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Choose Format */}
            <div style={{ background: "var(--bg-card, #fff)", padding: 20, borderRadius: 16, border: "1px solid var(--border-color, rgba(0,0,0,0.08))" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 12, color: "var(--text-secondary, #64748b)" }}>
                Select Output Format
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {[
                  { id: "pdf", label: "PDF Document", ext: ".pdf", icon: FileText, color: "#e11d48", desc: "Preserves exact page images & visual layout" },
                  { id: "word", label: "Word Document", ext: ".docx", icon: FileCode, color: "#0284c7", desc: "Reconstructs editable text paragraphs & headings" },
                  { id: "excel", label: "Excel Spreadsheet", ext: ".xlsx", icon: FileSpreadsheet, color: "#059669", desc: "Detects tables, rows, columns & numbers" },
                ].map((fmt) => {
                  const isSelected = exportFormat === fmt.id;
                  const Icon = fmt.icon;
                  return (
                    <div
                      key={fmt.id}
                      onClick={() => setExportFormat(fmt.id as any)}
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        border: `2px solid ${isSelected ? fmt.color : "var(--border-color, rgba(0,0,0,0.08))"}`,
                        background: isSelected ? "rgba(225,29,72,0.04)" : "var(--bg-input, transparent)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Icon size={20} color={fmt.color} />
                        <strong style={{ fontSize: 14 }}>{fmt.label}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary, #64748b)" }}>{fmt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OCR Review trigger if Word or Excel chosen */}
            {(exportFormat === "word" || exportFormat === "excel") && (
              <div style={{ background: "var(--bg-card, #fff)", padding: 20, borderRadius: 16, border: "1px solid var(--border-color, rgba(0,0,0,0.08))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>OCR Recognition & Review</h4>
                    <small style={{ color: "var(--text-secondary, #64748b)" }}>
                      Extract text from pages before exporting to {exportFormat.toUpperCase()}
                    </small>
                  </div>
                  <button
                    onClick={runOcrOnAllPages}
                    disabled={isProcessing}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: "rgba(225,29,72,0.12)",
                      color: "#e11d48",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} /> Run OCR Layout Extraction
                  </button>
                </div>

                {extractedText ? (
                  <textarea
                    value={extractedText}
                    onChange={(e) => {
                      setExtractedText(e.target.value);
                      setEditableRows(parseTableFromText(e.target.value));
                    }}
                    rows={6}
                    placeholder="Extracted document text…"
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid var(--border-color, rgba(0,0,0,0.12))",
                      fontSize: 13,
                      background: "var(--bg-input, transparent)",
                      color: "var(--text-primary, inherit)",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                    }}
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted, #94a3b8)" }}>
                    Click "Run OCR Layout Extraction" to preview and edit text before creating your file.
                  </p>
                )}
              </div>
            )}

            {/* Status bar */}
            {statusMessage && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(2,132,199,0.1)", color: "#0284c7", fontSize: 13, fontWeight: 700 }}>
                {statusMessage}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleExport}
                disabled={isProcessing || pages.length === 0}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: 14,
                  background: "#e11d48",
                  color: "#fff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 16px rgba(225,29,72,0.3)",
                }}
              >
                <Download size={18} />
                {isProcessing ? "Processing & Converting…" : `Convert & Download ${exportFormat.toUpperCase()}`}
              </button>

              {extractedText && onSaveToNotes && (
                <button
                  onClick={() => {
                    onSaveToNotes(extractedText, docTitle);
                    alert("Saved to OWNLY Notes!");
                  }}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: "var(--bg-chip, #f1f3f5)",
                    color: "var(--text-primary, inherit)",
                    border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Save size={16} /> Save to Notes
                </button>
              )}
            </div>

            {successSaved && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 13, fontWeight: 700 }}>
                <Check size={16} /> File converted and saved directly to your OWNLY Workspace!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
