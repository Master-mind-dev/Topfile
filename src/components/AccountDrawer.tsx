import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogOut, 
  Mail, 
  Calendar, 
  HardDrive, 
  FileText, 
  Image as ImageIcon, 
  Camera, 
  Link as LinkIcon, 
  Download, 
  Trash2,
  Sparkles,
  Pencil,
  UserRound
} from 'lucide-react';
import { UserProfile, TabType } from '../types';
import { OwnlyLogo } from './OwnlyLogo';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout: () => void;
  stats: {
    notesCount: number;
    imagesCount: number;
    cameraCount: number;
    linksCount: number;
  };
  onNavigateTab: (tab: TabType) => void;
  onExportData: () => void;
  onResetWorkspace: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  stats,
  onNavigateTab,
  onExportData,
  onResetWorkspace,
  onUpdateProfile,
}) => {
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [profileName, setProfileName] = React.useState(user.name);
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl || '');

  React.useEffect(() => {
    setProfileName(user.name);
    setAvatarUrl(user.avatarUrl || '');
  }, [user.name, user.avatarUrl]);

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileName.trim()) return;
    onUpdateProfile({ name: profileName.trim(), avatarUrl: avatarUrl.trim() || undefined });
    setIsEditingProfile(false);
  };

  const handleAvatarFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-md bg-zinc-950 border-l border-white/20 h-full flex flex-col justify-between overflow-y-auto text-white shadow-2xl p-6 sm:p-8"
            id="account-details-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-drawer-title"
          >
            {/* Top Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <OwnlyLogo size="sm" />
                  <span id="account-drawer-title" className="text-[10px] uppercase tracking-widest text-[#d9ad52] font-extrabold ml-1">Account</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                  id="btn-close-account-drawer"
                  aria-label="Close Account Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card */}
              <div className="mt-6 p-5 rounded-3xl bg-black/60 border border-white/20 relative overflow-hidden shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 p-0.5 shadow-lg flex-shrink-0">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">{user.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF2A3A]/20 text-[#FF2A3A] border border-[#FF2A3A]/40">
                        {user.plan}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-white/40 flex-shrink-0" />
                      {user.email}
                    </p>
                    <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3 h-3 text-white/40 flex-shrink-0" />
                      Member since {user.joinedDate}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingProfile((editing) => !editing)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/75 hover:text-white hover:border-[#ff304f]/60 transition-colors"
                  aria-expanded={isEditingProfile}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isEditingProfile ? 'Close profile editor' : 'Edit profile'}
                </button>

                {isEditingProfile && (
                  <form onSubmit={saveProfile} className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <label className="block text-[10px] uppercase tracking-wider text-white/50 font-bold">Display name</label>
                    <input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff304f]" required />
                    <label className="block text-[10px] uppercase tracking-wider text-white/50 font-bold">Profile image URL</label>
                    <input value={avatarUrl.startsWith('data:') ? '' : avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff304f]" />
                    <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2.5 text-xs font-bold text-white/65 hover:border-[#ff304f] hover:text-white cursor-pointer">
                      <UserRound className="w-3.5 h-3.5" /> Choose profile image
                      <input type="file" accept="image/*" onChange={handleAvatarFile} className="sr-only" />
                    </label>
                    <button type="submit" className="w-full rounded-xl bg-[#ff304f] py-2.5 text-xs font-bold text-white hover:bg-[#ff4f68]">Save profile</button>
                  </form>
                )}

                {/* Storage Meter */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-medium text-white/60 mb-1.5">
                    <span className="flex items-center gap-1 text-white/80">
                      <HardDrive className="w-3.5 h-3.5 text-[#FF2A3A]" />
                      Storage Allocation
                    </span>
                    <span className="text-white font-bold">{user.storageUsedMb} MB / {user.totalStorageMb} MB</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-[#FF2A3A] rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (user.storageUsedMb / user.totalStorageMb) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Workspace Statistics Summary */}
              <div className="mt-6">
                <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-white/40 mb-3 pl-1">
                  Workspace Summary
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => { onNavigateTab('notes'); onClose(); }}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FF2A3A] hover:bg-[#FF2A3A]/5 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <FileText className="w-4 h-4 text-white group-hover:text-[#FF2A3A] transition-colors" />
                      <span className="text-xs group-hover:text-[#FF2A3A] transition-colors">View →</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.notesCount}</p>
                    <p className="text-xs text-white/40 font-medium">Saved Notes</p>
                  </button>

                  <button
                    onClick={() => { onNavigateTab('upload'); onClose(); }}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-blue-500 hover:bg-blue-500/5 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <ImageIcon className="w-4 h-4 text-white group-hover:text-blue-400 transition-colors" />
                      <span className="text-xs group-hover:text-blue-400 transition-colors">View →</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.imagesCount}</p>
                    <p className="text-xs text-white/40 font-medium">Gallery Images</p>
                  </button>

                  <button
                    onClick={() => { onNavigateTab('scan'); onClose(); }}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <Camera className="w-4 h-4 text-white group-hover:text-emerald-400 transition-colors" />
                      <span className="text-xs group-hover:text-emerald-400 transition-colors">Open →</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.cameraCount}</p>
                    <p className="text-xs text-white/40 font-medium">Camera Snaps</p>
                  </button>

                  <button
                    onClick={() => { onNavigateTab('links'); onClose(); }}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500 hover:bg-purple-500/5 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <LinkIcon className="w-4 h-4 text-white group-hover:text-purple-400 transition-colors" />
                      <span className="text-xs group-hover:text-purple-400 transition-colors">View →</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.linksCount}</p>
                    <p className="text-xs text-white/40 font-medium">Saved Links</p>
                  </button>
                </div>
              </div>

              {/* Data Tools */}
              <div className="mt-6 space-y-2">
                <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-white/40 mb-2 pl-1">
                  Workspace Actions
                </h4>
                <button
                  onClick={onExportData}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
                  id="btn-export-data"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#FF2A3A]" />
                    Export Full Workspace (JSON)
                  </span>
                  <span className="text-[10px] text-white/40 font-bold uppercase">Backup</span>
                </button>

                <button
                  onClick={onResetWorkspace}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 text-xs font-semibold text-white/40 hover:text-white transition-all cursor-pointer"
                  id="btn-reset-demo"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-white/30" />
                    Restore Starter Samples
                  </span>
                  <span className="text-[10px] text-white/40 font-bold uppercase">Reset</span>
                </button>
              </div>
            </div>

            {/* Bottom: Logout Button */}
            <div className="pt-5 mt-6 border-t border-white/10">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-full bg-[#E2E4E8] hover:bg-[#FF2A3A] text-zinc-950 hover:text-white font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
                id="btn-logout-account"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out from OWNLY</span>
              </button>

              <p className="text-center text-[11px] text-white/40 mt-3 font-medium truncate">
                Signed in as {user.email}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
