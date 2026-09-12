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
import { auth, db, onAuthStateChanged, signOut, doc, setDoc, getDoc, updateProfile } from './lib/firebase';
const AccountDrawer = lazy(() => import('./components/AccountDrawer').then((module) => ({ default: module.AccountDrawer })));
const LoginPage = lazy(() => import('./components/LoginPage').then((module) => ({ default: module.LoginPage })));
const WorkspaceAssistant = lazy(() => import('./components/WorkspaceAssistant').then((module) => ({ default: module.WorkspaceAssistant })));

const HomeSection = lazy(() => import('./components/HomeSection').then((module) => ({ default: module.HomeSection })));
const NotesSection = lazy(() => import('./components/NotesSection').then((module) => ({ default: module.NotesSection })));
const UploadSection = lazy(() => import('./components/UploadSection').then((module) => ({ default: module.UploadSection })));
const CameraSection = lazy(() => import('./components/CameraSection').then((module) => ({ default: module.CameraSection })));
const LinkSection = lazy(() => import('./components/LinkSection').then((module) => ({ default: module.LinkSection })));

export default function App() {
  // Persistence state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('ownly_auth_v2');
    return saved ? JSON.parse(saved) : false;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ownly_user');
    return saved ? JSON.parse(saved) : initialUserProfile;
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsAuthenticated(true);
        setUser((prev) => ({
          ...prev,
          email: fbUser.email || prev.email,
          name: fbUser.displayName || prev.name || fbUser.email?.split('@')[0] || 'Mohammed Dastagir',
        }));

        // Try load user data from Firestore
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.notes) setNotes(data.notes);
            if (data.images) setImages(data.images);
            if (data.links) setLinks(data.links);
            if (data.profile) setUser((p) => ({ ...p, ...data.profile }));
          }
        } catch (e) {
          console.warn('Firestore load:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to Firestore when authenticated
  useEffect(() => {
    const fbUser = auth.currentUser;
    if (fbUser && isAuthenticated) {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const syncTimer = window.setTimeout(() => setDoc(userDocRef, {
        notes,
        images,
        links,
        profile: user,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn('Firestore sync note:', err);
      }), 600);
      return () => window.clearTimeout(syncTimer);
    }
  }, [notes, images, links, user, isAuthenticated]);

  // Sync to local storage for instant offline resilience
  useEffect(() => {
    localStorage.setItem('ownly_auth_v2', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

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

  const stats = {
    notesCount: notes.length,
    imagesCount: images.length,
    cameraCount: images.filter((i) => i.source === 'camera').length,
    linksCount: links.length,
  };

  return (
    <div className="ownly-workspace min-h-screen text-white font-sans flex flex-col selection:bg-[#ff304f] selection:text-white relative overflow-hidden" id="ownly-app-root">

      {/* Top Header */}
      <div className="relative z-10 flex flex-col min-h-screen">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAccountDrawer={() => setIsAccountDrawerOpen(true)}
        notesCount={notes.length}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 z-10">
        <Suspense fallback={<div className="ownly-loading" role="status">Loading workspace…</div>}>
          <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeSection
              key="home"
              notes={notes}
              images={images}
              links={links}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenCreateNote={() => setActiveTab('notes')}
              onOpenUpload={() => setActiveTab('upload')}
              onOpenCamera={() => setActiveTab('scan')}
              onOpenAddLink={() => setActiveTab('links')}
              onSelectNote={(note) => {
                setSelectedNoteToEdit(note);
                setActiveTab('notes');
              }}
            />
          )}

          {activeTab === 'notes' && (
            <NotesSection
              key="notes"
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              selectedNoteToEdit={selectedNoteToEdit}
              onClearSelectedNote={() => setSelectedNoteToEdit(null)}
            />
          )}

          {activeTab === 'upload' && (
            <UploadSection
              key="upload"
              images={images}
              onUploadImages={handleUploadImages}
              onDeleteImage={handleDeleteImage}
              onOpenCamera={() => setActiveTab('scan')}
            />
          )}

          {activeTab === 'scan' && (
            <CameraSection
              key="scan"
              onSaveCapturedImage={handleSaveCapturedImage}
              onViewGallery={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'links' && (
            <LinkSection
              key="links"
              links={links}
              onAddLink={handleAddLink}
              onDeleteLink={handleDeleteLink}
            />
          )}
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Account Details & Logout Drawer */}
      <Suspense fallback={null}>
        <AccountDrawer
          isOpen={isAccountDrawerOpen}
          onClose={() => setIsAccountDrawerOpen(false)}
          user={user}
          onLogout={handleLogout}
          stats={stats}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setIsAccountDrawerOpen(false);
          }}
          onExportData={handleExportData}
          onResetWorkspace={handleResetWorkspace}
          onUpdateProfile={handleUpdateProfile}
        />
        <WorkspaceAssistant notes={notes} images={images} links={links} activeTab={activeTab} />
      </Suspense>
      </div>
    </div>
  );
}
