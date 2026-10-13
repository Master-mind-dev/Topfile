# OWNLY - All-in-One Smart Productivity & Study Hub

OWNLY is a full-stack, cloud-connected productivity application featuring document scanning with AI OCR, file management, embedded video & resource streaming, interactive notes, real-time collaboration, and administrative user controls.

---

## 📱 How to Install on Your Phone (Android & iPhone)

OWNLY is built as a Progressive Web App (PWA). You don't need app stores to install it!

### Android (Chrome / Brave / Edge)
1. Open your OWNLY deployment https://topfile.onrender.com URL in Chrome (e.g. your Render or custom domain URL).
2. Tap the **three dots menu (⋮)** in the top right corner.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. Confirm by tapping **Add**. The OWNLY app icon will appear on your phone's home screen with full-screen support, offline caching, and instant native camera access.

### iPhone / iPad (Safari)
1. Open your OWNLY deployment URL https://topfile.onrender.com in **Safari**.
2. Tap the **Share icon** (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top right corner. OWNLY will now open like a native iOS application.

---

## 💻 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Git](https://git-scm.com/)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Prajwal-08/New_ownly.git
cd New_ownly
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Application

**Option A: Full-Stack Mode (Frontend + Backend + Proxy Server)**
```bash
npm run build
npm start
```
The app will run at `http://localhost:5000` (or `http://localhost:3000`).

**Option B: Frontend Development Mode (Hot-Reload)**
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚀 Deploying to Render (Frontend + Backend)

This repository includes a production-ready `render.yaml` configuration that automatically deploys both the frontend and backend on Render:

1. Push your changes to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), choose **New +** -> **Blueprint**.
3. Select this repository.
4. Render automatically configures:
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `node server.js`
   - **Environment:** Sets up PostgreSQL and file storage.
5. Once deployed, Render will provide your live HTTPS URL. Both the API and client run seamlessly together.

---

## 📷 Features & Highlights
- **Smart Phone Camera & Scanner:** Multi-fallback camera stream with native phone camera shutter fallback for document scanning & OCR.
- **Embedded Player & Proxy:** Stream YouTube, Google Drive, and educational videos smoothly inside the app without forced redirects.
- **Auto-Rotation & Fullscreen:** Mobile responsive screen adjustments with landscape/portrait video toggles.
- **Notes & Uploads:** Quick document viewer with blur-free PDF rendering and responsive navigation.
- **Admin Management:** Secure role-based user authentication and data administration.
