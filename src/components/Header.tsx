import React from 'react';
import { OwnlyLogo } from './OwnlyLogo';
import { TabType } from '../types';
import { Menu, Home, FileText, Image as ImageIcon, Camera, Link as LinkIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAccountDrawer: () => void;
  notesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenAccountDrawer,
  notesCount,
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
      className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-md border-b border-white/20 px-4 sm:px-8 transition-all flex flex-col justify-center min-h-[56px] sm:min-h-[64px] md:min-h-[72px] lg:min-h-[80px]" 
      id="app-main-header"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4 relative py-1.5 sm:py-2">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onSelectTab('home')}>
          <OwnlyLogo size="md" />
        </div>

        {/* Center: High Density Crisp Floating Black Pill Header */}
        <nav 
          className="hidden md:flex items-center bg-black border border-white/20 rounded-xl px-1.5 py-1 shadow-2xl relative"
          id="center-pill-nav"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative px-3.5 lg:px-4.5 py-1.5 lg:py-2 text-xs lg:text-sm font-bold tracking-tight transition-all duration-200 rounded-lg flex items-center gap-2 cursor-pointer ${
                  isActive 
                    ? 'bg-[#E2E4E8] text-zinc-950 shadow-sm font-extrabold' 
                    : 'text-white/70 hover:text-white hover:bg-[#FF2A3A]'
                }`}
                id={`nav-pill-${item.id}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-current'}`} />
                <span>{item.label}</span>
                {item.id === 'notes' && notesCount > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                    isActive ? 'bg-black text-white' : 'bg-white/20 text-white'
                  }`}>
                    {notesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Touch Menu / Account Drawer */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAccountDrawer}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-[#FF2A3A] hover:border-[#FF2A3A] active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center group"
            id="btn-three-bar-menu"
            aria-label="Open Account and Workspace Menu"
            title="Account & Settings"
          >
            <div className="w-5 h-4 flex flex-col justify-between items-center py-0.5">
              <span className="w-4 h-0.5 bg-white rounded-full transition-colors" />
              <span className="w-4 h-0.5 bg-white rounded-full transition-colors" />
              <span className="w-4 h-0.5 bg-white rounded-full transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar for Small Screens */}
      <div className="md:hidden pt-1.5 pb-2 border-t border-white/10 flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-lg text-center flex flex-col items-center gap-0.5 transition-all duration-200 ${
                isActive ? 'bg-[#E2E4E8] text-zinc-950 font-bold' : 'text-white/60 font-medium hover:text-white hover:bg-[#FF2A3A]'
              }`}
              id={`mobile-nav-${item.id}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-current'}`} />
              <span className="text-[10px] truncate whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
