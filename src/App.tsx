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
  const mergeItems = <T extends { id: string }>(cloudItems: T[] | undefined, localItems: T[]) => {
    const cloud = cloudItems || [];
    const cloudIds = new Set(cloud.map((item) => item.id));
    return [...cloud, ...localItems.filter((item) => !cloudIds.has(item.id))];
  };

  // Persistence state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return false;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ownly_user');
    return saved ? JSON.parse(saved) : initialUserProfile;
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

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
    return JSON.parse(saved).map((link: LinkItem) => link.embedId === 'dQw4w9WgXcQ'
      ? {
          ...link,
          url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
          title: 'YouTube Player API Demo',
          description: 'A stable YouTube embed demo for testing playback inside OWNLY.',
          embedThumb: 'https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg',
          embedId: 'M7lc1UVf-VE',
        }
      : link);
  });

  const [selectedNoteToEdit, setSelectedNoteToEdit] = useState<NoteItem | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const cloudWritePendingRef = useRef(false);
  const cloudDataRef = useRef({ notes, images, links });

  cloudDataRef.current = { notes, images, links };

  // Listen to Auth state
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
          if (!isFirstSnapshot && cloudWritePendingRef.current) return;
          const data = snap.data() || {};
          if (isFirstSnapshot) {
            setNotes(mergeItems(data.notes, cloudDataRef.current.notes));
            setImages(mergeItems(data.images, cloudDataRef.current.images));
            setLinks(mergeItems(data.links, cloudDataRef.current.links));
            isFirstSnapshot = false;
          } else {
            if (data.notes) setNotes(data.notes);
            if (data.images) setImages(data.images);
            if (data.links) setLinks(data.links);
          }
          if (data.profile) setUser((previous) => ({ ...previous, ...data.profile }));
          setCloudReady(true);
          setCloudError('');
          setLastCloudSync(new Date().toLocaleTimeString());
        }, (error) => {
          console.warn('Firestore subscription:', error);
          setCloudError(`Cloud sync failed: ${error.code || 'permission denied'}. Deploy Firestore rules and use the same Firebase account.`);
          setCloudReady(false);
        });
      } else {
        setIsAuthenticated(false);
        setCloudReady(false);
      }
    });

    return () => {
      unsubscribeCloud();
      unsubscribe();
    };
  }, []);

  // Save to Firestore when authenticated
  useEffect(() => {
    const fbUser = auth.currentUser;
    if (fbUser && isAuthenticated && cloudReady) {
      const userDocRef = doc(db, 'users', fbUser.uid);
      cloudWritePendingRef.current = true;
      const syncTimer = window.setTimeout(() => setDoc(userDocRef, {
        notes,
        images,
        links,
        profile: user,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn('Firestore sync note:', err);
        cloudWritePendingRef.current = false;
        setCloudError(`Cloud save failed: ${err.code || 'permission denied'}.`);
      }).then(() => {
        cloudWritePendingRef.current = false;
        setLastCloudSync(new Date().toLocaleTimeString());
      }), 600);
      return () => window.clearTimeout(syncTimer);
    }
  }, [notes, images, links, user, isAuthenticated, cloudReady]);

  // Keep profile data local for resilience, but Firebase remains the auth source of truth.
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

  // Auth Handlers
  const handleLoginSuccess = (profile: Partial<UserProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...profile,
    }));
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout:', e);
    }
    setIsAuthenticated(false);
    setIsAccountDrawerOpen(false);
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setUser((previous) => ({ ...previous, ...updates }));
    if (auth.currentUser && updates.name) {
      updateProfile(auth.currentUser, { displayName: updates.name }).catch((error) => {
        console.warn('Firebase profile update:', error);
      });
    }
  };

  // Notes Handlers
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

  // Images Handlers
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

  // Camera Handler
  const handleSaveCapturedImage = (capturedImg: UploadedImageItem) => {
    setImages((prev) => [capturedImg, ...prev]);
    setUser((prev) => ({
      ...prev,
      storageUsedMb: Number((prev.storageUsedMb + 0.7).toFixed(1)),
    }));
  };

  // Links Handlers
  const handleAddLink = (newLink: LinkItem) => {
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  // Export Data JSON
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

  // Restore starter samples
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

  if (!cloudReady) {
    return (
      <div className="ownly-loading min-h-screen" role="status">
        <div className="text-center px-6">
          <div className="text-white font-bold mb-2">Connecting to your cloud workspace…</div>
          <div className="text-white/50 text-xs max-w-sm">Your workspace will appear after Firestore loads, so another device sees the same content.</div>
          {cloudError && <div className="mt-4 text-[#ff6a7e] text-xs max-w-md">{cloudError}</div>}
        </div>
      </div>
    );
  }

  const stats = {
    notesCount: notes.length,
    imagesCount: images.length,
    cameraCount: images.filter((i) => i.source === 'camera').length,
    linksCount: links.length,
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      {isAdminView ? (
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

          {/* Hidden Admin Trigger: Press 'Ctrl + Shift + A' to open admin panel */}
          <div 
            className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-50"
            onClick={() => setIsAdminView(true)}
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
            onLogout={() => {
              api.logout();
              setIsAuthenticated(false);
              setIsAccountDrawerOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
