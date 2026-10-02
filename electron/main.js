const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Ownly',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: true,
    backgroundColor: '#0d0608',
    show: false, // Don't show until ready
  });

  // Show window when fully loaded (avoids white flash)
  win.once('ready-to-show', () => {
    win.show();
  });

  // The app is a PWA hosted on Render — load it from the live URL.
  // This means the user always gets the latest version without needing to update the app.
  win.loadURL('https://topfile.onrender.com');

  // Open external links (YouTube, etc.) in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://topfile.onrender.com') || url.startsWith('http://topfile.onrender.com')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Remove menu bar entirely
  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
