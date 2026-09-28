import React from 'react';
import { OwnlyLogo } from './OwnlyLogo';
import { TabType, UserProfile } from '../types';
import { Home, FileText, Image as ImageIcon, Camera, Link as LinkIcon } from 'lucide-react';
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
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'upload', label: 'Uploads', icon: ImageIcon },
    { id: 'scan', label: 'Capture', icon: Camera },
    { id: 'links', label: 'Links', icon: LinkIcon },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-white/10"
      id="app-main-header"
      style={{ background: 'rgba(8,8,12,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">

        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none group"
          onClick={() => setActiveTab('home')}
        >
          <OwnlyLogo size="md" />
        </div>

        {/* Center: Desktop Navigation Pill */}
        <nav
          className="hidden md:flex items-center rounded-2xl px-1.5 py-1 shadow-2xl relative"
          id="center-pill-nav"
          style={{ background: 'rgba(10,10,16,0.85)', border: '1px solid rgba(255,255,255,0.13)' }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-3.5 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-bold tracking-tight rounded-xl flex items-center gap-2 cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'text-[#20140b]'
                    : 'text-white/65 hover:text-[#f4dfb0] hover:bg-[#d9ad52]/12'
                }`}
                id={`nav-pill-${item.id}`}
              >
                {/* Active background with motion */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-xl bg-[#d9ad52] shadow-md"
                    transition={{ type: 'spring', damping: 26, stiffness: 380 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-current'}`} />
                  <span>{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Account Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User avatar (if set) */}
          <button
            onClick={onOpenAccount}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/5 border border-white/15 text-white hover:bg-[#d9ad52]/18 hover:border-[#d9ad52]/40 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-md"
            id="btn-three-bar-menu"
            aria-label="Open Account and Workspace Menu"
            title="Account & Settings"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-4 flex flex-col justify-between items-center py-0.5">
                <span className="w-4 h-0.5 bg-white rounded-full" />
                <span className="w-4 h-0.5 bg-white rounded-full" />
                <span className="w-4 h-0.5 bg-white rounded-full" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden border-t border-white/8 flex items-center justify-around gap-0.5 px-2 pb-1.5 pt-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 min-w-0 py-1.5 px-1 rounded-xl text-center flex flex-col items-center gap-0.5 transition-all duration-200 relative ${
                isActive ? 'text-[#20140b]' : 'text-white/55 hover:text-[#f4dfb0]'
              }`}
              id={`mobile-nav-${item.id}`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-xl bg-[#d9ad52]"
                  transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-current'}`} />
                <span className="text-[9px] font-bold truncate">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
