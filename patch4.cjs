const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Editor Screen
const editorInsertLogic = `
  const insertMedia = (type: 'image' | 'video', file: File) => {
    const url = URL.createObjectURL(file);
    const mediaHtml = type === 'image' 
      ? \`<img src="\${url}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />\`
      : \`<video src="\${url}" controls style="max-width: 100%; border-radius: 8px; margin: 10px 0;"></video>\`;
    document.execCommand('insertHTML', false, mediaHtml + '<p><br/></p>');
    setSaved(false);
  };
  const handleImage = (e: any) => e.target.files?.[0] && insertMedia('image', e.target.files[0]);
  const handleVideo = (e: any) => e.target.files?.[0] && insertMedia('video', e.target.files[0]);
`;

code = code.replace(
  `function EditorScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [saved, setSaved] = useState(true);`,
  `function EditorScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [saved, setSaved] = useState(true);
  ${editorInsertLogic}`
);

code = code.replace(
  `<div className="insert-tools">
          <button type="button" aria-label="Add attachment">
            <Icon name="paperclip" size={19} />
          </button>
          <button type="button" aria-label="Add image">
            <Icon name="image" size={19} />
          </button>
        </div>`,
  `<div className="insert-tools">
          <label aria-label="Add video" style={{ cursor: 'pointer', padding: 8 }}>
            <Icon name="camera" size={19} />
            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideo} />
          </label>
          <label aria-label="Add image" style={{ cursor: 'pointer', padding: 8 }}>
            <Icon name="image" size={19} />
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          </label>
        </div>`
);


// 2. Links Screen
code = code.replace(
  `function LinksScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {`,
  `function LinksScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [editingLink, setEditingLink] = useState<any>(null);`
);

code = code.replace(
  `<article className="link-row interactive-box" key={\`\${link.url}-\${index}\`}>
              <span className={\`file-icon \${link.color}\`}>
                <Icon name="link" size={18} />
              </span>
              <span>
                <strong>{link.title}</strong>
                <b>{link.url}</b>
                <small>{link.description}</small>
              </span>
              <button
                type="button"
                aria-label={\`Open \${link.title}\`}
                onClick={() =>
                  window.open(
                    link.url.startsWith("http") ? link.url : \`https://\${link.url}\`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                <Icon name="arrow-right" size={17} />
              </button>
            </article>`,
  `<article className="link-row interactive-box" key={\`\${link.url}-\${index}\`} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
              <div style={{ width: '100%', height: 160, background: '#eee', borderRadius: 12, overflow: 'hidden', position: 'relative' }}
                   onClick={() => window.open(link.url.startsWith("http") ? link.url : \`https://\${link.url}\`, "_blank")}>
                {link.url.includes("youtube.com") || link.url.includes("youtu.be") ? 
                  <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400&h=200" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="link" size={40} /></div>}
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>10:24</div>
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {editingLink === index ? (
                    <input autoFocus defaultValue={link.title} onBlur={(e) => {
                      const newLinks = [...links];
                      newLinks[index].title = e.target.value;
                      setLinks(newLinks);
                      setEditingLink(null);
                    }} style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 4 }} />
                  ) : (
                    <strong onClick={() => setEditingLink(index)} style={{ cursor: 'text' }}>{link.title}</strong>
                  )}
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{link.url} • {link.description}</div>
                </div>
              </div>
            </article>`
);

// 3. Document Scanner
code = code.replace(
  `{captured ? "Your page is clear, straightened, and ready to save."
                : "Hold your camera above a page. We’ll clean, crop, and sharpen it automatically."}`,
  `{captured ? "Your document has been converted to PDF. Ready to save." : "Hold your camera above a page. We’ll auto-detect edges, crop, and convert to PDF."}`
);

code = code.replace(
  `{captured ? "Perfect capture." : "Turn paper into study notes."}`,
  `{captured ? "Converted to PDF." : "Document Scanner"}`
);

fs.writeFileSync(path, code);
console.log('Done.');
