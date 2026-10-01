import React from 'react';

interface OwnlyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const OwnlyLogo: React.FC<OwnlyLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-lg font-black tracking-tight',
    md: 'text-2xl font-black tracking-tight',
    lg: 'text-3xl font-black tracking-tight',
    xl: 'text-4xl sm:text-5xl font-black tracking-tight',
  };

  return (
    <div className={`inline-flex items-center select-none font-black ${sizeClasses[size]} ${className}`} id="ownly-logo-brand">
      <span className="text-white font-black tracking-tight drop-shadow-sm font-['Outfit']">
        OWNLY
      </span>
    </div>
  );
};
