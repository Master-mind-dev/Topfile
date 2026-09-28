import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Header } from './components/Header';
import { 
  TabType, 
  UserProfile, 
  NoteItem, 
  UploadedImageItem, 
  LinkItem 
} from './types';
import { 
  initialUserProfile, 
  initialNotes, 
  initialImages, 
  initialLinks 
} from './data/mockData';
import { AnimatePresence, motion } from 'motion/react';
import * as api from './lib/api';
import { AdminPanel } from './components/AdminPanel';

const AccountDrawer = lazy(() => import('./components/AccountDrawer').then((module) => ({ default: module.AccountDrawer })));
const LoginPage = lazy(() => import('./components/LoginPage').then((module) => ({ default: module.LoginPage })));

const HomeSection = lazy(() => import('./components/HomeSection').then((module) => ({ default: module.HomeSection })));
const NotesSection = lazy(() => import('./components/NotesSection').then((module) => ({ default: module.NotesSection })));
const UploadSection = lazy(() => import('./components/UploadSection').then((module) => ({ default: module.UploadSection })));
const CameraSection = lazy(() => import('./components/CameraSection').then((module) => ({ default: module.CameraSection })));
const LinkSection = lazy(() => import('./components/LinkSection').then((module) => ({ default: module.LinkSection })));

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.99 },
};
const pageTransition = { duration: 0.28, ease: "easeOut" };

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [cloudError, setCloudError] = useState('');

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ownly_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialUserProfile; }
    }
    return initialUserProfile;
  });

  const isAdminRoute = window.location.pathname === '/admin';

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('ownly_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialNotes; }
    }
    return initialNotes;
  });

  const [images, setImages] = useState<UploadedImageItem[]>(() => {
    const saved = localStorage.getItem('ownly_images');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialImages; }
    }
    return initialImages;
  });

  const [links, setLinks] = useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('ownly_links');
    if (!saved) return initialLinks;
    try { return JSON.parse(saved); } catch { return initialLinks; }
  });

  const [selectedNoteToEdit, setSelectedNoteToEdit] = useState<NoteItem | null>(null);

  // Camera open handler for UploadSection capture button
  const handleOpenCamera = () => {
    setActiveTab('scan');
  };

  // Auth check — never blocks UI if backend unavailable
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('ownly_auth_token');
      const saved = localStorage.getItem('ownly_user');
      
      // If we have local data, let them in immediately
      if (saved || token) {
        setIsAuthenticated(true);
      }

      if (token) {
        try {
          const profile = await api.getUserProfile();
          setUser((prev) => ({ ...prev, ...profile }));
        } catch {
          // Backend offline — still authenticated locally
          setCloudError('Offline mode — using local workspace data.');
        }
      }
      
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // Persist all state to localStorage
  useEffect(() => { localStorage.setItem('ownly_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('ownly_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('ownly_images', JSON.stringify(images)); }, [images]);
  useEffect(() => { localStorage.setItem('ownly_links', JSON.stringify(links)); }, [links]);

  const handleLoginSuccess = (profile: Partial<UserProfile>) => {
    const newUser = { ...user, ...profile };
    setUser(newUser);
    localStorage.setItem('ownly_user', JSON.stringify(newUser));
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('ownly_auth_token');
    setIsAuthenticated(false);
    setIsAccountDrawerOpen(false);
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('ownly_user', JSON.stringify(updated));
    try { await api.updateUserProfile(updates); } catch (e) {
      console.warn('Profile update to backend failed (offline):', e);
    }
  };

  const handleAddNote = (newNote: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const note: NoteItem = {
      ...newNote,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
  };

  const handleUpdateNote = (id: string, updates: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleUploadImages = (newImages: UploadedImageItem[]) => {
    setImages((prev) => [...newImages, ...prev]);
    setUser((prev) => ({
      ...prev,
      storageUsedMb: Number((prev.storageUsedMb + newImages.length * 0.8).toFixed(1)),
    }));
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSaveCapturedImage = (capturedImg: UploadedImageItem) => {
    setImages((prev) => [capturedImg, ...prev]);
    setUser((prev) => ({
      ...prev,
      storageUsedMb: Number((prev.storageUsedMb + 0.7).toFixed(1)),
    }));
  };

  const handleAddLink = (newLink: LinkItem) => {
    // Prevent duplicate URLs
    setLinks((prev) => {
      const exists = prev.some((l) => l.url === newLink.url);
      if (exists) return prev;
      return [newLink, ...prev];
    });
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  // Show spinner only during initial auth check
  if (isCheckingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#d9ad52]/30 border-t-[#d9ad52] rounded-full animate-spin" />
          <p className="text-white/40 text-xs tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="ownly-loading min-h-screen" role="status">Loading access…</div>}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  // Admin route
  if (isAdminRoute) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#d9ad52]/30">
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAccount={() => setIsAccountDrawerOpen(true)}
      />

      {cloudError && (
        <div className="sticky top-[72px] z-30 px-4 py-2 bg-[#d9ad52]/10 border-b border-[#d9ad52]/30 text-xs text-[#d9ad52] text-center backdrop-blur-md">
          <span className="font-semibold">Offline Mode:</span> {cloudError}
        </div>
      )}

      <main className="pt-4 px-3 sm:px-6 pb-16 max-w-7xl mx-auto">
        <Suspense fallback={<div className="ownly-loading" role="status" />}>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <HomeSection user={user} notes={notes} images={images} links={links} setActiveTab={setActiveTab} />
              </motion.div>
            )}
            {activeTab === 'notes' && (
              <motion.div key="notes" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <NotesSection
                  notes={notes}
                  setNotes={setNotes}
                  selectedNoteToEdit={selectedNoteToEdit}
                  setSelectedNoteToEdit={setSelectedNoteToEdit}
                />
              </motion.div>
            )}
            {activeTab === 'upload' && (
              <motion.div key="upload" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <UploadSection
                  images={images}
                  setImages={setImages}
                  onOpenCamera={handleOpenCamera}
                />
              </motion.div>
            )}
            {activeTab === 'scan' && (
              <motion.div key="scan" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <CameraSection
                  images={images}
                  setImages={setImages}
                />
              </motion.div>
            )}
            {activeTab === 'links' && (
              <motion.div key="links" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <LinkSection
                  links={links}
                  setLinks={setLinks}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Hidden admin portal link */}
      <div
        className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-50"
        onClick={() => window.location.href = '/admin'}
      >
        <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800 text-[10px] text-zinc-600">
          Admin
        </div>
      </div>

      <Suspense fallback={null}>
        <AccountDrawer
          isOpen={isAccountDrawerOpen}
          onClose={() => setIsAccountDrawerOpen(false)}
          user={user}
          setUser={setUser}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      </Suspense>
    </div>
  );
}
