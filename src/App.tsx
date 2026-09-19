import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
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
const WorkspaceAssistant = lazy(() => import('./components/WorkspaceAssistant').then((module) => ({ default: module.WorkspaceAssistant })));

const HomeSection = lazy(() => import('./components/HomeSection').then((module) => ({ default: module.HomeSection })));
const NotesSection = lazy(() => import('./components/NotesSection').then((module) => ({ default: module.NotesSection })));
const UploadSection = lazy(() => import('./components/UploadSection').then((module) => ({ default: module.UploadSection })));
const CameraSection = lazy(() => import('./components/CameraSection').then((module) => ({ default: module.CameraSection })));
const LinkSection = lazy(() => import('./components/LinkSection').then((module) => ({ default: module.LinkSection })));

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile>(initialUserProfile);

  const isAdminRoute = window.location.pathname === '/admin';

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('ownly_notes');
    return saved ? JSON.parse(saved) : initialNotes;
  });

  const [images, setImages] = useState<UploadedImageItem[]>(() => {
    const saved = localStorage.getItem('ownly_images');
    return saved ? JSON.parse(saved) : initialImages;
  });

  const [links, setLinks] = useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('ownly_links');
    if (!saved) return initialLinks;
    return JSON.parse(saved);
  });

  const [selectedNoteToEdit, setSelectedNoteToEdit] = useState<NoteItem | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const profile = await api.getUserProfile();
        setIsAuthenticated(true);
        setUser(profile);
        setCloudReady(true);
      } catch (e) {
        setIsAuthenticated(false);
        setCloudReady(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('ownly_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ownly_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('ownly_images', JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    localStorage.setItem('ownly_links', JSON.stringify(links));
  }, [links]);

  const handleLoginSuccess = (profile: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...profile }));
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setIsAuthenticated(false);
    setIsAccountDrawerOpen(false);
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setUser((previous) => ({ ...previous, ...updates }));
    try {
      await api.updateUserProfile(updates as any);
    } catch (error) {
      console.warn('Profile update error:', error);
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
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleExportData = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      notes,
      images,
      links,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OWNLY_Workspace_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetWorkspace = () => {
    if (confirm('Restore all default sample notes, images, and video links?')) {
      setNotes(initialNotes);
      setImages(initialImages);
      setLinks(initialLinks);
      setUser(initialUserProfile);
    }
  };

  if (!isAuthenticated) {
    return <Suspense fallback={<div className="ownly-loading min-h-screen" role="status">Loading access…</div>}><LoginPage onLoginSuccess={handleLoginSuccess} /></Suspense>;
  }

  // Admin route must render immediately — never block with loading screen
  if (isAdminRoute) {
    return <AdminPanel />;
  }

  if (!cloudReady) {
    return (
      <div className="ownly-loading min-h-screen" role="status">
        <div className="text-center px-6">
          <div className="text-white font-bold mb-2">Connecting to your cloud workspace…</div>
          <div className="text-white/50 text-xs max-w-sm">Your workspace will appear after loading your data, so another device sees the same content.</div>
          {cloudError && <div className="mt-4 text-[#ff6a7e] text-xs max-w-md">{cloudError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      {isAdminRoute ? (
        <AdminPanel />
      ) : (
        <>
          <Header 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenAccount={() => setIsAccountDrawerOpen(true)}
          />

          <main className="pt-20 px-4 pb-12 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomeSection user={user} />
                </motion.div>
              )}
              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NotesSection 
                    notes={notes} 
                    setNotes={setNotes} 
                    selectedNoteToEdit={selectedNoteToEdit}
                    setSelectedNoteToEdit={setSelectedNoteToEdit}
                  />
                </motion.div>
              )}
              {activeTab === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UploadSection 
                    images={images} 
                    setImages={setImages} 
                  />
                </motion.div>
              )}
              {activeTab === 'scan' && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CameraSection 
                    images={images} 
                    setImages={setImages} 
                  />
                </motion.div>
              )}
              {activeTab === 'links' && (
                <motion.div
                  key="links"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LinkSection 
                    links={links} 
                    setLinks={setLinks} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <div 
            className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-50"
            onClick={() => window.location.href = '/admin'}
          >
            <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800 text-[10px] text-zinc-600">
              Admin
            </div>
          </div>

          <AccountDrawer 
            isOpen={isAccountDrawerOpen} 
            onClose={() => setIsAccountDrawerOpen(false)} 
            user={user} 
            setUser={setUser} 
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
            onLogout={handleLogout}
          />
        </>
      )}
    </div>
  );
}
