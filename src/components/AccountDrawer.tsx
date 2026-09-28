import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogOut, 
  Mail, 
  Calendar, 
  HardDrive, 
  Download, 
  Trash2,
  Pencil,
  UserRound,
  Check,
  FileText,
  Image as ImageIcon,
  Camera,
  Link as LinkIcon
} from 'lucide-react';
import { UserProfile } from '../types';
import { OwnlyLogo } from './OwnlyLogo';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  user,
  setUser,
  onUpdateProfile,
  onLogout,
}) => {
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [profileName, setProfileName] = React.useState(user.name);
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl || '');
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    setProfileName(user.name);
    setAvatarUrl(user.avatarUrl || '');
  }, [user.name, user.avatarUrl]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileName.trim()) return;
    const updates: Partial<UserProfile> = {
      name: profileName.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    };
    // Update locally first for instant feedback
    setUser((prev) => ({ ...prev, ...updates }));
    // Persist to localStorage immediately
    const current = localStorage.getItem('ownly_user');
    try {
      const parsed = current ? JSON.parse(current) : {};
      localStorage.setItem('ownly_user', JSON.stringify({ ...parsed, ...updates }));
    } catch {}

    try { await onUpdateProfile(updates); } catch {}
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditingProfile(false);
    }, 1500);
  };

  const handleAvatarFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    // Allow up to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please use an image under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const avatarSrc = user.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const storagePercent = Math.min(100, (user.storageUsedMb / user.totalStorageMb) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer */}
          <motion.div
            key="drawer-content"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-[380px] sm:max-w-md bg-zinc-950 border-l border-white/15 h-full flex flex-col overflow-y-auto text-white shadow-2xl"
            id="account-details-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-drawer-title"
          >
            <div className="flex-1 overflow-y-auto p-5 sm:p-7">
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <OwnlyLogo size="sm" />
                  <span id="account-drawer-title" className="text-[10px] uppercase tracking-widest text-[#d9ad52] font-extrabold ml-1">
                    My Account
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                  id="btn-close-account-drawer"
                  aria-label="Close Account Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-5 rounded-3xl bg-black/60 border border-white/15 relative overflow-hidden shadow-xl mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {/* Avatar */}
                  <div className="relative w-16 h-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex-shrink-0 shadow-lg">
                    <img
                      src={avatarSrc}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white truncate">{user.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#d9ad52]/20 text-[#d9ad52] border border-[#d9ad52]/40 flex-shrink-0">
                        {user.plan}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-white/40 flex-shrink-0" />
                      {user.email}
                    </p>
                    <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3 h-3 text-white/40 flex-shrink-0" />
                      Member since {user.joinedDate}
                    </p>
                  </div>
                </div>

                {/* Edit Profile Toggle */}
                <button
                  type="button"
                  onClick={() => setIsEditingProfile((e) => !e)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/75 hover:text-white hover:border-[#d9ad52]/60 transition-all"
                  aria-expanded={isEditingProfile}
                  id="btn-toggle-edit-profile"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isEditingProfile ? 'Close Editor' : 'Edit Profile'}
                </button>

                {/* Edit Form */}
                <AnimatePresence>
                  {isEditingProfile && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      onSubmit={saveProfile}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/50 font-bold mb-1.5">Display Name</label>
                          <input
                            value={profileName}
                            onChange={(event) => setProfileName(event.target.value)}
                            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d9ad52] transition-colors"
                            required
                            id="input-profile-name"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/50 font-bold mb-1.5">Avatar URL (optional)</label>
                          <input
                            value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                            onChange={(event) => setAvatarUrl(event.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d9ad52] transition-colors"
                          />
                        </div>
                        <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-xs font-bold text-white/65 hover:border-[#d9ad52] hover:text-white cursor-pointer transition-all">
                          <UserRound className="w-3.5 h-3.5" />
                          Upload Profile Photo
                          <input type="file" accept="image/*" onChange={handleAvatarFile} className="sr-only" />
                        </label>
                        {avatarUrl.startsWith('data:') && (
                          <div className="text-[10px] text-[#34d399] flex items-center gap-1.5">
                            <Check className="w-3 h-3" />
                            New photo selected (will save with profile)
                          </div>
                        )}
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-[#d9ad52] py-2.5 text-xs font-bold text-[#20140b] hover:bg-[#f4dfb0] transition-all flex items-center justify-center gap-2"
                          id="btn-save-profile"
                        >
                          {saveSuccess ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Profile'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Storage Meter */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-medium text-white/60 mb-1.5">
                    <span className="flex items-center gap-1 text-white/80">
                      <HardDrive className="w-3.5 h-3.5 text-[#d9ad52]" />
                      Storage
                    </span>
                    <span className="text-white font-bold">
                      {user.storageUsedMb} MB / {user.totalStorageMb} MB
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#d9ad52] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${storagePercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">{storagePercent.toFixed(1)}% used</div>
                </div>
              </div>

              {/* Workspace Utility */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="text-[10px] tracking-widest text-zinc-500 uppercase font-bold mb-3">
                  Workspace Utility
                </div>
                <button
                  type="button"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold flex items-center gap-3 hover:bg-white/10 transition-all opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Download className="w-4 h-4" />
                  Export Workspace Data
                </button>
                <button
                  type="button"
                  className="w-full p-3 rounded-xl bg-[#d9ad52]/10 border border-[#d9ad52]/20 text-[#d9ad52] text-xs font-semibold flex items-center gap-3 hover:bg-[#d9ad52]/20 transition-all opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Workspace
                </button>
              </div>
            </div>

            {/* Logout Footer */}
            <div className="p-5 sm:p-7 border-t border-white/10 bg-zinc-950">
              <button
                type="button"
                onClick={() => { onLogout(); onClose(); }}
                className="w-full py-3.5 px-4 rounded-full bg-[#d9ad52] text-[#20140b] hover:bg-[#f4dfb0] font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
                id="btn-logout-account"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out from OWNLY</span>
              </button>
              <p className="text-center text-[11px] text-white/30 mt-3 font-medium truncate">
                Signed in as {user.email}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};