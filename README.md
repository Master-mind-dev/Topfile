# OWNLY — Your Personal Knowledge Space

<div align="center">

<svg width="80" height="80" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="44" height="44" rx="14" fill="#111111"/>
  <rect x="9" y="9" width="30" height="30" rx="8" fill="white" opacity="0.95"/>
  <path d="M24 13 L18 20 L24 27 L30 20 Z" fill="#9f1239"/>
  <rect x="22" y="27" width="4" height="9" rx="2" fill="#9f1239"/>
</svg>

**OWNLY** is a premium personal knowledge management app — notes, files, web links, camera scanner, and a connected knowledge graph, all in one place.

[![Live App](https://img.shields.io/badge/🌐_Live_App-Open-9f1239?style=for-the-badge)](https://master-mind-dev.github.io/Topfile/)
[![Download APK](https://img.shields.io/badge/📲_Download_APK-Latest-111111?style=for-the-badge)](#-download--install)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 Rich Text Notes | Bold, italic, H1/H2, lists, blockquote, code |
| 🌐 Connected Knowledge | Save web links, YouTube, PDFs with in-app viewer |
| 📷 Document Scanner | Capture → Enhance → OCR → PDF export |
| 📁 File Manager | Upload and organize any file type |
| 🔗 Links Manager | Bookmark and tag web links |
| 🌙 Dark Mode | Full system-wide dark/light toggle |
| 🔐 Auth | Login / Signup / Forgot password |
| 📱 Mobile-first | Optimized for all screen sizes |
| 🕸️ Knowledge Graph | Visual mind-map of your saved knowledge |

---

## 📲 Download & Install

### Option 1 — Use the Live Web App (Recommended)
The app works on **any device with a browser** — no install needed:

👉 **[Open OWNLY Web App](https://master-mind-dev.github.io/Topfile/)**

Sign in with your email and password — your data syncs across all your devices via the server.

---

### Option 2 — Install as PWA (Add to Home Screen)

#### On Android (Chrome):
1. Open the live app link above in **Chrome**
2. Tap the **⋮ menu** → **"Add to Home screen"**
3. Tap **Add** → The app icon appears on your home screen
4. Open it — it works like a native app!

#### On iPhone (Safari):
1. Open the link in **Safari**
2. Tap the **Share button** (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add** → Done ✅

#### On Desktop (Chrome/Edge):
1. Open the link
2. Click the **install icon** in the address bar (or go to ⋮ → "Install OWNLY")
3. Click **Install**

---

### Option 3 — Run Locally (Developer)

```bash
# Clone the repository
git clone https://github.com/Master-mind-dev/Topfile.git
cd Topfile

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Requirements: **Node.js 18+** and **npm 9+**

---

## 🔐 Multi-Device Sync

OWNLY syncs your data across all devices when you:
1. **Create an account** with email + password
2. **Log in** on any device (phone, tablet, PC)
3. Your notes, files, and knowledge base are **available everywhere**

> Data is stored server-side — never lost when you clear your browser.

---

## 🎨 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS with CSS variables (dark/light mode)
- **Storage**: localStorage + server API sync
- **PDF**: jsPDF
- **OCR**: Tesseract.js
- **Camera**: WebRTC / file input with `capture="environment"`

---

## 📸 Screenshots

> Open the app to see the full experience with dark mode, animations, and the connected knowledge graph.

---

## 🚀 Contributing

Pull requests welcome! For major changes, please open an issue first.

---

<div align="center">
Made with ❤️ · OWNLY © 2026
</div>
