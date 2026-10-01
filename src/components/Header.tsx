import React from 'react';
import { OwnlyLogo } from './OwnlyLogo';
import { TabType, UserProfile } from '../types';
import { LayoutDashboard, FileText, UploadCloud, Camera, Link as LinkIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  user: UserProfile;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAccount,
}) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'upload', label: 'Uploads', icon: UploadCloud },
    { id: 'scan', label: 'Capture', icon: Camera },
    { id: 'links', label: 'Links', icon: LinkIcon },
  ];

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AR';

  return (
    <>
      {/* ── Desktop Navigation Bar (Exact Figma Frame 4 & Desktop Screens) ── */}
      <header
        className="hidden md:block sticky top-0 z-40 w-full border-b border-white/[0.08]"
        id="app-desktop-header"
        style={{
          background: 'rgba(20, 10, 13, 0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-[1280px] mx-auto w-full h-[78px] flex items-center justify-between px-8">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('home')}
          >
            <OwnlyLogo size="md" />
          </div>

          {/* Desktop Nav Pill */}
          <nav
            className="flex items-center p-1.5 rounded-2xl relative"
            id="center-pill-nav"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 py-2 text-[14px] font-bold tracking-tight rounded-xl flex items-center gap-2 cursor-pointer transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  id={`nav-pill-${item.id}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-xl bg-[#191315] border border-white/20 shadow-md"
                      transition={{ type: 'spring', damping: 28, stiffness: 420 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Account Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAccount}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-xs font-black tracking-wider transition-all duration-150 cursor-pointer shadow-sm hover:scale-105"
              title="Account profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </button>

            <button
              onClick={onOpenAccount}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 text-white transition-all cursor-pointer flex flex-col justify-center gap-1 w-9 h-9 items-center"
              aria-label="Menu"
            >
              <span className="w-4 h-0.5 bg-white/80 rounded-full" />
              <span className="w-4 h-0.5 bg-white/80 rounded-full" />
              <span className="w-4 h-0.5 bg-white/80 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Header (Exact Figma Mobile Header: 390x64) ── */}
      <header
        className="md:hidden sticky top-0 z-40 w-full border-b border-white/[0.08] px-5 py-3 flex items-center justify-between"
        id="app-mobile-header"
        style={{
          background: 'rgba(15, 8, 11, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="cursor-pointer" onClick={() => setActiveTab('home')}>
          <OwnlyLogo size="sm" />
        </div>

        <div className="text-center">
          <h2 className="text-sm font-black capitalize text-white leading-tight">
            {activeTab === 'home' ? 'Dashboard' : activeTab === 'scan' ? 'Capture' : activeTab}
          </h2>
          <p className="text-[10px] text-white/40 font-medium">OWNLY Workspace</p>
        </div>

        <button
          onClick={onOpenAccount}
          className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[10px] font-black cursor-pointer"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </button>
      </header>

      {/* ── Mobile Bottom Navigation Bar (Exact Figma Bottom Nav: 390x70) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.1] flex items-center justify-around px-2 py-2"
        id="app-mobile-bottom-nav"
        style={{
          background: 'rgba(12, 7, 9, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg mb-0.5 transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/40'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
