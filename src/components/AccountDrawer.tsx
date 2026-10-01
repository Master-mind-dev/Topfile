import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogOut, 
  Mail, 
  Calendar, 
  HardDrive, 
  Pencil, 
  Check,
  Shield,
  Layers,
  Sparkles
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
    setUser((prev) => ({ ...prev, ...updates }));
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
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please use an image under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AR';

  const storageUsedMb = user.storageUsedMb || 0;
  const totalStorageMb = user.totalStorageMb || 5 * 1024;
  const storagePercent = Math.min(100, Math.round((storageUsedMb / totalStorageMb) * 100));
  const storageUsedDisplay = storageUsedMb >= 1024
    ? `${(storageUsedMb / 1024).toFixed(1)} GB`
    : `${storageUsedMb.toFixed(0)} MB`;
  const storageTotalDisplay = `${(totalStorageMb / 1024).toFixed(0)} GB`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end font-['Outfit']">
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Drawer Panel with Crimson Glow */}
          <motion.div
            key="drawer-content"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative z-10 w-full max-w-[390px] sm:max-w-md bg-[#12080a]/95 border-l border-white/15 h-full flex flex-col text-white shadow-2xl backdrop-blur-2xl"
            id="account-details-drawer"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <OwnlyLogo size="sm" />
                  <span className="text-[11px] uppercase tracking-widest text-[#1bd9ff] font-black ml-1">
                    WORKSPACE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="figma-glass-card p-5 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0 font-black text-lg text-white">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white truncate">{user.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">
                        PRO
                      </span>
                    </div>
                    <p className="text-xs text-white/50 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/60">Profile details</span>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs font-bold text-[#1bd9ff] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{isEditingProfile ? 'Cancel' : 'Edit profile'}</span>
                  </button>
                </div>

                {isEditingProfile && (
                  <form onSubmit={saveProfile} className="mt-4 space-y-3 pt-3 border-t border-white/10">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-white/40"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                        Avatar Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="w-full mt-1 text-xs text-white/60 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-white text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
                    >
                      {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      <span>{saveSuccess ? 'Saved successfully' : 'Save changes'}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Workspace Capacity & Storage */}
              <div className="figma-glass-card p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#1bd9ff]" />
                    <span>Cloud Storage</span>
                  </div>
                  <span className="text-white/60">{storageUsedDisplay} / {storageTotalDisplay}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1bd9ff] to-emerald-400 rounded-full transition-all"
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white/40">
                  <span>{storagePercent}% used</span>
                  <span>{storagePercent === 0 ? 'No files yet' : 'Unlimited bandwidth'}</span>
                </div>
              </div>

              {/* Quick Preferences */}
              <div className="figma-glass-card p-5 space-y-3 text-xs">
                <div className="font-bold text-white mb-2">Account Overview</div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/60">Member since</span>
                  <span className="font-semibold text-white">{user.joinedDate || 'October 2026'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/60">Sync state</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Real-time Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-white/60">Workspace version</span>
                  <span className="font-semibold text-white/80">v2.4.0 (Figma Studio)</span>
                </div>
              </div>
            </div>

            {/* Footer / Logout */}
            <div className="p-6 border-t border-white/10 bg-black/40">
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out of workspace</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};