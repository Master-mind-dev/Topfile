# Deployment Guide: Ownly App

This guide walks you through deploying the Ownly application to GitHub and Render.

## Prerequisites

- GitHub account
- Render account (render.com)
- Git installed locally
- Node.js 18+ installed locally

---

## Step 1: Initialize Git & Push to GitHub

### 1.1 Initialize local Git repository

```bash
cd /path/to/New_ownly
git init
git add .
git commit -m "Initial commit: Ownly app setup"
```

### 1.2 Create a new repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name your repo: `ownly` (or any name you prefer)
3. Click "Create repository"
4. **Do NOT** initialize with README, .gitignore, or license (we already have them)

### 1.3 Link local repo to GitHub

Copy and run these commands (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/ownly.git
git branch -M main
git push -u origin main
```

### Verify

Go to `https://github.com/YOUR_USERNAME/ownly` and confirm all files are uploaded.

---

## Step 2: Configure Environment Variables

### 2.1 Create `.env` file locally (for development)

Copy `.env.example` and add your Firebase credentials:

```bash
cp .env.example .env
```

Edit `.env` and fill in your Firebase project details:

```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note:** `.env` is in `.gitignore` and will NOT be pushed to GitHub (secure ✓)

### 2.2 Test locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and verify the app works.

---

## Step 3: Deploy to Render

### 3.1 Connect GitHub to Render

1. Go to [render.com](https://render.com) and sign up/log in
2. Click "New +" → "Web Service"
3. Click "Connect repository"
4. Authorize Render to access your GitHub
5. Select your `ownly` repository

### 3.2 Configure deployment settings

- **Name:** `ownly-app` (or any name)
- **Runtime:** Node
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Plan:** Free (or upgrade as needed)

### 3.3 Add Environment Variables

In Render, go to **Environment** and add these variables:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |
| `NODE_ENV` | `production` |

### 3.4 Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Once complete, you'll get a live URL (e.g., `ownly-app.onrender.com`)

### 3.5 Enable Auto-Deploy (optional)

Go to **Settings** → Enable "Auto-Deploy" so every GitHub push automatically redeploys.

---

## Step 4: Verify Deployment

1. Visit your Render URL: `https://ownly-app.onrender.com`
2. Check that the app loads and Firebase is working
3. Test login, upload, and data features

---

## Troubleshooting

### Build fails with "Cannot find module"
- Ensure all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

### App crashes after deploy
- Check Render logs: **Settings** → **Logs**
- Verify all environment variables are set correctly
- Check that Firebase rules allow the Render domain

### Firebase authentication fails
- Ensure Firebase has Render domain whitelisted
- Check Firebase Console → Authentication → Authorized Domains
- Add `ownly-app.onrender.com` to authorized domains

### Cold start delays
- Free Render tier sleeps after 15 min inactivity. Upgrade to remove this.

---

## Updating After Deployment

### Push new changes to GitHub

```bash
git add .
git commit -m "Update: [your change description]"
git push origin main
```

Render will automatically redeploy if Auto-Deploy is enabled.

---

## Support

For issues:
- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Firebase Docs:** [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vite Docs:** [vitejs.dev](https://vitejs.dev)

Happy deploying! 🚀
