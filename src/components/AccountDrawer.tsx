import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogOut, 
  User, 
  Mail, 
  Calendar, 
  HardDrive, 
  FileText, 
  Image as ImageIcon, 
  Camera, 
  Link as LinkIcon, 
  Download, 
  Trash2,
  CheckCircle,
  ExternalLink
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
}) => {
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-md bg-black border-l border-white/20 h-full flex flex-col justify-between overflow-y-auto text-white shadow-2xl p-6 sm:p-8"
            id="account-details-drawer"
          >
            {/* Top Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <OwnlyLogo size="sm" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Account</span>
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
              <div className="mt-6 p-5 rounded-3xl bg-white/5 border border-white/20 relative overflow-hidden">
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
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

                {/* Storage Meter */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-medium text-white/60 mb-1.5">
                    <span className="flex items-center gap-1 text-white/80">
                      <HardDrive className="w-3.5 h-3.5 text-white" />
                      Storage Allocation
                    </span>
                    <span className="text-white font-bold">{user.storageUsedMb} MB / {user.totalStorageMb} MB</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (user.storageUsedMb / user.totalStorageMb) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Workspace Statistics Summary */}
              <div className="mt-6">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 pl-1">
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
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FF2A3A] hover:bg-[#FF2A3A]/5 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <ImageIcon className="w-4 h-4 text-white group-hover:text-[#FF2A3A] transition-colors" />
                      <span className="text-xs group-hover:text-[#FF2A3A] transition-colors">View →</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.imagesCount}</p>
                    <p className="text-xs text-white/40 font-medium">Gallery Images</p>
                  </button>

                  <button
                    onClick={() => { onNavigateTab('scan'); onClose(); }}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FF2A3A] hover:bg-[#FF2A3A]/5 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <Camera className="w-4 h-4 text-white group-hover:text-[#FF2A3A] transition-colors" />
                      <span className="text-xs group-hover:text-[#FF2A3A] transition-colors">Open →</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.cameraCount}</p>
                    <p className="text-xs text-white/40 font-medium">Camera Snaps</p>
                  </button>

                  <button
                    onClick={() => { onNavigateTab('links'); onClose(); }}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FF2A3A] hover:bg-[#FF2A3A]/5 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <LinkIcon className="w-4 h-4 text-white group-hover:text-[#FF2A3A] transition-colors" />
                      <span className="text-xs group-hover:text-[#FF2A3A] transition-colors">View →</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.linksCount}</p>
                    <p className="text-xs text-white/40 font-medium">Saved Links</p>
                  </button>
                </div>
              </div>

              {/* Data Tools */}
              <div className="mt-6 space-y-2">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2 pl-1">
                  Workspace Actions
                </h4>
                <button
                  onClick={onExportData}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
                  id="btn-export-data"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-white/40" />
                    Export Full Workspace (JSON)
                  </span>
                  <span className="text-[10px] text-white/40 font-semibold">Backup</span>
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
                  <span className="text-[10px] text-white/40 font-semibold">Reset</span>
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
                className="w-full py-3 px-4 rounded-full bg-[#E2E4E8] hover:bg-[#FF2A3A] text-zinc-950 hover:text-white font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
                id="btn-logout-account"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out from OWNLY</span>
              </button>

              <p className="text-center text-[11px] text-white/40 mt-3 font-medium">
                Signed in as {user.email}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
