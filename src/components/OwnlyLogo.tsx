import React from 'react';

interface OwnlyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const OwnlyLogo: React.FC<OwnlyLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-lg tracking-wider',
    md: 'text-2xl tracking-widest',
    lg: 'text-3xl tracking-widest font-black',
    xl: 'text-4xl sm:text-5xl tracking-widest font-black',
  };

  return (
    <div className={`inline-flex items-center select-none font-black ${sizeClasses[size]} ${className}`} id="ownly-logo-brand">
      <span className="text-[#FF2A3A] font-black uppercase drop-shadow-[0_0_15px_rgba(255,42,58,0.6)]">
        OWN
      </span>
      <span className="text-white font-black uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
        LY
      </span>
    </div>
  );
};
