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
import { useRealtimeSync } from './hooks/useRealtimeSync';

const AccountDrawer = lazy(() => import('./components/AccountDrawer').then((module) => ({ default: module.AccountDrawer })));
const LoginPage = lazy(() => import('./components/LoginPage').then((module) => ({ default: module.LoginPage })));

const HomeSection = lazy(() => import('./components/HomeSection').then((module) => ({ default: module.HomeSection })));
const NotesSection = lazy(() => import('./components/NotesSection').then((module) => ({ default: module.NotesSection })));
const UploadSection = lazy(() => import('./components/UploadSection').then((module) => ({ default: module.UploadSection })));
const CameraSection = lazy(() => import('./components/CameraSection').then((module) => ({ default: module.CameraSection })));
const LinkSection = lazy(() => import('./components/LinkSection').then((module) => ({ default: module.LinkSection })));

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
};
const pageTransition = { duration: 0.22, ease: "easeOut" as const };

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

  // ── Real-time sync: update state when another device makes a change ──
  useRealtimeSync(isAuthenticated, {
    onNoteCreated: (note) =>
      setNotes((prev) => prev.some((n) => n.id === note.id) ? prev : [note, ...prev]),
    onNoteUpdated: (note) =>
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, ...note } : n)),
    onNoteDeleted: (id) =>
      setNotes((prev) => prev.filter((n) => n.id !== id)),
    onImageCreated: (image) =>
      setImages((prev) => prev.some((i) => i.id === image.id) ? prev : [image, ...prev]),
    onImageDeleted: (id) =>
      setImages((prev) => prev.filter((i) => i.id !== id)),
    onLinkCreated: (link) =>
      setLinks((prev) => prev.some((l) => l.id === link.id) ? prev : [link, ...prev]),
    onLinkDeleted: (id) =>
      setLinks((prev) => prev.filter((l) => l.id !== id)),
    onProfileUpdated: (updatedUser) => {
      setUser((prev) => ({ ...prev, ...updatedUser }));
      localStorage.setItem('ownly_user', JSON.stringify(updatedUser));
    },
  });

  // Load data from backend when authenticated
  const loadUserData = async () => {
    const token = localStorage.getItem('ownly_auth_token');
    if (!token) return;
    try {
      const [fetchedNotes, fetchedImages, fetchedLinks, profile] = await Promise.allSettled([
        api.getNotes(),
        api.getImages(),
        api.getLinks(),
        api.getUserProfile(),
      ]);

      if (fetchedNotes.status === 'fulfilled' && Array.isArray(fetchedNotes.value)) {
        setNotes(fetchedNotes.value);
      }
      if (fetchedImages.status === 'fulfilled' && Array.isArray(fetchedImages.value)) {
        setImages(fetchedImages.value);
      }
      if (fetchedLinks.status === 'fulfilled' && Array.isArray(fetchedLinks.value)) {
        setLinks(fetchedLinks.value);
      }
      if (profile.status === 'fulfilled' && profile.value) {
        setUser((prev) => ({ ...prev, ...profile.value }));
      }
    } catch (err) {
      console.warn('Failed to load user workspace data from server:', err);
    }
  };

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('ownly_auth_token');
      
      if (token) {
        setIsAuthenticated(true);
        try {
          await loadUserData();
        } catch {
          setCloudError('Offline — using cached data. Some changes may not sync.');
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
    loadUserData();
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
      console.warn('Profile update fallback:', e);
    }
  };

  if (isCheckingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0608] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/40 text-xs tracking-widest uppercase font-bold">OWNLY</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0d0608] flex items-center justify-center text-white/50 text-xs">Loading…</div>}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-[#0d0608] text-white font-['Outfit'] relative selection:bg-red-500/30">
      {/* Figma Ambient Glow Mesh (Exact from Figma spec) */}
      <div className="ambient-glow-mesh">
        <div className="ambient-glow-1" />
        <div className="ambient-glow-2" />
        <div className="ambient-glow-cyan" />
      </div>

      {/* Main Header (Desktop + Mobile Navigation) */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAccount={() => setIsAccountDrawerOpen(true)}
      />

      {cloudError && (
        <div className="sticky top-[78px] z-30 px-4 py-1.5 bg-red-500/10 border-b border-red-500/20 text-xs text-red-200 text-center backdrop-blur-md">
          <span className="font-semibold">Notice:</span> {cloudError}
        </div>
      )}

      {/* Main Page Content Container */}
      <main className="relative z-10 pt-4 px-4 sm:px-6 md:px-8 max-w-[1280px] mx-auto">
        <Suspense fallback={<div className="py-20 text-center text-white/40 text-sm">Loading workspace…</div>}>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <HomeSection
                  user={user}
                  notes={notes}
                  images={images}
                  links={links}
                  setActiveTab={setActiveTab}
                  onOpenNote={(note) => {
                    setSelectedNoteToEdit(note);
                    setActiveTab('notes');
                  }}
                />
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
                  onOpenCamera={() => setActiveTab('scan')}
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

      {/* Account Profile Drawer */}
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
