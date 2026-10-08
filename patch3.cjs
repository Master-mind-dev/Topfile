const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('@cyntler/react-doc-viewer')) {
  code = code.replace(
    `import { ChangeEvent, FormEvent, ReactNode, useState, useEffect } from "react";`,
    `import { ChangeEvent, FormEvent, ReactNode, useState, useEffect } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";`
  );
}

// Update initialFiles to have full path/url
code = code.replace(
  `const initialFiles = [
  { name: "Bio_Notes_Ch4.pdf", meta: "PDF · 2.4 MB · Today", color: "rose" },
  { name: "History_Diagram.png", meta: "PNG · 840 KB · Yesterday", color: "cyan" },
  { name: "Calculus_Worksheet.docx", meta: "DOCX · 180 KB · Sep 28", color: "yellow" },
  { name: "Organic_Chemistry_Lab.pdf", meta: "PDF · 4.1 MB · Sep 26", color: "green" },
];`,
  `const initialFiles = [
  { name: "Sample.pdf", uri: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", meta: "PDF · 2.4 MB · Today", color: "rose" },
  { name: "Sample_Doc.docx", uri: "https://files.testfile.org/PDF/50MB-TESTFILE.ORG.pdf", meta: "DOCX · 180 KB · Sep 28", color: "yellow" },
];`
);

// Update UploadsScreen to have viewer
code = code.replace(
  `function UploadsScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [files, setFiles] = useState(initialFiles);`,
  `function UploadsScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [files, setFiles] = useState<any[]>(initialFiles);
  const [viewingFile, setViewingFile] = useState<any>(null);`
);

code = code.replace(
  `const visibleFiles = files.filter((file) =>
    file.name.toLowerCase().includes(query.toLowerCase()),
  );`,
  `const visibleFiles = files.filter((file) =>
    file.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (viewingFile) {
    return (
      <main className="app-screen screen-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <header className="topbar">
          <button onClick={() => setViewingFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Icon name="arrow-left" size={24} />
          </button>
          <div className="topbar-title">
            <strong>{viewingFile.name}</strong>
          </div>
          <span style={{ width: 24 }} />
        </header>
        <div style={{ flex: 1, position: 'relative' }}>
          <DocViewer
            documents={[{ uri: viewingFile.uri || window.URL.createObjectURL(viewingFile.file), fileName: viewingFile.name }]}
            pluginRenderers={DocViewerRenderers}
            style={{ width: '100%', height: '100%' }}
            config={{ header: { disableHeader: true } }}
          />
        </div>
      </main>
    );
  }`
);

// Handle file addition properly
code = code.replace(
  `      ...selected.map((file) => ({
        name: file.name,
        meta: \`\${file.type.split("/").pop()?.toUpperCase() || "FILE"} · \${Math.max(
          1,
          Math.round(file.size / 1024),
        )} KB · Just now\`,
        color: "yellow",
      })),`,
  `      ...selected.map((file) => ({
        name: file.name,
        file: file,
        meta: \`\${file.type.split("/").pop()?.toUpperCase() || "FILE"} · \${Math.max(
          1,
          Math.round(file.size / 1024),
        )} KB · Just now\`,
        color: "yellow",
      })),`
);

// Handle clicking a file to view
code = code.replace(
  `<article className="file-row interactive-box" key={\`\${file.name}-\${index}\`}>`,
  `<article className="file-row interactive-box" key={\`\${file.name}-\${index}\`} onClick={() => setViewingFile(file)} style={{ cursor: 'pointer' }}>`
);

// Prevent delete button click from triggering view
code = code.replace(
  `onClick={() =>
                  setFiles((current) => current.filter((item) => item !== file))
                }`,
  `onClick={(e) => {
                  e.stopPropagation();
                  setFiles((current) => current.filter((item) => item !== file));
                }}`
);


fs.writeFileSync(path, code);
console.log('Uploads file viewer patched.');
