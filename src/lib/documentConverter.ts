import { PDFDocument } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import * as _XLSX from "xlsx";
const XLSX = (_XLSX as any).default || _XLSX;

/**
 * Converts array of image files or data URIs to a multi-page PDF blob & download URL.
 */
export async function imagesToPdf(
  images: { uri: string; name?: string }[],
  docTitle = "OWNLY-Document"
): Promise<{ blob: Blob; url: string; sizeFormatted: string }> {
  if (images.length === 0) {
    throw new Error("Select at least one image.");
  }

  const pdf = await PDFDocument.create();

  for (const item of images) {
    let bytes: Uint8Array;
    let isPng = false;

    if (item.uri.startsWith("data:")) {
      isPng = item.uri.startsWith("data:image/png");
      const base64Data = item.uri.split(",")[1];
      const binaryString = atob(base64Data);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      const resp = await fetch(item.uri);
      const buf = await resp.arrayBuffer();
      bytes = new Uint8Array(buf);
      isPng = item.name?.toLowerCase().endsWith(".png") ?? false;
    }

    let image;
    try {
      image = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    } catch {
      // Fallback try the other format if magic bytes differ
      try {
        image = isPng ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
      } catch (err) {
        console.warn("Could not embed image into PDF:", err);
        continue;
      }
    }

    // Standard A4 size: 595.28 x 841.89 pt
    const page = pdf.addPage([595.28, 841.89]);
    const margin = 28;
    const availW = page.getWidth() - margin * 2;
    const availH = page.getHeight() - margin * 2;

    const scale = Math.min(availW / image.width, availH / image.height);
    const width = image.width * scale;
    const height = image.height * scale;

    page.drawImage(image, {
      x: (page.getWidth() - width) / 2,
      y: (page.getHeight() - height) / 2,
      width,
      height,
    });
  }

  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const sizeFormatted = (blob.size / 1024).toFixed(1) + " KB";

  return { blob, url, sizeFormatted };
}

/**
 * Downloads a Blob directly with chosen filename
 */
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts recognized text into a structured Word document (.docx)
 */
export async function textToWord(
  title: string,
  rawText: string,
  tablesData: string[][] = []
): Promise<{ blob: Blob; url: string; sizeFormatted: string }> {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  ];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace("# ", ""),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 100 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
          spacing: { after: 120 },
        })
      );
    }
  }

  // If table data is provided, add as a Word Table
  const sectionsChildren: (Paragraph | Table)[] = [...paragraphs];
  if (tablesData && tablesData.length > 0) {
    const tableRows = tablesData.map((row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              width: { size: 100 / Math.max(1, row.length), type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: cell || "" })],
            })
        ),
      })
    );

    const docxTable = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
    sectionsChildren.push(docxTable);
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const sizeFormatted = (blob.size / 1024).toFixed(1) + " KB";

  return { blob, url, sizeFormatted };
}

/**
 * Converts detected rows & text into an Excel workbook (.xlsx)
 */
export function exportToExcel(
  rows: (string | number)[][],
  filename = "OWNLY-Extracted.xlsx"
): { blob: Blob; url: string; sizeFormatted: string } {
  const safeRows = rows.length > 0 ? rows : [["Content"], ["No tabular data detected"]];
  const worksheet = XLSX.utils.aoa_to_sheet(safeRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted Data");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const sizeFormatted = (blob.size / 1024).toFixed(1) + " KB";

  return { blob, url, sizeFormatted };
}

/**
 * Intelligent parser: extracts tabular rows from raw OCR text
 * Detects patterns like CSV, tabs, pipes, or space-aligned columns
 */
export function parseTableFromText(text: string): (string | number)[][] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: (string | number)[][] = [];

  for (const line of lines) {
    let cells: string[] = [];
    if (line.includes("\t")) {
      cells = line.split("\t");
    } else if (line.includes("|")) {
      cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    } else if (line.includes(",") && line.split(",").length >= 2) {
      cells = line.split(",").map((c) => c.trim());
    } else {
      // Space separation with 2+ spaces or multiple words
      cells = line.split(/\s{2,}|\s{1,}(?=\d|\$)/).map((c) => c.trim());
    }

    if (cells.length > 0) {
      rows.push(
        cells.map((val) => {
          const num = Number(val.replace(/[$€,]/g, ""));
          return !isNaN(num) && val.trim() !== "" ? num : val;
        })
      );
    }
  }

  return rows.length > 0 ? rows : [["Extracted Text"], ...lines.map((l) => [l])];
}
